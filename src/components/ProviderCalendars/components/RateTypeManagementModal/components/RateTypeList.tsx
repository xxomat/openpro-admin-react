/**
 * Composant RateTypeList - Liste des types de tarif
 * 
 * Ce composant affiche la liste des types de tarif avec leurs informations
 * et des boutons d'action pour modifier, supprimer et gérer les liaisons.
 */

import React from 'react';
import type { RateTypeApi } from '@/services/api/backendClient';
import { darkTheme } from '../../../utils/theme';

/**
 * Props du composant RateTypeList
 */
export interface RateTypeListProps {
  /** Liste des types de tarif à afficher */
  rateTypes: RateTypeApi[];
  /** Fonction pour extraire le texte français */
  extractFrenchText: (multilingue: unknown) => string | undefined;
  /** Fonction pour extraire le texte anglais */
  extractEnglishText: (multilingue: unknown) => string | undefined;
  /** Callback appelé lors du clic sur "Modifier" */
  onEdit: (rateType: RateTypeApi) => void;
  /** Callback appelé lors du clic sur "Supprimer" */
  onDelete: (rateType: RateTypeApi) => void;
  /** Callback appelé lors du clic sur "Gérer les liaisons" */
  onManageLinks: (rateType: RateTypeApi) => void;
  /** Indique si une action est en cours */
  isLoading?: boolean;
}

/**
 * Composant pour la liste des types de tarif
 */
export function RateTypeList({
  rateTypes,
  extractFrenchText,
  extractEnglishText,
  onEdit,
  onDelete,
  onManageLinks,
  isLoading = false
}: RateTypeListProps): React.ReactElement {

  if (rateTypes.length === 0) {
    return (
      <div style={{ 
        padding: 40, 
        textAlign: 'center', 
        color: darkTheme.textSecondary 
      }}>
        <p>Aucun type de tarif disponible</p>
        <p style={{ fontSize: 12, marginTop: 8, color: darkTheme.textTertiary }}>
          Cliquez sur "Créer un type de tarif" pour en ajouter un
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: 14
      }}>
        <thead>
          <tr style={{ 
            borderBottom: `2px solid ${darkTheme.borderColor}`,
            background: darkTheme.bgTertiary
          }}>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              ID
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              Libellé (FR)
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              Libellé (EN)
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              Description (FR)
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'center', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              Ordre
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'center', 
              color: darkTheme.textPrimary,
              fontWeight: 600
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rateTypes.map((rateType) => {
            const libelleFr = extractFrenchText(rateType.libelle) || '-';
            const libelleEn = extractEnglishText(rateType.libelle) || '-';
            const descriptionFr = extractFrenchText(rateType.description) || '-';

            return (
              <tr
                key={rateType.idTypeTarif}
                style={{
                  borderBottom: `1px solid ${darkTheme.borderColor}`,
                  background: darkTheme.bgSecondary
                }}
              >
                <td style={{ 
                  padding: '12px', 
                  color: darkTheme.textPrimary,
                  fontWeight: 500
                }}>
                  {rateType.idTypeTarif}
                </td>
                <td style={{ 
                  padding: '12px', 
                  color: darkTheme.textPrimary 
                }}>
                  {libelleFr}
                </td>
                <td style={{ 
                  padding: '12px', 
                  color: darkTheme.textPrimary 
                }}>
                  {libelleEn}
                </td>
                <td style={{ 
                  padding: '12px', 
                  color: darkTheme.textSecondary,
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {descriptionFr}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'center',
                  color: darkTheme.textSecondary 
                }}>
                  {rateType.ordre ?? 0}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    justifyContent: 'center' 
                  }}>
                    <button
                      onClick={() => onEdit(rateType)}
                      disabled={isLoading}
                      style={{
                        padding: '6px 12px',
                        background: darkTheme.buttonSecondaryBg,
                        color: darkTheme.buttonText,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
                        }
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => onManageLinks(rateType)}
                      disabled={isLoading}
                      style={{
                        padding: '6px 12px',
                        background: darkTheme.info,
                        color: darkTheme.buttonText,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = darkTheme.info;
                        }
                      }}
                    >
                      Liaisons
                    </button>
                    <button
                      onClick={() => onDelete(rateType)}
                      disabled={isLoading}
                      style={{
                        padding: '6px 12px',
                        background: darkTheme.error,
                        color: darkTheme.buttonText,
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.background = darkTheme.error;
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

