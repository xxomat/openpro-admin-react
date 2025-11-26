/**
 * Hook pour la gestion des types de tarif
 * 
 * Ce hook gère la logique métier pour la modale de gestion des types de tarif :
 * - Chargement de la liste des types de tarif
 * - Création, modification, suppression de types de tarif
 * - Gestion des liaisons hébergement-type de tarif
 */

import React from 'react';
import type {
  RateTypeApi,
  TypeTarifModif
} from '@/services/api/backendClient';
import {
  listRateTypes as apiListRateTypes,
  createRateType as apiCreateRateType,
  updateRateType as apiUpdateRateType,
  deleteRateType as apiDeleteRateType,
  listAccommodationRateTypeLinks as apiListAccommodationRateTypeLinks,
  linkRateTypeToAccommodation as apiLinkRateTypeToAccommodation,
  unlinkRateTypeFromAccommodation as apiUnlinkRateTypeFromAccommodation
} from '@/services/api/backendClient';
import type { Accommodation } from '@/types';

/**
 * Extrait le texte français d'un libellé ou description multilingue
 */
function extractFrenchText(multilingue: unknown): string | undefined {
  if (!multilingue || typeof multilingue !== 'object') return undefined;
  if (Array.isArray(multilingue)) {
    const frItem = multilingue.find((item: unknown) => 
      typeof item === 'object' && 
      item !== null && 
      'langue' in item && 
      (item as { langue: string }).langue === 'fr'
    );
    if (frItem && typeof frItem === 'object' && 'texte' in frItem) {
      return String(frItem.texte);
    }
  }
  return undefined;
}

/**
 * Extrait le texte anglais d'un libellé ou description multilingue
 */
function extractEnglishText(multilingue: unknown): string | undefined {
  if (!multilingue || typeof multilingue !== 'object') return undefined;
  if (Array.isArray(multilingue)) {
    const enItem = multilingue.find((item: unknown) => 
      typeof item === 'object' && 
      item !== null && 
      'langue' in item && 
      (item as { langue: string }).langue === 'en'
    );
    if (enItem && typeof enItem === 'object' && 'texte' in enItem) {
      return String(enItem.texte);
    }
  }
  return undefined;
}

/**
 * Extrait tous les textes multilingues d'un libellé ou description
 */
function extractMultilingue(multilingue: unknown): Array<{ langue: string; texte: string }> {
  if (!multilingue || typeof multilingue !== 'object') return [];
  if (Array.isArray(multilingue)) {
    return multilingue
      .filter((item: unknown) => 
        typeof item === 'object' && 
        item !== null && 
        'langue' in item && 
        'texte' in item
      )
      .map((item: unknown) => {
        const obj = item as { langue: string; texte: string };
        return { langue: obj.langue, texte: String(obj.texte) };
      });
  }
  return [];
}

/**
 * Hook pour la gestion des types de tarif
 */
export function useRateTypeManagement(idFournisseur: number, accommodations: Accommodation[]) {
  const [rateTypes, setRateTypes] = React.useState<RateTypeApi[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [linksByAccommodation, setLinksByAccommodation] = React.useState<Record<number, Set<number>>>({});

  /**
   * Charge la liste des types de tarif
   */
  const loadRateTypes = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiListRateTypes(idFournisseur);
      const typeTarifs = response.typeTarifs || [];
      setRateTypes(typeTarifs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des types de tarif';
      setError(errorMessage);
      console.error('Error loading rate types:', err);
    } finally {
      setLoading(false);
    }
  }, [idFournisseur]);

  /**
   * Charge les liaisons pour tous les hébergements
   */
  const loadLinks = React.useCallback(async () => {
    const links: Record<number, Set<number>> = {};
    for (const acc of accommodations) {
      try {
        const response = await apiListAccommodationRateTypeLinks(idFournisseur, acc.idHebergement);
        const linkSet = new Set<number>();
        (response.liaisonHebergementTypeTarifs || []).forEach((link) => {
          linkSet.add(link.idTypeTarif);
        });
        links[acc.idHebergement] = linkSet;
      } catch (err) {
        console.error(`Error loading links for accommodation ${acc.idHebergement}:`, err);
        links[acc.idHebergement] = new Set();
      }
    }
    setLinksByAccommodation(links);
  }, [idFournisseur, accommodations]);

  /**
   * Charge les données initiales
   */
  React.useEffect(() => {
    if (idFournisseur) {
      loadRateTypes();
      if (accommodations.length > 0) {
        loadLinks();
      }
    }
  }, [idFournisseur, accommodations, loadRateTypes, loadLinks]);

  /**
   * Crée un nouveau type de tarif
   */
  const handleCreate = React.useCallback(async (payload: TypeTarifModif) => {
    setLoading(true);
    setError(null);
    try {
      await apiCreateRateType(idFournisseur, payload);
      await loadRateTypes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du type de tarif';
      setError(errorMessage);
      console.error('Error creating rate type:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [idFournisseur, loadRateTypes]);

  /**
   * Modifie un type de tarif existant
   */
  const handleUpdate = React.useCallback(async (idTypeTarif: number, payload: TypeTarifModif) => {
    setLoading(true);
    setError(null);
    try {
      await apiUpdateRateType(idFournisseur, idTypeTarif, payload);
      await loadRateTypes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du type de tarif';
      setError(errorMessage);
      console.error('Error updating rate type:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [idFournisseur, loadRateTypes]);

  /**
   * Supprime un type de tarif
   */
  const handleDelete = React.useCallback(async (idTypeTarif: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiDeleteRateType(idFournisseur, idTypeTarif);
      await loadRateTypes();
      // Recharger les liaisons car certaines peuvent avoir été supprimées
      if (accommodations.length > 0) {
        await loadLinks();
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du type de tarif';
      setError(errorMessage);
      console.error('Error deleting rate type:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [idFournisseur, loadRateTypes, accommodations, loadLinks]);

  /**
   * Lie un type de tarif à un hébergement
   */
  const handleLink = React.useCallback(async (idHebergement: number, idTypeTarif: number) => {
    setError(null);
    try {
      await apiLinkRateTypeToAccommodation(idFournisseur, idHebergement, idTypeTarif);
      // Mettre à jour les liaisons localement
      setLinksByAccommodation(prev => {
        const newLinks = { ...prev };
        if (!newLinks[idHebergement]) {
          newLinks[idHebergement] = new Set();
        }
        newLinks[idHebergement] = new Set(newLinks[idHebergement]).add(idTypeTarif);
        return newLinks;
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la liaison';
      setError(errorMessage);
      console.error('Error linking rate type:', err);
      return false;
    }
  }, [idFournisseur]);

  /**
   * Supprime la liaison entre un type de tarif et un hébergement
   */
  const handleUnlink = React.useCallback(async (idHebergement: number, idTypeTarif: number) => {
    setError(null);
    try {
      await apiUnlinkRateTypeFromAccommodation(idFournisseur, idHebergement, idTypeTarif);
      // Mettre à jour les liaisons localement
      setLinksByAccommodation(prev => {
        const newLinks = { ...prev };
        if (newLinks[idHebergement]) {
          const newSet = new Set(newLinks[idHebergement]);
          newSet.delete(idTypeTarif);
          newLinks[idHebergement] = newSet;
        }
        return newLinks;
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la liaison';
      setError(errorMessage);
      console.error('Error unlinking rate type:', err);
      return false;
    }
  }, [idFournisseur]);

  return {
    rateTypes,
    loading,
    error,
    linksByAccommodation,
    loadRateTypes,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleLink,
    handleUnlink,
    extractFrenchText,
    extractEnglishText,
    extractMultilingue
  };
}

