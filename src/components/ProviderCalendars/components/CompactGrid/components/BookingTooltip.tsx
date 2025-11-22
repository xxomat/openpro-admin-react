/**
 * Composant Tooltip pour afficher les détails complets d'une réservation
 * 
 * Ce composant affiche un résumé condensé mais complet de toutes les données
 * du dossier de réservation dans une bulle contextuelle.
 */

import React from 'react';
import type { BookingDisplay } from '../../../types';
import { PlateformeReservation } from '../../../types';
import { darkTheme } from '../../../utils/theme';
import { formatDateDisplay } from '../../../utils/dateUtils';

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
  
  // Plateforme de réservation (afficher seulement si différente de Unknown)
  const plateformeReservation = booking.plateformeReservation;
  const showPlateforme = plateformeReservation && plateformeReservation !== PlateformeReservation.Unknown;

  // Section 2 - Client
  const clientParts: string[] = [];
  if (booking.clientCivilite) clientParts.push(booking.clientCivilite);
  if (booking.clientNom) clientParts.push(booking.clientNom);
  const clientFullName = clientParts.length > 0 ? clientParts.join(' ') : 'Client inconnu';
  const clientEmail = booking.clientEmail || 'Non renseigné';
  const clientTelephone = booking.clientTelephone || 'Non renseigné';

  // Section Adresse (affichée seulement si au moins un champ est présent)
  const hasAdresse = booking.clientAdresse || booking.clientCodePostal || booking.clientVille || booking.clientPays;
  const adresseParts: string[] = [];
  if (booking.clientAdresse) adresseParts.push(booking.clientAdresse);
  if (booking.clientCodePostal || booking.clientVille) {
    const villeParts: string[] = [];
    if (booking.clientCodePostal) villeParts.push(booking.clientCodePostal);
    if (booking.clientVille) villeParts.push(booking.clientVille);
    if (villeParts.length > 0) adresseParts.push(villeParts.join(' '));
  }
  if (booking.clientPays) adresseParts.push(booking.clientPays);
  const adresseComplete = adresseParts.length > 0 ? adresseParts.join(', ') : null;

  // Section Entreprise (affichée seulement si au moins un champ est présent)
  const hasEntreprise = booking.clientSociete || booking.clientSiret || booking.clientTva;

  // Section Remarques
  const hasRemarques = booking.clientRemarques && booking.clientRemarques.trim().length > 0;

  // Section 3 - Dates et séjour
  const dateArrivee = booking.dateArrivee ? formatDateDisplay(booking.dateArrivee) : 'Non renseigné';
  const dateDepart = booking.dateDepart ? formatDateDisplay(booking.dateDepart) : 'Non renseigné';
  const nbNuits = booking.nbNuits != null ? `${booking.nbNuits}` : '?';
  const nbPersonnes = booking.nbPersonnes != null ? `${booking.nbPersonnes}` : '?';

  // Section 4 - Paiement et tarif
  const montantTotal = booking.montantTotal != null ? `${Math.round(booking.montantTotal)}` : '?';
  const devise = booking.devise || 'EUR';
  const typeTarifLibelle = booking.typeTarifLibelle || 'Non renseigné';

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
        <div style={{ fontWeight: 600, fontSize: 14, color: darkTheme.textPrimary, borderBottom: `1px solid ${darkTheme.borderColor}`, paddingBottom: 8 }}>
          Réf: {reference}
          {showPlateforme && (
            <>
              <span style={{ margin: '0 8px', color: darkTheme.textSecondary, fontWeight: 400 }}>•</span>
              <span style={{ fontSize: 12, color: darkTheme.textSecondary, fontWeight: 400 }}>
                {plateformeReservation}
              </span>
            </>
          )}
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
              {clientTelephone}
            </div>
          </div>
        </div>

        {/* Section Adresse */}
        {hasAdresse && adresseComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ color: darkTheme.textSecondary }}>
              <span style={{ marginRight: 6 }}>📍</span>
              {adresseComplete}
            </div>
          </div>
        )}

        {/* Section Entreprise */}
        {hasEntreprise && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            <div style={{ fontWeight: 500, color: darkTheme.textPrimary, marginBottom: 2 }}>
              🏢 Entreprise
            </div>
            {booking.clientSociete && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>Société:</span> {booking.clientSociete}
              </div>
            )}
            {booking.clientSiret && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>SIRET:</span> {booking.clientSiret}
              </div>
            )}
            {booking.clientTva && (
              <div style={{ color: darkTheme.textSecondary }}>
                <span style={{ fontWeight: 500 }}>TVA:</span> {booking.clientTva}
              </div>
            )}
          </div>
        )}

        {/* Section Remarques */}
        {hasRemarques && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, borderTop: `1px solid ${darkTheme.borderColor}`, paddingTop: 8 }}>
            <div style={{ color: darkTheme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <span style={{ marginRight: 6 }}>📝</span>
              {booking.clientRemarques}
            </div>
          </div>
        )}

        {/* Section Dates et séjour */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>📅</span>
            <span style={{ fontWeight: 500 }}>Arrivée:</span> {dateArrivee}
          </div>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>📅</span>
            <span style={{ fontWeight: 500 }}>Départ:</span> {dateDepart}
          </div>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>🌙</span>
            {nbNuits} nuits • <span style={{ marginLeft: 4 }}>👥</span> {nbPersonnes} personnes
          </div>
        </div>

        {/* Section Paiement et tarif */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, borderTop: `1px solid ${darkTheme.borderColor}`, paddingTop: 8 }}>
          <div style={{ color: darkTheme.textSecondary }}>
            <span style={{ marginRight: 6 }}>💰</span>
            {montantTotal}€ {devise}
            {typeTarifLibelle && typeTarifLibelle !== 'Non renseigné' && (
              <>
                <span style={{ margin: '0 6px' }}>•</span>
                <span style={{ marginRight: 6 }}>🏷️</span>
                {typeTarifLibelle}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

