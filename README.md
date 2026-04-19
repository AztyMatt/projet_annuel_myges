# projet_annuel_myges

## Stack

- **Frontend** — Next.js
- **Backend** — Express.js
- **Database** — PostgreSQL
- **Reverse proxy** — Nginx (dev) / Traefik (prod)
- **Containerization** — Docker Compose (dev) / Kubernetes (prod)
- **Secrets management** — [Infisical](https://app.infisical.com/organizations/34e46529-d43b-46e2-a72f-8f0f798856a8/projects/secret-management/eaa2be30-8c84-4edb-a020-179d170cc682/overview)

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
├── k8s/
│   ├── namespaces.yml              # Namespaces: frontend, backend, postgres
│   ├── backend/
│   │   ├── deployment.yml          # Deployment (2 replicas) + Service
│   │   ├── infisical-secret.yml    # InfisicalSecret CRD → backend-generated-secrets
│   │   └── ingressRoute.yml        # Traefik IngressRoute (api.myges.local)
│   ├── frontend/
│   │   ├── deployment.yml          # Deployment (3 replicas) + Service
│   │   ├── infisical-secret.yml    # InfisicalSecret CRD → frontend-generated-secrets
│   │   └── ingressRoute.yml        # Traefik IngressRoute (myges.local)
│   └── postgres/
│       ├── deployment.yml          # Deployment (1 replica) + Service
│       ├── infisical-secret.yml    # InfisicalSecret CRD → postgres-generated-secrets
│       └── pvc.yml                 # PersistentVolumeClaim (5Gi, local-path)
├── scripts/
│   └── export-dev-env.sh           # Pull dev secrets from Infisical into .env
├── .infisical.json                 # Infisical project config
└── docker-compose.yml              # Development environment
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose v2
- [Infisical CLI](https://infisical.com/docs/cli/overview) (`brew install infisical/get-cli/infisical`)

## Infisical

All secrets (dev and prod) are managed through Infisical — there is no `.env.example` to copy manually.

### How it works

- **Dev** — the CLI is used to manually pull secrets into a local `.env` file (gitignored) when needed
- **Prod** — the [Infisical Kubernetes operator](https://infisical.com/docs/integrations/platforms/kubernetes) syncs secrets directly into Kubernetes `Secret` objects at runtime

Secrets are organized by path in the `dev` / `prod` environments:

| Infisical path | Used by          |
|----------------|------------------|
| `/`            | General / shared |
| `/frontend`    | Frontend         |
| `/backend`     | Backend          |
| `/postgres`    | PostgreSQL       |

### Setup

```bash
# 1. Install the CLI
brew install infisical/get-cli/infisical

# 2. Log in
infisical login
```

## Running the project

### Generate the .env

```bash
# Pull dev secrets into .env (re-run whenever secrets change)
bash scripts/export-dev-env.sh
```

> `.env` is gitignored — never commit it.

### Without Docker

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

## Production (Kubernetes)

Production runs on Kubernetes. Images are published to GHCR and secrets are injected at runtime by the Infisical operator.

### Architecture

```
Traefik ingress
├── myges.local      → frontend (namespace: frontend, 3 replicas)
└── api.myges.local  → backend  (namespace: backend,  2 replicas)
                           ↓
                        postgres (namespace: postgres, 1 replica + 5Gi PVC)
```

### Secrets injection

The CI/CD creates a Kubernetes `Secret` `<service>-infisical-auth` from GitHub Actions secrets, containing the service token for each service. The Infisical operator uses that token (declared in `k8s/<service>/infisical-secret.yml`) to fetch the service's secrets from Infisical and syncs them into `<service>-generated-secrets` (e.g. `DATABASE_URL`, `JWT_SECRET`), which pods consume via `envFrom`.

### Image versioning

| Image | Registry |
|-------|----------|
| Backend  | `ghcr.io/aztymatt/myges-backend:<tag>`  |
| Frontend | `ghcr.io/aztymatt/myges-frontend:<tag>` |

If a deployment introduces a regression or a critical bug, revert the offending commit — the CI/CD pipeline will rebuild and redeploy the previous image automatically:

```bash
git revert <commit>
git push
```
