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
 * Props du composant ClientForm
 */
interface ClientFormProps {
  clientData: ClientData;
  onClientDataChange: (field: keyof ClientData, value: string | boolean | undefined) => void;
  validationErrors: Partial<Record<keyof ClientData, string>>;
  isProfessionalClient: boolean;
  onProfessionalClientChange: (isProfessional: boolean) => void;
  compact?: boolean; // Mode compact pour l'affichage dans les cartes d'hébergement
  disabled?: boolean; // Désactive tous les champs du formulaire
}

/**
 * Composant réutilisable pour le formulaire client
 */
function ClientForm({
  clientData,
  onClientDataChange,
  validationErrors,
  isProfessionalClient,
  onProfessionalClientChange,
  compact = false,
  disabled = false
}: ClientFormProps): React.ReactElement {
  const gap = compact ? 8 : 10;
  const fontSize = compact ? 12 : 13;
  const padding = compact ? '6px 10px' : '8px 12px';
  
  // Générer un ID unique pour ce formulaire pour éviter les conflits de styles
  const formId = React.useMemo(() => `client-form-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Recalculer le style CSS quand disabled ou validationErrors.telephone change
  const phoneInputStyle = React.useMemo(() => `
    .phone-input-${formId}.PhoneInput,
    .phone-input-error-${formId}.PhoneInput {
      display: flex;
      align-items: center;
      width: 100%;
      padding: ${padding};
      background-color: ${disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary};
      border: 1px solid ${validationErrors.telephone ? '#ef4444' : darkTheme.borderColor};
      border-radius: 6px;
      box-sizing: border-box;
      opacity: ${disabled ? 0.6 : 1};
    }
    .phone-input-error-${formId}.PhoneInput {
      border-color: #ef4444 !important;
    }
    .phone-input-${formId} .PhoneInputInput,
    .phone-input-error-${formId} .PhoneInputInput {
      width: 100%;
      padding: 0;
      background-color: transparent;
      border: none;
      border-radius: 0;
      color: ${disabled ? darkTheme.textTertiary : darkTheme.textPrimary};
      font-size: ${fontSize}px;
      box-sizing: border-box;
      cursor: ${disabled ? 'not-allowed' : 'text'};
      outline: none;
    }
    .phone-input-${formId} .PhoneInputInput:focus,
    .phone-input-error-${formId} .PhoneInputInput:focus {
      outline: none;
    }
    .phone-input-${formId} .PhoneInputInput::placeholder,
    .phone-input-error-${formId} .PhoneInputInput::placeholder {
      color: ${darkTheme.textTertiary};
      opacity: 0.6;
    }
    .phone-input-${formId} .PhoneInputCountry,
    .phone-input-error-${formId} .PhoneInputCountry {
      margin-right: 8px;
      opacity: ${disabled ? 0.6 : 1};
    }
    .phone-input-${formId} .PhoneInputCountrySelect,
    .phone-input-error-${formId} .PhoneInputCountrySelect {
      background-color: transparent;
      color: ${disabled ? darkTheme.textTertiary : darkTheme.textPrimary};
      border: none;
      border-radius: 0;
      padding: 0;
      margin-right: 8px;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      font-size: ${fontSize}px;
    }
    .phone-input-${formId} .PhoneInputCountryIcon,
    .phone-input-error-${formId} .PhoneInputCountryIcon {
      opacity: ${disabled ? 0.6 : 1};
    }
  `, [formId, padding, disabled, validationErrors.telephone, fontSize]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap,
      width: '100%',
      minWidth: 0,
      boxSizing: 'border-box'
    }}>
      {/* Civilité */}
      <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <select
          value={clientData.civilite || ''}
          onChange={(e) => onClientDataChange('civilite', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1
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
          onChange={(e) => onClientDataChange('nom', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.nom ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
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
          onChange={(e) => onClientDataChange('prenom', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.prenom ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
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
          onChange={(e) => onClientDataChange('email', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.email ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
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
            if (!disabled) {
              onClientDataChange('telephone', value || '');
            }
          }}
          disabled={disabled}
          className={validationErrors.telephone ? `phone-input-error-${formId}` : `phone-input-${formId}`}
          style={{
            '--PhoneInputCountryFlag-borderColor': darkTheme.borderColor,
            '--PhoneInputCountryFlag-height': '20px',
          } as React.CSSProperties}
        />
        <style>{phoneInputStyle}</style>
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
          onChange={(e) => onClientDataChange('adresse', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
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
            onChange={(e) => onClientDataChange('codePostal', e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding,
              backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
              border: `1px solid ${darkTheme.borderColor}`,
              borderRadius: 6,
              color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
              fontSize,
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1
            }}
            placeholder="75001"
          />
        </div>
        <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <input
            type="text"
            value={clientData.ville || ''}
            onChange={(e) => onClientDataChange('ville', e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding,
              backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
              border: `1px solid ${validationErrors.ville ? '#ef4444' : darkTheme.borderColor}`,
              borderRadius: 6,
              color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
              fontSize,
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1
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
          onChange={(e) => onClientDataChange('pays', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            boxSizing: 'border-box',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1
          }}
          placeholder="France"
        />
      </div>

      {/* Nationalité */}
      <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <select
          value={clientData.nationalite || 'Française'}
          onChange={(e) => onClientDataChange('nationalite', e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding,
            backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            fontSize,
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1
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
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize,
            color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
            opacity: disabled ? 0.6 : 1
          }}
        >
          <input
            type="checkbox"
            checked={isProfessionalClient}
            onChange={(e) => onProfessionalClientChange(e.target.checked)}
            disabled={disabled}
            style={{
              width: 16,
              height: 16,
              cursor: disabled ? 'not-allowed' : 'pointer',
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
              onChange={(e) => onClientDataChange('societe', e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                padding,
                backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
                fontSize,
                boxSizing: 'border-box',
                cursor: disabled ? 'not-allowed' : 'text',
                opacity: disabled ? 0.6 : 1
              }}
              placeholder="Nom de l'entreprise"
            />
          </div>

          {/* SIRET */}
          <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <input
              type="text"
              value={clientData.siret || ''}
              onChange={(e) => onClientDataChange('siret', e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                padding,
                backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
                fontSize,
                boxSizing: 'border-box',
                cursor: disabled ? 'not-allowed' : 'text',
                opacity: disabled ? 0.6 : 1
              }}
              placeholder="12345678901234"
            />
          </div>

          {/* TVA */}
          <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <input
              type="text"
              value={clientData.tva || ''}
              onChange={(e) => onClientDataChange('tva', e.target.value)}
              disabled={disabled}
              style={{
                width: '100%',
                padding,
                backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
                border: `1px solid ${darkTheme.borderColor}`,
                borderRadius: 6,
                color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
                fontSize,
                boxSizing: 'border-box',
                cursor: disabled ? 'not-allowed' : 'text',
                opacity: disabled ? 0.6 : 1
              }}
              placeholder="FR12345678901"
            />
          </div>
        </>
      )}

      {/* Remarques */}
      {!compact && (
        <div style={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <textarea
            value={clientData.remarques || ''}
            onChange={(e) => onClientDataChange('remarques', e.target.value)}
            disabled={disabled}
            style={{
              width: '100%',
              padding,
              backgroundColor: disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary,
              border: `1px solid ${darkTheme.borderColor}`,
              borderRadius: 6,
              color: disabled ? darkTheme.textTertiary : darkTheme.textPrimary,
              fontSize,
              minHeight: compact ? 60 : 80,
              resize: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1
            }}
            placeholder="Remarques ou informations complémentaires..."
          />
        </div>
      )}
    </div>
  );
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
  // État pour le mode "Appliquer à tous les hébergements" (coché par défaut)
  const [applyToAll, setApplyToAll] = React.useState<boolean>(true);

  // État pour les données client par hébergement
  const [clientDataByAccommodation, setClientDataByAccommodation] = React.useState<
    Map<number, ClientData>
  >(new Map());

  // État pour les checkboxes "Client professionnel" par hébergement
  const [isProfessionalClientByAccommodation, setIsProfessionalClientByAccommodation] = React.useState<
    Map<number, boolean>
  >(new Map());

  // État pour les erreurs de validation par hébergement
  const [validationErrorsByAccommodation, setValidationErrorsByAccommodation] = React.useState<
    Map<number, Partial<Record<keyof ClientData, string>>>
  >(new Map());

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

  // Gérer le changement de mode "Appliquer à tous"
  const handleApplyToAllChange = React.useCallback((checked: boolean) => {
    setApplyToAll(checked);
    if (checked && sortedSummaries.length > 0) {
      // Copier les données du premier hébergement vers tous les autres
      const firstAccId = sortedSummaries[0].accId;
      const firstData = clientDataByAccommodation.get(firstAccId) || {
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
      const firstIsProfessional = isProfessionalClientByAccommodation.get(firstAccId) || false;
      
      const newMap = new Map(clientDataByAccommodation);
      const newProfessionalMap = new Map(isProfessionalClientByAccommodation);
      
      sortedSummaries.forEach((summary, index) => {
        if (index > 0) {
          newMap.set(summary.accId, { ...firstData });
          newProfessionalMap.set(summary.accId, firstIsProfessional);
        }
      });
      
      setClientDataByAccommodation(newMap);
      setIsProfessionalClientByAccommodation(newProfessionalMap);
    }
  }, [sortedSummaries, clientDataByAccommodation, isProfessionalClientByAccommodation]);

  // Gérer le changement de données client
  const handleClientDataChange = React.useCallback((accId: number, field: keyof ClientData, value: string | boolean | undefined) => {
    setClientDataByAccommodation(prev => {
      const currentData = prev.get(accId) || {
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
      
      const processedValue = value === undefined ? '' : value;
      const newData = { ...currentData, [field]: processedValue };
      const newMap = new Map(prev);
      newMap.set(accId, newData);
      
      // Si applyToAll est true et qu'on modifie le premier hébergement, synchroniser avec les autres
      if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
        sortedSummaries.forEach((summary, index) => {
          if (index > 0) {
            newMap.set(summary.accId, { ...newData });
          }
        });
      }
      
      // Valider le champ si c'est une chaîne
      if (typeof processedValue === 'string') {
        const error = validateField(field, processedValue);
        setValidationErrorsByAccommodation(prevErrors => {
          const currentErrors = prevErrors.get(accId) || {};
          const newErrors = new Map(prevErrors);
          
          if (error) {
            newErrors.set(accId, { ...currentErrors, [field]: error });
            // Si applyToAll, copier l'erreur aux autres
            if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
              sortedSummaries.forEach((summary, index) => {
                if (index > 0) {
                  const otherErrors = prevErrors.get(summary.accId) || {};
                  newErrors.set(summary.accId, { ...otherErrors, [field]: error });
                }
              });
            }
          } else {
            const { [field]: _, ...rest } = currentErrors;
            newErrors.set(accId, rest);
            // Si applyToAll, supprimer l'erreur des autres aussi
            if (applyToAll && sortedSummaries.length > 0 && accId === sortedSummaries[0].accId) {
              sortedSummaries.forEach((summary, index) => {
                if (index > 0) {
                  const otherErrors = prevErrors.get(summary.accId) || {};
                  const { [field]: __, ...otherRest } = otherErrors;
                  newErrors.set(summary.accId, otherRest);
                }
              });
            }
          }
          
          return newErrors;
        });
      }
      
      return newMap;
    });
  }, [applyToAll, sortedSummaries, validateField]);

  // Validation du formulaire pour un hébergement spécifique
  const isFormValidForAccommodation = React.useCallback((accId: number): boolean => {
    const clientData = clientDataByAccommodation.get(accId);
    if (!clientData) return false;
    
    const hasNom = Boolean(clientData.nom && clientData.nom.trim());
    const hasPrenom = Boolean(clientData.prenom && clientData.prenom.trim());
    const hasTelephone = Boolean(clientData.telephone && clientData.telephone.trim());
    const hasAdresse = Boolean(clientData.adresse && clientData.adresse.trim());
    const hasCodePostal = Boolean(clientData.codePostal && clientData.codePostal.trim());
    const hasVille = Boolean(clientData.ville && clientData.ville.trim());
    
    const errors = validationErrorsByAccommodation.get(accId);
    const hasNoValidationErrors = !errors || Object.keys(errors).length === 0;

    const isProfessional = isProfessionalClientByAccommodation.get(accId) || false;
    let hasProfessionalFields = true;
    if (isProfessional) {
      const hasSociete = Boolean(clientData.societe && clientData.societe.trim());
      const hasSiret = Boolean(clientData.siret && clientData.siret.trim());
      const hasTva = Boolean(clientData.tva && clientData.tva.trim());
      hasProfessionalFields = hasSociete && hasSiret && hasTva;
    }

    return hasNom && hasPrenom && hasTelephone && hasAdresse && hasCodePostal && hasVille && hasProfessionalFields && hasNoValidationErrors;
  }, [clientDataByAccommodation, isProfessionalClientByAccommodation, validationErrorsByAccommodation]);

  // Validation globale (tous les hébergements doivent être valides)
  const isAllFormsValid = React.useMemo(() => {
    return bookingSummaries.every(summary => 
      isFormValidForAccommodation(summary.accId)
    );
  }, [bookingSummaries, isFormValidForAccommodation]);

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
            maxWidth: 1400,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
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
                  overflow: 'auto',
                  overflowY: 'hidden',
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  alignItems: 'flex-start'
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
                          minWidth: '400px',
                          maxWidth: '400px',
                          width: '400px',
                          display: 'flex',
                          flexDirection: 'column',
                          flexShrink: 0,
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
                            opacity: isDisabled ? 0.6 : 1
                          }}
                        >
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
                                  onChange={(e) => handleApplyToAllChange(e.target.checked)}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    cursor: 'pointer',
                                    accentColor: darkTheme.buttonPrimaryBg
                                  }}
                                />
                                <span>Appliquer à tous les hébergements</span>
                              </label>
                            )}
                          </div>
                          <div style={{ 
                            flex: 1,
                            overflowY: 'auto', 
                            overflowX: 'hidden',
                            paddingRight: 8,
                            minHeight: 0,
                            pointerEvents: isDisabled ? 'none' : 'auto'
                          }}>
                            <ClientForm
                              clientData={clientDataForAcc}
                              onClientDataChange={(field, value) => handleClientDataChange(summary.accId, field, value)}
                              validationErrors={validationErrorsForAcc}
                              isProfessionalClient={isProfessionalForAcc}
                              onProfessionalClientChange={(isProfessional) => {
                                const newMap = new Map(isProfessionalClientByAccommodation);
                                newMap.set(summary.accId, isProfessional);
                                
                                // Si applyToAll et premier hébergement, synchroniser avec les autres
                                if (applyToAll && isFirstAccommodation) {
                                  sortedSummaries.forEach((otherSummary, otherIndex) => {
                                    if (otherIndex > 0) {
                                      newMap.set(otherSummary.accId, isProfessional);
                                    }
                                  });
                                }
                                
                                setIsProfessionalClientByAccommodation(newMap);
                              }}
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
                const allClientData = Array.from(clientDataByAccommodation.entries()).map(([accId, data]) => ({
                  accId,
                  clientData: data
                }));
                console.log('Réservation confirmée', { 
                  bookingSummaries, 
                  clientDataByAccommodation: allClientData,
                  applyToAll
                });
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

