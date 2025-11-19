/**
 * Composant DateRangeControls - Contrôles de sélection de date de début et de fin
 * 
 * Ce composant affiche les contrôles pour sélectionner la date de début
 * et la date de fin de la période à afficher.
 */

import React from 'react';

/**
 * Props du composant DateRangeControls
 */
export interface DateRangeControlsProps {
  /** Date de début au format YYYY-MM-DD */
  startInput: string;
  /** Callback appelé quand la date de début change */
  onStartInputChange: (value: string) => void;
  /** Date de fin au format YYYY-MM-DD */
  endInput: string;
  /** Callback appelé quand la date de fin change */
  onEndInputChange: (value: string) => void;
}

/**
 * Composant pour les contrôles de date de début et de fin
 */
export function DateRangeControls({
  startInput,
  onStartInputChange,
  endInput,
  onEndInputChange
}: DateRangeControlsProps): React.ReactElement {
  const startDateId = React.useId();
  const endDateId = React.useId();

  // Validation : s'assurer que endDate >= startDate
  const startDate = new Date(startInput);
  const endDate = new Date(endInput);
  const isValidRange = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label htmlFor={startDateId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Date de début</span>
          <input
            id={startDateId}
            type="date"
            value={startInput}
            onChange={e => onStartInputChange(e.currentTarget.value)}
            aria-label="Date de début de la période à afficher"
            style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
          />
        </label>
        <label htmlFor={endDateId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Date de fin</span>
          <input
            id={endDateId}
            type="date"
            value={endInput}
            onChange={e => onEndInputChange(e.currentTarget.value)}
            min={startInput}
            aria-label="Date de fin de la période à afficher"
            style={{ 
              padding: '6px 8px', 
              border: `1px solid ${isValidRange ? '#e5e7eb' : '#dc2626'}`, 
              borderRadius: 6 
            }}
          />
        </label>
        {!isValidRange && (
          <span style={{ color: '#dc2626', fontSize: '14px' }}>
            La date de fin doit être postérieure ou égale à la date de début
          </span>
        )}
      </div>
    </div>
  );
}

