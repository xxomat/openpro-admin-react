/**
 * Service de chargement du stock
 * 
 * Ce fichier contient les fonctions pour charger le stock disponible
 * pour un hébergement sur une plage de dates donnée.
 */

import type { ClientByRole } from '../../../../../../openpro-api-react/src/client/OpenProClient';

/**
 * Charge le stock disponible pour un hébergement sur une plage de dates
 * 
 * Cette fonction récupère le stock depuis l'API et normalise les différentes
 * structures de réponse possibles vers une map simple date -> quantité.
 * 
 * @param client - Client API OpenPro configuré avec le rôle 'admin'
 * @param idFournisseur - Identifiant du fournisseur
 * @param idHebergement - Identifiant de l'hébergement
 * @param debut - Date de début au format YYYY-MM-DD
 * @param fin - Date de fin au format YYYY-MM-DD
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Map du stock par date (clé: date YYYY-MM-DD, valeur: quantité disponible)
 */
export async function loadStockForAccommodation(
  client: ClientByRole<'admin'>,
  idFournisseur: number,
  idHebergement: number,
  debut: string,
  fin: string,
  signal?: AbortSignal
): Promise<Record<string, number>> {
  const stock = await client.getStock(idFournisseur, idHebergement, {
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
  return mapStock;
}

