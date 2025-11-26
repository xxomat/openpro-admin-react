/**
 * Composant RateTypeForm - Formulaire de création/modification d'un type de tarif
 * 
 * Ce composant affiche un formulaire pour créer ou modifier un type de tarif,
 * avec des champs multilingues pour le libellé et la description.
 */

import React from 'react';
import type { TypeTarifModif, Multilingue } from '@/services/api/backendClient';
import { darkTheme } from '../../../utils/theme';

/**
 * Langues supportées par OpenPro
 */
const SUPPORTED_LANGUAGES = [
  { code: 'ca', label: 'Catalan' },
  { code: 'de', label: 'Allemand' },
  { code: 'es', label: 'Espagnol' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italien' },
  { code: 'nl', label: 'Néerlandais' },
  { code: 'en', label: 'Anglais' }
] as const;

/**
 * Props du composant RateTypeForm
 */
export interface RateTypeFormProps {
  /** Données initiales du type de tarif (pour modification) */
  initialData?: TypeTarifModif;
  /** Callback appelé lors de la soumission du formulaire */
  onSubmit: (data: TypeTarifModif) => void;
  /** Callback appelé lors de l'annulation */
  onCancel: () => void;
  /** Indique si le formulaire est en cours de soumission */
  isSubmitting?: boolean;
}

/**
 * Composant pour le formulaire de type de tarif
 */
export function RateTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: RateTypeFormProps): React.ReactElement {
  // État pour les libellés par langue
  const [libelles, setLibelles] = React.useState<Record<string, string>>(() => {
    const libellesMap: Record<string, string> = {};
    if (initialData?.libelle) {
      initialData.libelle.forEach(item => {
        libellesMap[item.langue] = item.texte;
      });
    }
    return libellesMap;
  });

  // État pour les descriptions par langue
  const [descriptions, setDescriptions] = React.useState<Record<string, string>>(() => {
    const descriptionsMap: Record<string, string> = {};
    if (initialData?.description) {
      initialData.description.forEach(item => {
        descriptionsMap[item.langue] = item.texte;
      });
    }
    return descriptionsMap;
  });

  // État pour l'ordre
  const [ordre, setOrdre] = React.useState<number>(initialData?.ordre ?? 0);

  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  /**
   * Valide le formulaire
   */
  const validate = React.useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validation : français et anglais obligatoires pour le libellé
    if (!libelles.fr || libelles.fr.trim() === '') {
      errors.libelle_fr = 'Le libellé français est obligatoire';
    }
    if (!libelles.en || libelles.en.trim() === '') {
      errors.libelle_en = 'Le libellé anglais est obligatoire';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [libelles]);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Construire les tableaux multilingues
    const libelleArray: Multilingue[] = [];
    const descriptionArray: Multilingue[] = [];

    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      if (libelles[code] && libelles[code].trim() !== '') {
        libelleArray.push({ langue: code, texte: libelles[code].trim() });
      }
      if (descriptions[code] && descriptions[code].trim() !== '') {
        descriptionArray.push({ langue: code, texte: descriptions[code].trim() });
      }
    });

    const formData: TypeTarifModif = {
      libelle: libelleArray,
      description: descriptionArray,
      ordre
    };

    onSubmit(formData);
  }, [libelles, descriptions, ordre, validate, onSubmit]);

  /**
   * Met à jour un libellé
   */
  const handleLibelleChange = React.useCallback((langue: string, value: string) => {
    setLibelles(prev => ({ ...prev, [langue]: value }));
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[`libelle_${langue}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`libelle_${langue}`];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * Met à jour une description
   */
  const handleDescriptionChange = React.useCallback((langue: string, value: string) => {
    setDescriptions(prev => ({ ...prev, [langue]: value }));
  }, []);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section Libellé */}
      <div>
        <h3 style={{ 
          color: darkTheme.textPrimary, 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          Libellé <span style={{ color: darkTheme.error }}>*</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <div key={code}>
              <label style={{ 
                display: 'block', 
                color: darkTheme.textSecondary, 
                fontSize: 14, 
                marginBottom: 4,
                fontWeight: (code === 'fr' || code === 'en') ? 600 : 400
              }}>
                {label}
                {(code === 'fr' || code === 'en') && (
                  <span style={{ color: darkTheme.error, marginLeft: 4 }}>*</span>
                )}
              </label>
              <input
                type="text"
                value={libelles[code] || ''}
                onChange={(e) => handleLibelleChange(code, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${validationErrors[`libelle_${code}`] ? darkTheme.error : darkTheme.inputBorder}`,
                  borderRadius: 6,
                  fontSize: 14,
                  background: darkTheme.inputBg,
                  color: darkTheme.inputText,
                  boxSizing: 'border-box'
                }}
                placeholder={`Saisir le libellé en ${label.toLowerCase()}`}
              />
              {validationErrors[`libelle_${code}`] && (
                <div style={{ 
                  color: darkTheme.error, 
                  fontSize: 12, 
                  marginTop: 4 
                }}>
                  {validationErrors[`libelle_${code}`]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section Description */}
      <div>
        <h3 style={{ 
          color: darkTheme.textPrimary, 
          fontSize: 16, 
          fontWeight: 600, 
          marginBottom: 12 
        }}>
          Description
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <div key={code}>
              <label style={{ 
                display: 'block', 
                color: darkTheme.textSecondary, 
                fontSize: 14, 
                marginBottom: 4 
              }}>
                {label}
              </label>
              <textarea
                value={descriptions[code] || ''}
                onChange={(e) => handleDescriptionChange(code, e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${darkTheme.inputBorder}`,
                  borderRadius: 6,
                  fontSize: 14,
                  background: darkTheme.inputBg,
                  color: darkTheme.inputText,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                placeholder={`Saisir la description en ${label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Champ Ordre */}
      <div>
        <label style={{ 
          display: 'block', 
          color: darkTheme.textSecondary, 
          fontSize: 14, 
          marginBottom: 4 
        }}>
          Ordre
        </label>
        <input
          type="number"
          value={ordre}
          onChange={(e) => setOrdre(Number(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${darkTheme.inputBorder}`,
            borderRadius: 6,
            fontSize: 14,
            background: darkTheme.inputBg,
            color: darkTheme.inputText,
            boxSizing: 'border-box'
          }}
        />
        <div style={{ 
          color: darkTheme.textTertiary, 
          fontSize: 12, 
          marginTop: 4 
        }}>
          Ce champ est obligatoire mais sans intérêt fonctionnel pour l'admin
        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 12, 
        marginTop: 8 
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            background: darkTheme.buttonSecondaryBg,
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = darkTheme.buttonSecondaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = darkTheme.buttonSecondaryBg;
            }
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            background: darkTheme.buttonPrimaryBg,
            color: darkTheme.buttonText,
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = darkTheme.buttonPrimaryHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = darkTheme.buttonPrimaryBg;
            }
          }}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

