"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface RangeValue {
  min: number;
  max: number;
}

interface SubscribersFilterProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
}

// Predefined values for dropdown
const MIN_OPTIONS = [100, 500, 1000, 5000, 10000];
const MAX_OPTIONS = [10000, 50000, 100000, 500000, 1000000];

export default function SubscribersFilter({
  value,
  onChange,
}: SubscribersFilterProps) {
  const [showMinDropdown, setShowMinDropdown] = useState(false);
  const [showMaxDropdown, setShowMaxDropdown] = useState(false);

  const handleMinChange = (min: number) => {
    onChange({ ...value, min });
    setShowMinDropdown(false);
  };

  const handleMaxChange = (max: number) => {
    onChange({ ...value, max });
    setShowMaxDropdown(false);
  };

  // Format number with K or M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K";
    }
    return num.toString();
  };

  return (
    <div className="space-y-2">
      <label className="block text-gray-700 font-medium">Subscribers</label>

      <div className="grid grid-cols-2 gap-4">
        {/* Min dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMinDropdown(!showMinDropdown)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
          >
            <span>{formatNumber(value.min)}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showMinDropdown && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {MIN_OPTIONS.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleMinChange(option)}
                >
                  {formatNumber(option)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Max dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMaxDropdown(!showMaxDropdown)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
          >
            <span>{formatNumber(value.max)}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showMaxDropdown && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {MAX_OPTIONS.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleMaxChange(option)}
                >
                  {formatNumber(option)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
