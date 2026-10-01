import { redirect } from 'next/navigation';

type GangsPageProps = {
  searchParams?: { productTypeId?: string | string[] };
};

export default function ProfitLossGangsReportPage({ searchParams }: GangsPageProps) {
  const raw = searchParams?.productTypeId;
  const productTypeId = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const query = new URLSearchParams({ tab: 'profit_loss_gangs' });
  if (productTypeId) query.set('productTypeId', productTypeId);
  redirect(`/reports?${query.toString()}`);
}
