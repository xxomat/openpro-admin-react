/**
 * Utilitaires pour la gestion des données des fournisseurs
 * 
 * Ce fichier contient les fonctions utilitaires pour mettre à jour les états
 * après le chargement des données d'un fournisseur.
 */

import React from 'react';
import type { SupplierData, BookingDisplay } from '../../types';
import type { RateType } from '../../types';

/**
 * Paramètres pour la fonction updateSupplierDataStates
 * 
 * Contient tous les setters nécessaires pour mettre à jour les états
 * après le chargement des données d'un fournisseur.
 */
export interface UpdateSupplierDataParams {
  idFournisseur: number;
  data: SupplierData;
  accommodationsList: Array<{ idHebergement: number }>;
  setAccommodations: React.Dispatch<React.SetStateAction<Record<number, Array<{ idHebergement: number; nomHebergement: string }>>>>;
  setStockBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, number>>>>>;
  setRatesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, Record<number, number>>>>>>;
  setPromoBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, boolean>>>>>;
  setRateTypesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, string[]>>>>>;
  setDureeMinByAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, number | null>>>>>;
  setOccupationsBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, Record<number, Array<{ nbPers: number; prix: number }>>>>>>>;
  setRateTypeLabelsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Record<number, string>>>>;
  setRateTypesBySupplier: React.Dispatch<React.SetStateAction<Record<number, RateType[]>>>;
  setBookingsBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, BookingDisplay[]>>>>;
  setSelectedAccommodationsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<number>>>>;
  setSelectedRateTypeIdBySupplier: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  setModifiedRatesBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedDureeMinBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
}

/**
 * Met à jour tous les états après le chargement des données d'un fournisseur
 * 
 * @param params - Paramètres contenant les setters et les données à mettre à jour
 */
export function updateSupplierDataStates(params: UpdateSupplierDataParams): void {
  const {
    idFournisseur,
    data,
    accommodationsList,
    setAccommodations,
    setStockBySupplierAndAccommodation,
    setRatesBySupplierAndAccommodation,
    setPromoBySupplierAndAccommodation,
    setRateTypesBySupplierAndAccommodation,
    setDureeMinByAccommodation,
    setOccupationsBySupplierAndAccommodation,
    setRateTypeLabelsBySupplier,
    setRateTypesBySupplier,
    setBookingsBySupplierAndAccommodation,
    setSelectedAccommodationsBySupplier,
    setSelectedRateTypeIdBySupplier,
    setModifiedRatesBySupplier,
    setModifiedDureeMinBySupplier
  } = params;

  setAccommodations(prev => ({ ...prev, [idFournisseur]: accommodationsList }));
  
  setSelectedAccommodationsBySupplier(prev => ({
    ...prev,
    [idFournisseur]: new Set(accommodationsList.map(acc => acc.idHebergement))
  }));

  // Fusionner les données au lieu de les remplacer complètement
  // Cela préserve les données pour les dates en dehors de la plage actuellement chargée
  setStockBySupplierAndAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, number>> = {};
    
    // Fusionner les données existantes avec les nouvelles
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    // Mettre à jour avec les nouvelles données (écrase les dates existantes dans la plage)
    for (const accId in data.stock) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.stock[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  setRatesBySupplierAndAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, Record<number, number>>> = {};
    
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    for (const accId in data.rates) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.rates[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  setPromoBySupplierAndAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, boolean>> = {};
    
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    for (const accId in data.promo) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.promo[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  setRateTypesBySupplierAndAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, string[]>> = {};
    
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    for (const accId in data.rateTypes) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.rateTypes[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  setDureeMinByAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, number | null>> = {};
    
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    for (const accId in data.dureeMin) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.dureeMin[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  setOccupationsBySupplierAndAccommodation(prev => {
    const existing = prev[idFournisseur] ?? {};
    const updated: Record<number, Record<string, Record<number, Array<{ nbPers: number; prix: number }>>>> = {};
    
    for (const accId in existing) {
      updated[Number(accId)] = { ...existing[Number(accId)] };
    }
    
    for (const accId in data.occupations) {
      if (!updated[Number(accId)]) {
        updated[Number(accId)] = {};
      }
      updated[Number(accId)] = { ...updated[Number(accId)], ...data.occupations[Number(accId)] };
    }
    
    return {
      ...prev,
      [idFournisseur]: updated
    };
  });
  
  // Les réservations sont toujours remplacées complètement car elles peuvent changer
  setBookingsBySupplierAndAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.bookings
  }));
  setRateTypeLabelsBySupplier(prev => ({ ...prev, [idFournisseur]: data.rateTypeLabels }));
  setRateTypesBySupplier(prev => ({ ...prev, [idFournisseur]: data.rateTypesList }));

  if (data.rateTypesList.length > 0) {
    setSelectedRateTypeIdBySupplier(prev => {
      const current = prev[idFournisseur];
      if (current === null || current === undefined) {
        return { ...prev, [idFournisseur]: data.rateTypesList[0].idTypeTarif };
      }
      const exists = data.rateTypesList.some(t => t.idTypeTarif === current);
      if (!exists) {
        return { ...prev, [idFournisseur]: data.rateTypesList[0].idTypeTarif };
      }
      return prev;
    });
  }

  setModifiedRatesBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
  setModifiedDureeMinBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
}

