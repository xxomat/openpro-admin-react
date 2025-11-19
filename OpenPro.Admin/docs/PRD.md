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

**Note :** Pour obtenir la liste des types de tarif disponibles pour un hébergement, utiliser l'endpoint de la section 3.2.5 (Liaisons Hébergement-TypeTarif) ou extraire les types de tarif depuis les données de tarifs récupérées (section 3.2.6).

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

5. **Style différencié des jours de semaine et weekends**
	- **Détection des weekends** : Les jours de weekend sont identifiés par `day.getDay() === 0` (dimanche) ou `day.getDay() === 6` (samedi).
	- **Jours de semaine (lundi à vendredi)** :
		- **En-têtes** : fond grisé (`#f3f4f6` au lieu de `#f9fafb`), opacité réduite (`opacity: 0.8`).
		- **Cellules de données** : fond avec opacité réduite (`rgba(34, 197, 94, 0.1)` pour disponible, `rgba(220, 38, 38, 0.1)` pour indisponible au lieu de `0.2`), opacité globale réduite (`opacity: 0.7`) quand non sélectionnées.
		- **Texte** : style normal (`fontWeight: 500`).
	- **Weekends (samedi et dimanche)** :
		- **En-têtes** : fond normal (`#f9fafb`), opacité complète (`opacity: 1`), texte en **gras** (`fontWeight: 700`).
		- **Cellules de données** : fond normal (`rgba(34, 197, 94, 0.2)` pour disponible, `rgba(220, 38, 38, 0.2)` pour indisponible), opacité complète (`opacity: 1`), texte en **gras** (`fontWeight: 700`).
	- **Objectif** : Mettre visuellement en évidence les weekends par rapport aux jours de semaine pour faciliter la lecture du calendrier.


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
	- **Isolation par fournisseur** : Chaque fournisseur (onglet) possède sa **propre sélection de dates indépendante**. La sélection effectuée dans un onglet ne doit **pas** affecter la sélection dans un autre onglet. L'état de sélection doit être indexé par `idFournisseur` : `selectedDatesBySupplier: Record<number, Set<string>>`. Lors du changement d'onglet, seule la sélection du fournisseur actif est affichée et modifiable.

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

5. **Sélection par drag de la souris**
	- **Déclenchement du drag**
		- Le drag peut être initié **uniquement depuis les cellules d'en-tête** (ligne 1).
		- Le drag commence lors d'un **mousedown** (clic maintenu) sur une cellule d'en-tête.
		- La colonne de départ est identifiée par la date (`dateStr`) de la cellule d'en-tête où le drag commence.
	- **Suivi du drag**
		- Pendant le drag (`mousemove`), le système identifie la colonne actuellement survolée en fonction de la position de la souris.
		- Toutes les colonnes entre la colonne de départ et la colonne actuelle sont considérées comme faisant partie de la sélection temporaire.
		- La sélection temporaire inclut toujours la colonne de départ et la colonne actuelle, ainsi que toutes les colonnes intermédiaires (séquence continue).
	- **Visualisation pendant le drag**
		- Les colonnes faisant partie de la sélection temporaire doivent être **mises en surbrillance visuelle** pendant le drag.
		- Le style de surbrillance peut être légèrement différent de la surbrillance de sélection finale (ex: opacité réduite, couleur légèrement différente) pour indiquer qu'il s'agit d'une sélection temporaire.
		- Exemple : `background: rgba(59, 130, 246, 0.2)` avec bordure `2px solid #3b82f6` pour la sélection temporaire.
		- La surbrillance temporaire doit être appliquée à **toutes les cellules** des colonnes concernées (en-têtes + données).
	- **Finalisation de la sélection**
		- Lors du **mouseup** (relâchement du bouton de la souris), la sélection temporaire devient la sélection définitive.
		- Toutes les colonnes de la sélection temporaire sont ajoutées à `selectedDates` (ou sélectionnées si elles ne l'étaient pas déjà).
		- Si le drag est très court (moins de 5 pixels de déplacement), il est considéré comme un clic simple et suit le comportement du clic (toggle de la colonne de départ).
	- **Comportement avec sélection existante**
		- **Mode "ajout"** (par défaut) : Le drag ajoute les colonnes à la sélection existante sans désélectionner les colonnes déjà sélectionnées.
		- **Mode "remplacement"** (avec touche Ctrl/Cmd) : Si la touche Ctrl (Windows/Linux) ou Cmd (Mac) est maintenue pendant le drag, la sélection existante est remplacée par la nouvelle sélection du drag.
	- **Gestion des cas limites**
		- Si le drag sort de la zone de la grille, la sélection temporaire reste figée sur la dernière colonne valide survolée.
		- Si le drag revient dans la grille après être sorti, la sélection temporaire reprend à partir de la colonne actuellement survolée.
		- Si le drag commence sur une colonne déjà sélectionnée et se termine sur une colonne non sélectionnée, toutes les colonnes du drag sont sélectionnées (mode ajout).
	- **Curseur pendant le drag**
		- Le curseur doit changer en `cursor: grabbing` pendant le drag pour indiquer l'action en cours.
		- Le curseur initial peut être `cursor: grab` au survol des cellules d'en-tête pour indiquer la possibilité de drag.
		- Les cellules de données ne doivent pas avoir le curseur `grab` car elles ne permettent pas d'initier un drag.
	- **Compatibilité avec la sélection par clic**
		- La sélection par clic simple reste fonctionnelle et indépendante du drag.
		- Un clic simple sans mouvement de souris ne doit pas déclencher de drag.
		- Le drag et le clic peuvent être combinés : l'utilisateur peut cliquer pour sélectionner des colonnes individuelles, puis utiliser le drag pour sélectionner une plage de colonnes supplémentaires.

6. **Implémentation technique**
	- **Sélection par clic** :
		- Chaque cellule d'en-tête doit avoir un gestionnaire d'événement `onClick` qui :
			- Identifie l'index de la colonne (`columnIndex`) ou la date (`dateStr`) correspondante.
			- Met à jour l'état `selectedDays` ou `selectedDates`.
			- Applique conditionnellement une classe CSS ou un style inline pour la surbrillance.
		- Toutes les cellules d'une même colonne (en-tête + données) doivent partager la même logique de style conditionnel basée sur l'état de sélection.
	- **Sélection par drag** :
		- Chaque cellule d'en-tête doit avoir des gestionnaires d'événements `onMouseDown`, `onMouseMove`, et `onMouseUp`.
		- Un état local `draggingState: { startDate: string, currentDate: string, isDragging: boolean } | null` peut être utilisé pour suivre l'état du drag.
		- Lors du `mousedown`, initialiser `draggingState` avec la date de départ et `isDragging: false`.
		- Lors du `mousemove` après un `mousedown`, si le déplacement dépasse un seuil (ex: 5 pixels), activer `isDragging: true` et mettre à jour `currentDate`.
		- Calculer la plage de dates entre `startDate` et `currentDate` pour déterminer les colonnes à mettre en surbrillance temporaire.
		- Lors du `mouseup`, finaliser la sélection en ajoutant toutes les dates de la plage à `selectedDates`.
		- Vérifier la touche Ctrl/Cmd pendant le drag pour déterminer le mode (ajout ou remplacement).
		- Appliquer un style conditionnel basé sur `draggingState` pour la surbrillance temporaire.

7. **Champ d'affichage du résumé de sélection (pour tests)**
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
	- **Isolation par fournisseur** : Chaque fournisseur (onglet) possède ses **propres modifications non sauvegardées indépendantes**. Les astérisques jaunes affichées dans un onglet ne doivent **pas** apparaître dans un autre onglet. L'état de suivi des modifications doit être indexé par `idFournisseur` : `modifiedRatesBySupplier: Record<number, Set<string>>`. Lors du changement d'onglet, seules les modifications du fournisseur actif sont affichées et peuvent être sauvegardées.

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

##### Sélection globale du type de tarif — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Afficher une dropdown de sélection du type de tarif au-dessus de chaque calendrier.
	- La sélection s'applique à tout le calendrier affiché.
	- Les prix affichés dans toutes les cellules correspondent au type de tarif sélectionné.
	- Si un hébergement n'a pas de tarif pour le type sélectionné, afficher "-".

2. **Position et placement**
	- **Emplacement de la dropdown** :
		- Position : au-dessus du calendrier, après le titre "Hébergements — {activeSupplier.nom}".
		- Placement suggéré : entre le titre et la liste des hébergements (checkboxes), ou juste avant le composant `CompactGrid`.
		- Visibilité : affichée uniquement si au moins un hébergement est sélectionné (`selectedAccommodations.size > 0`).
	- **Structure visuelle proposée** :
		```
		Hébergements — {activeSupplier.nom}
		
		[Dropdown Type de tarif ▼]  ← Nouvelle dropdown ici
		
		[Liste des hébergements avec checkboxes]
		
		[Calendrier CompactGrid]
		```

3. **Contenu de la dropdown**
	- **Options disponibles** :
		- Afficher tous les types tarifs disponibles pour le fournisseur actif.
		- Source des données : `listRateTypes(idFournisseur)` pour obtenir la liste des types tarifs du fournisseur.
		- Format d'affichage : libellé du type tarif (ex: "Base", "Pension complète", "Type 1001").
		- Si aucun type tarif n'existe : afficher "Aucun type tarif disponible" (disabled).
	- **Valeur par défaut** :
		- Au chargement initial : sélectionner le premier type tarif disponible (par ordre d'affichage ou `ordre` si disponible).
		- Si aucun type tarif n'est disponible : laisser la dropdown vide ou désactivée.
	- **Style visuel** :
		- Taille : normale (ex: `fontSize: 14px`).
		- Largeur : suffisante pour afficher les libellés complets (ex: `minWidth: 200px`).
		- Style : cohérent avec les autres contrôles de l'interface (bordure, padding, etc.).

4. **Comportement de la sélection**
	- **Portée de la sélection** :
		- La sélection s'applique à tout le calendrier affiché.
		- Toutes les cellules du calendrier affichent le prix correspondant au type tarif sélectionné.
		- La sélection est globale à l'application (pas spécifique à un fournisseur).
	- **Mise à jour des prix affichés** :
		- Lors du changement de sélection dans la dropdown :
			- Mettre à jour immédiatement tous les prix affichés dans le calendrier.
			- Pour chaque cellule (jour/hébergement) :
				- Chercher le prix correspondant au `idTypeTarif` sélectionné dans les données chargées.
				- Afficher ce prix s'il existe, sinon afficher "-".
	- **Persistance de la sélection** :
		- La sélection persiste pendant la session pour tous les fournisseurs.
		- Lors du changement de fournisseur (tab) : conserver le type de tarif sélectionné s'il existe dans le nouveau fournisseur.
			- Si le type tarif sélectionné n'existe pas dans le nouveau fournisseur : sélectionner le premier type tarif disponible du nouveau fournisseur.
		- Lors du rechargement de la page : perdre la sélection (revenir à la valeur par défaut).

5. **Affichage des prix dans le calendrier**
	- **Récupération du prix par type tarif** :
		- Structure de données à modifier :
			- Stocker les prix par type tarif : `ratesByAccommodation: Record<number, Record<string, Record<number, number>>>`
			- Clé 1 : `idHebergement`
			- Clé 2 : `dateStr` (format `YYYY-MM-DD`)
			- Clé 3 : `idTypeTarif`
			- Valeur : prix pour ce type tarif à cette date
		- Lors du chargement des tarifs via `getRates()` :
			- Pour chaque `TarifItem` retourné, extraire `idTypeTarif`.
			- Stocker le prix dans `ratesByAccommodation[accId][dateStr][idTypeTarif] = price`.
	- **Affichage conditionnel** :
		- Si un prix existe pour le type tarif sélectionné : afficher le prix au format `${Math.round(price)}€`.
		- Si aucun prix n'existe pour le type tarif sélectionné : afficher "-".
		- Format d'affichage : identique à l'existant (prix en haut, durée minimale en bas).

6. **Modification du prix avec type tarif sélectionné**
	- **Application du prix au type tarif sélectionné** :
		- Lors de la modification du prix (via l'édition existante) :
			- Appliquer le prix au type tarif actuellement sélectionné dans la dropdown globale.
			- Pour chaque date dans `selectedDates` et chaque hébergement dans `selectedAccommodations` :
				- Utiliser le `idTypeTarif` sélectionné globalement.
				- Mettre à jour `ratesByAccommodation[accId][dateStr][selectedRateTypeId] = newPrice`.
	- **Indication visuelle des modifications** :
		- L'astérisque jaune (`*`) indique que le prix du type tarif actuellement sélectionné a été modifié.
		- **Affichage conditionnel** :
			- L'astérisque est affichée uniquement si le prix du type tarif sélectionné dans la dropdown a été modifié.
			- Si l'utilisateur change le type tarif dans la dropdown, les astérisques doivent être mises à jour pour refléter les modifications du nouveau type tarif sélectionné.
		- Format de clé dans `modifiedRates` : `"${idHebergement}-${dateStr}-${idTypeTarif}"`.
		- Exemple : `"1-2025-03-15-1001"` indique que le prix du type tarif 1001 pour l'hébergement 1 le 15 mars 2025 a été modifié.
		- **Logique d'affichage** :
			- Pour chaque cellule, vérifier si `modifiedRates.has(\`${idHebergement}-${dateStr}-${selectedRateTypeId}\`)` est `true`.
			- Si oui, afficher l'astérisque jaune après le prix.
			- Si non, ne pas afficher l'astérisque.

7. **Gestion des cas limites**
	- **Aucun type tarif disponible** :
		- Si le fournisseur n'a aucun type tarif :
			- Afficher "Aucun type tarif disponible" dans la dropdown (disabled).
			- Afficher "-" dans toutes les cellules de prix du calendrier.
			- Désactiver l'édition des prix (ou permettre la création d'un type tarif).
	- **Hébergement sans tarif pour le type sélectionné** :
		- Si un hébergement n'a pas de tarif défini pour le type tarif sélectionné à une date donnée :
			- Afficher "-" dans la cellule correspondante.
			- Permettre l'édition pour créer un nouveau prix pour ce type tarif (clic sur "-" si sélection active).
	- **Changement de type tarif pendant l'édition** :
		- Si l'utilisateur change le type tarif dans la dropdown pendant l'édition d'un prix :
			- Annuler l'édition en cours.
			- Afficher les prix du nouveau type tarif sélectionné dans tout le calendrier.
			- Mettre à jour les astérisques pour refléter les modifications du nouveau type tarif sélectionné.
			- Permettre une nouvelle édition si nécessaire.

8. **Récupération et stockage des données**
	- **Chargement des types tarifs** :
		- Au chargement d'un fournisseur :
			- Appeler `listRateTypes(idFournisseur)` pour obtenir la liste des types tarifs.
			- Stocker dans un état : `rateTypesBySupplier: Record<number, RateType[]>`.
			- Utiliser cette liste pour remplir la dropdown.
	- **Chargement des tarifs par type** :
		- Lors du chargement des tarifs via `getRates()` :
			- Pour chaque `TarifItem` retourné :
				- Extraire `idTypeTarif`.
				- Pour chaque date dans la période (`debut` à `fin`) :
					- Stocker le prix dans `ratesByAccommodation[accId][dateStr][idTypeTarif] = price`.
					- Ne plus écraser les prix précédents, mais les organiser par type tarif.
	- **Affichage du prix sélectionné** :
		- Pour chaque cellule du calendrier :
			- Récupérer le `idTypeTarif` sélectionné globalement.
			- Chercher le prix dans `ratesByAccommodation[accId][dateStr][selectedRateTypeId]`.
			- Afficher ce prix s'il existe, sinon afficher "-".

9. **Implémentation technique**
	- **États à ajouter/modifier** :
		- Ajouter `selectedRateTypeId: number | null` pour suivre le type tarif sélectionné globalement (persiste entre les fournisseurs).
		- Modifier `ratesByAccommodation` pour stocker les prix par type tarif :
			- Type : `Record<number, Record<string, Record<number, number>>>`
		- Ajouter `rateTypesBySupplier: Record<number, RateType[]>` pour stocker les types tarifs par fournisseur.
		- Modifier `modifiedRates` pour inclure l'`idTypeTarif` dans la clé :
			- Format : `Set<string>` où chaque clé est `"${idHebergement}-${dateStr}-${idTypeTarif}"`.
	- **Composants à modifier** :
		- Ajouter la dropdown dans le composant `ProviderCalendars`, au-dessus du calendrier.
		- Modifier l'affichage des cellules pour utiliser le type tarif sélectionné globalement.
		- Modifier `handleRateUpdate` pour appliquer le prix au type tarif sélectionné globalement et mettre à jour `modifiedRates` avec la clé incluant l'`idTypeTarif`.
		- Modifier le chargement des tarifs pour stocker les prix par type tarif.
		- Modifier la logique d'affichage de l'astérisque pour vérifier les modifications du type tarif sélectionné.

10. **Exemples visuels**
	- **Interface avec dropdown** :
		```
		Hébergements — La Becterie
		
		Type de tarif : [Base ▼]
		
		☑ Hébergement 1
		☑ Hébergement 2
		
		[Calendrier avec prix du type "Base"]
		```
	- **Cellule avec prix disponible et modifié** :
		```
		  120€*
		   2+
		```
	- **Cellule avec prix disponible non modifié** :
		```
		  120€
		   2+
		```
	- **Cellule sans prix pour le type sélectionné** :
		```
		    -
		   2+
		```

11. **Limitations actuelles**
	- La création de nouveaux types tarifs depuis l'interface n'est pas implémentée (nécessite l'API `createRateType`).
	- La synchronisation avec le backend sera implémentée dans une phase ultérieure, sur l'appui d'un bouton "Sauvegarder".
	- La sélection du type tarif n'est pas persistée entre les sessions (rechargement de page).

##### Modification de la durée minimale de séjour — Exigences fonctionnelles

1. **Condition d'autorisation**
	- La modification de la durée minimale de séjour est **autorisée uniquement lorsqu'une sélection est active**.
	- Une sélection est considérée comme active si `selectedDates.size > 0` (au moins une colonne/jour est sélectionnée).
	- Si aucune sélection n'est active, les cellules de durée minimale ne sont pas éditables.

2. **Déclenchement de l'édition**
	- L'utilisateur peut **cliquer sur une cellule de durée minimale** (cellule contenant la durée minimale affichée au format `{dureeMin}+` ou `-`) pour entrer en mode édition.
	- Le clic peut être effectué **uniquement sur une cellule de durée minimale d'une colonne sélectionnée**.
	- Les cellules de durée minimale des colonnes non sélectionnées ne sont pas éditables et ne réagissent pas au clic.
	- Le clic peut être effectué même si la valeur affichée est `-` (durée minimale absente ou invalide).

3. **Mode édition**
	- Lors du clic sur une cellule de durée minimale, la cellule passe en **mode édition** :
		- La cellule devient un **champ de saisie** (`input` de type `number`).
		- La valeur actuelle de la durée minimale est pré-remplie dans le champ (sans le symbole "+").
		- Si la valeur actuelle est `null` ou absente (affichée comme `-`), le champ est initialement vide.
		- Le champ est automatiquement sélectionné (focus) pour permettre la saisie immédiate.
		- Le champ accepte uniquement des valeurs numériques entières positives (≥ 1).
	- Le mode édition peut être quitté de plusieurs façons :
		- **Validation** : appui sur la touche **Entrée (Enter)** ou **Tab** → applique la modification (voir point 4).
		- **Annulation** : appui sur la touche **Échap (Escape)** → annule la modification et restaure la valeur précédente.

4. **Application de la durée minimale à la sélection**
	- Lors de la validation de l'édition (Entrée ou Tab), la durée minimale saisie est **appliquée à l'ensemble de la sélection en cours** :
		- Pour chaque date dans `selectedDates` (Set des dates sélectionnées).
		- Pour chaque hébergement dans `selectedAccommodations` (Set des hébergements sélectionnés et affichés).
		- La durée minimale est mise à jour dans `dureeMinByAccommodation[acc.idHebergement][dateStr] = newDureeMin`.
	- **Gestion des valeurs vides ou nulles** :
		- Si l'utilisateur vide le champ ou saisit une valeur invalide (voir point 7), la durée minimale peut être définie à `null` pour indiquer l'absence de durée minimale.
	- **Note importante** : La modification est appliquée **uniquement en mémoire locale** (état React). Aucun appel API vers le stub serveur ou l'API Open Pro n'est effectué à ce stade.
	- Après l'application, la grille est **immédiatement mise à jour** pour refléter les nouvelles durées minimales dans toutes les cellules concernées.

5. **Comportement visuel pendant l'édition**
	- Pendant le mode édition d'une cellule de durée minimale, les autres cellules de durée minimale restent visibles et affichées normalement.
	- Les colonnes sélectionnées conservent leur surbrillance visuelle pendant l'édition.
	- Une fois la durée minimale appliquée, toutes les cellules concernées affichent la nouvelle valeur avec le format `{newDureeMin}+` ou `-` si la valeur est `null` ou ≤ 0.

6. **Indication visuelle des modifications non sauvegardées**
	- Comme les modifications sont appliquées uniquement en mémoire locale (sans persistance vers le serveur), chaque cellule de durée minimale modifiée doit afficher une **astérisque jaune** (`*`) après la valeur.
	- **Format d'affichage** : `{newDureeMin}+*` ou `-*` où l'astérisque est affichée en couleur jaune (`color: #eab308` ou équivalent).
	- **Suivi des modifications** : Un état local `modifiedDureeMin: Set<string>` peut être utilisé pour suivre les combinaisons `idHebergement-dateStr` qui ont été modifiées localement pour la durée minimale.
	- **Affichage conditionnel** : L'astérisque jaune est affichée uniquement si `modifiedDureeMin.has(\`${idHebergement}-${dateStr}\`)` est `true`.
	- **Persistance de l'indication** : L'astérisque reste visible tant que la modification n'a pas été sauvegardée vers le serveur (ou tant que les données ne sont pas rechargées depuis le serveur).
	- **Isolation par fournisseur** : Chaque fournisseur (onglet) possède ses **propres modifications non sauvegardées indépendantes**. Les astérisques jaunes affichées dans un onglet ne doivent **pas** apparaître dans un autre onglet. L'état de suivi des modifications doit être indexé par `idFournisseur` : `modifiedDureeMinBySupplier: Record<number, Set<string>>`. Lors du changement d'onglet, seules les modifications du fournisseur actif sont affichées et peuvent être sauvegardées.

7. **Gestion des valeurs invalides**
	- Si l'utilisateur saisit une valeur non numérique :
		- La validation (Entrée/Tab) peut être refusée avec un message d'erreur ou une restauration de la valeur précédente.
		- Ou la valeur peut être interprétée comme `null` (absence de durée minimale).
	- Si l'utilisateur saisit une valeur négative ou zéro :
		- La validation peut être refusée avec un message d'erreur.
		- Ou la valeur peut être interprétée comme `null` (absence de durée minimale).
	- Si l'utilisateur vide le champ :
		- La validation peut définir la durée minimale à `null` (absence de durée minimale).
	- Les valeurs décimales doivent être refusées (la durée minimale est exprimée en nombre entier de nuits).

8. **Implémentation technique**
	- Chaque cellule de durée minimale doit avoir un gestionnaire d'événement `onClick` qui :
		- Vérifie que `selectedDates.size > 0` (sélection active).
		- Vérifie que la date (`dateStr`) de la colonne correspondante fait partie de `selectedDates`.
		- Si les deux conditions sont remplies, passe la cellule en mode édition.
		- Sinon, le clic est ignoré et aucune action n'est effectuée.
	- Un état local `editingDureeMinCell: { accId: number; dateStr: string } | null` peut être utilisé pour suivre la cellule de durée minimale en cours d'édition (distinct de `editingCell` utilisé pour l'édition du prix).
	- La fonction d'application de la durée minimale doit itérer sur `selectedDates` et `selectedAccommodations` pour mettre à jour `dureeMinByAccommodation`.
	- Après la mise à jour, déclencher un re-render de la grille pour afficher les nouvelles durées minimales.
	- Lors de l'application d'une durée minimale modifiée, ajouter chaque combinaison `idHebergement-dateStr` concernée dans `modifiedDureeMin` pour permettre l'affichage de l'astérisque jaune.

9. **Cohabitation avec l'édition du prix**
	- L'édition de la durée minimale et l'édition du prix sont **indépendantes** :
		- Une seule cellule peut être en mode édition à la fois (soit prix, soit durée minimale).
		- Si une cellule de prix est en mode édition, les cellules de durée minimale ne peuvent pas être éditées et vice versa.
		- Lorsqu'une cellule passe en mode édition (prix ou durée minimale), l'autre mode d'édition doit être annulé si actif.
	- Les deux types de modifications peuvent être effectuées sur la même sélection, mais pas simultanément.

10. **Limitations actuelles**
	- **Pas de persistance** : Les modifications de durée minimale ne sont pas sauvegardées vers le serveur (stub ou API Open Pro).
	- Les modifications sont perdues lors d'un rechargement de la page ou d'un rechargement des données.
	- La synchronisation avec le backend sera implémentée dans une phase ultérieure, sur l'appui d'un bouton "Sauvegarder" (probablement le même bouton que pour les prix, ou un bouton dédié).

##### Affichage de la durée minimale de séjour — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Afficher la durée minimale de séjour dans chaque cellule du calendrier, sous le prix affiché.
	- La durée minimale provient de l'API via `client.getRates()` dans le champ `dureeMin` de chaque `TarifItem`.

2. **Condition d'affichage**
	- Afficher **toujours** la durée minimale dans toutes les cellules du calendrier, indépendamment de la présence d'un prix.
	- Ne pas afficher si :
		- La cellule est en mode édition (champ de saisie du prix).

3. **Position et structure**
	- Position : sous le prix (ou à la place du prix s'il n'y en a pas), sur une nouvelle ligne.
	- Structure : empilement vertical (prix au-dessus si présent, durée minimale en dessous).
	- Alignement : centré horizontalement, aligné verticalement au centre de la cellule.

4. **Format du texte**
	- Format : `"{dureeMin}+"`
	- Exemples :
		- `dureeMin = 1` → `"1+"`
		- `dureeMin = 2` → `"2+"`
		- `dureeMin = 7` → `"7+"`
		- `dureeMin` absent/undefined/null/≤0 → `"-"`

5. **Style visuel**
	- **Taille de police** : plus petite que le prix.
		- Prix : `fontSize: 13px`
		- Durée minimale : `fontSize: 10px` ou `fontSize: 11px`
	- **Couleur** : grisée.
		- Prix : `color: '#111827'`
		- Durée minimale : `color: '#6b7280'` ou `color: '#9ca3af'`
	- **Poids de police** : `fontWeight: 400` (normal, plus léger que le prix).
	- **Espacement** : `marginTop: 2px` ou `marginTop: 4px` entre le prix et la durée minimale.

6. **Gestion des données**
	- **Stockage** : Un état `dureeMinByAccommodation: Record<number, Record<string, number | null>>` stocke les durées minimales par hébergement et par date.
	- **Récupération** : Lors du chargement des tarifs (`client.getRates()`), extraire `dureeMin` de chaque `TarifItem` et l'associer à chaque date de la période (`debut` à `fin`).
	- **Gestion des chevauchements** : Si plusieurs périodes se chevauchent, utiliser la première période trouvée ou la valeur la plus restrictive (maximum).
	- **Valeurs manquantes** : Si `dureeMin` est absent/undefined/null/≤0, stocker `null` pour cette date.

7. **Cas limites**
	- Si `dureeMin` est absent/undefined/null/≤0 : afficher `"-"` au lieu de ne rien afficher.
	- Pendant l'édition du prix : masquer la durée minimale pour éviter la confusion.
	- Si la cellule est trop petite : la durée minimale peut être tronquée ou masquée (à définir selon les tests UX).

8. **Implémentation technique**
	- Ajouter un état `dureeMinByAccommodation` dans le composant `ProviderCalendars`.
	- Modifier la logique de chargement des tarifs pour extraire `dureeMin` de chaque période tarifaire.
	- Passer `dureeMinByAccommodation` au composant `CompactGrid` via les props.
	- Modifier l'affichage des cellules pour inclure la durée minimale avec les styles appropriés.
	- Utiliser une structure flexbox verticale pour empiler le prix et la durée minimale.

9. **Exemples visuels**
	- **Cellule avec prix et durée minimale** :
		```
		   120€
		   2+
		```
	- **Cellule avec prix modifié et durée minimale** :
		```
		   120€*
		   2+
		```
	- **Cellule sans prix mais avec durée minimale** :
		```
		   7+
		```
	- **Cellule avec prix mais sans durée minimale valide** :
		```
		   120€
		    -
		```
	- **Cellule sans prix ni durée minimale valide** :
		```
		    -
		```

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

