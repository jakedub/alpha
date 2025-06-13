
export interface UserWatchedEvent {
  id: number;
  gencon_event_id: string;
  last_known_status: boolean;
  last_checked: string; // ISO date string
}