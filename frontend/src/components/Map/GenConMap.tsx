import { useState } from 'react';
import { MapContainer, ImageOverlay } from 'react-leaflet';
import { Select, FormControl, InputLabel, MenuItem, Box } from '@mui/material';
import L from 'leaflet';

const FLOOR_ZOOMS: Record<string, number[]> = {
  'floor-0': [3, 4, 5, 6, 7],
  'floor-1': [3, 4, 5, 6, 7],
  'floor-2': [3, 4, 5, 6, 7],
  'floor-3': [3, 4, 5, 6, 7],
  'floor-4': [3, 4, 5, 6, 7],
};

const FLOORS = [
  { key: 'floor-0', label: 'Basement' },
  { key: 'floor-1', label: 'First Floor' },
  { key: 'floor-2', label: 'Second Floor' },
  { key: 'floor-3', label: 'Third Floor' },
  { key: 'floor-4', label: 'Fourth Floor' },
];
const imageWidth = 2048; // replace with your actual image width in pixels
const imageHeight = 2048;

export default function GenConMap() {
const [currentFloor, setCurrentFloor] = useState('floor-0');
const [zoom, setZoom] = useState(3);

const availableZooms = FLOOR_ZOOMS[currentFloor];

const STATIC_URL =
  import.meta.env.DEV
    ? 'http://localhost:8000/static'
    : '/static';

  return (
    <>
      <FormControl sx={{ position: 'absolute', top: '10px', left: '10px', zIndex: 9999, minWidth: 120 }}>
        <InputLabel id="floor-select-label">Floor</InputLabel>
        <Select
          labelId="floor-select-label"
          value={currentFloor}
          label="Floor"
          onChange={(e) => setCurrentFloor(e.target.value)}
        >
          {FLOORS.map((floor) => (
            <MenuItem key={floor.key} value={floor.key}>
              {floor.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
<FormControl sx={{ position: 'absolute', top: '70px', left: '10px', zIndex: 9999, minWidth: 120 }}>
  <InputLabel id="zoom-select-label">Zoom</InputLabel>
  <Select
    labelId="zoom-select-label"
    value={zoom}
    label="Zoom"
    onChange={(e) => setZoom(Number(e.target.value))}
  >
    {availableZooms.map((z) => (
      <MenuItem key={z} value={z}>
        Zoom {z}
      </MenuItem>
    ))}
  </Select>
</FormControl>
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '90vh',
      width: '90vw',
    }}
  >
    <MapContainer
      crs={L.CRS.Simple}
      bounds={[
        [0, 0],
        [imageHeight, imageWidth],
      ]}
      zoom={0}
      scrollWheelZoom={true}
      style={{
        width: '70vw',
        height: '70vh',
        border: '1px solid #ccc',
      }}
    >
      <ImageOverlay
        url={`${STATIC_URL}/stitched/${currentFloor}_z${zoom}.png`}
        bounds={[
          [0, 0],
          [imageHeight, imageWidth],
        ]}
        zIndex={0}
        opacity={1}
      />
    </MapContainer>
  </Box>
    </>
  );
} 
