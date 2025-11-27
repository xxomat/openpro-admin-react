/**
 * Composant ProviderCalendars - Composant principal
 * 
 * Ce composant principal orchestre l'affichage des calendriers pour plusieurs fournisseurs.
 * Il gère les onglets de fournisseurs, la sélection d'hébergements, la sélection de dates,
 * et l'édition des tarifs et durées minimales. Il utilise le hook useSupplierData pour
 * la gestion des données et le composant CompactGrid pour l'affichage de la grille.
 */

import React from 'react';
import type { Supplier, BookingDisplay } from '@/types';
import { PlateformeReservation } from '@/types';
import { ActionButtons } from './components/ActionButtons';
import { AccommodationList } from './components/AccommodationList';
import { CompactGrid } from './components/CompactGrid';
import { DateRangeControls } from './components/DateRangeControls';
import { RateTypeSelector } from './components/RateTypeSelector';
import { SelectionSummary } from './components/SelectionSummary';
import { SupplierTabs } from './components/SupplierTabs';
import { AdminFooter } from './components/AdminFooter';
import { BookingModal } from './components/BookingModal';
import { DeleteBookingModal } from './components/DeleteBookingModal';
import { ConnectionModal } from './components/ConnectionModal';
import { RateTypeManagementModal } from './components/RateTypeManagementModal/RateTypeManagementModal';
import { defaultSuppliers } from './config';
import { useSupplierData } from './hooks/useSupplierData';
import { useSyncStatusPolling } from './hooks/useSyncStatusPolling';
import { formatDate, addMonths, addDays, getDaysInRange, isPastDate } from './utils/dateUtils';
import { darkTheme } from './utils/theme';
import { saveBulkUpdates, type BulkUpdateRequest, updateStock, deleteBooking } from '@/services/api/backendClient';
import { generateBookingSummaries, isValidBookingSelection } from './utils/bookingUtils';
import { getNonReservableDays } from './utils/availabilityUtils';

export function ProviderCalendars(): React.ReactElement {
  const [suppliers] = React.useState<Supplier[]>(defaultSuppliers);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [startInput, setStartInput] = React.useState<string>(() => {
    const today = new Date();
    return formatDate(today);
  });
  const [endInput, setEndInput] = React.useState<string>(() => {
    const today = new Date();
    const endDate = addMonths(today, 1);
    return formatDate(endDate);
  });
  const [saving, setSaving] = React.useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [reserveButtonHover, setReserveButtonHover] = React.useState(false);
  const [isRateTypeManagementModalOpen, setIsRateTypeManagementModalOpen] = React.useState(false);

  const supplierData = useSupplierData();
  
  // État pour gérer la modale de connexion
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = React.useState(false);

  const activeSupplier = suppliers[activeIdx];
  const startDate = React.useMemo(() => {
    const d = new Date(startInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startInput]);
  const endDate = React.useMemo(() => {
    const d = new Date(endInput);
    return isNaN(d.getTime()) ? addMonths(startDate, 1) : d;
  }, [endInput, startDate]);


  // Dates pour le chargement initial des données (1 an)
  // Les données sont chargées pour 1 an, mais l'affichage est limité à [startDate; endDate]
  const loadStartDate = React.useMemo(() => {
    const today = new Date();
    return today;
  }, []);
  const loadEndDate = React.useMemo(() => {
    return addMonths(loadStartDate, 12);
  }, [loadStartDate]);

  // Obtenir la sélection de cellules pour le fournisseur actif (format: "accId-dateStr")
  const selectedCells = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.selectedCellsBySupplier[activeSupplier.supplierId] ?? new Set<string>();
  }, [activeSupplier, supplierData.selectedCellsBySupplier]);

  // Obtenir la sélection d'hébergements pour le fournisseur actif
  const selectedAccommodations = React.useMemo(() => {
    if (!activeSupplier) return new Set<number>();
    return supplierData.selectedAccommodationsBySupplier[activeSupplier.supplierId] ?? new Set<number>();
  }, [activeSupplier, supplierData.selectedAccommodationsBySupplier]);

  // Fonction pour mettre à jour la sélection d'hébergements du fournisseur actif
  const setSelectedAccommodations = React.useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedAccommodationsBySupplier(prev => {
      const current = prev[activeSupplier.supplierId] ?? new Set<number>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.supplierId]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // État pour la réservation sélectionnée (uniquement Directe)
  const [selectedBookingId, setSelectedBookingId] = React.useState<number | null>(null);

  // Fonction pour mettre à jour la sélection de cellules du fournisseur actif
  const setSelectedCells = React.useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedCellsBySupplier(prev => {
      const current = prev[activeSupplier.supplierId] ?? new Set<string>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.supplierId]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // Vider automatiquement la sélection de réservation quand des dates sont sélectionnées
  // Utiliser un useEffect pour éviter d'appeler setState pendant le rendu
  React.useEffect(() => {
    if (selectedCells.size > 0 && selectedBookingId !== null) {
      setSelectedBookingId(null);
    }
  }, [selectedCells.size, selectedBookingId]);

  // Refs pour stocker les valeurs précédentes et éviter les boucles infinies
  const prevSelectedAccommodationsRef = React.useRef<Set<number>>(new Set());
  const prevStartDateRef = React.useRef<string>('');
  const prevEndDateRef = React.useRef<string>('');

  // Filtrer automatiquement la sélection quand selectedAccommodations change
  // (retirer les cellules des hébergements qui ne sont plus sélectionnés)
  React.useEffect(() => {
    if (!activeSupplier) return;
    
    // Comparer avec la valeur précédente pour éviter les mises à jour inutiles
    const prevSelected = prevSelectedAccommodationsRef.current;
    const hasChanged = prevSelected.size !== selectedAccommodations.size || 
      Array.from(prevSelected).some(id => !selectedAccommodations.has(id)) ||
      Array.from(selectedAccommodations).some(id => !prevSelected.has(id));
    
    if (!hasChanged) return;
    
    prevSelectedAccommodationsRef.current = new Set(selectedAccommodations);
    
    setSelectedCells(prev => {
      const filtered = new Set<string>();
      let hasChanges = false;
      
      for (const cellKey of prev) {
        const [accIdStr] = cellKey.split('|');
        const accId = parseInt(accIdStr, 10);
        if (isNaN(accId)) continue;
        
        // Garder la cellule seulement si l'hébergement est toujours sélectionné
        // Si aucun hébergement n'est sélectionné, garder toutes les cellules
        if (selectedAccommodations.size === 0 || selectedAccommodations.has(accId)) {
          filtered.add(cellKey);
        } else {
          hasChanges = true; // Une cellule a été retirée
        }
      }
      
      // Ne mettre à jour que si des changements ont été détectés
      return hasChanges ? filtered : prev;
    });
  }, [activeSupplier, selectedAccommodations, setSelectedCells]);

  // Filtrer automatiquement la sélection quand startDate ou endDate change
  // (retirer les cellules dont les dates sont en dehors de la nouvelle plage)
  React.useEffect(() => {
    if (!activeSupplier) return;
    
    // Comparer avec les valeurs précédentes pour éviter les mises à jour inutiles
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    const hasChanged = prevStartDateRef.current !== startDateStr || prevEndDateRef.current !== endDateStr;
    
    if (!hasChanged) return;
    
    prevStartDateRef.current = startDateStr;
    prevEndDateRef.current = endDateStr;
    
    setSelectedCells(prev => {
      const filtered = new Set<string>();
      let hasChanges = false;
      
      for (const cellKey of prev) {
        const [, dateStr] = cellKey.split('|');
        if (!dateStr) continue;
        
        // Vérifier si la date est dans la plage [startDate, endDate]
        const cellDate = new Date(dateStr);
        if (isNaN(cellDate.getTime())) continue;
        
        cellDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        // Garder la cellule seulement si sa date est dans la plage [startDate, endDate] (inclusif)
        if (cellDate >= start && cellDate <= end) {
          filtered.add(cellKey);
        } else {
          hasChanges = true; // Une cellule a été retirée
        }
      }
      
      // Ne mettre à jour que si des changements ont été détectés
      return hasChanges ? filtered : prev;
    });
  }, [activeSupplier, startDate, endDate, setSelectedCells]);

  // Fonction pour vider la sélection de dates
  const handleClearSelection = React.useCallback(() => {
    if (!activeSupplier) return;
    setSelectedCells(new Set<string>());
  }, [activeSupplier, setSelectedCells]);

  // Fonction pour gérer le clic sur une réservation
  const handleBookingClick = React.useCallback((booking: BookingDisplay) => {
    // Vérifier que la réservation est Directe (sécurité supplémentaire)
    if (booking.reservationPlatform !== PlateformeReservation.Directe) {
      return; // Ne pas sélectionner les réservations non Directe
    }

    // Si la réservation cliquée est déjà sélectionnée, désélectionner
    if (booking.bookingId === selectedBookingId) {
      setSelectedBookingId(null);
    } else {
      // Sinon, sélectionner cette réservation ET vider la sélection de dates
      setSelectedBookingId(booking.bookingId);
      // Vider la sélection de dates directement (sans passer par setSelectedCells pour éviter la récursion)
      if (activeSupplier) {
        supplierData.setSelectedCellsBySupplier(prev => ({
          ...prev,
          [activeSupplier.supplierId]: new Set<string>()
        }));
      }
    }
  }, [selectedBookingId, activeSupplier, supplierData]);

  // État pour la modale de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  // Refs pour accéder aux valeurs les plus récentes dans le gestionnaire d'événement
  const startInputRef = React.useRef(startInput);
  const endInputRef = React.useRef(endInput);
  const isBookingModalOpenRef = React.useRef(isBookingModalOpen);
  const isDeleteModalOpenRef = React.useRef(isDeleteModalOpen);
  
  // Mettre à jour les refs quand les valeurs changent
  React.useEffect(() => {
    startInputRef.current = startInput;
  }, [startInput]);
  React.useEffect(() => {
    endInputRef.current = endInput;
  }, [endInput]);
  React.useEffect(() => {
    isBookingModalOpenRef.current = isBookingModalOpen;
  }, [isBookingModalOpen]);
  React.useEffect(() => {
    isDeleteModalOpenRef.current = isDeleteModalOpen;
  }, [isDeleteModalOpen]);

  // Trouver la réservation sélectionnée dans les données
  const selectedBooking = React.useMemo(() => {
    if (!activeSupplier || selectedBookingId === null || selectedBookingId === undefined) {
      return null;
    }

    const bookingsByAcc = supplierData.bookingsBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
    
    // Parcourir toutes les réservations pour trouver celle avec le bon idDossier
    for (const bookingsArray of Object.values(bookingsByAcc)) {
      const booking = bookingsArray.find(b => b.bookingId === selectedBookingId);
      if (booking) {
        return booking;
      }
    }

    return null;
  }, [activeSupplier, selectedBookingId, supplierData.bookingsBySupplierAndAccommodation]);

  // Trouver le nom de l'hébergement pour la réservation sélectionnée
  const selectedBookingAccommodationName = React.useMemo(() => {
    if (!selectedBooking || !activeSupplier) {
      return undefined;
    }

    const accommodations = supplierData.accommodations[activeSupplier.supplierId] ?? [];
    const accommodation = accommodations.find(acc => acc.accommodationId === selectedBooking.accommodationId);
    return accommodation?.accommodationName;
  }, [selectedBooking, activeSupplier, supplierData.accommodations]);

  // Gérer la touche Suppr pour ouvrir la modale de suppression
  React.useEffect(() => {
    if (!selectedBooking || isDeleteModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input, textarea, etc.
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Del') {
        e.preventDefault();
        setIsDeleteModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBooking, isDeleteModalOpen]);

  // Obtenir les modifications pour le fournisseur actif
  const modifiedRates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedRatesBySupplier[activeSupplier.supplierId] ?? new Set<string>();
  }, [activeSupplier, supplierData.modifiedRatesBySupplier]);

  const modifiedMinDuration = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedMinDurationBySupplier[activeSupplier.supplierId] ?? new Set<string>();
  }, [activeSupplier, supplierData.modifiedMinDurationBySupplier]);

  // Obtenir le selectedRateTypeId pour le fournisseur actif
  const selectedRateTypeId = React.useMemo(() => {
    if (!activeSupplier) return null;
    return supplierData.selectedRateTypeIdBySupplier[activeSupplier.supplierId] ?? null;
  }, [activeSupplier, supplierData.selectedRateTypeIdBySupplier]);

  // Helper pour extraire les données du fournisseur actif
  const stockByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.stockBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.stockBySupplierAndAccommodation]);

  const ratesByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.ratesBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.ratesBySupplierAndAccommodation]);

  const rateTypeLinksByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.rateTypeLinksBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.rateTypeLinksBySupplierAndAccommodation]);

  const minDurationByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.minDurationBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.minDurationBySupplierAndAccommodation]);

  const arrivalAllowedByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.arrivalAllowedBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.arrivalAllowedBySupplierAndAccommodation]);

  const modifiedArrivalAllowed = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedArrivalAllowedBySupplier[activeSupplier.supplierId] ?? new Set<string>();
  }, [activeSupplier, supplierData.modifiedArrivalAllowedBySupplier]);

  const bookingsByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.bookingsBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
  }, [activeSupplier, supplierData.bookingsBySupplierAndAccommodation]);

  // Calculer les jours non réservables pour chaque hébergement
  const nonReservableDaysByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    
    const result: Record<number, Set<string>> = {};
    const accommodations = supplierData.accommodations[activeSupplier.supplierId] ?? [];
    
    for (const acc of accommodations) {
      const stockByDate = stockByAccommodation[acc.accommodationId] ?? {};
      const minDurationByDate = minDurationByAccommodation[acc.accommodationId] ?? {};
      const ratesByDate = ratesByAccommodation[acc.accommodationId];
      
      const nonReservableDays = getNonReservableDays(
        stockByDate,
        minDurationByDate,
        ratesByDate,
        selectedRateTypeId,
        startDate,
        endDate
      );
      
      result[acc.accommodationId] = nonReservableDays;
    }
    
    return result;
  }, [activeSupplier, stockByAccommodation, minDurationByAccommodation, ratesByAccommodation, selectedRateTypeId, startDate, endDate, supplierData]);

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((
    newPrice: number,
    editAllSelection: boolean = false,
    editingCell: { accId: number; dateStr: string } | null = null
  ) => {
    if (!activeSupplier || selectedRateTypeId === null) return;
    const modifications = new Set<string>();
    const datesToCheckForDureeMin: Array<{ accId: number; dateStr: string }> = [];
    
    supplierData.setRatesBySupplierAndAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.supplierId] ?? {};
      
      if (editAllSelection && editingCell) {
        // CTRL+clic : appliquer à toute la sélection, mais uniquement aux hébergements visibles (sélectionnés dans le filtre)
        for (const cellKey of selectedCells) {
          const [accIdStr, dateStr] = cellKey.split('|');
          const accId = parseInt(accIdStr, 10);
          if (isNaN(accId) || !dateStr) continue;
          
          // Filtrer : ne modifier que les hébergements sélectionnés dans le filtre
          if (selectedAccommodations.size > 0 && !selectedAccommodations.has(accId)) {
            continue;
          }
          
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          if (!supplierDataState[accId][dateStr]) {
            supplierDataState[accId][dateStr] = {};
          }
          supplierDataState[accId][dateStr][selectedRateTypeId] = newPrice;
          modifications.add(`${accId}-${dateStr}-${selectedRateTypeId}`);
          datesToCheckForDureeMin.push({ accId, dateStr });
        }
      } else if (editingCell) {
        // Clic normal : appliquer seulement à la cellule en cours d'édition
        const { accId, dateStr } = editingCell;
        if (!supplierDataState[accId]) {
          supplierDataState[accId] = {};
        }
        if (!supplierDataState[accId][dateStr]) {
          supplierDataState[accId][dateStr] = {};
        }
        supplierDataState[accId][dateStr][selectedRateTypeId] = newPrice;
        modifications.add(`${accId}-${dateStr}-${selectedRateTypeId}`);
        datesToCheckForDureeMin.push({ accId, dateStr });
      }
      
      return { ...updated, [activeSupplier.supplierId]: supplierDataState };
    });
    
    // Marquer comme modifié après la mise à jour des prix (pour le fournisseur actif)
    supplierData.setModifiedRatesBySupplier(prev => {
      const current = prev[activeSupplier.supplierId] ?? new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.supplierId]: newMod };
    });
    
    // Vérifier et forcer la durée minimale à 1 si elle n'est pas définie pour chaque date modifiée
    const currentDureeMinByAccommodation = supplierData.minDurationBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
    const minDurationModifications = new Set<string>();
    
    for (const { accId, dateStr } of datesToCheckForDureeMin) {
      const currentDureeMin = currentDureeMinByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId];
      
      // Si la durée minimale n'est pas définie (null, undefined, ou 0), forcer à 1
      if (currentDureeMin === null || currentDureeMin === undefined || currentDureeMin === 0) {
        // Mettre à jour la durée minimale
        supplierData.setMinDurationByAccommodation(prev => {
          const updated = { ...prev };
          const supplierDataState = updated[activeSupplier.supplierId] ?? {};
          
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          if (!supplierDataState[accId][dateStr]) {
            supplierDataState[accId][dateStr] = {} as Record<number, number | null>;
          }
          supplierDataState[accId][dateStr][selectedRateTypeId] = 1;
          
          return { ...updated, [activeSupplier.supplierId]: supplierDataState };
        });
        
        // Marquer comme modifié
        minDurationModifications.add(`${accId}-${dateStr}`);
      }
    }
    
    // Marquer les durées minimales comme modifiées
    if (minDurationModifications.size > 0) {
      supplierData.setModifiedMinDurationBySupplier(prev => {
        const current = prev[activeSupplier.supplierId] ?? new Set<string>();
        const newMod = new Set(current);
        for (const mod of minDurationModifications) {
          newMod.add(mod);
        }
        return { ...prev, [activeSupplier.supplierId]: newMod };
      });
    }
  }, [selectedCells, selectedAccommodations, activeSupplier, selectedRateTypeId, supplierData]);

  // Fonction pour mettre à jour la durée minimale localement
  const handleMinDurationUpdate = React.useCallback((
    newDureeMin: number | null,
    editAllSelection: boolean = false,
    editingCell: { accId: number; dateStr: string } | null = null
  ) => {
    if (!activeSupplier) return;
    const modifications = new Set<string>();
    if (!selectedRateTypeId) return; // Ne peut pas modifier minDuration sans type de tarif sélectionné
    
    supplierData.setMinDurationByAccommodation(prev => {
      const updated = { ...prev };
      // Créer une copie profonde de l'état du fournisseur pour que React détecte le changement
      const existingState = updated[activeSupplier.supplierId] ?? {};
      const supplierDataState: Record<number, Record<string, Record<number, number | null>>> = {};
      
      // Copier toutes les données existantes
      for (const [accIdStr, datesMap] of Object.entries(existingState)) {
        const accId = parseInt(accIdStr, 10);
        if (!isNaN(accId)) {
          supplierDataState[accId] = {};
          for (const [dateStr, rateTypesMap] of Object.entries(datesMap)) {
            // Vérifier si c'est l'ancien format (number | null) ou le nouveau (Record<number, number | null>)
            if (typeof rateTypesMap === 'object' && rateTypesMap !== null && !Array.isArray(rateTypesMap)) {
              supplierDataState[accId][dateStr] = { ...(rateTypesMap as Record<number, number | null>) };
            } else {
              // Migration de l'ancien format
              supplierDataState[accId][dateStr] = {};
            }
          }
        }
      }
      
      if (editAllSelection && editingCell) {
        // CTRL+clic : appliquer à toute la sélection, mais uniquement aux hébergements visibles (sélectionnés dans le filtre)
        for (const cellKey of selectedCells) {
          const [accIdStr, dateStr] = cellKey.split('|');
          const accId = parseInt(accIdStr, 10);
          if (isNaN(accId) || !dateStr) continue;
          
          // Filtrer : ne modifier que les hébergements sélectionnés dans le filtre
          if (selectedAccommodations.size > 0 && !selectedAccommodations.has(accId)) {
            continue;
          }
          
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          } else {
            // Créer une copie de l'objet dates pour cet hébergement
            supplierDataState[accId] = { ...supplierDataState[accId] };
          }
          if (!supplierDataState[accId][dateStr]) {
            supplierDataState[accId][dateStr] = {};
          } else {
            supplierDataState[accId][dateStr] = { ...supplierDataState[accId][dateStr] };
          }
          supplierDataState[accId][dateStr][selectedRateTypeId] = newDureeMin;
          modifications.add(`${accId}-${dateStr}`);
        }
      } else if (editingCell) {
        // Clic normal : appliquer seulement à la cellule en cours d'édition
        const { accId, dateStr } = editingCell;
        if (!supplierDataState[accId]) {
          supplierDataState[accId] = {};
        } else {
          // Créer une copie de l'objet dates pour cet hébergement
          supplierDataState[accId] = { ...supplierDataState[accId] };
        }
        if (!supplierDataState[accId][dateStr]) {
          supplierDataState[accId][dateStr] = {};
        } else {
          supplierDataState[accId][dateStr] = { ...supplierDataState[accId][dateStr] };
        }
        supplierDataState[accId][dateStr][selectedRateTypeId] = newDureeMin;
        modifications.add(`${accId}-${dateStr}`);
      }
      
      return { ...updated, [activeSupplier.supplierId]: supplierDataState };
    });
    // Marquer comme modifié après la mise à jour de la durée minimale (pour le fournisseur actif)
    supplierData.setModifiedMinDurationBySupplier(prev => {
      const current = prev[activeSupplier.supplierId] ?? new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.supplierId]: newMod };
    });
  }, [selectedCells, selectedAccommodations, activeSupplier, supplierData]);

  // Fonction pour mettre à jour arrivalAllowed localement
  const handleArrivalAllowedUpdate = React.useCallback((
    accId: number,
    dateStr: string,
    isAllowed: boolean,
    editAllSelection: boolean = false
  ) => {
    if (!activeSupplier || selectedRateTypeId === null || !supplierData) {
      return;
    }
    
      if (!supplierData.setArrivalAllowedByAccommodation || typeof supplierData.setArrivalAllowedByAccommodation !== 'function') {
      return;
    }
    
    try {
      const modifications = new Set<string>();
      
      // Mettre à jour arrivalAllowed
      supplierData.setArrivalAllowedByAccommodation(prev => {
      const updated = { ...prev };
      const existingState = updated[activeSupplier.supplierId] ?? {};
      const supplierDataState: Record<number, Record<string, Record<number, boolean>>> = {};
      
      // Copier toutes les données existantes
      for (const [accIdStr, datesMap] of Object.entries(existingState)) {
        const accId = parseInt(accIdStr, 10);
        if (!isNaN(accId)) {
          supplierDataState[accId] = {};
          for (const [dateStr, rateTypesMap] of Object.entries(datesMap)) {
            if (typeof rateTypesMap === 'object' && rateTypesMap !== null && !Array.isArray(rateTypesMap)) {
              supplierDataState[accId][dateStr] = { ...(rateTypesMap as Record<number, boolean>) };
            } else {
              supplierDataState[accId][dateStr] = {};
            }
          }
        }
      }
      
      if (editAllSelection) {
        // Appliquer à toute la sélection, mais uniquement aux hébergements visibles (sélectionnés dans le filtre)
        for (const cellKey of selectedCells) {
          const [accIdStr, dateStrFromSelection] = cellKey.split('|');
          const accIdFromSelection = parseInt(accIdStr, 10);
          if (isNaN(accIdFromSelection) || !dateStrFromSelection) continue;
          
          // Filtrer : ne modifier que les hébergements sélectionnés dans le filtre
          if (selectedAccommodations.size > 0 && !selectedAccommodations.has(accIdFromSelection)) {
            continue;
          }
          
          if (!supplierDataState[accIdFromSelection]) {
            supplierDataState[accIdFromSelection] = {};
          } else {
            supplierDataState[accIdFromSelection] = { ...supplierDataState[accIdFromSelection] };
          }
          if (!supplierDataState[accIdFromSelection][dateStrFromSelection]) {
            supplierDataState[accIdFromSelection][dateStrFromSelection] = {};
          } else {
            supplierDataState[accIdFromSelection][dateStrFromSelection] = { ...supplierDataState[accIdFromSelection][dateStrFromSelection] };
          }
          supplierDataState[accIdFromSelection][dateStrFromSelection][selectedRateTypeId] = isAllowed;
          modifications.add(`${accIdFromSelection}-${dateStrFromSelection}`);
        }
      } else {
        // Appliquer seulement à la cellule cliquée
        if (!supplierDataState[accId]) {
          supplierDataState[accId] = {};
        } else {
          supplierDataState[accId] = { ...supplierDataState[accId] };
        }
        if (!supplierDataState[accId][dateStr]) {
          supplierDataState[accId][dateStr] = {};
        } else {
          supplierDataState[accId][dateStr] = { ...supplierDataState[accId][dateStr] };
        }
        supplierDataState[accId][dateStr][selectedRateTypeId] = isAllowed;
        modifications.add(`${accId}-${dateStr}`);
      }
      
      return { ...updated, [activeSupplier.supplierId]: supplierDataState } as Record<number, Record<number, Record<string, boolean>>>;
    });
    
    // Marquer comme modifié
    supplierData.setModifiedArrivalAllowedBySupplier(prev => {
      const current = prev[activeSupplier.supplierId] ?? new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.supplierId]: newMod };
    });
    } catch (error) {
      throw error;
    }
  }, [selectedCells, selectedAccommodations, activeSupplier, selectedRateTypeId, supplierData?.setArriveeAutoriseeByAccommodation, supplierData?.setModifiedArriveeAutoriseeBySupplier]);

  // Fonction pour sauvegarder les modifications
  const handleSave = React.useCallback(async () => {
    if (!activeSupplier) return;
    if (modifiedRates.size === 0 && modifiedMinDuration.size === 0 && modifiedArrivalAllowed.size === 0) return;
    
    setSaving(true);
    supplierData.setError(null);
    
    try {
      // Collecter les modifications et les transformer en structure bulk
      const accommodationsMap = new Map<number, Map<string, { rateTypeId?: number; price?: number; minDuration?: number | null; arrivalAllowed?: boolean }>>();
      
      // Traiter les modifications de tarifs
      // Format de modKey: "${accommodationId}-${dateStr}-${rateTypeId}"
      // Exemple: "1-2025-11-20-1001"
      for (const modKey of modifiedRates) {
        // Trouver le dernier tiret pour séparer rateTypeId
        const lastDashIndex = modKey.lastIndexOf('-');
        if (lastDashIndex === -1) continue;
        
        const rateTypeIdStr = modKey.substring(lastDashIndex + 1);
        const rateTypeId = parseInt(rateTypeIdStr, 10);
        if (isNaN(rateTypeId)) continue;
        
        // Le reste avant le dernier tiret est "${accommodationId}-${dateStr}"
        const rest = modKey.substring(0, lastDashIndex);
        const firstDashIndex = rest.indexOf('-');
        if (firstDashIndex === -1) continue;
        
        const accommodationIdStr = rest.substring(0, firstDashIndex);
        const accommodationId = parseInt(accommodationIdStr, 10);
        if (isNaN(accommodationId)) continue;
        
        const dateStr = rest.substring(firstDashIndex + 1);
        
        if (!accommodationsMap.has(accommodationId)) {
          accommodationsMap.set(accommodationId, new Map());
        }
        const datesMap = accommodationsMap.get(accommodationId)!;
        
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, {});
        }
        const dateData = datesMap.get(dateStr)!;
        
        // Récupérer le prix depuis les données modifiées
        const price = ratesByAccommodation[accommodationId]?.[dateStr]?.[rateTypeId];
        if (price !== undefined) {
          dateData.rateTypeId = rateTypeId;
          dateData.price = price;
        }
      }
      
      // Traiter les modifications de durée minimale
      // Format de modKey: "${accommodationId}-${dateStr}"
      // Exemple: "1-2025-11-20"
      for (const modKey of modifiedMinDuration) {
        const firstDashIndex = modKey.indexOf('-');
        if (firstDashIndex === -1) continue;
        
        const accommodationIdStr = modKey.substring(0, firstDashIndex);
        const accommodationId = parseInt(accommodationIdStr, 10);
        if (isNaN(accommodationId)) continue;
        
        const dateStr = modKey.substring(firstDashIndex + 1);
        
        // Ne traiter que si on a un selectedRateTypeId
        if (selectedRateTypeId === null) continue;
        
        if (!accommodationsMap.has(accommodationId)) {
          accommodationsMap.set(accommodationId, new Map());
        }
        const datesMap = accommodationsMap.get(accommodationId)!;
        
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, {});
        }
        const dateData = datesMap.get(dateStr)!;
        
        // Récupérer la durée minimale depuis les données modifiées
        const minDuration = minDurationByAccommodation[accommodationId]?.[dateStr]?.[selectedRateTypeId];
        if (minDuration !== undefined) {
          dateData.minDuration = minDuration;
        }
        
        // Si on n'a pas encore de rateTypeId pour cette date, utiliser le selectedRateTypeId
        // ou le premier tarif existant pour cette date
        if (dateData.rateTypeId === undefined) {
          if (selectedRateTypeId !== null) {
            dateData.rateTypeId = selectedRateTypeId;
            // Si on a un prix pour ce rateTypeId et cette date, l'inclure aussi
            const price = ratesByAccommodation[accommodationId]?.[dateStr]?.[selectedRateTypeId];
            if (price !== undefined) {
              dateData.price = price;
            }
          } else {
            // Sinon, utiliser le premier tarif existant pour cette date
            const ratesForDate = ratesByAccommodation[accommodationId]?.[dateStr];
            if (ratesForDate) {
              const firstRateTypeId = Object.keys(ratesForDate)[0];
              if (firstRateTypeId) {
                dateData.rateTypeId = parseInt(firstRateTypeId, 10);
                dateData.price = ratesForDate[parseInt(firstRateTypeId, 10)];
              }
            }
          }
        }
      }
      
      // Traiter les modifications d'arrivée autorisée
      // Format de modKey: "${accommodationId}-${dateStr}"
      // Exemple: "1-2025-11-20"
      for (const modKey of modifiedArrivalAllowed) {
        const firstDashIndex = modKey.indexOf('-');
        if (firstDashIndex === -1) continue;
        
        const accommodationIdStr = modKey.substring(0, firstDashIndex);
        const accommodationId = parseInt(accommodationIdStr, 10);
        if (isNaN(accommodationId)) continue;
        
        const dateStr = modKey.substring(firstDashIndex + 1);
        
        // Ne traiter que si on a un selectedRateTypeId
        if (selectedRateTypeId === null) continue;
        
        if (!accommodationsMap.has(accommodationId)) {
          accommodationsMap.set(accommodationId, new Map());
        }
        const datesMap = accommodationsMap.get(accommodationId)!;
        
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, {});
        }
        const dateData = datesMap.get(dateStr)!;
        
        // Récupérer arrivalAllowed depuis les données modifiées
        const arrivalAllowed = arrivalAllowedByAccommodation[accommodationId]?.[dateStr]?.[selectedRateTypeId];
        if (arrivalAllowed !== undefined) {
          dateData.arrivalAllowed = arrivalAllowed;
        }
        
        // Si on n'a pas encore de rateTypeId pour cette date, utiliser le selectedRateTypeId
        // ou le premier tarif existant pour cette date
        if (dateData.rateTypeId === undefined) {
          if (selectedRateTypeId !== null) {
            dateData.rateTypeId = selectedRateTypeId;
            // Si on a un prix pour ce rateTypeId et cette date, l'inclure aussi
            const price = ratesByAccommodation[accommodationId]?.[dateStr]?.[selectedRateTypeId];
            if (price !== undefined) {
              dateData.price = price;
            }
          } else {
            // Sinon, utiliser le premier tarif existant pour cette date
            const ratesForDate = ratesByAccommodation[accommodationId]?.[dateStr];
            if (ratesForDate) {
              const firstRateTypeId = Object.keys(ratesForDate)[0];
              if (firstRateTypeId) {
                dateData.rateTypeId = parseInt(firstRateTypeId, 10);
                const price = ratesForDate[parseInt(firstRateTypeId, 10)];
                if (price !== undefined) {
                  dateData.price = price;
                }
              }
            }
          }
        }
      }
      
      // Transformer en structure bulk
      // IMPORTANT: Toujours inclure minDuration et arrivalAllowed depuis les données actuelles
      // même si elles n'ont pas été modifiées, pour préserver leurs valeurs lors de la mise à jour
      const bulkData: BulkUpdateRequest = {
        accommodations: Array.from(accommodationsMap.entries()).map(([accommodationId, datesMap]) => ({
          accommodationId,
          dates: Array.from(datesMap.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, data]) => {
              const rateTypeId = data.rateTypeId ?? selectedRateTypeId;
              
              // Récupérer les valeurs actuelles de minDuration et arrivalAllowed
              // depuis les données existantes si elles ne sont pas dans data
              const currentMinDuration = data.minDuration !== undefined
                ? data.minDuration
                : (rateTypeId !== null ? minDurationByAccommodation[accommodationId]?.[date]?.[rateTypeId] ?? null : null);
              
              const currentArrivalAllowed = data.arrivalAllowed !== undefined
                ? data.arrivalAllowed
                : (rateTypeId !== null ? arrivalAllowedByAccommodation[accommodationId]?.[date]?.[rateTypeId] ?? true : true);
              
              return {
                date,
                ...(rateTypeId !== undefined && rateTypeId !== null && data.price !== undefined ? {
                  rateTypeId,
                  price: data.price
                } : {}),
                // Toujours inclure minDuration et arrivalAllowed pour préserver leurs valeurs
                ...(rateTypeId !== null ? {
                  minDuration: currentMinDuration,
                  arrivalAllowed: currentArrivalAllowed
                } : {})
              };
            })
        }))
      };
      
      // Envoyer les modifications au backend
      await saveBulkUpdates(activeSupplier.supplierId, bulkData);
      
      // Réinitialiser les modifications après succès
      supplierData.setModifiedRatesBySupplier(prev => {
        const updated = { ...prev };
        updated[activeSupplier.supplierId] = new Set();
        return updated;
      });
      supplierData.setModifiedMinDurationBySupplier(prev => {
        const updated = { ...prev };
        updated[activeSupplier.supplierId] = new Set();
        return updated;
      });
      supplierData.setModifiedArrivalAllowedBySupplier(prev => {
        const updated = { ...prev };
        updated[activeSupplier.supplierId] = new Set();
        return updated;
      });
    } catch (error) {
      // Gérer les erreurs (affichage d'un message d'erreur)
      supplierData.setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [modifiedRates, modifiedMinDuration, modifiedArrivalAllowed, activeSupplier, ratesByAccommodation, minDurationByAccommodation, arrivalAllowedByAccommodation, selectedRateTypeId, supplierData]);

  // Fonction pour actualiser les données du fournisseur actif
  const handleRefreshData = React.useCallback(async () => {
    if (!activeSupplier) return;
    await supplierData.refreshSupplierData(activeSupplier.supplierId, startDate, endDate);
  }, [activeSupplier, startDate, endDate, supplierData]);

  // Fonction pour gérer la suppression d'une réservation
  // Définie après handleRefreshData pour éviter l'erreur d'initialisation
  const handleDeleteBooking = React.useCallback(async (booking: BookingDisplay) => {
    if (!activeSupplier || !booking) return;

    // Étape 1: Supprimer la réservation en DB (et dans le stub en test)
    // Passer les critères supplémentaires pour une recherche plus précise
      await deleteBooking(
      activeSupplier.supplierId,
      booking.bookingId,
      booking.accommodationId,
      booking.arrivalDate,
      booking.departureDate
    );

    // Étape 2: Calculer toutes les dates de la réservation (du arrivalDate inclus au departureDate exclus)
    const dates: string[] = [];
    const [startYear, startMonth, startDay] = booking.arrivalDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = booking.departureDate.split('-').map(Number);

    // Créer des dates en locale pour éviter les problèmes de fuseau horaire
    let currentDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    // Ajouter toutes les dates du premier jour inclus au dernier jour inclus (dateDepart est exclu)
    while (currentDate < endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Mettre le stock à 1 pour toutes les dates de la réservation supprimée
    if (dates.length > 0) {
      const stockPayload = {
        jours: dates.map(date => ({
          date,
          dispo: 1
        }))
      };

      await updateStock(activeSupplier.supplierId, booking.accommodationId, stockPayload);
    }

    // Étape 3: Rafraîchir les données
    await handleRefreshData();

    // Étape 4: Annuler la sélection de réservation
    setSelectedBookingId(null);

    // Étape 5: Fermer la modale
    setIsDeleteModalOpen(false);
  }, [activeSupplier, handleRefreshData]);

  // Poller l'état de synchronisation des réservations Direct toutes les 30 secondes
  // et déclencher un refresh automatique si l'état change
  useSyncStatusPolling(
    activeSupplier?.supplierId ?? null,
    handleRefreshData,
    30000 // 30 secondes
  );

  // Chargement initial des données pour tous les fournisseurs au montage du composant
  // Les données sont chargées pour 1 an, mais l'affichage est limité à [startDate; endDate]
  React.useEffect(() => {
    if (!hasAttemptedInitialLoad) {
      setHasAttemptedInitialLoad(true);
      supplierData.loadInitialData(suppliers, loadStartDate, loadEndDate)
        .finally(() => {
          setIsInitialLoad(false);
        });
    }
  }, [hasAttemptedInitialLoad]); // Seulement au montage du composant

  // Fonction pour retenter la connexion
  const handleRetryConnection = React.useCallback(() => {
    setIsInitialLoad(true);
    setHasAttemptedInitialLoad(false);
    supplierData.setError(null);
    // Le useEffect ci-dessus se déclenchera à nouveau car hasAttemptedInitialLoad redevient false
  }, [supplierData]);

  // Callback pour mettre à jour le selectedRateTypeId
  const handleSelectedRateTypeIdChange = React.useCallback((newRateTypeId: number | null) => {
    if (!activeSupplier) return;
    supplierData.setSelectedRateTypeIdBySupplier(prev => ({
      ...prev,
      [activeSupplier.supplierId]: newRateTypeId
    }));
  }, [activeSupplier, supplierData]);

  // Vérifier si la sélection est valide pour la réservation
  // Pour chaque hébergement, les dates doivent être consécutives (ou une seule date)
  // ET la durée de la sélection doit être >= à la durée minimale de chaque date
  // ET chaque date doit avoir un tarif défini pour le type de tarif sélectionné
  // ET chaque date doit avoir un stock disponible (stock > 0)
  // La validation ne considère que les hébergements sélectionnés dans le filtre
  const hasValidBookingSelection = React.useMemo(() => {
    return isValidBookingSelection(
      selectedCells, 
      minDurationByAccommodation, 
      selectedAccommodations,
      ratesByAccommodation,
      selectedRateTypeId,
      stockByAccommodation
    );
  }, [selectedCells, minDurationByAccommodation, selectedAccommodations, ratesByAccommodation, selectedRateTypeId, stockByAccommodation]);

  // Générer les récapitulatifs de réservation
  const bookingSummaries = React.useMemo(() => {
    if (!activeSupplier || !selectedRateTypeId || selectedCells.size === 0) return [];
    
    const accommodations = (supplierData.accommodations[activeSupplier.supplierId] ?? [])
      .filter(acc => selectedAccommodations.has(acc.accommodationId));
    
    return generateBookingSummaries(
      selectedCells,
      accommodations,
      ratesByAccommodation,
      selectedRateTypeId
    );
  }, [selectedCells, selectedAccommodations, activeSupplier, ratesByAccommodation, selectedRateTypeId, supplierData]);

  // Détecter les dates non disponibles (stock à 0) dans la sélection
  const unavailableDatesByAccommodation = React.useMemo(() => {
    if (!activeSupplier || selectedCells.size === 0) {
      return {} as Record<number, Set<string>>;
    }

    const result: Record<number, Set<string>> = {};

    for (const cellKey of selectedCells) {
      const [accIdStr, dateStr] = cellKey.split('|');
      const accId = parseInt(accIdStr, 10);
      
      if (isNaN(accId) || !dateStr) continue;

      // Vérifier le stock pour cette cellule
      const stock = stockByAccommodation[accId]?.[dateStr] ?? 0;
      
      // Si le stock est à 0, ajouter cette date aux dates non disponibles
      if (stock === 0) {
        if (!result[accId]) {
          result[accId] = new Set<string>();
        }
        result[accId].add(dateStr);
      }
    }

    return result;
  }, [selectedCells, stockByAccommodation, activeSupplier]);

  // Compter le nombre total de dates non disponibles
  const unavailableDatesCount = React.useMemo(() => {
    let count = 0;
    for (const dates of Object.values(unavailableDatesByAccommodation)) {
      count += dates.size;
    }
    return count;
  }, [unavailableDatesByAccommodation]);

  // Détecter les dates disponibles (stock > 0) dans la sélection
  const availableDatesByAccommodation = React.useMemo(() => {
    if (!activeSupplier || selectedCells.size === 0) {
      return {} as Record<number, Set<string>>;
    }

    const result: Record<number, Set<string>> = {};

    for (const cellKey of selectedCells) {
      const [accIdStr, dateStr] = cellKey.split('|');
      const accId = parseInt(accIdStr, 10);
      
      if (isNaN(accId) || !dateStr) continue;

      // Vérifier le stock pour cette cellule
      const stock = stockByAccommodation[accId]?.[dateStr] ?? 0;
      
      // Si le stock est > 0, ajouter cette date aux dates disponibles
      if (stock > 0) {
        if (!result[accId]) {
          result[accId] = new Set<string>();
        }
        result[accId].add(dateStr);
      }
    }

    return result;
  }, [selectedCells, stockByAccommodation, activeSupplier]);

  // Compter le nombre total de dates disponibles
  const availableDatesCount = React.useMemo(() => {
    let count = 0;
    for (const dates of Object.values(availableDatesByAccommodation)) {
      count += dates.size;
    }
    return count;
  }, [availableDatesByAccommodation]);

  // Calculer toutes les dates occupées par réservation, groupées par hébergement
  const bookedDatesByAccommodation = React.useMemo(() => {
    if (!activeSupplier) {
      return {} as Record<number, Set<string>>;
    }

    const result: Record<number, Set<string>> = {};

    // Parcourir toutes les réservations pour chaque hébergement
    for (const [accIdStr, bookings] of Object.entries(bookingsByAccommodation)) {
      const accId = parseInt(accIdStr, 10);
      if (isNaN(accId) || !Array.isArray(bookings)) continue;

      if (!result[accId]) {
        result[accId] = new Set<string>();
      }

      for (const booking of bookings) {
        // Calculer toutes les dates occupées (du arrivalDate inclus au departureDate exclus)
        const startDate = new Date(booking.arrivalDate);
        const endDate = new Date(booking.departureDate);
        let currentDate = new Date(startDate);

        // Le jour de départ est exclu car c'est le jour où on quitte (dernière nuit = dateDepart - 1 jour)
        while (currentDate < endDate) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          result[accId].add(dateStr);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return result;
  }, [activeSupplier, bookingsByAccommodation]);

  // Fonction pour ouvrir (réactiver) les dates non disponibles
  // Définie après unavailableDatesCount et unavailableDatesByAccommodation pour éviter l'erreur d'initialisation
  const handleOpenUnavailable = React.useCallback(async () => {
    if (!activeSupplier || unavailableDatesCount === 0) return;
    
    setSaving(true);
    supplierData.setError(null);
    
    const errors: string[] = [];
    let successCount = 0;
    
    try {
      // Pour chaque hébergement avec des dates non disponibles
      for (const [accIdStr, dates] of Object.entries(unavailableDatesByAccommodation)) {
        const accId = parseInt(accIdStr, 10);
        if (isNaN(accId) || dates.size === 0) continue;
        
        try {
          // Créer le payload pour mettre le stock à 1 pour toutes les dates non disponibles
          const stockPayload = {
            jours: Array.from(dates).map(dateStr => ({
              date: dateStr,
              dispo: 1
            }))
          };
          
          // Mettre à jour le stock dans OpenPro
          await updateStock(activeSupplier.supplierId, accId, stockPayload);
          successCount += dates.size;
        } catch (error) {
          const errorMsg = `Erreur pour l'hébergement ${accId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          errors.push(errorMsg);
        }
      }
      
      if (errors.length > 0) {
        // Si certaines mises à jour ont échoué
        const partialError = `Certaines dates n'ont pas pu être ouvertes (${successCount}/${unavailableDatesCount} réussies). ${errors.join('; ')}`;
        supplierData.setError(partialError);
      } else if (successCount > 0) {
        // Si toutes les mises à jour ont réussi, rafraîchir les données
        await handleRefreshData();
      }
    } catch (error) {
      // Gérer les erreurs globales
      supplierData.setError(error instanceof Error ? error.message : 'Erreur lors de l\'ouverture des dates');
    } finally {
      setSaving(false);
    }
  }, [activeSupplier, unavailableDatesCount, unavailableDatesByAccommodation, supplierData, handleRefreshData]);

  // Fonction pour fermer (mettre à 0) les dates disponibles
  // Définie après availableDatesCount et availableDatesByAccommodation pour éviter l'erreur d'initialisation
  const handleCloseAvailable = React.useCallback(async () => {
    if (!activeSupplier || availableDatesCount === 0) return;
    
    setSaving(true);
    supplierData.setError(null);
    
    const errors: string[] = [];
    let successCount = 0;
    
    try {
      // Pour chaque hébergement avec des dates disponibles
      for (const [accIdStr, dates] of Object.entries(availableDatesByAccommodation)) {
        const accId = parseInt(accIdStr, 10);
        if (isNaN(accId) || dates.size === 0) continue;
        
        try {
          // Créer le payload pour mettre le stock à 0 pour toutes les dates disponibles
          const stockPayload = {
            jours: Array.from(dates).map(dateStr => ({
              date: dateStr,
              dispo: 0
            }))
          };
          
          // Mettre à jour le stock dans OpenPro
          await updateStock(activeSupplier.supplierId, accId, stockPayload);
          successCount += dates.size;
        } catch (error) {
          const errorMsg = `Erreur pour l'hébergement ${accId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          errors.push(errorMsg);
        }
      }
      
      if (errors.length > 0) {
        // Si certaines mises à jour ont échoué
        const partialError = `Certaines dates n'ont pas pu être fermées (${successCount}/${availableDatesCount} réussies). ${errors.join('; ')}`;
        supplierData.setError(partialError);
      } else if (successCount > 0) {
        // Si toutes les mises à jour ont réussi, rafraîchir les données
        await handleRefreshData();
      }
    } catch (error) {
      // Gérer les erreurs globales
      supplierData.setError(error instanceof Error ? error.message : 'Erreur lors de la fermeture des dates');
    } finally {
      setSaving(false);
    }
  }, [activeSupplier, availableDatesCount, availableDatesByAccommodation, supplierData, handleRefreshData]);

  // Fonction pour remettre la date de début à aujourd'hui en maintenant l'écart
  const handleResetToToday = React.useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    
    // Calculer l'écart en jours entre startDate et endDate
    const startDateObj = new Date(startInput);
    const endDateObj = new Date(endInput);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      // Si les dates sont invalides, mettre simplement aujourd'hui et un mois plus tard
      setStartInput(todayStr);
      const oneMonthLater = addMonths(today, 1);
      setEndInput(formatDate(oneMonthLater));
      return;
    }
    
    // Normaliser les dates à minuit pour le calcul
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);
    
    // Calculer l'écart en jours
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Mettre à jour la date de début à aujourd'hui
    setStartInput(todayStr);
    
    // Calculer la nouvelle date de fin en maintenant l'écart
    const newEndDate = addDays(today, diffDays);
    const newEndDateStr = formatDate(newEndDate);
    setEndInput(newEndDateStr);
  }, [startInput, endInput, setStartInput, setEndInput]);

  // Référence pour obtenir les jours sélectionnés depuis DateRangeControls
  const getSelectedDaysRef = React.useRef<(() => Set<number>) | null>(null);

  // Fonction pour sélectionner les dates entre startDate et endDate selon les jours de la semaine sélectionnés
  // Respecte les règles de sélection : exclut les dates occupées par une réservation et les dates passées
  const handleSelectAllRange = React.useCallback((selectedDays: Set<number>) => {
    if (!activeSupplier) return;
    
    // Obtenir toutes les dates entre startDate et endDate
    const allDays = getDaysInRange(startDate, endDate);
    
    // Obtenir les hébergements à sélectionner
    // Si aucun hébergement n'est sélectionné, sélectionner tous les hébergements disponibles
    const accommodations = supplierData.accommodations[activeSupplier.supplierId] ?? [];
    const accommodationsToSelect = selectedAccommodations.size > 0
      ? accommodations.filter(acc => selectedAccommodations.has(acc.accommodationId))
      : accommodations;
    
    if (accommodationsToSelect.length === 0) return;
    
    // Créer toutes les clés de cellules pour la sélection
    // Exclure les dates occupées par une réservation, les dates passées, et les hébergements sans types de tarifs (règles de sélection)
    // Filtrer également selon les jours de la semaine sélectionnés
    const rateTypeLinksByAccommodation = supplierData.rateTypeLinksBySupplierAndAccommodation[activeSupplier.supplierId] ?? {};
    const newSelectedCells = new Set<string>();
    for (const acc of accommodationsToSelect) {
      // Vérifier si l'hébergement a des types de tarifs liés
      const accHasRateTypes = (rateTypeLinksByAccommodation[acc.accommodationId]?.length ?? 0) > 0;
      if (!accHasRateTypes) continue; // Ignorer les hébergements sans types de tarifs
      
      for (const date of allDays) {
        const dateStr = formatDate(date);
        
        // Vérifier si cette date est occupée par une réservation ou passée
        const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;
        const isPast = isPastDate(dateStr);
        
        // Calculer le jour de la semaine (0 = Lundi, 6 = Dimanche)
        // JavaScript getDay() retourne 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
        // On convertit pour avoir 0 = Lundi, 6 = Dimanche
        const dayOfWeek = (date.getDay() + 6) % 7;
        
        // Ne sélectionner que si le jour de la semaine est dans selectedDays
        // Et ne pas sélectionner les dates occupées ou passées (règles de sélection)
        if (selectedDays.has(dayOfWeek) && !isBooked && !isPast) {
          newSelectedCells.add(`${acc.accommodationId}|${dateStr}`);
        }
      }
    }
    
    // Mettre à jour la sélection (et désélectionner la réservation si une est sélectionnée)
    setSelectedCells(newSelectedCells);
    setSelectedBookingId(null);
  }, [activeSupplier, startDate, endDate, selectedAccommodations, supplierData, bookedDatesByAccommodation, setSelectedCells, rateTypeLinksByAccommodation]);

  // Gestionnaire pour tous les raccourcis clavier de l'interface principale
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas intercepter si l'utilisateur est en train de modifier du texte dans un input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return; // Laisser le comportement par défaut
      }
      
      // Ne pas intercepter si une modale est ouverte
      if (isBookingModalOpen || isDeleteModalOpen) {
        return;
      }
      
      // Ne pas intercepter si l'utilisateur est en train d'éditer une cellule
      // (vérification basée sur l'état d'édition, à adapter selon l'implémentation)
      
      // Ctrl+A ou Cmd+A (Mac) - Sélectionner toute la plage (tous les jours)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        // Sélectionner tous les jours (0 = Lundi, 6 = Dimanche)
        handleSelectAllRange(new Set([0, 1, 2, 3, 4, 5, 6]));
        return;
      }
      
      // Ctrl+S ou Cmd+S (Mac) - Sélectionner sur la plage selon les jours sélectionnés dans les checkboxes
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Utiliser les jours sélectionnés depuis DateRangeControls
        if (getSelectedDaysRef.current) {
          const selectedDays = getSelectedDaysRef.current();
          handleSelectAllRange(selectedDays);
        }
        return;
      }
      
      // Raccourcis simples
      const key = e.key.toLowerCase();
      
      // Raccourci 'r' - Réserver (sans modificateurs)
      if (key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (hasValidBookingSelection) {
          e.preventDefault();
          setIsBookingModalOpen(true);
        }
        return;
      }
      
      // Raccourci 'a' - Actualiser (sans modificateurs)
      if (key === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (!supplierData.loading && !saving) {
          e.preventDefault();
          handleRefreshData();
        }
        return;
      }
      
      // Raccourci '+' - Ouvrir (peut nécessiter Shift sur certains claviers)
      if ((e.key === '+' || e.key === '=') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (unavailableDatesCount > 0 && !supplierData.loading && !saving && handleOpenUnavailable) {
          e.preventDefault();
          handleOpenUnavailable();
        }
        return;
      }
      
      // Raccourci '-' - Fermer (peut nécessiter Shift sur certains claviers)
      if ((e.key === '-' || e.key === '_') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (availableDatesCount > 0 && !supplierData.loading && !saving && handleCloseAvailable) {
          e.preventDefault();
          handleCloseAvailable();
        }
        return;
      }
      
      // Raccourci 't' - Remettre la date de début à aujourd'hui
      if (key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handleResetToToday();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSelectAllRange, hasValidBookingSelection, isBookingModalOpen, isDeleteModalOpen, supplierData.loading, saving, unavailableDatesCount, availableDatesCount, handleOpenUnavailable, handleCloseAvailable, handleRefreshData, handleResetToToday]);

  // Gestionnaire pour Ctrl+scroll (ou Cmd+scroll sur Mac) pour modifier startDate et endDate en maintenant l'écart
  // Utilise la phase de capture pour intercepter avant Chrome (qui utilise Ctrl+scroll pour zoomer)
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      
      // Toujours empêcher le scroll de la page sur les inputs de type date
      // (le scroll sur ces champs est géré par leurs propres gestionnaires React)
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'date') {
        e.preventDefault();
        // Ne pas appeler stopPropagation() pour laisser les gestionnaires React locaux fonctionner
        return;
      }
      
      // Pour les autres inputs, textarea, etc., laisser le comportement par défaut
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Vérifier que Ctrl (ou Cmd sur Mac) est maintenu pour le reste
      if (!e.ctrlKey && !e.metaKey) {
        return; // Laisser le comportement par défaut (scroll normal)
      }

      // Ne pas intercepter si une modale est ouverte (utiliser les refs pour les valeurs les plus récentes)
      if (isBookingModalOpenRef.current || isDeleteModalOpenRef.current) {
        return;
      }

      // Empêcher le zoom de Chrome en appelant preventDefault()
      e.preventDefault();
      e.stopPropagation();

      // Utiliser les refs pour obtenir les valeurs les plus récentes
      const currentStartInput = startInputRef.current;
      const currentEndInput = endInputRef.current;

      // Calculer l'écart en jours entre startDate et endDate
      const startDateObj = new Date(currentStartInput);
      const endDateObj = new Date(currentEndInput);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return; // Dates invalides, ne rien faire
      }

      // Normaliser les dates à minuit pour le calcul
      startDateObj.setHours(0, 0, 0, 0);
      endDateObj.setHours(0, 0, 0, 0);

      // Calculer l'écart en jours
      const diffTime = endDateObj.getTime() - startDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Déterminer la direction du scroll (deltaY > 0 = scroll down, deltaY < 0 = scroll up)
      const delta = e.deltaY > 0 ? -1 : 1; // Scroll down = diminuer (-1), Scroll up = augmenter (+1)

      // Calculer la nouvelle startDate
      const newStartDate = addDays(startDateObj, delta);
      const newStartDateStr = formatDate(newStartDate);

      // Calculer la nouvelle endDate en maintenant l'écart
      const newEndDate = addDays(newStartDate, diffDays);
      const newEndDateStr = formatDate(newEndDate);

      // Mettre à jour les dates
      setStartInput(newStartDateStr);
      setEndInput(newEndDateStr);
    };

    // Utiliser capture: true pour intercepter en phase de capture (avant Chrome)
    // Utiliser passive: false pour pouvoir appeler preventDefault()
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []); // Dépendances vides car on utilise des refs

  // Déterminer si la modale de connexion doit être affichée
  // Elle doit être affichée si :
  // 1. On est en train de charger initialement, OU
  // 2. On a tenté de charger mais il y a une erreur ET aucune donnée n'a été chargée
  const shouldShowConnectionModal = isInitialLoad || 
    (hasAttemptedInitialLoad && supplierData.error !== null && Object.keys(supplierData.accommodations).length === 0);

  return (
    <div style={{ 
      padding: '16px', 
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      backgroundColor: darkTheme.bgPrimary,
      color: darkTheme.textPrimary
    }}>
      {/* Modale de connexion - bloquante au démarrage */}
      <ConnectionModal
        isOpen={shouldShowConnectionModal}
        isLoading={isInitialLoad && supplierData.loading}
        error={shouldShowConnectionModal && supplierData.error ? supplierData.error : null}
        onRetry={handleRetryConnection}
      />

      {/* Contenu principal - masqué si la modale est ouverte */}
      {!shouldShowConnectionModal && (
        <>
          <DateRangeControls
            startInput={startInput}
            onStartInputChange={setStartInput}
            endInput={endInput}
            onEndInputChange={setEndInput}
            onSelectAllRange={handleSelectAllRange}
            onResetToToday={handleResetToToday}
            onGetSelectedDays={(getter) => {
              getSelectedDaysRef.current = getter;
            }}
          />
          <SupplierTabs
            suppliers={suppliers}
            activeIdx={activeIdx}
            onActiveIdxChange={setActiveIdx}
          />

          {supplierData.loading && <div style={{ color: darkTheme.textSecondary }}>Chargement…</div>}
          {supplierData.error && <div style={{ color: darkTheme.error }}>Erreur: {supplierData.error}</div>}

      {activeSupplier && (
        <div>
          <AccommodationList
            accommodations={supplierData.accommodations[activeSupplier.supplierId] ?? []}
            selectedAccommodations={selectedAccommodations}
            onSelectedAccommodationsChange={setSelectedAccommodations}
          />
          
          <RateTypeSelector
            rateTypes={supplierData.rateTypesBySupplier[activeSupplier.supplierId] ?? []}
            rateTypeLabels={supplierData.rateTypeLabelsBySupplier[activeSupplier.supplierId] ?? {}}
            selectedRateTypeId={selectedRateTypeId}
            onSelectedRateTypeIdChange={handleSelectedRateTypeIdChange}
            onManageRateTypes={() => setIsRateTypeManagementModalOpen(true)}
          />
          {selectedAccommodations.size > 0 && (
            <>
              <CompactGrid
                startDate={startDate}
                endDate={endDate}
                accommodations={(supplierData.accommodations[activeSupplier.supplierId] ?? [])
                  .filter(acc => selectedAccommodations.has(acc.accommodationId))
                  .sort((a, b) => a.accommodationName.localeCompare(b.accommodationName))}
                stockByAccommodation={stockByAccommodation}
                ratesByAccommodation={ratesByAccommodation}
                rateTypeLinksByAccommodation={rateTypeLinksByAccommodation}
                minDurationByAccommodation={minDurationByAccommodation}
                arrivalAllowedByAccommodation={arrivalAllowedByAccommodation}
                bookingsByAccommodation={bookingsByAccommodation}
                selectedCells={selectedCells}
                onSelectedCellsChange={setSelectedCells}
                modifiedRates={modifiedRates}
                modifiedMinDuration={modifiedMinDuration}
                modifiedArrivalAllowed={modifiedArrivalAllowed}
                onRateUpdate={handleRateUpdate}
                onMinDurationUpdate={handleMinDurationUpdate}
                onArrivalAllowedUpdate={handleArrivalAllowedUpdate}
                selectedRateTypeId={selectedRateTypeId}
                nonReservableDaysByAccommodation={nonReservableDaysByAccommodation}
                bookedDatesByAccommodation={bookedDatesByAccommodation}
                selectedBookingId={selectedBookingId}
                onBookingClick={handleBookingClick}
              />
            </>
          )}
          
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {hasValidBookingSelection && (
              <button
                onClick={() => setIsBookingModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  background: darkTheme.buttonPrimaryBg,
                  color: darkTheme.buttonText,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: darkTheme.shadowSm,
                  minWidth: 120 // Largeur minimale pour éviter le clignotement
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkTheme.buttonPrimaryHover;
                  setReserveButtonHover(true);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkTheme.buttonPrimaryBg;
                  setReserveButtonHover(false);
                }}
              >
                {reserveButtonHover ? '⌨️ r' : 'Réserver'}
              </button>
            )}
            <ActionButtons
              loading={supplierData.loading || saving}
              modifiedRatesCount={modifiedRates.size}
              modifiedMinDurationCount={modifiedMinDuration.size}
              modifiedArrivalAllowedCount={modifiedArrivalAllowed.size}
              unavailableDatesCount={unavailableDatesCount}
              availableDatesCount={availableDatesCount}
              onRefresh={handleRefreshData}
              onSave={handleSave}
              onOpenUnavailable={handleOpenUnavailable}
              onCloseAvailable={handleCloseAvailable}
            />
          </div>
          
          <SelectionSummary
            selectedCells={selectedCells}
            selectedAccommodations={(supplierData.accommodations[activeSupplier.supplierId] ?? [])
              .filter(acc => selectedAccommodations.has(acc.accommodationId))}
            selectedRateTypeId={selectedRateTypeId}
            ratesByAccommodation={ratesByAccommodation}
            modifiedRates={modifiedRates}
            minDurationByAccommodation={minDurationByAccommodation}
          />
        </div>
      )}

      <AdminFooter />

      {/* Modale de réservation */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingSummaries={bookingSummaries}
        supplierId={activeSupplier?.supplierId ?? 0}
        onBookingCreated={handleRefreshData}
        onSelectionClear={handleClearSelection}
      />

          {/* Modale de suppression de réservation */}
          <DeleteBookingModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            booking={selectedBooking}
            accommodationName={selectedBookingAccommodationName}
            onConfirmDelete={handleDeleteBooking}
          />

          {/* Modale de gestion des types de tarif */}
          {activeSupplier && (
            <RateTypeManagementModal
              isOpen={isRateTypeManagementModalOpen}
              onClose={() => setIsRateTypeManagementModalOpen(false)}
              supplierId={activeSupplier.supplierId}
              accommodations={supplierData.accommodations[activeSupplier.supplierId] ?? []}
              onDataChanged={handleRefreshData}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ProviderCalendars;

