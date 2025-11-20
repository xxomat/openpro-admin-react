/**
 * Types pour les types de tarifs
 * 
 * Ce fichier contient uniquement les types utilisés pour les types de tarifs.
 * Le chargement des types de tarifs est maintenant géré par le backend.
 */

/**
 * Type interne pour représenter un type de tarif découvert lors du chargement
 * 
 * Ce type est utilisé pour la compatibilité avec le code existant.
 * Le traitement des types de tarifs est maintenant effectué côté backend.
 */
export type DiscoveredRateType = {
  /** Identifiant unique du type de tarif */
  idTypeTarif: number;
  /** Libellé brut de l'API (peut être multilingue) */
  libelle?: unknown;
  /** Libellé français extrait et normalisé */
  label?: string;
  /** Description française extraite et normalisée */
  descriptionFr?: string;
  /** Ordre d'affichage du type de tarif */
  ordre?: number;
};
