/**
 * Hook personnalisé pour gérer le drag de sélection de dates dans la grille
 * 
 * Ce hook gère toute la logique de drag pour sélectionner des plages de dates,
 * incluant le démarrage du drag, le suivi du mouvement de la souris, et la
 * finalisation de la sélection.
 */

import React from 'react';
import { formatDate, isPastDate } from '../../../utils/dateUtils';
import { getAccIdFromElement } from '../utils/gridUtils';

/**
 * État du drag de sélection de dates
 * 
 * Représente l'état actuel d'une opération de drag pour sélectionner
 * une plage de dates dans la grille.
 */
export interface DraggingState {
  /** Date de début du drag au format YYYY-MM-DD */
  startDate: string;
  /** Date actuelle sous le curseur au format YYYY-MM-DD */
  currentDate: string;
  /** Indique si le drag est actif (après un mouvement de plus de 5px) */
  isDragging: boolean;
  /** Position de départ du drag en pixels */
  startPosition: { x: number; y: number };
}

/**
 * Hook pour gérer le drag de sélection de cellules
 * 
 * @param onSelectedCellsChange - Callback pour mettre à jour la sélection de cellules
 * @param getDateFromElement - Fonction pour extraire la date d'un élément DOM
 * @param getDateRange - Fonction pour calculer la plage de dates entre deux dates
 * @param editingCell - État de la cellule en cours d'édition (pour empêcher le drag pendant l'édition)
 * @param accommodations - Liste des hébergements
 * @param stockByAccommodation - Map du stock par hébergement et date
 * @returns État du drag et gestionnaires d'événements
 */
export function useGridDrag(
  onSelectedCellsChange: (cells: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  getDateFromElement: (element: HTMLElement) => string | null,
  getDateRange: (startDateStr: string, endDateStr: string) => string[],
  editingCell: { accId: number; dateStr: string } | null,
  accommodations: Array<{ idHebergement: number }>,
  stockByAccommodation: Record<number, Record<string, number>>,
  bookedDatesByAccommodation: Record<number, Set<string>>,
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>
): {
  draggingState: DraggingState | null;
  draggingCells: Set<string>;
  justFinishedDragRef: React.MutableRefObject<boolean>;
  handleMouseDown: (e: React.MouseEvent, dateStr: string, accId?: number) => void;
} {
  const [draggingState, setDraggingState] = React.useState<DraggingState | null>(null);
  const justFinishedDragRef = React.useRef(false);

  // Fonction helper pour vérifier si un hébergement a des types de tarifs
  const hasRateTypes = React.useCallback((accId: number): boolean => {
    const rates = ratesByAccommodation[accId];
    if (!rates) return false;
    
    // Vérifier si au moins une date a au moins un tarif
    for (const dateStr in rates) {
      const rateTypesForDate = rates[dateStr];
      if (rateTypesForDate && Object.keys(rateTypesForDate).length > 0) {
        return true;
      }
    }
    return false;
  }, [ratesByAccommodation]);

  // Gestionnaire pour démarrer le drag
  const handleMouseDown = React.useCallback((e: React.MouseEvent, dateStr: string, accId?: number) => {
    if (editingCell) return;
    if (e.button !== 0) return;
    // Ne pas gérer le drag si CTRL est pressé (sera géré par l'édition)
    if (e.ctrlKey || e.metaKey) return;
    // Ne pas permettre le drag si la date est passée
    if (isPastDate(dateStr)) return;
    // Ne pas permettre le drag si l'hébergement n'a pas de types de tarifs
    if (accId !== undefined && !hasRateTypes(accId)) return;
    
    setDraggingState({
      startDate: dateStr,
      currentDate: dateStr,
      isDragging: false,
      startPosition: { x: e.clientX, y: e.clientY }
    });
  }, [editingCell, hasRateTypes]);

  // Gestionnaire pour le mouvement de la souris pendant le drag
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    setDraggingState(prev => {
      if (!prev) return null;
      
      const deltaX = Math.abs(e.clientX - prev.startPosition.x);
      const deltaY = Math.abs(e.clientY - prev.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (!prev.isDragging && distance > 5) {
        return { ...prev, isDragging: true };
      }
      
      if (!prev.isDragging) return prev;
      
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!elementUnderCursor) return prev;
      
      const dateStr = getDateFromElement(elementUnderCursor);
      if (dateStr && dateStr !== prev.currentDate) {
        return { ...prev, currentDate: dateStr };
      }
      
      return prev;
    });
  }, [getDateFromElement]);

  // Fonction helper pour générer les cellules d'une plage de dates
  // Exclut les dates occupées par une réservation, les dates passées, et les hébergements sans types de tarifs
  const generateCellsForDateRange = React.useCallback((startDateStr: string, endDateStr: string): string[] => {
    const dateRange = getDateRange(startDateStr, endDateStr);
    const cells: string[] = [];
    
    for (const dateStr of dateRange) {
      // Ne pas inclure les dates passées
      if (isPastDate(dateStr)) continue;
      
      for (const acc of accommodations) {
        // Vérifier si cette date est occupée par une réservation
        const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;
        // Vérifier si l'hébergement a des types de tarifs
        const accHasRateTypes = hasRateTypes(acc.idHebergement);
        
        // Ne pas inclure les dates occupées ni les hébergements sans types de tarifs
        if (!isBooked && accHasRateTypes) {
          cells.push(`${acc.idHebergement}|${dateStr}`);
        }
      }
    }
    
    return cells;
  }, [getDateRange, accommodations, bookedDatesByAccommodation, hasRateTypes]);

  // Gestionnaire pour terminer le drag
  const handleMouseUp = React.useCallback((e: MouseEvent) => {
    setDraggingState(prev => {
      if (!prev) return null;
      
      const deltaX = Math.abs(e.clientX - prev.startPosition.x);
      const deltaY = Math.abs(e.clientY - prev.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (!prev.isDragging || distance < 5) {
        justFinishedDragRef.current = true;
        
        // Clic simple : basculer la sélection de toutes les cellules pour cette date (même avec stock à 0)
        // Si on a cliqué sur une cellule spécifique (pas un header), on peut aussi basculer juste cette cellule
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        const accId = elementUnderCursor ? getAccIdFromElement(elementUnderCursor) : null;
        
        if (accId !== null) {
          // Vérifier si cette date est occupée par une réservation ou passée
          const isBooked = bookedDatesByAccommodation[accId]?.has(prev.startDate) ?? false;
          const isPast = isPastDate(prev.startDate);
          const accHasRateTypes = hasRateTypes(accId);
          
          // Ne pas permettre la sélection si la date est occupée, passée, ou si l'hébergement n'a pas de types de tarifs
          if (!isBooked && !isPast && accHasRateTypes) {
            // Clic sur une cellule spécifique : basculer cette cellule (si non occupée)
            const cellKey = `${accId}|${prev.startDate}`;
            onSelectedCellsChange((prevSelected: Set<string>) => {
              const newSet = new Set(prevSelected);
              if (newSet.has(cellKey)) {
                newSet.delete(cellKey);
              } else {
                newSet.add(cellKey);
              }
              return newSet;
            });
          }
        } else {
          // Clic sur un header : basculer toutes les cellules pour cette date (même avec stock à 0)
          const cellsForDate = generateCellsForDateRange(prev.startDate, prev.startDate);
          onSelectedCellsChange((prevSelected: Set<string>) => {
            const newSet = new Set(prevSelected);
            const allSelected = cellsForDate.every(cell => newSet.has(cell));
            
            for (const cell of cellsForDate) {
              if (allSelected) {
                newSet.delete(cell);
              } else {
                newSet.add(cell);
              }
            }
            return newSet;
          });
        }
        
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);
        return null;
      }
      
      // Drag : sélectionner toutes les cellules dans la plage (même avec stock à 0)
      const cellsInRange = generateCellsForDateRange(prev.startDate, prev.currentDate);
      const isReplaceMode = e.ctrlKey || e.metaKey;
      
      onSelectedCellsChange((prevSelected: Set<string>) => {
        if (isReplaceMode) {
          return new Set(cellsInRange);
        } else {
          const newSet = new Set(prevSelected);
          for (const cell of cellsInRange) {
            newSet.add(cell);
          }
          return newSet;
        }
      });
      
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 100);
      
      return null;
    });
  }, [generateCellsForDateRange, onSelectedCellsChange, bookedDatesByAccommodation]);

  // Effet pour gérer les événements globaux de souris pendant le drag
  React.useEffect(() => {
    if (!draggingState) return;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, handleMouseMove, handleMouseUp]);

  // Calculer les cellules dans la plage de drag pour la surbrillance temporaire
  const draggingCells = React.useMemo(() => {
    if (!draggingState || !draggingState.isDragging) return new Set<string>();
    return new Set(generateCellsForDateRange(draggingState.startDate, draggingState.currentDate));
  }, [draggingState, generateCellsForDateRange]);

  return {
    draggingState,
    draggingCells,
    justFinishedDragRef,
    handleMouseDown
  };
}

