/**
 * Types et interfaces pour le composant ProviderCalendars
 * 
 * Ce fichier contient toutes les définitions de types TypeScript utilisées
 * dans le module ProviderCalendars, incluant les types pour les fournisseurs,
 * hébergements, et autres structures de données.
 */

/**
 * Enum pour les plateformes de réservation
 */
export enum PlateformeReservation {
  BookingCom = 'Booking.com',
  Directe = 'Directe',
  OpenPro = 'OpenPro',
  Xotelia = 'Xotelia',
  Unknown = 'Unknown'
}

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
  clientCivilite?: string; // Civilité du client (M, Mme, etc.)
  clientEmail?: string; // Email du client
  clientTelephone?: string; // Téléphone du client
  clientRemarques?: string; // Remarques/notes sur le client
  clientAdresse?: string; // Adresse postale
  clientCodePostal?: string; // Code postal
  clientVille?: string; // Ville
  clientPays?: string; // Pays
  clientDateNaissance?: string; // Date de naissance (stocké mais non affiché dans tooltip)
  clientNationalite?: string; // Nationalité (stocké mais non affiché dans tooltip)
  clientProfession?: string; // Profession (stocké mais non affiché dans tooltip)
  clientSociete?: string; // Nom de l'entreprise/société
  clientSiret?: string; // Numéro SIRET
  clientTva?: string; // Numéro de TVA intracommunautaire
  clientLangue?: string; // Langue préférée (stocké mais non affiché dans tooltip)
  clientNewsletter?: boolean; // Consentement newsletter (stocké mais non affiché dans tooltip)
  clientCgvAcceptees?: boolean; // Acceptation des CGV
  montantTotal?: number; // Prix total de la réservation
  nbPersonnes?: number; // Nombre de personnes
  nbNuits?: number; // Nombre de nuits
  typeTarifLibelle?: string; // Libellé du type de tarif
  devise?: string; // Devise du paiement (EUR, etc.)
  dateCreation?: string; // Date de création du dossier
  plateformeReservation: PlateformeReservation; // Plateforme d'origine de la réservation (Unknown si non renseignée)
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

