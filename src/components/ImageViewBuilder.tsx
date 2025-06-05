import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Badge,
  ButtonGroup,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import AccordionField from './accordion-field';
import { useMultiStepForm } from './useMultiStepForm';

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
  const { imageViewConfig, setImageViewConfig, addToast } = useMultiStepForm();

  // ✅ 안전한 기본값 설정
  const safeImageViewConfig = useMemo(() => {
    return (
      imageViewConfig || {
        selectedImages: [],
        clickOrder: [],
        layout: {
          columns: 3,
          gridType: 'grid', // ✅ 추가: 그리드 타입
        },
        filter: 'available',
      }
    );
  }, [imageViewConfig]);

  // ✅ 새로 추가: 레이아웃 타입 상태
  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ✅ 매스너리를 위한 아이템 크기 정의 (GalleryView에서 가져옴)
  const itemSizes = [
    { colSpan: 1, rowSpan: 1 }, // Small square
    { colSpan: 1, rowSpan: 2 }, // Tall
    { colSpan: 2, rowSpan: 1 }, // Wide
    { colSpan: 2, rowSpan: 2 }, // Large square
  ];

  // ✅ 인덱스 기반 크기 할당 알고리즘 (GalleryView에서 가져옴)
  const getItemSize = useCallback((index: number) => {
    // Create a predictable pattern based on file index
    if (index % 6 === 0) return itemSizes[3]; // Large square
    if (index % 5 === 0) return itemSizes[2]; // Wide
    if (index % 3 === 0) return itemSizes[1]; // Tall
    return itemSizes[0]; // Small square
  }, []);

  // 파일명 매핑을 위한 더미 데이터
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

  // 파일 크기 시뮬레이션
  const getFileSize = useCallback((imageUrl: string) => {
    const hash = imageUrl.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 5000000) + 500000;
  }, []);

  // ✅ 필터링 및 정렬된 이미지 목록
  const filteredAndSortedImages = useMemo(() => {
    const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];

    let images = safeMediaFiles.map((img, index) => ({
      url: img,
      index,
      name: getFileName(img, index),
      size: getFileSize(img),
    }));

    // 사용 가능한 이미지만 필터링
    images = images.filter(
      (img) =>
        (!mainImage || mainImage !== img.url) &&
        !(Array.isArray(sliderImages) && sliderImages.includes(img.url))
    );

    // 정렬 적용
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

  // ✅ 핵심 기능: 이미지 클릭 핸들러
  const handleImageClick = useCallback(
    (imageUrl: string) => {
      if (mainImage === imageUrl) {
        addToast({
          title: '선택 불가',
          description: '이미 메인 이미지로 사용된 이미지입니다.',
          color: 'warning',
        });
        return;
      }

      if (Array.isArray(sliderImages) && sliderImages.includes(imageUrl)) {
        addToast({
          title: '선택 불가',
          description: '이미 슬라이더로 사용된 이미지입니다.',
          color: 'warning',
        });
        return;
      }

      if (!setImageViewConfig) return;

      setImageViewConfig((prev) => {
        const safePrev = prev || {
          selectedImages: [],
          clickOrder: [],
          layout: { columns: 3, gridType: 'grid' },
          filter: 'available',
        };

        const isAlreadySelected = safePrev.selectedImages.includes(imageUrl);

        if (isAlreadySelected) {
          const selectedIndex = safePrev.selectedImages.indexOf(imageUrl);
          const newSelectedImages = safePrev.selectedImages.filter(
            (img) => img !== imageUrl
          );
          const newClickOrder = safePrev.clickOrder.filter(
            (_, i) => i !== selectedIndex
          );

          const adjustedClickOrder = newClickOrder.map((order, i) =>
            order > selectedIndex + 1 ? order - 1 : order
          );

          return {
            ...safePrev,
            selectedImages: newSelectedImages,
            clickOrder: adjustedClickOrder,
          };
        } else {
          return {
            ...safePrev,
            selectedImages: [...safePrev.selectedImages, imageUrl],
            clickOrder: [
              ...safePrev.clickOrder,
              safePrev.selectedImages.length + 1,
            ],
          };
        }
      });
    },
    [mainImage, sliderImages, setImageViewConfig, addToast]
  );

  // ✅ 선택 초기화
  const resetSelection = useCallback(() => {
    if (!setImageViewConfig) return;

    setImageViewConfig((prev) => ({
      ...prev,
      selectedImages: [],
      clickOrder: [],
    }));

    addToast({
      title: '선택 초기화',
      description: '모든 이미지 선택이 초기화되었습니다.',
      color: 'success',
    });
  }, [setImageViewConfig, addToast]);

  // ✅ 열 개수 업데이트
  const updateColumns = useCallback(
    (columns: number) => {
      if (!setImageViewConfig) return;

      setImageViewConfig((prev) => {
        const safePrev = prev || safeImageViewConfig;
        return {
          ...safePrev,
          layout: {
            ...safePrev.layout,
            columns,
          },
        };
      });
    },
    [setImageViewConfig, safeImageViewConfig]
  );

  // 이미지 사용 상태 확인
  const getImageStatus = useCallback(
    (imageUrl: string) => {
      if (mainImage === imageUrl)
        return { type: 'main', label: '메인 이미지', color: 'danger' as const };
      if (Array.isArray(sliderImages) && sliderImages.includes(imageUrl))
        return {
          type: 'slider',
          label: '슬라이더',
          color: 'secondary' as const,
        };
      return null;
    },
    [mainImage, sliderImages]
  );

  // 선택된 이미지의 순서 번호 가져오기
  const getImageOrder = useCallback(
    (imageUrl: string) => {
      const index = safeImageViewConfig.selectedImages.indexOf(imageUrl);
      return index !== -1 ? safeImageViewConfig.clickOrder[index] : null;
    },
    [safeImageViewConfig.selectedImages, safeImageViewConfig.clickOrder]
  );

  // 파일 크기 포맷팅
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // 애니메이션 variants
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
      description={`사용 가능한 이미지로 나만의 갤러리를 만들어보세요. (${safeImageViewConfig.selectedImages.length}개 선택됨)`}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* ✅ 향상된 상단 컨트롤 */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              {safeImageViewConfig.selectedImages.length > 0 && (
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
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ 새로 추가: 레이아웃 타입 전환 (ButtonGroup) */}
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

              {/* 정렬 옵션 */}
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

              {/* 열 개수 선택 */}
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

          {/* 통계 정보 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
            <span>사용 가능한 이미지 {filteredAndSortedImages.length}개</span>
            {safeImageViewConfig.selectedImages.length > 0 && (
              <Chip size="sm" variant="flat" color="success">
                {safeImageViewConfig.selectedImages.length}개 선택됨
              </Chip>
            )}
            <Chip size="sm" variant="flat" color="secondary">
              {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
            </Chip>
          </div>
        </div>

        {/* ✅ 매스너리 + 순서 선택이 가능한 이미지 그리드 */}
        {filteredAndSortedImages.length > 0 ? (
          <motion.div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${safeImageViewConfig.layout.columns}, 1fr)`,
              gridAutoRows: '120px', // ✅ 매스너리를 위한 기본 행 높이
            }}
            variants={container}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence>
              {filteredAndSortedImages.map((image, index) => {
                const imageStatus = getImageStatus(image.url);
                const orderNumber = getImageOrder(image.url);
                const isSelected = safeImageViewConfig.selectedImages.includes(
                  image.url
                );
                const isDisabled = !!imageStatus;

                // ✅ 핵심: 조건부 크기 적용 (매스너리 vs 일반 그리드)
                const { colSpan, rowSpan } =
                  view === 'masonry'
                    ? getItemSize(index) // 매스너리: 다양한 크기
                    : { colSpan: 1, rowSpan: 1 }; // 일반 그리드: 모두 동일 크기

                return (
                  <motion.div
                    key={image.url}
                    layout
                    variants={item}
                    className={`relative group cursor-pointer transition-all duration-200 ${
                      isDisabled ? 'opacity-60' : 'hover:scale-105'
                    } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
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
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        onClick={() =>
                          !isDisabled && handleImageClick(image.url)
                        }
                      />

                      {/* ✅ 선택 순서 번호 (이미지 중앙에 표시) */}
                      {orderNumber && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg border-4 border-white">
                            {orderNumber}
                          </div>
                        </div>
                      )}

                      {/* 사용 상태 표시 (상단) */}
                      {imageStatus && (
                        <div className="absolute top-2 left-2 right-2">
                          <Badge
                            content={imageStatus.label}
                            color={imageStatus.color}
                          >
                            <div className="w-full h-6" />
                          </Badge>
                        </div>
                      )}

                      {/* 파일 정보 (하단) */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-xs font-medium truncate">
                          {image.name}
                        </p>
                        <p className="text-xs opacity-80">
                          {formatFileSize(image.size)}
                        </p>
                      </div>

                      {/* 선택 가능 상태 오버레이 */}
                      {!isDisabled && !isSelected && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Icon
                              icon="lucide:plus"
                              className="text-white text-2xl"
                            />
                          </div>
                        </div>
                      )}

                      {/* 선택됨 오버레이 */}
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
            <p className="text-default-600 mb-3">
              사용 가능한 이미지가 없습니다.
            </p>
            <p className="text-sm text-default-500">
              메인 이미지나 슬라이더로 사용되지 않은 이미지만 선택할 수
              있습니다.
            </p>
          </div>
        )}

        {/* ✅ 선택된 이미지 미리보기 */}
        {safeImageViewConfig.selectedImages.length > 0 && (
          <Card className="bg-default-50">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Icon icon="lucide:eye" className="text-primary" />
                  선택된 이미지 미리보기
                </h4>
                <div className="flex items-center gap-2">
                  <Chip size="sm" color="primary" variant="flat">
                    {safeImageViewConfig.selectedImages.length}개
                  </Chip>
                  <Chip size="sm" color="secondary" variant="flat">
                    {safeImageViewConfig.layout.columns}열 그리드
                  </Chip>
                  <Chip size="sm" color="warning" variant="flat">
                    {view === 'grid' ? '균등' : '매스너리'}
                  </Chip>
                </div>
              </div>

              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(
                    safeImageViewConfig.layout.columns,
                    safeImageViewConfig.selectedImages.length
                  )}, 1fr)`,
                  gridAutoRows: '120px', // 미리보기에서도 매스너리 적용
                }}
              >
                <AnimatePresence>
                  {safeImageViewConfig.selectedImages.map((imageUrl, index) => {
                    // ✅ 미리보기에서도 매스너리 적용
                    const { colSpan, rowSpan } =
                      view === 'masonry'
                        ? getItemSize(index)
                        : { colSpan: 1, rowSpan: 1 };

                    return (
                      <motion.div
                        key={imageUrl}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                        style={{
                          gridColumn: `span ${
                            colSpan >
                            Math.min(
                              safeImageViewConfig.layout.columns,
                              safeImageViewConfig.selectedImages.length
                            )
                              ? Math.min(
                                  safeImageViewConfig.layout.columns,
                                  safeImageViewConfig.selectedImages.length
                                )
                              : colSpan
                          }`,
                          gridRow: `span ${rowSpan}`,
                          minHeight: '120px',
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`선택된 이미지 ${index + 1}`}
                          className="w-full h-full object-cover rounded-md border-2 border-transparent group-hover:border-primary transition-all"
                        />

                        {/* 순서 번호 */}
                        <div className="absolute top-1 left-1 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                          {safeImageViewConfig.clickOrder[index]}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <p className="text-xs text-default-500 mt-3 text-center">
                이 레이아웃이 미리보기에 적용됩니다 (
                {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'})
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </AccordionField>
  );
}

export default ImageViewBuilder;
