# Utilise l'image Playwright officielle compatible avec ta version
FROM mcr.microsoft.com/playwright:v1.55.0-noble

# Définit le dossier de travail
WORKDIR /app

# Met à jour les paquets système et installe les outils nécessaires
# (procps pour la commande `ps`, utile à Crawlee/Playwright)
RUN apt-get update && \
    apt-get install -y --no-install-recommends procps && \
    rm -rf /var/lib/apt/lists/*

# Copie les fichiers de configuration avant le reste pour optimiser le cache Docker
COPY package*.json tsconfig.json ./

# Installe les dépendances (production uniquement)
RUN npm ci --omit=dev

# Installe tsx globalement (si ton projet le lance directement)
RUN npm install -g tsx

# Copie le reste du code source
COPY . .

# Définit les variables d'environnement
ENV NODE_ENV=production
# Important : ne pas skip le téléchargement des navigateurs
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Expose le port 3000 (Railway détecte automatiquement)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "start"]
