import { formatCurrency } from '@/lib/utils';

interface TodayPricesCardProps {
  productTypes: any[];
  todayPrices: any[];
}

export default function TodayPricesCard({ productTypes, todayPrices }: TodayPricesCardProps) {

  const getPriceForProductType = (productTypeId: string) => {
    const priceRecord = todayPrices.find((p: any) => p.productTypeId === productTypeId);
    return priceRecord?.price || null;
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-sm border border-amber-200/50 dark:border-amber-800/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ชนิดยาง
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('th-TH', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        {/* <button
          onClick={() => router.push('/prices')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">ตั้งราคา</span>
        </button> */}
      </div>
      
      {productTypes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {productTypes.map((productType: any) => {
            const price = getPriceForProductType(productType.id);
            return (
              <div
                key={productType.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md">
                    {productType.code}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 truncate" title={productType.name}>
                  {productType.name}
                </div>
                {price !== null ? (
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(price)}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-600 italic font-medium">
                    ยังไม่ได้ตั้งราคา
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">ยังไม่มีประเภทสินค้า</p>
        </div>
      )}
    </div>
  );
}

