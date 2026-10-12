# Render looks for a Dockerfile at the repository root.
# This image builds and runs the AgriMarket backend API.
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY backend/data ./data
COPY backend/src/database/schema.sql ./dist/database/schema.sql
RUN mkdir -p ./uploads

EXPOSE 10000
CMD ["node", "dist/index.js"]
