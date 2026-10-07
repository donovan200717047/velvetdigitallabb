/* =============================================================================
   VelvetDigitalLabb — script di build
   -----------------------------------------------------------------------------
   Netlify lo esegue da solo a ogni pubblicazione (vedi netlify.toml →
   [build] command). Non servono librerie: solo Node, già presente su Netlify.

   Cosa fa:
     1. legge i dati che modifichi dal pannello /admin:
          content/products.json  → il catalogo
          content/settings.json  → nome, indirizzo del sito, shop Etsy, social
     2. controlla che siano validi (link Etsy veri, id unici...)
     3. genera js/products.js (che il sito usa) e sitemap.xml

   Per provarlo sul tuo computer:  node scripts/build.mjs
   ========================================================================== */
import { readFileSync, writeFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), "utf8"));
const write = (f, s) => writeFileSync(new URL(`../${f}`, import.meta.url), s);

const settings = read("content/settings.json");
const { products = [] } = read("content/products.json");

/* 1. Validazione: se qualcosa non va, la build si ferma con un messaggio
      chiaro e Netlify NON pubblica una versione rotta (resta online l'ultima buona). */
const errors = [];
const ids = new Set();
products.forEach((p, i) => {
  const where = `Prodotto ${i + 1} (${p.name || "senza nome"})`;
  for (const k of ["id", "name", "description", "image"]) if (!p[k]) errors.push(`${where}: manca "${k}"`);
  if (p.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errors.push(`${where}: l'id "${p.id}" deve contenere solo minuscole, numeri e trattini`);
  if (ids.has(p.id)) errors.push(`${where}: l'id "${p.id}" è già usato da un altro prodotto`);
  ids.add(p.id);
  if (p.url && !/^https:\/\/([\w-]+\.)?etsy\.com\//.test(p.url)) errors.push(`${where}: il link "${p.url}" non sembra un link Etsy (https://...etsy.com/...)`);
});
if (errors.length) {
  console.error("\n✖ Catalogo non valido:\n  - " + errors.join("\n  - ") + "\n");
  process.exit(1);
}

/* 2. Normalizzazione: il pannello salva le specifiche come {label, value};
      il sito le vuole come coppie [etichetta, valore]. Campi vuoti ripuliti. */
const clean = products.map((p) => ({
  ...p,
  includes: (p.includes || []).filter(Boolean),
  specs: (p.specs || []).filter((s) => s && s.label && s.value).map((s) => [s.label, s.value]),
  gallery: (p.gallery || []).filter(Boolean),
  url: (p.url || "").trim(),
  featured: !!p.featured
}));

/* 3. js/products.js */
write(
  "js/products.js",
  `/* =============================================================================
   FILE GENERATO AUTOMATICAMENTE da scripts/build.mjs — non modificarlo a mano.
   Per aggiungere o cambiare prodotti usa il pannello  /admin  oppure modifica
   content/products.json, poi esegui:  node scripts/build.mjs
   ========================================================================== */
window.VDL_SITE = ${JSON.stringify(settings, null, 2)};

window.VDL_PRODUCTS = ${JSON.stringify(clean, null, 2)};
`
);

/* 4. sitemap.xml: la home + una pagina per ogni prodotto */
const base = settings.url.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `  <url><loc>${base}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
  ...clean.map((p) => `  <url><loc>${base}/product.html?p=${encodeURIComponent(p.id)}</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`)
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);

console.log(`✔ Build completata: ${clean.length} prodotti → js/products.js, sitemap.xml`);
