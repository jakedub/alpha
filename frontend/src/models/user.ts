export type MobilityAid = 'none' | 'wheelchair' | 'cane' | 'walker' | 'other';

export type StairPreference = 'stairs' | 'elevator' | 'no_preference';

export interface User {
  id: number;
  username: string;
  email: string;
  mobility_aid: MobilityAid;
  stair_preference: StairPreference;
}
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