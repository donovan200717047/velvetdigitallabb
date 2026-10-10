/* =============================================================================
   VelvetDigitalLabb — home.js (solo homepage)
   -----------------------------------------------------------------------------
   1. Entrata cinematografica (classe .is-ready quando i font sono pronti)
   2. Scena hero "sticky": la scroll diventa un numero 0→1 (--p) e da lì
      ricaviamo --t (testo che esce), --a (strati che si separano), --s (frase)
   3. Inclinazione 3D leggera degli strati seguendo il mouse
   4. Collezione: indice editoriale + anteprima sticky + filtri + ricerca
   5. Filosofia: parole che si "accendono" scorrendo
   6. Pilastri: sezione sticky con 4 parole che si alternano
   Tutto vanilla JS, nessuna libreria. Ogni calcolo legato alla scroll gira
   al massimo una volta per fotogramma (requestAnimationFrame).
   ========================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const PRODUCTS = window.VDL_PRODUCTS || [];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // clamp + "rimappa": porta x dall'intervallo [a,b] a [0,1], fermandosi ai bordi.
  const map = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  // easing "easeInOutCubic": movimento morbido all'inizio e alla fine.
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  /* ------------------------------- ANNUNCIO "NEW DROP" NELL'HERO
     Mostra da solo l'ultimo prodotto con etichetta "New" (o l'ultimo
     aggiunto): quando pubblichi una novità dal pannello, l'annuncio si
     aggiorna senza toccare il codice. */
  const drop = $("[data-drop]");
  if (drop && PRODUCTS.length) {
    const p = [...PRODUCTS].reverse().find((x) => /new/i.test(x.badge || "")) || PRODUCTS[PRODUCTS.length - 1];
    drop.href = `product.html?p=${encodeURIComponent(p.id)}`;
    drop.innerHTML = `<span class="drop__tag">New</span><span class="drop__txt"><b>${esc(p.name)}</b>${p.tagline ? `<span> — ${esc(p.tagline)}</span>` : ""}</span><span class="drop__go" aria-hidden="true">→</span>`;
    drop.setAttribute("aria-label", `New release: ${p.name}`);
    drop.hidden = false;
  }

  /* ------------------------------------------- INTRO (una volta per sessione) */
  const introEl = $("[data-intro]");
  if (introEl) {
    let seen = false;
    try { seen = sessionStorage.getItem("vdl-intro") === "1"; sessionStorage.setItem("vdl-intro", "1"); } catch (e) {}
    if (reduce || seen) introEl.remove();
    else document.documentElement.classList.add("has-intro"), setTimeout(() => { introEl.classList.add("is-done"); setTimeout(() => introEl.remove(), 1400); }, 1500);
  }

  /* ---------------------------------------------------------------- 1. ENTRATA */
  const scene = $("[data-scene]");
  const ready = () => setTimeout(() => scene?.classList.add("is-ready"), document.querySelector(".has-intro") ? 1500 : 0);
  if (reduce) ready();
  else Promise.race([document.fonts ? document.fonts.ready : 0, new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(ready));

  /* ---------------------------------------------------- 2. SCROLL → VARIABILI */
  // Progresso di una sezione "sticky": 0 quando inizia, 1 quando finisce.
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? map(-r.top, 0, total) : 0;
  };

  const pillars = $("[data-pillars]");
  const pillarItems = pillars ? $$(".pillar", pillars) : [];
  const words = [];
  let ticking = false;

  function update() {
    ticking = false;
    // Hero: scorrendo, i testi salgono e sfumano dolcemente (solo lettura di scrollY,
    // nessun blocco: la pagina scorre sempre in modo normale)
    if (scene && !reduce) scene.style.setProperty("--t", map(scrollY, 0, innerHeight * 0.9).toFixed(4));
    if (pillars && !reduce) {
      const p = progressOf(pillars);
      const i = Math.min(pillarItems.length - 1, Math.floor(p * pillarItems.length * 0.999));
      pillarItems.forEach((el, k) => {
        el.classList.toggle("is-on", k === i);
        el.classList.toggle("is-past", k < i);
      });
      pillars.style.setProperty("--pp", p.toFixed(4));
      const n = $("[data-pillars-n]", pillars);
      if (n) n.textContent = String(i + 1).padStart(2, "0");
    }
    if (words.length && !reduce) {
      // Le parole si accendono mentre il paragrafo attraversa lo schermo
      const r = words.host.getBoundingClientRect();
      const p = map(innerHeight * 0.85 - r.top, 0, r.height + innerHeight * 0.35);
      const lit = Math.round(p * words.length);
      words.forEach((w, k) => w.classList.toggle("is-lit", k < lit));
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);


  /* ------------------------------------- 2b. HERO: GLI STRATI SI ASSEMBLANO
     All'apertura i 4 strati di un sito (HTML, CSS, JS, Launch) arrivano
     separati, con le etichette, e in ~2,4 s si uniscono nel browser finito.
     Parte da sola, una volta: NON intercetta rotella, touch o tastiera,
     quindi lo scorrimento della pagina non viene mai bloccato.
     --a = 1 strati separati · --a = 0 sito assemblato
     ------------------------------------------------------------------------ */
  const setA = (v) => {
    scene.style.setProperty("--a", v.toFixed(4));
    window.VDL_GL && window.VDL_GL.setBoost && window.VDL_GL.setBoost(v); // il velluto "respira" con gli strati
  };
  if (scene) {
    if (reduce) setA(0);
    else {
      setA(1);
      const wait = document.documentElement.classList.contains("has-intro") ? 3000 : 1600;
      setTimeout(() => {
        const t0 = performance.now(), dur = 2400;
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          setA(1 - ease(k));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, wait);
    }
  }

  /* ------------------------------------------------- 3. TILT 3D DEGLI STRATI
     Morbido: il valore insegue il mouse un po' alla volta (niente scatti). */
  const tilt = $("[data-tilt-scene]");
  if (tilt && fine && !reduce) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const step = () => {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      tilt.style.setProperty("--rx", `${cx.toFixed(2)}deg`);
      tilt.style.setProperty("--ry", `${cy.toFixed(2)}deg`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(step) : 0;
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(step); };
    scene.addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 6; ty = -(e.clientY / innerHeight - 0.5) * 4; go(); });
    scene.addEventListener("pointerleave", () => { tx = 0; ty = 0; go(); });
  }


  /* ------------------------------------------------------------- 5. PAROLE */
  const philo = $("[data-words]");
  if (philo) {
    const KEY = /^(digital|tools|professional)/i; // parole evidenziate in arancio
    philo.innerHTML = philo.textContent.trim().split(/\s+/)
      .map((w) => `<span class="w${KEY.test(w) ? " is-key" : ""}">${esc(w)}</span>`).join(" ");
    words.push(...$$(".w", philo));
    words.host = philo;
    if (reduce) words.forEach((w) => w.classList.add("is-lit"));
  }

  /* ----------------------------------------------------- 4. NEGOZIO
     Card piccole stile Etsy/Vinted. Si vedono SEMPRE tutti i prodotti;
     la paginazione 1-2-3 compare da sola solo oltre 24 risultati.
     ------------------------------------------------------------------------ */
  const list = $("[data-c2-list]");
  if (list) {
    const tabsEl = $("[data-c2-tabs]");
    const search = $("[data-c2-search]");
    const sortEl = $("[data-c2-sort]");
    const pager = $("[data-pager]");
    const empty = $("[data-c2-empty]");
    const total = $("[data-total]");
    const PER = 24;
    const EXT = 'target="_blank" rel="noopener noreferrer"';
    const live = (p) => /^https:\/\//.test(p.url || "");
    const page = (p) => `product.html?p=${encodeURIComponent(p.id)}`;
    const ETSY = /il_(\d+xN|fullxfull)/;
    const sized = (src, w) => (ETSY.test(src) ? src.replace(ETSY, `il_${w}xN`) : src);
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const num = (s) => parseFloat(String(s || "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

    const all = PRODUCTS.map((p, i) => ({ p, i, price: num(p.price), text: norm([p.name, p.category, p.tagline, p.description].join(" ")) }));
    const counts = PRODUCTS.reduce((m, p) => m.set(p.category, (m.get(p.category) || 0) + 1), new Map());
    const state = { cat: "All", q: "", sort: "new", page: 1 };
    if (total) total.textContent = PRODUCTS.length;

    tabsEl.innerHTML = ["All", ...[...counts.keys()].filter(Boolean).sort()]
      .map((c) => `<button class="c2-tab" type="button" data-c="${esc(c)}" aria-pressed="${c === "All"}">${esc(c)}<sup>${c === "All" ? PRODUCTS.length : counts.get(c)}</sup></button>`)
      .join("");

    // Fila di categorie: sfuma il bordo destro solo se c'è altro da scorrere
    const tabsFit = () => {
      const max = tabsEl.scrollWidth - tabsEl.clientWidth;
      tabsEl.classList.toggle("is-scroll", max > 1);
      tabsEl.classList.toggle("is-end", tabsEl.scrollLeft >= max - 2);
    };
    tabsEl.addEventListener("scroll", tabsFit, { passive: true });
    addEventListener("resize", tabsFit);
    requestAnimationFrame(tabsFit);

    const card = ({ p }, k) => {
      const alt = p.gallery && p.gallery[0];
      return `
      <li class="sg-item" style="--i:${k}">
        <a class="sg-card" href="${page(p)}">
          <span class="sg-media">
            <img src="${esc(sized(p.image, 570))}" alt="${esc(p.etsyTitle || p.name)}" loading="lazy" width="570" height="570">
            ${alt ? `<img class="sg-alt" src="${esc(sized(alt, 570))}" alt="" loading="lazy" width="570" height="570">` : ""}
            ${p.badge ? `<span class="sg-badge">${esc(p.badge)}</span>` : ""}
            <span class="sg-go">View details <span aria-hidden="true">→</span></span>
          </span>
          <span class="sg-info">
            <span class="sg-cat">${esc(p.category || "")}</span>
            <span class="sg-name">${esc(p.name)}</span>
            <b class="sg-price">${live(p) ? esc(p.price || "") : "Coming soon"}</b>
          </span>
        </a>
      </li>`;
    };

    const SORTS = {
      new: (a, b) => b.i - a.i,                       // ultimi aggiunti per primi
      "price-asc": (a, b) => a.price - b.price || b.i - a.i,
      "price-desc": (a, b) => b.price - a.price || b.i - a.i,
      az: (a, b) => a.p.name.localeCompare(b.p.name),
    };
    const results = () => {
      const terms = norm(state.q).split(/\s+/).filter(Boolean);
      return all.filter((x) => (state.cat === "All" || x.p.category === state.cat) && terms.every((t) => x.text.includes(t)))
        .sort(SORTS[state.sort] || SORTS.new);
    };
    const render = (scroll) => {
      const res = results();
      const pages = Math.max(1, Math.ceil(res.length / PER));
      state.page = Math.min(state.page, pages);
      list.innerHTML = res.slice((state.page - 1) * PER, state.page * PER).map(card).join("");
      empty.hidden = res.length > 0;
      pager.hidden = pages < 2;
      pager.innerHTML = pages < 2 ? "" : Array.from({ length: pages }, (_, k) =>
        `<button type="button" data-pg="${k + 1}"${k + 1 === state.page ? ' aria-current="page"' : ""}>${k + 1}</button>`).join("");
      if (scroll) $("#collection").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    };
    tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (!b) return;
      state.cat = b.dataset.c; state.page = 1;
      $$("[data-c]", tabsEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
    let t;
    search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value.trim(); state.page = 1; render(); }, 150); });
    sortEl?.addEventListener("change", () => { state.sort = sortEl.value; state.page = 1; render(); });
    pager.addEventListener("click", (e) => { const b = e.target.closest("[data-pg]"); if (b) { state.page = +b.dataset.pg; render(true); } });
    // Arrivando dalla pagina prodotto (link categoria) si apre già filtrato
    try {
      const want = sessionStorage.getItem("vdl-cat"); sessionStorage.removeItem("vdl-cat");
      const b = want && $$("[data-c]", tabsEl).find((x) => x.dataset.c === want);
      if (b) { state.cat = want; $$("[data-c]", tabsEl).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
    } catch (e) {}
    render();
  }

  /* --------------------------------- EDITOR CHE SCRIVE + MINI-SITO IN LOOP */
  const codeEl = $("[data-code]");
  const site = $("[data-site] .site");
  const cursor = $("[data-cursor]");
  if (codeEl && site) {
    const LINES = [
      ['<span class="cm">&lt;!-- yourbrand.com --&gt;</span>'],
      ['<span class="tg">&lt;header</span> <span class="at">class</span>=<span class="st">"nav"</span><span class="tg">&gt;</span>'],
      ['  <span class="tg">&lt;h1&gt;</span>Launch faster.<span class="tg">&lt;/h1&gt;</span>'],
      ['  <span class="tg">&lt;button</span> <span class="at">data-theme</span><span class="tg">&gt;</span>◐<span class="tg">&lt;/button&gt;</span>'],
      ['<span class="tg">&lt;/header&gt;</span>'],
      ['<span class="at">:root</span> { <span class="at">--accent</span>: <span class="st">#e0552d</span>; }'],
    ];
    // Scrive il codice una riga alla volta (HTML già colorato, niente tag spezzati)
    const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const move = (x, y) => { if (cursor) { cursor.style.left = x + "%"; cursor.style.top = y + "%"; } };
    const click = async () => { cursor?.classList.add("is-click"); await sleep(160); cursor?.classList.remove("is-click"); };

    if (reduce) { codeEl.innerHTML = LINES.map((l) => l[0]).join("\n"); }
    else (async function loop() {
      await sleep(1800);
      for (;;) {
        site.classList.add("is-skel"); site.classList.remove("is-dark");
        codeEl.innerHTML = "";
        let done = "";
        for (const [html] of LINES) {
          const plain = strip(html);
          for (let c = 1; c <= plain.length; c += 2) {
            codeEl.innerHTML = done + esc(plain.slice(0, c)) + '<span class="caret"></span>';
            await sleep(document.hidden ? 200 : 26);
          }
          done += html + "\n";
          codeEl.innerHTML = done + '<span class="caret"></span>';
          if (html.includes("h1")) site.classList.remove("is-skel"); // il sito "si costruisce"
          await sleep(120);
        }
        // il cursore va sul toggle e passa al tema scuro, poi torna chiaro
        await sleep(500); move(91, 15); await sleep(1100); await click(); site.classList.add("is-dark");
        await sleep(1800); move(20, 50); await sleep(1000); move(91, 15); await sleep(1100); await click(); site.classList.remove("is-dark");
        await sleep(1400); move(62, 70); await sleep(1600);
      }
    })();
  }

  /* ---------------------------------------------- luce che segue il mouse */
  const spot = $(".scene__spot");
  if (spot && fine && !reduce) scene.addEventListener("pointermove", (e) => {
    spot.style.setProperty("--mx", `${e.clientX}px`); spot.style.setProperty("--my", `${e.clientY}px`);
  });


  /* ------------------------------------------------ LAB: prova dal vivo */
  // Ricerca: digitazione dimostrativa con risultati VERI del catalogo.
  // Robusta: sempre 3 righe (le vuote restano come segnaposto) → il riquadro
  // non cambia mai altezza; le righe si ridisegnano solo se i risultati
  // cambiano davvero (niente lampeggi); si ferma quando non è visibile.
  const fakeT = $("[data-fake-type]"), fakeR = $("[data-fake-res]");
  if (fakeT && fakeR && PRODUCTS.length) {
    const SLOTS = 3;
    const idx = PRODUCTS.map((p) => ({ p, t: [p.name, p.category, p.tagline, p.etsyTitle].join(" ").toLowerCase() }));
    const thumb = (src) => String(src || "").replace(/il_(\d+xN|fullxfull)/, "il_340x270");
    // Parole dimostrative: solo quelle che trovano almeno un prodotto nel catalogo attuale
    const words = ["dashboard", "portfolio", "builder", "saas", "brand"].filter((w) => idx.some((x) => x.t.includes(w)));
    let shown = "";
    const show = (q) => {
      const hits = q ? idx.filter((x) => x.t.includes(q)).slice(0, SLOTS).map((x) => x.p) : [];
      const key = hits.map((p) => p.id).join("|");
      if (key === shown) return;
      shown = key;
      fakeR.innerHTML = Array.from({ length: SLOTS }, (_, k) => {
        const p = hits[k];
        return p
          ? `<li><img src="${esc(thumb(p.image))}" alt="" loading="lazy" width="40" height="40"><span>${esc(p.name)}</span><b>${esc(p.price || "")}</b></li>`
          : `<li class="is-empty"><i></i><span></span><b></b></li>`;
      }).join("");
    };
    show("");
    if (reduce || !words.length) { fakeT.textContent = words[0] || "Search templates…"; show(words[0] || ""); }
    else {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let visible = false;
      const whenVisible = async () => { while (!visible || document.hidden) await sleep(250); };
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 }).observe(fakeT.closest(".ltile") || fakeT);
      (async () => {
        for (let k = 0; ; k = (k + 1) % words.length) {
          await whenVisible();
          const w = words[k];
          for (let c = 1; c <= w.length; c++) { fakeT.textContent = w.slice(0, c); show(w.slice(0, c)); await sleep(110); }
          await sleep(2200);
          fakeT.textContent = "Search templates…"; show(""); await sleep(600);
        }
      })();
    }
  }

  // Trama di punti: si spostano lontano dal puntatore e tornano con una molla
  const dc = $("[data-dots]");
  if (dc) {
    const ctx = dc.getContext("2d");
    let W, H, pts = [], mx = -999, my = -999, raf = 0, vis = false;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#e0552d";
    const build = () => {
      const r = dc.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; dc.width = W * d; dc.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      const gap = W < 400 ? 18 : 22; pts = [];
      for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) pts.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
    };
    const frame = () => {
      raf = 0; ctx.clearRect(0, 0, W, H);
      let moving = false;
      for (const p of pts) {
        const dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy), R = 90;
        if (dist < R) { const f = (1 - dist / R) * 3.2; p.vx += (dx / (dist || 1)) * f; p.vy += (dy / (dist || 1)) * f; }
        p.vx += (p.ox - p.x) * 0.06; p.vy += (p.oy - p.y) * 0.06; p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx; p.y += p.vy;
        const off = Math.hypot(p.x - p.ox, p.y - p.oy);
        if (off > 0.15) moving = true;
        const k = Math.min(1, off / 18);
        ctx.fillStyle = k > 0.05 ? accent : "rgba(242,238,232,.22)";
        ctx.globalAlpha = 0.35 + k * 0.65;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.4 + k * 2, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if ((moving || mx > -999) && vis && !reduce) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const pos = (e) => { const r = dc.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; kick(); };
    dc.addEventListener("pointermove", pos); dc.addEventListener("pointerdown", pos);
    dc.addEventListener("pointerleave", () => { mx = my = -999; kick(); });
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); }).observe(dc);
    addEventListener("resize", () => { build(); kick(); });
    build(); kick();
  }

  // Responsive: la cornice si stringe e la griglia si riorganizza
  const range = $("[data-resp-range]");
  const frame = $("[data-resp-frame]");
  if (range && frame) {
    const setW = () => {
      const w = +range.value;
      frame.style.width = w + "%";
      frame.dataset.cols = w > 70 ? 3 : w > 45 ? 2 : 1;
    };
    range.addEventListener("input", setW); setW();
    // piccola dimostrazione automatica la prima volta che si vede
    if (!reduce && "IntersectionObserver" in window) {
      const o = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return; o.disconnect();
        let k = 0; const seq = [100, 60, 32, 60, 100];
        const id = setInterval(() => { range.value = seq[k]; setW(); if (++k >= seq.length) clearInterval(id); }, 900);
        range.addEventListener("pointerdown", () => clearInterval(id), { once: true });
      }, { threshold: 0.6 });
      o.observe(frame);
    }
  }

  // Luce che segue il mouse sui bordi delle tessere
  if (fine && !reduce) $$("[data-spot]").forEach((g) => g.addEventListener("pointermove", (e) => {
    $$(".ltile", g).forEach((t) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--sx", `${e.clientX - r.left}px`); t.style.setProperty("--sy", `${e.clientY - r.top}px`);
    });
  }));

  /* ----------------------------- titoletti che si "decodificano" entrando */
  if (!reduce && "IntersectionObserver" in window) {
    const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#/<>_*";
    const scramble = (el) => {
      const final = el.textContent; let f = 0;
      const id = setInterval(() => {
        f++;
        el.textContent = [...final].map((c, i) => (c === " " || i < f * 0.9 ? c : CH[(Math.random() * CH.length) | 0])).join("");
        if (f * 0.9 >= final.length) { clearInterval(id); el.textContent = final; }
      }, 28);
    };
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { so.unobserve(e.target); scramble(e.target); } }), { threshold: 1 });
    $$("main .kicker").filter((k) => !k.closest(".scene") && k.children.length === 0).forEach((k) => so.observe(k));
  }


  /* ------------------------------------------- FINALE + linee dei passi */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.25 });
    $$("[data-finale]").forEach((el) => io.observe(el));
  }

  /* -------------------------------------------- social nel footer minimal */
  const soc = $("[data-footer-social-inline]");
  const S = (window.VDL_SITE && window.VDL_SITE.social) || [];
  if (soc && S.length) soc.outerHTML = S.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join("");

  update();
})();
