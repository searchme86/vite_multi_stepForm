import React from 'react';

//====핵심 수정====
// ✅ 추가: Context 관련 타입 및 인터페이스 정의
// 이유: 타입 안전성 확보 및 컴포넌트 간 일관성 유지
interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

// ✅ 수정: Form Values 타입 정의 - 실시간 동기화를 위한 안전한 타입 정의
export interface FormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[]; // ✅ 핵심: 슬라이더 이미지 배열 타입
}

// ✅ 수정: 이미지 뷰 설정 타입 정의 (간소화된 버전으로 업데이트)
export interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType?: 'grid' | 'masonry'; // ✅ 수정: spacing 제거, gridType 단순화
  };
  filter: string;
}

// ✅ 새로 추가: 사용자 정의 갤러리 뷰 타입 정의
// 이유: 사용자가 "해당 뷰로 추가" 버튼으로 추가한 갤러리들을 관리하기 위함
export interface CustomGalleryView {
  id: string; // 고유 식별자
  selectedImages: string[]; // 선택된 이미지 URL 배열
  clickOrder: number[]; // 클릭 순서 배열 (1, 2, 3...)
  layout: {
    columns: number; // 열 개수 (2~6)
    gridType: 'grid' | 'masonry'; // 레이아웃 타입
  };
  createdAt: Date; // 생성 시간
  title?: string; // 갤러리 제목 (선택사항)
}

// ✅ 수정: MultiStepForm Context 타입 정의 - 강화된 타입 안전성
export interface MultiStepFormContextType {
  // 기존 기능들
  addToast: (options: ToastOptions) => void;
  formValues: FormValues; // ✅ 핵심: 실시간 form 값들

  // PreviewPanel 제어를 위한 속성들
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (isOpen: boolean) => void;
  togglePreviewPanel: () => void;

  // 이미지 뷰 설정 관련 상태 (기존 ImageViewBuilder용)
  imageViewConfig: ImageViewConfig;
  setImageViewConfig: React.Dispatch<React.SetStateAction<ImageViewConfig>>;

  // ✅ 새로 추가: 사용자 정의 갤러리 뷰 관련 상태 및 함수들
  // 이유: 사용자가 여러 개의 갤러리 뷰를 생성하고 PreviewPanel에서 표시할 수 있도록 함
  customGalleryViews: CustomGalleryView[]; // 사용자가 추가한 갤러리 뷰들의 배열
  addCustomGalleryView: (view: CustomGalleryView) => void; // 새로운 갤러리 뷰 추가 함수
  removeCustomGalleryView: (id: string) => void; // 특정 갤러리 뷰 제거 함수
  clearCustomGalleryViews: () => void; // 모든 갤러리 뷰 초기화 함수
  updateCustomGalleryView: (
    id: string,
    updates: Partial<CustomGalleryView>
  ) => void; // 갤러리 뷰 업데이트 함수
}

// Context 생성
export const MultiStepFormContext =
  React.createContext<MultiStepFormContextType | null>(null);

// ✅ 수정: Custom hook for using the context (타입 안전성 강화)
export const useMultiStepForm = (): MultiStepFormContextType => {
  const context = React.useContext(MultiStepFormContext);
  if (!context) {
    throw new Error(
      'useMultiStepForm must be used within MultiStepFormProvider'
    );
  }
  return context;
};

// ✅ 새로 추가: CustomGalleryView 관련 유틸리티 함수들
// 이유: 갤러리 뷰 관리를 위한 헬퍼 함수들 제공

/**
 * 새로운 CustomGalleryView 객체를 생성하는 팩토리 함수
 * @param selectedImages - 선택된 이미지 URL 배열
 * @param clickOrder - 클릭 순서 배열
 * @param layout - 레이아웃 설정
 * @param title - 갤러리 제목 (선택사항)
 * @returns 새로 생성된 CustomGalleryView 객체
 */
export const createCustomGalleryView = (
  selectedImages: string[],
  clickOrder: number[],
  layout: { columns: number; gridType: 'grid' | 'masonry' },
  title?: string
): CustomGalleryView => {
  return {
    id: `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    selectedImages: [...selectedImages], // 배열 복사로 불변성 보장
    clickOrder: [...clickOrder], // 배열 복사로 불변성 보장
    layout: { ...layout }, // 객체 복사로 불변성 보장
    createdAt: new Date(),
    title,
  };
};

/**
 * CustomGalleryView 배열을 생성 시간순으로 정렬하는 함수
 * @param views - 정렬할 CustomGalleryView 배열
 * @param order - 정렬 순서 ('asc' | 'desc')
 * @returns 정렬된 CustomGalleryView 배열
 */
export const sortCustomGalleryViews = (
  views: CustomGalleryView[],
  order: 'asc' | 'desc' = 'desc'
): CustomGalleryView[] => {
  return [...views].sort((a, b) => {
    const timeA = a.createdAt.getTime();
    const timeB = b.createdAt.getTime();
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
};

/**
 * CustomGalleryView의 유효성을 검사하는 함수
 * @param view - 검사할 CustomGalleryView 객체
 * @returns 유효성 검사 결과 (boolean)
 */
export const validateCustomGalleryView = (view: CustomGalleryView): boolean => {
  // 필수 필드 존재 여부 확인
  if (!view.id || !view.selectedImages || !view.clickOrder || !view.layout) {
    return false;
  }

  // 배열 길이 일치 여부 확인
  if (view.selectedImages.length !== view.clickOrder.length) {
    return false;
  }

  // 이미지 배열이 비어있지 않은지 확인
  if (view.selectedImages.length === 0) {
    return false;
  }

  // 레이아웃 설정 유효성 확인
  if (view.layout.columns < 1 || view.layout.columns > 10) {
    return false;
  }

  // gridType 유효성 확인
  if (!['grid', 'masonry'].includes(view.layout.gridType)) {
    return false;
  }

  return true;
};

/**
 * CustomGalleryView 배열에서 특정 조건에 맞는 갤러리를 찾는 함수
 * @param views - 검색할 CustomGalleryView 배열
 * @param predicate - 검색 조건 함수
 * @returns 조건에 맞는 첫 번째 CustomGalleryView 또는 undefined
 */
export const findCustomGalleryView = (
  views: CustomGalleryView[],
  predicate: (view: CustomGalleryView) => boolean
): CustomGalleryView | undefined => {
  return views.find(predicate);
};

/**
 * CustomGalleryView의 요약 정보를 생성하는 함수
 * @param view - 요약할 CustomGalleryView 객체
 * @returns 갤러리 뷰의 요약 정보 문자열
 */
export const getCustomGalleryViewSummary = (
  view: CustomGalleryView
): string => {
  const imageCount = view.selectedImages.length;
  const layoutType =
    view.layout.gridType === 'masonry' ? '매스너리' : '균등 그리드';
  const columns = view.layout.columns;
  const date = view.createdAt.toLocaleDateString('ko-KR');

  return `${imageCount}개 이미지, ${columns}열 ${layoutType} (${date})`;
};

// ✅ 새로 추가: 기본 ImageViewConfig 생성 함수
// 이유: ImageViewBuilder에서 사용할 기본 설정을 일관되게 제공
export const createDefaultImageViewConfig = (): ImageViewConfig => {
  return {
    selectedImages: [],
    clickOrder: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'available',
  };
};

// ✅ 새로 추가: ImageViewConfig를 CustomGalleryView로 변환하는 함수
// 이유: ImageViewBuilder의 현재 상태를 CustomGalleryView로 쉽게 변환
export const convertImageViewConfigToCustomGalleryView = (
  config: ImageViewConfig,
  gridType: 'grid' | 'masonry' = 'grid',
  title?: string
): CustomGalleryView => {
  return createCustomGalleryView(
    config.selectedImages,
    config.clickOrder,
    {
      columns: config.layout.columns,
      gridType: gridType, // ImageViewBuilder에서 선택한 뷰 타입 적용
    },
    title
  );
};

//====핵심 추가====
// ✅ 새로 추가: FormValues 유효성 검사 함수
// 이유: 실시간 동기화 과정에서 데이터 무결성 보장
export const validateFormValues = (values: Partial<FormValues>): FormValues => {
  return {
    userImage: typeof values.userImage === 'string' ? values.userImage : '',
    nickname: typeof values.nickname === 'string' ? values.nickname : '',
    emailPrefix:
      typeof values.emailPrefix === 'string' ? values.emailPrefix : '',
    emailDomain:
      typeof values.emailDomain === 'string' ? values.emailDomain : '',
    bio: typeof values.bio === 'string' ? values.bio : '',
    title: typeof values.title === 'string' ? values.title : '',
    description:
      typeof values.description === 'string' ? values.description : '',
    tags: typeof values.tags === 'string' ? values.tags : '',
    content: typeof values.content === 'string' ? values.content : '',
    media: Array.isArray(values.media) ? values.media : [],
    mainImage: values.mainImage || null,
    sliderImages: Array.isArray(values.sliderImages) ? values.sliderImages : [],
  };
};

// ✅ 새로 추가: 슬라이더 이미지 관련 유틸리티 함수들
// 이유: BlogMediaStep과 PreviewPanel 간의 일관된 슬라이더 관리

/**
 * 슬라이더 이미지 배열이 유효한지 검사하는 함수
 * @param sliderImages - 검사할 슬라이더 이미지 배열
 * @returns 유효성 검사 결과 (boolean)
 */
export const validateSliderImages = (
  sliderImages: any
): sliderImages is string[] => {
  return (
    Array.isArray(sliderImages) &&
    sliderImages.every((img) => typeof img === 'string' && img.length > 0)
  );
};

/**
 * 중복된 슬라이더 이미지를 제거하는 함수
 * @param sliderImages - 정리할 슬라이더 이미지 배열
 * @returns 중복이 제거된 슬라이더 이미지 배열
 */
export const deduplicateSliderImages = (sliderImages: string[]): string[] => {
  return [...new Set(sliderImages)];
};

/**
 * 슬라이더 이미지 순서를 변경하는 함수
 * @param sliderImages - 현재 슬라이더 이미지 배열
 * @param fromIndex - 이동할 이미지의 현재 인덱스
 * @param toIndex - 이동할 목표 인덱스
 * @returns 순서가 변경된 슬라이더 이미지 배열
 */
export const reorderSliderImages = (
  sliderImages: string[],
  fromIndex: number,
  toIndex: number
): string[] => {
  const result = [...sliderImages];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * 슬라이더 이미지 상태 정보를 생성하는 함수
 * @param sliderImages - 슬라이더 이미지 배열
 * @returns 슬라이더 상태 정보 객체
 */
export const getSliderImageInfo = (sliderImages: string[]) => {
  return {
    count: sliderImages.length,
    isEmpty: sliderImages.length === 0,
    hasImages: sliderImages.length > 0,
    isMultiple: sliderImages.length > 1,
    firstImage: sliderImages[0] || null,
    lastImage: sliderImages[sliderImages.length - 1] || null,
  };
};
//====핵심 추가 끝====
