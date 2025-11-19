/**
 * Composant ProviderCalendars - Composant principal
 * 
 * Ce composant principal orchestre l'affichage des calendriers pour plusieurs fournisseurs.
 * Il gère les onglets de fournisseurs, la sélection d'hébergements, la sélection de dates,
 * et l'édition des tarifs et durées minimales. Il utilise le hook useSupplierData pour
 * la gestion des données et le composant CompactGrid pour l'affichage de la grille.
 */

import React from 'react';
import { createOpenProClient } from '../../../../openpro-api-react/src/client';
import type { Supplier } from './types';
import { defaultSuppliers, baseUrl, apiKey } from './config';
import { formatDate } from './utils/dateUtils';
import { useSupplierData } from './hooks/useSupplierData';
import { CompactGrid } from './components/CompactGrid';

export function ProviderCalendars(): React.ReactElement {
  const [suppliers] = React.useState<Supplier[]>(defaultSuppliers);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [startInput, setStartInput] = React.useState<string>(() => {
    const today = new Date();
    return formatDate(today);
  });
  const [monthsCount, setMonthsCount] = React.useState<number>(1);

  const client = React.useMemo(
    () => createOpenProClient('admin', { baseUrl, apiKey }),
    []
  );

  const supplierData = useSupplierData(client);

  const activeSupplier = suppliers[activeIdx];
  const startDate = React.useMemo(() => {
    const d = new Date(startInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startInput]);

  // Obtenir la sélection de dates pour le fournisseur actif
  const selectedDates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.selectedDatesBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, supplierData.selectedDatesBySupplier]);

  // Obtenir la sélection d'hébergements pour le fournisseur actif
  const selectedAccommodations = React.useMemo(() => {
    if (!activeSupplier) return new Set<number>();
    return supplierData.selectedAccommodationsBySupplier[activeSupplier.idFournisseur] || new Set<number>();
  }, [activeSupplier, supplierData.selectedAccommodationsBySupplier]);

  // Fonction pour mettre à jour la sélection d'hébergements du fournisseur actif
  const setSelectedAccommodations = React.useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedAccommodationsBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<number>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // Fonction pour mettre à jour la sélection de dates du fournisseur actif
  const setSelectedDates = React.useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!activeSupplier) return;
    supplierData.setSelectedDatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier, supplierData]);

  // Obtenir les modifications pour le fournisseur actif
  const modifiedRates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedRatesBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, supplierData.modifiedRatesBySupplier]);

  const modifiedDureeMin = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return supplierData.modifiedDureeMinBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, supplierData.modifiedDureeMinBySupplier]);

  // Obtenir le selectedRateTypeId pour le fournisseur actif
  const selectedRateTypeId = React.useMemo(() => {
    if (!activeSupplier) return null;
    return supplierData.selectedRateTypeIdBySupplier[activeSupplier.idFournisseur] ?? null;
  }, [activeSupplier, supplierData.selectedRateTypeIdBySupplier]);

  // Helper pour extraire les données du fournisseur actif
  const stockByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.stockBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, supplierData.stockBySupplierAndAccommodation]);

  const ratesByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.ratesBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, supplierData.ratesBySupplierAndAccommodation]);

  const dureeMinByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return supplierData.dureeMinBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, supplierData.dureeMinBySupplierAndAccommodation]);

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((newPrice: number) => {
    if (!activeSupplier || selectedRateTypeId === null) return;
    const modifications = new Set<string>();
    supplierData.setRatesBySupplierAndAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.idFournisseur] || {};
      
      // Appliquer le prix à toutes les combinaisons date-hébergement sélectionnées pour le type tarif sélectionné
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          if (!supplierDataState[accId][dateStr]) {
            supplierDataState[accId][dateStr] = {};
          }
          supplierDataState[accId][dateStr][selectedRateTypeId] = newPrice;
          modifications.add(`${accId}-${dateStr}-${selectedRateTypeId}`);
        }
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierDataState };
    });
    // Marquer comme modifié après la mise à jour des prix (pour le fournisseur actif)
    supplierData.setModifiedRatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedDates, selectedAccommodations, activeSupplier, selectedRateTypeId, supplierData]);

  // Fonction pour mettre à jour la durée minimale localement
  const handleDureeMinUpdate = React.useCallback((newDureeMin: number | null) => {
    if (!activeSupplier) return;
    const modifications = new Set<string>();
    supplierData.setDureeMinByAccommodation(prev => {
      const updated = { ...prev };
      const supplierDataState = updated[activeSupplier.idFournisseur] || {};
      
      // Appliquer la durée minimale à toutes les combinaisons date-hébergement sélectionnées
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierDataState[accId]) {
            supplierDataState[accId] = {};
          }
          supplierDataState[accId][dateStr] = newDureeMin;
          modifications.add(`${accId}-${dateStr}`);
        }
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierDataState };
    });
    // Marquer comme modifié après la mise à jour de la durée minimale (pour le fournisseur actif)
    supplierData.setModifiedDureeMinBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedDates, selectedAccommodations, activeSupplier, supplierData]);

  // Fonction pour sauvegarder les modifications (pour l'instant juste log)
  const handleSave = React.useCallback(async () => {
    if (!activeSupplier) return;
    if (modifiedRates.size === 0 && modifiedDureeMin.size === 0) return;
    
    // TODO: Implémenter l'appel API pour sauvegarder les tarifs et durées minimales
    // Pour l'instant, on log juste les modifications
    console.log('Modifications de prix à sauvegarder:', Array.from(modifiedRates));
    console.log('Modifications de durée minimale à sauvegarder:', Array.from(modifiedDureeMin));
    
    // Après sauvegarde réussie, vider les modifications du fournisseur actif
    // supplierData.setModifiedRatesBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }));
    // supplierData.setModifiedDureeMinBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }));
  }, [modifiedRates, modifiedDureeMin, activeSupplier]);

  // Fonction pour actualiser les données du fournisseur actif
  const handleRefreshData = React.useCallback(async () => {
    if (!activeSupplier) return;
    await supplierData.refreshSupplierData(activeSupplier.idFournisseur, startDate, monthsCount);
  }, [activeSupplier, startDate, monthsCount, supplierData]);

  // Chargement initial des données pour tous les fournisseurs au montage du composant
  React.useEffect(() => {
    supplierData.loadInitialData(suppliers, startDate, monthsCount);
  }, []); // Seulement au montage du composant

  return (
    <div style={{ padding: '16px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Date de début</span>
            <input
              type="date"
              value={startInput}
              onChange={e => setStartInput(e.currentTarget.value)}
              style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Durée</span>
            <select
              value={monthsCount}
              onChange={e => setMonthsCount(Number(e.currentTarget.value))}
              style={{ padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value={1}>1 mois</option>
              <option value={2}>2 mois</option>
              <option value={3}>3 mois</option>
            </select>
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        {suppliers.map((s, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={s.idFournisseur}
              onClick={() => setActiveIdx(idx)}
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

      {supplierData.loading && <div>Chargement…</div>}
      {supplierData.error && <div style={{ color: '#b91c1c' }}>Erreur: {supplierData.error}</div>}

      {activeSupplier && (
        <div>
          <h3 style={{ marginBottom: 16 }}>
            Hébergements — {activeSupplier.nom}
          </h3>
          
          <div style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(supplierData.accommodations[activeSupplier.idFournisseur] || [])
                .slice()
                .sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement))
                .map(acc => (
                <label
                  key={acc.idHebergement}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccommodations.has(acc.idHebergement)}
                    onChange={e => {
                      const newSet = new Set(selectedAccommodations);
                      if (e.target.checked) {
                        newSet.add(acc.idHebergement);
                      } else {
                        newSet.delete(acc.idHebergement);
                      }
                      setSelectedAccommodations(newSet);
                    }}
                  />
                  <span>{acc.nomHebergement}</span>
                </label>
              ))}
            </div>
          </div>
          {selectedAccommodations.size > 0 && (
            <>
              {/* Dropdown de sélection du type de tarif */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>Type de tarif :</span>
                    <select
                      value={selectedRateTypeId ?? ''}
                      onChange={(e) => {
                        if (!activeSupplier) return;
                        const newRateTypeId = e.target.value === '' ? null : Number(e.target.value);
                        supplierData.setSelectedRateTypeIdBySupplier(prev => ({
                          ...prev,
                          [activeSupplier.idFournisseur]: newRateTypeId
                        }));
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
                    {!supplierData.rateTypesBySupplier[activeSupplier.idFournisseur] || 
                     supplierData.rateTypesBySupplier[activeSupplier.idFournisseur].length === 0 ? (
                      <option value="">Aucun type tarif disponible</option>
                    ) : (
                      supplierData.rateTypesBySupplier[activeSupplier.idFournisseur].map(type => {
                        const descriptionFr = type.descriptionFr ?? (supplierData.rateTypeLabelsBySupplier[activeSupplier.idFournisseur]?.[type.idTypeTarif]) ?? `Type ${type.idTypeTarif}`;
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
              <CompactGrid
              startDate={startDate}
              monthsCount={monthsCount}
              accommodations={(supplierData.accommodations[activeSupplier.idFournisseur] || [])
                .filter(acc => selectedAccommodations.has(acc.idHebergement))
                .sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement))}
              stockByAccommodation={stockByAccommodation}
              ratesByAccommodation={ratesByAccommodation}
              dureeMinByAccommodation={dureeMinByAccommodation}
              selectedDates={selectedDates}
              onSelectedDatesChange={setSelectedDates}
              modifiedRates={modifiedRates}
              modifiedDureeMin={modifiedDureeMin}
              onRateUpdate={handleRateUpdate}
              onDureeMinUpdate={handleDureeMinUpdate}
              selectedRateTypeId={selectedRateTypeId}
            />
            </>
          )}
          
          {/* Boutons Sauvegarder et Actualiser les données */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              onClick={handleRefreshData}
              disabled={supplierData.loading}
              style={{
                padding: '10px 20px',
                background: supplierData.loading ? '#9ca3af' : '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: supplierData.loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                opacity: supplierData.loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!supplierData.loading) {
                  e.currentTarget.style.background = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (!supplierData.loading) {
                  e.currentTarget.style.background = '#6b7280';
                }
              }}
            >
              {supplierData.loading ? 'Actualisation...' : 'Actualiser les données'}
            </button>
            {(modifiedRates.size > 0 || modifiedDureeMin.size > 0) && (
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                Sauvegarder ({modifiedRates.size + modifiedDureeMin.size} modification{(modifiedRates.size + modifiedDureeMin.size) > 1 ? 's' : ''})
              </button>
            )}
          </div>
          
          {/* Champ texte pour le résumé de sélection (pour tests) */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Résumé de sélection (pour tests)
            </label>
            <textarea
              readOnly
              value={(() => {
                if (selectedDates.size === 0 || selectedAccommodations.size === 0) return '';
                
                const filteredAccommodations = (supplierData.accommodations[activeSupplier.idFournisseur] || [])
                  .filter(acc => selectedAccommodations.has(acc.idHebergement))
                  .sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement));
                
                // Trier les dates sélectionnées par ordre chronologique
                const sortedDates = Array.from(selectedDates).sort();
                
                // Générer le résumé : un jour par ligne
                // Format : Date1, H1 - T1, H2 - T2, H3 - T3
                //          Date2, H1 - T1, H2 - T2, H3 - T3
                const lines: string[] = [];
                for (const dateStr of sortedDates) {
                  const accommodationParts = filteredAccommodations.map(acc => {
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
              })()}
              style={{
                width: '100%',
                minHeight: 80,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'monospace',
                background: '#f9fafb',
                color: '#111827',
                resize: 'vertical'
              }}
              placeholder="Aucune sélection"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default ProviderCalendars;

