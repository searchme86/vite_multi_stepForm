// 📁 parts/StructureInput/inputs/InputField.tsx
import React from 'react';

interface InputFieldProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (inputValue: string) => void;
  onCompositionStart?: () => void;
  onCompositionEnd?: (compositionValue: string) => void;
}

function InputField({
  id,
  value,
  placeholder,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: InputFieldProps) {
  const validatedInputId = typeof id === 'string' ? id : 'default-input';
  const validatedCurrentValue = typeof value === 'string' ? value : '';
  const validatedPlaceholderText =
    typeof placeholder === 'string' ? placeholder : '입력하세요';
  const displayValue = validatedCurrentValue.substring(0, 10);

  console.log('🔤 [INPUT_FIELD] 렌더링:', {
    id: validatedInputId,
    valuePreview: displayValue,
    hasValue: validatedCurrentValue.length > 0,
  });

  const handleInputChange = (
    changeEvent: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { target } = changeEvent;
    const newInputValue = target?.value || '';
    const validatedNewValue =
      typeof newInputValue === 'string' ? newInputValue : '';

    if (typeof onChange === 'function') {
      onChange(validatedNewValue);
    }
  };

  const handleCompositionStart = () => {
    if (typeof onCompositionStart === 'function') {
      onCompositionStart();
    }
  };

  const handleCompositionEnd = (
    compositionEvent: React.CompositionEvent<HTMLInputElement>
  ) => {
    const { currentTarget } = compositionEvent;
    const finalCompositionValue = currentTarget?.value || '';
    const validatedFinalValue =
      typeof finalCompositionValue === 'string' ? finalCompositionValue : '';

    if (typeof onCompositionEnd === 'function') {
      onCompositionEnd(validatedFinalValue);
    }
  };

  return (
    <input
      type="text"
      id={validatedInputId}
      value={validatedCurrentValue}
      onChange={handleInputChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder={validatedPlaceholderText}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      autoComplete="off"
      spellCheck={false}
    />
  );
}

export default React.memo(InputField);
