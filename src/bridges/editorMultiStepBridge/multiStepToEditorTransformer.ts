// bridges/editorMultiStepBridge/multiStepToEditorTransformer.ts

import {
  MultiStepFormSnapshotForBridge,
  MultiStepToEditorDataTransformationResult,
} from './bridgeDataTypes';

export const createMultiStepToEditorTransformer = () => {
  const extractEditorContentFromSnapshot = (
    snapshot: MultiStepFormSnapshotForBridge
  ): string => {
    try {
      const { formValues } = snapshot;

      if (!formValues || typeof formValues !== 'object') {
        console.warn('⚠️ [TRANSFORMER] 유효하지 않은 formValues');
        return '';
      }

      const editorContent = formValues.editorCompletedContent || '';

      console.log('📄 [TRANSFORMER] Editor 콘텐츠 추출:', {
        contentLength: editorContent.length,
        hasContent: editorContent.length > 0,
      });

      return editorContent;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 콘텐츠 추출 실패:', error);
      return '';
    }
  };

  const extractEditorCompletionFromSnapshot = (
    snapshot: MultiStepFormSnapshotForBridge
  ): boolean => {
    try {
      const { formValues } = snapshot;

      if (!formValues || typeof formValues !== 'object') {
        console.warn('⚠️ [TRANSFORMER] 유효하지 않은 formValues');
        return false;
      }

      const isCompleted = Boolean(formValues.isEditorCompleted);

      console.log('✅ [TRANSFORMER] Editor 완료 상태 추출:', {
        isCompleted,
      });

      return isCompleted;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 완료 상태 추출 실패:', error);
      return false;
    }
  };

  const validateSnapshotForTransformation = (
    snapshot: MultiStepFormSnapshotForBridge | null
  ): boolean => {
    if (!snapshot || typeof snapshot !== 'object') {
      return false;
    }

    const hasFormValues =
      snapshot.formValues && typeof snapshot.formValues === 'object';
    const hasTimestamp = typeof snapshot.snapshotTimestamp === 'number';
    const hasCurrentStep = typeof snapshot.formCurrentStep === 'number';

    return hasFormValues && hasTimestamp && hasCurrentStep;
  };

  const transformMultiStepToEditor = (
    snapshot: MultiStepFormSnapshotForBridge | null
  ): MultiStepToEditorDataTransformationResult => {
    console.log('🔄 [TRANSFORMER] MultiStep → Editor 변환 시작');

    try {
      if (!snapshot) {
        throw new Error('MultiStep 스냅샷이 null입니다');
      }

      if (!validateSnapshotForTransformation(snapshot)) {
        throw new Error('유효하지 않은 MultiStep 스냅샷 구조');
      }

      const editorContent = extractEditorContentFromSnapshot(snapshot);
      const editorIsCompleted = extractEditorCompletionFromSnapshot(snapshot);

      const hasValidContent = editorContent.length > 0;
      const transformationSuccess = true;

      const transformedData: MultiStepToEditorDataTransformationResult = {
        editorContent,
        editorIsCompleted,
        transformationSuccess,
        transformationErrors: [],
        transformedTimestamp: Date.now(),
      };

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        contentLength: editorContent.length,
        isCompleted: editorIsCompleted,
        hasValidContent,
        success: transformationSuccess,
      });

      return transformedData;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 실패:', error);

      const errorMessage =
        error instanceof Error ? error.message : '변환 중 알 수 없는 오류';

      return {
        editorContent: '',
        editorIsCompleted: false,
        transformationSuccess: false,
        transformationErrors: [errorMessage],
        transformedTimestamp: Date.now(),
      };
    }
  };

  const validateTransformationResult = (
    result: MultiStepToEditorDataTransformationResult
  ): boolean => {
    if (!result || typeof result !== 'object') {
      return false;
    }

    const hasValidContent = typeof result.editorContent === 'string';
    const hasValidCompletion = typeof result.editorIsCompleted === 'boolean';
    const hasValidSuccess = typeof result.transformationSuccess === 'boolean';
    const hasValidErrors = Array.isArray(result.transformationErrors);
    const hasValidTimestamp = typeof result.transformedTimestamp === 'number';

    return (
      hasValidContent &&
      hasValidCompletion &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidTimestamp
    );
  };

  const createEmptyTransformationResult =
    (): MultiStepToEditorDataTransformationResult => {
      return {
        editorContent: '',
        editorIsCompleted: false,
        transformationSuccess: false,
        transformationErrors: ['Empty transformation result'],
        transformedTimestamp: Date.now(),
      };
    };

  return {
    extractEditorContentFromSnapshot,
    extractEditorCompletionFromSnapshot,
    validateSnapshotForTransformation,
    transformMultiStepToEditor,
    validateTransformationResult,
    createEmptyTransformationResult,
  };
};
