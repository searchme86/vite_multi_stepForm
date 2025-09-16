// components/ImageGalleryWithContent/utils/imageDataConverter.ts

import type { ImageData } from '../types/imageGalleryTypes';
import { validateImageUrls } from './sliderValidationUtils';

// 🎯 이미지 URL 배열을 ImageData 배열로 변환
export function convertSliderImagesToImageData(
  imageUrls: string[]
): ImageData[] {
  console.log('🔄 스토어 이미지 → ImageData 변환 시작:', {
    inputCount: imageUrls.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 입력 데이터 유효성 검증
  if (!Array.isArray(imageUrls)) {
    console.error('❌ 입력 데이터가 배열이 아님:', typeof imageUrls);
    return [];
  }

  if (imageUrls.length === 0) {
    console.log('ℹ️ 변환할 이미지가 없음');
    return [];
  }

  // 유효한 이미지 URL만 필터링
  const validImageUrls = validateImageUrls(imageUrls);

  if (validImageUrls.length === 0) {
    console.warn('⚠️ 유효한 이미지 URL이 없음');
    return [];
  }

  // ImageData 객체 배열로 변환
  const convertedImageData = validImageUrls.map((imageUrl, index) => {
    const imageData: ImageData = {
      id: generateSliderImageId(index, imageUrl),
      url: imageUrl,
      alt: generateSliderImageAlt(index),
      title: generateSliderImageTitle(index),
      description: generateSliderImageDescription(index),
    };

    console.log(`🖼️ 이미지 ${index + 1} 변환 완료:`, {
      id: imageData.id,
      urlPreview: imageUrl.slice(0, 30) + '...',
      alt: imageData.alt,
    });

    return imageData;
  });

  console.log('✅ 스토어 이미지 → ImageData 변환 완료:', {
    originalCount: imageUrls.length,
    validCount: validImageUrls.length,
    convertedCount: convertedImageData.length,
    firstImageId: convertedImageData[0]?.id || 'none',
    timestamp: new Date().toLocaleTimeString(),
  });

  return convertedImageData;
}

// 🎯 슬라이더 이미지 ID 생성 함수
function generateSliderImageId(index: number, imageUrl: string): string {
  const timestamp = Date.now();
  const urlHash = generateSimpleHash(imageUrl);
  const sliderId = `slider-${index + 1}-${urlHash}-${timestamp}`;

  return sliderId;
}

// 🎯 슬라이더 이미지 Alt 텍스트 생성 함수
function generateSliderImageAlt(index: number): string {
  return `슬라이더 이미지 ${index + 1}`;
}

// 🎯 슬라이더 이미지 제목 생성 함수
function generateSliderImageTitle(index: number): string {
  return `슬라이더 이미지 ${index + 1}`;
}

// 🎯 슬라이더 이미지 설명 생성 함수
function generateSliderImageDescription(index: number): string {
  return `블로그 포스트 슬라이더의 ${index + 1}번째 이미지입니다.`;
}

// 🎯 간단한 해시 생성 함수 (URL 기반)
function generateSimpleHash(input: string): string {
  const shortInput = input.slice(0, 50); // 긴 URL 잘라내기
  let hash = 0;

  for (let i = 0; i < shortInput.length; i++) {
    const char = shortInput.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit 정수로 변환
  }

  const positiveHash = Math.abs(hash);
  const hashString = positiveHash.toString(36).slice(0, 8);

  return hashString;
}

// 🎯 스토어 슬라이더 데이터 → ImageData 변환 (전체 컨텍스트 포함)
export function convertStoreSliderToImageData(
  sliderImages: string[],
  options?: {
    includeMetadata?: boolean;
    customTitlePrefix?: string;
    customDescriptionPrefix?: string;
  }
): ImageData[] {
  const {
    includeMetadata = false,
    customTitlePrefix = '슬라이더 이미지',
    customDescriptionPrefix = '블로그 포스트 슬라이더의',
  } = options || {};

  console.log('🔄 향상된 스토어 → ImageData 변환 시작:', {
    sliderImagesCount: sliderImages.length,
    includeMetadata,
    customTitlePrefix,
    hasCustomOptions: options !== undefined,
  });

  if (!Array.isArray(sliderImages) || sliderImages.length === 0) {
    console.log('ℹ️ 변환할 슬라이더 이미지가 없음');
    return [];
  }

  // 기본 변환 실행
  const baseImageData = convertSliderImagesToImageData(sliderImages);

  // 추가 옵션이 없으면 기본 변환 결과 반환
  if (!includeMetadata && !options) {
    return baseImageData;
  }

  // 옵션 기반 향상된 변환
  const enhancedImageData = baseImageData.map((imageData, index) => {
    const enhancedData: ImageData = {
      ...imageData,
      title: `${customTitlePrefix} ${index + 1}`,
      description: `${customDescriptionPrefix} ${index + 1}번째 이미지입니다.`,
    };

    return enhancedData;
  });

  console.log('✅ 향상된 스토어 → ImageData 변환 완료:', {
    enhancedCount: enhancedImageData.length,
    customizations: {
      titlePrefix: customTitlePrefix,
      descriptionPrefix: customDescriptionPrefix,
    },
  });

  return enhancedImageData;
}

// 🎯 역변환: ImageData → 이미지 URL 배열
export function convertImageDataToUrls(imageDataArray: ImageData[]): string[] {
  console.log('🔄 ImageData → URL 배열 역변환 시작:', {
    inputCount: imageDataArray.length,
  });

  if (!Array.isArray(imageDataArray)) {
    console.error('❌ 입력 데이터가 배열이 아님:', typeof imageDataArray);
    return [];
  }

  const imageUrls = imageDataArray
    .filter((imageData): imageData is ImageData => {
      const hasValidStructure =
        imageData !== null &&
        imageData !== undefined &&
        typeof imageData === 'object';

      const hasUrl =
        hasValidStructure &&
        'url' in imageData &&
        typeof imageData.url === 'string' &&
        imageData.url.length > 0;

      if (!hasUrl) {
        console.warn('⚠️ 유효하지 않은 ImageData 객체:', imageData);
      }

      return hasUrl;
    })
    .map((imageData) => imageData.url);

  console.log('✅ ImageData → URL 배열 역변환 완료:', {
    originalCount: imageDataArray.length,
    extractedUrlsCount: imageUrls.length,
  });

  return imageUrls;
}

// 🎯 빈 슬라이더 ImageData 생성 (폴백용)
export function createEmptySliderImageData(): ImageData[] {
  console.log('🔧 빈 슬라이더 ImageData 생성');

  return [];
}

// 🎯 슬라이더 이미지 데이터 유효성 검증
export function validateImageDataArray(imageDataArray: unknown[]): ImageData[] {
  console.log('🔍 ImageData 배열 유효성 검증 시작:', {
    inputCount: Array.isArray(imageDataArray) ? imageDataArray.length : 0,
  });

  if (!Array.isArray(imageDataArray)) {
    console.error('❌ 입력이 배열이 아님');
    return [];
  }

  const validImageData = imageDataArray.filter((item): item is ImageData => {
    const isObject = typeof item === 'object' && item !== null;
    if (!isObject) return false;

    const hasRequiredFields =
      'id' in item &&
      typeof item.id === 'string' &&
      'url' in item &&
      typeof item.url === 'string' &&
      'alt' in item &&
      typeof item.alt === 'string';

    if (!hasRequiredFields) {
      console.warn('⚠️ 필수 필드가 없는 ImageData:', item);
      return false;
    }

    return true;
  });

  console.log('✅ ImageData 배열 유효성 검증 완료:', {
    originalCount: imageDataArray.length,
    validCount: validImageData.length,
    invalidCount: imageDataArray.length - validImageData.length,
  });

  return validImageData;
}
