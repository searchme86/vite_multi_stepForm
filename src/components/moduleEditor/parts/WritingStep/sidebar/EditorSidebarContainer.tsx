import React from 'react';

import { SwipeableContainer } from '../../../../../components/swipeableSection/SwipeableContainer';
import { useEditorSidebar } from './hooks/useEditorSidebar';

/**
 * EditorSidebarContainer 컴포넌트
 * - 에디터 사이드바의 메인 컨테이너
 * - 새로운 단순화된 SwipeableContainer 사용
 * - 유연한 children props 패턴으로 외부에서 준비된 컴포넌트들을 받음
 * - 완전한 사이드바 시스템 통합
 */

interface EditorSidebarContainerProps {
  className?: string;
  children: [React.ReactNode, React.ReactNode]; // [구조관리 슬라이드, 미리보기 슬라이드]
}

export function EditorSidebarContainer({
  className = '',
  children,
}: EditorSidebarContainerProps) {
  const { sidebarConfig, handleSlideChange } = useEditorSidebar();

  console.log('🎠 [EDITOR_SIDEBAR_CONTAINER] 렌더링:', {
    configProvided: !!sidebarConfig,
    childrenCount: children.length,
    speed: sidebarConfig.speed,
    touchEnabled: sidebarConfig.touchEnabled,
    timestamp: new Date().toISOString(),
  });

  // 🎯 children 배열에서 각 슬라이드 추출
  const [structureSlide, previewSlide] = children;

  return (
    <div
      className={`w-[50%] h-full flex flex-col bg-white rounded-lg shadow-sm ${className} mb-sm:w-[50%]`}
    >
      {/* 🎠 새로운 단순화된 SwipeableContainer */}
      <SwipeableContainer
        config={sidebarConfig} // 단순화된 config 사용
        onSlideChange={handleSlideChange} // 새로운 시그니처: (swiper) => void
        className="flex-1 overflow-hidden rounded-lg"
      >
        {/* 📁 구조관리 슬라이드 - 직접 children으로 전달 */}
        {structureSlide}

        {/* 👁️ 미리보기 슬라이드 - 직접 children으로 전달 */}
        {previewSlide}
      </SwipeableContainer>

      {/* 📝 사용법 안내 (하단 고정) */}
      <div className="flex-shrink-0 px-3 py-2 text-center bg-gray-100 border-t">
        <p className="text-xs text-gray-500">← 드래그하여 슬라이드 전환 →</p>
      </div>
    </div>
  );
}

/**
 * 🔧 타입 누락 에러 수정 내역:
 *
 * 1. ✅ SwipeSlide import 제거
 *    - SwipeSlide 컴포넌트는 더 이상 필요하지 않음
 *    - SwipeableContainer가 자동으로 children을 SwiperSlide로 감쌈
 *
 * 2. ✅ 직접 children 전달 방식
 *    - 이전: <SwipeSlide>{structureSlide}</SwipeSlide>
 *    - 이후: {structureSlide}
 *
 * 3. ✅ 타입 안전성 확보
 *    - useEditorSidebar 훅에서 올바른 타입 반환
 *    - SwipeableContainer에 정확한 props 전달
 */

/**
 * 🎨 EditorSidebarContainer의 주요 특징 (업데이트됨):
 *
 * 1. 🎠 단순화된 슬라이드 시스템
 *    - 새로운 SwipeableContainer 활용
 *    - config 기반 자동 설정
 *    - Swiper 기본 기능 최대 활용
 *
 * 2. 🔄 유연한 Children Props 패턴 (유지)
 *    - 외부에서 준비된 컴포넌트들을 받음
 *    - 어떤 props든 외부에서 자유롭게 구성
 *    - 완전한 재사용성과 확장성
 *
 * 3. 📱 반응형 디자인
 *    - 데스크탑: 오른쪽 사이드바
 *    - 모바일: 상단 영역
 *    - 모든 화면 크기에서 최적화
 *
 * 4. 🎯 사용자 친화적
 *    - 직관적인 드래그 인터페이스
 *    - Swiper 기본 페이지네이션 활용
 *    - 사용법 안내 제공
 *
 * 5. 🔧 확장 가능성
 *    - 새로운 슬라이드 쉽게 추가
 *    - config를 통한 설정 확장
 *    - Swiper props 직접 전달 가능
 */

/**
 * 🚀 사용법 예시 (업데이트됨):
 *
 * // WritingStep.tsx에서 사용
 * const preparedStructureSlide = (
 *   <StructureManagementSlide
 *     containerManagerProps={containerManagerProps}
 *   />
 * )
 *
 * const preparedPreviewSlide = (
 *   <FinalPreviewSlide
 *     previewPanelProps={previewPanelProps}
 *   />
 * )
 *
 * <EditorSidebarContainer>
 *   {preparedStructureSlide}
 *   {preparedPreviewSlide}
 * </EditorSidebarContainer>
 *
 * // 다른 곳에서 다른 컴포넌트 조합으로 사용 가능
 * <EditorSidebarContainer>
 *   <CustomSlide1 {...customProps1} />
 *   <CustomSlide2 {...customProps2} />
 * </EditorSidebarContainer>
 *
 * // 참고: SwipeSlide는 더 이상 필요하지 않습니다!
 * // SwipeableContainer가 자동으로 각 child를 SwiperSlide로 감쌉니다.
 */
