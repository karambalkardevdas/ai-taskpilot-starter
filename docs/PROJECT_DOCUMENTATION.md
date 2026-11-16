# AI TaskPilot - Project Documentation

## 1. Overview

AI TaskPilot is a full-stack task management app with a (mock) AI assistant that suggests subtasks for a goal.

- Users can create tasks, list tasks, filter by status and ask the AI assistant for suggested subtasks.
- Region used for all AWS resources: **ap-south-1 (Mumbai)**.

**Live frontend:** https://main.d3dmua49iexw93.amplifyapp.com/

## 2. Architecture

```
User Browser
    |  HTTPS
    v
AWS Amplify Hosting (React + Vite)  <--- GitHub (main branch, auto build)
    |  HTTPS  (VITE_API_BASE_URL)
    v
Amazon API Gateway (HTTP API)       -> gives the HTTPS endpoint
    |  HTTP :80
    v
Application Load Balancer           -> stable DNS name, health check /health
    |  HTTP :8000
    v
Amazon ECS (Fargate) - FastAPI container
    |        |                \
    |        |                 +--> Amazon CloudWatch Logs (/ecs/ai-taskpilot-backend)
    |        +--> Amazon ECR (container image ai-task-backend)
    |  PostgreSQL :5432 (private IP)
    v
Amazon EC2 (t3.micro, "AI-Task-DB") running PostgreSQL
```

## 3. Services used and why

| # | Service | Used for | Resource in this project |
|---|---------|----------|--------------------------|
| 1 | GitHub | Source code, version control | repo `ai-taskpilot-starter` |
| 2 | GitHub Actions | Backend CI (runs pytest on push) | `.github/workflows/backend-ci.yml` |
| 3 | AWS Amplify Hosting | Builds and hosts the React frontend over HTTPS | app `ai-taskpilot-starter` (`d3dmua49iexw93`), branch `main` |
| 4 | Amazon ECR | Stores the backend Docker image | repository `ai-task-backend` |
| 5 | Amazon ECS on Fargate | Runs the FastAPI backend container without managing servers | cluster `AI-TASK-CLUSTER`, service `ai-taskpilot-backend-service-iz11ctg8` |
| 6 | Application Load Balancer | Stable entry point to the backend, health checks | `ai-taskpilot-alb`, target group `ai-taskpilot-tg` (port 8000, `/health`) |
| 7 | Amazon API Gateway (HTTP API) | Provides an HTTPS URL for the API so the HTTPS frontend can call it (avoids mixed-content blocking) | API `ai-taskpilot-api` (`x77b3v2prl`) |
| 8 | Amazon EC2 | Hosts the PostgreSQL database | instance `AI-Task-DB` (t3.micro) |
| 9 | Amazon VPC + Security Groups | Network isolation and traffic rules | default VPC `vpc-00abf58e1bf0574ab`, SGs for ALB and ECS |
| 10 | AWS IAM | Permissions for ECS task and execution roles | `AI-TaskPilot-ECS-Task-Role`, `AI-TaskPilot-ECS-Execution-Role` |
| 11 | Amazon CloudWatch Logs | Backend container logs | `/ecs/ai-taskpilot-backend` |
| 12 | Docker | Packages the backend as an image | `backend/Dockerfile` |

Note: CloudFront was attempted but AWS blocked it (account verification required), so API Gateway is used for HTTPS instead.

## 4. Technology stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL 16 (on EC2)
- **AI:** mock provider (returns 3 template subtasks)

## 5. Request flow

1. User opens the Amplify URL and the React app loads.
2. The app calls `VITE_API_BASE_URL` (API Gateway HTTPS URL), e.g. `POST /api/tasks`.
3. API Gateway forwards the request to the ALB.
4. The ALB sends it to the healthy ECS task on port 8000.
5. FastAPI reads or writes PostgreSQL on EC2 and returns JSON.
6. CORS allows the Amplify origin (`CORS_ORIGINS` environment variable on the ECS task).

## 6. Backend API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness check |
| GET | `/health/ready` | Database readiness |
| GET | `/api/tasks` | List tasks (newest first) |
| POST | `/api/tasks` | Create a task |
| POST | `/api/ai/suggest?title=...` | Mock AI subtask suggestions |

## 7. Configuration

**ECS task environment variables:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CORS_ORIGINS`

**Amplify environment variables:** `VITE_API_BASE_URL`, `AMPLIFY_MONOREPO_APP_ROOT=frontend`, `AMPLIFY_DIFF_DEPLOY=false`

**Build:** [amplify.yml](../amplify.yml) runs `npm ci` and `npm run build`, output folder `dist`.

## 8. Deployment process

- **Frontend:** push to `main` and Amplify builds and deploys automatically.
- **Backend:** build image, push to ECR, then force a new deployment of the ECS service (manual for now).

## 9. Cost notes

| Service | Cost |
|---------|------|
| Amplify, ECS Fargate (small), API Gateway, ECR, CloudWatch | Mostly within free tier or very low cost for a demo |
| Application Load Balancer | About USD 16-20 per month while running (not free) |
| EC2 t3.micro | Free tier for the first 12 months, otherwise billed hourly |

To stop charges after the presentation, delete the ALB, API Gateway, ECS service and stop the EC2 instance.

## 10. Security status and next steps

- Rotate the AWS access key and the database password that were shared in chat.
- Move DB credentials from plain environment variables to Secrets Manager.
- Restrict the ECS security group to port 8000 from the ALB only (it currently allows all TCP).
- Add authentication and per-user task ownership.
- Add a backend deploy pipeline (GitHub Actions, ECR, ECS).
- Add CloudWatch alarms and database backups.
- Implement the task status update (currently a placeholder in the UI) and a real AI provider.
