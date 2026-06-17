# Build mínimo del frontend (Next.js + React 19 + MUI).
# Más adelante lo convertimos en multi-stage con output standalone.
FROM node:20-alpine

WORKDIR /app

# Instalamos dependencias primero (mejor cacheo de capas)
COPY package*.json ./
RUN npm install

# Copiamos el código y generamos el build de producción
COPY . .
RUN npm run build

EXPOSE 3000

# Arranca el server de Next en modo producción
CMD ["npm", "start"]
