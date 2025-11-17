import React from 'react';
import { IlamyCalendar, type CalendarEvent } from '../../ilamy-calendar/src/index.ts';

// Exemple d'événements comme dans la documentation ilamy
const events: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: new Date('2024-01-15T10:00:00'),
    end: new Date('2024-01-15T11:00:00'),
    description: 'Weekly team sync',
    backgroundColor: '#3b82f6',
    color: 'black'
  },
  {
    id: '2',
    title: 'Project Deadline',
    start: new Date('2024-01-20T23:59:59'),
    end: new Date('2024-01-20T23:59:59'),
    allDay: true,
    backgroundColor: '#ef4444',
    color: 'black'
  }
];

export function TestIlamyCalendar(): JSX.Element {
  return (
    <div style={{ padding: '24px', width: '100%', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
        Test Ilamy Calendar
      </h1>
      <div style={{ height: '800px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fff' }}>
        <IlamyCalendar events={events} />
      </div>
    </div>
  );
}

export default TestIlamyCalendar;

