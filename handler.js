import 'dotenv/config';
import { closeDb, initDb } from "./src/db.ts";
import { immonotScraper } from "./src/sites/immonot.ts";

export default async function handler(req, res) {
  // Simule express pour compatibilité
  const url = req.url || "";
  const method = req.method || "GET";

  if (url === "/health") {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  if (url === "/run-scrapers" && method === "GET") {
    try {
      await initDb();
      await immonotScraper();
      await closeDb();
      return { status: "success", message: "Scraping terminé." };
    } catch (e) {
      return { status: "error", message: e.message };
    }
  }

  return { status: "unknown_route", message: "Route non trouvée." };
}
