/**
 * Composant RateTypeSelector - Sélecteur de type de tarif
 * 
 * Ce composant affiche un dropdown pour sélectionner le type de tarif
 * à afficher dans la grille.
 */

import React from 'react';
import type { RateType } from '../types';

/**
 * Props du composant RateTypeSelector
 */
export interface RateTypeSelectorProps {
  /** Liste des types de tarifs disponibles */
  rateTypes: RateType[];
  /** Map des labels des types de tarifs par ID */
  rateTypeLabels: Record<number, string>;
  /** ID du type de tarif actuellement sélectionné */
  selectedRateTypeId: number | null;
  /** Callback appelé quand l'utilisateur change de type de tarif */
  onSelectedRateTypeIdChange: (id: number | null) => void;
}

/**
 * Composant pour le sélecteur de type de tarif
 */
export function RateTypeSelector({
  rateTypes,
  rateTypeLabels,
  selectedRateTypeId,
  onSelectedRateTypeIdChange
}: RateTypeSelectorProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Type de tarif :</span>
        <select
          value={selectedRateTypeId ?? ''}
          onChange={(e) => {
            const newRateTypeId = e.target.value === '' ? null : Number(e.target.value);
            onSelectedRateTypeIdChange(newRateTypeId);
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            minWidth: 200,
            background: '#fff',
            color: '#111827'
          }}
        >
          {rateTypes.length === 0 ? (
            <option value="">Aucun type tarif disponible</option>
          ) : (
            rateTypes.map(type => {
              const descriptionFr = type.descriptionFr ?? rateTypeLabels[type.idTypeTarif] ?? `Type ${type.idTypeTarif}`;
              const displayText = `${type.idTypeTarif} - ${descriptionFr}`;
              return (
                <option key={type.idTypeTarif} value={type.idTypeTarif}>
                  {displayText}
                </option>
              );
            })
          )}
        </select>
      </label>
    </div>
  );
}

