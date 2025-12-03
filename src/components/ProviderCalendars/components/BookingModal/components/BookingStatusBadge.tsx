/**
 * Composant BookingStatusBadge
 * 
 * Affiche un badge de statut pour une réservation avec les couleurs appropriées
 */

import React from 'react';
import { BookingStatus } from '../../../types';

export interface BookingStatusBadgeProps {
  status?: BookingStatus;
  className?: string;
}

/**
 * Obtient le libellé français du statut
 */
function getStatusLabel(status?: BookingStatus): string {
  switch (status) {
    case BookingStatus.Quote:
      return 'Devis';
    case BookingStatus.Confirmed:
      return 'Confirmée';
    case BookingStatus.Paid:
      return 'Soldée';
    case BookingStatus.Cancelled:
      return 'Annulée';
    case BookingStatus.Past:
      return 'Passée';
    default:
      return 'Inconnu';
  }
}

/**
 * Obtient la couleur de fond du badge selon le statut
 */
function getStatusColor(status?: BookingStatus): string {
  switch (status) {
    case BookingStatus.Quote:
      return '#6b7280'; // gris
    case BookingStatus.Confirmed:
      return '#10b981'; // vert
    case BookingStatus.Paid:
      return '#3b82f6'; // bleu
    case BookingStatus.Cancelled:
      return '#ef4444'; // rouge
    case BookingStatus.Past:
      return '#374151'; // gris foncé
    default:
      return '#64748b'; // gris moyen
  }
}

/**
 * Composant pour afficher le badge de statut d'une réservation
 */
export function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps): React.ReactElement | null {
  if (!status) {
    return null;
  }

  const backgroundColor = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${className}`}
      style={{ backgroundColor }}
      title={`Statut: ${label}`}
    >
      {label}
    </span>
  );
}

