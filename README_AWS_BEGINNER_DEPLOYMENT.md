# AI TaskPilot AWS Deployment (Beginner, From Scratch)

This guide helps you deploy this project end-to-end:

- Frontend: React + Vite on AWS Amplify
- Backend: FastAPI container on Amazon ECS (Fargate)
- Container registry: Amazon ECR
- Database: PostgreSQL on Amazon EC2
- Source + CI/CD: GitHub + GitHub Actions

## Purpose and use (simple)

AI TaskPilot is a learning project.

Its purpose is to help beginners understand how a real full-stack app is built and deployed.
You can use it to:

- Manage simple tasks (create and view)
- Learn API + database integration
- Learn container deployment on AWS
- Practice CI/CD with GitHub Actions

---

## 0) Before you start

## Required tools

- AWS account with billing enabled
- GitHub account
- Docker Desktop
- Node.js 20+
- AWS CLI v2

Check tools:

```powershell
aws --version
docker --version
node --version
git --version
```

## Cost warning

This setup is **not free** if left running (ECS + ALB + EC2 + EBS + data transfer).
Use small instance sizes for learning and delete resources when done.

---

## 1) Confirm project works locally

From project root:

```powershell
docker compose up --build -d
```

Check:

- API health: http://127.0.0.1:8000/health
- API docs: http://127.0.0.1:8000/docs

Run frontend:

```powershell
cd frontend
npm install
npm run dev
```

If local works, continue.

---

## 2) Push code to GitHub (already done in your case)

Repo: https://github.com/karambalkardevdas/ai-taskpilot-starter

Make sure latest code is pushed before AWS deployment.

---

## 3) Set AWS shell variables

Pick your region (example: `ap-south-1`):

```powershell
$env:AWS_REGION="ap-south-1"
$env:ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
$env:ECR_REPO="ai-taskpilot-backend"
$env:CLUSTER_NAME="ai-taskpilot-cluster"
$env:SERVICE_NAME="ai-taskpilot-backend-service"
$env:TASK_FAMILY="ai-taskpilot-backend-task"
```

---

## 4) Create ECR repository

```powershell
aws ecr create-repository --repository-name $env:ECR_REPO --region $env:AWS_REGION
```

Login and push first image manually:

```powershell
aws ecr get-login-password --region $env:AWS_REGION | docker login --username AWS --password-stdin "$env:ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com"
docker build -t "$env:ECR_REPO" ./backend
docker tag "$env:ECR_REPO:latest" "$env:ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com/$env:ECR_REPO:latest"
docker push "$env:ACCOUNT_ID.dkr.ecr.$env:AWS_REGION.amazonaws.com/$env:ECR_REPO:latest"
```

---

## 5) Create security groups (important)

Create 3 SGs in same VPC:

1. `sg-alb` (for load balancer)
   - Inbound: 80 from `0.0.0.0/0`
   - Inbound: 443 from `0.0.0.0/0`

2. `sg-ecs` (for ECS tasks)
   - Inbound: 8000 from `sg-alb`

3. `sg-postgres` (for EC2 PostgreSQL)
   - Inbound: 5432 from `sg-ecs`
   - Inbound: 22 from your IP (only for setup/admin)

---

## 6) Launch EC2 for PostgreSQL

Use EC2 console:

- AMI: Amazon Linux 2023
- Instance type: `t3.micro` (learning)
- Security group: `sg-postgres`
- Storage: 20 GB gp3
- Place in same VPC as ECS

SSH into EC2 and run PostgreSQL in Docker:

```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
newgrp docker

docker volume create pgdata
docker run -d --name taskpilot-postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=taskpilot \
  -e POSTGRES_USER=taskpilot \
  -e POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

Find private IP of EC2 (example: `10.0.2.45`).

Database URL format:

```text
postgresql+psycopg://taskpilot:CHANGE_ME_STRONG_PASSWORD@10.0.2.45:5432/taskpilot
```

---

## 7) Store secrets in AWS Secrets Manager

Create two secrets:

1. `taskpilot/prod/database_url`
   - value = DB URL from above

2. `taskpilot/prod/cors_origins`
   - value = your Amplify domain + local dev domains, comma-separated
   - example:
     `https://main.xxxxxx.amplifyapp.com,http://127.0.0.1:5173,http://127.0.0.1:5175`

---

## 8) Create ECS cluster + task execution role

- ECS Console -> Clusters -> Create cluster
- Name: `ai-taskpilot-cluster`
- Launch type: Fargate

Task role/execution role:

- Use `ecsTaskExecutionRole` (or create one with ECR pull + logs permissions)
- For app secrets access, task role needs `secretsmanager:GetSecretValue`

---

## 9) Create CloudWatch log group

Create log group in CloudWatch:

- `/ecs/ai-taskpilot-backend`

---

## 10) Create ECS task definition

Task definition values:

- Launch type compatibility: Fargate
- CPU/Memory: 0.5 vCPU / 1 GB (learning)
- Container port: 8000
- Image:
  `$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ai-taskpilot-backend:latest`

Environment / secrets:

- Secret `DATABASE_URL` -> `taskpilot/prod/database_url`
- Secret `CORS_ORIGINS` -> `taskpilot/prod/cors_origins`

Health check command (container):

```text
CMD-SHELL,curl -f http://localhost:8000/health || exit 1
```

Logging:

- awslogs group: `/ecs/ai-taskpilot-backend`

---

## 11) Create Application Load Balancer

- Type: internet-facing ALB
- Attach `sg-alb`
- Target group protocol: HTTP, port 8000
- Health check path: `/health`

Create ECS service:

- Cluster: `ai-taskpilot-cluster`
- Service name: `ai-taskpilot-backend-service`
- Launch type: Fargate
- Desired count: 1
- Network: private subnets preferred
- Security group: `sg-ecs`
- Attach to ALB target group

After service is stable, open:

- `http://<ALB-DNS>/health`

You should get `{"status":"ok"...}`.

---

## 12) Enable HTTPS for backend (required for Amplify frontend)

Because Amplify serves over HTTPS, your API should also be HTTPS (to avoid mixed-content blocks).

- Request ACM certificate (in same region as ALB)
- Validate domain (Route 53 recommended)
- Add ALB listener on 443 with ACM cert
- Redirect listener 80 -> 443
- Use API URL: `https://api.yourdomain.com`

---

## 13) Deploy frontend with Amplify

Amplify Console:

1. New app -> Host web app -> Connect GitHub repo
2. Select repo `karambalkardevdas/ai-taskpilot-starter`
3. Root directory: `frontend`
4. Branch: `main`
5. Environment variable:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
6. Deploy

Open Amplify URL and test create/list tasks.

---

## 14) Add backend CI/CD with GitHub Actions (recommended)

Goal on every push to `main`:

- Build backend image
- Push image to ECR
- Trigger ECS service deployment

You can create workflow file at:

- .github/workflows/deploy-backend.yml

Use OIDC (recommended) instead of long-lived AWS keys.

Required GitHub secrets/variables:

- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `ECR_REPOSITORY` = `ai-taskpilot-backend`
- `ECS_CLUSTER` = `ai-taskpilot-cluster`
- `ECS_SERVICE` = `ai-taskpilot-backend-service`
- `AWS_ROLE_TO_ASSUME` = IAM role ARN trusted for GitHub OIDC

---

## 15) Quick troubleshooting

1. Frontend shows `Failed to fetch`
   - Check browser devtools network
   - Confirm `VITE_API_BASE_URL` is HTTPS and correct domain
   - Confirm backend CORS contains Amplify domain

2. ECS task keeps restarting
   - Check CloudWatch logs `/ecs/ai-taskpilot-backend`
   - Validate `DATABASE_URL`
   - Ensure EC2 Postgres SG allows 5432 from `sg-ecs`

3. ALB health check unhealthy
   - Ensure container listening on `8000`
   - Ensure target group health path is `/health`

4. DB connection timeout
   - Check EC2 private IP
   - Check route/subnet and SG rules

---

## 16) Clean up to avoid charges

Delete in this order:

1. Amplify app
2. ECS service
3. ECS cluster
4. ALB + target groups
5. EC2 instance + EBS volume (if not auto-delete)
6. ECR repository/images
7. Secrets Manager secrets
8. CloudWatch log groups (optional)

---

## Project file references

- Docker compose: [compose.yaml](compose.yaml)
- Backend API: [backend/app/main.py](backend/app/main.py)
- Backend Docker image: [backend/Dockerfile](backend/Dockerfile)
- Frontend API base config: [frontend/src/App.tsx](frontend/src/App.tsx)
- Existing CI workflow: [.github/workflows/backend-ci.yml](.github/workflows/backend-ci.yml)

---

If you want, next step I can generate a ready-to-use `deploy-backend.yml` workflow for your exact AWS names so pushes to `main` auto-deploy ECS.