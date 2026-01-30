"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  isOpen?: boolean;
}

export interface FilterState {
  searchQuery: string;
  date?: string;
  location?: string;
  priceRange: "all" | "free" | "0-500" | "500-1000" | "1000+";
  teamSize?: "individual" | "2-5" | "5-10" | "10+";
}

export function SearchFilters({ onFilterChange, isOpen = false }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    priceRange: "all",
  });
  const [showFilters, setShowFilters] = useState(isOpen);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
            className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 pl-10 text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg transition-all ${
            showFilters
              ? "bg-primary text-text-inverse"
              : "bg-bg-muted text-text-secondary hover:text-text-primary"
          }`}
          title="Toggle filters"
        >
          <Icons.Upload className="h-5 w-5" />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-bg-card rounded-xl p-4 border border-border-default space-y-4">
          {/* Date filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Date</label>
            <input
              type="date"
              value={filters.date || ""}
              onChange={(e) => handleFilterChange({ date: e.target.value })}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Location filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
            <input
              type="text"
              placeholder="City or venue..."
              value={filters.location || ""}
              onChange={(e) => handleFilterChange({ location: e.target.value })}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Price filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "all", label: "All Prices" },
                { value: "free", label: "Free" },
                { value: "0-500", label: "₹0 - ₹500" },
                { value: "500-1000", label: "₹500 - ₹1000" },
                { value: "1000+", label: "₹1000+" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange({ priceRange: option.value as any })}
                  className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    filters.priceRange === option.value
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-muted text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Team size filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Team Size</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "individual", label: "Individual" },
                { value: "2-5", label: "2-5 People" },
                { value: "5-10", label: "5-10 People" },
                { value: "10+", label: "10+ People" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange({ teamSize: option.value as any })}
                  className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    filters.teamSize === option.value
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-muted text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          <button
            onClick={() => {
              setFilters({ searchQuery: "", priceRange: "all" });
              onFilterChange({ searchQuery: "", priceRange: "all" });
            }}
            className="w-full px-4 py-2 bg-bg-muted text-text-secondary rounded-lg hover:text-text-primary transition-all font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
