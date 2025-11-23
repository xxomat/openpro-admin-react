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

L'application communique avec un backend Node.js/Fastify (`OpenPro.Backend`) qui gère tous les appels à l'API Open Pro Multi v1. Le frontend n'accède plus directement à l'API OpenPro, ce qui permet de sécuriser la clé API côté serveur. Le backend expose une API REST simplifiée que le frontend consomme via des requêtes HTTP fetch.

**Note importante:** Le frontend n'a plus de dépendance directe sur `openpro-api-react`, toutes les interactions avec l'API OpenPro transitent par le backend.

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
- Backend API: OpenPro.Backend (dépôt séparé) exposant une API REST
- Client HTTP: fetch API native pour communiquer avec le backend
- Ciblage Navigateurs: modernes (ESM); rétrocompatibilité à définir selon besoin
- Outils: ESLint/TSConfig fournis par le projet, configuration Astro

### 2.2 Structure du projet

Arborescence principale du dépôt :

- `OpenPro.Admin/` — Application Astro + React (frontend admin)
	- `src/pages/` — Pages Astro (routage par fichiers, ex: `index.astro`)
	- `src/components/` — Composants UI (Astro/React)
	- `src/services/api/` — Client HTTP pour communiquer avec le backend
	- `src/layouts/` — Layouts Astro
	- `public/` — Assets statiques
	- `package.json` — Dépendances et scripts (dev/build)

Note : Le backend (`OpenPro.Backend`) est dans un dépôt Git séparé. Il gère tous les appels à l'API OpenPro et expose une API REST pour le frontend.

**Note importante:** Le frontend n'a plus de référence à `openpro-api-react`. L'ancien alias `@openpro-api-react` a été supprimé. Le backend gère cette dépendance via son propre sous-module Git.

Consommation du backend :
- Le frontend utilise le client HTTP (`src/services/api/backendClient.ts`) pour appeler les endpoints du backend.
- Les endpoints du backend sont configurés via la variable d'environnement `PUBLIC_BACKEND_BASE_URL`.

### 2.3 Architecture actuelle

Vue d'ensemble :
- Astro gère le routage, le rendu statique/SSR et l'assemblage des pages.
- Les zones interactives sont implémentées en React (îles Astro) montées dans les pages `.astro`.
- Le frontend React communique avec le backend via fetch HTTP. Le backend gère l'authentification avec l'API OpenPro et expose des endpoints REST simplifiés. Le frontend n'a plus accès à la clé API.
- Vite est utilisé pour le dev server et le bundling, avec TypeScript pour la sécurité de types.

**Architecture en couches:** Frontend → Backend → openpro-api-react (client) → API OpenPro. Le frontend ne connaît que le backend.

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
	- **Date de fin** (`endDate: Date`, alias `TimeBaseEndDate`) : date sélectionnée par l'utilisateur jusqu'à laquelle se termine l'affichage (incluse).
	- La période affichée est définie par l'intervalle `[startDate, endDate]` (inclusif).
	- **Validation** : La Date de fin doit être postérieure ou égale à la Date de début. Si la Date de fin est antérieure à la Date de début, afficher un message d'erreur et empêcher la génération du calendrier.
	- **Valeurs par défaut** : Au chargement initial, la Date de début peut être définie à aujourd'hui ou à une date par défaut. La Date de fin doit être initialisée à **1 mois après la Date de début** (pour conserver un comportement similaire à l'existant). L'écart de temps entre `startDate` et `endDate` doit donc être initialisé à **1 mois**.
	- **Interface utilisateur** : Le composant `DateRangeControls` doit afficher deux champs de type `date` HTML5 :
		- Un champ "Date de début" (existant)
		- Un champ "Date de fin" (remplaçant le select "Durée" avec options 1, 2 ou 3 mois)
		- Les deux champs doivent avoir le même style et le même comportement
		- Les deux champs doivent être côte à côte dans l'interface
		- Les deux champs doivent être accessibles au clavier et respecter les standards d'accessibilité (attributs `aria-label`)
	- **Persistance** : Les dates de début et de fin peuvent être stockées dans l'état local du composant. Optionnel : persister les dates dans le localStorage pour conserver la sélection entre les sessions.

2. **Chargement des hébergements**
	- **Chargement initial uniquement** : 
		- Au chargement initial de la page web uniquement, pour **chaque fournisseur** (`suppliers: Supplier[]`), charger la liste complète des hébergements (`accommodations: Accommodation[]`).
		- Chaque hébergement contient : `idHebergement: number` et `nomHebergement: string`.
		- La liste des hébergements doit être **affichée par ordre alphabétique** des noms (`nomHebergement`).
		- **Note** : Le chargement initial se fait pour tous les fournisseurs disponibles, pas uniquement pour le fournisseur actif.
	- **Chargement lors du changement d'onglet** :
		- **Aucun chargement automatique** : Lors du changement d'onglet, les hébergements ne sont **pas** rechargés automatiquement.
		- Les hébergements déjà chargés en mémoire pour le fournisseur sélectionné sont réaffichés telles quelles.

3. **Filtrage des hébergements**
	- Afficher une liste de **checkboxes** permettant de sélectionner les hébergements à afficher.
	- L'état de sélection est stocké dans `selectedAccommodations: Set<number>` (Set des IDs d'hébergements sélectionnés).
	- Par défaut, tous les hébergements sont sélectionnés au chargement.
	- Seuls les hébergements sélectionnés (`selectedAccommodations`) apparaissent dans la grille.

4. **Chargement des données (stock et tarifs)**
	- **Chargement initial** : 
		- Au chargement initial de la page web uniquement, pour **chaque fournisseur** (`suppliers: Supplier[]`), charger les données pour chaque hébergement sélectionné sur la période `[startDate, endDate)` :
			- **Stock** (`stockByAccommodation: Record<idHebergement, Record<dateStr, stock>>`) : stock disponible par date (format `dateStr: "YYYY-MM-DD"`).
			- **Tarifs** (`ratesByAccommodation: Record<idHebergement, Record<dateStr, price>>`) : prix par date pour 2 personnes (format entier en euros).
		- **Note** : Le chargement initial se fait pour tous les fournisseurs disponibles, pas uniquement pour le fournisseur actif.
	- **Chargement lors du changement d'onglet** :
		- **Aucun chargement automatique** : Lors du changement d'onglet (passage d'un fournisseur à un autre), les données ne sont **pas** rechargées automatiquement depuis le serveur.
		- Les données déjà chargées en mémoire pour le fournisseur sélectionné sont réaffichées telles quelles.
	- **Fusion des données lors de tout rechargement** :
		- Lors de **tout** rechargement des données (bouton "Actualiser les données", après fermeture/ouverture de dates, après création/suppression de réservation, etc.), les nouvelles données pour la période `[startDate, endDate)` doivent être **fusionnées** avec les données existantes en mémoire, et non remplacées complètement.
		- **Préservation des dates hors plage** : Les dates en dehors de la plage actuellement chargée (`[startDate, endDate)`) doivent être préservées pour éviter leur perte lors du scroll ou du changement de plage de dates.
		- **Comportement de fusion** :
			- Pour chaque hébergement, les données existantes (stock, tarifs, promotions, types de tarifs, durées minimales) sont conservées.
			- Les nouvelles données chargées pour la période `[startDate, endDate)` sont fusionnées avec les données existantes, en écrasant uniquement les dates qui se trouvent dans cette plage.
			- Les dates en dehors de la plage `[startDate, endDate)` conservent leurs valeurs précédentes.
		- **Garantie de cohérence** : Cette fusion garantit que l'affichage reste cohérent même après avoir modifié le stock ou les tarifs pour une plage de dates spécifique, puis avoir fait défiler le calendrier pour afficher des dates en dehors de cette plage.
		- **Exception** : Les réservations (`bookings`) sont toujours remplacées complètement lors de l'actualisation, car elles peuvent changer globalement et ne sont pas liées à une plage de dates spécifique.
	- **Bouton "Actualiser les données"** :
		- Un bouton **"Actualiser les données"** (ou "Fetch data") doit être affiché dans l'interface, à proximité du bouton de Sauvegarde des moficiations.
		- **Action du bouton** : Lors du clic sur ce bouton :
			- Recharger les données (stock et tarifs) depuis le serveur pour le fournisseur actif et les hébergements sélectionnés sur la période `[startDate, endDate)`.
			- **Remettre à zéro les indicateurs visuels des modifications non sauvegardées** : Toutes les astérisques jaunes (`*`) indiquant des modifications non sauvegardées doivent être supprimées pour le fournisseur actif.
			- Vider les états de suivi des modifications : `modifiedRatesBySupplier[activeSupplier.idFournisseur]` et `modifiedDureeMinBySupplier[activeSupplier.idFournisseur]` doivent être réinitialisés à des `Set` vides.
		- **État du bouton** : Le bouton peut afficher un état de chargement pendant le fetch (ex: "Actualisation..." ou spinner).
		- **Visibilité** : Le bouton doit être visible pour tous les fournisseurs et fonctionner indépendamment pour chaque onglet.

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
			- **Bordures** : Les cellules de données n'ont **pas** de bordures (toutes les bordures sont définies à `none`). L'affichage se fait uniquement via les couleurs de fond pour différencier les états.

4. **Génération des jours**
	- La fonction `getDaysInRange(startDate, endDate)` génère un tableau de dates (`days: Date[]`) couvrant toutes les dates entre `startDate` et `endDate` (incluses).
	- Les dates sont générées dans l'ordre chronologique, jour par jour, sans limitation à des durées prédéfinies.
	- Le tableau de dates est utilisé directement pour créer les colonnes de la grille : `allDays = getDaysInRange(startDate, endDate)`.
	- **Note importante** : Au lieu de générer les dates sur une durée fixe (1, 2 ou 3 mois), le calendrier liste toutes les dates entre la Date de début et la Date de fin (incluses), sans limitation à des durées prédéfinies.

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
	- **Restriction pour les dates passées** : Les dates antérieures à aujourd'hui ne peuvent **pas** être sélectionnées (voir section 1.1 pour les détails).

1.1. **Gestion des dates passées**
	- **Définition** : Une date est considérée comme "passée" si elle est antérieure à aujourd'hui (date du jour, sans l'heure).
	- **Style visuel des cellules de données** :
		- **Fond** : Les dates passées doivent avoir un fond sombre identique à celui de l'en-tête du calendrier (`darkTheme.gridHeaderBg` ou `#1e293b`).
		- **Opacité** : Les dates passées doivent avoir une opacité réduite (`opacity: 0.6`) pour indiquer leur état désactivé.
		- **Bordures** : Les dates passées n'ont **pas** de bordures (toutes les bordures sont définies à `none`), comme toutes les autres cellules de dates.
		- **Couleur de texte** : La couleur de texte reste identique aux autres cellules (`darkTheme.textPrimary`).
	- **Style visuel des cellules d'en-tête** :
		- **Fond** : Les dates passées dans les en-têtes doivent avoir un fond sombre identique à celui de l'en-tête du calendrier (`darkTheme.gridHeaderBg`).
		- **Opacité** : Les dates passées dans les en-têtes doivent avoir une opacité réduite (`opacity: 0.6`) pour indiquer leur état désactivé.
		- **Couleur de texte** : La couleur de texte reste identique aux autres en-têtes (`darkTheme.textSecondary`).
	- **Désactivation de la sélection** :
		- Les dates passées ne peuvent **pas** être sélectionnées par clic sur la cellule d'en-tête.
		- Les dates passées ne peuvent **pas** être sélectionnées par drag.
		- Les dates passées ne peuvent **pas** être sélectionnées via le bouton "Sélectionner toute la plage" ou le raccourci Ctrl+A.
		- Les dates passées ne doivent **pas** apparaître dans `selectedCells` ou `selectedDates`.
	- **Indicateur visuel d'interaction** :
		- Le curseur doit être `not-allowed` au survol des dates passées (cellules de données et d'en-tête) pour indiquer qu'elles ne sont pas sélectionnables.
		- Les cellules d'en-tête des dates passées ne doivent pas avoir le curseur `grab` ou `pointer`.
	- **Comportement avec les autres restrictions** : Les dates passées sont soumises aux mêmes restrictions que les dates occupées par une réservation (voir section 8).

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
		- Si la colonne n'est pas sélectionnée et n'est **pas** une date passée → la sélectionne et applique la surbrillance.
		- Si la colonne est déjà sélectionnée → la désélectionne et retire la surbrillance.
		- Si la colonne est une date passée → aucune action (la sélection est ignorée).
	- Le curseur doit changer en `cursor: pointer` au survol des cellules d'en-tête pour indiquer l'interactivité, sauf pour les dates passées où le curseur doit être `not-allowed`.
	- La sélection est **indépendante** pour chaque colonne (sélection multiple possible), mais exclut les dates passées.
	- Un **appui sur la touche Échap (Escape)** annule toute sélection : toutes les colonnes sont désélectionnées et la surbrillance est retirée.

5. **Sélection de toute la plage de dates**
	- **Bouton "Sélectionner toute la plage"** :
		- Un bouton **"Sélectionner toute la plage"** doit être affiché à proximité des contrôles de date (DateRangeControls), permettant de sélectionner toutes les dates entre `startDate` et `endDate` en un seul clic.
		- **Action du bouton** : Lors du clic sur ce bouton :
			- Sélectionner toutes les dates entre `startDate` (incluse) et `endDate` (incluse) pour tous les hébergements sélectionnés (ou tous les hébergements si aucun filtre n'est appliqué).
			- **Respect des règles de sélection** : 
				- Les dates occupées par une réservation ne doivent **pas** être sélectionnées (voir section 8 pour les restrictions).
				- Les dates passées (antérieures à aujourd'hui) ne doivent **pas** être sélectionnées.
			- Désélectionner automatiquement toute réservation sélectionnée (si une réservation était sélectionnée, elle est désélectionnée).
		- **Visibilité** : Le bouton doit être visible pour tous les fournisseurs et fonctionner indépendamment pour chaque onglet.
		- **Tooltip** : Le bouton doit afficher un tooltip indiquant le raccourci clavier équivalent : "Sélectionner toutes les dates entre la date de début et la date de fin (Ctrl+A)".
	- **Raccourci clavier Ctrl+A (ou Cmd+A sur Mac)** :
		- Le raccourci clavier **Ctrl+A** (Windows/Linux) ou **Cmd+A** (Mac) déclenche la même action que le bouton "Sélectionner toute la plage".
		- **Conditions d'activation** :
			- Le raccourci ne doit **pas** être activé si un champ de saisie (input, textarea) est actuellement en focus, pour éviter de sélectionner le texte dans le champ au lieu de sélectionner les dates du calendrier.
			- Le raccourci doit être désactivé si l'utilisateur est en train d'éditer un prix ou une durée minimale dans une cellule du calendrier.
		- **Comportement** :
			- Sélectionne toutes les dates entre `startDate` et `endDate` (incluses) pour tous les hébergements sélectionnés (ou tous les hébergements si aucun filtre n'est appliqué).
			- **Respect des règles de sélection** : 
				- Les dates occupées par une réservation ne doivent **pas** être sélectionnées (voir section 8 pour les restrictions).
				- Les dates passées (antérieures à aujourd'hui) ne doivent **pas** être sélectionnées.
			- Désélectionne automatiquement toute réservation sélectionnée.
		- **Isolation par fournisseur** : Le raccourci fonctionne uniquement pour le fournisseur actif (onglet actuellement affiché).
	- **Implémentation technique** :
		- Le gestionnaire d'événement `keydown` doit écouter les événements `Ctrl+A` (ou `Cmd+A` sur Mac) au niveau du composant principal.
		- Vérifier que `event.target` n'est pas un élément de type `input`, `textarea`, ou autre champ de saisie avant d'exécuter l'action.
		- La fonction de sélection doit itérer sur toutes les dates entre `startDate` et `endDate` et sur tous les hébergements concernés, en excluant :
			- Les dates occupées par une réservation.
			- Les dates passées (antérieures à aujourd'hui).
		- Utiliser `selectedCells: Set<string>` au format `"accId|dateStr"` pour stocker la sélection.

6. **Sélection par drag de la souris**
	- **Déclenchement du drag**
		- Le drag peut être initié **uniquement depuis les cellules d'en-tête** (ligne 1).
		- Le drag commence lors d'un **mousedown** (clic maintenu) sur une cellule d'en-tête.
		- La colonne de départ est identifiée par la date (`dateStr`) de la cellule d'en-tête où le drag commence.
		- **Restriction** : Le drag ne peut **pas** être initié depuis une date passée. Si l'utilisateur tente de faire un drag depuis une date passée, l'action est ignorée.
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
		- Toutes les colonnes de la sélection temporaire sont ajoutées à `selectedDates` (ou sélectionnées si elles ne l'étaient pas déjà), **sauf les dates passées** qui sont exclues de la sélection.
		- Si le drag est très court (moins de 5 pixels de déplacement), il est considéré comme un clic simple et suit le comportement du clic (toggle de la colonne de départ, avec exclusion des dates passées).
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

7. **Implémentation technique**
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

8. **Champ d'affichage du résumé de sélection (pour tests)**
	- Un **champ texte en lecture seule** (`textarea`) doit être affiché sous le calendrier pour afficher un résumé formaté de la sélection.
	- **Restriction de sélection pour les dates occupées** :
		- Les dates occupées par une réservation ne doivent **pas** être sélectionnables (ni par clic, ni par drag).
		- Une date est considérée comme occupée si elle appartient à la période d'une réservation : du jour d'arrivée inclus au jour de départ exclus.
		- Exemple : Pour une réservation avec `dateArrivee = "2025-06-15"` et `dateDepart = "2025-06-22"`, les dates occupées sont : 15, 16, 17, 18, 19, 20, 21 (le 22 est exclu car c'est le jour de départ).
		- Cette restriction s'applique à **toutes** les réservations, quelle que soit la plateforme d'origine (Booking.com, Directe, OpenPro, Xotelia, etc.).
		- Cette restriction s'applique également aux réservations Direct en attente de synchronisation (`isPendingSync: true`) et aux réservations obsolètes (`isObsolete: true`).
		- **Style visuel** : Les cellules occupées par une réservation doivent afficher un curseur `not-allowed` au survol pour indiquer qu'elles ne sont pas sélectionnables.

	- **Restriction de sélection pour les dates occupées** :
		- Les dates occupées par une réservation ne doivent **pas** être sélectionnables (ni par clic, ni par drag).
		- Une date est considérée comme occupée si elle appartient à la période d'une réservation : du jour d'arrivée inclus au jour de départ exclus.
		- Exemple : Pour une réservation avec `dateArrivee = "2025-06-15"` et `dateDepart = "2025-06-22"`, les dates occupées sont : 15, 16, 17, 18, 19, 20, 21 (le 22 est exclu car c'est le jour de départ).
		- Cette restriction s'applique à **toutes** les réservations, quelle que soit la plateforme d'origine (Booking.com, Directe, OpenPro, Xotelia, etc.).
		- Cette restriction s'applique également aux réservations Direct en attente de synchronisation (`isPendingSync: true`) et aux réservations obsolètes (`isObsolete: true`).
		- **Style visuel** : Les cellules occupées par une réservation doivent afficher un curseur `not-allowed` au survol pour indiquer qu'elles ne sont pas sélectionnables.

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
	- **Réinitialisation lors de l'actualisation** : Lors de l'utilisation du bouton "Actualiser les données", toutes les astérisques jaunes du fournisseur actif sont automatiquement supprimées, même si les données rechargées correspondent aux modifications locales. Cela permet à l'utilisateur de repartir d'un état propre après avoir rechargé les données depuis le serveur.

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
	- ✅ **Sauvegarde en bulk implémentée** : Les modifications de prix et de durée minimale peuvent être sauvegardées via le bouton "Sauvegarder" (voir section 6.4).

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
	- **Réinitialisation lors de l'actualisation** : Lors de l'utilisation du bouton "Actualiser les données", toutes les astérisques jaunes du fournisseur actif sont automatiquement supprimées, même si les données rechargées correspondent aux modifications locales. Cela permet à l'utilisateur de repartir d'un état propre après avoir rechargé les données depuis le serveur.

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
	- ✅ **Sauvegarde en bulk implémentée** : Les modifications de durée minimale peuvent être sauvegardées via le bouton "Sauvegarder" (voir section 6.4).

##### Bouton d'actualisation des données — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Un bouton **"Actualiser les données"** permet à l'utilisateur de recharger manuellement les données depuis le serveur pour le fournisseur actif.

2. **Position et placement**
	- **Emplacement du bouton** :
		- Position : à proximité du bouton de Sauvegarde des modifications.
		- Visibilité : toujours visible, quel que soit le fournisseur actif.

3. **Comportement du bouton**
	- **Action principale** :
		- Au clic sur le bouton, déclencher le rechargement des données suivantes pour le fournisseur actif uniquement :
			- Liste des hébergements (si nécessaire ou si pas encore chargée)
			- Stock pour chaque hébergement sélectionné sur la période `[startDate, endDate)`
			- Tarifs pour chaque hébergement sélectionné sur la période `[startDate, endDate)`
			- Types de tarifs disponibles pour le fournisseur
		- **Note importante** : Ce bouton permet de recharger les données **du fournisseur actif uniquement**. Le chargement initial de la page charge les données de tous les fournisseurs, mais après cela, seul le bouton permet de recharger les données, et uniquement pour le fournisseur actif.
	- **Réinitialisation des indicateurs visuels** :
		- **Obligatoire** : Après le rechargement réussi des données, remettre à zéro tous les indicateurs visuels de modifications non sauvegardées pour le fournisseur actif :
			- Vider `modifiedRatesBySupplier[activeSupplier.idFournisseur]` (Set vide)
			- Vider `modifiedDureeMinBySupplier[activeSupplier.idFournisseur]` (Set vide)
			- Supprimer toutes les astérisques jaunes (`*`) affichées dans le calendrier pour le fournisseur actif
		- Cette réinitialisation doit se faire **après** le chargement réussi des données, mais **avant** la mise à jour de l'affichage.
	- **Gestion des erreurs** :
		- Si le chargement échoue, afficher un message d'erreur approprié.
		- En cas d'erreur, **ne pas** réinitialiser les indicateurs visuels (les modifications locales doivent être préservées).

4. **État du bouton**
	- **État normal** : Bouton cliquable avec le texte "Actualiser les données" (ou icône de rafraîchissement).
	- **État de chargement** : Pendant le fetch des données :
		- Désactiver le bouton (`disabled: true`)
		- Afficher un indicateur de chargement (ex: texte "Actualisation..." ou spinner)
		- Empêcher les interactions utilisateur pendant le chargement
	- **Retour à l'état normal** : Après le chargement (succès ou échec), restaurer l'état normal du bouton.

5. **Isolation par fournisseur**
	- Le bouton agit uniquement sur le fournisseur actif (`activeSupplier`).
	- Les modifications non sauvegardées des autres fournisseurs (autres onglets) ne sont **pas** affectées par l'actualisation.
	- Chaque fournisseur peut être actualisé indépendamment.

6. **Cas limites**
	- **Aucun hébergement sélectionné** : Si `selectedAccommodations.size === 0`, le bouton peut être désactivé ou afficher un message d'avertissement.
	- **Données déjà en cours de chargement** : Si un chargement est déjà en cours, ignorer les clics supplémentaires ou afficher un message approprié.
	- **Changement d'onglet pendant le chargement** : Si l'utilisateur change d'onglet pendant le chargement, annuler le chargement en cours et ne pas appliquer les modifications aux données du nouvel onglet.

7. **Implémentation technique**
	- Le bouton doit déclencher une fonction `handleRefreshData` qui :
		1. Met à jour l'état de chargement (`setLoading(true)`)
		2. Réinitialise les erreurs (`setError(null)`)
		3. Charge les données depuis le serveur (hébergements, stock, tarifs, types de tarifs) pour la période `[startDate, endDate)`
		4. Met à jour les états de données (`setAccommodations`, `setStockByAccommodation`, `setRatesByAccommodation`, etc.)
		5. **Réinitialise les indicateurs visuels** :
			- `setModifiedRatesBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }))`
			- `setModifiedDureeMinBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }))`
		6. Met à jour l'état de chargement (`setLoading(false)`)
	- La fonction doit gérer les erreurs et annuler les requêtes si nécessaire (cleanup).
	- **Note** : Les fonctions de chargement des données doivent utiliser `startDate` et `endDate` au lieu de `startDate` et `monthsCount`. Les fonctions suivantes doivent être modifiées :
		- `loadSupplierData(client, idFournisseur, accommodationsList, startDate, endDate, signal)`
		- `refreshSupplierData(idFournisseur, startDate, endDate)`
		- `loadInitialData(suppliers, startDate, endDate)`

##### Sauvegarde en bulk des modifications — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Un bouton **"Sauvegarder"** permet de sauvegarder toutes les modifications non sauvegardées (tarifs et durées minimales) pour le fournisseur actif.
	- Les modifications sont envoyées au backend en une seule requête bulk pour optimiser les performances.

2. **Position et placement**
	- **Emplacement du bouton** :
		- Position : à proximité du bouton "Actualiser les données".
		- Visibilité : affiché uniquement si des modifications existent (`modifiedRates.size > 0` ou `modifiedDureeMin.size > 0`).
		- Texte : "Sauvegarder (X modification(s))" où X est le nombre total de modifications.

3. **Structure des données envoyées**
	- **Format de la requête** :
		```typescript
		POST /api/suppliers/:idFournisseur/bulk-update
		{
		  accommodations: [
		    {
		      idHebergement: number,
		      dates: [
		        {
		          date: string,              // YYYY-MM-DD
		          rateTypeId?: number,       // présent si tarif modifié
		          price?: number,            // présent si tarif modifié
		          dureeMin?: number | null   // présent si dureeMin modifiée
		        }
		      ]
		    }
		  ]
		}
		```
	- **Collecte des modifications** :
		- Pour chaque modification dans `modifiedRates` (format: `"${idHebergement}-${dateStr}-${idTypeTarif}"`), extraire les informations nécessaires.
		- Pour chaque modification dans `modifiedDureeMin` (format: `"${idHebergement}-${dateStr}"`), extraire les informations nécessaires.
		- Grouper les modifications par hébergement, puis par date.
		- N'envoyer que les données réellement modifiées (pas toutes les dates/hébergements).

4. **Comportement du bouton**
	- **Action principale** :
		- Au clic sur le bouton, collecter toutes les modifications du fournisseur actif.
		- Transformer les modifications en structure bulk.
		- Envoyer la requête `POST /api/suppliers/:idFournisseur/bulk-update` au backend.
		- Afficher un état de chargement pendant la sauvegarde.
	- **Réinitialisation après succès** :
		- Après une sauvegarde réussie :
			- Vider `modifiedRatesBySupplier[activeSupplier.idFournisseur]` (Set vide).
			- Vider `modifiedDureeMinBySupplier[activeSupplier.idFournisseur]` (Set vide).
			- Supprimer toutes les astérisques jaunes (`*`) affichées dans le calendrier pour le fournisseur actif.
	- **Gestion des erreurs** :
		- Si la sauvegarde échoue, afficher un message d'erreur approprié.
		- En cas d'erreur, **ne pas** réinitialiser les indicateurs visuels (les modifications locales doivent être préservées).
		- Permettre à l'utilisateur de réessayer la sauvegarde.

5. **État du bouton**
	- **État normal** : Bouton cliquable avec le texte "Sauvegarder (X modification(s))".
	- **État de chargement** : Pendant la sauvegarde :
		- Désactiver le bouton (`disabled: true`).
		- Afficher un indicateur de chargement (ex: texte "Sauvegarde..." ou spinner).
		- Empêcher les interactions utilisateur pendant la sauvegarde.
	- **Retour à l'état normal** : Après la sauvegarde (succès ou échec), restaurer l'état normal du bouton.

6. **Isolation par fournisseur**
	- Le bouton agit uniquement sur le fournisseur actif (`activeSupplier`).
	- Les modifications non sauvegardées des autres fournisseurs (autres onglets) ne sont **pas** affectées par la sauvegarde.
	- Chaque fournisseur peut être sauvegardé indépendamment.

7. **Cas limites**
	- **Aucune modification** : Si `modifiedRates.size === 0` et `modifiedDureeMin.size === 0`, le bouton n'est pas affiché.
	- **Sauvegarde déjà en cours** : Si une sauvegarde est déjà en cours, ignorer les clics supplémentaires ou afficher un message approprié.
	- **Changement d'onglet pendant la sauvegarde** : Si l'utilisateur change d'onglet pendant la sauvegarde, la sauvegarde continue pour le fournisseur d'origine.

8. **Implémentation technique**
	- Le bouton doit déclencher une fonction `handleSave` qui :
		1. Collecte les modifications depuis `modifiedRatesBySupplier` et `modifiedDureeMinBySupplier` pour le fournisseur actif.
		2. Transforme les modifications en structure bulk (groupées par hébergement puis par date).
		3. Met à jour l'état de chargement (`setSaving(true)`).
		4. Appelle `saveBulkUpdates(idFournisseur, bulkData)` du client API backend.
		5. En cas de succès :
			- Réinitialise les indicateurs visuels :
				- `setModifiedRatesBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }))`
				- `setModifiedDureeMinBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }))`
		6. Met à jour l'état de chargement (`setSaving(false)`).
	- La fonction doit gérer les erreurs et afficher des messages appropriés.

##### Bouton "Ouvrir" pour réactiver les dates non disponibles — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Lorsqu'une sélection de cellules contient au moins une date avec stock à 0 (indisponible), un bouton "Ouvrir" doit apparaître dans la barre d'actions.
	- Ce bouton permet de remettre le stock à 1 pour toutes les dates non disponibles (stock = 0) présentes dans la sélection actuelle.
	- Les dates avec stock > 0 dans la sélection ne sont pas modifiées.

2. **Conditions d'affichage**
	- **Bouton "Ouvrir" visible** : Uniquement si la sélection contient au moins une cellule avec stock à 0.
	- **Position** : Le bouton doit apparaître à côté du bouton "Sauvegarder" dans le composant `ActionButtons`, à gauche des autres boutons.
	- **Style** : Bouton d'action secondaire (couleur différente du bouton "Sauvegarder") avec icône ou texte explicite.
	- **Texte du bouton** : "Ouvrir (X dates)" où X est le nombre de dates non disponibles sélectionnées.

3. **Comportement fonctionnel**
	- **Clic sur "Ouvrir"** :
		- Identifier toutes les cellules sélectionnées avec stock à 0.
		- Grouper ces cellules par hébergement (`idHebergement`).
		- Pour chaque hébergement, créer un payload de mise à jour du stock contenant uniquement les dates avec stock à 0.
		- Envoyer une requête au backend pour mettre à jour le stock à 1 pour ces dates spécifiques.
		- **Cas limites** :
			- Si une date a déjà un stock à 1, elle est ignorée (ne fait pas partie des dates avec stock à 0).
			- Toutes les dates valides (format YYYY-MM-DD) peuvent être créées ou mises à jour dans OpenPro via l'API. Il n'existe pas de cas d'erreur pour une "date qui n'existe pas" car l'API OpenPro crée automatiquement les entrées de stock pour les dates valides.
		- En cas de succès, rafraîchir les données pour refléter les changements de stock.
		- En cas d'erreur, afficher un message d'erreur à l'utilisateur.

4. **Détails d'implémentation**

	4.1. **Détection des dates non disponibles dans la sélection**
		- Dans `ProviderCalendars/index.tsx`, créer un `useMemo` qui :
			- Parcourt toutes les cellules de `selectedCells`.
			- Pour chaque cellule (`accId|dateStr`), vérifie le stock via `stockByAccommodation[accId]?.[dateStr] ?? 0`.
			- Retourne un objet `Record<number, Set<string>>` (hébergement → dates avec stock à 0) contenant uniquement les dates non disponibles sélectionnées.

	4.2. **Comptage des dates non disponibles**
		- Calculer le nombre total de dates non disponibles sélectionnées pour déterminer l'affichage du bouton et le texte du bouton (ex: "Ouvrir (5 dates)").

	4.3. **Composant ActionButtons**
		- Ajouter une prop `unavailableDatesCount?: number` au composant `ActionButtons`.
		- Ajouter une prop `onOpenUnavailable?: () => void` pour le callback du clic.
		- Afficher conditionnellement le bouton "Ouvrir" si `unavailableDatesCount > 0`.
		- Le bouton doit avoir un style distinct (ex: couleur orange/jaune pour différencier de "Sauvegarder").

	4.4. **Fonction de mise à jour du stock**
		- Utiliser la fonction `updateStock()` dans `backendClient.ts` qui appelle `POST /api/suppliers/:idFournisseur/accommodations/:idHebergement/stock` du backend.

	4.5. **Handler d'ouverture**
		- Dans `ProviderCalendars/index.tsx`, créer une fonction `handleOpenUnavailable()` qui :
			- Récupère les dates non disponibles groupées par hébergement (via le `useMemo` de détection).
			- Pour chaque hébergement, construit un payload avec les dates à mettre à jour (stock = 1).
			- Appelle `updateStock()` pour chaque hébergement.
			- Gère les erreurs (affichage d'un message si une mise à jour échoue).
			- Appelle `handleRefreshData()` en cas de succès complet pour rafraîchir l'affichage.

5. **Gestion des erreurs**
	- **Erreur partielle** : Si certaines mises à jour réussissent et d'autres échouent, afficher un message d'erreur indiquant quelles dates n'ont pas pu être mises à jour.
	- **Erreur totale** : Si toutes les mises à jour échouent, afficher un message d'erreur global.
	- **État de chargement** : Le bouton "Ouvrir" doit être désactivé pendant la mise à jour du stock.

6. **Expérience utilisateur**
	- Le bouton "Ouvrir" doit afficher le nombre de dates concernées (ex: "Ouvrir (5 dates)").
	- Pendant la mise à jour, afficher un état de chargement ("Ouverture...").
	- Après succès, la sélection peut être maintenue ou vidée (à définir selon préférence UX).
	- Les dates réactivées apparaissent immédiatement en vert après rafraîchissement.

7. **Intégration avec le système existant**
	- Le bouton "Ouvrir" coexiste avec les boutons "Actualiser" et "Sauvegarder".
	- La logique de mise à jour du stock doit être séparée de la logique de sauvegarde des tarifs/durées minimales.
	- Les modifications de stock sont immédiatement persistées dans OpenPro (pas besoin de cliquer sur "Sauvegarder").

##### Bouton "Fermer" pour désactiver les dates disponibles — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Lorsqu'une sélection de cellules contient au moins une date avec stock > 0 (disponible), un bouton "Fermer" doit apparaître dans la barre d'actions.
	- Ce bouton permet de mettre le stock à 0 pour toutes les dates disponibles (stock > 0) présentes dans la sélection actuelle.
	- Les dates avec stock à 0 dans la sélection ne sont pas modifiées.

2. **Conditions d'affichage**
	- **Bouton "Fermer" visible** : Uniquement si la sélection contient au moins une cellule avec stock > 0.
	- **Position** : Le bouton doit apparaître entre le bouton "Actualiser" et le bouton "Ouvrir" dans le composant `ActionButtons`.
	- **Style** : Bouton d'action avec couleur rouge pour différencier des autres boutons et indiquer une action de fermeture.
	- **Texte du bouton** : "Fermer (X dates)" où X est le nombre de dates disponibles sélectionnées.

3. **Comportement fonctionnel**
	- **Clic sur "Fermer"** :
		- Identifier toutes les cellules sélectionnées avec stock > 0.
		- Grouper ces cellules par hébergement (`idHebergement`).
		- Pour chaque hébergement, créer un payload de mise à jour du stock contenant uniquement les dates avec stock > 0.
		- Envoyer une requête au backend pour mettre à jour le stock à 0 pour ces dates spécifiques.
		- **Cas limites** :
			- Si une date a déjà un stock à 0, elle est ignorée (ne fait pas partie des dates avec stock > 0).
			- Toutes les dates valides (format YYYY-MM-DD) peuvent être mises à jour dans OpenPro via l'API. Il n'existe pas de cas d'erreur pour une "date qui n'existe pas" car l'API OpenPro crée automatiquement les entrées de stock pour les dates valides.
		- En cas de succès, rafraîchir les données pour refléter les changements de stock.
		- En cas d'erreur, afficher un message d'erreur à l'utilisateur.

4. **Détails d'implémentation**

	4.1. **Détection des dates disponibles dans la sélection**
		- Dans `ProviderCalendars/index.tsx`, créer un `useMemo` qui :
			- Parcourt toutes les cellules de `selectedCells`.
			- Pour chaque cellule (`accId|dateStr`), vérifie le stock via `stockByAccommodation[accId]?.[dateStr] ?? 0`.
			- Retourne un objet `Record<number, Set<string>>` (hébergement → dates avec stock > 0) contenant uniquement les dates disponibles sélectionnées.

	4.2. **Comptage des dates disponibles**
		- Calculer le nombre total de dates disponibles sélectionnées pour déterminer l'affichage du bouton et le texte du bouton (ex: "Fermer (5 dates)").

	4.3. **Composant ActionButtons**
		- Ajouter une prop `availableDatesCount?: number` au composant `ActionButtons`.
		- Ajouter une prop `onCloseAvailable?: () => void` pour le callback du clic.
		- Afficher conditionnellement le bouton "Fermer" si `availableDatesCount > 0`.
		- Le bouton doit avoir un style distinct avec couleur rouge pour différencier des autres boutons et indiquer une action de fermeture.

	4.4. **Fonction de mise à jour du stock**
		- Utiliser la fonction `updateStock()` dans `backendClient.ts` qui appelle `POST /api/suppliers/:idFournisseur/accommodations/:idHebergement/stock` du backend.

	4.5. **Handler de fermeture**
		- Dans `ProviderCalendars/index.tsx`, créer une fonction `handleCloseAvailable()` qui :
			- Récupère les dates disponibles groupées par hébergement (via le `useMemo` de détection).
			- Pour chaque hébergement, construit un payload avec les dates à mettre à jour (stock = 0).
			- Appelle `updateStock()` pour chaque hébergement.
			- Gère les erreurs (affichage d'un message si une mise à jour échoue).
			- Appelle `handleRefreshData()` en cas de succès complet pour rafraîchir l'affichage.

5. **Gestion des erreurs**
	- **Erreur partielle** : Si certaines mises à jour réussissent et d'autres échouent, afficher un message d'erreur indiquant quelles dates n'ont pas pu être mises à jour.
	- **Erreur totale** : Si toutes les mises à jour échouent, afficher un message d'erreur global.
	- **État de chargement** : Le bouton "Fermer" doit être désactivé pendant la mise à jour du stock.

6. **Expérience utilisateur**
	- Le bouton "Fermer" doit afficher le nombre de dates concernées (ex: "Fermer (5 dates)").
	- Pendant la mise à jour, afficher un état de chargement ("Fermeture...").
	- Après succès, la sélection peut être maintenue ou vidée (à définir selon préférence UX).
	- Les dates fermées apparaissent immédiatement en rouge après rafraîchissement.

7. **Intégration avec le système existant**
	- Le bouton "Fermer" coexiste avec les boutons "Actualiser", "Ouvrir" et "Sauvegarder".
	- L'ordre d'affichage recommandé des boutons : "Actualiser" → "Fermer" (si dates disponibles) → "Ouvrir" (si dates non disponibles) → "Sauvegarder" (si modifications).
	- La logique de mise à jour du stock doit être séparée de la logique de sauvegarde des tarifs/durées minimales.
	- Les modifications de stock sont immédiatement persistées dans OpenPro (pas besoin de cliquer sur "Sauvegarder").

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

##### Affichage des réservations — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Les réservations sont affichées sous forme de **rectangles colorés opaques** par-dessus les cellules du calendrier.
	- Chaque réservation est représentée par un rectangle continu qui s'étend sur plusieurs cellules selon les dates d'arrivée et de départ.
	- Chaque plateforme de réservation a une couleur distincte pour faciliter l'identification visuelle (voir section 5 pour les détails des couleurs).
	- Les rectangles sont positionnés directement dans la grille CSS pour un alignement automatique avec les lignes d'hébergements.

2. **Chargement des données de réservation**
	- **Chargement initial** : 
		- Au chargement initial de la page web, pour **chaque fournisseur** (`suppliers: Supplier[]`), charger toutes les réservations pour chaque hébergement.
		- Les réservations sont chargées via l'endpoint backend `/api/fournisseur/{idFournisseur}/hebergements/{idHebergement}/bookings` ou via une requête bulk qui charge toutes les réservations du fournisseur.
		- **Note** : Le chargement initial se fait pour tous les fournisseurs disponibles, pas uniquement pour le fournisseur actif.
	- **Chargement lors du changement d'onglet** :
		- **Aucun chargement automatique** : Lors du changement d'onglet, les réservations ne sont **pas** rechargées automatiquement depuis le serveur.
		- Les réservations déjà chargées en mémoire pour le fournisseur sélectionné sont réaffichées telles quelles.
	- **Structure de données** :
		- Les réservations sont stockées dans `bookingsByAccommodation: Record<number, BookingDisplay[]>` où la clé est `idHebergement`.
		- Chaque `BookingDisplay` contient :
			- `idDossier: number` - Identifiant du dossier de réservation
			- `idHebergement: number` - Identifiant de l'hébergement
			- `dateArrivee: string` - Date d'arrivée au format `YYYY-MM-DD`
			- `dateDepart: string` - Date de départ au format `YYYY-MM-DD`
			- `clientNom?: string` - Nom complet du client (prénom + nom)
			- `montantTotal?: number` - Prix total de la réservation
			- `nbPersonnes?: number` - Nombre de personnes

3. **Filtrage des réservations**
	- **Filtrage par plage de dates** :
		- Seules les réservations qui **chevauchent** la plage de dates affichée (`[startDate, endDate]`) sont affichées.
		- Une réservation chevauche la plage si : `dateArrivee <= endDate && dateDepart > startDate`.
		- Les réservations complètement hors de la plage ne sont pas affichées.
	- **Filtrage par hébergements sélectionnés** :
		- Seules les réservations des hébergements sélectionnés (`selectedAccommodations`) sont affichées.

4. **Positionnement et dimensions des rectangles**
	- **Position horizontale** :
		- Le rectangle commence à **60% de la largeur** de la cellule de date d'arrivée (si la date d'arrivée est visible dans la plage).
		- Le rectangle se termine à **20% de la largeur** de la cellule de date de départ (si la date de départ est visible dans la plage).
		- Si la date d'arrivée est avant la plage affichée, le rectangle commence au début de la première colonne de dates (après les 200px de la colonne des noms).
		- Si la date de départ est après la plage affichée, le rectangle se termine à la fin de la dernière colonne de dates.
	- **Position verticale** :
		- Le rectangle est **centré verticalement** dans la ligne d'hébergement correspondante.
		- Le calcul utilise l'alignement des centres : `top = lineCenter - height / 2` où `lineCenter` est le centre vertical de la ligne.
	- **Hauteur** :
		- La hauteur du rectangle est de **80% de la hauteur** d'une cellule (`height = cellHeight * 0.8`).
	- **Limitation horizontale** :
		- Les rectangles ne doivent **jamais déborder** sur la colonne des noms d'hébergements (200px à gauche).
		- L'overlay des rectangles est limité en x pour empêcher tout débordement.

5. **Style visuel des rectangles**
	- **Couleur de fond** : Chaque plateforme de réservation a une couleur distincte pour faciliter l'identification visuelle :
		- **Booking.com** : `#003580` (bleu foncé, contraste ~8.6:1 avec texte blanc)
		- **Directe** : `#059669` (vert émeraude foncé, contraste ~4.7:1 avec texte blanc)
		- **OpenPro** : `#c2410c` (orange foncé, contraste ~6.1:1 avec texte blanc)
		- **Xotelia** : `#dc2626` (rouge foncé, contraste ~5.1:1 avec texte blanc)
		- **Unknown** : `#64748b` (gris moyen, contraste ~4.5:1 avec texte blanc)
	- La couleur est déterminée par la propriété `plateformeReservation` de chaque réservation via la fonction `getBookingColor()` du thème.
	- Toutes les couleurs respectent le ratio de contraste WCAG AA minimum de 4.5:1 avec le texte blanc pour garantir une bonne lisibilité.
	- **Réservations obsolètes** : Les réservations Direct avec `isObsolete: true` sont affichées avec :
		- Un pattern de hachurage : `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)`
		- Une opacité réduite à 0.6 pour indiquer visuellement leur statut obsolète
		- Le style est appliqué via `backgroundImage` et `opacity` dans le composant `BookingOverlay`
	- **Bordures** : Bordures arrondies avec `borderRadius: 8px`.
	- **Z-index** : `zIndex: 2` pour s'afficher au-dessus des cellules de la grille (`zIndex: 1`).
	- **Pointer events** : `pointerEvents: 'none'` pour ne pas bloquer les interactions avec les cellules sous-jacentes.

6. **Contenu affiché dans les rectangles**
	- **Format** : Tout le contenu est affiché sur **une seule ligne** avec des séparateurs " • " entre les éléments.
	- **Ordre des informations** :
		1. **Nom de famille du client** : Dernier mot du nom complet (`clientNom.split(' ').pop()`).
		2. **Nombre de personnes** : Format `"2p."` ou `"4p."` selon `nbPersonnes`.
		3. **Nom de l'hébergement** : Nom complet de l'hébergement (`nomHebergement`).
		4. **Prix total** : Format `${Math.round(montantTotal)}€`.
	- **Exemple d'affichage** : `"Dupont • 2p. • Chambre Deluxe • 450€"`
	- **Taille de police** : `fontSize: 13px` (identique à celle des prix dans les cellules).
	- **Couleur du texte** : Blanc (`color: 'white'`).
	- **Gestion du débordement** : `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'` avec un `title` pour afficher le texte complet au survol.

7. **Calcul des positions**
	- **Méthode** : Utilisation de `getBoundingClientRect()` pour mesurer les positions réelles des cellules dans le DOM.
	- **Recalcul lors du scroll** : Les positions sont recalculées lors du scroll horizontal pour maintenir l'alignement correct.
	- **Références DOM** : Utilisation de refs (`gridRef`) pour accéder aux éléments de la grille et mesurer leurs positions.

8. **Cas limites**
	- **Réservations chevauchantes** : Si plusieurs réservations se chevauchent, elles sont toutes affichées (le backend génère une erreur pour les chevauchements invalides).
	- **Réservations hors plage** : Les réservations complètement hors de la plage affichée ne sont pas affichées, mais restent chargées en mémoire.
	- **Hébergements sans réservations** : Aucun rectangle n'est affiché pour les hébergements sans réservations dans la plage affichée.

9. **Implémentation technique**
	- **Composant** : `BookingOverlay` - Composant React qui calcule et affiche les rectangles de réservation.
	- **Positionnement** : Utilisation de `position: absolute` avec des positions calculées dynamiquement.
	- **Performance** : Utilisation de `useMemo` pour calculer les positions des rectangles uniquement lorsque les données changent.
	- **Intégration** : Le composant `BookingOverlay` est intégré dans `CompactGrid` et reçoit les données de réservation via les props.
	- **Gestion des réservations obsolètes** :
		- Le flag `isObsolete` est fourni par le backend dans les réponses de `/api/suppliers/:idFournisseur/supplier-data`
		- Les réservations obsolètes sont détectées dynamiquement côté backend (non stockées en DB)
		- Le frontend affiche simplement le flag tel que reçu du backend
		- Le style hachuré est appliqué conditionnellement basé sur `rect.booking.isObsolete === true`
		- Aucune logique métier côté frontend, uniquement l'affichage visuel

10. **Exemples visuels**
	- **Rectangle de réservation standard** :
		```
		┌─────────────────────────────────────────┐
		│  Dupont • 2p. • Chambre Deluxe • 450€  │
		└─────────────────────────────────────────┘
		```
	- **Rectangle partiellement visible** (arrivée avant la plage) :
		```
		┌─────────────────────────────────────┐
		│  Martin • 4p. • Suite Familiale     │
		└─────────────────────────────────────┘
		```
	- **Rectangle partiellement visible** (départ après la plage) :
		```
		┌───────────────────────────────────────────────
		│  Bernard • 2p. • Studio • 320€
		└───────────────────────────────────────────────
		```

##### Sélection d'une réservation Directe — Exigences fonctionnelles

1. **Vue d'ensemble**
	- L'utilisateur peut sélectionner une réservation en cliquant sur son rectangle dans la grille de calendrier.
	- **Restriction importante** : Seules les réservations **Directe** (`plateformeReservation === PlateformeReservation.Directe`) peuvent être sélectionnées.
	- Les réservations des autres plateformes (Booking.com, OpenPro, Xotelia, etc.) ne sont pas sélectionnables.
	- Une seule réservation peut être sélectionnée à la fois.

2. **Comportement de sélection**
	- **Clic sur une réservation Directe non sélectionnée** : Sélectionne cette réservation et désélectionne toute réservation précédemment sélectionnée.
	- **Clic sur une réservation Directe déjà sélectionnée** : Désélectionne cette réservation.
	- **Clic sur une réservation non Directe** : Aucune action (la réservation reste non sélectionnable).
	- **Clic en dehors d'une réservation** : La sélection actuelle est maintenue (pas de désélection automatique).

3. **Indicateur visuel de sélection**
	- Les réservations Directe sélectionnées doivent avoir un **style visuel distinctif** pour indiquer leur état de sélection.
	- **Style proposé** :
		- Une bordure plus épaisse (ex: `4px solid rgba(255, 255, 255, 0.9)`)
		- Optionnel : Une ombre portée légère (`boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'`)
		- Le fond reste vert émeraude (`#059669`) pour les réservations Directe
	- Les réservations non sélectionnées conservent leur style normal (avec ou sans bordure selon leur statut de synchronisation).

4. **Gestion de l'état de sélection**
	- L'état de la réservation sélectionnée est stocké dans le composant parent (`ProviderCalendars`).
	- **Identifiant de réservation** : Utiliser `booking.idDossier` comme identifiant unique pour la réservation sélectionnée.
	- **État** : `selectedBookingId: number | null`
		- `null` : Aucune réservation sélectionnée
		- `number` : ID de la réservation Directe sélectionnée (`idDossier`)

5. **Interactions utilisateur**
	- **Curseur** : Les réservations Directe affichent un curseur `pointer` au survol pour indiquer qu'elles sont cliquables.
	- Les réservations non Directe affichent un curseur `default` pour indiquer qu'elles ne sont pas interactives.
	- **Feedback visuel au survol** : Optionnel, peut ajouter un léger effet de survol (ex: opacité légèrement augmentée) pour les réservations Directe.

6. **Exclusion mutuelle avec la sélection de dates**
	- **Sélection d'une réservation** : Lorsqu'une réservation Directe est sélectionnée, toute sélection de dates existante est automatiquement annulée (vidée).
	- **Sélection de dates** : Lorsque l'utilisateur sélectionne une ou plusieurs dates (par clic, drag, ou clic sur un header), toute réservation sélectionnée est automatiquement désélectionnée.
	- Cette exclusion mutuelle garantit qu'une seule "sélection active" existe à la fois dans l'interface :
		- Soit une réservation est sélectionnée (pour des actions sur la réservation)
		- Soit des dates sont sélectionnées (pour créer une nouvelle réservation ou modifier des tarifs)
	- **Comportement** :
		- Clic sur une réservation Directe → Sélectionne la réservation + Vide la sélection de dates
		- Clic sur une date (ou drag de dates) → Sélectionne les dates + Désélectionne la réservation
		- Clic sur un header de colonne → Sélectionne/désélectionne la colonne + Désélectionne la réservation

7. **Intégration avec les autres fonctionnalités**
	- La sélection d'une réservation permet d'activer ultérieurement des actions spécifiques (ex: suppression, modification).
	- La réservation sélectionnée peut être utilisée par d'autres composants ou boutons d'action dans l'interface.

7. **Détails d'implémentation**

	7.1. **Composant BookingOverlay**
		- Ajouter une prop `selectedBookingId?: number | null` pour recevoir l'ID de la réservation sélectionnée.
		- Ajouter une prop `onBookingClick?: (booking: BookingDisplay) => void` pour le callback de clic.
		- Modifier chaque rectangle de réservation pour :
			- Vérifier si la réservation est Directe (`booking.plateformeReservation === PlateformeReservation.Directe`).
			- Si Directe : Ajouter un gestionnaire `onClick` qui appelle `onBookingClick(booking)`.
			- Si Directe : Appliquer le style visuel de sélection si `booking.idDossier === selectedBookingId`.
			- Si Directe : Afficher un curseur `pointer` au survol.
			- Si non Directe : Ne pas ajouter de gestionnaire de clic et afficher un curseur `default`.

	7.2. **Composant ProviderCalendars (index.tsx)**
		- Créer un état `selectedBookingId: number | null` avec `React.useState<number | null>(null)`.
		- Créer une fonction `handleBookingClick` qui :
			- Vérifie si la réservation est Directe (déjà vérifié dans BookingOverlay).
			- Si la réservation cliquée est déjà sélectionnée (`booking.idDossier === selectedBookingId`), désélectionne (`setSelectedBookingId(null)`).
			- Sinon, sélectionne la nouvelle réservation (`setSelectedBookingId(booking.idDossier)`) **ET vide la sélection de dates** (`setSelectedCells(new Set<string>())`).
		- Modifier tous les gestionnaires de sélection de dates (`setSelectedCells`, `handleHeaderClick`, etc.) pour désélectionner la réservation (`setSelectedBookingId(null)`) lorsque des dates sont sélectionnées.
		- Passer `selectedBookingId` et `onBookingClick={handleBookingClick}` à `CompactGrid`, qui les passera à `BookingOverlay`.

	7.3. **Filtrage des réservations cliquables**
		- Dans `BookingOverlay`, vérifier `booking.plateformeReservation === PlateformeReservation.Directe` avant d'ajouter le gestionnaire de clic.
		- Les réservations non Directe ne doivent pas déclencher d'action au clic.

8. **Cas limites**
	- **Réservation Directe en attente de synchronisation** : Peut être sélectionnée normalement.
	- **Réservation Directe obsolète** : Peut être sélectionnée normalement (mais probablement pas supprimable).
	- **Plusieurs réservations Directe chevauchantes** : Chaque rectangle est cliquable indépendamment, seule la réservation cliquée est sélectionnée.
	- **Réservation Directe partiellement visible** : Peut être sélectionnée même si elle est partiellement hors de la plage affichée.

9. **Performance**
	- La vérification du type de plateforme doit être effectuée lors du rendu de chaque rectangle.
	- L'état de sélection ne nécessite pas de recalcul des positions des rectangles.
	- Le style conditionnel de sélection est appliqué uniquement aux rectangles Directe.

##### Création d'une réservation Directe — Exigences fonctionnelles

1. **Vue d'ensemble**
	- L'utilisateur peut créer une nouvelle réservation Directe en sélectionnant des dates dans le calendrier et en ouvrant le formulaire de création.
	- Le formulaire de création (`BookingModal`) permet de saisir les informations du client et de la réservation.
	- Le formulaire doit supporter l'autocomplétion du navigateur pour améliorer l'expérience utilisateur.

2. **Support de l'autocomplétion**
	- Tous les champs du formulaire client doivent inclure l'attribut HTML `autoComplete` approprié pour permettre au navigateur de proposer l'autocomplétion.
	- **Champs avec autocomplétion** :
		- **Nom** : `autoComplete="family-name"`
		- **Prénom** : `autoComplete="given-name"`
		- **Email** : `autoComplete="email"` (en plus de `type="email"`)
		- **Téléphone** : `autoComplete="tel"`
		- **Adresse** : `autoComplete="street-address"`
		- **Code postal** : `autoComplete="postal-code"`
		- **Ville** : `autoComplete="address-level2"`
		- **Pays** : `autoComplete="country"`
		- **Société** (client professionnel) : `autoComplete="organization"`
	- Cette fonctionnalité permet au navigateur (Chrome, Firefox, Safari, etc.) de proposer automatiquement les informations sauvegardées de l'utilisateur, améliorant ainsi la rapidité de saisie et réduisant les erreurs.

3. **Composant ClientForm**
	- Le composant `ClientForm` doit implémenter tous les attributs `autoComplete` appropriés sur les champs de saisie.
	- Les attributs doivent être définis en camelCase React (`autoComplete` et non `autocomplete`).

##### Suppression d'une réservation Directe — Exigences fonctionnelles

1. **Vue d'ensemble**
	- L'utilisateur peut supprimer une réservation Directe sélectionnée en appuyant sur la touche Suppr (Delete).
	- Une modale de confirmation s'affiche pour confirmer la suppression avant de procéder.
	- La suppression entraîne la suppression de la réservation en DB (et dans le stub en test) ainsi que la réactivation du stock pour les dates concernées.

2. **Déclenchement de la modale**
	- **Condition** : Une réservation Directe doit être sélectionnée (`selectedBookingId !== null`).
	- **Touche** : Appui sur la touche Suppr (Delete) ouvre la modale de confirmation.
	- **Comportement** : Si aucune réservation n'est sélectionnée, l'appui sur Suppr ne fait rien.

3. **Contenu de la modale de confirmation**
	- La modale affiche un **récapitulatif** de la réservation à supprimer avec les informations suivantes :
		- Dates d'arrivée et de départ (formatées)
		- Nom du client (nom complet)
		- Nom de l'hébergement
		- Nombre de personnes
		- Montant total (si disponible)
		- Référence (si disponible)
	- La modale doit être claire et indiquer qu'il s'agit d'une action irréversible.

4. **Fermeture/annulation de la modale**
	- **Touche Échap (Escape)** : Ferme la modale sans supprimer la réservation.
	- **Bouton "Annuler"** : Ferme la modale sans supprimer la réservation.
	- Dans les deux cas, la sélection de réservation est maintenue.

5. **Confirmation de suppression**
	- **Bouton "Supprimer"** : Lance la suppression de la réservation.
	- **Ordre des opérations lors de la suppression** :
		1. **Étape 1** : Supprimer la réservation en DB (et dans le stub en test) via l'API backend.
		2. **Étape 2** : Mettre le stock à 1 pour toutes les dates de la réservation supprimée (du `dateArrivee` inclus au `dateDepart` exclus) via l'API de mise à jour du stock.
		3. **Étape 3** : Rafraîchir les données (`handleRefreshData()`) pour refléter la suppression.
		4. **Étape 4** : Annuler la sélection de réservation (`setSelectedBookingId(null)`).
		5. **Étape 5** : Fermer la modale.

6. **Gestion des erreurs**
	- **Erreur de suppression** : Si la suppression échoue, afficher un message d'erreur dans la modale ou via une notification. La modale reste ouverte pour permettre un nouvel essai ou une annulation.
	- **Erreur de mise à jour du stock** : Si la suppression réussit mais que la mise à jour du stock échoue, afficher un avertissement (la réservation est supprimée mais le stock n'a pas été réactivé). Rafraîchir les données quand même.
	- **État de chargement** : Afficher un état de chargement pendant la suppression et la mise à jour du stock (bouton "Supprimer" désactivé, texte "Suppression...").

7. **Détails d'implémentation**

	7.1. **Composant DeleteBookingModal**
		- Créer un nouveau composant `DeleteBookingModal` similaire à `BookingModal` mais pour la suppression.
		- **Props** :
			- `isOpen: boolean` - Indique si la modale est ouverte
			- `onClose: () => void` - Callback pour fermer la modale
			- `booking: BookingDisplay | null` - La réservation à supprimer
			- `onConfirmDelete: (booking: BookingDisplay) => Promise<void>` - Callback pour confirmer la suppression
		- **Fonctionnalités** :
			- Afficher le récapitulatif de la réservation
			- Gérer la touche Échap pour fermer la modale
			- Afficher un état de chargement pendant la suppression
			- Gérer les erreurs d'affichage

	7.2. **Gestion du clavier (index.tsx)**
		- Ajouter un `useEffect` qui écoute la touche Suppr uniquement quand une réservation Directe est sélectionnée.
		- Utiliser `window.addEventListener('keydown', handleDeleteKey)` avec `useEffect`.
		- Ouvrir la modale de suppression lorsque la touche Suppr est pressée.

	7.3. **API Backend**
		- Créer un endpoint `DELETE /api/suppliers/:idFournisseur/local-bookings/:idDossier` pour supprimer une réservation locale.
		- L'endpoint doit supprimer la réservation dans la DB D1 (et dans le stub si en mode test).
		- Retourner une réponse de succès ou d'erreur.

	7.4. **API Frontend**
		- Créer une fonction `deleteBooking(idFournisseur: number, idDossier: number)` dans `backendClient.ts`.
		- La fonction doit appeler l'endpoint DELETE du backend.

	7.5. **Mise à jour du stock**
		- Après la suppression réussie, calculer toutes les dates de la réservation (du `dateArrivee` inclus au `dateDepart` exclus).
		- Utiliser l'endpoint existant `POST /api/suppliers/:idFournisseur/accommodations/:idHebergement/stock` pour mettre le stock à 1 pour toutes ces dates.
		- La fonction `updateStock()` existe déjà dans `backendClient.ts`.

	7.6. **Intégration dans index.tsx**
		- Créer un état `isDeleteModalOpen: boolean` pour gérer l'ouverture/fermeture de la modale.
		- Créer une fonction `handleDeleteBooking` qui :
			- Appelle `deleteBooking()` pour supprimer la réservation.
			- Calcule toutes les dates de la réservation.
			- Appelle `updateStock()` pour mettre le stock à 1.
			- Appelle `handleRefreshData()` pour rafraîchir les données.
			- Annule la sélection de réservation (`setSelectedBookingId(null)`).
			- Ferme la modale.
		- Trouver la réservation sélectionnée dans `bookingsByAccommodation` pour passer à la modale.

8. **Style visuel**
	- La modale doit avoir un style cohérent avec le reste de l'application (thème sombre).
	- Le bouton "Supprimer" doit avoir une couleur distincte (ex: rouge) pour indiquer une action destructive.
	- Le bouton "Annuler" doit être moins visible (bouton secondaire).
	- Un message d'avertissement peut être affiché pour indiquer que l'action est irréversible.

##### Tooltip des réservations — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Un tooltip contextuel s'affiche au survol des rectangles colorés de réservation.
	- Le tooltip affiche un résumé condensé mais complet de toutes les données du dossier de réservation, incluant la plateforme de réservation.
	- Le tooltip suit la position de la souris pour rester visible pendant le survol.

2. **Déclenchement du tooltip**
	- **Affichage** : Le tooltip s'affiche lorsque la souris entre dans la zone d'un rectangle de réservation (`onMouseEnter`).
	- **Suivi de la souris** : Le tooltip suit la position de la souris pendant le survol (`onMouseMove`).
	- **Masquage** : Le tooltip se masque automatiquement lorsque la souris quitte le rectangle (`onMouseLeave`).
	- **Positionnement** : Le tooltip utilise `position: fixed` pour rester visible même lors du scroll.

3. **Contenu du tooltip**
	Le tooltip affiche les informations organisées en sections :

	**Section 1 - Référence** (en haut, en gras, avec séparateur)
	- Réf: {reference} ou "Non renseigné"

	**Section 2 - Client** (avec icônes)
	- {civilite} {prenom} {nom} (en gras)
	- 📧 {email} ou "Non renseigné"
	- 📞 {telephone} ou "Non renseigné"

	**Section Adresse** (affichée conditionnellement si au moins un champ est présent)
	- 📍 {adresse}, {codePostal} {ville}, {pays}
	- Format: adresse complète formatée avec séparateurs, affichée directement après l'icône sans texte "Adresse"

	**Section Entreprise** (affichée conditionnellement si au moins un champ est présent)
	- 🏢 Entreprise
	- Société: {societe}
	- SIRET: {siret}
	- TVA: {tva}

	**Section Remarques** (affichée conditionnellement si présent)
	- 📝 {remarques}
	- Texte multiligne avec gestion du retour à la ligne, affichée directement après l'icône sans texte "Remarques"

	**Section 3 - Dates et séjour**
	- 📅 Arrivée: {dateArrivee formatée DD/MM/YYYY}
	- 📅 Départ: {dateDepart formatée DD/MM/YYYY}
	- 🌙 {nbNuits} nuits • 👥 {nbPersonnes} personnes

	**Section 4 - Paiement et tarif** (avec séparateur supérieur)
	- 💰 {montantTotal}€ {devise} • 🏷️ {typeTarifLibelle}
	- Format: prix et type de tarif sur la même ligne, séparés par "•"
	- Le type de tarif n'est affiché que s'il est présent et différent de "Non renseigné"

4. **Format d'affichage**
	- **Icônes emoji** : Utilisation d'icônes emoji (📧, 📞, 📅, 🌙, 👥, 💰, 🏷️, 📍, 📝, 🏢) pour améliorer la lisibilité et l'identification rapide des sections.
	- **Affichage compact** : Les sections Adresse et Remarques affichent uniquement l'icône suivie directement du contenu, sans texte de label supplémentaire.
	- **Affichage horizontal** : Le prix et le type de tarif sont affichés sur la même ligne, séparés par "•" pour optimiser l'espace.
	- **Séparateurs visuels** : Bordures entre les sections principales (référence et paiement) pour structurer l'information.
	- **Gestion des valeurs manquantes** : Affichage de "Non renseigné" pour les champs optionnels absents.
	- **Format de date** : Conversion de "YYYY-MM-DD" vers "DD/MM/YYYY" pour l'affichage.

5. **Style visuel**
	- **Fond** : Fond sombre (`darkTheme.bgPrimary`) cohérent avec le thème de l'application.
	- **Bordure** : Bordure fine (`darkTheme.borderColor`) avec coins arrondis (`borderRadius: 8px`).
	- **Ombre** : Ombre portée (`boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'`) pour donner de la profondeur.
	- **Espacement** : Espacement généreux entre les sections (`gap: 12px` pour les sections principales, `gap: 4px` ou `gap: 6px` pour les sous-éléments).
	- **Largeur** : Largeur minimale de 250px, largeur maximale de 350px pour une lecture confortable.
	- **Z-index** : `zIndex: 1000` pour s'afficher au-dessus de tous les autres éléments.

6. **Données affichées**
	- **Référence** : `reference` du dossier
	- **Client** : `clientCivilite`, `clientNom` (construit à partir de `prenom` et `nom`), `clientEmail`, `clientTelephone`
	- **Adresse** : `clientAdresse`, `clientCodePostal`, `clientVille`, `clientPays` (affichée seulement si au moins un champ est présent)
	- **Entreprise** : `clientSociete`, `clientSiret`, `clientTva` (affichée seulement si au moins un champ est présent)
	- **Remarques** : `clientRemarques` (affichée seulement si présent et non vide)
	- **Dates** : `dateArrivee`, `dateDepart` (formatées en DD/MM/YYYY), `nbNuits`, `nbPersonnes`
	- **Paiement** : `montantTotal`, `devise`, `typeTarifLibelle`

	**Données stockées mais non affichées dans le tooltip** :
	- `clientDateNaissance` - Stocké dans le backend mais non affiché pour garder le tooltip condensé
	- `clientNationalite` - Stocké dans le backend mais non affiché
	- `clientProfession` - Stocké dans le backend mais non affiché
	- `clientLangue` - Stocké dans le backend mais non affiché
	- `clientNewsletter` - Stocké dans le backend mais non affiché
	- `clientCgvAcceptees` - Stocké dans le backend mais non affiché

7. **Comportement interactif**
	- **Curseur** : Le curseur change en `pointer` au survol des rectangles pour indiquer l'interactivité.
	- **Pointer events** : Les rectangles individuels ont `pointerEvents: 'auto'` pour permettre le survol, tandis que le conteneur parent garde `pointerEvents: 'none'` pour ne pas bloquer les interactions avec les cellules sous-jacentes.
	- **Performance** : Le tooltip est rendu conditionnellement uniquement lorsqu'il est visible pour optimiser les performances.

8. **Cas limites**
	- **Valeurs manquantes** : Tous les champs optionnels affichent "Non renseigné" s'ils sont absents.
	- **Dates invalides** : Si une date est absente, afficher "Non renseigné" à la place.
	- **Montant manquant** : Si le montant est absent, afficher "?€" avec la devise par défaut "EUR".
	- **Tooltip hors écran** : Le tooltip peut dépasser les bords de l'écran si la souris est proche d'un bord (comportement standard des tooltips).

9. **Implémentation technique**
	- **Composant** : `BookingTooltip` - Composant React dédié pour l'affichage du tooltip.
	- **Gestion d'état** : État `tooltipState` dans `BookingOverlay` pour gérer l'affichage et la position du tooltip.
	- **Événements** : Gestionnaires `onMouseEnter`, `onMouseMove`, et `onMouseLeave` sur les rectangles de réservation.
	- **Utilitaires** : Fonction `formatDateDisplay()` dans `dateUtils.ts` pour convertir les dates au format d'affichage.

10. **Exemple visuel du tooltip**
	```
	┌─────────────────────────────────────┐
	│ Réf: RES-2025-001                    │
	│ ──────────────────────────────────── │
	│                                      │
	│ M. Pierre Martin                    │
	│ 📧 pierre.martin@example.com         │
	│ 📞 +33612345678                      │
	│                                      │
	│ 📍 123 Rue de la République, 75001 Paris, France
	│                                      │
	│ 🏢 Entreprise                        │
	│ Société: Acme Corp                  │
	│ SIRET: 12345678901234               │
	│ TVA: FR12345678901                  │
	│                                      │
	│ 📝 Client VIP, préfère chambre calme │
	│                                      │
	│ 📅 Arrivée: 15/06/2025               │
	│ 📅 Départ: 22/06/2025                │
	│ 🌙 7 nuits • 👥 2 personnes          │
	│                                      │
	│ ──────────────────────────────────── │
	│ 💰 588€ EUR • 🏷️ Tarif public      │
	└─────────────────────────────────────┘
	```

##### Masquage du prix et de la durée minimale pour les jours sans stock — Exigences fonctionnelles

1. **Vue d'ensemble**
	- Lorsqu'une journée n'a plus de stock (stock = 0), le prix et la durée minimale de séjour ne sont **pas affichés** dans la cellule correspondante.
	- Seule la couleur de fond (rouge) indique l'indisponibilité.

2. **Condition d'affichage**
	- **Prix** : Affiché uniquement si `stock > 0` ET `selectedRateTypeId !== null`.
	- **Durée minimale** : Affichée uniquement si `stock > 0` ET `dureeMin !== null`.
	- **Couleur de fond** : Toujours affichée selon la disponibilité (vert si `stock > 0`, rouge si `stock === 0`).

3. **Comportement visuel**
	- **Cellule avec stock disponible** :
		- Fond vert
		- Prix affiché (si disponible)
		- Durée minimale affichée (si disponible)
	- **Cellule sans stock** :
		- Fond rouge
		- Aucun prix affiché
		- Aucune durée minimale affichée
		- Cellule vide visuellement (seule la couleur de fond est visible)

4. **Mode édition**
	- **Édition du prix** : Désactivée si `stock === 0` (les cellules sans stock ne sont pas éditables).
	- **Édition de la durée minimale** : Désactivée si `stock === 0` (les cellules sans stock ne sont pas éditables).

5. **Implémentation technique**
	- Ajout de la condition `stock > 0` dans l'affichage conditionnel du prix et de la durée minimale dans `GridDataCell`.
	- Les cellules sans stock restent visibles avec leur couleur de fond, mais sans contenu textuel.

##### Détection et affichage des jours non réservables — Exigences fonctionnelles

1. **Vue d'ensemble**
	- L'interface affiche en gris les jours où un hébergement n'est pas réservable.
	- Un jour est non réservable si sa durée minimale de réservation est strictement supérieure à la longueur de la plage de disponibilité à laquelle il appartient.

2. **Concepts de l'algorithme**
	- **Plage de disponibilité** : Période continue où le stock est à 1, encadrée par des jours où le stock est à 0 ou non défini.
	- **Note importante** : Par défaut, le jour d'hier (date de début de la période affichée - 1 jour) est considéré comme ayant un stock à 0 dans cet algorithme.
	- **Longueur d'une plage** : Nombre de jours consécutifs où le stock est à 1 dans la plage.
	- **Règle de réservabilité** : Un jour est non réservable si sa durée minimale de réservation est strictement supérieure à la longueur de la plage de disponibilité à laquelle il appartient.

3. **Algorithme de détection**
	- Pour chaque hébergement et chaque jour dans la période affichée :
		- Si le stock du jour est à 1 :
			- Identifier la plage de disponibilité à laquelle le jour appartient.
			- Calculer la longueur de cette plage.
			- Comparer la durée minimale de réservation du jour avec la longueur de la plage.
			- Si `dureeMin > longueur de la plage`, marquer le jour comme non réservable.
		- Si le stock du jour est à 0 ou non défini :
			- Le jour est automatiquement non réservable (pas de plage de disponibilité).

4. **Affichage visuel**
	- **Jours non réservables** :
		- Fond gris (`darkTheme.bgTertiary`) avec opacité réduite à 0.5.
		- Le prix et la durée minimale restent affichés mais avec une opacité réduite.
		- La bordure est conservée mais avec une opacité réduite.
	- **Jours réservables** :
		- Affichage normal (fond vert/rouge selon le stock, opacité normale).

5. **Cas limites**
	- **Plage de 1 jour avec durée minimale de 1 jour** : Jour réservable (1 ≤ 1).
	- **Plage de 1 jour avec durée minimale de 2 jours** : Jour non réservable (2 > 1).
	- **Durée minimale absente ou nulle** : Jour réservable par défaut (pas de contrainte).
	- **Stock à 0** : Jour non réservable (pas de plage de disponibilité).

6. **Implémentation technique**
	- **Fichier utilitaire** : `availabilityUtils.ts` contient :
		- `getAvailabilityRanges()` : Calcule les plages de disponibilité pour un hébergement.
		- `getNonReservableDays()` : Identifie les jours non réservables en comparant les durées minimales avec les longueurs des plages.
	- **Calcul dans le composant principal** : `ProviderCalendars/index.tsx` calcule `nonReservableDaysByAccommodation` avec `useMemo` pour optimiser les performances.
	- **Affichage** : `GridDataCell` reçoit la prop `isNonReservable` et applique le style gris avec opacité réduite.

##### Remplacement du champ "Durée" par "Date de fin" — Fichiers à modifier

**Contexte** : Le champ "Durée" (select avec options 1, 2 ou 3 mois) est remplacé par un champ "Date de fin" (input de type `date` HTML5) pour permettre une sélection plus flexible de la période à afficher.

**Fichiers de code à modifier** :

1. **`OpenPro.Admin/src/components/ProviderCalendars/components/DateRangeControls.tsx`**
	- Remplacer le select "Durée" (`monthsCount`) par un input "Date de fin" (`endDate`)
	- Modifier les props pour accepter `endDate` et `onEndDateChange` au lieu de `monthsCount` et `onMonthsCountChange`
	- Ajouter la validation pour s'assurer que `endDate >= startDate`

2. **`OpenPro.Admin/src/components/ProviderCalendars/index.tsx`**
	- Remplacer l'état `monthsCount` par `endDate: Date`
	- Initialiser `endDate` à **1 mois après `startDate`** par défaut (l'écart de temps entre `startDate` et `endDate` doit être initialisé à 1 mois)
	- Mettre à jour tous les appels de fonctions pour utiliser `endDate` au lieu de `monthsCount`

3. **`OpenPro.Admin/src/components/ProviderCalendars/utils/dateUtils.ts`**
	- Renommer `getWeeksInRange(startDate, monthsCount)` en `getDaysInRange(startDate, endDate)`
	- Simplifier la logique pour générer directement tous les jours entre `startDate` et `endDate` (incluses)
	- La fonction retourne maintenant un tableau de dates (`Date[]`) au lieu d'un tableau de semaines (`Date[][]`)

4. **`OpenPro.Admin/src/components/ProviderCalendars/services/dataLoader.ts`**
	- Modifier `loadSupplierData()` pour accepter `endDate: Date` au lieu de `monthsCount: number`
	- Calculer la période de chargement avec `startDate` et `endDate` au lieu de `addMonths(startDate, monthsCount)`

5. **`OpenPro.Admin/src/components/ProviderCalendars/hooks/useSupplierData.ts`**
	- Modifier les signatures des fonctions pour utiliser `endDate` au lieu de `monthsCount` :
		- `refreshSupplierData(idFournisseur, startDate, endDate)`
		- `loadInitialData(suppliers, startDate, endDate)`
	- Mettre à jour les appels internes à `loadSupplierData()`

6. **`OpenPro.Admin/src/components/ProviderCalendars/components/CompactGrid.tsx`**
	- Modifier les props pour accepter `endDate: Date` au lieu de `monthsCount: number`
	- Mettre à jour l'appel à `getDaysInRange(startDate, endDate)`
	- Supprimer l'appel à `.flat()` car la fonction retourne directement un tableau de dates

**Impact sur les fonctionnalités existantes** :
- Le chargement des données (stock, tarifs) utilise maintenant `startDate` et `endDate` au lieu de `startDate` et `monthsCount`
- La génération du calendrier liste toutes les dates entre `startDate` et `endDate` (incluses), sans limitation à des durées prédéfinies
- La validation des dates doit être ajoutée pour s'assurer que `endDate >= startDate`

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
import { createOpenProClient } from '@openpro-api-react/client';

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

