/**
 * Composant GridHeaderCell - Cellule d'en-tête de colonne
 * 
 * Ce composant affiche une cellule d'en-tête pour une date dans la grille,
 * avec support du clic et du drag pour sélectionner/désélectionner la colonne.
 */

import React from 'react';
import { formatDate } from '../../../utils/dateUtils';

export interface GridHeaderCellProps {
  day: Date;
  dateStr: string;
  isSelected: boolean;
  isDragging: boolean;
  draggingState: { isDragging: boolean } | null;
  justFinishedDragRef: React.MutableRefObject<boolean>;
  onHeaderClick: (dateStr: string) => void;
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

  return (
    <div
      data-date={dateStr}
      onClick={(e) => {
        if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
          e.preventDefault();
          return;
        }
        onHeaderClick(dateStr);
      }}
      onMouseDown={(e) => onMouseDown(e, dateStr)}
      style={{
        padding: '8px 4px',
        background: isDragging
          ? 'rgba(59, 130, 246, 0.2)'
          : (isSelected 
            ? 'rgba(59, 130, 246, 0.15)' 
            : (isWeekend ? '#f9fafb' : '#f3f4f6')),
        borderBottom: '2px solid #e5e7eb',
        borderLeft: isDragging 
          ? '2px solid #3b82f6' 
          : (isSelected ? '3px solid #3b82f6' : 'none'),
        borderRight: isDragging 
          ? '2px solid #3b82f6' 
          : (isSelected ? '3px solid #3b82f6' : 'none'),
        borderTop: isDragging 
          ? '2px solid #3b82f6' 
          : (isSelected ? '3px solid #3b82f6' : 'none'),
        textAlign: 'center',
        fontSize: 11,
        color: '#6b7280',
        fontWeight: isWeekend ? 700 : 500,
        cursor: draggingState?.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        opacity: isWeekend ? 1 : 0.8
      }}
    >
      <div style={{ fontWeight: isWeekend ? 700 : 500 }}>{weekDayHeaders[dayOfWeek]}</div>
      <div style={{ fontSize: 10, marginTop: 2, fontWeight: isWeekend ? 700 : 500 }}>
        {day.getDate()}/{day.getMonth() + 1}
      </div>
    </div>
  );
}

