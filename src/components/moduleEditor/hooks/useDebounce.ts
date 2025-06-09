import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  console.log('🪝 [USE_DEBOUNCE] 훅 초기화:', {
    delay,
    valueType: typeof value,
  });

  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    console.log('⏱️ [USE_DEBOUNCE] 디바운스 타이머 시작');

    const handler = setTimeout(() => {
      console.log('✅ [USE_DEBOUNCE] 디바운스 완료, 값 업데이트');
      setDebouncedValue(value);
    }, delay);

    return () => {
      console.log('🧹 [USE_DEBOUNCE] 타이머 정리');
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
