/**
 * Composant BookingModal - Modale de réservation
 * 
 * Ce composant affiche une modale avec le récapitulatif de réservation
 * pour chaque hébergement sélectionné, incluant les dates, durées et prix.
 */

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import type { BookingSummary } from '../utils/bookingUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { darkTheme } from '../utils/theme';
import 'react-phone-number-input/style.css';

/**
 * Liste des nationalités disponibles
 */
const NATIONALITIES = [
  'Française',
  'Allemande',
  'Anglaise',
  'Espagnole',
  'Italienne',
  'Belge',
  'Suisse',
  'Néerlandaise',
  'Portugaise',
  'Autrichienne',
  'Suédoise',
  'Norvégienne',
  'Danoise',
  'Finlandaise',
  'Polonaise',
  'Tchèque',
  'Grecque',
  'Roumaine',
  'Hongroise',
  'Américaine',
  'Canadienne',
  'Brésilienne',
  'Argentine',
  'Mexicaine',
  'Japonaise',
  'Chinoise',
  'Indienne',
  'Australienne',
  'Néo-Zélandaise',
  'Sud-Africaine',
  'Autre'
];

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
  // État du formulaire client
  const [clientData, setClientData] = React.useState<ClientData>({
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
  });

  // État pour la checkbox "Client professionnel"
  const [isProfessionalClient, setIsProfessionalClient] = React.useState(false);

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = React.useState<Partial<Record<keyof ClientData, string>>>({});

  // Fonctions de validation
  const validateNom = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null; // La présence est gérée par isFormValid
    // Lettres uniquement (avec accents et caractères spéciaux)
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
    if (!regex.test(value)) {
      return 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes';
    }
    return null;
  }, []);

  const validatePrenom = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null; // La présence est gérée par isFormValid
    // Lettres uniquement (avec accents et caractères spéciaux)
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
    if (!regex.test(value)) {
      return 'Le prénom ne doit contenir que des lettres, espaces, tirets et apostrophes';
    }
    return null;
  }, []);

  const validateEmail = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null; // La présence n'est pas obligatoire pour l'email
    // Validation email standard
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return 'Format d\'email invalide';
    }
    return null;
  }, []);

  const validateVille = React.useCallback((value: string): string | null => {
    if (!value || !value.trim()) return null; // La présence est gérée par isFormValid
    // Lettres et tirets uniquement
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/;
    if (!regex.test(value)) {
      return 'La ville ne doit contenir que des lettres, espaces et tirets';
    }
    return null;
  }, []);

  const validateTelephone = React.useCallback((value: string | undefined): string | null => {
    if (!value || !value.trim()) return null; // La présence est gérée par isFormValid
    // Utiliser la validation de react-phone-number-input
    if (!isValidPhoneNumber(value)) {
      return 'Format de numéro de téléphone invalide';
    }
    return null;
  }, []);

  // Fonction pour valider un champ
  const validateField = React.useCallback((field: keyof ClientData, value: string): string | null => {
    switch (field) {
      case 'nom':
        return validateNom(value);
      case 'prenom':
        return validatePrenom(value);
      case 'email':
        return validateEmail(value);
      case 'ville':
        return validateVille(value);
      case 'telephone':
        return validateTelephone(value);
      default:
        return null;
    }
  }, [validateNom, validatePrenom, validateEmail, validateVille, validateTelephone]);

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
  const sortedSummaries = [...bookingSummaries].sort((a, b) => 
    a.accName.localeCompare(b.accName)
  );

  // Calculer le prix total de toutes les réservations
  const totalPrice = sortedSummaries.reduce((sum, summary) => sum + summary.totalPrice, 0);

  const handleClientDataChange = React.useCallback((field: keyof ClientData, value: string | boolean | undefined) => {
    setClientData(prev => {
      const processedValue = value === undefined ? '' : value;
      const newData = { ...prev, [field]: processedValue };
      
      // Valider le champ si c'est une chaîne
      if (typeof processedValue === 'string') {
        const error = validateField(field, processedValue);
        setValidationErrors(prevErrors => {
          if (error) {
            return { ...prevErrors, [field]: error };
          } else {
            const { [field]: _, ...rest } = prevErrors;
            return rest;
          }
        });
      }
      
      return newData;
    });
  }, [validateField]);

  // Validation des champs obligatoires et de leur format
  const isFormValid = React.useMemo(() => {
    // Champs obligatoires de base
    const hasNom = Boolean(clientData.nom && clientData.nom.trim());
    const hasPrenom = Boolean(clientData.prenom && clientData.prenom.trim());
    const hasTelephone = Boolean(clientData.telephone && clientData.telephone.trim());
    const hasAdresse = Boolean(clientData.adresse && clientData.adresse.trim());
    const hasCodePostal = Boolean(clientData.codePostal && clientData.codePostal.trim());
    const hasVille = Boolean(clientData.ville && clientData.ville.trim());

    // Vérifier qu'il n'y a pas d'erreurs de validation
    const hasNoValidationErrors = Object.keys(validationErrors).length === 0;

    // Champs obligatoires si client professionnel
    let hasProfessionalFields = true;
    if (isProfessionalClient) {
      const hasSociete = Boolean(clientData.societe && clientData.societe.trim());
      const hasSiret = Boolean(clientData.siret && clientData.siret.trim());
      const hasTva = Boolean(clientData.tva && clientData.tva.trim());
      hasProfessionalFields = hasSociete && hasSiret && hasTva;
    }

    return hasNom && hasPrenom && hasTelephone && hasAdresse && hasCodePostal && hasVille && hasProfessionalFields && hasNoValidationErrors;
  }, [clientData, isProfessionalClient, validationErrors]);

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
            maxWidth: 1200,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
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
          <div style={{ 
            padding: '24px', 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: '1fr 450px',
            gap: 24,
            overflow: 'hidden',
            minHeight: 0,
            boxSizing: 'border-box'
          }}>
            {/* Colonne gauche : Liste des séjours */}
            <div style={{ overflow: 'auto', minHeight: 0 }}>
              {sortedSummaries.length === 0 ? (
                <p style={{ color: darkTheme.textSecondary, textAlign: 'center' }}>
                  Aucune réservation à afficher
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {sortedSummaries.map((summary) => (
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
                )                )}
                </div>
              )}

              {/* Total général */}
              {sortedSummaries.length > 0 && (
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

            {/* Colonne droite : Formulaire client */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              borderLeft: `1px solid ${darkTheme.borderColor}`,
              paddingLeft: 24,
              paddingRight: 24,
              overflow: 'hidden',
              height: '100%',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10,
                flex: 1,
                overflow: 'hidden',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                {/* Civilité */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <select
                    value={clientData.civilite || ''}
                    onChange={(e) => handleClientDataChange('civilite', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">M</option>
                    <option value="Mme">Mme</option>
                    <option value="Mlle">Mlle</option>
                  </select>
                </div>

                {/* Nom */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    value={clientData.nom || ''}
                    onChange={(e) => handleClientDataChange('nom', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${validationErrors.nom ? '#ef4444' : darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nom"
                  />
                  {validationErrors.nom && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      {validationErrors.nom}
                    </div>
                  )}
                </div>

                {/* Prénom */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    value={clientData.prenom || ''}
                    onChange={(e) => handleClientDataChange('prenom', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${validationErrors.prenom ? '#ef4444' : darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                    placeholder="Prénom"
                  />
                  {validationErrors.prenom && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      {validationErrors.prenom}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="email"
                    value={clientData.email || ''}
                    onChange={(e) => handleClientDataChange('email', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${validationErrors.email ? '#ef4444' : darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                    placeholder="email@example.com"
                  />
                  {validationErrors.email && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      {validationErrors.email}
                    </div>
                  )}
                </div>

                {/* Téléphone */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <PhoneInput
                    international
                    defaultCountry="FR"
                    value={clientData.telephone || undefined}
                    onChange={(value) => {
                      handleClientDataChange('telephone', value || '');
                    }}
                    className={validationErrors.telephone ? 'phone-input-error' : 'phone-input'}
                    style={{
                      '--PhoneInputCountryFlag-borderColor': darkTheme.borderColor,
                      '--PhoneInputCountryFlag-height': '20px',
                    } as React.CSSProperties}
                  />
                  <style>{`
                    .phone-input .PhoneInputInput {
                      width: 100%;
                      padding: 8px 12px;
                      background-color: ${darkTheme.bgPrimary};
                      border: 1px solid ${darkTheme.borderColor};
                      border-radius: 6px;
                      color: ${darkTheme.textPrimary};
                      font-size: 13px;
                      box-sizing: border-box;
                    }
                    .phone-input .PhoneInputInput:focus {
                      outline: none;
                      border-color: ${darkTheme.buttonPrimaryBg};
                    }
                    .phone-input-error .PhoneInputInput {
                      border-color: #ef4444;
                    }
                    .phone-input .PhoneInputCountry {
                      margin-right: 8px;
                    }
                    .phone-input .PhoneInputCountrySelect {
                      background-color: ${darkTheme.bgPrimary};
                      color: ${darkTheme.textPrimary};
                      border: 1px solid ${darkTheme.borderColor};
                      border-radius: 6px;
                      padding: 4px 8px;
                    }
                  `}</style>
                  {validationErrors.telephone && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      {validationErrors.telephone}
                    </div>
                  )}
                </div>

                {/* Adresse */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    value={clientData.adresse || ''}
                    onChange={(e) => handleClientDataChange('adresse', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                    placeholder="Numéro et nom de rue"
                  />
                </div>

                {/* Code postal et Ville */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 2fr', 
                  gap: 12,
                  width: '100%'
                }}>
                  <div style={{ width: '100%', minWidth: 0 }}>
                    <input
                      type="text"
                      value={clientData.codePostal || ''}
                      onChange={(e) => handleClientDataChange('codePostal', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: darkTheme.bgPrimary,
                        border: `1px solid ${darkTheme.borderColor}`,
                        borderRadius: 6,
                        color: darkTheme.textPrimary,
                        fontSize: 13,
                        boxSizing: 'border-box'
                      }}
                      placeholder="75001"
                    />
                  </div>
                  <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      value={clientData.ville || ''}
                      onChange={(e) => handleClientDataChange('ville', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: darkTheme.bgPrimary,
                        border: `1px solid ${validationErrors.ville ? '#ef4444' : darkTheme.borderColor}`,
                        borderRadius: 6,
                        color: darkTheme.textPrimary,
                        fontSize: 13,
                        boxSizing: 'border-box'
                      }}
                      placeholder="Paris"
                    />
                    {validationErrors.ville && (
                      <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                        {validationErrors.ville}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pays */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <input
                    type="text"
                    value={clientData.pays || ''}
                    onChange={(e) => handleClientDataChange('pays', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                    placeholder="France"
                  />
                </div>

                {/* Nationalité */}
                <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <select
                    value={clientData.nationalite || 'Française'}
                    onChange={(e) => handleClientDataChange('nationalite', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    {NATIONALITIES.map((nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checkbox Client professionnel */}
                <div style={{ width: '100%', minWidth: 0 }}>
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
                      checked={isProfessionalClient}
                      onChange={(e) => setIsProfessionalClient(e.target.checked)}
                      style={{
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        accentColor: darkTheme.buttonPrimaryBg
                      }}
                    />
                    <span>Client professionnel</span>
                  </label>
                </div>

                {/* Champs entreprise - affichés uniquement si client professionnel */}
                {isProfessionalClient && (
                  <>
                    {/* Société */}
                    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                      <input
                        type="text"
                        value={clientData.societe || ''}
                        onChange={(e) => handleClientDataChange('societe', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: darkTheme.bgPrimary,
                          border: `1px solid ${darkTheme.borderColor}`,
                          borderRadius: 6,
                          color: darkTheme.textPrimary,
                          fontSize: 13,
                          boxSizing: 'border-box'
                        }}
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    {/* SIRET */}
                    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                      <input
                        type="text"
                        value={clientData.siret || ''}
                        onChange={(e) => handleClientDataChange('siret', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: darkTheme.bgPrimary,
                          border: `1px solid ${darkTheme.borderColor}`,
                          borderRadius: 6,
                          color: darkTheme.textPrimary,
                          fontSize: 13,
                          boxSizing: 'border-box'
                        }}
                        placeholder="12345678901234"
                      />
                    </div>

                    {/* TVA */}
                    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                      <input
                        type="text"
                        value={clientData.tva || ''}
                        onChange={(e) => handleClientDataChange('tva', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          backgroundColor: darkTheme.bgPrimary,
                          border: `1px solid ${darkTheme.borderColor}`,
                          borderRadius: 6,
                          color: darkTheme.textPrimary,
                          fontSize: 13,
                          boxSizing: 'border-box'
                        }}
                        placeholder="FR12345678901"
                      />
                    </div>
                  </>
                )}

                {/* Remarques */}
                <div style={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  <textarea
                    value={clientData.remarques || ''}
                    onChange={(e) => handleClientDataChange('remarques', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: darkTheme.bgPrimary,
                      border: `1px solid ${darkTheme.borderColor}`,
                      borderRadius: 6,
                      color: darkTheme.textPrimary,
                      fontSize: 13,
                      height: '100%',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Remarques ou informations complémentaires..."
                  />
                </div>
              </div>
            </div>
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
              onClick={() => {
                if (!isFormValid) return;
                // TODO: Implémenter la logique de réservation
                console.log('Réservation confirmée', { bookingSummaries, clientData });
                onClose();
              }}
              disabled={!isFormValid}
              style={{
                padding: '10px 20px',
                backgroundColor: isFormValid ? darkTheme.buttonPrimaryBg : darkTheme.bgTertiary,
                color: isFormValid ? darkTheme.buttonText : darkTheme.textTertiary,
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                boxShadow: darkTheme.shadowSm,
                opacity: isFormValid ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (isFormValid) {
                  e.currentTarget.style.backgroundColor = darkTheme.buttonPrimaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid) {
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

