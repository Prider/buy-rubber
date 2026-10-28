'use client';

import { useState, type ReactNode } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AdminTabStage({ tab, children }: { tab: string; children: ReactNode }) {
  const [shown, setShown] = useState(tab);
  const [enter, setEnter] = useState(false);

  if (tab !== shown) {
    setShown(tab);
    setEnter(!prefersReducedMotion());
  }

  return (
    <div key={shown} className={enter ? 'admin-tab-enter' : undefined}>
      {children}
    </div>
  );
}
