# projet_annuel_myges

## Stack

- **Frontend** — Next.js
- **Backend** — Express.js
- **Database** — PostgreSQL
- **Reverse proxy** — Nginx
- **Containerization** — Docker Compose

## Project structure

```
├── domain/                         # Domain layer (entities, business rules)
├── application/                    # Application layer (use cases)
├── infrastructure/
│   ├── backend/express/            # Express.js server
│   └── frontend/next/              # Next.js app
├── docker/
│   ├── backend/Dockerfile          # Multi-stage build (dev / builder / prod)
│   ├── frontend/Dockerfile         # Multi-stage build (dev / builder / prod)
│   └── nginx/nginx.conf            # Reverse proxy config
├── docker-compose.yml              # Development environment
└── docker-compose.prod.yml         # Production environment
```

## Getting started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose v2

### Without Docker (local dev)

```bash
# Install dependencies
npm install

# Start backend
npm run dev:express

# Start frontend
npm run dev:next
```

### With Docker (recommended)

```bash
# Copy and fill in environment variables
cp .env.example .env

# Start dev environment (hot-reload)
docker compose up

# Services available at:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:3001
#   postgres  → localhost:5432
```

### Adding a dependency

The project mounts the root directory into containers (`.:/app`), but `node_modules` lives in a **named Docker volume** (`node_modules_backend`, `node_modules_frontend`). That volume takes precedence over the host's `node_modules` — the two are fully independent.

Running `npm install <pkg>` on the host updates `package.json` and `package-lock.json`, but the running container never sees it.

#### Correct workflow

```bash
# 1. Install locally to update package.json + package-lock.json
npm install <pkg> --workspace=@myges/express   # or @myges/next for the frontend

# 2. Install inside the running container to update its named volume
docker compose exec backend npm install   # or frontend
```

**Step 1** only updates `package.json` and `package-lock.json` on the host — these are tracked by git, so every team member gets the dependency when they pull.

**Step 2** installs the package inside the running container, writing into the named volume.
The volume persists across restarts (`docker compose down` / `up`), so the dependency stays available without reinstalling. Hot-reload picks up the change automatically.

> **Only doing step 1 :** `package.json` is up to date but the container doesn't have the package, your code will crash on import.
>
> **Only doing step 2 :** the package works in your container but `package.json` is not updated — the next person to clone the repo won't have it.

> **Why not 'docker compose up --build' ?**
> Rebuilding the image does re-run `npm ci` in the Dockerfile, but the existing named volume mounts over the image's `node_modules` at startup, so the rebuild has no effect as long as the volume exists.

## Production

```bash
# Build and start production containers
APP_VERSION=1.0.0 docker compose -f docker-compose.prod.yml up -d

# Services available at:
#   App (via nginx) → http://localhost:80
#     /api/*        → proxied to backend
#     /*            → proxied to frontend
```

### Image versioning

Production images are tagged using the `APP_VERSION` variable:

```bash
APP_VERSION=1.2.0 docker compose -f docker-compose.prod.yml up -d  # deploy
APP_VERSION=1.1.0 docker compose -f docker-compose.prod.yml up -d  # rollback
```

## Environment variables

Copy `.env.example` to `.env` and adjust values:

| Variable          | Default      | Description                                 |
|-------------------|--------------|---------------------------------------------|
| `APP_VERSION`     | `latest`     | Docker image tag used in prod               |
| `POSTGRES_DB`     | `mygesdb`    | PostgreSQL database name                    |
| `POSTGRES_USER`   | `mygesuser`  | PostgreSQL user                             |
| `POSTGRES_PASSWORD` | —          | PostgreSQL password (required)              |
| `POSTGRES_PORT`   | `5432`       | PostgreSQL port                             |
| `HTTP_PORT`       | `80`         | Port exposed by nginx (prod only)           |
| `BACKEND_PORT`    | `3001`       | Backend port (dev only)                     |
| `FRONTEND_PORT`   | `3000`       | Frontend port (dev only)                    |
