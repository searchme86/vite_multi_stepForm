// 📁 editor/parts/StructureInput/StructureInputForm.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import SectionInput from './inputs/SectionInput';
import SectionPreview from './preview/SectionPreview';
import SectionExamples from './examples/SectionExamples';
import AddRemoveButtons from './controls/AddRemoveButtons';
import NextStepButton from './controls/NextStepButton';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { handleStructureComplete } from '../../actions/editorActions/editorActionsZustand';

interface StructureInputFormProps {
  onStructureComplete: (inputs: string[]) => void;
}

function StructureInputForm({ onStructureComplete }: StructureInputFormProps) {
  const {
    getSectionInputs,
    updateSectionInput,
    addSectionInput,
    removeSectionInput,
    setSectionInputs,
  } = useEditorCoreStore();

  const savedSectionInputs = getSectionInputs();

  const [containerInputs, setContainerInputs] = useState<string[]>(() => {
    const saved = Array.isArray(savedSectionInputs) ? savedSectionInputs : [];
    return saved.length > 0 && saved.some((input) => input.trim() !== '')
      ? saved
      : ['', '', '', ''];
  });

  const [isValid, setIsValid] = useState(false);
  const isComposingRefs = useRef<{ [key: number]: boolean }>({});

  useEffect(() => {
    const currentSaved = getSectionInputs();
    if (Array.isArray(currentSaved) && currentSaved.length > 0) {
      setContainerInputs(currentSaved);

      const validCount = currentSaved.filter(
        (input) => typeof input === 'string' && input.trim().length > 0
      ).length;
      setIsValid(validCount >= 2);
    }
  }, [getSectionInputs]);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const validIndex = typeof index === 'number' && index >= 0 ? index : 0;
      const validValue = typeof value === 'string' ? value : '';

      setContainerInputs((prev) => {
        const safePrev = Array.isArray(prev) ? prev : ['', '', '', ''];
        const newInputs = [...safePrev];

        if (validIndex < newInputs.length) {
          newInputs[validIndex] = validValue;
        }

        const validCount = newInputs.filter(
          (input) => typeof input === 'string' && input.trim().length > 0
        ).length;
        const valid = validCount >= 2;

        setIsValid(valid);

        updateSectionInput(validIndex, validValue);

        return newInputs;
      });
    },
    [updateSectionInput]
  );

  const handleCompositionStart = useCallback((index: number) => {
    const validIndex = typeof index === 'number' && index >= 0 ? index : 0;
    isComposingRefs.current[validIndex] = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (index: number, value: string) => {
      const validIndex = typeof index === 'number' && index >= 0 ? index : 0;
      const validValue = typeof value === 'string' ? value : '';

      isComposingRefs.current[validIndex] = false;
      handleInputChange(validIndex, validValue);
    },
    [handleInputChange]
  );

  const addInput = useCallback(() => {
    setContainerInputs((prev) => {
      const safePrev = Array.isArray(prev) ? prev : ['', '', '', ''];
      const newInputs = [...safePrev, ''];

      addSectionInput();

      const newIndex = safePrev.length;
      isComposingRefs.current[newIndex] = false;

      return newInputs;
    });
  }, [addSectionInput]);

  const removeInput = useCallback(() => {
    setContainerInputs((prev) => {
      const safePrev = Array.isArray(prev) ? prev : ['', '', '', ''];

      if (safePrev.length <= 2) return safePrev;

      const newInputs = safePrev.slice(0, -1);
      const validCount = newInputs.filter(
        (input) => typeof input === 'string' && input.trim().length > 0
      ).length;
      setIsValid(validCount >= 2);

      const removedIndex = safePrev.length - 1;
      delete isComposingRefs.current[removedIndex];

      removeSectionInput(removedIndex);

      return newInputs;
    });
  }, [removeSectionInput]);

  const handleComplete = useCallback(() => {
    const safeInputs = Array.isArray(containerInputs) ? containerInputs : [];
    const validInputs = safeInputs.filter(
      (input) => typeof input === 'string' && input.trim().length > 0
    );

    setSectionInputs(safeInputs);
    handleStructureComplete(validInputs);

    if (typeof onStructureComplete === 'function') {
      onStructureComplete(validInputs);
    }
  }, [containerInputs, onStructureComplete, setSectionInputs]);

  const safeContainerInputs = Array.isArray(containerInputs)
    ? containerInputs
    : ['', '', '', ''];
  const validInputsCount = safeContainerInputs.filter(
    (input) => typeof input === 'string' && input.trim().length > 0
  ).length;
  const activeComposingCount = Object.values(
    isComposingRefs.current || {}
  ).filter(Boolean).length;

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
          ✅ 섹션 입력값 저장 기능 추가! 구조수정 시 값 유지됨!
        </div>
        <div className="grid grid-cols-2 gap-4 text-green-700">
          <div>
            <strong>개선사항:</strong>
            <br />• 섹션 입력값 Zustand 저장
            <br />• 구조수정 시 값 복원
            <br />• 실시간 상태 동기화
            <br />• 타입 안전성 강화
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {safeContainerInputs.length}개
            <br />• 유효 입력 수: {validInputsCount}개
            <br />• IME 활성 상태: {activeComposingCount}개
          </div>
        </div>
      </div>

      <SectionExamples />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        {safeContainerInputs.map((input, index) => (
          <SectionInput
            key={`input-${index}`}
            index={index}
            value={typeof input === 'string' ? input : ''}
            isComposing={Boolean(isComposingRefs.current[index])}
            onChange={handleInputChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
          />
        ))}
      </div>

      <SectionPreview containerInputs={safeContainerInputs} />

      <div className="flex items-center justify-between mt-4">
        <AddRemoveButtons
          onAdd={addInput}
          onRemove={removeInput}
          canRemove={safeContainerInputs.length > 2}
        />
        <NextStepButton onComplete={handleComplete} isValid={isValid} />
      </div>

      <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
        <p className="text-green-800">
          ✅ <strong>입력 상태:</strong> 입력 개수: {safeContainerInputs.length}{' '}
          | 유효성: {isValid ? '✅' : '❌'} | 현재값: [
          {safeContainerInputs
            .map((v) => `"${typeof v === 'string' ? v : ''}"`)
            .join(', ')}
          ]
        </p>
      </div>
    </div>
  );
}

export default React.memo(StructureInputForm);
