import type { ReactNode } from 'react';

const HEADING_TONE = {
  amber: 'from-amber-600 to-orange-500 dark:from-amber-300 dark:to-orange-300',
  violet: 'from-violet-600 to-indigo-500 dark:from-violet-300 dark:to-indigo-300',
  sky: 'from-sky-600 to-blue-500 dark:from-sky-300 dark:to-blue-300',
  emerald: 'from-emerald-600 to-teal-500 dark:from-emerald-300 dark:to-teal-300',
  rose: 'from-rose-600 to-pink-500 dark:from-rose-300 dark:to-pink-300',
  trend: 'from-sky-600 to-emerald-500 dark:from-sky-300 dark:to-emerald-300',
} as const;

export type DashboardHeadingTone = keyof typeof HEADING_TONE;

export default function DashboardHeading({
  children,
  tone,
  className = '',
}: {
  children: ReactNode;
  tone: DashboardHeadingTone;
  className?: string;
}) {
  return (
    <h2 className={`text-base font-bold ${className}`}>
      <span className={`bg-gradient-to-r bg-clip-text text-transparent ${HEADING_TONE[tone]}`}>
        {children}
      </span>
    </h2>
  );
}
