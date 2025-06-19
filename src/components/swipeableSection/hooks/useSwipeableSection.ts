import { useState, useCallback, useRef } from 'react';
import { Swiper as SwiperType } from 'swiper';
import { SwipeableConfig } from '../types/swipeableTypes';

/**
 * SwipeableSection 상태 관리 커스텀 훅
 * - Swiper 인스턴스 제어
 * - 현재 슬라이드 상태 추적
 * - 슬라이드 전환 함수 제공
 */
export function useSwipeableSection(config: SwipeableConfig) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const currentSlide = config.slides[activeIndex] || config.slides[0];

  const goToSlide = useCallback(
    (index: number) => {
      if (swiperRef.current && index >= 0 && index < config.slides.length) {
        swiperRef.current.slideTo(index);
      }
    },
    [config.slides.length]
  );

  const goToNext = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  }, []);

  const goToPrev = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    setActiveIndex(newIndex);
    setIsTransitioning(false);
  }, []);

  const handleSlideTransitionStart = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const canGoNext = activeIndex < config.slides.length - 1;
  const canGoPrev = activeIndex > 0;
  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === config.slides.length - 1;

  const progress =
    config.slides.length > 1
      ? Math.round((activeIndex / (config.slides.length - 1)) * 100)
      : 100;

  return {
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
    isFirstSlide,
    isLastSlide,
    progress,
    totalSlides: config.slides.length,
  };
}
