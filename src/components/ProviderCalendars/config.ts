/**
 * Configuration et constantes pour ProviderCalendars
 * 
 * Ce fichier contient la configuration de l'application, incluant l'URL
 * du backend et les fournisseurs par défaut. Les valeurs peuvent
 * être surchargées via les variables d'environnement.
 */

import type { Supplier } from './types';

export const backendUrl = import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';

// Détecter si on est en mode stub
const isStubMode = import.meta.env.PUBLIC_USE_STUB_MODE === 'true';

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

// Fournisseurs pour le mode stub (anciens IDs de test)
const stubSuppliers: Supplier[] = [
  { supplierId: 47186, name: 'La Becterie' },
  { supplierId: 55123, name: 'Gîte en Cotentin' }
];

// Fournisseurs pour le mode production (nouveaux IDs)
const productionSuppliers: Supplier[] = [
  { supplierId: 134737, name: 'La Becterie' }
];

export const defaultSuppliers: Supplier[] =
  suppliersFromEnv ??
  (isStubMode ? stubSuppliers : productionSuppliers);

