/**
 * Services de chargement de données
 * 
 * Ce fichier contient toutes les fonctions de chargement de données depuis l'API,
 * incluant le chargement des hébergements, du stock, des tarifs, et des types
 * de tarifs pour un fournisseur donné.
 */

import type { ClientByRole } from '../../../../openpro-api-react/src/client/OpenProClient';
import type { Accommodation, SupplierData, RateType } from '../types';
import { formatDate, addMonths } from '../utils/dateUtils';

/**
 * Charge la liste des hébergements pour un fournisseur donné
 */
export async function loadAccommodations(
  client: ClientByRole<'admin'>,
  idFournisseur: number,
  signal?: AbortSignal
): Promise<Accommodation[]> {
  const resp = await client.listAccommodations(idFournisseur);
  if (signal?.aborted) throw new Error('Cancelled');
  // Normalize API/stub shapes to internal { idHebergement, nomHebergement }
  const items: Accommodation[] = ((resp as any).hebergements ?? (resp as any).listeHebergement ?? []).map((x: any) => {
    const id = x?.idHebergement ?? x?.cleHebergement?.idHebergement;
    const name = x?.nomHebergement ?? x?.nom ?? '';
    return { idHebergement: Number(id), nomHebergement: String(name) };
  });
  return items;
}

/**
 * Charge toutes les données (stock, tarifs, types de tarifs) pour un fournisseur
 * et une liste d'hébergements donnés
 */
export async function loadSupplierData(
  client: ClientByRole<'admin'>,
  idFournisseur: number,
  accommodationsList: Accommodation[],
  startDate: Date,
  monthsCount: number,
  signal?: AbortSignal
): Promise<SupplierData> {
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
  const rateTypesList: RateType[] = [];
  
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
}

