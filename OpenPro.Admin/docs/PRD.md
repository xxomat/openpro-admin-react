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
	- Un **onglet par fournisseur** dans l’interface d’administration.
	- Le **libellé** de l’onglet est le **nom du fournisseur** (ou son identifiant si le nom est indisponible).
	- La **sélection d’un onglet** filtre l’affichage pour ne montrer que les données du **fournisseur courant**.

2. **Calendriers par hébergement (du fournisseur sélectionné)**
	- Pour **chaque hébergement** du fournisseur, afficher un **calendrier** (vue mensuelle par défaut).
	- **Couleurs d’état** par jour:
		- **Rouge**: jour **indisponible** (stock = 0 ou hébergement marqué indisponible).
		- **Vert**: jour **disponible** (stock > 0 et hébergement disponible).
	- Cette règle de couleur complète la section « Calendrier des hébergements — Exigences fonctionnelles » ci-dessous.

#### Calendrier des hébergements — Exigences fonctionnelles

1. **Liste des hébergements en calendriers**
	- Lister la collection d’hébergements liés à un `idFournisseur` (identifiant fourni en paramètre, valeur à préciser ultérieurement).
	- Affichage sous forme de **calendriers** (un calendrier par hébergement).

##### Badge journalier — Spécifications UI

- **Dimensions**
	- **Largeur**: fixe, 88 px (identique pour tous les hébergements et tous les mois).
	- **Hauteur**: adaptative au contenu avec un **minimum** défini (compact sans types: ~56 px; avec types: ~88 px). Aucun chevauchement visuel (overflow interdit).
- **Contenu et positionnement**
	- **Date**: affichée en haut-gauche du badge, en gris, typographie discrète.
	- **Disponibilité (fond et bordure du badge)**:
		- Fond vert translucide si disponible; fond rouge translucide si indisponible (stock = 0, non disponible ou déjà réservé).
	- **Prix (par jour)**:
		- Affiché au centre du badge dans un encart à largeur pleine.
		- **Bordure du prix**: couleur selon l’état du jour:
			- Vert si disponible sans promotion.
			- Jaune si disponible avec promotion active.
			- Rouge si indisponible.
		- Format: entier en euros (arrondi, suffixe “€”).
	- **Types de tarifs (optionnel)**:
		- Libellés des types applicables au jour, **empilés verticalement** sous le prix (une ligne par type), largeur pleine.
		- **Bordure des libellés**: même épaisseur que celle du prix pour cohérence visuelle.
		- Le libellé affiché est le `libelle.texte` en langue `fr` lorsque disponible (sinon fallback raisonnable).
- **Filtres d’affichage et adaptativité**
	- Une option d’interface permet **d’afficher/masquer** les libellés de types de tarifs.
	- Lorsque les libellés sont masqués, la **hauteur** du badge se **réduit automatiquement** pour améliorer la lisibilité (tout en respectant le minimum compact).
- **Uniformité inter-hébergements**
	- Les **largeurs** des badges sont **identiques** sur tous les hébergements et mois.
	- Les **hauteurs** s’adaptent uniquement au contenu visible (prix, types, etc.) pour chaque jour, sans chevauchement et en conservant l’alignement de la grille.
- **Accessibilité/ergonomie**
	- Le badge fournit un **title/tooltip** contenant la date et l’état (Disponible/Indisponible).
	- L’interface évite les sélections de texte accidentelles lors des interactions utilisateur.

2. **Affichage et regroupement des calendriers**
	- Les calendriers doivent être **groupables** en un seul affichage :
		- **Vue éclatée** : un calendrier par hébergement.
		- **Vue compacte** : regroupement multi-hébergements dans un seul calendrier.
	- Chaque calendrier (hébergement) doit être **affichable/masquable** via une **checkbox** indépendante.

3. **Filtres d’informations par jour**
	- **Tarifs 2 personnes** : affichés sous forme d’un **nombre entier** (sans décimales).
	- **Restrictions** : afficher la **durée minimale de séjour**.
	- **Promotions** : afficher une **astérisque** lorsqu’une promotion est applicable.
	- **Stock disponible** : afficher la valeur (0 ou 1) ; si **stock = 0** :
		- Afficher **"R"** si **une réservation est prévue** ce jour-là.
		- Sinon afficher **"-"**.
	- **Couleur d’affichage** :
		- **Rouge** (avec légère transparence pour lisibilité) si **stock = 0**.
		- **Vert** (avec légère transparence pour lisibilité) si **stock = 1**.

4. **Édition sur le calendrier**
	- Pour chaque jour où l’hébergement est **disponible** (**stock = 1** ET **sans réservation**) :
		- Possibilité de **passer le stock à 0**.
	- Pour chaque jour où l’hébergement est **indisponible** (**stock = 0** ET **sans réservation**) :
		- Possibilité de **passer le stock à 1**.  
		  > Le **stock ne doit jamais dépasser 1**.
	- **Tarif** : modifiable **par jour**, saisi/affiché comme **entier** (pas de décimales).
	- **Sélection multiple** : possibilité de **sélectionner plusieurs jours** et d’appliquer une modification **globale** (stock, tarif) à l’ensemble des jours sélectionnés.

5. **Détails au survol (mouse-over) d’un jour**
	- **Tarifs** : afficher **1p, 2p (3p, 4p si applicable)**.
	- **Promotions** : afficher le **nom** et la **description** des promotions applicables.
	- **Réservation** : afficher les **détails de la réservation** si l’hébergement est réservé ce jour-là.

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

