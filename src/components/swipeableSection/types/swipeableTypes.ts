// 📁 src/components/moduleEditor/parts/WritingStep/sidebar/types/slideTypes.ts

import React from 'react';

// 🏗️ 기본 타입들 (WritingStep에서 이미 정의된 타입들과 동일)
interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

// 🗂️ ContainerManager 컴포넌트에 전달되는 props 타입
export interface ContainerManagerProps {
  isMobile: boolean; // 모바일 여부 플래그
  sortedContainers: Container[]; // 정렬된 컨테이너 목록
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[]; // 컨테이너별 단락 조회 함수
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void; // 컨테이너 내 단락 순서 변경 함수
  activateEditor: (id: string) => void; // 에디터 활성화 함수
}

// 👁️ PreviewPanel 컴포넌트에 전달되는 props 타입
export interface PreviewPanelProps {
  internalState: EditorInternalState; // 에디터 내부 상태
  sortedContainers: Container[]; // 정렬된 컨테이너 목록
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[]; // 컨테이너별 단락 조회 함수
  renderMarkdown: (text: string) => React.ReactNode; // 마크다운 렌더링 함수
  activateEditor: (id: string) => void; // 에디터 활성화 함수
  togglePreview: () => void; // 미리보기 토글 함수
}

// 📁 StructureManagementSlide 컴포넌트 props 타입
export interface StructureManagementSlideProps {
  containerManagerProps: ContainerManagerProps; // 필수 props (옵셔널 제거)
}

// 👁️ FinalPreviewSlide 컴포넌트 props 타입
export interface FinalPreviewSlideProps {
  previewPanelProps: PreviewPanelProps; // 필수 props (옵셔널 제거)
}

/**
 * 🎯 타입 개선 효과:
 *
 * 1. 📊 타입 안전성 확보
 *    - any 타입 제거로 컴파일 타임 에러 검출
 *    - IDE 자동완성 및 타입 힌트 제공
 *    - 실수로 인한 런타임 에러 방지
 *
 * 2. 🔍 명확한 의존성 표시
 *    - 각 컴포넌트가 필요로 하는 정확한 props 명시
 *    - 함수 시그니처 명확화
 *    - 불필요한 옵셔널 제거
 *
 * 3. 🔧 유지보수성 향상
 *    - 인터페이스 변경 시 영향받는 부분 즉시 확인
 *    - 리팩토링 시 안전성 보장
 *    - 코드 문서화 효과
 *
 * 4. 🎨 개발자 경험 개선
 *    - 자동완성으로 개발 속도 향상
 *    - 타입 에러로 빠른 피드백
 *    - 명확한 API 계약
 */
