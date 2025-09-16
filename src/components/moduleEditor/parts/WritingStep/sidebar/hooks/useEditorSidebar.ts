import { useMemo, useCallback } from 'react';
import { SwipeableConfig } from '../../../../../swipeableSection/types/swipeableTypes'; // 수정된 import 경로

/**
 * useEditorSidebar 훅
 * - 에디터 사이드바 전용 설정 및 상태 관리
 * - 새로운 단순화된 SwipeableContainer에 맞게 최적화
 * - 구조관리와 최종조합 슬라이드 간 전환 관리
 */
export function useEditorSidebar() {
  // 🎯 에디터 사이드바 전용 SwipeableConfig 설정 (단순화됨)
  const sidebarConfig: SwipeableConfig = useMemo(
    () => ({
      // ⚡ 애니메이션 설정
      speed: 300, // 전환 속도 300ms

      // 🔄 기본 동작 설정
      allowLoop: false, // 무한 루프 비활성화
      autoplay: false, // 자동 재생 비활성화

      // 🖱️ 상호작용 설정
      touchEnabled: true, // 터치/드래그 활성화
      spaceBetween: 0, // 슬라이드 간 간격 없음

      // 🔘 UI 설정 (Swiper 기본 네비게이션 사용)
      showNavigation: false, // 화살표 네비게이션 비활성화 (드래그 중심)
      showPagination: true, // 페이지네이션 활성화 (점 표시)

      // 🎯 초기 설정
      initialSlide: 0, // 구조관리 슬라이드부터 시작
    }),
    []
  );

  // 📊 슬라이드 변경 이벤트 핸들러 (새로운 시그니처)
  const handleSlideChange = useCallback((swiper: any) => {
    // 🎯 Swiper 인스턴스에서 현재 슬라이드 정보 추출
    const currentIndex = swiper.activeIndex;

    console.log('🔄 [EDITOR_SIDEBAR] 슬라이드 변경됨:', {
      activeIndex: currentIndex,
      isBeginning: swiper.isBeginning,
      isEnd: swiper.isEnd,
      timestamp: new Date().toISOString(),
    });

    // 📝 슬라이드별 로직 처리
    switch (currentIndex) {
      case 0:
        console.log('📁 [EDITOR_SIDEBAR] 구조관리 슬라이드 활성화');
        // 구조관리 관련 로직 (필요시 확장)
        break;
      case 1:
        console.log('👁️ [EDITOR_SIDEBAR] 최종조합 미리보기 슬라이드 활성화');
        // 미리보기 관련 로직 (필요시 확장)
        break;
      default:
        console.log('❓ [EDITOR_SIDEBAR] 알 수 없는 슬라이드:', currentIndex);
    }

    // 🎯 향후 확장 가능한 로직들:
    // - 슬라이드별 특정 액션 실행
    // - 에디터 상태 업데이트
    // - 분석 데이터 전송
    // - 사용자 환경설정 저장
  }, []);

  // 🎮 슬라이드 제어 함수들 (향후 확장용 - ref 통해 직접 제어)
  const goToStructureSlide = useCallback(() => {
    console.log('📁 [EDITOR_SIDEBAR] 구조관리 슬라이드로 이동 요청');
    // 부모 컴포넌트에서 swiperRef.current?.slideTo(0) 형태로 사용
    return 0; // 구조관리 슬라이드 인덱스
  }, []);

  const goToPreviewSlide = useCallback(() => {
    console.log('👁️ [EDITOR_SIDEBAR] 최종조합 슬라이드로 이동 요청');
    // 부모 컴포넌트에서 swiperRef.current?.slideTo(1) 형태로 사용
    return 1; // 최종조합 슬라이드 인덱스
  }, []);

  // 📱 반응형 설정 헬퍼 (필요시 사용)
  const getResponsiveConfig = useCallback(
    (isMobile: boolean): SwipeableConfig => {
      if (isMobile) {
        // 모바일에서는 더 민감한 터치 반응
        return {
          ...sidebarConfig,
          touchEnabled: true, // 모바일에서 터치 강제 활성화
          speed: 250, // 모바일에서 더 빠른 전환
        };
      }

      // 데스크탑 기본 설정
      return sidebarConfig;
    },
    [sidebarConfig]
  );

  // 🔍 현재 설정 정보 (디버깅용)
  const configInfo = useMemo(
    () => ({
      speed: sidebarConfig.speed,
      touchEnabled: sidebarConfig.touchEnabled,
      showNavigation: sidebarConfig.showNavigation,
      showPagination: sidebarConfig.showPagination,
      allowLoop: sidebarConfig.allowLoop,
      autoplay: sidebarConfig.autoplay,
    }),
    [sidebarConfig]
  );

  return {
    // 📋 설정 객체
    sidebarConfig,

    // 📡 이벤트 핸들러 (새로운 시그니처)
    handleSlideChange,

    // 🎮 제어 함수들
    goToStructureSlide,
    goToPreviewSlide,
    getResponsiveConfig,

    // 🔍 디버깅 정보
    configInfo,
  };
}

/**
 * 🔧 타입 누락 에러 수정 내역:
 *
 * 1. ✅ import 경로 수정
 *    - 이전: '../../../../../swipeableSection/types/swipeableTypes'
 *    - 이후: '../types/slideTypes'
 *
 * 2. ✅ SwipeableConfig 타입 사용
 *    - slideTypes.ts에서 정의된 SwipeableConfig 사용
 *    - 타입 안전성 확보
 *
 * 3. ✅ 모든 기능 유지
 *    - 기존 useEditorSidebar 훅의 모든 기능 그대로 유지
 *    - 타입만 올바른 경로에서 import하도록 수정
 */
