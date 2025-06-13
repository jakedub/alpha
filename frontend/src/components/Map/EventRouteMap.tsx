import { Box, InputLabel, MenuItem, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import api from '../../api/api';
import Select, { SelectChangeEvent } from '@mui/material/Select';

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface UserEvent {
  eventId: number;
  locationName: string;
  startTime: string;
  coords: google.maps.LatLngLiteral;
  event_title: string;
}

const center = { lat: 39.7649331, lng: -86.1647626 };

export default function EventRouteMap() {
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([3]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<UserEvent | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [boundsFit, setBoundsFit] = useState(false);
  const [lastRouteSignature, setLastRouteSignature] = useState<string | null>(null);
  const [mapLocations, setMapLocations] = useState<{ id: number; name: string; coords: google.maps.LatLngLiteral }[]>([]);

  useEffect(() => {
    api.get('/locations/').then(response => {
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      const mapped = data
        .filter((loc: any) => typeof loc.base_latitude === 'number' && typeof loc.base_longitude === 'number')
        .map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          coords: { lat: loc.base_latitude, lng: loc.base_longitude }
        }));
      setMapLocations(mapped);
    });
  }, []);

  useEffect(() => {
    api.get('/user_events/').then(response => {
      const events = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      interface ApiUserEvent {
        id: number;
        event_location: string;
        event_latitude: number;
        event_longitude: number;
        event_start_time: string;
        event_title: string;
      }

      const mapped: UserEvent[] = (events as ApiUserEvent[])
        .filter(e =>
          typeof e.event_latitude === 'number' &&
          typeof e.event_longitude === 'number'
        )
        .map(e => ({
          eventId: e.id,
          locationName: e.event_location,
          startTime: e.event_start_time,
          event_title: e.event_title,
          coords: { lat: e.event_latitude, lng: e.event_longitude },
        }))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      setUserEvents(mapped);
    });
  }, []);

  const weekdays = [
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 0 },
  ];

  const filteredUserEvents = selectedDays.length === 0
    ? userEvents
    : userEvents.filter(e => selectedDays.includes(new Date(e.startTime).getDay()));

  // Group userEvents by unique location coordinates
  const uniqueLocationsMap = new Map<string, UserEvent>();
  filteredUserEvents.forEach(event => {
    const key = `${event.coords.lat.toFixed(6)},${event.coords.lng.toFixed(6)}`;
    if (!uniqueLocationsMap.has(key)) {
      uniqueLocationsMap.set(key, event);
    }
  });
  const uniqueLocations = Array.from(uniqueLocationsMap.values());

  const firstLocationKey = uniqueLocations.length > 0
    ? `${uniqueLocations[0].coords.lat.toFixed(6)},${uniqueLocations[0].coords.lng.toFixed(6)}`
    : null;

  useEffect(() => {
    if (
      uniqueLocations.length > 1 &&
      (uniqueLocations[0].coords.lat !== uniqueLocations[uniqueLocations.length - 1].coords.lat ||
       uniqueLocations[0].coords.lng !== uniqueLocations[uniqueLocations.length - 1].coords.lng)
    ) {
      const origin = uniqueLocations[0].coords;
      const destination = uniqueLocations[uniqueLocations.length - 1].coords;
      const waypoints = uniqueLocations.slice(1, -1).map(e => ({
        location: e.coords,
        stopover: true,
      }));

      const currentSignature = JSON.stringify({ origin, destination, waypoints });

      if (currentSignature === lastRouteSignature) {
        return; // Skip if same as last
      }

      console.log('Requesting directions with:', { origin, destination, waypoints });

      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            setLastRouteSignature(currentSignature);
          } else {
            console.error('Failed to fetch directions:', status, result);
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
      setLastRouteSignature(null);
    }
  }, [uniqueLocations, lastRouteSignature]);

  useEffect(() => {
    if (map && uniqueLocations.length > 0 && !userInteracted && !boundsFit) {
      const bounds = new google.maps.LatLngBounds();
      uniqueLocations.forEach(e => bounds.extend(e.coords));
      map.fitBounds(bounds);
      setBoundsFit(true);
    }
  }, [map, uniqueLocations, userInteracted, boundsFit]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <Box sx={{ width: '100%', height: '800px', display: 'flex' }}>
      <Box sx={{ flex: 1 }}>
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            onLoad={(mapInstance) => {
              setMap(mapInstance);
              setUserInteracted(false);
              mapInstance.addListener('zoom_changed', () => {
                setUserInteracted(true);
              });
              mapInstance.addListener('dragstart', () => {
                setUserInteracted(true);
              });
            }}
          >
            {uniqueLocations.map(e => {
              const key = `${e.coords.lat.toFixed(6)},${e.coords.lng.toFixed(6)}`;
              const isFirst = key === firstLocationKey;
              return (
                <Marker
                  key={e.eventId}
                  position={e.coords}
                  title={e.locationName}
                  onClick={() => setSelectedEvent(e)}
                  icon={
                    isFirst
                      ? {
                          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                          labelOrigin: new google.maps.Point(15, 10)
                        }
                      : undefined
                  }
                  label={isFirst ? 'A' : undefined}
                />
              );
            })}
            {mapLocations.map(loc => (
              <Marker
                key={`loc-${loc.id}`}
                position={loc.coords}
                title={loc.name}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
            ))}
            {directions && <DirectionsRenderer directions={directions} />}
            {selectedEvent && (
              <InfoWindow
                position={selectedEvent.coords}
                onCloseClick={() => setSelectedEvent(null)}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{selectedEvent.locationName}</Typography>
                  <Typography variant="body2">{new Date(selectedEvent.startTime).toLocaleString()}</Typography>
                  <Typography variant="body2">Event ID: {selectedEvent.eventId}</Typography>
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </Box>
      <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', padding: 2 }}>
          <Typography variant="h6" gutterBottom>Events</Typography>
          {filteredUserEvents.map(event => (
            <Box key={event.eventId} sx={{ marginBottom: 1 }}>
              <strong>{event.event_title}</strong><br />
              <em>{event.locationName}</em><br />
              {new Date(event.startTime).toLocaleString()}
            </Box>
          ))}
          <InputLabel id="day-select-label">Select Day</InputLabel>
          <Select
            labelId="day-select-label"
            value={selectedDays.length > 0 ? selectedDays[0].toString() : ''}
            onChange={(e: SelectChangeEvent<string>) => {
              const value = parseInt(e.target.value, 10);
              setSelectedDays([value]);
              setSelectedEvent(null);
              setBoundsFit(false);
            }}
            displayEmpty
            fullWidth
          >
            {weekdays.map(day => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', padding: 2, borderTop: '1px solid #ddd' }}>
          <Typography variant="h6" gutterBottom>Route Directions</Typography>
          <Box sx={{ textAlign: 'left' }}>
            {directions?.routes[0]?.legs.map((leg, legIdx) => {
              const legStart = String.fromCharCode(65 + legIdx); // A, B, C
              const legEnd = String.fromCharCode(66 + legIdx);
              return (
                <Box key={legIdx} sx={{ marginBottom: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {legStart} to {legEnd}
                  </Typography>
                  {leg.steps.map((step, idx) => (
                    <Box key={`${legIdx}-${idx}`} sx={{ marginBottom: 1 }}>
                      <span dangerouslySetInnerHTML={{ __html: step.instructions }} />
                      <Typography variant="caption" display="block">
                        {step.distance?.text}, {step.duration?.text}
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="body2" fontWeight="bold">
                    Segment Distance: {leg.distance?.text} | Segment Time: {leg.duration?.text}
                  </Typography>
                </Box>
              );
            })}
            {directions?.routes[0]?.legs && directions.routes[0].legs.length > 0 && (() => {
              const totalDistance = directions.routes[0].legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
              const totalDuration = directions.routes[0].legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
              return (
                <Box sx={{ marginTop: 2, borderTop: '1px solid #ccc', paddingTop: 1 }}>
                  <Typography variant="subtitle2"><strong>Total Distance:</strong> {(totalDistance / 1000).toFixed(2)} km</Typography>
                  <Typography variant="subtitle2"><strong>Total Time:</strong> {Math.round(totalDuration / 60)} mins</Typography>
                </Box>
              );
            })()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
