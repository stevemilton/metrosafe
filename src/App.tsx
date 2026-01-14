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
    <div className="card h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Loading map...</p>
      </div>
    </div>
  );
}

function StatsLoadingFallback() {
  return (
    <div className="card p-6">
      <div className="animate-pulse">
        <div className="h-5 bg-[var(--color-surface-secondary)] rounded-lg w-2/3 mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="h-20 bg-[var(--color-surface-secondary)] rounded-xl" />
          <div className="h-20 bg-[var(--color-surface-secondary)] rounded-xl" />
        </div>
        <div className="h-40 bg-[var(--color-surface-secondary)] rounded-xl" />
      </div>
    </div>
  );
}

function BriefingLoadingFallback() {
  return (
    <div className="card p-6">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--color-surface-secondary)] rounded-xl" />
          <div className="h-5 bg-[var(--color-surface-secondary)] rounded-lg w-40" />
        </div>
        <div className="space-y-3">
          <div className="h-14 bg-[var(--color-surface-secondary)] rounded-xl" />
          <div className="h-14 bg-[var(--color-surface-secondary)] rounded-xl" />
          <div className="h-14 bg-[var(--color-surface-secondary)] rounded-xl" />
        </div>
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
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Skip to main content - accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-40" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-white text-lg font-bold shadow-md" aria-hidden="true">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">MetroSafe</h1>
              <p className="text-xs text-[var(--color-text-muted)]">London Crime Insights</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-muted)]"
            aria-label="Open settings"
            aria-haspopup="dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-8" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-10" aria-labelledby="search-heading">
            <h2 id="search-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[var(--color-text)]">
              Explore <span className="gradient-text">London</span> Safety Data
            </h2>
            <p className="text-[var(--color-text-muted)] mb-8 max-w-2xl mx-auto text-base sm:text-lg">
              Real-time crime statistics and AI-powered safety insights for any London location
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
            <div className="animate-fade-in-up" role="region" aria-label="Crime data results">
              {/* Location Header */}
              {selectedLocation && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-[var(--color-border)]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">{selectedLocation.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {isCrimeLoading ? 'Analyzing crime data...' : `${summary?.totalCrimes.toLocaleString() ?? 0} incidents reported`}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Grid - Map and Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                {/* Map */}
                <section className="xl:col-span-8 h-[450px] sm:h-[500px] xl:h-[550px]" aria-label="Crime map">
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
                <section className="xl:col-span-4 xl:h-[550px] xl:overflow-auto" aria-label="Crime statistics">
                  <ErrorBoundary
                    fallback={<StatsErrorFallback onRetry={() => window.location.reload()} />}
                  >
                    <Suspense fallback={<StatsLoadingFallback />}>
                      <StatsDashboard summary={summary} isLoading={isCrimeLoading} />
                    </Suspense>
                  </ErrorBoundary>
                </section>
              </div>

              {/* AI Briefing */}
              <section aria-label="AI safety briefing">
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
            <div className="text-center py-16 sm:py-24">
              <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--color-text)]">Welcome to MetroSafe</h3>
              <p className="text-[var(--color-text-muted)] max-w-lg mx-auto mb-8 text-base sm:text-lg">
                Search for any London location to view crime statistics, interactive maps, and AI-generated safety briefings.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Camden Town', 'Shoreditch', 'Westminster', 'Brixton', 'Greenwich'].map((area) => (
                  <button
                    key={area}
                    onClick={() => handleQuickSearch(area)}
                    className="px-5 py-2.5 rounded-full bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-sm font-medium text-[var(--color-text-secondary)]"
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
      <footer className="bg-white border-t border-[var(--color-border)] px-4 sm:px-6 lg:px-8 py-6 mt-auto" role="contentinfo">
        <div className="max-w-7xl mx-auto text-center text-sm text-[var(--color-text-muted)]">
          <p>
            Data from{' '}
            <a href="https://data.police.uk" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline font-medium">
              data.police.uk
            </a>
            {' '}&bull;{' '}AI by{' '}
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline font-medium">
              Gemini
            </a>
            {' '}&bull;{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/privacy');
                setShowPrivacy(true);
              }}
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Privacy
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
