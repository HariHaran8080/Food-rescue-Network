import { useState, useRef, useEffect } from 'react';
import { useAddressAutocomplete, NominatimResult } from '../hooks/useAddressAutocomplete';

export interface AddressSelection {
  displayName: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  required?: boolean;
  onSelect: (selection: AddressSelection) => void;
  onTextChange?: (text: string) => void;
  initialValue?: string;
  showLocationButton?: boolean;
}

export default function AddressAutocomplete({
  label = 'Address',
  labelClassName = 'block text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider',
  placeholder = 'Start typing an address…',
  required = false,
  onSelect,
  onTextChange,
  initialValue = '',
  showLocationButton = true,
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [selected, setSelected] = useState(false);
  const [open, setOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeQuery = selected ? '' : query;
  const { suggestions, loading, error } = useAddressAutocomplete(activeQuery);

  useEffect(() => {
    setOpen(suggestions.length > 0 && !selected);
  }, [suggestions, selected]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    onTextChange?.(val);
  }

  function handleSelect(result: NominatimResult) {
    const displayName = result.display_name;
    setQuery(displayName);
    setSelected(true);
    setOpen(false);
    onTextChange?.(displayName);
    onSelect({
      displayName,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'FoodRescueNetwork/1.0 (contact@food-rescue-network.app)',
                'Accept-Language': 'en',
              },
            }
          );
          const data = await res.json();
          const displayName = data.display_name || `${latitude}, ${longitude}`;
          setQuery(displayName);
          setSelected(true);
          onTextChange?.(displayName);
          onSelect({ displayName, lat: latitude, lng: longitude });
        } catch {
          const displayName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setQuery(displayName);
          setSelected(true);
          onTextChange?.(displayName);
          onSelect({ displayName, lat: latitude, lng: longitude });
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false)
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="input-dark w-full pl-10 pr-8 py-3 rounded-xl text-sm"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-rescue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] max-h-60 overflow-y-auto"
        >
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(s)}
              className="px-4 py-2.5 text-xs text-gray-900 font-semibold hover:bg-[#EAF4F6] cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-2.5"
            >
              <svg className="h-4 w-4 text-[#387B85] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="line-clamp-2 leading-snug">{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}

      {showLocationButton && (
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="mt-2 text-xs text-gray-800 hover:text-black font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          {geoLoading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Detecting location…
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use my current location
            </>
          )}
        </button>
      )}
    </div>
  );
}
