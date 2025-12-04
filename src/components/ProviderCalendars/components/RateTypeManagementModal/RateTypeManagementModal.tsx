/**
 * Composant RateTypeManagementModal - Modale de gestion des types de tarif
 * 
 * Ce composant principal orchestre l'affichage de la modale de gestion des types de tarif,
 * incluant la liste, le formulaire de création/modification, et la gestion des liaisons.
 */

import React from 'react';
import type { Accommodation } from '@/types';
import type { RateTypeApi, TypeTarifModif } from '@/services/api/backendClient';
import { darkTheme } from '../../utils/theme';
import { useRateTypeManagement } from './hooks/useRateTypeManagement';
import { RateTypeList } from './components/RateTypeList';
import { RateTypeForm } from './components/RateTypeForm';
import { AccommodationLinkManager } from './components/AccommodationLinkManager';

/**
 * Mode d'affichage de la modale
 */
type ModalMode = 'list' | 'create' | 'edit' | 'links' | 'delete';

/**
 * Props du composant RateTypeManagementModal
 */
export interface RateTypeManagementModalProps {
  /** Indique si la modale est ouverte */
  isOpen: boolean;
  /** Callback appelé pour fermer la modale */
  onClose: () => void;
  /** Identifiant du fournisseur */
  supplierId: number;
  /** Liste des hébergements du fournisseur */
  accommodations: Accommodation[];
  /** Callback appelé après une modification pour rafraîchir les données */
  onDataChanged?: () => void;
}

/**
 * Composant principal pour la modale de gestion des types de tarif
 */
export function RateTypeManagementModal({
  isOpen,
  onClose,
  supplierId,
  accommodations,
  onDataChanged
}: RateTypeManagementModalProps): React.ReactElement | null {
  const [mode, setMode] = React.useState<ModalMode>('list');
  const [selectedRateType, setSelectedRateType] = React.useState<RateTypeApi | null>(null);
  const [rateTypeToDelete, setRateTypeToDelete] = React.useState<RateTypeApi | null>(null);

  const {
    rateTypes,
    loading,
    error,
    linksByAccommodation,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleLink,
    handleUnlink,
    extractFrenchText,
    extractEnglishText,
    extractMultilingue
  } = useRateTypeManagement(supplierId, accommodations);

  // Réinitialiser l'état lorsque la modale se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setSelectedRateType(null);
      setRateTypeToDelete(null);
    }
  }, [isOpen]);

  // Recharger les données quand la modale s'ouvre
  React.useEffect(() => {
    if (isOpen && supplierId) {
      // Le hook useRateTypeManagement charge déjà les données dans son useEffect
      // mais on peut forcer un rechargement à l'ouverture de la modale
    }
  }, [isOpen, supplierId]);

  // Gérer la touche Échap pour fermer la modale (sans propagation)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        if (mode === 'list') {
          onClose();
        } else {
          // Retour à la liste si on est dans un sous-mode
          setMode('list');
          setSelectedRateType(null);
          setRateTypeToDelete(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, mode, onClose]);

  /**
   * Gère la création d'un type de tarif
   */
  const handleCreateSubmit = React.useCallback(async (data: TypeTarifModif) => {
    const success = await handleCreate(data);
    if (success) {
      setMode('list');
      if (onDataChanged) {
        onDataChanged();
      }
    }
  }, [handleCreate, onDataChanged]);

  /**
   * Gère la modification d'un type de tarif
   */
  const handleUpdateSubmit = React.useCallback(async (data: TypeTarifModif) => {
    if (!selectedRateType) return;
    const success = await handleUpdate(selectedRateType.idTypeTarif, data);
    if (success) {
      setMode('list');
      setSelectedRateType(null);
      if (onDataChanged) {
        onDataChanged();
      }
    }
  }, [selectedRateType, handleUpdate, onDataChanged]);

  /**
   * Gère la suppression d'un type de tarif
   */
  const handleDeleteConfirm = React.useCallback(async () => {
    if (!rateTypeToDelete) return;
    const success = await handleDelete(rateTypeToDelete.idTypeTarif);
    if (success) {
      setRateTypeToDelete(null);
      setMode('list');
      if (onDataChanged) {
        onDataChanged();
      }
    }
  }, [rateTypeToDelete, handleDelete, onDataChanged]);

  /**
   * Gère la modification des liaisons
   * Retourne true si la modification a réussi
   */
  const handleLinksChange = React.useCallback(async (accommodationId: string, isLinked: boolean): Promise<boolean> => {
    if (!selectedRateType) return false;
    const success = isLinked
      ? await handleLink(accommodationId, selectedRateType.idTypeTarif)
      : await handleUnlink(accommodationId, selectedRateType.idTypeTarif);
    return success;
  }, [selectedRateType, handleLink, handleUnlink]);

  /**
   * Sauvegarde les liaisons
   * Cette fonction est appelée après que toutes les modifications ont été appliquées
   */
  const handleSaveLinks = React.useCallback(async () => {
    // Les liaisons sont déjà sauvegardées via handleLinksChange
    setMode('list');
    setSelectedRateType(null);
    // Mettre à jour les données après toutes les modifications pour réévaluer
    // l'indication dans la colonne de gauche
    if (onDataChanged) {
      onDataChanged();
    }
  }, [onDataChanged]);

  // Obtenir les hébergements liés au type de tarif sélectionné
  // IMPORTANT: Tous les hooks doivent être appelés avant tout return conditionnel
  const linkedAccommodationIds = React.useMemo(() => {
    if (!selectedRateType) return new Set<string>();
    const linked = new Set<string>();
    Object.entries(linksByAccommodation).forEach(([accIdStr, rateTypeIds]) => {
      if (rateTypeIds.has(selectedRateType.idTypeTarif)) {
        linked.add(accIdStr); // accIdStr est déjà un string (GUID)
      }
    });
    return linked;
  }, [selectedRateType, linksByAccommodation]);

  // Préparer les données pour le formulaire de modification
  const editFormData = React.useMemo<TypeTarifModif | undefined>(() => {
    if (!selectedRateType || mode !== 'edit') return undefined;
    return {
      libelle: extractMultilingue(selectedRateType.libelle),
      description: extractMultilingue(selectedRateType.description),
      ordre: selectedRateType.ordre ?? 0
    };
  }, [selectedRateType, mode, extractMultilingue]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={(e) => {
          // Fermer seulement si on clique sur l'overlay (pas sur le contenu)
          if (e.target === e.currentTarget && mode === 'list') {
            onClose();
          }
        }}
      >
        {/* Modal Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: darkTheme.bgSecondary,
            borderRadius: 12,
            border: `1px solid ${darkTheme.borderColor}`,
            maxWidth: mode === 'links' ? 600 : 900,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${darkTheme.borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                color: darkTheme.textPrimary,
                fontSize: 20,
                fontWeight: 600,
                margin: 0
              }}>
                {mode === 'create' && 'Créer un type de tarif'}
                {mode === 'edit' && 'Modifier un type de tarif'}
                {mode === 'links' && 'Gérer les liaisons'}
                {mode === 'delete' && 'Supprimer un type de tarif'}
                {mode === 'list' && 'Gestion des types de tarif'}
              </h2>
              <p style={{
                color: darkTheme.textSecondary,
                fontSize: 12,
                margin: '4px 0 0 0'
              }}>
                Fournisseur #{supplierId}
              </p>
            </div>
            {mode === 'list' && (
              <button
                onClick={() => setMode('create')}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: darkTheme.buttonPrimaryBg,
                  color: darkTheme.buttonText,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = darkTheme.buttonPrimaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = darkTheme.buttonPrimaryBg;
                  }
                }}
              >
                + Créer un type de tarif
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{
            padding: '24px',
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}>
            {error && (
              <div style={{
                padding: '12px',
                background: darkTheme.errorBg,
                border: `1px solid ${darkTheme.error}`,
                borderRadius: 6,
                color: darkTheme.error,
                fontSize: 14,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            {loading && mode === 'list' && (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: darkTheme.textSecondary
              }}>
                Chargement...
              </div>
            )}

            {mode === 'list' && !loading && (
              <>
                <RateTypeList
                  rateTypes={rateTypes}
                  extractFrenchText={extractFrenchText}
                  extractEnglishText={extractEnglishText}
                  onEdit={(rateType) => {
                    setSelectedRateType(rateType);
                    setMode('edit');
                  }}
                  onDelete={(rateType) => {
                    setRateTypeToDelete(rateType);
                    setMode('delete');
                  }}
                  onManageLinks={(rateType) => {
                    setSelectedRateType(rateType);
                    setMode('links');
                  }}
                  isLoading={loading}
                />
              </>
            )}

            {mode === 'create' && (
              <RateTypeForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setMode('list')}
                isSubmitting={loading}
              />
            )}

            {mode === 'edit' && editFormData && (
              <RateTypeForm
                initialData={editFormData}
                onSubmit={handleUpdateSubmit}
                onCancel={() => {
                  setMode('list');
                  setSelectedRateType(null);
                }}
                isSubmitting={loading}
              />
            )}

            {mode === 'links' && selectedRateType && (
              <AccommodationLinkManager
                rateTypeId={selectedRateType.idTypeTarif}
                accommodations={accommodations}
                linkedAccommodationIds={linkedAccommodationIds}
                onLinksChange={handleLinksChange}
                onSave={handleSaveLinks}
                onCancel={() => {
                  setMode('list');
                  setSelectedRateType(null);
                }}
                isLoading={loading}
              />
            )}

            {mode === 'delete' && rateTypeToDelete && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: darkTheme.textPrimary, fontSize: 14 }}>
                  Êtes-vous sûr de vouloir supprimer ce type de tarif ?
                </p>
                <div style={{
                  padding: 16,
                  background: darkTheme.bgTertiary,
                  borderRadius: 6,
                  border: `1px solid ${darkTheme.borderColor}`
                }}>
                  <p style={{ color: darkTheme.textPrimary, fontWeight: 600, margin: '0 0 8px 0' }}>
                    Type de tarif #{rateTypeToDelete.idTypeTarif}
                  </p>
                  <p style={{ color: darkTheme.textSecondary, margin: 0 }}>
                    Libellé (FR): {extractFrenchText(rateTypeToDelete.libelle) || '-'}
                  </p>
                  <p style={{ color: darkTheme.textSecondary, margin: '4px 0 0 0' }}>
                    Libellé (EN): {extractEnglishText(rateTypeToDelete.libelle) || '-'}
                  </p>
                </div>
                <div style={{
                  padding: 12,
                  background: darkTheme.errorBg,
                  border: `1px solid ${darkTheme.error}`,
                  borderRadius: 6
                }}>
                  <p style={{ color: darkTheme.error, fontSize: 13, margin: 0 }}>
                    ⚠️ Cette action est irréversible. Les liaisons avec les hébergements seront également supprimées.
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    onClick={() => {
                      setRateTypeToDelete(null);
                      setMode('list');
                    }}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      background: darkTheme.buttonSecondaryBg,
                      color: darkTheme.buttonText,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      background: darkTheme.error,
                      color: darkTheme.buttonText,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    {loading ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

