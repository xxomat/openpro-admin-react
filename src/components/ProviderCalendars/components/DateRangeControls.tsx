/**
 * Composant DateRangeControls - Contrôles de sélection de date de début et de fin
 * 
 * Ce composant affiche les contrôles pour sélectionner la date de début
 * et la date de fin de la période à afficher.
 * Supporte le scroll avec la molette pour modifier les dates.
 */

import React from 'react';
import { addDays, formatDate } from '../utils/dateUtils';
import { darkTheme } from '../utils/theme';

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
  /** Callback appelé quand l'utilisateur clique sur "Sélectionner sur la plage" */
  /** Reçoit un Set<number> contenant les jours de la semaine sélectionnés (0 = Lundi, 6 = Dimanche) */
  onSelectAllRange?: (selectedDays: Set<number>) => void;
  /** Callback appelé quand l'utilisateur clique sur le bouton "Aujourd'hui" */
  onResetToToday?: () => void;
  /** Callback appelé pour obtenir les jours sélectionnés (utilisé par le raccourci clavier) */
  onGetSelectedDays?: (getter: () => Set<number>) => void;
}

/**
 * Composant pour les contrôles de date de début et de fin
 */
export function DateRangeControls({
  startInput,
  onStartInputChange,
  endInput,
  onEndInputChange,
  onSelectAllRange,
  onResetToToday,
  onGetSelectedDays
}: DateRangeControlsProps): React.ReactElement {
  const startDateId = React.useId();
  const endDateId = React.useId();
  const [selectAllHover, setSelectAllHover] = React.useState(false);
  const [todayButtonHover, setTodayButtonHover] = React.useState(false);
  
  // Jours de la semaine : L, M, M, J, V, S, D (0 = Lundi, 6 = Dimanche)
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  // Par défaut, tous les jours sont sélectionnés
  const [selectedDays, setSelectedDays] = React.useState<Set<number>>(() => {
    return new Set([0, 1, 2, 3, 4, 5, 6]);
  });
  
  // Détecter si on est sur Mac pour afficher Cmd+S au lieu de Ctrl+S
  const isMac = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
  }, []);

  // Exposer la fonction pour obtenir les jours sélectionnés au parent
  React.useEffect(() => {
    if (onGetSelectedDays) {
      onGetSelectedDays(() => selectedDays);
    }
  }, [onGetSelectedDays, selectedDays]);

  // Gestionnaire pour cocher/décocher un jour
  const handleDayToggle = React.useCallback((dayIndex: number) => {
    setSelectedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  }, []);

  // Gestionnaire pour le bouton "Sélectionner sur la plage"
  const handleSelectAllRangeClick = React.useCallback(() => {
    if (onSelectAllRange) {
      onSelectAllRange(selectedDays);
    }
  }, [onSelectAllRange, selectedDays]);

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
    <>
      <style>{`
        .date-input-dark::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        .date-input-dark::-moz-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label htmlFor={startDateId} style={{ display: 'flex', alignItems: 'center', gap: 8, color: darkTheme.textPrimary }}>
            <span>Date de début</span>
            <input
              id={startDateId}
              type="date"
              value={startInput}
              onChange={e => onStartInputChange(e.currentTarget.value)}
              onWheel={handleStartDateWheel}
              aria-label="Date de début de la période à afficher"
              style={{ 
                padding: '6px 8px', 
                border: `1px solid ${darkTheme.inputBorder}`, 
                borderRadius: 6,
                background: darkTheme.inputBg,
                color: darkTheme.inputText
              }}
              className="date-input-dark"
            />
          </label>
          {onResetToToday && (
            <button
              onClick={onResetToToday}
              style={{
                padding: '6px 10px',
                background: darkTheme.buttonSecondaryBg,
                color: darkTheme.buttonText,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 60,
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
                setTodayButtonHover(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
                setTodayButtonHover(false);
              }}
              title="Remettre la date de début à aujourd'hui (t)"
            >
              {todayButtonHover ? '⌨️ t' : '📅'}
            </button>
          )}
          <label htmlFor={endDateId} style={{ display: 'flex', alignItems: 'center', gap: 8, color: darkTheme.textPrimary }}>
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
                border: `1px solid ${isValidRange ? darkTheme.inputBorder : darkTheme.error}`, 
                borderRadius: 6,
                background: darkTheme.inputBg,
                color: darkTheme.inputText
              }}
              className="date-input-dark"
            />
          </label>
        {!isValidRange && (
          <span style={{ color: darkTheme.error, fontSize: '14px' }}>
            La date de fin doit être postérieure ou égale à la date de début
          </span>
        )}
        </div>
        {onSelectAllRange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Checkboxes pour les jours de la semaine */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {weekDays.map((dayLabel, index) => (
                <label
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: darkTheme.textPrimary,
                    fontSize: 12,
                    fontWeight: 500,
                    border: `1px solid ${selectedDays.has(index) ? darkTheme.buttonPrimaryBg : darkTheme.inputBorder}`,
                    borderRadius: 4,
                    background: selectedDays.has(index) ? darkTheme.buttonPrimaryBg : darkTheme.inputBg,
                    transition: 'all 0.2s'
                  }}
                  title={['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][index]}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.has(index)}
                    onChange={() => handleDayToggle(index)}
                    style={{
                      display: 'none'
                    }}
                  />
                  {dayLabel}
                </label>
              ))}
            </div>
            <button
              onClick={handleSelectAllRangeClick}
              style={{
                padding: '8px 16px',
                background: darkTheme.buttonSecondaryBg,
                color: darkTheme.buttonText,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 200 // Largeur minimale pour éviter le clignotement
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
                setSelectAllHover(true);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
                setSelectAllHover(false);
              }}
              title={`Sélectionner les dates correspondant aux jours sélectionnés entre la date de début et la date de fin (${isMac ? 'Cmd+S' : 'Ctrl+S'})`}
            >
              {selectAllHover ? `⌨️ ${isMac ? 'Cmd+S' : 'Ctrl+S'}` : 'Sélectionner sur la plage'}
            </button>
          </div>
        )}
      </div>
    </> 
  );
}

