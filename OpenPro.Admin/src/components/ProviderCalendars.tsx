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

export function ProviderCalendars(): React.ReactElement {
  const [suppliers] = React.useState<Supplier[]>(defaultSuppliers);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [accommodations, setAccommodations] = React.useState<Record<number, Accommodation[]>>({});
  // Structure: Record<idFournisseur, Record<idHebergement, Record<dateStr, value>>>
  const [stockBySupplierAndAccommodation, setStockBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, number>>>
  >({});
  const [ratesBySupplierAndAccommodation, setRatesBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, Record<number, number>>>>
  >({});
  const [promoBySupplierAndAccommodation, setPromoBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, boolean>>>
  >({});
  const [rateTypesBySupplierAndAccommodation, setRateTypesBySupplierAndAccommodation] = React.useState<
    Record<number, Record<number, Record<string, string[]>>>
  >({});
  const [dureeMinBySupplierAndAccommodation, setDureeMinByAccommodation] = React.useState<
    Record<number, Record<number, Record<string, number | null>>>
  >({});
  const [rateTypeLabelsBySupplier, setRateTypeLabelsBySupplier] = React.useState<
    Record<number, Record<number, string>>
  >({});
  const [rateTypesBySupplier, setRateTypesBySupplier] = React.useState<
    Record<number, Array<{ idTypeTarif: number; libelle?: unknown; descriptionFr?: string; ordre?: number }>>
  >({});
  // selectedRateTypeId indexé par fournisseur
  const [selectedRateTypeIdBySupplier, setSelectedRateTypeIdBySupplier] = React.useState<Record<number, number | null>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [startInput, setStartInput] = React.useState<string>(() => {
    const today = new Date();
    return formatDate(today);
  });
  const [monthsCount, setMonthsCount] = React.useState<number>(1);
  // Sélection d'hébergements indexée par fournisseur pour que chaque onglet ait sa propre sélection
  const [selectedAccommodationsBySupplier, setSelectedAccommodationsBySupplier] = React.useState<Record<number, Set<number>>>({});
  // Sélection de dates indexée par fournisseur pour que chaque onglet ait sa propre sélection
  const [selectedDatesBySupplier, setSelectedDatesBySupplier] = React.useState<Record<number, Set<string>>>({});
  // Suivi des modifications locales indexé par fournisseur (format: "idHebergement-dateStr")
  const [modifiedRatesBySupplier, setModifiedRatesBySupplier] = React.useState<Record<number, Set<string>>>({});
  const [modifiedDureeMinBySupplier, setModifiedDureeMinBySupplier] = React.useState<Record<number, Set<string>>>({});


  const client = React.useMemo(
    () => createOpenProClient('admin', { baseUrl, apiKey }),
    []
  );

  const activeSupplier = suppliers[activeIdx];
  const startDate = React.useMemo(() => {
    const d = new Date(startInput);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startInput]);

  // Obtenir la sélection de dates pour le fournisseur actif
  const selectedDates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return selectedDatesBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, selectedDatesBySupplier]);

  // Obtenir la sélection d'hébergements pour le fournisseur actif
  const selectedAccommodations = React.useMemo(() => {
    if (!activeSupplier) return new Set<number>();
    return selectedAccommodationsBySupplier[activeSupplier.idFournisseur] || new Set<number>();
  }, [activeSupplier, selectedAccommodationsBySupplier]);

  // Fonction pour mettre à jour la sélection d'hébergements du fournisseur actif
  const setSelectedAccommodations = React.useCallback((updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (!activeSupplier) return;
    setSelectedAccommodationsBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<number>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier]);

  // Fonction pour mettre à jour la sélection de dates du fournisseur actif
  const setSelectedDates = React.useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (!activeSupplier) return;
    setSelectedDatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newSet = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activeSupplier.idFournisseur]: newSet };
    });
  }, [activeSupplier]);

  // Obtenir les modifications pour le fournisseur actif
  const modifiedRates = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return modifiedRatesBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, modifiedRatesBySupplier]);

  const modifiedDureeMin = React.useMemo(() => {
    if (!activeSupplier) return new Set<string>();
    return modifiedDureeMinBySupplier[activeSupplier.idFournisseur] || new Set<string>();
  }, [activeSupplier, modifiedDureeMinBySupplier]);

  // Obtenir le selectedRateTypeId pour le fournisseur actif
  const selectedRateTypeId = React.useMemo(() => {
    if (!activeSupplier) return null;
    return selectedRateTypeIdBySupplier[activeSupplier.idFournisseur] ?? null;
  }, [activeSupplier, selectedRateTypeIdBySupplier]);

  // Helper pour extraire les données du fournisseur actif
  const stockByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return stockBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, stockBySupplierAndAccommodation]);

  const ratesByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return ratesBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, ratesBySupplierAndAccommodation]);

  const dureeMinByAccommodation = React.useMemo(() => {
    if (!activeSupplier) return {};
    return dureeMinBySupplierAndAccommodation[activeSupplier.idFournisseur] || {};
  }, [activeSupplier, dureeMinBySupplierAndAccommodation]);

  // Fonction pour mettre à jour les prix localement
  const handleRateUpdate = React.useCallback((newPrice: number) => {
    if (!activeSupplier || selectedRateTypeId === null) return;
    const modifications = new Set<string>();
    setRatesBySupplierAndAccommodation(prev => {
      const updated = { ...prev };
      const supplierData = updated[activeSupplier.idFournisseur] || {};
      
      // Appliquer le prix à toutes les combinaisons date-hébergement sélectionnées pour le type tarif sélectionné
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierData[accId]) {
            supplierData[accId] = {};
          }
          if (!supplierData[accId][dateStr]) {
            supplierData[accId][dateStr] = {};
          }
          supplierData[accId][dateStr][selectedRateTypeId] = newPrice;
          modifications.add(`${accId}-${dateStr}-${selectedRateTypeId}`);
        }
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierData };
    });
    // Marquer comme modifié après la mise à jour des prix (pour le fournisseur actif)
    setModifiedRatesBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedDates, selectedAccommodations, activeSupplier, selectedRateTypeId]);

  // Fonction pour mettre à jour la durée minimale localement
  const handleDureeMinUpdate = React.useCallback((newDureeMin: number | null) => {
    if (!activeSupplier) return;
    const modifications = new Set<string>();
    setDureeMinByAccommodation(prev => {
      const updated = { ...prev };
      const supplierData = updated[activeSupplier.idFournisseur] || {};
      
      // Appliquer la durée minimale à toutes les combinaisons date-hébergement sélectionnées
      for (const dateStr of selectedDates) {
        for (const accId of selectedAccommodations) {
          if (!supplierData[accId]) {
            supplierData[accId] = {};
          }
          supplierData[accId][dateStr] = newDureeMin;
          modifications.add(`${accId}-${dateStr}`);
        }
      }
      
      return { ...updated, [activeSupplier.idFournisseur]: supplierData };
    });
    // Marquer comme modifié après la mise à jour de la durée minimale (pour le fournisseur actif)
    setModifiedDureeMinBySupplier(prev => {
      const current = prev[activeSupplier.idFournisseur] || new Set<string>();
      const newMod = new Set(current);
      for (const mod of modifications) {
        newMod.add(mod);
      }
      return { ...prev, [activeSupplier.idFournisseur]: newMod };
    });
  }, [selectedDates, selectedAccommodations, activeSupplier]);

  // Fonction pour charger les hébergements d'un fournisseur
  const loadAccommodations = React.useCallback(async (idFournisseur: number, signal?: AbortSignal): Promise<Accommodation[]> => {
    const resp = await client.listAccommodations(idFournisseur);
    if (signal?.aborted) throw new Error('Cancelled');
    // Normalize API/stub shapes to internal { idHebergement, nomHebergement }
    const items: Accommodation[] = ((resp as any).hebergements ?? (resp as any).listeHebergement ?? []).map((x: any) => {
      const id = x?.idHebergement ?? x?.cleHebergement?.idHebergement;
      const name = x?.nomHebergement ?? x?.nom ?? '';
      return { idHebergement: Number(id), nomHebergement: String(name) };
    });
    return items;
  }, [client]);

  // Fonction pour charger les données (stock, tarifs, types de tarifs) d'un fournisseur
  const loadSupplierData = React.useCallback(async (
    idFournisseur: number,
    accommodationsList: Accommodation[],
    signal?: AbortSignal
  ): Promise<{
    stock: Record<number, Record<string, number>>;
    rates: Record<number, Record<string, Record<number, number>>>;
    promo: Record<number, Record<string, boolean>>;
    rateTypes: Record<number, Record<string, string[]>>;
    dureeMin: Record<number, Record<string, number | null>>;
    rateTypeLabels: Record<number, string>;
    rateTypesList: Array<{ idTypeTarif: number; libelle?: unknown; descriptionFr?: string; ordre?: number }>;
  }> => {
    const nextStock: Record<number, Record<string, number>> = {};
    const nextRates: Record<number, Record<string, Record<number, number>>> = {};
    const nextPromo: Record<number, Record<string, boolean>> = {};
    const nextRateTypes: Record<number, Record<string, string[]>> = {};
    const nextDureeMin: Record<number, Record<string, number | null>> = {};
    const debut = formatDate(startDate);
    const endDate = addMonths(startDate, monthsCount);
    const fin = formatDate(endDate);
    
    // Map pour collecter les types de tarif trouvés dans les tarifs récupérés
    const discoveredRateTypes = new Map<number, { idTypeTarif: number; libelle?: unknown; label?: string; descriptionFr?: string; ordre?: number }>();
    
    // Obtenir les détails complets des types de tarif via listRateTypes
    if (accommodationsList.length > 0) {
      try {
        const allRateTypesResponse = await client.listRateTypes(idFournisseur);
        if (signal?.aborted) throw new Error('Cancelled');
        const allRateTypes = (allRateTypesResponse as any).typeTarifs ?? [];
        
        const firstAcc = accommodationsList[0];
        const links = await client.listAccommodationRateTypeLinks(idFournisseur, firstAcc.idHebergement);
        if (signal?.aborted) throw new Error('Cancelled');
        const liaisons = (links as any).liaisonHebergementTypeTarifs ?? (links as any).data?.liaisonHebergementTypeTarifs ?? [];
        const linkedIds = new Set(liaisons.map((l: any) => Number(l.idTypeTarif)));
        
        for (const rateType of allRateTypes) {
          const id = Number(rateType.cleTypeTarif?.idTypeTarif ?? rateType.idTypeTarif);
          
          if (id && linkedIds.has(id)) {
            let descriptionFr: string | undefined = undefined;
            const description = rateType.description;
            if (Array.isArray(description)) {
              const frEntry = description.find((d: any) => (d?.langue ?? d?.Langue) === 'fr');
              descriptionFr = frEntry?.texte ?? frEntry?.Texte;
            } else if (typeof description === 'string') {
              descriptionFr = description;
            }
            
            let libelleFr: string | undefined = undefined;
            const libelle = rateType.libelle;
            if (Array.isArray(libelle)) {
              const frEntry = libelle.find((l: any) => (l?.langue ?? l?.Langue) === 'fr');
              libelleFr = frEntry?.texte ?? frEntry?.Texte;
            } else if (typeof libelle === 'string') {
              libelleFr = libelle;
            }
            
            if (!discoveredRateTypes.has(id)) {
              discoveredRateTypes.set(id, {
                idTypeTarif: id,
                libelle: libelle,
                label: libelleFr,
                descriptionFr: descriptionFr ?? libelleFr,
                ordre: rateType.ordre
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching rate types:', error);
      }
    }
    
    for (const acc of accommodationsList) {
      if (signal?.aborted) throw new Error('Cancelled');
      
      const stock = await client.getStock(idFournisseur, acc.idHebergement, {
        debut,
        fin,
        start: debut,
        end: fin
      } as unknown as { debut?: string; fin?: string });
      if (signal?.aborted) throw new Error('Cancelled');
      
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

      try {
        const rates = await client.getRates(idFournisseur, acc.idHebergement, { debut, fin });
        if (signal?.aborted) throw new Error('Cancelled');
        
        const mapRates: Record<string, Record<number, number>> = {};
        const mapPromo: Record<string, boolean> = {};
        const mapRateTypes: Record<string, string[]> = {};
        const mapDureeMin: Record<string, number | null> = {};
        const tarifs = (rates as any).tarifs ?? (rates as any).periodes ?? [];
        const requestedStart = new Date(debut + 'T00:00:00');
        const requestedEnd = new Date(fin + 'T23:59:59');
        
        for (const t of tarifs) {
          const deb = t.debut ?? t.dateDebut ?? debut;
          const fe = t.fin ?? t.dateFin ?? fin;
          const startD = new Date(deb + 'T00:00:00');
          const endD = new Date(fe + 'T23:59:59');
          
          if (endD < requestedStart || startD > requestedEnd) {
            continue;
          }
          
          const actualStart = startD > requestedStart ? startD : requestedStart;
          const actualEnd = endD < requestedEnd ? endD : requestedEnd;
          
          let price: number | undefined = undefined;
          const pax = t.tarifPax ?? t.prixPax ?? {};
          const occs = pax.listeTarifPaxOccupation ?? t.listeTarifPaxOccupation ?? [];
          const tHasPromo =
            Boolean((t as any)?.promotion) ||
            Boolean((t as any)?.promo) ||
            Boolean((t as any)?.promotionActive) ||
            Boolean((t as any)?.hasPromo);
          const idType = Number(t.idTypeTarif ?? t?.typeTarif?.idTypeTarif);
          let rateLabel: string | undefined = undefined;
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
          
          if (idType && !discoveredRateTypes.has(idType)) {
            let descriptionFr: string | undefined = undefined;
            const descriptionCandidate = (t?.typeTarif?.description ?? t?.description) as unknown;
            if (Array.isArray(descriptionCandidate)) {
              const frEntry = descriptionCandidate.find((d: any) => (d?.langue ?? d?.Langue) === 'fr');
              descriptionFr = frEntry?.texte ?? frEntry?.Texte;
            } else if (typeof descriptionCandidate === 'string') {
              descriptionFr = descriptionCandidate;
            }
            
            const ordre = t?.typeTarif?.ordre ?? t?.ordre;
            discoveredRateTypes.set(idType, {
              idTypeTarif: idType,
              libelle: labelCandidate,
              label: rateLabel,
              descriptionFr: descriptionFr ?? rateLabel ?? `Type ${idType}`,
              ordre: ordre != null ? Number(ordre) : undefined
            });
          } else if (idType && discoveredRateTypes.has(idType)) {
            const existing = discoveredRateTypes.get(idType)!;
            if (!existing.descriptionFr || existing.descriptionFr.startsWith('Type ')) {
              const descriptionCandidate = (t?.typeTarif?.description ?? t?.description) as unknown;
              if (Array.isArray(descriptionCandidate)) {
                const frEntry = descriptionCandidate.find((d: any) => (d?.langue ?? d?.Langue) === 'fr');
                const descFr = frEntry?.texte ?? frEntry?.Texte;
                if (descFr) {
                  existing.descriptionFr = descFr;
                }
              } else if (typeof descriptionCandidate === 'string') {
                existing.descriptionFr = descriptionCandidate;
              }
            }
          }
          
          if (Array.isArray(occs)) {
            const two = occs.find((o: any) => Number(o.nbPers) === 2 && o.prix != null);
            const anyOcc = two ?? occs.find((o: any) => o.prix != null);
            if (anyOcc && anyOcc.prix != null) price = Number(anyOcc.prix);
          } else if (typeof pax === 'object' && pax && pax.prix != null) {
            price = Number(pax.prix);
          } else if (t.prix != null) {
            price = Number(t.prix);
          }
          
          const dureeMinValue = t.dureeMin != null && typeof t.dureeMin === 'number' && t.dureeMin > 0 
            ? t.dureeMin 
            : null;
          
          if (idType && price != null && !isNaN(price)) {
            const cur = new Date(actualStart);
            while (cur <= actualEnd) {
              const key = formatDate(cur);
              if (!mapRates[key]) {
                mapRates[key] = {};
              }
              mapRates[key][idType] = price;
              if (tHasPromo) {
                mapPromo[key] = true;
              }
              if (rateLabel) {
                const arr = mapRateTypes[key] ?? [];
                if (!arr.includes(rateLabel)) {
                  arr.push(rateLabel);
                  mapRateTypes[key] = arr.slice(0, 2);
                } else {
                  mapRateTypes[key] = arr;
                }
              }
              if (dureeMinValue != null) {
                const existingDureeMin = mapDureeMin[key];
                if (existingDureeMin == null || dureeMinValue > existingDureeMin) {
                  mapDureeMin[key] = dureeMinValue;
                }
              } else if (mapDureeMin[key] == null) {
                mapDureeMin[key] = null;
              }
              cur.setDate(cur.getDate() + 1);
            }
          } else {
            const cur = new Date(actualStart);
            while (cur <= actualEnd) {
              const key = formatDate(cur);
              if (dureeMinValue != null) {
                const existingDureeMin = mapDureeMin[key];
                if (existingDureeMin == null || dureeMinValue > existingDureeMin) {
                  mapDureeMin[key] = dureeMinValue;
                }
              } else if (mapDureeMin[key] == null) {
                mapDureeMin[key] = null;
              }
              cur.setDate(cur.getDate() + 1);
            }
          }
        }
        nextRates[acc.idHebergement] = mapRates;
        nextPromo[acc.idHebergement] = mapPromo;
        nextRateTypes[acc.idHebergement] = mapRateTypes;
        nextDureeMin[acc.idHebergement] = mapDureeMin;
      } catch {
        // ignore rates errors for now
      }
    }
    
    const rateTypeLabels: Record<number, string> = {};
    const rateTypesList: Array<{ idTypeTarif: number; libelle?: unknown; descriptionFr?: string; ordre?: number }> = [];
    
    for (const [id, info] of discoveredRateTypes) {
      const displayLabel = info.descriptionFr ?? info.label ?? `Type ${id}`;
      rateTypeLabels[id] = displayLabel;
      rateTypesList.push({
        idTypeTarif: info.idTypeTarif,
        libelle: info.libelle,
        descriptionFr: info.descriptionFr,
        ordre: info.ordre
      });
    }
    
    rateTypesList.sort((a, b) => {
      const ordreA = a.ordre ?? 999;
      const ordreB = b.ordre ?? 999;
      return ordreA - ordreB;
    });
    
    return {
      stock: nextStock,
      rates: nextRates,
      promo: nextPromo,
      rateTypes: nextRateTypes,
      dureeMin: nextDureeMin,
      rateTypeLabels,
      rateTypesList
    };
  }, [client, startDate, monthsCount]);

  // Fonction pour sauvegarder les modifications (pour l'instant juste log)
  const handleSave = React.useCallback(async () => {
    if (!activeSupplier) return;
    if (modifiedRates.size === 0 && modifiedDureeMin.size === 0) return;
    
    // TODO: Implémenter l'appel API pour sauvegarder les tarifs et durées minimales
    // Pour l'instant, on log juste les modifications
    console.log('Modifications de prix à sauvegarder:', Array.from(modifiedRates));
    console.log('Modifications de durée minimale à sauvegarder:', Array.from(modifiedDureeMin));
    
    // Après sauvegarde réussie, vider les modifications du fournisseur actif
    // setModifiedRatesBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }));
    // setModifiedDureeMinBySupplier(prev => ({ ...prev, [activeSupplier.idFournisseur]: new Set() }));
  }, [modifiedRates, modifiedDureeMin, activeSupplier]);

  // Fonction pour actualiser les données du fournisseur actif
  const handleRefreshData = React.useCallback(async () => {
    if (!activeSupplier) return;
    
    const idFournisseur = activeSupplier.idFournisseur;
    const controller = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger les hébergements (toujours recharger pour avoir les données à jour)
      const accommodationsList = await loadAccommodations(idFournisseur, controller.signal);
      
      setAccommodations(prev => ({ ...prev, [idFournisseur]: accommodationsList }));
      
      // Sélectionner tous les hébergements du fournisseur actif après le rechargement
      setSelectedAccommodationsBySupplier(prev => ({
        ...prev,
        [idFournisseur]: new Set(accommodationsList.map(acc => acc.idHebergement))
      }));
      
      // Charger les données (stock, tarifs, etc.)
      const data = await loadSupplierData(idFournisseur, accommodationsList, controller.signal);
      
      // Mettre à jour les états avec la nouvelle structure indexée par fournisseur puis hébergement
      setStockBySupplierAndAccommodation(prev => ({
        ...prev,
        [idFournisseur]: data.stock
      }));
      setRatesBySupplierAndAccommodation(prev => ({
        ...prev,
        [idFournisseur]: data.rates
      }));
      setPromoBySupplierAndAccommodation(prev => ({
        ...prev,
        [idFournisseur]: data.promo
      }));
      setRateTypesBySupplierAndAccommodation(prev => ({
        ...prev,
        [idFournisseur]: data.rateTypes
      }));
      setDureeMinByAccommodation(prev => ({
        ...prev,
        [idFournisseur]: data.dureeMin
      }));
      setRateTypeLabelsBySupplier(prev => ({ ...prev, [idFournisseur]: data.rateTypeLabels }));
      setRateTypesBySupplier(prev => ({ ...prev, [idFournisseur]: data.rateTypesList }));
      
      // Initialiser selectedRateTypeId pour le fournisseur actif
      if (data.rateTypesList.length > 0) {
        setSelectedRateTypeIdBySupplier(prev => {
          const current = prev[idFournisseur];
          if (current === null || current === undefined) {
            return { ...prev, [idFournisseur]: data.rateTypesList[0].idTypeTarif };
          }
          const exists = data.rateTypesList.some(t => t.idTypeTarif === current);
          if (!exists) {
            return { ...prev, [idFournisseur]: data.rateTypesList[0].idTypeTarif };
          }
          return prev;
        });
      }
      
      // Réinitialiser les indicateurs visuels pour le fournisseur actif
      setModifiedRatesBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
      setModifiedDureeMinBySupplier(prev => ({ ...prev, [idFournisseur]: new Set() }));
      
    } catch (e: any) {
      if (e.message !== 'Cancelled') {
        setError(e?.message ?? 'Erreur lors de l\'actualisation des données');
      }
    } finally {
      setLoading(false);
    }
  }, [activeSupplier, loadAccommodations, loadSupplierData]);

  // Chargement initial des données pour tous les fournisseurs au montage du composant
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les données pour tous les fournisseurs
        for (const supplier of suppliers) {
          if (cancelled || controller.signal.aborted) return;
          
          try {
            // Charger les hébergements
            const accommodationsList = await loadAccommodations(supplier.idFournisseur, controller.signal);
            if (cancelled || controller.signal.aborted) return;
            
            setAccommodations(prev => ({ ...prev, [supplier.idFournisseur]: accommodationsList }));
            
            // Sélectionner tous les hébergements pour chaque fournisseur au chargement initial
            setSelectedAccommodationsBySupplier(prev => ({
              ...prev,
              [supplier.idFournisseur]: new Set(accommodationsList.map(acc => acc.idHebergement))
            }));
            
            // Charger les données (stock, tarifs, etc.)
            const data = await loadSupplierData(supplier.idFournisseur, accommodationsList, controller.signal);
            if (cancelled || controller.signal.aborted) return;
            
            // Mettre à jour les états avec la nouvelle structure indexée par fournisseur puis hébergement
            setStockBySupplierAndAccommodation(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.stock
            }));
            setRatesBySupplierAndAccommodation(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.rates
            }));
            setPromoBySupplierAndAccommodation(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.promo
            }));
            setRateTypesBySupplierAndAccommodation(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.rateTypes
            }));
            setDureeMinByAccommodation(prev => ({
              ...prev,
              [supplier.idFournisseur]: data.dureeMin
            }));
            setRateTypeLabelsBySupplier(prev => ({ ...prev, [supplier.idFournisseur]: data.rateTypeLabels }));
            setRateTypesBySupplier(prev => ({ ...prev, [supplier.idFournisseur]: data.rateTypesList }));
            
            // Initialiser selectedRateTypeId pour chaque fournisseur
            if (data.rateTypesList.length > 0) {
              setSelectedRateTypeIdBySupplier(prev => ({
                ...prev,
                [supplier.idFournisseur]: data.rateTypesList[0].idTypeTarif
              }));
            }
          } catch (e: any) {
            if (e.message !== 'Cancelled' && !controller.signal.aborted) {
              console.error(`Erreur lors du chargement des données pour ${supplier.nom}:`, e);
            }
          }
        }
      } catch (e: any) {
        if (!cancelled && !controller.signal.aborted) {
          setError(e?.message ?? 'Erreur lors du chargement initial des données');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
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
                        setSelectedRateTypeIdBySupplier(prev => ({
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
                    {!rateTypesBySupplier[activeSupplier.idFournisseur] || 
                     rateTypesBySupplier[activeSupplier.idFournisseur].length === 0 ? (
                      <option value="">Aucun type tarif disponible</option>
                    ) : (
                      rateTypesBySupplier[activeSupplier.idFournisseur].map(type => {
                        const descriptionFr = type.descriptionFr ?? (rateTypeLabelsBySupplier[activeSupplier.idFournisseur]?.[type.idTypeTarif]) ?? `Type ${type.idTypeTarif}`;
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
              accommodations={(accommodations[activeSupplier.idFournisseur] || [])
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
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#9ca3af' : '#6b7280',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#4b5563';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#6b7280';
                }
              }}
            >
              {loading ? 'Actualisation...' : 'Actualiser les données'}
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

function CompactGrid({
  startDate,
  monthsCount,
  accommodations,
  stockByAccommodation,
  ratesByAccommodation,
  dureeMinByAccommodation,
  selectedDates,
  onSelectedDatesChange,
  modifiedRates,
  modifiedDureeMin,
  onRateUpdate,
  onDureeMinUpdate,
  selectedRateTypeId
}: {
  startDate: Date;
  monthsCount: number;
  accommodations: Accommodation[];
  stockByAccommodation: Record<number, Record<string, number>>;
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>;
  dureeMinByAccommodation: Record<number, Record<string, number | null>>;
  selectedDates: Set<string>;
  onSelectedDatesChange: (dates: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  modifiedRates: Set<string>;
  modifiedDureeMin: Set<string>;
  onRateUpdate: (newPrice: number) => void;
  onDureeMinUpdate: (newDureeMin: number | null) => void;
  selectedRateTypeId: number | null;
}) {
  const weeks = React.useMemo(() => getWeeksInRange(startDate, monthsCount), [startDate, monthsCount]);
  const weekDayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Flatten all days from all weeks into a single array
  const allDays = weeks.flat();

  // État pour suivre la cellule en cours d'édition (prix)
  const [editingCell, setEditingCell] = React.useState<{ accId: number; dateStr: string } | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>('');
  
  // État pour suivre la cellule en cours d'édition (durée minimale)
  const [editingDureeMinCell, setEditingDureeMinCell] = React.useState<{ accId: number; dateStr: string } | null>(null);
  const [editingDureeMinValue, setEditingDureeMinValue] = React.useState<string>('');

  // État pour suivre le drag
  const [draggingState, setDraggingState] = React.useState<{
    startDate: string;
    currentDate: string;
    isDragging: boolean;
    startPosition: { x: number; y: number };
  } | null>(null);
  
  // Ref pour suivre si un drag vient de se terminer (pour éviter le onClick)
  const justFinishedDragRef = React.useRef(false);

  // Gestionnaire de clic pour sélectionner/désélectionner une colonne
  const handleHeaderClick = React.useCallback((dateStr: string) => {
    onSelectedDatesChange((prev: Set<string>) => {
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
          // Annuler l'édition du prix en cours
          setEditingCell(null);
          setEditingValue('');
        } else if (editingDureeMinCell) {
          // Annuler l'édition de la durée minimale en cours
          setEditingDureeMinCell(null);
          setEditingDureeMinValue('');
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
  }, [editingCell, editingDureeMinCell, onSelectedDatesChange]);

  // Gestionnaire pour démarrer l'édition d'une cellule (prix)
  const handleCellClick = React.useCallback((accId: number, dateStr: string) => {
    // Vérifier que la sélection est active et que cette colonne est sélectionnée
    if (selectedDates.size === 0 || !selectedDates.has(dateStr)) {
      return;
    }
    // Annuler l'édition de la durée minimale si active
    if (editingDureeMinCell) {
      setEditingDureeMinCell(null);
      setEditingDureeMinValue('');
    }
    // Récupérer le prix pour le type tarif sélectionné
    const currentPrice = selectedRateTypeId !== null
      ? ratesByAccommodation[accId]?.[dateStr]?.[selectedRateTypeId]
      : undefined;
    setEditingCell({ accId, dateStr });
    setEditingValue(currentPrice != null ? String(Math.round(currentPrice)) : '');
  }, [selectedDates, ratesByAccommodation, editingDureeMinCell, selectedRateTypeId]);

  // Gestionnaire pour démarrer l'édition d'une cellule (durée minimale)
  const handleDureeMinClick = React.useCallback((accId: number, dateStr: string) => {
    // Vérifier que la sélection est active et que cette colonne est sélectionnée
    if (selectedDates.size === 0 || !selectedDates.has(dateStr)) {
      return;
    }
    // Annuler l'édition du prix si active
    if (editingCell) {
      setEditingCell(null);
      setEditingValue('');
    }
    const currentDureeMin = dureeMinByAccommodation[accId]?.[dateStr];
    setEditingDureeMinCell({ accId, dateStr });
    setEditingDureeMinValue(currentDureeMin != null && currentDureeMin > 0 ? String(currentDureeMin) : '');
  }, [selectedDates, dureeMinByAccommodation, editingCell]);

  // Gestionnaire pour valider l'édition (prix)
  const handleEditSubmit = React.useCallback(() => {
    if (!editingCell) return;
    const numValue = parseFloat(editingValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onRateUpdate(numValue);
    }
    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, editingValue, onRateUpdate]);

  // Gestionnaire pour valider l'édition (durée minimale)
  const handleDureeMinSubmit = React.useCallback(() => {
    if (!editingDureeMinCell) return;
    const trimmedValue = editingDureeMinValue.trim();
    if (trimmedValue === '') {
      // Champ vide = null (absence de durée minimale)
      onDureeMinUpdate(null);
    } else {
      const numValue = parseInt(trimmedValue, 10);
      if (!isNaN(numValue) && numValue > 0) {
        onDureeMinUpdate(numValue);
      }
      // Si la valeur est invalide, on ne fait rien (l'utilisateur peut corriger)
    }
    setEditingDureeMinCell(null);
    setEditingDureeMinValue('');
  }, [editingDureeMinCell, editingDureeMinValue, onDureeMinUpdate]);

  // Gestionnaire pour annuler l'édition (prix)
  const handleEditCancel = React.useCallback(() => {
    setEditingCell(null);
    setEditingValue('');
  }, []);

  // Gestionnaire pour annuler l'édition (durée minimale)
  const handleDureeMinCancel = React.useCallback(() => {
    setEditingDureeMinCell(null);
    setEditingDureeMinValue('');
  }, []);

  // Fonction pour obtenir la date à partir d'un élément DOM
  const getDateFromElement = React.useCallback((element: HTMLElement): string | null => {
    // Chercher un attribut data-date ou remonter dans le DOM pour trouver la colonne
    let current: HTMLElement | null = element;
    while (current) {
      const dateAttr = current.getAttribute('data-date');
      if (dateAttr) return dateAttr;
      current = current.parentElement;
    }
    return null;
  }, []);

  // Fonction pour calculer la plage de dates entre deux dates
  const getDateRange = React.useCallback((startDateStr: string, endDateStr: string): string[] => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dates: string[] = [];
    
    // Trier pour s'assurer que start <= end
    const sortedStart = start <= end ? start : end;
    const sortedEnd = start <= end ? end : start;
    
    const current = new Date(sortedStart);
    while (current <= sortedEnd) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, []);

  // Gestionnaire pour démarrer le drag
  const handleMouseDown = React.useCallback((e: React.MouseEvent, dateStr: string) => {
    // Ne pas démarrer le drag si on est en train d'éditer
    if (editingCell) return;
    
    // Ne pas démarrer le drag si c'est un clic droit
    if (e.button !== 0) return;
    
    setDraggingState({
      startDate: dateStr,
      currentDate: dateStr,
      isDragging: false,
      startPosition: { x: e.clientX, y: e.clientY }
    });
  }, [editingCell]);

  // Gestionnaire pour le mouvement de la souris pendant le drag
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    setDraggingState(prev => {
      if (!prev) return null;
      
      const deltaX = Math.abs(e.clientX - prev.startPosition.x);
      const deltaY = Math.abs(e.clientY - prev.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Si le déplacement est suffisant, activer le drag
      if (!prev.isDragging && distance > 5) {
        return { ...prev, isDragging: true };
      }
      
      if (!prev.isDragging) return prev;
      
      // Trouver l'élément sous le curseur
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      
      // Si le drag sort de la zone de la grille, garder la dernière colonne valide
      if (!elementUnderCursor) return prev;
      
      const dateStr = getDateFromElement(elementUnderCursor);
      
      // Si on trouve une date valide et qu'elle est différente de la date actuelle, mettre à jour
      if (dateStr && dateStr !== prev.currentDate) {
        return { ...prev, currentDate: dateStr };
      }
      
      // Si on ne trouve pas de date valide mais qu'on était déjà en train de drag,
      // garder la dernière colonne valide (retourner prev sans modification)
      return prev;
    });
  }, [getDateFromElement]);

  // Gestionnaire pour terminer le drag
  const handleMouseUp = React.useCallback((e: MouseEvent) => {
    setDraggingState(prev => {
      if (!prev) return null;
      
      const deltaX = Math.abs(e.clientX - prev.startPosition.x);
      const deltaY = Math.abs(e.clientY - prev.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Si le drag était très court, traiter comme un clic simple
      if (!prev.isDragging || distance < 5) {
        // Marquer qu'un drag vient de se terminer pour éviter le onClick
        justFinishedDragRef.current = true;
        
        // Toggle de la colonne de départ (comportement du clic simple)
        onSelectedDatesChange((prevSelected: Set<string>) => {
          const newSet = new Set(prevSelected);
          if (newSet.has(prev.startDate)) {
            newSet.delete(prev.startDate);
          } else {
            newSet.add(prev.startDate);
          }
          return newSet;
        });
        
        // Réinitialiser le flag après un court délai
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);
        return null;
      }
      
      // Calculer la plage de dates
      const dateRange = getDateRange(prev.startDate, prev.currentDate);
      
      // Vérifier si Ctrl/Cmd est pressé pour le mode remplacement
      const isReplaceMode = e.ctrlKey || e.metaKey;
      
      // Appliquer la sélection
      onSelectedDatesChange((prevSelected: Set<string>) => {
        if (isReplaceMode) {
          // Mode remplacement : remplacer la sélection existante
          return new Set(dateRange);
        } else {
          // Mode ajout : ajouter à la sélection existante
          const newSet = new Set(prevSelected);
          for (const dateStr of dateRange) {
            newSet.add(dateStr);
          }
          return newSet;
        }
      });
      
      // Marquer qu'un drag vient de se terminer pour éviter le onClick
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 100);
      
      return null;
    });
  }, [getDateRange, onSelectedDatesChange]);

  // Effet pour gérer les événements globaux de souris pendant le drag
  React.useEffect(() => {
    if (!draggingState) return;
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingState, handleMouseMove, handleMouseUp]);

  // Calculer les dates dans la plage de drag pour la surbrillance temporaire
  const draggingDates = React.useMemo(() => {
    if (!draggingState || !draggingState.isDragging) return new Set<string>();
    return new Set(getDateRange(draggingState.startDate, draggingState.currentDate));
  }, [draggingState, getDateRange]);

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', userSelect: 'none' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${allDays.length}, 80px)`,
          gap: 2,
          minWidth: 'fit-content',
          userSelect: 'none'
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
          const isDragging = draggingDates.has(dateStr);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Dimanche = 0, Samedi = 6
          return (
            <div
              key={idx}
              data-date={dateStr}
              onClick={(e) => {
                // Ne pas traiter comme un clic si on vient de finir un drag
                if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                  e.preventDefault();
                  return;
                }
                handleHeaderClick(dateStr);
              }}
              onMouseDown={(e) => handleMouseDown(e, dateStr)}
              style={{
                padding: '8px 4px',
                background: isDragging
                  ? 'rgba(59, 130, 246, 0.2)'
                  : (isSelected 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : (isWeekend ? '#f9fafb' : '#f3f4f6')),
                borderBottom: '2px solid #e5e7eb',
                borderLeft: isDragging 
                  ? '2px solid #3b82f6' 
                  : (isSelected ? '3px solid #3b82f6' : 'none'),
                borderRight: isDragging 
                  ? '2px solid #3b82f6' 
                  : (isSelected ? '3px solid #3b82f6' : 'none'),
                borderTop: isDragging 
                  ? '2px solid #3b82f6' 
                  : (isSelected ? '3px solid #3b82f6' : 'none'),
                textAlign: 'center',
                fontSize: 11,
                color: '#6b7280',
                fontWeight: isWeekend ? 700 : 500,
                cursor: draggingState?.isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                opacity: isWeekend ? 1 : 0.8
              }}
            >
              <div style={{ fontWeight: isWeekend ? 700 : 500 }}>{weekDayHeaders[dayOfWeek]}</div>
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: isWeekend ? 700 : 500 }}>{day.getDate()}/{day.getMonth() + 1}</div>
            </div>
          );
        })}

        {/* Lignes suivantes - une ligne par hébergement */}
        {accommodations.map(acc => {
          const stockMap = stockByAccommodation[acc.idHebergement] || {};
          const priceMap = ratesByAccommodation[acc.idHebergement] || {};
          const dureeMinMap = dureeMinByAccommodation[acc.idHebergement] || {};

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
                  color: '#111827',
                  userSelect: 'none'
                }}
              >
                {acc.nomHebergement}
              </div>

              {/* Cellules de données pour chaque jour */}
              {allDays.map((day, idx) => {
                const dateStr = formatDate(day);
                const stock = stockMap[dateStr] ?? 0;
                const isAvailable = stock > 0;
                // Récupérer le prix pour le type tarif sélectionné
                const price = selectedRateTypeId !== null 
                  ? priceMap[dateStr]?.[selectedRateTypeId] 
                  : undefined;
                const dureeMin = dureeMinMap[dateStr] ?? null;
                const isSelected = selectedDates.has(dateStr);
                const isDragging = draggingDates.has(dateStr);
                // Vérifier si le prix du type tarif sélectionné a été modifié
                const isModified = selectedRateTypeId !== null 
                  ? modifiedRates.has(`${acc.idHebergement}-${dateStr}-${selectedRateTypeId}`)
                  : false;
                const isModifiedDureeMin = modifiedDureeMin.has(`${acc.idHebergement}-${dateStr}`);
                const isEditing = editingCell?.accId === acc.idHebergement && editingCell?.dateStr === dateStr;
                const isEditingDureeMin = editingDureeMinCell?.accId === acc.idHebergement && editingDureeMinCell?.dateStr === dateStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Dimanche = 0, Samedi = 6
                
                // Couleur de fond : surbrillance si sélectionné ou en drag, sinon couleur de disponibilité
                let bgColor: string;
                if (isDragging) {
                  // Surbrillance temporaire pendant le drag
                  bgColor = 'rgba(59, 130, 246, 0.2)';
                } else if (isSelected) {
                  // Surbrillance bleue avec opacité, en combinaison avec la couleur de disponibilité
                  const baseColor = isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)';
                  bgColor = isAvailable 
                    ? 'rgba(59, 130, 246, 0.15)' // Bleu pour disponible + sélectionné
                    : 'rgba(59, 130, 246, 0.1)';  // Bleu plus clair pour indisponible + sélectionné
                } else {
                  if (isWeekend) {
                    // Weekend : style normal (opacité complète)
                    bgColor = isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(220, 38, 38, 0.2)';
                  } else {
                    // Jours de semaine : fond grisé avec opacité réduite
                    bgColor = isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)';
                  }
                }
                
                // Bordure : surbrillance bleue si sélectionné ou en drag, sinon couleur de disponibilité
                const borderColor = (isSelected || isDragging)
                  ? '#3b82f6' 
                  : (isAvailable ? 'rgba(34, 197, 94, 0.4)' : 'rgba(220, 38, 38, 0.4)');
                const borderWidth = isDragging ? '2px' : (isSelected ? '3px' : '1px');

                return (
                  <div
                    key={`${acc.idHebergement}-${idx}`}
                    data-date={dateStr}
                    onClick={(e) => {
                      // Ne pas traiter comme un clic si on vient de finir un drag
                      if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                        e.preventDefault();
                        return;
                      }
                      handleCellClick(acc.idHebergement, dateStr);
                    }}
                    style={{
                      padding: '8px 4px',
                      background: bgColor,
                      borderTop: `${borderWidth} solid ${borderColor}`,
                      borderLeft: `${borderWidth} solid ${borderColor}`,
                      borderRight: `${borderWidth} solid ${borderColor}`,
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: isWeekend ? 700 : 500,
                      color: '#111827',
                      minHeight: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isSelected ? 'pointer' : 'default',
                      opacity: isWeekend || isSelected || isDragging ? 1 : 0.7,
                      userSelect: 'none'
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, userSelect: 'none' }}>
                        {selectedRateTypeId !== null ? (
                          price != null ? (
                            <span style={{ userSelect: 'none' }}>
                              {`${Math.round(price)}€`}
                              {isModified && (
                                <span style={{ color: '#eab308', marginLeft: 2, userSelect: 'none' }}>*</span>
                              )}
                            </span>
                          ) : (
                            <span style={{ userSelect: 'none', color: '#9ca3af' }}>-</span>
                          )
                        ) : null}
                        {isEditingDureeMin ? (
                          <input
                            type="number"
                            value={editingDureeMinValue}
                            onChange={(e) => setEditingDureeMinValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                handleDureeMinSubmit();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleDureeMinCancel();
                              }
                            }}
                            onBlur={handleDureeMinSubmit}
                            autoFocus
                            style={{
                              width: '60px',
                              textAlign: 'center',
                              fontSize: 10,
                              fontWeight: 400,
                              border: '2px solid #3b82f6',
                              borderRadius: 4,
                              padding: '2px 4px',
                              background: '#fff',
                              color: '#111827'
                            }}
                            min="1"
                            step="1"
                            placeholder="-"
                          />
                        ) : (
                          <span 
                            onClick={(e) => {
                              // Ne pas traiter comme un clic si on vient de finir un drag
                              if (justFinishedDragRef.current || (draggingState && draggingState.isDragging)) {
                                e.preventDefault();
                                return;
                              }
                              e.stopPropagation(); // Empêcher le clic de remonter à la cellule parente
                              handleDureeMinClick(acc.idHebergement, dateStr);
                            }}
                            style={{ 
                              fontSize: 10, 
                              color: '#6b7280', 
                              fontWeight: 400,
                              marginTop: price != null ? 2 : 0,
                              cursor: isSelected ? 'pointer' : 'default',
                              userSelect: 'none'
                            }}
                          >
                            {dureeMin != null && dureeMin > 0 ? `${dureeMin}+` : '-'}
                            {isModifiedDureeMin && (
                              <span style={{ color: '#eab308', marginLeft: 2, userSelect: 'none' }}>*</span>
                            )}
                          </span>
                        )}
                      </div>
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


