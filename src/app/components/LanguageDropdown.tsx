"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Language {
  code: string;
  name: string;
}

interface LanguageDropdownProps {
  languages: Language[];
  selectedLanguage: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function LanguageDropdown({
  languages,
  selectedLanguage,
  onChange,
  placeholder = "Select language",
  label,
  className = "",
  disabled = false,
}: LanguageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom"
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter languages based on search term
  const filteredLanguages = languages.filter((lang) =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected language name
  const selectedLanguageName =
    languages.find((lang) => lang.code === selectedLanguage)?.name || "";

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;

      // If there's not enough space below and more space above, position above
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen, searchTerm]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        className={`w-full flex items-center justify-between bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span
          className={`block truncate ${
            !selectedLanguage ? "text-gray-400" : ""
          }`}
        >
          {selectedLanguageName || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-10 w-full bg-white shadow-lg max-h-60 rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden ${
            dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="sticky top-0 z-10 px-2 py-2 bg-white border-b border-gray-100">
            <div className="flex items-center px-2 bg-gray-50 rounded-md">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full py-1 px-2 bg-transparent border-none focus:ring-0 focus:outline-none text-sm"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                No languages found
              </div>
            ) : (
              <ul>
                {filteredLanguages.map((language) => (
                  <li
                    key={language.code}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedLanguage === language.code
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                    onClick={() => {
                      onChange(language.code);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {language.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
