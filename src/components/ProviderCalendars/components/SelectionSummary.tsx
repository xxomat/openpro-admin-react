/**
 * Composant SelectionSummary - Résumé de sélection
 * 
 * Ce composant affiche un résumé textuel de la sélection actuelle
 * (dates, hébergements et tarifs) pour les tests.
 */

import React from 'react';
import type { Accommodation } from '../types';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant SelectionSummary
 */
export interface SelectionSummaryProps {
  /** Set des dates sélectionnées au format YYYY-MM-DD */
  selectedDates: Set<string>;
  /** Liste des hébergements sélectionnés */
  selectedAccommodations: Accommodation[];
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
  /** Map des tarifs par hébergement, date et type de tarif */
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>;
  /** Set des identifiants de tarifs modifiés (format: "accId-dateStr-rateTypeId") */
  modifiedRates: Set<string>;
}

/**
 * Composant pour le résumé de sélection
 */
export function SelectionSummary({
  selectedDates,
  selectedAccommodations,
  selectedRateTypeId,
  ratesByAccommodation,
  modifiedRates
}: SelectionSummaryProps): React.ReactElement {
  const summaryText = React.useMemo(() => {
    if (selectedDates.size === 0 || selectedAccommodations.length === 0) return '';
    
    const sortedDates = Array.from(selectedDates).sort();
    const sortedAccommodations = [...selectedAccommodations].sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement));
    
    const lines: string[] = [];
    for (const dateStr of sortedDates) {
      const accommodationParts = sortedAccommodations.map(acc => {
        const price = selectedRateTypeId !== null
          ? ratesByAccommodation[acc.idHebergement]?.[dateStr]?.[selectedRateTypeId]
          : undefined;
        const isModified = selectedRateTypeId !== null
          ? modifiedRates.has(`${acc.idHebergement}-${dateStr}-${selectedRateTypeId}`)
          : false;
        const priceStr = price != null 
          ? `${Math.round(price)}€${isModified ? '*' : ''}` 
          : '-';
        return `${acc.nomHebergement} - ${priceStr}`;
      });
      const lineParts = [dateStr, ...accommodationParts];
      lines.push(lineParts.join(', '));
    }
    
    return lines.join('\n');
  }, [selectedDates, selectedAccommodations, selectedRateTypeId, ratesByAccommodation, modifiedRates]);

  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: darkTheme.textSecondary }}>
        Résumé de sélection (pour tests)
      </label>
      <textarea
        readOnly
        value={summaryText}
        style={{
          width: '100%',
          minHeight: 80,
          padding: '8px 12px',
          border: `1px solid ${darkTheme.borderColor}`,
          borderRadius: 6,
          fontSize: 13,
          fontFamily: 'monospace',
          background: darkTheme.bgSecondary,
          color: darkTheme.textPrimary,
          resize: 'vertical'
        }}
        placeholder="Aucune sélection"
      />
    </div>
  );
}

