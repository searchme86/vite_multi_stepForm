// components/ImageGalleryWithContent/parts/ContentArea.tsx

import { useCallback, useMemo } from 'react';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
import type {
  ContentAreaProps,
  SpecificationItem,
} from '../types/imageGalleryTypes';
import {
  formatSpecificationValue,
  createDebugInfo,
} from '../utils/imageGalleryUtils';

function ContentArea({
  contentData,
  isZoomActive,
  deviceType,
  className = '',
}: ContentAreaProps) {
  // 컨텐츠 데이터 구조분해할당 (fallback 제공)
  const {
    title = '',
    description = '',
    specs = [],
    customContent = null,
    allergyInfo = '',
  } = contentData || {};

  // Early return - 컨텐츠가 없는 경우
  if (!contentData) {
    return (
      <section
        className={`flex items-center justify-center p-6 ${className}`}
        aria-label="컨텐츠 정보"
      >
        <div className="text-center text-gray-500">
          <div className="mb-4 text-6xl">📝</div>
          <p className="text-lg">표시할 컨텐츠가 없습니다</p>
        </div>
      </section>
    );
  }

  // 줌 활성화 시 숨김 처리 (데스크탑에서만)
  const shouldHideContent = deviceType === 'desktop' && isZoomActive;

  // 컨테이너 클래스 생성
  const generateContainerClass = useCallback(() => {
    const baseClass = `
      relative w-full h-full transition-all duration-300
      ${className}
    `;

    const deviceSpecificClass =
      deviceType === 'mobile'
        ? 'p-4 bg-gray-50'
        : 'p-6 bg-gray-50 overflow-y-auto';

    const visibilityClass = shouldHideContent
      ? 'opacity-0 pointer-events-none'
      : 'opacity-100 pointer-events-auto';

    const finalClass =
      `${baseClass} ${deviceSpecificClass} ${visibilityClass}`.trim();

    console.log('컨텐츠 영역 클래스 생성:', {
      deviceType,
      isZoomActive,
      shouldHideContent,
      finalClass,
    });

    return finalClass;
  }, [className, deviceType, shouldHideContent]);

  // 스펙 항목들을 카테고리별로 그룹화
  const categorizedSpecs = useMemo(() => {
    const nutritionSpecs: SpecificationItem[] = [];
    const infoSpecs: SpecificationItem[] = [];
    const customSpecs: SpecificationItem[] = [];

    specs.forEach((spec) => {
      const { type } = spec;

      if (type === 'nutrition') {
        nutritionSpecs.push(spec);
      } else if (type === 'info') {
        infoSpecs.push(spec);
      } else {
        customSpecs.push(spec);
      }
    });

    console.log('스펙 카테고리화 완료:', {
      전체: specs.length,
      영양정보: nutritionSpecs.length,
      일반정보: infoSpecs.length,
      사용자정의: customSpecs.length,
    });

    return {
      nutritionSpecs,
      infoSpecs,
      customSpecs,
    };
  }, [specs]);

  // 스펙 항목 렌더링
  const renderSpecificationItem = useCallback(
    (spec: SpecificationItem, index: number) => {
      const { label, value, unit } = spec;
      const formattedValue = formatSpecificationValue(spec);

      return (
        <div
          key={`spec-${index}-${label}`}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
          role="row"
        >
          <span className="font-medium text-gray-700" role="rowheader">
            {label}
          </span>
          <span
            className="font-semibold text-gray-900"
            role="cell"
            title={unit ? `${value}${unit}` : String(value)}
          >
            {formattedValue}
          </span>
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
      sectionId: string
    ) => {
      // Early return - 스펙이 없는 경우
      if (specItems.length === 0) {
        return null;
      }

      return (
        <Card className="shadow-sm" aria-labelledby={`${sectionId}-title`}>
          <CardHeader className="pb-3">
            <h3
              id={`${sectionId}-title`}
              className="text-lg font-semibold text-gray-900"
            >
              {sectionTitle}
            </h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div role="table" aria-label={sectionTitle}>
              {specItems.map((spec, index) =>
                renderSpecificationItem(spec, index)
              )}
            </div>
          </CardBody>
        </Card>
      );
    },
    [renderSpecificationItem]
  );

  // 메인 타이틀 렌더링
  const renderMainTitle = useCallback(() => {
    return title ? (
      <header className="mb-6">
        <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
          {title}
        </h1>
      </header>
    ) : null;
  }, [title]);

  // 설명 렌더링
  const renderDescription = useCallback(() => {
    return description ? (
      <section className="mb-6" aria-labelledby="description-title">
        <h2 id="description-title" className="sr-only">
          제품 설명
        </h2>
        <p className="text-base leading-relaxed text-gray-700 md:text-lg">
          {description}
        </p>
      </section>
    ) : null;
  }, [description]);

  // 알레르기 정보 렌더링
  const renderAllergyInfo = useCallback(() => {
    return allergyInfo ? (
      <Card className="border border-yellow-200 shadow-sm bg-yellow-50">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 text-xl text-yellow-600"
              aria-hidden="true"
            >
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
    ) : null;
  }, [allergyInfo]);

  // 사용자 정의 컨텐츠 렌더링
  const renderCustomContent = useCallback(() => {
    return customContent ? (
      <section className="mt-6" aria-label="추가 컨텐츠">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          {customContent}
        </div>
      </section>
    ) : null;
  }, [customContent]);

  // 즐겨찾기 버튼 렌더링
  const renderFavoriteButton = useCallback(() => {
    const handleFavoriteClick = () => {
      console.log('즐겨찾기 버튼 클릭:', { title });
    };

    return (
      <div className="flex justify-center mt-6">
        <Button
          variant="bordered"
          color="primary"
          size="lg"
          onPress={handleFavoriteClick}
          className="min-w-[200px]"
          startContent={
            <span className="text-lg" aria-hidden="true">
              ♡
            </span>
          }
        >
          나만의 음료로 등록
        </Button>
      </div>
    );
  }, [title]);

  // 스펙 그룹화 디버그 정보
  console.log('ContentArea 렌더링:', {
    hasTitle: title.length > 0,
    hasDescription: description.length > 0,
    specsCount: specs.length,
    hasAllergyInfo: allergyInfo.length > 0,
    hasCustomContent: customContent !== null,
    deviceType,
    isZoomActive,
    shouldHideContent,
  });

  // 디버그 정보 생성
  createDebugInfo('ContentArea', {
    contentData: {
      hasTitle: title.length > 0,
      hasDescription: description.length > 0,
      specsCount: specs.length,
      hasAllergyInfo: allergyInfo.length > 0,
    },
    deviceType,
    isZoomActive,
    shouldHideContent,
  });

  return (
    <section
      className={generateContainerClass()}
      role="complementary"
      aria-label="제품 상세 정보"
      data-device-type={deviceType}
      data-zoom-active={isZoomActive}
    >
      {/* 메인 컨텐츠 영역 */}
      <div className="space-y-6">
        {/* 제품 타이틀 */}
        {renderMainTitle()}

        {/* 제품 설명 */}
        {renderDescription()}

        {/* 영양 정보 */}
        {renderSpecificationSection(
          '제품 영양 정보',
          categorizedSpecs.nutritionSpecs,
          'nutrition'
        )}

        {/* 일반 정보 */}
        {renderSpecificationSection(
          '제품 정보',
          categorizedSpecs.infoSpecs,
          'info'
        )}

        {/* 사용자 정의 스펙 */}
        {renderSpecificationSection(
          '추가 정보',
          categorizedSpecs.customSpecs,
          'custom'
        )}

        {/* 알레르기 정보 */}
        {allergyInfo && (
          <>
            <Divider className="my-4" />
            {renderAllergyInfo()}
          </>
        )}

        {/* 사용자 정의 컨텐츠 */}
        {renderCustomContent()}

        {/* 즐겨찾기 버튼 */}
        {renderFavoriteButton()}
      </div>

      {/* 줌 활성화 시 안내 메시지 (데스크탑 전용) */}
      {deviceType === 'desktop' && isZoomActive && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90"
          role="status"
          aria-live="polite"
        >
          <div className="text-center text-gray-600">
            <div className="mb-2 text-4xl" aria-hidden="true">
              🔍
            </div>
            <p className="text-lg font-medium">이미지 확대 모드</p>
            <p className="text-sm">
              마우스를 이미지에서 벗어나면 정보가 다시 표시됩니다
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ContentArea;
