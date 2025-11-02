
'use client';

import { useState, useEffect } from 'react';

// This hook checks if the screen width is at least double its height.
const EXTRA_WIDE_ASPECT_RATIO = 2;

export function useIsExtraWide() {
  const [isExtraWide, setIsExtraWide] = useState(false);

  useEffect(() => {
    // Ensure this code only runs on the client-side.
    if (typeof window === 'undefined') {
      return;
    }

    const checkAspectRatio = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsExtraWide(aspectRatio >= EXTRA_WIDE_ASPECT_RATIO);
    };

    // Initial check when the component mounts.
    checkAspectRatio();

    // Add event listener to re-check on window resize.
    window.addEventListener('resize', checkAspectRatio);

    // Cleanup by removing the event listener when the component unmounts.
    return () => {
      window.removeEventListener('resize', checkAspectRatio);
    };
  }, []);

  return isExtraWide;
}

    