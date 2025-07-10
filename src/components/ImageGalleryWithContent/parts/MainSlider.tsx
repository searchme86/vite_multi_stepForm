// components/ImageGalleryWithContent/parts/MainSlider.tsx

import { useCallback, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import type { Swiper as SwiperCore } from 'swiper';
import type { MainSliderProps } from '../types/imageGalleryTypes';
import { createDebugInfo } from '../utils/imageGalleryUtils';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

export function MainSlider({
  images,
  currentImageIndex,
  galleryConfig,
  onImageChange,
  onImageHover,
  onImageLeave,
  onTouchInteraction,
  className = '',
}: MainSliderProps) {
  const mainSwiperRef = useRef<SwiperCore | null>(null);
  const thumbsSwiperRef = useRef<SwiperCore | null>(null);

  // 썸네일 Swiper 설정 핸들러
  const handleThumbsSwiperInit = useCallback(
    (swiper: SwiperCore) => {
      thumbsSwiperRef.current = swiper;

      console.log('썸네일 Swiper 초기화 완료:', {
        slidesLength: swiper.slides.length,
        currentIndex: currentImageIndex,
      });

      createDebugInfo('MainSlider.handleThumbsSwiperInit', {
        slidesLength: swiper.slides.length,
        currentIndex: currentImageIndex,
      });
    },
    [currentImageIndex]
  );

  // 메인 Swiper 슬라이드 변경 핸들러
  const handleMainSlideChange = useCallback(
    (swiper: SwiperCore) => {
      const newIndex = swiper.activeIndex;

      console.log('메인 슬라이더 변경:', {
        activeIndex: newIndex,
        realIndex: swiper.realIndex,
        previousIndex: currentImageIndex,
      });

      onImageChange(newIndex);

      createDebugInfo('MainSlider.handleMainSlideChange', {
        newIndex,
        realIndex: swiper.realIndex,
        totalSlides: swiper.slides.length,
      });
    },
    [currentImageIndex, onImageChange]
  );

  // 메인 Swiper 초기화 핸들러
  const handleMainSwiperInit = useCallback(
    (swiper: SwiperCore) => {
      mainSwiperRef.current = swiper;

      console.log('메인 Swiper 초기화 완료:', {
        slidesLength: swiper.slides.length,
        currentIndex: currentImageIndex,
      });

      // 초기 슬라이드 위치로 이동
      const { initialSlide } = galleryConfig;
      if (initialSlide && initialSlide > 0) {
        swiper.slideTo(initialSlide, 0);
      }
    },
    [currentImageIndex, galleryConfig]
  );

  // 이미지 마우스 이벤트 핸들러
  const handleImageMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLImageElement>) => {
      const mouseEvent = event.nativeEvent;
      onImageHover(mouseEvent);

      console.log('메인 이미지 마우스 진입');
    },
    [onImageHover]
  );

  const handleImageMouseLeave = useCallback(() => {
    onImageLeave();
    console.log('메인 이미지 마우스 이탈');
  }, [onImageLeave]);

  // 이미지 터치 이벤트 핸들러
  const handleImageTouchStart = useCallback(
    (event: React.TouchEvent<HTMLImageElement>) => {
      const touchEvent = event.nativeEvent;
      onTouchInteraction(touchEvent, 'start');

      console.log('메인 이미지 터치 시작');
    },
    [onTouchInteraction]
  );

  const handleImageTouchMove = useCallback(
    (event: React.TouchEvent<HTMLImageElement>) => {
      const touchEvent = event.nativeEvent;
      onTouchInteraction(touchEvent, 'move');
    },
    [onTouchInteraction]
  );

  const handleImageTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLImageElement>) => {
      const touchEvent = event.nativeEvent;
      onTouchInteraction(touchEvent, 'end');

      console.log('메인 이미지 터치 종료');
    },
    [onTouchInteraction]
  );

  // 메인 Swiper 설정 (Thumbs 모듈 사용)
  const mainSwiperConfig = {
    style: {
      '--swiper-navigation-color': '#ffffff',
      '--swiper-pagination-color': '#ffffff',
    } as React.CSSProperties,

    modules: [FreeMode, Navigation, Thumbs],

    // 기본 슬라이드 설정
    loop: galleryConfig.allowLoop,
    spaceBetween: galleryConfig.spaceBetween,

    // 터치/드래그 동작 설정
    allowTouchMove: galleryConfig.touchEnabled,
    touchRatio: 1,
    touchAngle: 45,

    // 애니메이션 설정
    speed: galleryConfig.speed,

    // 네비게이션 설정
    navigation: galleryConfig.showNavigation
      ? {
          nextEl: '.main-swiper-button-next',
          prevEl: '.main-swiper-button-prev',
        }
      : false,

    // Thumbs 연동 설정
    thumbs: thumbsSwiperRef.current
      ? {
          swiper: thumbsSwiperRef.current,
        }
      : undefined,

    // 반응형 설정
    breakpoints: {
      0: {
        allowTouchMove: true,
        touchRatio: 1.2,
      },
      768: {
        allowTouchMove: true,
        touchRatio: 0.8,
      },
      1024: {
        allowTouchMove: galleryConfig.touchEnabled,
        touchRatio: 0.6,
      },
    },

    // 이벤트 핸들러
    onSlideChange: handleMainSlideChange,
    onInit: handleMainSwiperInit,
  };

  // 썸네일 Swiper 설정
  const thumbsSwiperConfig = {
    modules: [FreeMode, Navigation, Thumbs],

    // 썸네일 전용 설정
    onSwiper: handleThumbsSwiperInit,
    loop: galleryConfig.allowLoop,
    spaceBetween: 8,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,

    // 반응형 설정
    breakpoints: {
      0: {
        slidesPerView: 3,
        spaceBetween: 6,
      },
      480: {
        slidesPerView: 4,
        spaceBetween: 8,
      },
      768: {
        slidesPerView: 5,
        spaceBetween: 10,
      },
      1024: {
        slidesPerView: 6,
        spaceBetween: 12,
      },
    },
  };

  // 컨테이너 클래스
  const containerClass = `
    relative w-full h-full flex flex-col
    bg-gray-100
    ${className}
  `.trim();

  return (
    <div
      className={containerClass}
      role="region"
      aria-label="이미지 갤러리"
      data-current-index={currentImageIndex}
      data-total-images={images.length}
    >
      {/* 메인 이미지 Swiper */}
      <div className="relative flex-1">
        <Swiper {...mainSwiperConfig} className="w-full h-full">
          {images.map((image, index) => (
            <SwiperSlide
              key={image.id}
              className="flex items-center justify-center p-4"
              data-slide-index={index}
              role="tabpanel"
              aria-label={`${index + 1}번째 이미지: ${
                image.title || image.alt
              }`}
            >
              <div className="relative flex items-center justify-center w-full h-full">
                <img
                  src={image.url}
                  alt={image.alt}
                  title={image.title}
                  className="object-contain max-w-full max-h-full cursor-pointer"
                  onMouseEnter={handleImageMouseEnter}
                  onMouseLeave={handleImageMouseLeave}
                  onTouchStart={handleImageTouchStart}
                  onTouchMove={handleImageTouchMove}
                  onTouchEnd={handleImageTouchEnd}
                  onLoad={() =>
                    console.log('메인 이미지 로드 완료:', image.url)
                  }
                  onError={() =>
                    console.error('메인 이미지 로드 실패:', image.url)
                  }
                  draggable={false}
                />

                {/* 이미지 정보 오버레이 (선택사항) */}
                {image.description && (
                  <div className="absolute p-2 text-white transition-opacity bg-black bg-opacity-50 rounded-md opacity-0 bottom-4 left-4 right-4 hover:opacity-100">
                    <p className="text-sm">{image.description}</p>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 네비게이션 버튼 (showNavigation이 true일 때만) */}
        {galleryConfig.showNavigation && (
          <>
            <button
              type="button"
              className="absolute z-10 flex items-center justify-center w-10 h-10 transition-all -translate-y-1/2 bg-white rounded-full shadow-lg main-swiper-button-prev left-4 top-1/2 bg-opacity-80 hover:bg-opacity-100"
              aria-label="이전 이미지"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              className="absolute z-10 flex items-center justify-center w-10 h-10 transition-all -translate-y-1/2 bg-white rounded-full shadow-lg main-swiper-button-next right-4 top-1/2 bg-opacity-80 hover:bg-opacity-100"
              aria-label="다음 이미지"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* 이미지 카운터 */}
        <div className="absolute px-3 py-1 text-sm text-white bg-black bg-opacity-50 rounded-full top-4 right-4">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* 썸네일 이미지 Swiper */}
      <div className="flex items-center h-20 px-4 bg-white border-t border-gray-200 md:h-24">
        <Swiper {...thumbsSwiperConfig} className="w-full h-full">
          {images.map((image, index) => (
            <SwiperSlide
              key={`thumb-${image.id}`}
              className="flex items-center justify-center"
              data-thumb-index={index}
              role="button"
              aria-label={`${index + 1}번째 썸네일: ${
                image.title || image.alt
              }`}
            >
              <div
                className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 cursor-pointer transition-all
                  ${
                    index === currentImageIndex
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  title={image.title}
                  className="object-cover w-full h-full"
                  onLoad={() =>
                    console.log('썸네일 이미지 로드 완료:', image.url)
                  }
                  onError={() =>
                    console.error('썸네일 이미지 로드 실패:', image.url)
                  }
                  draggable={false}
                />

                {/* 활성 상태 표시 */}
                {index === currentImageIndex && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 썸네일 카운터 (작은 화면에서만) */}
        <div className="absolute text-xs text-gray-500 bottom-1 left-4 md:hidden">
          {currentImageIndex + 1}/{images.length}
        </div>
      </div>
    </div>
  );
}

export default MainSlider;
