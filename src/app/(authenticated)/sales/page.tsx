'use client';

import GamerLoader from '@/components/GamerLoader';
import SalesFormCard from '@/components/sales/SalesFormCard';
import SalesTable from '@/components/sales/SalesTable';
import { useSalesPageController } from './useSalesPageController';

export default function SalesPage() {
  const {
    isLoading,
    loading,
    saving,
    error,
    fieldErrors,
    productTypes,
    formData,
    paginatedSales,
    pagination,
    searchTerm,
    editingSaleId,
    deletingSaleId,
    selectedStockInfo,
    editingSaleNo,
    hasValidationError,
    isSubmitReady,
    setCurrentPage,
    handleSearchChange,
    handleClearSearch,
    handleInputChange,
    handleSave,
    handleEdit,
    handleDelete,
    resetForm,
  } = useSalesPageController();

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="w-full min-w-0 shrink-0 overflow-x-auto">
        <SalesFormCard
          compact
          error={error}
          fieldErrors={fieldErrors}
          hasValidationError={hasValidationError}
          isSubmitReady={isSubmitReady}
          productTypes={productTypes}
          formData={formData}
          selectedStockKg={selectedStockInfo?.quantityKg ?? null}
          selectedAvgCostPerKg={selectedStockInfo?.avgCostPerKg ?? null}
          saving={saving}
          isEditing={Boolean(editingSaleId)}
          editingSaleNo={editingSaleNo}
          onInputChange={handleInputChange}
          onSave={handleSave}
          onCancelEdit={resetForm}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SalesTable
          compact
          sales={paginatedSales}
          pagination={pagination}
          loading={loading || saving}
          searchTerm={searchTerm}
          editingSaleId={editingSaleId}
          deletingSaleId={deletingSaleId}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

