// src/models/calendar.ts
export interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category?: string;
  color?: string;
}