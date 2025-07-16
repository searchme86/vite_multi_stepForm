// 📁 blogMediaStep/imageSlider/parts/SliderImageSelector.tsx

import React, { useMemo, useCallback } from 'react';
import { Card, CardBody, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';

// 🆕 슬라이더 상수 import
import { SLIDER_CONFIG } from '../../../../../../ImageGalleryWithContent/utils/sliderConstants';

// 🔧 강화된 타입 정의
interface SliderImageSelectorProps {
  readonly mediaFiles: string[];
  readonly mainImage: string | null;
  readonly localSliderImages: string[];
  readonly selectedSliderImages: number[];
  readonly onSliderImageSelect: (index: number) => void;
  readonly className?: string;
}

interface ImageAnalysisResult {
  readonly isMainImageSelected: boolean;
  readonly isCurrentlySelected: boolean;
  readonly isAlreadyInSlider: boolean;
  readonly isSelectableForSlider: boolean;
  readonly canCreateSlider: boolean;
}

interface ImageRenderingConfig {
  readonly cardClassName: string;
  readonly imageClassName: string;
  readonly overlayComponent: React.ReactNode;
  readonly bottomInfoComponent: React.ReactNode;
}

// 🔧 순수 함수들 - 타입 안전성 강화
const validateMainImageState = (
  mainImage: string | null
): { hasMainImage: boolean; validMainImage: string } => {
  const hasMainImage =
    mainImage !== null &&
    mainImage !== undefined &&
    typeof mainImage === 'string' &&
    mainImage.length > 0;

  const validMainImage = hasMainImage ? mainImage : '';

  console.log('🔍 [MAIN_IMAGE_VALIDATION] 메인 이미지 상태 검증:', {
    hasMainImage,
    validMainImage: validMainImage
      ? validMainImage.slice(0, 30) + '...'
      : 'none',
  });

  return { hasMainImage, validMainImage };
};

const validateSliderCapability = (
  mediaFiles: string[],
  mainImage: string | null
): { availableForSliderImages: string[]; canCreateSlider: boolean } => {
  const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];
  const { hasMainImage, validMainImage } = validateMainImageState(mainImage);

  const availableForSliderImages = safeMediaFiles.filter((imageUrl) => {
    if (!hasMainImage) {
      return true;
    }
    return imageUrl !== validMainImage;
  });

  const canCreateSlider =
    availableForSliderImages.length >= SLIDER_CONFIG.MIN_IMAGES;

  console.log('🔍 [SLIDER_CAPABILITY] 슬라이더 생성 가능성 검증:', {
    totalImages: safeMediaFiles.length,
    availableForSlider: availableForSliderImages.length,
    canCreateSlider,
    minimumRequired: SLIDER_CONFIG.MIN_IMAGES,
    mainImageUrl: validMainImage ? validMainImage.slice(0, 30) + '...' : 'none',
  });

  return { availableForSliderImages, canCreateSlider };
};

const analyzeImageState = (
  imageUrl: string,
  imageIndex: number,
  mainImage: string | null,
  localSliderImages: string[],
  selectedSliderImages: number[],
  canCreateSlider: boolean
): ImageAnalysisResult => {
  const { hasMainImage, validMainImage } = validateMainImageState(mainImage);
  const safeLocalSliderImages = Array.isArray(localSliderImages)
    ? localSliderImages
    : [];
  const safeSelectedSliderImages = Array.isArray(selectedSliderImages)
    ? selectedSliderImages
    : [];

  const isMainImageSelected = hasMainImage && imageUrl === validMainImage;
  const isCurrentlySelected = safeSelectedSliderImages.includes(imageIndex);
  const isAlreadyInSlider = safeLocalSliderImages.includes(imageUrl);
  const isSelectableForSlider =
    !isMainImageSelected && !isAlreadyInSlider && canCreateSlider;

  const analysisResult: ImageAnalysisResult = {
    isMainImageSelected,
    isCurrentlySelected,
    isAlreadyInSlider,
    isSelectableForSlider,
    canCreateSlider,
  };

  console.log('🔍 [IMAGE_ANALYSIS] 이미지 상태 분석:', {
    imageIndex,
    imageUrl: imageUrl.slice(0, 30) + '...',
    ...analysisResult,
  });

  return analysisResult;
};

const generateCardClassName = (analysis: ImageAnalysisResult): string => {
  const {
    isMainImageSelected,
    isCurrentlySelected,
    isAlreadyInSlider,
    canCreateSlider,
  } = analysis;

  const baseClasses =
    'relative group transition-all duration-300 w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48';

  if (isMainImageSelected) {
    console.log('🎨 [CARD_STYLE] 메인 이미지 카드 스타일 적용');
    return `${baseClasses} ring-4 ring-blue-500 cursor-not-allowed`;
  }

  if (isCurrentlySelected) {
    console.log('🎨 [CARD_STYLE] 현재 선택된 이미지 카드 스타일 적용');
    return `${baseClasses} ring-2 ring-primary`;
  }

  if (isAlreadyInSlider) {
    console.log(
      '🎨 [CARD_STYLE] 슬라이더에 이미 포함된 이미지 카드 스타일 적용'
    );
    return `${baseClasses} border-2 border-success`;
  }

  if (!canCreateSlider) {
    console.log('🎨 [CARD_STYLE] 슬라이더 생성 불가능 이미지 카드 스타일 적용');
    return `${baseClasses} opacity-60`;
  }

  console.log('🎨 [CARD_STYLE] 기본 선택 가능 이미지 카드 스타일 적용');
  return baseClasses;
};

const generateImageClassName = (analysis: ImageAnalysisResult): string => {
  const { isMainImageSelected } = analysis;

  if (isMainImageSelected) {
    console.log('🎨 [IMAGE_STYLE] 메인 이미지 블러 스타일 적용');
    return 'object-cover w-full h-full blur-sm opacity-50 transition-all duration-300 grayscale';
  }

  console.log('🎨 [IMAGE_STYLE] 기본 이미지 스타일 적용');
  return 'object-cover w-full h-full transition-all duration-300';
};

const generateOverlayComponent = (
  analysis: ImageAnalysisResult,
  imageIndex: number,
  onImageSelection: () => void
): React.ReactNode => {
  const {
    isMainImageSelected,
    isAlreadyInSlider,
    canCreateSlider,
    isCurrentlySelected,
  } = analysis;

  if (isMainImageSelected) {
    console.log('🎨 [OVERLAY] 메인 이미지 오버레이 생성');
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
        <div className="flex flex-col items-center gap-2 px-4 py-3 text-center bg-blue-600 rounded-lg shadow-xl">
          <Icon
            icon="lucide:home"
            className="w-5 h-5 text-white"
            aria-hidden="true"
          />
          <span className="text-sm font-bold text-white">메인 이미지</span>
          <span className="text-xs text-blue-100">선택 불가</span>
        </div>
      </div>
    );
  }

  if (isAlreadyInSlider) {
    console.log('🎨 [OVERLAY] 슬라이더에 포함된 이미지 체크 아이콘 생성');
    return (
      <div className="absolute top-2 right-2">
        <div className="flex items-center justify-center w-6 h-6 text-white rounded-full bg-success">
          <Icon icon="lucide:check" className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!canCreateSlider) {
    console.log('🎨 [OVERLAY] 최소 조건 미충족 잠금 오버레이 생성');
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white rounded bg-warning">
          <Icon icon="lucide:lock" className="w-3 h-3" aria-hidden="true" />
          <span>{SLIDER_CONFIG.MIN_IMAGES}개 필요</span>
        </div>
      </div>
    );
  }

  console.log('🎨 [OVERLAY] 선택 가능 이미지 체크박스 생성');
  return (
    <div className="absolute top-2 left-2">
      <Checkbox
        isSelected={isCurrentlySelected}
        onValueChange={onImageSelection}
        className="text-white"
        classNames={{
          wrapper: 'bg-black/30 border-white',
        }}
        aria-label={`이미지 ${imageIndex + 1} 슬라이더 선택 토글`}
      />
    </div>
  );
};

const generateBottomInfoComponent = (
  analysis: ImageAnalysisResult,
  imageIndex: number,
  canCreateSlider: boolean
): React.ReactNode => {
  const { isMainImageSelected, isAlreadyInSlider } = analysis;

  if (isMainImageSelected) {
    console.log('🎨 [BOTTOM_INFO] 메인 이미지는 하단 정보 숨김');
    return null;
  }

  console.log('🎨 [BOTTOM_INFO] 하단 정보 컴포넌트 생성');
  return (
    <div className="absolute bottom-2 left-2 right-2">
      <div className="px-2 py-1 text-xs text-white bg-black bg-opacity-50 rounded">
        이미지 {imageIndex + 1}
        {!canCreateSlider ? (
          <span className="block text-warning-300 text-[10px]">
            최소 {SLIDER_CONFIG.MIN_IMAGES}개 필요
          </span>
        ) : isAlreadyInSlider ? (
          <span className="block text-green-300 text-[10px]">
            슬라이더에 포함됨
          </span>
        ) : null}
      </div>
    </div>
  );
};

const generateImageRenderingConfig = (
  analysis: ImageAnalysisResult,
  imageIndex: number,
  onImageSelection: () => void
): ImageRenderingConfig => {
  const cardClassName = generateCardClassName(analysis);
  const imageClassName = generateImageClassName(analysis);
  const overlayComponent = generateOverlayComponent(
    analysis,
    imageIndex,
    onImageSelection
  );
  const bottomInfoComponent = generateBottomInfoComponent(
    analysis,
    imageIndex,
    analysis.canCreateSlider
  );

  console.log('🎨 [RENDERING_CONFIG] 이미지 렌더링 설정 생성 완료:', {
    imageIndex,
    hasOverlay: overlayComponent !== null,
    hasBottomInfo: bottomInfoComponent !== null,
  });

  return {
    cardClassName,
    imageClassName,
    overlayComponent,
    bottomInfoComponent,
  };
};

function SliderImageSelector({
  mediaFiles = [],
  mainImage = null,
  localSliderImages = [],
  selectedSliderImages = [],
  onSliderImageSelect,
  className = '',
}: SliderImageSelectorProps): React.ReactNode {
  console.log('🔧 [SLIDER_IMAGE_SELECTOR] 렌더링 시작 - 타입 안전성 강화:', {
    mediaCount: mediaFiles.length,
    selectedCount: selectedSliderImages.length,
    mainImageExists: mainImage !== null,
    mainImageUrl: mainImage ? mainImage.slice(0, 30) + '...' : 'none',
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 안전한 props 검증
  const safeMediaFiles = useMemo(() => {
    const validFiles = Array.isArray(mediaFiles) ? mediaFiles : [];
    console.log('🔍 [PROPS_VALIDATION] 미디어 파일 검증:', {
      originalCount: mediaFiles?.length || 0,
      validCount: validFiles.length,
    });
    return validFiles;
  }, [mediaFiles]);

  const safeLocalSliderImages = useMemo(() => {
    const validImages = Array.isArray(localSliderImages)
      ? localSliderImages
      : [];
    console.log('🔍 [PROPS_VALIDATION] 로컬 슬라이더 이미지 검증:', {
      originalCount: localSliderImages?.length || 0,
      validCount: validImages.length,
    });
    return validImages;
  }, [localSliderImages]);

  const safeSelectedSliderImages = useMemo(() => {
    const validSelections = Array.isArray(selectedSliderImages)
      ? selectedSliderImages
      : [];
    console.log('🔍 [PROPS_VALIDATION] 선택된 슬라이더 이미지 검증:', {
      originalCount: selectedSliderImages?.length || 0,
      validCount: validSelections.length,
    });
    return validSelections;
  }, [selectedSliderImages]);

  // 🔧 슬라이더 생성 가능성 검증
  const { availableForSliderImages, canCreateSlider } = useMemo(() => {
    return validateSliderCapability(safeMediaFiles, mainImage);
  }, [safeMediaFiles, mainImage]);

  // 🔧 이미지 선택 핸들러 - 메인 이미지 검증 포함
  const handleImageSelection = useCallback(
    (imageIndex: number) => {
      console.log('🔧 [IMAGE_SELECTION] 이미지 선택 시도:', {
        imageIndex,
        hasOnSliderImageSelect: typeof onSliderImageSelect === 'function',
      });

      if (typeof onSliderImageSelect !== 'function') {
        console.warn('⚠️ [IMAGE_SELECTION] onSliderImageSelect 함수가 없음');
        return;
      }

      const imageUrl = safeMediaFiles[imageIndex];
      if (!imageUrl) {
        console.warn('⚠️ [IMAGE_SELECTION] 유효하지 않은 이미지 인덱스:', {
          imageIndex,
        });
        return;
      }

      const analysis = analyzeImageState(
        imageUrl,
        imageIndex,
        mainImage,
        safeLocalSliderImages,
        safeSelectedSliderImages,
        canCreateSlider
      );

      if (analysis.isMainImageSelected) {
        console.log('❌ [IMAGE_SELECTION] 메인 이미지는 슬라이더 선택 불가:', {
          imageIndex,
          reason: 'main image cannot be selected for slider',
        });
        return;
      }

      if (!analysis.isSelectableForSlider) {
        console.log('❌ [IMAGE_SELECTION] 이미지 선택 불가:', {
          imageIndex,
          reason: !canCreateSlider
            ? 'minimum requirement not met'
            : 'other restriction',
        });
        return;
      }

      console.log('✅ [IMAGE_SELECTION] 이미지 선택 완료:', { imageIndex });
      onSliderImageSelect(imageIndex);
    },
    [
      safeMediaFiles,
      mainImage,
      safeLocalSliderImages,
      safeSelectedSliderImages,
      canCreateSlider,
      onSliderImageSelect,
    ]
  );

  // 🔧 빈 상태 처리
  if (safeMediaFiles.length === 0) {
    console.log('ℹ️ [EMPTY_STATE] 업로드된 이미지 없음');
    return (
      <div className={`p-4 text-center rounded-lg bg-default-100 ${className}`}>
        <Icon
          icon="lucide:layout-grid"
          className="w-10 h-10 mx-auto mb-2 text-default-400"
          aria-hidden="true"
        />
        <p className="text-default-600">
          이미지를 업로드하면 슬라이더를 구성할 수 있습니다.
        </p>
      </div>
    );
  }

  // 🔧 메인 렌더링 로직
  return (
    <div className={`w-full ${className}`}>
      {/* 🎯 가로 스크롤 컨테이너 */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <ul
          className="flex gap-4 pb-2 min-w-max"
          role="list"
          aria-label="슬라이더에 추가할 이미지 목록"
        >
          {safeMediaFiles.map((imageUrl, imageIndex) => {
            const analysis = analyzeImageState(
              imageUrl,
              imageIndex,
              mainImage,
              safeLocalSliderImages,
              safeSelectedSliderImages,
              canCreateSlider
            );

            const onImageSelection = () => handleImageSelection(imageIndex);
            const renderingConfig = generateImageRenderingConfig(
              analysis,
              imageIndex,
              onImageSelection
            );

            const {
              cardClassName,
              imageClassName,
              overlayComponent,
              bottomInfoComponent,
            } = renderingConfig;

            return (
              <li
                key={`image-${imageIndex}-${imageUrl.slice(0, 10)}`}
                className="flex-shrink-0"
                role="listitem"
              >
                <Card className={cardClassName}>
                  <CardBody className="p-0 aspect-square">
                    <img
                      src={imageUrl}
                      alt={`슬라이더 이미지 ${imageIndex + 1}`}
                      className={imageClassName}
                    />
                    {overlayComponent}
                    {bottomInfoComponent}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 🎯 스크롤 안내 */}
      {safeMediaFiles.length > 3 ? (
        <div className="flex items-center justify-center mt-2 text-xs text-default-500">
          <Icon
            icon="lucide:chevrons-right"
            className="w-4 h-4 mr-1"
            aria-hidden="true"
          />
          <span>좌우로 스크롤하여 더 많은 이미지를 확인하세요</span>
        </div>
      ) : null}

      {/* 🎯 슬라이더 최소 조건 상태 표시 */}
      {!canCreateSlider && safeMediaFiles.length > 0 ? (
        <div className="p-3 mt-3 border rounded-lg bg-warning-50 border-warning-200">
          <div className="flex items-center gap-2 text-sm text-warning-700">
            <Icon
              icon="lucide:info"
              className="w-4 h-4 text-warning-600"
              aria-hidden="true"
            />
            <span>
              슬라이더 생성을 위해 메인 이미지 외 최소{' '}
              {SLIDER_CONFIG.MIN_IMAGES}개의 이미지가 필요합니다.
              {mainImage ? (
                <> (현재 {availableForSliderImages.length}개 사용 가능)</>
              ) : (
                <> (현재 {safeMediaFiles.length}개 업로드됨)</>
              )}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SliderImageSelector;
