/**
 * Composant CompactGrid - Grille de calendrier compacte
 * 
 * Ce composant affiche une grille de calendrier permettant de visualiser et éditer
 * les tarifs et durées minimales pour plusieurs hébergements sur une plage de dates.
 * Il supporte la sélection de dates par clic et drag, l'édition inline des prix
 * et durées minimales, et la visualisation du stock disponible.
 */

import React from 'react';
import type { Accommodation } from '../types';
import { formatDate, getWeeksInRange } from '../utils/dateUtils';

export interface CompactGridProps {
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
}

export function CompactGrid({
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
}: CompactGridProps) {
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

