// blogMediaStep/imageGallery/parts/viewBuilder/SelectedImagePreview.tsx

import React from 'react';
import { Button, ButtonGroup, Divider, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayoutItemSize } from '../../hooks/layout/useLayoutItemSize';
import { formatFileSize } from '../../utils/galleryUtils';

interface SelectedImageInfo {
  url: string;
  name: string;
  size: number;
  order: number;
}

interface SelectedImagePreviewProps {
  selectedImages: string[];
  previewLayout: 'grid' | 'masonry';
  showPreview: boolean;
  columns: number;
  onPreviewLayoutChange: (layout: 'grid' | 'masonry') => void;
  onClosePreview: () => void;
  onRemoveImage?: (imageUrl: string) => void;
}

function SelectedImagePreview({
  selectedImages,
  previewLayout,
  showPreview,
  columns,
  onPreviewLayoutChange,
  onClosePreview,
  onRemoveImage,
}: SelectedImagePreviewProps): React.ReactNode {
  console.log('🔧 SelectedImagePreview 렌더링:', {
    selectedCount: selectedImages.length,
    previewLayout,
    showPreview,
    columns,
  });

  const layoutItemSize = useLayoutItemSize();

  // Early return: 미리보기가 비활성화된 경우
  if (!showPreview) {
    console.log('📋 SelectedImagePreview 미리보기 비활성화');
    return null;
  }

  // Early return: 선택된 이미지가 없는 경우
  if (selectedImages.length === 0) {
    console.log('📋 SelectedImagePreview 선택된 이미지 없음');
    return null;
  }

  const extractImageName = (imageUrl: string, imageIndex: number): string => {
    console.log('🔧 extractImageName 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
      imageIndex,
    });

    try {
      const urlSegments = imageUrl.split('/');
      const lastSegment = urlSegments[urlSegments.length - 1];

      const fileName =
        lastSegment && lastSegment.includes('.')
          ? decodeURIComponent(lastSegment)
          : `이미지_${imageIndex + 1}.jpg`;

      console.log('✅ extractImageName 결과:', { fileName });
      return fileName;
    } catch (extractionError) {
      console.warn('⚠️ 이미지명 추출 실패:', extractionError);
      const fallbackName = `이미지_${imageIndex + 1}.jpg`;
      console.log('✅ extractImageName 기본값 사용:', { fallbackName });
      return fallbackName;
    }
  };

  const calculateImageSize = (imageUrl: string): number => {
    console.log('🔧 calculateImageSize 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
    });

    const hashValue = imageUrl.split('').reduce((accumulator, character) => {
      accumulator = (accumulator << 5) - accumulator + character.charCodeAt(0);
      return accumulator & accumulator;
    }, 0);

    const estimatedSize = Math.abs(hashValue % 5000000) + 500000;

    console.log('✅ calculateImageSize 결과:', { estimatedSize });
    return estimatedSize;
  };

  const createSelectedImageInfoList = (): SelectedImageInfo[] => {
    console.log('🔧 createSelectedImageInfoList 호출');

    const imageInfoList = selectedImages.map((imageUrl, imageIndex) => {
      const imageInfo: SelectedImageInfo = {
        url: imageUrl,
        name: extractImageName(imageUrl, imageIndex),
        size: calculateImageSize(imageUrl),
        order: imageIndex + 1,
      };

      return imageInfo;
    });

    console.log('✅ createSelectedImageInfoList 결과:', {
      totalCount: imageInfoList.length,
    });

    return imageInfoList;
  };

  const handleLayoutChange = (targetLayout: 'grid' | 'masonry') => {
    console.log('🔧 handleLayoutChange 호출:', { targetLayout });

    onPreviewLayoutChange(targetLayout);

    console.log('✅ handleLayoutChange 완료:', { targetLayout });
  };

  const handleClosePreview = () => {
    console.log('🔧 handleClosePreview 호출');

    onClosePreview();

    console.log('✅ handleClosePreview 완료');
  };

  const handleRemoveImageFromPreview = (imageUrl: string) => {
    console.log('🔧 handleRemoveImageFromPreview 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
    });

    const removeFunction = onRemoveImage;
    if (removeFunction) {
      removeFunction(imageUrl);
    } else {
      console.log('⚠️ onRemoveImage 함수가 제공되지 않음');
    }

    console.log('✅ handleRemoveImageFromPreview 완료');
  };

  const handleKeyboardInteraction = (
    keyboardEvent: React.KeyboardEvent,
    actionType: 'close' | 'layout' | 'remove',
    actionParameter?: string | 'grid' | 'masonry'
  ) => {
    console.log('🔧 handleKeyboardInteraction 호출:', {
      actionType,
      actionParameter,
    });

    const { key: pressedKey } = keyboardEvent;

    const isActivationKey = pressedKey === 'Enter' || pressedKey === ' ';
    if (!isActivationKey) {
      return;
    }

    keyboardEvent.preventDefault();

    switch (actionType) {
      case 'close':
        handleClosePreview();
        break;
      case 'layout':
        const layoutParameter = actionParameter as 'grid' | 'masonry';
        if (layoutParameter) {
          handleLayoutChange(layoutParameter);
        }
        break;
      case 'remove':
        const imageUrlParameter = actionParameter as string;
        if (imageUrlParameter) {
          handleRemoveImageFromPreview(imageUrlParameter);
        }
        break;
      default:
        console.log('⚠️ 알 수 없는 액션 타입:', actionType);
    }

    console.log('✅ handleKeyboardInteraction 완료');
  };

  const animationContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 },
    },
  };

  const animationItemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  const selectedImageInfoList = createSelectedImageInfoList();
  const totalSelectedCount = selectedImageInfoList.length;
  const layoutDisplayName =
    previewLayout === 'grid' ? '균등 그리드' : '매스너리';

  console.log('📊 SelectedImagePreview 상태:', {
    totalSelectedCount,
    layoutDisplayName,
    showPreview,
  });

  return (
    <AnimatePresence>
      <motion.div
        variants={animationContainerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="mt-6"
      >
        <Card className="shadow-sm bg-default-50">
          <CardBody className="p-6">
            <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <h3
                  className="text-lg font-semibold text-default-900"
                  role="heading"
                  aria-level={3}
                >
                  선택된 이미지 미리보기
                </h3>
                <p className="text-sm text-default-600" role="text">
                  {totalSelectedCount}개 이미지가 선택되었습니다. 레이아웃을
                  변경하거나 개별 이미지를 제거할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonGroup
                  size="sm"
                  role="radiogroup"
                  aria-label="미리보기 레이아웃 선택"
                >
                  <Button
                    variant={previewLayout === 'grid' ? 'solid' : 'flat'}
                    color={previewLayout === 'grid' ? 'primary' : 'default'}
                    startContent={
                      <Icon
                        icon="lucide:layout-grid"
                        className="text-sm"
                        aria-hidden="true"
                      />
                    }
                    onPress={() => handleLayoutChange('grid')}
                    type="button"
                    aria-label="그리드 레이아웃으로 미리보기"
                    aria-pressed={previewLayout === 'grid'}
                    role="radio"
                    onKeyDown={(keyboardEvent) =>
                      handleKeyboardInteraction(keyboardEvent, 'layout', 'grid')
                    }
                  >
                    그리드
                  </Button>
                  <Button
                    variant={previewLayout === 'masonry' ? 'solid' : 'flat'}
                    color={
                      previewLayout === 'masonry' ? 'secondary' : 'default'
                    }
                    startContent={
                      <Icon
                        icon="lucide:layout-dashboard"
                        className="text-sm"
                        aria-hidden="true"
                      />
                    }
                    onPress={() => handleLayoutChange('masonry')}
                    type="button"
                    aria-label="매스너리 레이아웃으로 미리보기"
                    aria-pressed={previewLayout === 'masonry'}
                    role="radio"
                    onKeyDown={(keyboardEvent) =>
                      handleKeyboardInteraction(
                        keyboardEvent,
                        'layout',
                        'masonry'
                      )
                    }
                  >
                    매스너리
                  </Button>
                </ButtonGroup>

                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  startContent={
                    <Icon
                      icon="lucide:x"
                      className="text-sm"
                      aria-hidden="true"
                    />
                  }
                  onPress={handleClosePreview}
                  type="button"
                  aria-label="미리보기 닫기"
                  onKeyDown={(keyboardEvent) =>
                    handleKeyboardInteraction(keyboardEvent, 'close')
                  }
                >
                  미리보기 닫기
                </Button>
              </div>
            </header>

            <Divider className="mb-6" />

            <main
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridAutoRows: '160px',
              }}
              role="grid"
              aria-label={`선택된 이미지 ${layoutDisplayName} 미리보기`}
              aria-rowcount={Math.ceil(totalSelectedCount / columns)}
              aria-colcount={columns}
            >
              <AnimatePresence>
                {selectedImageInfoList.map((imageInfo, imageIndex) => {
                  const {
                    url: imageUrl,
                    name: imageName,
                    size: imageSize,
                    order: imageOrder,
                  } = imageInfo;

                  const itemStyles = layoutItemSize.getItemStyles(
                    imageIndex,
                    previewLayout,
                    columns
                  );

                  const gridRowIndex = Math.floor(imageIndex / columns) + 1;
                  const gridColIndex = (imageIndex % columns) + 1;

                  console.log('🖼️ SelectedImagePreview 이미지 아이템:', {
                    imageIndex,
                    imageName,
                    imageOrder,
                    itemStyles,
                  });

                  return (
                    <motion.div
                      key={imageUrl}
                      layout
                      variants={animationItemVariants}
                      className="relative group"
                      style={{
                        gridColumn: itemStyles.gridColumn,
                        gridRow: itemStyles.gridRow,
                        minHeight: '160px',
                      }}
                      role="gridcell"
                      aria-rowindex={gridRowIndex}
                      aria-colindex={gridColIndex}
                      aria-label={`${imageName}, 순서: ${imageOrder}번째, ${formatFileSize(
                        imageSize
                      )}`}
                    >
                      <div className="relative w-full h-full overflow-hidden transition-all duration-300 bg-white border-2 border-transparent rounded-lg shadow-sm hover:border-primary hover:shadow-md">
                        <img
                          src={imageUrl}
                          alt={`미리보기 이미지: ${imageName}`}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          draggable={false}
                        />

                        <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 group-hover:opacity-100" />

                        <div className="absolute top-2 left-2">
                          <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full shadow-lg bg-primary">
                            {imageOrder}
                          </div>
                        </div>

                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="solid"
                            color="danger"
                            isIconOnly
                            className="transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                            onPress={() =>
                              handleRemoveImageFromPreview(imageUrl)
                            }
                            type="button"
                            aria-label={`${imageName} 미리보기에서 제거`}
                            onKeyDown={(keyboardEvent) =>
                              handleKeyboardInteraction(
                                keyboardEvent,
                                'remove',
                                imageUrl
                              )
                            }
                          >
                            <Icon
                              icon="lucide:x"
                              className="text-sm"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                          <p
                            className="text-sm font-medium truncate"
                            title={imageName}
                          >
                            {imageName}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatFileSize(imageSize)} • 순서: {imageOrder}번째
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </main>

            <footer className="pt-4 mt-6 border-t border-default-200">
              <p
                className="text-sm text-center text-default-500"
                role="status"
                aria-live="polite"
              >
                총 {totalSelectedCount}개 이미지 • {layoutDisplayName} 레이아웃
                • {columns}열 구성
              </p>
            </footer>
          </CardBody>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default SelectedImagePreview;
