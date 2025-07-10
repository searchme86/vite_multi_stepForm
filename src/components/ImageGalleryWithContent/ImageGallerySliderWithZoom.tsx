// components/ImageGalleryWithContent/ImageGallerySliderWithZoom.tsx

import { useEffect } from 'react';
import type { ImageGallerySliderWithZoomProps } from './types/imageGalleryTypes';
import { mockCoffeeImages, mockProductData } from './utils/imageGalleryUtils';
import useGalleryState from './hooks/useGalleryState';
import SwiperImageGallery from './parts/SwiperImageGallery';
import ProductDetails from './parts/ProductDetails';

function ImageGallerySliderWithZoom({
  images = mockCoffeeImages,
  productInfo = mockProductData,
  className = '',
  onImageChange,
}: ImageGallerySliderWithZoomProps) {
  // 갤러리 상태 관리
  const { currentImageIndex, getCurrentImage, handleImageChange } =
    useGalleryState({
      images,
      onImageChange,
    });

  // 이미지 배열 유효성 검사
  const hasValidImages = images.length > 0;
  const currentImage = getCurrentImage();

  // 컴포넌트 초기화 로깅
  useEffect(() => {
    console.log('ImageGallerySliderWithZoom 초기화:', {
      imagesCount: images.length,
      hasProductInfo: productInfo !== null,
      currentImageIndex,
    });
  }, [images.length, productInfo, currentImageIndex]);

  // Early return - 이미지가 없는 경우
  if (!hasValidImages) {
    return (
      <main
        className={`flex items-center justify-center w-full h-screen bg-white ${className}`}
      >
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-red-50">
          <div className="text-xl text-red-500">⚠️</div>
          <h2 className="text-lg font-semibold text-red-700">이미지 없음</h2>
          <p className="text-center text-red-600">표시할 이미지가 없습니다</p>
        </div>
      </main>
    );
  }

  // 메인 컨테이너 클래스 (Tailwind 반응형 활용)
  const mainContainerClassName = `
    flex flex-col lg:flex-row
    w-full h-auto lg:h-screen
    bg-white
    ${className}
  `.trim();

  // 갤러리 섹션 클래스
  const gallerySectionClassName = `
    w-full lg:w-1/2
    h-auto lg:h-full
    flex-shrink-0
    bg-white
    lg:border-r lg:border-gray-200
  `.trim();

  // 제품 정보 섹션 클래스
  const productSectionClassName = `
    w-full lg:w-1/2
    h-auto lg:h-full
    flex-shrink-0
    bg-gray-50
  `.trim();

  return (
    <main
      className={mainContainerClassName}
      role="main"
      aria-label="이미지 갤러리와 제품 정보"
      data-total-images={images.length}
      data-current-index={currentImageIndex}
      data-current-image-id={currentImage?.id}
    >
      {/* 좌측: 이미지 갤러리 섹션 */}
      <section className={gallerySectionClassName} aria-label="이미지 갤러리">
        <SwiperImageGallery
          images={images}
          onImageChange={handleImageChange}
          className="w-full h-full"
        />
      </section>

      {/* 우측: 제품 정보 섹션 */}
      <section className={productSectionClassName} aria-label="제품 상세 정보">
        <ProductDetails productData={productInfo} className="w-full h-full" />
      </section>
    </main>
  );
}

export default ImageGallerySliderWithZoom;
