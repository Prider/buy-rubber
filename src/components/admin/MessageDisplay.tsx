import React from 'react';

interface MessageDisplayProps {
  connectionError: string;
  successMessage: string;
  copySuccess: string;
}

function Notice({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <p role="status" className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function MessageDisplay({ connectionError, successMessage, copySuccess }: MessageDisplayProps) {
  const copyFailed = copySuccess.startsWith('ไม่');
  if (!connectionError && !successMessage && !copyFailed) {
    return null;
  }

  return (
    <div className="space-y-2">
      {connectionError && (
        <Notice className="bg-red-50 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
          {connectionError}
        </Notice>
      )}
      {successMessage && (
        <Notice className="bg-green-50 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-950/40 dark:text-green-200 dark:ring-green-900">
          {successMessage}
        </Notice>
      )}
      {copyFailed && (
        <Notice className="bg-red-50 text-red-800 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900">
          {copySuccess}
        </Notice>
      )}
    </div>
  );
}
