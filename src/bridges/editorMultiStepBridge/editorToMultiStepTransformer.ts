// bridges/editorMultiStepBridge/editorToMultiStepTransformer.ts

import {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  EditorContentMetadataForBridge,
} from './bridgeDataTypes';

export const createDataStructureTransformer = () => {
  // 🔧 개선된 마크다운 콘텐츠 생성 - 다중 전략 적용
  const generateMarkdownContent = (
    snapshot: EditorStateSnapshotForBridge
  ): string => {
    console.log('🔄 [TRANSFORMER] 마크다운 콘텐츠 생성 시작');

    const { editorContainers, editorParagraphs, editorCompletedContent } =
      snapshot;

    // 🔧 전략 1: 이미 완성된 콘텐츠가 있는 경우 우선 사용
    if (
      editorCompletedContent &&
      typeof editorCompletedContent === 'string' &&
      editorCompletedContent.trim().length > 0
    ) {
      console.log('✅ [TRANSFORMER] 기존 완성된 콘텐츠 사용:', {
        contentLength: editorCompletedContent.length,
        strategy: 'EXISTING_COMPLETED_CONTENT',
      });
      return editorCompletedContent.trim();
    }

    // 🔧 전략 2: 컨테이너와 문단이 없는 경우 빈 콘텐츠 반환
    if (!editorContainers?.length || !editorParagraphs?.length) {
      console.warn(
        '⚠️ [TRANSFORMER] 컨테이너 또는 문단이 없음, 빈 콘텐츠 반환'
      );
      return '';
    }

    console.log('🔄 [TRANSFORMER] 컨테이너와 문단으로부터 마크다운 생성:', {
      containerCount: editorContainers.length,
      paragraphCount: editorParagraphs.length,
      strategy: 'CONTAINER_PARAGRAPH_REBUILD',
    });

    // 🔧 전략 3: 컨테이너와 문단으로부터 마크다운 재구성
    try {
      const sortedContainers = [...editorContainers].sort(
        (a, b) => (a?.order || 0) - (b?.order || 0)
      );

      let markdownContent = '';
      const contentSections: string[] = [];

      sortedContainers.forEach((container, containerIndex) => {
        if (!container?.id || !container?.name) {
          console.warn(
            `⚠️ [TRANSFORMER] 유효하지 않은 컨테이너 ${containerIndex}:`,
            container
          );
          return;
        }

        const containerParagraphs = editorParagraphs
          .filter((p) => p && p.containerId === container.id)
          .sort((a, b) => (a?.order || 0) - (b?.order || 0));

        console.log(`📄 [TRANSFORMER] 컨테이너 "${container.name}" 처리:`, {
          containerId: container.id,
          paragraphCount: containerParagraphs.length,
        });

        if (containerParagraphs.length > 0) {
          // 컨테이너 헤더 추가 (## 형식)
          contentSections.push(`## ${container.name}`);
          contentSections.push(''); // 빈 줄

          // 문단 내용 추가
          containerParagraphs.forEach((paragraph, paragraphIndex) => {
            if (paragraph?.content && paragraph.content.trim()) {
              console.log(`📝 [TRANSFORMER] 문단 ${paragraphIndex + 1} 추가:`, {
                contentLength: paragraph.content.length,
                preview: paragraph.content.substring(0, 50) + '...',
              });
              contentSections.push(paragraph.content.trim());
              contentSections.push(''); // 문단 간 빈 줄
            }
          });
        } else {
          console.warn(
            `⚠️ [TRANSFORMER] 컨테이너 "${container.name}"에 문단이 없음`
          );
        }
      });

      markdownContent = contentSections.join('\n').trim();

      console.log('✅ [TRANSFORMER] 마크다운 생성 완료:', {
        finalContentLength: markdownContent.length,
        sectionCount: contentSections.length,
        strategy: 'CONTAINER_PARAGRAPH_REBUILD',
        preview: markdownContent.substring(0, 200) + '...',
      });

      return markdownContent;
    } catch (rebuildError) {
      console.error('❌ [TRANSFORMER] 마크다운 재구성 실패:', rebuildError);

      // 🔧 전략 4: 최후의 수단 - 모든 문단 내용만 합치기
      try {
        console.log('🔄 [TRANSFORMER] 최후의 수단: 모든 문단 내용 합치기');

        const allParagraphContents = editorParagraphs
          .filter((p) => p && p.content && p.content.trim())
          .sort((a, b) => (a?.order || 0) - (b?.order || 0))
          .map((p) => p.content.trim());

        const fallbackContent = allParagraphContents.join('\n\n');

        console.log('✅ [TRANSFORMER] 최후의 수단 성공:', {
          contentLength: fallbackContent.length,
          paragraphCount: allParagraphContents.length,
          strategy: 'PARAGRAPH_ONLY_FALLBACK',
        });

        return fallbackContent;
      } catch (fallbackError) {
        console.error('❌ [TRANSFORMER] 최후의 수단도 실패:', fallbackError);
        return '';
      }
    }
  };

  const createContentMetadata = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorContentMetadataForBridge => {
    console.log('📊 [TRANSFORMER] 콘텐츠 메타데이터 생성');

    const { editorContainers, editorParagraphs } = snapshot;

    // 🔧 안전한 배열 처리
    const safeContainers = Array.isArray(editorContainers)
      ? editorContainers
      : [];
    const safeParagraphs = Array.isArray(editorParagraphs)
      ? editorParagraphs
      : [];

    const assignedParagraphs = safeParagraphs.filter(
      (p) => p && p.containerId !== null
    );
    const unassignedParagraphs = safeParagraphs.filter(
      (p) => p && p.containerId === null
    );

    const totalContentLength = safeParagraphs.reduce(
      (total, p) => total + (p?.content?.length || 0),
      0
    );

    const metadata: EditorContentMetadataForBridge = {
      containerCount: safeContainers.length,
      paragraphCount: safeParagraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength,
      lastModified: new Date(),
    };

    console.log('✅ [TRANSFORMER] 메타데이터 생성 완료:', metadata);

    return metadata;
  };

  // 🔧 강화된 에디터 → 멀티스텝 변환
  const transformEditorStateToMultiStep = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🔄 [TRANSFORMER] Editor → MultiStep 변환 시작');
    console.log('📊 [TRANSFORMER] 입력 스냅샷 분석:', {
      hasSnapshot: !!snapshot,
      snapshotKeys: snapshot ? Object.keys(snapshot) : [],
      containerCount: snapshot?.editorContainers?.length || 0,
      paragraphCount: snapshot?.editorParagraphs?.length || 0,
      hasCompletedContent: !!(
        snapshot?.editorCompletedContent &&
        snapshot.editorCompletedContent.length > 0
      ),
      completedContentLength: snapshot?.editorCompletedContent?.length || 0,
      isCompleted: snapshot?.editorIsCompleted,
      timestamp: snapshot?.extractedTimestamp,
    });

    try {
      // 🔧 1단계: 입력 검증
      if (!snapshot || typeof snapshot !== 'object') {
        throw new Error('유효하지 않은 스냅샷 데이터');
      }

      const { editorContainers, editorParagraphs, editorIsCompleted } =
        snapshot;

      if (
        !Array.isArray(editorContainers) ||
        !Array.isArray(editorParagraphs)
      ) {
        throw new Error('컨테이너 또는 문단이 배열이 아닙니다');
      }

      // 🔧 2단계: 마크다운 콘텐츠 생성
      const transformedContent = generateMarkdownContent(snapshot);

      // 🔧 3단계: 메타데이터 생성
      const transformedMetadata = createContentMetadata(snapshot);

      // 🔧 4단계: 완성 상태 결정 (더 관대한 기준)
      const hasContent =
        transformedContent && transformedContent.trim().length > 0;
      const hasStructure =
        editorContainers.length > 0 || editorParagraphs.length > 0;

      // 관대한 완성 조건: 콘텐츠가 있거나 구조가 있으면 OK
      const transformedIsCompleted =
        hasContent || hasStructure || editorIsCompleted;

      // 🔧 5단계: 결과 구성
      const result: EditorToMultiStepDataTransformationResult = {
        transformedContent,
        transformedIsCompleted,
        transformedMetadata,
        transformationSuccess: true,
        transformationErrors: [],
      };

      console.log('✅ [TRANSFORMER] 변환 성공:', {
        originalContentLength: snapshot.editorCompletedContent?.length || 0,
        transformedContentLength: transformedContent.length,
        originalCompleted: editorIsCompleted,
        transformedCompleted: transformedIsCompleted,
        hasContent,
        hasStructure,
        containerCount: transformedMetadata.containerCount,
        paragraphCount: transformedMetadata.paragraphCount,
        transformationStrategy:
          transformedContent === snapshot.editorCompletedContent
            ? 'EXISTING_CONTENT_USED'
            : 'CONTENT_REGENERATED',
      });

      return result;
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 실패:', error);

      // 🔧 에러 발생 시 기본 결과 반환
      const errorResult: EditorToMultiStepDataTransformationResult = {
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
        transformationErrors: [
          error instanceof Error
            ? error.message
            : 'Unknown transformation error',
        ],
      };

      console.log('⚠️ [TRANSFORMER] 에러 결과 반환:', errorResult);
      return errorResult;
    }
  };

  const validateTransformationResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    console.log('🔍 [TRANSFORMER] 변환 결과 검증');

    if (!result || typeof result !== 'object') {
      console.error('❌ [TRANSFORMER] 결과가 null이거나 객체가 아님');
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
      hasValidErrors;

    console.log('📊 [TRANSFORMER] 검증 결과:', {
      hasValidContent,
      hasValidCompleted,
      hasValidMetadata,
      hasValidSuccess,
      hasValidErrors,
      isValid,
      contentLength: transformedContent?.length || 0,
      transformationSuccess,
      errorCount: transformationErrors?.length || 0,
    });

    return isValid;
  };

  return {
    generateMarkdownContent,
    createContentMetadata,
    transformEditorStateToMultiStep,
    validateTransformationResult,
  };
};
