/**
 * Types et interfaces pour le composant ProviderCalendars
 * 
 * Ce fichier contient toutes les définitions de types TypeScript utilisées
 * dans le module ProviderCalendars, incluant les types pour les fournisseurs,
 * hébergements, et autres structures de données.
 */

export type Supplier = { 
  idFournisseur: number; 
  nom: string 
};

export type Accommodation = { 
  idHebergement: number; 
  nomHebergement: string 
};

export type RateType = {
  idTypeTarif: number;
  libelle?: unknown;
  descriptionFr?: string;
  ordre?: number;
};

export type BookingDisplay = {
  idDossier: number;
  idHebergement: number;
  dateArrivee: string; // YYYY-MM-DD
  dateDepart: string;   // YYYY-MM-DD
  reference?: string;
  clientNom?: string;   // Nom du client (nom + prénom)
  montantTotal?: number; // Prix total de la réservation
};

export type SupplierData = {
  stock: Record<number, Record<string, number>>;
  rates: Record<number, Record<string, Record<number, number>>>;
  promo: Record<number, Record<string, boolean>>;
  rateTypes: Record<number, Record<string, string[]>>;
  dureeMin: Record<number, Record<string, number | null>>;
  rateTypeLabels: Record<number, string>;
  rateTypesList: RateType[];
  bookings: Record<number, BookingDisplay[]>;
};

