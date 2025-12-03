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
 * Vérifie le récapitulatif du stock pour une date donnée
 * 
 * @param dateStr - Date au format YYYY-MM-DD
 * @param accommodations - Liste de tous les hébergements
 * @param stockByAccommodation - Map du stock par hébergement et date
 * @returns Objet avec allAccommodationsHaveNoStock
 */
function getStockSummary(
  dateStr: string,
  accommodations: Accommodation[],
  stockByAccommodation: Record<number, Record<string, number>>
): { allAccommodationsHaveNoStock: boolean } {
  if (accommodations.length === 0) {
    return { allAccommodationsHaveNoStock: false };
  }

  let allHaveNoStock = true;

  for (const acc of accommodations) {
    const stock = stockByAccommodation[acc.accommodationId]?.[dateStr] ?? 0; // Défaut = 0 si non défini
    
    if (stock >= 1) {
      allHaveNoStock = false;
      break; // Dès qu'un hébergement a du stock, on peut arrêter
    }
  }

  return {
    allAccommodationsHaveNoStock: allHaveNoStock
  };
}

/**
 * Vérifie si au moins une réservation démarre à une date donnée
 * 
 * @param dateStr - Date au format YYYY-MM-DD
 * @param accommodations - Liste de tous les hébergements
 * @param bookingsByAccommodation - Map des réservations par hébergement
 * @returns true si au moins une réservation démarre à cette date
 */
function hasBookingStartingOnDate(
  dateStr: string,
  accommodations: Accommodation[],
  bookingsByAccommodation: Record<number, BookingDisplay[]>
): boolean {
  for (const acc of accommodations) {
    const bookings = bookingsByAccommodation[acc.accommodationId] || [];
    // Vérifier si au moins une réservation démarre à cette date
    if (bookings.some(booking => booking.arrivalDate === dateStr)) {
      return true;
    }
  }
  return false;
}

/**
 * Vérifie le récapitulatif de l'arrivée autorisée pour une date donnée
 * 
 * @param dateStr - Date au format YYYY-MM-DD
 * @param accommodations - Liste de tous les hébergements
 * @param arrivalAllowedByAccommodation - Map des arrivées autorisées par hébergement, date et type de tarif
 * @param rateTypeLinksByAccommodation - Map des IDs de types de tarif liés par hébergement
 * @param stockByAccommodation - Map du stock par hébergement et date
 * @returns Objet avec allAccommodationsAllowArrival et allAccommodationsDisallowArrival
 */
function getArrivalAllowedSummary(
  dateStr: string,
  accommodations: Accommodation[],
  arrivalAllowedByAccommodation: Record<number, Record<string, Record<number, boolean>>>,
  rateTypeLinksByAccommodation: Record<number, number[]>,
  stockByAccommodation: Record<number, Record<string, number>>
): { allAccommodationsAllowArrival: boolean; allAccommodationsDisallowArrival: boolean } {
  if (accommodations.length === 0) {
    return { allAccommodationsAllowArrival: false, allAccommodationsDisallowArrival: false };
  }

  // Vérifier d'abord si tous les hébergements ont un stock à 0
  let allHaveNoStock = true;
  for (const acc of accommodations) {
    const stock = stockByAccommodation[acc.accommodationId]?.[dateStr] ?? 0; // Défaut = 0 si non défini
    if (stock >= 1) {
      allHaveNoStock = false;
      break;
    }
  }
  
  // Si tous les hébergements ont un stock à 0, retourner rouge
  if (allHaveNoStock) {
    return { allAccommodationsAllowArrival: false, allAccommodationsDisallowArrival: true };
  }

  let allAllowArrival = true;
  let allDisallowArrival = true;
  let hasAccommodationsWithStock = false;

  for (const acc of accommodations) {
    // Ne garder que les hébergements qui ont du stock (stock ≥ 1) pour cette date
    const stock = stockByAccommodation[acc.accommodationId]?.[dateStr] ?? 0; // Défaut = 0 si non défini
    if (stock < 1) {
      continue; // Ignorer cet hébergement car il n'a pas de stock
    }
    
    hasAccommodationsWithStock = true;
    const linkedRateTypeIds = rateTypeLinksByAccommodation[acc.accommodationId];
    
    // Si aucun plan tarifaire → considéré comme non autorisé
    if (!linkedRateTypeIds || linkedRateTypeIds.length === 0) {
      allAllowArrival = false;
      continue;
    }

    const arrivalAllowedMap = arrivalAllowedByAccommodation[acc.accommodationId]?.[dateStr];
    
    // Si pas de données d'arrivée pour cette date → considéré comme non autorisé
    if (!arrivalAllowedMap) {
      allAllowArrival = false;
      continue;
    }

    // Vérifier tous les plans tarifaires associés
    let accAllowsArrival = true;
    let accDisallowsArrival = true;

    for (const rateTypeId of linkedRateTypeIds) {
      const arrivalAllowed = arrivalAllowedMap[rateTypeId];
      // Défaut = false si non défini (cas rare : plan tarifaire sans tarif)
      if (arrivalAllowed === true) {
        accDisallowsArrival = false;
      } else {
        accAllowsArrival = false;
      }
    }

    // Si l'hébergement a au moins un plan tarifaire avec arrivalAllowed = false, il est non autorisé
    if (!accAllowsArrival) {
      allAllowArrival = false;
    }
    // Si l'hébergement a tous ses plans tarifaires avec arrivalAllowed = false, il est complètement non autorisé
    if (!accDisallowsArrival) {
      allDisallowArrival = false;
    }
  }

  // Si aucun hébergement avec du stock, retourner false pour les deux
  if (!hasAccommodationsWithStock) {
    return { allAccommodationsAllowArrival: false, allAccommodationsDisallowArrival: false };
  }

  return {
    allAccommodationsAllowArrival: allAllowArrival,
    allAccommodationsDisallowArrival: allDisallowArrival
  };
}

/**
 * Props du composant CompactGrid
 */
export interface CompactGridProps {
  /** ID du fournisseur */
  supplierId: number;
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
  minDurationByAccommodation: Record<number, Record<string, Record<number, number | null>>>;
  /** Map des arrivées autorisées par hébergement et date */
  arrivalAllowedByAccommodation: Record<number, Record<string, Record<number, boolean>>>;
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
  modifiedMinDuration: Set<string>;
  /** Set des identifiants d'arrivées autorisées modifiées (format: "accId-dateStr") */
  modifiedArrivalAllowed: Set<string>;
  /** Callback appelé quand un prix est mis à jour */
  onRateUpdate: (newPrice: number, editAllSelection?: boolean, editingCell?: { accId: number; dateStr: string } | null) => void;
  /** Callback appelé quand une durée minimale est mise à jour */
  onMinDurationUpdate: (newMinDuration: number | null, editAllSelection?: boolean, editingCell?: { accId: number; dateStr: string } | null) => void;
  /** Callback appelé quand arrivalAllowed est mis à jour */
  onArrivalAllowedUpdate: (accId: number, dateStr: string, isAllowed: boolean, editAllSelection?: boolean) => void;
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
  supplierId,
  startDate,
  endDate,
  accommodations,
  stockByAccommodation,
  ratesByAccommodation,
  rateTypeLinksByAccommodation,
  minDurationByAccommodation,
  arrivalAllowedByAccommodation,
  bookingsByAccommodation,
  selectedCells,
  onSelectedCellsChange,
  modifiedRates,
  modifiedMinDuration,
  modifiedArrivalAllowed,
  onRateUpdate,
  onMinDurationUpdate,
  onArrivalAllowedUpdate,
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
      const bookings = bookingsByAccommodation[acc.accommodationId] || [];
      filtered[acc.accommodationId] = filterBookingsByDateRange(bookings, startDate, endDate);
    }
    return filtered;
  }, [accommodations, bookingsByAccommodation, startDate, endDate]);
  
  // Référence au conteneur scrollable
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Hook pour gérer l'édition
  const {
    editingCell,
    editingValue,
    editingMinDurationCell,
    editingMinDurationValue,
    setEditingValue,
    setEditingMinDurationValue,
    handleCellClick,
    handleMinDurationClick,
    handleEditSubmit,
    handleMinDurationSubmit,
    handleEditCancel,
    handleMinDurationCancel
  } = useGridEditing(
    selectedCells,
    ratesByAccommodation,
    minDurationByAccommodation,
    selectedRateTypeId,
    onRateUpdate,
    onMinDurationUpdate
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
        const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;
        const accHasRateTypes = hasRateTypes(acc.accommodationId, rateTypeLinksByAccommodation);
        if (isBooked || !accHasRateTypes) continue; // Ignorer les dates occupées et les hébergements sans types de tarifs
        
        const cellKey = `${acc.accommodationId}|${dateStr}`;
        if (!newSet.has(cellKey)) {
          allSelected = false;
          break;
        }
      }
      
      // Si toutes les cellules non occupées sont sélectionnées, désélectionner toutes
      // Sinon, sélectionner toutes les cellules non occupées
      for (const acc of accommodations) {
        const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;
        const accHasRateTypes = hasRateTypes(acc.accommodationId, rateTypeLinksByAccommodation);
        if (isBooked || !accHasRateTypes) continue; // Ne pas sélectionner les dates occupées ni les hébergements sans types de tarifs
        
        const cellKey = `${acc.accommodationId}|${dateStr}`;
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
        } else if (editingMinDurationCell) {
          handleMinDurationCancel();
        } else {
          onSelectedCellsChange(new Set());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingCell, editingMinDurationCell, onSelectedCellsChange, handleEditCancel, handleMinDurationCancel]);

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
            const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;
            const accHasRateTypes = hasRateTypes(acc.accommodationId, rateTypeLinksByAccommodation);
            return !isBooked && accHasRateTypes;
          });
          
          const isSelected = accommodations.length > 0 
            && selectableAccommodations.length > 0 // Au moins une cellule sélectionnable
            && selectableAccommodations.every(acc => {
              const cellKey = `${acc.accommodationId}|${dateStr}`;
              return selectedCells.has(cellKey);
            });
          // Une colonne est en drag si au moins une cellule sélectionnable est en drag
          const isDragging = accommodations.some(acc => {
            const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;
            const accHasRateTypes = hasRateTypes(acc.accommodationId, rateTypeLinksByAccommodation);
            if (isBooked || !accHasRateTypes) return false; // Ignorer les dates occupées et les hébergements sans types de tarifs
            const cellKey = `${acc.accommodationId}|${dateStr}`;
            return draggingCells.has(cellKey);
          });
          
          // Calculer les indicateurs visuels de récapitulatif
          const stockSummary = getStockSummary(dateStr, accommodations, stockByAccommodation);
          const arrivalSummary = getArrivalAllowedSummary(
            dateStr,
            accommodations,
            arrivalAllowedByAccommodation,
            rateTypeLinksByAccommodation,
            stockByAccommodation
          );
          const hasBookingStarting = hasBookingStartingOnDate(
            dateStr,
            accommodations,
            filteredBookingsByAccommodation
          );
          
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
              allAccommodationsHaveNoStock={stockSummary.allAccommodationsHaveNoStock}
              allAccommodationsAllowArrival={arrivalSummary.allAccommodationsAllowArrival}
              allAccommodationsDisallowArrival={arrivalSummary.allAccommodationsDisallowArrival}
              hasBookingStartingOnDate={hasBookingStarting}
            />
          );
        })}

        {/* Lignes suivantes - une ligne par hébergement */}
        {accommodations.map((acc, accIdx) => {
          const stockMap = stockByAccommodation[acc.accommodationId] || {};
          const priceMap = ratesByAccommodation[acc.accommodationId] || {};
          const minDurationMap = minDurationByAccommodation[acc.accommodationId] || {};
          const accHasRateTypes = hasRateTypes(acc.accommodationId, rateTypeLinksByAccommodation);
          // rowIndex dans la grille CSS : header est row 1, première ligne d'hébergement est row 2, etc.
          const gridRow = accIdx + 2; // +2 car row 1 est le header

          return (
            <React.Fragment key={acc.accommodationId}>
              {/* Cellule nom de l'hébergement */}
              <div
                data-acc-id={acc.accommodationId}
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
                  {acc.accommodationName}
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
                const minDuration = selectedRateTypeId !== null
                  ? (minDurationMap[dateStr] && typeof minDurationMap[dateStr] === 'object' && minDurationMap[dateStr] !== null
                      ? (minDurationMap[dateStr] as Record<number, number | null>)[selectedRateTypeId] ?? null
                      : null)
                  : null;
                const arrivalAllowedMap = arrivalAllowedByAccommodation[acc.accommodationId] ?? {};
                const arrivalAllowed = selectedRateTypeId !== null
                  ? (arrivalAllowedMap[dateStr]?.[selectedRateTypeId] ?? true) // Par défaut true
                  : true;
                const cellKey = `${acc.accommodationId}|${dateStr}`;
                const isSelected = selectedCells.has(cellKey);
                const isDragging = draggingCells.has(cellKey);
                const isModified = selectedRateTypeId !== null 
                  ? modifiedRates.has(`${acc.accommodationId}-${dateStr}-${selectedRateTypeId}`)
                  : false;
                const isModifiedMinDuration = modifiedMinDuration.has(`${acc.accommodationId}-${dateStr}`);
                const isModifiedArrivalAllowed = modifiedArrivalAllowed.has(`${acc.accommodationId}-${dateStr}`);
                const isEditing = editingCell?.accId === acc.accommodationId && editingCell?.dateStr === dateStr;
                const isEditingMinDuration = editingMinDurationCell?.accId === acc.accommodationId && editingMinDurationCell?.dateStr === dateStr;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isNonReservable = (nonReservableDaysByAccommodation[acc.accommodationId] ?? new Set<string>()).has(dateStr);
                const isBooked = bookedDatesByAccommodation[acc.accommodationId]?.has(dateStr) ?? false;

                return (
                  <GridDataCell
                    key={`${acc.accommodationId}-${dayIdx}`}
                    accId={acc.accommodationId}
                    dateStr={dateStr}
                    stock={stock}
                    price={price}
                    minDuration={minDuration}
                    isSelected={isSelected}
                    isDragging={isDragging}
                    isModified={isModified}
                    isModifiedMinDuration={isModifiedMinDuration}
                    arrivalAllowed={arrivalAllowed}
                    isModifiedArrivalAllowed={isModifiedArrivalAllowed}
                    onArrivalAllowedChange={onArrivalAllowedUpdate}
                    selectedCellsCount={selectedCells.size}
                    isEditing={isEditing}
                    isEditingMinDuration={isEditingMinDuration}
                    editingValue={editingValue}
                    editingMinDurationValue={editingMinDurationValue}
                    isWeekend={isWeekend}
                    isNonReservable={isNonReservable}
                    isBooked={isBooked}
                    hasRateTypes={accHasRateTypes}
                    selectedRateTypeId={selectedRateTypeId}
                    draggingState={draggingState}
                    justFinishedDragRef={justFinishedDragRef}
                    onCellClick={handleCellClick}
                    onMinDurationClick={handleMinDurationClick}
                    onMouseDown={handleMouseDown}
                    setEditingValue={setEditingValue}
                    setEditingMinDurationValue={setEditingMinDurationValue}
                    onEditSubmit={handleEditSubmit}
                    onEditMinDurationSubmit={handleMinDurationSubmit}
                    onEditCancel={handleEditCancel}
                    onEditMinDurationCancel={handleMinDurationCancel}
                    supplierId={supplierId}
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
