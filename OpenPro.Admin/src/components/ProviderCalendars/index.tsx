/**
 * Composant ProviderCalendars - Composant principal
 * 
 * Ce composant principal orchestre l'affichage des calendriers pour plusieurs fournisseurs.
 * Il gère les onglets de fournisseurs, la sélection d'hébergements, la sélection de dates,
 * et l'édition des tarifs et durées minimales. Il utilise le hook useSupplierData pour
 * la gestion des données et le composant CompactGrid pour l'affichage de la grille.
 */

import React from 'react';
import { createOpenProClient } from '@openpro-api-react/client';
import type { Supplier } from './types';
import { ActionButtons } from './components/ActionButtons';
import { AccommodationList } from './components/AccommodationList';
import { CompactGrid } from './components/CompactGrid';
import { DateRangeControls } from './components/DateRangeControls';
import { RateTypeSelector } from './components/RateTypeSelector';
import { SelectionSummary } from './components/SelectionSummary';
import { SupplierTabs } from './components/SupplierTabs';
import { defaultSuppliers, baseUrl, apiKey } from './config';
import { useSupplierData } from './hooks/useSupplierData';
import { formatDate, addMonths } from './utils/dateUtils';
import { darkTheme } from './utils/theme';

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

  const client = React.useMemo(
    () => createOpenProClient('admin', { baseUrl, apiKey }),
    []
  );

  const supplierData = useSupplierData(client);

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

  // Obtenir la sélection de dates pour le fournisseur actif
  const selectedDates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.selectedDatesBySupplier[activeSupplier.idFournisseur] ?? new Set<string>();
  }, [activeSupplier, supplierData.selectedDatesBySupplier]);

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

  // Fonction pour mettre à jour la sélection de dates du fournisseur actif
  const setSelectedDates = React.useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedDatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] ?? new Set<string>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier, supplierData]);

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

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((newPrice: number) => {
    if (!activeSupplier || selectedRateTypeId === null) return;
    const modifications = new Set<string>();
    supplierData.setRatesBySupplierAndAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.idFournisseur] ?? {};
      
      // Appliquer le prix à toutes les combinaisons date-hébergement sélectionnées pour le type tarif sélectionné
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          if (!supplierDataState[accId][dateStr]) {
            supplierDataState[accId][dateStr] = {};
          }
          supplierDataState[accId][dateStr][selectedRateTypeId] = newPrice;
          modifications.add(`${accId}-${dateStr}-${selectedRateTypeId}`);
        }
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
  }, [selectedDates, selectedAccommodations, activeSupplier, selectedRateTypeId, supplierData]);

  // Fonction pour mettre à jour la durée minimale localement
  const handleDureeMinUpdate = React.useCallback((newDureeMin: number | null) => {
    if (!activeSupplier) return;
    const modifications = new Set<string>();
    supplierData.setDureeMinByAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.idFournisseur] ?? {};
      
      // Appliquer la durée minimale à toutes les combinaisons date-hébergement sélectionnées
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          supplierDataState[accId][dateStr] = newDureeMin;
          modifications.add(`${accId}-${dateStr}`);
        }
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
  }, [selectedDates, selectedAccommodations, activeSupplier, supplierData]);

  // Fonction pour sauvegarder les modifications
  const handleSave = React.useCallback(async () => {
    if (!activeSupplier) return;
    if (modifiedRates.size === 0 && modifiedDureeMin.size === 0) return;
    
    // TODO: Implémenter l'appel API pour sauvegarder les tarifs et durées minimales
    // Après sauvegarde réussie, vider les modifications du fournisseur actif
  }, [modifiedRates, modifiedDureeMin, activeSupplier]);

  // Fonction pour actualiser les données du fournisseur actif
  const handleRefreshData = React.useCallback(async () => {
    if (!activeSupplier) return;
    await supplierData.refreshSupplierData(activeSupplier.idFournisseur, startDate, endDate);
  }, [activeSupplier, startDate, endDate, supplierData]);

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
                selectedDates={selectedDates}
                onSelectedDatesChange={setSelectedDates}
                modifiedRates={modifiedRates}
                modifiedDureeMin={modifiedDureeMin}
                onRateUpdate={handleRateUpdate}
                onDureeMinUpdate={handleDureeMinUpdate}
                selectedRateTypeId={selectedRateTypeId}
              />
            </>
          )}
          
          <ActionButtons
            loading={supplierData.loading}
            modifiedRatesCount={modifiedRates.size}
            modifiedDureeMinCount={modifiedDureeMin.size}
            onRefresh={handleRefreshData}
            onSave={handleSave}
          />
          
          <SelectionSummary
            selectedDates={selectedDates}
            selectedAccommodations={(supplierData.accommodations[activeSupplier.idFournisseur] ?? [])
              .filter(acc => selectedAccommodations.has(acc.idHebergement))}
            selectedRateTypeId={selectedRateTypeId}
            ratesByAccommodation={ratesByAccommodation}
            modifiedRates={modifiedRates}
          />
        </div>
      )}

    </div>
  );
}

export default ProviderCalendars;

