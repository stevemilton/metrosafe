import { useState, useCallback, useRef, lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar, type SearchBarHandle } from './components/SearchBar';
import { Settings } from './components/Settings';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { ErrorBoundary, MapErrorFallback, StatsErrorFallback } from './components/ErrorBoundary';
import { useCrimeData } from './hooks/useCrimeData';
import { useSafetyBriefing } from './hooks/useSafetyBriefing';
import { LONDON_BOUNDS } from './types';
import type { NominatimResult } from './types';
import { saveSearch } from './db';
import './index.css';

// Lazy load heavy components for better initial load performance
const CrimeMap = lazy(() => import('./components/CrimeMap').then(m => ({ default: m.CrimeMap })));
const StatsDashboard = lazy(() => import('./components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const SafetyBriefing = lazy(() => import('./components/SafetyBriefing').then(m => ({ default: m.SafetyBriefing })));

function MapLoadingFallback() {
  return (
    <div className="glass rounded-2xl h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[var(--color-text-muted)] text-sm">Loading map...</p>
      </div>
    </div>
  );
}

function StatsLoadingFallback() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-[var(--color-surface-elevated)] rounded w-1/3 mb-6" />
      <div className="h-48 bg-[var(--color-surface-elevated)] rounded" />
    </div>
  );
}

function BriefingLoadingFallback() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-[var(--color-surface-elevated)] rounded w-1/4 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-full" />
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-5/6" />
        <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-4/6" />
      </div>
    </div>
  );
}

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
  const [showPrivacy, setShowPrivacy] = useState(false);
  const searchBarRef = useRef<SearchBarHandle>(null);

  // Handle /privacy route via path
  useEffect(() => {
    const handleRoute = () => {
      if (window.location.pathname === '/privacy') {
        setShowPrivacy(true);
      }
    };
    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  const handleClosePrivacy = useCallback(() => {
    setShowPrivacy(false);
    if (window.location.pathname === '/privacy') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleQuickSearch = useCallback((area: string) => {
    searchBarRef.current?.setQuery(area);
  }, []);

  const { crimes, summary, isLoading: isCrimeLoading, progress } = useCrimeData(
    selectedLocation?.lat ?? null,
    selectedLocation?.lon ?? null
  );

  const { data: briefing, isLoading: isBriefingLoading, refetch: refetchBriefing } = useSafetyBriefing(
    selectedLocation?.name ?? null,
    summary
  );

  const handleSearch = useCallback(async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name = result.display_name.split(',')[0];

    setSelectedLocation({ lat, lon, name });

    // Save search history immediately (fire and forget)
    saveSearch({
      query: name,
      location: { lat, lon, displayName: result.display_name },
      timestamp: Date.now(),
      crimeCount: 0,
    }).catch(() => {
      // Silently ignore save errors - not critical for UX
    });
  }, []);

  const defaultCenter: [number, number] = [
    (LONDON_BOUNDS.minLat + LONDON_BOUNDS.maxLat) / 2,
    (LONDON_BOUNDS.minLon + LONDON_BOUNDS.maxLon) / 2,
  ];

  const mapCenter: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lon]
    : defaultCenter;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content - accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="glass sticky top-0 z-40 px-6 py-4" role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-xl" aria-hidden="true">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold">MetroSafe</h1>
              <p className="text-xs text-[var(--color-text-muted)]">London Crime Insights</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label="Open settings"
            aria-haspopup="dialog"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-6 py-8" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Search Section */}
          <section className="text-center mb-12" aria-labelledby="search-heading">
            <h2 id="search-heading" className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] bg-clip-text text-transparent">
              Explore London Safety Data
            </h2>
            <p className="text-[var(--color-text-muted)] mb-8 max-w-xl mx-auto">
              Get real-time crime statistics and AI-powered safety insights for any London location
            </p>
            <div className="flex justify-center" role="search">
              <SearchBar
                ref={searchBarRef}
                onSearch={handleSearch}
                isLoading={isCrimeLoading}
              />
            </div>
          </section>

          {/* Results Grid */}
          {(selectedLocation || crimes.length > 0) && (
            <div className="grid lg:grid-cols-3 gap-6 animate-fade-in" role="region" aria-label="Crime data results">
              {/* Map */}
              <section className="lg:col-span-2 h-[500px]" aria-label="Crime map">
                <ErrorBoundary
                  fallback={<MapErrorFallback onRetry={() => window.location.reload()} />}
                >
                  <Suspense fallback={<MapLoadingFallback />}>
                    <CrimeMap
                      center={mapCenter}
                      crimes={crimes}
                      isLoading={isCrimeLoading}
                      progress={progress}
                    />
                  </Suspense>
                </ErrorBoundary>
              </section>

              {/* Stats Sidebar */}
              <section className="lg:col-span-1 overflow-auto max-h-[500px]" aria-label="Crime statistics">
                <ErrorBoundary
                  fallback={<StatsErrorFallback onRetry={() => window.location.reload()} />}
                >
                  <Suspense fallback={<StatsLoadingFallback />}>
                    <StatsDashboard summary={summary} isLoading={isCrimeLoading} />
                  </Suspense>
                </ErrorBoundary>
              </section>

              {/* AI Briefing - Full Width */}
              <section className="lg:col-span-3" aria-label="AI safety briefing">
                <ErrorBoundary>
                  <Suspense fallback={<BriefingLoadingFallback />}>
                    <SafetyBriefing
                      briefing={briefing ?? null}
                      isLoading={isBriefingLoading}
                      onRegenerate={() => refetchBriefing()}
                    />
                  </Suspense>
                </ErrorBoundary>
              </section>
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
                    onClick={() => handleQuickSearch(area)}
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
      <footer className="glass px-6 py-4 mt-auto" role="contentinfo">
        <div className="max-w-7xl mx-auto text-center text-sm text-[var(--color-text-muted)]">
          <p>
            Data sourced from{' '}
            <a href="https://data.police.uk" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded">
              data.police.uk
            </a>
            {' '}• AI analysis powered by{' '}
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded">
              Gemini
            </a>
            {' '}•{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/privacy');
                setShowPrivacy(true);
              }}
              className="text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Privacy Policy Modal */}
      {showPrivacy && <PrivacyPolicy onClose={handleClosePrivacy} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MetroSafeApp />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
