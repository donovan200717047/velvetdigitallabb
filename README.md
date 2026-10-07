# VelvetDigitalLabb — sito ufficiale

Sito statico in HTML, CSS e JavaScript vanilla, senza librerie e senza backend. I prodotti si gestiscono dal pannello **/admin** e il sito si aggiorna da solo. Il checkout avviene su Etsy.

## Struttura

```
index.html, product.html, 404.html   Pagine del sito
css/style.css                         Design system + layout + animazioni
js/main.js                            Disegna il catalogo e gestisce le interazioni
js/products.js                        GENERATO in automatico: non toccarlo
content/products.json                 ← il catalogo (lo modifica il pannello)
content/settings.json                 ← brand, shop Etsy, social (dal pannello)
admin/                                Il pannello /admin (Decap CMS)
scripts/build.mjs                     Trasforma content/*.json in js/products.js + sitemap.xml
img/products/                         Le immagini caricate dal pannello
netlify.toml                          Configurazione Netlify (build, header, cache)
```

## Come funziona l'aggiornamento automatico

```
Pannello /admin ──salva──▶ GitHub (content/products.json) ──avvisa──▶ Netlify
                                                                  │
                         sito aggiornato online ◀── node scripts/build.mjs
```

Aggiungi un prodotto dal pannello, premi **Pubblica**, e dopo circa un minuto è online. Se un dato non è valido (per esempio un link non Etsy o un id doppio), la build si ferma e resta online l'ultima versione buona: nel log di Netlify trovi il motivo in italiano.

## Configurazione (una volta sola, circa 15 minuti)

### 1. Metti il progetto su GitHub
1. Crea un account gratuito su github.com, se non lo hai.
2. Clicca **+ → New repository**. Nome: `velvetdigitallabb`. Visibilità: **Private** va benissimo. Poi **Create repository**.
3. Nella pagina del repository vuoto clicca **uploading an existing file**.
4. Trascina **il contenuto** della cartella `velvetdigitallabb-site` (cioè `index.html`, `css`, `js`, `admin`, `content` e il resto, non la cartella stessa) e premi **Commit changes**.

### 2. Scrivi il tuo utente nel pannello
Su GitHub apri `admin/config.yml` → icona matita → nella riga `repo:` sostituisci `TUO-UTENTE-GITHUB` con il tuo nome utente GitHub → **Commit changes**.

### 3. Collega Netlify a GitHub
1. app.netlify.com → **Add new project → Import an existing project → GitHub**, autorizza e scegli `velvetdigitallabb`.
2. Le impostazioni di build si compilano da sole grazie a `netlify.toml`: premi **Deploy**.
3. **Project configuration → General → Change project name** → `velvetdigitallabb`.
4. Se hai ancora il vecchio sito `velvetidigitallabb`, puoi eliminarlo.

### 4. Abilita l'accesso al pannello
1. GitHub → foto profilo → **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Application name: `VelvetDigitalLabb CMS`
   - Homepage URL: `https://velvetdigitallabb.netlify.app`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Premi **Register application**, copia il **Client ID**, poi **Generate a new client secret** e copia anche quello (si vede una volta sola).
3. Netlify → il tuo sito → **Project configuration → Security → OAuth → Install provider → GitHub** → incolla Client ID e Client Secret → **Install**.

### 5. Usalo
Vai su **https://velvetdigitallabb.netlify.app/admin/**, clicca **Login with GitHub** → **Catalogo → Prodotti** → **Aggiungi prodotto** → compila → **Pubblica**.

## Provarlo sul computer
- Doppio clic su `index.html`: funziona direttamente.
- Se modifichi a mano `content/products.json`, lancia `node scripts/build.mjs` per rigenerare `js/products.js`.

## Da sapere

- Il codice usa già l'indirizzo `https://velvetdigitallabb.netlify.app` (canonical, Open Graph, sitemap). Su Netlify il nome del sito deve essere `velvetdigitallabb` (Site configuration → Change site name). Se un giorno usi un dominio tuo, sostituisci quell'indirizzo dal pannello (Impostazioni), in `admin/config.yml`, `robots.txt`, `sitemap.xml` e nei `<head>` dei file HTML.
- I social si aggiungono dal pannello: **Impostazioni → Brand e social**. La colonna "Follow" del footer compare da sola.
- I prezzi (€17.90) sono quelli degli annunci Etsy di oggi: se li cambi su Etsy, aggiornali anche dal pannello, oppure lascia `price: ""` per non mostrarli.
