/**
 * Composant DateRangeControls - Contrôles de sélection de date de début et de fin
 * 
 * Ce composant affiche les contrôles pour sélectionner la date de début
 * et la date de fin de la période à afficher.
 * Supporte le scroll avec la molette pour modifier les dates.
 */

import React from 'react';
import { addDays, formatDate } from '../utils/dateUtils';

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

  // Gestionnaire pour le scroll sur le champ Date de début
  const handleStartDateWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    const currentDate = new Date(startInput);
    if (isNaN(currentDate.getTime())) return;

    const delta = e.deltaY > 0 ? -1 : 1; // Scroll down = diminuer (-1), Scroll up = augmenter (+1)
    const newDate = addDays(currentDate, delta);
    const newDateStr = formatDate(newDate);
    
    // Vérifier que la nouvelle date de début ne dépasse pas la date de fin
    const endDateObj = new Date(endInput);
    if (!isNaN(endDateObj.getTime()) && newDate > endDateObj) {
      // Si la nouvelle date dépasse endDate, ajuster endDate aussi
      onStartInputChange(newDateStr);
      onEndInputChange(newDateStr);
    } else {
      onStartInputChange(newDateStr);
    }
  }, [startInput, endInput, onStartInputChange, onEndInputChange]);

  // Gestionnaire pour le scroll sur le champ Date de fin
  const handleEndDateWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    const currentDate = new Date(endInput);
    if (isNaN(currentDate.getTime())) return;

    const delta = e.deltaY > 0 ? -1 : 1; // Scroll down = diminuer (-1), Scroll up = augmenter (+1)
    const newDate = addDays(currentDate, delta);
    const newDateStr = formatDate(newDate);
    
    // Vérifier que la nouvelle date de fin n'est pas antérieure à la date de début
    const startDateObj = new Date(startInput);
    if (!isNaN(startDateObj.getTime()) && newDate < startDateObj) {
      // Si la nouvelle date est avant startDate, ajuster startDate aussi
      onEndInputChange(newDateStr);
      onStartInputChange(newDateStr);
    } else {
      onEndInputChange(newDateStr);
    }
  }, [startInput, endInput, onStartInputChange, onEndInputChange]);

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
            onWheel={handleStartDateWheel}
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
            onWheel={handleEndDateWheel}
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

