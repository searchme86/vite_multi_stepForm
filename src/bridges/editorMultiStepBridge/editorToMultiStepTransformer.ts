// bridges/editorMultiStepBridge/editorToMultiStepTransformer.ts

import {
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  EditorContentMetadataForBridge,
} from './bridgeDataTypes';

export const createDataStructureTransformer = () => {
  const generateMarkdownContent = (
    snapshot: EditorStateSnapshotForBridge
  ): string => {
    const { editorContainers, editorParagraphs } = snapshot;

    if (!editorContainers.length || !editorParagraphs.length) {
      return '';
    }

    const sortedContainers = [...editorContainers].sort(
      (a, b) => a.order - b.order
    );

    let markdownContent = '';

    sortedContainers.forEach((container) => {
      const containerParagraphs = editorParagraphs
        .filter((p) => p.containerId === container.id)
        .sort((a, b) => a.order - b.order);

      if (containerParagraphs.length > 0) {
        markdownContent += `## ${container.name}\n\n`;

        containerParagraphs.forEach((paragraph) => {
          if (paragraph.content.trim()) {
            markdownContent += `${paragraph.content.trim()}\n\n`;
          }
        });
      }
    });

    return markdownContent.trim();
  };

  const createContentMetadata = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorContentMetadataForBridge => {
    const { editorContainers, editorParagraphs } = snapshot;

    const assignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId !== null
    );
    const unassignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId === null
    );

    const totalContentLength = editorParagraphs.reduce(
      (total, p) => total + (p.content?.length || 0),
      0
    );

    return {
      containerCount: editorContainers.length,
      paragraphCount: editorParagraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength,
      lastModified: new Date(),
    };
  };

  const transformEditorStateToMultiStep = (
    snapshot: EditorStateSnapshotForBridge
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🔄 [TRANSFORMER] Editor → MultiStep 변환 시작');

    try {
      if (
        !snapshot ||
        !snapshot.editorContainers ||
        !snapshot.editorParagraphs
      ) {
        throw new Error('Invalid snapshot data');
      }

      const transformedContent = generateMarkdownContent(snapshot);
      const transformedMetadata = createContentMetadata(snapshot);

      const hasMinimumContent = transformedContent.length > 0;
      const hasValidStructure = snapshot.editorContainers.length > 0;
      const transformedIsCompleted =
        hasMinimumContent && hasValidStructure && snapshot.editorIsCompleted;

      console.log('✅ [TRANSFORMER] 변환 완료:', {
        contentLength: transformedContent.length,
        containerCount: transformedMetadata.containerCount,
        paragraphCount: transformedMetadata.paragraphCount,
        isCompleted: transformedIsCompleted,
      });

      return {
        transformedContent,
        transformedIsCompleted,
        transformedMetadata,
        transformationSuccess: true,
        transformationErrors: [],
      };
    } catch (error) {
      console.error('❌ [TRANSFORMER] 변환 실패:', error);

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
        transformationErrors: [
          error instanceof Error
            ? error.message
            : 'Unknown transformation error',
        ],
      };
    }
  };

  const validateTransformationResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    return (
      result &&
      typeof result.transformedContent === 'string' &&
      typeof result.transformedIsCompleted === 'boolean' &&
      typeof result.transformationSuccess === 'boolean' &&
      Array.isArray(result.transformationErrors) &&
      result.transformedMetadata &&
      typeof result.transformedMetadata === 'object'
    );
  };

  return {
    generateMarkdownContent,
    createContentMetadata,
    transformEditorStateToMultiStep,
    validateTransformationResult,
  };
};
