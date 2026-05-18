'use client';

import { useEffect } from 'react';

function isWeChat(): boolean {
  return typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
}

export default function SWRegistration() {
  useEffect(() => {
    if (isWeChat()) {
      // Skip Service Worker in WeChat to avoid compatibility issues
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
          .catch(() => {
            // Silently fail - SW is optional for core functionality
          });
      });
    }
  }, []);

  return null;
}
