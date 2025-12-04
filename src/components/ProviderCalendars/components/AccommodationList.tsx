/**
 * Composant AccommodationList - Liste des hébergements
 * 
 * Ce composant affiche la liste des hébergements avec des checkboxes
 * pour sélectionner ceux à afficher dans la grille.
 */

import React from 'react';
import type { Accommodation } from '@/types';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant AccommodationList
 */
export interface AccommodationListProps {
  /** Liste des hébergements disponibles */
  accommodations: Accommodation[];
  /** Set des IDs des hébergements actuellement sélectionnés (GUID) */
  selectedAccommodations: Set<string>;
  /** Callback pour mettre à jour la sélection d'hébergements */
  onSelectedAccommodationsChange: (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
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
    return [...accommodations].sort((a, b) => {
      const nameA = a.accommodationName || '';
      const nameB = b.accommodationName || '';
      return nameA.localeCompare(nameB);
    });
  }, [accommodations]);

  return (
    <div 
      role="group" 
      aria-label="Liste des hébergements disponibles"
      style={{ 
        marginBottom: 12, 
        padding: 12, 
        background: darkTheme.bgSecondary, 
        borderRadius: 8, 
        border: `1px solid ${darkTheme.borderColor}` 
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedAccommodations.map(acc => {
          const checkboxId = `accommodation-${acc.accommodationId}`;
          return (
            <label
              key={acc.accommodationId}
              htmlFor={checkboxId}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={selectedAccommodations.has(acc.accommodationId)}
                onChange={e => {
                  onSelectedAccommodationsChange((prev: Set<string>) => {
                    const newSet = new Set(prev);
                    if (e.target.checked) {
                      newSet.add(acc.accommodationId);
                    } else {
                      newSet.delete(acc.accommodationId);
                    }
                    return newSet;
                  });
                }}
                aria-label={`Sélectionner l'hébergement ${acc.accommodationName}`}
              />
              <span>{acc.accommodationName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

