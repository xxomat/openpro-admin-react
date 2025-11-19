/**
 * Configuration et constantes pour ProviderCalendars
 * 
 * Ce fichier contient la configuration de l'application, incluant les URLs
 * de l'API, les clés API, et les fournisseurs par défaut. Les valeurs peuvent
 * être surchargées via les variables d'environnement.
 */

import type { Supplier } from './types';

export const baseUrl = import.meta.env.PUBLIC_OPENPRO_BASE_URL || 'http://localhost:3000';
export const apiKey = import.meta.env.PUBLIC_OPENPRO_API_KEY || 'dev-key';

// Configure default suppliers for DEV if not provided via env
const suppliersFromEnv = (() => {
  try {
    const raw = import.meta.env.PUBLIC_OPENPRO_SUPPLIERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Supplier[];
    }
  } catch {
    // ignore
  }
  return null;
})();

export const defaultSuppliers: Supplier[] =
  suppliersFromEnv ??
  [
    { idFournisseur: 47186, nom: 'La Becterie' },
    { idFournisseur: 55123, nom: 'Gîte en Cotentin' }
  ];

