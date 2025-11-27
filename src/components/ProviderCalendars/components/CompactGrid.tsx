/**
 * Composant CompactGrid - Grille de calendrier compacte
 * 
 * Ce composant affiche une grille de calendrier permettant de visualiser et éditer
 * les tarifs et durées minimales pour plusieurs hébergements sur une plage de dates.
 * Il supporte la sélection de dates par clic et drag, l'édition inline des prix
 * et durées minimales, et la visualisation du stock disponible.
 */

import React from 'react';
import type { Accommodation, BookingDisplay } from '@/types';
import { formatDate, getDaysInRange, isPastDate } from '../utils/dateUtils';
import { GridDataCell } from './CompactGrid/components/GridDataCell';
import { GridHeaderCell } from './CompactGrid/components/GridHeaderCell';
import { BookingOverlay } from './CompactGrid/components/BookingOverlay';
import { useGridDrag } from './CompactGrid/hooks/useGridDrag';
import { useGridEditing } from './CompactGrid/hooks/useGridEditing';
import { getDateFromElement, getDateRange, filterBookingsByDateRange } from './CompactGrid/utils/gridUtils';
import { darkTheme } from '../utils/theme';

/**
 * Vérifie si un hébergement a des types de tarifs associés
 * 
 * @param accId - ID de l'hébergement
 * @param rateTypeLinksByAccommodation - Map des IDs de types de tarif liés par hébergement
 * @returns true si l'hébergement a au moins un type de tarif lié
 */
function hasRateTypes(accId: number, rateTypeLinksByAccommodation: Record<number, number[]>): boolean {
  const linkedRateTypeIds = rateTypeLinksByAccommodation[accId];
  return linkedRateTypeIds !== undefined && linkedRateTypeIds.length > 0;
}

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
  /** Map des IDs de types de tarif liés par hébergement (clé: idHebergement, valeur: array d'idTypeTarif) */
  rateTypeLinksByAccommodation: Record<number, number[]>;
  /** Map des durées minimales par hébergement et date */
  dureeMinByAccommodation: Record<number, Record<string, Record<number, number | null>>>;
  /** Map des arrivées autorisées par hébergement et date */
  arriveeAutoriseeByAccommodation: Record<number, Record<string, Record<number, boolean>>>;
  /** Map des réservations par hébergement */
  bookingsByAccommodation: Record<number, BookingDisplay[]>;
  /** Set des cellules sélectionnées au format "accId|dateStr" */
  selectedCells: Set<string>;
  /** Callback pour mettre à jour la sélection de cellules */
  onSelectedCellsChange: (cells: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  /** Map du stock par hébergement et date (pour filtrer la sélection) */
  stockByAccommodation: Record<number, Record<string, number>>;
  /** Set des identifiants de tarifs modifiés (format: "accId-dateStr-rateTypeId") */
  modifiedRates: Set<string>;
  /** Set des identifiants de durées minimales modifiées (format: "accId-dateStr") */
  modifiedDureeMin: Set<string>;
  /** Set des identifiants d'arrivées autorisées modifiées (format: "accId-dateStr") */
  modifiedArriveeAutorisee: Set<string>;
  /** Callback appelé quand un prix est mis à jour */
  onRateUpdate: (newPrice: number, editAllSelection?: boolean, editingCell?: { accId: number; dateStr: string } | null) => void;
  /** Callback appelé quand une durée minimale est mise à jour */
  onDureeMinUpdate: (newDureeMin: number | null, editAllSelection?: boolean, editingCell?: { accId: number; dateStr: string } | null) => void;
  /** Callback appelé quand arriveeAutorisee est mis à jour */
  onArriveeAutoriseeUpdate: (accId: number, dateStr: string, isAllowed: boolean, editAllSelection?: boolean) => void;
  /** ID du type de tarif sélectionné */
  selectedRateTypeId: number | null;
  /** Map des jours non réservables par hébergement (clé: idHebergement, valeur: Set des dates non réservables) */
  nonReservableDaysByAccommodation: Record<number, Set<string>>;
  /** Map des dates occupées par réservation par hébergement (clé: idHebergement, valeur: Set des dates occupées) */
  bookedDatesByAccommodation: Record<number, Set<string>>;
  /** ID de la réservation sélectionnée (uniquement Directe) */
  selectedBookingId?: number | null;
  /** Callback appelé quand l'utilisateur clique sur une réservation Directe */
  onBookingClick?: (booking: BookingDisplay) => void;
}

export function CompactGrid({
  startDate,
  endDate,
  accommodations,
  stockByAccommodation,
  ratesByAccommodation,
  rateTypeLinksByAccommodation,
  dureeMinByAccommodation,
  arriveeAutoriseeByAccommodation,
  bookingsByAccommodation,
  selectedCells,
  onSelectedCellsChange,
  modifiedRates,
  modifiedDureeMin,
  modifiedArriveeAutorisee,
  onRateUpdate,
  onDureeMinUpdate,
  onArriveeAutoriseeUpdate,
  selectedRateTypeId,
  nonReservableDaysByAccommodation,
  bookedDatesByAccommodation,
  selectedBookingId,
  onBookingClick
}: CompactGridProps): React.ReactElement {
  const allDays = React.useMemo(() => getDaysInRange(startDate, endDate), [startDate, endDate]);
  const gridRef = React.useRef<HTMLDivElement>(null);
  
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
    selectedCells,
    ratesByAccommodation,
    dureeMinByAccommodation,
    selectedRateTypeId,
    onRateUpdate,
    onDureeMinUpdate
  );

  // Hook pour gérer le drag
  const {
    draggingState,
    draggingCells,
    justFinishedDragRef,
    handleMouseDown
  } = useGridDrag(
    onSelectedCellsChange,
    getDateFromElement,
    getDateRange,
    editingCell,
    accommodations,
    stockByAccommodation,
    bookedDatesByAccommodation,
    rateTypeLinksByAccommodation
  );

  // Gestionnaire de clic pour sélectionner/désélectionner une colonne
  // Sélectionne toutes les cellules non occupées par une réservation, non passées, et pour les hébergements avec types de tarifs
  const handleHeaderClick = React.useCallback((dateStr: string) => {
    // Ne pas permettre la sélection si la date est passée
    if (isPastDate(dateStr)) {
      return;
    }
    
    onSelectedCellsChange((prev: Set<string>) => {
      const newSet = new Set(prev);
      
      // Vérifier si toutes les cellules non occupées de cette colonne sont sélectionnées
      let allSelected = true;
      for (const acc of accommodations) {
        const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;
        const accHasRateTypes = hasRateTypes(acc.idHebergement, rateTypeLinksByAccommodation);
        if (isBooked || !accHasRateTypes) continue; // Ignorer les dates occupées et les hébergements sans types de tarifs
        
        const cellKey = `${acc.idHebergement}|${dateStr}`;
        if (!newSet.has(cellKey)) {
          allSelected = false;
          break;
        }
      }
      
      // Si toutes les cellules non occupées sont sélectionnées, désélectionner toutes
      // Sinon, sélectionner toutes les cellules non occupées
      for (const acc of accommodations) {
        const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;
        const accHasRateTypes = hasRateTypes(acc.idHebergement, rateTypeLinksByAccommodation);
        if (isBooked || !accHasRateTypes) continue; // Ne pas sélectionner les dates occupées ni les hébergements sans types de tarifs
        
        const cellKey = `${acc.idHebergement}|${dateStr}`;
        if (allSelected) {
          newSet.delete(cellKey);
        } else {
          newSet.add(cellKey);
        }
      }
      
      return newSet;
    });
  }, [onSelectedCellsChange, accommodations, bookedDatesByAccommodation, rateTypeLinksByAccommodation]);

  // Plus de gestionnaire de scroll nécessaire : le scroll horizontal a été supprimé
  // La navigation se fait désormais uniquement via les contrôles de plage de dates (startDate/endDate)

  // Gestionnaire pour la touche Échap : annule toute sélection ou annule l'édition
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingCell) {
          handleEditCancel();
        } else if (editingDureeMinCell) {
          handleDureeMinCancel();
        } else {
          onSelectedCellsChange(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell, editingDureeMinCell, onSelectedCellsChange, handleEditCancel, handleDureeMinCancel]);

  return (
    <>
      <div 
        ref={scrollContainerRef}
        style={{ 
          overflowX: 'hidden', 
          border: `1px solid ${darkTheme.borderColor}`, 
          borderRadius: 8, 
          background: darkTheme.bgSecondary, 
          userSelect: 'none',
          position: 'relative'
        }}
      >
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `200px repeat(${allDays.length}, 80px)`,
          gap: 2,
          minWidth: 'fit-content',
          userSelect: 'none',
          position: 'relative',
          zIndex: 1
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
          // Une colonne est considérée sélectionnée si :
          // - Il y a au moins une cellule non occupée
          // - ET toutes les cellules non occupées sont sélectionnées
          // Si toutes les cellules sont occupées, la colonne n'est pas sélectionnée
          const selectableAccommodations = accommodations.filter(acc => {
            const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;
            const accHasRateTypes = hasRateTypes(acc.idHebergement, ratesByAccommodation);
            return !isBooked && accHasRateTypes;
          });
          
          const isSelected = accommodations.length > 0 
            && selectableAccommodations.length > 0 // Au moins une cellule sélectionnable
            && selectableAccommodations.every(acc => {
              const cellKey = `${acc.idHebergement}|${dateStr}`;
              return selectedCells.has(cellKey);
            });
          // Une colonne est en drag si au moins une cellule sélectionnable est en drag
          const isDragging = accommodations.some(acc => {
            const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;
            const accHasRateTypes = hasRateTypes(acc.idHebergement, ratesByAccommodation);
            if (isBooked || !accHasRateTypes) return false; // Ignorer les dates occupées et les hébergements sans types de tarifs
            const cellKey = `${acc.idHebergement}|${dateStr}`;
            return draggingCells.has(cellKey);
          });
          
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
        {accommodations.map((acc, accIdx) => {
          const stockMap = stockByAccommodation[acc.idHebergement] || {};
          const priceMap = ratesByAccommodation[acc.idHebergement] || {};
          const dureeMinMap = dureeMinByAccommodation[acc.idHebergement] || {};
          const accHasRateTypes = hasRateTypes(acc.idHebergement, rateTypeLinksByAccommodation);
          // rowIndex dans la grille CSS : header est row 1, première ligne d'hébergement est row 2, etc.
          const gridRow = accIdx + 2; // +2 car row 1 est le header

          return (
            <React.Fragment key={acc.idHebergement}>
              {/* Cellule nom de l'hébergement */}
              <div
                data-acc-id={acc.idHebergement}
                data-cell-type="name"
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
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                title={accHasRateTypes 
                  ? undefined 
                  : 'Aucun typeTarif associé'}
              >
                <span
                  style={{
                    color: accHasRateTypes 
                      ? darkTheme.textPrimary 
                      : darkTheme.textSecondary,
                    textDecoration: accHasRateTypes 
                      ? 'none' 
                      : 'line-through'
                  }}
                >
                  {acc.nomHebergement}
                </span>
                {!accHasRateTypes && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: '#f59e0b', // Couleur warning (orange/amber)
                      fontSize: 16,
                      cursor: 'help'
                    }}
                    title="Aucun typeTarif associé"
                    role="img"
                    aria-label="Avertissement: aucun type de tarif associé"
                  >
                    ⚠️
                  </span>
                )}
              </div>

              {/* Cellules de données pour chaque jour */}
              {allDays.map((day, dayIdx) => {
                const dateStr = formatDate(day);
                const stock = stockMap[dateStr] ?? 0;
                const price = selectedRateTypeId !== null 
                  ? priceMap[dateStr]?.[selectedRateTypeId] 
                  : undefined;
                const dureeMin = selectedRateTypeId !== null
                  ? (dureeMinMap[dateStr]?.[selectedRateTypeId] ?? null)
                  : null;
                const arriveeAutoriseeMap = arriveeAutoriseeByAccommodation[acc.idHebergement] ?? {};
                const arriveeAutorisee = selectedRateTypeId !== null
                  ? (arriveeAutoriseeMap[dateStr]?.[selectedRateTypeId] ?? true) // Par défaut true
                  : true;
                const cellKey = `${acc.idHebergement}|${dateStr}`;
                const isSelected = selectedCells.has(cellKey);
                const isDragging = draggingCells.has(cellKey);
                const isModified = selectedRateTypeId !== null 
                  ? modifiedRates.has(`${acc.idHebergement}-${dateStr}-${selectedRateTypeId}`)
                  : false;
                const isModifiedDureeMin = modifiedDureeMin.has(`${acc.idHebergement}-${dateStr}`);
                const isModifiedArriveeAutorisee = modifiedArriveeAutorisee.has(`${acc.idHebergement}-${dateStr}`);
                const isEditing = editingCell?.accId === acc.idHebergement && editingCell?.dateStr === dateStr;
                const isEditingDureeMin = editingDureeMinCell?.accId === acc.idHebergement && editingDureeMinCell?.dateStr === dateStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isNonReservable = (nonReservableDaysByAccommodation[acc.idHebergement] ?? new Set<string>()).has(dateStr);
                const isBooked = bookedDatesByAccommodation[acc.idHebergement]?.has(dateStr) ?? false;

                return (
                  <GridDataCell
                    key={`${acc.idHebergement}-${dayIdx}`}
                    accId={acc.idHebergement}
                    dateStr={dateStr}
                    stock={stock}
                    price={price}
                    dureeMin={dureeMin}
                    isSelected={isSelected}
                    isDragging={isDragging}
                    isModified={isModified}
                    isModifiedDureeMin={isModifiedDureeMin}
                    arriveeAutorisee={arriveeAutorisee}
                    isModifiedArriveeAutorisee={isModifiedArriveeAutorisee}
                    onArriveeAutoriseeChange={onArriveeAutoriseeUpdate}
                    selectedCellsCount={selectedCells.size}
                    isEditing={isEditing}
                    isEditingDureeMin={isEditingDureeMin}
                    editingValue={editingValue}
                    editingDureeMinValue={editingDureeMinValue}
                    isWeekend={isWeekend}
                    isNonReservable={isNonReservable}
                    isBooked={isBooked}
                    hasRateTypes={accHasRateTypes}
                    selectedRateTypeId={selectedRateTypeId}
                    draggingState={draggingState}
                    justFinishedDragRef={justFinishedDragRef}
                    onCellClick={handleCellClick}
                    onDureeMinClick={handleDureeMinClick}
                    onMouseDown={handleMouseDown}
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
      
      {/* Overlay simple pour les rectangles de réservation */}
      <BookingOverlay
        accommodations={accommodations}
        allDays={allDays}
        bookingsByAccommodation={filteredBookingsByAccommodation}
        startDate={startDate}
        endDate={endDate}
        gridRef={gridRef}
        selectedBookingId={selectedBookingId}
        onBookingClick={onBookingClick}
      />
    </div>
    </>
  );
}
