/**
 * Composant SupplierTabs - Onglets de sélection de fournisseur
 * 
 * Ce composant affiche les onglets pour sélectionner le fournisseur actif.
 */

import React from 'react';
import type { Supplier } from '../types';

/**
 * Props du composant SupplierTabs
 */
export interface SupplierTabsProps {
  /** Liste des fournisseurs à afficher */
  suppliers: Supplier[];
  /** Index du fournisseur actuellement actif */
  activeIdx: number;
  /** Callback appelé quand l'utilisateur change de fournisseur */
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
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActiveIdxChange(idx);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      onActiveIdxChange(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < suppliers.length - 1) {
      e.preventDefault();
      onActiveIdxChange(idx + 1);
    }
  }, [onActiveIdxChange, suppliers.length]);

  return (
    <div 
      role="tablist" 
      aria-label="Sélection du fournisseur"
      style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}
    >
      {suppliers.map((s, idx) => {
        const isActive = idx === activeIdx;
        return (
          <button
            key={s.idFournisseur}
            role="tab"
            aria-selected={isActive}
            aria-controls={`supplier-panel-${s.idFournisseur}`}
            id={`supplier-tab-${s.idFournisseur}`}
            onClick={() => onActiveIdxChange(idx)}
            onKeyDown={e => handleKeyDown(e, idx)}
            aria-label={`Sélectionner le fournisseur ${s.nom}`}
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

