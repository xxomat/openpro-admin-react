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
 * @param dureeMinByAccommodation - Map des durées minimales par hébergement et date
 * @param selectedRateTypeId - ID du type de tarif sélectionné
 * @param onRateUpdate - Callback pour mettre à jour un prix
 * @param onDureeMinUpdate - Callback pour mettre à jour une durée minimale
 * @returns État d'édition et gestionnaires
 */
export function useGridEditing(
  selectedCells: Set<string>,
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>,
  dureeMinByAccommodation: Record<number, Record<string, Record<number, number | null>>>,
  selectedRateTypeId: number | null,
  onRateUpdate: (newPrice: number, editAllSelection?: boolean, editingCell?: EditingCell | null) => void,
  onDureeMinUpdate: (newDureeMin: number | null, editAllSelection?: boolean, editingCell?: EditingCell | null) => void
): {
  editingCell: EditingCell | null;
  editingValue: string;
  editingDureeMinCell: EditingCell | null;
  editingDureeMinValue: string;
  setEditingValue: React.Dispatch<React.SetStateAction<string>>;
  setEditingDureeMinValue: React.Dispatch<React.SetStateAction<string>>;
  handleCellClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  handleDureeMinClick: (accId: number, dateStr: string, editAllSelection?: boolean) => void;
  handleEditSubmit: () => void;
  handleDureeMinSubmit: () => void;
  handleEditCancel: () => void;
  handleDureeMinCancel: () => void;
} {
  const [editingCell, setEditingCell] = React.useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>('');
  const [editingDureeMinCell, setEditingDureeMinCell] = React.useState<EditingCell | null>(null);
  const [editingDureeMinValue, setEditingDureeMinValue] = React.useState<string>('');

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
    
    if (editingDureeMinCell) {
      setEditingDureeMinCell(null);
      setEditingDureeMinValue('');
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
  }, [selectedCells, ratesByAccommodation, editingDureeMinCell, selectedRateTypeId]);

  // Gestionnaire pour démarrer l'édition d'une cellule (durée minimale)
  const handleDureeMinClick = React.useCallback((accId: number, dateStr: string, editAllSelection: boolean = false) => {
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
    let currentDureeMin: number | null = null;
    if (selectedRateTypeId !== null) {
      if (editAllSelection) {
        // Prendre la durée min de la première cellule sélectionnée qui en a une
        for (const cell of selectedCells) {
          const [cellAccIdStr, cellDateStr] = cell.split('|');
          const cellAccId = parseInt(cellAccIdStr, 10);
          if (isNaN(cellAccId) || !cellDateStr) continue;
          
          const dureeMin = dureeMinByAccommodation[cellAccId]?.[cellDateStr]?.[selectedRateTypeId];
          if (dureeMin !== undefined && dureeMin !== null && dureeMin > 0) {
            currentDureeMin = dureeMin;
            break;
          }
        }
      } else {
        currentDureeMin = dureeMinByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId] ?? null;
      }
    }
    
    setEditingDureeMinCell({ accId, dateStr, editAllSelection });
    setEditingDureeMinValue(currentDureeMin != null && currentDureeMin > 0 ? String(currentDureeMin) : '');
  }, [selectedCells, dureeMinByAccommodation, ratesByAccommodation, editingCell, selectedRateTypeId]);

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
  const handleDureeMinSubmit = React.useCallback(() => {
    if (!editingDureeMinCell) return;
    const trimmedValue = editingDureeMinValue.trim();
    if (trimmedValue === '') {
      onDureeMinUpdate(null, editingDureeMinCell.editAllSelection, editingDureeMinCell);
    } else {
      const numValue = parseInt(trimmedValue, 10);
      if (!isNaN(numValue) && numValue > 0) {
        onDureeMinUpdate(numValue, editingDureeMinCell.editAllSelection, editingDureeMinCell);
      }
    }
    setEditingDureeMinCell(null);
    setEditingDureeMinValue('');
  }, [editingDureeMinCell, editingDureeMinValue, onDureeMinUpdate]);

  // Gestionnaire pour annuler l'édition (prix)
  const handleEditCancel = React.useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  // Gestionnaire pour annuler l'édition (durée minimale)
  const handleDureeMinCancel = React.useCallback(() => {
    setEditingDureeMinCell(null);
    setEditingDureeMinValue('');
  }, []);

  return {
    editingCell,
    editingValue,
    editingDureeMinCell,
    editingDureeMinValue,
    setEditingValue,
    setEditingDureeMinValue,
    handleCellClick,
    handleDureeMinClick,
    handleEditSubmit,
    handleDureeMinSubmit,
    handleEditCancel,
    handleDureeMinCancel
  };
}

