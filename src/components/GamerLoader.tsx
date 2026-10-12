import React from 'react';

interface GamerLoaderProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

function Wheel({ cx, cy, delay }: { cx: number; cy: number; delay?: string }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g
        className={`animate-wheel motion-reduce:animate-none ${delay ? `[animation-delay:${delay}]` : ''}`}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <circle r="5.2" className="fill-gray-800 dark:fill-gray-200" />
        <circle r="3.1" className="fill-gray-400 dark:fill-gray-500" />
        <circle r="1.35" className="fill-gray-800 dark:fill-gray-900" />
        <path
          d="M0-2.5v5"
          className="stroke-gray-800 dark:stroke-gray-900"
          strokeWidth="1.15"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  );
}

function RunningTruck({ colorClass, delay }: { colorClass: string; delay?: string }) {
  const delayClass = delay ? `[animation-delay:${delay}]` : '';

  return (
    <svg
      viewBox="0 0 68 34"
      className={`h-14 w-auto overflow-visible animate-truck motion-reduce:animate-none ${delayClass} ${colorClass}`}
      aria-hidden="true"
    >
      <rect x="0.5" y="6" width="38" height="16" rx="2" fill="currentColor" />
      <rect x="4" y="9.5" width="31" height="2" rx="0.5" className="fill-white/30" />
      <path d="M38.5 12.5h12.5l9 7.5v2H38.5v-9.5z" fill="currentColor" />
      <path d="M41 14h9.2l5.6 5.2H41V14z" className="fill-white/85 dark:fill-gray-900/80" />
      <circle cx="58.2" cy="20.2" r="1.15" className="fill-amber-200" />
      <Wheel cx={14} cy={26} delay={delay} />
      <Wheel cx={28} cy={26} delay={delay} />
      <Wheel cx={52} cy={26} delay={delay} />
    </svg>
  );
}

export function GamerLoader({ fullScreen = false, message = ' กำลังโหลด...', className = '' }: GamerLoaderProps) {
  return (
    <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center' : ''} ${className}`}>
      <div className="text-center">
        <div className="flex items-end justify-center gap-3">
          <RunningTruck colorClass="text-sky-500 dark:text-sky-400" />
          <RunningTruck colorClass="text-fuchsia-500 dark:text-fuchsia-400" delay="150ms" />
          <RunningTruck colorClass="text-emerald-500 dark:text-emerald-400" delay="300ms" />
        </div>
        <p className="mt-5 text-lg md:text-xl tracking-widest font-extrabold text-gray-700 dark:text-gray-200">
          <span className="text-fuchsia-500 dark:text-fuchsia-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)] dark:drop-shadow-[0_0_6px_rgba(236,72,153,0.3)]">Y</span>
          <span className="text-violet-500 dark:text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.6)] dark:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]">a</span>
          <span className="text-sky-500 dark:text-sky-400 drop-shadow-[0_0_6px_rgba(14,165,233,0.6)] dark:drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]">n</span>
          <span className="text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] dark:drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">g</span>
          <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
          <span className="text-sky-500 dark:text-white">Dee</span>
          <span className="ml-2 dark:text-gray-300">• {message}</span>
        </p>
      </div>
    </div>
  );
}

export default GamerLoader;
