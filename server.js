import dotenv from "dotenv";
import express from "express";
import { closeDb, initDb } from "./src/db.ts";
import { immonotScraper } from "./src/sites/immonot.ts";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Évite les exécutions concurrentes
let isScrapeRunning = false;

async function runScrapersSequentially() {
  if (isScrapeRunning) return;
  isScrapeRunning = true;
  try {
    await immonotScraper();
  } catch (err) {
    console.error("Erreur lors de l'exécution des scrapers:", err);
  } finally {
    isScrapeRunning = false;
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Homepage
app.get("/", (req, res) => {
  res.json({ message: "API my-scraper est en ligne" });
});

// Lancer les scrapers en arrière-plan (séquentiel, non bloquant)
app.get("/run-scrapers", (req, res) => {
  if (isScrapeRunning) {
    return res.status(409).json({
      status: "already_running",
      message: "Un scraping est déjà en cours. Réessayez plus tard.",
    });
  }

  // Démarre en arrière-plan et répond immédiatement
  setImmediate(() => {
    runScrapersSequentially();
  });

  return res.status(200).json({
    status: "started",
    message: "Scrapers démarrés en arrière-plan (séquentiel).",
  });
});

// ⚡ Démarrage avec initialisation de la base et arrêt propre
async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error("❌ Impossible d'initialiser la base de données. Arrêt.", err);
    process.exit(1);
  }

  // Gestion de la fermeture propre
  const shutdown = async (signal) => {
    console.log(`\n🔻 Reçu ${signal}, fermeture...`);
    try {
      await closeDb();
    } catch (e) {
      console.error("Erreur lors de la fermeture de la DB:", e);
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Écouter sur toutes les interfaces pour Docker
  app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  });
}

start();
