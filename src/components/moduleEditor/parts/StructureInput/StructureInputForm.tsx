// 📁 editor/parts/StructureInput/StructureInputForm.tsx
import React, { useCallback, useRef, useState } from 'react';
import SectionInput from './inputs/SectionInput';
import SectionPreview from './preview/SectionPreview';
import SectionExamples from './examples/SectionExamples';
import AddRemoveButtons from './controls/AddRemoveButtons';
import NextStepButton from './controls/NextStepButton';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useToastStore } from '../../../../store/toast/toastStore';

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

  const addToast = useToastStore((state) => state.addToast);

  const imeCompositionStatusByIndex = useRef<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // 🆕 제출 상태 관리
  const [lastSubmissionAttempt, setLastSubmissionAttempt] = useState(0); // 🆕 중복 방지

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

      console.log('🎯 [STRUCTURE_FORM] 섹션 입력 변경:', {
        index: validatedIndex,
        value: validatedValue,
        timestamp: new Date().toISOString(),
      });

      try {
        updateSpecificSectionInput(validatedIndex, validatedValue);
      } catch (error) {
        console.error('❌ [STRUCTURE_FORM] 섹션 입력 업데이트 실패:', error);

        if (typeof addToast === 'function') {
          addToast({
            title: '입력 업데이트 실패',
            description: '섹션 입력 저장 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [updateSpecificSectionInput, addToast]
  );

  const handleIMECompositionStart = useCallback((inputIndex: number) => {
    const validatedIndex =
      typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
    imeCompositionStatusByIndex.current[validatedIndex] = true;

    console.log('🎌 [STRUCTURE_FORM] IME 조합 시작:', {
      index: validatedIndex,
    });
  }, []);

  const handleIMECompositionEnd = useCallback(
    (inputIndex: number, finalCompositionValue: string) => {
      const validatedIndex =
        typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
      const validatedValue =
        typeof finalCompositionValue === 'string' ? finalCompositionValue : '';

      imeCompositionStatusByIndex.current[validatedIndex] = false;

      console.log('🎌 [STRUCTURE_FORM] IME 조합 완료:', {
        index: validatedIndex,
        value: validatedValue,
      });

      handleSectionInputChange(validatedIndex, validatedValue);
    },
    [handleSectionInputChange]
  );

  const addNewSectionInput = useCallback(() => {
    console.log('➕ [STRUCTURE_FORM] 새 섹션 입력 추가 요청');

    try {
      const newInputIndex = validatedSectionInputs.length;
      imeCompositionStatusByIndex.current[newInputIndex] = false;

      appendNewSectionInput();

      console.log('✅ [STRUCTURE_FORM] 새 섹션 입력 추가 성공:', {
        newIndex: newInputIndex,
        totalCount: newInputIndex + 1,
      });

      if (typeof addToast === 'function') {
        addToast({
          title: '섹션 추가됨',
          description: '새로운 섹션 입력이 추가되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [STRUCTURE_FORM] 섹션 입력 추가 실패:', error);

      if (typeof addToast === 'function') {
        addToast({
          title: '섹션 추가 실패',
          description: '새 섹션 추가 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [appendNewSectionInput, validatedSectionInputs.length, addToast]);

  const removeLastSectionInput = useCallback(() => {
    console.log('➖ [STRUCTURE_FORM] 마지막 섹션 입력 제거 요청');

    try {
      if (validatedSectionInputs.length <= 2) {
        console.warn('⚠️ [STRUCTURE_FORM] 최소 섹션 수 제한');

        if (typeof addToast === 'function') {
          addToast({
            title: '제거 불가',
            description: '최소 2개의 섹션이 필요합니다.',
            color: 'warning',
          });
        }
        return;
      }

      const lastInputIndex = validatedSectionInputs.length - 1;
      delete imeCompositionStatusByIndex.current[lastInputIndex];

      removeSpecificSectionInput(lastInputIndex);

      console.log('✅ [STRUCTURE_FORM] 섹션 입력 제거 성공:', {
        removedIndex: lastInputIndex,
        remainingCount: lastInputIndex,
      });

      if (typeof addToast === 'function') {
        addToast({
          title: '섹션 제거됨',
          description: '마지막 섹션이 제거되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [STRUCTURE_FORM] 섹션 입력 제거 실패:', error);

      if (typeof addToast === 'function') {
        addToast({
          title: '섹션 제거 실패',
          description: '섹션 제거 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [removeSpecificSectionInput, validatedSectionInputs.length, addToast]);

  // ✅ 완전히 수정된 폼 제출 처리 - 에러 방지 및 사용자 경험 개선
  const handleFormSubmissionComplete = useCallback(() => {
    console.log('🚀 [STRUCTURE_FORM] 폼 제출 시작 - 에러 방지 버전');

    // Early return: 제출 중 상태 확인
    if (isSubmitting) {
      console.warn('⚠️ [STRUCTURE_FORM] 이미 제출 처리 중 - 중복 요청 무시');
      return;
    }

    // Early return: 중복 제출 방지 (2초 내 재시도 방지)
    const currentTime = Date.now();
    const timeSinceLastAttempt = currentTime - lastSubmissionAttempt;
    const minTimeBetweenSubmissions = 2000; // 2초

    if (timeSinceLastAttempt < minTimeBetweenSubmissions) {
      console.warn('⚠️ [STRUCTURE_FORM] 너무 빠른 재시도 - 무시:', {
        timeSinceLastAttempt,
        minRequired: minTimeBetweenSubmissions,
      });

      if (typeof addToast === 'function') {
        addToast({
          title: '잠시만 기다려주세요',
          description: '너무 빠른 요청입니다. 잠시 후 다시 시도해주세요.',
          color: 'warning',
        });
      }
      return;
    }

    setIsSubmitting(true);
    setLastSubmissionAttempt(currentTime);

    try {
      // ✅ 입력 데이터 상세 검증 및 디버깅
      console.log('📊 [STRUCTURE_FORM] 입력 데이터 분석:', {
        originalInputs: validatedSectionInputs,
        originalCount: validatedSectionInputs?.length || 0,
        inputTypes: validatedSectionInputs?.map((input) => typeof input),
        timestamp: new Date().toISOString(),
      });

      const filteredValidInputs = validatedSectionInputs.filter(
        (singleInput) => {
          const validInput = typeof singleInput === 'string' ? singleInput : '';
          const trimmedInput = validInput.trim();
          const isValid = trimmedInput.length > 0;

          console.log(`📝 [STRUCTURE_FORM] 입력 검증:`, {
            originalInput: singleInput,
            validInput,
            trimmedInput,
            trimmedLength: trimmedInput.length,
            isValid,
          });

          return isValid;
        }
      );

      console.log('✅ [STRUCTURE_FORM] 필터링 결과:', {
        filteredCount: filteredValidInputs.length,
        filteredInputs: filteredValidInputs,
        isMinimumMet: filteredValidInputs.length >= 2,
      });

      // Early return: 최소 조건 확인
      if (filteredValidInputs.length < 2) {
        console.error('❌ [STRUCTURE_FORM] 최소 조건 미충족:', {
          required: 2,
          actual: filteredValidInputs.length,
        });

        if (typeof addToast === 'function') {
          addToast({
            title: '입력 부족',
            description: '최소 2개의 섹션 이름을 입력해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      // Early return: IME 조합 중 확인
      if (activeIMECompositionCount > 0) {
        console.warn('⚠️ [STRUCTURE_FORM] IME 조합 중 - 제출 지연:', {
          activeIMECount: activeIMECompositionCount,
        });

        if (typeof addToast === 'function') {
          addToast({
            title: '입력 완료 대기',
            description: '입력을 완료한 후 다시 시도해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      // Early return: 콜백 함수 확인
      if (typeof onStructureComplete !== 'function') {
        console.error(
          '❌ [STRUCTURE_FORM] onStructureComplete가 함수가 아님:',
          {
            type: typeof onStructureComplete,
            value: onStructureComplete,
          }
        );

        if (typeof addToast === 'function') {
          addToast({
            title: '시스템 오류',
            description: '구조 완료 처리 함수가 정의되지 않았습니다.',
            color: 'danger',
          });
        }
        return;
      }

      // ✅ 성공 전 상태 로깅
      console.log('📞 [STRUCTURE_FORM] onStructureComplete 호출 준비:', {
        inputs: filteredValidInputs,
        inputCount: filteredValidInputs.length,
        callbackType: typeof onStructureComplete,
        timestamp: new Date().toISOString(),
      });

      // ✅ 사용자에게 처리 시작 알림
      if (typeof addToast === 'function') {
        addToast({
          title: '구조 설정 중',
          description: `${filteredValidInputs.length}개 섹션으로 구조를 생성하고 있습니다...`,
          color: 'primary',
        });
      }

      // ✅ 콜백 함수 실행
      console.log('📞 [STRUCTURE_FORM] onStructureComplete 호출 시작');
      onStructureComplete(filteredValidInputs);
      console.log('✅ [STRUCTURE_FORM] onStructureComplete 호출 완료');
    } catch (error) {
      console.error('❌ [STRUCTURE_FORM] 폼 제출 처리 실패:', error);

      if (typeof addToast === 'function') {
        addToast({
          title: '구조 설정 실패',
          description: '구조 설정 중 오류가 발생했습니다. 다시 시도해주세요.',
          color: 'danger',
        });
      }
    } finally {
      // 제출 상태 해제 (지연 처리로 중복 방지)
      setTimeout(() => {
        setIsSubmitting(false);
        console.log('🔄 [STRUCTURE_FORM] 제출 상태 해제 완료');
      }, 3000); // 3초 후 해제
    }

    console.log('🏁 [STRUCTURE_FORM] 폼 제출 처리 완료');
  }, [
    validatedSectionInputs,
    onStructureComplete,
    isSubmitting,
    lastSubmissionAttempt,
    activeIMECompositionCount,
    addToast,
  ]);

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

      {/* 🆕 에러 수정 상태 표시 */}
      <div className="p-3 text-xs border border-green-200 rounded-lg bg-green-50">
        <div className="mb-2 font-semibold text-green-800">
          ✅ 에러 수정 완료 - 안정화된 구조 설정!
        </div>
        <div className="grid grid-cols-2 gap-4 text-green-700">
          <div>
            <strong>수정사항:</strong>
            <br />• 일괄 컨테이너 추가 기능
            <br />• 강화된 예외 처리
            <br />• 중복 제출 방지
            <br />• 실시간 상태 디버깅
          </div>
          <div>
            <strong>현재 상태:</strong>
            <br />• 입력 필드 수: {validatedSectionInputs.length}개
            <br />• 유효 입력 수: {countOfValidInputs}개
            <br />• 제출 중: {isSubmitting ? '🔄' : '⏸️'}
            <br />• 폼 유효성: {isFormValidForSubmission ? '✅' : '❌'}
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
          isValid={isFormValidForSubmission && !isSubmitting} // 🆕 제출 중일 때 비활성화
          isLoading={isSubmitting} // 🆕 로딩 상태 전달
        />
      </div>

      {/* 🆕 상세 상태 디버깅 패널 */}
      <div className="p-4 text-center border border-blue-200 rounded-lg bg-blue-50">
        <p className="text-blue-800">
          🔍 <strong>디버깅 정보:</strong> 입력 개수:{' '}
          {validatedSectionInputs.length} | 유효성:{' '}
          {isFormValidForSubmission ? '✅' : '❌'} | 제출 상태:{' '}
          {isSubmitting ? '🔄 처리중' : '⏸️ 대기'} | 현재값: [
          {validatedSectionInputs
            .map((singleValue) => {
              const validValue =
                typeof singleValue === 'string' ? singleValue : '';
              return `"${validValue}"`;
            })
            .join(', ')}
          ]
        </p>

        {/* 🆕 IME 상태 표시 */}
        {activeIMECompositionCount > 0 ? (
          <p className="mt-2 text-orange-700">
            🎌 IME 입력 중: {activeIMECompositionCount}개 필드
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default React.memo(StructureInputForm);
