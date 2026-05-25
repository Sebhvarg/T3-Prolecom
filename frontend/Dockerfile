FROM node:20-alpine

WORKDIR /app

# Copiar el manifiesto de dependencias
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto del código del frontend
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar Vite exponiendo a la red interna de Docker
CMD ["npm", "run", "dev", "--", "--host"]
