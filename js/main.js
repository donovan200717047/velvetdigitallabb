/* =============================================================================
   VelvetDigitalLabb — main.js
   -----------------------------------------------------------------------------
   JavaScript "vanilla" (senza librerie). Fa due lavori:
     A. RENDER: legge il catalogo (js/products.js) e costruisce l'HTML di
        hero, featured, collezione, filtri, footer e pagina prodotto.
     B. INTERAZIONI: header, menu mobile, animazioni di reveal, parallax,
        galleria, barra d'acquisto mobile.

   Tutto è dentro una IIFE ( (() => { ... })() ): una funzione che si esegue
   subito e crea uno "scope" privato, così le nostre variabili non finiscono
   nell'oggetto globale window e non entrano in conflitto con altri script.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------------------------------------------------------------------------
     0. DATI E UTILITÀ
     ------------------------------------------------------------------------ */
  const SITE = window.VDL_SITE || { name: "VelvetDigitalLabb", url: "", shopUrl: "#", social: [] };
  const PRODUCTS = (window.VDL_PRODUCTS || []).filter(Boolean);

  // Rispetta la preferenza di sistema "riduci movimento".
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // "pointer: fine" = mouse/trackpad. Gli effetti al passaggio del mouse non
  // hanno senso sugli schermi touch, quindi li attiviamo solo qui.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Escape dell'HTML: i testi del catalogo vengono inseriti con innerHTML,
  // quindi neutralizziamo i caratteri speciali (<, >, &, ", ') per sicurezza
  // e per evitare che un apostrofo rompa un attributo.
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Controllo qualità del catalogo: avvisa in console se manca qualcosa.
  const REQUIRED = ["id", "name", "description", "image"];
  const ids = new Set();
  PRODUCTS.forEach((p, i) => {
    REQUIRED.forEach((k) => { if (!p[k]) console.warn(`[VDL] Prodotto #${i + 1}: manca il campo "${k}"`); });
    if (ids.has(p.id)) console.warn(`[VDL] id duplicato: "${p.id}" — ogni prodotto deve avere un id unico.`);
    ids.add(p.id);
    if (!p.url) console.info(`[VDL] "${p.name}" non ha un link Etsy: verrà mostrato come "Coming soon".`);
  });

  const isLive = (p) => typeof p.url === "string" && /^https:\/\//.test(p.url);
  const productPage = (p) => `product.html?p=${encodeURIComponent(p.id)}`;
  // In evidenza: i più recenti per primi (l'ultimo aggiunto al catalogo è il più nuovo).
  const featured = PRODUCTS.filter((p) => p.featured).reverse();

  // Attributi standard dei link esterni verso Etsy (nuova scheda, sicuri).
  const EXT = 'target="_blank" rel="noopener noreferrer"';
  const NEW_TAB = '<span class="visually-hidden">(opens Etsy in a new tab)</span>';
  const ARROW =
    '<svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  /* Immagini responsive.
     Le immagini Etsy esistono in più dimensioni: basta cambiare il pezzo
     "il_794xN" dell'URL in "il_570xN" o "il_1140xN". Costruiamo quindi uno
     srcset: il browser sceglie da solo la più leggera adatta allo schermo. */
  const ETSY_SIZE = /il_(\d+xN|fullxfull)/;
  function img(src, { alt = "", sizes = "100vw", eager = false, cls = "" } = {}) {
    if (!src) return "";
    let srcset = "";
    if (ETSY_SIZE.test(src)) {
      srcset = [570, 794, 1140].map((w) => `${src.replace(ETSY_SIZE, `il_${w}xN`)} ${w}w`).join(", ");
    }
    return `<img src="${esc(src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="${sizes}"` : ""} alt="${esc(alt)}" width="794" height="794" ${
      eager ? 'fetchpriority="high"' : 'loading="lazy"'
    } decoding="async"${cls ? ` class="${cls}"` : ""}>`;
  }

  // Sfondo sfocato dei riquadri foto (.mat): la stessa foto, versione piccola.
  const matBg = (src) => (src ? ` style="--bg:url('${esc(ETSY_SIZE.test(src) ? src.replace(ETSY_SIZE, "il_570xN") : src)}')"` : "");

  // Link principale di un prodotto: Etsy se c'è l'URL, altrimenti nessun link.
  const etsyHref = (p) => (isLive(p) ? `href="${esc(p.url)}" ${EXT}` : "");

  /* ---------------------------------------------------------------------------
     A1. HERO — vetrina "bento": una griglia ordinata di 3 riquadri.
     Riquadro grande = il bundle (o il primo prodotto in evidenza), due
     riquadri piccoli = le ultime novità. Tutto allineato, niente oggetti
     sparsi: l'ordine comunica professionalità.
     ------------------------------------------------------------------------ */
  const pickHero = () => {
    const pool = featured.length ? featured : [...PRODUCTS].reverse();
    const big = pool.find((p) => p.category === "Bundles") || pool[0];
    return [big, ...pool.filter((p) => p !== big)].filter(Boolean).slice(0, 3);
  };

  function tileHTML(p, cls, sizes, eager) {
    return `
      <a class="tile ${cls}" href="${productPage(p)}">
        ${img(p.image, { alt: p.etsyTitle || p.name, sizes, eager })}
        <span class="tile__bar">
          <span><small>${esc(p.category || "")}</small><b>${esc(p.name)}</b></span>
          ${p.price ? `<em>${esc(p.price)}</em>` : ""}
        </span>
      </a>`;
  }

  function renderBento() {
    const el = $("[data-bento]");
    if (!el) return;
    const [big, a, b] = pickHero();
    if (!big) return el.setAttribute("hidden", "");
    el.innerHTML =
      tileHTML(big, "tile--big", "(max-width: 900px) 92vw, 340px", true) +
      (a ? tileHTML(a, "", "(max-width: 900px) 45vw, 220px") : "") +
      (b ? tileHTML(b, "", "(max-width: 900px) 45vw, 220px") : "");
  }

  let setCatalogFilter = null; // lo imposta renderCollection (filtra il catalogo da fuori)

  /* ---------------------------------------------------------------------------
     A1e. SPOTLIGHT — una fascia elegante che mette in evidenza il bundle
     (o il primo prodotto in evidenza): immagine, cosa contiene, prezzo, CTA.
     ------------------------------------------------------------------------ */
  function renderSpotlight() {
    const el = $("[data-spotlight]");
    if (!el) return;
    const p = PRODUCTS.find((x) => x.category === "Bundles") || featured[0];
    if (!p) return el.closest("section")?.setAttribute("hidden", "");
    el.innerHTML = `
      <div class="spot__media">${img(p.image, { alt: p.etsyTitle || p.name, sizes: "(max-width: 900px) 92vw, 520px" })}</div>
      <div class="spot__body">
        <p class="eyebrow">${p.category === "Bundles" ? "Best value" : "Spotlight"}</p>
        <h2 class="spot__title">${esc(p.name)}</h2>
        ${p.tagline ? `<p class="spot__tag">${esc(p.tagline)}</p>` : ""}
        ${includesHTML(p)}
        <div class="spot__buy">
          ${p.price ? `<span class="spot__price">${esc(p.price)}</span>` : ""}
          ${isLive(p) ? `<a class="btn" ${etsyHref(p)}>Buy on Etsy ${ARROW}${NEW_TAB}</a>` : ""}
          <a class="link-underline" href="${productPage(p)}" data-quickview="${esc(p.id)}">Quick view</a>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------------------------
     A1c. QUICK VIEW — anteprima del prodotto in una finestra (<dialog>),
     senza lasciare la pagina. Il link resta un link vero: con Cmd/Ctrl+clic
     o senza JS apre la pagina prodotto completa.
     ------------------------------------------------------------------------ */
  function initQuickView() {
    if (!("HTMLDialogElement" in window)) return;
    const dlg = document.createElement("dialog");
    dlg.className = "qv";
    dlg.setAttribute("aria-labelledby", "qv-title");
    document.body.appendChild(dlg);

    const open = (p) => {
      const images = [p.image, ...(p.gallery || [])].slice(0, 6);
      dlg.innerHTML = `
        <button class="qv__close" type="button" aria-label="Close" data-qv-close>×</button>
        <div class="qv__grid">
          <div class="qv__media">
            <div class="qv__main mat"${matBg(images[0])}>${img(images[0], { alt: p.etsyTitle || p.name, sizes: "(max-width: 760px) 90vw, 420px", eager: true })}</div>
            ${images.length > 1 ? `<div class="qv__thumbs">${images.map((src, i) => `<button type="button" aria-label="Image ${i + 1}" aria-pressed="${i === 0}" data-src="${esc(src)}">${img(src, { alt: "", sizes: "64px" })}</button>`).join("")}</div>` : ""}
          </div>
          <div class="qv__info">
            <p class="eyebrow">${esc(p.category || "")}</p>
            <h2 id="qv-title">${esc(p.name)}</h2>
            ${p.tagline ? `<p class="qv__tag">${esc(p.tagline)}</p>` : ""}
            <p class="qv__desc">${esc(p.description)}</p>
            ${includesHTML(p)}
            <div class="qv__buy">
              ${p.price ? `<span class="rec__price">${esc(p.price)}</span>` : ""}
              ${isLive(p) ? `<a class="btn btn--dark" ${etsyHref(p)}>Buy on Etsy ${ARROW}${NEW_TAB}</a>` : ""}
              <a class="link-underline" href="${productPage(p)}">Full details</a>
            </div>
          </div>
        </div>`;
      dlg.showModal();
      document.body.classList.add("qv-open");
    };
    dlg.addEventListener("close", () => document.body.classList.remove("qv-open"));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-qv-close]")) return dlg.close(); // clic fuori o sulla X
      const t = e.target.closest(".qv__thumbs button");
      if (!t) return;
      $$(".qv__thumbs button", dlg).forEach((b) => b.setAttribute("aria-pressed", String(b === t)));
      $(".qv__main", dlg).style.setProperty("--bg", `url('${t.dataset.src.replace(ETSY_SIZE, "il_570xN")}')`);
      $(".qv__main", dlg).innerHTML = img(t.dataset.src, { alt: "", sizes: "(max-width: 760px) 90vw, 420px", eager: true });
    });
    // Delegazione: funziona anche per le card aggiunte dopo con "Load more".
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-quickview]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const p = PRODUCTS.find((x) => x.id === a.dataset.quickview);
      if (!p) return;
      e.preventDefault();
      open(p);
    });
  }

  /* ---------------------------------------------------------------------------
     A2. CARD PRODOTTO — un unico componente compatto, usato ovunque
     (rail featured, catalogo, "Pairs well with"). Una sola card da
     mantenere = stile coerente anche con 500 prodotti.
     ------------------------------------------------------------------------ */
  const specsHTML = (p) =>
    p.specs && p.specs.length
      ? `<dl class="specs">${p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
      : "";
  const includesHTML = (p) =>
    p.includes && p.includes.length ? `<ul class="includes">${p.includes.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  const priceHTML = (p) => (p.price ? `<p class="price">${esc(p.price)}<small>Price on Etsy</small></p>` : "");

  const CARD_SIZES = "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 260px";
  function cardHTML(p, i = 0) {
    const hover = p.gallery && p.gallery[0];
    return `
      <li class="pcard" style="--i:${i % 12}">
        <div class="pcard__media mat"${matBg(p.image)}>
          ${img(p.image, { alt: p.etsyTitle || p.name, sizes: CARD_SIZES })}
          ${hover ? img(hover, { alt: "", sizes: CARD_SIZES }) : ""}
          ${p.badge ? `<span class="pcard__badge">${esc(p.badge)}</span>` : ""}
        </div>
        <div class="pcard__body">
          <p class="pcard__cat">${esc(p.category || "")}</p>
          <h3 class="pcard__name"><a href="${productPage(p)}">${esc(p.name)}</a></h3>
          <div class="pcard__foot">
            <span class="pcard__price">${isLive(p) ? esc(p.price || "") : "Coming soon"}</span>
            <a class="pcard__more" href="${productPage(p)}" data-quickview="${esc(p.id)}">Quick view<span class="visually-hidden"> of ${esc(p.name)}</span></a>
          </div>
        </div>
      </li>`;
  }

  /* ---------------------------------------------------------------------------
     A3. FEATURED — rail orizzontale con frecce e scroll-snap
     ------------------------------------------------------------------------ */
  function renderFeatured() {
    const rail = $("[data-featured]");
    if (!rail) return;
    if (!featured.length) { $("#featured")?.setAttribute("hidden", ""); return; }
    rail.innerHTML = featured.map(cardHTML).join("");

    const prev = $("[data-rail-prev]");
    const next = $("[data-rail-next]");
    // Scorre di "una pagina" di card: la larghezza visibile meno una card.
    const step = () => Math.max(rail.clientWidth * 0.8, 240);
    prev?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }));
    next?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }));
    // Disattiva le frecce quando sei all'inizio/alla fine o se tutto è già visibile.
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max;
      $(".rail-nav")?.toggleAttribute("hidden", max <= 0);
    };
    rail.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------------------------------------------------------------------
     A4. CATALOGO — ricerca + categorie + ordinamento + "Load more"
     Lo "stato" (cosa cerco, quale categoria, quanti ne mostro) vive in un
     oggetto; ogni interazione lo cambia e chiama render(). Lo stato finisce
     anche nell'URL (?q=...&cat=...) così una ricerca si può condividere.
     ------------------------------------------------------------------------ */
  const priceNum = (p) => parseFloat(String(p.price || "").replace(/[^\d.,]/g, "").replace(",", ".")) || Infinity;
  // Normalizza per la ricerca: minuscole e senza accenti ("Città" → "citta").
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function renderCollection() {
    const grid = $("[data-grid]");
    if (!grid) return;
    const chipsEl = $("[data-filters]");
    const searchEl = $("[data-search]");
    const sortEl = $("[data-sort]");
    const moreEl = $("[data-more]");
    const statusEl = $("[data-status]");
    const emptyEl = $("[data-empty]");
    const PAGE = window.matchMedia("(min-width: 1100px)").matches ? 15 : 12;

    // Indice di ricerca calcolato una volta sola: veloce anche con 500+ prodotti.
    const index = PRODUCTS.map((p, order) => ({ p, order, text: norm([p.name, p.tagline, p.category, p.description, p.etsyTitle].join(" ")) }));

    const params = new URLSearchParams(location.search);
    const state = { q: params.get("q") || "", cat: params.get("cat") || "All", sort: params.get("sort") || "featured", shown: PAGE };

    // Categorie con conteggio, generate dai dati.
    const counts = PRODUCTS.reduce((m, p) => (p.category ? m.set(p.category, (m.get(p.category) || 0) + 1) : m), new Map());
    const cats = ["All", ...[...counts.keys()].sort()];
    if (!cats.includes(state.cat)) state.cat = "All";
    chipsEl.innerHTML = cats
      .map((c) => `<button class="chip-btn" type="button" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${esc(c)}<span>${c === "All" ? PRODUCTS.length : counts.get(c)}</span></button>`)
      .join("");
    if (cats.length < 3) chipsEl.hidden = true; // una sola categoria: i filtri non servono

    searchEl.value = state.q;
    sortEl.value = state.sort;

    const results = () => {
      const terms = norm(state.q).split(/\s+/).filter(Boolean);
      let list = index.filter(({ p, text }) => (state.cat === "All" || p.category === state.cat) && terms.every((t) => text.includes(t)));
      const by = {
        featured: (a, b) => (b.p.featured - a.p.featured) || (b.order - a.order),
        newest: (a, b) => b.order - a.order,
        "price-asc": (a, b) => priceNum(a.p) - priceNum(b.p),
        "price-desc": (a, b) => (priceNum(b.p) === Infinity ? -1 : priceNum(b.p)) - (priceNum(a.p) === Infinity ? -1 : priceNum(a.p)),
        az: (a, b) => a.p.name.localeCompare(b.p.name)
      };
      return list.sort(by[state.sort] || by.featured).map((x) => x.p);
    };

    const syncURL = () => {
      const u = new URL(location.href);
      ["q", "cat", "sort"].forEach((k) => u.searchParams.delete(k));
      if (state.q) u.searchParams.set("q", state.q);
      if (state.cat !== "All") u.searchParams.set("cat", state.cat);
      if (state.sort !== "featured") u.searchParams.set("sort", state.sort);
      history.replaceState(null, "", u);
    };

    // append = true → aggiunge solo le nuove card ("Load more") senza ridisegnare tutto.
    const render = (append = false) => {
      const list = results();
      const from = append ? grid.children.length : 0;
      const slice = list.slice(from, state.shown);
      if (append) grid.insertAdjacentHTML("beforeend", slice.map((p, i) => cardHTML(p, i)).join(""));
      else grid.innerHTML = slice.map((p, i) => cardHTML(p, i)).join("");
      const shown = Math.min(state.shown, list.length);
      statusEl.textContent = list.length ? `Showing ${shown} of ${list.length} product${list.length === 1 ? "" : "s"}` : "";
      moreEl.hidden = shown >= list.length;
      moreEl.textContent = `Load more (${list.length - shown})`;
      emptyEl.hidden = list.length > 0;
      syncURL();
    };

    chipsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.dataset.cat;
      state.shown = PAGE;
      $$("[data-cat]", chipsEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    // "Debounce": aspetta 150 ms dall'ultimo tasto prima di filtrare.
    let t;
    searchEl.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = searchEl.value.trim(); state.shown = PAGE; render(); }, 150);
    });
    sortEl.addEventListener("change", () => { state.sort = sortEl.value; state.shown = PAGE; render(); });
    moreEl.addEventListener("click", () => {
      const before = grid.children.length;
      state.shown += PAGE;
      render(true);
      // Accessibilità: il focus va sulla prima card appena aggiunta.
      grid.children[before]?.querySelector("a")?.focus({ preventScroll: true });
    });
    setCatalogFilter = (cat) => {
      state.cat = cats.includes(cat) ? cat : "All";
      state.q = ""; searchEl.value = ""; state.shown = PAGE;
      $$("[data-cat]", chipsEl).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cat === state.cat)));
      render();
    };
    $("[data-reset]")?.addEventListener("click", () => {
      Object.assign(state, { q: "", cat: "All", shown: PAGE });
      searchEl.value = "";
      $$("[data-cat]", chipsEl).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cat === "All")));
      render();
    });
    render();
  }

  /* ---------------------------------------------------------------------------
     A4. FOOTER + link allo shop + anno
     ------------------------------------------------------------------------ */
  function renderFooter() {
    $$("[data-shop-link]").forEach((a) => (a.href = SITE.shopUrl));
    const list = $("[data-footer-products]");
    if (list) {
      list.insertAdjacentHTML(
        "afterbegin",
        // Massimo 5 link (prima quelli in evidenza): con centinaia di prodotti il footer resta corto.
        [...featured, ...PRODUCTS.filter((p) => !p.featured)].filter(isLive).slice(0, 5)
          .map((p) => `<li><a href="${productPage(p)}">${esc(p.name)}</a></li>`).join("") +
          `<li><a href="./#collection">All products</a></li>`
      );
    }
    const social = $("[data-footer-social]");
    if (social && SITE.social && SITE.social.length) {
      $("ul", social).innerHTML = SITE.social.map((s) => `<li><a href="${esc(s.url)}" ${EXT}>${esc(s.label)} ↗</a></li>`).join("");
      social.hidden = false;
    }
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------------------------------------------------------------------------
     A5. SEO — dati strutturati dei prodotti (Schema.org Product)
     Google legge anche il JSON-LD aggiunto via JavaScript.
     ------------------------------------------------------------------------ */
  function productLD(p) {
    const ld = {
      "@type": "Product",
      name: p.etsyTitle || p.name,
      description: p.description,
      image: p.image,
      brand: { "@type": "Brand", name: SITE.name },
      category: p.category,
      url: `${SITE.url}/${productPage(p)}`
    };
    // L'offerta (prezzo) solo se abbiamo prezzo e link reali: niente dati inventati.
    const num = p.price && parseFloat(p.price.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isLive(p) && num) {
      ld.offers = { "@type": "Offer", price: num.toFixed(2), priceCurrency: /€/.test(p.price) ? "EUR" : "USD", availability: "https://schema.org/InStock", url: p.url };
    }
    return ld;
  }
  function injectLD(data) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", ...data });
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------------------------
     A5b. DESCRIZIONE COMPLETA (campo "details", la stessa dell'annuncio Etsy)
     Trasforma il testo semplice in HTML ordinato, con poche regole:
       - riga TUTTA MAIUSCOLA            → titoletto
       - riga che inizia con • - ✓       → elenco puntato (✓ = spunte)
       - riga che inizia con 1. 2. 3.    → passaggi numerati
       - "Etichetta: testo" in un elenco → l'etichetta va in grassetto
       - riga vuota                      → nuovo blocco
       - tutto il resto                  → paragrafo
     ------------------------------------------------------------------------ */
  function detailsHTML(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    let html = "";
    let list = null; // elenco in costruzione: { tag, kind, items }
    let started = false; // false finché non è comparso il primo blocco "vero"
    const flush = () => {
      if (list) html += `<${list.tag} class="dt-${list.kind}">${list.items.join("")}</${list.tag}>`;
      list = null;
    };
    const isHeading = (l) => {
      const letters = l.replace(/[^A-Za-z]/g, "");
      if (letters.length < 4 || l.length > 110 || /[.!?]$/.test(l)) return false;
      return letters.replace(/[^A-Z]/g, "").length / letters.length >= 0.75;
    };
    const label = (t) => {
      const m = t.match(/^([^:]{2,34}):\s+(.+)$/);
      // Niente grassetto se l'"etichetta" contiene una frase intera (es. "Editable in Canva. Fonts used")
      return m && !/[.!?]\s/.test(m[1]) ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(t);
    };
    const push = (tag, kind, item) => {
      if (!list || list.kind !== kind) { flush(); list = { tag, kind, items: [] }; }
      list.items.push(`<li>${label(item)}</li>`);
      started = true;
    };
    for (const raw of lines) {
      const l = raw.trim();
      let m;
      if (!l) { flush(); continue; }
      if ((m = l.match(/^([•✓✔✦*]|-|–)\s+(.+)$/))) { push("ul", /[✓✔]/.test(m[1]) ? "check" : "bullet", m[2]); continue; }
      if ((m = l.match(/^\d+[.)]\s+(.+)$/))) { push("ol", "steps", m[1]); continue; }
      flush();
      if (/^designed by .+ AI tools/i.test(l)) { html += `<p class="dt-note">${esc(l)}</p>`; continue; }
      if (isHeading(l)) {
        // Il primo titolo in assoluto è lo "slogan" dell'annuncio: lo mostriamo grande.
        html += started ? `<h3 class="dt-h">${esc(l.replace(/:$/, ""))}</h3>` : `<p class="dt-hook">${esc(l)}</p>`;
        started = true;
        continue;
      }
      html += `<p${started ? "" : ' class="dt-lead"'}>${esc(l)}</p>`;
      started = true;
    }
    flush();
    return html;
  }

  /* ---------------------------------------------------------------------------
     A6. PAGINA PRODOTTO (product.html?p=id)
     ------------------------------------------------------------------------ */
  function renderProductPage(root) {
    // URLSearchParams legge i parametri dopo il "?" dell'indirizzo.
    const id = new URLSearchParams(location.search).get("p");
    const p = PRODUCTS.find((x) => x.id === id);

    if (!p) {
      document.title = `Product not found — ${SITE.name}`;
      root.innerHTML = `
        <section class="notfound velvet"><div class="container">
          <p class="eyebrow" style="justify-content:center">404</p>
          <h1>This product isn't here.</h1>
          <p>It may have moved. Browse the collection or visit the Etsy shop.</p>
          <a class="btn" href="./#collection">Back to the collection</a>
        </div></section>`;
      return;
    }

    // Meta tag dinamici: titolo, descrizione, canonical, Open Graph.
    const pageUrl = `${SITE.url}/${productPage(p)}`;
    document.title = `${p.name} | ${SITE.name}`;
    $('meta[name="description"]')?.setAttribute("content", `${p.tagline || ""} ${p.description}`.trim().slice(0, 158));
    $('link[rel="canonical"]')?.setAttribute("href", pageUrl);
    $('meta[property="og:title"]')?.setAttribute("content", `${p.name} — ${SITE.name}`);
    $('meta[property="og:description"]')?.setAttribute("content", p.description);
    $('meta[property="og:url"]')?.setAttribute("content", pageUrl);
    $('meta[property="og:image"]')?.setAttribute("content", p.image);

    const images = [p.image, ...(p.gallery || [])];
    // Correlati: prima la stessa categoria, poi gli altri; massimo 4.
    const others = [...PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category), ...PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category)].slice(0, 4);

    root.innerHTML = `
      <section class="p-hero velvet" aria-labelledby="p-title">
        <div class="container">
          <nav aria-label="Breadcrumb"><ol class="crumbs">
            <li><a href="./">Home</a></li><li><a href="./#collection">Collection</a></li><li aria-current="page">${esc(p.name)}</li>
          </ol></nav>
          <div class="p-grid">
            <div class="gallery" data-reveal>
              <div class="gallery__main mat"${matBg(images[0])}>${img(images[0], { alt: p.etsyTitle || p.name, sizes: "(max-width: 900px) 100vw, 55vw", eager: true })}</div>
              ${
                images.length > 1
                  ? `<ul class="gallery__thumbs" aria-label="Product images">${images
                      .map(
                        (src, i) =>
                          `<li><button type="button" aria-pressed="${i === 0}" data-src="${esc(src)}" aria-label="Show image ${i + 1} of ${images.length}">${img(src, { alt: "", sizes: "80px" })}</button></li>`
                      )
                      .join("")}</ul>`
                  : ""
              }
            </div>
            <div class="p-info">
              <p class="eyebrow" data-hero>${esc(p.category || "")}</p>
              <h1 id="p-title" data-hero style="--d:.1s">${esc(p.name)}</h1>
              ${p.tagline ? `<p class="tag" data-hero style="--d:.15s">${esc(p.tagline)}</p>` : ""}
              <p class="desc" data-hero style="--d:.2s">${esc(p.description)}</p>
              ${p.details ? `<a class="p-more" href="#details" data-hero style="--d:.21s">Read the full description <span aria-hidden="true">↓</span></a>` : ""}
              ${p.audience ? `<p class="audience" data-hero style="--d:.22s"><b>Made for:</b> ${esc(p.audience)}</p>` : ""}
              <div data-hero style="--d:.25s">${specsHTML(p)}${includesHTML(p)}</div>
              <div class="buy" data-hero style="--d:.3s" data-main-buy>
                ${priceHTML(p)}
                ${
                  isLive(p)
                    ? `<a class="btn" ${etsyHref(p)}>Buy on Etsy ${ARROW}${NEW_TAB}</a>`
                    : `<span class="btn btn--ghost" aria-disabled="true">Coming soon</span>`
                }
              </div>
              <p class="note" data-hero style="--d:.35s">Digital download — no physical item is shipped. Checkout, payment and file delivery are handled securely by Etsy.</p>
            </div>
          </div>
        </div>
      </section>
      ${
        p.details
          ? `<section class="pd" id="details" aria-labelledby="pd-title"><div class="container pd__grid">
              <aside class="pd__side">
                <p class="eyebrow" data-reveal>Product details</p>
                <h2 class="pd__title" id="pd-title" data-reveal style="--d:.08s">About this <em>product</em>.</h2>
                <div class="pd__card" data-reveal style="--d:.16s">
                  <div class="pd__card-top">
                    <span class="pd__thumb">${img(p.image, { alt: "", sizes: "72px" })}</span>
                    <p class="pd__name">${esc(p.name)}${p.price ? `<small>${esc(p.price)}</small>` : ""}</p>
                  </div>
                  ${isLive(p) ? `<a class="btn btn--dark" ${etsyHref(p)}>Buy on Etsy ${ARROW}${NEW_TAB}</a>` : `<span class="btn btn--line" aria-disabled="true">Coming soon</span>`}
                  <ul class="pd__trust">
                    <li>Instant digital download</li>
                    <li>Secure checkout and delivery by Etsy</li>
                    <li>Nothing is shipped</li>
                  </ul>
                </div>
              </aside>
              <div class="pd__body">${detailsHTML(p.details)}</div>
            </div></section>`
          : ""
      }
      ${
        others.length
          ? `<section class="section collection" aria-labelledby="more-title"><div class="container">
              <header class="section__head"><div>
                <p class="eyebrow" data-reveal>Pairs well with</p>
                <h2 class="section__title" id="more-title" data-reveal style="--d:.1s">More from the <em>studio</em>.</h2>
              </div></header>
              <ul class="grid" aria-label="Related products">${others.map(cardHTML).join("")}</ul>
            </div></section>`
          : ""
      }
      ${
        isLive(p)
          ? `<div class="buybar" data-buybar aria-hidden="true">
              <p class="buybar__name">${esc(p.name)}${p.price ? `<small>${esc(p.price)}</small>` : ""}</p>
              <a class="btn btn--small" ${etsyHref(p)} tabindex="-1">Buy on Etsy ${ARROW}</a>
            </div>`
          : ""
      }`;

    document.body.classList.toggle("has-buybar", isLive(p));
    injectLD({ ...productLD(p), "@id": pageUrl });
    initGallery(root);
    initBuybar(root);
  }

  function initGallery(root) {
    const thumbs = $$(".gallery__thumbs button", root);
    thumbs.forEach((btn) =>
      btn.addEventListener("click", () => {
        const src = btn.dataset.src;
        const main = $(".gallery__main img", root); // sempre l'immagine attuale
        thumbs.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        $(".gallery__main", root).style.setProperty("--bg", `url('${src.replace(ETSY_SIZE, "il_570xN")}')`);
        // Piccola dissolvenza: abbasso l'opacità, cambio immagine al caricamento.
        main.style.opacity = ".2";
        const tmp = document.createElement("div");
        tmp.innerHTML = img(src, { alt: main.alt, sizes: main.sizes });
        const next = tmp.firstElementChild;
        next.addEventListener("load", () => requestAnimationFrame(() => (next.style.opacity = "1")), { once: true });
        next.style.opacity = ".2";
        main.replaceWith(next);
      })
    );
  }

  // Mostra la barra "Buy on Etsy" in basso solo quando il bottone principale
  // non è più visibile. IntersectionObserver = "avvisami quando un elemento
  // entra o esce dallo schermo", senza calcoli ad ogni scroll.
  function initBuybar(root) {
    const bar = $("[data-buybar]", root);
    const target = $("[data-main-buy]", root);
    if (!bar || !target) return;
    new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", String(!show));
      $("a", bar).tabIndex = show ? 0 : -1;
    }).observe(target);
  }

  /* ---------------------------------------------------------------------------
     B1. HEADER — sfondo allo scroll, si nasconde scendendo
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = $("[data-header]");
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 24);
      const goingDown = y > lastY;
      const menuOpen = document.body.classList.contains("menu-open");
      header.classList.toggle("is-hidden", goingDown && y > 480 && !menuOpen);
      lastY = y;
      ticking = false;
    };
    // requestAnimationFrame: aggiorniamo al massimo una volta per fotogramma,
    // anche se l'evento scroll scatta decine di volte.
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
    // Se l'header ha il focus da tastiera, deve essere visibile.
    header.addEventListener("focusin", () => header.classList.remove("is-hidden"));
  }

  /* ---------------------------------------------------------------------------
     B2. MENU MOBILE — accessibile: aria-expanded, Esc, focus intrappolato
     ------------------------------------------------------------------------ */
  function initMenu() {
    const toggle = $("[data-menu-toggle]");
    const menu = $("[data-menu]");
    if (!toggle || !menu) return;
    const label = $("[data-menu-label]", toggle);

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Close" : "Menu";
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) setTimeout(() => $("a", menu)?.focus(), 150);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    // Si chiude toccando un link o lo sfondo scuro fuori dal pannello.
    menu.addEventListener("click", (e) => { if (e.target === menu || e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (!menu.classList.contains("is-open")) return;
      if (e.key === "Escape") { setOpen(false); toggle.focus(); }
      // Focus trap: con Tab si gira solo tra il bottone e i link del menu.
      if (e.key === "Tab") {
        const items = [toggle, ...$$("a", menu)];
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  /* ---------------------------------------------------------------------------
     B2b. CONTENUTI DEL MENU — categorie (con quanti prodotti) e prodotti in
     evidenza, generati dal catalogo: aggiungi un prodotto e il menu si aggiorna.
     ------------------------------------------------------------------------ */
  function renderMenu() {
    const panel = $("[data-menu-base]");
    if (!panel) return;
    const base = panel.dataset.menuBase || "";
    const counts = PRODUCTS.reduce((m, p) => (p.category ? m.set(p.category, (m.get(p.category) || 0) + 1) : m), new Map());
    const cats = $("[data-menu-cats]", panel);
    if (cats && counts.size > 1) {
      cats.innerHTML = [...counts.keys()].sort()
        .map((c) => `<a href="${base}?cat=${encodeURIComponent(c)}#collection" data-cat-link="${esc(c)}">${esc(c)} <small>${counts.get(c)}</small></a>`).join("");
      $("[data-menu-cats-wrap]", panel).hidden = false;
    }
    const picks = $("[data-menu-picks]", panel);
    const list = [...featured, ...[...PRODUCTS].reverse().filter((p) => !p.featured)].slice(0, 3);
    if (picks && list.length) {
      const root = base === "/" ? "/" : ""; // la pagina 404 può stare in qualsiasi cartella
      picks.innerHTML = list.map((p) => `
        <li><a href="${root}${productPage(p)}">
          <span class="mm-thumb">${img(p.image, { alt: "", sizes: "48px" })}</span>
          <b>${esc(p.name)}</b>
          <em>${isLive(p) ? esc(p.price || "") : "Soon"}</em>
        </a></li>`).join("");
      $("[data-menu-picks-wrap]", panel).hidden = false;
    }
  }

  /* ---------------------------------------------------------------------------
     B3. SCROLL-SPY — evidenzia nel menu la sezione che stai guardando
     ------------------------------------------------------------------------ */
  function initSpy() {
    const links = $$("[data-spy]");
    if (!links.length) return;
    const map = new Map(links.map((a) => [a.getAttribute("href").replace("./", ""), a]));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        map.get(`#${en.target.id}`)?.setAttribute("aria-current", "true");
      }),
      { rootMargin: "-45% 0px -50% 0px" } // "attiva" quando la sezione passa a metà schermo
    );
    map.forEach((_, id) => { const s = $(id); if (s) io.observe(s); });
  }

  /* ---------------------------------------------------------------------------
     B4. REVEAL — gli elementi entrano quando arrivano nello schermo
     ------------------------------------------------------------------------ */
  function initReveal() {
    const els = $$("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } // una volta sola
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  // Animazione d'ingresso dell'hero: parte quando i font sono pronti (o al
  // massimo dopo 700 ms), così il titolo non "salta" cambiando font.
  function initIntro() {
    const go = () => $$(".hero, .p-hero").forEach((h) => h.classList.add("is-loaded"));
    if (reduceMotion) return go();
    const timeout = new Promise((r) => setTimeout(r, 700));
    Promise.race([document.fonts ? document.fonts.ready : timeout, timeout]).then(() => requestAnimationFrame(go));
  }

  /* ---------------------------------------------------------------------------
     B5. PARALLAX + DERIVA AL MOUSE
     data-parallax="0.05" → l'elemento si sposta del 5% della sua distanza
     dal centro dello schermo. Solo transform: niente ricalcolo del layout.
     ------------------------------------------------------------------------ */
  function initMotion() {
    if (reduceMotion) return;
    const items = $$("[data-parallax]").map((el) => ({ el, f: parseFloat(el.dataset.parallax) || 0, drift: parseFloat(el.dataset.drift) || 0, mx: 0, my: 0 }));
    if (!items.length) return;
    let raf = 0;
    const vh = () => window.innerHeight;
    const render = () => {
      raf = 0;
      items.forEach((it) => {
        const r = it.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh() + 200) return; // fuori schermo: salta
        const y = (r.top + r.height / 2 - vh() / 2) * it.f;
        it.el.style.transform = `translate3d(${it.mx.toFixed(1)}px, ${(y + it.my).toFixed(1)}px, 0)`;
      });
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(render); };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    render();

    // Deriva al movimento del mouse nell'hero (solo con mouse).
    const hero = $("[data-hero-section]");
    if (hero && finePointer) {
      hero.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5; // da -0.5 a 0.5
        const ny = e.clientY / window.innerHeight - 0.5;
        items.forEach((it) => { if (it.drift) { it.mx = nx * it.drift; it.my = ny * it.drift; } });
        request();
      });
      hero.addEventListener("pointerleave", () => { items.forEach((it) => { it.mx = it.my = 0; }); request(); });
    }
  }

  /* ---------------------------------------------------------------------------
     B6. TILT — leggera inclinazione 3D delle immagini featured al passaggio
     ------------------------------------------------------------------------ */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------------------------------------------------------------------------
     B7. EFFETTI — barra di avanzamento, luce che segue il mouse nell'hero,
     bottoni "magnetici". Tutto solo con transform/variabili CSS.
     ------------------------------------------------------------------------ */
  function initEffects() {
    const bar = $("[data-progress]");
    if (bar) {
      let raf = 0;
      const upd = () => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      };
      addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
      upd();
    }
    $$("[data-count-products]").forEach((el) => (el.textContent = PRODUCTS.length));
    if (reduceMotion || !finePointer) return;
    const hero = $("[data-hero-section]");
    hero?.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  /* ---------------------------------------------------------------------------
     AVVIO
     ------------------------------------------------------------------------ */
  const productRoot = $("[data-product-root]");
  if (productRoot) {
    renderProductPage(productRoot);
  } else {
    renderBento();
    renderSpotlight();
    renderFeatured();
    renderCollection();
    if (PRODUCTS.length) injectLD({ "@type": "ItemList", itemListElement: PRODUCTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: productLD(p) })) });
  }
  renderFooter();
  renderMenu();
  initHeader();
  initMenu();
  initSpy();
  initReveal();
  initIntro();
  initMotion();
  initTilt();
  initQuickView();
  initEffects();
})();
