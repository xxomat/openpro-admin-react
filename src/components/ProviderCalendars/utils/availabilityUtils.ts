/**
 * Utilitaires pour le calcul des plages de disponibilité et des jours non réservables
 * 
 * Ce fichier contient les fonctions pour identifier les plages de disponibilité
 * (périodes continues où le stock est à 1) et déterminer quels jours ne sont pas
 * réservables en fonction de la durée minimale de réservation.
 */

import { formatDate, addDays, getDaysInRange } from './dateUtils';

/**
 * Représente une plage de disponibilité
 */
export interface AvailabilityRange {
  /** Date de début de la plage (format YYYY-MM-DD) */
  startDate: string;
  /** Date de fin de la plage (format YYYY-MM-DD, incluse) */
  endDate: string;
  /** Longueur de la plage en nombre de jours */
  length: number;
}

/**
 * Calcule les plages de disponibilité pour un hébergement
 * 
 * Une plage de disponibilité est une période continue où le stock est à 1,
 * encadrée par des jours où le stock est à 0 ou non défini.
 * Par défaut, le jour d'hier (startDate - 1 jour) est considéré comme ayant un stock à 0.
 * 
 * @param stockByDate - Map du stock par date (clé: YYYY-MM-DD, valeur: quantité)
 * @param startDate - Date de début de la période à analyser
 * @param endDate - Date de fin de la période à analyser (incluse)
 * @returns Tableau des plages de disponibilité trouvées
 */
export function getAvailabilityRanges(
  stockByDate: Record<string, number>,
  startDate: Date,
  endDate: Date
): AvailabilityRange[] {
  const ranges: AvailabilityRange[] = [];
  const allDays = getDaysInRange(startDate, endDate);
  
  if (allDays.length === 0) {
    return ranges;
  }
  
  let currentRangeStart: string | null = null;
  
  // Parcourir tous les jours de la période
  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const dateStr = formatDate(day);
    const stock = stockByDate[dateStr] ?? 0;
    
    if (stock === 1) {
      // Le stock est à 1, on est dans une plage de disponibilité
      if (currentRangeStart === null) {
        // Début d'une nouvelle plage
        // Vérifier si le jour précédent (ou hier si c'est le premier jour) a un stock à 0
        const previousDay = i > 0 ? allDays[i - 1] : addDays(startDate, -1);
        const previousDateStr = formatDate(previousDay);
        const previousStock = i > 0 ? (stockByDate[previousDateStr] ?? 0) : 0; // Hier = 0 par défaut
        
        if (previousStock === 0 || previousStock === undefined) {
          // Le jour précédent a un stock à 0, donc on commence une nouvelle plage
          currentRangeStart = dateStr;
        }
        // Si le jour précédent a aussi un stock à 1, on ne commence pas de nouvelle plage
        // car on fait partie d'une plage qui a commencé avant (hors de la période affichée)
      }
      // Si currentRangeStart n'est pas null, on continue la plage en cours
    } else {
      // Le stock n'est pas à 1 (0 ou non défini)
      if (currentRangeStart !== null) {
        // On termine la plage en cours
        const previousDay = allDays[i - 1];
        const previousDateStr = formatDate(previousDay);
        const rangeLength = getDaysInRange(
          new Date(currentRangeStart),
          new Date(previousDateStr)
        ).length;
        
        ranges.push({
          startDate: currentRangeStart,
          endDate: previousDateStr,
          length: rangeLength
        });
        
        currentRangeStart = null;
      }
    }
  }
  
  // Si on termine avec une plage ouverte, la fermer
  if (currentRangeStart !== null) {
    const lastDay = allDays[allDays.length - 1];
    const lastDateStr = formatDate(lastDay);
    const rangeLength = getDaysInRange(
      new Date(currentRangeStart),
      new Date(lastDateStr)
    ).length;
    
    ranges.push({
      startDate: currentRangeStart,
      endDate: lastDateStr,
      length: rangeLength
    });
  }
  
  return ranges;
}

/**
 * Identifie les jours non réservables pour un hébergement
 * 
 * Un jour est non réservable si :
 * - Sa durée minimale de réservation est strictement supérieure à la longueur de la plage de disponibilité à laquelle il appartient
 * - OU le tarif n'est pas défini pour ce jour
 * 
 * @param stockByDate - Map du stock par date (clé: YYYY-MM-DD, valeur: quantité)
 * @param dureeMinByDate - Map de la durée minimale par date et type de tarif (clé: YYYY-MM-DD, valeur: Record<idTypeTarif, dureeMin>)
 * @param ratesByDate - Map des tarifs par date (clé: YYYY-MM-DD, valeur: prix ou undefined)
 * @param selectedRateTypeId - ID du type de tarif sélectionné (null si aucun)
 * @param startDate - Date de début de la période à analyser
 * @param endDate - Date de fin de la période à analyser (incluse)
 * @returns Set des dates non réservables (format YYYY-MM-DD)
 */
export function getNonReservableDays(
  stockByDate: Record<string, number>,
  dureeMinByDate: Record<string, Record<number, number | null>>,
  ratesByDate: Record<string, Record<number, number>> | undefined,
  selectedRateTypeId: number | null,
  startDate: Date,
  endDate: Date
): Set<string> {
  const nonReservableDays = new Set<string>();
  
  // Calculer les plages de disponibilité
  const availabilityRanges = getAvailabilityRanges(stockByDate, startDate, endDate);
  
  // Créer une map pour retrouver rapidement la plage à laquelle appartient une date
  const rangeByDate = new Map<string, AvailabilityRange>();
  for (const range of availabilityRanges) {
    const rangeDays = getDaysInRange(new Date(range.startDate), new Date(range.endDate));
    for (const day of rangeDays) {
      const dateStr = formatDate(day);
      rangeByDate.set(dateStr, range);
    }
  }
  
  // Parcourir tous les jours de la période
  const allDays = getDaysInRange(startDate, endDate);
  for (const day of allDays) {
    const dateStr = formatDate(day);
    const stock = stockByDate[dateStr] ?? 0;
    const dureeMin = selectedRateTypeId !== null
      ? (dureeMinByDate[dateStr]?.[selectedRateTypeId] ?? null)
      : null;
    
    // Si le stock n'est pas à 1, on ne considère pas le jour comme non réservable
    // (il sera affiché en rouge normalement, pas en gris)
    if (stock !== 1) {
      continue;
    }
    
    // Si le stock est à 1, vérifier si le tarif est défini
    // Si le tarif n'est pas défini, le jour est non réservable
    if (selectedRateTypeId !== null && ratesByDate) {
      const price = ratesByDate[dateStr]?.[selectedRateTypeId];
      if (price === undefined || price === null) {
        // Le tarif n'est pas défini pour ce jour
        nonReservableDays.add(dateStr);
        continue;
      }
    }
    
    // Si le stock est à 1, vérifier si la durée minimale est compatible avec la plage
    const range = rangeByDate.get(dateStr);
    if (!range) {
      // Pas de plage trouvée (ne devrait pas arriver si stock = 1)
      // On ne le marque pas comme non réservable, on le laisse tel quel
      continue;
    }
    
    // Si la durée minimale est absente ou nulle, le jour est réservable par défaut
    if (dureeMin === null || dureeMin === undefined || dureeMin <= 0) {
      continue;
    }
    
    // Comparer la durée minimale avec la longueur de la plage
    if (dureeMin > range.length) {
      // La durée minimale est strictement supérieure à la longueur de la plage
      nonReservableDays.add(dateStr);
    }
  }
  
  return nonReservableDays;
}

