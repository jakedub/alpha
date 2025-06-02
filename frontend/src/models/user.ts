import { MobilityAid, StairPreference, UserEventStatus, EventType, AgeRequired, ExperienceRequired, ColorCode} from './enum';
import { UserEvent } from './user_event';
import { Location } from './locations';
import { Room } from './rooms';
import { Event } from './events';

export interface User {
  results(arg0: string, results: any): unknown;
  id: number;
  username: string;
  email: string;
  mobility_aid: MobilityAid;
  stair_preference: StairPreference;
  user_events?: UserEvent[];
  color_code: ColorCode;
}