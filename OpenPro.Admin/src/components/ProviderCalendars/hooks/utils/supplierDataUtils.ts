/**
 * Utilitaires pour la gestion des données des fournisseurs
 * 
 * Ce fichier contient les fonctions utilitaires pour mettre à jour les états
 * après le chargement des données d'un fournisseur.
 */

import React from 'react';
import type { SupplierData } from '../../types';
import type { RateType } from '../../types';

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
  setRateTypeLabelsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Record<number, string>>>>;
  setRateTypesBySupplier: React.Dispatch<React.SetStateAction<Record<number, RateType[]>>>;
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
    setRateTypeLabelsBySupplier,
    setRateTypesBySupplier,
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

  setStockBySupplierAndAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.stock
  }));
  setRatesBySupplierAndAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.rates
  }));
  setPromoBySupplierAndAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.promo
  }));
  setRateTypesBySupplierAndAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.rateTypes
  }));
  setDureeMinByAccommodation(prev => ({
    ...prev,
    [idFournisseur]: data.dureeMin
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

