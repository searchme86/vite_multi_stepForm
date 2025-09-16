// components/ImageGalleryWithContent/parts/ProductDetails.tsx

import { useCallback, useMemo } from 'react';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import type {
  ProductDetailsProps,
  SpecificationItem,
} from '../types/imageGalleryTypes';
import { formatSpecificationValue } from '../utils/imageGalleryUtils';

function ProductDetails({ productData, className = '' }: ProductDetailsProps) {
  // 구조분해할당 및 fallback 처리
  const {
    title = '',
    description = '',
    specifications = [],
    allergyInfo = '',
    customContent = null,
  } = productData || {};

  // Early return - 제품 데이터가 없는 경우
  if (!productData) {
    return (
      <section className={`flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="mb-4 text-6xl">📝</div>
          <p className="text-lg">제품 정보가 없습니다</p>
        </div>
      </section>
    );
  }

  // 스펙을 카테고리별로 분류
  const categorizedSpecifications = useMemo(() => {
    const nutritionSpecs: SpecificationItem[] = [];
    const infoSpecs: SpecificationItem[] = [];
    const customSpecs: SpecificationItem[] = [];

    specifications.forEach((spec) => {
      const { category } = spec;
      if (category === 'nutrition') {
        nutritionSpecs.push(spec);
      } else if (category === 'info') {
        infoSpecs.push(spec);
      } else {
        customSpecs.push(spec);
      }
    });

    return { nutritionSpecs, infoSpecs, customSpecs };
  }, [specifications]);

  // 스펙 항목 렌더링
  const renderSpecificationItem = useCallback(
    (spec: SpecificationItem, itemIndex: number) => {
      const { label } = spec;
      const formattedValue = formatSpecificationValue(spec);

      return (
        <div
          key={`spec-item-${itemIndex}-${label}`}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
        >
          <span className="font-medium text-gray-700">{label}</span>
          <span className="font-semibold text-gray-900">{formattedValue}</span>
        </div>
      );
    },
    []
  );

  // 스펙 섹션 렌더링
  const renderSpecificationSection = useCallback(
    (
      sectionTitle: string,
      specItems: SpecificationItem[],
      sectionKey: string
    ) => {
      if (specItems.length === 0) {
        return null;
      }

      return (
        <Card key={sectionKey} className="shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {sectionTitle}
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-0">
              {specItems.map((spec, itemIndex) =>
                renderSpecificationItem(spec, itemIndex)
              )}
            </div>
          </CardBody>
        </Card>
      );
    },
    [renderSpecificationItem]
  );

  // 즐겨찾기 버튼 핸들러
  const handleAddToFavorites = useCallback(() => {
    console.log('즐겨찾기 추가:', { productTitle: title });
    // 실제 즐겨찾기 로직 구현
  }, [title]);

  // 컨테이너 클래스
  const containerClassName = `
    w-full h-full p-4 lg:p-6
    bg-gray-50 overflow-y-auto
    ${className}
  `.trim();

  return (
    <section
      className={containerClassName}
      role="complementary"
      aria-label="제품 상세 정보"
    >
      <div className="space-y-6">
        {/* 제품 타이틀 */}
        {title && (
          <header>
            <h1 className="text-2xl font-bold leading-tight text-gray-900 lg:text-3xl">
              {title}
            </h1>
          </header>
        )}

        {/* 제품 설명 */}
        {description && (
          <section>
            <p className="text-base leading-relaxed text-gray-700 lg:text-lg">
              {description}
            </p>
          </section>
        )}

        {/* 영양 정보 */}
        {renderSpecificationSection(
          '제품 영양 정보',
          categorizedSpecifications.nutritionSpecs,
          'nutrition-section'
        )}

        {/* 일반 정보 */}
        {renderSpecificationSection(
          '제품 정보',
          categorizedSpecifications.infoSpecs,
          'info-section'
        )}

        {/* 사용자 정의 정보 */}
        {renderSpecificationSection(
          '추가 정보',
          categorizedSpecifications.customSpecs,
          'custom-section'
        )}

        {/* 알레르기 정보 */}
        {allergyInfo && (
          <>
            <Divider className="my-4" />
            <Card className="border border-yellow-200 shadow-sm bg-yellow-50">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-xl text-yellow-600">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-yellow-800">
                      알레르기 정보
                    </h3>
                    <p className="text-sm text-yellow-700">{allergyInfo}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {/* 사용자 정의 컨텐츠 */}
        {customContent && (
          <section>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              {customContent}
            </div>
          </section>
        )}

        {/* 즐겨찾기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button
            variant="bordered"
            color="primary"
            size="lg"
            onPress={handleAddToFavorites}
            className="min-w-[200px]"
            startContent={<span className="text-lg">♡</span>}
          >
            나만의 음료로 등록
          </Button>
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;
