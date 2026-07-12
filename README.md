# projet_annuel_myges

## Stack

- **Frontend** — Next.js
- **Backend** — Express.js
- **Database** — PostgreSQL
- **ORM** — Drizzle
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
│   ├── cert-manager/
│   │   └── cluster-issuer.yml      # cert-manager ClusterIssuer (Let's Encrypt, HTTP-01 via Traefik)
│   ├── backend/
│   │   ├── deployment.yml          # Deployment (2 replicas)
│   │   ├── service.yml             # Service (port 3001)
│   │   ├── infisical-secret.yml    # InfisicalSecret CRD → backend-generated-secrets
│   │   ├── ingressRoute.yml        # Traefik IngressRoute backend HTTPS + HTTP(redirect to HTTPS)
│   │   ├── certificate.yml         # cert-manager Certificate → myges-tls Secret (backend)
│   │   └── middleware.yml          # Traefik Middleware (redirectScheme https)
│   ├── frontend/
│   │   ├── deployment.yml          # Deployment (3 replicas)
│   │   ├── service.yml             # Service (port 3000)
│   │   ├── infisical-secret.yml    # InfisicalSecret CRD → frontend-generated-secrets
│   │   ├── ingressRoute.yml        # Traefik IngressRoute frontend HTTPS + HTTP(redirect to HTTPS)
│   │   ├── certificate.yml         # cert-manager Certificate → myges-tls Secret (frontend)
│   │   └── middleware.yml          # Traefik Middleware (redirectScheme https)
│   └── postgres/
│       ├── deployment.yml          # Deployment (1 replica)
│       ├── service.yml             # Service (port 5432)
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

## Hostnames

The application hostnames are not hardcoded, they are injected at deploy time by the CI/CD pipeline via two GitHub Actions Variables:

| Variable | Role |
|----------|------|
| `FRONTEND_HOST` | Hostname for the frontend |
| `BACKEND_HOST` | Hostname for the backend API |

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

## Database (Drizzle)

Drizzle is used as the ORM (Object-Relational Mapper).
Schemas are defined in `infrastructure/backend/express/src/postgres/schema/` and migrations are generated into `infrastructure/backend/express/drizzle/`.

### Workflow

```bash
# After modifying a schema file, generate a new migration
npm run db:generate

# Apply pending migrations to the database
npm run db:migrate
```

### Structure

```
infrastructure/backend/express/
├── drizzle.config.ts               # Drizzle Kit config (dialect, schema glob, output folder)
├── drizzle/                        # Generated SQL migrations (committed to git)
└── src/postgres/
    ├── schema/                     # One file per entity (table definitions)
    ├── db.ts                       # Drizzle client (node-postgres pool)
    └── <entity>/<entity>.adapter.ts  # Repository implementation per entity
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

### Seed accounts

If `SEED_ON_START=true` and `SEED_PASSWORD` passes the strong password policy, the following accounts are created automatically on startup:

| Email | Role | 2FA |
|-------|------|-----|
| `admin.seed@myges.fr` | `ADMINISTRATEUR` | No |
| `superadmin.seed@myges.fr` | `SUPER_ADMINISTRATEUR` | Yes |

Password for both accounts: value of `SEED_PASSWORD` in `.env`.

### Dev fixtures

`fixtures/dev-fixtures.sql` seeds the database with a realistic dataset (students, instructors, classes, courses, sessions, grades, absences, exams, companies...) so every page has data to render without manual setup. Truncates all business tables and reloads them — safe to re-run at any time.

```bash
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < fixtures/dev-fixtures.sql
```

All fixture accounts share the password `MotDePasse1234$`:

| Email | Role | Notes |
|-------|------|-------|
| `superadmin.seed@myges.fr` | Super admin | 2FA required — TOTP secret in the file header |
| `admin.seed@myges.fr` | Admin | |
| e.g. `julien.girard@myges.fr` | Instructor | 4 instructors, see `users` table (`*@myges.fr`) |
| e.g. `lucas.martin@myges-etu.fr` | Student | 16 students, see `users` table (`*@myges-etu.fr`) |

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
├── $FRONTEND_HOST   → frontend (namespace: frontend, 3 replicas)
└── $BACKEND_HOST    → backend  (namespace: backend,  2 replicas)
                           ↓
                        postgres (namespace: postgres, 1 replica + 5Gi PVC)
```

### TLS / HTTPS

TLS certificates are issued by Let's Encrypt and managed by cert-manager — the Kubernetes-native equivalent of certbot: same ACME protocol, but certificates are stored in Kubernetes `Secret`s and renewed automatically (no cron, no `.pem` files to wire in).

| Manifest | Role |
|----------|------|
| `k8s/cert-manager/cluster-issuer.yml` | `ClusterIssuer` `letsencrypt-prod` — ACME account (LE production endpoint + contact email) and HTTP-01 solver served through Traefik. Cluster-scoped so it can be used from every namespace. |
| `k8s/frontend/certificate.yml` | `Certificate` producing the `myges-tls` Secret in the `frontend` namespace |
| `k8s/backend/certificate.yml` | `Certificate` producing the `myges-tls` Secret in the `backend` namespace |

A TLS Secret is namespace-scoped, hence one `Certificate` per namespace, each writing the `myges-tls` Secret referenced by that namespace's IngressRoute.

Issuance flow: cert-manager requests a certificate for the domains → Let's Encrypt challenges domain ownership → cert-manager serves the challenge token at `http://<host>/.well-known/acme-challenge/...` via Traefik → once validated, the signed certificate is written to `myges-tls` → Traefik serves HTTPS. Renewal happens automatically before expiry.

These manifests live under `k8s/` and are applied by the CD pipeline like the rest. They require [cert-manager](https://cert-manager.io/) to be present in the cluster (it provides the `ClusterIssuer` / `Certificate` kinds) — cert-manager is a cluster-level component, installed independently of this repository.

### CI/CD pipeline

```
push to develop       push to main
pull_request               │
      │                    │
      ▼                    ▼
 CI (ubuntu-latest, matrix: [backend, frontend])
      │                    │
 build only          build + push to GHCR
                           │
                           ▼
                     CD (self-hosted runner)
                       → kubectl apply -R -f k8s/
                       → rollout status (timeout: 60s)
                       → on failure: kubectl rollout undo
```

### CI/CD triggers

| Event | Branch | CI | CD |
|-------|--------|----|----|
| `push` | `main` | build + push to GHCR | deploy (if CI success) |
| `push` | `develop` | build only | not triggered |
| `pull_request` | any | build only | not triggered |

### Build platform

Docker images are built for `linux/amd64`.
ARM-based environments (Apple Silicon, AWS Graviton etc.) must enable QEMU binfmt support or equivalent (e.g. Rosetta 2 on macOS) to run these images.

### Path alias resolution (backend)

The backend uses TypeScript path aliases (`@express/*`, `@application/*`, `@domain/*` — see the `paths` in `tsconfig.json`). `tsc` type-checks against them but does **not** rewrite them in the emitted JavaScript, so the compiled `dist/` still contains `require("@express/...")` that Node cannot resolve on its own.

- **Dev** — `tsx` resolves the aliases natively from `tsconfig.json`, nothing to configure.
- **Prod** — the compiled app is started through [`module-alias`](https://www.npmjs.com/package/module-alias). The prod `CMD` is `node -r module-alias/register .../server.js`, and the aliases are mapped to their runtime locations in the `_moduleAliases` block of the **root** `package.json`:

  | Alias | Runtime path (in the image) |
  |-------|-----------------------------|
  | `@express` | `infrastructure/backend/express/dist` |
  | `@application` | `infrastructure/application` |
  | `@domain` | `infrastructure/domain` |

  These paths match where the backend Dockerfile copies each compiled project (`application/dist` → `infrastructure/application`, `domain/dist` → `infrastructure/domain`). `module-alias` is a **runtime** dependency (not `devDependencies`), so it survives `npm ci --omit=dev` in the prod stage.

### Docker layer cache

GHA layer cache (`cache-from/cache-to: type=gha`) persists Docker build layers between CI runs so unchanged layers are reused instead of rebuilt. To make it effective on this project:
- Each Dockerfile copies `package*.json` before the rest of the source so the `npm ci` layer is only invalidated when dependencies actually change, not on every source edit.
- `mode=max` is set in the CI so GHA also caches the `builder` stage layers, without it, only the final `prod` stage is cached and the `builder` stage (where `npm ci` runs) is discarded after every build.

### Image versioning

Image names are derived at runtime from the GitHub repository context (nothing is hardcoded):

```
ghcr.io/<repository_owner>/<repository_name>-<service>:<commit-sha>
```

| Variable | Source |
|----------|--------|
| `repository_owner` | `github.repository_owner` (lowercased) |
| `repository_name` | `github.event.repository.name` (lowercased) |
| `service` | `backend` or `frontend` (matrix) |
| `commit-sha` | `github.sha` (CI) / `github.event.workflow_run.head_sha` (CD) |

The k8s manifests use `__BACKEND_IMAGE__` and `__FRONTEND_IMAGE__` as placeholders, replaced by the CD pipeline before `kubectl apply`.

If a deployment introduces a regression or a critical bug, **revert the offending commit**.
The CI/CD pipeline will rebuild and redeploy the previous image automatically:

```bash
git revert <commit>
git push
```

### Secrets injection

The CD pipeline creates a Kubernetes `Secret` `<service>-infisical-auth` from GitHub Actions secrets, containing the service token for each service. The Infisical operator uses that token (declared in `k8s/<service>/infisical-secret.yml`) to fetch the service's secrets from Infisical and syncs them into `<service>-generated-secrets` (e.g. `DATABASE_URL`, `JWT_SECRET`), which pods consume via `envFrom`.

### Deployment strategies

**Backend & frontend — RollingUpdate:**

```yaml
strategy:
  rollingUpdate:
    maxSurge: 2
    maxUnavailable: 1
```

A rolling update replaces pods gradually.
By default K8s replaces them one at a time, `maxSurge: 2` makes it create 2 new pods simultaneously instead of 1, cutting rollout time roughly in half while keeping at least 1 pod serving traffic throughout (`maxUnavailable: 1`).

**Postgres — Recreate:**

```yaml
strategy:
  type: Recreate
```

Postgres cannot have two instances writing to the same PVC at the same time. `Recreate` kills the old pod first, then creates the new one, it avoids volume corruption at the cost of ~5-10s of DB downtime per deploy.

### Health probes

**readinessProbe** — gates traffic. K8s waits for this to pass before routing requests to a new pod and before taking down the old one during a rolling update. Failure removes the pod from rotation but does **not** restart it.

**livenessProbe** — detects zombie state (process alive but app deadlocked / event loop blocked / DB pool exhausted). Failure **restarts** the container. `initialDelaySeconds` is set higher than readiness to avoid restart loops during startup.

### Automatic rollback

The CD waits for the rollout to complete (`kubectl rollout status --timeout=60s`). If it times out (meaning new pods never passed readiness), the pipeline fails and automatically runs `kubectl rollout undo`, which reactivates the previous ReplicaSet without any rebuild.