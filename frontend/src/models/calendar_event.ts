import { VendorVisit } from "./vendor_visit";

export interface CalendarEvent {
  id: number;
  user: number; // user ID
  event_type: 'gencon_event' | 'vendor_visit' | 'custom';

  // Nullable foreign keys by ID (only one will be set depending on eventType)
  gencon_event?: number | null;
  vendor_visit?: {
    id: number;
    note: string;
    note_type: 'purchase' | 'demo';
    vendor: {
      id: number;
      name: string;
      booth_number?: string;
      // any other fields
    };
  } | null;
  user_event?: number | null;

  title_override?: string | null;

  start_time: string; // ISO 8601 datetime string, e.g. "2025-07-31T12:00:00Z"
  end_time: string;   // ISO 8601 datetime string

  // Computed/read-only fields returned by the serializer
  title: string;
  effective_start_time?: string; // Could be same as startTime or overridden
  effective_end_time?: string;
}