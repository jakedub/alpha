// frontend/src/components/RoomList.tsx
import { useEffect, useState } from 'react';
import api from '../../api/api';
import type { Room } from '../../models/rooms';

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Room[]>('/rooms/')
      .then(res => setRooms(res.data))
      .catch(() => setError('Failed to load rooms.'));
  }, []);

  return (
    <div>
      <h2>Rooms</h2>
      {error && <p>{error}</p>}
      <ul>
        {rooms.map(room => (
          <li key={room.id}>{room.room_name} (Floor {room.floor_level})</li>
        ))}
      </ul>
    </div>
  );
};

export default RoomList;