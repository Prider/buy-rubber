'use client';

import { useEffect, useState } from 'react';
import GamerLoader from '@/shared/ui/GamerLoader';
import SalesFormCard from '@/industries/rubber/ui/sales/SalesFormCard';
import SalesTable from '@/industries/rubber/ui/sales/SalesTable';
import { useSalesPageController } from './useSalesPageController';

export default function SalesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {
    isLoading,
    loading,
    listLoading,
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
    companySearchTerm,
    showCompanyDropdown,
    filteredCompanies,
    setShowCompanyDropdown,
    handleCompanySearchChange,
    handleCompanySelect,
    clearCompanySearch,
    handleAddExpense,
    handleRemoveExpense,
    handleClearExpenses,
    handleExpenseChange,
    setCurrentPage,
    handleSearchChange,
    handleClearSearch,
    handleInputChange,
    handleSave,
    handleEdit,
    handleDelete,
    resetForm,
  } = useSalesPageController();

  const closeForm = () => {
    if (saving) return;
    resetForm();
    setIsFormOpen(false);
  };

  const openNewSale = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditSale: typeof handleEdit = async (row) => {
    const closing = editingSaleId === row.id;
    await handleEdit(row);
    setIsFormOpen(!closing);
  };

  const handleSaveAndClose = async () => {
    const saved = await handleSave();
    if (!saved) return;
    resetForm();
    setIsFormOpen(false);
  };

  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || showCompanyDropdown || saving) return;
      resetForm();
      setIsFormOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFormOpen, resetForm, saving, showCompanyDropdown]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GamerLoader className="py-12" message="กำลังโหลด..." />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="relative z-0 flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <SalesTable
            compact
            sales={paginatedSales}
            pagination={pagination}
            loading={listLoading || saving}
            searchTerm={searchTerm}
            editingSaleId={editingSaleId}
            deletingSaleId={deletingSaleId}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onEdit={handleEditSale}
            onDelete={handleDelete}
            onAddSale={openNewSale}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[1100] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeForm} aria-hidden="true" />
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6 sm:pb-28">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sales-form-title"
              className="relative w-[min(96vw,1400px)]"
            >
              <SalesFormCard
                compact
                error={error}
                fieldErrors={fieldErrors}
                hasValidationError={hasValidationError}
                productTypes={productTypes}
                formData={formData}
                selectedStockKg={selectedStockInfo?.quantityKg ?? null}
                selectedAvgCostPerKg={selectedStockInfo?.avgCostPerKg ?? null}
                saving={saving}
                isEditing={Boolean(editingSaleId)}
                editingSaleNo={editingSaleNo}
                companySearchTerm={companySearchTerm}
                showCompanyDropdown={showCompanyDropdown}
                filteredCompanies={filteredCompanies}
                onCompanySearchChange={handleCompanySearchChange}
                onCompanySelect={handleCompanySelect}
                onClearCompanySearch={clearCompanySearch}
                onShowCompanyDropdown={setShowCompanyDropdown}
                onAddExpense={handleAddExpense}
                onRemoveExpense={handleRemoveExpense}
                onClearExpenses={handleClearExpenses}
                onExpenseChange={handleExpenseChange}
                onInputChange={handleInputChange}
                onSave={handleSaveAndClose}
                onCancelEdit={closeForm}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
