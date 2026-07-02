# Arhitektura — GameVault

Kratak pregled dizajna sistema. Za upute o pokretanju vidjeti
[`README.md`](../README.md).

## 1. Opšti pregled

Sistem čine **dva procesa** koji dijele **zajednički sloj logike igara**:

```
                 ┌───────────────────────────────────────────────┐
   Preglednik    │                   KLIJENT                      │
  ┌───────────┐  │  Next.js (App Router) + React + TypeScript      │
  │  Korisnik │◀▶│  app/ · components/ · lib/                      │
  └───────────┘  └───────────────┬───────────────┬───────────────┘
                        REST/HTTP │               │ WebSocket (Socket.IO)
                     (auth, CRUD) │               │ (realtime igra + društveno)
                 ┌───────────────▼───────────────▼───────────────┐
                 │                  SERVER (Node.js)              │
                 │  Express (REST)  +  Socket.IO (autoritativan)  │
                 │  server/                                       │
                 └───────────────┬────────────────┬──────────────┘
                                 │                 │
                         ┌───────▼──────┐   ┌──────▼───────────────┐
                         │  SQLite      │   │  shared/  (engine)   │
                         │ (node:sqlite)│   │  logika svih igara   │
                         └──────────────┘   └──────────────────────┘
```

- **Klijent** (`app/`, `components/`, `lib/`) — korisnički interfejs; za lokalnu
  igru pokreće engine direktno u pregledniku.
- **Server** (`server/`) — REST rute i autoritativni Socket.IO za online igru.
- **`shared/`** — čista logika igara (engine), bez ovisnosti o pregledniku ili
  serveru; koriste je oba.

Za operacije bez realnog vremena (registracija, profili, prijatelji, historija
poruka) koristi se **REST**; za igru i trenutne događaje **Socket.IO**.

## 2. Zajednički sloj: engine igara

Svaka igra implementira isti interfejs (`shared/types.ts`):

```ts
interface GameEngine<S, A, V> {
  id: string
  minPlayers: number
  maxPlayers: number
  createInitialState(players: EnginePlayer[], options?: GameOptions): S
  applyAction(state: S, playerId: PlayerId, action: A): S   // vraća NOVO stanje
  getView(state: S, playerId: PlayerId): V                  // pogled po igraču
  getCurrentPlayer(state: S): PlayerId | null
  getResult(state: S): GameResult | null
}
```

Ključna svojstva:

- **Nepromjenjivost:** `applyAction` nikad ne mijenja ulazno stanje, nego vraća
  kopiju (ručno ili `structuredClone`). Predvidljivo i lako za testiranje.
- **Skrivene informacije:** `getView` svakom igraču vraća samo ono što smije
  vidjeti (svoje karte u cijelosti, od protivnika npr. samo broj karata). Server
  šalje isključivo taj pogled, pa tajne ne napuštaju server.
- **Naracija bez jezika:** engine emituje poruke kao `LogLine` (`{ k, p }` — ključ
  prijevoda + parametri), a UI ih prevodi. Isti engine radi na oba jezika.
- **Događaji za bedževe:** engine u `state.events` bilježi značajne događaje;
  server ih pri kraju partije čita i dodjeljuje bedževe.

**Tri obrasca "ko je na potezu":** (1) naizmjenični potezi (Tic-Tac-Toe, Dama),
(2) istovremeni izbor — `getCurrentPlayer` vraća sljedećeg koji nije izabrao pa
se potezi razrješavaju odjednom (6 Nimmt!, List-kamen-makaze), (3) fazna mašina s
prozorima za reakciju, tačno jedan akter po fazi (Coup, Love Letter, Perudo).

Registri: `shared/games/registry.ts` (engini), `components/games/registry.ts`
(ploče), `shared/games/ai.ts` (botovi), `lib/games-catalog.ts` (metapodaci).

## 3. Online sobe (autoritativni server)

Server (`server/rooms.ts`) drži jednu sobu po kodu:

```ts
Room { code, gameId, hostId, players: Map, status, engine, state, chat }
status: 'lobby' | 'playing' | 'finished'
```

Tok: `room:create` → kod → `room:join` → `room:ready` → (host) `room:start` →
`game:action` (server validira `applyAction`, pa svakom šalje `getView`) →
`game:over`. Prekid veze ili izlazak usred partije **čuva mjesto** (`connected =
false`); povratak s istim kodom vraća igrača i ponovo mu šalje stanje. Prazna
soba se briše nakon kratke odgode.

### Socket.IO događaji

| Klijent → Server | Server → Klijent            |
| ---------------- | --------------------------- |
| `room:create`    | `room:update` (stanje lobija) |
| `room:join`      | `game:state` (pogled igrača)  |
| `room:ready`     | `game:over` (rezultat)        |
| `room:start`     | `chat:history`, `chat:message`|
| `game:action`    | `presence:state`, `presence:update` |
| `chat:send`      | `invite:received`             |
| `room:leave`     | `friend:request:new`, `friend:accepted` |
| `invite:send`    | `notification:new`, `achievement:earned`, `dm:new` |

## 4. REST API (izbor)

| Grupa      | Rute                                                                 |
| ---------- | -------------------------------------------------------------------- |
| Auth       | `POST /api/auth/{register,login,change-password,forgot-password,reset-password}`, `GET /api/auth/me`, `DELETE /api/account` |
| Profil     | `PATCH /api/profile`, `GET /api/users/:id`, `GET /api/stats/:id`, `GET /api/history`, `GET /api/achievements` |
| Rang       | `GET /api/leaderboard` (`?scope=friends&game=<id>`)                   |
| Prijatelji | `GET /api/friends`, `POST /api/friends/{request,respond}`, `DELETE /api/friends/:id` |
| Poruke     | `GET /api/messages`, `GET/POST /api/messages/:friendId`              |
| Obavijesti | `GET /api/notifications`, `POST /api/notifications/read`             |

Autentikacija: JWT u `Authorization: Bearer <token>`; server ga provjerava i iz
njega saznaje korisnika.

## 5. Autentikacija

- Registracija: lozinka se **hešuje** (`bcrypt`), pohranjuje se samo heš.
- Prijava: `bcrypt.compare`; na uspjeh se izdaje **JWT** (`jsonwebtoken`,
  rok 30 dana), potpisan `JWT_SECRET`-om.
- Klijent čuva token (localStorage) i šalje ga uz REST zahtjeve te pri
  uspostavi Socket.IO veze (autentikacija socketa).
- Oporavak lozinke: token s rokom (`password_resets`); e-mail preko SMTP-a, uz
  fallback na prikaz linka u sučelju ako SMTP nije podešen.

## 6. Baza podataka (SQLite)

Jedna datoteka; tabele se kreiraju s `CREATE TABLE IF NOT EXISTS` pri pokretanju
(`server/db.ts`), pa migracija nije potrebna. Tabele vezane za korisnika koriste
`ON DELETE CASCADE`.

| Tabela                     | Sadržaj                                       |
| -------------------------- | --------------------------------------------- |
| `users`                    | korisnici (email, username, heš, avatar, friend-kod, bio) |
| `game_stats`               | statistika po korisniku i igri (pobjede, XP…) |
| `matches`, `match_players` | odigrane partije i ishodi                     |
| `achievements`             | osvojeni bedževi                              |
| `friendships`              | prijateljstva i zahtjevi                      |
| `messages`                 | trajne poruke između prijatelja              |
| `notifications`            | obavijesti korisnika                          |
| `password_resets`          | tokeni za oporavak lozinke                    |

## 7. Realtime društvene funkcije

Odvojen, aplikacijski Socket.IO sloj (`server/social.ts`, klijent
`lib/realtime.tsx`) prati **prisustvo** (ko je online među prijateljima),
dostavlja **pozive u igru**, **zahtjeve/prihvatanja prijateljstva**, **direktne
poruke** i **obavijesti** — sve u realnom vremenu, uz trajno čuvanje u bazi
(obavijesti i poruke) da se ništa ne izgubi dok je korisnik offline.

## 8. Višejezičnost (i18n)

`lib/i18n.tsx` drži rječnik s ravnim ključevima za `bs` i `en`. Komponente
koriste `t('kljuc', { param })`; ako prijevod fali, pada na `bs`, pa na sam
ključ. Odabrani jezik se pamti u pregledniku.

## 9. Topologija u produkciji

```
                 ┌──────────────── Caddy (HTTPS, :443) ───────────────┐
   Internet ────▶│  /api/*  i  /socket.io/*   ──▶  backend  (:3001)    │
                 │  ostalo                    ──▶  frontend (:3000)    │
                 └────────────────────────────────────────────────────┘
```

Dva Node procesa (frontend + backend) iza jednog obratnog proksija (Caddy) na
jednoj domeni; Caddy automatski pribavlja i obnavlja HTTPS certifikat. SQLite
datoteka je na trajnom disku. Obavezno postaviti `JWT_SECRET` i `NEXT_PUBLIC_*`
URL-ove (frontend ih ugrađuje na build-u).
