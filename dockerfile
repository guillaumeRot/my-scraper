# Utiliser Node officiel
FROM node:20

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json et installer dépendances
COPY package*.json ./
RUN npm ci --production

# Copier le reste de l'application
COPY . .

# Plus besoin de copier le client Prisma

# Exposer le port
EXPOSE 3000

# Lancer le serveur
CMD ["npm", "run", "api"]

