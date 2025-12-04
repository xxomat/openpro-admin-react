/**
 * Types et interfaces pour le composant ProviderCalendars
 * 
 * Ce fichier contient toutes les définitions de types TypeScript utilisées
 * dans le module ProviderCalendars, incluant les types pour les fournisseurs,
 * hébergements, et autres structures de données.
 * 
 * Convention : Les propriétés utilisent des noms camelCase en anglais.
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
  supplierId: number; 
  name: string 
};

export type Accommodation = { 
  accommodationId: string; // GUID interne de la DB (DB-first)
  accommodationName: string;
  openProId?: number; // ID OpenPro optionnel (pour affichage/compatibilité)
};

export type RateType = {
  rateTypeId: number;
  label?: unknown;
  descriptionFr?: string;
  order?: number;
};

/**
 * Statuts de réservation possibles
 */
export enum BookingStatus {
  Quote = 'Quote',
  Confirmed = 'Confirmed',
  Paid = 'Paid',
  Cancelled = 'Cancelled',
  Past = 'Past'
}

export type BookingDisplay = {
  bookingId: number;
  accommodationId: string; // GUID interne de la DB (DB-first)
  arrivalDate: string; // YYYY-MM-DD
  departureDate: string;   // YYYY-MM-DD
  reference?: string;
  bookingStatus?: BookingStatus; // État de la réservation
  clientName?: string;   // Nom du client (nom + prénom)
  clientTitle?: string; // Civilité du client (M, Mme, etc.)
  clientEmail?: string; // Email du client
  clientPhone?: string; // Téléphone du client
  clientNotes?: string; // Remarques/notes sur le client
  clientAddress?: string; // Adresse postale
  clientPostalCode?: string; // Code postal
  clientCity?: string; // Ville
  clientCountry?: string; // Pays
  clientBirthDate?: string; // Date de naissance (stocké mais non affiché dans tooltip)
  clientNationality?: string; // Nationalité (stocké mais non affiché dans tooltip)
  clientProfession?: string; // Profession (stocké mais non affiché dans tooltip)
  clientCompany?: string; // Nom de l'entreprise/société
  clientSiret?: string; // Numéro SIRET
  clientVat?: string; // Numéro de TVA intracommunautaire
  clientLanguage?: string; // Langue préférée (stocké mais non affiché dans tooltip)
  clientNewsletter?: boolean; // Consentement newsletter (stocké mais non affiché dans tooltip)
  clientTermsAccepted?: boolean; // Acceptation des CGV
  totalAmount?: number; // Prix total de la réservation
  numberOfPersons?: number; // Nombre de personnes
  numberOfNights?: number; // Nombre de nuits
  rateTypeLabel?: string; // Libellé du type de tarif
  currency?: string; // Devise du paiement (EUR, etc.)
  creationDate?: string; // Date de création du dossier
  reservationPlatform: PlateformeReservation; // Plateforme d'origine de la réservation (Unknown si non renseignée)
  isPendingSync?: boolean; // true si réservation Direct locale en attente de synchronisation avec OpenPro
  isObsolete?: boolean; // true si réservation Direct supprimée localement mais toujours présente dans OpenPro
};

export type SupplierData = {
  stock: Record<string, Record<string, number>>; // Clé: accommodationId (GUID)
  rates: Record<string, Record<string, Record<number, number>>>; // Clé: accommodationId (GUID)
  promo: Record<string, Record<string, boolean>>; // Clé: accommodationId (GUID)
  rateTypes: Record<string, Record<string, string[]>>; // Clé: accommodationId (GUID)
  minDuration: Record<string, Record<string, Record<number, number | null>>>; // Clé: accommodationId (GUID)
  arrivalAllowed: Record<string, Record<string, Record<number, boolean>>>; // Clé: accommodationId (GUID)
  rateTypeLabels: Record<number, string>;
  rateTypesList: RateType[];
  bookings: Record<string, BookingDisplay[]>; // Clé: accommodationId (GUID)
  /** Map des IDs de types de tarif liés par hébergement (clé: accommodationId (GUID), valeur: array de rateTypeId) */
  rateTypeLinksByAccommodation: Record<string, number[]>; // Clé: accommodationId (GUID)
};
