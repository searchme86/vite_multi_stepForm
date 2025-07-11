// blogMediaStep/imageSlider/parts/SliderImageSelector.tsx

import React from 'react';
import { Card, CardBody, Checkbox } from '@heroui/react';
import { Icon } from '@iconify/react';

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
  console.log('🔧 SliderImageSelector 렌더링:', {
    mediaCount: mediaFiles.length,
    selectedCount: selectedSliderImages.length,
    mainImageExists: mainImage !== null && mainImage !== undefined,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🎯 슬라이더 가능한 이미지 계산 (메인 이미지 제외)
  const availableForSliderImages = mediaFiles.filter((imageUrl) => {
    const isNotMainImage =
      mainImage !== null && mainImage !== undefined
        ? imageUrl !== mainImage
        : true;
    return isNotMainImage;
  });

  const canCreateSlider = availableForSliderImages.length >= 3;

  console.log('🎯 SliderImageSelector 조건 검증:', {
    totalImages: mediaFiles.length,
    availableForSlider: availableForSliderImages.length,
    canCreateSlider,
    minimumRequired: 3,
  });

  if (mediaFiles.length === 0) {
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
          {mediaFiles.map((imageUrl, imageIndex) => {
            const isMainImageSelected =
              mainImage !== null &&
              mainImage !== undefined &&
              mainImage === imageUrl;
            const isCurrentlySelected =
              selectedSliderImages.includes(imageIndex);
            const isAlreadyInSlider = localSliderImages.includes(imageUrl);
            const isSelectableForSlider =
              !isMainImageSelected && !isAlreadyInSlider && canCreateSlider;

            console.log('🎨 SliderImageSelector 이미지 상태:', {
              imageIndex,
              isMainImageSelected,
              isCurrentlySelected,
              isAlreadyInSlider,
              isSelectableForSlider,
              canCreateSlider,
            });

            const handleImageSelection = () => {
              console.log('🔧 이미지 선택 시도:', {
                imageIndex,
                isSelectableForSlider,
                canCreateSlider,
              });

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

            return (
              <li
                key={`image-${imageIndex}-${imageUrl.slice(0, 10)}`}
                className="flex-shrink-0"
                role="listitem"
              >
                <Card
                  className={`relative group transition-all duration-300
                    w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48
                    ${
                      isMainImageSelected
                        ? 'opacity-50 ring-2 ring-primary'
                        : ''
                    }
                    ${isCurrentlySelected ? 'ring-2 ring-primary' : ''}
                    ${isAlreadyInSlider ? 'border-2 border-success' : ''}
                    ${!canCreateSlider ? 'opacity-60' : ''}
                  `}
                >
                  <CardBody className="p-0 aspect-square">
                    <img
                      src={imageUrl}
                      alt={`슬라이더 이미지 ${imageIndex + 1}`}
                      className="object-cover w-full h-full"
                    />

                    {isMainImageSelected ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs text-white rounded bg-primary">
                          <Icon
                            icon="lucide:home"
                            className="w-3 h-3"
                            aria-hidden="true"
                          />
                          <span>메인 이미지</span>
                        </div>
                      </div>
                    ) : null}

                    {isAlreadyInSlider ? (
                      <div className="absolute p-1 text-white rounded-full top-2 right-2 bg-success">
                        <Icon icon="lucide:check" className="w-3 h-3" />
                      </div>
                    ) : null}

                    {/* 🎯 수정: 슬라이더 최소 조건도 확인 */}
                    {!isMainImageSelected && !isAlreadyInSlider ? (
                      canCreateSlider ? (
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
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                          <div className="flex items-center gap-2 px-3 py-2 text-xs text-white rounded bg-warning">
                            <Icon
                              icon="lucide:lock"
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            <span>3개 필요</span>
                          </div>
                        </div>
                      )
                    ) : null}

                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="px-2 py-1 text-xs text-white bg-black bg-opacity-50 rounded">
                        이미지 {imageIndex + 1}
                        {!canCreateSlider ? (
                          <span className="block text-warning-300 text-[10px]">
                            최소 3개 필요
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 🎯 스크롤 안내 */}
      {mediaFiles.length > 3 ? (
        <div className="flex items-center justify-center mt-2 text-xs text-default-500">
          <Icon
            icon="lucide:chevrons-right"
            className="w-4 h-4 mr-1"
            aria-hidden="true"
          />
          <span>좌우로 스크롤하여 더 많은 이미지를 확인하세요</span>
        </div>
      ) : null}

      {/* 🎯 새로 추가: 슬라이더 최소 조건 상태 표시 */}
      {!canCreateSlider && mediaFiles.length > 0 ? (
        <div className="p-3 mt-3 border rounded-lg bg-warning-50 border-warning-200">
          <div className="flex items-center gap-2 text-sm text-warning-700">
            <Icon
              icon="lucide:info"
              className="w-4 h-4 text-warning-600"
              aria-hidden="true"
            />
            <span>
              슬라이더 생성을 위해 메인 이미지 외 최소 3개의 이미지가
              필요합니다.
              {mainImage !== null && mainImage !== undefined ? (
                <> (현재 {availableForSliderImages.length}개 사용 가능)</>
              ) : (
                <> (현재 {mediaFiles.length}개 업로드됨)</>
              )}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SliderImageSelector;
