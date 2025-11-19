/**
 * Composant GridDataCell - Cellule de données dans la grille
 * 
 * Ce composant affiche une cellule de données pour un hébergement et une date,
 * avec support de l'édition inline des prix et durées minimales.
 */

import React from 'react';
import type { EditingCell } from '../hooks/useGridEditing';

/**
 * Props du composant GridDataCell
 */
export interface GridDataCellProps {
  /** Identifiant de l'hébergement */
  accId: number;
  /** Date au format YYYY-MM-DD */
  dateStr: string;
  /** Stock disponible pour cette date */
  stock: number;
  /** Prix pour cette date et ce type de tarif */
  price: number | undefined;
  /** Durée minimale de séjour pour cette date */
  dureeMin: number | null;
  /** Indique si la cellule est sélectionnée */
  isSelected: boolean;
  /** Indique si la cellule est en cours de drag */
  isDragging: boolean;
  /** Indique si le prix a été modifié */
  isModified: boolean;
  /** Indique si la durée minimale a été modifiée */
  isModifiedDureeMin: boolean;
  /** Indique si le prix est en cours d'édition */
  isEditing: boolean;
  /** Indique si la durée minimale est en cours d'édition */
  isEditingDureeMin: boolean;
  /** Valeur en cours d'édition pour le prix */
  editingValue: string;
  /** Valeur en cours d'édition pour la durée minimale */
  editingDureeMinValue: string;
  /** Indique si la date est un week-end */
  isWeekend: boolean;
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
  /** État du drag (pour empêcher les clics pendant le drag) */
  draggingState: { isDragging: boolean } | null;
  /** Référence pour détecter si un drag vient de se terminer */
  justFinishedDragRef: React.MutableRefObject<boolean>;
  /** Callback appelé quand l'utilisateur clique sur la cellule pour éditer le prix */
  onCellClick: (accId: number, dateStr: string) => void;
  /** Callback appelé quand l'utilisateur clique sur la durée minimale pour l'éditer */
  onDureeMinClick: (accId: number, dateStr: string) => void;
  /** Setter pour la valeur en cours d'édition du prix */
  setEditingValue: React.Dispatch<React.SetStateAction<string>>;
  /** Setter pour la valeur en cours d'édition de la durée minimale */
  setEditingDureeMinValue: React.Dispatch<React.SetStateAction<string>>;
  /** Callback appelé pour valider l'édition du prix */
  onEditSubmit: () => void;
  /** Callback appelé pour valider l'édition de la durée minimale */
  onEditDureeMinSubmit: () => void;
  /** Callback appelé pour annuler l'édition du prix */
  onEditCancel: () => void;
  /** Callback appelé pour annuler l'édition de la durée minimale */
  onEditDureeMinCancel: () => void;
}

/**
 * Composant pour une cellule de données
 */
export function GridDataCell({
  accId,
  dateStr,
  stock,
  price,
  dureeMin,
  isSelected,
  isDragging,
  isModified,
  isModifiedDureeMin,
  isEditing,
  isEditingDureeMin,
  editingValue,
  editingDureeMinValue,
  isWeekend,
  selectedRateTypeId,
  draggingState,
  justFinishedDragRef,
  onCellClick,
  onDureeMinClick,
  setEditingValue,
  setEditingDureeMinValue,
  onEditSubmit,
  onEditDureeMinSubmit,
  onEditCancel,
  onEditDureeMinCancel
}: GridDataCellProps): React.ReactElement {
  const isAvailable = stock > 0;
  
  let bgColor: string;
  if (isDragging) {
    bgColor = 'rgba(59, 130, 246, 0.2)';
  } else if (isSelected) {
    bgColor = isAvailable 
      ? 'rgba(59, 130, 246, 0.15)'
      : 'rgba(59, 130, 246, 0.1)';
  } else {
    if (isWeekend) {
      bgColor = isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)';
    } else {
      bgColor = isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)';
    }
  }
  
  const borderColor = (isSelected || isDragging)
    ? '#3b82f6' 
    : (isAvailable ? 'rgba(34, 197, 94, 0.4)' : 'rgba(220, 38, 38, 0.4)');
  const borderWidth = isDragging ? '2px' : (isSelected ? '3px' : '1px');

  return (
    <div
      key={`${accId}-${dateStr}`}
      data-date={dateStr}
      onClick={(e) => {
        if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
          e.preventDefault();
          return;
        }
        onCellClick(accId, dateStr);
      }}
      style={{
        padding: '8px 4px',
        background: bgColor,
        borderTop: `${borderWidth} solid ${borderColor}`,
        borderLeft: `${borderWidth} solid ${borderColor}`,
        borderRight: `${borderWidth} solid ${borderColor}`,
        borderBottom: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: isWeekend ? 700 : 500,
        color: '#111827',
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isSelected ? 'pointer' : 'default',
        opacity: isWeekend || isSelected || isDragging ? 1 : 0.7,
        userSelect: 'none'
      }}
      title={`${dateStr} — ${isAvailable ? 'Disponible' : 'Indisponible'} (stock: ${stock})`}
    >
      {isEditing ? (
        <input
          type="number"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              onEditSubmit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onEditCancel();
            }
          }}
          onBlur={onEditSubmit}
          autoFocus
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            border: '2px solid #3b82f6',
            borderRadius: 4,
            padding: '4px',
            background: '#fff'
          }}
          min="0"
          step="0.01"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, userSelect: 'none' }}>
          {selectedRateTypeId !== null ? (
            price != null ? (
              <span style={{ userSelect: 'none' }}>
                {`${Math.round(price)}€`}
                {isModified && (
                  <span style={{ color: '#eab308', marginLeft: 2, userSelect: 'none' }}>*</span>
                )}
              </span>
            ) : (
              <span style={{ userSelect: 'none', color: '#9ca3af' }}>-</span>
            )
          ) : null}
          {isEditingDureeMin ? (
            <input
              type="number"
              value={editingDureeMinValue}
              onChange={(e) => setEditingDureeMinValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  onEditDureeMinSubmit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  onEditDureeMinCancel();
                }
              }}
              onBlur={onEditDureeMinSubmit}
              autoFocus
              style={{
                width: '60px',
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 400,
                border: '2px solid #3b82f6',
                borderRadius: 4,
                padding: '2px 4px',
                background: '#fff',
                color: '#111827'
              }}
              min="1"
              step="1"
              placeholder="-"
            />
          ) : (
            <span 
              onClick={(e) => {
                if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                  e.preventDefault();
                  return;
                }
                e.stopPropagation();
                onDureeMinClick(accId, dateStr);
              }}
              style={{ 
                fontSize: 10, 
                color: '#6b7280', 
                fontWeight: 400,
                marginTop: price != null ? 2 : 0,
                cursor: isSelected ? 'pointer' : 'default',
                userSelect: 'none'
              }}
            >
              {dureeMin != null && dureeMin > 0 ? `${dureeMin}+` : '-'}
              {isModifiedDureeMin && (
                <span style={{ color: '#eab308', marginLeft: 2, userSelect: 'none' }}>*</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

