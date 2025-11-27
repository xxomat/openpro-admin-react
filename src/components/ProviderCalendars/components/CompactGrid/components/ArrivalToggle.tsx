/**
 * Composant ArrivalToggle - Toggle switch pour l'arrivée autorisée
 * 
 * Ce composant affiche un toggle switch vert/rouge pour gérer l'arrivée autorisée
 * sur une date. Vert = arrivée autorisée (ON), Rouge = arrivée non autorisée (OFF).
 */

import React from 'react';
import { darkTheme } from '../../../utils/theme';

/**
 * Props du composant ArrivalToggle
 */
export interface ArrivalToggleProps {
  /** Indique si l'arrivée est autorisée */
  isArrivalAllowed: boolean;
  /** Callback appelé quand l'utilisateur change l'état */
  onChange: (isAllowed: boolean) => void;
  /** Indique si le toggle est désactivé */
  disabled?: boolean;
  /** Indique si la valeur a été modifiée */
  isModified?: boolean;
}

/**
 * Composant pour le toggle d'arrivée
 */
export function ArrivalToggle({
  isArrivalAllowed,
  onChange,
  disabled = false,
  isModified = false
}: ArrivalToggleProps): React.ReactElement {
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!isArrivalAllowed);
    }
  }, [disabled, isArrivalAllowed, onChange]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 2,
        left: 2,
        width: 20,
        height: 12,
        borderRadius: 6,
        backgroundColor: isArrivalAllowed ? darkTheme.successBg : darkTheme.errorBg, // Même opacité que les dates avec stock
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isArrivalAllowed ? 'flex-end' : 'flex-start',
        padding: 2,
        boxSizing: 'border-box',
        border: `1px solid ${isArrivalAllowed ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`, // Bordure avec opacité pour cohérence
        zIndex: 10
      }}
      title={isArrivalAllowed ? 'Arrivée autorisée' : 'Arrivée non autorisée'}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.2s'
        }}
      />
      {isModified && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            fontSize: 8,
            color: darkTheme.warning,
            fontWeight: 'bold',
            lineHeight: 1
          }}
        >
          *
        </span>
      )}
    </div>
  );
}

