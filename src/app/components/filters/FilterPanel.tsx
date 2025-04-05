"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import LocationFilter from "./LocationFilter";
import EngagementRateFilter from "./EngagementRateFilter";
import SubscribersFilter from "./SubscribersFilter";
import ContactDetailsFilter from "./ContactDetailsFilter";
import CreatorFilterGroup from "./CreatorFilterGroup";
import AudienceFilterGroup from "./AudienceFilterGroup";

interface FilterPanelProps {
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export default function FilterPanel({
  onFiltersChange,
  onClearFilters,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<any>({
    // Basic filters
    creator_locations: [],
    engagement: null,
    subscriber_count: { min: 100, max: 10000 },
    specific_contact_details: [],

    // Creator filters
    last_post_timestamp: null,
    content_count: { min: 100, max: 25000 },
    average_likes: { min: 100, max: 25000 },
    average_views: { min: 100, max: 25000 },
    creator_gender: null,
    creator_age: { min: 10, max: 50 },
    creator_language: null,

    // Audience filters
    audience_age: { min: 30, max: 100 },
    audience_gender: null,
    audience_locations: [],
  });

  const [expandedBasic, setExpandedBasic] = useState(true);
  const [expandedCreator, setExpandedCreator] = useState(false);
  const [expandedAudience, setExpandedAudience] = useState(false);

  // Use useEffect to notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prevFilters: any) => {
      return { ...prevFilters, [key]: value };
    });
  };

  const handleClearFilters = () => {
    setFilters({});
    onFiltersChange({});
    onClearFilters();
  };

  const hasActiveFilters = () => {
    return (
      filters.creator_locations.length > 0 ||
      filters.engagement !== null ||
      filters.specific_contact_details.length > 0 ||
      filters.last_post_timestamp !== null ||
      filters.creator_gender !== null ||
      filters.creator_language !== null ||
      filters.audience_gender !== null ||
      filters.audience_locations.length > 0
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <p className="text-black text-sm">Basic Filters</p>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="text-red-500 text-sm font-medium hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Basic Filters Group */}
      <div className="border-b border-gray-100">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedBasic(!expandedBasic)}
        >
          <h3 className="text-lg font-medium text-gray-800">Basic Filters</h3>
          {expandedBasic ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>

        {expandedBasic && (
          <div className="px-6 py-4 space-y-6">
            <LocationFilter
              value={filters.creator_locations}
              onChange={(value) =>
                handleFilterChange("creator_locations", value)
              }
            />

            <EngagementRateFilter
              value={filters.engagement}
              onChange={(value) => handleFilterChange("engagement", value)}
            />

            <SubscribersFilter
              value={filters.subscriber_count}
              onChange={(value) =>
                handleFilterChange("subscriber_count", value)
              }
            />

            <ContactDetailsFilter
              value={filters.specific_contact_details}
              onChange={(value) =>
                handleFilterChange("specific_contact_details", value)
              }
            />
          </div>
        )}
      </div>

      {/* Creator Filters Group */}
      <div className="border-b border-gray-100">
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedCreator(!expandedCreator)}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-800">Creator</h3>
            <p className="text-black text-sm">Advanced Filters</p>
          </div>
          {expandedCreator ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>

        {expandedCreator && (
          <CreatorFilterGroup
            filters={filters}
            updateFilter={handleFilterChange}
          />
        )}
      </div>

      {/* Audience Filters Group */}
      <div>
        <div
          className="px-6 py-4 flex justify-between items-center cursor-pointer"
          onClick={() => setExpandedAudience(!expandedAudience)}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-800">Audience</h3>
            <p className="text-black text-sm">Advanced Filters</p>
          </div>
          {expandedAudience ? (
            <ChevronUp className="w-5 h-5 text-black" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black" />
          )}
        </div>

        {expandedAudience && (
          <AudienceFilterGroup
            filters={filters}
            updateFilter={handleFilterChange}
          />
        )}
      </div>

      {/* Filter actions */}
      <div className="mt-6 flex justify-between">
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-black hover:text-gray-900"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
