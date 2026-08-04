'use client';

import ActivateLicenseForm from '@/components/ActivateLicenseForm';
import { useLicense } from '@/contexts/LicenseContext';
import GamerLoader from '@/components/GamerLoader';

export default function ActivatePage() {
  const { isLoading, awaitingAcknowledgment } = useLicense();

  // Keep the form mounted after a successful submit (awaitingAcknowledgment),
  // even if a background license check flips isLoading.
  if (isLoading && !awaitingAcknowledgment) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <GamerLoader fullScreen message="กำลังโหลด..." />
      </div>
    );
  }

  return <ActivateLicenseForm redirectTo="/login" />;
}
