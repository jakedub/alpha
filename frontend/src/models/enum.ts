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

export const ColorOptions = [
  { value: "#f59e0b", label: "Amber"   },
  { value: "#fb923c", label: "Orange"  },
  { value: "#f87171", label: "Rose"    },
  { value: "#818cf8", label: "Indigo"  },
  { value: "#a78bfa", label: "Violet"  },
  { value: "#34d399", label: "Emerald" },
  { value: "#38bdf8", label: "Sky"     },
] as const;

export type ColorCode = typeof ColorOptions[number]['value'];


export type RelationshipOption = {
  value: string;
  label: string;
};

export const RelationshipOptions: RelationshipOption[] = [
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'partner', label: 'Partner' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'friend', label: 'Friend' },
];