import { useRef, useState } from 'react';
import { useGeocoding } from '../../hooks/useGeocoding';

export default function SearchPanel({ onSearch, onLocate, loading }) {
  const origin = useGeocoding('');
  const dest = useGeocoding('');
  const [showOriginSugg, setShowOriginSugg] = useState(false);
  const [showDestSugg, setShowDestSugg] = useState(false);
  const originRef = useRef(null);
  const destRef = useRef(null);

  const handleSearch = () => {
    if (!origin.selected || !dest.selected) return;
    onSearch(origin.selected, dest.selected);
  };

  const canSearch = origin.selected && dest.selected && !loading;

  return (
    <div className="search-panel">
      <div className="search-panel-title">
        <span>🗺️</span> Plan Your Route
      </div>

      {/* Origin */}
      <div className="search-row" ref={originRef}>
        <div className="search-input-wrapper" onClick={() => originRef.current?.querySelector('input')?.focus()}>
          <div className="search-dot origin" />
          <input
            className="search-input"
            id="origin-input"
            placeholder="Enter starting point…"
            value={origin.inputValue}
            onChange={(e) => {
              origin.setInputValue(e.target.value);
              origin.selectSuggestion && (origin._selected = null);
              setShowOriginSugg(true);
            }}
            onFocus={() => setShowOriginSugg(true)}
            onBlur={() => setTimeout(() => setShowOriginSugg(false), 180)}
            autoComplete="off"
          />
          {origin.inputValue && (
            <button className="search-input-clear" onClick={origin.clear} type="button">✕</button>
          )}
        </div>

        {showOriginSugg && origin.suggestions.length > 0 && (
          <div className="search-suggestions">
            {origin.suggestions.map((s, i) => (
              <div
                key={i}
                className="suggestion-item"
                onMouseDown={() => { origin.selectSuggestion(s); setShowOriginSugg(false); }}
              >
                <span className="suggestion-icon">📍</span>
                <span>{s.shortName || s.displayName?.split(',').slice(0, 2).join(',')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="search-row" ref={destRef}>
        <div className="search-input-wrapper" onClick={() => destRef.current?.querySelector('input')?.focus()}>
          <div className="search-dot destination" />
          <input
            className="search-input"
            id="dest-input"
            placeholder="Enter destination…"
            value={dest.inputValue}
            onChange={(e) => { dest.setInputValue(e.target.value); setShowDestSugg(true); }}
            onFocus={() => setShowDestSugg(true)}
            onBlur={() => setTimeout(() => setShowDestSugg(false), 180)}
            autoComplete="off"
          />
          {dest.inputValue && (
            <button className="search-input-clear" onClick={dest.clear} type="button">✕</button>
          )}
        </div>

        {showDestSugg && dest.suggestions.length > 0 && (
          <div className="search-suggestions">
            {dest.suggestions.map((s, i) => (
              <div
                key={i}
                className="suggestion-item"
                onMouseDown={() => { dest.selectSuggestion(s); setShowDestSugg(false); }}
              >
                <span className="suggestion-icon">🏁</span>
                <span>{s.shortName || s.displayName?.split(',').slice(0, 2).join(',')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Use current location */}
      <button className="btn-location" id="use-location-btn" onClick={onLocate} type="button">
        <span>🎯</span> Use my current location as start
      </button>

      {/* Search button */}
      <button
        className="btn-route"
        id="find-routes-btn"
        onClick={handleSearch}
        disabled={!canSearch}
        type="button"
      >
        {loading ? (
          <><div className="spinner" /> Analyzing Routes…</>
        ) : (
          <><span>🛡️</span> Find Safe Routes</>
        )}
      </button>
    </div>
  );
}
