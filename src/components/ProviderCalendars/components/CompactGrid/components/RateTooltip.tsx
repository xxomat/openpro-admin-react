/**
 * Composant Tooltip pour afficher les détails complets d'un tarif
 * 
 * Ce composant affiche toutes les informations d'un tarif retournées par OpenPro
 * (sans les champs debut et fin), y compris la collection TarifPax.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { darkTheme } from '../../../utils/theme';

export interface RateDetails {
  rateTypeId?: number;
  rateType?: {
    rateTypeId?: number;
    label?: Array<{ langue: string; texte: string }>;
    description?: Array<{ langue: string; texte: string }>;
    order?: number;
  };
  ratePax?: {
    price?: number;
    occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  };
  pricePax?: {
    price?: number;
    occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  };
  occupationList?: Array<{ numberOfPersons?: number; price?: number }>;
  price?: number;
  label?: Array<{ langue: string; texte: string }>;
  promotion?: boolean | unknown;
  promo?: boolean | unknown;
  promotionActive?: boolean | unknown;
  hasPromo?: boolean | unknown;
  minDuration?: number;
  arrivalAllowed?: boolean;
  departureAllowed?: boolean;
  description?: Array<{ langue: string; texte: string }>;
  order?: number;
}

export interface RateTooltipProps {
  rateDetails: RateDetails | null;
  x: number;
  y: number;
  visible: boolean;
  loading?: boolean;
}

/**
 * Extrait le texte multilingue (priorité au français, sinon premier disponible)
 */
function getMultilingualText(field?: Array<{ langue: string; texte: string }>): string | null {
  if (!field || field.length === 0) return null;
  const french = field.find(f => f.langue === 'fr');
  if (french) return french.texte;
  return field[0].texte;
}

/**
 * Composant Tooltip pour les tarifs
 */
export function RateTooltip({
  rateDetails,
  x,
  y,
  visible,
  loading
}: RateTooltipProps): React.ReactElement | null {
  if (!visible) return null;

  let tooltipContent: React.ReactElement | null = null;

  if (loading) {
    tooltipContent = (
      <div
        style={{
          position: 'fixed',
          left: `${x + 10}px`,
          top: `${y + 10}px`,
          background: darkTheme.bgPrimary,
          border: `1px solid ${darkTheme.borderColor}`,
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          pointerEvents: 'none',
          minWidth: 250,
          opacity: 1
        }}
      >
        <div style={{ color: darkTheme.textSecondary }}>Chargement...</div>
      </div>
    );
  } else if (rateDetails) {
    const rateTypeLabel = getMultilingualText(rateDetails.rateType?.label) || 
                          getMultilingualText(rateDetails.label) || 
                          `Type ${rateDetails.rateTypeId ?? 'N/A'}`;
    
    const rateTypeDescription = getMultilingualText(rateDetails.rateType?.description) || 
                               getMultilingualText(rateDetails.description);
    
    const price = rateDetails.price ?? 
                  rateDetails.ratePax?.price ?? 
                  rateDetails.pricePax?.price;
    
    const hasPromo = Boolean(rateDetails.promotion) ||
                     Boolean(rateDetails.promo) ||
                     Boolean(rateDetails.promotionActive) ||
                     Boolean(rateDetails.hasPromo);
    
    const occupationList = rateDetails.ratePax?.occupationList ?? 
                           rateDetails.pricePax?.occupationList ?? 
                           rateDetails.occupationList ?? 
                           [];

    tooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: `${x + 10}px`,
        top: `${y + 10}px`,
        background: darkTheme.bgPrimary,
        border: `1px solid ${darkTheme.borderColor}`,
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        pointerEvents: 'none',
        minWidth: 250,
        maxWidth: 400,
        opacity: 1
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Section Type de tarif */}
        <div style={{ 
          fontWeight: 600, 
          fontSize: 14, 
          color: darkTheme.textPrimary, 
          borderBottom: `1px solid ${darkTheme.borderColor}`, 
          paddingBottom: 8 
        }}>
          {rateTypeLabel}
          {rateDetails.rateTypeId && (
            <span style={{ fontSize: 12, color: darkTheme.textSecondary, marginLeft: 8 }}>
              (ID: {rateDetails.rateTypeId})
            </span>
          )}
        </div>

        {/* Description */}
        {rateTypeDescription && (
          <div style={{ fontSize: 13, color: darkTheme.textSecondary }}>
            {rateTypeDescription}
          </div>
        )}

        {/* Section Prix */}
        {price != null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>💰</span>
              <span style={{ fontWeight: 500, color: darkTheme.textPrimary }}>
                Prix: {Math.round(price)}€
              </span>
              {hasPromo && (
                <span style={{ 
                  marginLeft: 8, 
                  color: darkTheme.warning, 
                  fontSize: 12 
                }}>
                  🏷️ Promotion
                </span>
              )}
            </div>
          </div>
        )}

        {/* Section TarifPax - Liste des occupations */}
        {occupationList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ fontWeight: 500, color: darkTheme.textPrimary, marginBottom: 4 }}>
              📋 Tarifs par occupation
            </div>
            {occupationList.map((occ, idx) => (
              <div key={idx} style={{ color: darkTheme.textSecondary, paddingLeft: 12 }}>
                {occ.numberOfPersons != null && occ.price != null && (
                  <span>
                    {occ.numberOfPersons} personne{occ.numberOfPersons > 1 ? 's' : ''}: {Math.round(occ.price)}€
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Section Durée minimale */}
        {rateDetails.minDuration != null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>⏱️</span>
              <span style={{ fontWeight: 500 }}>Durée minimale:</span> {rateDetails.minDuration} nuit{rateDetails.minDuration > 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Section Arrivée/Départ autorisés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>✅</span>
            <span style={{ fontWeight: 500 }}>Arrivée:</span> {rateDetails.arrivalAllowed !== false ? 'Autorisée' : 'Non autorisée'}
          </div>
          {rateDetails.departureAllowed !== undefined && (
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>✅</span>
              <span style={{ fontWeight: 500 }}>Départ:</span> {rateDetails.departureAllowed !== false ? 'Autorisé' : 'Non autorisé'}
            </div>
          )}
        </div>

        {/* Section Ordre (si présent) */}
        {rateDetails.order != null && (
          <div style={{ fontSize: 12, color: darkTheme.textTertiary, borderTop: `1px solid ${darkTheme.borderColor}`, paddingTop: 8 }}>
            Ordre: {rateDetails.order}
          </div>
        )}
      </div>
    </div>
    );
  }

  // Utiliser un portal pour rendre le tooltip directement dans le body
  // Cela garantit qu'il ne sera pas affecté par l'opacité ou le z-index des parents
  if (!tooltipContent || typeof document === 'undefined') {
    return null;
  }
  
  return createPortal(tooltipContent, document.body);
}

