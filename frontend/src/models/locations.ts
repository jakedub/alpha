export interface Room {
  room_name: string;
  floor_level: string;
}

export interface Location {
  id: number;
  name: string;
  address: string | null;
  rooms?: Room[];
}