/**
 * Utilitaires pour la gestion des données des fournisseurs
 * 
 * Ce fichier contient les fonctions utilitaires pour mettre à jour les états
 * après le chargement des données d'un fournisseur.
 */

import React from 'react';
import type { SupplierData, BookingDisplay, RateType } from '@/types';

/**
 * Paramètres pour la fonction updateSupplierDataStates
 * 
 * Contient tous les setters nécessaires pour mettre à jour les états
 * après le chargement des données d'un fournisseur.
 */
export interface UpdateSupplierDataParams {
  supplierId: number;
  data: SupplierData;
  accommodationsList: Array<{ accommodationId: string }>;
  setAccommodations: React.Dispatch<React.SetStateAction<Record<number, Array<{ accommodationId: string; accommodationName: string }>>>>;
  setStockBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, number>>>>>;
  setRatesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, Record<number, number>>>>>>;
  setPromoBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, boolean>>>>>;
  setRateTypesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, string[]>>>>>;
  setMinDurationByAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, number | null>>>>>;
  setArrivalAllowedByAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, Record<string, boolean>>>>>;
  setRateTypeLabelsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Record<number, string>>>>;
  setRateTypesBySupplier: React.Dispatch<React.SetStateAction<Record<number, RateType[]>>>;
  setRateTypeLinksBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, number[]>>>>;
  setBookingsBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<string, BookingDisplay[]>>>>;
  setSelectedAccommodationsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setSelectedRateTypeIdBySupplier: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  setModifiedRatesBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedMinDurationBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedArrivalAllowedBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
}

/**
 * Met à jour tous les états après le chargement des données d'un fournisseur
 * 
 * @param params - Paramètres contenant les setters et les données à mettre à jour
 */
export function updateSupplierDataStates(params: UpdateSupplierDataParams): void {
  const {
    supplierId,
    data,
    accommodationsList,
    setAccommodations,
    setStockBySupplierAndAccommodation,
    setRatesBySupplierAndAccommodation,
    setPromoBySupplierAndAccommodation,
    setRateTypesBySupplierAndAccommodation,
    setMinDurationByAccommodation,
    setArrivalAllowedByAccommodation,
    setRateTypeLabelsBySupplier,
    setRateTypesBySupplier,
    setRateTypeLinksBySupplierAndAccommodation,
    setBookingsBySupplierAndAccommodation,
    setSelectedAccommodationsBySupplier,
    setSelectedRateTypeIdBySupplier,
    setModifiedRatesBySupplier,
    setModifiedMinDurationBySupplier,
    setModifiedArrivalAllowedBySupplier
  } = params;

  setAccommodations(prev => ({ ...prev, [supplierId]: accommodationsList }));
  
  setSelectedAccommodationsBySupplier(prev => ({
    ...prev,
    [supplierId]: new Set(accommodationsList.map(acc => acc.accommodationId))
  }));

  // Fusionner les données au lieu de les remplacer complètement
  // Cela préserve les données pour les dates en dehors de la plage actuellement chargée
  setStockBySupplierAndAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, number>> = {};
    
    // Fusionner les données existantes avec les nouvelles
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
    }
    
    // Mettre à jour avec les nouvelles données (écrase les dates existantes dans la plage)
    for (const accId in data.stock) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      updated[accId] = { ...updated[accId], ...data.stock[accId] };
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });
  
  setRatesBySupplierAndAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, Record<number, number>>> = {};
    
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
    }
    
    for (const accId in data.rates) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      updated[accId] = { ...updated[accId], ...data.rates[accId] };
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });
  
  setPromoBySupplierAndAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, boolean>> = {};
    
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
    }
    
    for (const accId in data.promo) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      updated[accId] = { ...updated[accId], ...data.promo[accId] };
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });
  
  setRateTypesBySupplierAndAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, string[]>> = {};
    
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
    }
    
    for (const accId in data.rateTypes) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      updated[accId] = { ...updated[accId], ...data.rateTypes[accId] };
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });
  
  setArrivalAllowedByAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, Record<number, boolean>>> = {};
    
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
    }
    
    // Initialiser arriveeAutorisee par défaut à true pour toutes les dates
    // Si les données du backend contiennent arriveeAutorisee, on les utilisera
    // Sinon, on initialise à true par défaut
    for (const accId in data.arrivalAllowed) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      // Fusionner les données existantes avec les nouvelles
      const existingDates = updated[accId] ?? {};
      const newDates = data.arrivalAllowed[accId] ?? {};
      updated[accId] = { ...existingDates, ...newDates };
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });

  setMinDurationByAccommodation(prev => {
    const existing = prev[supplierId] ?? {};
    const updated: Record<string, Record<string, Record<number, number | null>>> = {};
    
    for (const accId in existing) {
      updated[accId] = { ...existing[accId] };
      // S'assurer que chaque date a un objet Record<number, number | null>
      for (const dateStr in updated[accId]) {
        if (typeof updated[accId][dateStr] === 'number' || updated[accId][dateStr] === null) {
          // Migration de l'ancien format vers le nouveau
          const oldValue = updated[accId][dateStr] as number | null;
          updated[accId][dateStr] = {} as Record<number, number | null>;
          // On ne peut pas migrer sans connaître le selectedRateTypeId, donc on laisse vide
        }
      }
    }
    
    for (const accId in data.minDuration) {
      if (!updated[accId]) {
        updated[accId] = {};
      }
      // data.minDuration[accId] est maintenant Record<string, Record<number, number | null>>
      const accDureeMin = data.minDuration[accId];
      if (accDureeMin) {
        for (const dateStr in accDureeMin) {
          if (!updated[accId][dateStr]) {
            updated[accId][dateStr] = {};
          }
          // Copier tous les idTypeTarif pour cette date
          updated[accId][dateStr] = { ...updated[accId][dateStr], ...accDureeMin[dateStr] };
        }
      }
    }
    
    return {
      ...prev,
      [supplierId]: updated
    };
  });
  
  // Les réservations sont toujours remplacées complètement car elles peuvent changer
  setBookingsBySupplierAndAccommodation(prev => ({
    ...prev,
    [supplierId]: data.bookings
  }));
  setRateTypeLabelsBySupplier(prev => ({ ...prev, [supplierId]: data.rateTypeLabels }));
  setRateTypesBySupplier(prev => ({ ...prev, [supplierId]: data.rateTypesList }));
  // Les liaisons sont toujours remplacées complètement car elles peuvent changer
  setRateTypeLinksBySupplierAndAccommodation(prev => ({
    ...prev,
    [supplierId]: data.rateTypeLinksByAccommodation
  }));

  if (data.rateTypesList.length > 0) {
    setSelectedRateTypeIdBySupplier(prev => {
      const current = prev[supplierId];
      if (current === null || current === undefined) {
        return { ...prev, [supplierId]: data.rateTypesList[0].rateTypeId };
      }
      const exists = data.rateTypesList.some(t => t.rateTypeId === current);
      if (!exists) {
        return { ...prev, [supplierId]: data.rateTypesList[0].rateTypeId };
      }
      return prev;
    });
  }

  setModifiedRatesBySupplier(prev => ({ ...prev, [supplierId]: new Set() }));
  setModifiedMinDurationBySupplier(prev => ({ ...prev, [supplierId]: new Set() }));
  setModifiedArrivalAllowedBySupplier(prev => ({ ...prev, [supplierId]: new Set() }));
}

