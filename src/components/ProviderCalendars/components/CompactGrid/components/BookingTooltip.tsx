/**
 * Composant Tooltip pour afficher les détails complets d'une réservation
 * 
 * Ce composant affiche un résumé condensé mais complet de toutes les données
 * du dossier de réservation dans une bulle contextuelle.
 */

import React from 'react';
import type { BookingDisplay } from '@/types';
import { PlateformeReservation } from '@/types';
import { darkTheme, getBookingColor } from '../../../utils/theme';
import { formatDateDisplay } from '../../../utils/dateUtils';
import { BookingStatusBadge } from '../../BookingModal/components/BookingStatusBadge';

export interface BookingTooltipProps {
  booking: BookingDisplay;
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Composant Tooltip pour les réservations
 */
export function BookingTooltip({
  booking,
  x,
  y,
  visible
}: BookingTooltipProps): React.ReactElement | null {
  if (!visible) return null;

  // Section 1 - Référence
  const reference = booking.reference || 'Non renseigné';
  
  // Plateforme de réservation
  const reservationPlatform = booking.reservationPlatform;

  // Section 2 - Client
  const clientParts: string[] = [];
  if (booking.clientTitle) clientParts.push(booking.clientTitle);
  if (booking.clientName) clientParts.push(booking.clientName);
  const clientFullName = clientParts.length > 0 ? clientParts.join(' ') : 'Client inconnu';
  const clientEmail = booking.clientEmail || 'Non renseigné';
  const clientPhone = booking.clientPhone || 'Non renseigné';

  // Section Adresse (affichée seulement si au moins un champ est présent)
  const hasAddress = booking.clientAddress || booking.clientPostalCode || booking.clientCity || booking.clientCountry;
  const addressParts: string[] = [];
  if (booking.clientAddress) addressParts.push(booking.clientAddress);
  if (booking.clientPostalCode || booking.clientCity) {
    const cityParts: string[] = [];
    if (booking.clientPostalCode) cityParts.push(booking.clientPostalCode);
    if (booking.clientCity) cityParts.push(booking.clientCity);
    if (cityParts.length > 0) addressParts.push(cityParts.join(' '));
  }
  if (booking.clientCountry) addressParts.push(booking.clientCountry);
  const addressComplete = addressParts.length > 0 ? addressParts.join(', ') : null;

  // Section Entreprise (affichée seulement si au moins un champ est présent)
  const hasCompany = booking.clientCompany || booking.clientSiret || booking.clientVat;

  // Section Remarques
  const hasNotes = booking.clientNotes && booking.clientNotes.trim().length > 0;

  // Section 3 - Dates et séjour
  const arrivalDate = booking.arrivalDate ? formatDateDisplay(booking.arrivalDate) : 'Non renseigné';
  const departureDate = booking.departureDate ? formatDateDisplay(booking.departureDate) : 'Non renseigné';
  const numberOfNights = booking.numberOfNights != null ? `${booking.numberOfNights}` : '?';
  const numberOfPersons = booking.numberOfPersons != null ? `${booking.numberOfPersons}` : '?';

  // Section 4 - Paiement et tarif
  const totalAmount = booking.totalAmount != null ? `${Math.round(booking.totalAmount)}` : '?';
  const currency = booking.currency || 'EUR';
  const rateTypeLabel = booking.rateTypeLabel || 'Non renseigné';

  return (
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
        zIndex: 1000,
        pointerEvents: 'none',
        minWidth: 250,
        maxWidth: 350
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Section Référence */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontWeight: 600, 
          fontSize: 14, 
          color: darkTheme.textPrimary, 
          borderBottom: `1px solid ${darkTheme.borderColor}`, 
          paddingBottom: 8 
        }}>
          <span>Réf: {reference}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {booking.bookingStatus && (
              <BookingStatusBadge status={booking.bookingStatus} />
            )}
            {reservationPlatform && (
              <span style={{ 
                fontSize: 12, 
                color: getBookingColor(reservationPlatform), 
                fontWeight: 500 
              }}>
                {reservationPlatform}
              </span>
            )}
          </div>
        </div>

        {/* Section Client */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: darkTheme.textPrimary }}>
            {clientFullName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>📧</span>
              {clientEmail}
            </div>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>📞</span>
              {clientPhone}
            </div>
          </div>
        </div>

        {/* Section Adresse */}
        {hasAddress && addressComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>📍</span>
              {addressComplete}
            </div>
          </div>
        )}

        {/* Section Entreprise */}
        {hasCompany && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ fontWeight: 500, color: darkTheme.textPrimary, marginBottom: 2 }}>
              🏢 Entreprise
            </div>
            {booking.clientCompany && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>Société:</span> {booking.clientCompany}
              </div>
            )}
            {booking.clientSiret && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>SIRET:</span> {booking.clientSiret}
              </div>
            )}
            {booking.clientVat && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>TVA:</span> {booking.clientVat}
              </div>
            )}
          </div>
        )}

        {/* Section Remarques */}
        {hasNotes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, borderTop: `1px solid ${darkTheme.borderColor}`, paddingTop: 8 }}>
            <div style={{ color: darkTheme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <span style={{ marginRight: 6 }}>📝</span>
              {booking.clientNotes}
            </div>
          </div>
        )}

        {/* Section Dates et séjour */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>📅</span>
            <span style={{ fontWeight: 500 }}>Arrivée:</span> {arrivalDate}
          </div>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>📅</span>
            <span style={{ fontWeight: 500 }}>Départ:</span> {departureDate}
          </div>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>🌙</span>
            {numberOfNights} nuits • <span style={{ marginLeft: 4 }}>👥</span> {numberOfPersons} personnes
          </div>
        </div>

        {/* Section Paiement et tarif */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, borderTop: `1px solid ${darkTheme.borderColor}`, paddingTop: 8 }}>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>💰</span>
            {totalAmount}€ {currency}
            {rateTypeLabel && rateTypeLabel !== 'Non renseigné' && (
              <>
                <span style={{ margin: '0 6px' }}>•</span>
                <span style={{ marginRight: 6 }}>🏷️</span>
                {rateTypeLabel}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

