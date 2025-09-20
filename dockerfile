# Utiliser Node compatible avec ARMv7
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

# Générer Prisma en mode JavaScript (pas de binaires natifs)
RUN npx prisma generate --engine-library

# Exposer le port de l’API
EXPOSE 3000

# Lancer le serveur via tsx
CMD ["npx", "tsx", "server.js"]
