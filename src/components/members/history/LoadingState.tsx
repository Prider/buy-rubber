'use client';

import GamerLoader from '@/components/GamerLoader';

export const LoadingState = () => (
  <div className="py-10">
    <GamerLoader message="กำลังโหลดข้อมูล..." />
  </div>
);

