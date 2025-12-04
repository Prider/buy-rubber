import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for managing page-level state (search, pagination, auto-open modal)
 * Separates URL query handling and state management
 */
export const useMemberPageState = () => {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Check query parameter ONCE on mount for auto-opening modal
  useEffect(() => {
    const shouldShowModal = searchParams?.get('showAddModal');
    if (shouldShowModal === 'true') {
      setShouldAutoOpen(true);
      // Clean URL immediately
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('showAddModal');
          window.history.replaceState({}, '', url.toString());
        } catch (e) {
          console.error('Error cleaning URL:', e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY once on mount

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    shouldAutoOpen,
    setShouldAutoOpen,
    clearSearch,
  };
};

