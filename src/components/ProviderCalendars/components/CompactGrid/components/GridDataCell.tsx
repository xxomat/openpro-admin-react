/**
 * Composant GridDataCell - Cellule de données dans la grille
 * 
 * Ce composant affiche une cellule de données pour un hébergement et une date,
 * avec support de l'édition inline des prix et durées minimales.
 */

import React from 'react';
import type { EditingCell } from '../hooks/useGridEditing';
import { darkTheme } from '../../../utils/theme';
import { isPastDate } from '../../../utils/dateUtils';
import { ArrivalToggle } from './ArrivalToggle';

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
  /** Indique si l'arrivée est autorisée pour cette date */
  arriveeAutorisee: boolean;
  /** Indique si arriveeAutorisee a été modifiée */
  isModifiedArriveeAutorisee: boolean;
  /** Callback appelé quand l'utilisateur change arriveeAutorisee */
  onArriveeAutoriseeChange: (accId: number, dateStr: string, isAllowed: boolean, editAllSelection?: boolean) => void;
  /** Nombre de cellules sélectionnées (pour déterminer si on doit propager la modification) */
  selectedCellsCount: number;
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
  /** Indique si le jour n'est pas réservable (durée minimale > longueur de la plage de disponibilité) */
  isNonReservable: boolean;
  /** Indique si cette date est occupée par une réservation */
  isBooked: boolean;
  /** Indique si l'hébergement a des types de tarifs associés */
  hasRateTypes: boolean;
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
  /** État du drag (pour empêcher les clics pendant le drag) */
  draggingState: { isDragging: boolean } | null;
  /** Référence pour détecter si un drag vient de se terminer */
  justFinishedDragRef: React.MutableRefObject<boolean>;
  /** Callback appelé quand l'utilisateur clique sur la cellule pour éditer le prix */
  onCellClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  /** Callback appelé quand l'utilisateur clique sur la durée minimale pour l'éditer */
  onDureeMinClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  /** Callback appelé quand l'utilisateur appuie sur la souris pour démarrer un drag */
  onMouseDown: (e: React.MouseEvent, dateStr: string, accId: number) => void;
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
  arriveeAutorisee,
  isModifiedArriveeAutorisee,
  onArriveeAutoriseeChange,
  selectedCellsCount,
  isEditing,
  isEditingDureeMin,
  editingValue,
  editingDureeMinValue,
  isWeekend,
  isNonReservable,
  isBooked,
  hasRateTypes,
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
  onEditDureeMinCancel,
  onMouseDown
}: GridDataCellProps): React.ReactElement {
  const isAvailable = stock > 0;
  const isPast = isPastDate(dateStr);
  
  // Conserver l'affichage standard (vert/rouge) - l'overlay bleu passera par-dessus
  // Si le jour n'est pas réservable, appliquer un fond gris avec opacité réduite
  // Si la date est passée, appliquer un fond sombre comme l'en-tête
  // IMPORTANT : La sélection (isSelected/isDragging) doit être prioritaire sur isNonReservable
  let bgColor: string;
  if (isPast) {
    // Date passée : fond sombre identique à l'en-tête
    bgColor = darkTheme.gridHeaderBg;
  } else if (isDragging) {
    // Drag en cours : fond de drag (prioritaire sur tout sauf isPast)
    bgColor = darkTheme.selectionDraggingBg;
  } else if (isSelected) {
    // Sélection : fond de sélection (prioritaire sur isNonReservable)
    bgColor = isAvailable 
      ? darkTheme.selectionBg
      : darkTheme.infoBg;
  } else if (isNonReservable) {
    // Jour non réservable : fond gris avec opacité réduite (seulement si pas sélectionné)
    bgColor = darkTheme.bgTertiary;
  } else {
    if (isWeekend) {
      bgColor = isAvailable ? darkTheme.successBgStrong : darkTheme.errorBgStrong;
    } else {
      bgColor = isAvailable ? darkTheme.successBg : darkTheme.errorBg;
    }
  }
  
  const borderColor = (isSelected || isDragging)
    ? darkTheme.selectionBorder
    : (isAvailable ? darkTheme.success : darkTheme.error);
  const borderWidth = isDragging ? '2px' : (isSelected ? '3px' : '1px');

  return (
    <div
      key={`${accId}-${dateStr}`}
      data-date={dateStr}
      data-acc-id={accId}
      onMouseDown={(e) => {
        // Ne pas démarrer le drag si la date est occupée par une réservation, passée, ou si l'hébergement n'a pas de types de tarifs
        if (isBooked || isPast || !hasRateTypes) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Ne pas démarrer le drag si CTRL est pressé (sera géré par l'édition)
        if (e.ctrlKey || e.metaKey) {
          return;
        }
        onMouseDown(e, dateStr, accId);
      }}
      onClick={(e) => {
        if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
          e.preventDefault();
          return;
        }
        // CTRL+clic : ne pas gérer ici, sera géré par les handlers spécifiques (prix/durée min)
        if (e.ctrlKey || e.metaKey) {
          return;
        }
        // Clic normal : basculer la sélection (géré par useGridDrag via onMouseDown)
        // On ne fait rien ici car le drag handler s'en occupe
      }}
      style={{
        position: 'relative',
        padding: '8px 4px',
        background: bgColor,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: isWeekend ? 700 : 500,
        color: darkTheme.textPrimary,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: (isBooked || isPast || !hasRateTypes) ? 'not-allowed' : (isSelected ? 'pointer' : 'default'),
        // Les jours avec stock à 0 ont toujours une opacité de 0.5, même s'ils sont des weekends
        // Les jours non réservables ont une opacité normale (1.0)
        // Les dates passées ont une opacité réduite pour indiquer leur état désactivé
        opacity: isPast ? 0.6 : (!isAvailable ? 0.5 : (isNonReservable ? 1 : (isWeekend || isSelected || isDragging ? 1 : 0.7))),
        userSelect: 'none'
      }}
      title={`${dateStr} — ${!hasRateTypes ? 'Aucun typeTarif associé' : (isPast ? 'Date passée' : (isBooked ? 'Occupé par une réservation' : (isAvailable ? 'Disponible' : 'Indisponible')))} (stock: ${stock})`}
    >
      {/* Toggle switch pour l'arrivée autorisée en haut à gauche */}
      {hasRateTypes && selectedRateTypeId !== null && (
        <ArrivalToggle
          isArrivalAllowed={arriveeAutorisee}
          onChange={(isAllowed) => {
            // Si plusieurs cellules sont sélectionnées, appliquer à toutes
            const editAllSelection = selectedCellsCount > 1;
            onArriveeAutoriseeChange(accId, dateStr, isAllowed, editAllSelection);
          }}
          disabled={isPast || isBooked}
          isModified={isModifiedArriveeAutorisee}
        />
      )}
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
            border: `2px solid ${darkTheme.inputFocusBorder}`,
            borderRadius: 4,
            padding: '4px',
            background: darkTheme.inputBg,
            color: darkTheme.inputText
          }}
          min="0"
          step="0.01"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, userSelect: 'none' }}>
          {/* Afficher le prix même si le stock est à 0 (pour permettre la modification) */}
          {selectedRateTypeId !== null ? (
            price != null ? (
              <span 
                onMouseDown={(e) => {
                  // Empêcher le drag de se déclencher
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                    e.preventDefault();
                    return;
                  }
                  e.stopPropagation();
                  // CTRL+clic : éditer toute la sélection
                  const editAllSelection = e.ctrlKey || e.metaKey;
                  onCellClick(accId, dateStr, editAllSelection);
                }}
                style={{ 
                  userSelect: 'none', 
                  cursor: isSelected ? 'pointer' : 'default',
                  color: isNonReservable ? darkTheme.textMuted : darkTheme.textPrimary
                }}
              >
                {`${Math.round(price)}€`}
                {isModified && (
                  <span style={{ color: darkTheme.warning, marginLeft: 2, userSelect: 'none' }}>*</span>
                )}
              </span>
            ) : (
              <span 
                onMouseDown={(e) => {
                  // Empêcher le drag de se déclencher
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  if (!hasRateTypes) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                    e.preventDefault();
                    return;
                  }
                  e.stopPropagation();
                  // CTRL+clic : éditer toute la sélection
                  const editAllSelection = e.ctrlKey || e.metaKey;
                  onCellClick(accId, dateStr, editAllSelection);
                }}
                style={{ 
                  userSelect: 'none', 
                  cursor: hasRateTypes && isSelected ? 'pointer' : 'default',
                  color: darkTheme.textTertiary 
                }}
              >
                -
              </span>
            )
          ) : null}
          {/* Afficher la durée minimale même si le stock est à 0 (pour permettre la modification) */}
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
                border: `2px solid ${darkTheme.inputFocusBorder}`,
                borderRadius: 4,
                padding: '2px 4px',
                background: darkTheme.inputBg,
                color: darkTheme.inputText
              }}
              min="1"
              step="1"
              placeholder="-"
            />
          ) : (
            <span 
              onMouseDown={(e) => {
                // Empêcher le drag de se déclencher
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                if (!hasRateTypes) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                // Ne pas autoriser le clic si le prix n'est pas défini
                if (price === null || price === undefined || price === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                  e.preventDefault();
                  return;
                }
                e.stopPropagation();
                // CTRL+clic : éditer toute la sélection
                const editAllSelection = e.ctrlKey || e.metaKey;
                onDureeMinClick(accId, dateStr, editAllSelection);
              }}
              style={{ 
                fontSize: 10, 
                color: isNonReservable ? darkTheme.error : darkTheme.textMuted, 
                fontWeight: 400,
                marginTop: price != null ? 2 : 0,
                cursor: (hasRateTypes && isSelected && price != null && price > 0) ? 'pointer' : 'not-allowed',
                opacity: (price != null && price > 0) ? 1 : 0.5,
                userSelect: 'none'
              }}
            >
              {dureeMin != null && dureeMin > 0 ? `${dureeMin}+` : '-'}
              {isModifiedDureeMin && (
                <span style={{ color: darkTheme.warning, marginLeft: 2, userSelect: 'none' }}>*</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

