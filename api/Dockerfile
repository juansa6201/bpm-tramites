# syntax=docker/dockerfile:1
# Backend NestJS (Fastify + Prisma) — multi-stage.

# ------------------------------ builder ------------------------------
FROM node:20-slim AS builder
WORKDIR /app

# OpenSSL: lo necesitan los engines de Prisma.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Manifiestos + schema primero (mejor cacheo y prisma generate necesita el schema).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Código y compilación (genera dist/).
COPY . .
RUN npm run build

# ------------------------------ runner -------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Solo dependencias de producción.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Cliente Prisma generado en el builder + schema + app compilada.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Carpeta de subidas escribible por el usuario no-root.
RUN mkdir -p storage && chown node:node storage
USER node

EXPOSE 3001
CMD ["node", "dist/main.js"]
