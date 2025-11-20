/**
 * Service de chargement des hébergements
 * 
 * Ce fichier contient les fonctions pour charger la liste des hébergements
 * depuis le backend OpenPro.Backend.
 */

import type { Accommodation } from '../../types';
import { fetchAccommodations } from '../../../../services/api/backendClient';

/**
 * Charge la liste des hébergements pour un fournisseur donné
 * 
 * Cette fonction appelle le backend pour récupérer les hébergements d'un fournisseur.
 * Le backend gère la communication avec l'API OpenPro et la normalisation des données.
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des hébergements normalisés
 * @throws {Error} Peut lever une erreur si le chargement des hébergements échoue
 * @throws {DOMException} Peut lever une AbortError si la requête est annulée
 */
export async function loadAccommodations(
  idFournisseur: number,
  signal?: AbortSignal
): Promise<Accommodation[]> {
  return fetchAccommodations(idFournisseur, signal);
}

