/* =============================================================================
   VelvetDigitalLabb — product.js (pagina prodotto stile marketplace)
   -----------------------------------------------------------------------------
   Galleria con miniature + zoom al passaggio + schermo intero (frecce, swipe),
   box d'acquisto fisso, "About this item", specifiche, consegna, FAQ,
   prodotti correlati, visti di recente, barra d'acquisto su mobile.
   Il pagamento avviene SEMPRE su Etsy: il bottone porta alla scheda Etsy.
   ========================================================================== */
(() => {
  "use strict";
  const root = document.querySelector("[data-pdp]");
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const SITE = window.VDL_SITE || { name: "VelvetDigitalLabb", url: "https://velvetdigitallabb.netlify.app", shopUrl: "https://www.etsy.com/shop/VelvetDigitalLabb" };
  const PRODUCTS = window.VDL_PRODUCTS || [];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ETSY = /il_(\d+xN|fullxfull)/;
  const sized = (src, w) => (ETSY.test(src || "") ? src.replace(ETSY, `il_${w}xN`) : src);
  const pageOf = (p) => `product.html?p=${encodeURIComponent(p.id)}`;
  const live = (p) => /^https:\/\//.test(p.url || "");
  const ICON = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    ext: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  };

  const id = new URLSearchParams(location.search).get("p");
  const i0 = PRODUCTS.findIndex((x) => x.id === id);
  const p = PRODUCTS[i0];

  if (!p) {
    document.title = `Product not found — ${SITE.name}`;
    root.innerHTML = `<section class="pdp-404"><div class="container">
      <p class="kicker">404</p><h1>This product isn't here.</h1>
      <p>It may have moved. Search the shop or browse the full collection.</p>
      <div class="pdp-404__ctas"><button class="btn" type="button" data-palette-open>Search products</button><a class="btn btn--ghost" href="./#collection">Back to the shop</a></div>
    </div></section>`;
    return;
  }

  /* ----------------------------------------------------------- META + SEO */
  const pageUrl = `${SITE.url}/${pageOf(p)}`;
  document.title = `${p.name} | ${SITE.name}`;
  const desc = `${p.tagline || ""} ${p.description || ""}`.trim().slice(0, 158);
  $('meta[name="description"]')?.setAttribute("content", desc);
  $("[data-canonical]")?.setAttribute("href", pageUrl);
  $('meta[property="og:title"]')?.setAttribute("content", `${p.name} — ${SITE.name}`);
  $('meta[property="og:description"]')?.setAttribute("content", p.description || "");
  $('meta[property="og:url"]')?.setAttribute("content", pageUrl);
  $('meta[property="og:image"]')?.setAttribute("content", sized(p.image, 1140));
  const num = parseFloat(String(p.price || "").replace(/[^\d.,]/g, "").replace(",", ".")) || undefined;
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Product", name: p.name, description: p.description, image: [p.image, ...(p.gallery || [])], category: p.category,
        brand: { "@type": "Brand", name: SITE.name }, url: pageUrl,
        ...(num && live(p) ? { offers: { "@type": "Offer", price: num.toFixed(2), priceCurrency: /\$/.test(p.price) ? "USD" : "EUR", availability: "https://schema.org/InStock", url: p.url } } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
        { "@type": "ListItem", position: 2, name: p.category || "Shop", item: `${SITE.url}/#collection` },
        { "@type": "ListItem", position: 3, name: p.name, item: pageUrl } ] },
    ],
  });
  document.head.appendChild(ld);

  /* ------------------------------------------------------------- MARKUP */
  const images = [p.image, ...(p.gallery || [])].filter(Boolean);
  const related = [...PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category), ...PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category).reverse()].slice(0, 6);
  const prev = PRODUCTS[(i0 - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(i0 + 1) % PRODUCTS.length];
  const buyHref = live(p) ? esc(p.url) : esc(SITE.shopUrl || "https://www.etsy.com/shop/VelvetDigitalLabb");
  const price = live(p) ? esc(p.price || "") : "Coming soon";
  const isCode = /html|css|javascript|js\b/i.test([p.etsyTitle, p.description, ...(p.specs || []).map((s) => (Array.isArray(s) ? s[1] : s.value))].join(" "));
  const tool = isCode ? "a code editor (VS Code is free)" : /sheet|excel/i.test(p.etsyTitle + p.name) ? "Google Sheets or Excel" : "a free Canva account";

  const card = (x) => `
    <li class="mini"><a href="${pageOf(x)}">
      <span class="mini__img"><img src="${esc(sized(x.image, 570))}" alt="" loading="lazy" width="570" height="570">${x.badge ? `<i>${esc(x.badge)}</i>` : ""}</span>
      <span class="mini__cat">${esc(x.category || "")}</span>
      <b class="mini__name">${esc(x.name)}</b>
      <span class="mini__price">${live(x) ? esc(x.price || "") : "Coming soon"}</span>
    </a></li>`;

  const faqs = [
    ["How do I receive my files?", "Right after checkout on Etsy your download is available in your Etsy account under Purchases — and Etsy also emails you the link."],
    ["Is this a physical product?", "No. This is a digital download — nothing will be shipped."],
    ["What do I need to use it?", `Just ${tool}. Every product includes a step-by-step guide.`],
    ["Where is the payment processed?", "All payments are handled securely by Etsy. This website never sees your payment details."],
    ["I have a question before buying.", "Send us a message through our Etsy shop — we're happy to help."],
  ];

  root.innerHTML = `
  <div class="container">
    <nav class="pdp-crumbs" aria-label="Breadcrumb"><ol>
      <li><a href="./">Home</a></li><li><a href="./#collection">Shop</a></li>
      <li><a href="./#collection" data-cat="${esc(p.category || "")}">${esc(p.category || "Products")}</a></li>
      <li aria-current="page">${esc(p.name)}</li></ol>
      <div class="pdp-step"><a href="${pageOf(prev)}" aria-label="Previous product: ${esc(prev.name)}">${ICON.arrowL}</a><span>${i0 + 1} / ${PRODUCTS.length}</span><a href="${pageOf(next)}" aria-label="Next product: ${esc(next.name)}">${ICON.arrowR}</a></div>
    </nav>

    <div class="pdp-grid">
      <!-- Galleria -->
      <section class="gal" aria-label="Product images">
        <ul class="gal__thumbs" role="tablist">${images.map((src, i) => `
          <li><button type="button" role="tab" aria-selected="${i === 0}" aria-label="Image ${i + 1} of ${images.length}" data-go="${i}"><img src="${esc(sized(src, 570))}" alt="" loading="${i < 6 ? "eager" : "lazy"}" width="80" height="80"></button></li>`).join("")}
        </ul>
        <div class="gal__stage" data-stage>
          ${p.badge ? `<span class="gal__badge">${esc(p.badge)}</span>` : ""}
          <div class="gal__track" data-track>${images.map((src, i) => `
            <figure class="gal__slide" aria-hidden="${i !== 0}"><img src="${esc(sized(src, 794))}" data-zoom="${esc(sized(src, 1140))}" alt="${i === 0 ? esc(p.etsyTitle || p.name) : `${esc(p.name)} — image ${i + 1}`}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} width="794" height="794"></figure>`).join("")}
          </div>
          <button type="button" class="gal__nav gal__nav--l" data-step="-1" aria-label="Previous image">${ICON.arrowL}</button>
          <button type="button" class="gal__nav gal__nav--r" data-step="1" aria-label="Next image">${ICON.arrowR}</button>
          <button type="button" class="gal__full" data-full aria-label="View images full screen">${ICON.expand}</button>
          <p class="gal__count"><b data-count>1</b> / ${images.length}</p>
          <p class="gal__hint">${fine ? "Hover to zoom · click for full screen" : "Swipe · tap for full screen"}</p>
        </div>
      </section>

      <!-- Informazioni -->
      <section class="info" aria-labelledby="p-title">
        <a class="info__cat" href="./#collection" data-cat="${esc(p.category || "")}">${esc(p.category || "")}</a>
        <h1 id="p-title" class="info__title">${esc(p.name)}</h1>
        ${p.etsyTitle ? `<p class="info__sub">${esc(p.etsyTitle)}</p>` : ""}
        <p class="info__by">by <a href="./">${esc(SITE.name)}</a> · Sold on Etsy</p>
        <hr>
        <div class="info__price"><span class="info__amt">${price}</span><span class="info__vat">Digital download${live(p) ? " · final price shown at Etsy checkout" : ""}</span></div>
        ${p.tagline ? `<p class="info__tag">${esc(p.tagline)}</p>` : ""}
        ${(p.specs || []).length ? `<table class="pspecs"><tbody>${p.specs.map((s) => `<tr><th scope="row">${esc(Array.isArray(s) ? s[0] : s.label)}</th><td>${esc(Array.isArray(s) ? s[1] : s.value)}</td></tr>`).join("")}<tr><th scope="row">Format</th><td>Instant digital download</td></tr></tbody></table>` : ""}
        <hr>
        <h2 class="info__h">About this item</h2>
        <ul class="about">${(p.includes || []).map((x) => `<li>${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul>
      </section>

      <!-- Box d'acquisto -->
      <aside class="buybox" aria-label="Purchase">
        <div class="buybox__in">
          <p class="buybox__price">${price}</p>
          <p class="buybox__stock">${live(p) ? `<i></i> Available · instant download` : "Coming soon"}</p>
          <ul class="buybox__perks">
            <li>${ICON.bolt}<span>Files ready right after checkout</span></li>
            <li>${ICON.lock}<span>Secure payment handled by Etsy</span></li>
            <li>${ICON.book}<span>Step-by-step guide included</span></li>
            <li>${ICON.file}<span>Digital product · nothing is shipped</span></li>
          </ul>
          <a class="btn buybox__cta" href="${buyHref}" data-buy rel="noopener">${live(p) ? "Buy on Etsy" : "Visit the Etsy shop"} ${ICON.ext}</a>
          <button type="button" class="buybox__share" data-share>${ICON.share}<span data-share-label>Share this product</span></button>
          <dl class="buybox__meta">
            <div><dt>Sold by</dt><dd>${esc(SITE.name)}</dd></div>
            <div><dt>Checkout</dt><dd>Etsy</dd></div>
            <div><dt>Delivery</dt><dd>Digital download</dd></div>
          </dl>
          <p class="buybox__note">You'll complete your purchase on Etsy.</p>
        </div>
      </aside>
    </div>

    <!-- Descrizione -->
    <section class="pdp-sec pdp-desc" aria-labelledby="d-title">
      <div>
        <p class="kicker">Product description</p>
        <h2 id="d-title">${esc(p.tagline || p.name)}</h2>
      </div>
      <div class="pdp-desc__body">
        <p>${esc(p.description || "")}</p>
        ${p.audience ? `<p class="pdp-desc__who"><b>Made for</b>${esc(p.audience)}</p>` : ""}
      </div>
    </section>

    <!-- Come funziona l'acquisto -->
    <section class="pdp-sec" aria-labelledby="h-title">
      <p class="kicker">How it works</p>
      <h2 id="h-title" class="pdp-sec__title">From click to files in <em>minutes.</em></h2>
      <ol class="flow">
        <li><span>01</span><b>Buy on Etsy</b><p>Tap “Buy on Etsy” and check out securely.</p></li>
        <li><span>02</span><b>Download</b><p>Your files appear in Etsy → Purchases instantly.</p></li>
        <li><span>03</span><b>Customize</b><p>Open it in ${esc(tool.replace(/ \(.*\)/, ""))} and follow the guide.</p></li>
        <li><span>04</span><b>Launch</b><p>Publish or use it — it's yours.</p></li>
      </ol>
    </section>

    <!-- FAQ -->
    <section class="pdp-sec pdp-faq" aria-labelledby="f-title">
      <div><p class="kicker">Questions</p><h2 id="f-title" class="pdp-sec__title">Good to <em>know.</em></h2></div>
      <div class="faq">${faqs.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q)}<i aria-hidden="true"></i></summary><p>${esc(a)}</p></details>`).join("")}</div>
    </section>

    <!-- Correlati -->
    ${related.length ? `<section class="pdp-sec" aria-labelledby="r-title">
      <div class="pdp-sec__row"><h2 id="r-title" class="pdp-sec__title">You may also <em>like.</em></h2><a class="link-underline" href="./#collection">See all products</a></div>
      <ul class="minis" data-rail>${related.map(card).join("")}</ul>
    </section>` : ""}

    <section class="pdp-sec" aria-labelledby="rv-title" data-recent hidden>
      <h2 id="rv-title" class="pdp-sec__title">Recently <em>viewed.</em></h2>
      <ul class="minis minis--sm" data-recent-list></ul>
    </section>
  </div>

  <!-- Barra d'acquisto su mobile -->
  <div class="buybar" data-buybar>
    <div><b>${esc(p.name)}</b><span>${price}</span></div>
    <a class="btn" href="${buyHref}" data-buy rel="noopener">${live(p) ? "Buy on Etsy" : "Etsy shop"}</a>
  </div>

  <!-- Schermo intero -->
  <div class="lightbox" data-lb hidden role="dialog" aria-modal="true" aria-label="Product images">
    <button type="button" class="lightbox__x" data-lb-close aria-label="Close">×</button>
    <button type="button" class="lightbox__nav lightbox__nav--l" data-lb-step="-1" aria-label="Previous image">${ICON.arrowL}</button>
    <img alt="" data-lb-img>
    <button type="button" class="lightbox__nav lightbox__nav--r" data-lb-step="1" aria-label="Next image">${ICON.arrowR}</button>
    <p class="lightbox__count" data-lb-count></p>
  </div>

  <!-- Reindirizzamento a Etsy -->
  <div class="toetsy" data-toetsy aria-live="polite">
    <div class="toetsy__in">
      <svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="22,24 36,24 50,63 50,80 43,80" fill="#f2eee8"/><polygon points="50,63 64,24 78,24 57,80 50,80" fill="#e0552d"/><path d="M79 9l2.2 4.4 4.4 2.2-4.4 2.2L79 22.2l-2.2-4.4-4.4-2.2 4.4-2.2z" fill="#e0552d"/></svg>
      <p class="toetsy__t">Taking you to Etsy</p>
      <p class="toetsy__s">${ICON.lock} Secure checkout · ${esc(p.name)}</p>
      <i class="toetsy__bar"></i>
    </div>
  </div>`;

  /* ------------------------------------------------------------ GALLERIA */
  const stage = $("[data-stage]"), track = $("[data-track]");
  const slides = $$(".gal__slide", track), thumbs = $$("[data-go]");
  let cur = 0;
  const go = (n, fromScroll) => {
    cur = (n + images.length) % images.length;
    thumbs.forEach((t, k) => t.setAttribute("aria-selected", String(k === cur)));
    slides.forEach((s, k) => s.setAttribute("aria-hidden", String(k !== cur)));
    $("[data-count]").textContent = cur + 1;
    if (!fromScroll) track.scrollTo({ left: cur * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    thumbs[cur]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  thumbs.forEach((t) => {
    t.addEventListener("click", () => go(+t.dataset.go));
    if (fine) t.addEventListener("mouseenter", () => go(+t.dataset.go)); // come sui marketplace
  });
  $$("[data-step]", stage).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); go(cur + +b.dataset.step); }));
  let st;
  track.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => { const n = Math.round(track.scrollLeft / track.clientWidth); if (n !== cur) go(n, true); }, 80); }, { passive: true });

  // Zoom al passaggio del mouse: l'immagine si ingrandisce seguendo il puntatore
  if (fine) {
    stage.addEventListener("pointermove", (e) => {
      if (e.target.closest("button")) { stage.classList.remove("is-zoom"); return; }
      const img = slides[cur].querySelector("img");
      if (img.dataset.hi !== "1") { img.dataset.hi = "1"; const hi = new Image(); hi.onload = () => { img.src = hi.src; }; hi.src = img.dataset.zoom; }
      const r = stage.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      stage.classList.add("is-zoom");
    });
    stage.addEventListener("pointerleave", () => stage.classList.remove("is-zoom"));
  }

  // Schermo intero
  const lb = $("[data-lb]"), lbImg = $("[data-lb-img]"), lbCount = $("[data-lb-count]");
  let lbI = 0, lastFocus = null;
  const lbShow = (n) => { lbI = (n + images.length) % images.length; lbImg.src = sized(images[lbI], 1140); lbImg.alt = `${p.name} — image ${lbI + 1}`; lbCount.textContent = `${lbI + 1} / ${images.length}`; };
  const lbOpen = () => { lastFocus = document.activeElement; lbShow(cur); lb.hidden = false; document.documentElement.classList.add("pal-open"); requestAnimationFrame(() => lb.classList.add("is-open")); $("[data-lb-close]").focus(); };
  const lbClose = () => { lb.classList.remove("is-open"); document.documentElement.classList.remove("pal-open"); setTimeout(() => { lb.hidden = true; }, 250); go(lbI); lastFocus?.focus(); };
  stage.addEventListener("click", (e) => { if (!e.target.closest(".gal__nav")) lbOpen(); });
  $("[data-lb-close]").addEventListener("click", lbClose);
  lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
  $$("[data-lb-step]").forEach((b) => b.addEventListener("click", () => lbShow(lbI + +b.dataset.lbStep)));
  addEventListener("keydown", (e) => {
    if (!lb.hidden) {
      if (e.key === "Escape") lbClose();
      else if (e.key === "ArrowRight") lbShow(lbI + 1);
      else if (e.key === "ArrowLeft") lbShow(lbI - 1);
    }
  });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) lbShow(lbI + (dx < 0 ? 1 : -1)); sx = null; });

  /* --------------------------------------------------- ACQUISTO SU ETSY */
  const toEtsy = $("[data-toetsy]");
  $$("[data-buy]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // nuova scheda: lascia fare al browser
    e.preventDefault();
    toEtsy.classList.add("is-on");
    setTimeout(() => { location.href = a.href; }, reduce ? 150 : 1100);
  }));
  addEventListener("pageshow", (e) => { if (e.persisted) toEtsy.classList.remove("is-on"); });

  // Condividi: menu nativo del telefono, altrimenti copia il link
  const shareBtn = $("[data-share]"), shareLbl = $("[data-share-label]");
  shareBtn.addEventListener("click", async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: p.tagline || p.name, url: pageUrl });
      else { await navigator.clipboard.writeText(pageUrl); shareLbl.textContent = "Link copied ✓"; setTimeout(() => { shareLbl.textContent = "Share this product"; }, 2200); }
    } catch (err) { /* condivisione annullata */ }
  });

  // Barra d'acquisto mobile: compare quando il box principale esce dallo schermo
  const buybar = $("[data-buybar]"), box = $(".buybox__cta");
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => buybar.classList.toggle("is-on", !e.isIntersecting && e.boundingClientRect.top < 0)).observe(box);

  // Filtro categoria: salvato e letto dalla homepage
  $$("[data-cat]").forEach((a) => a.addEventListener("click", () => { try { sessionStorage.setItem("vdl-cat", a.dataset.cat); } catch (err) {} }));

  /* ------------------------------------------------- VISTI DI RECENTE */
  try {
    const KEY = "vdl-recent";
    const seen = JSON.parse(localStorage.getItem(KEY) || "[]").filter((x) => x !== p.id);
    const items = seen.map((x) => PRODUCTS.find((y) => y.id === x)).filter(Boolean).slice(0, 6);
    if (items.length) { $("[data-recent-list]").innerHTML = items.map(card).join(""); $("[data-recent]").hidden = false; }
    localStorage.setItem(KEY, JSON.stringify([p.id, ...seen].slice(0, 12)));
  } catch (err) { /* archiviazione non disponibile: la sezione resta nascosta */ }

  /* ---------------------------------------------------- ENTRATA DOLCE */
  requestAnimationFrame(() => root.classList.add("is-ready"));
})();
