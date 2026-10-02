'use client';

import { useEffect, useState } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(text);
      return;
    }

    setShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
      }
    }, 42);

    return () => window.clearInterval(id);
  }, [text]);

  return (
    <p className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {shown}
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-current animate-pulse" />
      </span>
    </p>
  );
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <div className="flex min-w-0 items-start gap-3 sm:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg sm:h-12 sm:w-12">
        <svg className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="min-w-0 space-y-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 dark:from-primary-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient">
            {title}
          </span>
        </h1>
        <TypewriterText
          text={subtitle}
          className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm"
        />
      </div>
    </div>
  );
}
