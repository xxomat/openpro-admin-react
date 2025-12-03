/**
 * Composant AccommodationForm
 * 
 * Formulaire de création/modification d'un hébergement
 */

import React from 'react';
import type { AccommodationApi, AccommodationPayload } from '@/services/api/backendClient';
import { darkTheme } from '../../utils/theme';

export interface AccommodationFormProps {
  initialData?: AccommodationApi;
  onSubmit: (data: AccommodationPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AccommodationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: AccommodationFormProps): React.ReactElement {
  const [nom, setNom] = React.useState(initialData?.nom || '');
  const [idDirecte, setIdDirecte] = React.useState(
    initialData?.ids?.Directe?.toString() || ''
  );
  const [idOpenPro, setIdOpenPro] = React.useState(
    initialData?.idOpenPro?.toString() || ''
  );
  const [idBookingCom, setIdBookingCom] = React.useState(
    initialData?.ids?.['Booking.com']?.toString() || ''
  );
  const [idXotelia, setIdXotelia] = React.useState(
    initialData?.ids?.Xotelia?.toString() || ''
  );
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const validate = React.useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!nom.trim()) {
      errors.nom = 'Le nom est obligatoire';
    }
    if (!idDirecte.trim()) {
      errors.idDirecte = 'L\'ID Directe est obligatoire';
    }
    if (!idOpenPro.trim()) {
      errors.idOpenPro = 'L\'ID OpenPro est obligatoire';
    } else if (isNaN(Number(idOpenPro))) {
      errors.idOpenPro = 'L\'ID OpenPro doit être un nombre';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [nom, idDirecte, idOpenPro]);

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const payload: AccommodationPayload = {
      nom: nom.trim(),
      ids: {
        Directe: idDirecte.trim(),
        OpenPro: Number(idOpenPro),
        ...(idBookingCom.trim() && { 'Booking.com': idBookingCom.trim() }),
        ...(idXotelia.trim() && { Xotelia: idXotelia.trim() })
      }
    };

    onSubmit(payload);
  }, [nom, idDirecte, idOpenPro, idBookingCom, idXotelia, validate, onSubmit]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Nom */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: darkTheme.textPrimary }}>
          Nom de l'hébergement <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.nom ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14
          }}
        />
        {validationErrors.nom && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>
            {validationErrors.nom}
          </div>
        )}
      </div>

      {/* ID Directe */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: darkTheme.textPrimary }}>
          ID Directe <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={idDirecte}
          onChange={(e) => setIdDirecte(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.idDirecte ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14
          }}
        />
        {validationErrors.idDirecte && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>
            {validationErrors.idDirecte}
          </div>
        )}
      </div>

      {/* ID OpenPro */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: darkTheme.textPrimary }}>
          ID OpenPro <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="number"
          value={idOpenPro}
          onChange={(e) => setIdOpenPro(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${validationErrors.idOpenPro ? '#ef4444' : darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14
          }}
        />
        {validationErrors.idOpenPro && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>
            {validationErrors.idOpenPro}
          </div>
        )}
      </div>

      {/* ID Booking.com */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: darkTheme.textPrimary }}>
          ID Booking.com (optionnel)
        </label>
        <input
          type="text"
          value={idBookingCom}
          onChange={(e) => setIdBookingCom(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14
          }}
        />
      </div>

      {/* ID Xotelia */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: darkTheme.textPrimary }}>
          ID Xotelia (optionnel)
        </label>
        <input
          type="text"
          value={idXotelia}
          onChange={(e) => setIdXotelia(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14
          }}
        />
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            backgroundColor: darkTheme.bgPrimary,
            border: `1px solid ${darkTheme.borderColor}`,
            borderRadius: 6,
            color: darkTheme.textPrimary,
            fontSize: 14,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1
          }}
        >
          {isSubmitting ? 'Enregistrement...' : initialData ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}

