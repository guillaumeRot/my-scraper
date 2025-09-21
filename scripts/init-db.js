#!/usr/bin/env node

/**
 * Script d'initialisation de la base de données
 * Remplace les migrations Prisma par une initialisation SQL directe
 */

import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log("🔧 Initialisation de la base de données...");

    // Lire et exécuter le script SQL d'initialisation
    const sqlPath = path.join(__dirname, "..", "init_db.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);
    console.log("✅ Base de données initialisée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
