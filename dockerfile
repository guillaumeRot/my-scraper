# Utiliser Node officiel
FROM node:20

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json et installer dépendances
COPY package*.json ./
RUN npm ci --production

# Copier le reste de l'application
COPY . .

# Copier le client Prisma généré (depuis GitHub Actions)
COPY node_modules/.prisma ./node_modules/.prisma

# Exposer le port
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
