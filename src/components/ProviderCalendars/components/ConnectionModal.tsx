/**
 * Modale de connexion au backend
 * 
 * Cette modale s'affiche au démarrage de l'application et bloque l'interface
 * jusqu'à ce que la connexion au backend soit établie ou qu'une erreur soit détectée.
 */

import React from 'react';
import { darkTheme } from '../utils/theme';

export interface ConnectionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ConnectionModal({
  isOpen,
  isLoading,
  error,
  onRetry
}: ConnectionModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
        }}
      >
        <div
          style={{
            backgroundColor: darkTheme.bgPrimary,
            borderRadius: 12,
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: `1px solid ${darkTheme.border}`,
            color: darkTheme.textPrimary
          }}
        >
          {isLoading && !error && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px'
                }}
              >
                <div
                  className="connection-spinner"
                  style={{
                    width: '24px',
                    height: '24px',
                    border: `3px solid ${darkTheme.border}`,
                    borderTopColor: darkTheme.buttonPrimaryBg,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  Connexion au backend...
                </h2>
              </div>
              <p style={{ margin: 0, color: darkTheme.textSecondary, fontSize: '14px' }}>
                Veuillez patienter pendant la connexion au serveur.
              </p>
            </>
          )}

          {error && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    margin: 0,
                    marginBottom: '12px',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: darkTheme.error
                  }}
                >
                  Erreur de connexion
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: darkTheme.textSecondary,
                    fontSize: '14px',
                    lineHeight: '1.5',
                    marginBottom: '8px'
                  }}
                >
                  {error}
                </p>
                <p
                  style={{
                    margin: 0,
                    color: darkTheme.textSecondary,
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }}
                >
                  Vérifiez que le backend est bien démarré et accessible.
                </p>
              </div>
              <button
                onClick={onRetry}
                style={{
                  padding: '12px 24px',
                  backgroundColor: darkTheme.buttonPrimaryBg,
                  color: darkTheme.buttonText,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: darkTheme.shadowSm,
                  width: '100%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryBg;
                }}
              >
                Réessayer la connexion
              </button>
            </>
          )}
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}

