/**
 * Utilitaires pour la grille de calendrier
 * 
 * Ce fichier contient les fonctions utilitaires pour la manipulation
 * des dates et éléments DOM dans la grille.
 */

import { formatDate } from '../../../utils/dateUtils';
import type { BookingDisplay, Accommodation } from '../../../types';

/**
 * Obtient la date à partir d'un élément DOM
 * 
 * Cherche un attribut data-date ou remonte dans le DOM pour trouver la colonne.
 * 
 * @param element - Élément DOM à partir duquel extraire la date
 * @returns La date au format YYYY-MM-DD ou null si non trouvée
 */
export function getDateFromElement(element: HTMLElement): string | null {
  let current: HTMLElement | null = element;
  while (current) {
    const dateAttr = current.getAttribute('data-date');
    if (dateAttr) return dateAttr;
    current = current.parentElement;
  }
  return null;
}

/**
 * Obtient l'ID de l'hébergement à partir d'un élément DOM
 * 
 * Cherche un attribut data-acc-id ou remonte dans le DOM pour trouver l'hébergement.
 * 
 * @param element - Élément DOM à partir duquel extraire l'ID
 * @returns L'ID de l'hébergement ou null si non trouvé
 */
export function getAccIdFromElement(element: HTMLElement): number | null {
  let current: HTMLElement | null = element;
  while (current) {
    const accIdAttr = current.getAttribute('data-acc-id');
    if (accIdAttr) {
      const accId = parseInt(accIdAttr, 10);
      if (!isNaN(accId)) return accId;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Calcule la plage de dates entre deux dates
 * 
 * @param startDateStr - Date de début au format YYYY-MM-DD
 * @param endDateStr - Date de fin au format YYYY-MM-DD
 * @returns Tableau des dates dans la plage (incluses)
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dates: string[] = [];
  
  const sortedStart = start <= end ? start : end;
  const sortedEnd = start <= end ? end : start;
  
  const current = new Date(sortedStart);
  while (current <= sortedEnd) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Filtre les réservations pour ne garder que celles qui chevauchent la plage de dates
 * 
 * Une réservation chevauche la plage si dateArrivee <= endDate && dateDepart > startDate
 * 
 * @param bookings - Liste des réservations à filtrer
 * @param startDate - Date de début de la plage (incluse)
 * @param endDate - Date de fin de la plage (incluse)
 * @returns Liste des réservations qui chevauchent la plage
 */
export function filterBookingsByDateRange(
  bookings: BookingDisplay[],
  startDate: Date,
  endDate: Date
): BookingDisplay[] {
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  
  return bookings.filter(booking => {
    // Une réservation chevauche si dateArrivee <= endDate && dateDepart > startDate
    return booking.dateArrivee <= endDateStr && booking.dateDepart > startDateStr;
  });
}

/**
 * Retourne toutes les réservations qui couvrent une date donnée
 * 
 * Une réservation couvre une date si la date est dans [dateArrivee, dateDepart[
 * 
 * @param bookings - Liste des réservations à vérifier
 * @param dateStr - Date au format YYYY-MM-DD
 * @returns Liste des réservations qui couvrent cette date
 */
export function getBookingsForDate(bookings: BookingDisplay[], dateStr: string): BookingDisplay[] {
  return bookings.filter(booking => {
    // La date est couverte si dateArrivee <= dateStr < dateDepart
    return booking.dateArrivee <= dateStr && booking.dateDepart > dateStr;
  });
}

/**
 * Calcule la position et les dimensions d'un rectangle de réservation
 * 
 * Le rectangle commence au milieu de la cellule de date d'arrivée et se termine
 * au milieu de la cellule de date de départ. Il a une hauteur de 80% de la cellule
 * et est verticalement centré.
 * 
 * @param booking - La réservation pour laquelle calculer la position
 * @param allDays - Tableau de toutes les dates affichées dans la grille
 * @param accommodations - Liste des hébergements affichés
 * @param cellWidth - Largeur d'une cellule en pixels (80px)
 * @param cellHeight - Hauteur minimale d'une cellule en pixels (48px)
 * @param gap - Espacement entre les cellules en pixels (2px)
 * @param firstColumnWidth - Largeur de la première colonne (noms d'hébergements) en pixels (200px)
 * @param headerHeight - Hauteur du header en pixels (environ 40px)
 * @param rowHeight - Hauteur réelle d'une ligne d'hébergement en pixels (environ 50px)
 * @param startDate - Date de début de la plage affichée
 * @param endDate - Date de fin de la plage affichée
 * @returns Objet avec les propriétés de positionnement ou null si la réservation est complètement hors plage
 */
export function calculateBookingPosition(
  booking: BookingDisplay,
  allDays: Date[],
  accommodations: Accommodation[],
  cellWidth: number,
  cellHeight: number,
  gap: number,
  firstColumnWidth: number,
  headerHeight: number,
  rowHeight: number,
  startDate: Date,
  endDate: Date
): { left: number; width: number; top: number; height: number; rowIndex: number } | null {
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);
  
  // Vérifier si la réservation chevauche la plage affichée
  if (booking.dateArrivee > endDateStr || booking.dateDepart <= startDateStr) {
    return null; // Réservation complètement hors plage
  }
  
  // Trouver l'index de la ligne (hébergement)
  const rowIndex = accommodations.findIndex(acc => acc.idHebergement === booking.idHebergement);
  if (rowIndex === -1) {
    return null; // Hébergement non trouvé
  }
  
  // Trouver les colonnes de début et de fin
  const colStart = allDays.findIndex(day => formatDate(day) === booking.dateArrivee);
  const colEnd = allDays.findIndex(day => formatDate(day) === booking.dateDepart);
  
  // Si les dates ne sont pas dans allDays, ajuster
  let actualColStart = colStart;
  let actualColEnd = colEnd;
  
  if (colStart === -1) {
    // Date d'arrivée avant la plage affichée
    actualColStart = 0;
  }
  
  if (colEnd === -1) {
    // Date de départ après la plage affichée
    actualColEnd = allDays.length;
  }
  
  // Calculer la position left (milieu de la cellule de départ)
  let left: number;
  if (colStart === -1) {
    // Commence avant la plage, donc à gauche de la première cellule
    left = firstColumnWidth + gap;
  } else {
    // Commence au milieu de la cellule de date d'arrivée
    left = actualColStart * (cellWidth + gap) + firstColumnWidth + gap + (cellWidth / 2);
  }
  
  // Calculer la largeur (jusqu'au milieu de la cellule de fin)
  let width: number;
  if (colEnd === -1) {
    // Se termine après la plage, donc jusqu'à la fin de la dernière cellule
    const lastCellStart = (allDays.length - 1) * (cellWidth + gap) + firstColumnWidth + gap;
    width = lastCellStart + cellWidth - left;
  } else {
    // Se termine au milieu de la cellule de date de départ
    const endCellStart = actualColEnd * (cellWidth + gap) + firstColumnWidth + gap;
    width = endCellStart + (cellWidth / 2) - left;
  }
  
  // Hauteur : 100% de la hauteur d'une cellule (hauteur complète de la ligne)
  const height = rowHeight;
  
  // Position top : alignée avec le début de la ligne
  // Le header est la première ligne de la grille CSS, suivi d'un gap
  // Les lignes d'hébergements commencent après : headerHeight + gap
  // Puis chaque ligne d'hébergement prend : rowHeight + gap (hauteur réelle de la ligne)
  const top = headerHeight + gap + rowIndex * (rowHeight + gap);
  
  return {
    left,
    width,
    top,
    height,
    rowIndex
  };
}

