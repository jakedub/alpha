import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { User, MobilityAidOptions, StairPreferenceOptions } from '../../models/user';

const UserPreferences = () => {
  const [mobilityAid, setMobilityAid] = useState('');
  const [stairPreference, setStairPreference] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<User[]>('/users/')
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to user.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!users.length) return;

    try {
      const response = await api.patch(`/users/${users[0].id}/`, {
        mobility_aid: mobilityAid,
        stair_preference: stairPreference,
      });
      if (response.status === 200) {
        setMessage('Preferences updated successfully!');
      } else {
        setMessage('Error updating preferences.');
      }
    } catch (err) {
      setMessage('Error updating preferences.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Update Your Preferences</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Mobility Aid:
          <select value={mobilityAid} onChange={(e) => setMobilityAid(e.target.value)}>
            <option value="none">No Issues</option>
            <option value="wheelchair">Wheelchair</option>
            <option value="cane">Cane</option>
            <option value="walker">Walker</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Stair Preference:
          <select value={stairPreference} onChange={(e) => setStairPreference(e.target.value)}>
            <option value="stairs">Prefer Stairs</option>
            <option value="elevator">Prefer Elevator</option>
            <option value="no_preference">No Preference</option>
          </select>
        </label>

        <button type="submit">Save Preferences</button>
      </form>
    </div>
  );
};

export default UserPreferences;