// blogMediaStep/imageSlider/parts/SliderImageSelector.tsx

import React from 'react';
import { Card, CardBody, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';

// 🆕 슬라이더 상수 import
import { SLIDER_CONFIG } from '../../../../../../ImageGalleryWithContent/utils/sliderConstants';

interface SliderImageSelectorProps {
  mediaFiles: string[];
  mainImage: string | null;
  localSliderImages: string[];
  selectedSliderImages: number[];
  onSliderImageSelect: (index: number) => void;
  className?: string;
}

function SliderImageSelector({
  mediaFiles = [],
  mainImage = null,
  localSliderImages = [],
  selectedSliderImages = [],
  onSliderImageSelect,
  className = '',
}: SliderImageSelectorProps): React.ReactNode {
  console.log('🔧 SliderImageSelector 렌더링 - 레이어 중복 제거:', {
    mediaCount: mediaFiles.length,
    selectedCount: selectedSliderImages.length,
    mainImageExists: mainImage !== null && mainImage !== undefined,
    mainImageUrl: mainImage ? mainImage.slice(0, 30) + '...' : 'none',
    timestamp: new Date().toLocaleTimeString(),
  });

  const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];
  const safeLocalSliderImages = Array.isArray(localSliderImages)
    ? localSliderImages
    : [];
  const safeSelectedSliderImages = Array.isArray(selectedSliderImages)
    ? selectedSliderImages
    : [];

  // 🎯 슬라이더 가능한 이미지 계산 (메인 이미지 제외)
  const availableForSliderImages = safeMediaFiles.filter((imageUrl) => {
    const hasMainImage =
      mainImage !== null &&
      mainImage !== undefined &&
      typeof mainImage === 'string' &&
      mainImage.length > 0;

    if (!hasMainImage) {
      return true;
    }

    const isNotMainImage = imageUrl !== mainImage;
    return isNotMainImage;
  });

  const canCreateSlider =
    availableForSliderImages.length >= SLIDER_CONFIG.MIN_IMAGES;

  console.log('🎯 SliderImageSelector 메인이미지 제외 로직 확인:', {
    totalImages: safeMediaFiles.length,
    availableForSlider: availableForSliderImages.length,
    canCreateSlider,
    minimumRequired: SLIDER_CONFIG.MIN_IMAGES,
    mainImageUrl: mainImage ? mainImage.slice(0, 30) + '...' : 'none',
    hasMainImage: mainImage !== null && mainImage !== undefined,
  });

  if (safeMediaFiles.length === 0) {
    console.log('⚠️ 업로드된 이미지 없음');
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
            // 🚨 핵심 수정: 메인 이미지 체크 로직 강화
            const hasMainImage =
              mainImage !== null &&
              mainImage !== undefined &&
              typeof mainImage === 'string' &&
              mainImage.length > 0;

            const isMainImageSelected = hasMainImage && imageUrl === mainImage;

            const isCurrentlySelected =
              safeSelectedSliderImages.includes(imageIndex);
            const isAlreadyInSlider = safeLocalSliderImages.includes(imageUrl);
            const isSelectableForSlider =
              !isMainImageSelected && !isAlreadyInSlider && canCreateSlider;

            console.log('🎨 SliderImageSelector 이미지 상태 분석:', {
              imageIndex,
              imageUrl: imageUrl.slice(0, 30) + '...',
              hasMainImage,
              mainImageUrl: mainImage ? mainImage.slice(0, 30) + '...' : 'none',
              isMainImageSelected,
              isCurrentlySelected,
              isAlreadyInSlider,
              isSelectableForSlider,
              canCreateSlider,
            });

            const handleImageSelection = () => {
              console.log('🔧 이미지 선택 시도 - 메인이미지 검증:', {
                imageIndex,
                isMainImageSelected,
                isSelectableForSlider,
                canCreateSlider,
              });

              // 🚨 메인 이미지는 선택 불가
              if (isMainImageSelected) {
                console.log('❌ 메인 이미지는 슬라이더 선택 불가:', {
                  imageIndex,
                  reason: 'main image cannot be selected for slider',
                });
                return;
              }

              const canSelect =
                isSelectableForSlider &&
                typeof onSliderImageSelect === 'function';

              if (canSelect) {
                onSliderImageSelect(imageIndex);
                console.log('✅ 이미지 선택 완료:', { imageIndex });
              } else {
                console.log('❌ 이미지 선택 불가:', {
                  imageIndex,
                  reason: !canCreateSlider
                    ? 'minimum requirement not met'
                    : 'other restriction',
                });
              }
            };

            // 🚨 중복 제거: 카드 스타일 단순화
            const getCardClassName = () => {
              const baseClasses =
                'relative group transition-all duration-300 w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48';

              if (isMainImageSelected) {
                return `${baseClasses} ring-4 ring-blue-500 cursor-not-allowed`;
              }

              if (isCurrentlySelected) {
                return `${baseClasses} ring-2 ring-primary`;
              }

              if (isAlreadyInSlider) {
                return `${baseClasses} border-2 border-success`;
              }

              if (!canCreateSlider) {
                return `${baseClasses} opacity-60`;
              }

              return baseClasses;
            };

            // 🚨 중복 제거: 이미지 스타일 단순화
            const getImageClassName = () => {
              if (isMainImageSelected) {
                return 'object-cover w-full h-full blur-sm opacity-50 transition-all duration-300 grayscale';
              }
              return 'object-cover w-full h-full transition-all duration-300';
            };

            return (
              <li
                key={`image-${imageIndex}-${imageUrl.slice(0, 10)}`}
                className="flex-shrink-0"
                role="listitem"
              >
                <Card className={getCardClassName()}>
                  <CardBody className="p-0 aspect-square">
                    {/* 🚨 단순화된 이미지 표시 */}
                    <img
                      src={imageUrl}
                      alt={`슬라이더 이미지 ${imageIndex + 1}`}
                      className={getImageClassName()}
                    />

                    {/* 🚨 중복 제거: 상태별 단일 오버레이 시스템 */}
                    {isMainImageSelected ? (
                      // 메인 이미지: 단일 통합 오버레이
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="flex flex-col items-center gap-2 px-4 py-3 text-center bg-blue-600 rounded-lg shadow-xl">
                          <Icon
                            icon="lucide:home"
                            className="w-5 h-5 text-white"
                            aria-hidden="true"
                          />
                          <span className="text-sm font-bold text-white">
                            메인 이미지
                          </span>
                          <span className="text-xs text-blue-100">
                            선택 불가
                          </span>
                        </div>
                      </div>
                    ) : isAlreadyInSlider ? (
                      // 슬라이더에 포함된 이미지: 단순 체크 아이콘
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center justify-center w-6 h-6 text-white rounded-full bg-success">
                          <Icon icon="lucide:check" className="w-4 h-4" />
                        </div>
                      </div>
                    ) : !canCreateSlider ? (
                      // 최소 조건 미충족: 잠금 오버레이
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white rounded bg-warning">
                          <Icon
                            icon="lucide:lock"
                            className="w-3 h-3"
                            aria-hidden="true"
                          />
                          <span>{SLIDER_CONFIG.MIN_IMAGES}개 필요</span>
                        </div>
                      </div>
                    ) : (
                      // 선택 가능한 이미지: 체크박스만
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          isSelected={isCurrentlySelected}
                          onValueChange={handleImageSelection}
                          className="text-white"
                          classNames={{
                            wrapper: 'bg-black/30 border-white',
                          }}
                          aria-label={`이미지 ${
                            imageIndex + 1
                          } 슬라이더 선택 토글`}
                        />
                      </div>
                    )}

                    {/* 🚨 중복 제거: 메인 이미지가 아닐 때만 하단 정보 표시 */}
                    {!isMainImageSelected ? (
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
                    ) : null}
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
              {mainImage !== null && mainImage !== undefined ? (
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
