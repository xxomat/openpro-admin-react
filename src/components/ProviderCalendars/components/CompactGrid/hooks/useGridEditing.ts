/**
 * Hook personnalisé pour gérer l'édition inline des cellules de la grille
 * 
 * Ce hook gère l'édition des prix et des durées minimales dans les cellules
 * de la grille, incluant le démarrage, la validation et l'annulation de l'édition.
 */

import React from 'react';

/**
 * Représente une cellule en cours d'édition
 * 
 * Identifie une cellule de la grille qui est actuellement en mode édition,
 * soit pour le prix, soit pour la durée minimale.
 */
export interface EditingCell {
  /** Identifiant de l'hébergement */
  accId: number;
  /** Date de la cellule au format YYYY-MM-DD */
  dateStr: string;
  /** Indique si on édite toute la sélection (CTRL+clic) */
  editAllSelection?: boolean;
}

/**
 * Hook pour gérer l'édition des cellules
 * 
 * @param selectedCells - Cellules actuellement sélectionnées (format: "accId|dateStr")
 * @param ratesByAccommodation - Map des tarifs par hébergement et date
 * @param minDurationByAccommodation - Map des durées minimales par hébergement et date
 * @param selectedRateTypeId - ID du type de tarif sélectionné
 * @param onRateUpdate - Callback pour mettre à jour un prix
 * @param onMinDurationUpdate - Callback pour mettre à jour une durée minimale
 * @returns État d'édition et gestionnaires
 */
export function useGridEditing(
  selectedCells: Set<string>,
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>,
  minDurationByAccommodation: Record<number, Record<string, Record<number, number | null>>>,
  selectedRateTypeId: number | null,
  onRateUpdate: (newPrice: number, editAllSelection?: boolean, editingCell?: EditingCell | null) => void,
  onMinDurationUpdate: (newMinDuration: number | null, editAllSelection?: boolean, editingCell?: EditingCell | null) => void
): {
  editingCell: EditingCell | null;
  editingValue: string;
  editingMinDurationCell: EditingCell | null;
  editingMinDurationValue: string;
  setEditingValue: React.Dispatch<React.SetStateAction<string>>;
  setEditingMinDurationValue: React.Dispatch<React.SetStateAction<string>>;
  handleCellClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  handleMinDurationClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  handleEditSubmit: () => void;
  handleMinDurationSubmit: () => void;
  handleEditCancel: () => void;
  handleMinDurationCancel: () => void;
} {
  const [editingCell, setEditingCell] = React.useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>('');
  const [editingMinDurationCell, setEditingMinDurationCell] = React.useState<EditingCell | null>(null);
  const [editingMinDurationValue, setEditingMinDurationValue] = React.useState<string>('');

  // Gestionnaire pour démarrer l'édition d'une cellule (prix)
  const handleCellClick = React.useCallback((accId: number, dateStr: string, editAllSelection: boolean = false) => {
    const cellKey = `${accId}|${dateStr}`;
    
    // Si CTRL+clic, la cellule doit faire partie de la sélection
    if (editAllSelection) {
      if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
        return;
      }
    } else {
      // Clic normal : la cellule doit faire partie de la sélection
      if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
        return;
      }
    }
    
    if (editingMinDurationCell) {
      setEditingMinDurationCell(null);
      setEditingMinDurationValue('');
    }
    
    // Si édition de toute la sélection, trouver une valeur représentative
    let currentPrice: number | undefined;
    if (editAllSelection) {
      // Prendre le prix de la première cellule sélectionnée qui a un prix
      for (const cell of selectedCells) {
        const [cellAccIdStr, cellDateStr] = cell.split('|');
        const cellAccId = parseInt(cellAccIdStr, 10);
        if (isNaN(cellAccId) || !cellDateStr) continue;
        
        const price = selectedRateTypeId !== null
          ? ratesByAccommodation[cellAccId]?.[cellDateStr]?.[selectedRateTypeId]
          : undefined;
        if (price !== undefined && price !== null) {
          currentPrice = price;
          break;
        }
      }
    } else {
      currentPrice = selectedRateTypeId !== null
        ? ratesByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId]
        : undefined;
    }
    
    setEditingCell({ accId, dateStr, editAllSelection });
    setEditingValue(currentPrice != null ? String(Math.round(currentPrice)) : '');
  }, [selectedCells, ratesByAccommodation, editingMinDurationCell, selectedRateTypeId]);

  // Gestionnaire pour démarrer l'édition d'une cellule (durée minimale)
  const handleMinDurationClick = React.useCallback((accId: number, dateStr: string, editAllSelection: boolean = false) => {
    const cellKey = `${accId}|${dateStr}`;
    
    // Si CTRL+clic, la cellule doit faire partie de la sélection
    if (editAllSelection) {
      if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
        return;
      }
    } else {
      // Clic normal : la cellule doit faire partie de la sélection
      if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
        return;
      }
    }
    
    // Vérifier que le prix est défini pour cette date avant d'autoriser l'édition de la durée minimale
    if (selectedRateTypeId !== null) {
      const price = ratesByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId];
      // Si le prix n'est pas défini (null, undefined, ou 0), ne pas autoriser l'édition
      if (price === null || price === undefined || price === 0) {
        return;
      }
      
      // Si édition de toute la sélection, vérifier que toutes les cellules ont un prix défini
      if (editAllSelection) {
        for (const cell of selectedCells) {
          const [cellAccIdStr, cellDateStr] = cell.split('|');
          const cellAccId = parseInt(cellAccIdStr, 10);
          if (isNaN(cellAccId) || !cellDateStr) continue;
          
          const cellPrice = ratesByAccommodation[cellAccId]?.[cellDateStr]?.[selectedRateTypeId];
          // Si une cellule n'a pas de prix défini, ne pas autoriser l'édition
          if (cellPrice === null || cellPrice === undefined || cellPrice === 0) {
            return;
          }
        }
      }
    } else {
      // Pas de type de tarif sélectionné, ne pas autoriser l'édition
      return;
    }
    
    if (editingCell) {
      setEditingCell(null);
      setEditingValue('');
    }
    
    // Si édition de toute la sélection, trouver une valeur représentative
    let currentMinDuration: number | null = null;
    if (selectedRateTypeId !== null) {
      if (editAllSelection) {
        // Prendre la durée min de la première cellule sélectionnée qui en a une
        for (const cell of selectedCells) {
          const [cellAccIdStr, cellDateStr] = cell.split('|');
          const cellAccId = parseInt(cellAccIdStr, 10);
          if (isNaN(cellAccId) || !cellDateStr) continue;
          
          const minDuration = minDurationByAccommodation[cellAccId]?.[cellDateStr]?.[selectedRateTypeId];
          if (minDuration !== undefined && minDuration !== null && minDuration > 0) {
            currentMinDuration = minDuration;
            break;
          }
        }
      } else {
        currentMinDuration = minDurationByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId] ?? null;
      }
    }
    
    setEditingMinDurationCell({ accId, dateStr, editAllSelection });
    setEditingMinDurationValue(currentMinDuration != null && currentMinDuration > 0 ? String(currentMinDuration) : '');
  }, [selectedCells, minDurationByAccommodation, ratesByAccommodation, editingCell, selectedRateTypeId]);

  // Gestionnaire pour valider l'édition (prix)
  const handleEditSubmit = React.useCallback(() => {
    if (!editingCell) return;
    const numValue = parseFloat(editingValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onRateUpdate(numValue, editingCell.editAllSelection, editingCell);
    }
    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, onRateUpdate]);

  // Gestionnaire pour valider l'édition (durée minimale)
  const handleMinDurationSubmit = React.useCallback(() => {
    if (!editingMinDurationCell) return;
    const trimmedValue = editingMinDurationValue.trim();
    if (trimmedValue === '') {
      onMinDurationUpdate(null, editingMinDurationCell.editAllSelection, editingMinDurationCell);
    } else {
      const numValue = parseInt(trimmedValue, 10);
      if (!isNaN(numValue) && numValue > 0) {
        onMinDurationUpdate(numValue, editingMinDurationCell.editAllSelection, editingMinDurationCell);
      }
    }
    setEditingMinDurationCell(null);
    setEditingMinDurationValue('');
  }, [editingMinDurationCell, editingMinDurationValue, onMinDurationUpdate]);

  // Gestionnaire pour annuler l'édition (prix)
  const handleEditCancel = React.useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  // Gestionnaire pour annuler l'édition (durée minimale)
  const handleMinDurationCancel = React.useCallback(() => {
    setEditingMinDurationCell(null);
    setEditingMinDurationValue('');
  }, []);

  return {
    editingCell,
    editingValue,
    editingMinDurationCell,
    editingMinDurationValue,
    setEditingValue,
    setEditingMinDurationValue,
    handleCellClick,
    handleMinDurationClick,
    handleEditSubmit,
    handleMinDurationSubmit,
    handleEditCancel,
    handleMinDurationCancel
  };
}

