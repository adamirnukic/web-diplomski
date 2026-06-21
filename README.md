# GameVault — platforma za mini-igre

Multiplayer web-platforma za mini-igre. Svaka igra ima **lokalni** mod (na istom
uređaju) i **online** mod (soba + 6-znakovni kod). Sve je _self-contained_ — bez
eksternih servisa (nema Supabase / Firebase).

## Tehnologije

- **Frontend:** Next.js (App Router) + React, **TypeScript**, CSS Moduli
- **Backend:** Node.js + Express + **Socket.IO** (autoritativni server)
- **Baza:** SQLite **ugrađen u Node** (`node:sqlite`) — lokalni fajl, bez instalacije
- **Auth:** vlastiti (bcrypt + JWT)

## Struktura projekta

| Folder        | Šta sadrži                                                        |
| ------------- | ---------------------------------------------------------------- |
| `app/`        | Next.js stranice (samo UI)                                       |
| `components/` | React komponente (`ui/` primitivi, `layout/`, `games/`)         |
| `lib/`        | Klijentski helperi i hookovi (`api`, `socket`, `auth`, `useRoom`, `useLocalGame`) |
| `shared/`     | **Logika igara** (engine) — koriste je i klijent i server       |
| `server/`     | Backend: auth, sobe, baza, statistika                           |
| `public/`     | Statički fajlovi                                                 |

Ključna ideja: igra je opisana **čistim engine-om** u `shared/games/<id>/engine.ts`.
Isti engine pokreće lokalnu igru (u browseru) i online igru (na serveru, koji je
sudija). `getView(state, igrač)` šalje svakom igraču samo ono što smije vidjeti —
zato tajne karte (npr. poker) ne mogu procuriti ni preko mreže.

## Pokretanje

Treba **Node 24+** (zbog ugrađenog SQLite-a) i **pnpm**.

```bash
pnpm install
pnpm dev
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:3001

`pnpm dev` pokreće oba zajedno.

## Skripte

| Komanda          | Šta radi                                  |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | frontend + backend zajedno                |
| `pnpm dev:web`   | samo frontend                             |
| `pnpm dev:api`   | samo backend                              |
| `pnpm build`     | produkcijski build frontenda              |
| `pnpm test`      | testovi engine-a igara                    |
| `pnpm typecheck` | provjera tipova servera                   |

## Kako radi online

1. Host otvori igru → **Napravi sobu** → dobije 6-znakovni kod.
2. Drugi igrač unese kod → uđe u sobu.
3. Kad su svi spremni, host pokrene igru.
4. Server drži stanje, validira svaki potez i svakom igraču šalje samo njegov pogled.
5. Ako veza pukne, klijent se automatski ponovo poveže i vrati u sobu. Nakon partije host može pokrenuti **revanš** bez napuštanja sobe.

## Dodavanje nove igre (ukratko)

1. Napiši engine u `shared/games/<id>/engine.ts` (implementira `GameEngine`).
2. Registruj ga u `shared/games/registry.ts`.
3. Napravi UI komponentu u `components/games/<id>/` (prima `view` + `onAction`).
4. Registruj komponentu u `components/games/registry.ts` i označi `implemented: true`
   u `lib/games-catalog.ts`.

Isti UI radi i za lokalni i za online mod.

## Konfiguracija

`.env.local` (postoji za lokalni rad):

```
API_PORT=3001
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=...            # promijeni za pravu upotrebu
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```
