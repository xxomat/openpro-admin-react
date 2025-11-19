/**
 * Composant DateRangeControls - Contrôles de sélection de date et durée
 * 
 * Ce composant affiche les contrôles pour sélectionner la date de début
 * et le nombre de mois à afficher.
 */

import React from 'react';

export interface DateRangeControlsProps {
  startInput: string;
  onStartInputChange: (value: string) => void;
  monthsCount: number;
  onMonthsCountChange: (value: number) => void;
}

/**
 * Composant pour les contrôles de date et durée
 */
export function DateRangeControls({
  startInput,
  onStartInputChange,
  monthsCount,
  onMonthsCountChange
}: DateRangeControlsProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Date de début</span>
          <input
            type="date"
            value={startInput}
            onChange={e => onStartInputChange(e.currentTarget.value)}
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Durée</span>
          <select
            value={monthsCount}
            onChange={e => onMonthsCountChange(Number(e.currentTarget.value))}
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
          >
            <option value={1}>1 mois</option>
            <option value={2}>2 mois</option>
            <option value={3}>3 mois</option>
          </select>
        </label>
      </div>
    </div>
  );
}

