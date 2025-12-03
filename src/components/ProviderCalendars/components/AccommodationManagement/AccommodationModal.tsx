/**
 * Composant AccommodationModal
 * 
 * Modale principale pour la gestion des hébergements
 */

import React from 'react';
import type { AccommodationApi, AccommodationPayload } from '@/services/api/backendClient';
import {
  listAccommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation
} from '@/services/api/backendClient';
import { AccommodationList } from './AccommodationList';
import { AccommodationForm } from './AccommodationForm';
import { darkTheme } from '../../utils/theme';

export interface AccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

type ViewMode = 'list' | 'create' | 'edit' | 'externalIds';

export function AccommodationModal({
  isOpen,
  onClose,
  onRefresh
}: AccommodationModalProps): React.ReactElement | null {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');
  const [accommodations, setAccommodations] = React.useState<AccommodationApi[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = React.useState<AccommodationApi | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Charger la liste des hébergements
  const loadAccommodations = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAccommodations();
      setAccommodations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des hébergements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage et quand la modale s'ouvre
  React.useEffect(() => {
    if (isOpen && viewMode === 'list') {
      loadAccommodations();
    }
  }, [isOpen, viewMode, loadAccommodations]);

  // Gérer la création
  const handleCreate = React.useCallback(async (payload: AccommodationPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createAccommodation(payload);
      setViewMode('list');
      await loadAccommodations();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  }, [loadAccommodations, onRefresh]);

  // Gérer la modification
  const handleEdit = React.useCallback(async (payload: AccommodationPayload) => {
    if (!selectedAccommodation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateAccommodation(selectedAccommodation.id, payload);
      setViewMode('list');
      setSelectedAccommodation(null);
      await loadAccommodations();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAccommodation, loadAccommodations, onRefresh]);

  // Gérer la suppression
  const handleDelete = React.useCallback(async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hébergement ?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteAccommodation(id);
      await loadAccommodations();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  }, [loadAccommodations, onRefresh]);

  // Gérer l'édition
  const handleEditClick = React.useCallback((acc: AccommodationApi) => {
    setSelectedAccommodation(acc);
    setViewMode('edit');
  }, []);

  // Gérer la gestion des IDs externes (à implémenter plus tard)
  const handleManageExternalIds = React.useCallback((acc: AccommodationApi) => {
    setSelectedAccommodation(acc);
    setViewMode('externalIds');
    // TODO: Implémenter la gestion des IDs externes
    alert('Gestion des IDs externes à implémenter');
  }, []);

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
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: darkTheme.bgSecondary,
            borderRadius: 12,
            border: `1px solid ${darkTheme.borderColor}`,
            maxWidth: 800,
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: darkTheme.textPrimary }}>
              {viewMode === 'list' && 'Gestion des hébergements'}
              {viewMode === 'create' && 'Créer un hébergement'}
              {viewMode === 'edit' && 'Modifier un hébergement'}
              {viewMode === 'externalIds' && 'Gérer les IDs externes'}
            </h2>
            <button
              onClick={viewMode === 'list' ? onClose : () => {
                setViewMode('list');
                setSelectedAccommodation(null);
                setError(null);
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: darkTheme.textSecondary,
                fontSize: 24,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: 6,
                color: '#991b1b',
                marginBottom: 16,
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            {viewMode === 'list' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => setViewMode('create')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      borderRadius: 6,
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    + Créer un hébergement
                  </button>
                </div>
                <AccommodationList
                  accommodations={accommodations}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                  onManageExternalIds={handleManageExternalIds}
                  loading={loading}
                />
              </>
            )}

            {(viewMode === 'create' || viewMode === 'edit') && (
              <AccommodationForm
                initialData={viewMode === 'edit' ? selectedAccommodation || undefined : undefined}
                onSubmit={viewMode === 'create' ? handleCreate : handleEdit}
                onCancel={() => {
                  setViewMode('list');
                  setSelectedAccommodation(null);
                  setError(null);
                }}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

