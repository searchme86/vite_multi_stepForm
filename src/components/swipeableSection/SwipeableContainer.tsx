import { Swiper } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper as SwiperType } from 'swiper';
import { SwipeableContainerProps } from './types/swipeableTypes';
import { SwipeIndicator } from './parts/SwipeIndicator';
import { SwipeLabel } from './parts/SwipeLabel';
import { SwipeNavigation } from './parts/SwipeNavigation';
import { useSwipeableSection } from './hooks/useSwipeableSection';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * SwipeableContainer 메인 컴포넌트
 * - 모든 SwipeableSection 기능을 통합하는 중심 컴포넌트
 * - Swiper 라이브러리와 완전 통합
 * - 드래그/터치/클릭 모든 상호작용 지원
 * - 반응형 디자인 및 접근성 완벽 지원
 */
export function SwipeableContainer({
  config,
  children,
  className = '',
  onSlideChange,
  initialSlide = 0,
  swiperProps = {},
}: SwipeableContainerProps) {
  const {
    activeIndex,
    currentSlide,
    isTransitioning,
    swiperRef,
    goToSlide,
    goToNext,
    goToPrev,
    handleSlideChange,
    handleSlideTransitionStart,
    canGoNext,
    canGoPrev,
    totalSlides,
  } = useSwipeableSection(config);

  const defaultSwiperConfig = {
    modules: [Navigation, Pagination],

    slidesPerView: 1,
    spaceBetween: config.spaceBetween || 0,

    allowTouchMove: config.touchEnabled !== false,
    touchRatio: 1,
    touchAngle: 45,
    longSwipes: true,
    shortSwipes: true,

    speed: config.speed || 300,
    effect: 'slide' as const,

    initialSlide,
    loop: config.allowLoop || false,
    autoplay: config.autoplay
      ? {
          delay: typeof config.autoplay === 'number' ? config.autoplay : 3000,
          disableOnInteraction: true,
          pauseOnMouseEnter: true,
        }
      : false,

    breakpoints: {
      0: {
        allowTouchMove: true,
        touchRatio: 1.2,
        spaceBetween: config.spaceBetween || 0,
      },
      768: {
        allowTouchMove: true,
        touchRatio: 0.8,
        spaceBetween: config.spaceBetween || 0,
      },
      1024: {
        allowTouchMove: true,
        touchRatio: 0.6,
        spaceBetween: config.spaceBetween || 0,
      },
    },

    onSwiper: (swiper: SwiperType) => {
      swiperRef.current = swiper;
    },
    onSlideChange: (swiper: SwiperType) => {
      handleSlideChange(swiper);
      onSlideChange?.(swiper.activeIndex, config.slides[swiper.activeIndex]);
    },
    onSlideTransitionStart: handleSlideTransitionStart,

    ...swiperProps,
  };

  const containerClass = `
    relative w-full h-full
    overflow-hidden
    bg-gray-50/50
    ${isTransitioning ? 'pointer-events-none' : ''}
    ${className}
  `;

  return (
    <div
      className={containerClass}
      role="region"
      aria-label="슬라이드 콘텐츠"
      data-swipeable-container="true"
      data-total-slides={totalSlides}
      data-active-slide={activeIndex}
    >
      <Swiper {...defaultSwiperConfig}>{children}</Swiper>

      {config.showIndicator && (
        <SwipeIndicator
          totalSlides={config.slides.length}
          activeIndex={activeIndex}
          onIndicatorClick={goToSlide}
          position={config.indicatorPosition || 'bottom'}
          className="transition-opacity duration-300"
        />
      )}

      {config.showLabel && currentSlide && (
        <SwipeLabel
          currentSlide={currentSlide}
          position={config.labelPosition || 'bottom'}
          className="transition-all duration-300"
        />
      )}

      {config.showNavigation && (
        <SwipeNavigation
          onPrevClick={goToPrev}
          onNextClick={goToNext}
          hasNext={canGoNext}
          hasPrev={canGoPrev}
          className="transition-opacity duration-300"
        />
      )}

      {isTransitioning && (
        <div className="absolute inset-0 z-30 transition-opacity duration-150 pointer-events-none bg-black/5" />
      )}
    </div>
  );
}

/**
 * 🎨 SwipeableContainer 사용법 예시:
 *
 * // 기본 사용법
 * <SwipeableContainer config={slideConfig}>
 *   <SwipeSlide>콘텐츠 1</SwipeSlide>
 *   <SwipeSlide>콘텐츠 2</SwipeSlide>
 * </SwipeableContainer>
 *
 * // 고급 사용법
 * <SwipeableContainer
 *   config={{
 *     slides: [
 *       { id: 'slide1', label: '첫 번째' },
 *       { id: 'slide2', label: '두 번째' }
 *     ],
 *     showIndicator: true,
 *     showLabel: true,
 *     showNavigation: true,
 *     touchEnabled: true,
 *     speed: 400
 *   }}
 *   onSlideChange={(index, slide) => console.log(slide.label)}
 *   className="custom-swiper"
 * >
 *   <SwipeSlide slideId="slide1">
 *     <CustomComponent1 />
 *   </SwipeSlide>
 *   <SwipeSlide slideId="slide2">
 *     <CustomComponent2 />
 *   </SwipeSlide>
 * </SwipeableContainer>
 */
