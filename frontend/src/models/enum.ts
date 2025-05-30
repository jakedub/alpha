// Enums.ts
export type MobilityAid = 'none' | 'wheelchair' | 'cane' | 'walker' | 'other';
export type StairPreference = 'stairs' | 'elevator' | 'no_preference';
export type UserEventStatus = 'wishlist' | 'unavailable' | 'purchased';

export type EventType =
  | 'RPG' | 'WKS' | 'MHE' | 'LRP' | 'CGM' | 'BGM' | 'ENT' | 'TRD'
  | 'SEM' | 'TCG' | 'SPA' | 'HMN' | 'ZED' | 'NMN' | 'KID' | 'EGM'
  | 'FLM' | 'TDA' | 'OTH';

export type AgeRequired = 'Teen' | 'Mature' | 'Everyone' | '21+' | 'Kids';
export type ExperienceRequired = 'None' | 'Some' | 'Expert';

export const MobilityAidOptions = [
  { value: 'none', label: 'No Issues' },
  { value: 'wheelchair', label: 'Wheelchair' },
  { value: 'cane', label: 'Cane' },
  { value: 'walker', label: 'Walker' },
  { value: 'other', label: 'Other' },
];

export const StairPreferenceOptions = [
  { value: 'stairs', label: 'Prefer Stairs' },
  { value: 'elevator', label: 'Prefer Elevator' },
  { value: 'no_preference', label: 'No Preference' },
];