# PRD - Product Requirements Document
## OpenPro.Admin

**Version:** 1.0.0  
**Date de création:** 2024  
**Statut:** Draft - En attente de spécifications additionnelles  

---

## 1. Vue d'ensemble

### 1.1 Objectif du projet

**OpenPro.Admin** est une application web en React avec Astro permettant aux éditeurs de solutions d'hébergements (PMS, webplannings, etc.) de :

- Piloter les tarifs des hébergements diffusés via Open Pro
- Piloter et synchroniser le stock de ces hébergements
- Récupérer en temps réel les réservations effectuées sur les canaux de vente d'Open Pro

### 1.2 Contexte

L'application utilise l'API Open Pro Multi v1 (documentation disponible sur [documentation.open-system.fr](https://documentation.open-system.fr/api-openpro/tarif/multi/v1/)) via le sous-module client `openpro-api-react` (client TypeScript fournissant types et appels HTTP) pour consommer l'API (fournisseurs, hébergements, tarifs, stocks et réservations).

### 1.3 Portée

L'application couvre les domaines fonctionnels suivants :
- Gestion de la configuration (webhooks)
- Gestion des fournisseurs
- Gestion des hébergements
- Gestion des stocks
- Gestion des tarifs et types de tarifs
- Gestion des dossiers de réservation

---

## 2. Architecture technique

### 2.1 Stack technologique

- Frontend: Astro (îles/SSR) + React (composants interactifs)
- Langage: TypeScript
- Bundler/Dev Server: Vite (inclus via Astro)
- Gestion de paquets: npm
- Client API: sous-module Git `openpro-api-react` (librairie TypeScript/React fournissant client et types Open Pro) intégré au dépôt à la racine (`openpro-api-react/`) et consommé par l'app Astro/React
- Ciblage Navigateurs: modernes (ESM); rétrocompatibilité à définir selon besoin
- Outils: ESLint/TSConfig fournis par le projet, configuration Astro

### 2.2 Structure du projet

Arborescence principale du dépôt (monorepo simple avec sous-module Git) :

- `OpenPro.Admin/` — Application Astro + React (frontend admin)
	- `src/pages/` — Pages Astro (routage par fichiers, ex: `index.astro`)
	- `src/components/` — Composants UI (Astro/React)
	- `src/layouts/` — Layouts Astro
	- `public/` — Assets statiques
	- `package.json` — Dépendances et scripts (dev/build)
- `openpro-api-react/` — Sous-module Git (client Open Pro)
	- `src/client/` — Client HTTP, erreurs, types
	- `__tests__/` — Tests du client et stub-server
	- `stub-server/` — Stub pour développement/tests
	- `package.json` — Build du client (lib TS)

Consommation du sous-module dans l'app :
- Import direct depuis `openpro-api-react/src/client` ou via un alias/entrée de build selon configuration du projet.
- Le client expose des types (`types.ts`) et un client (`OpenProClient`) pour les appels API.

### 2.3 Architecture actuelle

Vue d’ensemble (frontend uniquement) :
- Astro gère le routage, le rendu statique/SSR et l'assemblage des pages.
- Les zones interactives sont implémentées en React (îles Astro) montées dans les pages `.astro`.
- Le client `OpenProClient` (depuis `openpro-api-react`) est instancié côté client ou côté serveur selon le besoin de la page (SSR/CSR), avec gestion de la clé API via configuration d’environnement.
- Vite est utilisé pour le dev server et le bundling, avec TypeScript pour la sécurité de types.

---

## 3. Fonctionnalités actuelles

### 3.1 Configuration (Config)

**Endpoints disponibles :**

- `GET /api/config/dossier/webhooks` - Liste des webhooks de notification
- `POST /api/config/dossier/webhooks` - Ajouter un webhook
- `DELETE /api/config/dossier/webhooks` - Supprimer un webhook

**Objectif :** Permettre la configuration des webhooks pour recevoir les notifications de création/modification de dossiers de réservation.

### 3.2 Fournisseur

#### 3.2.1 Hébergements
- `GET /api/fournisseur/{idFournisseur}/hebergements` - Liste des hébergements d'un fournisseur

#### 3.2.2 Stock
- `GET /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/stock` - Récupérer le stock (avec filtres optionnels `debut` et `fin`)
- `POST /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/stock` - Mettre à jour le stock

#### 3.2.3 Dossiers de réservation
- `GET /api/fournisseur/{idFournisseur}/dossiers` - Liste des dossiers (avec filtres optionnels)
- `GET /api/fournisseur/{idFournisseur}/dossiers/{idDossier}` - Détail d'un dossier

#### 3.2.4 Types de tarifs
- `GET /api/fournisseur/{idFournisseur}/typetarifs` - Liste des types de tarifs
- `POST /api/fournisseur/{idFournisseur}/typetarifs` - Créer un type de tarif
- `PUT /api/fournisseur/{idFournisseur}/typetarifs/{idTypeTarif}` - Modifier un type de tarif
- `DELETE /api/fournisseur/{idFournisseur}/typetarifs/{idTypeTarif}` - Supprimer un type de tarif

#### 3.2.5 Liaisons Hébergement-TypeTarif
- `GET /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs` - Liste des liaisons
- `POST /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/{idTypeTarif}` - Ajouter une liaison
- `DELETE /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/{idTypeTarif}` - Supprimer une liaison

#### 3.2.6 Tarifs
- `GET /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/tarif` - Récupérer les tarifs
- `POST /api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/tarif` - Modifier les tarifs

---

## 4. Exigences techniques

### 4.1 Authentification

- **Méthode :** Clé API fournie par Alliance Réseaux
- **Format :** Clé transmise dans l'en-tête HTTP `Authorization`
- **Configuration :** Via `appsettings.json` sous la section `OpenPro.ApiKey`
- **Sécurité :** La clé API doit être configurée avant le démarrage de l'application

### 4.2 Format des données

- **Requêtes :** JSON (`Content-Type: application/json`)
- **Réponses :** JSON avec structure `Reponse` :
  ```json
  {
    "ok": 1,
    "data": {}
  }
  ```
  - `ok: 1` = succès
  - `ok: 0` = échec

### 4.3 Gestion d'erreurs

- Les erreurs de l'API Open Pro sont gérées via `OpenProApiException`
- Les contrôleurs retournent des codes HTTP appropriés (200, 400, 500)
- Logging des erreurs via `ILogger`

### 4.4 Configuration

- **Fichier :** `appsettings.json` ou `appsettings.Development.json`
- **Paramètres requis :**
  - `OpenPro:ApiKey` - Clé API Open Pro
  - `OpenPro:BaseUrl` - URL de base de l'API (par défaut: `https://api.open-pro.fr/tarif/multi/v1`)

### 4.5 Données en environnement de développement

- **Source des données (DEV) :** les écrans d’administration doivent consommer le **stub-server** fourni par le sous-module `openpro-api-react` (`openpro-api-react/stub-server/`) comme backend de développement.
- **Objectif :** garantir un affichage fidèle (calendriers par hébergement et états de disponibilité) sans dépendre de l’API distante pendant le développement.
- **Production :** en production, les données proviennent de l’API Open Pro (voir 2.2 et 4.2).

---

## 5. Cas d'usage principaux

### 5.1 Cas d'usage 1 : Synchronisation des tarifs

**Acteur :** Éditeur de logiciel de gestion de locations saisonnières

**Scénario :**
1. Récupérer la liste des hébergements d'un fournisseur
2. Créer/configurer les types de tarifs
3. Associer les types de tarifs aux hébergements
4. Définir les tarifs pour chaque hébergement

### 5.2 Cas d'usage 2 : Gestion du stock

**Acteur :** Éditeur de logiciel de gestion de locations saisonnières

**Scénario :**
1. Récupérer le stock actuel d'un hébergement
2. Mettre à jour le stock pour une ou plusieurs dates
3. Synchroniser le stock entre le logiciel et Open Pro

### 5.3 Cas d'usage 3 : Récupération des réservations

**Acteur :** Éditeur de logiciel de gestion de locations saisonnières

**Scénario :**
1. Configurer un webhook pour recevoir les notifications
2. Recevoir une notification lors de la création/modification d'une réservation
3. Récupérer le détail du dossier de réservation
4. Intégrer la réservation dans le logiciel

---

## 6. Spécifications à définir

> **Note :** Cette section sera complétée avec les spécifications additionnelles fournies par le client.

### 6.1 Fonctionnalités futures

#### Onglets par fournisseur — Exigences fonctionnelles

1. **Navigation par onglets (fournisseurs)**
	- L'interface affiche un **onglet par fournisseur** (`suppliers: Supplier[]`).
	- Chaque onglet affiche le **nom du fournisseur** (`supplier.nom`) ou son identifiant (`supplier.idFournisseur`) si le nom est indisponible.
	- La **sélection d'un onglet** définit le **fournisseur actif** (`activeSupplier: Supplier`) et filtre l'affichage pour ne montrer que les données de ce fournisseur.
	- La liste des hébergements du fournisseur actif doit être **affichée par ordre alphabétique** des noms (`nomHebergement`).

#### Calendrier des hébergements — Exigences fonctionnelles

1. **Paramètres de la timebase**
	- **Date de début** (`startDate: Date`, alias `TimeBaseStartDate`) : date sélectionnée par l'utilisateur à partir de laquelle commence l'affichage.
	- **Durée** (`monthsCount: number`, alias `TimebaseDuration`) : nombre de mois à afficher (valeurs possibles : 1, 2 ou 3 mois).
	- La **date de fin** (`endDate: Date`) est calculée automatiquement : `endDate = addMonths(startDate, monthsCount)`.

2. **Chargement des hébergements**
	- Pour le fournisseur actif (`activeSupplier.idFournisseur`), charger la liste complète des hébergements (`accommodations: Accommodation[]`).
	- Chaque hébergement contient : `idHebergement: number` et `nomHebergement: string`.
	- La liste des hébergements doit être **affichée par ordre alphabétique** des noms (`nomHebergement`).

3. **Filtrage des hébergements**
	- Afficher une liste de **checkboxes** permettant de sélectionner les hébergements à afficher.
	- L'état de sélection est stocké dans `selectedAccommodations: Set<number>` (Set des IDs d'hébergements sélectionnés).
	- Par défaut, tous les hébergements sont sélectionnés au chargement.
	- Seuls les hébergements sélectionnés (`selectedAccommodations`) apparaissent dans la grille.

4. **Chargement des données (stock et tarifs)**
	- Pour chaque hébergement sélectionné, charger les données sur la période `[startDate, endDate)` :
		- **Stock** (`stockByAccommodation: Record<idHebergement, Record<dateStr, stock>>`) : stock disponible par date (format `dateStr: "YYYY-MM-DD"`).
		- **Tarifs** (`ratesByAccommodation: Record<idHebergement, Record<dateStr, price>>`) : prix par date pour 2 personnes (format entier en euros).

##### Vue compacte — Grille hebdomadaire

1. **Structure de la grille**
	- La grille est une **table HTML avec CSS Grid** (`display: grid`).
	- **Nombre de colonnes** : `1 + allDays.length` où `allDays` est le tableau aplati de tous les jours de la période.
		- Colonne 1 (fixe, sticky) : nom de l'hébergement (`acc.nomHebergement`).
		- Colonnes 2 à N : une colonne par jour de la période, dans l'ordre chronologique.
	- **Nombre de lignes** : `1 + selectedAccommodations.size`
		- Ligne 1 : en-tête (header).
		- Lignes 2 à N+1 : une ligne par hébergement sélectionné.

2. **Ligne 1 — En-tête (header)**
	- **Cellule 1** : texte "Hébergement" (style header, fond gris clair).
	- **Cellules suivantes** : pour chaque jour dans `allDays`, afficher :
		- Le jour de la semaine (L, M, M, J, V, S, D) calculé via `(day.getDay() + 6) % 7`.
		- La date au format `jour/mois` (ex: "15/3").

3. **Lignes 2 à N+1 — Données par hébergement**
	- Pour chaque hébergement dans la liste filtrée (`accommodations.filter(acc => selectedAccommodations.has(acc.idHebergement))`) :
		- **Cellule 1** : nom de l'hébergement (`acc.nomHebergement`), texte simple, cellule sticky à gauche.
		- **Cellules suivantes** : pour chaque jour dans `allDays` :
			- Récupérer le stock : `stock = stockByAccommodation[acc.idHebergement][dateStr] ?? 0`.
			- Récupérer le prix : `price = ratesByAccommodation[acc.idHebergement][dateStr]`.
			- Calculer la disponibilité : `isAvailable = (stock > 0)`.
			- **Couleur de fond** :
				- Si `isAvailable === true` : fond vert (`rgba(34, 197, 94, 0.2)`).
				- Si `isAvailable === false` : fond rouge (`rgba(220, 38, 38, 0.2)`).
			- **Contenu de la cellule** : prix affiché au format `${Math.round(price)}€` si disponible, sinon chaîne vide.
			- Le prix est centré dans la cellule.
			- La cellule entière (pas seulement le prix) a le fond coloré.

4. **Génération des semaines**
	- La fonction `getWeeksInRange(startDate, monthsCount)` génère un tableau de semaines (`weeks: Date[][]`).
	- **Première semaine** : commence exactement à `startDate` (pas de décalage au lundi précédent) et contient 7 jours consécutifs.
	- **Semaines suivantes** : commencent le lundi suivant la fin de la semaine précédente et contiennent 7 jours consécutifs.
	- Toutes les semaines sont ensuite aplaties en un seul tableau : `allDays = weeks.flat()` pour créer les colonnes de la grille.


##### Badge journalier — Spécifications UI

A définir

##### Sélection des badges — Exigences d’interaction

A définir

### 6.2 Exigences non-fonctionnelles

- [ ] Performances (temps de réponse, débit)
- [ ] Disponibilité (SLA)
- [ ] Sécurité (authentification, autorisation)
- [ ] Scalabilité

### 6.3 Contraintes

- [ ] À définir

### 6.4 Métriques de succès

- [ ] À définir

---

## 7. Références

- **Documentation API Open Pro :** https://documentation.open-system.fr/api-openpro/tarif/multi/v1/
- **Swagger Open Pro :** Disponible via la documentation
- **Support Technique Alliance-Réseaux :** support@alliance-reseaux.com
- **Client API (sous-module) :** `openpro-api-react` (Git submodule)

---

## 8. Glossaire

- **Fournisseur :** Prestataire disposant d'un logiciel permettant de diffuser des produits dans l'Open-System. Chaque Web Planning Open Pro correspond à un Fournisseur.
- **Hébergement :** Unité d'hébergement associée à un Fournisseur, identifiée par un `idHebergement`.
- **Type de tarif :** Plan tarifaire possible pour les hébergements (ex: "Tarif public", "Promo non remboursable").
- **Dossier de réservation :** Réservation effectuée sur les canaux de vente d'Open Pro.
- **Webhook :** Mécanisme de notification permettant d'être alerté lors de la création/modification d'un dossier de réservation.

---

## 9. Historique des versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0.0 | 2024 | - | Création initiale du PRD basé sur la documentation API |

---

## 10. Annexes

### 10.1 Structure des réponses API

Référence à la documentation Open Pro pour les détails des modèles de données :
- Hébergement
- Type de tarif
- Tarifs d'un hébergement
- Stock
- Dossier de réservation

### 10.2 Exemples d'utilisation

Exemple d'utilisation du client `openpro-api-react` dans un composant React monté dans une page Astro :

```tsx
import React from 'react';
import { createOpenProClient } from '../../../openpro-api-react/src/client';

export function AccommodationsList({ idFournisseur }: { idFournisseur: number }) {
  const [items, setItems] = React.useState<Array<{ idHebergement: number; nomHebergement: string }>>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const client = createOpenProClient('admin', {
      baseUrl: import.meta.env.PUBLIC_OPENPRO_BASE_URL, // ex: 'https://api.open-pro.fr/tarif/multi/v1'
      apiKey: import.meta.env.PUBLIC_OPENPRO_API_KEY     // clé API Alliance Réseaux
    });

    setLoading(true);
    client
      .listAccommodations(idFournisseur)
      .then(list => setItems(list.hebergements))
      .catch(e => setError(e?.message ?? 'Erreur inconnue'))
      .finally(() => setLoading(false));
  }, [idFournisseur]);

  if (loading) return <div>Chargement…</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <ul>
      {items.map(x => (
        <li key={x.idHebergement}>{x.nomHebergement}</li>
      ))}
    </ul>
  );
}
```

Notes d'intégration :
- Déclarer les variables d'environnement publiques Astro (préfixe `PUBLIC_`) pour la base URL et la clé API.
- Monter le composant dans une page `.astro` via une île React.

---

**Document à compléter avec les spécifications additionnelles.**

