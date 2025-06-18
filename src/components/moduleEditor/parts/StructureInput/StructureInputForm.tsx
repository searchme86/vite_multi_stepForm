// 📁 editor/parts/StructureInput/StructureInputForm.tsx
import React, { useCallback, useRef } from 'react';
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
  const editorCoreStoreState = useEditorCoreStore();
  const {
    getSectionInputs: retrieveCurrentSectionInputs,
    updateSectionInput: updateSpecificSectionInput,
    addSectionInput: appendNewSectionInput,
    removeSectionInput: removeSpecificSectionInput,
  } = editorCoreStoreState;

  const imeCompositionStatusByIndex = useRef<Record<number, boolean>>({});

  const currentSectionInputs = retrieveCurrentSectionInputs();
  const validatedSectionInputs = Array.isArray(currentSectionInputs)
    ? currentSectionInputs
    : ['', '', '', ''];

  const countOfValidInputs = validatedSectionInputs.filter((singleInput) => {
    const validInput = typeof singleInput === 'string' ? singleInput : '';
    return validInput.trim().length > 0;
  }).length;

  const isFormValidForSubmission = countOfValidInputs >= 2;
  const activeIMECompositionCount = Object.values(
    imeCompositionStatusByIndex.current || {}
  ).filter(Boolean).length;
  const canRemoveInputs = validatedSectionInputs.length > 2;

  const handleSectionInputChange = useCallback(
    (inputIndex: number, newInputValue: string) => {
      const validatedIndex =
        typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
      const validatedValue =
        typeof newInputValue === 'string' ? newInputValue : '';

      console.log('🎯 [SINGLE_STATE] 직접 스토어 업데이트:', {
        index: validatedIndex,
        value: validatedValue,
      });

      updateSpecificSectionInput(validatedIndex, validatedValue);
    },
    [updateSpecificSectionInput]
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
    const newInputIndex = validatedSectionInputs.length;
    imeCompositionStatusByIndex.current[newInputIndex] = false;

    appendNewSectionInput();
  }, [appendNewSectionInput, validatedSectionInputs.length]);

  const removeLastSectionInput = useCallback(() => {
    if (validatedSectionInputs.length <= 2) {
      console.warn('최소 2개 섹션이 필요합니다');
      return;
    }

    const lastInputIndex = validatedSectionInputs.length - 1;
    delete imeCompositionStatusByIndex.current[lastInputIndex];

    removeSpecificSectionInput(lastInputIndex);
  }, [removeSpecificSectionInput, validatedSectionInputs.length]);

  // const handleFormSubmissionComplete = useCallback(() => {
  //   const filteredValidInputs = validatedSectionInputs.filter((singleInput) => {
  //     const validInput = typeof singleInput === 'string' ? singleInput : '';
  //     return validInput.trim().length > 0;
  //   });

  //   handleStructureComplete(filteredValidInputs);

  //   if (typeof onStructureComplete === 'function') {
  //     onStructureComplete(filteredValidInputs);
  //   }
  // }, [validatedSectionInputs, onStructureComplete]);

  // 📁 StructureInputForm.tsx 또는 NextStepButton.tsx
  // ✅ 디버깅용 코드 (임시로 추가해서 문제 파악)

  const handleFormSubmissionComplete = useCallback(() => {
    console.log('🚀 [NEXT_STEP_BUTTON] handleFormSubmissionComplete 시작');

    // ✅ 입력 데이터 상세 디버깅
    console.log('📊 [NEXT_STEP_BUTTON] 입력 데이터 분석:', {
      originalInputs: validatedSectionInputs,
      originalCount: validatedSectionInputs?.length || 0,
      inputTypes: validatedSectionInputs?.map((input) => typeof input),
    });

    const filteredValidInputs = validatedSectionInputs.filter((singleInput) => {
      const validInput = typeof singleInput === 'string' ? singleInput : '';
      const isValid = validInput.trim().length > 0;

      console.log(`📝 [NEXT_STEP_BUTTON] 입력 검증:`, {
        input: singleInput,
        validInput,
        trimmedLength: validInput.trim().length,
        isValid,
      });

      return isValid;
    });

    console.log('✅ [NEXT_STEP_BUTTON] 필터링 결과:', {
      filteredCount: filteredValidInputs.length,
      filteredInputs: filteredValidInputs,
      isMinimumMet: filteredValidInputs.length >= 2,
    });

    // ✅ 최소 조건 확인
    if (filteredValidInputs.length < 2) {
      console.error('❌ [NEXT_STEP_BUTTON] 최소 조건 미충족:', {
        required: 2,
        actual: filteredValidInputs.length,
      });
      return;
    }

    // ✅ handleStructureComplete 호출 전 로그
    console.log('📞 [NEXT_STEP_BUTTON] handleStructureComplete 호출 시작');
    try {
      handleStructureComplete(filteredValidInputs);
      console.log('✅ [NEXT_STEP_BUTTON] handleStructureComplete 완료');
    } catch (error) {
      console.error(
        '❌ [NEXT_STEP_BUTTON] handleStructureComplete 실패:',
        error
      );
    }

    // ✅ onStructureComplete 호출 전 로그
    console.log('📞 [NEXT_STEP_BUTTON] onStructureComplete 확인:', {
      isFunction: typeof onStructureComplete === 'function',
      hasCallback: !!onStructureComplete,
    });

    if (typeof onStructureComplete === 'function') {
      try {
        console.log('📞 [NEXT_STEP_BUTTON] onStructureComplete 호출 시작');
        onStructureComplete(filteredValidInputs);
        console.log('✅ [NEXT_STEP_BUTTON] onStructureComplete 완료');
      } catch (error) {
        console.error('❌ [NEXT_STEP_BUTTON] onStructureComplete 실패:', error);
      }
    } else {
      console.warn('⚠️ [NEXT_STEP_BUTTON] onStructureComplete가 함수가 아님');
    }

    console.log('🏁 [NEXT_STEP_BUTTON] handleFormSubmissionComplete 완료');
  }, [validatedSectionInputs, handleStructureComplete, onStructureComplete]);

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

      <div className="p-3 text-xs border border-blue-200 rounded-lg bg-blue-50">
        <div className="mb-2 font-semibold text-blue-800">
          🎯 단일 상태 패턴으로 리팩터링 완료!
        </div>
        <div className="grid grid-cols-2 gap-4 text-blue-700">
          <div>
            <strong>개선사항:</strong>
            <br />• 로컬 상태 완전 제거
            <br />• Zustand 직접 사용
            <br />• 복잡한 동기화 로직 제거
            <br />• useEffect 완전 제거
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {validatedSectionInputs.length}개
            <br />• 유효 입력 수: {countOfValidInputs}개
            <br />• IME 활성 상태: {activeIMECompositionCount}개
          </div>
        </div>
      </div>

      <SectionExamples />

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        {validatedSectionInputs.map((singleInputValue, inputIndex) => {
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

      <SectionPreview containerInputs={validatedSectionInputs} />

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

      <div className="p-4 text-center border border-blue-200 rounded-lg bg-blue-50">
        <p className="text-blue-800">
          🎯 <strong>단일 상태:</strong> 입력 개수:{' '}
          {validatedSectionInputs.length} | 유효성:{' '}
          {isFormValidForSubmission ? '✅' : '❌'} | 현재값: [
          {validatedSectionInputs
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
