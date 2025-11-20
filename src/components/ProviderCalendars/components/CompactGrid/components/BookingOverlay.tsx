/**
 * Composant BookingOverlay - Overlay des rectangles de réservation
 * 
 * Ce composant affiche des rectangles bleus opaques par-dessus les cellules de la grille
 * pour représenter visuellement les réservations. Il utilise des refs pour mesurer
 * les positions réelles des cellules dans le DOM.
 */

import React from 'react';
import type { Accommodation, BookingDisplay } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';
import { filterBookingsByDateRange } from '../utils/gridUtils';
import { darkTheme } from '../../../utils/theme';

/**
 * Props du composant BookingOverlay
 */
export interface BookingOverlayProps {
  /** Liste des hébergements affichés */
  accommodations: Accommodation[];
  /** Tableau de toutes les dates affichées dans la grille */
  allDays: Date[];
  /** Map des réservations par hébergement */
  bookingsByAccommodation: Record<number, BookingDisplay[]>;
  /** Date de début de la plage affichée */
  startDate: Date;
  /** Date de fin de la plage affichée */
  endDate: Date;
  /** Ref vers le conteneur de la grille */
  gridRef: React.RefObject<HTMLDivElement>;
}

/**
 * Composant pour afficher les rectangles de réservation en overlay
 */
export function BookingOverlay({
  accommodations,
  allDays,
  bookingsByAccommodation,
  startDate,
  endDate,
  gridRef
}: BookingOverlayProps): React.ReactElement {
  const [rects, setRects] = React.useState<Array<{
    booking: BookingDisplay;
    left: number;
    width: number;
    top: number;
    height: number;
  }>>([]);

  // Calculer les positions en mesurant le DOM
  React.useEffect(() => {
    if (!gridRef.current) return;

    const gridElement = gridRef.current;
    const newRects: Array<{
      booking: BookingDisplay;
      left: number;
      width: number;
      top: number;
      height: number;
    }> = [];

    for (const acc of accommodations) {
      const bookings = bookingsByAccommodation[acc.idHebergement] || [];
      const filteredBookings = filterBookingsByDateRange(bookings, startDate, endDate);

      for (const booking of filteredBookings) {
        // Trouver la cellule de date d'arrivée
        const arrivalCell = gridElement.querySelector(`[data-date="${booking.dateArrivee}"][data-acc-id="${acc.idHebergement}"]`) as HTMLElement;
        // Trouver la cellule de date de départ
        const departureCell = gridElement.querySelector(`[data-date="${booking.dateDepart}"][data-acc-id="${acc.idHebergement}"]`) as HTMLElement;
        // Trouver la cellule nom de l'hébergement pour obtenir la hauteur de ligne
        const nameCell = gridElement.querySelector(`[data-acc-id="${acc.idHebergement}"][data-cell-type="name"]`) as HTMLElement;

        if (!nameCell) continue;

        const gridRect = gridElement.getBoundingClientRect();
        const nameRect = nameCell.getBoundingClientRect();
        
        const top = nameRect.top - gridRect.top;
        const height = nameRect.height;

        let left: number;
        let width: number;

        if (arrivalCell && departureCell) {
          const arrivalRect = arrivalCell.getBoundingClientRect();
          const departureRect = departureCell.getBoundingClientRect();
          // Commencer au milieu de la cellule d'arrivée
          left = arrivalRect.left - gridRect.left + arrivalRect.width / 2;
          // Terminer au milieu de la cellule de départ
          width = (departureRect.left - gridRect.left + departureRect.width / 2) - left;
        } else if (arrivalCell) {
          // Date d'arrivée visible, date de départ après la plage
          const arrivalRect = arrivalCell.getBoundingClientRect();
          left = arrivalRect.left - gridRect.left + arrivalRect.width / 2;
          // Aller jusqu'à la fin de la grille
          width = gridRect.width - left;
        } else if (departureCell) {
          // Date d'arrivée avant la plage, date de départ visible
          const departureRect = departureCell.getBoundingClientRect();
          // Commencer au début de la première colonne de dates
          const firstDateCell = gridElement.querySelector(`[data-date="${formatDate(allDays[0])}"]`) as HTMLElement;
          if (firstDateCell) {
            const firstDateRect = firstDateCell.getBoundingClientRect();
            left = firstDateRect.left - gridRect.left;
          } else {
            left = 200; // Largeur de la colonne nom
          }
          // Terminer au milieu de la cellule de départ
          width = (departureRect.left - gridRect.left + departureRect.width / 2) - left;
        } else {
          // Les deux dates sont hors plage, couvrir toute la plage
          const firstDateCell = gridElement.querySelector(`[data-date="${formatDate(allDays[0])}"]`) as HTMLElement;
          const lastDateCell = gridElement.querySelector(`[data-date="${formatDate(allDays[allDays.length - 1])}"]`) as HTMLElement;
          if (firstDateCell && lastDateCell) {
            const firstDateRect = firstDateCell.getBoundingClientRect();
            const lastDateRect = lastDateCell.getBoundingClientRect();
            left = firstDateRect.left - gridRect.left;
            width = (lastDateRect.right - gridRect.left) - left;
          } else {
            continue;
          }
        }

        newRects.push({
          booking,
          left,
          width,
          top,
          height
        });
      }
    }

    setRects(newRects);
  }, [accommodations, allDays, bookingsByAccommodation, startDate, endDate, gridRef]);

  if (!gridRef.current) return <></>;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2
      }}
    >
      {rects.map((rect, idx) => (
        <div
          key={`${rect.booking.idDossier}-${idx}`}
          style={{
            position: 'absolute',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            top: `${rect.top}px`,
            height: `${rect.height}px`,
            background: darkTheme.bookingBg,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            pointerEvents: 'none',
            fontSize: 11,
            fontWeight: 500,
            color: 'white'
          }}
        >
          {rect.booking.clientNom && (
            <div>{rect.booking.clientNom}</div>
          )}
          {rect.booking.montantTotal != null && (
            <div style={{ fontSize: 10, opacity: 0.9 }}>
              {Math.round(rect.booking.montantTotal)}€
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
