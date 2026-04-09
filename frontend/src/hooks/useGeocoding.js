import { useState, useEffect, useRef } from 'react';
import { geocodeSearch } from '../services/api';

const DEBOUNCE_MS = 400;

export function useGeocoding(initialValue = '') {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!inputValue.trim() || inputValue.length < 3 || selected?.displayName === inputValue) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await geocodeSearch(inputValue);
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue]);

  const selectSuggestion = (suggestion) => {
    setInputValue(suggestion.shortName || suggestion.displayName);
    setSelected(suggestion);
    setSuggestions([]);
  };

  const clear = () => {
    setInputValue('');
    setSelected(null);
    setSuggestions([]);
  };

  return { inputValue, setInputValue, suggestions, loading, selected, selectSuggestion, clear };
}
