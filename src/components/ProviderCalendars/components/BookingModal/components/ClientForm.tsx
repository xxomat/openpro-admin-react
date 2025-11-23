/**
 * Composant ClientForm - Formulaire de saisie des informations client
 * 
 * Ce composant réutilisable permet de saisir les informations d'un client,
 * avec support pour les clients professionnels et la validation des champs.
 */

import React from 'react';
import PhoneInput from 'react-phone-number-input';
import type { ClientData } from '../../BookingModal';
import { darkTheme } from '../../../utils/theme';
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
 * Props du composant ClientForm
 */
export interface ClientFormProps {
  /** Données client à afficher */
  clientData: ClientData;
  /** Callback appelé quand une donnée client change */
  onClientDataChange: (field: keyof ClientData, value: string | boolean | undefined) => void;
  /** Erreurs de validation par champ */
  validationErrors: Partial<Record<keyof ClientData, string>>;
  /** Indique si le client est professionnel */
  isProfessionalClient: boolean;
  /** Callback appelé quand le statut professionnel change */
  onProfessionalClientChange: (isProfessional: boolean) => void;
  /** Mode compact pour l'affichage dans les cartes d'hébergement */
  compact?: boolean;
  /** Désactive tous les champs du formulaire */
  disabled?: boolean;
}

/**
 * Composant réutilisable pour le formulaire client
 */
export function ClientForm({
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

  // Style pour appliquer le darkTheme au PhoneInput (spécifique à ce formulaire)
  const phoneInputDarkStyle = React.useMemo(() => `
    .phone-input-${formId} .PhoneInput {
      background-color: ${disabled ? darkTheme.bgTertiary : darkTheme.bgPrimary};
      border: 1px solid ${validationErrors.telephone ? darkTheme.error : darkTheme.borderColor};
      border-radius: 6px;
      padding: ${padding};
      color: ${disabled ? darkTheme.textTertiary : darkTheme.textPrimary};
      opacity: ${disabled ? 0.6 : 1};
    }
    .phone-input-${formId} .PhoneInputInput {
      background-color: transparent;
      color: ${disabled ? darkTheme.textTertiary : darkTheme.textPrimary};
      font-size: ${fontSize}px;
    }
    .phone-input-${formId} .PhoneInputInput::placeholder {
      color: ${darkTheme.textTertiary};
      opacity: 0.6;
    }
    .phone-input-${formId} .PhoneInputCountrySelect {
      background-color: transparent;
      color: ${disabled ? darkTheme.textTertiary : darkTheme.textPrimary};
    }
    .phone-input-${formId} .PhoneInputCountrySelect select {
      background-color: ${darkTheme.bgSecondary};
      color: ${darkTheme.textPrimary};
      border: 1px solid ${darkTheme.borderColor};
    }
    .phone-input-${formId} .PhoneInputCountrySelect select option {
      background-color: ${darkTheme.bgSecondary};
      color: ${darkTheme.textPrimary};
    }
    .phone-input-${formId} .PhoneInputCountrySelect select option:hover,
    .phone-input-${formId} .PhoneInputCountrySelect select option:checked {
      background-color: ${darkTheme.bgHover};
      color: ${darkTheme.textPrimary};
    }
  `, [formId, disabled, validationErrors.telephone, padding, fontSize]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap,
      width: '300px', // Largeur fixe
      minWidth: '300px', // Largeur minimale fixe
      maxWidth: '300px', // Largeur maximale fixe
      boxSizing: 'border-box',
      flexShrink: 0 // Empêche le composant de rétrécir
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
          autoComplete="family-name"
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
          autoComplete="given-name"
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
          autoComplete="email"
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
      <div className={`phone-input-${formId}`} style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <style>{phoneInputDarkStyle}</style>
        <PhoneInput
          international
          defaultCountry="FR"
          autoComplete="tel"
          value={clientData.telephone || undefined}
          onChange={(value) => {
            if (!disabled) {
              onClientDataChange('telephone', value || '');
            }
          }}
          disabled={disabled}
        />
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
          autoComplete="street-address"
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
            autoComplete="postal-code"
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
            autoComplete="address-level2"
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
          autoComplete="country"
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
              autoComplete="organization"
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

