# PRD — OpenPro API React Wrapper

## Contexte et objectif
Créer un wrapper JavaScript/TypeScript utilisable facilement dans des apps React et intégrable en widget dans un site Astro, pour consommer l’API Open Pro (API Multi v1) d’Alliance-Réseaux. Fournir:
- un SDK léger (wrapper) pour l’API,
- des tests unitaires (mocks et possibilité de tests en direct),
- une page web de test (playground) pour valider rapidement le wrapper.

Référence produit:
- Documentation Open Pro — API Multi v1: `https://documentation.open-system.fr/api-openpro/tarif/multi/v1/`
- Swagger: lien à préciser (voir section Références)

## Produits cibles
- Widget client (lecture uniquement): `widget-OpenPro-Customer-Becterie`
  - Usage: client final vérifie disponibilités et tarifs d’un ou plusieurs hébergements et initie une réservation.
  - Accès API: lecture uniquement; aucune opération de modification (tarifs, stocks, etc.).
- Interface admin (accès complet): `OpenPro-Admin-Becterie`
  - Usage: administrateur PMS / propriétaire hébergements; accès à l’ensemble des opérations de l’API.
  - Peut embarquer le widget client pour tests/validation.

## Portée (Scope)
### In scope (MVP)
- Wrapper client: authentification par clé (header `Authorization: OsApiKey <KEY>`), sérialisation JSON, gestion basique des erreurs.
- Endpoints prioritaires:
  - Fournisseur: liste des hébergements `/fournisseur/{idFournisseur}/hebergements`
  - Types de tarif: création, mise à jour, association à un hébergement
  - Tarifs d’un hébergement: définition/lecture
  - Stock d’un hébergement: mise à jour
  - Dossiers de réservation: lecture liste + détail
- Pagination et structure de réponse générique `{ ok: 0|1, data: {} }`.
- Tests unitaires:
  - Mocks: réponses simulées conformes au schéma.
  - Mode “live” (opt-in) contre sandbox avec clé d’API via variables d’environnement.
- Page web de test:
  - Form pour saisir `apiKey`, `idFournisseur`, IDs utiles
  - Boutons pour appeler les opérations clés, affichage JSON des résultats
  - Gestion d’erreurs lisible et logs réseau optionnels

### Out of scope (MVP)
- Gestion complète des webhooks (uniquement notes et helpers de vérification)
- UI finale d’intégration/branding
- Caching/offline, retries avancés, circuit breaker

## Utilisateurs cibles
- Intégrateurs front (React) et développeurs d’interface Astro.
- Éditeurs de PMS/logiciels souhaitant synchroniser tarifs, stocks et dossiers.

## Règles d’accès et surface API (role-based)
- Deux surfaces d’usage au niveau du SDK, pour garantir à la compilation (TypeScript) qu’un widget client ne puisse pas appeler des opérations d’admin:
  - Client “customer” (lecture uniquement): expose uniquement les méthodes read-only. Les méthodes d’admin sont typées comme indisponibles (`never`) et provoquent des erreurs de compilation si invoquées.
  - Client “admin” (accès complet): expose l’ensemble des méthodes.
- Approche technique proposée (au choix, à préciser au design):
  - Exports séparés: `import { createCustomerClient } from '@sdk/openpro/customer'` et `import { createAdminClient } from '@sdk/openpro/admin'`
  - Ou un factory générique: `createOpenProClient<'customer' | 'admin'>(...)` avec types conditionnels pour masquer les méthodes admin en mode customer.
- Note: contrôle d’accès runtime (clé, proxy serveur) reste nécessaire; la garantie TypeScript protège à la compilation côté app.

## Exigences fonctionnelles
1) Authentification:
   - Envoi de la clé via `Authorization: OsApiKey <KEY>`
   - Configuration via env (`OPENPRO_API_KEY`) et override runtime (page test)
2) Wrapper HTTP:
   - Base URL configurable (sandbox / prod)
   - En-têtes `Content-Type: application/json`
   - Parse de la réponse `{ ok, data }` et levée d’erreur si `ok === 0`
3) Opérations (SDK):
   - Read-only (customer + admin):
     - `listAccommodations(idFournisseur)`
     - `listBookings(idFournisseur, params?)`
     - `getBooking(idFournisseur, idDossier)`
     - `getRates(idFournisseur, idHebergement, params?)` (si disponible) / lecture tarifs
     - Toute lecture nécessaire pour disponibilité/tarifs côté widget
   - Admin-only (masquées côté customer):
     - `createRateType(idFournisseur, payload)`
     - `updateRateType(idFournisseur, idTypeTarif, payload)`
     - `linkRateTypeToAccommodation(idFournisseur, idHebergement, idTypeTarif)`
     - `setRates(idFournisseur, idHebergement, payload)`
     - `updateStock(idFournisseur, idHebergement, payload)`
4) Pagination:
   - Support des paramètres de pagination si présents; expose `nextCursor`/`page` selon schéma.
5) Internationalisation:
   - Le wrapper transmet tel quel les champs multilingues attendus par l’API (libellé, description).
6) Page de test:
   - UI simple en React: champs inputs, sélection d’opération, affichage réponse JSON, temps de réponse.
   - Persistance locale (localStorage) de la clé en option (opt-in).
7) Convention de nommage:
   - Les noms de fonctions et symboles du code seront en anglais (ex: `listAccommodations`, `updateStock`, `setRates`).

## Exigences non fonctionnelles
- TypeScript-first, types publics stables (semver).
- Taille du bundle raisonnable (<10KB gz pour le core HTTP).
- Compatibilité: modernes navigateurs + Node LTS (tests).
- Sécurité: ne pas exposer de clé en dur; documenter les risques côté browser; recommander proxy côté serveur en prod.
- Observabilité: logs de debug facultatifs (désactivés par défaut).

## Architecture & Tech
- Wrapper: TypeScript, fetch API, pattern `OpenProClient`.
- UI de test: React (Vite/CRA), composant unique `Playground`.
- Intégration Astro:
  - Le wrapper est framework-agnostic (ESM); un petit adaptateur/guide d’usage pour Astro sera fourni.

### Structure proposée
```
/src/
  client/
    OpenProClient.ts
    types.ts
    errors.ts
    index.ts
  playground/ (app React de test)
    main.tsx
    App.tsx
    components/*
  __tests__/
    client.spec.ts
    fixtures/*
    mocks/*
```

## API: détails essentiels (rappel)
- Auth: `Authorization: OsApiKey <KEY>`
- Content-Type: `application/json`
- Réponse standard:
  ```json
  { "ok": 1, "data": {} }
  ```
- Principaux endpoints (exemple):
  - `GET /fournisseur/{idFournisseur}/hebergements`
  - `POST /fournisseur/{idFournisseur}/typetarifs`
  - `PUT /fournisseur/{idFournisseur}/typetarifs/{idTypeTarif}`
  - `POST /fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/{idTypeTarif}`
  - `POST /fournisseur/{idFournisseur}/hebergements/{idHebergement}/typetarifs/tarif`
  - `POST /fournisseur/{idFournisseur}/hebergements/{idHebergement}/stock`
  - `GET /fournisseur/{idFournisseur}/dossiers`
  - `GET /fournisseur/{idFournisseur}/dossiers/{idDossier}`

## Tests
- Unitaires (Jest/Vitest) avec:
  - Mocks des réponses `{ ok, data }` + cas d’erreurs (`ok:0`, HTTP 4xx/5xx).
  - Tests de schéma minimal (types).
- Mode live (désactivé par défaut):
  - Nécessite `OPENPRO_API_KEY` et `OPENPRO_BASE_URL` (sandbox).
  - Tests marqués `it.live` et exclus par défaut.
### Nouvelles exigences de tests (basées sur le stub)
- Ajouter des cas de tests supplémentaires qui consomment les données du serveur stub afin de valider des parcours “réalistes” (sans supprimer les tests existants).
- Les tests devront lire/utiliser le jeu de données fourni par `stub-server/stub-data.json` (fichier versionné), soit en pointant le client vers `http://localhost:3000`, soit via des helpers qui chargent des extraits de ce fichier pour assertions.
- Objectifs de couverture (indicatifs):
  - Hébergements: présence de plusieurs hébergements aux caractéristiques distinctes.
  - Types de tarif et tarifs: création/mise à jour/liaison, périodes et variations de prix.
  - Stock: variations par date, consolidation, bornes `start`/`end`.
  - Dossiers de réservation: liste et détail avec données cohérentes.
- Les nouveaux tests ne doivent pas retirer ni casser les tests en place; ils étendent la couverture en s’appuyant sur le dataset du stub.

## Page web de test (Playground)
- Saisie: baseURL, apiKey, idFournisseur, idHebergement, idTypeTarif, idDossier.
- Actions: boutons pour chaque opération clé.
- Affichage: code de statut, timing, corps JSON, erreurs.
- Sécurité: avertissement sur l’usage de la clé côté navigateur.

## Serveur stub local (API factice)
- Objectif: permettre le développement et les démos sans clé réelle, avec un petit serveur Express qui émule les endpoints principaux et renvoie `{ ok: 1, data: ... }`.
- Démarrage:
  - Installer les dépendances (une fois): `npm install`
  - Lancer: `npm run stub` → écoute sur `http://localhost:3000`
- Base URL (SDK/Playground): `http://localhost:3000` (sans slash final).
- Données persistées: fichier `stub-server/stub-data.json` (hébergements, dossiers, stock, types de tarif, tarifs). Les opérations d’écriture mettent à jour ce fichier.
- Versionning des données: le fichier `stub-server/stub-data.json` est versionné dans le dépôt; les évolutions du jeu de données doivent passer par des commits/PRs modifiant ce fichier.
- Endpoints couverts (exemples):
  - `GET /fournisseur/:idFournisseur/hebergements`
  - `GET /fournisseur/:idFournisseur/dossiers`
  - `GET /fournisseur/:idFournisseur/dossiers/:idDossier`
  - `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/stock` (+ `GET` de lecture)
  - `POST /fournisseur/:idFournisseur/typetarifs`
  - `PUT /fournisseur/:idFournisseur/typetarifs/:idTypeTarif`
  - `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/typetarifs/:idTypeTarif`
  - `POST /fournisseur/:idFournisseur/hebergements/:idHebergement/typetarifs/tarif` (+ `GET` helper de lecture)
- Intégration:
  - SDK: passer `baseUrl: 'http://localhost:3000'` et n’importe quelle `apiKey` (le stub l’ignore).
  - Playground: saisir la même Base URL et des IDs simples (ex: `idFournisseur=47186`, `idHebergement=1`).
- Évolutions: le dataset peut être enrichi/complexifié ultérieurement en éditant `stub-server/stub-data.json`.
-- Objectif à venir: complexifier le dataset pour refléter des scénarios réels (hébergements variés, saisons/périodes, règles de tarification, variations de stock, dossiers plausibles). Une stratégie détaillée sera fournie et appliquée dans le fichier versionné `stub-server/stub-data.json`.

### Stratégie de données pour le dataset (éditable)
Note: les modifications persistent dans `stub-server/stub-data.json`. Le format ci-dessous est volontairement structuré pour édition/automatisation.

```json
{
  "fournisseurs": [
    { "idFournisseur": 47186, "nom": "La Becterie" },
    { "idFournisseur": 55123, "nom": "Un gite Dans le Cotentin" },
    { "idFournisseur": 99999, "nom": "Fournisseur factice (hébergement sans dispo)" }
  ],
  "hebergements": {
    "47186": [
      { "idHebergement": 1, "nom": "Noirmoutier" },
      { "idHebergement": 2, "nom": "Ceylan" },
      { "idHebergement": 3, "nom": "Porquerolles" }
    ],
    "55123": [
      { "idHebergement": 1, "nom": "Maison complète" }
    ],
    "99999": [
      { "idHebergement": 1, "nom": "Hébergement non existant" }
    ]
  },
  "typesTarif": {
    "47186": [
      {
        "idTypeTarif": 1001,
        "libelle": [
          { "langue": "fr", "texte": "Tarif public" },
          { "langue": "en", "texte": "Public rate" },
          { "langue": "de", "texte": "Öffentlicher Tarif" },
          { "langue": "es", "texte": "Tarifa pública" },
          { "langue": "it", "texte": "Tariffa pubblica" }
        ],
        "description": [
          { "langue": "fr", "texte": "Tarif public annulable sans frais jusqu'au jour de votre arrivée" },
          { "langue": "en", "texte": "Cancelable free of charge until the day of arrival" },
          { "langue": "de", "texte": "Kostenlos stornierbar bis zum Anreisetag" },
          { "langue": "es", "texte": "Cancelable sin coste hasta el día de llegada" },
          { "langue": "it", "texte": "Annullabile gratuitamente fino al giorno di arrivo" }
        ],
        "ordre": 1
      },
      {
        "idTypeTarif": 1002,
        "libelle": [
          { "langue": "fr", "texte": "Promo non remboursable non annulable" },
          { "langue": "en", "texte": "Non-refundable non-cancellable promo" },
          { "langue": "de", "texte": "Nicht erstattbare, nicht stornierbare Aktion" },
          { "langue": "es", "texte": "Promoción no reembolsable y no cancelable" },
          { "langue": "it", "texte": "Promo non rimborsabile e non annullabile" }
        ],
        "description": [
          { "langue": "fr", "texte": "Tarif promotionnel non remboursable" },
          { "langue": "en", "texte": "Promotional non-refundable rate" },
          { "langue": "de", "texte": "Promotionspreis, nicht erstattbar" },
          { "langue": "es", "texte": "Tarifa promocional no reembolsable" },
          { "langue": "it", "texte": "Tariffa promozionale non rimborsabile" }
        ],
        "ordre": 2
      },
      {
        "idTypeTarif": 1003,
        "libelle": [
          { "langue": "fr", "texte": "Séjour en pension complète" },
          { "langue": "en", "texte": "Full-board stay" },
          { "langue": "de", "texte": "Vollpension-Aufenthalt" },
          { "langue": "es", "texte": "Estancia en pensión completa" },
          { "langue": "it", "texte": "Soggiorno in pensione completa" }
        ],
        "description": [
          { "langue": "fr", "texte": "Profitez du déjeuner et du dîner" },
          { "langue": "en", "texte": "Includes lunch and dinner" },
          { "langue": "de", "texte": "Beinhaltet Mittag- und Abendessen" },
          { "langue": "es", "texte": "Incluye almuerzo y cena" },
          { "langue": "it", "texte": "Include pranzo e cena" }
        ],
        "ordre": 3
      }
    ],
    "55123": [
      {
        "idTypeTarif": 1101,
        "libelle": [
          { "langue": "fr", "texte": "Tarif public" },
          { "langue": "en", "texte": "Public rate" },
          { "langue": "de", "texte": "Öffentlicher Tarif" },
          { "langue": "es", "texte": "Tarifa pública" },
          { "langue": "it", "texte": "Tariffa pubblica" }
        ],
        "description": [
          { "langue": "fr", "texte": "Tarif public annulable sans frais jusqu'au jour de votre arrivée" },
          { "langue": "en", "texte": "Cancelable free of charge until the day of arrival" },
          { "langue": "de", "texte": "Kostenlos stornierbar bis zum Anreisetag" },
          { "langue": "es", "texte": "Cancelable sin coste hasta el día de llegada" },
          { "langue": "it", "texte": "Annullabile gratuitamente fino al giorno di arrivo" }
        ],
        "ordre": 1
      }
    ],
    "99999": []
  },
  "liaisonsTypeTarifHebergement": {
    "47186:1": [1001, 1003],
    "47186:2": [1001],
    "47186:3": [1001, 1003],
    "55123:1": [1101],
    "99999:1": []
  },
  "stock": {
    "politique": "2025-01-01 → 2026-12-31",
    "formatEcriture": { "jours": [{ "date": "YYYY-MM-DD", "dispo": 0 }] },
    "formatLecture": { "jours": [{ "date": "YYYY-MM-DD", "dispo": 0 }] },
    "exigences": [
      "Pour 47186 et 55123: stock = 1 pour toutes les dates 2025–2026",
      "Pour 99999: stock = 0 (ou aucun jour) pour simuler l'absence de dispo"
    ]
  },
  "tarifs": {
    "formatPeriode": {
      "idTypeTarif": 0,
      "debut": "YYYY-MM-DD",
      "fin": "YYYY-MM-DD",
      "ouvert": true,
      "dureeMin": 1,
      "dureeMax": 30,
      "arriveeAutorisee": true,
      "departAutorise": true,
      "tarifPax": { "listeTarifPaxOccupation": [{ "type": "base", "nbPers": 2, "prix": 100 }] }
    },
    "valeurs": {
      "47186:1": [
        { "idTypeTarif": 1001, "debut": "2025-01-01", "fin": "2025-12-31", "ouvert": true, "dureeMin": 1, "dureeMax": 30, "arriveeAutorisee": true, "departAutorise": true, "tarifPax": { "listeTarifPaxOccupation": [ { "type": "base", "nbPers": 2, "prix": 84 } ] } }
      ],
      "47186:2": [
        { "idTypeTarif": 1001, "debut": "2025-01-01", "fin": "2025-12-31", "ouvert": true, "dureeMin": 1, "dureeMax": 30, "arriveeAutorisee": true, "departAutorise": true, "tarifPax": { "listeTarifPaxOccupation": [ { "type": "base", "nbPers": 2, "prix": 94 } ] } }
      ],
      "47186:3": [
        { "idTypeTarif": 1001, "debut": "2025-01-01", "fin": "2025-12-31", "ouvert": true, "dureeMin": 1, "dureeMax": 30, "arriveeAutorisee": true, "departAutorise": true, "tarifPax": { "listeTarifPaxOccupation": [ { "type": "occupation", "nbPers": 1, "prix": 100 }, { "type": "occupation", "nbPers": 2, "prix": 130 }, { "type": "occupation", "nbPers": 3, "prix": 140 }, { "type": "occupation", "nbPers": 4, "prix": 145 } ] } },
        { "idTypeTarif": 1003, "debut": "2025-01-01", "fin": "2025-12-31", "ouvert": true, "dureeMin": 1, "dureeMax": 30, "arriveeAutorisee": true, "departAutorise": true, "tarifPax": { "listeTarifPaxOccupation": [ { "type": "pension_complete", "nbPers": 2, "prix": 180 } ] } }
      ],
      "55123:1": [
        { "idTypeTarif": 1101, "debut": "2025-01-01", "fin": "2025-12-31", "ouvert": true, "dureeMin": 1, "dureeMax": 30, "arriveeAutorisee": true, "departAutorise": true, "tarifPax": { "listeTarifPaxOccupation": [ { "type": "base", "nbPers": 4, "prix": 350 } ] } }
      ],
      "99999:1": []
    }
  }
}
```

## Critères de succès (MVP)
- Wrapper publié (localement) et utilisable dans React et Astro.
- Opérations clés fonctionnelles avec mocks + testées en sandbox manuelle via le playground.
- Documentation claire: README, exemples d’usage, guide Astro.

## Risques & contraintes
- Exposition de la clé en front: recommander proxy/back pour la prod.
- Variations ou évolutions de l’API: prévoir versionnement dans `OpenProClient`.
- Limites de rate/quotas: prévoir gestion d’erreurs et backoff simple (prochaines itérations).

## Suivi & livrables
- Code: `src/client/*` (wrapper), `src/playground/*` (UI test), `__tests__/*`.
- Docs: README, ce PRD, guide d’intégration Astro, exemples.

## Références
- Open Pro — API Multi v1: `https://documentation.open-system.fr/api-openpro/tarif/multi/v1/`
- Swagger (schema): `https://api.open-pro.fr/tarif/multi/v1/v1/swagger`
  - Host: `api.open-pro.fr`
  - BasePath: `/tarif/multi/v1`
  - Security: `Authorization: OsApiKey <KEY>` (apiKey in header)


