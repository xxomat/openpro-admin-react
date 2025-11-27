/**
 * Composant AccommodationLinkManager - Gestionnaire de liaisons hébergement-type de tarif
 * 
 * Ce composant permet de lier ou délier un type de tarif à des hébergements.
 */

import React from 'react';
import type { Accommodation } from '@/types';
import { darkTheme } from '../../../utils/theme';

/**
 * Props du composant AccommodationLinkManager
 */
export interface AccommodationLinkManagerProps {
  /** Type de tarif pour lequel gérer les liaisons */
  rateTypeId: number;
  /** Liste des hébergements disponibles */
  accommodations: Accommodation[];
  /** Set des IDs d'hébergements liés au type de tarif */
  linkedAccommodationIds: Set<number>;
  /** Callback appelé lors de la modification des liaisons */
  onLinksChange: (accommodationId: number, isLinked: boolean) => void;
  /** Callback appelé pour sauvegarder les modifications */
  onSave: () => Promise<void>;
  /** Callback appelé pour annuler */
  onCancel: () => void;
  /** Indique si une action est en cours */
  isLoading?: boolean;
}

/**
 * Composant pour la gestion des liaisons
 */
export function AccommodationLinkManager({
  rateTypeId,
  accommodations,
  linkedAccommodationIds,
  onLinksChange,
  onSave,
  onCancel,
  isLoading = false
}: AccommodationLinkManagerProps): React.ReactElement {
  const [localLinks, setLocalLinks] = React.useState<Set<number>>(linkedAccommodationIds);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Synchroniser avec les props
  React.useEffect(() => {
    setLocalLinks(new Set(linkedAccommodationIds));
  }, [linkedAccommodationIds]);

  /**
   * Bascule l'état de liaison d'un hébergement
   */
  const handleToggleLink = React.useCallback((accommodationId: number) => {
    setLocalLinks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accommodationId)) {
        newSet.delete(accommodationId);
      } else {
        newSet.add(accommodationId);
      }
      return newSet;
    });
  }, []);

  /**
   * Sauvegarde les modifications
   */
  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Calculer les différences
      const toLink: number[] = [];
      const toUnlink: number[] = [];

      // Hébergements à lier (dans localLinks mais pas dans linkedAccommodationIds)
      localLinks.forEach(id => {
        if (!linkedAccommodationIds.has(id)) {
          toLink.push(id);
        }
      });

      // Hébergements à délier (dans linkedAccommodationIds mais pas dans localLinks)
      linkedAccommodationIds.forEach(id => {
        if (!localLinks.has(id)) {
          toUnlink.push(id);
        }
      });

      // Appliquer les modifications
      for (const accId of toLink) {
        onLinksChange(accId, true);
      }
      for (const accId of toUnlink) {
        onLinksChange(accId, false);
      }

      // Sauvegarder
      await onSave();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des liaisons';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [localLinks, linkedAccommodationIds, onLinksChange, onSave]);

  const hasChanges = React.useMemo(() => {
    if (localLinks.size !== linkedAccommodationIds.size) return true;
    for (const id of localLinks) {
      if (!linkedAccommodationIds.has(id)) return true;
    }
    for (const id of linkedAccommodationIds) {
      if (!localLinks.has(id)) return true;
    }
    return false;
  }, [localLinks, linkedAccommodationIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ 
          color: darkTheme.textPrimary, 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          Liaisons pour le type de tarif #{rateTypeId}
        </h3>
        <p style={{ 
          color: darkTheme.textSecondary, 
          fontSize: 14, 
          marginBottom: 16 
        }}>
          Cochez les hébergements auxquels ce type de tarif doit être lié.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: darkTheme.errorBg,
          border: `1px solid ${darkTheme.error}`,
          borderRadius: 6,
          color: darkTheme.error,
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      <div style={{
        maxHeight: 400,
        overflowY: 'auto',
        border: `1px solid ${darkTheme.borderColor}`,
        borderRadius: 6,
        padding: 12
      }}>
        {accommodations.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: darkTheme.textSecondary 
          }}>
            Aucun hébergement disponible
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accommodations.map((acc) => {
              const isLinked = localLinks.has(acc.idHebergement);
              return (
                <label
                  key={acc.idHebergement}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    borderRadius: 4,
                    cursor: isLoading || isSaving ? 'not-allowed' : 'pointer',
                    background: isLinked ? darkTheme.infoBg : 'transparent',
                    opacity: isLoading || isSaving ? 0.5 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isLinked}
                    onChange={() => handleToggleLink(acc.idHebergement)}
                    disabled={isLoading || isSaving}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: isLoading || isSaving ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <span style={{ 
                    color: darkTheme.textPrimary, 
                    fontSize: 14 
                  }}>
                    {acc.nomHebergement} (ID: {acc.idHebergement})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 12 
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || isSaving}
          style={{
            padding: '10px 20px',
            background: darkTheme.buttonSecondaryBg,
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isLoading || isSaving ? 'not-allowed' : 'pointer',
            opacity: isLoading || isSaving ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isSaving) {
              e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !isSaving) {
              e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
            }
          }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isSaving || !hasChanges}
          style={{
            padding: '10px 20px',
            background: darkTheme.buttonPrimaryBg,
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isLoading || isSaving || !hasChanges ? 'not-allowed' : 'pointer',
            opacity: isLoading || isSaving || !hasChanges ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !isSaving && hasChanges) {
              e.currentTarget.style.background = darkTheme.buttonPrimaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !isSaving && hasChanges) {
              e.currentTarget.style.background = darkTheme.buttonPrimaryBg;
            }
          }}
        >
          {isSaving ? 'Sauvegarde...' : 'Appliquer'}
        </button>
      </div>
    </div>
  );
}

