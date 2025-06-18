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
  onStructureComplete: (sectionInputArray: string[]) => void;
}

function StructureInputForm({ onStructureComplete }: StructureInputFormProps) {
  const editorCoreStoreActions = useEditorCoreStore();

  const {
    getSectionInputs: retrieveCurrentSectionInputsFromStore,
    updateSectionInput: updateSpecificSectionInputInStore,
    addSectionInput: appendNewSectionInputToStore,
    removeSectionInput: removeSpecificSectionInputFromStore,
    setSectionInputs: replaceAllSectionInputsInStore,
  } = editorCoreStoreActions;

  // 📁 StructureInputForm.tsx 맨 위에 임시 디버깅 코드 추가
  console.log('🔍 [DEBUG] 스토어 함수 확인:', {
    updateSpecificSectionInputInStore: typeof updateSpecificSectionInputInStore,
    replaceAllSectionInputsInStore: typeof replaceAllSectionInputsInStore,
    editorCoreStoreActions,
  });

  const currentStoredSectionInputs = retrieveCurrentSectionInputsFromStore();
  const validatedStoredInputs = Array.isArray(currentStoredSectionInputs)
    ? currentStoredSectionInputs
    : [];
  const hasValidStoredContent =
    validatedStoredInputs.length > 0 &&
    validatedStoredInputs.some((singleInput) => {
      const validInput = typeof singleInput === 'string' ? singleInput : '';
      return validInput.trim() !== '';
    });

  const initialSectionInputs = hasValidStoredContent
    ? validatedStoredInputs
    : ['', '', '', ''];

  const [localSectionInputsState, setLocalSectionInputsState] =
    useState<string[]>(initialSectionInputs);
  const [isFormValidForSubmission, setIsFormValidForSubmission] =
    useState(false);
  const imeCompositionStatusByIndex = useRef<Record<number, boolean>>({});

  const hasInitializedFromStoreRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasInitializedFromStoreRef.current) {
      return;
    }

    console.log('🔄 [STRUCTURE_FORM] 스토어에서 초기값 로딩');
    const currentStoreInputs = retrieveCurrentSectionInputsFromStore();
    const validStoreInputs = Array.isArray(currentStoreInputs)
      ? currentStoreInputs
      : [];

    if (
      validStoreInputs.length > 0 &&
      validStoreInputs.some((input) => {
        const validInput = typeof input === 'string' ? input : '';
        return validInput.trim() !== '';
      })
    ) {
      setLocalSectionInputsState(validStoreInputs);

      const validInputCount = validStoreInputs.filter((singleInput) => {
        const validInput = typeof singleInput === 'string' ? singleInput : '';
        return validInput.trim().length > 0;
      }).length;

      setIsFormValidForSubmission(validInputCount >= 2);
    }

    hasInitializedFromStoreRef.current = true;
  }, [retrieveCurrentSectionInputsFromStore]);

  const handleSectionInputChange = useCallback(
    (inputIndex: number, newInputValue: string) => {
      const validatedIndex =
        typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
      const validatedValue =
        typeof newInputValue === 'string' ? newInputValue : '';

      console.log('🎯 [STRUCTURE_FORM] 입력 변경:', {
        index: validatedIndex,
        value: validatedValue,
      });

      let updatedInputsArray: string[] = [];

      setLocalSectionInputsState((previousInputsState) => {
        const safePreviousInputs = Array.isArray(previousInputsState)
          ? previousInputsState
          : ['', '', '', ''];
        updatedInputsArray = [...safePreviousInputs];

        if (validatedIndex < updatedInputsArray.length) {
          updatedInputsArray[validatedIndex] = validatedValue;
        }

        const validInputCount = updatedInputsArray.filter((singleInput) => {
          const validInput = typeof singleInput === 'string' ? singleInput : '';
          return validInput.trim().length > 0;
        }).length;

        const isFormValid = validInputCount >= 2;
        setIsFormValidForSubmission(isFormValid);

        return updatedInputsArray;
      });

      Promise.resolve().then(() => {
        console.log('📤 [STRUCTURE_FORM] 스토어 업데이트:', {
          index: validatedIndex,
          value: validatedValue,
          array: updatedInputsArray,
        });
        updateSpecificSectionInputInStore(validatedIndex, validatedValue);
        replaceAllSectionInputsInStore(updatedInputsArray);
      });
    },
    [updateSpecificSectionInputInStore, replaceAllSectionInputsInStore]
  );

  const handleIMECompositionStart = useCallback((inputIndex: number) => {
    const validatedIndex =
      typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
    imeCompositionStatusByIndex.current[validatedIndex] = true;
  }, []);

  const handleIMECompositionEnd = useCallback(
    (inputIndex: number, finalCompositionValue: string) => {
      const validatedIndex =
        typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
      const validatedValue =
        typeof finalCompositionValue === 'string' ? finalCompositionValue : '';

      imeCompositionStatusByIndex.current[validatedIndex] = false;
      handleSectionInputChange(validatedIndex, validatedValue);
    },
    [handleSectionInputChange]
  );

  const addNewSectionInput = useCallback(() => {
    setLocalSectionInputsState((previousInputsState) => {
      const safePreviousInputs = Array.isArray(previousInputsState)
        ? previousInputsState
        : ['', '', '', ''];
      const expandedInputsArray = [...safePreviousInputs, ''];

      const newInputIndex = safePreviousInputs.length;
      imeCompositionStatusByIndex.current[newInputIndex] = false;

      return expandedInputsArray;
    });

    appendNewSectionInputToStore();
  }, [appendNewSectionInputToStore]);

  const removeLastSectionInput = useCallback(() => {
    setLocalSectionInputsState((previousInputsState) => {
      const safePreviousInputs = Array.isArray(previousInputsState)
        ? previousInputsState
        : ['', '', '', ''];

      if (safePreviousInputs.length <= 2) {
        return safePreviousInputs;
      }

      const reducedInputsArray = safePreviousInputs.slice(0, -1);
      const validInputCount = reducedInputsArray.filter((singleInput) => {
        const validInput = typeof singleInput === 'string' ? singleInput : '';
        return validInput.trim().length > 0;
      }).length;

      setIsFormValidForSubmission(validInputCount >= 2);

      const removedInputIndex = safePreviousInputs.length - 1;
      delete imeCompositionStatusByIndex.current[removedInputIndex];

      return reducedInputsArray;
    });

    const currentInputsState = localSectionInputsState;
    const validCurrentInputs = Array.isArray(currentInputsState)
      ? currentInputsState
      : [];

    if (validCurrentInputs.length > 2) {
      const lastInputIndex = validCurrentInputs.length - 1;
      removeSpecificSectionInputFromStore(lastInputIndex);
    }
  }, [removeSpecificSectionInputFromStore, localSectionInputsState]);

  const handleFormSubmissionComplete = useCallback(() => {
    const validLocalInputs = Array.isArray(localSectionInputsState)
      ? localSectionInputsState
      : [];
    const filteredValidInputs = validLocalInputs.filter((singleInput) => {
      const validInput = typeof singleInput === 'string' ? singleInput : '';
      return validInput.trim().length > 0;
    });

    replaceAllSectionInputsInStore(validLocalInputs);
    handleStructureComplete(filteredValidInputs);

    if (typeof onStructureComplete === 'function') {
      onStructureComplete(filteredValidInputs);
    }
  }, [
    localSectionInputsState,
    onStructureComplete,
    replaceAllSectionInputsInStore,
  ]);

  const validatedLocalInputs = Array.isArray(localSectionInputsState)
    ? localSectionInputsState
    : ['', '', '', ''];
  const countOfValidInputs = validatedLocalInputs.filter((singleInput) => {
    const validInput = typeof singleInput === 'string' ? singleInput : '';
    return validInput.trim().length > 0;
  }).length;

  const activeIMECompositionCount = Object.values(
    imeCompositionStatusByIndex.current || {}
  ).filter(Boolean).length;
  const canRemoveInputs = validatedLocalInputs.length > 2;

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
          ✅ 상태 동기화 에러 수정 완료!
        </div>
        <div className="grid grid-cols-2 gap-4 text-green-700">
          <div>
            <strong>수정사항:</strong>
            <br />• useEffect 의존성 최적화
            <br />• 즉시 스토어 업데이트
            <br />• IME 충돌 방지 로직
            <br />• 안전한 타입 검증
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {validatedLocalInputs.length}개
            <br />• 유효 입력 수: {countOfValidInputs}개
            <br />• IME 활성 상태: {activeIMECompositionCount}개
          </div>
        </div>
      </div>

      <SectionExamples />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        {validatedLocalInputs.map((singleInputValue, inputIndex) => {
          const validInputValue =
            typeof singleInputValue === 'string' ? singleInputValue : '';
          const isCurrentlyComposing = Boolean(
            imeCompositionStatusByIndex.current[inputIndex]
          );

          return (
            <SectionInput
              key={`section-input-${inputIndex}`}
              index={inputIndex}
              value={validInputValue}
              isComposing={isCurrentlyComposing}
              onChange={handleSectionInputChange}
              onCompositionStart={handleIMECompositionStart}
              onCompositionEnd={handleIMECompositionEnd}
            />
          );
        })}
      </div>

      <SectionPreview containerInputs={validatedLocalInputs} />

      <div className="flex items-center justify-between mt-4">
        <AddRemoveButtons
          onAdd={addNewSectionInput}
          onRemove={removeLastSectionInput}
          canRemove={canRemoveInputs}
        />
        <NextStepButton
          onComplete={handleFormSubmissionComplete}
          isValid={isFormValidForSubmission}
        />
      </div>

      <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
        <p className="text-green-800">
          ✅ <strong>입력 상태:</strong> 입력 개수:{' '}
          {validatedLocalInputs.length} | 유효성:{' '}
          {isFormValidForSubmission ? '✅' : '❌'} | 현재값: [
          {validatedLocalInputs
            .map((singleValue) => {
              const validValue =
                typeof singleValue === 'string' ? singleValue : '';
              return `"${validValue}"`;
            })
            .join(', ')}
          ]
        </p>
      </div>
    </div>
  );
}

export default React.memo(StructureInputForm);
