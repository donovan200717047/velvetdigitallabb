/* =============================================================================
   VelvetDigitalLabb — home.js (solo homepage)
   -----------------------------------------------------------------------------
   1. Entrata cinematografica (classe .is-ready quando i font sono pronti)
   2. Scena hero ANIMATA DA SOLA: un numero 0→1 (--p) che va avanti e
      indietro in loop, e da lì ricaviamo --t (testo che esce),
      --a (strati che si separano), --s (frase). Non serve scorrere.
   3. Inclinazione 3D leggera degli strati seguendo il mouse
   4. Collezione: griglia negozio + filtri + ricerca
   5. Filosofia: parole che si "accendono" scorrendo
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

  /* ---------------------------------------------------------------- 1. ENTRATA */
  const scene = $("[data-scene]");
  // .is-ready fa entrare titolo e bottone. Con l'animazione attiva lo
  // aggiunge la sequenza d'ingresso (punto 2b), nel momento giusto.
  const ready = () => scene?.classList.add("is-ready");
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : 0, new Promise((r) => setTimeout(r, 900))]);
  if (reduce || !scene) ready();
  else setTimeout(ready, 8000); // rete di sicurezza: il titolo compare comunque

  /* ---------------------------------------------------- 2. SCROLL → VARIABILI */
  const words = [];
  let ticking = false;

  function update() {
    ticking = false;
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


  /* -------------------------------------- 2b. HERO: LA SCENA D'APERTURA
     Appena si entra nel sito, SENZA scorrere, parte una breve "scena"
     (circa 6,5 secondi):
       1. i quattro strati di un sito web (Strategy, Structure, Content,
          Design) scendono uno alla volta e si posano, con un piccolo lampo
          di luce ogni volta; intanto la "camera" ruota piano;
       2. la frase "Every great website is built in layers." compare parola
          per parola, passando da sfocata a nitida;
       3. gli strati si compattano nel sito finito (lampo più forte) ed
          entrano il titolo e il bottone, che poi RESTANO fermi.
     Ogni 30 secondi la scena si ripete (gli strati prima si sollevano e
     spariscono), ma solo se la parte iniziale è sullo schermo, la scheda
     è aperta e il mouse non è sopra il titolo o il bottone.
     Per cambiare i tempi basta modificare i numeri qui sotto (millisecondi).
     ------------------------------------------------------------------------ */
  const T = {
    words: 450,      // quando compare la prima parola della frase
    wordGap: 120,    // distanza tra una parola e la successiva
    land: 800,       // quando inizia a scendere il primo strato
    landGap: 650,    // distanza tra uno strato e il successivo
    landDur: 1150,   // quanto dura la discesa di ogni strato
    hold: 4600,      // quando gli strati iniziano a compattarsi
    join: 1400,      // durata della compattazione
    title: 5000,     // quando entra il titolo
    end: 6300,       // fine della scena
    prelude: 900,    // (solo ripetizioni) gli strati si sollevano e spariscono
    repeat: 30000    // ogni quanto si ripete
  };

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x) => x * x * x;
  const bump = (t, at, width) => Math.exp(-Math.pow((t - at) / width, 2)); // "picco" di luce
  const planes = scene ? $$(".plane", scene) : [];
  const set = (k, v) => scene.style.setProperty(k, typeof v === "number" ? v.toFixed(4) : v);

  // La frase grande viene divisa in parole, che si accendono una per una.
  const big = scene && $(".scene__big", scene);
  const sWords = [];
  if (big && !reduce) {
    [...big.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w.trim()) return frag.append(w);
          const sp = document.createElement("span");
          sp.className = "sw"; sp.textContent = w; frag.append(sp); sWords.push(sp);
        });
        n.replaceWith(frag);
      } else if (n.nodeName === "EM") { n.classList.add("sw"); sWords.push(n); }
    });
  }

  // Disegna la scena al tempo t (millisecondi dall'inizio della scena).
  const draw = (t) => {
    const joinP = ease(map(t, T.hold, T.hold + T.join));
    const a = 1 - joinP;                                                      // strati separati → compatti
    planes.forEach((pl, i) => {
      const s0 = T.land + i * T.landGap;
      pl.style.setProperty("--b", easeOut(map(t, s0, s0 + T.landDur)).toFixed(4)); // discesa di ogni strato
    });
    let f = bump(t, T.hold + T.join - 60, 240);                               // lampo finale
    planes.forEach((_, i) => { f += 0.45 * bump(t, T.land + i * T.landGap + 520, 170); });
    set("--a", a);
    set("--f", Math.min(1, f));
    set("--spin", `${(-12 * (1 - easeOut(map(t, 0, T.hold + T.join)))).toFixed(2)}deg`); // la camera ruota
    set("--s", t < T.hold ? easeOut(map(t, 200, 900)) : 1 - ease(map(t, T.hold, T.hold + 600)));
    const tt = 1 - ease(map(t, T.title, T.title + 800));
    set("--t", tt);
    scene.classList.toggle("is-open", tt > 0.3); // titolo nascosto = bottone non cliccabile
    sWords.forEach((w, k) => w.classList.toggle("on", t >= T.words + k * T.wordGap));
  };

  // Solo per le ripetizioni: il titolo sfuma e gli strati si sollevano (dall'alto).
  const drawPrelude = (t) => {
    set("--t", ease(map(t, 0, 500)));
    set("--a", 0); set("--s", 0); set("--f", 0);
    planes.forEach((pl, i) => {
      const s0 = 100 + (planes.length - 1 - i) * 90;
      pl.style.setProperty("--b", (1 - easeIn(map(t, s0, s0 + 520))).toFixed(4));
    });
    scene.classList.add("is-open");
  };

  let playing = false;
  let titleShown = false;
  const play = (withPrelude) => new Promise((done) => {
    playing = true;
    const start = performance.now();
    const pre = withPrelude ? T.prelude : 0;
    const frame = (now) => {
      const t = now - start;
      if (t < pre) drawPrelude(t);
      else {
        draw(t - pre);
        if (!titleShown && t - pre >= T.title - 200) { titleShown = true; ready(); }
      }
      if (t < pre + T.end) requestAnimationFrame(frame);
      else { playing = false; done(); }
    };
    requestAnimationFrame(frame);
  });

  if (scene && !reduce) {
    const copy = $("[data-hero-copy]");
    let onScreen = true;
    let hovering = false;
    let started = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(scene);
    }
    // Solo sopra le righe di testo e il bottone (non su tutta la larghezza).
    if (copy) [...copy.children].forEach((el) => {
      el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovering = true; });
      el.addEventListener("pointerleave", () => { hovering = false; });
    });
    const canPlay = () => onScreen && !document.hidden && !hovering && !(copy && copy.contains(document.activeElement));

    // Ripetizione: dopo 30 s riprova; se ora non è il momento, ricontrolla ogni secondo.
    const schedule = (delay) => setTimeout(() => {
      if (playing) return;
      if (canPlay()) play(true).then(() => schedule(T.repeat));
      else schedule(1000);
    }, delay);

    // Prima scena: parte appena i font sono pronti.
    fontsReady.then(() => requestAnimationFrame(() => { started = true; play(false).then(() => schedule(T.repeat)); }));
    // Rete di sicurezza: se per qualche motivo la scena non parte, mostra tutto.
    setTimeout(() => { if (!started) planes.forEach((pl) => pl.style.setProperty("--b", 1)); }, 6000);
  }

  /* ------------------------------------------------- 3. TILT 3D DEGLI STRATI */
  const tilt = $("[data-tilt-scene]");
  if (tilt && fine && !reduce) {
    scene.addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      tilt.style.setProperty("--rx", `${(x * 8).toFixed(2)}deg`);
      tilt.style.setProperty("--ry", `${(-y * 6).toFixed(2)}deg`);
    });
    scene.addEventListener("pointerleave", () => { tilt.style.removeProperty("--rx"); tilt.style.removeProperty("--ry"); });
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

  /* ----------------------------------------------------- 4. COLLEZIONE */
  const list = $("[data-c2-list]");
  if (list) {
    const tabsEl = $("[data-c2-tabs]");
    const search = $("[data-c2-search]");
    const more = $("[data-c2-more]");
    const empty = $("[data-c2-empty]");
    const PAGE = 1000; // per ora si vedono SEMPRE tutti i prodotti (paginazione 1-2-3 più avanti)
    const live = (p) => /^https:\/\//.test(p.url || "");
    const page = (p) => `product.html?p=${encodeURIComponent(p.id)}`;
    const ETSY = /il_(\d+xN|fullxfull)/;
    const sized = (src, w) => (ETSY.test(src) ? src.replace(ETSY, `il_${w}xN`) : src);
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    // Ordine: in evidenza prima, poi i più recenti (gli ultimi aggiunti al catalogo)
    const all = PRODUCTS.map((p, i) => ({ p, i, text: norm([p.name, p.category, p.tagline, p.description].join(" ")) }))
      .sort((a, b) => (b.p.featured - a.p.featured) || (b.i - a.i));
    const counts = PRODUCTS.reduce((m, p) => m.set(p.category, (m.get(p.category) || 0) + 1), new Map());
    const state = { cat: "All", q: "", shown: PAGE };

    tabsEl.innerHTML = ["All", ...[...counts.keys()].filter(Boolean).sort()]
      .map((c) => `<button class="c2-tab" type="button" data-c="${esc(c)}" aria-pressed="${c === "All"}">${esc(c)}<sup>${c === "All" ? PRODUCTS.length : counts.get(c)}</sup></button>`)
      .join("");

    // Card piccola stile negozio online (Etsy / Vinted): immagine quadrata,
    // nome su 2 righe, prezzo. Al passaggio del mouse compare la 2ª foto.
    // Il clic apre la PAGINA PRODOTTO del sito (product.html); da lì il
    // bottone "Buy on Etsy" porta all'annuncio Etsy.
    const card = ({ p }, k) => {
      const alt = p.gallery && p.gallery[0];
      return `
      <li class="sg-item" style="--i:${k % PAGE}">
        <a class="sg-card" href="${page(p)}">
          <span class="sg-media mat" style="--bg:url('${esc(sized(p.image, 570))}')">
            <img src="${esc(sized(p.image, 570))}" alt="${esc(p.etsyTitle || p.name)}" loading="lazy" width="570" height="570">
            ${alt ? `<img class="sg-alt" src="${esc(sized(alt, 570))}" alt="" loading="lazy" width="570" height="570">` : ""}
            ${p.badge ? `<span class="sg-badge">${esc(p.badge)}</span>` : ""}
          </span>
          <span class="sg-info">
            <span class="sg-cat">${esc(p.category || "")}</span>
            <span class="sg-name">${esc(p.name)}</span>
            <span class="sg-row"><b class="sg-price">${live(p) ? esc(p.price || "") : "Coming soon"}</b><span class="sg-etsy">View →</span></span>
          </span>
        </a>
      </li>`;
    };

    const results = () => {
      const terms = norm(state.q).split(/\s+/).filter(Boolean);
      return all.filter((x) => (state.cat === "All" || x.p.category === state.cat) && terms.every((t) => x.text.includes(t)));
    };
    const render = () => {
      const res = results();
      list.innerHTML = res.slice(0, state.shown).map(card).join("");
      more.hidden = res.length <= state.shown;
      more.textContent = `Show more (${res.length - state.shown})`;
      empty.hidden = res.length > 0;
    };
    const setCat = (c) => {
      state.cat = c === "All" || counts.has(c) ? c : "All"; state.shown = PAGE;
      $$("[data-c]", tabsEl).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.c === state.cat)));
      // Su telefono la barra delle categorie scorre: porta in vista quella scelta.
      const on = $('[aria-pressed="true"]', tabsEl);
      if (on) tabsEl.scrollLeft = on.offsetLeft - tabsEl.offsetLeft - 20;
      render();
    };
    tabsEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (b) setCat(b.dataset.c);
    });
    // Categoria dal menu: sulla home filtra senza ricaricare la pagina...
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-cat-link]");
      if (!a || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      setCat(a.dataset.catLink);
      $("#collection").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
    let t;
    search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value.trim(); state.shown = PAGE; render(); }, 150); });
    more.addEventListener("click", () => { state.shown += PAGE; render(); });
    // ...e arrivando da un'altra pagina (es. product.html) legge ?cat= dall'indirizzo.
    const fromUrl = new URLSearchParams(location.search).get("cat");
    if (fromUrl) setCat(fromUrl); else render();
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
