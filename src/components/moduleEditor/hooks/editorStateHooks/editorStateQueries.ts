import { useCallback } from 'react';
import { LocalParagraph } from './editorStateTypes';

// ✨ [조회 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [조회 함수] 미할당 단락 조회 함수 - 아직 섹션에 배치되지 않은 단락들을 찾는 함수
const getUnassignedParagraphs = (
  managedParagraphCollection: LocalParagraph[]
) => {
  return useCallback(() => {
    try {
      // 1. containerId가 null이거나 undefined인 단락들만 필터링
      // 2. 아직 특정 섹션에 배정되지 않아 대기 상태인 문단들만 추출
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
      // 1. 오류 발생 시 빈 배열 반환으로 UI가 깨지지 않도록 방지
      // 2. 에러 상황에서도 앱이 계속 동작할 수 있도록 안전장치 제공
      return [];
    }
  }, [managedParagraphCollection]);
};

// ✨ [조회 함수] 컨테이너별 단락 조회 함수 - 특정 섹션에 속한 단락들을 순서대로 가져오는 함수
const getParagraphsByContainer = (
  managedParagraphCollection: LocalParagraph[]
) => {
  return useCallback(
    (specificContainerIdToQuery: string) => {
      try {
        // 1. 조회할 컨테이너 ID의 유효성 검증
        // 2. 잘못된 ID로 인한 잘못된 조회 결과 방지
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

        // 1. 특정 컨테이너에 속한 문단들을 필터링하고 order 기준으로 정렬
        // 2. 사용자가 설정한 문단 순서대로 정렬하여 올바른 읽기 순서 보장
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
    },
    [managedParagraphCollection]
  );
};

// 데이터 조회 함수들을 export
export { getUnassignedParagraphs, getParagraphsByContainer };
