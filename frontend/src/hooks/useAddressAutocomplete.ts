import { useState, useEffect, useRef } from 'react';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Nominatim autocomplete hook.
 * - Debounces 400 ms before firing a request
 * - Enforces ≥ 1 s between actual HTTP calls (Nominatim usage policy)
 * - Sends a proper User-Agent via a custom header
 */
export function useAddressAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the timestamp of the last Nominatim request (module-level rate-limit)
  const lastRequestTime = useRef<number>(0);
  // Debounce timer
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // AbortController for in-flight requests
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Clear previous debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      // Enforce ≥ 1 s between requests
      const now = Date.now();
      const elapsed = now - lastRequestTime.current;
      const waitMs = elapsed < 1000 ? 1000 - elapsed : 0;

      await new Promise((resolve) => setTimeout(resolve, waitMs));

      // Abort any previous in-flight request
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      lastRequestTime.current = Date.now();
      setLoading(true);
      setError(null);

      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('limit', '5');
        url.searchParams.set('addressdetails', '0');

        const res = await fetch(url.toString(), {
          signal: abortController.current.signal,
          headers: {
            // Required by Nominatim usage policy
            'User-Agent': 'FoodRescueNetwork/1.0 (contact@food-rescue-network.app)',
            'Accept-Language': 'en',
          },
        });

        if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch (err: any) {
        if (err.name === 'AbortError') return; // ignore aborted requests
        setError('Could not fetch address suggestions. Check your connection.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  return { suggestions, loading, error };
}
