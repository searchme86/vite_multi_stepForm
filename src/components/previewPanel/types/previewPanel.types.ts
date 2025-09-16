//====여기부터 수정됨====
// 미리보기 패널 관련 타입 정의 - 누락된 필드들 추가
export interface ParagraphBlock {
  containerId: string | null;
  id?: string;
  content?: string;
}

export interface FormData {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
  title: string;
  description: string;
  content: string;
  tags: string;
  nickname: string;
  userImage: string;
  emailPrefix: string; // 추가된 필드
  emailDomain: string; // 추가된 필드
}

export interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: string;
}

export interface CustomGalleryView {
  id: string;
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
}

export interface CurrentFormValues {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
  title: string;
  description: string;
  content: string;
  tags: string;
  nickname: string;
  userImage: string;
  emailPrefix: string; // 추가된 필드
  emailDomain: string; // 추가된 필드
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

export interface DisplayContent {
  text: string;
  source: 'editor' | 'basic';
}

export interface EditorStatusInfo {
  hasEditor: boolean;
  containerCount: number;
  paragraphCount: number;
  isCompleted: boolean;
}

export interface AvatarProps {
  src: string;
  name: string;
  className: string;
  showFallback: boolean;
  isBordered: boolean;
}

export interface StateRef {
  touchStartY: number;
  isDragging: boolean;
  isMounted: boolean;
}

// 추가된 타입들
export interface DateFormatOptions {
  day: 'numeric';
  month: 'short';
  year: 'numeric';
}

export interface MobileTabState {
  selectedSize: string;
  hasChanged: boolean;
}

// 🎯 모바일 디바이스 사이즈 타입 정의 (새로 추가)
export type MobileDeviceSize = '360' | '768';

// 🎯 모바일 디바이스 설정 인터페이스 (새로 추가)
export interface MobileDeviceConfig {
  size: MobileDeviceSize;
  width: number;
  label: string;
  description: string;
}

// 🎯 모바일 디바이스 설정 상수 (새로 추가)
export const MOBILE_DEVICE_CONFIGS: Record<
  MobileDeviceSize,
  MobileDeviceConfig
> = {
  '360': {
    size: '360',
    width: 360,
    label: '360px',
    description: 'Small Mobile (iPhone SE, Android Compact)',
  },
  '768': {
    size: '768',
    width: 768,
    label: '768px',
    description: 'Tablet Portrait (iPad Mini, Android Tablet)',
  },
};

// 🎯 모바일 사이즈 검증 함수 (새로 추가)
export const validateMobileSize = (
  requestedSize: string
): {
  isValid: boolean;
  validatedSize: MobileDeviceSize;
  errorMessage?: string;
} => {
  const validSizes = Object.keys(MOBILE_DEVICE_CONFIGS);
  const isSizeValid = validSizes.includes(requestedSize);

  if (isSizeValid) {
    return {
      isValid: true,
      validatedSize: requestedSize as MobileDeviceSize,
    };
  }

  return {
    isValid: false,
    validatedSize: '360', // 기본값
    errorMessage: `Invalid mobile size: ${requestedSize}. Valid sizes: ${validSizes.join(
      ', '
    )}`,
  };
};

// 🎯 모바일 사이즈 유틸리티 함수 (새로 추가)
export const getMobileDeviceInfo = (
  deviceSize: MobileDeviceSize
): MobileDeviceConfig => {
  const deviceConfig = MOBILE_DEVICE_CONFIGS[deviceSize];

  return deviceConfig || MOBILE_DEVICE_CONFIGS['360'];
};
//====여기까지 수정됨====
