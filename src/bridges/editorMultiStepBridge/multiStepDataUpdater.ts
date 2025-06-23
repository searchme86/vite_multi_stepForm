// bridges/editorMultiStepBridge/multiStepDataUpdater.ts

import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import { EditorToMultiStepDataTransformationResult } from './bridgeDataTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

export const createMultiStepStateUpdater = () => {
  const validateResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    console.log('🔍 [UPDATER] 변환 결과 검증');

    if (!result) {
      console.error('❌ [UPDATER] 변환 결과가 null');
      return false;
    }

    const {
      transformedContent,
      transformedIsCompleted,
      transformedMetadata,
      transformationSuccess,
      transformationErrors,
    } = result;

    const hasValidContent = typeof transformedContent === 'string';
    const hasValidCompleted = typeof transformedIsCompleted === 'boolean';
    const hasValidMetadata =
      transformedMetadata && typeof transformedMetadata === 'object';
    const hasValidSuccess = typeof transformationSuccess === 'boolean';
    const hasValidErrors = Array.isArray(transformationErrors);

    const isValid =
      hasValidContent &&
      hasValidCompleted &&
      hasValidMetadata &&
      hasValidSuccess &&
      hasValidErrors &&
      transformationSuccess;

    console.log('📊 [UPDATER] 검증 결과:', {
      hasValidContent,
      hasValidCompleted,
      hasValidMetadata,
      hasValidSuccess,
      hasValidErrors,
      transformationSuccess,
      isValid,
    });

    return isValid;
  };

  const getCurrentState = () => {
    console.log('🔍 [UPDATER] 현재 상태 조회');

    try {
      const store = useMultiStepFormStore.getState();

      if (!store) {
        console.error('❌ [UPDATER] 멀티스텝 스토어 없음');
        return null;
      }

      const {
        formValues = {},
        currentStep = 1,
        progressWidth = 0,
        showPreview = false,
        editorCompletedContent = '',
        isEditorCompleted = false,
      } = store;

      const currentState = {
        formValues,
        currentStep,
        progressWidth,
        showPreview,
        editorCompletedContent,
        isEditorCompleted,
      };

      console.log('✅ [UPDATER] 상태 조회 완료:', {
        currentStep,
        hasFormValues: Object.keys(formValues).length > 0,
        contentLength: editorCompletedContent.length,
        isEditorCompleted,
      });

      return currentState;
    } catch (error) {
      console.error('❌ [UPDATER] 상태 조회 실패:', error);
      return null;
    }
  };

  const updateEditorContent = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 에디터 콘텐츠 업데이트');

    if (!validateResult(result)) {
      console.error('❌ [UPDATER] 유효하지 않은 결과');
      return false;
    }

    try {
      const { transformedContent, transformedIsCompleted } = result;
      const store = useMultiStepFormStore.getState();

      if (!store) {
        console.error('❌ [UPDATER] 스토어 접근 불가');
        return false;
      }

      const { updateEditorContent, setEditorCompleted } = store;

      if (typeof updateEditorContent !== 'function') {
        console.error('❌ [UPDATER] updateEditorContent 함수 없음');
        return false;
      }

      if (typeof setEditorCompleted !== 'function') {
        console.error('❌ [UPDATER] setEditorCompleted 함수 없음');
        return false;
      }

      console.log('🔄 [UPDATER] 콘텐츠 업데이트 실행');
      updateEditorContent(transformedContent);

      console.log('🔄 [UPDATER] 완료 상태 업데이트 실행');
      setEditorCompleted(transformedIsCompleted);

      console.log('✅ [UPDATER] 업데이트 완료:', {
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
      });

      return true;
    } catch (error) {
      console.error('❌ [UPDATER] 업데이트 중 오류:', error);
      return false;
    }
  };

  const updateFormField = async <K extends keyof FormValues>(
    fieldName: K,
    fieldValue: FormValues[K]
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 폼 필드 업데이트:', { fieldName, fieldValue });

    if (
      !fieldName ||
      (typeof fieldName === 'string' && fieldName.trim().length === 0)
    ) {
      console.error('❌ [UPDATER] 유효하지 않은 필드명:', fieldName);
      return false;
    }

    try {
      const store = useMultiStepFormStore.getState();

      if (!store) {
        console.error('❌ [UPDATER] 스토어 접근 불가');
        return false;
      }

      const { updateFormValue } = store;

      if (typeof updateFormValue !== 'function') {
        console.error('❌ [UPDATER] updateFormValue 함수 없음');
        return false;
      }

      updateFormValue(fieldName, fieldValue);

      console.log('✅ [UPDATER] 폼 필드 업데이트 완료:', { fieldName });
      return true;
    } catch (error) {
      console.error('❌ [UPDATER] 폼 필드 업데이트 실패:', error);
      return false;
    }
  };

  const performCompleteStateUpdate = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 전체 상태 업데이트 시작');

    const startTime = performance.now();

    try {
      const editorUpdateSuccess = await updateEditorContent(result);
      if (!editorUpdateSuccess) {
        console.error('❌ [UPDATER] 에디터 콘텐츠 업데이트 실패');
        return false;
      }

      const { transformedContent } = result;
      const formUpdateSuccess = await updateFormField(
        'editorCompletedContent',
        transformedContent
      );
      if (!formUpdateSuccess) {
        console.error('❌ [UPDATER] 폼 필드 업데이트 실패');
        return false;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('✅ [UPDATER] 전체 업데이트 완료:', {
        success: true,
        duration: `${duration.toFixed(2)}ms`,
      });

      return true;
    } catch (error) {
      console.error('❌ [UPDATER] 전체 업데이트 중 오류:', error);
      return false;
    }
  };

  return {
    validateTransformationResult: validateResult,
    getCurrentMultiStepState: getCurrentState,
    updateEditorContentInMultiStep: updateEditorContent,
    updateFormValueInMultiStep: updateFormField,
    performCompleteStateUpdate,
  };
};
