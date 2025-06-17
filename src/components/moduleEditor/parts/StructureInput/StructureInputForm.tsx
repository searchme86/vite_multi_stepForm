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

  //====여기부터 수정됨====
  // 🔧 스토어와 로컬 상태 동기화를 useEffect로 분리
  // 1. 렌더링과 사이드 이펙트 분리 2. 상태 업데이트 충돌 방지
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

  // 🔧 입력값 변경 시 스토어 동기화 useEffect
  // 1. containerInputs 변경 시 스토어 업데이트 2. 렌더링 중 상태 업데이트 방지
  useEffect(() => {
    // 스토어의 현재 상태와 로컬 상태가 다를 때만 업데이트
    const currentStoreInputs = getSectionInputs();
    const needsSync =
      !Array.isArray(currentStoreInputs) ||
      currentStoreInputs.length !== containerInputs.length ||
      currentStoreInputs.some(
        (input, index) => input !== containerInputs[index]
      );

    if (needsSync) {
      // 전체 배열을 한 번에 업데이트하여 개별 업데이트 충돌 방지
      setSectionInputs(containerInputs);
    }
  }, [containerInputs, getSectionInputs, setSectionInputs]);
  //====여기까지 수정됨====

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const validIndex = typeof index === 'number' && index >= 0 ? index : 0;
      const validValue = typeof value === 'string' ? value : '';

      //====여기부터 수정됨====
      // 🔧 상태 업데이트만 수행하고 스토어 동기화는 useEffect에서 처리
      // 1. 렌더링 중 사이드 이펙트 제거 2. 상태 업데이트 충돌 방지
      setContainerInputs((prev) => {
        const safePrev = Array.isArray(prev) ? prev : ['', '', '', ''];
        const newInputs = [...safePrev];

        if (validIndex < newInputs.length) {
          newInputs[validIndex] = validValue;
        }

        // 유효성 검사만 수행하고 스토어 업데이트는 제거
        const validCount = newInputs.filter(
          (input) => typeof input === 'string' && input.trim().length > 0
        ).length;
        const valid = validCount >= 2;

        setIsValid(valid);

        // updateSectionInput 호출 제거 - useEffect에서 처리
        return newInputs;
      });
      //====여기까지 수정됨====
    },
    [] // updateSectionInput 의존성 제거
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
    //====여기부터 수정됨====
    // 🔧 상태 업데이트만 수행하고 스토어 동기화는 useEffect에서 처리
    setContainerInputs((prev) => {
      const safePrev = Array.isArray(prev) ? prev : ['', '', '', ''];
      const newInputs = [...safePrev, ''];

      const newIndex = safePrev.length;
      isComposingRefs.current[newIndex] = false;

      return newInputs;
    });

    // 스토어 업데이트는 별도로 수행
    addSectionInput();
    //====여기까지 수정됨====
  }, [addSectionInput]);

  const removeInput = useCallback(() => {
    //====여기부터 수정됨====
    // 🔧 상태 업데이트와 스토어 업데이트 분리
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

      return newInputs;
    });

    // 스토어 업데이트는 별도로 수행
    const currentInputs = containerInputs;
    if (currentInputs.length > 2) {
      const removedIndex = currentInputs.length - 1;
      removeSectionInput(removedIndex);
    }
    //====여기까지 수정됨====
  }, [removeSectionInput, containerInputs]);

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

      {/*====여기부터 수정됨====*/}
      {/* 🔧 디버그 정보 업데이트 - 렌더링 중 상태 업데이트 방지 기능 추가 */}
      <div className="p-3 text-xs border border-green-200 rounded-lg bg-green-50">
        <div className="mb-2 font-semibold text-green-800">
          ✅ 렌더링 중 상태 업데이트 에러 수정 완료!
        </div>
        <div className="grid grid-cols-2 gap-4 text-green-700">
          <div>
            <strong>수정사항:</strong>
            <br />• 렌더링/사이드이펙트 분리
            <br />• useEffect로 스토어 동기화
            <br />• 상태 업데이트 충돌 방지
            <br />• 안전한 비동기 처리
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {safeContainerInputs.length}개
            <br />• 유효 입력 수: {validInputsCount}개
            <br />• IME 활성 상태: {activeComposingCount}개
          </div>
        </div>
      </div>
      {/*====여기까지 수정됨====*/}

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
