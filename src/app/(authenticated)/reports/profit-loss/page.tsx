import { redirect } from 'next/navigation';

export default function ProfitLossReportPage() {
  redirect('/reports?tab=profit_loss');
}
