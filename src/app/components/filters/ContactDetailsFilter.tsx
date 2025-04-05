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
      <label className="block text-black font-medium">Contact Details</label>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
        >
          <span className="text-black">
            {value.length > 0
              ? `${value.length} selected`
              : "Select contact details"}
          </span>
          <ChevronDown className="w-4 h-4 text-black" />
        </button>

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
                <span className="text-black">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
