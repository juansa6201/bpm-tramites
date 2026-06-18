# syntax=docker/dockerfile:1
# Frontend Next.js (App Router) — multi-stage con output standalone.

# ------------------------------ builder ------------------------------
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# NEXT_PUBLIC_* se inlinea en build: es la URL que el NAVEGADOR usa para la API
# (host, no la red interna de Docker). Llega como build arg desde compose.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

# ------------------------------ runner -------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Salida standalone: server.js + node_modules mínimos + estáticos.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server.js"]
