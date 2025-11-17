import React from 'react';
import { IlamyCalendar, type CalendarEvent } from '../../ilamy-calendar/src/index.ts';
import type { IlamyCalendarPropEvent } from '../../ilamy-calendar/src/features/calendar/types/index.ts';
import dayjs from '../../ilamy-calendar/src/lib/configs/dayjs-config.ts';

// Types pour les données Open Pro
interface DayData {
  date: string; // YYYY-MM-DD
  stock: number; // 0 ou 1
  price?: number; // tarif 2 personnes
  hasPromo?: boolean;
  rateTypes?: string[];
  isReserved?: boolean;
}

interface AccommodationData {
  idHebergement: number;
  nomHebergement: string;
  days: Record<string, DayData>; // key = date YYYY-MM-DD
}

interface OpenProCalendarViewProps {
  accommodation: AccommodationData;
  startDate: Date;
  monthsCount?: number;
  showRateTypes?: boolean;
}

export function OpenProCalendarView({
  accommodation,
  startDate,
  monthsCount = 1,
  showRateTypes = true,
}: OpenProCalendarViewProps): JSX.Element {
  // Convertir les données en événements pour chaque jour
  const events: IlamyCalendarPropEvent[] = React.useMemo(() => {
    const allEvents: IlamyCalendarPropEvent[] = [];
    
    Object.entries(accommodation.days).forEach(([dateStr, dayData]) => {
      const date = dayjs(dateStr);
      if (!date.isValid()) return;

      // Créer un événement pour chaque jour avec les données de stock/tarif
      const event: IlamyCalendarPropEvent = {
        id: `${accommodation.idHebergement}-${dateStr}`,
        title: dayData.price != null ? `${Math.round(dayData.price)}€` : '',
        start: date.startOf('day').toDate(),
        end: date.endOf('day').toDate(),
        allDay: true,
        // Stocker les données supplémentaires dans data
        data: {
          stock: dayData.stock,
          price: dayData.price,
          hasPromo: dayData.hasPromo ?? false,
          rateTypes: dayData.rateTypes ?? [],
          isReserved: dayData.isReserved ?? false,
          dateStr,
        },
        // Couleurs selon disponibilité
        backgroundColor: dayData.stock === 0 
          ? 'rgba(220, 38, 38, 0.15)' // rouge translucide si indisponible
          : 'rgba(34, 197, 94, 0.15)', // vert translucide si disponible
        color: dayData.stock === 0 ? '#dc2626' : '#22c55e',
      };
      
      allEvents.push(event);
    });

    return allEvents;
  }, [accommodation]);

  // Fonction de rendu personnalisée pour les badges journaliers
  const renderEvent = React.useCallback((event: CalendarEvent) => {
    const dayData = event.data as (DayData & { dateStr: string }) | undefined;
    if (!dayData) return null;

    const isUnavailable = dayData.stock === 0;
    const bg = isUnavailable 
      ? 'rgba(220, 38, 38, 0.15)' 
      : 'rgba(34, 197, 94, 0.15)';
    const border = isUnavailable 
      ? '1px solid rgba(220,38,38,0.35)' 
      : '1px solid rgba(34,197,94,0.35)';
    
    const priceBorderColor = isUnavailable
      ? 'rgba(220,38,38,0.8)' // rouge
      : dayData.hasPromo
      ? 'rgba(234,179,8,0.9)' // jaune si promotion
      : 'rgba(34,197,94,0.9)'; // vert

    const dayRateTypes = dayData.rateTypes ?? [];
    const hasVisibleRateTypes = showRateTypes && dayRateTypes.length > 0;
    const minCellHeight = hasVisibleRateTypes ? 88 : 56;

    const date = dayjs(dayData.dateStr);
    const dayNumber = date.date();

    return (
      <div
        title={`${dayData.dateStr} — ${isUnavailable ? 'Indisponible' : 'Disponible'}`}
        style={{
          minHeight: minCellHeight,
          width: 88,
          borderRadius: 6,
          background: bg,
          border,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          padding: 8,
          paddingTop: 18,
          fontSize: 12,
          color: '#111827',
          position: 'relative',
          boxSizing: 'border-box',
          userSelect: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Date en haut-gauche */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 6,
            fontSize: 11,
            color: '#6b7280',
            lineHeight: 1,
          }}
        >
          {dayNumber}
        </div>

        {/* Prix au centre */}
        {dayData.price != null && (
          <div
            style={{
              lineHeight: 1.2,
              fontSize: 12,
              color: '#111827',
              padding: '4px 6px',
              borderRadius: 6,
              border: `2px solid ${priceBorderColor}`,
              background: 'rgba(255,255,255,0.85)',
              width: '100%',
              boxSizing: 'border-box',
              textAlign: 'center',
              minHeight: 24,
            }}
          >
            {Math.round(dayData.price)}€
          </div>
        )}

        {/* Types de tarifs empilés */}
        {hasVisibleRateTypes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, overflow: 'hidden' }}>
            {dayRateTypes.map((rt, k) => (
              <div
                key={k}
                style={{
                  fontSize: 10,
                  color: '#374151',
                  background: 'rgba(255,255,255,0.9)',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '2px 6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minHeight: 20,
                }}
                title={rt}
              >
                {rt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [showRateTypes]);

  // Calculer la date initiale
  const initialDate = React.useMemo(() => {
    return dayjs(startDate).startOf('month');
  }, [startDate]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <IlamyCalendar
        events={events}
        initialView="month"
        initialDate={initialDate.toDate()}
        firstDayOfWeek="monday"
        locale="fr"
        renderEvent={renderEvent}
        disableDragAndDrop={true}
        disableEventClick={true}
        disableCellClick={true}
        dayMaxEvents={0} // Pas de limite car on affiche un badge par jour
      />
    </div>
  );
}

