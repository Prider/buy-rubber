import React from 'react';

interface GamerLoaderProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function GamerLoader({ fullScreen = false, message = 'Punsook Innotech • กำลังโหลด...', className = '' }: GamerLoaderProps) {
  return (
    <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center' : ''} ${className}`}>
      <div className="text-center">
        <div className="flex items-end justify-center gap-1.5 h-12">
          <span className="w-3 bg-fuchsia-500 dark:bg-fuchsia-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite] shadow-[0_0_14px_rgba(217,70,239,0.75)] dark:shadow-[0_0_14px_rgba(217,70,239,0.4)]" style={{ height: '40%' }} />
          <span className="w-3 bg-violet-500 dark:bg-violet-600 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.15s] shadow-[0_0_14px_rgba(139,92,246,0.75)] dark:shadow-[0_0_14px_rgba(139,92,246,0.4)]" style={{ height: '70%' }} />
          <span className="w-3 bg-sky-500 dark:bg-sky-600 rounded-sm animate-[bounce_1.8s_ease-in-out_infinite_0.3s] shadow-[0_0_14px_rgba(14,165,233,0.75)] dark:shadow-[0_0_14px_rgba(14,165,233,0.4)]" style={{ height: '55%' }} />
          <span className="w-3 bg-emerald-500 dark:bg-emerald-600 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.45s] shadow-[0_0_14px_rgba(16,185,129,0.75)] dark:shadow-[0_0_14px_rgba(16,185,129,0.4)]" style={{ height: '80%' }} />
          <span className="w-3 bg-amber-500 dark:bg-amber-600 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite_0.6s] shadow-[0_0_14px_rgba(245,158,11,0.75)] dark:shadow-[0_0_14px_rgba(245,158,11,0.4)]" style={{ height: '50%' }} />
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
          <span className="text-sky-500 dark:text-sky-400 drop-shadow-[0_0_6px_rgba(14,165,233,0.6)] dark:drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]">Innotech</span>
          <span className="ml-2 dark:text-gray-300">• {message}</span>
        </p>
      </div>
    </div>
  );
}

export default GamerLoader;

