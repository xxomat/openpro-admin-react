# Bugs Connus

Ce document liste les bugs connus du projet OpenPro.Admin, leur statut et les informations nécessaires pour les reproduire et les résoudre.

---

## Bugs Actifs

### [BUG-001] Chevauchement des rectangles de réservation sur les noms d'hébergements lors du scroll horizontal

- **Description** : Lors du scroll horizontal du calendrier vers la droite, les rectangles bleus représentant les réservations chevauchent la colonne des noms d'hébergements (colonne fixe à gauche de 200px).
- **Reproduction** :
  1. Ouvrir le calendrier avec des réservations affichées
  2. Faire défiler horizontalement le calendrier vers la droite
  3. Observer que les rectangles de réservation débordent sur la colonne des noms d'hébergements
- **Comportement attendu** : Les rectangles de réservation ne doivent jamais dépasser sur la colonne des noms d'hébergements, même lors du scroll horizontal.
- **Comportement actuel** : Les rectangles de réservation peuvent déborder sur la colonne des noms d'hébergements lors du scroll horizontal.
- **Impact** : Majeur - Affecte la lisibilité et l'expérience utilisateur
- **Statut** : Non résolu
- **Date de découverte** : 2024-12-19
- **Fichiers concernés** :
  - `src/components/ProviderCalendars/components/CompactGrid/components/BookingOverlay.tsx`
  - `src/components/ProviderCalendars/components/CompactGrid.tsx`
- **Notes** : Le problème semble lié au calcul des positions lors du scroll. Les positions sont calculées avec `getBoundingClientRect()` qui donne des positions relatives à la fenêtre, pas au conteneur scrollable. Une solution pourrait être d'utiliser un conteneur avec `overflow: hidden` ou `clip-path` pour limiter l'affichage des rectangles à la zone des colonnes de dates.

---

## Bugs Résolus

_Aucun bug résolu pour le moment._

---

## Légende des statuts

- **Non résolu** : Le bug existe et n'a pas encore été corrigé
- **En cours** : Le bug est en cours de correction
- **Résolu** : Le bug a été corrigé (déplacé dans la section "Bugs Résolus")

## Légende des impacts

- **Critique** : Bloque l'utilisation de la fonctionnalité ou cause une perte de données
- **Majeur** : Affecte significativement l'expérience utilisateur mais n'empêche pas l'utilisation
- **Mineur** : Problème cosmétique ou impact limité sur l'expérience utilisateur

