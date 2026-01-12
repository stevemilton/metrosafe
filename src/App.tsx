import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './components/SearchBar';
import { CrimeMap } from './components/CrimeMap';
import { StatsDashboard } from './components/StatsDashboard';
import { SafetyBriefing } from './components/SafetyBriefing';
import { Settings } from './components/Settings';
import { useCrimeData } from './hooks/useCrimeData';
import { useSafetyBriefing } from './hooks/useSafetyBriefing';
import { LONDON_BOUNDS } from './types';
import type { NominatimResult } from './types';
import { saveSearch } from './db';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function MetroSafeApp() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    name: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { crimes, summary, isLoading: isCrimeLoading, progress } = useCrimeData(
    selectedLocation?.lat ?? null,
    selectedLocation?.lon ?? null
  );

  const { data: briefing, isLoading: isBriefingLoading, refetch: refetchBriefing } = useSafetyBriefing(
    selectedLocation?.name ?? null,
    summary
  );

  const handleSearch = async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name = result.display_name.split(',')[0];

    setSelectedLocation({ lat, lon, name });

    setTimeout(async () => {
      await saveSearch({
        query: name,
        location: { lat, lon, displayName: result.display_name },
        timestamp: Date.now(),
        crimeCount: 0,
      });
    }, 1000);
  };

  const defaultCenter: [number, number] = [
    (LONDON_BOUNDS.minLat + LONDON_BOUNDS.maxLat) / 2,
    (LONDON_BOUNDS.minLon + LONDON_BOUNDS.maxLon) / 2,
  ];

  const mapCenter: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lon]
    : defaultCenter;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold">MetroSafe</h1>
              <p className="text-xs text-[var(--color-text-muted)]">London Crime Insights</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Section */}
          <section className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              Explore London Safety Data
            </h2>
            <p className="text-[var(--color-text-muted)] mb-8 max-w-xl mx-auto">
              Get real-time crime statistics and AI-powered safety insights for any London location
            </p>
            <div className="flex justify-center">
              <SearchBar onSearch={handleSearch} isLoading={isCrimeLoading} />
            </div>
          </section>

          {/* Results Grid */}
          {(selectedLocation || crimes.length > 0) && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Map */}
              <div className="lg:col-span-2 h-[500px]">
                <CrimeMap
                  center={mapCenter}
                  crimes={crimes}
                  isLoading={isCrimeLoading}
                  progress={progress}
                />
              </div>

              {/* Stats Sidebar */}
              <div className="lg:col-span-1 overflow-auto max-h-[500px]">
                <StatsDashboard summary={summary} isLoading={isCrimeLoading} />
              </div>

              {/* AI Briefing - Full Width */}
              <div className="lg:col-span-3">
                <SafetyBriefing
                  briefing={briefing ?? null}
                  isLoading={isBriefingLoading}
                  onRegenerate={() => refetchBriefing()}
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedLocation && crimes.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🗺️</div>
              <h3 className="text-2xl font-semibold mb-3">Welcome to MetroSafe</h3>
              <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
                Search for any London location to view crime statistics, interactive maps, and AI-generated safety briefings.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Camden Town', 'Shoreditch', 'Westminster', 'Brixton', 'Greenwich'].map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      if (input) {
                        input.value = area;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.focus();
                      }
                    }}
                    className="px-4 py-2 rounded-full glass hover:bg-[var(--color-surface-elevated)] transition-colors text-sm"
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto text-center text-sm text-[var(--color-text-muted)]">
          <p>
            Data sourced from{' '}
            <a href="https://data.police.uk" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
              data.police.uk
            </a>
            {' '}• AI analysis powered by{' '}
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
              Gemini
            </a>
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MetroSafeApp />
    </QueryClientProvider>
  );
}
