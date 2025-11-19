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
import { updateSupplierDataStates } from './utils/supplierDataUtils';
import { getErrorMessage, isCancellationError } from '../utils/errorUtils';

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

  /**
   * Actualise les données d'un fournisseur
   * 
   * @param idFournisseur - Identifiant du fournisseur
   * @param startDate - Date de début de la plage de dates
   * @param monthsCount - Nombre de mois à charger
   * @throws {Error} Peut lever une erreur si le chargement échoue
   * @throws {DOMException} Peut lever une AbortError si la requête est annulée
   */
  const refreshSupplierData = React.useCallback(async (
    idFournisseur: number,
    startDate: Date,
    monthsCount: number
  ): Promise<void> => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const accommodationsList = await loadAccommodations(client, idFournisseur, controller.signal);
      const data = await loadSupplierData(client, idFournisseur, accommodationsList, startDate, monthsCount, controller.signal);
      
      updateSupplierDataStates({
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
      });
      
    } catch (error: unknown) {
      if (!isCancellationError(error)) {
        setError(getErrorMessage(error, 'Erreur lors de l\'actualisation des données'));
      }
    } finally {
      setLoading(false);
    }
  }, [client]);

  /**
   * Charge les données initiales pour tous les fournisseurs
   * 
   * @param suppliers - Liste des fournisseurs pour lesquels charger les données
   * @param startDate - Date de début de la plage de dates
   * @param monthsCount - Nombre de mois à charger
   * @throws {Error} Peut lever une erreur si le chargement échoue
   * @throws {DOMException} Peut lever une AbortError si la requête est annulée
   */
  const loadInitialData = React.useCallback(async (
    suppliers: Supplier[],
    startDate: Date,
    monthsCount: number
  ): Promise<void> => {
    let cancelled = false;
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données pour tous les fournisseurs
      for (const supplier of suppliers) {
        if (cancelled || controller.signal.aborted) return;
        
        try {
          const accommodationsList = await loadAccommodations(client, supplier.idFournisseur, controller.signal);
          if (cancelled || controller.signal.aborted) return;
          
          const data = await loadSupplierData(client, supplier.idFournisseur, accommodationsList, startDate, monthsCount, controller.signal);
          if (cancelled || controller.signal.aborted) return;
          
          updateSupplierDataStates({
            idFournisseur: supplier.idFournisseur,
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
          });
          
          // Pour le chargement initial, on initialise toujours le premier type de tarif
          if (data.rateTypesList.length > 0) {
            setSelectedRateTypeIdBySupplier(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.rateTypesList[0].idTypeTarif
            }));
          }
        } catch (error: unknown) {
          if (!isCancellationError(error) && !controller.signal.aborted) {
            const errorMessage = getErrorMessage(error, `Erreur lors du chargement des données pour ${supplier.nom}`);
            console.error(`Erreur lors du chargement des données pour ${supplier.nom}:`, error);
            // On continue le chargement pour les autres fournisseurs même si un échoue
          }
        }
      }
    } catch (error: unknown) {
      if (!cancelled && !controller.signal.aborted) {
        setError(getErrorMessage(error, 'Erreur lors du chargement initial des données'));
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

