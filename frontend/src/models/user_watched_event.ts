export interface UserWatchedEvent {
  id: number;
  last_known_status: boolean;
  last_checked: string; // ISO date string
  event?: {
    id: number;
    title: string;
    game_id: string;
    start_time: string;
    end_time: string;
  };
}