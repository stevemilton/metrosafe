import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useLocationSearch } from '../hooks/useGeocode';
import { useRecentSearches } from '../hooks/useSettings';
import type { NominatimResult, Search } from '../types';

export interface SearchBarHandle {
  setQuery: (query: string) => void;
}

interface SearchBarProps {
  onSearch: (location: NominatimResult) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBar({ onSearch, isLoading, compact }, ref) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading: isSearching } = useLocationSearch(debouncedQuery);
  const recentSearches = useRecentSearches(5);

  useImperativeHandle(ref, () => ({
    setQuery: (newQuery: string) => {
      setQuery(newQuery);
      setShowDropdown(true);
      inputRef.current?.focus();
    },
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name.split(',')[0]);
    setShowDropdown(false);
    onSearch(result);
  };

  const handleRecentSelect = (search: Search) => {
    setQuery(search.query);
    setShowDropdown(false);
    onSearch({
      lat: String(search.location.lat),
      lon: String(search.location.lon),
      display_name: search.location.displayName,
    } as NominatimResult);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  };

  // Compact mode for header
  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative">
          <div className={`
            relative bg-[var(--color-surface-secondary)] rounded-xl transition-all duration-200
            ${isFocused ? 'ring-2 ring-[var(--color-primary)]/30' : ''}
          `}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-light)]'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                setShowDropdown(true);
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              placeholder="Search London..."
              className="w-full pl-12 pr-10 py-3 text-sm rounded-xl bg-transparent focus:outline-none placeholder:text-[var(--color-text-light)] text-[var(--color-text)]"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {showDropdown && (query.length >= 3 || (recentSearches && recentSearches.length > 0)) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white shadow-xl border border-[var(--color-border)] overflow-hidden z-50 animate-fade-in max-h-80 overflow-y-auto"
          >
            {isSearching && (
              <div className="px-4 py-3 text-[var(--color-text-muted)] flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {!isSearching && suggestions.length > 0 && (
              <div className="py-1">
                {suggestions.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--color-text)] text-sm block truncate">{result.display_name.split(',')[0]}</span>
                      <span className="text-xs text-[var(--color-text-muted)] block truncate">
                        {result.display_name.split(',').slice(1, 3).join(',')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && query.length < 3 && recentSearches && recentSearches.length > 0 && (
              <div className="py-1">
                <div className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
                  Recent
                </div>
                {recentSearches.slice(0, 3).map((search) => (
                  <button
                    key={search.id}
                    type="button"
                    onClick={() => handleRecentSelect(search)}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-[var(--color-text)] text-sm truncate">{search.query}</span>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && query.length >= 3 && suggestions.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">No locations found</p>
              </div>
            )}
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <div className={`
          relative bg-white rounded-2xl transition-all duration-200
          ${isFocused
            ? 'shadow-2xl ring-2 ring-[var(--color-primary)]/30'
            : 'shadow-lg hover:shadow-xl'
          }
        `}>
          {/* Search Icon */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className={`w-6 h-6 transition-colors duration-200 ${isFocused ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-light)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => {
              setShowDropdown(true);
              setIsFocused(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder="Search a London location..."
            className="w-full pl-16 pr-32 py-5 text-lg rounded-2xl bg-transparent focus:outline-none placeholder:text-[var(--color-text-light)] text-[var(--color-text)]"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !query}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {showDropdown && (query.length >= 3 || (recentSearches && recentSearches.length > 0)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-4 rounded-2xl bg-white shadow-2xl border border-[var(--color-border)] overflow-hidden z-50 animate-fade-in"
        >
          {isSearching && (
            <div className="px-8 py-6 text-[var(--color-text-muted)] flex items-center gap-4">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-base">Searching...</span>
            </div>
          )}

          {!isSearching && suggestions.length > 0 && (
            <div>
              <div className="px-8 py-4 text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Suggestions
              </div>
              <div className="py-2">
                {suggestions.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full px-8 py-5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center gap-5 group"
                  >
                    <span className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 transition-colors">
                      <svg className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[var(--color-text)] text-base block truncate">{result.display_name.split(',')[0]}</span>
                      <span className="text-sm text-[var(--color-text-muted)] block truncate mt-1">
                        {result.display_name.split(',').slice(1, 3).join(',')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && query.length < 3 && recentSearches && recentSearches.length > 0 && (
            <div>
              <div className="px-8 py-4 text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Searches
              </div>
              <div className="py-2">
                {recentSearches.map((search) => (
                  <button
                    key={search.id}
                    type="button"
                    onClick={() => handleRecentSelect(search)}
                    className="w-full px-8 py-5 text-left hover:bg-[var(--color-surface-secondary)] transition-colors flex items-center justify-between gap-5 group"
                  >
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <span className="w-12 h-12 rounded-xl bg-[var(--color-surface-secondary)] group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span className="font-semibold text-[var(--color-text)] text-base truncate">{search.query}</span>
                    </div>
                    <span className="text-xs px-4 py-2 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] shrink-0 font-medium">
                      {search.crimeCount} incidents
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && query.length >= 3 && suggestions.length === 0 && (
            <div className="px-8 py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-secondary)] flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-[var(--color-text-secondary)] font-semibold text-base mb-2">No locations found</p>
              <p className="text-sm text-[var(--color-text-muted)]">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </form>
  );
});
