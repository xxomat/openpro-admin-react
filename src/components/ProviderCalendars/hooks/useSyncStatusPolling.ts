/**
 * Hook pour poller l'état de synchronisation des réservations Direct
 * 
 * Ce hook poll régulièrement l'endpoint de statut pour détecter les changements
 * d'état de synchronisation ou d'obsolescence, et déclenche un refresh des données
 * lorsque des changements sont détectés.
 */

import React from 'react';

const BACKEND_BASE_URL = import.meta.env.PUBLIC_BACKEND_BASE_URL || 'http://localhost:8787';

/**
 * Interface pour la réponse de l'endpoint de statut
 */
interface SyncStatus {
  lastSyncCheck: string | null;
  pendingSyncCount: number;
  syncedCount: number;
  obsoleteCount: number;
  lastChange: string | null;
}

/**
 * Hook pour poller l'état de synchronisation
 * 
 * @param idFournisseur - Identifiant du fournisseur
 * @param onStatusChange - Callback appelé lorsque l'état change (pour déclencher un refresh)
 * @param pollingInterval - Intervalle de polling en millisecondes (défaut: 30000 = 30 secondes)
 */
export function useSyncStatusPolling(
  idFournisseur: number | null,
  onStatusChange: () => void,
  pollingInterval: number = 30000
): void {
  // Utiliser useRef pour stocker lastKnownChange sans déclencher de re-render
  const lastKnownChangeRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!idFournisseur) {
      return;
    }

    let intervalId: number | undefined;

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/api/suppliers/${idFournisseur}/local-bookings-sync-status`
        );

        if (!response.ok) {
          console.warn('Failed to fetch sync status:', response.status);
          return;
        }

        const status: SyncStatus = await response.json();

        // Vérifier si lastChange a changé
        const currentLastChange = lastKnownChangeRef.current;
        if (status.lastChange && status.lastChange !== currentLastChange) {
          if (currentLastChange !== null) {
            // Ce n'est pas le premier appel, il y a eu un changement
            onStatusChange();
          }
          lastKnownChangeRef.current = status.lastChange;
        } else if (currentLastChange === null && status.lastChange) {
          // Premier appel, initialiser lastKnownChangeRef
          lastKnownChangeRef.current = status.lastChange;
        }
      } catch (error) {
        console.error('Error polling sync status:', error);
      }
    };

    // Poller immédiatement au montage
    pollStatus();

    // Puis poller régulièrement
    intervalId = window.setInterval(pollStatus, pollingInterval);

    // Nettoyer l'interval au démontage
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [idFournisseur, onStatusChange, pollingInterval]);
}

