import { useCallback } from 'react';
import { LocalParagraph } from './editorStateTypes';

// ✨ [조회 함수들] 원본과 동일한 구조로 작성 - HOF 패턴 제거하고 직접 사용 방식 적용

// ✨ [조회 함수] 미할당 단락 조회 함수 - 아직 섹션에 배치되지 않은 단락들을 찾는 함수
const getUnassignedParagraphs = (currentParagraphs: LocalParagraph[]) => {
  return useCallback(() => {
    // 1. containerId가 null인 단락들만 필터링 2. 섹션에 할당되지 않은 자유로운 단락들
    const unassignedParagraphs = currentParagraphs.filter(
      (currentParagraphItem) => !currentParagraphItem.containerId
    );
    console.log('📋 [LOCAL] 미할당 단락 조회:', unassignedParagraphs.length);
    return unassignedParagraphs; // 1. 미할당 단락 목록 반환 2. UI에서 "자유 단락" 영역에 표시
  }, [currentParagraphs]); // 1. currentParagraphs 의존성 2. 단락 목록 변경 시 함수 재생성
};

// ✨ [조회 함수] 컨테이너별 단락 조회 함수 - 특정 섹션에 속한 단락들을 순서대로 가져오는 함수
const getParagraphsByContainer = (currentParagraphs: LocalParagraph[]) => {
  return useCallback(
    (targetContainerId: string) => {
      // 1. 지정된 컨테이너에 속한 단락들만 필터링 2. 특정 섹션의 내용만 선별
      const paragraphsInContainer = currentParagraphs
        .filter(
          (currentParagraphItem) =>
            currentParagraphItem.containerId === targetContainerId
        )
        .sort(
          (firstParagraphItem, secondParagraphItem) =>
            firstParagraphItem.order - secondParagraphItem.order // 1. order 값에 따라 오름차순 정렬 2. 사용자가 정한 순서대로 배열
        );
      console.log('📋 [LOCAL] 컨테이너별 단락 조회:', {
        containerId: targetContainerId,
        count: paragraphsInContainer.length, // 1. 해당 섹션의 단락 개수 로깅 2. 디버깅과 분석에 활용
      });
      return paragraphsInContainer; // 1. 정렬된 단락 목록 반환 2. UI에서 섹션별로 표시
    },
    [currentParagraphs] // 1. currentParagraphs 의존성 2. 단락 목록 변경 시 함수 재생성
  );
};

//====여기부터 수정됨====
// 데이터 조회 함수들을 export - useEditorStateMain.ts에서 import할 수 있도록
export { getUnassignedParagraphs, getParagraphsByContainer };
//====여기까지 수정됨====
