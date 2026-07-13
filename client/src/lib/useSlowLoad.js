import { useEffect, useState } from 'react';

/**
 * True once `loading` has been true for longer than `afterMs`.
 *
 * Free hosting spins the server down when idle, and the request that wakes it
 * can take the better part of a minute. Without a word of explanation that just
 * looks broken, so pages use this to say what is happening.
 */
export function useSlowLoad(loading, afterMs = 6000) {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsSlow(false);
      return;
    }
    const id = setTimeout(() => setIsSlow(true), afterMs);
    return () => clearTimeout(id);
  }, [loading, afterMs]);

  return isSlow;
}
