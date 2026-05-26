import { MobilityAid, StairPreference, UserEventStatus, EventType, AgeRequired, ExperienceRequired, ColorCode} from './enum';
import { UserEvent } from './user_event';
import { RelatedUser } from './related_user';
import { CalendarEvent } from './calendar_event';

export interface User {
  results(arg0: string, results: any): unknown;
  id: number;
  username: string;
  email: string;
  mobility_aid: MobilityAid;
  gencon_id: number;
  stair_preference: StairPreference;
  user_events?: UserEvent[];
  related_users?: RelatedUser[];
  color_code: ColorCode;
  calendar_events?: CalendarEvent[];
}