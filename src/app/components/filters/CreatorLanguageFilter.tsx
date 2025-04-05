"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import LanguageDropdown from "../LanguageDropdown";

interface CreatorLanguageFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  disabled?: boolean;
}

export default function CreatorLanguageFilter({
  value,
  onChange,
  label = "Creator Language",
  disabled = false,
}: CreatorLanguageFilterProps) {
  const [languages, setLanguages] = useState<{ code: string; name: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumWarning, setShowPremiumWarning] = useState(false);

  // Fetch languages from our dedicated API endpoint
  useEffect(() => {
    async function fetchLanguages() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/youtube/languages");

        if (!response.ok) {
          throw new Error(`Error fetching languages: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.languages && Array.isArray(data.languages)) {
          setLanguages(data.languages);
        } else {
          setError("Invalid language data format");
        }
      } catch (err) {
        console.error("Error fetching languages:", err);
        setError("Failed to load languages");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLanguages();
  }, []);

  const handleChange = (code: string) => {
    // Show premium warning when a language is selected
    if (code) {
      setShowPremiumWarning(true);
    } else {
      setShowPremiumWarning(false);
    }
    onChange(code || null);
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="w-full h-10 bg-gray-100 animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <LanguageDropdown
        languages={languages}
        selectedLanguage={value || ""}
        onChange={handleChange}
        placeholder="Any language"
        label={label}
        disabled={disabled}
      />

      {value && (
        <div className="mt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setShowPremiumWarning(false);
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {showPremiumWarning && (
        <div className="mt-2 flex items-start text-xs text-amber-700 bg-amber-50 p-2 rounded">
          <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <p>
            This filter may require a premium plan. If you receive an "Access
            Limited" error, try removing this filter.
          </p>
        </div>
      )}
    </div>
  );
}
