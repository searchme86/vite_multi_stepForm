import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  console.log('⏱️ [USE_DEBOUNCE] 디바운스 훅 호출:', {
    valueType: typeof value,
    valueLength: typeof value === 'string' ? (value as string).length : 'N/A',
    hasImages:
      typeof value === 'string' ? (value as string).includes('![') : false,
    delay,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('⏱️ [USE_DEBOUNCE] 디바운스 완료, 값 업데이트:', {
        newValueLength:
          typeof value === 'string' ? (value as string).length : 'N/A',
        hasImages:
          typeof value === 'string' ? (value as string).includes('![') : false,
        delay,
        timestamp: Date.now(),
      });
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
