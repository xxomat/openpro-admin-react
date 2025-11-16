# OpenPro.Admin (Astro + React)

Application d'administration Open Pro construite avec Astro (îles + SSR) et React. Le client API est fourni par le sous-module Git `openpro-api-react`.

## Stack

- Astro + React (îles)
- TypeScript
- Vite (dev/build)
- Sous-module: `openpro-api-react` (client HTTP + types)

## Prérequis

- Node.js LTS
- npm
- Sous-module Git initialisé

## Installation

Depuis la racine du dépôt (monorepo) :

```sh
git submodule update --init --recursive
```

Puis dans `OpenPro.Admin/` :

```sh
npm install
```

## Variables d'environnement

Astro expose uniquement les variables préfixées `PUBLIC_` au navigateur.

- `PUBLIC_OPENPRO_BASE_URL` (ex: `https://api.open-pro.fr/tarif/multi/v1`)
- `PUBLIC_OPENPRO_API_KEY` (clé API Alliance Réseaux)

Créer un fichier `.env` (ou `.env.local`) dans `OpenPro.Admin/` :

```ini
PUBLIC_OPENPRO_BASE_URL=https://api.open-pro.fr/tarif/multi/v1
PUBLIC_OPENPRO_API_KEY=xxxxx
```

## Démarrage

```sh
npm run dev
```

Par défaut sur `http://localhost:4321`.

## Build

```sh
npm run build
npm run preview
```

## Utiliser le client `openpro-api-react`

Exemple minimal dans un composant React :

```tsx
import React from 'react';
import { createOpenProClient } from '../../openpro-api-react/src/client';

export function Demo({ idFournisseur }: { idFournisseur: number }) {
  const [names, setNames] = React.useState<string[]>([]);
  React.useEffect(() => {
    const client = createOpenProClient('admin', {
      baseUrl: import.meta.env.PUBLIC_OPENPRO_BASE_URL,
      apiKey: import.meta.env.PUBLIC_OPENPRO_API_KEY
    });
    client.listAccommodations(idFournisseur).then(r => {
      setNames(r.hebergements.map(h => h.nomHebergement));
    });
  }, [idFournisseur]);
  return <ul>{names.map(n => <li key={n}>{n}</li>)}</ul>;
}
```

Monter ce composant dans une page `.astro` via une île React.

## Structure

```
OpenPro.Admin/
  public/
  src/
    assets/
    components/
    layouts/
    pages/
  package.json
openpro-api-react/ (sous-module)
  src/client/
  __tests__/
  stub-server/
```

Pour plus d'informations, voir `docs/PRD.md`.
