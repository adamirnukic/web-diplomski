# GameVault — platforma za mini-igre

Web-platforma za višekorisničke mini-igre u realnom vremenu. Nudi **21 igru**, a
svaka ima **lokalni** mod (na istom uređaju, uz igru protiv botova) i **online**
mod (soba + 6-znakovni kod). Sve je _self-contained_ — bez eksternih servisa
(nema Supabase / Firebase): vlastita autentikacija, baza i realtime.

> Detaljan opis dizajna je u [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Sadržaj

- [Mogućnosti](#mogućnosti)
- [Igre](#igre)
- [Tehnologije](#tehnologije)
- [Brzi start](#brzi-start)
- [Konfiguracija (env)](#konfiguracija-env)
- [Skripte](#skripte)
- [Struktura projekta](#struktura-projekta)
- [Kako radi online](#kako-radi-online)
- [Dodavanje nove igre](#dodavanje-nove-igre)
- [Testiranje](#testiranje)
- [Produkcija / Deployment](#produkcija--deployment)

## Mogućnosti

- 🎮 **21 igra**, svaka u lokalnom i online modu
- 🤖 **Botovi** u lokalnom modu, s tri nivoa težine (lako / normalno / teško)
- 🌐 **Online sobe u realnom vremenu** (Socket.IO), autoritativni server
- 🔁 **Otpornost na prekide** — ponovno povezivanje i ponovni ulazak u sobu (pauza)
- 🔐 **Vlastita autentikacija** (bcrypt + JWT), oporavak zaboravljene lozinke
- 👥 **Prijatelji** (friend-kod), prisustvo (ko je online), pozivi u igru
- 💬 **Trajni razgovori** s prijateljima + kratkotrajni chat u sobi
- 🔔 **Obavijesti u realnom vremenu** (zahtjevi, pozivi, prihvatanja)
- 🏆 **Statistika, XP, nivoi, rang-lista i bedževi**
- 🌍 **Dvojezičnost** (bosanski / engleski)
- 📱 **Responzivan** interfejs (desktop i mobilni)

## Igre

| Kategorija     | Igre                                                             |
| -------------- | ---------------------------------------------------------------- |
| Strategija     | Tic-Tac-Toe, Connect Four, Dama, Tačkice i kvadratići, Battleships |
| Karte          | Blackjack, Texas Hold'em, Love Letter, Coup, 6 Nimmt!, Flip 7, Trio |
| Kockice        | Perudo, Can't Stop, Yahtzee                                      |
| Blef / klasik  | Skull, List-kamen-makaze                                         |
| Slagalice/kviz | Memory, Vješalo, Minolovac, Kviz znanja                          |

## Tehnologije

- **Frontend:** Next.js (App Router) + React, **TypeScript** (strict), CSS Moduli
- **Backend:** Node.js + Express + **Socket.IO** (autoritativni server)
- **Baza:** SQLite **ugrađen u Node** (`node:sqlite`) — lokalni fajl, bez instalacije
- **Auth:** vlastiti (bcryptjs + JSON Web Token)
- **Zajednički sloj:** logika igara (engine) dijeljena između klijenta i servera

## Brzi start

Potrebno: **Node 22.5+** (zbog ugrađenog `node:sqlite`; testirano na Node 24) i **pnpm**.

```bash
pnpm install
pnpm dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:3001

`pnpm dev` pokreće oba procesa zajedno. (Backend se pokreće s
`NODE_OPTIONS=--experimental-sqlite`, što je već podešeno u skripti `dev:api`.)

## Konfiguracija (env)

Vrijednosti se čitaju iz `.env.local` (ili `.env`). Sve imaju razumne
podrazumijevane vrijednosti za lokalni rad.

| Varijabla                | Podrazumijevano             | Opis                                             |
| ------------------------ | --------------------------- | ------------------------------------------------ |
| `API_PORT`               | `3001`                      | Port aplikacijskog (backend) servera             |
| `WEB_ORIGIN`             | `http://localhost:3000`     | Dozvoljeno porijeklo (CORS) za frontend          |
| `JWT_SECRET`             | _dev vrijednost_            | Tajni ključ za potpis tokena — **obavezno promijeniti u produkciji** |
| `DB_PATH`                | `server/data.sqlite`        | Putanja do SQLite datoteke                       |
| `NEXT_PUBLIC_API_URL`    | `http://localhost:3001`     | URL backend-a (ugrađuje se u frontend na build-u) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001`     | URL Socket.IO servera (ugrađuje se na build-u)   |

**Opcionalno — slanje e-maila** (za oporavak lozinke). Ako se ne postavi, link
za reset se prikaže direktno u sučelju:

```
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...        # ako se izostavi, koristi se SMTP_USER
```

> `NEXT_PUBLIC_*` varijable se ugrađuju u frontend **pri build-u**, pa nakon
> njihove promjene treba ponoviti `pnpm build`.

## Skripte

| Komanda          | Šta radi                                        |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | frontend + backend zajedno                      |
| `pnpm dev:web`   | samo frontend (`next dev`)                      |
| `pnpm dev:api`   | samo backend (uz `--experimental-sqlite`)       |
| `pnpm build`     | produkcijski build frontenda                    |
| `pnpm build:api` | kompajliranje backend-a (TypeScript → `dist-server/`) |
| `pnpm start`     | pokretanje build-anog frontenda                 |
| `pnpm start:api` | pokretanje build-anog backend-a                 |
| `pnpm typecheck` | provjera tipova servera (`tsc --noEmit`)        |
| `pnpm lint`      | ESLint                                          |
| `pnpm test`      | test engine-a igara                             |

## Struktura projekta

| Folder        | Šta sadrži                                                        |
| ------------- | ---------------------------------------------------------------- |
| `app/`        | Next.js stranice (App Router) — samo UI i rutiranje              |
| `components/` | React komponente (`ui/` primitivi, `layout/`, `games/`)          |
| `lib/`        | Klijentski helperi i hookovi (`api`, `socket`, `auth`, `useRoom`, `i18n`) |
| `shared/`     | **Logika igara** (engine) — koriste je i klijent i server        |
| `server/`     | Backend: auth, sobe, baza, statistika, prijatelji, poruke        |
| `docs/`       | Dokumentacija (arhitektura)                                      |
| `public/`     | Statički fajlovi (ikonice, slike)                                |

Ključna ideja: igra je opisana **čistim engine-om** u
`shared/games/<id>/engine.ts`. Isti engine pokreće lokalnu igru (u pregledniku) i
online igru (na serveru, koji je sudija). `getView(state, igrač)` šalje svakom
igraču samo ono što smije vidjeti — zato tajne informacije (npr. karte u pokeru)
ne mogu procuriti ni preko mreže. Više u
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Kako radi online

1. Host otvori igru → **Napravi sobu** → dobije 6-znakovni kod (vidljiv i tokom partije).
2. Drugi igrač unese kod → uđe u sobu.
3. Kad su svi spremni, host pokrene igru.
4. Server drži stanje, validira svaki potez i svakom igraču šalje **samo njegov pogled**.
5. Ako veza pukne — ili igrač izađe usred partije — mjesto se čuva; povratkom s
   istim kodom nastavlja gdje je stao. Nakon partije host može pokrenuti **revanš**.

## Dodavanje nove igre

1. Napiši engine u `shared/games/<id>/engine.ts` (implementira `GameEngine`).
2. Registruj ga u `shared/games/registry.ts`.
3. (Opcionalno) dodaj bota u `shared/games/<id>/ai.ts` i registruj u `shared/games/ai.ts`.
4. Napravi UI komponentu u `components/games/<id>/` (prima `view` + `onAction`).
5. Registruj komponentu u `components/games/registry.ts` i dodaj metapodatke u
   `lib/games-catalog.ts` (`implemented: true`).
6. Dodaj prijevode (`lib/i18n.tsx`) i pravila za „Kako se igra" (`lib/game-rules.ts`).

Isti UI radi i za lokalni i za online mod.

## Testiranje

- `pnpm typecheck` — provjera tipova cijelog servera i zajedničkog sloja.
- `pnpm build` — produkcijski build (ujedno provjerava i tipove frontenda).
- `pnpm test` — test engine-a igara.
- Uz to se koriste _smoke_ testovi za pojedine engine i serverske module
  (kratke skripte koje se pokreću preko `node --import tsx`), koji provjeravaju
  ključna pravila i granične slučajeve.

## Produkcija / Deployment

Pokreću se **dva procesa** — frontend (`pnpm start`) i backend (`pnpm start:api`).
Baza je jedna SQLite datoteka na trajnom disku; tabele se kreiraju automatski pri
prvom pokretanju (`CREATE TABLE IF NOT EXISTS`), pa **nisu potrebni posebni
koraci migracije**. Ispred aplikacije ide obratni proksi (npr. Caddy) koji
poslužuje HTTPS i na jednoj domeni prosljeđuje `/api/*` i `/socket.io/*` na
backend, a ostalo na frontend.

Obavezno u produkciji: postaviti jak `JWT_SECRET` i ispravne `NEXT_PUBLIC_*` URL-ove
(pa ponoviti `pnpm build`). Detalji topologije su u
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
