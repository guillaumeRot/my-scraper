import { PlaywrightCrawler } from "crawlee";
import { deleteMissingAnnonces, insertAnnonce } from "../db.js";

export const agenceBScraper = async () => {
  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
      log.info("Scraping agence B...");

      await page.goto("https://www.agenceB.fr");

      // Exemple interaction différente
      await page.click("#search-form");
      await page.fill("#q", "Paris");
      await page.click("#submit");

      await page.waitForSelector(".result-item");

      const annonces = await page.$$eval(".result-item", (els) =>
        els.map((el) => ({
          titre: el.querySelector("h2")?.textContent?.trim(),
          prix: el.querySelector(".price")?.textContent?.trim(),
          lien: el.querySelector("a")?.href,
        }))
      );

      const liensActuels: string[] = [];

      for (const annonce of annonces) {
        if (annonce.lien) {
          await insertAnnonce({ ...annonce, agence: "Agence B" });
          liensActuels.push(annonce.lien);
        }
      }

      await deleteMissingAnnonces("Agence B", liensActuels);

      log.info(`📌 ${annonces.length} annonces actives (Agence B)`);
    },
  });

  await crawler.run(["https://www.agenceB.fr"]);
};
