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
  dureeMinByAccommodation: Record<number, Record<string, number | null>>,
  selectedRateTypeId: number | null,
  onRateUpdate: (newPrice: number) => void,
  onDureeMinUpdate: (newDureeMin: number | null) => void
): {
  editingCell: EditingCell | null;
  editingValue: string;
  editingDureeMinCell: EditingCell | null;
  editingDureeMinValue: string;
  setEditingValue: React.Dispatch<React.SetStateAction<string>>;
  setEditingDureeMinValue: React.Dispatch<React.SetStateAction<string>>;
  handleCellClick: (accId: number, dateStr: string) => void;
  handleDureeMinClick: (accId: number, dateStr: string) => void;
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
  const handleCellClick = React.useCallback((accId: number, dateStr: string) => {
    const cellKey = `${accId}|${dateStr}`;
    if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
      return;
    }
    if (editingDureeMinCell) {
      setEditingDureeMinCell(null);
      setEditingDureeMinValue('');
    }
    const currentPrice = selectedRateTypeId !== null
      ? ratesByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId]
      : undefined;
    setEditingCell({ accId, dateStr });
    setEditingValue(currentPrice != null ? String(Math.round(currentPrice)) : '');
  }, [selectedCells, ratesByAccommodation, editingDureeMinCell, selectedRateTypeId]);

  // Gestionnaire pour démarrer l'édition d'une cellule (durée minimale)
  const handleDureeMinClick = React.useCallback((accId: number, dateStr: string) => {
    const cellKey = `${accId}|${dateStr}`;
    if (selectedCells.size === 0 || !selectedCells.has(cellKey)) {
      return;
    }
    if (editingCell) {
      setEditingCell(null);
      setEditingValue('');
    }
    const currentDureeMin = dureeMinByAccommodation[accId]?.[dateStr];
    setEditingDureeMinCell({ accId, dateStr });
    setEditingDureeMinValue(currentDureeMin != null && currentDureeMin > 0 ? String(currentDureeMin) : '');
  }, [selectedCells, dureeMinByAccommodation, editingCell]);

  // Gestionnaire pour valider l'édition (prix)
  const handleEditSubmit = React.useCallback(() => {
    if (!editingCell) return;
    const numValue = parseFloat(editingValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onRateUpdate(numValue);
    }
    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, onRateUpdate]);

  // Gestionnaire pour valider l'édition (durée minimale)
  const handleDureeMinSubmit = React.useCallback(() => {
    if (!editingDureeMinCell) return;
    const trimmedValue = editingDureeMinValue.trim();
    if (trimmedValue === '') {
      onDureeMinUpdate(null);
    } else {
      const numValue = parseInt(trimmedValue, 10);
      if (!isNaN(numValue) && numValue > 0) {
        onDureeMinUpdate(numValue);
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

