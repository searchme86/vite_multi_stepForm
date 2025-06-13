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

import AccordionField from '../../accordion-field';
// import { useImageGalleryStore } from '../store/imageGallery/imageGalleryStore';
import { useImageGalleryStore } from '../../../store/imageGallery/imageGalleryStore';
// import { useToastStore } from '../store/toast/toastStore';
import { useToastStore } from '../../../store/toast/toastStore';

interface ImageViewBuilderProps {
  mediaFiles: string[];
  mainImage: string | null;
  sliderImages: string[];
}

function ImageViewBuilder({
  mediaFiles,
  mainImage,
  sliderImages,
}: ImageViewBuilderProps) {
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

  const safeImageViewConfig = useMemo(() => {
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

  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const itemSizes = [
    { colSpan: 1, rowSpan: 1 },
    { colSpan: 1, rowSpan: 2 },
    { colSpan: 2, rowSpan: 1 },
    { colSpan: 2, rowSpan: 2 },
  ];

  const getItemSize = useCallback((index: number) => {
    if (index % 6 === 0) return itemSizes[3];
    if (index % 5 === 0) return itemSizes[2];
    if (index % 3 === 0) return itemSizes[1];
    return itemSizes[0];
  }, []);

  const getFileName = useCallback((imageUrl: string, index: number) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName && fileName.includes('.')) {
        return decodeURIComponent(fileName);
      }
    } catch (e) {
      // URL 디코딩 실패 시 기본값 사용
    }
    return `이미지_${index + 1}.jpg`;
  }, []);

  const getFileSize = useCallback((imageUrl: string) => {
    const hash = imageUrl.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 5000000) + 500000;
  }, []);

  const filteredAndSortedImages = useMemo(() => {
    const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];

    let images = safeMediaFiles.map((img, index) => ({
      url: img,
      index,
      name: getFileName(img, index),
      size: getFileSize(img),
    }));

    images = images.filter(
      (img) =>
        (!mainImage || mainImage !== img.url) &&
        !(Array.isArray(sliderImages) && sliderImages.includes(img.url))
    );

    images.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'index':
        default:
          comparison = a.index - b.index;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return images;
  }, [
    mediaFiles,
    sortBy,
    sortOrder,
    mainImage,
    sliderImages,
    getFileName,
    getFileSize,
  ]);

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      if (!updateImageViewConfig) return;

      const currentConfig = safeImageViewConfig;
      const isAlreadySelected = currentConfig.selectedImages.includes(imageUrl);

      if (isAlreadySelected) {
        const selectedIndex = currentConfig.selectedImages.indexOf(imageUrl);
        const newSelectedImages = currentConfig.selectedImages.filter(
          (img: string) => img !== imageUrl
        );
        const newClickOrder = currentConfig.clickOrder.filter(
          (_: number, i: number) => i !== selectedIndex
        );

        const adjustedClickOrder = newClickOrder.map(
          (order: number, i: number) =>
            order > selectedIndex + 1 ? order - 1 : order
        );

        updateImageViewConfig({
          selectedImages: newSelectedImages,
          clickOrder: adjustedClickOrder,
        });
      } else {
        updateImageViewConfig({
          selectedImages: [...currentConfig.selectedImages, imageUrl],
          clickOrder: [
            ...currentConfig.clickOrder,
            currentConfig.selectedImages.length + 1,
          ],
        });
      }
    },
    [updateImageViewConfig, safeImageViewConfig]
  );

  const resetSelection = useCallback(() => {
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

    setView('grid');
    setSortBy('index');
    setSortOrder('asc');

    addToast({
      title: '선택 초기화',
      description: '모든 설정이 초기 상태로 되돌아갔습니다.',
      color: 'success',
    });
  }, [updateImageViewConfig, addToast]);

  const updateColumns = useCallback(
    (columns: number) => {
      if (!updateImageViewConfig) return;

      updateImageViewConfig({
        layout: {
          ...safeImageViewConfig.layout,
          columns,
        },
      });
    },
    [updateImageViewConfig, safeImageViewConfig]
  );

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const handleAddToPreview = useCallback(() => {
    if (safeImageViewConfig.selectedImages.length === 0) {
      addToast({
        title: '이미지를 선택해주세요',
        description: '미리보기에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const galleryConfig = {
      id: Date.now().toString(),
      name: `갤러리 뷰 ${new Date().toLocaleTimeString()}`,
      selectedImages: [...safeImageViewConfig.selectedImages],
      clickOrder: [...safeImageViewConfig.clickOrder],
      layout: {
        columns: safeImageViewConfig.layout.columns,
        gridType: view as 'grid' | 'masonry',
      },
      createdAt: new Date(),
    };

    if (addCustomGalleryView) {
      addCustomGalleryView(galleryConfig);
    }

    addToast({
      title: '갤러리 뷰 추가 완료',
      description: `${
        safeImageViewConfig.selectedImages.length
      }개 이미지로 구성된 ${
        view === 'grid' ? '균등 그리드' : '매스너리'
      } 갤러리가 미리보기에 추가되었습니다.`,
      color: 'success',
    });

    resetSelection();
  }, [
    safeImageViewConfig,
    view,
    addCustomGalleryView,
    addToast,
    resetSelection,
  ]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AccordionField
      title="이미지 뷰 만들기"
      description={`사용 가능한 이미지로 나만의 갤러리를 만들어보세요.`}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                color="warning"
                size="sm"
                variant="flat"
                startContent={
                  <Icon icon="lucide:refresh-cw" className="text-sm" />
                }
                onPress={resetSelection}
                type="button"
              >
                선택 초기화
              </Button>

              <Button
                color="primary"
                size="sm"
                variant="solid"
                startContent={
                  <Icon icon="lucide:plus-circle" className="text-sm" />
                }
                onPress={handleAddToPreview}
                type="button"
                isDisabled={safeImageViewConfig.selectedImages.length === 0}
              >
                해당 뷰로 추가
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ButtonGroup>
                <Button
                  size="sm"
                  variant={view === 'grid' ? 'solid' : 'flat'}
                  onPress={() => setView('grid')}
                  startContent={
                    <Icon icon="lucide:layout-grid" className="text-sm" />
                  }
                >
                  그리드
                </Button>
                <Button
                  size="sm"
                  variant={view === 'masonry' ? 'solid' : 'flat'}
                  onPress={() => setView('masonry')}
                  startContent={
                    <Icon icon="lucide:layout-dashboard" className="text-sm" />
                  }
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
                      <Icon icon="lucide:arrow-up-down" className="text-sm" />
                    }
                  >
                    정렬
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="정렬 옵션">
                  <DropdownItem
                    key="index-asc"
                    onPress={() => {
                      setSortBy('index');
                      setSortOrder('asc');
                    }}
                  >
                    업로드순
                  </DropdownItem>
                  <DropdownItem
                    key="name-asc"
                    onPress={() => {
                      setSortBy('name');
                      setSortOrder('asc');
                    }}
                  >
                    이름 (A-Z)
                  </DropdownItem>
                  <DropdownItem
                    key="name-desc"
                    onPress={() => {
                      setSortBy('name');
                      setSortOrder('desc');
                    }}
                  >
                    이름 (Z-A)
                  </DropdownItem>
                  <DropdownItem
                    key="size-desc"
                    onPress={() => {
                      setSortBy('size');
                      setSortOrder('desc');
                    }}
                  >
                    큰 파일순
                  </DropdownItem>
                  <DropdownItem
                    key="size-asc"
                    onPress={() => {
                      setSortBy('size');
                      setSortOrder('asc');
                    }}
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
                      <Icon icon="lucide:grid-3x3" className="text-sm" />
                    }
                  >
                    {safeImageViewConfig.layout.columns}열
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="열 개수 옵션">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <DropdownItem key={num} onPress={() => updateColumns(num)}>
                      {num}열
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
            <span>사용 가능한 이미지 {filteredAndSortedImages.length}개</span>
            <Chip size="sm" variant="flat" color="secondary">
              {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
            </Chip>
            <Chip size="sm" variant="flat" color="primary">
              {safeImageViewConfig.layout.columns}열
            </Chip>
          </div>
        </div>

        {filteredAndSortedImages.length > 0 ? (
          <motion.div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${safeImageViewConfig.layout.columns}, 1fr)`,
              gridAutoRows: '120px',
            }}
            variants={container}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {filteredAndSortedImages.map((image, index) => {
                const isSelected = safeImageViewConfig.selectedImages.includes(
                  image.url
                );

                const { colSpan, rowSpan } =
                  view === 'masonry'
                    ? getItemSize(index)
                    : { colSpan: 1, rowSpan: 1 };

                return (
                  <motion.div
                    key={image.url}
                    layout
                    variants={item}
                    className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    style={{
                      gridColumn: `span ${
                        colSpan > safeImageViewConfig.layout.columns
                          ? safeImageViewConfig.layout.columns
                          : colSpan
                      }`,
                      gridRow: `span ${rowSpan}`,
                      minHeight: '120px',
                    }}
                  >
                    <div className="relative w-full h-full overflow-hidden rounded-lg bg-default-100">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                        onClick={() => handleImageClick(image.url)}
                      />

                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                        <p className="text-xs font-medium truncate">
                          {image.name}
                        </p>
                        <p className="text-xs opacity-80">
                          {formatFileSize(image.size)}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute inset-0 bg-primary bg-opacity-20"></div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="p-8 text-center rounded-lg bg-default-100">
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

export default ImageViewBuilder;
