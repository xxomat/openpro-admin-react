/**
 * Hook personnalisé pour gérer la logique du formulaire de réservation
 * 
 * Ce hook gère les données client, la validation, et la synchronisation
 * entre les hébergements lorsque le mode "Appliquer à tous" est activé.
 */

import React from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import type { BookingSummary } from '../../../utils/bookingUtils';
import type { ClientData } from '../BookingModal';

/**
 * Valeur de retour du hook useBookingForm
 */
export interface UseBookingFormReturn {
  /** Données client par hébergement */
  clientDataByAccommodation: Map<number, ClientData>;
  /** Indique si chaque hébergement est un client professionnel */
  isProfessionalClientByAccommodation: Map<number, boolean>;
  /** Erreurs de validation par hébergement */
  validationErrorsByAccommodation: Map<number, Partial<Record<keyof ClientData, string>>>;
  /** Mode "Appliquer à tous les hébergements" */
  applyToAll: boolean;
  /** Setter pour applyToAll */
  setApplyToAll: React.Dispatch<React.SetStateAction<boolean>>;
  /** Callback pour mettre à jour les données client */
  handleClientDataChange: (accId: number, field: keyof ClientData, value: string | boolean | undefined) => void;
  /** Callback pour changer le statut professionnel */
  handleProfessionalClientChange: (accId: number, isProfessional: boolean) => void;
  /** Vérifie si le formulaire pour un hébergement est valide */
  isFormValidForAccommodation: (accId: number) => boolean;
  /** Vérifie si tous les formulaires sont valides */
  isAllFormsValid: boolean;
}

/**
 * Hook pour gérer la logique du formulaire de réservation
 * 
 * @param bookingSummaries - Récapitulatifs de réservation par hébergement
 * @returns Objet contenant les états et fonctions pour gérer le formulaire
 */
export function useBookingForm(bookingSummaries: BookingSummary[]): UseBookingFormReturn {
  const [applyToAll, setApplyToAll] = React.useState<boolean>(true);
  const [clientDataByAccommodation, setClientDataByAccommodation] = React.useState<Map<number, ClientData>>(new Map());
  const [isProfessionalClientByAccommodation, setIsProfessionalClientByAccommodation] = React.useState<Map<number, boolean>>(new Map());
  const [validationErrorsByAccommodation, setValidationErrorsByAccommodation] = React.useState<Map<number, Partial<Record<keyof ClientData, string>>>>(new Map());

  // Trier les récapitulatifs par ordre alphabétique
  const sortedSummaries = React.useMemo(() => {
    return [...bookingSummaries].sort((a, b) => a.accName.localeCompare(b.accName));
  }, [bookingSummaries]);

  // Fonction helper pour obtenir les données client par défaut
  function getDefaultClientData(): ClientData {
    return {
      civilite: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      remarques: '',
      adresse: '',
      codePostal: '',
      ville: '',
      pays: 'France',
      nationalite: 'Française',
      societe: '',
      siret: '',
      tva: '',
      langue: 'fr',
      newsletter: false,
      cgvAcceptees: false
    };
  }

  // Fonctions de validation
  const validateNom = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null;
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
    if (!regex.test(value)) {
      return 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes';
    }
    return null;
  }, []);

  const validatePrenom = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null;
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
    if (!regex.test(value)) {
      return 'Le prénom ne doit contenir que des lettres, espaces, tirets et apostrophes';
    }
    return null;
  }, []);

  const validateEmail = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return 'Format d\'email invalide';
    }
    return null;
  }, []);

  const validateVille = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null;
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/;
    if (!regex.test(value)) {
      return 'La ville ne doit contenir que des lettres, espaces et tirets';
    }
    return null;
  }, []);

  const validateTelephone = React.useCallback((value: string | undefined): string | null => {
    if (!value || !value.trim()) return null;
    if (!isValidPhoneNumber(value)) {
      return 'Format de numéro de téléphone invalide';
    }
    return null;
  }, []);

  const validateField = React.useCallback((field: keyof ClientData, value: string): string | null => {
    switch (field) {
      case 'nom':
        return validateNom(value);
      case 'prenom':
        return validatePrenom(value);
      case 'email':
        return validateEmail(value);
      case 'ville':
        return validateVille(value);
      case 'telephone':
        return validateTelephone(value);
      default:
        return null;
    }
  }, [validateNom, validatePrenom, validateEmail, validateVille, validateTelephone]);

  // Gérer le changement de mode "Appliquer à tous"
  const handleApplyToAllChange = React.useCallback((checked: boolean) => {
    setApplyToAll(checked);
    if (checked && sortedSummaries.length > 0) {
      const firstAccId = sortedSummaries[0].accId;
      const firstData = clientDataByAccommodation.get(firstAccId) || getDefaultClientData();
      const firstIsProfessional = isProfessionalClientByAccommodation.get(firstAccId) || false;
      
      const newMap = new Map(clientDataByAccommodation);
      const newProfessionalMap = new Map(isProfessionalClientByAccommodation);
      
      sortedSummaries.forEach((summary, index) => {
        if (index > 0) {
          newMap.set(summary.accId, { ...firstData });
          newProfessionalMap.set(summary.accId, firstIsProfessional);
        }
      });
      
      setClientDataByAccommodation(newMap);
      setIsProfessionalClientByAccommodation(newProfessionalMap);
    }
  }, [sortedSummaries, clientDataByAccommodation, isProfessionalClientByAccommodation]);

  // Gérer le changement de données client
  const handleClientDataChange = React.useCallback((accId: number, field: keyof ClientData, value: string | boolean | undefined) => {
    setClientDataByAccommodation(prev => {
      const currentData = prev.get(accId) || getDefaultClientData();
      const processedValue = value === undefined ? '' : value;
      const newData = { ...currentData, [field]: processedValue };
      const newMap = new Map(prev);
      newMap.set(accId, newData);
      
      // Si applyToAll est true et qu'on modifie le premier hébergement, synchroniser avec les autres
      if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
        sortedSummaries.forEach((summary, index) => {
          if (index > 0) {
            newMap.set(summary.accId, { ...newData });
          }
        });
      }
      
      // Valider le champ si c'est une chaîne
      if (typeof processedValue === 'string') {
        const error = validateField(field, processedValue);
        setValidationErrorsByAccommodation(prevErrors => {
          const currentErrors = prevErrors.get(accId) || {};
          const newErrors = new Map(prevErrors);
          
          if (error) {
            newErrors.set(accId, { ...currentErrors, [field]: error });
            // Si applyToAll, copier l'erreur aux autres
            if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
              sortedSummaries.forEach((summary, index) => {
                if (index > 0) {
                  const otherErrors = prevErrors.get(summary.accId) || {};
                  newErrors.set(summary.accId, { ...otherErrors, [field]: error });
                }
              });
            }
          } else {
            const { [field]: _, ...rest } = currentErrors;
            newErrors.set(accId, rest);
            // Si applyToAll, supprimer l'erreur des autres aussi
            if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
              sortedSummaries.forEach((summary, index) => {
                if (index > 0) {
                  const otherErrors = prevErrors.get(summary.accId) || {};
                  const { [field]: __, ...otherRest } = otherErrors;
                  newErrors.set(summary.accId, otherRest);
                }
              });
            }
          }
          
          return newErrors;
        });
      }
      
      return newMap;
    });
  }, [applyToAll, sortedSummaries, validateField]);

  // Gérer le changement de statut professionnel
  const handleProfessionalClientChange = React.useCallback((accId: number, isProfessional: boolean) => {
    const newMap = new Map(isProfessionalClientByAccommodation);
    newMap.set(accId, isProfessional);
    
    // Si applyToAll et premier hébergement, synchroniser avec les autres
    if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
      sortedSummaries.forEach((otherSummary, otherIndex) => {
        if (otherIndex > 0) {
          newMap.set(otherSummary.accId, isProfessional);
        }
      });
    }
    
    setIsProfessionalClientByAccommodation(newMap);
  }, [applyToAll, sortedSummaries, isProfessionalClientByAccommodation]);

  // Validation du formulaire pour un hébergement spécifique
  const isFormValidForAccommodation = React.useCallback((accId: number): boolean => {
    const clientData = clientDataByAccommodation.get(accId);
    if (!clientData) return false;
    
    const hasNom = Boolean(clientData.nom && clientData.nom.trim());
    const hasPrenom = Boolean(clientData.prenom && clientData.prenom.trim());
    const hasTelephone = Boolean(clientData.telephone && clientData.telephone.trim());
    const hasAdresse = Boolean(clientData.adresse && clientData.adresse.trim());
    const hasCodePostal = Boolean(clientData.codePostal && clientData.codePostal.trim());
    const hasVille = Boolean(clientData.ville && clientData.ville.trim());
    
    const errors = validationErrorsByAccommodation.get(accId);
    const hasNoValidationErrors = !errors || Object.keys(errors).length === 0;

    const isProfessional = isProfessionalClientByAccommodation.get(accId) || false;
    let hasProfessionalFields = true;
    if (isProfessional) {
      const hasSociete = Boolean(clientData.societe && clientData.societe.trim());
      const hasSiret = Boolean(clientData.siret && clientData.siret.trim());
      const hasTva = Boolean(clientData.tva && clientData.tva.trim());
      hasProfessionalFields = hasSociete && hasSiret && hasTva;
    }

    return hasNom && hasPrenom && hasTelephone && hasAdresse && hasCodePostal && hasVille && hasProfessionalFields && hasNoValidationErrors;
  }, [clientDataByAccommodation, isProfessionalClientByAccommodation, validationErrorsByAccommodation]);

  // Validation globale (tous les hébergements doivent être valides)
  const isAllFormsValid = React.useMemo(() => {
    return bookingSummaries.every(summary => 
      isFormValidForAccommodation(summary.accId)
    );
  }, [bookingSummaries, isFormValidForAccommodation]);

  // Exposer setApplyToAll avec la logique de synchronisation
  const setApplyToAllWithSync = React.useCallback((value: React.SetStateAction<boolean>) => {
    if (typeof value === 'function') {
      setApplyToAll(prev => {
        const newValue = value(prev);
        handleApplyToAllChange(newValue);
        return newValue;
      });
    } else {
      setApplyToAll(value);
      handleApplyToAllChange(value);
    }
  }, [handleApplyToAllChange]);

  return {
    clientDataByAccommodation,
    isProfessionalClientByAccommodation,
    validationErrorsByAccommodation,
    applyToAll,
    setApplyToAll: setApplyToAllWithSync,
    handleClientDataChange,
    handleProfessionalClientChange,
    isFormValidForAccommodation,
    isAllFormsValid
  };
}

