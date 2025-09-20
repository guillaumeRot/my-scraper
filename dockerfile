# Utiliser Node officiel compatible ARMv7
FROM node:20-bullseye

# Créer le dossier de travail
WORKDIR /usr/src/app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production
RUN npm install tsx --save-dev

# Copier le reste du projet
COPY . .

# Générer Prisma en ignorant le checksum manquant (armv7)
RUN PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate

# Exposer le port du serveur
EXPOSE 3000

# Lancer le serveur via tsx
CMD ["npx", "tsx", "server.js"]
