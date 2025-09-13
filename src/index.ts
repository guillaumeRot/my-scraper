import { closeDb, initDb } from "./db.js";
import { agenceAScraper } from "./sites/agenceA.js";

(async () => {
  // console.log("--- Initialisation DB ---");
  await initDb();

  console.log("--- Lancement des scrapers ---");
  await agenceAScraper();
  // await agenceBScraper();

  console.log("--- Fermeture DB ---");
  await closeDb();

  console.log("✅ Scraping terminé");
})();
