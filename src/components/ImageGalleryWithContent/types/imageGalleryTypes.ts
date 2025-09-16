// components/ImageGalleryWithContent/types/imageGalleryTypes.ts

import { ReactNode } from 'react';

// 🖼️ 이미지 데이터 타입
export interface ImageData {
  id: string;
  url: string;
  alt: string;
  title?: string;
  description?: string;
}

// 📝 제품 정보 타입
export interface ProductData {
  title?: string;
  description?: string;
  specifications?: SpecificationItem[];
  allergyInfo?: string;
  customContent?: ReactNode;
}

// 📊 스펙 정보 타입
export interface SpecificationItem {
  label: string;
  value: string | number;
  unit?: string;
  category: 'nutrition' | 'info' | 'custom';
}

// 🎛️ 메인 갤러리 Props
export interface ImageGallerySliderWithZoomProps {
  images: ImageData[];
  productInfo?: ProductData;
  className?: string;
  onImageChange?: (currentImageIndex: number, imageData: ImageData) => void;
}

// 🏷️ 컴포넌트 Props들
export interface SwiperImageGalleryProps {
  images: ImageData[];
  onImageChange: (index: number) => void;
  className?: string;
}

export interface ProductDetailsProps {
  productData?: ProductData;
  className?: string;
}
