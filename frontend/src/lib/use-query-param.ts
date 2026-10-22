'use client';

import { useEffect, useState } from 'react';

/** Reads a query parameter after mount, avoiding a Suspense boundary for useSearchParams. */
export function useQueryParam(name: string): string {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name) ?? '');
  }, [name]);
  return value;
}
