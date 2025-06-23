// bridges/editorMultiStepBridge/dataTransformer.ts

import {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  EditorContentMetadataForBridge,
} from './bridgeTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';

export const createEditorToMultiStepDataTransformer = () => {
  const calculateMetadata = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorContentMetadataForBridge => {
    console.log('📊 [TRANSFORMER] 메타데이터 계산');

    const {
      editorContainers = [],
      editorParagraphs = [],
      editorCompletedContent = '',
    } = snapshot;

    const safeContainers = Array.isArray(editorContainers)
      ? editorContainers
      : [];
    const safeParagraphs = Array.isArray(editorParagraphs)
      ? editorParagraphs
      : [];
    const safeContent =
      typeof editorCompletedContent === 'string' ? editorCompletedContent : '';

    const assignedParagraphs = safeParagraphs.filter(
      (p) => p.containerId !== null
    );
    const unassignedParagraphs = safeParagraphs.filter(
      (p) => p.containerId === null
    );

    const metadata: EditorContentMetadataForBridge = {
      containerCount: safeContainers.length,
      paragraphCount: safeParagraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength: safeContent.length,
      lastModified: new Date(),
    };

    console.log('✅ [TRANSFORMER] 메타데이터 완료:', metadata);
    return metadata;
  };

  const transformToString = (
    snapshot: EditorStateSnapshotForBridge
  ): string => {
    console.log('🔄 [TRANSFORMER] 문자열 변환');

    const {
      editorContainers = [],
      editorParagraphs = [],
      editorCompletedContent = '',
    } = snapshot;

    const safeContainers = Array.isArray(editorContainers)
      ? editorContainers
      : [];
    const safeParagraphs = Array.isArray(editorParagraphs)
      ? editorParagraphs
      : [];
    const fallbackContent =
      typeof editorCompletedContent === 'string' ? editorCompletedContent : '';

    if (safeContainers.length === 0 || safeParagraphs.length === 0) {
      console.warn('⚠️ [TRANSFORMER] 데이터 부족, 기본 콘텐츠 사용');
      return fallbackContent;
    }

    try {
      const generatedContent = generateCompletedContent(
        safeContainers,
        safeParagraphs
      );
      const finalContent = generatedContent || fallbackContent;

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        originalLength: fallbackContent.length,
        generatedLength: generatedContent.length,
        finalLength: finalContent.length,
      });

      return finalContent;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 중 오류:', error);
      return fallbackContent;
    }
  };

  const validateInput = (snapshot: EditorStateSnapshotForBridge): string[] => {
    console.log('🔍 [TRANSFORMER] 입력 검증');

    const errors: string[] = [];

    if (!snapshot) {
      errors.push('스냅샷이 null 또는 undefined');
      return errors;
    }

    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      editorIsCompleted,
      extractedTimestamp,
    } = snapshot;

    if (!Array.isArray(editorContainers)) {
      errors.push('컨테이너가 배열이 아님');
    }

    if (!Array.isArray(editorParagraphs)) {
      errors.push('문단이 배열이 아님');
    }

    if (typeof editorCompletedContent !== 'string') {
      errors.push('완성된 콘텐츠가 문자열이 아님');
    }

    if (typeof editorIsCompleted !== 'boolean') {
      errors.push('완성 상태가 불린이 아님');
    }

    if (typeof extractedTimestamp !== 'number' || extractedTimestamp <= 0) {
      errors.push('타임스탬프가 유효하지 않음');
    }

    console.log('📊 [TRANSFORMER] 입력 검증 결과:', {
      errorCount: errors.length,
      errors,
    });

    return errors;
  };

  const transformEditorStateToMultiStep = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🔄 [TRANSFORMER] 에디터 → 멀티스텝 변환 시작');

    const startTime = performance.now();

    // 1. 입력 검증
    const inputErrors = validateInput(snapshot);
    if (inputErrors.length > 0) {
      console.error('❌ [TRANSFORMER] 입력 검증 실패:', inputErrors);

      return {
        transformedContent: '',
        transformedIsCompleted: false,
        transformedMetadata: {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          lastModified: new Date(),
        },
        transformationSuccess: false,
        transformationErrors: inputErrors,
      };
    }

    try {
      // 2. 콘텐츠 변환
      const transformedContent = transformToString(snapshot);

      // 3. 메타데이터 생성
      const metadata = calculateMetadata(snapshot);

      // 4. 완료 상태 추출
      const { editorIsCompleted = false } = snapshot;

      const result: EditorToMultiStepDataTransformationResult = {
        transformedContent,
        transformedIsCompleted: Boolean(editorIsCompleted),
        transformedMetadata: metadata,
        transformationSuccess: true,
        transformationErrors: [],
      };

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        contentLength: transformedContent.length,
        isCompleted: result.transformedIsCompleted,
        duration: `${duration.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 중 예외:', error);

      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 변환 오류';

      return {
        transformedContent: '',
        transformedIsCompleted: false,
        transformedMetadata: {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          lastModified: new Date(),
        },
        transformationSuccess: false,
        transformationErrors: [errorMessage],
      };
    }
  };

  return {
    calculateEditorMetadata: calculateMetadata,
    transformContentToString: transformToString,
    validateTransformationInput: validateInput,
    transformEditorStateToMultiStep,
  };
};
