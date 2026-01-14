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

type PanelTab = 'overview' | 'hotspots' | 'ai';

function MapLoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-[var(--color-surface-secondary)]">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium">Loading map...</p>
      </div>
    </div>
  );
}

function PanelLoadingFallback() {
  return (
    <div className="p-4 space-y-4">
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-[var(--color-surface-secondary)] rounded-xl" />
        <div className="h-32 bg-[var(--color-surface-secondary)] rounded-xl" />
        <div className="h-24 bg-[var(--color-surface-secondary)] rounded-xl" />
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
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [sheetExpanded, setSheetExpanded] = useState(false);
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
    setSheetExpanded(true);

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

  // Panel content based on active tab
  const renderPanelContent = () => {
    if (!selectedLocation) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="empty-state-title">Search a Location</h3>
          <p className="empty-state-description">
            Enter a London address or area above to view crime statistics and safety insights
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <ErrorBoundary fallback={<StatsErrorFallback onRetry={() => window.location.reload()} />}>
            <Suspense fallback={<PanelLoadingFallback />}>
              <StatsDashboard summary={summary} isLoading={isCrimeLoading} compact />
            </Suspense>
          </ErrorBoundary>
        );
      case 'hotspots':
        return (
          <div className="panel-section">
            {summary && summary.topStreets.length > 0 ? (
              <div className="space-y-2">
                {summary.topStreets.map((street, index) => (
                  <div key={index} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text)]">{street.street}</span>
                    </div>
                    <span className="badge badge-neutral">{street.count} incidents</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <h3 className="empty-state-title">No Hotspots Data</h3>
                <p className="empty-state-description">
                  {isCrimeLoading ? 'Loading hotspot data...' : 'Search for a location to see hotspots'}
                </p>
              </div>
            )}
          </div>
        );
      case 'ai':
        return (
          <ErrorBoundary>
            <Suspense fallback={<PanelLoadingFallback />}>
              <SafetyBriefing
                briefing={briefing ?? null}
                isLoading={isBriefingLoading}
                onRegenerate={() => refetchBriefing()}
                compact
              />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Skip to main content - accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Fixed Header */}
      <header className="app-header glass" role="banner">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-lg font-bold" aria-hidden="true">
            M
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-[var(--color-text)] leading-tight">MetroSafe</h1>
            <p className="text-xs text-[var(--color-text-muted)]">London Crime Insights</p>
          </div>
        </div>

        {/* Search in header */}
        <div className="flex-1 max-w-xl" role="search">
          <SearchBar
            ref={searchBarRef}
            onSearch={handleSearch}
            isLoading={isCrimeLoading}
            compact
          />
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="btn btn-ghost p-2"
          aria-label="Open settings"
          aria-haspopup="dialog"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Map Container */}
      <main id="main-content" className="map-wrapper" role="main">
        <ErrorBoundary fallback={<MapErrorFallback onRetry={() => window.location.reload()} />}>
          <Suspense fallback={<MapLoadingFallback />}>
            <CrimeMap
              center={mapCenter}
              crimes={crimes}
              isLoading={isCrimeLoading}
              progress={progress}
            />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Desktop: Side Panel */}
      <aside className="side-panel" aria-label="Crime insights panel">
        {/* Panel Header with location info */}
        <div className="panel-header">
          {selectedLocation ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--color-text)] truncate">{selectedLocation.name}</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isCrimeLoading ? 'Loading...' : `${summary?.totalCrimes.toLocaleString() ?? 0} incidents`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">London Insights</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Search to explore data</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`tab ${activeTab === 'hotspots' ? 'active' : ''}`}
            >
              Hotspots
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            >
              AI Brief
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="panel-content">
          {renderPanelContent()}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Data from{' '}
            <a href="https://data.police.uk" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
              UK Police
            </a>
            {' '}&bull;{' '}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/privacy');
                setShowPrivacy(true);
              }}
              className="text-[var(--color-primary)] hover:underline"
            >
              Privacy
            </button>
          </p>
        </div>
      </aside>

      {/* Mobile: Bottom Sheet */}
      <div
        className={`bottom-sheet ${sheetExpanded ? 'expanded' : 'collapsed'}`}
        aria-label="Crime insights panel"
      >
        {/* Drag Handle */}
        <button
          onClick={() => setSheetExpanded(!sheetExpanded)}
          className="w-full py-2 flex justify-center cursor-pointer"
          aria-label={sheetExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <div className="sheet-handle" />
        </button>

        {/* Sheet Header */}
        <div className="px-4 pb-3 border-b border-[var(--color-border)]">
          {selectedLocation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--color-text)] truncate">{selectedLocation.name}</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isCrimeLoading ? 'Loading...' : `${summary?.totalCrimes.toLocaleString() ?? 0} incidents`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSheetExpanded(!sheetExpanded)}
                className="btn btn-ghost btn-sm"
              >
                {sheetExpanded ? 'Less' : 'More'}
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm font-medium text-[var(--color-text)]">Search a location to see insights</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div className="tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`tab ${activeTab === 'hotspots' ? 'active' : ''}`}
            >
              Hotspots
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            >
              AI Brief
            </button>
          </div>
        </div>

        {/* Sheet Content */}
        <div className="sheet-content">
          <div className="p-4">
            {renderPanelContent()}
          </div>
        </div>
      </div>

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
