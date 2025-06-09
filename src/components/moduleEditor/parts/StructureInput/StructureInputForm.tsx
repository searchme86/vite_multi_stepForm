// 📁 parts/StructureInput/StructureInputForm.tsx
import React, { useState, useCallback, useRef } from 'react';
import SectionInput from './inputs/SectionInput';
import SectionPreview from './preview/SectionPreview';
import SectionExamples from './examples/SectionExamples';
import AddRemoveButtons from './controls/AddRemoveButtons';
import NextStepButton from './controls/NextStepButton';

interface StructureInputFormProps {
  onStructureComplete: (inputs: string[]) => void;
}

function StructureInputForm({ onStructureComplete }: StructureInputFormProps) {
  console.log('🎯 [STRUCTURE_INPUT] 컴포넌트 렌더링 시작');

  const [containerInputs, setContainerInputs] = useState<string[]>([
    '',
    '',
    '',
    '',
  ]);
  const [isValid, setIsValid] = useState(false);
  const isComposingRefs = useRef<{ [key: number]: boolean }>({});

  const handleInputChange = useCallback((index: number, value: string) => {
    console.log('🚀 [STRUCTURE_INPUT] 입력 변경:', {
      index,
      value,
      isComposing: isComposingRefs.current[index] || false,
      timestamp: Date.now(),
    });

    setContainerInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = value;

      const validCount = newInputs.filter(
        (input) => input.trim().length > 0
      ).length;
      const valid = validCount >= 2;

      setIsValid(valid);
      return newInputs;
    });
  }, []);

  const handleCompositionStart = useCallback((index: number) => {
    console.log('🎌 [STRUCTURE_INPUT] IME 입력 시작:', index);
    isComposingRefs.current[index] = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (index: number, value: string) => {
      console.log('🏁 [STRUCTURE_INPUT] IME 입력 완료:', { index, value });
      isComposingRefs.current[index] = false;
      handleInputChange(index, value);
    },
    [handleInputChange]
  );

  const addInput = useCallback(() => {
    console.log('➕ [STRUCTURE_INPUT] 섹션 추가');
    setContainerInputs((prev) => [...prev, '']);
    const newIndex = containerInputs.length;
    isComposingRefs.current[newIndex] = false;
  }, [containerInputs.length]);

  const removeInput = useCallback(() => {
    console.log('➖ [STRUCTURE_INPUT] 섹션 삭제');
    setContainerInputs((prev) => {
      if (prev.length <= 2) return prev;
      const newInputs = prev.slice(0, -1);
      const validCount = newInputs.filter(
        (input) => input.trim().length > 0
      ).length;
      setIsValid(validCount >= 2);

      const removedIndex = prev.length - 1;
      delete isComposingRefs.current[removedIndex];

      return newInputs;
    });
  }, []);

  const handleComplete = useCallback(() => {
    console.log('✅ [STRUCTURE_INPUT] 구조 완료 처리');
    const validInputs = containerInputs.filter(
      (input) => input.trim().length > 0
    );
    onStructureComplete(validInputs);
  }, [containerInputs, onStructureComplete]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900">
          🏗️ 글 구조를 설계해주세요
        </h2>
        <p className="text-gray-600">
          어떤 순서와 구조로 글을 작성하고 싶으신가요? 각 섹션의 이름을
          입력해주세요.
        </p>
      </div>

      <div className="p-3 text-xs border border-green-200 rounded-lg bg-green-50">
        <div className="mb-2 font-semibold text-green-800">
          ✅ 에디터 에러 완전 해결! 텍스트 입력 문제 수정됨!
        </div>
        <div className="grid grid-cols-2 gap-4 text-green-700">
          <div>
            <strong>개선사항:</strong>
            <br />• Tiptap 에디터 초기화 에러 수정
            <br />• useEditor 의존성 배열 최적화
            <br />• 에디터 상태 안전성 강화
            <br />• 메모리 정리 로직 추가
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {containerInputs.length}개
            <br />• 유효 입력 수:{' '}
            {containerInputs.filter((input) => input.trim().length > 0).length}
            개
            <br />• IME 활성 상태:{' '}
            {Object.values(isComposingRefs.current).filter(Boolean).length}개
          </div>
        </div>
      </div>

      <SectionExamples />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        {containerInputs.map((input, index) => (
          <SectionInput
            key={`input-${index}`}
            index={index}
            value={input}
            isComposing={isComposingRefs.current[index] || false}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
        ))}
      </div>

      <SectionPreview containerInputs={containerInputs} />

      <div className="flex items-center justify-between mt-4">
        <AddRemoveButtons
          onAdd={addInput}
          onRemove={removeInput}
          canRemove={containerInputs.length > 2}
        />
        <NextStepButton onComplete={handleComplete} isValid={isValid} />
      </div>

      <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
        <p className="text-green-800">
          ✅ <strong>입력 상태:</strong> 입력 개수: {containerInputs.length} |
          유효성: {isValid ? '✅' : '❌'} | 현재값: [
          {containerInputs.map((v) => `"${v}"`).join(', ')}]
        </p>
      </div>
    </div>
  );
}

export default React.memo(StructureInputForm);
