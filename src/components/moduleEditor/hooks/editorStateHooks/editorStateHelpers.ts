import {
  Container,
  ParagraphBlock,
} from '../../../../store/shared/commonTypes';
import { EditorUIStoreActions } from './editorStateTypes';

// ✨ [헬퍼 함수] 컨테이너 생성 함수 - 새로운 섹션 컨테이너를 만들 때 사용
const createContainer = (name: string, order: number): Container => {
  return {
    id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(), // 1. 공백 제거로 깔끔한 이름 보장 2. 사용자 입력 오류 방지
    order, // 1. 컨테이너 정렬 순서 2. UI에서 표시 순서 결정
    createdAt: new Date(), // 1. 생성 시간 기록 2. 나중에 정렬이나 추적에 사용
  };
};

// ✨ [헬퍼 함수] 완성된 콘텐츠 생성 함수 - 모든 섹션과 단락을 하나의 텍스트로 합치는 함수
const generateCompletedContent = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string => {
  // 1. 컨테이너를 순서대로 정렬 2. 사용자가 설정한 섹션 순서 유지
  const sortedContainers = [...containers].sort(
    (firstContainer, secondContainer) =>
      firstContainer.order - secondContainer.order
  );

  // 1. 각 컨테이너별로 단락들을 모아서 텍스트 생성 2. 섹션별 내용 구성
  const sections = sortedContainers.map((currentContainer) => {
    // 1. 현재 컨테이너에 속한 단락들만 필터링 2. 해당 섹션의 내용만 선별
    const containerParagraphs = paragraphs
      .filter(
        (currentParagraph) =>
          currentParagraph.containerId === currentContainer.id
      )
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order // 1. 단락 순서대로 정렬 2. 사용자가 정한 단락 순서 유지
      );

    // 1. 빈 컨테이너는 텍스트에 포함하지 않음 2. 의미없는 빈 섹션 제거
    if (containerParagraphs.length === 0) {
      return '';
    }

    // 1. 단락 내용들을 줄바꿈으로 연결 2. 읽기 좋은 텍스트 형태로 변환
    return containerParagraphs
      .map((currentParagraph) => currentParagraph.content)
      .join('\n\n');
  });

  // 1. 빈 섹션 제거하고 최종 텍스트 생성 2. 완성된 글 형태로 결합
  return sections.filter((section) => section.trim().length > 0).join('\n\n');
};

//====여기부터 수정됨====
// ✨ [공통 로직 함수] zustand store 업데이트 조건부 실행 헬퍼
// 1. context가 있을 때는 zustand store 업데이트 하지 않음 2. 상태 관리 충돌 방지
const updateZustandStoreIfNeeded = (
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions, // ✨ [수정] 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateAction: () => void
) => {
  // 1. context가 없을 때만 zustand store를 업데이트 2. 중복 업데이트를 방지하기 위해
  if (!hasContext) {
    updateAction(); // 1. 전달받은 업데이트 함수 실행 2. 실제 store 상태 변경
  }
};
//====여기까지 수정됨====

//====여기부터 수정됨====
// 헬퍼 함수들을 export - 다른 파일들에서 import할 수 있도록
export {
  createContainer,
  generateCompletedContent,
  updateZustandStoreIfNeeded,
};
//====여기까지 수정됨====
