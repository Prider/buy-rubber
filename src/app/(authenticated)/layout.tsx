import type { ReactNode } from 'react';
import Layout from '@/components/Layout';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
