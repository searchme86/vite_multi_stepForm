// blogMediaStep/imageGallery/parts/gallery/ImageCardList.tsx - ImageGallery 컴포넌트

import React from 'react';
import { Card, CardBody, Checkbox, Button, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';
import { ImageFileInfo } from '../../utils/galleryUtils';

interface ImageCardListProps {
  displayFiles: Array<ImageFileInfo & { index: number }>;
  selectedFiles: number[];
  mainImage: string | null;
  sliderImages: string[];
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  onSelectFile: (index: number) => void;
  onOpenModal: (imageUrl: string, imageName: string) => void;
  onSetMainImage: (index: number) => void;
  onCancelMainImage: () => void;
  onToggleSlider: (imageUrl: string) => void;
  onRemoveMedia: (index: number) => void;
  formatFileSize: (size: number) => string;
}

function ImageCardList({
  displayFiles,
  selectedFiles,
  mainImage,
  sliderImages,
  uploading,
  uploadStatus,
  onSelectFile,
  onOpenModal,
  onSetMainImage,
  onCancelMainImage,
  onToggleSlider,
  onRemoveMedia,
  formatFileSize,
}: ImageCardListProps): React.ReactNode {
  console.log('🔧 ImageCardList 렌더링:', {
    displayFilesCount: displayFiles.length,
    selectedCount: selectedFiles.length,
    hasMainImage: !!mainImage,
  });

  const tooltipTexts = {
    mainImage: '메인 이미지로 설정',
    cancelMainImage: '메인 이미지 해제',
    slider: '슬라이더에 추가/제거',
    delete: '이미지 삭제',
  };

  return (
    <div className="space-y-3 md:hidden">
      {displayFiles.map((fileItem) => {
        const { url: file, index, name, size } = fileItem;
        const uploadProgress = Object.values(uploading)[0] || 100;
        const isUploaded =
          uploadStatus[name] === 'success' || uploadProgress === 100;
        const isMain = mainImage === file;
        const isSelected = selectedFiles.includes(index);

        console.log('🖼️ ImageCardList 카드 렌더링:', {
          index,
          name,
          isMain,
          isSelected,
          isUploaded,
        });

        return (
          <Card
            key={index}
            className={isMain ? 'border-primary-200 bg-primary-50' : ''}
          >
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={() => onSelectFile(index)}
                  className="flex-shrink-0"
                />

                <div className="relative flex-shrink-0 w-16 h-16 cursor-pointer group">
                  <div className="absolute z-10 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg -top-2 -left-2 bg-primary">
                    {index + 1}
                  </div>

                  <img
                    src={file}
                    alt={`업로드 이미지 ${index + 1}`}
                    className="object-cover w-full h-full rounded-md"
                    onClick={() => onOpenModal(file, name)}
                  />

                  <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-30 group-hover:opacity-100">
                    <Icon
                      icon="lucide:zoom-in"
                      className="text-sm text-white"
                    />
                  </div>

                  {isMain && (
                    <div className="absolute p-1 text-white rounded-full -top-1 -right-1 bg-primary">
                      <Icon icon="lucide:crown" className="text-xs" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-sm font-medium block max-w-[120px] truncate"
                      title={name}
                    >
                      {name}
                    </span>

                    <span className="text-xs text-default-500">
                      {formatFileSize(size)}
                    </span>
                  </div>

                  {!isUploaded ? (
                    <div className="mb-3">
                      <Progress
                        aria-label="업로드 중..."
                        value={uploadProgress}
                        size="sm"
                        color="primary"
                      />
                      <span className="text-xs text-default-500">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mb-3">
                      <Icon
                        icon="lucide:check-circle"
                        className="text-sm text-success"
                      />
                      <span className="text-sm text-success">완료</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {!isMain ? (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="default"
                        onPress={() => onSetMainImage(index)}
                        title={tooltipTexts.mainImage}
                        type="button"
                      >
                        <Icon icon="lucide:home" className="text-sm" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="primary"
                          className="cursor-default bg-primary-100"
                          title="현재 메인 이미지"
                          isDisabled
                          type="button"
                        >
                          <Icon icon="lucide:home" className="text-sm" />
                        </Button>

                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="warning"
                          onPress={onCancelMainImage}
                          title={tooltipTexts.cancelMainImage}
                          type="button"
                        >
                          <Icon icon="lucide:x" className="text-sm" />
                        </Button>
                      </div>
                    )}

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color={
                        sliderImages.includes(file) ? 'success' : 'default'
                      }
                      onPress={() => onToggleSlider(file)}
                      title={tooltipTexts.slider}
                      type="button"
                    >
                      <Icon
                        icon={
                          sliderImages.includes(file)
                            ? 'lucide:check'
                            : 'lucide:plus'
                        }
                        className="text-sm"
                      />
                    </Button>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onRemoveMedia(index)}
                      title={tooltipTexts.delete}
                      type="button"
                    >
                      <Icon icon="lucide:trash-2" className="text-sm" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export default ImageCardList;
