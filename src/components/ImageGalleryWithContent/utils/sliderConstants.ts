// components/ImageGalleryWithContent/utils/sliderConstants.ts

// 🎯 슬라이더 이미지 관련 상수
export const SLIDER_MIN_IMAGES = 3;
export const SLIDER_MAX_IMAGES = 10;
export const SLIDER_DEFAULT_COLUMNS = 3;

// 🎯 슬라이더 검증 관련 상수
export const SLIDER_VALIDATION_MESSAGES = {
  INSUFFICIENT_IMAGES:
    '슬라이더 생성을 위해 최소 {min}개의 이미지가 필요합니다.',
  TOO_MANY_IMAGES: '슬라이더에는 최대 {max}개의 이미지만 추가할 수 있습니다.',
  NO_IMAGES: '슬라이더에 표시할 이미지가 없습니다.',
  INVALID_IMAGE_DATA: '유효하지 않은 이미지 데이터가 포함되어 있습니다.',
} as const;

// 🎯 슬라이더 설정 상수
export const SLIDER_CONFIG = {
  MIN_IMAGES: SLIDER_MIN_IMAGES,
  MAX_IMAGES: SLIDER_MAX_IMAGES,
  DEFAULT_COLUMNS: SLIDER_DEFAULT_COLUMNS,
  VALIDATION_ENABLED: true,
  AUTO_PLAY: false,
  ZOOM_ENABLED: true,
  THUMBNAIL_ENABLED: true,
} as const;

// 🎯 타입 정의
export type SliderValidationMessage = keyof typeof SLIDER_VALIDATION_MESSAGES;
export type SliderConfigKey = keyof typeof SLIDER_CONFIG;

console.log('🔧 슬라이더 상수 파일 로드:', {
  minImages: SLIDER_MIN_IMAGES,
  maxImages: SLIDER_MAX_IMAGES,
  validationEnabled: SLIDER_CONFIG.VALIDATION_ENABLED,
});
