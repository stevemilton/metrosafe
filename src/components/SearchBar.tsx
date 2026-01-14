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
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBar({ onSearch, isLoading }, ref) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading: isSearching } = useLocationSearch(debouncedQuery);
  const recentSearches = useRecentSearches(5);

  // Expose setQuery to parent via ref
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

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      {/* Glow effect background */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] opacity-0 blur-xl transition-opacity duration-300 ${isFocused ? 'opacity-30' : ''}`}
      />

      <div className="relative">
        <div className={`relative rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]' : ''}`}>
          {/* Search icon */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            className="w-full pl-14 pr-32 py-5 text-lg rounded-2xl glass focus:outline-none transition-all placeholder:text-[var(--color-text-dim)]"
            disabled={isLoading}
            aria-label="Search for a London location"
            aria-autocomplete="list"
            aria-controls="search-dropdown"
            aria-expanded={showDropdown}
          />

          <button
            type="submit"
            disabled={isLoading || !query}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-primary)]/25"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">Search</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>

      {showDropdown && (query.length >= 3 || (recentSearches && recentSearches.length > 0)) && (
        <div
          id="search-dropdown"
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-3 rounded-2xl glass overflow-hidden z-50 animate-fade-in shadow-lg shadow-black/20"
          role="listbox"
        >
          {isSearching && (
            <div className="px-5 py-4 text-[var(--color-text-muted)] flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              Searching London...
            </div>
          )}

          {!isSearching && suggestions.length > 0 && (
            <div>
              <div className="px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-dim)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Suggestions
              </div>
              {suggestions.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full px-5 py-4 text-left hover:bg-[var(--color-surface-elevated)] transition-colors flex items-center gap-3 group"
                  role="option"
                >
                  <span className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] group-hover:bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0 transition-colors">
                    <svg className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium block truncate">{result.display_name.split(',')[0]}</span>
                    <span className="text-sm text-[var(--color-text-muted)] block truncate">
                      {result.display_name.split(',').slice(1, 3).join(',')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length < 3 && recentSearches && recentSearches.length > 0 && (
            <div>
              <div className="px-5 py-3 text-xs uppercase tracking-wider text-[var(--color-text-dim)] border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Searches
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => handleRecentSelect(search)}
                  className="w-full px-5 py-4 text-left hover:bg-[var(--color-surface-elevated)] transition-colors flex items-center justify-between gap-3 group"
                  role="option"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] group-hover:bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0 transition-colors">
                      <svg className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className="font-medium truncate">{search.query}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] shrink-0">
                    {search.crimeCount} incidents
                  </span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 3 && suggestions.length === 0 && (
            <div className="px-5 py-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[var(--color-text-muted)]">
                No locations found in London
              </p>
              <p className="text-sm text-[var(--color-text-dim)] mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
});
