"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface RangeValue {
  min: number;
  max: number;
}

interface RangeFilterProps {
  label: string;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  min?: number;
  max?: number;
}

export default function RangeFilter({
  label,
  value,
  onChange,
  min = 0,
  max = 100000,
}: RangeFilterProps) {
  const [showMinDropdown, setShowMinDropdown] = useState(false);
  const [showMaxDropdown, setShowMaxDropdown] = useState(false);

  // Generate options based on min/max range
  const generateOptions = (min: number, max: number) => {
    const result = [];
    let current = min;

    while (current <= max) {
      result.push(current);

      // Increase by different amounts based on the range
      if (current < 1000) {
        current += 100;
      } else if (current < 10000) {
        current += 1000;
      } else if (current < 100000) {
        current += 5000;
      } else {
        current += 10000;
      }
    }

    // Make sure max is included
    if (result[result.length - 1] !== max) {
      result.push(max);
    }

    return result;
  };

  const minOptions = generateOptions(min, value.max);
  const maxOptions = generateOptions(value.min, max);

  const handleMinChange = (newMin: number) => {
    onChange({ ...value, min: newMin });
    setShowMinDropdown(false);
  };

  const handleMaxChange = (newMax: number) => {
    onChange({ ...value, max: newMax });
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
      <label className="block text-gray-700 font-medium">{label}</label>

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
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {minOptions.map((option) => (
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
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {maxOptions.map((option) => (
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
