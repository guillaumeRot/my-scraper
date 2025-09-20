# Utiliser une image Node compatible ARM
FROM node:20-bullseye

# Créer le dossier app
WORKDIR /usr/src/app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer dépendances
RUN npm install --production

# Copier le reste du code
COPY . .

# Générer Prisma (si nécessaire)
RUN npx prisma generate

# Exposer le port du serveur
EXPOSE 3000

# Commande de démarrage avec tsx
CMD ["npx", "tsx", "server.js"]
