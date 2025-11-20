/**
 * Composant ActionButtons - Boutons d'action
 * 
 * Ce composant affiche les boutons pour sauvegarder et actualiser les données.
 */

import React from 'react';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant ActionButtons
 */
export interface ActionButtonsProps {
  /** Indique si une opération de chargement est en cours */
  loading: boolean;
  /** Nombre de tarifs modifiés */
  modifiedRatesCount: number;
  /** Nombre de durées minimales modifiées */
  modifiedDureeMinCount: number;
  /** Callback appelé quand l'utilisateur clique sur "Actualiser" */
  onRefresh: () => void;
  /** Callback appelé quand l'utilisateur clique sur "Sauvegarder" */
  onSave: () => void;
}

/**
 * Composant pour les boutons d'action
 */
export function ActionButtons({
  loading,
  modifiedRatesCount,
  modifiedDureeMinCount,
  onRefresh,
  onSave
}: ActionButtonsProps): React.ReactElement {
  const totalModifications = modifiedRatesCount + modifiedDureeMinCount;

  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? darkTheme.buttonDisabledBg : darkTheme.buttonSecondaryBg,
          color: darkTheme.buttonText,
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: darkTheme.shadowSm,
          opacity: loading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
          }
        }}
      >
        {loading ? 'Actualisation...' : 'Actualiser les données'}
      </button>
      {totalModifications > 0 && (
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: loading ? darkTheme.buttonDisabledBg : darkTheme.buttonPrimaryBg,
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: darkTheme.shadowSm,
            opacity: loading ? 0.6 : 1
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
          {loading ? 'Sauvegarde...' : `Sauvegarder (${totalModifications} modification${totalModifications > 1 ? 's' : ''})`}
        </button>
      )}
    </div>
  );
}

