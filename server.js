import dotenv from "dotenv";
import express from "express";
import { kermarrecScraper } from "./src/sites/kermarrec.ts";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({ message: "API my-scraper est en ligne" });
});

app.get("/run-kermarrec", async (req, res) => {
  try {
    await kermarrecScraper();
    res.send("Scraper lancé !");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors du scraping");
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});
