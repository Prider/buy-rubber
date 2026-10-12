'use client';

import React from 'react';
import { ListPagination } from '@/components/pagination/ListPagination';
import { PaginationInfo } from './types';

interface PurchasesListPaginationProps {
  pagination: PaginationInfo;
  loading: boolean;
  onPageChange: (page: number) => void;
  embedded?: boolean;
}

export const PurchasesListPagination: React.FC<PurchasesListPaginationProps> = ({
  pagination,
  loading,
  onPageChange,
  embedded = false,
}) => (
  <ListPagination
    pagination={pagination}
    loading={loading}
    onPageChange={onPageChange}
    embedded={embedded}
  />
);
