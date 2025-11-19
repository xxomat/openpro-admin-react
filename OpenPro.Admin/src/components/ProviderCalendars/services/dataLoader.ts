/**
 * Service principal de chargement de données
 * 
 * Ce fichier orchestre le chargement de toutes les données nécessaires pour un fournisseur :
 * - Les hébergements
 * - Les types de tarifs disponibles
 * - Le stock pour chaque hébergement
 * - Les tarifs, promotions, types de tarifs et durées minimales pour chaque hébergement
 * 
 * Il utilise les services spécialisés dans les sous-dossiers loaders/ pour effectuer
 * les chargements spécifiques.
 */

import type { ClientByRole } from '../../../../../openpro-api-react/src/client/OpenProClient';
import type { Accommodation, SupplierData } from '../types';
import { formatDate, addMonths } from '../utils/dateUtils';
import { loadAccommodations } from './loaders/accommodationLoader';
import { loadStockForAccommodation } from './loaders/stockLoader';
import { loadRateTypes, buildRateTypesList } from './loaders/rateTypeLoader';
import { loadRatesForAccommodation } from './loaders/rateLoader';

/**
 * Charge toutes les données (stock, tarifs, types de tarifs) pour un fournisseur
 * et une liste d'hébergements donnés
 * 
 * Cette fonction orchestre le chargement de toutes les données nécessaires :
 * 1. Charge les types de tarifs disponibles pour le fournisseur
 * 2. Pour chaque hébergement :
 *    - Charge le stock disponible
 *    - Charge les tarifs, promotions, types de tarifs et durées minimales
 * 3. Construit les structures finales de types de tarifs
 * 
 * @param client - Client API OpenPro configuré avec le rôle 'admin'
 * @param idFournisseur - Identifiant du fournisseur
 * @param accommodationsList - Liste des hébergements pour lesquels charger les données
 * @param startDate - Date de début de la plage de dates
 * @param monthsCount - Nombre de mois à charger à partir de startDate
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec toutes les données chargées et structurées
 * @throws {Error} Peut lever une erreur si le chargement des données échoue
 * @throws {DOMException} Peut lever une AbortError si la requête est annulée
 */
export async function loadSupplierData(
  client: ClientByRole<'admin'>,
  idFournisseur: number,
  accommodationsList: Accommodation[],
  startDate: Date,
  monthsCount: number,
  signal?: AbortSignal
): Promise<SupplierData> {
  const nextStock: Record<number, Record<string, number>> = {};
  const nextRates: Record<number, Record<string, Record<number, number>>> = {};
  const nextPromo: Record<number, Record<string, boolean>> = {};
  const nextRateTypes: Record<number, Record<string, string[]>> = {};
  const nextDureeMin: Record<number, Record<string, number | null>> = {};
  const debut = formatDate(startDate);
  const endDate = addMonths(startDate, monthsCount);
  const fin = formatDate(endDate);
  
  // Charger les types de tarifs disponibles
  const discoveredRateTypes = await loadRateTypes(client, idFournisseur, accommodationsList, signal);
  
  // Charger les données pour chaque hébergement
  for (const acc of accommodationsList) {
    if (signal?.aborted) throw new Error('Cancelled');
    
    // Charger le stock
    const mapStock = await loadStockForAccommodation(client, idFournisseur, acc.idHebergement, debut, fin, signal);
    nextStock[acc.idHebergement] = mapStock;

    // Charger les tarifs, promotions, types et durées minimales
    try {
      const ratesData = await loadRatesForAccommodation(
        client,
        idFournisseur,
        acc.idHebergement,
        debut,
        fin,
        discoveredRateTypes,
        signal
      );
      
      nextRates[acc.idHebergement] = ratesData.rates;
      nextPromo[acc.idHebergement] = ratesData.promo;
      nextRateTypes[acc.idHebergement] = ratesData.rateTypes;
      nextDureeMin[acc.idHebergement] = ratesData.dureeMin;
    } catch {
      // Ignorer les erreurs de tarifs pour l'instant
    }
  }
  
  // Construire les structures finales de types de tarifs
  const { rateTypeLabels, rateTypesList } = buildRateTypesList(discoveredRateTypes);
  
  return {
    stock: nextStock,
    rates: nextRates,
    promo: nextPromo,
    rateTypes: nextRateTypes,
    dureeMin: nextDureeMin,
    rateTypeLabels,
    rateTypesList
  };
}

// Réexporter loadAccommodations pour compatibilité avec les imports existants
export { loadAccommodations } from './loaders/accommodationLoader';
