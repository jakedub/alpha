import { RelationshipOption, ColorCode} from './enum';
import { UserEvent } from './user_event';


export interface RelatedUser {
  results(arg0: string, results: any): unknown;
  id: number;
  name: string;
  relationship: RelationshipOption;
  user_events?: UserEvent[];
  color_code: ColorCode;
}

