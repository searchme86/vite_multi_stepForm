// components/ImageGalleryWithContent/types/imageGalleryTypes.ts

import { type ReactNode } from 'react';

// 🖼️ 이미지 데이터 기본 타입
export interface ImageData {
  id: string;
  url: string;
  alt: string;
  title?: string;
  description?: string;
}

// ⚙️ 갤러리 설정 타입 (SwipeableConfig 수준)
export interface GalleryConfig {
  speed?: number;
  allowLoop?: boolean;
  touchEnabled?: boolean;
  showNavigation?: boolean;
  spaceBetween?: number;
  initialSlide?: number;
}

// 📝 우측 컨텐츠 영역 타입
export interface ContentAreaData {
  title?: string;
  description?: string;
  specs?: SpecificationItem[];
  customContent?: ReactNode;
  allergyInfo?: string;
}

// 📊 스펙 정보 타입 (영양정보 등)
export interface SpecificationItem {
  label: string;
  value: string | number;
  unit?: string;
  type: 'nutrition' | 'info' | 'custom';
}

// 🔍 줌 기능 설정 타입
export interface ZoomConfig {
  enableZoom?: boolean;
  zoomScale?: number;
  maskSizeRatio?: number;
  touchZoomEnabled?: boolean;
}

// 📱 반응형 설정 타입
export interface ResponsiveConfig {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
}

// 🎛️ 메인 컴포넌트 Props 타입
export interface ImageGalleryWithContentProps {
  images: ImageData[];
  rightContent?: ContentAreaData;
  galleryConfig?: GalleryConfig;
  zoomConfig?: ZoomConfig;
  responsiveConfig?: ResponsiveConfig;
  className?: string;
  onImageChange?: (currentImageIndex: number, imageData: ImageData) => void;
  onZoomStateChange?: (isZooming: boolean) => void;
}

// 🖱️ 마우스/터치 위치 타입
export interface PointerPosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

// 📏 이미지 영역 정보 타입
export interface ImageBounds {
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// 🔍 줌 상태 타입
export interface ZoomState {
  isActive: boolean;
  maskPosition: PointerPosition;
  zoomAreaPosition: PointerPosition;
  currentScale: number;
  imageBounds: ImageBounds | null;
}

// 📱 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 🎨 갤러리 상태 타입
export interface GalleryState {
  currentImageIndex: number;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  totalImages: number;
  isInitialized: boolean;
}

// 🎯 이벤트 핸들러 타입들
export interface GalleryEventHandlers {
  handleImageChange: (newIndex: number) => void;
  handleMouseEnterImage: (event: MouseEvent) => void;
  handleMouseLeaveImage: () => void;
  handleMouseMoveOnImage: (event: MouseEvent) => void;
  handleTouchStartOnImage: (event: TouchEvent) => void;
  handleTouchMoveOnImage: (event: TouchEvent) => void;
  handleTouchEndOnImage: () => void;
}

// 🏷️ 컴포넌트별 Props 타입들
export interface MainSliderProps {
  images: ImageData[];
  currentImageIndex: number;
  galleryConfig: GalleryConfig;
  onImageChange: (index: number) => void;
  onImageHover: (event: MouseEvent) => void;
  onImageLeave: () => void;
  onTouchInteraction: (
    event: TouchEvent,
    type: 'start' | 'move' | 'end'
  ) => void;
  className?: string;
}

export interface ThumbnailSliderProps {
  images: ImageData[];
  currentImageIndex: number;
  onThumbnailClick: (index: number) => void;
  spaceBetween?: number;
  className?: string;
}

export interface ContentAreaProps {
  contentData?: ContentAreaData;
  isZoomActive: boolean;
  deviceType: DeviceType;
  className?: string;
}

export interface ZoomViewerProps {
  isActive: boolean;
  currentImage: ImageData;
  zoomState: ZoomState;
  zoomConfig: ZoomConfig;
  deviceType: DeviceType;
  className?: string;
}

// 🔧 디버깅 정보 타입
export interface DebugInfo {
  componentName: string;
  currentImageIndex: number;
  deviceType: DeviceType;
  isZoomActive: boolean;
  timestamp: string;
  additionalData?: Record<string, unknown>;
}
