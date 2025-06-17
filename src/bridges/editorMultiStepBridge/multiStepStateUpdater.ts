import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import { EditorToMultiStepDataTransformationResult } from './bridgeTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 멀티스텝 폼 상태 업데이트를 담당하는 핸들러 생성 함수
// 에디터에서 변환된 데이터를 멀티스텝 폼 상태로 안전하게 업데이트
export const createMultiStepStateUpdater = () => {
  // 변환 결과의 유효성을 검증하는 함수
  // 데이터 무결성을 보장하여 잘못된 데이터로 인한 오류 방지
  const validateTransformationResultIntegrity = (
    editorToMultiStepTransformationResult: EditorToMultiStepDataTransformationResult
  ): boolean => {
    console.log('🔍 [UPDATER] 변환 결과 검증 시작');

    // null 또는 undefined 체크 - 기본적인 존재성 검증
    if (!editorToMultiStepTransformationResult) {
      console.error('❌ [UPDATER] 변환 결과가 null 또는 undefined');
      return false;
    }

    // 변환 결과 객체에서 각 필드 추출
    const {
      transformedContent: convertedEditorContent,
      transformedIsCompleted: isEditorWorkCompleted,
      transformedMetadata: editorContentMetadata,
      transformationSuccess: wasTransformationSuccessful,
      transformationErrors: encounteredTransformationErrors,
    } = editorToMultiStepTransformationResult;

    // 각 필드의 타입 유효성 검증 - 타입 안전성 보장
    const hasValidContentString = typeof convertedEditorContent === 'string';
    const hasValidCompletionBoolean =
      typeof isEditorWorkCompleted === 'boolean';
    const hasValidMetadataObject =
      editorContentMetadata && typeof editorContentMetadata === 'object';
    const hasValidSuccessBoolean =
      typeof wasTransformationSuccessful === 'boolean';
    const hasValidErrorsArray = Array.isArray(encounteredTransformationErrors);

    // 최종 유효성 판단 - 모든 조건이 충족되고 변환이 성공했을 때만 유효
    const isCompletelyValidTransformationResult =
      hasValidContentString &&
      hasValidCompletionBoolean &&
      hasValidMetadataObject &&
      hasValidSuccessBoolean &&
      hasValidErrorsArray &&
      wasTransformationSuccessful;

    console.log('📊 [UPDATER] 변환 결과 검증 완료:', {
      hasValidContentString,
      hasValidCompletionBoolean,
      hasValidMetadataObject,
      hasValidSuccessBoolean,
      hasValidErrorsArray,
      wasTransformationSuccessful,
      errorCount: encounteredTransformationErrors.length,
      isCompletelyValidTransformationResult,
    });

    return isCompletelyValidTransformationResult;
  };

  // 현재 멀티스텝 폼의 상태를 조회하는 함수
  // 상태 업데이트 전 현재 상태를 파악하여 안전한 업데이트 수행
  const retrieveCurrentMultiStepFormState = () => {
    console.log('🔍 [UPDATER] 현재 멀티스텝 상태 조회 시작');

    try {
      // Zustand 스토어에서 현재 상태 추출
      const currentMultiStepFormStore = useMultiStepFormStore.getState();

      // 스토어 존재성 검증 - 스토어가 초기화되지 않았을 경우 대응
      if (!currentMultiStepFormStore) {
        console.error('❌ [UPDATER] 멀티스텝 스토어 상태가 존재하지 않음');
        return null;
      }

      // 스토어에서 필요한 상태 필드들을 안전하게 추출
      const {
        formValues: currentFormValues = {},
        currentStep: activeStepNumber = 1,
        progressWidth: currentProgressWidth = 0,
        showPreview: isPreviewModeActive = false,
        editorCompletedContent: existingEditorContent = '',
        isEditorCompleted: isCurrentEditorCompleted = false,
      } = currentMultiStepFormStore;

      // 조회된 상태를 정리된 객체로 반환
      const retrievedCurrentState = {
        formValues: currentFormValues,
        currentStep: activeStepNumber,
        progressWidth: currentProgressWidth,
        showPreview: isPreviewModeActive,
        editorCompletedContent: existingEditorContent,
        isEditorCompleted: isCurrentEditorCompleted,
      };

      console.log('✅ [UPDATER] 현재 상태 조회 완료:', {
        currentStep: activeStepNumber,
        hasFormValues: Object.keys(currentFormValues).length > 0,
        editorContentLength: existingEditorContent.length,
        isEditorCompleted: isCurrentEditorCompleted,
      });

      return retrievedCurrentState;
    } catch (stateRetrievalError) {
      console.error('❌ [UPDATER] 상태 조회 중 오류:', stateRetrievalError);
      return null;
    }
  };

  // 멀티스텝 폼의 에디터 콘텐츠를 업데이트하는 비동기 함수
  // 변환된 에디터 데이터를 멀티스텝 폼에 안전하게 반영
  const updateEditorContentInMultiStepForm = async (
    editorToMultiStepTransformationResult: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 멀티스텝 에디터 콘텐츠 업데이트 시작');

    // 변환 결과 유효성 사전 검증
    const isValidTransformationResult = validateTransformationResultIntegrity(
      editorToMultiStepTransformationResult
    );

    if (!isValidTransformationResult) {
      console.error('❌ [UPDATER] 유효하지 않은 변환 결과');
      return false;
    }

    try {
      // 변환 결과에서 업데이트할 데이터 추출
      const {
        transformedContent: newEditorContent,
        transformedIsCompleted: updatedCompletionStatus,
      } = editorToMultiStepTransformationResult;

      // 멀티스텝 스토어 접근
      const multiStepFormStore = useMultiStepFormStore.getState();

      if (!multiStepFormStore) {
        console.error('❌ [UPDATER] 멀티스텝 스토어에 접근할 수 없음');
        return false;
      }

      // 스토어에서 업데이트 함수들 추출
      const {
        updateEditorContent: setEditorContentInStore,
        setEditorCompleted: setEditorCompletionStatus,
      } = multiStepFormStore;

      // 함수 존재성 검증 - 스토어 API 안전성 확보
      if (typeof setEditorContentInStore !== 'function') {
        console.error('❌ [UPDATER] updateEditorContent 함수가 존재하지 않음');
        return false;
      }

      if (typeof setEditorCompletionStatus !== 'function') {
        console.error('❌ [UPDATER] setEditorCompleted 함수가 존재하지 않음');
        return false;
      }

      // 실제 상태 업데이트 수행
      console.log('🔄 [UPDATER] 에디터 콘텐츠 업데이트 실행');
      setEditorContentInStore(newEditorContent);

      console.log('🔄 [UPDATER] 에디터 완료 상태 업데이트 실행');
      setEditorCompletionStatus(updatedCompletionStatus);

      console.log('✅ [UPDATER] 멀티스텝 상태 업데이트 완료:', {
        contentLength: newEditorContent.length,
        isCompleted: updatedCompletionStatus,
      });

      return true;
    } catch (updateError) {
      console.error('❌ [UPDATER] 업데이트 중 오류:', updateError);
      return false;
    }
  };

  // 멀티스텝 폼의 특정 필드 값을 업데이트하는 비동기 함수
  // 타입 안전성을 보장하면서 동적으로 폼 필드 업데이트
  const updateSpecificFormFieldInMultiStep = async <K extends keyof FormValues>(
    targetFieldName: K, // FormValues의 키만 허용하여 타입 안전성 보장
    newFieldValue: FormValues[K] // 해당 키에 맞는 값 타입만 허용
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 멀티스텝 폼 값 업데이트 시작:', {
      fieldName: targetFieldName,
      fieldValue: newFieldValue,
    });

    // 필드명 유효성 검증 - 빈 문자열이나 유효하지 않은 키 방지
    if (
      !targetFieldName ||
      (typeof targetFieldName === 'string' &&
        targetFieldName.trim().length === 0)
    ) {
      console.error('❌ [UPDATER] 유효하지 않은 필드명:', targetFieldName);
      return false;
    }

    try {
      // 멀티스텝 스토어 접근
      const multiStepFormStore = useMultiStepFormStore.getState();

      if (!multiStepFormStore) {
        console.error('❌ [UPDATER] 멀티스텝 스토어에 접근할 수 없음');
        return false;
      }

      // 업데이트 함수 추출 및 존재성 검증
      const { updateFormValue: updateSingleFormValue } = multiStepFormStore;

      if (typeof updateSingleFormValue !== 'function') {
        console.error('❌ [UPDATER] updateFormValue 함수가 존재하지 않음');
        return false;
      }

      // 타입 안전한 폼 값 업데이트 수행
      updateSingleFormValue(targetFieldName, newFieldValue);

      console.log('✅ [UPDATER] 폼 값 업데이트 완료:', {
        fieldName: targetFieldName,
      });
      return true;
    } catch (updateError) {
      console.error('❌ [UPDATER] 폼 값 업데이트 중 오류:', updateError);
      return false;
    }
  };

  // 에디터 콘텐츠 업데이트만 수행하는 간소화된 업데이트 함수
  // 자동 스텝 이동 없이 데이터만 동기화
  const executeSimpleStateUpdate = async (
    editorToMultiStepTransformationResult: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 간단한 상태 업데이트 시작');

    const updateProcessStartTime = performance.now();

    try {
      // 에디터 콘텐츠 업데이트
      const editorContentUpdateSuccessful =
        await updateEditorContentInMultiStepForm(
          editorToMultiStepTransformationResult
        );

      if (!editorContentUpdateSuccessful) {
        console.error('❌ [UPDATER] 에디터 콘텐츠 업데이트 실패');
        return false;
      }

      // 폼 필드 업데이트 (에디터 콘텐츠를 폼 값에도 반영)
      const { transformedContent: finalTransformedContent } =
        editorToMultiStepTransformationResult;

      const formFieldUpdateSuccessful =
        await updateSpecificFormFieldInMultiStep(
          'editorCompletedContent', // 타입 안전한 키 사용
          finalTransformedContent
        );

      if (!formFieldUpdateSuccessful) {
        console.error('❌ [UPDATER] 폼 값 업데이트 실패');
        return false;
      }

      const updateProcessEndTime = performance.now();
      const totalUpdateDuration = updateProcessEndTime - updateProcessStartTime;

      console.log('✅ [UPDATER] 간단한 상태 업데이트 완료:', {
        updateSuccessful: true,
        duration: `${totalUpdateDuration.toFixed(2)}ms`,
      });

      return true;
    } catch (simpleUpdateError) {
      console.error(
        '❌ [UPDATER] 간단한 상태 업데이트 중 오류:',
        simpleUpdateError
      );
      return false;
    }
  };

  return {
    validateTransformationResult: validateTransformationResultIntegrity,
    getCurrentMultiStepState: retrieveCurrentMultiStepFormState,
    updateEditorContentInMultiStep: updateEditorContentInMultiStepForm,
    updateFormValueInMultiStep: updateSpecificFormFieldInMultiStep,
    performCompleteStateUpdate: executeSimpleStateUpdate, // 자동 스텝 이동 제거된 버전
  };
};
