// 📁 parts/StructureInput/inputs/IMEHandler.tsx
import React, { useCallback } from 'react';
import InputField from './InputField';

interface IMEHandlerProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (value: string) => void;
}

function IMEHandler({
  index,
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: IMEHandlerProps) {
  console.log('🎌 [IME_HANDLER] 처리:', { index, valueLength: value.length });

  const handleChange = useCallback(
    (newValue: string) => {
      console.log('🚀 [IME_HANDLER] 모든 입력 처리:', {
        index,
        value: newValue,
        timestamp: Date.now(),
      });
      onChange(newValue);
    },
    [index, onChange]
  );

  const handleCompositionStart = useCallback(() => {
    console.log('🎌 [IME_HANDLER] IME 시작:', index);
    onCompositionStart();
  }, [index, onCompositionStart]);

  const handleCompositionEnd = useCallback(
    (newValue: string) => {
      console.log('🏁 [IME_HANDLER] IME 완료:', { index, value: newValue });
      onCompositionEnd(newValue);
    },
    [index, onCompositionEnd]
  );

  return (
    <InputField
      id={`section-input-${index}`}
      value={value}
      placeholder={`섹션 ${index + 1} 이름을 입력하세요`}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  );
}

export default React.memo(IMEHandler);
