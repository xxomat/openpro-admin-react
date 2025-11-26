/**
 * Hook personnalisé useSupplierData
 * 
 * Ce hook gère toute la logique de state management pour les données des fournisseurs,
 * incluant le chargement des hébergements, du stock, des tarifs, et des types de tarifs.
 * Il gère également la sélection d'hébergements et de dates, ainsi que le suivi
 * des modifications locales.
 */

import React from 'react';
import type { Supplier, Accommodation, RateType, BookingDisplay } from '../types';
import { loadAccommodations, loadSupplierData } from '../services/dataLoader';
import { updateSupplierDataStates } from './utils/supplierDataUtils';
import { getErrorMessage, isCancellationError } from '../utils/errorUtils';

/**
 * Valeur de retour du hook useSupplierData
 * 
 * Contient tous les états et fonctions nécessaires pour gérer les données
 * des fournisseurs, incluant les hébergements, tarifs, stock, et sélections.
 */
export interface UseSupplierDataReturn {
  // États de données
  accommodations: Record<number, Accommodation[]>;
  stockBySupplierAndAccommodation: Record<number, Record<number, Record<string, number>>>;
  ratesBySupplierAndAccommodation: Record<number, Record<number, Record<string, Record<number, number>>>>;
  promoBySupplierAndAccommodation: Record<number, Record<number, Record<string, boolean>>>;
  rateTypesBySupplierAndAccommodation: Record<number, Record<number, Record<string, string[]>>>;
  dureeMinBySupplierAndAccommodation: Record<number, Record<number, Record<string, Record<number, number | null>>>>;
  bookingsBySupplierAndAccommodation: Record<number, Record<number, BookingDisplay[]>>;
  rateTypeLabelsBySupplier: Record<number, Record<number, string>>;
  rateTypesBySupplier: Record<number, RateType[]>;
  selectedRateTypeIdBySupplier: Record<number, number | null>;
  
  // États de sélection
  selectedAccommodationsBySupplier: Record<number, Set<number>>;
  selectedCellsBySupplier: Record<number, Set<string>>; // Format: "accId-dateStr"
  
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
  setBookingsBySupplierAndAccommodation: React.Dispatch<React.SetStateAction<Record<number, Record<number, BookingDisplay[]>>>>;
  setRateTypeLabelsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Record<number, string>>>>;
  setRateTypesBySupplier: React.Dispatch<React.SetStateAction<Record<number, RateType[]>>>;
  setSelectedRateTypeIdBySupplier: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  setSelectedAccommodationsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<number>>>>;
  setSelectedCellsBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedRatesBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setModifiedDureeMinBySupplier: React.Dispatch<React.SetStateAction<Record<number, Set<string>>>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Fonctions utilitaires
  refreshSupplierData: (idFournisseur: number, startDate: Date, endDate: Date) => Promise<void>;
  loadInitialData: (suppliers: Supplier[], startDate: Date, endDate: Date) => Promise<void>;
}

export function useSupplierData(): UseSupplierDataReturn {
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
  const [bookingsBySupplierAndAccommodation, setBookingsBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, BookingDisplay[]>>
  >({});
  const [rateTypeLabelsBySupplier, setRateTypeLabelsBySupplier] = React.useState<
    Record<number, Record<number, string>>
  >({});
  const [rateTypesBySupplier, setRateTypesBySupplier] = React.useState<
    Record<number, RateType[]>
  >({});
  const [selectedRateTypeIdBySupplier, setSelectedRateTypeIdBySupplier] = React.useState<Record<number, number | null>>({});
  const [selectedAccommodationsBySupplier, setSelectedAccommodationsBySupplier] = React.useState<Record<number, Set<number>>>({});
  const [selectedCellsBySupplier, setSelectedCellsBySupplier] = React.useState<Record<number, Set<string>>>({}); // Format: "accId-dateStr"
  const [modifiedRatesBySupplier, setModifiedRatesBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [modifiedDureeMinBySupplier, setModifiedDureeMinBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Actualise les données d'un fournisseur
   * 
   * @param idFournisseur - Identifiant du fournisseur
   * @param startDate - Date de début de la plage de dates (incluse)
   * @param endDate - Date de fin de la plage de dates (incluse)
   * @throws {Error} Peut lever une erreur si le chargement échoue
   * @throws {DOMException} Peut lever une AbortError si la requête est annulée
   */
  const refreshSupplierData = React.useCallback(async (
    idFournisseur: number,
    startDate: Date,
    endDate: Date
  ): Promise<void> => {
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const accommodationsList = await loadAccommodations(idFournisseur, controller.signal);
      const data = await loadSupplierData(idFournisseur, accommodationsList, startDate, endDate, controller.signal);
      
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
        setBookingsBySupplierAndAccommodation,
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
  }, []);

  /**
   * Vérifie si une erreur est une erreur de connexion réseau
   * 
   * @param error - Erreur à vérifier
   * @returns true si l'erreur est une erreur de connexion réseau
   */
  const isNetworkError = React.useCallback((error: unknown): boolean => {
    if (error instanceof TypeError) {
      const message = error.message.toLowerCase();
      return message.includes('fetch') || 
             message.includes('network') || 
             message.includes('failed to fetch') ||
             message.includes('networkerror');
    }
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('fetch') || 
             message.includes('network') || 
             message.includes('failed to fetch') ||
             message.includes('networkerror') ||
             message.includes('impossible de se connecter');
    }
    return false;
  }, []);

  /**
   * Charge les données initiales pour tous les fournisseurs
   * 
   * @param suppliers - Liste des fournisseurs pour lesquels charger les données
   * @param startDate - Date de début de la plage de dates (incluse)
   * @param endDate - Date de fin de la plage de dates (incluse)
   * @throws {Error} Peut lever une erreur si le chargement échoue
   * @throws {DOMException} Peut lever une AbortError si la requête est annulée
   */
  const loadInitialData = React.useCallback(async (
    suppliers: Supplier[],
    startDate: Date,
    endDate: Date
  ): Promise<void> => {
    let cancelled = false;
    const controller = new AbortController();
    const errors: string[] = [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les données pour tous les fournisseurs
      for (const supplier of suppliers) {
        if (cancelled || controller.signal.aborted) return;
        
        try {
          const accommodationsList = await loadAccommodations(supplier.idFournisseur, controller.signal);
          if (cancelled || controller.signal.aborted) return;
          
          const data = await loadSupplierData(supplier.idFournisseur, accommodationsList, startDate, endDate, controller.signal);
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
            setBookingsBySupplierAndAccommodation,
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
            errors.push(errorMessage);
            // On continue le chargement pour les autres fournisseurs même si un échoue
          }
        }
      }
      
      // Si toutes les requêtes ont échoué, afficher une erreur globale
      if (errors.length > 0 && errors.length === suppliers.length) {
        const firstError = errors[0];
        // Vérifier si c'est une erreur de connexion réseau (vérifier le message)
        const firstErrorLower = firstError.toLowerCase();
        if (firstErrorLower.includes('fetch') || 
            firstErrorLower.includes('network') || 
            firstErrorLower.includes('failed to fetch') ||
            firstErrorLower.includes('networkerror') ||
            firstErrorLower.includes('impossible de se connecter')) {
          setError('Impossible de se connecter au backend. Vérifiez que le serveur est démarré et accessible.');
        } else {
          setError(`Erreur lors du chargement des données : ${firstError}`);
        }
      } else if (errors.length > 0) {
        // Certaines requêtes ont échoué mais pas toutes
        setError(`Certaines données n'ont pas pu être chargées : ${errors.join('; ')}`);
      }
    } catch (error: unknown) {
      if (!cancelled && !controller.signal.aborted) {
        const errorMessage = getErrorMessage(error, 'Erreur lors du chargement initial des données');
        // Vérifier si c'est une erreur de connexion réseau
        if (isNetworkError(error)) {
          setError('Impossible de se connecter au backend. Vérifiez que le serveur est démarré et accessible.');
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }, [isNetworkError]);

  return {
    accommodations,
    stockBySupplierAndAccommodation,
    ratesBySupplierAndAccommodation,
    promoBySupplierAndAccommodation,
    rateTypesBySupplierAndAccommodation,
    dureeMinBySupplierAndAccommodation,
    bookingsBySupplierAndAccommodation,
    rateTypeLabelsBySupplier,
    rateTypesBySupplier,
    selectedRateTypeIdBySupplier,
    selectedAccommodationsBySupplier,
    selectedCellsBySupplier,
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
    setBookingsBySupplierAndAccommodation,
    setRateTypeLabelsBySupplier,
    setRateTypesBySupplier,
    setSelectedRateTypeIdBySupplier,
    setSelectedAccommodationsBySupplier,
    setSelectedCellsBySupplier,
    setModifiedRatesBySupplier,
    setModifiedDureeMinBySupplier,
    setLoading,
    setError,
    refreshSupplierData,
    loadInitialData
  };
}

