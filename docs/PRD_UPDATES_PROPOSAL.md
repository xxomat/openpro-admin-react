# Proposition de mises à jour - PRD Admin

## Changements majeurs à documenter

### 1. Affichage unifié des réservations

**Section à modifier :** Section 3.2.3 "Dossiers de réservation" et nouvelle section "6. Affichage des réservations"

**Contenu proposé :**

```markdown
### 6. Affichage des réservations multi-plateformes

**Clarification :** L'interface admin affiche toutes les réservations (Directes, OpenPro, plateformes externes) de manière unifiée depuis la table `local_bookings` de la DB backend. Toutes les réservations sont stockées dans la même table avec le champ `reservationPlatform` pour identifier leur origine.

**Endpoint :**
- `GET /api/suppliers/:idFournisseur/local-bookings` - Retourne toutes les réservations depuis la DB backend (toutes plateformes confondues)

**Champs affichés :**
- `bookingId` - ID de la réservation
- `accommodationId` - ID de l'hébergement (string)
- `arrivalDate`, `departureDate` - Dates d'arrivée et de départ
- `reference` - Identifiant externe (idDossier OpenPro, UID iCal, etc.)
- `reservationPlatform` - Plateforme d'origine (`'Directe' | 'OpenPro' | 'Booking.com' | 'Xotelia' | 'Unknown'`)
- `bookingStatus` - État de la réservation (`'Quote' | 'Confirmed' | 'Paid' | 'Cancelled' | 'Past'`)
- Informations client (nom, email, téléphone, etc.)
- Montant total, nombre de personnes, etc.

**Indicateurs visuels :**
- **Couleur par plateforme :** Chaque plateforme a une couleur distincte pour faciliter l'identification visuelle
  - **Directe** : `#059669` (vert émeraude foncé)
  - **OpenPro** : `#c2410c` (orange foncé)
  - **Booking.com** : `#003580` (bleu foncé)
  - **Xotelia** : `#dc2626` (rouge foncé)
  - **Unknown** : `#64748b` (gris moyen)
- **Badge de statut :** Affiche l'état de la réservation dans la modale des réservations uniquement (à implémenter)
  - Quote : Badge gris "Devis"
  - Confirmed : Badge vert "Confirmée"
  - Paid : Badge bleu "Soldée"
  - Cancelled : Badge rouge "Annulée"
  - Past : Badge gris "Passée"
  - Note : Le badge de statut n'est pas affiché dans la grille de calendrier, uniquement dans la modale de détails/modification
- **Style pour annulées :** Les réservations annulées peuvent être affichées avec un style hachuré ou atténué

**Filtrage :**
- Par plateforme (toutes, Directe uniquement, OpenPro uniquement, etc.) - à implémenter
- Par statut (toutes, Confirmées uniquement, Annulées, etc.) - à implémenter
- Par hébergement - déjà implémenté
- Par plage de dates - déjà implémenté
```

### 2. Gestion des hébergements

**Section à ajouter :** Nouvelle section "7. Gestion des hébergements"

**Contenu proposé :**

```markdown
### 7. Gestion des hébergements

**Nouvelle fonctionnalité :** L'interface admin permet désormais de créer, modifier et supprimer les hébergements directement depuis l'interface.

**Endpoints :**
- `GET /api/accommodations` - Liste tous les hébergements
- `POST /api/accommodations` - Créer un hébergement
- `PUT /api/accommodations/:id` - Modifier un hébergement
- `DELETE /api/accommodations/:id` - Supprimer un hébergement
- `POST /api/accommodations/:id/external-ids` - Ajouter/modifier un identifiant externe
- `GET /api/accommodations/:id/external-ids` - Récupérer les identifiants externes

**Formulaire de création/modification :**
- **Nom de l'hébergement** (obligatoire)
- **ID Directe** (obligatoire) - Cet ID sert d'ID interne dans la DB
- **ID OpenPro** (obligatoire) - Nécessaire pour l'export vers OpenPro
- **ID Booking.com** (optionnel) - Pour la synchronisation iCal
- **ID Xotelia** (optionnel) - Pour la synchronisation iCal
- **Autres plateformes** (optionnel) - Extensible

**Validation :**
- L'ID Directe est obligatoire et doit être unique
- L'ID OpenPro est obligatoire et doit être unique
- Les IDs externes peuvent être ajoutés/modifiés après la création

**Interface utilisateur :**
- Liste des hébergements avec leurs identifiants
- Bouton "Créer un hébergement" ouvrant une modale
- Actions : Modifier, Supprimer, Gérer les IDs externes
- Affichage des identifiants externes configurés
```

### 3. Configuration iCal

**Section à ajouter :** Nouvelle section "8. Configuration iCal"

**Contenu proposé :**

```markdown
### 8. Configuration iCal

**Nouvelle fonctionnalité :** L'interface admin permet de configurer la synchronisation iCal pour chaque hébergement et chaque plateforme externe.

**Endpoints :**
- `GET /api/ical-config` - Liste toutes les configurations iCal
- `POST /api/ical-config` - Créer une configuration iCal
- `DELETE /api/ical-config/:id` - Supprimer une configuration

**Formulaire de configuration :**
- **Hébergement** (sélection depuis la liste)
- **Plateforme** (sélection : Booking.com, Xotelia, etc.)
- **URL d'import** (optionnel) - URL fournie par la plateforme pour importer les réservations
- **URL d'export** (générée automatiquement) - URL générée par le backend pour exporter les réservations
  - Format : `https://backend.example.com/api/ical/export/{idHebergement}/{platform}`
  - **Action :** Bouton "Copier l'URL" pour faciliter la configuration dans la plateforme externe

**Interface utilisateur :**
- Liste des configurations iCal par hébergement
- Affichage de l'état de synchronisation (dernière synchronisation, nombre de réservations importées)
- Bouton "Tester la synchronisation" pour déclencher manuellement
- Indicateur visuel si l'URL d'import est configurée (synchronisation active)
- Indicateur visuel si l'URL d'export est disponible (export actif)

**Fréquence de synchronisation :**
- Automatique : Toutes les 15 minutes (cron job backend)
- Manuelle : Via le bouton "Tester la synchronisation"

**Affichage des URLs :**
- L'URL d'export est toujours visible et copiable
- L'URL d'import peut être modifiée/supprimée
- Message d'aide expliquant comment configurer l'URL d'export dans la plateforme externe
```

### 4. Gestion des plans tarifaires depuis la DB

**Section à modifier :** Section 3.2.4 "Types de tarifs"

**Contenu proposé :**

```markdown
#### 3.2.4 Types de tarifs (modifié)

**Changement :** Les plans tarifaires sont désormais stockés dans la DB backend et chargés depuis celle-ci.

**Endpoints (inchangés mais comportement modifié) :**
- `GET /api/suppliers/:idFournisseur/rate-types` - Liste des types de tarifs
  - **Changement :** Charge depuis la DB backend (plus depuis OpenPro directement)
- `POST /api/suppliers/:idFournisseur/rate-types` - Créer un type de tarif
  - **Changement :** 
    1. Sauvegarde d'abord en DB
    2. Export ensuite vers OpenPro automatiquement
- `PUT /api/suppliers/:idFournisseur/rate-types/:idTypeTarif` - Modifier un type de tarif
  - **Changement :** Met à jour dans OpenPro ET en DB
- `DELETE /api/suppliers/:idFournisseur/rate-types/:idTypeTarif` - Supprimer un type de tarif
  - **Changement :** Supprime dans OpenPro ET en DB

**Synchronisation au démarrage :**
- Le backend charge tous les plans tarifaires depuis la DB
- Le backend fetche tous les plans tarifaires depuis OpenPro
- Pour chaque plan tarifaire présent en DB mais absent d'OpenPro, le backend le crée automatiquement dans OpenPro
- Garantit que OpenPro est synchronisé avec la DB backend au démarrage

**Interface utilisateur :**
- La modale de gestion des types de tarif fonctionne de la même manière
- Les données sont maintenant persistées dans la DB backend
- Synchronisation automatique avec OpenPro lors des modifications et au démarrage
```

### 5. Gestion des tarifs et stock depuis la DB

**Section à modifier :** Section 3.2.2 "Stock" et Section 3.2.6 "Tarifs"

**Contenu proposé :**

```markdown
#### 3.2.2 Stock (modifié)

**Changement :** Le stock est désormais stocké dans la DB backend et chargé depuis celle-ci.

**Endpoints :**
- `GET /api/suppliers/:idFournisseur/accommodations/:idHebergement/stock` - Récupérer le stock
  - **Changement :** Charge depuis la DB backend (table `accommodation_stock`)
- `POST /api/suppliers/:idFournisseur/accommodations/:idHebergement/stock` - Mettre à jour le stock
  - **Changement :** 
    1. Sauvegarde d'abord en DB
    2. Export ensuite vers OpenPro automatiquement

**Interface utilisateur :**
- L'affichage et la modification du stock fonctionnent de la même manière
- Les données sont maintenant persistées dans la DB backend
- Export automatique vers OpenPro après chaque modification

#### 3.2.6 Tarifs (modifié)

**Changement :** Les tarifs sont désormais stockés dans la DB backend et chargés depuis celle-ci.

**Endpoints :**
- `GET /api/suppliers/:idFournisseur/accommodations/:idHebergement/rates` - Récupérer les tarifs
  - **Changement :** Charge depuis la DB backend (table `accommodation_data`)
- `POST /api/suppliers/:idFournisseur/bulk-update` - Mettre à jour les tarifs en bulk
  - **Changement :**
    1. Sauvegarde chaque date en DB
    2. Export ensuite vers OpenPro automatiquement

**Interface utilisateur :**
- L'affichage et la modification des tarifs fonctionnent de la même manière
- Les données sont maintenant persistées dans la DB backend
- Export automatique vers OpenPro après chaque modification
```

### 6. Affichage des statuts de réservation

**Section à ajouter :** Nouvelle sous-section "6.1 Indicateurs de statut"

**Contenu proposé :**

```markdown
#### 6.1 Indicateurs de statut de réservation

**Clarification :** Les réservations stockées en DB incluent le champ `bookingStatus` qui indique l'état de chaque réservation. L'affichage visuel de ces statuts dans la modale des réservations est à implémenter.

**Affichage :**
- Les badges de statut seront affichés uniquement dans la modale des réservations (BookingModal)
- Les badges ne sont pas affichés dans la grille de calendrier pour éviter la surcharge visuelle
- La couleur de la plateforme dans la grille reste l'indicateur principal pour identifier rapidement les réservations

**Statuts disponibles (déjà stockés en DB) :**
- **Quote (Devis)** - Badge gris (à implémenter dans la modale)
  - Intention de réservation, pas d'acompte payé
  - Statut par défaut pour les réservations Directes nouvellement créées
- **Confirmed (Confirmée)** - Badge vert (à implémenter dans la modale)
  - Acompte de 30% payé
  - Statut par défaut pour les réservations OpenPro et plateformes externes
- **Paid (Soldée)** - Badge bleu (à implémenter dans la modale)
  - Réservation entièrement payée
- **Cancelled (Annulée)** - Badge rouge (à implémenter dans la modale)
  - Réservation annulée
  - Affichage avec style hachuré ou atténué dans la grille (déjà implémenté)
- **Past (Passée)** - Badge gris foncé (à implémenter dans la modale)
  - Jour de départ passé
  - Mise à jour automatique par le backend

**Mise à jour automatique (déjà implémentée) :**
- Le backend met à jour automatiquement le statut "Past" pour les réservations dont la date de départ est passée
- Les réservations annulées conservent leur statut lors de la synchronisation OpenPro

**Filtrage par statut (à implémenter) :**
- L'interface devrait permettre de filtrer les réservations par statut
- Possibilité d'afficher/masquer les réservations annulées
```

### 7. Suppression de la gestion multi-fournisseurs

**Section à modifier :** Section 2.4 "Configuration des fournisseurs"

**Contenu proposé :**

```markdown
### 2.4 Configuration des fournisseurs (modifié)

**Changement majeur :** Le système gère désormais un seul fournisseur, défini par le backend.

**Avant :** L'interface permettait de gérer plusieurs fournisseurs via la configuration `PUBLIC_OPENPRO_SUPPLIERS`.

**Maintenant :** 
- Le fournisseur est défini par la constante `SUPPLIER_ID` dans le backend
- L'interface admin n'a plus besoin de configurer les fournisseurs
- Toutes les requêtes utilisent automatiquement le `SUPPLIER_ID` du backend

**Impact sur l'interface :**
- Suppression de la configuration `PUBLIC_OPENPRO_SUPPLIERS`
- Simplification de l'interface (plus de sélection de fournisseur)
- Les routes API utilisent automatiquement le bon `idFournisseur`
```

### 8. Export des données vers OpenPro

**Section à ajouter :** Nouvelle section "9. Synchronisation avec OpenPro"

**Contenu proposé :**

```markdown
### 9. Synchronisation avec OpenPro

**Nouveau comportement :** Les données d'hébergements, tarifs et stock sont automatiquement exportées vers OpenPro après chaque modification.

**Export automatique :**
- **Stock :** Après chaque modification via `POST /api/suppliers/.../stock`
- **Tarifs :** Après chaque modification via `POST /api/suppliers/.../bulk-update`
- **Plans tarifaires :** Après chaque création/modification/suppression
- **Liaisons plans tarifaires/hébergements :** Après chaque ajout/suppression

**Export au démarrage :**
- Le backend exporte automatiquement toutes les données vers OpenPro au démarrage
- Garantit que OpenPro est synchronisé avec la DB backend

**Synchronisation au démarrage (ordre d'exécution) :**
1. **Vérification des hébergements :** Vérifie que tous les hébergements en DB avec un ID OpenPro existent dans OpenPro
   - Si un hébergement DB n'existe pas dans OpenPro : avertissement enregistré pour l'admin
   - Note : L'API OpenPro ne permet pas de créer un hébergement, donc on ne peut que vérifier et avertir
2. **Plans tarifaires :** Charge depuis la DB, fetche depuis OpenPro, crée dans OpenPro ceux qui manquent
3. **Liens plans tarifaires/hébergements :** Vérifie et force tout écart dans OpenPro
   - Crée automatiquement dans OpenPro les liens présents en DB mais absents dans OpenPro
4. **Réservations OpenPro :** Synchronise les réservations entre OpenPro et la DB
5. **Données tarifs et stock :** Exporte toutes les données vers OpenPro pour chaque hébergement (en dernier, après que tout soit synchronisé)

**Indicateurs dans l'interface :**
- Message de confirmation après chaque modification ("Données exportées vers OpenPro")
- Indicateur de statut de synchronisation (optionnel)
- Gestion des erreurs d'export (affichage d'un message d'erreur si l'export échoue)

**Note importante :** 
- Les données sont toujours sauvegardées en DB en premier
- L'export vers OpenPro est effectué ensuite
- Si l'export échoue, les données restent en DB (cohérence garantie)
```

---

## Résumé des sections à modifier/ajouter

1. ✅ Section 2.4 - Modifier "Configuration des fournisseurs"
2. ✅ Section 3.2.2 - Modifier "Stock"
3. ✅ Section 3.2.3 - Modifier "Dossiers de réservation"
4. ✅ Section 3.2.4 - Modifier "Types de tarifs"
5. ✅ Section 3.2.6 - Modifier "Tarifs"
6. ✅ Section 6 - Nouvelle section "Affichage des réservations multi-plateformes"
7. ✅ Section 6.1 - Nouvelle sous-section "Indicateurs de statut"
8. ✅ Section 7 - Nouvelle section "Gestion des hébergements"
9. ✅ Section 8 - Nouvelle section "Configuration iCal"
10. ✅ Section 9 - Nouvelle section "Synchronisation avec OpenPro"

