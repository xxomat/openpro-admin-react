/**
 * Composant BookingModal - Modale de réservation
 * 
 * Ce composant affiche une modale avec le récapitulatif de réservation
 * pour chaque hébergement sélectionné, incluant les dates, durées et prix.
 */

import React from 'react';
import type { BookingSummary } from '../utils/bookingUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant BookingModal
 */
export interface BookingModalProps {
  /** Indique si la modale est ouverte */
  isOpen: boolean;
  /** Callback appelé pour fermer la modale */
  onClose: () => void;
  /** Récapitulatifs de réservation par hébergement */
  bookingSummaries: BookingSummary[];
}

/**
 * Composant pour la modale de réservation
 */
export function BookingModal({
  isOpen,
  onClose,
  bookingSummaries
}: BookingModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  // Calculer le prix total de toutes les réservations
  const totalPrice = bookingSummaries.reduce((sum, summary) => sum + summary.totalPrice, 0);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        {/* Modal Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: darkTheme.bgSecondary,
            borderRadius: 12,
            border: `1px solid ${darkTheme.borderColor}`,
            maxWidth: 800,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${darkTheme.borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: darkTheme.textPrimary
              }}
            >
              Récapitulatif de réservation
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: darkTheme.textSecondary,
                fontSize: 24,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
                lineHeight: 1
              }}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px', flex: 1 }}>
            {bookingSummaries.length === 0 ? (
              <p style={{ color: darkTheme.textSecondary, textAlign: 'center' }}>
                Aucune réservation à afficher
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {bookingSummaries.map((summary) => (
                  <div
                    key={summary.accId}
                    style={{
                      padding: '16px',
                      backgroundColor: darkTheme.bgTertiary,
                      borderRadius: 8,
                      border: `1px solid ${darkTheme.borderColor}`
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 16px 0',
                        fontSize: 18,
                        fontWeight: 600,
                        color: darkTheme.textPrimary
                      }}
                    >
                      {summary.accName}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {summary.dateRanges.map((range, index) => {
                        const rangeKey = `${range.startDate}-${range.endDate}`;
                        const price = summary.pricesByRange.get(rangeKey) || 0;

                        return (
                          <div
                            key={index}
                            style={{
                              padding: '12px',
                              backgroundColor: darkTheme.bgSecondary,
                              borderRadius: 6,
                              border: `1px solid ${darkTheme.borderColorLight}`
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: 12,
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: darkTheme.textTertiary,
                                    marginBottom: 4
                                  }}
                                >
                                  Dates
                                </div>
                                <div style={{ color: darkTheme.textPrimary, fontWeight: 500 }}>
                                  {formatDateDisplay(range.startDate)} - {formatDateDisplay(range.endDate)}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: darkTheme.textTertiary,
                                    marginBottom: 4
                                  }}
                                >
                                  Durée
                                </div>
                                <div style={{ color: darkTheme.textPrimary, fontWeight: 500 }}>
                                  {range.nights} {range.nights === 1 ? 'nuit' : 'nuits'}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: darkTheme.textTertiary,
                                    marginBottom: 4
                                  }}
                                >
                                  Prix
                                </div>
                                <div style={{ color: darkTheme.textPrimary, fontWeight: 600 }}>
                                  {Math.round(price)}€
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {summary.dateRanges.length > 1 && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px solid ${darkTheme.borderColor}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ color: darkTheme.textSecondary, fontWeight: 500 }}>
                          Total pour cet hébergement :
                        </span>
                        <span
                          style={{
                            color: darkTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: 700
                          }}
                        >
                          {Math.round(summary.totalPrice)}€
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Total général */}
            {bookingSummaries.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  padding: '16px',
                  backgroundColor: darkTheme.bgTertiary,
                  borderRadius: 8,
                  border: `2px solid ${darkTheme.selectionBorder}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    color: darkTheme.textPrimary,
                    fontSize: 18,
                    fontWeight: 600
                  }}
                >
                  Total général :
                </span>
                <span
                  style={{
                    color: darkTheme.textPrimary,
                    fontSize: 24,
                    fontWeight: 700
                  }}
                >
                  {Math.round(totalPrice)}€
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${darkTheme.borderColor}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: darkTheme.buttonSecondaryBg,
                color: darkTheme.buttonText,
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: darkTheme.shadowSm
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkTheme.buttonSecondaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = darkTheme.buttonSecondaryBg;
              }}
            >
              Fermer
            </button>
            <button
              onClick={() => {
                // TODO: Implémenter la logique de réservation
                console.log('Réservation confirmée', bookingSummaries);
                onClose();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: darkTheme.buttonPrimaryBg,
                color: darkTheme.buttonText,
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: darkTheme.shadowSm
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryBg;
              }}
            >
              Confirmer la réservation
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

