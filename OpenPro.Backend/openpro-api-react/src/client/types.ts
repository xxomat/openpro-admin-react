export type OkResponse<T> = {
  ok: 1;
  data: T;
};

export type ErrorResponse = {
  ok: 0;
  data: Record<string, unknown>;
};

export type ApiResponse<T> = OkResponse<T> | ErrorResponse;

export type OpenProClientConfig = {
  baseUrl: string;
  apiKey: string;
  debug?: boolean;
};

export type AccommodationHeader = {
  cleHebergement: {
    idFournisseur: number;
    idHebergement: number;
  };
  nom: string;
};

export type AccommodationListResponse = {
  listeHebergement: AccommodationHeader[];
};

export type BookingListResponse = {
  dossiers?: unknown[];
  // common listing scaffolding from Swagger (kept optional)
  nbTotal?: number;
  pageCourante?: number;
  nbPages?: number;
};

export type BookingDetailResponse = Record<string, unknown>;

export type RateType = {
  idTypeTarif: number;
  libelle?: unknown;
  description?: unknown;
  ordre?: number;
} & Record<string, unknown>;

export type RateTypeListResponse = {
  // per Swagger ReponseTypeTarifListe -> data.typeTarifs
  typeTarifs?: RateType[];
} & Record<string, unknown>;

export type Tarif = Record<string, unknown>;
export type RatesResponse = {
  // per Swagger ReponseTarifListe -> data.tarifs
  tarifs?: Tarif[];
} & Record<string, unknown>;

export type Warning = {
  code?: string;
  detail?: string;
};

// Admin payloads (simplified per Swagger, keep loose where needed)
export type Multilingue = {
  langue: string; // 'fr' | 'en' etc.
  texte: string;
};

export type TypeTarifAjout = {
  libelle: Multilingue[];
  description: Multilingue[];
  ordre: number;
};

export type TypeTarifModif = TypeTarifAjout;

export type ReponseTypeTarifAjout = {
  idTypeTarif: number;
};

export type ReponseTypeTarifListe = {
  typeTarifs: RateType[];
};

export type LiaisonResponse = Record<string, unknown>;

// Liaison hébergement - type de tarif (selon Swagger)
export type LiaisonHebergementTypeTarif = {
  idFournisseur: number;
  idHebergement: number;
  idTypeTarif: number;
};

export type ReponseLiaisonHebergementTypeTarifListe = {
  liaisonHebergementTypeTarifs: LiaisonHebergementTypeTarif[];
};

export type TarifModif = {
  idTypeTarif: number;
  debut: string; // YYYY-MM-DD
  fin: string;   // YYYY-MM-DD
  ouvert: boolean;
  dureeMin: number;
  dureeMax: number;
  arriveeAutorisee: boolean;
  departAutorise: boolean;
  tarifPax: Record<string, unknown>;
};

export type RequeteTarifModif = {
  tarifs: TarifModif[];
};

// Dossiers list query params (subset from Swagger)
export type ListBookingsParams = {
  dateCreationDepuis?: string;    // date-time
  dateCreationJusqua?: string;    // date-time
  dateModificationDepuis?: string;// date-time
  dateModificationJusqua?: string;// date-time
  page?: number;
  nbParPage?: number;
};

// Webhook types
export type DossierWebhookAjout = {
  // exact fields per Swagger RequeteDossierWebhookAjout
  url: string;
  emailAlerte?: string;
};

export type DossierWebhookSuppr = {
  // per Swagger RequeteDossierWebhookSuppr (identifier fields)
  url: string;
};

export type DossierWebhookListe = {
  webhooks?: Array<{ url: string; emailAlerte?: string }>;
};

// =====================
// Deeper nested schemas
// =====================

// Stock (GET /fournisseur/{idFournisseur}/hebergements/{idHebergement}/stock)
export type StockJour = {
  jour?: string;                // YYYY-MM-DD
  stock?: number;               // remaining stock
  ouvert?: boolean;             // open for booking
} & Record<string, unknown>;

export type StockResponse = {
  // The Swagger points to ReponseStock; keeping flexible but structured
  stock?: StockJour[];
} & Record<string, unknown>;

// Tarifs (read)
export type TarifPaxOccupation = {
  type?: string;
  prix?: number;
  nbPers?: number;
};

export type TarifPax = {
  listeTarifPaxOccupation?: TarifPaxOccupation[];
};

export type TarifItem = {
  idTypeTarif?: number;
  debut?: string; // YYYY-MM-DD
  fin?: string;   // YYYY-MM-DD
  ouvert?: boolean;
  dureeMin?: number;
  dureeMax?: number;
  arriveeAutorisee?: boolean;
  departAutorise?: boolean;
  tarifPax?: TarifPax;
} & Record<string, unknown>;

export type RatesListResponse = {
  tarifs?: TarifItem[];
} & Record<string, unknown>;

// Dossiers (reservations)
export type BookingCustomer = {
  civilite?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
};

export type BookingAccommodation = {
  idHebergement?: number;
  nom?: string;
  dateArrivee?: string;
  dateDepart?: string;
  nbNuits?: number;
  nbPersonnes?: number;
  typeTarif?: {
    idTypeTarif?: number;
    libelle?: string;
    description?: string;
    detailPrix?: unknown;
  };
};

export type BookingPayment = {
  montantTotal?: number;
  devise?: string;
  transactions?: Array<Record<string, unknown>>;
};

export type Booking = {
  idDossier?: number;
  idFournisseur?: number;
  reference?: string;
  dateCreation?: string;
  dateModification?: string;
  client?: BookingCustomer;
  hebergement?: BookingAccommodation;
  paiement?: BookingPayment;
} & Record<string, unknown>;

export type BookingList = {
  dossiers?: Booking[];
  nbTotal?: number;
  pageCourante?: number;
  nbPages?: number;
};


