'use client';

import { QuickFilter } from '@/types/memberHistory';

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: number | null;
  onFilterSelect: (value: number | null) => void;
}

export const QuickFilters = ({ filters, activeFilter, onFilterSelect }: QuickFiltersProps) => (
  <div className="flex flex-wrap gap-2">
    {filters.map((filter) => {
      const isActive = activeFilter === filter.value;
      return (
        <button
          key={filter.value ?? 'all'}
          onClick={() => onFilterSelect(filter.value)}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
            isActive
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
          }`}
        >
          {filter.label}
        </button>
      );
    })}
  </div>
);

