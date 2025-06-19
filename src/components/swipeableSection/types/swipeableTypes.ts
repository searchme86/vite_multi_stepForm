// 📁 src/components/moduleEditor/parts/WritingStep/sidebar/types/slideTypes.ts

import React from 'react';
import { SwiperProps } from 'swiper/react';

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

// ⚙️ SwipeableContainer 설정 옵션 (누락된 타입 추가됨)
export interface SwipeableConfig {
  // 기본 동작 설정
  speed?: number; // 전환 속도 (기본: 300ms)
  allowLoop?: boolean; // 무한 루프 허용 (기본: false)
  autoplay?: boolean | number; // 자동 재생 (false | 밀리초)

  // 터치/드래그 설정
  touchEnabled?: boolean; // 터치/드래그 이동 허용 (기본: true)
  spaceBetween?: number; // 슬라이드 간 간격 (기본: 0)

  // 네비게이션 UI 설정
  showNavigation?: boolean; // 화살표 네비게이션 표시 여부 (기본: false)
  showPagination?: boolean; // 페이지네이션 표시 여부 (기본: false)

  // 초기 설정
  initialSlide?: number; // 초기 슬라이드 인덱스 (기본: 0)
}

// 🎛️ SwipeableContainer 메인 props (누락된 타입 추가됨)
export interface SwipeableContainerProps {
  config?: SwipeableConfig; // 선택적 설정 객체 (없으면 기본값 사용)
  children: React.ReactNode; // 슬라이드 컨텐츠들 (각 child가 자동으로 SwiperSlide로 감싸짐)
  className?: string; // 추가 CSS 클래스
  onSlideChange?: (swiper: any) => void; // 슬라이드 변경 콜백 (Swiper 인스턴스 직접 전달)
  swiperProps?: Partial<SwiperProps>; // 추가 Swiper 설정 (고급 사용자용)
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
 * 🔧 타입 누락 에러 수정 내역:
 *
 * 1. ✅ SwipeableConfig 인터페이스 추가
 *    - SwipeableContainer 설정을 위한 타입
 *    - speed, allowLoop, autoplay 등 설정 옵션
 *
 * 2. ✅ SwipeableContainerProps 인터페이스 추가
 *    - SwipeableContainer 컴포넌트의 props 타입
 *    - config, children, onSlideChange 등 속성
 *
 * 3. ✅ SwiperProps import 추가
 *    - swiper/react에서 SwiperProps 타입 import
 *    - swiperProps 속성을 위한 타입 지원
 *
 * 4. ✅ 기존 타입들 유지
 *    - ContainerManagerProps, PreviewPanelProps
 *    - StructureManagementSlideProps, FinalPreviewSlideProps
 *    - any 타입 제거 및 구체적 타입 적용
 */
