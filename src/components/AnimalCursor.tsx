'use client';

import { Cursor } from 'animal-island-ui';
import 'animal-island-ui/es/components/Cursor/cursor.css';
import type { ReactNode } from 'react';

interface AnimalCursorProps {
  children: ReactNode;
}

export default function AnimalCursor({ children }: AnimalCursorProps) {
  return (
    <Cursor className="min-h-[100dvh]" forceAll>
      {children}
    </Cursor>
  );
}
