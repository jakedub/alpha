export interface VendorVisit {
  id: number;
  user: {
    id: number;
    username: string;
    // Add other user fields here if needed
  };
  vendor: {
    id: number;
    name: string;
    // Add other vendor fields here if needed
  };
  note: string; // TextField, so required but can be empty string
  note_type: 'purchase' | 'demo'; // must match NOTE_TYPES choices
}