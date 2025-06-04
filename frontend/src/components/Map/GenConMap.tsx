import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { MapContainer, ImageOverlay } from 'react-leaflet';
import L, { TileLayer } from 'leaflet';

type TileMetadata = {
  [floor: string]: {
    [zoomKey: string]: {
      zoom: number;
      tiles: [number, number][];
    };
  };
};

export default function GenConMap() {
  const [currentFloor, setCurrentFloor] = useState('floor-0');
  const [metadata, setMetadata] = useState<TileMetadata | null>(null);

useEffect(() => {
  fetch(`/static/tile_metadata.json?ts=${Date.now()}`)
    .then(res => res.json())
    .then(data => {
      console.log("📦 Loaded metadata:", data);
      console.log("🧪 Current floor entry:", data[currentFloor]);
      setMetadata(data);
    })
    .catch(err => {
      console.error("❌ Failed to load tile metadata:", err);
    });
}, []);
  if (!metadata) return <div>Loading map metadata...</div>;
  if (!metadata[currentFloor]) {
    console.warn(`⚠️ Floor key "${currentFloor}" not found in metadata.`);
    return <div>Floor data not found</div>;
  }

  const zoomEntries = Object.entries(metadata[currentFloor]);
  const { zoom, tiles } = zoomEntries.length > 0 ? zoomEntries[0][1] : { zoom: 0, tiles: [] };

  console.log("🚨 Using tiles:", tiles);

  const xValues = tiles.map(([x]) => x);
  const yValues = tiles.map(([, y]) => y);
  const minX = Math.min(...xValues);
  const minY = Math.min(...yValues);
  const maxX = Math.max(...xValues);
  const maxY = Math.max(...yValues);
  const tileSize = 256;

  const bounds: LatLngBoundsExpression = [
    [minY * tileSize, minX * tileSize],
    [(maxY + 1) * tileSize, (maxX + 1) * tileSize],
  ];

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={bounds}
      style={{ width: '100vw', height: '100vh' }}
      zoom={0}
      scrollWheelZoom={true}
    >
      {tiles.map(([x, y]) => {
        const imageUrl = `/proxy/tiles/${currentFloor}/${zoom}/${x}/${y}.png`;
        const tileBounds: LatLngBoundsExpression = [
          [y * tileSize, x * tileSize],
          [(y + 1) * tileSize, (x + 1) * tileSize],
        ];
        return (
          <ImageOverlay
            key={`${x}-${y}`}
            url={imageUrl}
            bounds={tileBounds}
            zIndex={1}
          />
        );
      })}


    </MapContainer>
  );
}