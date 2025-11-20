/**
 * Service principal de chargement de données
 * 
 * Ce fichier orchestre le chargement de toutes les données nécessaires pour un fournisseur
 * depuis le backend OpenPro.Backend. Le backend gère toute la logique de traitement.
 */

import type { Accommodation, SupplierData } from '../types';
import { formatDate } from '../utils/dateUtils';
import { loadAccommodations } from './loaders/accommodationLoader';
import { fetchSupplierData } from '../../../services/api/backendClient';

/**
 * Charge toutes les données (stock, tarifs, types de tarifs) pour un fournisseur
 * et une liste d'hébergements donnés
 * 
 * Cette fonction appelle le backend qui orchestre le chargement de toutes les données :
 * - Les hébergements
 * - Les types de tarifs disponibles
 * - Le stock pour chaque hébergement
 * - Les tarifs, promotions, types de tarifs et durées minimales pour chaque hébergement
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param accommodationsList - Liste des hébergements pour lesquels charger les données
 * @param startDate - Date de début de la plage de dates (incluse)
 * @param endDate - Date de fin de la plage de dates (incluse)
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec toutes les données chargées et structurées
 * @throws {Error} Peut lever une erreur si le chargement des données échoue
 * @throws {DOMException} Peut lever une AbortError si la requête est annulée
 */
export async function loadSupplierData(
  idFournisseur: number,
  accommodationsList: Accommodation[],
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal
): Promise<SupplierData> {
  const debut = formatDate(startDate);
  const fin = formatDate(endDate);
  
  // Le backend charge automatiquement les hébergements et toutes les données associées
  return fetchSupplierData(idFournisseur, debut, fin, signal);
}

// Réexporter loadAccommodations pour compatibilité avec les imports existants
export { loadAccommodations } from './loaders/accommodationLoader';
