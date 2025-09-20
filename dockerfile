# Dockerfile
FROM node:20

# Créer le dossier de travail
WORKDIR /app

# Copier package.json + package-lock.json pour installer deps
COPY package*.json ./

# Installer dépendances (prod seulement)
RUN npm ci --production

# Copier tout le code source
COPY . .

# Générer Prisma JS client (spécifier le schema)
RUN npx prisma generate --schema=./prisma/schema.prisma --engine-library

# Exposer le port de l'API
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
