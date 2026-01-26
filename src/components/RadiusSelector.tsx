'use client';

import { Icons } from './icons';

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
  className?: string;
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

export function RadiusSelector({ value, onChange, className = '' }: RadiusSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-text-primary flex items-center gap-2">
        <Icons.Navigation className="h-4 w-4" />
        Search Radius
      </label>
      <div className="flex gap-2">
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === option.value
                ? 'bg-primary text-text-inverse'
                : 'bg-bg-muted text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
