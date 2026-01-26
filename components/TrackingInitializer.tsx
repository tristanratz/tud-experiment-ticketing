'use client';

import { useEffect } from 'react';
import { tracking } from '@/lib/tracking';

export default function TrackingInitializer() {
  useEffect(() => {
    tracking.init();
  }, []);

  return null;
}
