// 📁 parts/StructureInput/inputs/SectionInput.tsx
import React from 'react';
import IMEHandler from './IMEHandler';

interface SectionInputProps {
  index: number;
  value: string;
  isComposing: boolean;
  onChange: (index: number, value: string) => void;
  onCompositionStart: (index: number) => void;
  onCompositionEnd: (index: number, value: string) => void;
}

function SectionInput({
  index,
  value,
  isComposing,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: SectionInputProps) {
  console.log('📝 [SECTION_INPUT] 렌더링:', { index, value, isComposing });

  const handleChange = (newValue: string) => {
    onChange(index, newValue);
  };

  const handleCompositionStart = () => {
    onCompositionStart(index);
  };

  const handleCompositionEnd = (newValue: string) => {
    onCompositionEnd(index, newValue);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={`section-input-${index}`}
        className="block text-sm font-medium text-gray-700"
      >
        섹션 {index + 1}
        {isComposing && (
          <span className="ml-2 text-xs text-orange-500 animate-pulse">
            (IME 입력 중...)
          </span>
        )}
      </label>
      <IMEHandler
        index={index}
        value={value}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <div id={`section-help-${index}`} className="sr-only">
        {`${index + 1}번째 섹션의 이름을 입력하세요`}
      </div>
    </div>
  );
}

export default React.memo(SectionInput);
