/**
 * Composant CompactGrid - Grille de calendrier compacte
 * 
 * Ce composant affiche une grille de calendrier permettant de visualiser et éditer
 * les tarifs et durées minimales pour plusieurs hébergements sur une plage de dates.
 * Il supporte la sélection de dates par clic et drag, l'édition inline des prix
 * et durées minimales, et la visualisation du stock disponible.
 */

import React from 'react';
import type { Accommodation, BookingDisplay } from '../types';
import { formatDate, getDaysInRange } from '../utils/dateUtils';
import { GridDataCell } from './CompactGrid/components/GridDataCell';
import { GridHeaderCell } from './CompactGrid/components/GridHeaderCell';
import { useGridDrag } from './CompactGrid/hooks/useGridDrag';
import { useGridEditing } from './CompactGrid/hooks/useGridEditing';
import { getDateFromElement, getDateRange, filterBookingsByDateRange, getBookingsForDate } from './CompactGrid/utils/gridUtils';
import { darkTheme } from '../utils/theme';

/**
 * Props du composant CompactGrid
 */
export interface CompactGridProps {
  /** Date de début de la période à afficher */
  startDate: Date;
  /** Date de fin de la période à afficher (incluse) */
  endDate: Date;
  /** Liste des hébergements à afficher */
  accommodations: Accommodation[];
  /** Map du stock par hébergement et date */
  stockByAccommodation: Record<number, Record<string, number>>;
  /** Map des tarifs par hébergement, date et type de tarif */
  ratesByAccommodation: Record<number, Record<string, Record<number, number>>>;
  /** Map des durées minimales par hébergement et date */
  dureeMinByAccommodation: Record<number, Record<string, number | null>>;
  /** Map des réservations par hébergement */
  bookingsByAccommodation: Record<number, BookingDisplay[]>;
  /** Set des dates sélectionnées au format YYYY-MM-DD */
  selectedDates: Set<string>;
  /** Callback pour mettre à jour la sélection de dates */
  onSelectedDatesChange: (dates: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  /** Set des identifiants de tarifs modifiés (format: "accId-dateStr-rateTypeId") */
  modifiedRates: Set<string>;
  /** Set des identifiants de durées minimales modifiées (format: "accId-dateStr") */
  modifiedDureeMin: Set<string>;
  /** Callback appelé quand un prix est mis à jour */
  onRateUpdate: (newPrice: number) => void;
  /** Callback appelé quand une durée minimale est mise à jour */
  onDureeMinUpdate: (newDureeMin: number | null) => void;
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
}

export function CompactGrid({
  startDate,
  endDate,
  accommodations,
  stockByAccommodation,
  ratesByAccommodation,
  dureeMinByAccommodation,
  bookingsByAccommodation,
  selectedDates,
  onSelectedDatesChange,
  modifiedRates,
  modifiedDureeMin,
  onRateUpdate,
  onDureeMinUpdate,
  selectedRateTypeId
}: CompactGridProps): React.ReactElement {
  const allDays = React.useMemo(() => getDaysInRange(startDate, endDate), [startDate, endDate]);
  
  // Filtrer les réservations pour ne garder que celles dans la plage de dates
  const filteredBookingsByAccommodation = React.useMemo(() => {
    const filtered: Record<number, BookingDisplay[]> = {};
    for (const acc of accommodations) {
      const bookings = bookingsByAccommodation[acc.idHebergement] || [];
      filtered[acc.idHebergement] = filterBookingsByDateRange(bookings, startDate, endDate);
    }
    return filtered;
  }, [accommodations, bookingsByAccommodation, startDate, endDate]);
  
  // Référence au conteneur scrollable
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Hook pour gérer l'édition
  const {
    editingCell,
    editingValue,
    editingDureeMinCell,
    editingDureeMinValue,
    setEditingValue,
    setEditingDureeMinValue,
    handleCellClick,
    handleDureeMinClick,
    handleEditSubmit,
    handleDureeMinSubmit,
    handleEditCancel,
    handleDureeMinCancel
  } = useGridEditing(
    selectedDates,
    ratesByAccommodation,
    dureeMinByAccommodation,
    selectedRateTypeId,
    onRateUpdate,
    onDureeMinUpdate
  );

  // Hook pour gérer le drag
  const {
    draggingState,
    draggingDates,
    justFinishedDragRef,
    handleMouseDown
  } = useGridDrag(
    onSelectedDatesChange,
    getDateFromElement,
    getDateRange,
    editingCell
  );

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

  // Gestionnaire pour convertir le scroll vertical en scroll horizontal
  // Utilisation d'un useEffect avec addEventListener pour pouvoir utiliser { passive: false }
  // et empêcher efficacement le scroll de la page
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // Convertir le scroll vertical en scroll horizontal
      container.scrollLeft += event.deltaY;
      
      // Empêcher le scroll vertical par défaut et la propagation vers la page
      event.preventDefault();
      event.stopPropagation();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Gestionnaire pour la touche Échap : annule toute sélection ou annule l'édition
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingCell) {
          handleEditCancel();
        } else if (editingDureeMinCell) {
          handleDureeMinCancel();
        } else {
          onSelectedDatesChange(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell, editingDureeMinCell, onSelectedDatesChange, handleEditCancel, handleDureeMinCancel]);

  return (
    <>
      <style>{`
        .compact-grid-scroll::-webkit-scrollbar {
          height: 12px;
        }
        .compact-grid-scroll::-webkit-scrollbar-track {
          background: ${darkTheme.bgTertiary};
          border-radius: 6px;
        }
        .compact-grid-scroll::-webkit-scrollbar-thumb {
          background: ${darkTheme.borderColorLight};
          border-radius: 6px;
          border: 2px solid ${darkTheme.bgTertiary};
        }
        .compact-grid-scroll::-webkit-scrollbar-thumb:hover {
          background: ${darkTheme.bgHover};
        }
        .compact-grid-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${darkTheme.borderColorLight} ${darkTheme.bgTertiary};
        }
      `}</style>
      <div 
        ref={scrollContainerRef}
        className="compact-grid-scroll"
        style={{ 
          overflowX: 'scroll', 
          border: `1px solid ${darkTheme.borderColor}`, 
          borderRadius: 8, 
          background: darkTheme.bgSecondary, 
          userSelect: 'none' 
        }}
      >
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
            background: darkTheme.gridHeaderBg,
            borderBottom: `2px solid ${darkTheme.borderColor}`,
            fontWeight: 600,
            fontSize: 13,
            color: darkTheme.textPrimary,
            position: 'sticky',
            left: 0,
            zIndex: 10,
            borderRight: `1px solid ${darkTheme.borderColor}`
          }}
        >
          Hébergement
        </div>
        {allDays.map((day, idx) => {
          const dateStr = formatDate(day);
          const isSelected = selectedDates.has(dateStr);
          const isDragging = draggingDates.has(dateStr);
          
          return (
            <GridHeaderCell
              key={idx}
              day={day}
              dateStr={dateStr}
              isSelected={isSelected}
              isDragging={isDragging}
              draggingState={draggingState}
              justFinishedDragRef={justFinishedDragRef}
              onHeaderClick={handleHeaderClick}
              onMouseDown={handleMouseDown}
            />
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
                  background: darkTheme.bgSecondary,
                  borderRight: `1px solid ${darkTheme.borderColor}`,
                  borderBottom: `1px solid ${darkTheme.borderColor}`,
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                  fontWeight: 500,
                  fontSize: 13,
                  color: darkTheme.textPrimary,
                  userSelect: 'none'
                }}
              >
                {acc.nomHebergement}
              </div>

              {/* Cellules de données pour chaque jour */}
              {allDays.map((day, idx) => {
                const dateStr = formatDate(day);
                const stock = stockMap[dateStr] ?? 0;
                const price = selectedRateTypeId !== null 
                  ? priceMap[dateStr]?.[selectedRateTypeId] 
                  : undefined;
                const dureeMin = dureeMinMap[dateStr] ?? null;
                const bookingsForDate = getBookingsForDate(
                  filteredBookingsByAccommodation[acc.idHebergement] || [],
                  dateStr
                );
                const isSelected = selectedDates.has(dateStr);
                const isDragging = draggingDates.has(dateStr);
                const isModified = selectedRateTypeId !== null 
                  ? modifiedRates.has(`${acc.idHebergement}-${dateStr}-${selectedRateTypeId}`)
                  : false;
                const isModifiedDureeMin = modifiedDureeMin.has(`${acc.idHebergement}-${dateStr}`);
                const isEditing = editingCell?.accId === acc.idHebergement && editingCell?.dateStr === dateStr;
                const isEditingDureeMin = editingDureeMinCell?.accId === acc.idHebergement && editingDureeMinCell?.dateStr === dateStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <GridDataCell
                    key={`${acc.idHebergement}-${idx}`}
                    accId={acc.idHebergement}
                    dateStr={dateStr}
                    stock={stock}
                    price={price}
                    dureeMin={dureeMin}
                    isSelected={isSelected}
                    isDragging={isDragging}
                    isModified={isModified}
                    isModifiedDureeMin={isModifiedDureeMin}
                    isEditing={isEditing}
                    isEditingDureeMin={isEditingDureeMin}
                    editingValue={editingValue}
                    editingDureeMinValue={editingDureeMinValue}
                    isWeekend={isWeekend}
                    selectedRateTypeId={selectedRateTypeId}
                    bookings={bookingsForDate}
                    draggingState={draggingState}
                    justFinishedDragRef={justFinishedDragRef}
                    onCellClick={handleCellClick}
                    onDureeMinClick={handleDureeMinClick}
                    setEditingValue={setEditingValue}
                    setEditingDureeMinValue={setEditingDureeMinValue}
                    onEditSubmit={handleEditSubmit}
                    onEditDureeMinSubmit={handleDureeMinSubmit}
                    onEditCancel={handleEditCancel}
                    onEditDureeMinCancel={handleDureeMinCancel}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
    </>
  );
}
