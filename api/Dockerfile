# Build mínimo del backend (NestJS + Fastify).
# Más adelante lo convertimos en multi-stage (builder + runtime liviano).
FROM node:20-alpine

WORKDIR /app

# Instalamos dependencias primero (mejor cacheo de capas)
COPY package*.json ./
RUN npm install

# Copiamos el código y compilamos
COPY . .
RUN npm run build

EXPOSE 3001

# Arranca la app compilada
CMD ["node", "dist/main.js"]
