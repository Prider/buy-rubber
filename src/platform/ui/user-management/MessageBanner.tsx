'use client';

interface MessageBannerProps {
  variant: 'error' | 'success';
  message: string;
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ variant, message }) => {
  if (!message) {
    return null;
  }

  const styles =
    variant === 'error'
      ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      : 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';

  return <div className={`${styles} px-4 py-3 rounded-lg`}>{message}</div>;
};


