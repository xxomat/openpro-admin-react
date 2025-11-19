/**
 * Service de chargement des hébergements
 * 
 * Ce fichier contient les fonctions pour charger la liste des hébergements
 * depuis l'API et normaliser les données dans le format interne de l'application.
 */

import type { ClientByRole } from '../../../../../../openpro-api-react/src/client/OpenProClient';
import type { Accommodation } from '../../types';

/**
 * Charge la liste des hébergements pour un fournisseur donné
 * 
 * Cette fonction appelle l'API pour récupérer les hébergements d'un fournisseur
 * et normalise les différentes structures de réponse possibles (API réelle vs stub)
 * vers le format interne { idHebergement, nomHebergement }.
 * 
 * @param client - Client API OpenPro configuré avec le rôle 'admin'
 * @param idFournisseur - Identifiant du fournisseur
 * @param signal - Signal d'annulation optionnel pour interrompre la requête
 * @returns Promise résolue avec la liste des hébergements normalisés
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

