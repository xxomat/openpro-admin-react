/**
 * Composant ProviderCalendars - Composant principal
 * 
 * Ce composant principal orchestre l'affichage des calendriers pour plusieurs fournisseurs.
 * Il gère les onglets de fournisseurs, la sélection d'hébergements, la sélection de dates,
 * et l'édition des tarifs et durées minimales. Il utilise le hook useSupplierData pour
 * la gestion des données et le composant CompactGrid pour l'affichage de la grille.
 */

import React from 'react';
import type { Supplier, BookingDisplay } from './types';
import { PlateformeReservation } from './types';
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
import { defaultSuppliers } from './config';
import { useSupplierData } from './hooks/useSupplierData';
import { useSyncStatusPolling } from './hooks/useSyncStatusPolling';
import { formatDate, addMonths } from './utils/dateUtils';
import { darkTheme } from './utils/theme';
import { saveBulkUpdates, type BulkUpdateRequest, updateStock, deleteBooking } from '../../services/api/backendClient';
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

  const supplierData = useSupplierData();

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
    return supplierData.selectedCellsBySupplier[activeSupplier.idFournisseur] ?? new Set<string>();
  }, [activeSupplier, supplierData.selectedCellsBySupplier]);

  // Obtenir la sélection d'hébergements pour le fournisseur actif
  const selectedAccommodations = React.useMemo(() => {
    if (!activeSupplier) return new Set<number>();
    return supplierData.selectedAccommodationsBySupplier[activeSupplier.idFournisseur] ?? new Set<number>();
  }, [activeSupplier, supplierData.selectedAccommodationsBySupplier]);

  // Fonction pour mettre à jour la sélection d'hébergements du fournisseur actif
  const setSelectedAccommodations = React.useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedAccommodationsBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] ?? new Set<number>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // État pour la réservation sélectionnée (uniquement Directe)
  const [selectedBookingId, setSelectedBookingId] = React.useState<number | null>(null);

  // Fonction pour mettre à jour la sélection de cellules du fournisseur actif
  // Vide automatiquement la sélection de réservation quand des dates sont sélectionnées
  const setSelectedCells = React.useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedCellsBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] ?? new Set<string>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      
      // Si la nouvelle sélection n'est pas vide, vider la sélection de réservation
      if (newSet.size > 0) {
        setSelectedBookingId(null);
      }
      
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // Fonction pour vider la sélection de dates
  const handleClearSelection = React.useCallback(() => {
    if (!activeSupplier) return;
    setSelectedCells(new Set<string>());
  }, [activeSupplier, setSelectedCells]);

  // Fonction pour gérer le clic sur une réservation
  const handleBookingClick = React.useCallback((booking: BookingDisplay) => {
    // Vérifier que la réservation est Directe (sécurité supplémentaire)
    if (booking.plateformeReservation !== PlateformeReservation.Directe) {
      return; // Ne pas sélectionner les réservations non Directe
    }

    // Si la réservation cliquée est déjà sélectionnée, désélectionner
    if (booking.idDossier === selectedBookingId) {
      setSelectedBookingId(null);
    } else {
      // Sinon, sélectionner cette réservation ET vider la sélection de dates
      setSelectedBookingId(booking.idDossier);
      // Vider la sélection de dates directement (sans passer par setSelectedCells pour éviter la récursion)
      if (activeSupplier) {
        supplierData.setSelectedCellsBySupplier(prev => ({
          ...prev,
          [activeSupplier.idFournisseur]: new Set<string>()
        }));
      }
    }
  }, [selectedBookingId, activeSupplier, supplierData]);

  // État pour la modale de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  // Trouver la réservation sélectionnée dans les données
  const selectedBooking = React.useMemo(() => {
    if (!activeSupplier || selectedBookingId === null || selectedBookingId === undefined) {
      return null;
    }

    const bookingsByAcc = supplierData.bookingsBySupplierAndAccommodation[activeSupplier.idFournisseur] ?? {};
    
    // Parcourir toutes les réservations pour trouver celle avec le bon idDossier
    for (const bookingsArray of Object.values(bookingsByAcc)) {
      const booking = bookingsArray.find(b => b.idDossier === selectedBookingId);
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

    const accommodations = supplierData.accommodations[activeSupplier.idFournisseur] ?? [];
    const accommodation = accommodations.find(acc => acc.idHebergement === selectedBooking.idHebergement);
    return accommodation?.nomHebergement;
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
    return supplierData.modifiedRatesBySupplier[activeSupplier.idFournisseur] ?? new Set<string>();
  }, [activeSupplier, supplierData.modifiedRatesBySupplier]);

  const modifiedDureeMin = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedDureeMinBySupplier[activeSupplier.idFournisseur] ?? new Set<string>();
  }, [activeSupplier, supplierData.modifiedDureeMinBySupplier]);

  // Obtenir le selectedRateTypeId pour le fournisseur actif
  const selectedRateTypeId = React.useMemo(() => {
    if (!activeSupplier) return null;
    return supplierData.selectedRateTypeIdBySupplier[activeSupplier.idFournisseur] ?? null;
  }, [activeSupplier, supplierData.selectedRateTypeIdBySupplier]);

  // Helper pour extraire les données du fournisseur actif
  const stockByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.stockBySupplierAndAccommodation[activeSupplier.idFournisseur] ?? {};
  }, [activeSupplier, supplierData.stockBySupplierAndAccommodation]);

  const ratesByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.ratesBySupplierAndAccommodation[activeSupplier.idFournisseur] ?? {};
  }, [activeSupplier, supplierData.ratesBySupplierAndAccommodation]);

  const dureeMinByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.dureeMinBySupplierAndAccommodation[activeSupplier.idFournisseur] ?? {};
  }, [activeSupplier, supplierData.dureeMinBySupplierAndAccommodation]);

  const bookingsByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.bookingsBySupplierAndAccommodation[activeSupplier.idFournisseur] ?? {};
  }, [activeSupplier, supplierData.bookingsBySupplierAndAccommodation]);

  // Calculer les jours non réservables pour chaque hébergement
  const nonReservableDaysByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    
    const result: Record<number, Set<string>> = {};
    const accommodations = supplierData.accommodations[activeSupplier.idFournisseur] ?? [];
    
    for (const acc of accommodations) {
      const stockByDate = stockByAccommodation[acc.idHebergement] ?? {};
      const dureeMinByDate = dureeMinByAccommodation[acc.idHebergement] ?? {};
      const ratesByDate = ratesByAccommodation[acc.idHebergement];
      
      const nonReservableDays = getNonReservableDays(
        stockByDate,
        dureeMinByDate,
        ratesByDate,
        selectedRateTypeId,
        startDate,
        endDate
      );
      
      result[acc.idHebergement] = nonReservableDays;
    }
    
    return result;
  }, [activeSupplier, stockByAccommodation, dureeMinByAccommodation, ratesByAccommodation, selectedRateTypeId, startDate, endDate, supplierData]);

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((
    newPrice: number,
    editAllSelection: boolean = false,
    editingCell: { accId: number; dateStr: string } | null = null
  ) => {
    if (!activeSupplier || selectedRateTypeId === null) return;
    const modifications = new Set<string>();
    supplierData.setRatesBySupplierAndAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.idFournisseur] ?? {};
      
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
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierDataState };
    });
    // Marquer comme modifié après la mise à jour des prix (pour le fournisseur actif)
    supplierData.setModifiedRatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] ?? new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedCells, selectedAccommodations, activeSupplier, selectedRateTypeId, supplierData]);

  // Fonction pour mettre à jour la durée minimale localement
  const handleDureeMinUpdate = React.useCallback((
    newDureeMin: number | null,
    editAllSelection: boolean = false,
    editingCell: { accId: number; dateStr: string } | null = null
  ) => {
    if (!activeSupplier) return;
    const modifications = new Set<string>();
    supplierData.setDureeMinByAccommodation(prev => {
      const updated = { ...prev };
      // Créer une copie profonde de l'état du fournisseur pour que React détecte le changement
      const existingState = updated[activeSupplier.idFournisseur] ?? {};
      const supplierDataState: Record<number, Record<string, number | null>> = {};
      
      // Copier toutes les données existantes
      for (const [accIdStr, datesMap] of Object.entries(existingState)) {
        const accId = parseInt(accIdStr, 10);
        if (!isNaN(accId)) {
          supplierDataState[accId] = { ...datesMap };
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
          supplierDataState[accId][dateStr] = newDureeMin;
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
        supplierDataState[accId][dateStr] = newDureeMin;
        modifications.add(`${accId}-${dateStr}`);
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierDataState };
    });
    // Marquer comme modifié après la mise à jour de la durée minimale (pour le fournisseur actif)
    supplierData.setModifiedDureeMinBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] ?? new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedCells, selectedAccommodations, activeSupplier, supplierData]);

  // Fonction pour sauvegarder les modifications
  const handleSave = React.useCallback(async () => {
    if (!activeSupplier) return;
    if (modifiedRates.size === 0 && modifiedDureeMin.size === 0) return;
    
    setSaving(true);
    supplierData.setError(null);
    
    try {
      // Collecter les modifications et les transformer en structure bulk
      const accommodationsMap = new Map<number, Map<string, { rateTypeId?: number; price?: number; dureeMin?: number | null }>>();
      
      // Traiter les modifications de tarifs
      // Format de modKey: "${idHebergement}-${dateStr}-${idTypeTarif}"
      // Exemple: "1-2025-11-20-1001"
      for (const modKey of modifiedRates) {
        // Trouver le dernier tiret pour séparer idTypeTarif
        const lastDashIndex = modKey.lastIndexOf('-');
        if (lastDashIndex === -1) continue;
        
        const rateTypeIdStr = modKey.substring(lastDashIndex + 1);
        const rateTypeId = parseInt(rateTypeIdStr, 10);
        if (isNaN(rateTypeId)) continue;
        
        // Le reste avant le dernier tiret est "${idHebergement}-${dateStr}"
        const rest = modKey.substring(0, lastDashIndex);
        const firstDashIndex = rest.indexOf('-');
        if (firstDashIndex === -1) continue;
        
        const idHebergementStr = rest.substring(0, firstDashIndex);
        const idHebergement = parseInt(idHebergementStr, 10);
        if (isNaN(idHebergement)) continue;
        
        const dateStr = rest.substring(firstDashIndex + 1);
        
        if (!accommodationsMap.has(idHebergement)) {
          accommodationsMap.set(idHebergement, new Map());
        }
        const datesMap = accommodationsMap.get(idHebergement)!;
        
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, {});
        }
        const dateData = datesMap.get(dateStr)!;
        
        // Récupérer le prix depuis les données modifiées
        const price = ratesByAccommodation[idHebergement]?.[dateStr]?.[rateTypeId];
        if (price !== undefined) {
          dateData.rateTypeId = rateTypeId;
          dateData.price = price;
        }
      }
      
      // Traiter les modifications de durée minimale
      // Format de modKey: "${idHebergement}-${dateStr}"
      // Exemple: "1-2025-11-20"
      for (const modKey of modifiedDureeMin) {
        const firstDashIndex = modKey.indexOf('-');
        if (firstDashIndex === -1) continue;
        
        const idHebergementStr = modKey.substring(0, firstDashIndex);
        const idHebergement = parseInt(idHebergementStr, 10);
        if (isNaN(idHebergement)) continue;
        
        const dateStr = modKey.substring(firstDashIndex + 1);
        
        if (!accommodationsMap.has(idHebergement)) {
          accommodationsMap.set(idHebergement, new Map());
        }
        const datesMap = accommodationsMap.get(idHebergement)!;
        
        if (!datesMap.has(dateStr)) {
          datesMap.set(dateStr, {});
        }
        const dateData = datesMap.get(dateStr)!;
        
        // Récupérer la durée minimale depuis les données modifiées
        const dureeMin = dureeMinByAccommodation[idHebergement]?.[dateStr];
        if (dureeMin !== undefined) {
          dateData.dureeMin = dureeMin;
        }
        
        // Si on n'a pas encore de rateTypeId pour cette date, utiliser le selectedRateTypeId
        // ou le premier tarif existant pour cette date
        if (dateData.rateTypeId === undefined) {
          if (selectedRateTypeId !== null) {
            dateData.rateTypeId = selectedRateTypeId;
            // Si on a un prix pour ce rateTypeId et cette date, l'inclure aussi
            const price = ratesByAccommodation[idHebergement]?.[dateStr]?.[selectedRateTypeId];
            if (price !== undefined) {
              dateData.price = price;
            }
          } else {
            // Sinon, utiliser le premier tarif existant pour cette date
            const ratesForDate = ratesByAccommodation[idHebergement]?.[dateStr];
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
      
      // Transformer en structure bulk
      const bulkData: BulkUpdateRequest = {
        accommodations: Array.from(accommodationsMap.entries()).map(([idHebergement, datesMap]) => ({
          idHebergement,
          dates: Array.from(datesMap.entries())
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, data]) => ({
              date,
              ...(data.rateTypeId !== undefined && data.price !== undefined ? {
                rateTypeId: data.rateTypeId,
                price: data.price
              } : {}),
              ...(data.dureeMin !== undefined ? { dureeMin: data.dureeMin } : {})
            }))
        }))
      };
      
      // Envoyer les modifications au backend
      await saveBulkUpdates(activeSupplier.idFournisseur, bulkData);
      
      // Réinitialiser les modifications après succès
      supplierData.setModifiedRatesBySupplier(prev => {
        const updated = { ...prev };
        updated[activeSupplier.idFournisseur] = new Set();
        return updated;
      });
      supplierData.setModifiedDureeMinBySupplier(prev => {
        const updated = { ...prev };
        updated[activeSupplier.idFournisseur] = new Set();
        return updated;
      });
    } catch (error) {
      // Gérer les erreurs (affichage d'un message d'erreur)
      supplierData.setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [modifiedRates, modifiedDureeMin, activeSupplier, ratesByAccommodation, dureeMinByAccommodation, supplierData]);

  // Fonction pour actualiser les données du fournisseur actif
  const handleRefreshData = React.useCallback(async () => {
    if (!activeSupplier) return;
    await supplierData.refreshSupplierData(activeSupplier.idFournisseur, startDate, endDate);
  }, [activeSupplier, startDate, endDate, supplierData]);

  // Fonction pour gérer la suppression d'une réservation
  // Définie après handleRefreshData pour éviter l'erreur d'initialisation
  const handleDeleteBooking = React.useCallback(async (booking: BookingDisplay) => {
    if (!activeSupplier || !booking) return;

    // Étape 1: Supprimer la réservation en DB (et dans le stub en test)
    // Passer les critères supplémentaires pour une recherche plus précise
    await deleteBooking(
      activeSupplier.idFournisseur,
      booking.idDossier,
      booking.idHebergement,
      booking.dateArrivee,
      booking.dateDepart
    );

    // Étape 2: Calculer toutes les dates de la réservation (du dateArrivee inclus au dateDepart exclus)
    const dates: string[] = [];
    const [startYear, startMonth, startDay] = booking.dateArrivee.split('-').map(Number);
    const [endYear, endMonth, endDay] = booking.dateDepart.split('-').map(Number);

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

      await updateStock(activeSupplier.idFournisseur, booking.idHebergement, stockPayload);
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
    activeSupplier?.idFournisseur ?? null,
    handleRefreshData,
    30000 // 30 secondes
  );

  // Chargement initial des données pour tous les fournisseurs au montage du composant
  // Les données sont chargées pour 1 an, mais l'affichage est limité à [startDate; endDate]
  React.useEffect(() => {
    supplierData.loadInitialData(suppliers, loadStartDate, loadEndDate);
  }, []); // Seulement au montage du composant

  // Callback pour mettre à jour le selectedRateTypeId
  const handleSelectedRateTypeIdChange = React.useCallback((newRateTypeId: number | null) => {
    if (!activeSupplier) return;
    supplierData.setSelectedRateTypeIdBySupplier(prev => ({
      ...prev,
      [activeSupplier.idFournisseur]: newRateTypeId
    }));
  }, [activeSupplier, supplierData]);

  // Vérifier si la sélection est valide pour la réservation
  // Pour chaque hébergement, les dates doivent être consécutives (ou une seule date)
  // ET la durée de la sélection doit être >= à la durée minimale de chaque date
  // ET chaque date doit avoir un tarif défini pour le type de tarif sélectionné
  // La validation ne considère que les hébergements sélectionnés dans le filtre
  const hasValidBookingSelection = React.useMemo(() => {
    return isValidBookingSelection(
      selectedCells, 
      dureeMinByAccommodation, 
      selectedAccommodations,
      ratesByAccommodation,
      selectedRateTypeId
    );
  }, [selectedCells, dureeMinByAccommodation, selectedAccommodations, ratesByAccommodation, selectedRateTypeId]);

  // Générer les récapitulatifs de réservation
  const bookingSummaries = React.useMemo(() => {
    if (!activeSupplier || !selectedRateTypeId || selectedCells.size === 0) return [];
    
    const accommodations = (supplierData.accommodations[activeSupplier.idFournisseur] ?? [])
      .filter(acc => selectedAccommodations.has(acc.idHebergement));
    
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
        // Calculer toutes les dates occupées (du dateArrivee inclus au dateDepart exclus)
        const startDate = new Date(booking.dateArrivee);
        const endDate = new Date(booking.dateDepart);
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
          await updateStock(activeSupplier.idFournisseur, accId, stockPayload);
          successCount += dates.size;
        } catch (error) {
          const errorMsg = `Erreur pour l'hébergement ${accId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
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
          await updateStock(activeSupplier.idFournisseur, accId, stockPayload);
          successCount += dates.size;
        } catch (error) {
          const errorMsg = `Erreur pour l'hébergement ${accId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
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

  return (
    <div style={{ 
      padding: '16px', 
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      backgroundColor: darkTheme.bgPrimary,
      color: darkTheme.textPrimary
    }}>
      <DateRangeControls
        startInput={startInput}
        onStartInputChange={setStartInput}
        endInput={endInput}
        onEndInputChange={setEndInput}
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
            accommodations={supplierData.accommodations[activeSupplier.idFournisseur] ?? []}
            selectedAccommodations={selectedAccommodations}
            onSelectedAccommodationsChange={setSelectedAccommodations}
          />
          
          {selectedAccommodations.size > 0 && (
            <>
              <RateTypeSelector
                rateTypes={supplierData.rateTypesBySupplier[activeSupplier.idFournisseur] ?? []}
                rateTypeLabels={supplierData.rateTypeLabelsBySupplier[activeSupplier.idFournisseur] ?? {}}
                selectedRateTypeId={selectedRateTypeId}
                onSelectedRateTypeIdChange={handleSelectedRateTypeIdChange}
              />
              <CompactGrid
                startDate={startDate}
                endDate={endDate}
                accommodations={(supplierData.accommodations[activeSupplier.idFournisseur] ?? [])
                  .filter(acc => selectedAccommodations.has(acc.idHebergement))
                  .sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement))}
                stockByAccommodation={stockByAccommodation}
                ratesByAccommodation={ratesByAccommodation}
                dureeMinByAccommodation={dureeMinByAccommodation}
                bookingsByAccommodation={bookingsByAccommodation}
                selectedCells={selectedCells}
                onSelectedCellsChange={setSelectedCells}
                modifiedRates={modifiedRates}
                modifiedDureeMin={modifiedDureeMin}
                onRateUpdate={handleRateUpdate}
                onDureeMinUpdate={handleDureeMinUpdate}
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
                  boxShadow: darkTheme.shadowSm
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkTheme.buttonPrimaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkTheme.buttonPrimaryBg;
                }}
              >
                Réserver
              </button>
            )}
            <ActionButtons
              loading={supplierData.loading || saving}
              modifiedRatesCount={modifiedRates.size}
              modifiedDureeMinCount={modifiedDureeMin.size}
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
            selectedAccommodations={(supplierData.accommodations[activeSupplier.idFournisseur] ?? [])
              .filter(acc => selectedAccommodations.has(acc.idHebergement))}
            selectedRateTypeId={selectedRateTypeId}
            ratesByAccommodation={ratesByAccommodation}
            modifiedRates={modifiedRates}
            dureeMinByAccommodation={dureeMinByAccommodation}
          />
        </div>
      )}

      <AdminFooter />

      {/* Modale de réservation */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingSummaries={bookingSummaries}
        idFournisseur={activeSupplier?.idFournisseur ?? 0}
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
    </div>
  );
}

export default ProviderCalendars;

