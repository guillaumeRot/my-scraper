import { PlaywrightCrawler } from "crawlee";
import { insertAnnonce } from "../db";

export const agenceAScraper = async () => {
  const crawler = new PlaywrightCrawler({
    async requestHandler({ page, log }) {
      log.info("🚀 Scraping agence A démarré...");

      await page.goto("https://www.kermarrec-habitation.fr/achat/");
      log.info("✅ Page chargée.");

      // Popup cookies
      const cookiePopup = page.locator("#didomi-popup");
      if (await cookiePopup.isVisible({ timeout: 5000 }).catch(() => false)) {
        log.info("🍪 Popup cookies détectée.");
        try {
          await page.click("button#didomi-notice-agree-button");
          log.info("✅ Popup cookies acceptée.");
        } catch {
          log.warning(
            "⚠️ Impossible de cliquer sur le bouton cookies, je continue quand même."
          );
        }
      }

      // Sélection de la ville
      await page.click('label[for="localisation_toggle"]'); // ouvre le dropdown
      const searchInput = page.locator("#search_lieu");

      // Tape lettre par lettre
      for (const char of "Vitré") {
        await searchInput.type(char);
        await page.waitForTimeout(100);
      }

      // Attendre que la liste d'options apparaisse
      await page.waitForSelector(
        "#l10n-dropdown-to-fill .false-select-option",
        { timeout: 20000 }
      );

      const dropdown = page.locator("#l10n-dropdown-to-fill");
      await dropdown.getByText("Vitré", { exact: true }).click(); // sélection exacte

      // --- Sélection du type de bien ---
      await page.click('label[for="type_toggle"]'); // ouvre le dropdown "Type de bien"

      // attendre que la liste apparaisse
      await page.waitForSelector("#typebien .false-select-option", {
        timeout: 10000,
      });

      // sélectionner "Immeuble"
      const typeDropdown = page.locator("#typebien");
      await typeDropdown.getByText("Immeuble", { exact: true }).click();

      // sélectionner "Maison"
      await typeDropdown.getByText("Maison", { exact: true }).click();

      // Clique sur le bouton rechercher
      await page.click("#bandeau_submit button.achat-submit");
      log.info("➡️ Recherche lancée...");

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
          }))
        );

        // Log ou insertion en base
        for (const annonce of annonces) {
          log.info(
            `➡️ Ouverture de l'annonce: ${annonce.ville} - ${annonce.lien}`
          );
          const detailPage = await page.context().newPage();
          await detailPage.goto(annonce.lien, {
            waitUntil: "domcontentloaded",
          });

          // attendre que la section description soit visible (jusqu’à 10s)
          await detailPage
            .waitForSelector("#description p", { timeout: 10000 })
            .catch(() => null);

          let description: string | null = null;
          if ((await detailPage.locator("#description p").count()) > 0) {
            annonce.description = await detailPage
              .locator("#description p")
              .first()
              .innerText();
          }

          // Récupération photos
          const photos = await detailPage.$$eval(
            ".swiper-wrapper img", // Sélecteur à adapter selon le HTML exact
            (imgs) => imgs.map((img) => (img as HTMLImageElement).src)
          );

          log.info(
            `📌 Annonce détaillée: ${annonce.type} - ${annonce.prix} - ${annonce.ville}\n` +
              `📖 Description: ${annonce.description?.slice(0, 100)}...\n` +
              `🖼️ ${photos.length} photos récupérées`
          );

          await insertAnnonce({ ...annonce, agence: "Agence A" });

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

  await crawler.run(["https://www.kermarrec-habitation.fr/achat/"]);
};
