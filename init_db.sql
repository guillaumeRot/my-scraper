-- Script d'initialisation de la base de données pour remplacer Prisma
-- À exécuter une seule fois pour créer la table

CREATE TABLE IF NOT EXISTS "Annonce" (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255),
    prix VARCHAR(100),
    ville VARCHAR(100),
    pieces VARCHAR(50),
    surface VARCHAR(50),
    lien VARCHAR UNIQUE NOT NULL,
    description TEXT,
    photos JSON,
    agence VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_annonce_lien ON "Annonce"(lien);
CREATE INDEX IF NOT EXISTS idx_annonce_agence ON "Annonce"(agence);
