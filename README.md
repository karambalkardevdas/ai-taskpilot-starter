# AI TaskPilot

A beginner-friendly portfolio project using FastAPI, PostgreSQL, Docker Compose, React + Vite, GitHub Actions, and later AWS ECS/ECR + Amplify.

## Purpose (simple)

This project helps you learn how to build and deploy a full-stack app.
You can use it as a practical template for:

- Creating and tracking tasks
- Connecting a frontend to a backend API
- Storing data in PostgreSQL
- Running locally with Docker
- Deploying on AWS with modern DevOps flow

## Who should use this

- Students building cloud or DevOps projects
- Beginners learning FastAPI + React
- Developers who want a starter for ECS/ECR/Amplify deployment

## Phase 1: Run locally

Requirements:
- Python 3.12+ (optional for local-only Python runs; Docker is used below)
- Docker Desktop
- Git
- Node.js 20+ (for the frontend)

### 1. Start backend + PostgreSQL

In a terminal opened at the project root:

```powershell
docker compose up --build -d
docker compose ps
```

Open:
- API health: http://localhost:8000/health
- Database readiness: http://localhost:8000/health/ready
- Interactive API docs: http://localhost:8000/docs

In `/docs`, try `POST /api/tasks`, `GET /api/tasks`, and `POST /api/ai/suggest`.

### 2. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The frontend uses the local API URL from `VITE_API_BASE_URL` (default `http://localhost:8000`).

### 3. Run backend tests

```powershell
docker compose exec backend python -m pytest tests/ -v
```

### 4. Stop local services

```powershell
docker compose down
```

This preserves the PostgreSQL volume. To intentionally delete the local database data too:

```powershell
docker compose down -v
```

## GitHub

Create an empty private GitHub repository named `ai-taskpilot`, then:

```powershell
git init
git add .
git commit -m "Build TaskPilot starter project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-taskpilot.git
git push -u origin main
```

Replace `YOUR_USERNAME`. GitHub Actions runs backend tests on pushes and pull requests that change backend files.

## AWS deployment comes later

This starter is local-first. It does not create AWS resources or deploy to AWS. Before deploying, review current account eligibility, credits, and service pricing. A 24/7 ECS + EC2 + PostgreSQL setup is not guaranteed to be free.

Planned deployment:
- Frontend: AWS Amplify Hosting
- Backend container: Amazon ECR + Amazon ECS
- Database: PostgreSQL on EC2 with persistent storage and restricted security groups
- CI/CD: GitHub Actions using AWS OIDC (no long-lived AWS keys)
- HTTPS: Amplify-managed frontend certificate and a secured API endpoint

## Security notes

- The Compose password is for local development only. Never reuse it in AWS.
- Do not commit `.env` files or secrets.
- PostgreSQL is not published to a host port.
- The backend port is bound to `127.0.0.1` for local development.
- Authentication and per-user task ownership are not implemented yet. Do not expose this starter publicly until these and other production safeguards are added.
- The AI endpoint uses a mock provider and does not call Bedrock or OpenAI.
