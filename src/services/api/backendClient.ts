/**
 * Client API Backend
 * 
 * Ce fichier contient les fonctions pour communiquer avec le backend OpenPro.Backend
 * via des requêtes HTTP fetch. Le frontend n'appelle plus directement l'API OpenPro.
 */

import type { Accommodation, SupplierData, BookingDisplay } from '../../components/ProviderCalendars/types';

const BACKEND_BASE_URL = import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:8787';

/**
 * Récupère la liste des hébergements pour un fournisseur
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des hébergements
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function fetchAccommodations(
  idFournisseur: number,
  signal?: AbortSignal
): Promise<Accommodation[]> {
  try {
    const res = await fetch(
      `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations`,
      { signal }
    );
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to fetch accommodations`);
    }
    
    const data = await res.json();
    
    // Transformer les données de l'API vers le format attendu par l'interface
    // L'API retourne IAccommodation[] avec { id, nom, ids } 
    // L'interface attend Accommodation[] avec { accommodationId: number, accommodationName: string }
    // accommodationId doit être l'ID OpenPro (number) car il est utilisé comme clé dans des objets indexés
    // Les hébergements sans ID OpenPro sont filtrés car ils ne peuvent pas être utilisés dans l'interface
    if (Array.isArray(data)) {
      return data
        .map((acc: any) => {
          // Extraire l'ID OpenPro depuis ids.OpenPro
          const idOpenPro = acc.ids?.['OpenPro'] || acc.ids?.OpenPro;
          if (!idOpenPro) {
            return null; // Hébergement sans ID OpenPro, sera filtré
          }
          
          const accommodationId = parseInt(String(idOpenPro), 10);
          if (isNaN(accommodationId)) {
            return null; // ID OpenPro invalide, sera filtré
          }
          
          return {
            accommodationId,
            accommodationName: acc.nom || ''
          };
        })
        .filter((acc: Accommodation | null): acc is Accommodation => acc !== null);
    }
    
    return [];
  } catch (error) {
    // Améliorer le message d'erreur pour les erreurs réseau
    if (error instanceof TypeError && (
      error.message.includes('fetch') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    )) {
      throw new Error(`Impossible de se connecter au backend (${BACKEND_BASE_URL}). Vérifiez que le serveur est démarré.`);
    }
    throw error;
  }
}

/**
 * Récupère toutes les données d'un fournisseur (stock, tarifs, types de tarifs)
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec toutes les données du fournisseur
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function fetchSupplierData(
  idFournisseur: number,
  debut: string,
  fin: string,
  signal?: AbortSignal
): Promise<SupplierData> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/supplier-data?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`,
    { signal }
  );
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch supplier data`);
  }
  
  return res.json();
}

/**
 * Récupère les tarifs pour un hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec les données de tarifs
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function fetchRates(
  idFournisseur: number,
  idHebergement: number,
  debut: string,
  fin: string,
  signal?: AbortSignal
): Promise<{
  rates: Record<string, Record<number, number>>;
  promo: Record<string, boolean>;
  rateTypes: Record<string, string[]>;
  dureeMin: Record<string, Record<number, number | null>>;
  arriveeAutorisee: Record<string, Record<number, boolean>>;
}> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/rates?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`,
    { signal }
  );
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch rates`);
  }
  
  return res.json();
}

/**
 * Récupère les détails complets d'un tarif pour une date et un type de tarif spécifiques
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param date - Date au format YYYY-MM-DD
 * @param rateTypeId - ID du type de tarif
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec les détails complets du tarif (sans debut et fin)
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function fetchRateDetails(
  idFournisseur: number,
  idHebergement: number,
  date: string,
  rateTypeId: number,
  signal?: AbortSignal
): Promise<{
  rateTypeId?: number;
  rateType?: {
    rateTypeId?: number;
    label?: Array<{ langue: string; texte: string }>;
    description?: Array<{ langue: string; texte: string }>;
    order?: number;
  };
  ratePax?: {
    price?: number;
    occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  };
  pricePax?: {
    price?: number;
    occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  };
  occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  price?: number;
  label?: Array<{ langue: string; texte: string }>;
  promotion?: boolean | unknown;
  promo?: boolean | unknown;
  promotionActive?: boolean | unknown;
  hasPromo?: boolean | unknown;
  minDuration?: number;
  arrivalAllowed?: boolean;
  departureAllowed?: boolean;
  description?: Array<{ langue: string; texte: string }>;
  order?: number;
}> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/rates/details?date=${encodeURIComponent(date)}&rateTypeId=${encodeURIComponent(rateTypeId)}`,
    { signal }
  );
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch rate details`);
  }
  
  return res.json();
}

/**
 * Récupère le stock pour un hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la map du stock par date
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function fetchStock(
  idFournisseur: number,
  idHebergement: number,
  debut: string,
  fin: string,
  signal?: AbortSignal
): Promise<Record<string, number>> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/stock?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`,
    { signal }
  );
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch stock`);
  }
  
  return res.json();
}

/**
 * Type pour une date modifiée dans la requête bulk
 */
export interface BulkUpdateDate {
  date: string;              // YYYY-MM-DD
  rateTypeId?: number;       // présent si tarif modifié
  price?: number;            // présent si tarif modifié
  minDuration?: number | null;  // présent si minDuration modifiée
  arrivalAllowed?: boolean; // présent si arrivalAllowed modifié
}

/**
 * Type pour un hébergement avec ses dates modifiées
 */
export interface BulkUpdateAccommodation {
  accommodationId: number;
  dates: BulkUpdateDate[];
}

/**
 * Type pour la requête bulk update
 */
export interface BulkUpdateRequest {
  accommodations: BulkUpdateAccommodation[];
}

/**
 * Sauvegarde les modifications de tarifs et durées minimales en bulk
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param bulkData - Données des modifications groupées par hébergement
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function saveBulkUpdates(
  idFournisseur: number,
  bulkData: BulkUpdateRequest,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/bulk-update`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bulkData),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to save bulk updates: ${errorText}`);
  }
}

/**
 * Type pour les données de création d'une réservation
 */
export interface CreateBookingData {
  accommodationId: number;
  arrivalDate: string; // Format: YYYY-MM-DD
  departureDate: string;  // Format: YYYY-MM-DD
  clientName?: string;
  clientFirstName?: string;
  clientEmail?: string;
  clientPhone?: string;
  numberOfPersons?: number;
  totalAmount?: number;
  reference?: string;
}

/**
 * Crée une nouvelle réservation locale
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param bookingData - Données de la réservation à créer
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la réservation créée
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function createBooking(
  idFournisseur: number,
  bookingData: CreateBookingData,
  signal?: AbortSignal
): Promise<BookingDisplay> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/local-bookings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to create booking: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Type pour un jour de stock dans la requête de mise à jour
 */
export interface StockDay {
  date: string;    // Format: YYYY-MM-DD
  dispo: number;   // Disponibilité (généralement 0 ou 1)
}

/**
 * Payload pour la mise à jour du stock
 */
export interface UpdateStockPayload {
  jours: StockDay[];
}

/**
 * Met à jour le stock pour un hébergement
 * 
 * Cette fonction permet de mettre à jour ou créer des entrées de stock
 * dans OpenPro pour un hébergement donné. Les dates peuvent être créées
 * si elles n'existent pas déjà dans OpenPro.
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param stockPayload - Payload contenant les jours à mettre à jour
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 * 
 * @example
 * ```typescript
 * await updateStock(47186, 1, {
 *   jours: [
 *     { date: '2025-06-15', dispo: 1 },
 *     { date: '2025-06-16', dispo: 1 },
 *     { date: '2025-06-17', dispo: 0 }
 *   ]
 * });
 * ```
 */
export async function updateStock(
  idFournisseur: number,
  idHebergement: number,
  stockPayload: UpdateStockPayload,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/stock`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stockPayload),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to update stock: ${errorText}`);
  }
}

/**
 * Supprime une réservation locale (Directe)
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idDossier - Identifiant du dossier de réservation
 * @param idHebergement - Identifiant de l'hébergement (optionnel, pour une recherche plus précise)
 * @param dateArrivee - Date d'arrivée (optionnel, pour une recherche plus précise)
 * @param dateDepart - Date de départ (optionnel, pour une recherche plus précise)
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue sans valeur en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function deleteBooking(
  idFournisseur: number,
  idDossier: number,
  idHebergement?: number,
  dateArrivee?: string,
  dateDepart?: string,
  signal?: AbortSignal
): Promise<void> {
  // Construire l'URL avec les paramètres optionnels en query string
  const url = new URL(`${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/local-bookings/${idDossier}`);
  if (idHebergement !== undefined) {
    url.searchParams.set('idHebergement', String(idHebergement));
  }
  if (dateArrivee) {
    url.searchParams.set('dateArrivee', dateArrivee);
  }
  if (dateDepart) {
    url.searchParams.set('dateDepart', dateDepart);
  }

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    signal
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to delete booking: ${errorText}`);
  }
}

/**
 * Type pour un texte multilingue
 */
export interface Multilingue {
  langue: string; // 'ca' | 'de' | 'es' | 'fr' | 'it' | 'nl' | 'en'
  texte: string;
}

/**
 * Type pour un type de tarif (réponse de l'API)
 */
export interface RateTypeApi {
  idTypeTarif: number;
  libelle?: unknown;
  description?: unknown;
  ordre?: number;
}

/**
 * Type pour la création/modification d'un type de tarif
 */
export interface TypeTarifModif {
  libelle: Multilingue[];
  description: Multilingue[];
  ordre: number;
}

/**
 * Type pour la réponse de création d'un type de tarif
 */
export interface ReponseTypeTarifAjout {
  idTypeTarif: number;
}

/**
 * Type pour la réponse de liste des types de tarif
 */
export interface ReponseTypeTarifListe {
  typeTarifs: RateTypeApi[];
}

/**
 * Type pour une liaison hébergement-type de tarif
 */
export interface LiaisonHebergementTypeTarif {
  idFournisseur: number;
  idHebergement: number;
  idTypeTarif: number;
}

/**
 * Type pour la réponse de liste des liaisons
 */
export interface ReponseLiaisonHebergementTypeTarifListe {
  liaisonHebergementTypeTarifs: LiaisonHebergementTypeTarif[];
}

/**
 * Récupère la liste des types de tarif pour un fournisseur
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des types de tarif
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function listRateTypes(
  idFournisseur: number,
  signal?: AbortSignal
): Promise<ReponseTypeTarifListe> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/rate-types`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to list rate types: ${errorText}`);
  }
  
  const data = await res.json();
  return data;
}

/**
 * Crée un nouveau type de tarif
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param payload - Données du type de tarif à créer
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec l'identifiant du type de tarif créé
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function createRateType(
  idFournisseur: number,
  payload: TypeTarifModif,
  signal?: AbortSignal
): Promise<ReponseTypeTarifAjout> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/rate-types`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ typeTarifModif: payload }),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to create rate type: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Modifie un type de tarif existant
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idTypeTarif - Identifiant du type de tarif à modifier
 * @param payload - Données du type de tarif modifié
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function updateRateType(
  idFournisseur: number,
  idTypeTarif: number,
  payload: TypeTarifModif,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/rate-types/${idTypeTarif}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ typeTarifModif: payload }),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to update rate type: ${errorText}`);
  }
}

/**
 * Supprime un type de tarif
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idTypeTarif - Identifiant du type de tarif à supprimer
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function deleteRateType(
  idFournisseur: number,
  idTypeTarif: number,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/rate-types/${idTypeTarif}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to delete rate type: ${errorText}`);
  }
}

/**
 * Récupère la liste des liaisons hébergement-type de tarif pour un hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des liaisons
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function listAccommodationRateTypeLinks(
  idFournisseur: number,
  idHebergement: number,
  signal?: AbortSignal
): Promise<ReponseLiaisonHebergementTypeTarifListe> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/rate-type-links`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to list accommodation rate type links: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Lie un type de tarif à un hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param idTypeTarif - Identifiant du type de tarif
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function linkRateTypeToAccommodation(
  idFournisseur: number,
  idHebergement: number,
  idTypeTarif: number,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/rate-type-links/${idTypeTarif}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to link rate type to accommodation: ${errorText}`);
  }
}

/**
 * Supprime la liaison entre un type de tarif et un hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param idTypeTarif - Identifiant du type de tarif
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function unlinkRateTypeFromAccommodation(
  idFournisseur: number,
  idHebergement: number,
  idTypeTarif: number,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations/${idHebergement}/rate-type-links/${idTypeTarif}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to unlink rate type from accommodation: ${errorText}`);
  }
}

// ============================================================================
// Gestion des hébergements
// ============================================================================

/**
 * Type pour un hébergement (réponse de l'API)
 */
export interface AccommodationApi {
  id: string;
  nom: string;
  idOpenPro: number | null;
  ids?: Record<string, string | number>;
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Type pour la création/modification d'un hébergement
 */
export interface AccommodationPayload {
  nom: string;
  ids: {
    Directe: string;
    OpenPro: number;
    'Booking.com'?: string;
    Xotelia?: string;
    [key: string]: string | number | undefined;
  };
}

/**
 * Récupère la liste de tous les hébergements
 * 
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des hébergements
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function listAccommodations(
  signal?: AbortSignal
): Promise<AccommodationApi[]> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to list accommodations: ${errorText}`);
  }
  
  const data = await res.json();
  // L'API retourne { accommodations: [...] }, extraire le tableau
  return Array.isArray(data.accommodations) ? data.accommodations : (Array.isArray(data) ? data : []);
}

/**
 * Crée un nouvel hébergement
 * 
 * @param payload - Données de l'hébergement à créer
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec l'hébergement créé
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function createAccommodation(
  payload: AccommodationPayload,
  signal?: AbortSignal
): Promise<AccommodationApi> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to create accommodation: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Modifie un hébergement existant
 * 
 * @param id - Identifiant de l'hébergement
 * @param payload - Données de l'hébergement à modifier
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec l'hébergement modifié
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function updateAccommodation(
  id: string,
  payload: AccommodationPayload,
  signal?: AbortSignal
): Promise<AccommodationApi> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to update accommodation: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Supprime un hébergement
 * 
 * @param id - Identifiant de l'hébergement
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function deleteAccommodation(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to delete accommodation: ${errorText}`);
  }
}

/**
 * Récupère les identifiants externes d'un hébergement
 * 
 * @param id - Identifiant de l'hébergement
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec les identifiants externes
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function getAccommodationExternalIds(
  id: string,
  signal?: AbortSignal
): Promise<Record<string, string | number>> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations/${id}/external-ids`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to get accommodation external IDs: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Met à jour les identifiants externes d'un hébergement
 * 
 * @param id - Identifiant de l'hébergement
 * @param externalIds - Identifiants externes à mettre à jour
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function updateAccommodationExternalIds(
  id: string,
  externalIds: Record<string, string | number>,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/accommodations/${id}/external-ids`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(externalIds),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to update accommodation external IDs: ${errorText}`);
  }
}

// ============================================================================
// Configuration iCal
// ============================================================================

/**
 * Type pour une configuration iCal
 */
export interface IcalConfig {
  id: string;
  accommodationId: string;
  platform: string;
  importUrl?: string;
  exportUrl: string;
  lastSync?: string;
  lastSyncCount?: number;
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Type pour la création/modification d'une configuration iCal
 */
export interface IcalConfigPayload {
  accommodationId: string;
  platform: string;
  importUrl?: string;
}

/**
 * Récupère la liste de toutes les configurations iCal
 * 
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des configurations iCal
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function listIcalConfigs(
  signal?: AbortSignal
): Promise<IcalConfig[]> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/ical-config`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to list iCal configs: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Crée une nouvelle configuration iCal
 * 
 * @param payload - Données de la configuration à créer
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la configuration créée
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function createIcalConfig(
  payload: IcalConfigPayload,
  signal?: AbortSignal
): Promise<IcalConfig> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/ical-config`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to create iCal config: ${errorText}`);
  }
  
  return res.json();
}

/**
 * Supprime une configuration iCal
 * 
 * @param id - Identifiant de la configuration
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue en cas de succès
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function deleteIcalConfig(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/ical-config/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to delete iCal config: ${errorText}`);
  }
}

// ============================================================================
// Avertissements de synchronisation
// ============================================================================

/**
 * Type pour un avertissement de synchronisation
 */
export interface StartupWarning {
  type: string;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * Récupère les avertissements de synchronisation au démarrage
 * 
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des avertissements
 * @throws {Error} Peut lever une erreur si la requête échoue
 */
export async function getStartupWarnings(
  signal?: AbortSignal
): Promise<StartupWarning[]> {
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/startup-warnings`,
    { signal }
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: Failed to get startup warnings: ${errorText}`);
  }
  
  return res.json();
}

