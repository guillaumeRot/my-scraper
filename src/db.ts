import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "immobilier",
  password: "admin",
  port: 5432,
});

export async function initDb() {
  await pool.query(`
    DROP TABLE IF EXISTS annonces;
  
    CREATE TABLE annonces (
      id SERIAL PRIMARY KEY,
      type VARCHAR(255),
      prix VARCHAR(100),
      ville VARCHAR(100),
      pieces VARCHAR(50),
      surface VARCHAR(50),
      lien TEXT UNIQUE, -- ⚡ je mets UNIQUE pour que ton ON CONFLICT marche
      description TEXT,
      photos JSONB,
      agence VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      date_scraped TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function insertAnnonce(annonce: {
  type?: string;
  prix?: string;
  ville?: string;
  pieces?: string;
  surface?: string;
  lien?: string;
  agence: string;
  description?: string;
  photos?: string[];
}) {
  try {
    await pool.query(
      `INSERT INTO annonces (type, prix, ville, pieces, surface, lien, agence, description, photos) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (lien) DO UPDATE 
       SET type = EXCLUDED.type,
           prix = EXCLUDED.prix,
           ville = EXCLUDED.ville,
           pieces = EXCLUDED.pieces,
           surface = EXCLUDED.surface,
           agence = EXCLUDED.agence,
           description = EXCLUDED.description,
           photos = EXCLUDED.photos,
           date_scraped = NOW()`,
      [
        annonce.type,
        annonce.prix,
        annonce.ville,
        annonce.pieces,
        annonce.surface,
        annonce.lien,
        annonce.agence,
        annonce.description,
        JSON.stringify(annonce.photos || []), // 🔑 transforme ton tableau en JSON
      ]
    );
  } catch (err) {
    console.error("Erreur insertion annonce:", err);
  }
}

export async function deleteMissingAnnonces(
  agence: string,
  liensActuels: string[]
) {
  if (liensActuels.length === 0) return;

  await pool.query(
    `DELETE FROM annonces 
         WHERE agence = $1 
         AND lien NOT IN (${liensActuels
           .map((_, i) => `$${i + 2}`)
           .join(",")})`,
    [agence, ...liensActuels]
  );
}

export async function closeDb() {
  await pool.end();
}
