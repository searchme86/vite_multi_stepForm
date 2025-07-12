// components/ImageGalleryWithContent/ImageGallerySliderWithZoom.tsx

import { useCallback, useMemo } from 'react';
import { useImageGalleryStore } from '../../store/imageGallery/imageGalleryStore';
import type {
  ImageData,
  ProductData,
  ImageGallerySliderWithZoomProps,
} from './types/imageGalleryTypes';
import { validateSliderImages } from './utils/sliderValidationUtils';
import { convertSliderImagesToImageData } from './utils/imageDataConverter';
import { SLIDER_CONFIG } from './utils/sliderConstants';
import SwiperImageGallery from './parts/SwiperImageGallery';
import ProductDetails from './parts/ProductDetails';
import useGalleryState from './hooks/useGalleryState';

// 🔧 타입 호환성을 위한 로컬 인터페이스 정의
interface ImageValidationResult {
  isValid: boolean;
  errorMessage: string;
  errorCode: string; // null을 허용하지 않음
  imageCount: number;
  requiredCount: number;
}

// 🔧 SliderValidationResult → ImageValidationResult 안전한 변환 함수
function convertToImageValidationResult(
  sliderResult: ReturnType<typeof validateSliderImages>
): ImageValidationResult {
  console.log('🔄 타입 변환:', {
    originalErrorCode: sliderResult.errorCode,
    originalType: typeof sliderResult.errorCode,
  });

  return {
    isValid: sliderResult.isValid,
    errorMessage: sliderResult.errorMessage,
    errorCode: sliderResult.errorCode || 'UNKNOWN_ERROR', // null → string 변환
    imageCount: sliderResult.imageCount,
    requiredCount: sliderResult.requiredCount,
  };
}

// 🔧 unknown[] → ImageData[] 안전한 타입 가드 함수
function validateImageDataArray(unknownArray: unknown[]): ImageData[] {
  console.log('🔍 ImageData 배열 검증 시작:', {
    inputLength: unknownArray.length,
    inputType: typeof unknownArray,
  });

  const validImageDataArray = unknownArray.filter((item): item is ImageData => {
    const isObject = typeof item === 'object' && item !== null;
    if (!isObject) {
      return false;
    }

    const hasId = 'id' in item && typeof Reflect.get(item, 'id') === 'string';
    const hasUrl =
      'url' in item && typeof Reflect.get(item, 'url') === 'string';
    const hasAlt =
      'alt' in item && typeof Reflect.get(item, 'alt') === 'string';

    const isValidImageData = hasId && hasUrl && hasAlt;

    if (!isValidImageData) {
      console.warn('⚠️ 유효하지 않은 ImageData 객체:', {
        hasId,
        hasUrl,
        hasAlt,
        item,
      });
    }

    return isValidImageData;
  });

  console.log('✅ ImageData 배열 검증 완료:', {
    originalLength: unknownArray.length,
    validLength: validImageDataArray.length,
    filteredCount: unknownArray.length - validImageDataArray.length,
  });

  return validImageDataArray;
}

function ImageGallerySliderWithZoom({
  images: propImages = [],
  productInfo,
  className = '',
  onImageChange,
}: ImageGallerySliderWithZoomProps) {
  console.log('🚀 ImageGallerySliderWithZoom 렌더링 시작:', {
    propImagesCount: propImages.length,
    hasProductInfo: productInfo !== undefined,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 스토어에서 슬라이더 이미지 가져오기
  const imageGalleryStore = useImageGalleryStore();
  const { imageViewConfig } = imageGalleryStore || {};
  const safeImageViewConfig = imageViewConfig || {};

  const rawSliderImages = Reflect.get(safeImageViewConfig, 'sliderImages');
  const storeSliderImages = Array.isArray(rawSliderImages)
    ? rawSliderImages
    : [];

  console.log('📊 스토어 데이터 상태:', {
    hasImageViewConfig: imageViewConfig !== undefined,
    storeSliderImagesCount: storeSliderImages.length,
    storeSliderImagesType: typeof storeSliderImages,
  });

  // 🔧 이미지 소스 결정 (props vs store)
  const finalImageUrls = useMemo(() => {
    const hasPropImages = propImages.length > 0;
    const hasStoreImages = storeSliderImages.length > 0;

    console.log('🎯 이미지 소스 결정:', {
      hasPropImages,
      hasStoreImages,
      propImagesCount: propImages.length,
      storeImagesCount: storeSliderImages.length,
    });

    if (hasPropImages) {
      console.log('📁 Props 이미지 사용');
      return propImages.map((imageData) => imageData.url);
    }

    if (hasStoreImages) {
      console.log('🗄️ 스토어 이미지 사용');
      return storeSliderImages;
    }

    console.log('⚠️ 사용 가능한 이미지 없음');
    return [];
  }, [propImages, storeSliderImages]);

  // 🔧 슬라이더 유효성 검증
  const sliderValidationResult = useMemo(() => {
    console.log('🔍 슬라이더 유효성 검증 시작:', {
      imageUrlsCount: finalImageUrls.length,
      minimumRequired: SLIDER_CONFIG.MIN_IMAGES,
    });

    const originalResult = validateSliderImages(finalImageUrls);
    const convertedResult = convertToImageValidationResult(originalResult);

    console.log('✅ 슬라이더 유효성 검증 완료:', {
      isValid: convertedResult.isValid,
      errorCode: convertedResult.errorCode,
      imageCount: convertedResult.imageCount,
      requiredCount: convertedResult.requiredCount,
    });

    return convertedResult;
  }, [finalImageUrls]);

  // 🔧 ImageData 배열 생성 및 검증
  const validatedImages = useMemo(() => {
    console.log('🔄 ImageData 변환 시작:', {
      finalImageUrlsCount: finalImageUrls.length,
      validationPassed: sliderValidationResult.isValid,
    });

    if (!sliderValidationResult.isValid) {
      console.log('❌ 검증 실패로 빈 배열 반환');
      return [];
    }

    if (propImages.length > 0) {
      console.log('📁 Props ImageData 직접 사용');
      const propImageDataArray = validateImageDataArray(propImages);
      return propImageDataArray;
    }

    console.log('🔄 URL → ImageData 변환 시작');
    const convertedImages = convertSliderImagesToImageData(finalImageUrls);
    const validatedConvertedImages = validateImageDataArray(convertedImages);

    console.log('✅ ImageData 변환 완료:', {
      convertedCount: convertedImages.length,
      validatedCount: validatedConvertedImages.length,
    });

    return validatedConvertedImages;
  }, [finalImageUrls, sliderValidationResult.isValid, propImages]);

  // 🔧 이미지 변경 핸들러
  const handleImageChange = useCallback(
    (newImageIndex: number) => {
      console.log('🔄 이미지 변경:', {
        newImageIndex,
        totalImages: validatedImages.length,
      });

      const isValidIndex =
        newImageIndex >= 0 && newImageIndex < validatedImages.length;
      if (!isValidIndex) {
        console.warn('⚠️ 유효하지 않은 이미지 인덱스:', {
          newImageIndex,
          validRange: `0-${validatedImages.length - 1}`,
        });
        return;
      }

      const targetImageData = validatedImages[newImageIndex];
      if (!targetImageData) {
        console.warn('⚠️ 대상 이미지 데이터 없음:', { newImageIndex });
        return;
      }

      if (typeof onImageChange === 'function') {
        onImageChange(newImageIndex, targetImageData);
        console.log('✅ 외부 이미지 변경 콜백 호출 완료');
      }
    },
    [validatedImages, onImageChange]
  );

  // 🔧 갤러리 상태 관리 (타입 에러 해결)
  const galleryStateProps = useMemo(() => {
    return {
      images: validatedImages, // ImageData[] 타입 보장
      onImageChange: handleImageChange,
    };
  }, [validatedImages, handleImageChange]);

  const galleryState = useGalleryState(galleryStateProps);
  const { currentImageIndex } = galleryState || {};

  // 🔧 제품 정보 처리
  const safeProductInfo = useMemo(() => {
    const defaultProductInfo: ProductData = {
      title: '',
      description: '',
      specifications: [],
      allergyInfo: '',
      customContent: null,
    };

    if (!productInfo) {
      return defaultProductInfo;
    }

    const {
      title = '',
      description = '',
      specifications = [],
      allergyInfo = '',
      customContent = null,
    } = productInfo;

    return {
      title,
      description,
      specifications,
      allergyInfo,
      customContent,
    };
  }, [productInfo]);

  console.log('📊 ImageGallerySliderWithZoom 최종 상태:', {
    finalImageUrlsCount: finalImageUrls.length,
    validatedImagesCount: validatedImages.length,
    sliderValidationPassed: sliderValidationResult.isValid,
    currentImageIndex: currentImageIndex || 0,
    hasProductInfo: productInfo !== undefined,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🚨 Early Return: 검증 실패 시
  if (!sliderValidationResult.isValid) {
    console.log('❌ 슬라이더 조건 미충족, 에러 UI 표시:', {
      errorCode: sliderValidationResult.errorCode,
      errorMessage: sliderValidationResult.errorMessage,
    });

    return (
      <section
        className={`flex items-center justify-center p-6 ${className}`}
        role="region"
        aria-labelledby="slider-error-title"
        aria-describedby="slider-error-description"
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">🚫</div>
          <h2
            id="slider-error-title"
            className="mb-2 text-xl font-semibold text-gray-900"
          >
            슬라이더를 표시할 수 없습니다
          </h2>
          <p id="slider-error-description" className="text-gray-600">
            {sliderValidationResult.errorMessage}
          </p>
          <div className="mt-3 text-sm text-gray-500">
            현재 이미지: {sliderValidationResult.imageCount}개 / 필요한 이미지:{' '}
            {sliderValidationResult.requiredCount}개
          </div>
        </div>
      </section>
    );
  }

  // 🚨 Early Return: 이미지 없음
  if (validatedImages.length === 0) {
    console.log('⚠️ 유효한 이미지 없음, 빈 상태 UI 표시');

    return (
      <section
        className={`flex items-center justify-center p-6 ${className}`}
        role="region"
        aria-labelledby="no-images-title"
        aria-describedby="no-images-description"
      >
        <div className="text-center">
          <div className="mb-4 text-6xl">🖼️</div>
          <h2
            id="no-images-title"
            className="mb-2 text-xl font-semibold text-gray-900"
          >
            표시할 이미지가 없습니다
          </h2>
          <p id="no-images-description" className="text-gray-600">
            슬라이더에 추가된 이미지가 없습니다.
          </p>
        </div>
      </section>
    );
  }

  // 🎯 메인 UI 렌더링
  const containerClassName = `
    w-full h-full flex flex-col lg:flex-row bg-white rounded-lg shadow-lg overflow-hidden
    ${className}
  `.trim();

  return (
    <section
      className={containerClassName}
      role="region"
      aria-labelledby="image-gallery-title"
      aria-describedby="image-gallery-description"
    >
      <header className="sr-only">
        <h1 id="image-gallery-title">이미지 갤러리 슬라이더</h1>
        <p id="image-gallery-description">
          {validatedImages.length}개의 이미지로 구성된 확대/축소 가능한 슬라이더
        </p>
      </header>

      {/* 🖼️ 이미지 갤러리 영역 */}
      <main className="flex-1 lg:flex-2">
        <SwiperImageGallery
          images={validatedImages} // ImageData[] 타입 보장
          onImageChange={handleImageChange}
          className="w-full h-full"
        />
      </main>

      {/* 📝 제품 정보 영역 */}
      <aside className="w-full border-t border-gray-200 lg:w-96 lg:border-t-0 lg:border-l">
        <ProductDetails
          productData={safeProductInfo}
          className="w-full h-full"
        />
      </aside>
    </section>
  );
}

export default ImageGallerySliderWithZoom;
