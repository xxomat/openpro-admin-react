import React from 'react';
import { createOpenProClient } from '../../../openpro-api-react/src/client';

type Supplier = { idFournisseur: number; nom: string };
type Accommodation = { idHebergement: number; nomHebergement: string };

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getWeeksInRange(startDate: Date, monthsCount: number): Date[][] {
  const weeks: Date[][] = [];
  const endDate = addMonths(startDate, monthsCount);
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const weekDays: Date[] = [];
    // First week starts exactly at startDate
    if (weeks.length === 0) {
      // First week: start from startDate and add 6 more days (7 days total)
      for (let i = 0; i < 7 && currentDate < endDate; i++) {
        weekDays.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    } else {
      // Subsequent weeks: start on Monday
      // Find the Monday of the week containing currentDate
      const dayOfWeek = (currentDate.getDay() + 6) % 7; // 0 = Monday
      if (dayOfWeek !== 0) {
        // Move to next Monday
        currentDate = addDays(currentDate, 7 - dayOfWeek);
      }
      // Add 7 days for a complete week
      for (let i = 0; i < 7 && currentDate < endDate; i++) {
        weekDays.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    }
    if (weekDays.length > 0) {
      weeks.push(weekDays);
    }
  }
  return weeks;
}

const baseUrl = import.meta.env.PUBLIC_OPENPRO_BASE_URL || 'http://localhost:3000';
const apiKey = import.meta.env.PUBLIC_OPENPRO_API_KEY || 'dev-key';

// Configure default suppliers for DEV if not provided via env
const suppliersFromEnv = (() => {
  try {
    const raw = import.meta.env.PUBLIC_OPENPRO_SUPPLIERS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Supplier[];
    }
  } catch {
    // ignore
  }
  return null;
})();

const defaultSuppliers: Supplier[] =
  suppliersFromEnv ??
  [
    { idFournisseur: 47186, nom: 'La Becterie' },
    { idFournisseur: 55123, nom: 'Gîte en Cotentin' }
  ];

export function ProviderCalendars(): JSX.Element {
  const [suppliers] = React.useState<Supplier[]>(defaultSuppliers);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [accommodations, setAccommodations] = React.useState<Record<number, Accommodation[]>>({});
  const [stockByAccommodation, setStockByAccommodation] = React.useState<
    Record<number, Record<string, number>>
  >({});
  const [ratesByAccommodation, setRatesByAccommodation] = React.useState<
    Record<number, Record<string, number>>
  >({});
  const [promoByAccommodation, setPromoByAccommodation] = React.useState<
    Record<number, Record<string, boolean>>
  >({});
  const [rateTypesByAccommodation, setRateTypesByAccommodation] = React.useState<
    Record<number, Record<string, string[]>>
  >({});
  const [rateTypeLabelsBySupplier, setRateTypeLabelsBySupplier] = React.useState<
    Record<number, Record<number, string>>
  >({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [startInput, setStartInput] = React.useState<string>(() => {
    const today = new Date();
    return formatDate(today);
  });
  const [monthsCount, setMonthsCount] = React.useState<number>(1);
  const [selectedAccommodations, setSelectedAccommodations] = React.useState<Set<number>>(new Set());
  const [selectedDates, setSelectedDates] = React.useState<Set<string>>(new Set());
  // Suivi des modifications locales (format: "idHebergement-dateStr")
  const [modifiedRates, setModifiedRates] = React.useState<Set<string>>(new Set());


  const client = React.useMemo(
    () => createOpenProClient('admin', { baseUrl, apiKey }),
    []
  );

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((newPrice: number) => {
    const modifications = new Set<string>();
    setRatesByAccommodation(prev => {
      const updated = { ...prev };
      // Appliquer le prix à toutes les combinaisons date-hébergement sélectionnées
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!updated[accId]) {
            updated[accId] = {};
          }
          updated[accId][dateStr] = newPrice;
          modifications.add(`${accId}-${dateStr}`);
        }
      }
      return updated;
    });
    // Marquer comme modifié après la mise à jour des prix
    setModifiedRates(prevMod => {
      const newMod = new Set(prevMod);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return newMod;
    });
  }, [selectedDates, selectedAccommodations]);

  // Fonction pour sauvegarder les modifications (pour l'instant juste log)
  const handleSave = React.useCallback(async () => {
    if (modifiedRates.size === 0) return;
    
    // TODO: Implémenter l'appel API pour sauvegarder les tarifs
    // Pour l'instant, on log juste les modifications
    console.log('Modifications à sauvegarder:', Array.from(modifiedRates));
    
    // Après sauvegarde réussie, vider modifiedRates
    // setModifiedRates(new Set());
  }, [modifiedRates]);

  const activeSupplier = suppliers[activeIdx];
  const startDate = React.useMemo(() => {
    const d = new Date(startInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startInput]);

  // Load accommodations on supplier change
  React.useEffect(() => {
    if (!activeSupplier) return;
    const idFournisseur = activeSupplier.idFournisseur;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await client.listAccommodations(idFournisseur);
        if (cancelled) return;
        // Normalize API/stub shapes to internal { idHebergement, nomHebergement }
        const items: Accommodation[] = ((resp as any).hebergements ?? (resp as any).listeHebergement ?? []).map((x: any) => {
          const id = x?.idHebergement ?? x?.cleHebergement?.idHebergement;
          const name = x?.nomHebergement ?? x?.nom ?? '';
          return { idHebergement: Number(id), nomHebergement: String(name) };
        });
        setAccommodations(prev => ({ ...prev, [idFournisseur]: items }));
        // Auto-select all accommodations when loaded
        setSelectedAccommodations(new Set(items.map(acc => acc.idHebergement)));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Erreur lors du chargement des hébergements');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSupplier?.idFournisseur]);

  // Load stock for each accommodation of active supplier
  React.useEffect(() => {
    const idFournisseur = activeSupplier?.idFournisseur;
    if (!idFournisseur) return;
    const list = accommodations[idFournisseur] || [];
    if (!list.length) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const nextStock: Record<number, Record<string, number>> = {};
        const nextRates: Record<number, Record<string, number>> = {};
        const nextPromo: Record<number, Record<string, boolean>> = {};
        const nextRateTypes: Record<number, Record<string, string[]>> = {};
        // Use actual start date (TimeBaseStartDate) and calculate end date by adding months
        const debut = formatDate(startDate);
        const endDate = addMonths(startDate, monthsCount);
        const fin = formatDate(endDate);
        // Ensure we have rate type labels for this supplier
        let rateTypeLabels = rateTypeLabelsBySupplier[idFournisseur];
        if (!rateTypeLabels) {
          try {
            const rt = await client.listRateTypes(idFournisseur);
            const mapLabels: Record<number, string> = {};
            const list = (rt as any).typeTarifs ?? (rt as any).typeTarif ?? [];
            for (const item of list) {
              const id = Number(item?.idTypeTarif);
              let label: string | undefined;
              const rawLibelle = item?.libelle ?? item?.Libelle;
              if (typeof rawLibelle === 'string') {
                label = rawLibelle;
              } else if (Array.isArray(rawLibelle)) {
                const fr = rawLibelle.find((l: any) => (l?.langue ?? l?.Langue) === 'fr');
                label = (fr?.texte ?? fr?.Texte) ?? (rawLibelle[0]?.texte ?? rawLibelle[0]?.Texte);
              } else if (rawLibelle && typeof rawLibelle === 'object') {
                label = rawLibelle?.fr ?? rawLibelle?.FR ?? rawLibelle?.default;
              }
              if (id && label) {
                mapLabels[id] = String(label);
              }
            }
            rateTypeLabels = mapLabels;
            setRateTypeLabelsBySupplier(prev => ({ ...prev, [idFournisseur]: mapLabels }));
          } catch {
            // ignore, fallback to inline labels
            rateTypeLabels = {};
          }
        }
        for (const acc of list) {
          const stock = await client.getStock(idFournisseur, acc.idHebergement, {
            debut,
            fin,
            // support stub-server filtering keys too
            start: debut,
            end: fin
          } as unknown as { debut?: string; fin?: string });
          if (cancelled) return;
          const mapStock: Record<string, number> = {};
          const jours = (stock as any).jours ?? (stock as any).stock ?? [];
          for (const j of jours) {
            const date = j.date ?? j.jour;
            const dispo = j.dispo ?? j.stock ?? 0;
            if (date) {
              mapStock[String(date)] = Number(dispo ?? 0);
            }
          }
          nextStock[acc.idHebergement] = mapStock;

          // Fetch rates for the same period, if available
          try {
            const rates = await client.getRates(idFournisseur, acc.idHebergement, { debut, fin });
            const mapRates: Record<string, number> = {};
            const mapPromo: Record<string, boolean> = {};
            const mapRateTypes: Record<string, string[]> = {};
            const tarifs = (rates as any).tarifs ?? (rates as any).periodes ?? [];
            for (const t of tarifs) {
              const deb = t.debut ?? t.dateDebut ?? debut;
              const fe = t.fin ?? t.dateFin ?? fin;
              const startD = new Date(deb);
              const endD = new Date(fe);
              // find price for 2 persons if present, otherwise any/default
              let price: number | undefined = undefined;
              const pax = t.tarifPax ?? t.prixPax ?? {};
              const occs = pax.listeTarifPaxOccupation ?? t.listeTarifPaxOccupation ?? [];
              // Heuristic: detect promotions if present in payload
              const tHasPromo =
                Boolean((t as any)?.promotion) ||
                Boolean((t as any)?.promo) ||
                Boolean((t as any)?.promotionActive) ||
                Boolean((t as any)?.hasPromo);
              // Determine rate type label, prefer supplier list mapping
              const idType = Number(t.idTypeTarif ?? t?.typeTarif?.idTypeTarif);
              let rateLabel: string | undefined = undefined;
              if (idType && rateTypeLabels && rateTypeLabels[idType]) {
                rateLabel = rateTypeLabels[idType];
              }
              const labelCandidate = (t?.typeTarif?.libelle ?? t?.typeTarif?.Libelle ?? t?.libelle ?? t?.Libelle) as unknown;
              if (typeof labelCandidate === 'string') {
                rateLabel = labelCandidate;
              } else if (Array.isArray(labelCandidate)) {
                const frEntry = labelCandidate.find((l: any) => (l?.langue ?? l?.Langue) === 'fr');
                const fr = frEntry?.texte ?? frEntry?.Texte;
                const anyText = fr ?? (labelCandidate[0]?.texte ?? labelCandidate[0]?.Texte);
                if (anyText) rateLabel = String(anyText);
              }
              if (!rateLabel && idType) rateLabel = `Type ${idType}`;
              if (Array.isArray(occs)) {
                const two = occs.find((o: any) => Number(o.nbPers) === 2 && o.prix != null);
                const anyOcc = two ?? occs.find((o: any) => o.prix != null);
                if (anyOcc && anyOcc.prix != null) price = Number(anyOcc.prix);
                if (!tHasPromo) {
                  const occHasPromo = Boolean((two ?? anyOcc)?.hasPromo || (two ?? anyOcc)?.promotion);
                  if (occHasPromo) {
                    // mark later per-day
                  }
                }
              } else if (typeof pax === 'object' && pax && pax.prix != null) {
                price = Number(pax.prix);
              } else if (t.prix != null) {
                price = Number(t.prix);
              }
              if (price != null && !isNaN(price)) {
                const cur = new Date(startD);
                while (cur <= endD) {
                  const key = formatDate(cur);
                  mapRates[key] = price;
                  if (tHasPromo) {
                    mapPromo[key] = true;
                  }
                  if (rateLabel) {
                    const arr = mapRateTypes[key] ?? [];
                    if (!arr.includes(rateLabel)) {
                      arr.push(rateLabel);
                      // Limit labels per day to avoid overflow
                      mapRateTypes[key] = arr.slice(0, 2);
                    } else {
                      mapRateTypes[key] = arr;
                    }
                  }
                  cur.setDate(cur.getDate() + 1);
                }
              }
            }
            nextRates[acc.idHebergement] = mapRates;
            nextPromo[acc.idHebergement] = mapPromo;
            nextRateTypes[acc.idHebergement] = mapRateTypes;
          } catch {
            // ignore rates errors for now
          }
        }
        if (!cancelled) {
          setStockByAccommodation(nextStock);
          setRatesByAccommodation(nextRates);
          setPromoByAccommodation(nextPromo);
          setRateTypesByAccommodation(nextRateTypes);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Erreur lors du chargement du stock');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSupplier?.idFournisseur, accommodations[activeSupplier?.idFournisseur || -1], startInput, monthsCount]);

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

      {loading && <div>Chargement…</div>}
      {error && <div style={{ color: '#b91c1c' }}>Erreur: {error}</div>}

      {activeSupplier && (
        <div>
          <h3 style={{ marginBottom: 16 }}>
            Hébergements — {activeSupplier.nom}
          </h3>
          
          <div style={{ marginBottom: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(accommodations[activeSupplier.idFournisseur] || [])
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
            <CompactGrid
              startDate={startDate}
              monthsCount={monthsCount}
              accommodations={(accommodations[activeSupplier.idFournisseur] || [])
                .filter(acc => selectedAccommodations.has(acc.idHebergement))
                .sort((a, b) => a.nomHebergement.localeCompare(b.nomHebergement))}
              stockByAccommodation={stockByAccommodation}
              ratesByAccommodation={ratesByAccommodation}
              selectedDates={selectedDates}
              onSelectedDatesChange={setSelectedDates}
              modifiedRates={modifiedRates}
              onRateUpdate={handleRateUpdate}
            />
          )}
          
          {/* Bouton Sauvegarder */}
          {modifiedRates.size > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
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
                Sauvegarder ({modifiedRates.size} modification{modifiedRates.size > 1 ? 's' : ''})
              </button>
            </div>
          )}
          
          {/* Champ texte pour le résumé de sélection (pour tests) */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              Résumé de sélection (pour tests)
            </label>
            <textarea
              readOnly
              value={(() => {
                if (selectedDates.size === 0 || selectedAccommodations.size === 0) return '';
                
                const filteredAccommodations = (accommodations[activeSupplier.idFournisseur] || [])
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
                    const price = ratesByAccommodation[acc.idHebergement]?.[dateStr];
                    const isModified = modifiedRates.has(`${acc.idHebergement}-${dateStr}`);
                    const priceStr = price != null 
                      ? `${Math.round(price)}€${isModified ? '*' : ''}` 
                      : 'N/A';
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

function CompactGrid({
  startDate,
  monthsCount,
  accommodations,
  stockByAccommodation,
  ratesByAccommodation,
  selectedDates,
  onSelectedDatesChange,
  modifiedRates,
  onRateUpdate
}: {
  startDate: Date;
  monthsCount: number;
  accommodations: Accommodation[];
  stockByAccommodation: Record<number, Record<string, number>>;
  ratesByAccommodation: Record<number, Record<string, number>>;
  selectedDates: Set<string>;
  onSelectedDatesChange: (dates: Set<string>) => void;
  modifiedRates: Set<string>;
  onRateUpdate: (newPrice: number) => void;
}) {
  const weeks = React.useMemo(() => getWeeksInRange(startDate, monthsCount), [startDate, monthsCount]);
  const weekDayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Flatten all days from all weeks into a single array
  const allDays = weeks.flat();

  // État pour suivre la cellule en cours d'édition
  const [editingCell, setEditingCell] = React.useState<{ accId: number; dateStr: string } | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>('');

  // Gestionnaire de clic pour sélectionner/désélectionner une colonne
  const handleHeaderClick = React.useCallback((dateStr: string) => {
    onSelectedDatesChange(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  }, [onSelectedDatesChange]);

  // Gestionnaire pour la touche Échap : annule toute sélection ou annule l'édition
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingCell) {
          // Annuler l'édition en cours
          setEditingCell(null);
          setEditingValue('');
        } else {
          // Annuler toute sélection
          onSelectedDatesChange(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell, onSelectedDatesChange]);

  // Gestionnaire pour démarrer l'édition d'une cellule
  const handleCellClick = React.useCallback((accId: number, dateStr: string) => {
    // Vérifier que la sélection est active et que cette colonne est sélectionnée
    if (selectedDates.size === 0 || !selectedDates.has(dateStr)) {
      return;
    }
    const currentPrice = ratesByAccommodation[accId]?.[dateStr];
    setEditingCell({ accId, dateStr });
    setEditingValue(currentPrice != null ? String(Math.round(currentPrice)) : '');
  }, [selectedDates, ratesByAccommodation]);

  // Gestionnaire pour valider l'édition
  const handleEditSubmit = React.useCallback(() => {
    if (!editingCell) return;
    const numValue = parseFloat(editingValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onRateUpdate(numValue);
    }
    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, onRateUpdate]);

  // Gestionnaire pour annuler l'édition
  const handleEditCancel = React.useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${allDays.length}, 80px)`,
          gap: 2,
          minWidth: 'fit-content'
        }}
      >
        {/* Ligne 1 - Header row */}
        <div
          style={{
            padding: '8px 12px',
            background: '#f9fafb',
            borderBottom: '2px solid #e5e7eb',
            fontWeight: 600,
            fontSize: 13,
            color: '#374151',
            position: 'sticky',
            left: 0,
            zIndex: 10,
            borderRight: '1px solid #e5e7eb'
          }}
        >
          Hébergement
        </div>
        {allDays.map((day, idx) => {
          const dayOfWeek = (day.getDay() + 6) % 7; // 0 = Monday
          const dateStr = formatDate(day);
          const isSelected = selectedDates.has(dateStr);
          return (
            <div
              key={idx}
              onClick={() => handleHeaderClick(dateStr)}
              style={{
                padding: '8px 4px',
                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : '#f9fafb',
                borderBottom: '2px solid #e5e7eb',
                borderLeft: isSelected ? '3px solid #3b82f6' : 'none',
                borderRight: isSelected ? '3px solid #3b82f6' : 'none',
                borderTop: isSelected ? '3px solid #3b82f6' : 'none',
                textAlign: 'center',
                fontSize: 11,
                color: '#6b7280',
                fontWeight: 500,
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div>{weekDayHeaders[dayOfWeek]}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{day.getDate()}/{day.getMonth() + 1}</div>
            </div>
          );
        })}

        {/* Lignes suivantes - une ligne par hébergement */}
        {accommodations.map(acc => {
          const stockMap = stockByAccommodation[acc.idHebergement] || {};
          const priceMap = ratesByAccommodation[acc.idHebergement] || {};

          return (
            <React.Fragment key={acc.idHebergement}>
              {/* Cellule nom de l'hébergement */}
              <div
                style={{
                  padding: '12px',
                  background: '#fff',
                  borderRight: '1px solid #e5e7eb',
                  borderBottom: '1px solid #e5e7eb',
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                  fontWeight: 500,
                  fontSize: 13,
                  color: '#111827'
                }}
              >
                {acc.nomHebergement}
              </div>

              {/* Cellules de données pour chaque jour */}
              {allDays.map((day, idx) => {
                const dateStr = formatDate(day);
                const stock = stockMap[dateStr] ?? 0;
                const isAvailable = stock > 0;
                const price = priceMap[dateStr];
                const isSelected = selectedDates.has(dateStr);
                const isModified = modifiedRates.has(`${acc.idHebergement}-${dateStr}`);
                const isEditing = editingCell?.accId === acc.idHebergement && editingCell?.dateStr === dateStr;
                
                // Couleur de fond : surbrillance si sélectionné, sinon couleur de disponibilité
                let bgColor: string;
                if (isSelected) {
                  // Surbrillance bleue avec opacité, en combinaison avec la couleur de disponibilité
                  const baseColor = isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)';
                  bgColor = isAvailable 
                    ? 'rgba(59, 130, 246, 0.15)' // Bleu pour disponible + sélectionné
                    : 'rgba(59, 130, 246, 0.1)';  // Bleu plus clair pour indisponible + sélectionné
                } else {
                  bgColor = isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)';
                }
                
                // Bordure : surbrillance bleue si sélectionné, sinon couleur de disponibilité
                const borderColor = isSelected 
                  ? '#3b82f6' 
                  : (isAvailable ? 'rgba(34, 197, 94, 0.4)' : 'rgba(220, 38, 38, 0.4)');
                const borderWidth = isSelected ? '3px' : '1px';

                return (
                  <div
                    key={`${acc.idHebergement}-${idx}`}
                    onClick={() => handleCellClick(acc.idHebergement, dateStr)}
                    style={{
                      padding: '8px 4px',
                      background: bgColor,
                      border: `${borderWidth} solid ${borderColor}`,
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#111827',
                      minHeight: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isSelected ? 'pointer' : 'default'
                    }}
                    title={`${dateStr} — ${isAvailable ? 'Disponible' : 'Indisponible'} (stock: ${stock})`}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            handleEditSubmit();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleEditCancel();
                          }
                        }}
                        onBlur={handleEditSubmit}
                        autoFocus
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          fontSize: 13,
                          fontWeight: 500,
                          border: '2px solid #3b82f6',
                          borderRadius: 4,
                          padding: '4px',
                          background: '#fff'
                        }}
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span>
                        {price != null ? `${Math.round(price)}€` : ''}
                        {isModified && price != null && (
                          <span style={{ color: '#eab308', marginLeft: 2 }}>*</span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default ProviderCalendars;


