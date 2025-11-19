/**
 * Utilitaires de manipulation de dates
 * 
 * Ce fichier contient toutes les fonctions utilitaires pour manipuler les dates,
 * incluant le formatage, l'addition de jours/mois, et le calcul des jours
 * dans une plage de dates donnée.
 */

/**
 * Formate une date au format YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Ajoute un nombre de mois à une date
 */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/**
 * Ajoute un nombre de jours à une date
 */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Calcule toutes les dates dans une plage de dates
 * 
 * @param startDate - Date de début de la période (incluse)
 * @param endDate - Date de fin de la période (incluse)
 * @returns Tableau de dates dans l'ordre chronologique
 */
export function getDaysInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normaliser les dates à minuit pour la comparaison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  let currentDate = new Date(start);
  
  while (currentDate.getTime() <= end.getTime()) {
    days.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
    currentDate.setHours(0, 0, 0, 0); // Normaliser après addDays
  }
  
  return days;
}

