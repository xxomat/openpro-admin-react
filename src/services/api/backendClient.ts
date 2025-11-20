/**
 * Client API Backend
 * 
 * Ce fichier contient les fonctions pour communiquer avec le backend OpenPro.Backend
 * via des requêtes HTTP fetch. Le frontend n'appelle plus directement l'API OpenPro.
 */

import type { Accommodation, SupplierData } from '../../components/ProviderCalendars/types';

const BACKEND_BASE_URL = import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';

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
  const res = await fetch(
    `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/accommodations`,
    { signal }
  );
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Failed to fetch accommodations`);
  }
  
  return res.json();
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
  dureeMin: Record<string, number | null>;
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

