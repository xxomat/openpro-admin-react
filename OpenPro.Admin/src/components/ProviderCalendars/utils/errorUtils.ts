/**
 * Utilitaires pour la gestion des erreurs
 * 
 * Ce fichier contient les fonctions utilitaires pour gérer et typer
 * les erreurs de manière stricte, en évitant l'utilisation de `any`.
 */

/**
 * Interface pour OpenProHttpError (basée sur la classe du client)
 * 
 * Cette interface correspond à la classe OpenProHttpError du client OpenPro.
 * Elle permet de typer les erreurs HTTP sans dépendre directement de la classe.
 */
export interface OpenProHttpErrorLike extends Error {
  name: 'OpenProHttpError';
  status: number;
  body?: unknown;
}

/**
 * Interface pour OpenProApiError (basée sur la classe du client)
 * 
 * Cette interface correspond à la classe OpenProApiError du client OpenPro.
 * Elle permet de typer les erreurs API sans dépendre directement de la classe.
 */
export interface OpenProApiErrorLike extends Error {
  name: 'OpenProApiError';
}

/**
 * Vérifie si une valeur est une instance d'Error
 * 
 * @param error - Valeur à vérifier
 * @returns true si la valeur est une instance d'Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Vérifie si une erreur est une DOMException (utilisée pour AbortError)
 * 
 * DOMException est la classe standard utilisée par les navigateurs pour
 * les erreurs liées aux API Web, notamment AbortError lors de l'annulation
 * d'une requête avec AbortController.
 * 
 * @param error - Erreur à vérifier
 * @returns true si l'erreur est une DOMException
 */
export function isDOMException(error: unknown): error is DOMException {
  return error instanceof DOMException;
}

/**
 * Vérifie si une erreur est une OpenProHttpError
 * 
 * @param error - Erreur à vérifier
 * @returns true si l'erreur est une OpenProHttpError
 */
export function isOpenProHttpError(error: unknown): error is OpenProHttpErrorLike {
  return isError(error) && error.name === 'OpenProHttpError' && 'status' in error && typeof (error as { status?: unknown }).status === 'number';
}

/**
 * Vérifie si une erreur est une OpenProApiError
 * 
 * @param error - Erreur à vérifier
 * @returns true si l'erreur est une OpenProApiError
 */
export function isOpenProApiError(error: unknown): error is OpenProApiErrorLike {
  return isError(error) && error.name === 'OpenProApiError';
}

/**
 * Extrait le message d'erreur d'une valeur inconnue
 * 
 * Si la valeur est une Error, retourne son message.
 * Sinon, retourne un message par défaut ou la représentation string de la valeur.
 * 
 * @param error - Valeur d'erreur inconnue
 * @param defaultMessage - Message par défaut si aucun message n'est disponible
 * @returns Le message d'erreur extrait
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'Une erreur est survenue'): string {
  if (isError(error)) {
    return error.message || defaultMessage;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return defaultMessage;
}

/**
 * Vérifie si une erreur est une erreur d'annulation
 * 
 * Détecte plusieurs types d'erreurs d'annulation :
 * - DOMException avec name === 'AbortError' (standard Web pour AbortController)
 * - Error avec message === 'Cancelled' (erreurs manuelles générées dans le code)
 * 
 * @param error - Erreur à vérifier
 * @returns true si l'erreur est une erreur d'annulation
 */
export function isCancellationError(error: unknown): boolean {
  // Vérification typée pour DOMException (standard Web)
  if (isDOMException(error)) {
    return error.name === 'AbortError';
  }
  
  // Vérification pour les erreurs manuelles (compatibilité avec le code existant)
  if (isError(error)) {
    return error.name === 'AbortError' || error.message === 'Cancelled';
  }
  
  // Fallback pour les objets non-Error qui pourraient avoir un name ou message
  if (error && typeof error === 'object') {
    if ('name' in error && (error as { name?: unknown }).name === 'AbortError') {
      return true;
    }
    if ('message' in error && (error as { message?: unknown }).message === 'Cancelled') {
      return true;
    }
  }
  
  return false;
}

/**
 * Extrait le code de statut HTTP d'une erreur si disponible
 * 
 * @param error - Erreur à vérifier
 * @returns Le code de statut HTTP ou undefined
 */
export function getHttpStatus(error: unknown): number | undefined {
  if (isOpenProHttpError(error)) {
    return error.status;
  }
  return undefined;
}

