/**
 * Hook personnalisé pour gérer le drag de sélection de dates dans la grille
 * 
 * Ce hook gère toute la logique de drag pour sélectionner des plages de dates,
 * incluant le démarrage du drag, le suivi du mouvement de la souris, et la
 * finalisation de la sélection.
 */

import React from 'react';
import { formatDate } from '../../../utils/dateUtils';

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
 * Hook pour gérer le drag de sélection de dates
 * 
 * @param onSelectedDatesChange - Callback pour mettre à jour la sélection de dates
 * @param getDateFromElement - Fonction pour extraire la date d'un élément DOM
 * @param getDateRange - Fonction pour calculer la plage de dates entre deux dates
 * @param editingCell - État de la cellule en cours d'édition (pour empêcher le drag pendant l'édition)
 * @returns État du drag et gestionnaires d'événements
 */
export function useGridDrag(
  onSelectedDatesChange: (dates: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  getDateFromElement: (element: HTMLElement) => string | null,
  getDateRange: (startDateStr: string, endDateStr: string) => string[],
  editingCell: { accId: number; dateStr: string } | null
): {
  draggingState: DraggingState | null;
  draggingDates: Set<string>;
  justFinishedDragRef: React.MutableRefObject<boolean>;
  handleMouseDown: (e: React.MouseEvent, dateStr: string) => void;
} {
  const [draggingState, setDraggingState] = React.useState<DraggingState | null>(null);
  const justFinishedDragRef = React.useRef(false);

  // Gestionnaire pour démarrer le drag
  const handleMouseDown = React.useCallback((e: React.MouseEvent, dateStr: string) => {
    if (editingCell) return;
    if (e.button !== 0) return;
    
    setDraggingState({
      startDate: dateStr,
      currentDate: dateStr,
      isDragging: false,
      startPosition: { x: e.clientX, y: e.clientY }
    });
  }, [editingCell]);

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

  // Gestionnaire pour terminer le drag
  const handleMouseUp = React.useCallback((e: MouseEvent) => {
    setDraggingState(prev => {
      if (!prev) return null;
      
      const deltaX = Math.abs(e.clientX - prev.startPosition.x);
      const deltaY = Math.abs(e.clientY - prev.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (!prev.isDragging || distance < 5) {
        justFinishedDragRef.current = true;
        
        onSelectedDatesChange((prevSelected: Set<string>) => {
          const newSet = new Set(prevSelected);
          if (newSet.has(prev.startDate)) {
            newSet.delete(prev.startDate);
          } else {
            newSet.add(prev.startDate);
          }
          return newSet;
        });
        
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);
        return null;
      }
      
      const dateRange = getDateRange(prev.startDate, prev.currentDate);
      const isReplaceMode = e.ctrlKey || e.metaKey;
      
      onSelectedDatesChange((prevSelected: Set<string>) => {
        if (isReplaceMode) {
          return new Set(dateRange);
        } else {
          const newSet = new Set(prevSelected);
          for (const dateStr of dateRange) {
            newSet.add(dateStr);
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
  }, [getDateRange, onSelectedDatesChange]);

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

  // Calculer les dates dans la plage de drag pour la surbrillance temporaire
  const draggingDates = React.useMemo(() => {
    if (!draggingState || !draggingState.isDragging) return new Set<string>();
    return new Set(getDateRange(draggingState.startDate, draggingState.currentDate));
  }, [draggingState, getDateRange]);

  return {
    draggingState,
    draggingDates,
    justFinishedDragRef,
    handleMouseDown
  };
}

