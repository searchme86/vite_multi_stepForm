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
  mediaFiles,
  mainImage,
  localSliderImages,
  selectedSliderImages,
  onSliderImageSelect,
  className = '',
}: SliderImageSelectorProps): React.ReactNode {
  console.log('🔧 SliderImageSelector 렌더링:', {
    mediaCount: mediaFiles.length,
    selectedCount: selectedSliderImages.length,
  });

  if (mediaFiles.length === 0) {
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
          {mediaFiles.map((file, index) => {
            const isMain = mainImage === file;
            const isSelected = selectedSliderImages.includes(index);
            const isAlreadyInSlider = localSliderImages.includes(file);

            console.log('🎨 SliderImageSelector 이미지 상태:', {
              index,
              isMain,
              isSelected,
              isAlreadyInSlider,
            });

            return (
              <li key={index} className="flex-shrink-0" role="listitem">
                <Card
                  className={`relative group transition-all duration-300
                    w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48
                    ${isMain ? 'opacity-50 ring-2 ring-primary' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${isAlreadyInSlider ? 'border-2 border-success' : ''}
                  `}
                >
                  <CardBody className="p-0 aspect-square">
                    <img
                      src={file}
                      alt={`슬라이더 이미지 ${index + 1}`}
                      className="object-cover w-full h-full"
                    />

                    {isMain ? (
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

                    {!isMain && !isAlreadyInSlider ? (
                      <div className="absolute top-2 left-2">
                        <Checkbox
                          isSelected={isSelected}
                          onValueChange={() => onSliderImageSelect(index)}
                          className="text-white"
                          classNames={{
                            wrapper: 'bg-black/30 border-white',
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="px-2 py-1 text-xs text-white bg-black bg-opacity-50 rounded">
                        이미지 {index + 1}
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
    </div>
  );
}

export default SliderImageSelector;
