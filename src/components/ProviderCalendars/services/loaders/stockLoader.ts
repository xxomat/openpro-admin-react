/**
 * Service de chargement du stock
 * 
 * Ce fichier contient les fonctions pour charger le stock disponible
 * pour un hébergement sur une plage de dates donnée depuis le backend.
 */

import { fetchStock } from '@/services/api/backendClient';

/**
 * Charge le stock disponible pour un hébergement sur une plage de dates
 * 
 * Cette fonction appelle le backend pour récupérer le stock disponible.
 * Le backend gère la communication avec l'API OpenPro et la normalisation des données.
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Map du stock par date (clé: date YYYY-MM-DD, valeur: quantité disponible)
 * @throws {Error} Peut lever une erreur si le chargement du stock échoue
 * @throws {DOMException} Peut lever une AbortError si la requête est annulée
 */
export async function loadStockForAccommodation(
  idFournisseur: number,
  idHebergement: number,
  debut: string,
  fin: string,
  signal?: AbortSignal
): Promise<Record<string, number>> {
  return fetchStock(idFournisseur, idHebergement, debut, fin, signal);
}

