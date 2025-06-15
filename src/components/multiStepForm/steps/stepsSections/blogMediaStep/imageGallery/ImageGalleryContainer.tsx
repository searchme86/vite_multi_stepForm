// src/components/multiStepForm/steps/stepsSections/blogMediaStep/imageGallery/ImageGalleryContainer.tsx

import { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  ButtonGroup,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

import AccordionField from '../../../../../accordion-field';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import { useToastStore } from '../../../../../../store/toast/toastStore';

interface ImageGalleryContainerProps {
  mediaFiles: string[];
  mainImage: string | null;
  sliderImages: string[];
}

interface ImageItem {
  url: string;
  index: number;
  name: string;
  size: number;
}

function ImageGalleryContainer({
  mediaFiles,
  mainImage,
  sliderImages,
}: ImageGalleryContainerProps) {
  const [currentViewType, setCurrentViewType] = useState<'grid' | 'masonry'>(
    'grid'
  );
  const [currentSortCriteria, setCurrentSortCriteria] = useState<
    'index' | 'name' | 'size'
  >('index');
  const [currentSortDirection, setCurrentSortDirection] = useState<
    'asc' | 'desc'
  >('asc');

  const imageViewConfig = useImageGalleryStore((state) =>
    state.getImageViewConfig()
  );
  const updateImageViewConfig = useImageGalleryStore(
    (state) => state.updateImageViewConfig
  );
  const addCustomGalleryView = useImageGalleryStore(
    (state) => state.addCustomGalleryView
  );
  const addToast = useToastStore((state) => state.addToast);

  const extractImageFileName = useCallback(
    (imageUrlString: string, fileIndex: number) => {
      try {
        const urlSegments = imageUrlString.split('/');
        const extractedFileName = urlSegments[urlSegments.length - 1];
        if (extractedFileName && extractedFileName.includes('.')) {
          return decodeURIComponent(extractedFileName);
        }
      } catch (decodingError) {
        console.warn('URL 디코딩 실패:', decodingError);
      }
      return `이미지_${fileIndex + 1}.jpg`;
    },
    []
  );

  const calculateImageFileSize = useCallback((imageUrlString: string) => {
    const urlHashValue = imageUrlString
      .split('')
      .reduce((accumulator, character) => {
        accumulator =
          (accumulator << 5) - accumulator + character.charCodeAt(0);
        return accumulator & accumulator;
      }, 0);
    return Math.abs(urlHashValue % 5000000) + 500000;
  }, []);

  const processedAndSortedImageList = useMemo(() => {
    const validatedMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];

    let processedImageList = validatedMediaFiles.map((imageUrl, fileIndex) => ({
      url: imageUrl,
      index: fileIndex,
      name: extractImageFileName(imageUrl, fileIndex),
      size: calculateImageFileSize(imageUrl),
    }));

    processedImageList = processedImageList.filter(
      (imageItem) =>
        (!mainImage || mainImage !== imageItem.url) &&
        !(Array.isArray(sliderImages) && sliderImages.includes(imageItem.url))
    );

    processedImageList.sort((firstImage, secondImage) => {
      let sortComparisonResult = 0;
      switch (currentSortCriteria) {
        case 'name':
          sortComparisonResult = firstImage.name.localeCompare(
            secondImage.name
          );
          break;
        case 'size':
          sortComparisonResult = firstImage.size - secondImage.size;
          break;
        case 'index':
        default:
          sortComparisonResult = firstImage.index - secondImage.index;
          break;
      }
      return currentSortDirection === 'asc'
        ? sortComparisonResult
        : -sortComparisonResult;
    });

    return processedImageList;
  }, [
    mediaFiles,
    currentSortCriteria,
    currentSortDirection,
    mainImage,
    sliderImages,
    extractImageFileName,
    calculateImageFileSize,
  ]);

  const safeImageViewConfiguration = useMemo(() => {
    return (
      imageViewConfig || {
        selectedImages: [],
        clickOrder: [],
        layout: {
          columns: 3,
          gridType: 'grid' as const,
        },
        filter: 'available' as const,
      }
    );
  }, [imageViewConfig]);

  const handleImageSelectionClick = useCallback(
    (selectedImageUrl: string) => {
      if (!updateImageViewConfig) return;

      const { selectedImages, clickOrder } = safeImageViewConfiguration;
      const isImageCurrentlySelected =
        selectedImages.includes(selectedImageUrl);

      if (isImageCurrentlySelected) {
        const imageIndexInSelection = selectedImages.indexOf(selectedImageUrl);
        const updatedSelectedImages = selectedImages.filter(
          (imageUrl: string) => imageUrl !== selectedImageUrl
        );
        const updatedClickOrder = clickOrder.filter(
          (_: number, filterIndex: number) =>
            filterIndex !== imageIndexInSelection
        );

        const adjustedClickOrderNumbers = updatedClickOrder.map(
          (orderNumber: number) =>
            orderNumber > imageIndexInSelection + 1
              ? orderNumber - 1
              : orderNumber
        );

        updateImageViewConfig({
          selectedImages: updatedSelectedImages,
          clickOrder: adjustedClickOrderNumbers,
        });
      } else {
        updateImageViewConfig({
          selectedImages: [...selectedImages, selectedImageUrl],
          clickOrder: [...clickOrder, selectedImages.length + 1],
        });
      }
    },
    [updateImageViewConfig, safeImageViewConfiguration]
  );

  const resetAllSelections = useCallback(() => {
    if (!updateImageViewConfig) return;

    updateImageViewConfig({
      selectedImages: [],
      clickOrder: [],
      layout: {
        columns: 3,
        gridType: 'grid' as const,
      },
      filter: 'available' as const,
    });

    setCurrentViewType('grid');
    setCurrentSortCriteria('index');
    setCurrentSortDirection('asc');

    addToast({
      title: '선택 초기화',
      description: '모든 설정이 초기 상태로 되돌아갔습니다.',
      color: 'success',
    });
  }, [updateImageViewConfig, addToast]);

  const updateGridColumnCount = useCallback(
    (gridColumnCount: number) => {
      if (!updateImageViewConfig) return;

      const { layout } = safeImageViewConfiguration;

      updateImageViewConfig({
        layout: {
          ...layout,
          columns: gridColumnCount,
        },
      });
    },
    [updateImageViewConfig, safeImageViewConfiguration]
  );

  const formatFileSizeDisplay = useCallback((fileSizeInBytes: number) => {
    if (fileSizeInBytes === 0) return '0 B';
    const bytesPerUnit = 1024;
    const sizeUnits = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(
      Math.log(fileSizeInBytes) / Math.log(bytesPerUnit)
    );
    return (
      parseFloat(
        (fileSizeInBytes / Math.pow(bytesPerUnit, unitIndex)).toFixed(1)
      ) +
      ' ' +
      sizeUnits[unitIndex]
    );
  }, []);

  const handleAddSelectedImagesToPreview = useCallback(() => {
    const { selectedImages } = safeImageViewConfiguration;

    if (selectedImages.length === 0) {
      addToast({
        title: '이미지를 선택해주세요',
        description: '미리보기에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const { clickOrder, layout } = safeImageViewConfiguration;
    const { columns } = layout;

    const newGalleryConfiguration = {
      id: Date.now().toString(),
      name: `갤러리 뷰 ${new Date().toLocaleTimeString()}`,
      selectedImages: [...selectedImages],
      clickOrder: [...clickOrder],
      layout: {
        columns,
        gridType: currentViewType as 'grid' | 'masonry',
      },
      createdAt: new Date(),
    };

    if (addCustomGalleryView) {
      addCustomGalleryView(newGalleryConfiguration);
    }

    const viewTypeDisplayText =
      currentViewType === 'grid' ? '균등 그리드' : '매스너리';

    addToast({
      title: '갤러리 뷰 추가 완료',
      description: `${selectedImages.length}개 이미지로 구성된 ${viewTypeDisplayText} 갤러리가 미리보기에 추가되었습니다.`,
      color: 'success',
    });

    resetAllSelections();
  }, [
    safeImageViewConfiguration,
    currentViewType,
    addCustomGalleryView,
    addToast,
    resetAllSelections,
  ]);

  const animationContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 },
    },
  };

  const animationItemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const masonryGridSizes = [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ];

  const calculateMasonryItemSize = useCallback((imageGridIndex: number) => {
    if (imageGridIndex % 6 === 0) return masonryGridSizes[3];
    if (imageGridIndex % 5 === 0) return masonryGridSizes[2];
    if (imageGridIndex % 3 === 0) return masonryGridSizes[1];
    return masonryGridSizes[0];
  }, []);

  const { selectedImages, layout } = safeImageViewConfiguration;
  const { columns: gridColumns } = layout;

  return (
    <AccordionField
      title="이미지 뷰 만들기"
      description="사용 가능한 이미지로 나만의 갤러리를 만들어보세요."
      defaultExpanded={true}
    >
      <div
        className="space-y-6"
        role="region"
        aria-labelledby="image-gallery-builder"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label="갤러리 작업 버튼"
            >
              <Button
                color="warning"
                size="sm"
                variant="flat"
                startContent={
                  <Icon
                    icon="lucide:refresh-cw"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                onPress={resetAllSelections}
                type="button"
                aria-label="모든 이미지 선택 초기화"
              >
                선택 초기화
              </Button>

              <Button
                color="primary"
                size="sm"
                variant="solid"
                startContent={
                  <Icon
                    icon="lucide:plus-circle"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                onPress={handleAddSelectedImagesToPreview}
                type="button"
                isDisabled={selectedImages.length === 0}
                aria-label={`선택된 ${selectedImages.length}개 이미지를 갤러리 뷰로 추가`}
                aria-describedby="selected-images-count"
              >
                해당 뷰로 추가
              </Button>
            </div>

            <div
              className="flex items-center gap-2"
              role="toolbar"
              aria-label="갤러리 설정 도구"
            >
              <ButtonGroup role="group" aria-label="레이아웃 타입 선택">
                <Button
                  size="sm"
                  variant={currentViewType === 'grid' ? 'solid' : 'flat'}
                  onPress={() => setCurrentViewType('grid')}
                  startContent={
                    <Icon
                      icon="lucide:layout-grid"
                      className="text-sm"
                      aria-hidden="true"
                    />
                  }
                  aria-label="균등 그리드 레이아웃"
                  aria-pressed={currentViewType === 'grid'}
                >
                  그리드
                </Button>
                <Button
                  size="sm"
                  variant={currentViewType === 'masonry' ? 'solid' : 'flat'}
                  onPress={() => setCurrentViewType('masonry')}
                  startContent={
                    <Icon
                      icon="lucide:layout-dashboard"
                      className="text-sm"
                      aria-hidden="true"
                    />
                  }
                  aria-label="매스너리 레이아웃"
                  aria-pressed={currentViewType === 'masonry'}
                >
                  매스너리
                </Button>
              </ButtonGroup>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={
                      <Icon
                        icon="lucide:arrow-up-down"
                        className="text-sm"
                        aria-hidden="true"
                      />
                    }
                    aria-label="이미지 정렬 방식 선택"
                  >
                    정렬
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="이미지 정렬 옵션" role="menu">
                  <DropdownItem
                    key="index-asc"
                    onPress={() => {
                      setCurrentSortCriteria('index');
                      setCurrentSortDirection('asc');
                    }}
                    role="menuitem"
                  >
                    업로드순
                  </DropdownItem>
                  <DropdownItem
                    key="name-asc"
                    onPress={() => {
                      setCurrentSortCriteria('name');
                      setCurrentSortDirection('asc');
                    }}
                    role="menuitem"
                  >
                    이름 (A-Z)
                  </DropdownItem>
                  <DropdownItem
                    key="name-desc"
                    onPress={() => {
                      setCurrentSortCriteria('name');
                      setCurrentSortDirection('desc');
                    }}
                    role="menuitem"
                  >
                    이름 (Z-A)
                  </DropdownItem>
                  <DropdownItem
                    key="size-desc"
                    onPress={() => {
                      setCurrentSortCriteria('size');
                      setCurrentSortDirection('desc');
                    }}
                    role="menuitem"
                  >
                    큰 파일순
                  </DropdownItem>
                  <DropdownItem
                    key="size-asc"
                    onPress={() => {
                      setCurrentSortCriteria('size');
                      setCurrentSortDirection('asc');
                    }}
                    role="menuitem"
                  >
                    작은 파일순
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={
                      <Icon
                        icon="lucide:grid-3x3"
                        className="text-sm"
                        aria-hidden="true"
                      />
                    }
                    aria-label={`현재 ${gridColumns}열 그리드, 열 개수 변경`}
                  >
                    {gridColumns}열
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="그리드 열 개수 선택" role="menu">
                  {[2, 3, 4, 5, 6].map((columnNumber) => (
                    <DropdownItem
                      key={columnNumber}
                      onPress={() => updateGridColumnCount(columnNumber)}
                      role="menuitem"
                      aria-label={`${columnNumber}열 그리드로 변경`}
                    >
                      {columnNumber}열
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-2 text-sm text-default-600"
            id="selected-images-count"
            aria-live="polite"
          >
            <span>
              사용 가능한 이미지 {processedAndSortedImageList.length}개
            </span>
            <Chip size="sm" variant="flat" color="secondary">
              {currentViewType === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
            </Chip>
            <Chip size="sm" variant="flat" color="primary">
              {gridColumns}열
            </Chip>
            {selectedImages.length > 0 && (
              <Chip size="sm" variant="flat" color="success">
                {selectedImages.length}개 선택됨
              </Chip>
            )}
          </div>
        </div>

        {processedAndSortedImageList.length > 0 ? (
          <motion.div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gridAutoRows: '120px',
            }}
            variants={animationContainerVariants}
            initial="hidden"
            animate="show"
            role="grid"
            aria-label="이미지 갤러리 그리드"
            aria-rowcount={Math.ceil(
              processedAndSortedImageList.length / gridColumns
            )}
            aria-colcount={gridColumns}
          >
            <AnimatePresence>
              {processedAndSortedImageList.map(
                (imageItem: ImageItem, imageGridIndex: number) => {
                  const {
                    url: imageUrl,
                    name: imageName,
                    size: imageSize,
                  } = imageItem;
                  const isImageSelected = selectedImages.includes(imageUrl);

                  const { colSpan: gridColumnSpan, rowSpan: gridRowSpan } =
                    currentViewType === 'masonry'
                      ? calculateMasonryItemSize(imageGridIndex)
                      : { colSpan: 1, rowSpan: 1 };

                  const gridRowIndex =
                    Math.floor(imageGridIndex / gridColumns) + 1;
                  const gridColIndex = (imageGridIndex % gridColumns) + 1;

                  return (
                    <motion.div
                      key={imageUrl}
                      layout
                      variants={animationItemVariants}
                      className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                        isImageSelected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : ''
                      }`}
                      style={{
                        gridColumn: `span ${
                          gridColumnSpan > gridColumns
                            ? gridColumns
                            : gridColumnSpan
                        }`,
                        gridRow: `span ${gridRowSpan}`,
                        minHeight: '120px',
                      }}
                      role="gridcell"
                      aria-rowindex={gridRowIndex}
                      aria-colindex={gridColIndex}
                      tabIndex={0}
                      aria-label={`${imageName}, ${formatFileSizeDisplay(
                        imageSize
                      )}, ${isImageSelected ? '선택됨' : '선택되지 않음'}`}
                      onClick={() => handleImageSelectionClick(imageUrl)}
                      onKeyDown={(keyboardEvent) => {
                        if (
                          keyboardEvent.key === 'Enter' ||
                          keyboardEvent.key === ' '
                        ) {
                          keyboardEvent.preventDefault();
                          handleImageSelectionClick(imageUrl);
                        }
                      }}
                    >
                      <div className="relative w-full h-full overflow-hidden rounded-lg bg-default-100">
                        <img
                          src={imageUrl}
                          alt={`갤러리 이미지: ${imageName}`}
                          className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                          loading="lazy"
                          draggable={false}
                        />

                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0 group-focus-visible:translate-y-0">
                          <p
                            className="text-xs font-medium truncate"
                            title={imageName}
                          >
                            {imageName}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatFileSizeDisplay(imageSize)}
                          </p>
                        </div>

                        {isImageSelected && (
                          <div className="absolute inset-0 bg-primary bg-opacity-20">
                            <div className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full top-2 right-2 bg-primary">
                              ✓
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div
            className="p-8 text-center rounded-lg bg-default-100"
            role="status"
          >
            <Icon
              icon="lucide:image-off"
              className="w-12 h-12 mx-auto mb-3 text-default-400"
              aria-hidden="true"
            />
            <p className="mb-3 text-default-600">
              사용 가능한 이미지가 없습니다.
            </p>
            <p className="text-sm text-default-500">
              메인 이미지나 슬라이더로 사용되지 않은 이미지만 선택할 수
              있습니다.
            </p>
          </div>
        )}
      </div>
    </AccordionField>
  );
}

export default ImageGalleryContainer;
