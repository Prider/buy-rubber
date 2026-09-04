import React from 'react';
import Logo from './Logo';

interface GamerLoaderProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function GamerLoader({ fullScreen = false, message = ' กำลังโหลด...', className = '' }: GamerLoaderProps) {
  return (
    <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center' : ''} ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Logo className="h-14 w-auto animate-swim" />
          <Logo className="h-14 w-auto animate-swim [animation-delay:150ms]" />
          <Logo className="h-14 w-auto animate-swim [animation-delay:300ms]" />
        </div>
        <p className="mt-5 text-lg md:text-xl tracking-widest font-extrabold text-gray-700 dark:text-gray-200">
          <span className="text-fuchsia-500 dark:text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)] dark:drop-shadow-[0_0_6px_rgba(236,72,153,0.3)]">P</span>
          <span className="text-violet-500 dark:text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)] dark:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]">u</span>
          <span className="text-sky-500 dark:text-sky-400 drop-shadow-[0_0_6px_rgba(14,165,233,0.6)] dark:drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]">n</span>
          <span className="text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] dark:drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">s</span>
          <span className="text-amber-500 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)] dark:drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]">o</span>
          <span className="text-fuchsia-500 dark:text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)] dark:drop-shadow-[0_0_6px_rgba(236,72,153,0.3)]">o</span>
          <span className="text-violet-500 dark:text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)] dark:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]">k</span>
          <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
          <span className="text-sky-500 dark:text-white">Innotech</span>
          <span className="ml-2 dark:text-gray-300">• {message}</span>
        </p>
      </div>
    </div>
  );
}

export default GamerLoader;

