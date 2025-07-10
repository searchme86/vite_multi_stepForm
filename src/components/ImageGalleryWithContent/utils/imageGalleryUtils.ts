// components/ImageGalleryWithContent/utils/imageGalleryUtils.ts

import type {
  ImageData,
  ContentAreaData,
  DeviceType,
  GalleryConfig,
  ZoomConfig,
  ResponsiveConfig,
  PointerPosition,
  ImageBounds,
  SpecificationItem,
} from '../types/imageGalleryTypes';

// 🎨 목업 이미지 데이터 (스타벅스 커피 상품)
export const mockCoffeeImages: ImageData[] = [
  {
    id: 'coffee_main_1',
    url: 'https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[9200000003276]_20210426091745467.jpg',
    alt: '블랙&화이트 콜드 브루 메인 이미지',
    title: '블랙&화이트 콜드 브루',
    description: '리저브 콜드 브루와 하우스 메이드 바닐라 빈 크림',
  },
  {
    id: 'coffee_detail_1',
    url: 'https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[9200000003276]_20210426091800030.jpg',
    alt: '블랙&화이트 콜드 브루 상세 이미지',
    title: '블랙&화이트 콜드 브루 디테일',
    description: '크림과 콜드브루의 완벽한 조화',
  },
  {
    id: 'coffee_ingredient_1',
    url: 'https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[9200000003276]_20210426091820155.jpg',
    alt: '블랙&화이트 콜드 브루 원료 이미지',
    title: '프리미엄 원료',
    description: '엄선된 원두로 만든 콜드브루',
  },
  {
    id: 'coffee_side_1',
    url: 'https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[9200000003276]_20210426091835702.jpg',
    alt: '블랙&화이트 콜드 브루 측면 이미지',
    title: '사이드 뷰',
    description: '측면에서 본 아름다운 층 구조',
  },
  {
    id: 'coffee_package_1',
    url: 'https://image.istarbucks.co.kr/upload/store/skuimg/2021/04/[9200000003276]_20210426091850233.jpg',
    alt: '블랙&화이트 콜드 브루 패키지',
    title: '패키지 디자인',
    description: '세련된 패키지 디자인',
  },
];

// 📊 목업 제품 스펙 데이터
export const mockProductSpecs: SpecificationItem[] = [
  { label: '1회 제공량', value: 175, unit: 'kcal', type: 'nutrition' },
  { label: '나트륨', value: 70, unit: 'mg', type: 'nutrition' },
  { label: '포화지방', value: 12, unit: 'g', type: 'nutrition' },
  { label: '당류', value: 12, unit: 'g', type: 'nutrition' },
  { label: '단백질', value: 1, unit: 'g', type: 'nutrition' },
  { label: '카페인', value: 190, unit: 'mg', type: 'nutrition' },
  { label: '제품 영양 정보', value: 'Tall(톨)', unit: '355ml', type: 'info' },
];

// 📝 목업 컨텐츠 데이터
export const mockContentData: ContentAreaData = {
  title: '블랙&화이트 콜드 브루',
  description:
    '리저브 콜드 브루와 하우스 메이드 바닐라 빈 크림이 어우러진 아인슈페너 음료',
  specs: mockProductSpecs,
  allergyInfo: '알레르기 유발요인 : 우유',
};

// 📱 반응형 브레이크포인트
export const defaultBreakpoints: ResponsiveConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
};

// ⚙️ 기본 갤러리 설정
export const defaultGalleryConfig: GalleryConfig = {
  speed: 300,
  allowLoop: true,
  touchEnabled: true,
  showNavigation: true,
  spaceBetween: 10,
  initialSlide: 0,
};

// 🔍 기본 줌 설정
export const defaultZoomConfig: ZoomConfig = {
  enableZoom: true,
  zoomScale: 5,
  maskSizeRatio: 0.2,
  touchZoomEnabled: true,
};

// 📱 디바이스 타입 감지 함수
export function detectDeviceType(windowWidth: number): DeviceType {
  const { mobileBreakpoint, tabletBreakpoint } = defaultBreakpoints;

  console.log('디바이스 타입 감지:', {
    windowWidth,
    mobileBreakpoint,
    tabletBreakpoint,
  });

  if (windowWidth < (mobileBreakpoint ?? 768)) {
    return 'mobile';
  }

  if (windowWidth < (tabletBreakpoint ?? 1024)) {
    return 'tablet';
  }

  return 'desktop';
}

// 🖱️ 마우스 위치를 이미지 상대 위치로 변환
export function getRelativePointerPosition(
  clientX: number,
  clientY: number,
  imageBounds: ImageBounds
): PointerPosition {
  const { left, top, width, height } = imageBounds;

  const relativeX = clientX - left;
  const relativeY = clientY - top;

  // 경계 처리
  const clampedX = Math.max(0, Math.min(relativeX, width));
  const clampedY = Math.max(0, Math.min(relativeY, height));

  console.log('상대 포인터 위치 계산:', {
    clientX,
    clientY,
    imageBounds,
    relativeX: clampedX,
    relativeY: clampedY,
  });

  return {
    x: clampedX,
    y: clampedY,
    clientX,
    clientY,
  };
}

// 🔍 줌 마스크 위치 계산
export function calculateZoomMaskPosition(
  pointerPosition: PointerPosition,
  imageBounds: ImageBounds,
  maskSizeRatio: number
): PointerPosition {
  const { width, height } = imageBounds;
  const maskWidth = width * maskSizeRatio;
  const maskHeight = width * maskSizeRatio; // 정사각형

  const halfMaskWidth = maskWidth / 2;
  const halfMaskHeight = maskHeight / 2;

  // 마스크 중심을 마우스 위치로 설정
  let maskX = pointerPosition.x - halfMaskWidth;
  let maskY = pointerPosition.y - halfMaskHeight;

  // 이미지 경계 내에서만 마스크 위치 제한
  maskX = Math.max(0, Math.min(maskX, width - maskWidth));
  maskY = Math.max(0, Math.min(maskY, height - maskHeight));

  console.log('줌 마스크 위치 계산:', {
    pointerPosition,
    maskSizeRatio,
    maskWidth,
    maskHeight,
    calculatedPosition: { x: maskX, y: maskY },
  });

  return {
    x: maskX,
    y: maskY,
    clientX: pointerPosition.clientX,
    clientY: pointerPosition.clientY,
  };
}

// 🎨 확대 이미지 배경 위치 계산
export function calculateZoomBackgroundPosition(
  maskPosition: PointerPosition,
  zoomScale: number,
  zoomViewerWidth: number,
  zoomViewerHeight: number
): { backgroundPositionX: number; backgroundPositionY: number } {
  const backgroundPositionX = -maskPosition.x * zoomScale;
  const backgroundPositionY = -maskPosition.y * zoomScale;

  console.log('확대 배경 위치 계산:', {
    maskPosition,
    zoomScale,
    zoomViewerWidth,
    zoomViewerHeight,
    backgroundPositionX,
    backgroundPositionY,
  });

  return {
    backgroundPositionX,
    backgroundPositionY,
  };
}

// 🎯 이미지 인덱스 정규화 (무한 루프 지원)
export function normalizeImageIndex(
  index: number,
  totalImages: number
): number {
  if (totalImages <= 0) {
    console.warn('이미지 개수가 0 이하입니다:', totalImages);
    return 0;
  }

  const normalizedIndex = ((index % totalImages) + totalImages) % totalImages;

  console.log('이미지 인덱스 정규화:', {
    originalIndex: index,
    totalImages,
    normalizedIndex,
  });

  return normalizedIndex;
}

// 🔧 디버그 정보 생성
export function createDebugInfo(
  componentName: string,
  additionalData?: Record<string, unknown>
): {
  componentName: string;
  timestamp: string;
  additionalData?: Record<string, unknown>;
} {
  const debugInfo = {
    componentName,
    timestamp: new Date().toISOString(),
    additionalData,
  };

  console.log('디버그 정보 생성:', debugInfo);

  return debugInfo;
}

// 🎨 이미지 로드 확인
export function validateImageUrl(url: string): boolean {
  const isValidUrl =
    url.length > 0 &&
    (url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/') ||
      url.startsWith('./'));

  console.log('이미지 URL 검증:', { url, isValid: isValidUrl });

  return isValidUrl;
}

// 📊 스펙 데이터 포맷팅
export function formatSpecificationValue(spec: SpecificationItem): string {
  const { value, unit } = spec;

  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : String(value);

  const result = unit ? `${formattedValue}${unit}` : formattedValue;

  console.log('스펙 값 포맷팅:', { spec, result });

  return result;
}
