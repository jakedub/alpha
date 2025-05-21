export interface Location {
  name: string;
}

export interface Room {
  room_name: string;
  floor_level: string;
}
export type EventType =
  | "RPG"
  | "WKS"
  | "MHE"
  | "LRP"
  | "CGM"
  | "BGM"
  | "ENT"
  | "TRD"
  | "SEM"
  | "TCG"
  | "SPA"
  | "HMN"
  | "ZED"
  | "NMN"
  | "KID"
  | "EGM"
  | "FLM"
  | "TDA"
  | "OTH";

export type AgeRequired =
  | "Teen"
  | "Mature"
  | "Everyone"
  | "21+"
  | "Kids";

export type ExperienceRequired = "None" | "Some" | "Expert";

export interface Event {
  id: number;
  game_id?: string;
  gaming_group: string;
  title?: string;
  short_description?: string;
  long_description?: string;
  event_type: EventType;
  game_system?: string;
  rules_edition?: string;
  minimum_players?: number;
  maximum_players?: number;
  minimum_age: AgeRequired;
  experience_required: ExperienceRequired;
  materials_required: boolean;
  materials_required_details?: string;
  start_time: string; // ISO 8601 string
  duration_hours?: number;
  end_time: string;
  gm_names?: string;
  website?: string;
  email?: string;
  tournament: boolean;
  round_number?: number;
  total_rounds?: number;
  minimum_play_time?: number;
  attendee_registration?: string;
  cost: string; // Decimal as string to preserve precision
  location: {
    id: number;
    name: string;
    [key: string]: any; // Extend as needed
  };
  room?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  table_number?: string;
  special_category?: string;
  tickets_available?: number;
  last_modified: string; // ISO 8601 date string
}