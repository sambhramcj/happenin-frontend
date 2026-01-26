'use client';

import { useState, useEffect, useRef } from 'react';
import { Icons } from './icons';

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface CollegeAutoSuggestProps {
  onSelect: (college: College) => void;
  placeholder?: string;
  className?: string;
}

export function CollegeAutoSuggest({ 
  onSelect, 
  placeholder = "Search colleges...",
  className = "" 
}: CollegeAutoSuggestProps) {
  const [query, setQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchColleges = async () => {
      if (query.length < 2) {
        setColleges([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/colleges?search=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        if (data.data) {
          setColleges(data.data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching colleges:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchColleges, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (college: College) => {
    onSelect(college);
    setQuery(college.name);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-bg-muted border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {showDropdown && colleges.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-bg-card border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {colleges.map((college) => (
            <button
              key={college.id}
              onClick={() => handleSelect(college)}
              className="w-full px-4 py-3 text-left hover:bg-bg-muted transition-colors border-b border-border-default last:border-0"
            >
              <div className="font-medium text-text-primary">{college.name}</div>
              <div className="text-sm text-text-muted flex items-center gap-1 mt-1">
                <Icons.MapPin className="h-3 w-3" />
                {college.city}, {college.state}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 2 && colleges.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-bg-card border border-border-default rounded-lg shadow-lg p-4 text-center text-text-muted">
          No colleges found
        </div>
      )}
    </div>
  );
}
