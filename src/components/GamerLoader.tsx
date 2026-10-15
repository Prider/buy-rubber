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

function TruckSvg({
  colorClass,
  delay,
  children,
}: {
  colorClass: string;
  delay?: string;
  children: React.ReactNode;
}) {
  const delayClass = delay ? `[animation-delay:${delay}]` : '';

  return (
    <svg
      viewBox="0 0 68 34"
      className={`h-8 w-auto overflow-visible animate-truck motion-reduce:animate-none sm:h-14 ${delayClass} ${colorClass}`}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Cab({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 12.5h12.5l9 7.5v2H${x}v-9.5z`} fill="currentColor" />
      <path
        d={`M${x + 2.5} 14h9.2l5.6 5.2H${x + 2.5}V14z`}
        className="fill-white/85 dark:fill-gray-900/80"
      />
      <circle cx={x + 19.7} cy={20.2} r="1.15" className="fill-amber-200" />
    </g>
  );
}

function BoxTruck({ colorClass, delay }: { colorClass: string; delay?: string }) {
  return (
    <TruckSvg colorClass={colorClass} delay={delay}>
      <rect x="0.5" y="6" width="38" height="16" rx="2" fill="currentColor" />
      <rect x="4" y="9.5" width="31" height="2" rx="0.5" className="fill-white/30" />
      <Cab x={38.5} />
      <Wheel cx={14} cy={26} delay={delay} />
      <Wheel cx={28} cy={26} delay={delay} />
      <Wheel cx={52} cy={26} delay={delay} />
    </TruckSvg>
  );
}

function TankerTruck({ colorClass, delay }: { colorClass: string; delay?: string }) {
  return (
    <TruckSvg colorClass={colorClass} delay={delay}>
      <rect x="1.2" y="10.2" width="38" height="11.8" rx="5.9" fill="currentColor" />
      <rect x="15" y="7.2" width="9.5" height="3.4" rx="1.1" fill="currentColor" />
      <ellipse cx="7.2" cy="16.1" rx="2.1" ry="4.2" className="fill-white/25" />
      <path d="M18.5 10.6v11M27.5 10.6v11" className="stroke-white/40" strokeWidth="1.35" fill="none" />
      <Cab x={38.5} />
      <Wheel cx={14} cy={26} delay={delay} />
      <Wheel cx={28} cy={26} delay={delay} />
      <Wheel cx={52} cy={26} delay={delay} />
    </TruckSvg>
  );
}

function PickupTruck({ colorClass, delay }: { colorClass: string; delay?: string }) {
  return (
    <TruckSvg colorClass={colorClass} delay={delay}>
      <path d="M1 15.4h30.2V22H1z" fill="currentColor" />
      <path d="M3.2 17h25.6v2.3H3.2z" className="fill-black/20" />
      <rect x="31" y="8" width="15.6" height="14" rx="1.6" fill="currentColor" />
      <rect x="33.2" y="9.8" width="11.2" height="5.6" rx="0.7" className="fill-white/85 dark:fill-gray-900/80" />
      <path d="M46.2 14h10.4l7.4 6.2V22H46.2V14z" fill="currentColor" />
      <circle cx="61.4" cy="19.6" r="1.15" className="fill-amber-200" />
      <Wheel cx={10} cy={26} delay={delay} />
      <Wheel cx={22} cy={26} delay={delay} />
      <Wheel cx={54} cy={26} delay={delay} />
    </TruckSvg>
  );
}

export function GamerLoader({ fullScreen = false, message = ' กำลังโหลด...', className = '' }: GamerLoaderProps) {
  return (
    <div className={`${fullScreen ? 'min-h-screen flex items-center justify-center' : ''} ${className}`}>
      <div className="text-center">
        <div className="flex items-end justify-center gap-1.5 sm:gap-3">
          <BoxTruck colorClass="text-sky-500 dark:text-sky-400" />
          <TankerTruck colorClass="text-fuchsia-500 dark:text-fuchsia-400" delay="150ms" />
          <PickupTruck colorClass="text-emerald-500 dark:text-emerald-400" delay="300ms" />
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
