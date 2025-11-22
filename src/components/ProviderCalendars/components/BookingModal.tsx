/**
 * Composant BookingModal - Modale de réservation
 * 
 * Ce composant affiche une modale avec le récapitulatif de réservation
 * pour chaque hébergement sélectionné, incluant les dates, durées et prix.
 * 
 * Deux modes de saisie des informations client sont disponibles :
 * - Mode unifié : un seul formulaire pour tous les hébergements
 * - Mode individuel : un formulaire par hébergement
 */

import React from 'react';
import type { BookingSummary } from '../utils/bookingUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { darkTheme } from '../utils/theme';
import { useBookingForm } from './BookingModal/hooks/useBookingForm';
import { ClientForm } from './BookingModal/components/ClientForm';


/**
 * Données du dossier client (basé sur BookingCustomer de l'API)
 */
export interface ClientData {
  civilite?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  remarques?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  dateNaissance?: string;
  nationalite?: string;
  profession?: string;
  societe?: string;
  siret?: string;
  tva?: string;
  langue?: string;
  newsletter?: boolean;
  cgvAcceptees?: boolean;
}


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
  // Utiliser le hook pour gérer la logique du formulaire
  const {
    clientDataByAccommodation,
    isProfessionalClientByAccommodation,
    validationErrorsByAccommodation,
    applyToAll,
    setApplyToAll,
    handleClientDataChange,
    handleProfessionalClientChange,
    isFormValidForAccommodation,
    isAllFormsValid
  } = useBookingForm(bookingSummaries);

  // Empêcher la propagation de la touche Escape quand la modale est ouverte
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // useCapture = true pour intercepter avant les autres handlers
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);


  // Trier les récapitulatifs par ordre alphabétique du nom d'hébergement
  const sortedSummaries = React.useMemo(() => {
    return [...bookingSummaries].sort((a, b) => a.accName.localeCompare(b.accName));
  }, [bookingSummaries]);

  // Calculer le prix total de toutes les réservations
  const totalPrice = React.useMemo(() => {
    return sortedSummaries.reduce((sum, summary) => sum + summary.totalPrice, 0);
  }, [sortedSummaries]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
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
            maxWidth: sortedSummaries.length === 1 ? 500 : Math.min(450 * sortedSummaries.length + 32 + (sortedSummaries.length > 1 ? 16 * (sortedSummaries.length - 1) : 0), 1400), // 450px par hébergement + padding + gap
            width: sortedSummaries.length === 1 ? 'auto' : 'fit-content', // S'adapte au contenu
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            margin: '0 auto' // Centre la modale horizontalement
          }}
          >
          {/* Content */}
          <div style={{ 
            padding: '24px', 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            boxSizing: 'border-box'
          }}>
            {/* Contenu principal : layout horizontal */}
            <div style={{ 
              flex: 1,
              overflow: 'hidden',
              minHeight: 0,
              boxSizing: 'border-box'
            }}>
              {sortedSummaries.length === 0 ? (
                <p style={{ color: darkTheme.textSecondary, textAlign: 'center' }}>
                  Aucune réservation à afficher
                </p>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row',
                  gap: 16,
                  overflow: sortedSummaries.length === 1 ? 'visible' : 'auto', // Pas de scroll si un seul hébergement
                  overflowY: sortedSummaries.length === 1 ? 'visible' : 'hidden',
                  flex: sortedSummaries.length === 1 ? '0 1 auto' : 1, // Ne pas forcer flex: 1 si un seul hébergement
                  minWidth: 0,
                  width: 'fit-content', // S'adapte au contenu
                  height: '100%',
                  alignItems: 'flex-start',
                  justifyContent: sortedSummaries.length === 1 ? 'center' : 'flex-start' // Centre si un seul hébergement
                }}>
                  {sortedSummaries.map((summary, index) => {
                    const isFirstAccommodation = index === 0;
                    const isDisabled = applyToAll && !isFirstAccommodation;
                    
                    const clientDataForAcc = clientDataByAccommodation.get(summary.accId) || {
                      civilite: '',
                      nom: '',
                      prenom: '',
                      email: '',
                      telephone: '',
                      remarques: '',
                      adresse: '',
                      codePostal: '',
                      ville: '',
                      pays: 'France',
                      nationalite: 'Française',
                      societe: '',
                      siret: '',
                      tva: '',
                      langue: 'fr',
                      newsletter: false,
                      cgvAcceptees: false
                    };
                    
                    const validationErrorsForAcc = validationErrorsByAccommodation.get(summary.accId) || {};
                    const isProfessionalForAcc = isProfessionalClientByAccommodation.get(summary.accId) || false;

                    return (
                      <div
                        key={summary.accId}
                        style={{
                          padding: '16px',
                          backgroundColor: darkTheme.bgTertiary,
                          borderRadius: 8,
                          border: `1px solid ${darkTheme.borderColor}`,
                          width: 'auto', // S'adapte au contenu (le ClientForm de 300px fixera le minimum naturellement)
                          display: 'flex',
                          flexDirection: 'column',
                          flexShrink: 0, // Empêche la colonne de rétrécir
                          height: '100%',
                          maxHeight: '100%'
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
                              border: `1px solid ${darkTheme.borderColorLight}`,
                              width: '100%', // S'adapte à la largeur de la colonne parente
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto auto auto', // Colonnes qui s'adaptent au contenu
                                gap: 12,
                                alignItems: 'center',
                                justifyContent: 'space-between' // Répartit l'espace entre les colonnes
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

                        {/* Formulaire client intégré */}
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: `1px solid ${darkTheme.borderColor}`,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            opacity: isDisabled ? 0.6 : 1,
                            width: '300px' // Largeur fixe pour tout le conteneur
                          }}
                        >
                          {/* Header avec titre et checkbox */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 12
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                color: isDisabled ? darkTheme.textTertiary : darkTheme.textPrimary
                              }}
                            >
                              Informations client
                            </h4>
                            {isFirstAccommodation && (
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  color: darkTheme.textPrimary
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={applyToAll}
                                  onChange={(e) => setApplyToAll(e.target.checked)}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    cursor: 'pointer',
                                    accentColor: darkTheme.buttonPrimaryBg
                                  }}
                                />
                                <span>Appliquer partout</span>
                              </label>
                            )}
                          </div>
                          
                          {/* Formulaire client */}
                          <div style={{ 
                            flex: 1,
                            overflowY: 'auto', 
                            overflowX: 'hidden',
                            minHeight: 0,
                            pointerEvents: isDisabled ? 'none' : 'auto'
                          }}>
                            <ClientForm
                              clientData={clientDataForAcc}
                              onClientDataChange={(field, value) => handleClientDataChange(summary.accId, field, value)}
                              validationErrors={validationErrorsForAcc}
                              isProfessionalClient={isProfessionalForAcc}
                              onProfessionalClientChange={(isProfessional) => handleProfessionalClientChange(summary.accId, isProfessional)}
                              compact={true}
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer avec Total général et Bouton */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: `1px solid ${darkTheme.borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16
            }}
          >
            {/* Total général */}
            {sortedSummaries.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <span
                  style={{
                    color: darkTheme.textPrimary,
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Total général :
                </span>
                <span
                  style={{
                    color: darkTheme.textPrimary,
                    fontSize: 22,
                    fontWeight: 700
                  }}
                >
                  {Math.round(totalPrice)}€
                </span>
              </div>
            )}
            {sortedSummaries.length === 0 && <div />}
            <button
              onClick={() => {
                if (!isAllFormsValid) return;
                // TODO: Implémenter la logique de réservation
                onClose();
              }}
              disabled={!isAllFormsValid}
              style={{
                padding: '10px 20px',
                backgroundColor: isAllFormsValid ? darkTheme.buttonPrimaryBg : darkTheme.bgTertiary,
                color: isAllFormsValid ? darkTheme.buttonText : darkTheme.textTertiary,
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: isAllFormsValid ? 'pointer' : 'not-allowed',
                boxShadow: darkTheme.shadowSm,
                opacity: isAllFormsValid ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (isAllFormsValid) {
                  e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (isAllFormsValid) {
                  e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryBg;
                }
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

