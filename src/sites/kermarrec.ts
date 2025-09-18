import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import os from "os";
import { chromium } from "playwright";
import { insertAnnonce } from "../db";

// Fonction utilitaire pour obtenir le bon chemin Chromium
function getChromiumPath(): string | undefined {
  // Si on est sur un Raspberry Pi (ARM) et que chromium est installé par apt
  if (
    os.arch() === "arm64" ||
    os.arch() === "arm" ||
    fs.existsSync("/usr/bin/chromium-browser")
  ) {
    return "/usr/bin/chromium-browser";
  }

  // Sinon, laisser Playwright utiliser son Chromium interne
  return undefined;
}

export const kermarrecScraper = async () => {
  const chromiumPath = getChromiumPath();

  const crawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium, // toujours playwright.chromium
      launchOptions: {
        headless: true,
        executablePath: chromiumPath, // utilise soit celui du système, soit celui de Playwright
      },
    },
    async requestHandler({ page, log }) {
      log.info("🚀 Scraping Kermarrec démarré...");

      await page.goto(
        "https://www.kermarrec-habitation.fr/achat/?post_type=achat&false-select=on&1d04ea34=chateaugiron&ville%5B%5D=vitre-35500&ville%5B%5D=chateaugiron-35410&typebien%5B%5D=immeuble&typebien%5B%5D=maison&budget_max=400000&reference=&rayon=0&avec_carte=false&tri=pertinence"
      );
      log.info("✅ Page chargée.");

      // Popup cookies
      const cookiePopup = page.locator("#didomi-popup");
      if (await cookiePopup.isVisible({ timeout: 5000 }).catch(() => false)) {
        try {
          await page.click("button#didomi-notice-agree-button");
        } catch {
          log.warning(
            "⚠️ Impossible de cliquer sur le bouton cookies, je continue quand même."
          );
        }
      }

      // --- Pagination ---
      let hasNextPage = true;
      while (hasNextPage) {
        // Attendre que les annonces soient chargées
        await page.waitForSelector("article.list-bien", { timeout: 10000 });

        // Récupérer les annonces de la page
        const annonces = await page.$$eval("article.list-bien", (els) =>
          els.map((el) => ({
            type: el.querySelector("span.entry-bien")?.textContent?.trim(),
            prix: el.querySelector("span.entry-price")?.textContent?.trim(),
            ville: el.querySelector("span.entry-ville")?.textContent?.trim(),
            pieces: el.querySelector("span.entry-pieces")?.textContent?.trim(),
            surface: el
              .querySelector("span.entry-surface")
              ?.textContent?.trim(),
            lien: (el.querySelector("a.link-full") as HTMLAnchorElement)?.href,
            description: undefined as string | undefined,
            photos: undefined as string[] | undefined,
          }))
        );

        // Log ou insertion en base
        for (const annonce of annonces) {
          const detailPage = await page.context().newPage();
          await detailPage.goto(annonce.lien, {
            waitUntil: "domcontentloaded",
          });

          // attendre que la section description soit visible (jusqu’à 10s)
          await detailPage
            .waitForSelector("#description p", { timeout: 10000 })
            .catch(() => null);

          if ((await detailPage.locator("#description p").count()) > 0) {
            annonce.description = await detailPage
              .locator("#description p")
              .first()
              .innerText();
          }

          // Attendre que les labels de navigation existent
          await detailPage.waitForSelector(".entry-medias-controls-nav label");

          // Sélectionner tous les labels
          const labels = await detailPage.$$(
            ".entry-medias-controls-nav label"
          );

          // Cliquer sur le dernier si au moins 1 existe
          if (labels.length > 0) {
            await labels[labels.length - 1].click();
            await detailPage.waitForTimeout(500); // petit délai pour que l'image se charge
          }

          // Maintenant récupérer toutes les photos
          annonce.photos = await detailPage.$$eval(
            ".entry-medias img",
            (imgs) => imgs.map((img) => (img as HTMLImageElement).src)
          );

          await insertAnnonce({ ...annonce, agence: "Kermarrec" });

          await detailPage.close();
        }

        log.info(`📌 ${annonces.length} annonces récupérées sur cette page.`);

        // Vérifie si le bouton “Page suivante” existe
        const nextButton = page.locator("a.next.page-numbers");
        if ((await nextButton.count()) > 0) {
          log.info("➡️ Passage à la page suivante...");
          await nextButton.click();
          await page.waitForTimeout(2000); // attendre le chargement des nouvelles annonces
        } else {
          hasNextPage = false;
          log.info("✅ Fin de la pagination, plus de pages.");
        }
      }
    },
  });

  await crawler.run([
    "https://www.kermarrec-habitation.fr/achat/?post_type=achat&false-select=on&1d04ea34=chateaugiron&ville%5B%5D=vitre-35500&ville%5B%5D=chateaugiron-35410&typebien%5B%5D=immeuble&typebien%5B%5D=maison&budget_max=400000&reference=&rayon=0&avec_carte=false&tri=pertinence",
  ]);
};
