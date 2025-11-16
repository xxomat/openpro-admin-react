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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function rangeDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
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
  const [showRateTypes, setShowRateTypes] = React.useState<boolean>(true);

  const client = React.useMemo(
    () => createOpenProClient('admin', { baseUrl, apiKey }),
    []
  );

  const activeSupplier = suppliers[activeIdx];
  const startDate = React.useMemo(() => {
    const d = new Date(startInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startInput]);
  const calendars = React.useMemo(() => {
    const items: Array<{ start: Date; end: Date; label: string; days: Date[] }> = [];
    for (let i = 0; i < monthsCount; i++) {
      const ref = addMonths(startDate, i);
      const ms = startOfMonth(ref);
      const me = endOfMonth(ref);
      items.push({
        start: ms,
        end: me,
        label: ms.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
        days: rangeDays(ms, me)
      });
    }
    return items;
  }, [startDate, monthsCount]);

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
        const debut = formatDate(startOfMonth(startDate));
        const lastMonthEnd = endOfMonth(addMonths(startDate, monthsCount - 1));
        const fin = formatDate(lastMonthEnd);
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
        <div style={{ marginLeft: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={showRateTypes}
              onChange={e => setShowRateTypes(e.currentTarget.checked)}
            />
            <span>Afficher les types de tarifs</span>
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
          <h3 style={{ marginBottom: 8 }}>
            Hébergements — {activeSupplier.nom}
          </h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {(accommodations[activeSupplier.idFournisseur] || []).map(acc => {
              const stockMap = stockByAccommodation[acc.idHebergement] || {};
              const priceMap = ratesByAccommodation[acc.idHebergement] || {};
              const promoMap = promoByAccommodation[acc.idHebergement] || {};
              const rateTypesMap = rateTypesByAccommodation[acc.idHebergement] || {};
              return (
                <div
                  key={acc.idHebergement}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{acc.nomHebergement}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {calendars.map((cal, i) => (
                      <div key={i} style={{ width: 640 }}>
                        <div style={{ marginBottom: 6, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>{cal.label}</div>
                        <CalendarGrid days={cal.days} stockMap={stockMap} priceMap={priceMap} promoMap={promoMap} rateTypesMap={rateTypesMap} showRateTypes={showRateTypes} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarGrid({
  days,
  stockMap,
  priceMap,
  promoMap,
  rateTypesMap,
  showRateTypes
}: {
  days: Date[];
  stockMap: Record<string, number>;
  priceMap?: Record<string, number>;
  promoMap?: Record<string, boolean>;
  rateTypesMap?: Record<string, string[]>;
  showRateTypes?: boolean;
}) {
  const weekDayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Build grid with leading blanks so weeks start Monday
  const first = days[0];
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (const d of days) cells.push(d);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 6,
          color: '#6b7280',
          fontSize: 12
        }}
      >
        {weekDayHeaders.map((h, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            {h}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 88px)',
          gap: 4
        }}
      >
        {cells.map((cell, idx) => {
          if (!cell) {
            // empty day slot: compact baseline height
            return <div key={idx} style={{ minHeight: 56, width: 88 }} />;
          }
          const dateStr = formatDate(cell);
          const dispo = stockMap[dateStr];
          const isUnavailable = dispo === 0; // rouge si stock = 0
          const bg = isUnavailable ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.15)'; // rouge/vert translucide
          const border = isUnavailable ? '1px solid rgba(220,38,38,0.35)' : '1px solid rgba(34,197,94,0.35)';
          const price = priceMap ? priceMap[dateStr] : undefined;
          const promo = promoMap ? promoMap[dateStr] : false;
          const priceBorderColor = isUnavailable
            ? 'rgba(220,38,38,0.8)' // red
            : promo
            ? 'rgba(234,179,8,0.9)' // amber/yellow
            : 'rgba(34,197,94,0.9)'; // green
          const dayRateTypes = rateTypesMap ? rateTypesMap[dateStr] : undefined;
          const hasVisibleRateTypes = Boolean(showRateTypes && dayRateTypes && dayRateTypes.length > 0);
          const minCellHeight = hasVisibleRateTypes ? 88 : 56;
          return (
            <div
              key={idx}
              title={`${dateStr} — ${isUnavailable ? 'Indisponible' : 'Disponible'}`}
              style={{
                minHeight: minCellHeight,
                width: 88,
                borderRadius: 6,
                background: bg,
                border,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                padding: 8,
                paddingTop: 18, // reserve space for the date chip
                fontSize: 12,
                color: '#111827',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 6,
                  fontSize: 11,
                  color: '#6b7280',
                  lineHeight: 1
                }}
              >
                {cell.getDate()}
              </div>
              <div
                style={{
                  lineHeight: 1.2,
                  fontSize: 12,
                  color: '#111827',
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: `2px solid ${priceBorderColor}`,
                  background: 'rgba(255,255,255,0.85)',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  minHeight: 24
                }}
              >
                {price != null ? `${Math.round(price)}€` : ''}
              </div>
              {showRateTypes && dayRateTypes && dayRateTypes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, overflow: 'hidden' }}>
                  {dayRateTypes.map((rt, k) => (
                    <div
                      key={k}
                      style={{
                        fontSize: 10,
                        color: '#374151',
                        background: 'rgba(255,255,255,0.9)',
                        border: '2px solid #e5e7eb', // same width as price
                        borderRadius: 6,
                        padding: '2px 6px',
                        width: '100%',
                        boxSizing: 'border-box',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: 20
                      }}
                      title={rt}
                    >
                      {rt}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProviderCalendars;


