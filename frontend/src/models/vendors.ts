// Define Tag type or import it from the appropriate module
export interface Tag {
  id: string;
  name: string;
}

export interface Vendor {
  id: number;           // primary key in Django
  gencon_id: string;      // gencon_id in Django
  name: string;
  booth_number?: string;  // optional, comma-separated booth numbers
  websiteUrl?: string;
  mapUrl?: string;
  mapX?: number;
  mapY?: number;
  description?: string;
  tags?: Tag[];          // many-to-many relation with tags
}

// Helper function to get array of booth numbers from boothNumber string
export function getBoothList(vendor: Vendor): string[] {
  if (!vendor.booth_number) return [];
  return vendor.booth_number.split(',').map((b) => b.trim());
}