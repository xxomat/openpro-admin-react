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

##### Sélection des colonnes par jour — Exigences d'interaction

1. **Mécanisme de sélection**
	- Le système permet de **sélectionner une colonne entière** (un jour) en cliquant sur la **cellule d'en-tête** correspondante dans la ligne 1 (header).
	- La cellule d'en-tête contient le jour de la semaine (L, M, M, J, V, S, D) et la date (format `jour/mois`).
	- Un clic sur une cellule d'en-tête sélectionne/désélectionne la colonne correspondante.

2. **État de sélection**
	- L'état de sélection est stocké dans `selectedDays: Set<number>` (Set des indices de colonnes sélectionnées) ou `selectedDates: Set<string>` (Set des dates au format `"YYYY-MM-DD"`).
	- Une colonne peut être dans l'état **sélectionnée** ou **non sélectionnée**.
	- Par défaut, aucune colonne n'est sélectionnée au chargement.

3. **Mise en surbrillance visuelle**
	- Lorsqu'une colonne est sélectionnée, **toutes les cellules de cette colonne** doivent être mises en surbrillance :
		- **Cellule d'en-tête** (ligne 1) : appliquer un style de surbrillance (ex: fond coloré, bordure accentuée, ou opacité modifiée).
		- **Cellules des hébergements** (lignes 2 à N+1) : appliquer le même style de surbrillance à toutes les cellules de la colonne pour tous les hébergements affichés.
	- La surbrillance doit être **visuellement distincte** des couleurs de disponibilité (vert/rouge) tout en restant visible.
	- Exemple de style de surbrillance : bordure plus épaisse (`border: 3px solid #3b82f6`), fond avec opacité (`background: rgba(59, 130, 246, 0.1)`), ou combinaison des deux.

4. **Comportement interactif**
	- Un **clic simple** sur une cellule d'en-tête :
		- Si la colonne n'est pas sélectionnée → la sélectionne et applique la surbrillance.
		- Si la colonne est déjà sélectionnée → la désélectionne et retire la surbrillance.
	- Le curseur doit changer en `cursor: pointer` au survol des cellules d'en-tête pour indiquer l'interactivité.
	- La sélection est **indépendante** pour chaque colonne (sélection multiple possible).
	- Un **appui sur la touche Échap (Escape)** annule toute sélection : toutes les colonnes sont désélectionnées et la surbrillance est retirée.

5. **Implémentation technique**
	- Chaque cellule d'en-tête doit avoir un gestionnaire d'événement `onClick` qui :
		- Identifie l'index de la colonne (`columnIndex`) ou la date (`dateStr`) correspondante.
		- Met à jour l'état `selectedDays` ou `selectedDates`.
		- Applique conditionnellement une classe CSS ou un style inline pour la surbrillance.
	- Toutes les cellules d'une même colonne (en-tête + données) doivent partager la même logique de style conditionnel basée sur l'état de sélection.

6. **Champ d'affichage du résumé de sélection (pour tests)**
	- Un **champ texte en lecture seule** (`textarea`) doit être affiché sous le calendrier pour afficher un résumé formaté de la sélection.
	- **Format du résumé** : une ligne par date sélectionnée, au format `Date, H1 - T1, H2 - T2, H3 - T3, ...` où :
		- `Date` : date au format `"YYYY-MM-DD"` (ex: "2024-03-15").
		- `H1, H2, H3, ...` : noms des hébergements (`nomHebergement`) affichés dans la grille, triés par ordre alphabétique.
		- `T1, T2, T3, ...` : tarifs correspondants pour chaque hébergement à la date donnée, formatés en euros (ex: "120€").
		- Si un tarif n'est pas disponible pour une date/hébergement donné, afficher `"N/A"` à la place.
	- **Tri et ordre** :
		- Les dates sont triées par ordre chronologique (ascendant).
		- Les hébergements sont triés par ordre alphabétique de leur nom (`nomHebergement`).
	- **Comportement** :
		- Le champ est **en lecture seule** (`readOnly`).
		- Le résumé se met à jour **automatiquement** lorsque la sélection change (ajout/suppression de dates).
		- Si aucune date n'est sélectionnée ou aucun hébergement n'est affiché, le champ est vide.
		- Le champ affiche le placeholder `"Aucune sélection"` lorsqu'il est vide.
	- **Style** :
		- Police monospace pour une meilleure lisibilité du formatage.
		- Fond gris clair (`#f9fafb`) pour indiquer que le champ est en lecture seule.
		- Redimensionnable verticalement (`resize: vertical`).
		- Hauteur minimale de 80px.
	- **Données sources** :
		- Les dates proviennent de `selectedDates: Set<string>`.
		- Les hébergements proviennent de `selectedAccommodations: Set<number>` filtrés et triés.
		- Les tarifs proviennent de `ratesByAccommodation: Record<idHebergement, Record<dateStr, price>>`.

##### Modification du prix — Exigences fonctionnelles

1. **Condition d'autorisation**
	- La modification du prix est **autorisée uniquement lorsqu'une sélection est active**.
	- Une sélection est considérée comme active si `selectedDates.size > 0` (au moins une colonne/jour est sélectionnée).
	- Si aucune sélection n'est active, les cellules de prix ne sont pas éditables.

2. **Déclenchement de l'édition**
	- L'utilisateur peut **cliquer sur une cellule de prix** (cellule contenant le prix affiché au format `${Math.round(price)}€`) pour entrer en mode édition.
	- Le clic peut être effectué **uniquement sur une cellule de prix d'une colonne sélectionnée**.
	- Les cellules de prix des colonnes non sélectionnées ne sont pas éditables et ne réagissent pas au clic.

3. **Mode édition**
	- Lors du clic sur une cellule de prix, la cellule passe en **mode édition** :
		- La cellule devient un **champ de saisie** (`input` de type `number` ou `text`).
		- La valeur actuelle du prix est pré-remplie dans le champ (sans le symbole "€").
		- Le champ est automatiquement sélectionné (focus) pour permettre la saisie immédiate.
		- Le champ accepte uniquement des valeurs numériques (entiers ou décimaux).
	- Le mode édition peut être quitté de plusieurs façons :
		- **Validation** : appui sur la touche **Entrée (Enter)** ou **Tab** → applique la modification (voir point 4).
		- **Annulation** : appui sur la touche **Échap (Escape)** → annule la modification et restaure la valeur précédente.

4. **Application du prix à la sélection**
	- Lors de la validation de l'édition (Entrée ou Tab), le prix saisi est **appliqué à l'ensemble de la sélection en cours** :
		- Pour chaque date dans `selectedDates` (Set des dates sélectionnées).
		- Pour chaque hébergement dans `selectedAccommodations` (Set des hébergements sélectionnés et affichés).
		- Le prix est mis à jour dans `ratesByAccommodation[acc.idHebergement][dateStr] = newPrice`.
	- **Note importante** : La modification est appliquée **uniquement en mémoire locale** (état React). Aucun appel API vers le stub serveur ou l'API Open Pro n'est effectué à ce stade.
	- Après l'application, la grille est **immédiatement mise à jour** pour refléter les nouveaux prix dans toutes les cellules concernées.

5. **Comportement visuel pendant l'édition**
	- Pendant le mode édition d'une cellule, les autres cellules de prix restent visibles et affichées normalement.
	- Les colonnes sélectionnées conservent leur surbrillance visuelle pendant l'édition.
	- Une fois le prix appliqué, toutes les cellules concernées affichent le nouveau prix avec le format `${Math.round(newPrice)}€`.

6. **Indication visuelle des modifications non sauvegardées**
	- Comme les modifications sont appliquées uniquement en mémoire locale (sans persistance vers le serveur), chaque cellule de prix modifiée doit afficher une **astérisque jaune** (`*`) après le symbole €.
	- **Format d'affichage** : `${Math.round(newPrice)}€*` où l'astérisque est affichée en couleur jaune (`color: #eab308` ou équivalent).
	- **Suivi des modifications** : Un état local `modifiedRates: Set<string>` peut être utilisé pour suivre les combinaisons `idHebergement-dateStr` qui ont été modifiées localement.
	- **Affichage conditionnel** : L'astérisque jaune est affichée uniquement si `modifiedRates.has(\`${idHebergement}-${dateStr}\`)` est `true`.
	- **Persistance de l'indication** : L'astérisque reste visible tant que la modification n'a pas été sauvegardée vers le serveur (ou tant que les données ne sont pas rechargées depuis le serveur).

7. **Gestion des valeurs invalides**
	- Si l'utilisateur saisit une valeur non numérique ou vide :
		- La validation (Entrée/Tab) peut être refusée avec un message d'erreur ou une restauration de la valeur précédente.
		- Ou la valeur peut être interprétée comme `0` ou `null` selon la logique métier.
	- Les valeurs négatives peuvent être autorisées ou refusées selon les règles métier (à définir).

8. **Implémentation technique**
	- Chaque cellule de prix doit avoir un gestionnaire d'événement `onClick` qui :
		- Vérifie que `selectedDates.size > 0` (sélection active).
		- Vérifie que la date (`dateStr`) de la colonne correspondante fait partie de `selectedDates`.
		- Si les deux conditions sont remplies, passe la cellule en mode édition.
		- Sinon, le clic est ignoré et aucune action n'est effectuée.
	- Un état local `editingCell: { rowIndex: number, columnIndex: number } | null` peut être utilisé pour suivre la cellule en cours d'édition.
	- La fonction d'application du prix doit itérer sur `selectedDates` et `selectedAccommodations` pour mettre à jour `ratesByAccommodation`.
	- Après la mise à jour, déclencher un re-render de la grille pour afficher les nouveaux prix.
	- Lors de l'application d'un prix modifié, ajouter chaque combinaison `idHebergement-dateStr` concernée dans `modifiedRates` pour permettre l'affichage de l'astérisque jaune.

9. **Limitations actuelles**
	- **Pas de persistance** : Les modifications de prix ne sont pas sauvegardées vers le serveur (stub ou API Open Pro).
	- Les modifications sont perdues lors d'un rechargement de la page ou d'un rechargement des données.
	- La synchronisation avec le backend sera implémentée dans une phase ultérieure, sur l'appui d'un bouton "Sauvegarder"

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

