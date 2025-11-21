/**
 * Composant SelectionSummary - Résumé de sélection
 * 
 * Ce composant affiche un résumé textuel de la sélection actuelle
 * (dates, hébergements et tarifs) pour les tests.
 */

import React from 'react';
import type { Accommodation } from '../types';
import { darkTheme } from '../utils/theme';
import { isValidBookingSelectionForAccommodation } from '../utils/bookingUtils';

/**
 * Props du composant SelectionSummary
 */
export interface SelectionSummaryProps {
  /** Set des cellules sélectionnées au format "accId|dateStr" */
  selectedCells: Set<string>;
  /** Liste des hébergements sélectionnés */
  selectedAccommodations: Accommodation[];
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
  /** Map des tarifs par hébergement, date et type de tarif */
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>;
  /** Set des identifiants de tarifs modifiés (format: "accId-dateStr-rateTypeId") */
  modifiedRates: Set<string>;
  /** Map des durées minimales par hébergement et date */
  dureeMinByAccommodation: Record<number, Record<string, number | null>>;
}

/**
 * Composant pour le résumé de sélection
 */
export function SelectionSummary({
  selectedCells,
  selectedAccommodations,
  selectedRateTypeId,
  ratesByAccommodation,
  modifiedRates,
  dureeMinByAccommodation
}: SelectionSummaryProps): React.ReactElement {
  const summaryText = React.useMemo(() => {
    if (selectedCells.size === 0 || selectedAccommodations.length === 0) return '';
    
    // Grouper les cellules par date
    const cellsByDate = new Map<string, Array<{ accId: number; accName: string }>>();
    for (const cellKey of selectedCells) {
      const [accIdStr, dateStr] = cellKey.split('|');
      const accId = parseInt(accIdStr, 10);
      if (isNaN(accId) || !dateStr) continue;
      
      const acc = selectedAccommodations.find(a => a.idHebergement === accId);
      if (!acc) continue;
      
      if (!cellsByDate.has(dateStr)) {
        cellsByDate.set(dateStr, []);
      }
      cellsByDate.get(dateStr)!.push({ accId, accName: acc.nomHebergement });
    }
    
    const sortedDates = Array.from(cellsByDate.keys()).sort();
    
    // Grouper les hébergements pour afficher leur statut de validité
    const accommodationsMap = new Map<number, { accName: string; dates: string[] }>();
    for (const cellKey of selectedCells) {
      const [accIdStr, dateStr] = cellKey.split('|');
      const accId = parseInt(accIdStr, 10);
      if (isNaN(accId) || !dateStr) continue;
      
      const acc = selectedAccommodations.find(a => a.idHebergement === accId);
      if (!acc) continue;
      
      if (!accommodationsMap.has(accId)) {
        accommodationsMap.set(accId, { accName: acc.nomHebergement, dates: [] });
      }
      accommodationsMap.get(accId)!.dates.push(dateStr);
    }
    
    const lines: string[] = [];
    
    // Ajouter un résumé par hébergement avec statut de validité
    for (const [accId, { accName, dates }] of accommodationsMap.entries()) {
      const isValid = isValidBookingSelectionForAccommodation(accId, selectedCells, dureeMinByAccommodation);
      const status = isValid ? '✓ VALIDE' : '✗ INVALIDE';
      const datesStr = dates.sort().join(', ');
      lines.push(`${accName} (${status}): ${datesStr}`);
    }
    
    lines.push(''); // Ligne vide pour séparer
    
    // Ajouter le détail par date
    for (const dateStr of sortedDates) {
      const cells = cellsByDate.get(dateStr)!;
      const accommodationParts = cells.map(({ accId, accName }) => {
        const price = selectedRateTypeId !== null
          ? ratesByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId]
          : undefined;
        const isModified = selectedRateTypeId !== null
          ? modifiedRates.has(`${accId}-${dateStr}-${selectedRateTypeId}`)
          : false;
        const priceStr = price != null 
          ? `${Math.round(price)}€${isModified ? '*' : ''}` 
          : '-';
        return `${accName} - ${priceStr}`;
      });
      const lineParts = [dateStr, ...accommodationParts];
      lines.push(lineParts.join(', '));
    }
    
    return lines.join('\n');
  }, [selectedCells, selectedAccommodations, selectedRateTypeId, ratesByAccommodation, modifiedRates, dureeMinByAccommodation]);

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

