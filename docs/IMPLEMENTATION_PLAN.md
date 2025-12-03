# Plan d'implémentation - Mises à jour PRD Admin

## Vue d'ensemble

Ce document décrit le plan d'implémentation pour intégrer les nouvelles fonctionnalités backend dans l'interface admin, basé sur l'approche "DB-first" et la synchronisation au démarrage.

## Phase 1 : Mise à jour du PRD ✅

### 1.1 Sections à modifier
- [x] Section 2.4 - Configuration des fournisseurs (simplification : un seul fournisseur)
- [x] Section 3.2.2 - Stock (DB-first)
- [x] Section 3.2.3 - Dossiers de réservation (affichage unifié)
- [x] Section 3.2.4 - Types de tarifs (DB-first)
- [x] Section 3.2.6 - Tarifs (DB-first)

### 1.2 Nouvelles sections à ajouter
- [x] Section 6 - Affichage des réservations multi-plateformes
- [x] Section 6.1 - Indicateurs de statut de réservation
- [x] Section 7 - Gestion des hébergements
- [x] Section 8 - Configuration iCal
- [x] Section 9 - Synchronisation avec OpenPro

## Phase 2 : Implémentation des fonctionnalités

### 2.1 Affichage des statuts de réservation dans la modale (Priorité : Moyenne)

**Objectif :** Afficher les badges de statut dans la modale des réservations

**Fichiers à modifier :**
- `src/components/ProviderCalendars/components/BookingModal/BookingModal.tsx`
- `src/components/ProviderCalendars/components/BookingModal/components/BookingDetails.tsx` (si existe)

**Tâches :**
1. Ajouter l'affichage du champ `bookingStatus` dans la modale
2. Créer un composant `BookingStatusBadge` avec les couleurs appropriées :
   - Quote : Badge gris "Devis"
   - Confirmed : Badge vert "Confirmée"
   - Paid : Badge bleu "Soldée"
   - Cancelled : Badge rouge "Annulée"
   - Past : Badge gris foncé "Passée"
3. Intégrer le badge dans la modale (en-tête ou section détails)

**Estimation :** 2-3 heures

### 2.2 Filtrage des réservations par plateforme et statut (Priorité : Basse)

**Objectif :** Permettre de filtrer les réservations par plateforme et par statut

**Fichiers à modifier :**
- `src/components/ProviderCalendars/components/DateRangeControls.tsx` (ou nouveau composant)
- `src/components/ProviderCalendars/hooks/useSupplierData.ts` (logique de filtrage)

**Tâches :**
1. Ajouter des contrôles de filtrage (dropdowns ou checkboxes)
2. Implémenter la logique de filtrage dans `useSupplierData`
3. Appliquer les filtres lors du rendu des réservations

**Estimation :** 4-5 heures

### 2.3 Gestion des hébergements (Priorité : Haute)

**Objectif :** Permettre la création, modification et suppression d'hébergements depuis l'interface

**Fichiers à créer :**
- `src/components/ProviderCalendars/components/AccommodationManagement/AccommodationList.tsx`
- `src/components/ProviderCalendars/components/AccommodationManagement/AccommodationForm.tsx`
- `src/components/ProviderCalendars/components/AccommodationManagement/AccommodationModal.tsx`

**Fichiers à modifier :**
- `src/components/ProviderCalendars/index.tsx` (ajouter l'accès à la gestion)
- `src/services/api/backendClient.ts` (ajouter les méthodes pour les endpoints)

**Tâches :**
1. Créer le composant de liste des hébergements
2. Créer le formulaire de création/modification avec validation :
   - Nom (obligatoire)
   - ID Directe (obligatoire)
   - ID OpenPro (obligatoire)
   - IDs externes (optionnels)
3. Implémenter les actions CRUD :
   - Créer un hébergement
   - Modifier un hébergement
   - Supprimer un hébergement
   - Gérer les IDs externes
4. Ajouter la gestion des erreurs (validation, conflits, etc.)
5. Intégrer dans l'interface principale (menu ou bouton)

**Estimation :** 8-10 heures

### 2.4 Configuration iCal (Priorité : Moyenne)

**Objectif :** Permettre la configuration de la synchronisation iCal pour chaque hébergement

**Fichiers à créer :**
- `src/components/ProviderCalendars/components/IcalConfig/IcalConfigList.tsx`
- `src/components/ProviderCalendars/components/IcalConfig/IcalConfigForm.tsx`
- `src/components/ProviderCalendars/components/IcalConfig/IcalConfigModal.tsx`

**Fichiers à modifier :**
- `src/services/api/backendClient.ts` (ajouter les méthodes pour les endpoints iCal)

**Tâches :**
1. Créer le composant de liste des configurations iCal
2. Créer le formulaire de configuration :
   - Sélection de l'hébergement
   - Sélection de la plateforme
   - URL d'import (optionnel)
   - Affichage de l'URL d'export (générée automatiquement)
   - Bouton "Copier l'URL d'export"
3. Implémenter les actions :
   - Créer une configuration
   - Modifier une configuration
   - Supprimer une configuration
4. Ajouter des indicateurs visuels :
   - État de synchronisation (dernière sync, nombre de réservations)
   - Indicateur si URL d'import configurée
   - Bouton "Tester la synchronisation"
5. Intégrer dans l'interface principale

**Estimation :** 6-8 heures

### 2.5 Affichage des avertissements de synchronisation (Priorité : Basse)

**Objectif :** Afficher les avertissements de synchronisation au démarrage

**Fichiers à créer :**
- `src/components/ProviderCalendars/components/StartupWarnings/StartupWarningsPanel.tsx`

**Fichiers à modifier :**
- `src/services/api/backendClient.ts` (ajouter la méthode pour `GET /api/startup-warnings`)
- `src/components/ProviderCalendars/index.tsx` (ajouter l'affichage des avertissements)

**Tâches :**
1. Créer un composant pour afficher les avertissements
2. Charger les avertissements au démarrage de l'interface
3. Afficher les avertissements dans un panneau ou une notification
4. Catégoriser les avertissements par type :
   - Hébergements manquants dans OpenPro
   - Échecs de création de plans tarifaires
   - Échecs de création de liens
5. Permettre de masquer/afficher les avertissements

**Estimation :** 3-4 heures

### 2.6 Mise à jour des endpoints existants (Priorité : Haute)

**Objectif :** S'assurer que tous les appels API utilisent les nouveaux endpoints DB-first

**Fichiers à vérifier/modifier :**
- `src/services/api/backendClient.ts`
- Tous les composants qui appellent les endpoints de tarifs, stock, plans tarifaires

**Tâches :**
1. Vérifier que les endpoints utilisés correspondent aux nouveaux endpoints backend
2. Mettre à jour les appels pour utiliser les endpoints DB-first :
   - `GET /api/suppliers/:idFournisseur/rate-types` (charge depuis DB)
   - `POST /api/suppliers/:idFournisseur/rate-types` (DB-first)
   - `GET /api/suppliers/:idFournisseur/local-bookings` (au lieu de `/dossiers`)
3. Vérifier que les réponses sont correctement typées
4. Tester que les fonctionnalités existantes continuent de fonctionner

**Estimation :** 4-5 heures

## Phase 3 : Tests et validation

### 3.1 Tests unitaires
- Tests pour les nouveaux composants (hébergements, iCal)
- Tests pour les helpers de filtrage
- Tests pour les badges de statut

**Estimation :** 6-8 heures

### 3.2 Tests d'intégration
- Tests end-to-end pour la création d'hébergements
- Tests pour la configuration iCal
- Tests pour l'affichage des réservations avec statuts

**Estimation :** 4-6 heures

### 3.3 Tests manuels
- Vérifier que toutes les fonctionnalités existantes fonctionnent toujours
- Tester les nouveaux workflows (création hébergement, config iCal)
- Vérifier l'affichage des statuts et le filtrage

**Estimation :** 4-6 heures

## Ordre de priorité recommandé

### Sprint 1 (Priorité Haute)
1. ✅ Mise à jour du PRD
2. Mise à jour des endpoints existants (2.6)
3. Gestion des hébergements (2.3)

### Sprint 2 (Priorité Moyenne)
4. Affichage des statuts dans la modale (2.1)
5. Configuration iCal (2.4)

### Sprint 3 (Priorité Basse)
6. Filtrage des réservations (2.2)
7. Affichage des avertissements (2.5)

## Estimation totale

- **Phase 2 (Implémentation) :** 27-36 heures
- **Phase 3 (Tests) :** 14-20 heures
- **Total :** 41-56 heures (~5-7 jours de développement)

## Dépendances

- Backend doit être déployé avec les nouvelles fonctionnalités
- Les endpoints doivent être documentés et testés
- La base de données doit être migrée avec les nouvelles tables/colonnes

## Notes importantes

- Les fonctionnalités existantes doivent continuer de fonctionner pendant la transition
- Les nouveaux endpoints doivent être rétrocompatibles si possible
- Les erreurs doivent être gérées gracieusement avec des messages clairs pour l'utilisateur

