'use client';

import { QuickFilter } from '@/types/memberHistory';

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: number | null;
  onFilterSelect: (value: number | null) => void;
}

export const QuickFilters = ({ filters, activeFilter, onFilterSelect }: QuickFiltersProps) => (
  <div className="flex flex-wrap gap-1.5">
    {filters.map((filter) => {
      const isActive = activeFilter === filter.value;
      return (
        <button
          key={filter.value ?? 'all'}
          type="button"
          onClick={() => onFilterSelect(filter.value)}
          className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            isActive
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
        >
          {filter.label}
        </button>
      );
    })}
  </div>
);

