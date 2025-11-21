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
import { BookingTooltip } from './BookingTooltip';

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

  // État pour le tooltip
  const [tooltipState, setTooltipState] = React.useState<{
    booking: BookingDisplay | null;
    x: number;
    y: number;
    visible: boolean;
  }>({
    booking: null,
    x: 0,
    y: 0,
    visible: false
  });

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
        
        // Centrer verticalement en alignant les centres
        // Centre vertical de la ligne : top_line + height_line/2
        // Centre vertical du rectangle : top_rect + height_rect/2
        // Pour aligner : top_rect + height_rect/2 = top_line + height_line/2
        // Donc : top_rect = top_line + height_line/2 - height_rect/2
        const height = nameRect.height * 0.8; // 80% de la hauteur de la cellule
        const lineTop = nameRect.top - gridRect.top;
        const lineCenter = lineTop + nameRect.height / 2;
        const top = lineCenter - height / 2;

        let left: number;
        let width: number;

        // Trouver la première cellule de date pour connaître la position de départ des colonnes de dates
        const firstDateCell = gridElement.querySelector(`[data-date="${formatDate(allDays[0])}"]`) as HTMLElement;
        if (!firstDateCell) continue;
        const firstDateRect = firstDateCell.getBoundingClientRect();
        const firstDateLeft = firstDateRect.left - gridRect.left; // Position de la première colonne de dates

        if (arrivalCell && departureCell) {
          const arrivalRect = arrivalCell.getBoundingClientRect();
          const departureRect = departureCell.getBoundingClientRect();
          // Commencer à 60% de la cellule d'arrivée
          const calculatedLeft = arrivalRect.left - gridRect.left + arrivalRect.width * 0.6;
          // S'assurer que le rectangle ne commence jamais avant la première colonne de dates
          left = Math.max(calculatedLeft, firstDateLeft);
          // Terminer à 20% de la cellule de départ
          width = (departureRect.left - gridRect.left + departureRect.width * 0.2) - left;
        } else if (arrivalCell) {
          // Date d'arrivée visible, date de départ après la plage
          const arrivalRect = arrivalCell.getBoundingClientRect();
          const calculatedLeft = arrivalRect.left - gridRect.left + arrivalRect.width * 0.6;
          // S'assurer que le rectangle ne commence jamais avant la première colonne de dates
          left = Math.max(calculatedLeft, firstDateLeft);
          // Aller jusqu'à la fin de la grille
          width = gridRect.width - left;
        } else if (departureCell) {
          // Date d'arrivée avant la plage, date de départ visible
          const departureRect = departureCell.getBoundingClientRect();
          // Commencer au début de la première colonne de dates (pas avant)
          left = firstDateLeft;
          // Terminer à 20% de la cellule de départ
          width = (departureRect.left - gridRect.left + departureRect.width * 0.2) - left;
        } else {
          // Les deux dates sont hors plage, couvrir toute la plage à partir de la première colonne de dates
          const lastDateCell = gridElement.querySelector(`[data-date="${formatDate(allDays[allDays.length - 1])}"]`) as HTMLElement;
          if (lastDateCell) {
            const lastDateRect = lastDateCell.getBoundingClientRect();
            left = firstDateLeft;
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

  // Gérer le survol de la souris
  const handleMouseEnter = React.useCallback((booking: BookingDisplay, event: React.MouseEvent) => {
    setTooltipState({
      booking,
      x: event.clientX,
      y: event.clientY,
      visible: true
    });
  }, []);

  const handleMouseMove = React.useCallback((event: React.MouseEvent) => {
    if (tooltipState.visible && tooltipState.booking) {
      setTooltipState(prev => ({
        ...prev,
        x: event.clientX,
        y: event.clientY
      }));
    }
  }, [tooltipState.visible, tooltipState.booking]);

  const handleMouseLeave = React.useCallback(() => {
    setTooltipState({
      booking: null,
      x: 0,
      y: 0,
      visible: false
    });
  }, []);

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
      {rects.map((rect, idx) => {
        // Trouver le nom de l'hébergement
        const accommodation = accommodations.find(acc => acc.idHebergement === rect.booking.idHebergement);
        const nomHebergement = accommodation?.nomHebergement || '';
        
        // Extraire seulement le nom de famille (dernier mot du nom complet)
        const clientNomFamille = rect.booking.clientNom 
          ? rect.booking.clientNom.split(' ').pop() || rect.booking.clientNom
          : '';
        
        // Format du nombre de personnes : "2p." ou "4p."
        const nbPersonnesText = rect.booking.nbPersonnes != null ? `${rect.booking.nbPersonnes}p.` : '';
        
        // Construire le texte complet sur une ligne
        const parts: string[] = [];
        if (clientNomFamille) parts.push(clientNomFamille);
        if (nbPersonnesText) parts.push(nbPersonnesText);
        if (nomHebergement) parts.push(nomHebergement);
        if (rect.booking.montantTotal != null) parts.push(`${Math.round(rect.booking.montantTotal)}€`);
        
        const displayText = parts.join(' • ');
        
        return (
          <div
            key={`${rect.booking.idDossier}-${idx}`}
            style={{
              position: 'absolute',
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              top: `${rect.top}px`,
              height: `${rect.height}px`,
              background: darkTheme.bookingBg,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              fontSize: 13,
              fontWeight: 500,
              color: 'white',
              padding: '0 6px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => handleMouseEnter(rect.booking, e)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            title={displayText}
          >
            {displayText}
          </div>
        );
      })}
      
      {/* Tooltip */}
      {tooltipState.booking && (
        <BookingTooltip
          booking={tooltipState.booking}
          x={tooltipState.x}
          y={tooltipState.y}
          visible={tooltipState.visible}
        />
      )}
    </div>
  );
}
