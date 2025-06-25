// bridges/editorMultiStepBridge/multiStepToEditorTransformer.ts

import {
  MultiStepFormSnapshotForBridge,
  MultiStepToEditorDataTransformationResult,
} from './bridgeDataTypes';

export const createMultiStepToEditorTransformer = () => {
  // 🔧 콘텐츠 메타데이터 생성 함수
  const createContentMetadata = (
    contentLength: number,
    isCompleted: boolean,
    transformationSuccess: boolean,
    transformationTime: number
  ) => {
    return new Map<string, string | number | boolean>([
      ['contentLength', contentLength],
      ['isCompleted', isCompleted],
      ['transformationSuccess', transformationSuccess],
      ['transformationTime', transformationTime],
      ['transformerVersion', '1.0.0'],
      ['sourceType', 'MULTISTEP_FORM'],
      ['targetType', 'EDITOR_STATE'],
      ['hasValidContent', contentLength > 0],
    ]);
  };

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
    const transformationStartTime = performance.now();

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
      const transformationEndTime = performance.now();
      const transformationDuration =
        transformationEndTime - transformationStartTime;

      // 🔧 contentMetadata 생성
      const contentMetadata = createContentMetadata(
        editorContent.length,
        editorIsCompleted,
        transformationSuccess,
        transformationDuration
      );

      const transformedData: MultiStepToEditorDataTransformationResult = {
        editorContent,
        editorIsCompleted,
        transformationSuccess,
        transformationErrors: [],
        transformedTimestamp: Date.now(),
        contentMetadata, // 🔧 누락된 속성 추가
      };

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        contentLength: editorContent.length,
        isCompleted: editorIsCompleted,
        hasValidContent,
        success: transformationSuccess,
        duration: `${transformationDuration.toFixed(2)}ms`,
      });

      return transformedData;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 실패:', error);

      const transformationEndTime = performance.now();
      const transformationDuration =
        transformationEndTime - transformationStartTime;

      const errorMessage =
        error instanceof Error ? error.message : '변환 중 알 수 없는 오류';

      // 🔧 실패한 경우에도 contentMetadata 추가
      const failureContentMetadata = createContentMetadata(
        0,
        false,
        false,
        transformationDuration
      );

      return {
        editorContent: '',
        editorIsCompleted: false,
        transformationSuccess: false,
        transformationErrors: [errorMessage],
        transformedTimestamp: Date.now(),
        contentMetadata: failureContentMetadata, // 🔧 누락된 속성 추가
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
    const hasValidMetadata = result.contentMetadata instanceof Map; // 🔧 contentMetadata 검증 추가

    return (
      hasValidContent &&
      hasValidCompletion &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidTimestamp &&
      hasValidMetadata
    );
  };

  const createEmptyTransformationResult =
    (): MultiStepToEditorDataTransformationResult => {
      const currentTimestamp = Date.now();

      // 🔧 빈 결과에도 contentMetadata 추가
      const emptyContentMetadata = createContentMetadata(0, false, false, 0);

      return {
        editorContent: '',
        editorIsCompleted: false,
        transformationSuccess: false,
        transformationErrors: ['Empty transformation result'],
        transformedTimestamp: currentTimestamp,
        contentMetadata: emptyContentMetadata, // 🔧 누락된 속성 추가
      };
    };

  // 🔧 추가 유틸리티 함수들
  const analyzeContentQuality = (content: string) => {
    const wordCount = content
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const characterCount = content.length;
    const lineCount = content.split('\n').length;
    const hasMarkdown = /[#*`\[\]]/g.test(content);

    return {
      wordCount,
      characterCount,
      lineCount,
      hasMarkdown,
      qualityScore: Math.min(100, wordCount * 2 + (hasMarkdown ? 20 : 0)),
    };
  };

  const extractAdditionalFormData = (
    snapshot: MultiStepFormSnapshotForBridge
  ) => {
    try {
      const { formValues } = snapshot;

      if (!formValues) {
        return null;
      }

      return {
        title: formValues.title || '',
        description: formValues.description || '',
        tags: formValues.tags || '',
        nickname: formValues.nickname || '',
        email:
          formValues.emailPrefix && formValues.emailDomain
            ? `${formValues.emailPrefix}@${formValues.emailDomain}`
            : '',
        hasMedia:
          Array.isArray(formValues.media) && formValues.media.length > 0,
        hasMainImage: Boolean(formValues.mainImage),
        sliderImageCount: Array.isArray(formValues.sliderImages)
          ? formValues.sliderImages.length
          : 0,
      };
    } catch (error) {
      console.error('❌ [TRANSFORMER] 추가 폼 데이터 추출 실패:', error);
      return null;
    }
  };

  return {
    extractEditorContentFromSnapshot,
    extractEditorCompletionFromSnapshot,
    validateSnapshotForTransformation,
    transformMultiStepToEditor,
    validateTransformationResult,
    createEmptyTransformationResult,
    analyzeContentQuality,
    extractAdditionalFormData,
  };
};
