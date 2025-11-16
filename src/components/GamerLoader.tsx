import React from 'react';

interface GamerLoaderProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function GamerLoader({ fullScreen = false, message = 'GAMER MODE • กำลังโหลด...', className = '' }: GamerLoaderProps) {
  return (
    <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center' : ''} ${className}`}>
      <div className="text-center">
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-fuchsia-500 via-violet-500 to-sky-500 blur-lg opacity-70 animate-pulse" style={{ animationDuration: '2.4s' }}></div>
          <div className="relative w-full h-full rounded-xl bg-gray-900 dark:bg-black flex items-center justify-center shadow-[0_0_28px_rgba(139,92,246,0.45)]">
            <svg className="w-10 h-10 text-fuchsia-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)] animate-pulse" style={{ animationDuration: '2.4s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6M9 12h6m-6 5h6" />
            </svg>
          </div>
        </div>
        <div className="flex items-end justify-center gap-1.5 h-12">
          <span className="w-3 bg-fuchsia-500 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite] shadow-[0_0_14px_rgba(217,70,239,0.75)]" style={{ height: '40%' }} />
          <span className="w-3 bg-violet-500 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.15s] shadow-[0_0_14px_rgba(139,92,246,0.75)]" style={{ height: '70%' }} />
          <span className="w-3 bg-sky-500 rounded-sm animate-[bounce_1.8s_ease-in-out_infinite_0.3s] shadow-[0_0_14px_rgba(14,165,233,0.75)]" style={{ height: '55%' }} />
          <span className="w-3 bg-emerald-500 rounded-sm animate-[bounce_1.7s_ease-in-out_infinite_0.45s] shadow-[0_0_14px_rgba(16,185,129,0.75)]" style={{ height: '80%' }} />
          <span className="w-3 bg-amber-500 rounded-sm animate-[bounce_1.6s_ease-in-out_infinite_0.6s] shadow-[0_0_14px_rgba(245,158,11,0.75)]" style={{ height: '50%' }} />
        </div>
        <p className="mt-5 text-lg md:text-xl tracking-widest font-extrabold text-gray-700 dark:text-gray-300">
          <span className="text-fuchsia-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]">P</span>
          <span className="text-violet-500 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]">u</span>
          <span className="text-sky-500 drop-shadow-[0_0_6px_rgba(14,165,233,0.6)]">n</span>
          <span className="text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">s</span>
          <span className="text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]">o</span>
          <span className="text-fuchsia-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]">o</span>
          <span className="text-violet-500 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)]">k</span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="text-sky-500 drop-shadow-[0_0_6px_rgba(14,165,233,0.6)]">Innotech</span>
          <span className="ml-2">• {message}</span>
        </p>
      </div>
    </div>
  );
}

export default GamerLoader;

