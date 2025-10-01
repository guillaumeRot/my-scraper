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

export const immonotScraper = async () => {
  const chromiumPath = getChromiumPath();

  const crawler = new PlaywrightCrawler({
    requestHandlerTimeoutSecs: 300, // 5 minutes au lieu de 60 secondes
    launchContext: {
      launcher: chromium, // toujours playwright.chromium
      launchOptions: {
        headless: false,
        executablePath: chromiumPath, // utilise soit celui du système, soit celui de Playwright
      },
    },
    async requestHandler({ page, log }) {
      log.info("🚀 Scraping Immonot démarré...");

      await page.goto("https://www.immonot.com/immobilier.do");
      log.info("✅ Page chargée.");
      await page.waitForLoadState("networkidle", { timeout: 20000 });

      // Étapes Playwright fournies
      try {
        // Accepter cookies (si présent)
        await page
          .getByRole("button", { name: "Accepter", exact: true })
          .click({ timeout: 5000 })
          .catch(() => {});
        await page.waitForLoadState("networkidle", { timeout: 30000 });
        log.info("✅ Cookies acceptés (si présents) et page chargée.");

        // Zone de recherche
        await page.waitForTimeout(6000);
        await page.locator("#js-search").getByText("Toute la France").click();

        let input = page.getByRole("textbox", { name: "Ville, département, code" });
        await input.click();
        await input.fill("");

        const city = "Vitré";
        for (const ch of city) {
          await input.type(ch, { delay: 120 });
          await page.waitForTimeout(100);
        }

        // Attendre l'apparition des suggestions et sélectionner la bonne
        const suggestion = page
          .locator('li[data-type="commune"]', { hasText: "Vitré" })
          .first();
        await suggestion.waitFor({ state: "visible", timeout: 10000 });
        await suggestion.click();

        // Ajouter Châteaugiron
        input = page.getByRole("textbox", { name: "Ville, département, code" });
        await input.click();
        await input.fill("");

        const city2 = "Chateaugiron";
        for (const ch of city2) {
          await input.type(ch, { delay: 120 });
          await page.waitForTimeout(100);
        }

        // Attendre l'apparition des suggestions et sélectionner Châteaugiron
        const suggestion2 = page
          .locator('li[data-type="commune"]', { hasText: "Châteaugiron" })
          .first();
        await suggestion2.waitFor({ state: "visible", timeout: 10000 });
        await suggestion2.click();

        // // Type d'annonce
        await page.getByText('Aucune sélection').nth(3).click();
        await page.locator('#js-search').getByText('Achat').click();

        // // Type de bien
        await page.locator('#js-search').getByText('Aucune sélection').click();
        await page.locator('#js-search').getByText('Maisons').click();
        await page.locator('#js-search').getByText('Afficher plus').click();
        await page.locator('#js-search').getByText('Immeubles').click();

        // Cliquer sur le filtre prix
        await page.locator('span.il-search-item-resume[data-rel="prix"]').click();
        await page.waitForTimeout(1000);
        
        // Remplir le prix maximum
        const maxPriceInput = page.locator('.il-search-box.visible .x-form-slider[data-rel="prix"] input.js-max[type="number"]');
        await maxPriceInput.click();
        await maxPriceInput.fill('400000');
        await maxPriceInput.press('Enter');
        await page.waitForTimeout(1000);
        
        // Cliquer sur Appliquer
        // await page.locator('button.js-search-update.btn-info').click();
        // await page.waitForTimeout(2000);

        // Cliquer sur le bouton Rechercher
        await page.locator('button.il-search-btn.js-search-update').click();
        await page.waitForLoadState("networkidle", { timeout: 20000 });
        
        log.info("✅ Filtres appliqués et résultats chargés.");

        // --- Scraping des annonces ---
        // let hasNextPage = true;
        // while (hasNextPage) {
          // Attendre que les cartes soient chargées
          await page.waitForSelector(".il-card", { timeout: 30000 });

          // Récupérer les annonces de la page
          const annonces = await page.$$eval(".il-card", (cards) =>
            cards.map((card) => {
              const titleEl = card.querySelector(".il-card-title");
              const priceEl = card.querySelector(".il-card-price strong");
              const excerptEl = card.querySelector(".il-card-excerpt");
              const linkEl = card.querySelector("a.js-mirror-link");
              const surfaceEl = card.querySelector(".il-card-quickview-item strong");
              const piecesEl = card.querySelectorAll(".il-card-quickview-item strong")[1];

              return {
                type: titleEl?.querySelector(".il-card-type")?.textContent?.trim(),
                prix: priceEl?.textContent?.trim().replace(/\s+/g, " "),
                ville: titleEl?.querySelector(".il-card-locale")?.textContent?.trim(),
                surface: surfaceEl?.textContent?.trim(),
                pieces: piecesEl?.textContent?.trim(),
                lien: (linkEl as HTMLAnchorElement)?.href,
                description: excerptEl?.textContent?.trim(),
                photos: undefined as string[] | undefined,
              };
            })
          );

          log.info(`📌 ${annonces.length} annonces trouvées sur cette page.`);

          // Pour chaque annonce, ouvrir la page de détail et récupérer les photos
          for (const annonce of annonces) {
            if (!annonce.lien) continue;

            const detailPage = await page.context().newPage();
            try {
              await detailPage.goto(annonce.lien, {
                waitUntil: "domcontentloaded",
                timeout: 15000,
              });

              // Attendre les images
              await detailPage
                .waitForSelector(".il-card-img", { timeout: 5000 })
                .catch(() => null);

              // Récupérer toutes les photos
              annonce.photos = await detailPage.$$eval(
                ".il-card-img[data-src], .il-card-img[style*='background-image']",
                (imgs) =>
                  imgs
                    .map((img) => {
                      const dataSrc = img.getAttribute("data-src");
                      if (dataSrc) return dataSrc;
                      const style = img.getAttribute("style");
                      const match = style?.match(/url\(["']?([^"')]+)["']?\)/);
                      return match ? match[1] : null;
                    })
                    .filter((url): url is string => !!url)
              );

            } catch (error) {
              log.warning(`⚠️ Erreur lors du scraping de ${annonce.lien}`, {
                error: String(error),
              });
            } finally {
              await detailPage.close();
            }

            console.log("annonce 10: " + annonce.type + " - " + annonce.prix + " - " + annonce.ville + " - " + annonce.lien);

            await insertAnnonce({ ...annonce, agence: "Immonot" });
          }

          // Vérifier s'il y a une page suivante
          // const nextButton = page.locator('a.page-link[rel="next"]');
          // if ((await nextButton.count()) > 0) {
          //   log.info("➡️ Passage à la page suivante...");
          //   await nextButton.click();
          //   await page.waitForTimeout(3000);
          //   await page.waitForLoadState("networkidle", { timeout: 20000 });
          // } else {
          //   hasNextPage = false;
          //   log.info("✅ Fin de la pagination, plus de pages.");
          // }
        // }
      } catch (e) {
        log.warning(
          "⚠️ Erreur lors de l'interaction avec les filtres Immonot",
          { error: String(e) }
        );
      }
    },
  });

  await crawler.run(["https://www.immonot.com/immobilier.do"]);
};
