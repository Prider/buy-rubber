'use client';

import React from 'react';
import { ListPagination } from '@/components/pagination/ListPagination';
import { PaginationInfo } from './types';

interface PurchasesListPaginationProps {
  pagination: PaginationInfo;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export const PurchasesListPagination: React.FC<PurchasesListPaginationProps> = ({
  pagination,
  loading,
  onPageChange,
}) => (
  <ListPagination
    pagination={pagination}
    loading={loading}
    onPageChange={onPageChange}
  />
);
