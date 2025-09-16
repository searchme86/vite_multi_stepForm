// components/ImageGalleryWithContent/utils/sliderValidationUtils.ts

import { SLIDER_CONFIG, SLIDER_VALIDATION_MESSAGES } from './sliderConstants';

// 🎯 슬라이더 유효성 검증 결과 타입
export interface SliderValidationResult {
  isValid: boolean;
  errorMessage: string;
  errorCode: string | null;
  imageCount: number;
  requiredCount: number;
}

// 🎯 이미지 데이터 유효성 검증 함수
export function validateImageUrls(imageUrls: unknown[]): string[] {
  console.log('🔍 이미지 URL 유효성 검증 시작:', {
    inputCount: imageUrls.length,
    inputType: typeof imageUrls,
  });

  const validImageUrls = imageUrls.filter((imageUrl): imageUrl is string => {
    const isString = typeof imageUrl === 'string';
    const hasValidLength = isString && imageUrl.length > 0;
    const hasValidFormat =
      hasValidLength &&
      (imageUrl.startsWith('data:') ||
        imageUrl.startsWith('blob:') ||
        imageUrl.startsWith('http'));

    const isValid = isString && hasValidLength && hasValidFormat;

    if (!isValid) {
      console.warn('⚠️ 유효하지 않은 이미지 URL 발견:', {
        imageUrl:
          typeof imageUrl === 'string'
            ? imageUrl.slice(0, 50) + '...'
            : imageUrl,
        isString,
        hasValidLength,
        hasValidFormat,
      });
    }

    return isValid;
  });

  console.log('✅ 이미지 URL 유효성 검증 완료:', {
    totalInput: imageUrls.length,
    validUrls: validImageUrls.length,
    invalidUrls: imageUrls.length - validImageUrls.length,
  });

  return validImageUrls;
}

// 🎯 슬라이더 이미지 갯수 유효성 검증 함수
export function validateSliderImageCount(
  imageUrls: string[]
): SliderValidationResult {
  console.log('🔍 슬라이더 이미지 갯수 검증 시작:', {
    imageCount: imageUrls.length,
    minRequired: SLIDER_CONFIG.MIN_IMAGES,
    maxAllowed: SLIDER_CONFIG.MAX_IMAGES,
  });

  const imageCount = imageUrls.length;
  const { MIN_IMAGES, MAX_IMAGES } = SLIDER_CONFIG;

  // 이미지가 없는 경우
  if (imageCount === 0) {
    const errorMessage = SLIDER_VALIDATION_MESSAGES.NO_IMAGES;
    console.log('❌ 슬라이더 검증 실패 - 이미지 없음');

    return {
      isValid: false,
      errorMessage,
      errorCode: 'NO_IMAGES',
      imageCount,
      requiredCount: MIN_IMAGES,
    };
  }

  // 최소 갯수 미충족
  if (imageCount < MIN_IMAGES) {
    const errorMessage = SLIDER_VALIDATION_MESSAGES.INSUFFICIENT_IMAGES.replace(
      '{min}',
      MIN_IMAGES.toString()
    );

    console.log('❌ 슬라이더 검증 실패 - 최소 갯수 미충족:', {
      currentCount: imageCount,
      requiredCount: MIN_IMAGES,
    });

    return {
      isValid: false,
      errorMessage,
      errorCode: 'INSUFFICIENT_IMAGES',
      imageCount,
      requiredCount: MIN_IMAGES,
    };
  }

  // 최대 갯수 초과
  if (imageCount > MAX_IMAGES) {
    const errorMessage = SLIDER_VALIDATION_MESSAGES.TOO_MANY_IMAGES.replace(
      '{max}',
      MAX_IMAGES.toString()
    );

    console.log('❌ 슬라이더 검증 실패 - 최대 갯수 초과:', {
      currentCount: imageCount,
      maxAllowed: MAX_IMAGES,
    });

    return {
      isValid: false,
      errorMessage,
      errorCode: 'TOO_MANY_IMAGES',
      imageCount,
      requiredCount: MIN_IMAGES,
    };
  }

  // 검증 성공
  console.log('✅ 슬라이더 이미지 갯수 검증 성공:', {
    imageCount,
    minRequired: MIN_IMAGES,
    maxAllowed: MAX_IMAGES,
  });

  return {
    isValid: true,
    errorMessage: '',
    errorCode: null,
    imageCount,
    requiredCount: MIN_IMAGES,
  };
}

// 🎯 종합적인 슬라이더 유효성 검증 함수
export function validateSliderImages(
  imageUrls: unknown[]
): SliderValidationResult {
  console.log('🔍 종합 슬라이더 유효성 검증 시작:', {
    inputCount: Array.isArray(imageUrls) ? imageUrls.length : 0,
    validationEnabled: SLIDER_CONFIG.VALIDATION_ENABLED,
  });

  // 검증이 비활성화된 경우
  if (!SLIDER_CONFIG.VALIDATION_ENABLED) {
    console.log('ℹ️ 슬라이더 검증이 비활성화됨');
    return {
      isValid: true,
      errorMessage: '',
      errorCode: null,
      imageCount: Array.isArray(imageUrls) ? imageUrls.length : 0,
      requiredCount: SLIDER_CONFIG.MIN_IMAGES,
    };
  }

  // 배열 유효성 검증
  if (!Array.isArray(imageUrls)) {
    console.error('❌ 입력 데이터가 배열이 아님:', typeof imageUrls);
    return {
      isValid: false,
      errorMessage: SLIDER_VALIDATION_MESSAGES.INVALID_IMAGE_DATA,
      errorCode: 'INVALID_IMAGE_DATA',
      imageCount: 0,
      requiredCount: SLIDER_CONFIG.MIN_IMAGES,
    };
  }

  // 1단계: 이미지 URL 유효성 검증
  const validImageUrls = validateImageUrls(imageUrls);

  // 2단계: 이미지 갯수 검증
  const countValidationResult = validateSliderImageCount(validImageUrls);

  console.log('✅ 종합 슬라이더 유효성 검증 완료:', {
    originalCount: imageUrls.length,
    validUrlsCount: validImageUrls.length,
    finalValidation: countValidationResult.isValid,
    errorCode: countValidationResult.errorCode,
  });

  return countValidationResult;
}

// 🎯 간편한 검증 함수들
export function canCreateSlider(imageUrls: unknown[]): boolean {
  const validationResult = validateSliderImages(imageUrls);
  return validationResult.isValid;
}

export function getSliderValidationMessage(imageUrls: unknown[]): string {
  const validationResult = validateSliderImages(imageUrls);
  return validationResult.errorMessage;
}

export function getValidSliderImageCount(imageUrls: unknown[]): number {
  if (!Array.isArray(imageUrls)) {
    return 0;
  }

  const validUrls = validateImageUrls(imageUrls);
  return validUrls.length;
}

// 🎯 메인 이미지 제외 검증 함수 (기존 로직과 호환)
export function validateSliderImagesExcludingMain(
  allImages: unknown[],
  mainImageUrl: string | null
): SliderValidationResult {
  console.log('🔍 메인 이미지 제외 슬라이더 검증:', {
    totalImages: Array.isArray(allImages) ? allImages.length : 0,
    hasMainImage: mainImageUrl !== null && mainImageUrl !== undefined,
    mainImageUrl: mainImageUrl ? mainImageUrl.slice(0, 30) + '...' : 'none',
  });

  if (!Array.isArray(allImages)) {
    return validateSliderImages([]);
  }

  // 메인 이미지가 있는 경우 제외
  const availableImages = mainImageUrl
    ? allImages.filter((imageUrl) => imageUrl !== mainImageUrl)
    : allImages;

  console.log('🔧 메인 이미지 제외 후 이미지 목록:', {
    originalCount: allImages.length,
    excludedMainImage: mainImageUrl !== null,
    availableCount: availableImages.length,
  });

  return validateSliderImages(availableImages);
}
