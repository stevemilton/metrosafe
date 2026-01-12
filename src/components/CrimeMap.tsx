import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CRIME_COLORS, LONDON_BOUNDS } from '../types';
import type { CrimeRecord } from '../types';
import { formatCategoryName } from '../utils/aggregation';

interface CrimeMapProps {
  center: [number, number];
  crimes: CrimeRecord[];
  isLoading?: boolean;
  progress?: { completed: number; total: number };
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1]) {
      map.flyTo(center, 14, { duration: 1.5 });
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

function getCrimeColor(category: string): string {
  return CRIME_COLORS[category] || CRIME_COLORS['other-crime'];
}

export function CrimeMap({ center, crimes, isLoading, progress }: CrimeMapProps) {
  const bounds: [[number, number], [number, number]] = [
    [LONDON_BOUNDS.minLat, LONDON_BOUNDS.minLon],
    [LONDON_BOUNDS.maxLat, LONDON_BOUNDS.maxLon],
  ];

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center glass">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Fetching crime data...</p>
            {progress && progress.total > 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {progress.completed} of {progress.total} requests
              </p>
            )}
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={14}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ background: 'var(--color-surface)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />

        {crimes.slice(0, 2000).map((crime, index) => {
          const lat = parseFloat(crime.location.latitude);
          const lon = parseFloat(crime.location.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <CircleMarker
              key={`${crime.persistent_id}-${index}`}
              center={[lat, lon]}
              radius={6}
              fillColor={getCrimeColor(crime.category)}
              fillOpacity={0.7}
              stroke={true}
              color="#fff"
              weight={1}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="block text-base mb-1">
                    {formatCategoryName(crime.category)}
                  </strong>
                  <p className="text-gray-600">{crime.location.street.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{crime.month}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {crimes.length > 2000 && (
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg glass text-sm">
          Showing 2,000 of {crimes.length.toLocaleString()} incidents
        </div>
      )}
    </div>
  );
}
