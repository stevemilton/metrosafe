import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CRIME_COLORS, LONDON_BOUNDS } from '../types';
import type { CrimeRecord } from '../types';
import { formatCategoryName } from '../utils/aggregation';

// Legend component
function MapLegend({ crimes }: { crimes: CrimeRecord[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique categories from current crimes
  const categories = [...new Set(crimes.map(c => c.category))].slice(0, 6);

  if (crimes.length === 0) return null;

  return (
    <div className="map-legend">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] w-full"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Legend
        <svg className={`w-3 h-3 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-[var(--color-border-light)] space-y-1">
          {categories.map((category) => (
            <div key={category} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: CRIME_COLORS[category] || CRIME_COLORS['other-crime'] }}
              />
              <span className="truncate">{formatCategoryName(category)}</span>
            </div>
          ))}
          {crimes.length > 0 && (
            <div className="text-[10px] text-[var(--color-text-light)] mt-2 pt-1 border-t border-[var(--color-border-light)]">
              {crimes.length.toLocaleString()} incidents
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center glass">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--color-text)]">Fetching crime data...</p>
            {progress && progress.total > 0 && (
              <div className="mt-2">
                <div className="progress-bar w-32 mx-auto">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {progress.completed} of {progress.total}
                </p>
              </div>
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
        style={{ background: 'var(--color-surface-secondary)' }}
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
              radius={5}
              fillColor={getCrimeColor(crime.category)}
              fillOpacity={0.6}
              stroke={true}
              color="#fff"
              weight={1}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="block text-sm mb-1 text-[var(--color-text)]">
                    {formatCategoryName(crime.category)}
                  </strong>
                  <p className="text-[var(--color-text-secondary)] text-xs">{crime.location.street.name}</p>
                  <p className="text-[var(--color-text-muted)] text-xs mt-1">{crime.month}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <MapLegend crimes={crimes} />

      {/* Overflow indicator */}
      {crimes.length > 2000 && (
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg glass text-xs font-medium">
          Showing 2,000 of {crimes.length.toLocaleString()}
        </div>
      )}
    </div>
  );
}
