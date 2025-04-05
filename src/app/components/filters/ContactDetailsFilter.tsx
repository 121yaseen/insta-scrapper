"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface ContactDetail {
  type: string;
}

interface ContactDetailsFilterProps {
  value: ContactDetail[];
  onChange: (value: ContactDetail[]) => void;
}

const CONTACT_TYPES = [
  { value: "INSTAGRAM", label: "INSTAGRAM" },
  { value: "PHONE", label: "PHONE" },
  { value: "FACEBOOK", label: "FACEBOOK" },
  { value: "EMAIL", label: "EMAIL" },
  { value: "TWITTER", label: "TWITTER" },
];

export default function ContactDetailsFilter({
  value,
  onChange,
}: ContactDetailsFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleToggleContactType = (type: string) => {
    const exists = value.some((item) => item.type === type);

    if (exists) {
      onChange(value.filter((item) => item.type !== type));
    } else {
      onChange([...value, { type }]);
    }
  };

  // Get selected types for easier display
  const selectedTypes = value.map((item) => item.type);

  return (
    <div className="space-y-2">
      <label className="block text-gray-700 font-medium">Contact Details</label>

      <div className="relative" ref={dropdownRef}>
        {/* Selected contact types display */}
        <div
          className="border border-gray-200 rounded-lg p-2 min-h-[42px] flex flex-wrap gap-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedTypes.length > 0 ? (
            selectedTypes.map((type) => (
              <div
                key={type}
                className="flex items-center bg-gray-100 rounded-full pl-3 pr-1 py-1"
              >
                <span className="text-sm">{type}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleContactType(type);
                  }}
                  className="ml-1 rounded-full p-1 hover:bg-gray-200"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between w-full text-gray-500">
              <span>Select contact details</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {CONTACT_TYPES.map(({ value: type, label }) => (
              <div
                key={type}
                onClick={() => handleToggleContactType(type)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
