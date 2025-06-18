// 📁 parts/StructureInput/inputs/SectionInput.tsx
import React from 'react';
import IMEHandler from './IMEHandler';

interface SectionInputProps {
  index: number;
  value: string;
  isComposing: boolean;
  onChange: (inputIndex: number, inputValue: string) => void;
  onCompositionStart: (inputIndex: number) => void;
  onCompositionEnd: (inputIndex: number, finalValue: string) => void;
}

function SectionInput({
  index,
  value,
  isComposing,
  onChange,
  onCompositionStart,
  onCompositionEnd,
}: SectionInputProps) {
  const validatedInputIndex =
    typeof index === 'number' && index >= 0 ? index : 0;
  const validatedCurrentValue = typeof value === 'string' ? value : '';
  const validatedComposingStatus =
    typeof isComposing === 'boolean' ? isComposing : false;
  const displaySectionNumber = validatedInputIndex + 1;

  console.log('📝 [SECTION_INPUT] 렌더링:', {
    index: validatedInputIndex,
    value: validatedCurrentValue,
    isComposing: validatedComposingStatus,
  });

  const handleSectionValueChange = (newSectionValue: string) => {
    const validatedNewValue =
      typeof newSectionValue === 'string' ? newSectionValue : '';

    if (typeof onChange === 'function') {
      onChange(validatedInputIndex, validatedNewValue);
    }
  };

  const handleSectionCompositionStart = () => {
    if (typeof onCompositionStart === 'function') {
      onCompositionStart(validatedInputIndex);
    }
  };

  const handleSectionCompositionEnd = (finalSectionValue: string) => {
    const validatedFinalValue =
      typeof finalSectionValue === 'string' ? finalSectionValue : '';

    if (typeof onCompositionEnd === 'function') {
      onCompositionEnd(validatedInputIndex, validatedFinalValue);
    }
  };

  const sectionLabelId = `section-input-${validatedInputIndex}`;
  const sectionHelpId = `section-help-${validatedInputIndex}`;
  const compositionIndicatorText = validatedComposingStatus
    ? '(IME 입력 중...)'
    : '';

  return (
    <div className="space-y-2">
      <label
        htmlFor={sectionLabelId}
        className="block text-sm font-medium text-gray-700"
      >
        섹션 {displaySectionNumber}
        {validatedComposingStatus && (
          <span className="ml-2 text-xs text-orange-500 animate-pulse">
            {compositionIndicatorText}
          </span>
        )}
      </label>
      <IMEHandler
        index={validatedInputIndex}
        value={validatedCurrentValue}
        onChange={handleSectionValueChange}
        onCompositionStart={handleSectionCompositionStart}
        onCompositionEnd={handleSectionCompositionEnd}
      />
      <div id={sectionHelpId} className="sr-only">
        {`${displaySectionNumber}번째 섹션의 이름을 입력하세요`}
      </div>
    </div>
  );
}

export default React.memo(SectionInput);
