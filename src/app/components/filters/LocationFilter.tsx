"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { fetchLocations } from "@/services/locationService";

interface LocationFilterProps {
  value: string[] | null;
  onChange: (value: string[]) => void;
}

interface Location {
  id: string;
  display_name: string;
}

export default function LocationFilter({
  value = [],
  onChange,
}: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    Array.isArray(value) ? value : []
  );
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch locations when component mounts
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locationsData = await fetchLocations();
        setLocations(locationsData);
      } catch (err) {
        setError("Failed to load locations. Please try again later.");
        console.error("Error loading locations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set initial value
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(selectedLocations)) {
      setSelectedLocations(Array.isArray(value) ? value : []);
    }
  }, [value]);

  // Update parent component when selections change, but only when selectedLocations actually changes
  useEffect(() => {
    onChange(selectedLocations);
  }, [selectedLocations]);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(locationId)) {
        return prev.filter((id) => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const removeLocation = (locationId: string) => {
    setSelectedLocations((prev) => prev.filter((id) => id !== locationId));
  };

  const getLocationName = (locationId: string) => {
    return (
      locations.find((location) => location.id === locationId)?.display_name ||
      ""
    );
  };

  // Filter locations based on search term
  const filteredLocations = searchTerm
    ? locations.filter((location) =>
        location.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : locations;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Creator Location
      </label>

      {/* Selected locations tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLocations.map((locationId) => (
          <div
            key={locationId}
            className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
          >
            {getLocationName(locationId)}
            <button
              onClick={() => removeLocation(locationId)}
              className="ml-2 text-purple-600 hover:text-purple-800"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-left text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500">
              {selectedLocations.length > 0
                ? `${selectedLocations.length} location${
                    selectedLocations.length !== 1 ? "s" : ""
                  } selected`
                : "Select locations"}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {/* Search input */}
            <div className="sticky top-0 px-3 py-2 bg-white border-b border-gray-100">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {isLoading ? (
              <div className="px-4 py-2 text-center text-gray-500">
                Loading locations...
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-center text-red-500">{error}</div>
            ) : filteredLocations.length === 0 ? (
              <div className="px-4 py-2 text-center text-gray-500">
                No locations found
              </div>
            ) : (
              filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className={`px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-purple-50 ${
                    selectedLocations.includes(location.id)
                      ? "bg-purple-50"
                      : ""
                  }`}
                  onClick={() => handleLocationSelect(location.id)}
                >
                  <span>{location.display_name}</span>
                  {selectedLocations.includes(location.id) && (
                    <Check className="h-4 w-4 text-purple-600" />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
