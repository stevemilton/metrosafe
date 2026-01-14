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
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-[var(--color-text-muted)] text-sm">Loading interactive map...</p>
      </div>
    </div>
  );
}

function StatsLoadingFallback() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl animate-shimmer" />
        <div className="flex-1">
          <div className="h-5 w-32 rounded animate-shimmer mb-2" />
          <div className="h-4 w-24 rounded animate-shimmer" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-24 rounded-xl animate-shimmer" />
        <div className="h-48 rounded-xl animate-shimmer" />
      </div>
    </div>
  );
}

function BriefingLoadingFallback() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl animate-shimmer" />
        <div className="flex-1">
          <div className="h-5 w-40 rounded animate-shimmer mb-2" />
          <div className="h-4 w-32 rounded animate-shimmer" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-shimmer" />
        ))}
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
      <header className="glass sticky top-0 z-40 border-b border-[var(--color-border)]" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-xl shadow-lg shadow-[var(--color-primary)]/25" aria-hidden="true">
              🛡️
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">MetroSafe</h1>
              <p className="text-xs text-[var(--color-text-muted)] hidden sm:block">London Crime Insights</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl hover:bg-[var(--color-surface-elevated)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border border-transparent hover:border-[var(--color-border)]"
            aria-label="Open settings"
            aria-haspopup="dialog"
          >
            <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-4 sm:px-6 py-6 sm:py-8" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section with Search */}
          <section className="text-center mb-8 sm:mb-12" aria-labelledby="search-heading">
            <div className="mb-6 sm:mb-8">
              <h2 id="search-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
                <span className="gradient-text">Explore London</span>
                <br className="sm:hidden" />
                <span className="text-[var(--color-text)]"> Safety Data</span>
              </h2>
              <p className="text-[var(--color-text-muted)] text-sm sm:text-base max-w-xl mx-auto">
                Get real-time crime statistics and AI-powered safety insights for any London location
              </p>
            </div>
            <div className="flex justify-center px-2" role="search">
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedLocation.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {isCrimeLoading ? 'Loading crime data...' : `${summary?.totalCrimes.toLocaleString() ?? 0} incidents in the area`}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Grid - Map and Stats side by side on desktop */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Map - Takes more space on large screens */}
                <section className="xl:col-span-8 h-[400px] sm:h-[500px] xl:h-[600px]" aria-label="Crime map">
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
                <section className="xl:col-span-4 xl:h-[600px] xl:overflow-auto" aria-label="Crime statistics">
                  <ErrorBoundary
                    fallback={<StatsErrorFallback onRetry={() => window.location.reload()} />}
                  >
                    <Suspense fallback={<StatsLoadingFallback />}>
                      <StatsDashboard summary={summary} isLoading={isCrimeLoading} />
                    </Suspense>
                  </ErrorBoundary>
                </section>
              </div>

              {/* AI Briefing - Full Width Below */}
              <section className="mt-6" aria-label="AI safety briefing">
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
            <div className="text-center py-12 sm:py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-primary)]/25">
                <span className="text-3xl">🗺️</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3">Welcome to MetroSafe</h3>
              <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-8 px-4">
                Search for any London location to view crime statistics, interactive maps, and AI-generated safety briefings.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
                {['Camden Town', 'Shoreditch', 'Westminster', 'Brixton', 'Greenwich'].map((area) => (
                  <button
                    key={area}
                    onClick={() => handleQuickSearch(area)}
                    className="px-4 sm:px-5 py-2.5 rounded-xl glass hover:bg-[var(--color-surface-elevated)] transition-all text-sm font-medium hover:scale-105 active:scale-95 border border-transparent hover:border-[var(--color-border)]"
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
      <footer className="glass border-t border-[var(--color-border)] px-4 sm:px-6 py-4 mt-auto" role="contentinfo">
        <div className="max-w-7xl mx-auto text-center text-xs sm:text-sm text-[var(--color-text-muted)]">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>Data sourced from</span>
            <a href="https://data.police.uk" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded">
              data.police.uk
            </a>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">AI analysis powered by</span>
            <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded hidden sm:inline">
              Gemini
            </a>
            <span>•</span>
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
