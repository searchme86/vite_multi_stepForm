// blogMediaStep/imageSlider/parts/SliderImageSelector.tsx

import React from 'react';
import { Card, CardBody, Checkbox, Icon } from '@heroui/react';

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
    <div className={`flex flex-wrap gap-4 ${className}`}>
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
          <Card
            key={index}
            className={`relative w-48 group ${isMain ? 'opacity-50' : ''} ${
              isSelected ? 'ring-2 ring-primary' : ''
            } ${isAlreadyInSlider ? 'border-2 border-success' : ''}`}
          >
            <CardBody className="p-0 aspect-square">
              <img
                src={file}
                alt={`슬라이더 이미지 ${index + 1}`}
                className="object-cover w-full h-full"
              />

              {isMain && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="px-2 py-1 text-xs text-white rounded bg-primary">
                    메인 이미지
                  </div>
                </div>
              )}

              {isAlreadyInSlider && (
                <div className="absolute p-1 text-white rounded-full top-2 right-2 bg-success">
                  <Icon icon="lucide:check" className="text-xs" />
                </div>
              )}

              {!isMain && !isAlreadyInSlider && (
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
              )}

              <div className="absolute bottom-2 left-2 right-2">
                <div className="px-2 py-1 text-xs text-white bg-black bg-opacity-50 rounded">
                  이미지 {index + 1}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export default SliderImageSelector;
