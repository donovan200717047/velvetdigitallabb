/* =============================================================================
   VelvetDigitalLabb — fx.js (condiviso: homepage e pagina prodotto)
   -----------------------------------------------------------------------------
   1. Ricerca istantanea ⌘K / Ctrl+K / "/" su tutto il catalogo
   2. Newsletter: invio a Netlify Forms senza ricaricare la pagina
   3. Firma gigante nel footer: le lettere si "ingrossano" vicino al puntatore
   4. Transizione tra pagine con il sipario del logo
   ========================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const PRODUCTS = window.VDL_PRODUCTS || [];
  const SHOP = (window.VDL_SITE && window.VDL_SITE.shopUrl) || "https://www.etsy.com/shop/VelvetDigitalLabb";
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const thumb = (src) => String(src || "").replace(/il_(\d+xN|fullxfull)/, "il_340x270");
  // data-root="/" sul <body> (pagina 404): link assoluti, validi a qualunque profondità
  const pageOf = (p) => `${document.body.dataset.root || ""}product.html?p=${encodeURIComponent(p.id)}`;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (!isMac) $$("kbd").forEach((k) => { if (k.textContent === "⌘K") k.textContent = "Ctrl K"; });

  if (!fine) $$("[data-touch-copy]").forEach((el) => { el.textContent = el.dataset.touchCopy; });

  /* ------------------------------------------------------------ 1. RICERCA */
  const pal = document.createElement("div");
  pal.className = "pal";
  pal.hidden = true;
  pal.innerHTML = `
    <div class="pal__backdrop" data-pal-close></div>
    <div class="pal__box" role="dialog" aria-modal="true" aria-label="Search products">
      <div class="pal__bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input type="search" placeholder="Search templates, dashboards, workbooks…" aria-label="Search products" autocomplete="off" spellcheck="false" data-pal-input>
        <button type="button" class="pal__esc" data-pal-close>Esc</button>
      </div>
      <ul class="pal__list" role="listbox" data-pal-list></ul>
      <p class="pal__foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span>${PRODUCTS.length} products</span></p>
    </div>`;
  document.body.appendChild(pal);
  const input = $("[data-pal-input]", pal), list = $("[data-pal-list]", pal);
  const idx = PRODUCTS.map((p) => ({ p, t: norm([p.name, p.category, p.tagline, p.etsyTitle].join(" ")) }));
  let sel = 0, rows = [], last = null;

  const render = () => {
    const terms = norm(input.value).split(/\s+/).filter(Boolean);
    const hits = idx.filter((x) => terms.every((t) => x.t.includes(t))).map((x) => x.p);
    const res = (terms.length ? hits : PRODUCTS.slice().reverse()).slice(0, 8);
    rows = res.map((p) => ({ href: pageOf(p) }));
    rows.push({ href: SHOP, ext: true });
    list.innerHTML = res.map((p, i) => `
      <li role="option" id="pal-${i}" aria-selected="${i === sel}"><a href="${pageOf(p)}" data-i="${i}">
        <img src="${esc(thumb(p.image))}" alt="" width="48" height="48" loading="lazy">
        <span><b>${esc(p.name)}</b><small>${esc(p.category || "")}</small></span>
        <em>${esc(p.price || "")}</em></a></li>`).join("") +
      (terms.length && !res.length ? `<li class="pal__none">No products match “${esc(input.value)}”.</li>` : "") +
      `<li role="option" id="pal-${res.length}" aria-selected="${sel === res.length}"><a class="pal__etsy" data-i="${res.length}" href="${esc(SHOP)}" target="_blank" rel="noopener noreferrer">
        <span><b>Browse the full shop on Etsy</b><small>Opens in a new tab</small></span><em>↗</em></a></li>`;
    input.setAttribute("aria-activedescendant", `pal-${sel}`);
  };
  const move = (d) => {
    sel = (sel + d + rows.length) % rows.length; render();
    $(`#pal-${sel}`, list)?.scrollIntoView({ block: "nearest" });
  };
  const open = () => {
    if (!pal.hidden) return;
    last = document.activeElement; sel = 0; input.value = ""; render();
    pal.hidden = false; document.documentElement.classList.add("pal-open");
    requestAnimationFrame(() => { pal.classList.add("is-open"); input.focus(); });
  };
  const close = () => {
    if (pal.hidden) return;
    pal.classList.remove("is-open"); document.documentElement.classList.remove("pal-open");
    setTimeout(() => { pal.hidden = true; }, reduce ? 0 : 220);
    last && last.focus && last.focus();
  };
  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); $(`[data-i="${sel}"]`, list)?.click(); }
  });
  list.addEventListener("pointermove", (e) => { const a = e.target.closest("[data-i]"); if (a && +a.dataset.i !== sel) { sel = +a.dataset.i; $$("[role=option]", list).forEach((o, k) => o.setAttribute("aria-selected", String(k === sel))); } });
  pal.addEventListener("click", (e) => { if (e.target.closest("[data-pal-close]")) close(); });
  addEventListener("keydown", (e) => {
    const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "") && document.activeElement !== input;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); pal.hidden ? open() : close(); }
    else if (e.key === "/" && !typing && pal.hidden) { e.preventDefault(); open(); }
    else if (e.key === "Escape") close();
    else if (e.key === "Tab" && !pal.hidden) { // focus resta nel pannello
      const f = $$("input, a, button", pal.querySelector(".pal__box")); const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-palette-open]")) { e.preventDefault(); open(); } });

  /* --------------------------------------------------------- 2. NEWSLETTER */
  $$("[data-newsletter]").forEach((form) => {
    const msg = $("[data-nl-msg]", form), label = $("[data-nl-label]", form), btn = $("button[type=submit]", form);
    const original = msg ? msg.textContent : "";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = "Please enter a valid email address."; form.classList.add("is-error"); form.email.focus(); return; }
      form.classList.remove("is-error"); btn.disabled = true; label.textContent = "Sending…";
      try {
        const r = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(form)).toString() });
        if (!r.ok) throw new Error(r.status);
        form.classList.add("is-done"); label.textContent = "You're in ✓"; msg.textContent = "Thanks! You'll hear from us when something new drops."; form.reset();
      } catch (err) {
        btn.disabled = false; label.textContent = "Subscribe"; form.classList.add("is-error");
        msg.textContent = "Something went wrong — please try again in a moment.";
        setTimeout(() => { form.classList.remove("is-error"); msg.textContent = original; }, 5000);
      }
    });
  });

  /* ------------------------------------------- 3. FIRMA GIGANTE DEL FOOTER */
  const wm = $("[data-wordmark]");
  if (wm) {
    const txt = wm.textContent;
    wm.innerHTML = [...txt].map((c, i) => `<span class="${i >= 6 && i < 13 ? "is-acc" : ""}">${esc(c)}</span>`).join("");
    if ("IntersectionObserver" in window) {
      const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { wm.classList.add("is-in"); o.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
      o.observe(wm.parentElement); // il testo "tagliato" non viene visto dall'observer: osservo il contenitore
    } else wm.classList.add("is-in");
  }

  /* ------------------------------------------- 4. TRANSIZIONE TRA PAGINE */
  const cur = document.createElement("div");
  cur.className = "curtain"; cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<svg viewBox="0 0 100 100"><polygon points="22,24 36,24 50,63 50,80 43,80" fill="#f2eee8"/><polygon points="50,63 64,24 78,24 57,80 50,80" fill="#e0552d"/><path d="M79 9l2.2 4.4 4.4 2.2-4.4 2.2L79 22.2l-2.2-4.4-4.4-2.2 4.4-2.2z" fill="#e0552d"/></svg>';
  document.body.appendChild(cur);
  if (reduce) document.documentElement.classList.remove("came");
  let came = false;
  try { came = sessionStorage.getItem("vdl-trans") === "1"; sessionStorage.removeItem("vdl-trans"); } catch (e) {}
  if (came && !reduce) {
    cur.classList.add("is-cover", "no-anim");
    document.documentElement.classList.remove("came");
    requestAnimationFrame(() => requestAnimationFrame(() => { cur.classList.remove("no-anim"); cur.classList.add("is-leave"); }));
    setTimeout(() => {
      cur.classList.add("no-anim"); cur.classList.remove("is-cover", "is-leave");
      requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.remove("no-anim")));
    }, 900);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    e.preventDefault();
    try { sessionStorage.setItem("vdl-trans", "1"); } catch (err) {}
    cur.classList.add("is-cover");
    setTimeout(() => { location.href = url.href; }, 480);
  });
  // tornando indietro con il browser, il sipario non deve restare chiuso
  addEventListener("pageshow", (e) => { if (e.persisted) cur.classList.remove("is-cover", "is-leave"); });
})();
