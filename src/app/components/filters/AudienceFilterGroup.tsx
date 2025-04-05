"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import RangeFilter from "./shared/RangeFilter";
import PercentageSlider from "./shared/PercentageSlider";

interface AudienceFilterGroupProps {
  filters: any;
  updateFilter: (key: string, value: any) => void;
}

interface AudienceLocation {
  location_id: string;
  percentage_value: number;
}

// For demo purposes, we'll use a mock list of locations
const LOCATIONS = [
  { id: "8fd1ae5e-87c9-4654-b57d-3d6238d1b0fe", name: "India" },
  { id: "9e8d7c6b-5a4f-3e2d-1c0b-9a8b7c6d5e4f", name: "United States" },
  { id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p", name: "United Kingdom" },
  { id: "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6", name: "Canada" },
  { id: "q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6", name: "Australia" },
];

export default function AudienceFilterGroup({
  filters,
  updateFilter,
}: AudienceFilterGroupProps) {
  const [genderOpen, setGenderOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const genderRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        genderRef.current &&
        !genderRef.current.contains(event.target as Node)
      ) {
        setGenderOpen(false);
      }
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setLocationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Gender options
  const GENDER_OPTIONS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  // Handle audience gender change
  const handleGenderChange = (type: string) => {
    let genderFilter = null;

    if (type) {
      genderFilter = {
        type,
        operator: "GT", // Greater than
        percentage_value: filters.audience_gender?.percentage_value || 50,
      };
    }

    updateFilter("audience_gender", genderFilter);
    setGenderOpen(false);
  };

  // Handle audience gender percentage change
  const handleGenderPercentageChange = (percentage: number) => {
    if (filters.audience_gender) {
      updateFilter("audience_gender", {
        ...filters.audience_gender,
        percentage_value: percentage,
      });
    }
  };

  // Add a new audience location
  const handleAddLocation = (locationId: string) => {
    if (!locationId) return;

    const existingLocations = filters.audience_locations || [];
    const alreadyExists = existingLocations.some(
      (loc: AudienceLocation) => loc.location_id === locationId
    );

    if (!alreadyExists) {
      updateFilter("audience_locations", [
        ...existingLocations,
        {
          location_id: locationId,
          percentage_value: 20, // Default percentage
        },
      ]);
    }

    setLocationOpen(false);
    setSearchTerm("");
  };

  // Update an audience location percentage
  const handleLocationPercentageChange = (
    locationId: string,
    percentage: number
  ) => {
    const updatedLocations = (filters.audience_locations || []).map(
      (loc: AudienceLocation) =>
        loc.location_id === locationId
          ? { ...loc, percentage_value: percentage }
          : loc
    );

    updateFilter("audience_locations", updatedLocations);
  };

  // Remove an audience location
  const handleRemoveLocation = (locationId: string) => {
    const updatedLocations = (filters.audience_locations || []).filter(
      (loc: AudienceLocation) => loc.location_id !== locationId
    );

    updateFilter("audience_locations", updatedLocations);
  };

  // Filtered locations based on search
  const filteredLocations = LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(filters.audience_locations || []).some(
        (audienceLoc: AudienceLocation) => audienceLoc.location_id === loc.id
      )
  );

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Audience Age */}
      <RangeFilter
        label="Audience Age"
        value={filters.audience_age}
        onChange={(value) => updateFilter("audience_age", value)}
        min={18}
        max={100}
      />

      {/* Audience Gender */}
      <div className="space-y-2">
        <label className="block text-black font-medium">Audience Gender</label>
        <div className="relative" ref={genderRef}>
          <button
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
            onClick={() => setGenderOpen(!genderOpen)}
          >
            <span className="text-black">
              {filters.audience_gender
                ? GENDER_OPTIONS.find(
                    (opt) => opt.value === filters.audience_gender.type
                  )?.label || filters.audience_gender.type
                : "Select gender"}
            </span>
            {filters.audience_gender && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("audience_gender", null);
                }}
                className="mr-2"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-black" />
          </button>

          {genderOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {GENDER_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-black"
                  onClick={() => handleGenderChange(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gender percentage slider */}
        {filters.audience_gender && (
          <div className="mt-4">
            <label className="block text-black mb-2">Percentage</label>
            <PercentageSlider
              value={filters.audience_gender.percentage_value}
              onChange={handleGenderPercentageChange}
            />
          </div>
        )}
      </div>

      {/* Audience Locations */}
      <div className="space-y-2">
        <label className="block text-black font-medium">
          Audience Locations
        </label>

        {/* Selected locations */}
        <div className="space-y-4">
          {(filters.audience_locations || []).map((loc: AudienceLocation) => {
            const location = LOCATIONS.find((l) => l.id === loc.location_id);
            if (!location) return null;

            return (
              <div
                key={loc.location_id}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-black">
                      {location.name}
                    </span>
                    <button
                      onClick={() => handleRemoveLocation(loc.location_id)}
                      className="ml-2 p-1 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>
                <label className="block text-black text-sm mb-1">
                  Percentage
                </label>
                <PercentageSlider
                  value={loc.percentage_value}
                  onChange={(percentage) =>
                    handleLocationPercentageChange(loc.location_id, percentage)
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Add location dropdown */}
        <div className="relative" ref={locationRef}>
          <button
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white mt-2"
            onClick={() => setLocationOpen(!locationOpen)}
          >
            <span className="text-black">Add location</span>
            <Plus className="w-4 h-4 text-black" />
          </button>

          {locationOpen && (
            <div className="text-black absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => handleAddLocation(loc.id)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                  >
                    {loc.name}
                  </div>
                ))}

                {filteredLocations.length === 0 && (
                  <div className="px-4 py-2 text-black text-center">
                    {searchTerm
                      ? "No locations found"
                      : "No more locations available"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add more button */}
        {(filters.audience_locations || []).length > 0 && (
          <div className="text-right mt-2">
            <button
              onClick={() => setLocationOpen(true)}
              className="text-green-500 text-sm font-medium hover:text-green-600"
            >
              addMore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
