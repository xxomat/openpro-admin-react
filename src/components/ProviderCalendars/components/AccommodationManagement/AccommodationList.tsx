/**
 * Composant AccommodationList
 * 
 * Affiche la liste des hébergements avec leurs identifiants
 */

import React from 'react';
import type { AccommodationApi } from '@/services/api/backendClient';
import { darkTheme } from '../../utils/theme';

export interface AccommodationListProps {
  accommodations: AccommodationApi[];
  onEdit: (accommodation: AccommodationApi) => void;
  onDelete: (id: string) => void;
  onManageExternalIds: (accommodation: AccommodationApi) => void;
  loading?: boolean;
}

export function AccommodationList({
  accommodations,
  onEdit,
  onDelete,
  onManageExternalIds,
  loading = false
}: AccommodationListProps): React.ReactElement {
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: darkTheme.textSecondary }}>
        Chargement...
      </div>
    );
  }

  if (accommodations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: darkTheme.textSecondary }}>
        Aucun hébergement trouvé
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {accommodations.map((acc) => (
        <div
          key={acc.id}
          style={{
            padding: '16px',
            backgroundColor: darkTheme.bgSecondary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: darkTheme.textPrimary, marginBottom: 8 }}>
              {acc.nom}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: darkTheme.textSecondary }}>
              <div>
                <span style={{ fontWeight: 500 }}>ID Directe:</span> {acc.ids?.Directe || 'N/A'}
              </div>
              <div>
                <span style={{ fontWeight: 500 }}>ID OpenPro:</span> {acc.idOpenPro || 'N/A'}
              </div>
              {acc.ids && Object.keys(acc.ids).length > 2 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>IDs externes:</span>{' '}
                  {Object.entries(acc.ids)
                    .filter(([key]) => key !== 'Directe' && key !== 'OpenPro')
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onManageExternalIds(acc)}
              style={{
                padding: '6px 12px',
                backgroundColor: darkTheme.bgPrimary,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                color: darkTheme.textPrimary,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              IDs externes
            </button>
            <button
              onClick={() => onEdit(acc)}
              style={{
                padding: '6px 12px',
                backgroundColor: darkTheme.bgPrimary,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                color: darkTheme.textPrimary,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Modifier
            </button>
            <button
              onClick={() => onDelete(acc.id)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

