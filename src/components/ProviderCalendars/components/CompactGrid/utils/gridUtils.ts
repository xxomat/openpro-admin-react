/**
 * Utilitaires pour la grille de calendrier
 * 
 * Ce fichier contient les fonctions utilitaires pour la manipulation
 * des dates et éléments DOM dans la grille.
 */

import { formatDate } from '../../../utils/dateUtils';
import type { BookingDisplay } from '../../../types';

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

