/**
 * Composant DeleteBookingModal - Modale de confirmation de suppression de réservation
 * 
 * Ce composant affiche une modale de confirmation pour supprimer une réservation Directe.
 * Il affiche un récapitulatif de la réservation et permet de confirmer ou annuler la suppression.
 */

import React from 'react';
import type { BookingDisplay } from '@/types';
import { formatDateDisplay } from '../utils/dateUtils';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant DeleteBookingModal
 */
export interface DeleteBookingModalProps {
  /** Indique si la modale est ouverte */
  isOpen: boolean;
  /** Callback appelé pour fermer la modale */
  onClose: () => void;
  /** La réservation à supprimer */
  booking: BookingDisplay | null;
  /** Nom de l'hébergement */
  accommodationName?: string;
  /** Callback appelé pour confirmer la suppression */
  onConfirmDelete: (booking: BookingDisplay) => Promise<void>;
}

/**
 * Composant pour la modale de confirmation de suppression
 */
export function DeleteBookingModal({
  isOpen,
  onClose,
  booking,
  accommodationName,
  onConfirmDelete
}: DeleteBookingModalProps): React.ReactElement | null {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Gérer la touche Échap pour fermer la modale
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, isDeleting, onClose]);

  // Réinitialiser l'état lorsque la modale s'ouvre ou se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setDeleteError(null);
    }
  }, [isOpen]);

  // Fonction pour confirmer la suppression
  const handleConfirmDelete = React.useCallback(async () => {
    if (!booking || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onConfirmDelete(booking);
      // La fermeture et le rafraîchissement sont gérés par le parent
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression de la réservation');
      setIsDeleting(false);
    }
  }, [booking, isDeleting, onConfirmDelete]);

  if (!isOpen || !booking) return null;

  // Calculer le nombre de nuits
  const nbNuits = booking.nbNuits ?? (() => {
    const arrivee = new Date(booking.dateArrivee);
    const depart = new Date(booking.dateDepart);
    const diffTime = depart.getTime() - arrivee.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={(e) => {
        // Fermer si on clique sur le fond (pas sur la modale elle-même)
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: darkTheme.bgPrimary,
          borderRadius: 12,
          padding: '24px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: `1px solid ${darkTheme.borderColor}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <h2
          style={{
            margin: '0 0 20px 0',
            color: darkTheme.error,
            fontSize: 20,
            fontWeight: 600
          }}
        >
          Supprimer la réservation
        </h2>

        {/* Message d'avertissement */}
        <p
          style={{
            margin: '0 0 24px 0',
            color: darkTheme.textSecondary,
            fontSize: 14,
            lineHeight: 1.5
          }}
        >
          Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
        </p>

        {/* Récapitulatif de la réservation */}
        <div
          style={{
            background: darkTheme.bgSecondary,
            borderRadius: 8,
            padding: '16px',
            marginBottom: '24px',
            border: `1px solid ${darkTheme.borderColor}`
          }}
        >
          {/* Dates */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>📅 </span>
            <span style={{ color: darkTheme.textPrimary, fontSize: 13, fontWeight: 500 }}>
              Arrivée: {formatDateDisplay(booking.dateArrivee)} • Départ: {formatDateDisplay(booking.dateDepart)}
            </span>
            {nbNuits > 0 && (
              <span style={{ color: darkTheme.textSecondary, fontSize: 13, marginLeft: '8px' }}>
                ({nbNuits} nuit{nbNuits > 1 ? 's' : ''})
              </span>
            )}
          </div>

          {/* Client */}
          {booking.clientNom && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>👤 </span>
              <span style={{ color: darkTheme.textPrimary, fontSize: 13, fontWeight: 500 }}>
                {booking.clientNom}
              </span>
            </div>
          )}

          {/* Hébergement */}
          {accommodationName && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>🏠 </span>
              <span style={{ color: darkTheme.textPrimary, fontSize: 13, fontWeight: 500 }}>
                {accommodationName}
              </span>
            </div>
          )}

          {/* Nombre de personnes */}
          {booking.nbPersonnes != null && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>👥 </span>
              <span style={{ color: darkTheme.textPrimary, fontSize: 13 }}>
                {booking.nbPersonnes} personne{booking.nbPersonnes > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Montant total */}
          {booking.montantTotal != null && (
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>💰 </span>
              <span style={{ color: darkTheme.textPrimary, fontSize: 13, fontWeight: 500 }}>
                {Math.round(booking.montantTotal)}€ {booking.devise ? booking.devise : ''}
              </span>
            </div>
          )}

          {/* Référence */}
          {booking.reference && (
            <div>
              <span style={{ color: darkTheme.textSecondary, fontSize: 13 }}>🔖 </span>
              <span style={{ color: darkTheme.textPrimary, fontSize: 13 }}>
                Réf: {booking.reference}
              </span>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {deleteError && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: `1px solid ${darkTheme.error}`,
              borderRadius: 6,
              padding: '12px',
              marginBottom: '20px',
              color: darkTheme.error,
              fontSize: 13
            }}
          >
            {deleteError}
          </div>
        )}

        {/* Boutons d'action */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              background: darkTheme.bgSecondary,
              color: darkTheme.textPrimary,
              border: `1px solid ${darkTheme.borderColor}`,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = darkTheme.bgTertiary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = darkTheme.bgSecondary;
              }
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              background: isDeleting ? darkTheme.buttonDisabledBg : '#ef4444',
              color: darkTheme.buttonText,
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = '#ef4444';
              }
            }}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

