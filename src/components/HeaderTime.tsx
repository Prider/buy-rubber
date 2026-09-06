'use client';

import { useEffect, useState } from 'react';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function HeaderTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const weekday = now.toLocaleDateString('th-TH', { weekday: 'long' });
  const monthday = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="app-island-time hidden lg:flex items-center" lang="th">
      <div className="animal-acDatetime-hVKh7">
        <div className="animal-acDate-rhO3k">
          <span className="animal-acWeekday-bxDHR">{weekday}</span>
          <span className="animal-acMonthday-1jUmX">{monthday}</span>
        </div>
        <div className="animal-acTime-S-twb">
          {pad(now.getHours())}
          <span className="animal-acColon-g4vuJ">:</span>
          {pad(now.getMinutes())}
        </div>
      </div>
    </div>
  );
}
