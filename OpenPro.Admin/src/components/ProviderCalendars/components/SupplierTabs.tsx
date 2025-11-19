/**
 * Composant SupplierTabs - Onglets de sélection de fournisseur
 * 
 * Ce composant affiche les onglets pour sélectionner le fournisseur actif.
 */

import React from 'react';
import type { Supplier } from '../types';

export interface SupplierTabsProps {
  suppliers: Supplier[];
  activeIdx: number;
  onActiveIdxChange: (idx: number) => void;
}

/**
 * Composant pour les onglets de fournisseurs
 */
export function SupplierTabs({
  suppliers,
  activeIdx,
  onActiveIdxChange
}: SupplierTabsProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
      {suppliers.map((s, idx) => {
        const isActive = idx === activeIdx;
        return (
          <button
            key={s.idFournisseur}
            onClick={() => onActiveIdxChange(idx)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: isActive ? '#111827' : 'transparent',
              color: isActive ? '#fff' : '#111827',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer'
            }}
          >
            {s.nom}
          </button>
        );
      })}
    </div>
  );
}

