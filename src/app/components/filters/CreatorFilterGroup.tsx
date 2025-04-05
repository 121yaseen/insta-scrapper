"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import RangeFilter from "./shared/RangeFilter";

interface CreatorFilterGroupProps {
  filters: any;
  updateFilter: (key: string, value: any) => void;
}

export default function CreatorFilterGroup({
  filters,
  updateFilter,
}: CreatorFilterGroupProps) {
  const [lastPostedOpen, setLastPostedOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const lastPostedRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lastPostedRef.current &&
        !lastPostedRef.current.contains(event.target as Node)
      ) {
        setLastPostedOpen(false);
      }
      if (
        genderRef.current &&
        !genderRef.current.contains(event.target as Node)
      ) {
        setGenderOpen(false);
      }
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Last Posted options
  const LAST_POSTED_OPTIONS = [
    { value: "7", label: "1 Week Ago" },
    { value: "30", label: "1 Month Ago" },
    { value: "90", label: "3 Months Ago" },
    { value: "180", label: "6 Months Ago" },
    { value: "365", label: "1 Year Ago" },
  ];

  // Gender options
  const GENDER_OPTIONS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
  ];

  // Language options
  const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
    { value: "hi", label: "Hindi" },
    { value: "ml", label: "Malayalam" },
  ];

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Last Posted */}
      <div className="space-y-2">
        <label className="block text-black font-medium">Last Posted</label>
        <div className="relative" ref={lastPostedRef}>
          <button
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
            onClick={() => setLastPostedOpen(!lastPostedOpen)}
          >
            <span className="text-black">
              {filters.last_post_timestamp
                ? LAST_POSTED_OPTIONS.find(
                    (opt) => opt.value === filters.last_post_timestamp
                  )?.label || filters.last_post_timestamp
                : "Select time period"}
            </span>
            {filters.last_post_timestamp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("last_post_timestamp", null);
                }}
                className="mr-2"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-black" />
          </button>

          {lastPostedOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {LAST_POSTED_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-black"
                  onClick={() => {
                    updateFilter("last_post_timestamp", option.value);
                    setLastPostedOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Count */}
      <RangeFilter
        label="Content Count"
        value={filters.content_count}
        onChange={(value) => updateFilter("content_count", value)}
        min={100}
        max={25000}
      />

      {/* Average Likes */}
      <RangeFilter
        label="Average Likes"
        value={filters.average_likes}
        onChange={(value) => updateFilter("average_likes", value)}
        min={100}
        max={25000}
      />

      {/* Average Views */}
      <RangeFilter
        label="Average Views"
        value={filters.average_views}
        onChange={(value) => updateFilter("average_views", value)}
        min={100}
        max={25000}
      />

      {/* Creator Gender */}
      <div className="space-y-2">
        <label className="block text-black font-medium">Creator Gender</label>
        <div className="relative" ref={genderRef}>
          <button
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
            onClick={() => setGenderOpen(!genderOpen)}
          >
            <span className="text-black">
              {filters.creator_gender
                ? GENDER_OPTIONS.find(
                    (opt) => opt.value === filters.creator_gender
                  )?.label || filters.creator_gender
                : "Select gender"}
            </span>
            {filters.creator_gender && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("creator_gender", null);
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
                  onClick={() => {
                    updateFilter("creator_gender", option.value);
                    setGenderOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creator Age */}
      <RangeFilter
        label="Creator Age"
        value={filters.creator_age}
        onChange={(value) => updateFilter("creator_age", value)}
        min={10}
        max={50}
      />

      {/* Creator Language */}
      <div className="space-y-2">
        <label className="block text-black font-medium">Creator Language</label>
        <div className="relative" ref={languageRef}>
          <button
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
            onClick={() => setLanguageOpen(!languageOpen)}
          >
            <span className="text-black">
              {filters.creator_language
                ? LANGUAGE_OPTIONS.find(
                    (opt) => opt.value === filters.creator_language
                  )?.label || filters.creator_language
                : "Select language"}
            </span>
            {filters.creator_language && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateFilter("creator_language", null);
                }}
                className="mr-2"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-black" />
          </button>

          {languageOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {LANGUAGE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-black"
                  onClick={() => {
                    updateFilter("creator_language", option.value);
                    setLanguageOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
