// 📁 parts/StructureInput/inputs/InputField.tsx
import React from 'react';

interface InputFieldProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onCompositionStart?: () => void;
  onCompositionEnd?: (value: string) => void;
}

function InputField({
  id,
  value,
  placeholder,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: InputFieldProps) {
  console.log('🔤 [INPUT_FIELD] 렌더링:', {
    id,
    value: value.substring(0, 10),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleCompositionStart = () => {
    if (onCompositionStart) {
      onCompositionStart();
    }
  };

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (onCompositionEnd) {
      onCompositionEnd(e.currentTarget.value);
    }
  };

  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      autoComplete="off"
      spellCheck={false}
    />
  );
}

export default React.memo(InputField);
