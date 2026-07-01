# ContestHub

ContestHub is a MERN web application for running online coding and MCQ contests with role-based access for admins and students.

## Features

- Student/admin authentication with JWT
- Admin contest creation with scheduled start/end times
- Manual question upload for MCQ and coding questions
- Optional AI-assisted question generation hook
- Student contest listing, timed attempts, submission, result view
- Leaderboard and admin score dashboard

## Project Structure

```text
backend/   Express, MongoDB, JWT APIs
frontend/  React + Vite student/admin UI
```

## Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update `backend/.env` with your MongoDB connection string and JWT secret.

If you do not already have MongoDB running locally, start it with Docker:

```bash
docker compose up -d
```

4. Run the app:

```bash
npm run dev
```

Backend runs on `http://localhost:5001` and frontend runs on `http://localhost:5173`.

## AI Question Generation

Set `OPENAI_API_KEY` in `backend/.env`. The current API route is designed as a safe integration point; if no key is configured, it returns sample generated questions so the app remains usable locally.

## Coding Question Runner

Coding questions can run in local development mode or through a Piston-compatible runner.

For local development, add this to `backend/.env`:

```bash
CODE_RUNNER_MODE=local
```

This uses the local `python`, `g++`, `javac`, and `java` commands with timeouts.

For an external runner, use:

```bash
CODE_RUNNER_MODE=piston
PISTON_API_URL=https://emkc.org/api/v2/piston
```

For production contests, use a self-hosted runner or a managed judge service so untrusted code never runs inside the main API process.
