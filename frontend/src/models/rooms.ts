export interface Room {
  id: number;
  room_name: string;
  floor_level: number | null;
  room_type: string | null;         // 'entrance' | 'space' | 'building_exit' | null
  longitude: number | null;         // Gen Con map coordinate (lng)
  latitude: number | null;          // Gen Con map coordinate (lat)
  real_world_latitude: number | null;   // Geographic WGS-84 latitude
  real_world_longitude: number | null;  // Geographic WGS-84 longitude
  location: number;                 // Location FK id
}