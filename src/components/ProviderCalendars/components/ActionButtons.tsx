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
  /** Nombre de dates non disponibles dans la sélection */
  unavailableDatesCount?: number;
  /** Nombre de dates disponibles dans la sélection */
  availableDatesCount?: number;
  /** Callback appelé quand l'utilisateur clique sur "Actualiser" */
  onRefresh: () => void;
  /** Callback appelé quand l'utilisateur clique sur "Sauvegarder" */
  onSave: () => void;
  /** Callback appelé quand l'utilisateur clique sur "Ouvrir" */
  onOpenUnavailable?: () => void;
  /** Callback appelé quand l'utilisateur clique sur "Fermer" */
  onCloseAvailable?: () => void;
}

/**
 * Composant pour les boutons d'action
 */
export function ActionButtons({
  loading,
  modifiedRatesCount,
  modifiedDureeMinCount,
  unavailableDatesCount = 0,
  availableDatesCount = 0,
  onRefresh,
  onSave,
  onOpenUnavailable,
  onCloseAvailable
}: ActionButtonsProps): React.ReactElement {
  const totalModifications = modifiedRatesCount + modifiedDureeMinCount;
  
  // États pour l'affichage au survol
  const [refreshHover, setRefreshHover] = React.useState(false);
  const [openHover, setOpenHover] = React.useState(false);
  const [closeHover, setCloseHover] = React.useState(false);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
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
          opacity: loading ? 0.6 : 1,
          minWidth: 180 // Largeur minimale pour éviter le clignotement
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
            setRefreshHover(true);
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
            setRefreshHover(false);
          }
        }}
      >
        {loading ? 'Actualisation...' : (refreshHover ? '⌨️ a' : 'Actualiser les données')}
      </button>
      {availableDatesCount > 0 && onCloseAvailable && (
        <button
          onClick={onCloseAvailable}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: loading ? darkTheme.buttonDisabledBg : '#ef4444', // Rouge
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: darkTheme.shadowSm,
            opacity: loading ? 0.6 : 1,
            minWidth: 160 // Largeur minimale pour éviter le clignotement
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#dc2626'; // Rouge plus foncé au survol
              setCloseHover(true);
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#ef4444';
              setCloseHover(false);
            }
          }}
        >
          {loading ? 'Fermeture...' : (closeHover ? '⌨️ -' : `Fermer (${availableDatesCount} date${availableDatesCount > 1 ? 's' : ''})`)}
        </button>
      )}
      {unavailableDatesCount > 0 && onOpenUnavailable && (
        <button
          onClick={onOpenUnavailable}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: loading ? darkTheme.buttonDisabledBg : '#f59e0b', // Orange/amber
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: darkTheme.shadowSm,
            opacity: loading ? 0.6 : 1,
            minWidth: 160 // Largeur minimale pour éviter le clignotement
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#d97706'; // Darker orange on hover
              setOpenHover(true);
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#f59e0b';
              setOpenHover(false);
            }
          }}
        >
          {loading ? 'Ouverture...' : (openHover ? '⌨️ +' : `Ouvrir (${unavailableDatesCount} date${unavailableDatesCount > 1 ? 's' : ''})`)}
        </button>
      )}
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
            opacity: loading ? 0.6 : 1,
            minWidth: 180 // Largeur minimale pour éviter le clignotement
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

