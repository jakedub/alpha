export interface CalendarEvent {
  id: number;
  user: number; // user ID
  eventType: 'gencon_event' | 'vendor_visit' | 'custom';

  // Nullable foreign keys by ID (only one will be set depending on eventType)
  genconEvent?: number | null;
  vendorVisit?: number | null;
  userEvent?: number | null;

  titleOverride?: string | null;

  startTime: string; // ISO 8601 datetime string, e.g. "2025-07-31T12:00:00Z"
  endTime: string;   // ISO 8601 datetime string

  // Computed/read-only fields returned by the serializer
  title: string;
  effectiveStartTime?: string; // Could be same as startTime or overridden
  effectiveEndTime?: string;
}