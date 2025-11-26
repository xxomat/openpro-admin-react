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
    
    return res.json();
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
  dureeMin?: number | null;  // présent si dureeMin modifiée
}

/**
 * Type pour un hébergement avec ses dates modifiées
 */
export interface BulkUpdateAccommodation {
  idHebergement: number;
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
  idHebergement: number;
  dateArrivee: string; // Format: YYYY-MM-DD
  dateDepart: string;  // Format: YYYY-MM-DD
  clientNom?: string;
  clientPrenom?: string;
  clientEmail?: string;
  clientTelephone?: string;
  nbPersonnes?: number;
  montantTotal?: number;
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

