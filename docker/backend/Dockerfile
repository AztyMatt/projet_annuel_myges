FROM node:20-slim AS base
WORKDIR /app

COPY package*.json ./
COPY domain/package*.json ./domain/
COPY application/package*.json ./application/
COPY infrastructure/backend/express/package*.json ./infrastructure/backend/express/

# ---- Dev ----
FROM base AS dev
RUN npm ci
CMD ["npx", "tsx", "watch", "infrastructure/backend/express/server.ts"]

# ---- Builder ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build:express

# ---- Prod ----
FROM node:20-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY infrastructure/backend/express/package*.json ./infrastructure/backend/express/
RUN npm ci --omit=dev --workspace=@myges/express
COPY --from=builder /app/infrastructure/backend/express/dist ./infrastructure/backend/express/dist
COPY --from=builder /app/application/dist ./infrastructure/application
COPY --from=builder /app/domain/dist ./infrastructure/domain
CMD ["node", "infrastructure/backend/express/dist/server.js"]
