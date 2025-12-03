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
 * Gère deux formats :
 * 1. Tableau : [{ langue: "fr", texte: "..." }, { langue: "en", texte: "..." }]
 * 2. Objet : { fr: "...", en: "..." }
 */
function extractMultilingue(multilingue: unknown): Array<{ langue: string; texte: string }> {
  if (!multilingue || typeof multilingue !== 'object') return [];
  
  // Format tableau (format standard OpenPro)
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
  
  // Format objet (format simplifié retourné par le backend)
  // Exemple: { fr: "...", en: "..." }
  const obj = multilingue as Record<string, unknown>;
  const result: Array<{ langue: string; texte: string }> = [];
  for (const [langue, texte] of Object.entries(obj)) {
    if (texte !== null && texte !== undefined && texte !== '') {
      result.push({ langue, texte: String(texte) });
    }
  }
  return result;
}

/**
 * Hook pour la gestion des types de tarif
 */
export function useRateTypeManagement(supplierId: number, accommodations: Accommodation[]) {
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
      const response = await apiListRateTypes(supplierId);
      const typeTarifs = response.typeTarifs || [];
      setRateTypes(typeTarifs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des types de tarif';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  /**
   * Charge les liaisons pour tous les hébergements
   */
  const loadLinks = React.useCallback(async () => {
    const links: Record<number, Set<number>> = {};
    for (const acc of accommodations) {
      try {
        const response = await apiListAccommodationRateTypeLinks(supplierId, acc.accommodationId);
        const linkSet = new Set<number>();
        (response.liaisonHebergementTypeTarifs || []).forEach((link) => {
          linkSet.add(link.idTypeTarif);
        });
        links[acc.accommodationId] = linkSet;
      } catch (err) {
        links[acc.accommodationId] = new Set();
      }
    }
    setLinksByAccommodation(links);
  }, [supplierId, accommodations]);

  /**
   * Charge les données initiales
   */
  React.useEffect(() => {
    if (supplierId) {
      loadRateTypes();
      if (accommodations.length > 0) {
        loadLinks();
      }
    }
  }, [supplierId, accommodations, loadRateTypes, loadLinks]);

  /**
   * Crée un nouveau type de tarif
   */
  const handleCreate = React.useCallback(async (payload: TypeTarifModif) => {
    setLoading(true);
    setError(null);
    try {
      await apiCreateRateType(supplierId, payload);
      await loadRateTypes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du type de tarif';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supplierId, loadRateTypes]);

  /**
   * Modifie un type de tarif existant
   */
  const handleUpdate = React.useCallback(async (rateTypeId: number, payload: TypeTarifModif) => {
    setLoading(true);
    setError(null);
    try {
      await apiUpdateRateType(supplierId, rateTypeId, payload);
      await loadRateTypes();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du type de tarif';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supplierId, loadRateTypes]);

  /**
   * Supprime un type de tarif
   */
  const handleDelete = React.useCallback(async (rateTypeId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiDeleteRateType(supplierId, rateTypeId);
      await loadRateTypes();
      // Recharger les liaisons car certaines peuvent avoir été supprimées
      if (accommodations.length > 0) {
        await loadLinks();
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du type de tarif';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supplierId, loadRateTypes, accommodations, loadLinks]);

  /**
   * Lie un type de tarif à un hébergement
   */
  const handleLink = React.useCallback(async (accommodationId: number, rateTypeId: number) => {
    setError(null);
    try {
      await apiLinkRateTypeToAccommodation(supplierId, accommodationId, rateTypeId);
      // Mettre à jour les liaisons localement
      setLinksByAccommodation(prev => {
        const newLinks = { ...prev };
        if (!newLinks[accommodationId]) {
          newLinks[accommodationId] = new Set();
        }
        newLinks[accommodationId] = new Set(newLinks[accommodationId]).add(rateTypeId);
        return newLinks;
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la liaison';
      setError(errorMessage);
      return false;
    }
  }, [supplierId]);

  /**
   * Supprime la liaison entre un type de tarif et un hébergement
   */
  const handleUnlink = React.useCallback(async (accommodationId: number, rateTypeId: number) => {
    setError(null);
    try {
      await apiUnlinkRateTypeFromAccommodation(supplierId, accommodationId, rateTypeId);
      // Mettre à jour les liaisons localement
      setLinksByAccommodation(prev => {
        const newLinks = { ...prev };
        if (newLinks[accommodationId]) {
          const newSet = new Set(newLinks[accommodationId]);
          newSet.delete(rateTypeId);
          newLinks[accommodationId] = newSet;
        }
        return newLinks;
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la liaison';
      setError(errorMessage);
      return false;
    }
  }, [supplierId]);

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

