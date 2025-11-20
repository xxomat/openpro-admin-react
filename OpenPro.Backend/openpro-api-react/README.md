# OpenPro API React (TypeScript SDK + Playground)

Wrapper SDK for Open Pro — API Multi v1 with a minimal React playground.

- Customer widget surface (read-only)
- Admin surface (full API, including write operations)
- TypeScript-first, role-gated at compile time

Reference: `https://documentation.open-system.fr/api-openpro/tarif/multi/v1/`

## Quick start

1) Install dependencies
```bash
pnpm i   # or: npm i / yarn
```

2) Dev playground
```bash
pnpm dev
```
Open http://localhost:5173 and provide sandbox `baseUrl`, `apiKey`, and ids.

3) Run tests
```bash
pnpm test
```

### Tests overview
- Unit tests (default): mock `fetch` and validate SDK behavior.
- Live stub tests: hit the local stub server over HTTP to validate dataset end-to-end.

Run live tests (recommended flow):
1) Start the stub server in a terminal:
```bash
npm run stub   # http://localhost:3000
```
2) In another terminal, run tests:
```bash
pnpm test
```
- Live tests will auto-detect the stub at `http://localhost:3000`. To point elsewhere, set:
```bash
OPENPRO_BASE_URL=http://your-host:port pnpm test
```
- Live tests are located in `__tests__/stub-server-tests/*` and will gracefully skip if the stub is not reachable.

## Usage (SDK)

Create a customer (read-only) client:
```ts
import { createOpenProClient } from './src/client';

const customer = createOpenProClient('customer', {
  baseUrl: 'https://sandbox.example/api',
  apiKey: 'YOUR_API_KEY'
});

const accommodations = await customer.listAccommodations(47186);
const bookings = await customer.listBookings(47186);
const booking = await customer.getBooking(47186, 123);
```

Create an admin client (full surface):
```ts
import { createOpenProClient } from './src/client';

const admin = createOpenProClient('admin', {
  baseUrl: 'https://sandbox.example/api',
  apiKey: 'YOUR_API_KEY'
});

// read
const accommodations = await admin.listAccommodations(47186);

// write (admin-only)
await admin.updateStock(47186, 1, {
  // payload shape per API spec
});
```

Type safety:
- Admin-only methods are not available on a `customer` client and will fail at compile time if referenced.
- All function names are in English.

## Playground
- Files: `src/playground/*`
- Actions included: list accommodations, list bookings, get booking.
- Warning: do not expose production keys in the browser; use sandbox only.

## Local stub server (fake data)
Run a local mock API compatible with the client. Useful to try the Playground without a real key.

1) Install deps (once):
```bash
npm i
```
This installs both app and stub server deps (`express`, `cors`).

2) Start the stub server:
```bash
npm run stub
```
It listens on `http://localhost:3000`.

3) In the Playground:
- Base URL: `http://localhost:3000` (no trailing slash)
- API Key: any string (stub ignores it)
- idFournisseur: e.g. `47186`
- idDossier: e.g. `123`
- idHebergement: e.g. `1`

Implemented endpoints and shapes (match `{ ok: 1, data: ... }`):
- `GET /fournisseur/:idFournisseur/hebergements`
- `GET /fournisseur/:idFournisseur/dossiers`
- `GET /fournisseur/:idFournisseur/dossiers/:idDossier`
- `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/stock`
- `GET /fournisseur/:idFournisseur/hebergements/:idHebergement/stock` (returns in-memory fake stock; supports `start`, `end` query)
- `POST /fournisseur/:idFournisseur/typetarifs`
- `PUT /fournisseur/:idFournisseur/typetarifs/:idTypeTarif`
- `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/typetarifs/:idTypeTarif`
- `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/typetarifs/tarif`
- `GET /fournisseur/:idFournisseur/hebergements/:idHebergement/typetarifs/tarif` (helper for reading sample rates)

Files: `stub-server/server.js`, `stub-server/stub-data.json`

Stock behavior:
- The stub seeds a few upcoming days with `dispo` values per `(idFournisseur, idHebergement)`.
- `POST /stock` merges provided `jours` by date into the in-memory dataset.
- `GET /stock` returns the current dataset, optionally sliced by `start`/`end`.

Generate a full 2025–2026 stock range:
```bash
node stub-server/scripts/regenerate-stock.js
```

## Persistent fake data (file-backed)
The stub server reads and writes fake data from `stub-server/stub-data.json`. This file is versioned in git so you can evolve the dataset over time.

- Edit `stub-server/stub-data.json` to add hebergements, dossiers, stock, rate types, or rates.
- Write operations (rate type create/update, set rates, update stock) persist back to this file.
- To reset, restore `stub-server/stub-data.json` (e.g., `git restore stub-server/stub-data.json`). You may need to restart the stub if schema changes.

### Run the stub server
From the project root:
```bash
npm install   # once
npm run stub  # starts http://localhost:3000
```

Then in the Playground, set Base URL to `http://localhost:3000`. The stub ignores the API key.

## Project structure
```
/src/client
  OpenProClient.ts   // role-gated client factory
  types.ts           // shared types
  errors.ts          // error types
  index.ts           // public exports
/src/playground      // minimal React app (Vite)
__tests__            // Vitest unit tests with mocks
```

## Notes
- Some response payloads are kept generic until the Swagger is integrated.
- Consider using a server-side proxy for production to protect the API key.


