# Dockerfile
FROM node:20

WORKDIR /app

# Copier package.json + package-lock.json
COPY package*.json ./

# Installer dépendances prod
RUN npm ci --production

# Copier tout le code source
COPY . .

# Copier le client Prisma déjà généré depuis GitHub Actions
COPY node_modules/.prisma ./node_modules/.prisma

# Exposer le port de l'API
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
