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
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search a London location (e.g., Camden Town, Shoreditch)..."
          className="w-full px-6 py-4 text-lg rounded-2xl glass focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--color-text-muted)]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {showDropdown && (query.length >= 3 || (recentSearches && recentSearches.length > 0)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl glass overflow-hidden z-50 animate-fade-in"
        >
          {isSearching && (
            <div className="px-4 py-3 text-[var(--color-text-muted)]">Searching...</div>
          )}
          
          {!isSearching && suggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                Suggestions
              </div>
              {suggestions.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--color-surface-elevated)] transition-colors"
                >
                  <span className="font-medium">{result.display_name.split(',')[0]}</span>
                  <span className="text-sm text-[var(--color-text-muted)] ml-2">
                    {result.display_name.split(',').slice(1, 3).join(',')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length < 3 && recentSearches && recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                Recent Searches
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => handleRecentSelect(search)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--color-surface-elevated)] transition-colors flex justify-between items-center"
                >
                  <span className="font-medium">{search.query}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {search.crimeCount} incidents
                  </span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && query.length >= 3 && suggestions.length === 0 && (
            <div className="px-4 py-3 text-[var(--color-text-muted)]">
              No locations found in London. Try a different search term.
            </div>
          )}
        </div>
      )}
    </form>
  );
});
