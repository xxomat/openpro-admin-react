/**
 * Composant ActionButtons - Boutons d'action
 * 
 * Ce composant affiche les boutons pour sauvegarder et actualiser les données.
 */

import React from 'react';

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
          background: loading ? '#9ca3af' : '#6b7280',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          opacity: loading ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = '#4b5563';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = '#6b7280';
          }
        }}
      >
        {loading ? 'Actualisation...' : 'Actualiser les données'}
      </button>
      {totalModifications > 0 && (
        <button
          onClick={onSave}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
          }}
        >
          Sauvegarder ({totalModifications} modification{totalModifications > 1 ? 's' : ''})
        </button>
      )}
    </div>
  );
}

