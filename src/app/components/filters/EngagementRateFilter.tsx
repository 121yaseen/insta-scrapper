"use client";

import { useState, useEffect } from "react";

interface EngagementRateFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function EngagementRateFilter({
  value,
  onChange,
}: EngagementRateFilterProps) {
  const [sliderValue, setSliderValue] = useState<number>(value || 0);

  // Update internal state when external value changes
  useEffect(() => {
    setSliderValue(value || 0);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setSliderValue(newValue);
  };

  const handleChangeCommitted = () => {
    onChange(sliderValue > 0 ? sliderValue : null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-black font-medium">Engagement Rate</label>

      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-green-500">0%</span>
          <span className="text-green-500">100%</span>
        </div>

        <div className="relative">
          {/* Background line */}
          <div className="absolute inset-0 h-1 top-1/2 -translate-y-1/2 bg-gray-200 rounded"></div>

          {/* Colored part */}
          <div
            className="absolute h-1 top-1/2 -translate-y-1/2 bg-green-500 rounded"
            style={{ width: `${sliderValue}%` }}
          ></div>

          {/* Slider input */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleChange}
            onMouseUp={handleChangeCommitted}
            onTouchEnd={handleChangeCommitted}
            className="w-full h-6 appearance-none bg-transparent cursor-pointer"
            style={{
              // Custom thumb styling
              WebkitAppearance: "none",
            }}
          />

          {/* Custom thumb */}
          <div
            className="absolute w-6 h-6 bg-white border-2 border-green-500 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${sliderValue}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
