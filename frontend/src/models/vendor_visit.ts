import { Tag } from "./vendors";

export interface VendorVisit {
  id: number;
  user: {
    id: number;
    username: string;
    // Add other user fields here if needed
  };
  vendor: {
    id: number;
    gencon_id: string;
    name: string;
    booth_number?: string;
    websiteUrl?: string;
    mapUrl?: string;
    mapX?: number;
    mapY?: number;
    description?: string;
    tags?: Tag[];
  };
  note: string; // TextField, so required but can be empty string
  note_type: 'purchase' | 'demo'; // must match NOTE_TYPES choices
}