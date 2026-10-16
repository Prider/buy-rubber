import { formatCurrency } from '@/lib/utils';
import DashboardHeading from './DashboardHeading';

interface PriceStripProps {
  productTypes: Array<{ id: string; code: string; name: string }>;
  todayPrices: Array<{ productTypeId: string; price: number | null }>;
}

export default function PriceStrip({ productTypes, todayPrices }: PriceStripProps) {
  const priceByType = new Map(todayPrices.map((price) => [price.productTypeId, price.price]));

  return (
    <section className="rounded-2xl border border-amber-200/70 bg-white p-3 shadow-sm dark:border-amber-900/40 dark:bg-gray-800 md:p-4">
      <DashboardHeading tone="amber">ราคาวันนี้</DashboardHeading>
      {productTypes.length > 0 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {productTypes.map((productType) => {
            const price = priceByType.get(productType.id);
            const hasPrice = price !== null && price !== undefined;
            return (
              <div
                key={productType.id}
                className="min-w-[8.5rem] shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <p className="truncate text-sm font-semibold text-gray-950 dark:text-white" title={productType.name}>
                  {productType.name}
                </p>
                <p className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-200">{productType.code}</p>
                {hasPrice ? (
                  <p className="mt-1 text-sm font-bold tabular-nums text-amber-800 dark:text-amber-200">
                    {formatCurrency(price)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">ยังไม่ตั้งราคา</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">ยังไม่มีประเภทสินค้า</p>
      )}
    </section>
  );
}
