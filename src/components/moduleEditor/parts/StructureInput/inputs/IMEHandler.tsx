// 📁 parts/StructureInput/inputs/IMEHandler.tsx
import React, { useCallback } from 'react';
import InputField from './InputField';

interface IMEHandlerProps {
  index: number;
  value: string;
  onChange: (inputValue: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (finalValue: string) => void;
}

function IMEHandler({
  index,
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: IMEHandlerProps) {
  const validatedCurrentValue = typeof value === 'string' ? value : '';
  const validatedInputIndex =
    typeof index === 'number' && index >= 0 ? index : 0;

  const handleInputValueChange = useCallback(
    (newInputValue: string) => {
      const validatedValue =
        typeof newInputValue === 'string' ? newInputValue : '';

      console.log('🚀 [IME_HANDLER] 입력 처리:', {
        index: validatedInputIndex,
        value: validatedValue,
        timestamp: Date.now(),
      });

      if (typeof onChange === 'function') {
        onChange(validatedValue);
      }
    },
    [validatedInputIndex, onChange]
  );

  const handleIMECompositionStart = useCallback(() => {
    console.log('🎌 [IME_HANDLER] IME 시작:', validatedInputIndex);

    if (typeof onCompositionStart === 'function') {
      onCompositionStart();
    }
  }, [validatedInputIndex, onCompositionStart]);

  const handleIMECompositionEnd = useCallback(
    (finalCompositionValue: string) => {
      const validatedValue =
        typeof finalCompositionValue === 'string' ? finalCompositionValue : '';

      console.log('🏁 [IME_HANDLER] IME 완료:', {
        index: validatedInputIndex,
        finalValue: validatedValue,
      });

      if (typeof onCompositionEnd === 'function') {
        onCompositionEnd(validatedValue);
      }
    },
    [validatedInputIndex, onCompositionEnd]
  );

  return (
    <InputField
      id={`section-input-${validatedInputIndex}`}
      value={validatedCurrentValue}
      placeholder={`섹션 ${validatedInputIndex + 1} 이름을 입력하세요`}
      onChange={handleInputValueChange}
      onCompositionStart={handleIMECompositionStart}
      onCompositionEnd={handleIMECompositionEnd}
    />
  );
}

export default React.memo(IMEHandler);
