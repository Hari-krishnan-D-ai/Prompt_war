/**
 * useOnlineStatus.js — Reactive navigator.onLine hook.
 *
 * Returns true when the browser has network access, false when offline.
 * The AI parsing service checks this to decide whether to even attempt the
 * Gemini API call or go straight to the local fallback parser.
 */

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
