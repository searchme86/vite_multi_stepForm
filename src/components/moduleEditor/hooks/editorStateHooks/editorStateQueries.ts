// 📁 hooks/useEditorState/editorStateQueries.ts

import { LocalParagraph } from './editorStateTypes';

const getUnassignedParagraphs = (
  managedParagraphCollection: LocalParagraph[]
) => {
  return () => {
    try {
      const safeParagraphCollection = managedParagraphCollection || [];

      const unassignedParagraphCollection = safeParagraphCollection.filter(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return !safeParagraph.containerId;
        }
      );

      console.log(
        '📋 [LOCAL] 미할당 단락 조회:',
        unassignedParagraphCollection.length
      );

      return unassignedParagraphCollection;
    } catch (error) {
      console.error('❌ [LOCAL] 미할당 문단 조회 실패:', error);
      return [];
    }
  };
};

const getParagraphsByContainer = (
  managedParagraphCollection: LocalParagraph[]
) => {
  return (specificContainerIdToQuery: string) => {
    try {
      if (
        !specificContainerIdToQuery ||
        typeof specificContainerIdToQuery !== 'string'
      ) {
        console.warn(
          '⚠️ [LOCAL] 유효하지 않은 컨테이너 ID:',
          specificContainerIdToQuery
        );
        return [];
      }

      const safeParagraphCollection = managedParagraphCollection || [];

      const paragraphsInSpecificContainer = safeParagraphCollection
        .filter((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.containerId === specificContainerIdToQuery;
        })
        .sort((firstParagraphItem, secondParagraphItem) => {
          const safeFirst = firstParagraphItem || {};
          const safeSecond = secondParagraphItem || {};
          return (safeFirst.order || 0) - (safeSecond.order || 0);
        });

      console.log('📋 [LOCAL] 컨테이너별 단락 조회:', {
        containerId: specificContainerIdToQuery,
        count: paragraphsInSpecificContainer.length,
      });

      return paragraphsInSpecificContainer;
    } catch (error) {
      console.error('❌ [LOCAL] 컨테이너별 문단 조회 실패:', error);
      return [];
    }
  };
};

export { getUnassignedParagraphs, getParagraphsByContainer };
