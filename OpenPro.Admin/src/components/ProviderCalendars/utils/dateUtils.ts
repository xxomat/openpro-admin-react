/**
 * Utilitaires de manipulation de dates
 * 
 * Ce fichier contient toutes les fonctions utilitaires pour manipuler les dates,
 * incluant le formatage, l'addition de jours/mois, et le calcul des semaines
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
 * Calcule les semaines dans une plage de dates
 * La première semaine commence exactement à startDate, les semaines suivantes
 * commencent le lundi.
 */
export function getWeeksInRange(startDate: Date, monthsCount: number): Date[][] {
  const weeks: Date[][] = [];
  const endDate = addMonths(startDate, monthsCount);
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const weekDays: Date[] = [];
    // First week starts exactly at startDate
    if (weeks.length === 0) {
      // First week: start from startDate and add 6 more days (7 days total)
      for (let i = 0; i < 7 && currentDate < endDate; i++) {
        weekDays.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    } else {
      // Subsequent weeks: start on Monday
      // Find the Monday of the week containing currentDate
      const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
      if (dayOfWeek !== 0) {
        // Move to next Monday
        currentDate = addDays(currentDate, 7 - dayOfWeek);
      }
      // Add 7 days for a complete week
      for (let i = 0; i < 7 && currentDate < endDate; i++) {
        weekDays.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    }
    if (weekDays.length > 0) {
      weeks.push(weekDays);
    }
  }
  return weeks;
}

