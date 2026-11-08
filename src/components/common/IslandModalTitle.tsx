'use client';

import { CloseButton } from '@/components/common/CloseButton';

interface IslandModalTitleProps {
  title: string;
  onClose: () => void;
}

export function IslandModalTitle({ title, onClose }: IslandModalTitleProps) {
  return (
    <span className="relative block w-full px-16 text-center">
      <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient dark:from-primary-400 dark:via-purple-400 dark:to-blue-400">
        {title}
      </span>
      <span className="absolute right-0 top-1/2 -translate-y-1/2">
        <CloseButton onClick={onClose} />
      </span>
    </span>
  );
}
