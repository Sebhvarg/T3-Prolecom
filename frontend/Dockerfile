FROM node:20-alpine

# Actualizar paquetes base del sistema para mitigar vulnerabilidades reportadas
RUN apk upgrade --no-cache

WORKDIR /app

# Copiar el manifiesto de dependencias
COPY package.json yarn.lock* ./

# Instalar las dependencias
RUN yarn install

# Copiar el resto del código del frontend
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar Vite exponiendo a la red interna de Docker
CMD ["yarn", "dev", "--host"]
