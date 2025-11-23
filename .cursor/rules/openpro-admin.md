---
description: Règles de codage pour le projet OpenPro Admin
globs: []
alwaysApply: true
---

# Règles de codage - OpenPro Admin

## Taille des fichiers

### Limites strictes
- **Composants React (.tsx)** : Maximum **400 lignes** (code effectif, hors commentaires)
- **Hooks personnalisés (.ts)** : Maximum **300 lignes**
- **Services (.ts)** : Maximum **300 lignes**
- **Utilitaires (.ts)** : Maximum **200 lignes**
- **Types/Interfaces (.ts)** : Maximum **300 lignes**
- **Configuration (.ts)** : Maximum **200 lignes**
- **Pages Astro (.astro)** : Maximum **200 lignes**

### Exceptions
- Les fichiers de configuration (`config.ts`) peuvent dépasser cette limite si nécessaire
- Les fichiers de types complexes peuvent aller jusqu'à 300 lignes
- Les composants de présentation très simples peuvent être plus courts

### Action requise
Si un fichier dépasse la limite :
1. Identifier les responsabilités distinctes
2. Extraire des composants séparés
3. Créer des hooks personnalisés pour la logique réutilisable
4. Créer des fichiers utilitaires pour les fonctions réutilisables
5. Diviser les composants en sous-composants si nécessaire

## Conventions de nommage

### Composants React
- **Format** : PascalCase
- **Exemples** : `ProviderCalendars`, `AccommodationList`, `CompactGrid`, `BookingModal`
- **Fichiers** : même nom que le composant (ex: `ProviderCalendars.tsx`)

### Hooks personnalisés
- **Format** : camelCase avec préfixe `use`
- **Exemples** : `useSupplierData`, `useGridDrag`, `useGridEditing`
- **Fichiers** : même nom que le hook (ex: `useSupplierData.ts`)

### Fonctions et méthodes
- **Format** : camelCase en anglais
- **Exemples** : `getAccommodations`, `loadRateTypes`, `formatDate`, `saveBulkUpdates`
- **Verbes d'action** : utiliser des verbes clairs (`get`, `load`, `generate`, `format`, `save`, `update`)

### Types et interfaces TypeScript
- **Format** : PascalCase
- **Exemples** : `Accommodation`, `RateType`, `SupplierData`, `BulkUpdateRequest`
- **Interfaces** : préférer `interface` pour les objets extensibles, `type` pour les unions/intersections

### Variables et constantes
- **Variables locales** : camelCase (`idFournisseur`, `accommodationsList`, `discoveredRateTypes`)
- **Constantes** : camelCase pour les constantes simples, UPPER_SNAKE_CASE pour les constantes globales
- **Exemples** : `config`, `backendClient`, `API_BASE_URL` (si constante globale)

### Services
- **Format** : camelCase avec suffixe `Service` ou descriptif
- **Exemples** : `backendClient`, `dataLoader`, `accommodationLoader`
- **Un fichier = une responsabilité** : chaque service doit avoir une responsabilité claire

## Structure des fichiers

### Organisation des dossiers
```
src/
  components/         # Composants React
    ComponentName/
      components/     # Sous-composants
      hooks/          # Hooks spécifiques au composant
      services/       # Services de chargement de données
      types.ts        # Types spécifiques au composant
      utils/          # Utilitaires spécifiques au composant
      index.tsx       # Composant principal
  layouts/            # Layouts Astro
  pages/              # Pages Astro
  services/           # Services partagés
    api/              # Clients API
  assets/             # Assets statiques
```

### Structure d'un composant React
1. **En-tête JSDoc** : description du composant et de son rôle
2. **Imports** : groupés par type (React, types, bibliothèques externes, relatifs)
3. **Types/Interfaces** : définitions de types locaux (si nécessaire)
4. **Constantes** : constantes du composant
5. **Composant** : fonction du composant
6. **Exports** : exports nommés uniquement

### Structure d'un hook personnalisé
1. **En-tête JSDoc** : description du hook et de son rôle
2. **Imports** : groupés par type
3. **Types/Interfaces** : définitions de types locaux
4. **Hook** : fonction du hook avec `use` en préfixe
5. **Exports** : exports nommés uniquement

## Documentation

### JSDoc obligatoire
- **Tous les composants** doivent avoir une documentation JSDoc
- **Tous les hooks personnalisés** doivent documenter leur comportement et leur retour
- **Toutes les fonctions publiques** doivent avoir une documentation JSDoc
- **Tous les services** doivent documenter leur comportement

### Format JSDoc
```typescript
/**
 * Description courte du composant/fonction
 * 
 * Description détaillée si nécessaire, expliquant le comportement,
 * les cas d'usage, ou les détails d'implémentation importants.
 * 
 * @param paramName - Description du paramètre (type et contraintes)
 * @param optionalParam - Description du paramètre optionnel
 * @returns Description de la valeur de retour
 * @throws {Error} Description des erreurs possibles
 */
```

### Commentaires dans le code
- **Éviter les commentaires évidents** : le code doit être auto-documenté
- **Commenter la logique complexe** : expliquer le "pourquoi", pas le "comment"
- **Commentaires TODO** : utiliser `// TODO: description` pour les améliorations futures

## TypeScript

### Typage strict
- **Toujours typer explicitement** les paramètres de fonction
- **Éviter `any`** : utiliser `unknown` si le type est vraiment inconnu, puis faire une vérification
- **Utiliser les types fournis** : préférer les types de `@openpro-api-react/client/types`
- **Types génériques** : utiliser les génériques pour la réutilisabilité
- **Props de composants** : toujours typer les props avec une interface ou un type

### Interfaces vs Types
- **Interfaces** : pour les objets extensibles et les contrats (props de composants)
- **Types** : pour les unions, intersections, et types complexes

### Gestion des erreurs
- **Typage des erreurs** : utiliser `Error` ou des classes d'erreur personnalisées
- **Gestion explicite** : toujours gérer les erreurs dans les fonctions async
- **Messages d'erreur** : messages clairs et actionnables
- **Affichage des erreurs** : afficher les erreurs de manière user-friendly dans l'UI

## React

### Composants
- **Composants fonctionnels** : utiliser uniquement des composants fonctionnels (pas de classes)
- **Typage des props** : toujours typer les props avec une interface
- **Exemple de composant** :
```typescript
interface ComponentProps {
  id: string;
  name: string;
  onAction?: (id: string) => void;
}

export function Component({ id, name, onAction }: ComponentProps): React.ReactElement {
  // ...
}
```

### Hooks
- **Hooks React standards** : utiliser `React.useState`, `React.useMemo`, `React.useCallback`, etc.
- **Hooks personnalisés** : créer des hooks pour la logique réutilisable
- **Dépendances** : toujours inclure toutes les dépendances dans les tableaux de dépendances
- **Exemple de hook** :
```typescript
export function useCustomHook(param: string) {
  const [state, setState] = React.useState<string>('');
  
  React.useEffect(() => {
    // effet
  }, [param]);
  
  return { state, setState };
}
```

### Gestion d'état
- **useState** : pour l'état local simple
- **useMemo** : pour les valeurs calculées coûteuses
- **useCallback** : pour les fonctions passées en props
- **État global** : utiliser le contexte React si nécessaire, sinon props drilling

### Performance
- **Memoization** : utiliser `React.memo` pour les composants purs si nécessaire
- **useMemo/useCallback** : utiliser avec parcimonie, seulement si nécessaire pour la performance
- **Éviter les re-renders inutiles** : optimiser les dépendances des hooks

## Astro

### Pages et layouts
- **Pages** : utiliser `.astro` pour les pages statiques
- **Layouts** : créer des layouts réutilisables dans `layouts/`
- **Composants Astro** : utiliser pour les parties statiques, React pour les parties interactives

### Exemple de page Astro
```astro
---
import Layout from '../layouts/Layout.astro';
import { ProviderCalendars } from '../components/ProviderCalendars';
---

<Layout title="Admin">
  <ProviderCalendars client:load />
</Layout>
```

## Services et API

### Structure des services
- **Un service par ressource** : `backendClient.ts`, `dataLoader.ts`, `accommodationLoader.ts`
- **Fonctions exportées** : fonctions async pour le chargement de données
- **Gestion des erreurs** : toujours gérer les erreurs et les signaler

### Client API Backend
- **Utiliser le client typé** : `backendClient` depuis `services/api/backendClient.ts`
- **AbortSignal** : supporter `AbortSignal` pour l'annulation des requêtes si nécessaire
- **Gestion des réponses** : vérifier la structure des réponses API

## Imports

### Ordre des imports
1. **Imports React** : `import React from 'react'`
2. **Imports de types** : `import type { ... } from '...'`
3. **Imports de bibliothèques externes** : triés alphabétiquement
4. **Imports internes** : relatifs, triés par profondeur (moins profond d'abord)

### Exemple
```typescript
import React from 'react';
import type { Supplier } from './types';
import { formatDate } from './utils/dateUtils';
import { useSupplierData } from './hooks/useSupplierData';
```

### Règles
- **Imports de types** : toujours utiliser `import type` pour les types
- **Imports relatifs** : utiliser des chemins relatifs cohérents
- **Extensions .js** : utiliser `.js` dans les imports ESM même pour les fichiers `.ts`/`.tsx`
- **Pas d'imports circulaires** : éviter les dépendances circulaires entre modules

## Gestion des erreurs et logging

### Logging
- **Utiliser console.log avec modération** : pour le développement uniquement
- **Format des logs** : inclure le contexte (nom de fonction, paramètres pertinents)
- **Exemple** : `console.error('Error fetching data:', error)` avec contexte
- **Production** : éviter les console.log en production, utiliser un système de logging approprié

### Gestion des erreurs async
- **Toujours utiliser try/catch** dans les fonctions async
- **Propager les erreurs** : laisser remonter les erreurs critiques, gérer les erreurs non-critiques localement
- **Messages d'erreur** : messages clairs et actionnables
- **Affichage utilisateur** : afficher les erreurs de manière user-friendly dans l'UI

### Exemple de gestion d'erreur
```typescript
try {
  const data = await loadData();
  return data;
} catch (error) {
  console.error('Error loading data:', error);
  // Afficher une erreur à l'utilisateur
  throw new Error('Failed to load data');
}
```

## Gestion des valeurs par défaut

### Opérateurs
- **`??` (nullish coalescing)** : pour les valeurs `null` ou `undefined`
- **`||` (OR logique)** : uniquement si on veut aussi gérer les valeurs falsy (`0`, `''`, `false`)
- **Préférer `??`** : dans la plupart des cas pour les valeurs par défaut

### Exemple
```typescript
// ✅ Bon : utilise ?? pour null/undefined uniquement
const value = input ?? defaultValue;

// ⚠️ Attention : || gère aussi 0, '', false
const value = input || defaultValue; // peut masquer des valeurs valides
```

## Validation et sécurité

### Validation des entrées
- **Valider les données** : avant de les utiliser dans les composants
- **Types** : utiliser TypeScript pour la validation à la compilation
- **Runtime** : valider les données à l'exécution pour les entrées utilisateur

### Variables d'environnement
- **Ne pas exposer de secrets** : jamais de clés API ou secrets dans le code client
- **Validation** : valider les variables d'environnement au démarrage
- **Valeurs par défaut** : fournir des valeurs par défaut pour le développement

### Exemple
```typescript
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
if (!API_BASE_URL) {
  throw new Error('PUBLIC_API_BASE_URL is required');
}
```

## Code mort et nettoyage

### À éviter
- **Code commenté** : supprimer le code commenté, utiliser Git pour l'historique
- **console.log de debug** : supprimer avant le commit ou utiliser un système de logging
- **Imports inutilisés** : supprimer les imports non utilisés
- **Variables inutilisées** : supprimer les variables non utilisées

### TODO et FIXME
- **TODO** : marquer les améliorations futures avec `// TODO: description`
- **FIXME** : marquer les bugs connus avec `// FIXME: description`
- **Limiter les TODO** : résoudre les TODO avant qu'ils ne s'accumulent

## Format ESM

### Modules ES
- **Type module** : le projet utilise `"type": "module"` dans `package.json`
- **Extensions .js** : utiliser `.js` dans les imports même pour les fichiers `.ts`/`.tsx`
- **Exemple** : `import { config } from '../config/env.js';`

## Vérifications avant commit

Avant de commiter du code, vérifier :
1. ✅ Tous les fichiers respectent les limites de lignes
2. ✅ Tous les composants et hooks ont une documentation JSDoc
3. ✅ Les types sont correctement définis (pas d'`any` non justifié)
4. ✅ Les props des composants sont typées
5. ✅ Les noms de variables/fonctions suivent les conventions
6. ✅ La structure des dossiers est respectée
7. ✅ Les erreurs sont gérées correctement et affichées à l'utilisateur
8. ✅ Les imports inutilisés sont supprimés
9. ✅ Le code commenté est supprimé
10. ✅ Les hooks ont toutes leurs dépendances dans les tableaux de dépendances
11. ✅ Les imports utilisent `.js` pour les fichiers TypeScript en ESM
12. ✅ Les composants sont optimisés pour éviter les re-renders inutiles

## Références

- PRD : `docs/PRD.md`
- Client API : `openpro-api-react/src/client/`
- Astro : https://docs.astro.build/
- React : https://react.dev/
- TypeScript : https://www.typescriptlang.org/
