/**
 * Hook personnalisé useSupplierData
 * 
 * Ce hook gère toute la logique de state management pour les données des fournisseurs,
 * incluant le chargement des hébergements, du stock, des tarifs, et des types de tarifs.
 * Il gère également la sélection d'hébergements et de dates, ainsi que le suivi
 * des modifications locales.
 */

import React from 'react';
import type { ClientByRole } from '../../../../openpro-api-react/src/client/OpenProClient';
import type { Supplier, Accommodation, RateType } from '../types';
import { loadAccommodations, loadSupplierData } from '../services/dataLoader';
import { formatDate } from '../utils/dateUtils';

export interface UseSupplierDataReturn {
  // États de données
  accommodations: Record<number, Accommodation[]>;
  stockBySupplierAndAccommodation: Record<number, Record<number, Record<string, number>>>;
  ratesBySupplierAndAccommodation: Record<number, Record<number, Record<string, Record<number, number>>>>;
  promoBySupplierAndAccommodation: Record<number, Record<number, Record<string, boolean>>>;
  rateTypesBySupplierAndAccommodation: Record<number, Record<number, Record<string, string[]>>>;
  dureeMinBySupplierAndAccommodation: Record<number, Record<number, Record<string, number | null>>>;
  rateTypeLabelsBySupplier: Record<number, Record<number, string>>;
  rateTypesBySupplier: Record<number, RateType[]>;
  selectedRateTypeIdBySupplier: Record<number, number | null>;
  
  // États de sélection
  selectedAccommodationsBySupplier: Record<number, Set<number>>;
  selectedDatesBySupplier: Record<number, Set<string>>;
  
  // États de modification
  modifiedRatesBySupplier: Record<number, Set<string>>;
  modifiedDureeMinBySupplier: Record<number, Set<string>>;
  
  // États UI
  loading: boolean;
  error: string | null;
  
  // Setters
  setAccommodations: React.Dispatch<React.SetStateAction<Record<number, Accommodation[]>>>;
  setStockBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, number>>>>>;
  setRatesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, Record<number, number>>>>>>;
  setPromoBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, boolean>>>>>;
  setRateTypesBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, string[]>>>>>;
  setDureeMinByAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, Record<string, number | null>>>>>;
  setRateTypeLabelsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Record<number, string>>>>;
  setRateTypesBySupplier: React.Dispatch<React.SetStateAction<Record<number, RateType[]>>>;
  setSelectedRateTypeIdBySupplier: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  setSelectedAccommodationsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<number>>>>;
  setSelectedDatesBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedRatesBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedDureeMinBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Fonctions utilitaires
  refreshSupplierData: (idFournisseur: number, startDate: Date, monthsCount: number) => Promise<void>;
  loadInitialData: (suppliers: Supplier[], startDate: Date, monthsCount: number) => Promise<void>;
}

export function useSupplierData(client: ClientByRole<'admin'>): UseSupplierDataReturn {
  const [accommodations, setAccommodations] = React.useState<Record<number, Accommodation[]>>({});
  const [stockBySupplierAndAccommodation, setStockBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, number>>>
  >({});
  const [ratesBySupplierAndAccommodation, setRatesBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, Record<number, number>>>>
  >({});
  const [promoBySupplierAndAccommodation, setPromoBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, boolean>>>
  >({});
  const [rateTypesBySupplierAndAccommodation, setRateTypesBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, string[]>>>
  >({});
  const [dureeMinBySupplierAndAccommodation, setDureeMinByAccommodation] = React.useState<
    Record<number, Record<number, Record<string, number | null>>>
  >({});
  const [rateTypeLabelsBySupplier, setRateTypeLabelsBySupplier] = React.useState<
    Record<number, Record<number, string>>
  >({});
  const [rateTypesBySupplier, setRateTypesBySupplier] = React.useState<
    Record<number, RateType[]>
  >({});
  const [selectedRateTypeIdBySupplier, setSelectedRateTypeIdBySupplier] = React.useState<Record<number, number | null>>({});
  const [selectedAccommodationsBySupplier, setSelectedAccommodationsBySupplier] = React.useState<Record<number, Set<number>>>({});
  const [selectedDatesBySupplier, setSelectedDatesBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [modifiedRatesBySupplier, setModifiedRatesBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [modifiedDureeMinBySupplier, setModifiedDureeMinBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshSupplierData = React.useCallback(async (
    idFournisseur: number,
    startDate: Date,
    monthsCount: number
  ) => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les hébergements (toujours recharger pour avoir les données à jour)
      const accommodationsList = await loadAccommodations(client, idFournisseur, controller.signal);
      
      setAccommodations(prev => ({ ...prev, [idFournisseur]: accommodationsList }));
      
      // Sélectionner tous les hébergements du fournisseur actif après le rechargement
      setSelectedAccommodationsBySupplier(prev => ({
        ...prev,
        [idFournisseur]: new Set(accommodationsList.map(acc => acc.idHebergement))
      }));
      
      // Charger les données (stock, tarifs, etc.)
      const data = await loadSupplierData(client, idFournisseur, accommodationsList, startDate, monthsCount, controller.signal);
      
      // Mettre à jour les états avec la nouvelle structure indexée par fournisseur puis hébergement
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
      
      // Initialiser selectedRateTypeId pour le fournisseur actif
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
      
      // Réinitialiser les indicateurs visuels pour le fournisseur actif
      setModifiedRatesBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
      setModifiedDureeMinBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
      
    } catch (e: any) {
      if (e.message !== 'Cancelled') {
        setError(e?.message ?? 'Erreur lors de l\'actualisation des données');
      }
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadInitialData = React.useCallback(async (
    suppliers: Supplier[],
    startDate: Date,
    monthsCount: number
  ) => {
    let cancelled = false;
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données pour tous les fournisseurs
      for (const supplier of suppliers) {
        if (cancelled || controller.signal.aborted) return;
        
        try {
          // Charger les hébergements
          const accommodationsList = await loadAccommodations(client, supplier.idFournisseur, controller.signal);
          if (cancelled || controller.signal.aborted) return;
          
          setAccommodations(prev => ({ ...prev, [supplier.idFournisseur]: accommodationsList }));
          
          // Sélectionner tous les hébergements pour chaque fournisseur au chargement initial
          setSelectedAccommodationsBySupplier(prev => ({
            ...prev,
            [supplier.idFournisseur]: new Set(accommodationsList.map(acc => acc.idHebergement))
          }));
          
          // Charger les données (stock, tarifs, etc.)
          const data = await loadSupplierData(client, supplier.idFournisseur, accommodationsList, startDate, monthsCount, controller.signal);
          if (cancelled || controller.signal.aborted) return;
          
          // Mettre à jour les états avec la nouvelle structure indexée par fournisseur puis hébergement
          setStockBySupplierAndAccommodation(prev => ({
            ...prev,
            [supplier.idFournisseur]: data.stock
          }));
          setRatesBySupplierAndAccommodation(prev => ({
            ...prev,
            [supplier.idFournisseur]: data.rates
          }));
          setPromoBySupplierAndAccommodation(prev => ({
            ...prev,
            [supplier.idFournisseur]: data.promo
          }));
          setRateTypesBySupplierAndAccommodation(prev => ({
            ...prev,
            [supplier.idFournisseur]: data.rateTypes
          }));
          setDureeMinByAccommodation(prev => ({
            ...prev,
            [supplier.idFournisseur]: data.dureeMin
          }));
          setRateTypeLabelsBySupplier(prev => ({ ...prev, [supplier.idFournisseur]: data.rateTypeLabels }));
          setRateTypesBySupplier(prev => ({ ...prev, [supplier.idFournisseur]: data.rateTypesList }));
          
          // Initialiser selectedRateTypeId pour chaque fournisseur
          if (data.rateTypesList.length > 0) {
            setSelectedRateTypeIdBySupplier(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.rateTypesList[0].idTypeTarif
            }));
          }
        } catch (e: any) {
          if (e.message !== 'Cancelled' && !controller.signal.aborted) {
            console.error(`Erreur lors du chargement des données pour ${supplier.nom}:`, e);
          }
        }
      }
    } catch (e: any) {
      if (!cancelled && !controller.signal.aborted) {
        setError(e?.message ?? 'Erreur lors du chargement initial des données');
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }, [client]);

  return {
    accommodations,
    stockBySupplierAndAccommodation,
    ratesBySupplierAndAccommodation,
    promoBySupplierAndAccommodation,
    rateTypesBySupplierAndAccommodation,
    dureeMinBySupplierAndAccommodation,
    rateTypeLabelsBySupplier,
    rateTypesBySupplier,
    selectedRateTypeIdBySupplier,
    selectedAccommodationsBySupplier,
    selectedDatesBySupplier,
    modifiedRatesBySupplier,
    modifiedDureeMinBySupplier,
    loading,
    error,
    setAccommodations,
    setStockBySupplierAndAccommodation,
    setRatesBySupplierAndAccommodation,
    setPromoBySupplierAndAccommodation,
    setRateTypesBySupplierAndAccommodation,
    setDureeMinByAccommodation,
    setRateTypeLabelsBySupplier,
    setRateTypesBySupplier,
    setSelectedRateTypeIdBySupplier,
    setSelectedAccommodationsBySupplier,
    setSelectedDatesBySupplier,
    setModifiedRatesBySupplier,
    setModifiedDureeMinBySupplier,
    setLoading,
    setError,
    refreshSupplierData,
    loadInitialData
  };
}

