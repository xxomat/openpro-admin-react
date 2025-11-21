/**
 * Utilitaires pour la fonctionnalité de réservation
 * 
 * Ce fichier contient les fonctions pour analyser la sélection de cellules
 * et calculer les informations de réservation (dates, durées, prix).
 */

import { formatDate, addDays } from './dateUtils';

/**
 * Représente une plage de dates consécutives pour un hébergement
 */
export interface DateRange {
  /** Date de début au format YYYY-MM-DD */
  startDate: string;
  /** Date de fin au format YYYY-MM-DD */
  endDate: string;
  /** Nombre de nuits */
  nights: number;
}

/**
 * Représente un récapitulatif de réservation pour un hébergement
 */
export interface BookingSummary {
  /** ID de l'hébergement */
  accId: number;
  /** Nom de l'hébergement */
  accName: string;
  /** Plages de dates consécutives */
  dateRanges: DateRange[];
  /** Prix total pour toutes les plages */
  totalPrice: number;
  /** Prix par plage */
  pricesByRange: Map<string, number>; // Clé: "startDate-endDate", Valeur: prix
}

/**
 * Détecte les plages de dates consécutives pour un hébergement donné
 * 
 * @param dates - Tableau de dates triées au format YYYY-MM-DD
 * @returns Tableau de plages de dates consécutives
 * 
 * Note: endDate représente la date de départ (lendemain de la dernière date sélectionnée)
 *       nights représente le nombre de dates sélectionnées (nombre de nuits)
 */
export function findConsecutiveDateRanges(dates: string[]): DateRange[] {
  if (dates.length === 0) return [];
  
  const sortedDates = [...dates].sort();
  const ranges: DateRange[] = [];
  
  let currentStart = sortedDates[0];
  let currentEnd = sortedDates[0];
  let currentDates: string[] = [sortedDates[0]]; // Garder trace des dates de la plage
  
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = new Date(currentEnd);
    previousDate.setDate(previousDate.getDate() + 1);
    
    // Vérifier si la date actuelle est consécutive à la précédente
    if (formatDate(currentDate) === formatDate(previousDate)) {
      currentEnd = sortedDates[i];
      currentDates.push(sortedDates[i]);
    } else {
      // Fin de la plage actuelle, commencer une nouvelle plage
      // endDate = date de départ = lendemain de la dernière date sélectionnée
      const endDate = addDays(new Date(currentEnd + 'T00:00:00'), 1);
      const nights = currentDates.length; // Nombre de dates = nombre de nuits
      
      ranges.push({
        startDate: currentStart,
        endDate: formatDate(endDate), // Date de départ
        nights
      });
      
      currentStart = sortedDates[i];
      currentEnd = sortedDates[i];
      currentDates = [sortedDates[i]];
    }
  }
  
  // Ajouter la dernière plage
  const endDate = addDays(new Date(currentEnd + 'T00:00:00'), 1);
  const nights = currentDates.length; // Nombre de dates = nombre de nuits
  
  ranges.push({
    startDate: currentStart,
    endDate: formatDate(endDate), // Date de départ
    nights
  });
  
  return ranges;
}

/**
 * Calcule le prix pour une plage de dates donnée
 * 
 * @param startDate - Date de début au format YYYY-MM-DD
 * @param endDate - Date de fin au format YYYY-MM-DD
 * @param ratesByDate - Map des tarifs par date (format: Record<dateStr, price>)
 * @returns Prix total pour la plage
 */
export function calculatePriceForRange(
  startDate: string,
  endDate: string,
  ratesByDate: Record<string, number>
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalPrice = 0;
  
  let current = new Date(start);
  while (current <= end) {
    const dateStr = formatDate(current);
    const price = ratesByDate[dateStr];
    if (price !== undefined && price !== null) {
      totalPrice += price;
    }
    current = addDays(current, 1);
  }
  
  return totalPrice;
}

/**
 * Analyse la sélection de cellules et génère les récapitulatifs de réservation
 * 
 * @param selectedCells - Set de cellules sélectionnées (format: "accId|dateStr")
 * @param accommodations - Liste des hébergements avec leurs noms
 * @param ratesByAccommodation - Map des tarifs par hébergement et date
 * @param selectedRateTypeId - ID du type de tarif sélectionné
 * @returns Tableau de récapitulatifs de réservation, un par hébergement
 */
export function generateBookingSummaries(
  selectedCells: Set<string>,
  accommodations: Array<{ idHebergement: number; nomHebergement: string }>,
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>,
  selectedRateTypeId: number | null
): BookingSummary[] {
  if (!selectedRateTypeId) return [];
  
  // Grouper les dates par hébergement
  const datesByAccommodation = new Map<number, string[]>();
  
  for (const cellKey of selectedCells) {
    const [accIdStr, dateStr] = cellKey.split('|');
    const accId = parseInt(accIdStr, 10);
    if (isNaN(accId) || !dateStr) continue;
    
    if (!datesByAccommodation.has(accId)) {
      datesByAccommodation.set(accId, []);
    }
    datesByAccommodation.get(accId)!.push(dateStr);
  }
  
  const summaries: BookingSummary[] = [];
  
  for (const acc of accommodations) {
    const dates = datesByAccommodation.get(acc.idHebergement);
    if (!dates || dates.length === 0) continue;
    
    // Trouver les plages consécutives
    const dateRanges = findConsecutiveDateRanges(dates);
    
    // Calculer les prix pour chaque plage
    const ratesForAcc = ratesByAccommodation[acc.idHebergement] || {};
    const ratesByDate: Record<string, number> = {};
    
    for (const dateStr of dates) {
      const rate = ratesForAcc[dateStr]?.[selectedRateTypeId];
      if (rate !== undefined && rate !== null) {
        ratesByDate[dateStr] = rate;
      }
    }
    
    const pricesByRange = new Map<string, number>();
    let totalPrice = 0;
    
    // Calculer le prix directement à partir des dates sélectionnées
    // (plus simple que d'utiliser calculatePriceForRange avec la nouvelle logique)
    for (const range of dateRanges) {
      // Calculer le prix pour les dates de cette plage
      // On récupère les dates de la plage en parcourant de startDate à endDate - 1 jour
      const start = new Date(range.startDate + 'T00:00:00');
      const end = new Date(range.endDate + 'T00:00:00');
      const endExclusive = addDays(end, -1); // endDate - 1 jour (dernière date de séjour)
      
      let price = 0;
      let current = new Date(start);
      while (current <= endExclusive) {
        const dateStr = formatDate(current);
        const rate = ratesByDate[dateStr];
        if (rate !== undefined && rate !== null) {
          price += rate;
        }
        current = addDays(current, 1);
      }
      
      const rangeKey = `${range.startDate}-${range.endDate}`;
      pricesByRange.set(rangeKey, price);
      totalPrice += price;
    }
    
    summaries.push({
      accId: acc.idHebergement,
      accName: acc.nomHebergement,
      dateRanges,
      totalPrice,
      pricesByRange
    });
  }
  
  return summaries;
}

/**
 * Vérifie si la sélection est valide pour la réservation
 * 
 * La sélection est valide si :
 * - Pour chaque hébergement, les dates sélectionnées sont consécutives (ou une seule date)
 * - ET la durée de la sélection est supérieure ou égale à la durée minimale de séjour de chaque date
 * 
 * @param selectedCells - Set de cellules sélectionnées (format: "accId|dateStr")
 * @param dureeMinByAccommodation - Map des durées minimales par hébergement et date (format: Record<accId, Record<dateStr, dureeMin>>)
 * @param selectedAccommodations - Set des IDs d'hébergements sélectionnés dans le filtre (optionnel, si non fourni, tous les hébergements sont considérés)
 * @returns true si la sélection est valide pour afficher le bouton Réserver
 */
export function isValidBookingSelection(
  selectedCells: Set<string>,
  dureeMinByAccommodation?: Record<number, Record<string, number | null>>,
  selectedAccommodations?: Set<number>
): boolean {
  if (selectedCells.size === 0) return false;
  
  // Filtrer les cellules selon les hébergements sélectionnés dans le filtre
  const filteredCells = selectedAccommodations && selectedAccommodations.size > 0
    ? Array.from(selectedCells).filter(cellKey => {
        const [accIdStr] = cellKey.split('|');
        const accId = parseInt(accIdStr, 10);
        return !isNaN(accId) && selectedAccommodations.has(accId);
      })
    : Array.from(selectedCells);
  
  if (filteredCells.length === 0) return false;
  
  // Grouper les dates par hébergement
  const datesByAccommodation = new Map<number, string[]>();
  
  for (const cellKey of filteredCells) {
    const [accIdStr, dateStr] = cellKey.split('|');
    const accId = parseInt(accIdStr, 10);
    if (isNaN(accId) || !dateStr) continue;
    
    if (!datesByAccommodation.has(accId)) {
      datesByAccommodation.set(accId, []);
    }
    datesByAccommodation.get(accId)!.push(dateStr);
  }
  
  // Vérifier que pour chaque hébergement, les dates sont consécutives ET respectent les durées minimales
  for (const [accId, dates] of datesByAccommodation.entries()) {
    if (dates.length === 0) continue;
    
    // Cas spécial : une seule date = valide pour la consécutivité
    if (dates.length === 1) {
      // Vérifier quand même la durée minimale si elle existe
      if (dureeMinByAccommodation) {
        const dureeMin = dureeMinByAccommodation[accId]?.[dates[0]];
        // Si dureeMin est définie et > 0, la durée de sélection (1 nuit) doit être >= dureeMin
        if (dureeMin !== undefined && dureeMin !== null && dureeMin > 0 && 1 < dureeMin) {
          return false;
        }
      }
      continue;
    }
    
    // Pour plusieurs dates, vérifier qu'elles forment une seule plage consécutive
    const ranges = findConsecutiveDateRanges(dates);
    
    // Si on a plus d'une plage, les dates ne sont pas toutes consécutives
    if (ranges.length > 1) {
      return false;
    }
    
    // Vérifier que la plage unique couvre toutes les dates sélectionnées
    const range = ranges[0];
    // endDate est maintenant la date de départ (lendemain de la dernière date)
    // Donc le nombre de nuits (range.nights) doit correspondre au nombre de dates sélectionnées
    if (range.nights !== dates.length) {
      return false;
    }
    
    // Calculer la durée de la sélection (nombre de nuits)
    // range.nights représente maintenant le nombre de dates sélectionnées = nombre de nuits
    const selectionDuration = range.nights;
    
    // Vérifier que la durée de sélection respecte la durée minimale de chaque date
    if (dureeMinByAccommodation) {
      const dureeMinMap = dureeMinByAccommodation[accId];
      if (dureeMinMap) {
        for (const dateStr of dates) {
          const dureeMin = dureeMinMap[dateStr];
          // Si dureeMin est définie et > 0, la durée de sélection doit être >= dureeMin
          if (dureeMin !== undefined && dureeMin !== null && dureeMin > 0) {
            if (selectionDuration < dureeMin) {
              return false;
            }
          }
        }
      }
    }
  }
  
  return true;
}

/**
 * Vérifie si la sélection pour un hébergement spécifique est valide pour la réservation
 * 
 * @param accId - ID de l'hébergement
 * @param selectedCells - Set de cellules sélectionnées (format: "accId|dateStr")
 * @param dureeMinByAccommodation - Map des durées minimales par hébergement et date (format: Record<accId, Record<dateStr, dureeMin>>)
 * @returns true si la sélection pour cet hébergement est valide
 */
export function isValidBookingSelectionForAccommodation(
  accId: number,
  selectedCells: Set<string>,
  dureeMinByAccommodation?: Record<number, Record<string, number | null>>
): boolean {
  // Extraire les dates pour cet hébergement
  const dates: string[] = [];
  
  for (const cellKey of selectedCells) {
    const [accIdStr, dateStr] = cellKey.split('|');
    const parsedAccId = parseInt(accIdStr, 10);
    if (isNaN(parsedAccId) || !dateStr) continue;
    
    if (parsedAccId === accId) {
      dates.push(dateStr);
    }
  }
  
  if (dates.length === 0) return false;
  
  // Cas spécial : une seule date = valide pour la consécutivité
  if (dates.length === 1) {
    // Vérifier quand même la durée minimale si elle existe
    if (dureeMinByAccommodation) {
      const dureeMin = dureeMinByAccommodation[accId]?.[dates[0]];
      // Si dureeMin est définie et > 0, la durée de sélection (1 nuit) doit être >= dureeMin
      if (dureeMin !== undefined && dureeMin !== null && dureeMin > 0 && 1 < dureeMin) {
        return false;
      }
    }
    return true;
  }
  
  // Pour plusieurs dates, vérifier qu'elles forment une seule plage consécutive
  const ranges = findConsecutiveDateRanges(dates);
  
  // Si on a plus d'une plage, les dates ne sont pas toutes consécutives
  if (ranges.length > 1) {
    return false;
  }
  
  // Vérifier que la plage unique couvre toutes les dates sélectionnées
  const range = ranges[0];
  // endDate est maintenant la date de départ (lendemain de la dernière date)
  // Donc le nombre de nuits (range.nights) doit correspondre au nombre de dates sélectionnées
  if (range.nights !== dates.length) {
    return false;
  }
  
  // Calculer la durée de la sélection (nombre de nuits)
  // range.nights représente maintenant le nombre de dates sélectionnées = nombre de nuits
  const selectionDuration = range.nights;
  
  // Vérifier que la durée de sélection respecte la durée minimale de chaque date
  if (dureeMinByAccommodation) {
    const dureeMinMap = dureeMinByAccommodation[accId];
    if (dureeMinMap) {
      for (const dateStr of dates) {
        const dureeMin = dureeMinMap[dateStr];
        // Si dureeMin est définie et > 0, la durée de sélection doit être >= dureeMin
        if (dureeMin !== undefined && dureeMin !== null && dureeMin > 0) {
          if (selectionDuration < dureeMin) {
            return false;
          }
        }
      }
    }
  }
  
  return true;
}

