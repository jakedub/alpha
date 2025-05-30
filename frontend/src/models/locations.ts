import { Room } from "./rooms";

export interface Location {
  id: number;
  name: string;
  address: string | null;
  rooms?: Room[];
}