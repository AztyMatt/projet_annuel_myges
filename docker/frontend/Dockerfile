FROM node:20-slim AS base
WORKDIR /app

COPY package*.json ./
COPY domain/package*.json ./domain/
COPY application/package*.json ./application/
COPY infrastructure/frontend/next/package*.json ./infrastructure/frontend/next/

# ---- Dev ----
FROM base AS dev
RUN npm ci
CMD ["npm", "run", "dev", "--workspace=@myges/next"]

# ---- Builder ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build --workspace=@myges/next

# ---- Prod ----
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/infrastructure/frontend/next/.next/standalone ./
COPY --from=builder /app/infrastructure/frontend/next/.next/static ./infrastructure/frontend/next/.next/static
COPY --from=builder /app/infrastructure/frontend/next/public ./infrastructure/frontend/next/public
CMD ["node", "infrastructure/frontend/next/server.js"]
