/**
 * Composant StartupWarningsPanel
 * 
 * Affiche les avertissements de synchronisation au démarrage
 */

import React from 'react';
import type { StartupWarning } from '@/services/api/backendClient';
import { getStartupWarnings } from '@/services/api/backendClient';
import { darkTheme } from '../../utils/theme';

export interface StartupWarningsPanelProps {
  onClose?: () => void;
}

export function StartupWarningsPanel({ onClose }: StartupWarningsPanelProps): React.ReactElement {
  const [warnings, setWarnings] = React.useState<StartupWarning[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    loadWarnings();
  }, []);

  const loadWarnings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStartupWarnings();
      setWarnings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des avertissements');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: darkTheme.bgSecondary,
        border: `1px solid ${darkTheme.borderColor}`,
        borderRadius: 8,
        marginBottom: 16
      }}>
        Chargement des avertissements...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: 8,
        color: '#991b1b',
        marginBottom: 16
      }}>
        {error}
      </div>
    );
  }

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: 8,
      marginBottom: 16
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isCollapsed ? 0 : 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontWeight: 600, color: '#92400e' }}>
            {warnings.length} avertissement{warnings.length > 1 ? 's' : ''} de synchronisation
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#92400e',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {isCollapsed ? 'Afficher' : 'Masquer'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '4px 8px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#92400e',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {warnings.map((warning, index) => (
            <div
              key={index}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                borderRadius: 6,
                fontSize: 13,
                color: '#78350f'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {warning.type}
              </div>
              <div>{warning.message}</div>
              {warning.details && Object.keys(warning.details).length > 0 && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#92400e' }}>
                  {JSON.stringify(warning.details, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

