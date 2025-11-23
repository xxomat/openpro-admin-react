/**
 * Composant GridHeaderCell - Cellule d'en-tête de colonne
 * 
 * Ce composant affiche une cellule d'en-tête pour une date dans la grille,
 * avec support du clic et du drag pour sélectionner/désélectionner la colonne.
 */

import React from 'react';
import { formatDate, isPastDate } from '../../../utils/dateUtils';
import { darkTheme } from '../../../utils/theme';

/**
 * Props du composant GridHeaderCell
 */
export interface GridHeaderCellProps {
  /** Date de la colonne */
  day: Date;
  /** Date au format YYYY-MM-DD */
  dateStr: string;
  /** Indique si la colonne est sélectionnée */
  isSelected: boolean;
  /** Indique si la colonne est en cours de drag */
  isDragging: boolean;
  /** État du drag (pour empêcher les clics après un drag) */
  draggingState: { isDragging: boolean } | null;
  /** Référence pour détecter si un drag vient de se terminer */
  justFinishedDragRef: React.MutableRefObject<boolean>;
  /** Callback appelé quand l'utilisateur clique sur l'en-tête */
  onHeaderClick: (dateStr: string) => void;
  /** Callback appelé quand l'utilisateur appuie sur la souris */
  onMouseDown: (e: React.MouseEvent, dateStr: string) => void;
}

/**
 * Composant pour une cellule d'en-tête de colonne
 */
export function GridHeaderCell({
  day,
  dateStr,
  isSelected,
  isDragging,
  draggingState,
  justFinishedDragRef,
  onHeaderClick,
  onMouseDown
}: GridHeaderCellProps): React.ReactElement {
  const weekDayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const dayOfWeek = (day.getDay() + 6) % 7; // 0 = Monday
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  const isPast = isPastDate(dateStr);

  return (
    <div
      data-date={dateStr}
      onClick={(e) => {
        // Ne pas permettre la sélection si la date est passée
        if (isPast) {
          e.preventDefault();
          return;
        }
        if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
          e.preventDefault();
          return;
        }
        onHeaderClick(dateStr);
      }}
      onMouseDown={(e) => {
        // Ne pas permettre le drag si la date est passée
        if (isPast) {
          e.preventDefault();
          return;
        }
        onMouseDown(e, dateStr);
      }}
      style={{
        padding: '8px 4px',
        background: isDragging
          ? darkTheme.selectionDraggingBg
          : (isSelected 
            ? darkTheme.selectionBg
            : darkTheme.gridHeaderBg), // Toujours utiliser gridHeaderBg pour les dates passées
        borderBottom: `2px solid ${darkTheme.borderColor}`,
        borderLeft: isDragging 
          ? `2px solid ${darkTheme.selectionBorder}` 
          : (isSelected ? `3px solid ${darkTheme.selectionBorder}` : 'none'),
        borderRight: isDragging 
          ? `2px solid ${darkTheme.selectionBorder}` 
          : (isSelected ? `3px solid ${darkTheme.selectionBorder}` : 'none'),
        borderTop: isDragging 
          ? `2px solid ${darkTheme.selectionBorder}` 
          : (isSelected ? `3px solid ${darkTheme.selectionBorder}` : 'none'),
        textAlign: 'center',
        fontSize: 11,
        color: darkTheme.textSecondary,
        fontWeight: isWeekend ? 700 : 500,
        cursor: isPast ? 'not-allowed' : (draggingState?.isDragging ? 'grabbing' : 'grab'),
        userSelect: 'none',
        opacity: isPast ? 0.6 : (isWeekend ? 1 : 0.8)
      }}
    >
      <div style={{ fontWeight: isWeekend ? 700 : 500 }}>{weekDayHeaders[dayOfWeek]}</div>
      <div style={{ fontSize: 10, marginTop: 2, fontWeight: isWeekend ? 700 : 500 }}>
        {day.getDate()}/{day.getMonth() + 1}
      </div>
    </div>
  );
}

