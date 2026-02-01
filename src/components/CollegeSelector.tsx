"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface College {
  id: string;
  name: string;
  short_name?: string;
  city: string;
  state: string;
}

interface CollegeSelectorProps {
  value?: string;
  onChange: (collegeId: string, collegeName: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export function CollegeSelector({
  value,
  onChange,
  error,
  placeholder = "Search for your college...",
  required = false,
}: CollegeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      if (searchQuery.trim().length < 2) {
        setColleges([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setApiError(null);

      try {
        const response = await fetch(
          `/api/colleges?search=${encodeURIComponent(searchQuery)}&limit=50`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch colleges");
        }

        const data = await response.json();
        setColleges(data.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error("Error fetching colleges:", err);
        setApiError("Failed to load colleges. Please try again.");
        setColleges([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchColleges, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (college: College) => {
    setSelectedCollege(college);
    onChange(college.id, college.name);
    setSearchQuery(college.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedCollege(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => colleges.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
        />
      </div>

      {loading && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Searching colleges...
          </div>
        </div>
      )}

      {isOpen && !loading && colleges.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {colleges.map((college) => (
            <button
              key={college.id}
              type="button"
              onClick={() => handleSelect(college)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {college.name}
                {college.short_name && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    ({college.short_name})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {college.city}, {college.state}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen &&
        !loading &&
        searchQuery.length >= 2 &&
        colleges.length === 0 &&
        !apiError && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
              No colleges found matching "{searchQuery}"
            </p>
            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
              Can't find your college?{" "}
              <button
                type="button"
                className="text-blue-500 hover:underline"
              >
                Request to add it
              </button>
            </p>
          </div>
        )}

      {apiError && (
        <div className="absolute z-50 w-full mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 text-center text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
