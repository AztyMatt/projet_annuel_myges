FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM base AS build-backend
RUN npm run build:back 

FROM node:20-alpine AS backend
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build-backend /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/infrastructure/backend/express/server.ts"]

FROM base AS build-frontend
RUN npm run build:front

FROM node:20-alpine AS frontend
WORKDIR /app
COPY --from=build-frontend /app/infrastructure/frontend/.next ./.next
COPY --from=build-frontend /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
EXPOSE 3000
CMD ["npm", "run", "start:front"]