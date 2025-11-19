/**
 * Composant AccommodationList - Liste des hébergements
 * 
 * Ce composant affiche la liste des hébergements avec des checkboxes
 * pour sélectionner ceux à afficher dans la grille.
 */

import React from 'react';
import type { Accommodation } from '../types';

export interface AccommodationListProps {
  accommodations: Accommodation[];
  selectedAccommodations: Set<number>;
  onSelectedAccommodationsChange: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
}

/**
 * Composant pour la liste des hébergements
 */
export function AccommodationList({
  accommodations,
  selectedAccommodations,
  onSelectedAccommodationsChange
}: AccommodationListProps): React.ReactElement {
  const sortedAccommodations = React.useMemo(() => {
    return [...accommodations].sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement));
  }, [accommodations]);

  return (
    <div 
      role="group" 
      aria-label="Liste des hébergements disponibles"
      style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedAccommodations.map(acc => {
          const checkboxId = `accommodation-${acc.idHebergement}`;
          return (
            <label
              key={acc.idHebergement}
              htmlFor={checkboxId}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={selectedAccommodations.has(acc.idHebergement)}
                onChange={e => {
                  onSelectedAccommodationsChange((prev: Set<number>) => {
                    const newSet = new Set(prev);
                    if (e.target.checked) {
                      newSet.add(acc.idHebergement);
                    } else {
                      newSet.delete(acc.idHebergement);
                    }
                    return newSet;
                  });
                }}
                aria-label={`Sélectionner l'hébergement ${acc.nomHebergement}`}
              />
              <span>{acc.nomHebergement}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

