import { SwiperProps } from 'swiper/react';

// 🎯 개별 슬라이드 아이템 타입
export interface SlideItem {
  id: string; // 슬라이드 고유 식별자
  label: string; // 슬라이드 라벨 (예: "구조관리", "최종조합")
  content?: React.ReactNode; // 선택적 콘텐츠 (children으로 전달하는 경우 미사용)
}

// ⚙️ SwipeableContainer 설정 옵션
export interface SwipeableConfig {
  slides: SlideItem[]; // 슬라이드 목록
  showIndicator?: boolean; // 인디케이터 표시 여부 (기본: true)
  showLabel?: boolean; // 라벨 표시 여부 (기본: true)
  showNavigation?: boolean; // 화살표 네비게이션 표시 여부 (기본: false)
  indicatorPosition?: 'top' | 'bottom'; // 인디케이터 위치 (기본: bottom)
  labelPosition?: 'top' | 'bottom' | 'inside'; // 라벨 위치 (기본: bottom)
  touchEnabled?: boolean; // 터치/드래그 이동 허용 (기본: true)
  allowLoop?: boolean; // 무한 루프 허용 (기본: false)
  autoplay?: boolean | number; // 자동 재생 (false | 밀리초)
  speed?: number; // 전환 속도 (기본: 300ms)
  spaceBetween?: number; // 슬라이드 간 간격 (기본: 0)
}

// 🎛️ SwipeableContainer 메인 props
export interface SwipeableContainerProps {
  config: SwipeableConfig; // 설정 객체
  children: React.ReactNode[]; // 슬라이드 컨텐츠들
  className?: string; // 추가 CSS 클래스
  onSlideChange?: (index: number, slide: SlideItem) => void; // 슬라이드 변경 콜백
  initialSlide?: number; // 초기 슬라이드 인덱스 (기본: 0)
  swiperProps?: Partial<SwiperProps>; // 추가 Swiper 설정
}

// 🔘 인디케이터 컴포넌트 props
export interface SwipeIndicatorProps {
  totalSlides: number; // 전체 슬라이드 수
  activeIndex: number; // 현재 활성 슬라이드 인덱스
  onIndicatorClick: (index: number) => void; // 인디케이터 클릭 핸들러
  position: 'top' | 'bottom'; // 위치
  className?: string; // 추가 CSS 클래스
}

// 🏷️ 라벨 컴포넌트 props
export interface SwipeLabelProps {
  currentSlide: SlideItem; // 현재 슬라이드 정보
  position: 'top' | 'bottom' | 'inside'; // 위치
  className?: string; // 추가 CSS 클래스
}

// 🧩 개별 슬라이드 wrapper props
export interface SwipeSlideProps {
  children: React.ReactNode; // 슬라이드 내용
  className?: string; // 추가 CSS 클래스
  slideId?: string; // 슬라이드 식별자
}

// 🔄 네비게이션 컴포넌트 props (선택적 기능)
export interface SwipeNavigationProps {
  onPrevClick: () => void; // 이전 슬라이드 이동
  onNextClick: () => void; // 다음 슬라이드 이동
  hasNext: boolean; // 다음 슬라이드 존재 여부
  hasPrev: boolean; // 이전 슬라이드 존재 여부
  className?: string; // 추가 CSS 클래스
}
