'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Loader2, MapPin } from 'lucide-react';

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationInputProps {
  onSelectLocation: (locationName: string) => void;
  initialValue?: string;
}

// Debounce function
function debounce<F extends (...args: any[]) => void>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export function LocationInput({ onSelectLocation, initialValue }: LocationInputProps) {
  const [query, setQuery] = useState(initialValue || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`
      );
      const data: LocationResult[] = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(debounce(fetchLocations, 300), [fetchLocations]);

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);
  
  const handleSelect = (result: LocationResult) => {
    const locationName = result.display_name;
    setQuery(locationName);
    onSelectLocation(locationName);
    setIsOpen(false);
  };

  return (
    <Command shouldFilter={false} className="relative overflow-visible">
      <CommandInput
        placeholder="e.g., Recife, PE, Brazil"
        value={query}
        onValueChange={setQuery}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className="w-full"
      />
      {isOpen && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          <CommandList>
            {isLoading && <CommandEmpty> <Loader2 className="h-4 w-4 animate-spin mr-2"/> Searching...</CommandEmpty>}
            {!isLoading && results.length === 0 && query.length > 2 && <CommandEmpty>No results found.</CommandEmpty>}
            {results.map((result) => (
              <CommandItem
                key={result.place_id}
                onSelect={() => handleSelect(result)}
                value={result.display_name}
                className="flex items-start"
              >
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 mt-1" />
                <span className="text-sm">{result.display_name}</span>
              </CommandItem>
            ))}
          </CommandList>
        </div>
      )}
    </Command>
  );
}
