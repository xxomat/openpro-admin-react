/**
 * Service de chargement et traitement des tarifs
 * 
 * Ce fichier contient les fonctions pour charger les tarifs depuis le backend.
 * Le traitement des tarifs est maintenant effectué côté backend.
 */

import type { DiscoveredRateType } from './rateTypeLoader';
import { fetchRates } from '../../../../services/api/backendClient';

/**
 * Charge les tarifs, promotions, types de tarifs et durées minimales pour un hébergement
 * 
 * Cette fonction appelle le backend pour récupérer les tarifs traités et normalisés.
 * Le traitement des tarifs est maintenant effectué côté backend.
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param discoveredRateTypes - Map des types de tarifs découverts (non utilisé côté frontend maintenant)
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Objet contenant les maps de tarifs, promotions, types et durées minimales
 * @throws {Error} Peut lever une erreur si le chargement des tarifs échoue
 * @throws {DOMException} Peut lever une AbortError si la requête est annulée
 */
export async function loadRatesForAccommodation(
  idFournisseur: number,
  idHebergement: number,
  debut: string,
  fin: string,
  discoveredRateTypes: Map<number, DiscoveredRateType>,
  signal?: AbortSignal
): Promise<{
  rates: Record<string, Record<number, number>>;
  promo: Record<string, boolean>;
  rateTypes: Record<string, string[]>;
  dureeMin: Record<string, number | null>;
}> {
  // Le paramètre discoveredRateTypes est conservé pour compatibilité mais n'est plus utilisé
  // car le traitement est maintenant effectué côté backend
  return fetchRates(idFournisseur, idHebergement, debut, fin, signal);
}

