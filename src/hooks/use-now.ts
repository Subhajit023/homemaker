import { useEffect, useState } from 'react';

/** Current time that refreshes every `intervalMs`, so "in use until…" labels stay live. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
