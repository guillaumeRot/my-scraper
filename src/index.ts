import { closeDb, initDb } from "./db.js";
import { kermarrecScraper } from "./sites/kermarrec.js";

(async () => {
  // console.log("--- Initialisation DB ---");
  await initDb();

  console.log("--- Lancement des scrapers ---");
  await kermarrecScraper();
  // await agenceBScraper();

  console.log("--- Fermeture DB ---");
  await closeDb();

  console.log("✅ Scraping terminé");
})();
