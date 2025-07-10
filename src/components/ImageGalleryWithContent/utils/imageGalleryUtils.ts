// components/ImageGalleryWithContent/utils/imageGalleryUtils.ts

import type {
  ImageData,
  ProductData,
  SpecificationItem,
} from '../types/imageGalleryTypes';

// 🎨 목업 이미지 데이터
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
export const mockProductSpecifications: SpecificationItem[] = [
  { label: '1회 제공량', value: 175, unit: 'kcal', category: 'nutrition' },
  { label: '나트륨', value: 70, unit: 'mg', category: 'nutrition' },
  { label: '포화지방', value: 12, unit: 'g', category: 'nutrition' },
  { label: '당류', value: 12, unit: 'g', category: 'nutrition' },
  { label: '단백질', value: 1, unit: 'g', category: 'nutrition' },
  { label: '카페인', value: 190, unit: 'mg', category: 'nutrition' },
  { label: '사이즈', value: 'Tall(톨)', unit: '355ml', category: 'info' },
];

// 📝 목업 제품 데이터
export const mockProductData: ProductData = {
  title: '블랙&화이트 콜드 브루',
  description:
    '리저브 콜드 브루와 하우스 메이드 바닐라 빈 크림이 어우러진 아인슈페너 음료',
  specifications: mockProductSpecifications,
  allergyInfo: '알레르기 유발요인 : 우유',
};

// 📊 스펙 값 포맷팅 함수
export function formatSpecificationValue(spec: SpecificationItem): string {
  const { value, unit } = spec;
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : String(value);
  return unit ? `${formattedValue}${unit}` : formattedValue;
}

// 🔍 이미지 URL 유효성 검사
export function isValidImageUrl(url: string): boolean {
  return (
    url.length > 0 &&
    (url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/') ||
      url.startsWith('./') ||
      url.startsWith('data:image/'))
  );
}
