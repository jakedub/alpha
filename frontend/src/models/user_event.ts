import { UserEventStatus } from "./enum";

export interface UserEvent {
  status: UserEventStatus;
  event_id: number;
  event_title: string;
  event_game_id: string;
  event_short_description: string;
  event_start_time: string;
  event_end_time: string;
}