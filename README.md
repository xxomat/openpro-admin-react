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

### Variables principales

- `PUBLIC_BACKEND_BASE_URL` - URL du backend (par défaut: `http://localhost:3001`)
- `PUBLIC_OPENPRO_SUPPLIERS` - Liste JSON des fournisseurs (optionnel, surcharge les constantes par défaut)

### Configuration des fournisseurs

Les fournisseurs peuvent être configurés de deux façons :

1. **Via les constantes par défaut** (selon le mode) :
   - Mode production (`npm run dev`) : `134737` - La Becterie
   - Mode stub (`npm run dev:with-stub`) : `47186` - La Becterie, `55123` - Gîte en Cotentin

2. **Via la variable d'environnement** `PUBLIC_OPENPRO_SUPPLIERS` (surcharge les constantes) :

```ini
PUBLIC_OPENPRO_SUPPLIERS=[{"idFournisseur":12345,"nom":"Mon Fournisseur"}]
```

### Exemple de fichier `.env`

```ini
PUBLIC_BACKEND_BASE_URL=http://localhost:8787
PUBLIC_OPENPRO_SUPPLIERS=[{"idFournisseur":134737,"nom":"La Becterie"}]
```

## Démarrage

### Mode production (connexion à l'API OpenPro réelle)

```sh
npm run dev
```

Par défaut sur `http://localhost:4321`.

**Fournisseurs par défaut :**
- `134737` - La Becterie

### Mode stub (connexion au stub-server pour les tests)

```sh
npm run dev:with-stub
```

**Fournisseurs par défaut (IDs de test) :**
- `47186` - La Becterie
- `55123` - Gîte en Cotentin

**Note :** Le mode stub utilise les identifiants de fournisseurs de test pour se connecter au stub-server local. Assurez-vous que le stub-server est démarré (`npm run stub` dans `openpro-api-react`).

## Build

```sh
npm run build
npm run preview
```

## Utiliser le client `openpro-api-react`

Exemple minimal dans un composant React :

```tsx
import React from 'react';
import { createOpenProClient } from '@openpro-api-react/client';

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
