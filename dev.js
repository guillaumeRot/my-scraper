import handler from "./handler.js";

(async () => {
  console.log("🔹 Test local du handler Leapcell…");

  const res = await handler(
    { url: "/run-scrapers", method: "GET" }, // simulateur de requête
    {}
  );

  console.log("🔹 Résultat :", res);
})();
