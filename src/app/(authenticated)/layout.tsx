import type { ReactNode } from 'react';
import Layout from '@/shared/layout/Layout';
import { rubberNav } from '@/industries/rubber/nav';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <Layout navItems={rubberNav}>{children}</Layout>;
}
