// components/ImageGalleryWithContent/parts/SwiperImageGallery.tsx

import { useCallback, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Navigation,
  Thumbs,
  Zoom,
  Pagination,
  A11y,
  Keyboard,
} from 'swiper/modules';
import type { Swiper as SwiperCore } from 'swiper';
import type { SwiperImageGalleryProps } from '../types/imageGalleryTypes';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import 'swiper/css/pagination';

function SwiperImageGallery({
  images,
  onImageChange,
  className = '',
}: SwiperImageGalleryProps) {
  const mainSwiperRef = useRef<SwiperCore | null>(null);
  const thumbsSwiperRef = useRef<SwiperCore | null>(null);

  // 메인 Swiper 초기화 핸들러
  const handleMainSwiperInit = useCallback((swiper: SwiperCore) => {
    mainSwiperRef.current = swiper;
  }, []);

  // 썸네일 Swiper 초기화 핸들러
  const handleThumbsSwiperInit = useCallback((swiper: SwiperCore) => {
    thumbsSwiperRef.current = swiper;
  }, []);

  // 슬라이드 변경 핸들러
  const handleSlideChange = useCallback(
    (swiper: SwiperCore) => {
      const newActiveIndex = swiper.activeIndex;
      onImageChange(newActiveIndex);
    },
    [onImageChange]
  );

  // 이미지 로드 에러 핸들러
  const handleImageError = useCallback((imageUrl: string) => {
    console.error('이미지 로드 실패:', imageUrl);
  }, []);

  // 메인 Swiper 설정
  const mainSwiperConfig = {
    modules: [Navigation, Thumbs, Zoom, Pagination, A11y, Keyboard],

    // 기본 설정
    spaceBetween: 0,
    slidesPerView: 1,

    // 줌 설정 (Swiper 내장 줌 사용)
    zoom: {
      maxRatio: 5,
      minRatio: 1,
      toggle: true,
    },

    // 네비게이션
    navigation: {
      nextEl: '.main-swiper-button-next',
      prevEl: '.main-swiper-button-prev',
    },

    // 페이지네이션 (모바일용)
    pagination: {
      el: '.main-swiper-pagination',
      type: 'bullets' as const,
      clickable: true,
    },

    // 썸네일 연동
    thumbs: thumbsSwiperRef.current
      ? {
          swiper: thumbsSwiperRef.current,
        }
      : undefined,

    // 접근성
    a11y: {
      prevSlideMessage: '이전 이미지',
      nextSlideMessage: '다음 이미지',
      paginationBulletMessage: '{{index}}번째 이미지로 이동',
    },

    // 키보드 조작
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },

    // 반응형 설정
    breakpoints: {
      0: {
        pagination: { enabled: true },
        navigation: { enabled: false },
      },
      768: {
        pagination: { enabled: false },
        navigation: { enabled: true },
      },
    },

    // 이벤트 핸들러
    onInit: handleMainSwiperInit,
    onSlideChange: handleSlideChange,
  };

  // 썸네일 Swiper 설정
  const thumbsSwiperConfig = {
    modules: [Navigation, Thumbs],

    onSwiper: handleThumbsSwiperInit,
    spaceBetween: 8,
    slidesPerView: 4,
    freeMode: true,
    watchSlidesProgress: true,

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

  // Early return - 이미지가 없는 경우
  if (images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center text-gray-500">
          <div className="mb-4 text-6xl">🖼️</div>
          <p className="text-lg">표시할 이미지가 없습니다</p>
        </div>
      </div>
    );
  }

  const containerClassName = `
    relative w-full h-full flex flex-col bg-gray-100
    ${className}
  `.trim();

  return (
    <div
      className={containerClassName}
      role="region"
      aria-label="이미지 갤러리"
    >
      {/* 메인 이미지 Swiper */}
      <div className="relative flex-1">
        <Swiper {...mainSwiperConfig} className="w-full h-full">
          {images.map((image, imageIndex) => (
            <SwiperSlide
              key={image.id}
              className="flex items-center justify-center p-4"
              role="tabpanel"
              aria-label={`${imageIndex + 1}번째 이미지: ${
                image.title || image.alt
              }`}
            >
              {/* Swiper Zoom Container */}
              <div className="swiper-zoom-container">
                <img
                  src={image.url}
                  alt={image.alt}
                  title={image.title}
                  className="object-contain max-w-full max-h-full"
                  onError={() => handleImageError(image.url)}
                  draggable={false}
                />
              </div>

              {/* 이미지 설명 오버레이 */}
              {image.description && (
                <div className="absolute p-2 text-white transition-opacity bg-black bg-opacity-50 rounded-md opacity-0 bottom-4 left-4 right-4 hover:opacity-100">
                  <p className="text-sm">{image.description}</p>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 네비게이션 버튼 (데스크탑) */}
        <button
          type="button"
          className="absolute z-10 items-center justify-center hidden w-10 h-10 transition-all -translate-y-1/2 bg-white rounded-full shadow-lg md:flex main-swiper-button-prev left-4 top-1/2 bg-opacity-80 hover:bg-opacity-100"
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
          className="absolute z-10 items-center justify-center hidden w-10 h-10 transition-all -translate-y-1/2 bg-white rounded-full shadow-lg md:flex main-swiper-button-next right-4 top-1/2 bg-opacity-80 hover:bg-opacity-100"
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

        {/* 페이지네이션 (모바일) */}
        <div className="main-swiper-pagination md:hidden"></div>

        {/* 이미지 카운터 */}
        <div className="absolute px-3 py-1 text-sm text-white bg-black bg-opacity-50 rounded-full top-4 right-4">
          {images.length > 0 ? '1' : '0'} / {images.length}
        </div>
      </div>

      {/* 썸네일 이미지 Swiper */}
      <div className="flex items-center h-20 px-4 bg-white border-t border-gray-200 lg:h-24">
        <Swiper {...thumbsSwiperConfig} className="w-full h-full">
          {images.map((image, thumbIndex) => (
            <SwiperSlide
              key={`thumb-${image.id}`}
              className="flex items-center justify-center cursor-pointer"
              role="button"
              aria-label={`${thumbIndex + 1}번째 썸네일로 이동`}
            >
              <div className="w-16 h-16 overflow-hidden transition-colors border-2 border-gray-200 rounded-md lg:w-20 lg:h-20 hover:border-gray-300">
                <img
                  src={image.url}
                  alt={image.alt}
                  title={image.title}
                  className="object-cover w-full h-full"
                  onError={() => handleImageError(image.url)}
                  draggable={false}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default SwiperImageGallery;
