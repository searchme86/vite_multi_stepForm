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
//====여기까지 수정됨====
