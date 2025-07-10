// components/ImageGalleryWithContent/hooks/useImageGallery.tsx

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Swiper as SwiperCore } from 'swiper';
import type {
  ImageData,
  GalleryConfig,
  GalleryState,
  GalleryEventHandlers,
} from '../types/imageGalleryTypes';
import {
  normalizeImageIndex,
  createDebugInfo,
} from '../utils/imageGalleryUtils';

interface UseImageGalleryProps {
  images: ImageData[];
  galleryConfig: GalleryConfig;
  onImageChange?: (index: number, imageData: ImageData) => void;
}

interface UseImageGalleryReturn extends GalleryState {
  // Swiper 인스턴스 참조 (Thumbs 연동을 위한 상태)
  mainSwiperRef: React.MutableRefObject<SwiperCore | null>;
  thumbsSwiper: SwiperCore | null;
  setThumbsSwiper: (swiper: SwiperCore | null) => void;

  // 이벤트 핸들러
  eventHandlers: GalleryEventHandlers;

  // 유틸리티 함수
  getCurrentImage: () => ImageData | null;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;

  // 설정
  finalGalleryConfig: Required<GalleryConfig>;
}

function useImageGallery({
  images,
  galleryConfig,
  onImageChange,
}: UseImageGalleryProps): UseImageGalleryReturn {
  // Swiper 인스턴스 참조 (Thumbs 모듈용 상태)
  const mainSwiperRef = useRef<SwiperCore | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

  // 갤러리 상태
  const [galleryState, setGalleryState] = useState<GalleryState>({
    currentImageIndex: galleryConfig.initialSlide ?? 0,
    isLoading: true,
    hasError: false,
    errorMessage: '',
    totalImages: images.length,
    isInitialized: false,
  });

  // 기본 설정 병합
  const finalGalleryConfig: Required<GalleryConfig> = {
    speed: galleryConfig.speed ?? 300,
    allowLoop: galleryConfig.allowLoop ?? true,
    touchEnabled: galleryConfig.touchEnabled ?? true,
    showNavigation: galleryConfig.showNavigation ?? true,
    spaceBetween: galleryConfig.spaceBetween ?? 10,
    initialSlide: galleryConfig.initialSlide ?? 0,
  };

  // 현재 이미지 가져오기
  const getCurrentImage = useCallback((): ImageData | null => {
    const { currentImageIndex, totalImages } = galleryState;

    if (totalImages === 0 || !images.length) {
      return null;
    }

    const normalizedIndex = normalizeImageIndex(currentImageIndex, totalImages);
    return images[normalizedIndex] ?? null;
  }, [galleryState, images]);

  // 슬라이드 이동 (Thumbs 모듈이 자동으로 처리하므로 단순화)
  const goToSlide = useCallback(
    (targetIndex: number) => {
      const normalizedIndex = normalizeImageIndex(targetIndex, images.length);

      console.log('슬라이드 이동:', {
        targetIndex,
        normalizedIndex,
        currentIndex: galleryState.currentImageIndex,
      });

      // 메인 Swiper만 이동 (Thumbs 모듈이 썸네일 자동 연동)
      const mainSwiper = mainSwiperRef.current;
      if (mainSwiper) {
        mainSwiper.slideTo(normalizedIndex);
      }

      // 상태 업데이트
      setGalleryState((prev) => ({
        ...prev,
        currentImageIndex: normalizedIndex,
      }));

      // 외부 콜백 호출
      const imageData = images[normalizedIndex];
      if (imageData) {
        onImageChange?.(normalizedIndex, imageData);
      }
    },
    [images, galleryState.currentImageIndex, onImageChange]
  );

  // 다음 슬라이드
  const nextSlide = useCallback(() => {
    const nextIndex = galleryState.currentImageIndex + 1;
    goToSlide(nextIndex);
  }, [galleryState.currentImageIndex, goToSlide]);

  // 이전 슬라이드
  const prevSlide = useCallback(() => {
    const prevIndex = galleryState.currentImageIndex - 1;
    goToSlide(prevIndex);
  }, [galleryState.currentImageIndex, goToSlide]);

  // 이미지 변경 핸들러
  const handleImageChange = useCallback(
    (newIndex: number) => {
      console.log('이미지 변경 핸들러 호출:', { newIndex });
      goToSlide(newIndex);
    },
    [goToSlide]
  );

  // 마우스 진입 핸들러 (데스크탑 줌용)
  const handleMouseEnterImage = useCallback((_event: MouseEvent) => {
    console.log('이미지 마우스 진입 (갤러리 훅)');
    // 실제 줌 로직은 상위 컴포넌트에서 처리
  }, []);

  // 마우스 이탈 핸들러 (데스크탑 줌용)
  const handleMouseLeaveImage = useCallback(() => {
    console.log('이미지 마우스 이탈 (갤러리 훅)');
    // 실제 줌 로직은 상위 컴포넌트에서 처리
  }, []);

  // 마우스 이동 핸들러 (데스크탑 줌용)
  const handleMouseMoveOnImage = useCallback((_event: MouseEvent) => {
    // 실제 줌 로직은 상위 컴포넌트에서 처리
    // 여기서는 이벤트만 전달
  }, []);

  // 터치 시작 핸들러 (모바일 줌용)
  const handleTouchStartOnImage = useCallback((_event: TouchEvent) => {
    console.log('이미지 터치 시작 (갤러리 훅)');
    // 실제 줌 로직은 상위 컴포넌트에서 처리
  }, []);

  // 터치 이동 핸들러 (모바일 줌용)
  const handleTouchMoveOnImage = useCallback((_event: TouchEvent) => {
    // 실제 줌 로직은 상위 컴포넌트에서 처리
  }, []);

  // 터치 종료 핸들러 (모바일 줌용)
  const handleTouchEndOnImage = useCallback(() => {
    console.log('이미지 터치 종료 (갤러리 훅)');
    // 실제 줌 로직은 상위 컴포넌트에서 처리
  }, []);

  // 이벤트 핸들러 객체
  const eventHandlers: GalleryEventHandlers = {
    handleImageChange,
    handleMouseEnterImage,
    handleMouseLeaveImage,
    handleMouseMoveOnImage,
    handleTouchStartOnImage,
    handleTouchMoveOnImage,
    handleTouchEndOnImage,
  };

  // 초기화
  useEffect(() => {
    console.log('갤러리 훅 초기화:', { imagesLength: images.length });

    if (images.length > 0) {
      setGalleryState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: false,
        totalImages: images.length,
        isInitialized: true,
      }));
    } else {
      setGalleryState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage: '이미지가 없습니다',
        totalImages: 0,
        isInitialized: false,
      }));
    }
  }, [images]);

  // 디버그 정보
  useEffect(() => {
    if (galleryState.isInitialized) {
      createDebugInfo('useImageGallery', {
        galleryState,
        finalGalleryConfig,
        imagesLength: images.length,
        currentImage: getCurrentImage(),
      });
    }
  }, [galleryState, finalGalleryConfig, images.length, getCurrentImage]);

  return {
    ...galleryState,
    mainSwiperRef,
    thumbsSwiper,
    setThumbsSwiper,
    eventHandlers,
    getCurrentImage,
    goToSlide,
    nextSlide,
    prevSlide,
    finalGalleryConfig,
  };
}

export default useImageGallery;
