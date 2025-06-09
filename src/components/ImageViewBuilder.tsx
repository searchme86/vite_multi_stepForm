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
  const {
    imageViewConfig,
    setImageViewConfig,
    addToast,
    addCustomGalleryView,
  } = useMultiStepForm();

  // ✅ 안전한 기본값 설정
  const safeImageViewConfig = useMemo(() => {
    return (
      imageViewConfig || {
        selectedImages: [],
        clickOrder: [],
        layout: {
          columns: 3,
          gridType: 'grid',
        },
        filter: 'available',
      }
    );
  }, [imageViewConfig]);

  // ✅ 레이아웃 타입 상태
  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ✅ 매스너리를 위한 아이템 크기 정의
  const itemSizes = [
    { colSpan: 1, rowSpan: 1 }, // Small square
    { colSpan: 1, rowSpan: 2 }, // Tall
    { colSpan: 2, rowSpan: 1 }, // Wide
    { colSpan: 2, rowSpan: 2 }, // Large square
  ];

  // ✅ 인덱스 기반 크기 할당 알고리즘
  const getItemSize = useCallback((index: number) => {
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

  // ✅ 수정: 사용 중인 이미지는 아예 제외하고 필터링
  const filteredAndSortedImages = useMemo(() => {
    const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];

    let images = safeMediaFiles.map((img, index) => ({
      url: img,
      index,
      name: getFileName(img, index),
      size: getFileSize(img),
    }));

    // ✅ 핵심 수정: 메인 이미지나 슬라이더 이미지는 아예 보이지 않도록 완전 제외
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
    [setImageViewConfig]
  );

  //====여기부터 수정됨====
  // ✅ 수정: 선택 초기화 - 처음 렌더링 상태로 완전 복구
  // 이유: 모든 상태를 초기값으로 되돌려 처음 로드된 상태와 동일하게 만듦
  const resetSelection = useCallback(() => {
    if (!setImageViewConfig) return;

    // 모든 상태를 초기값으로 리셋
    setImageViewConfig({
      selectedImages: [],
      clickOrder: [],
      layout: {
        columns: 3,
        gridType: 'grid',
      },
      filter: 'available',
    });

    // 컴포넌트 내부 상태도 초기화
    setView('grid');
    setSortBy('index');
    setSortOrder('asc');

    addToast({
      title: '선택 초기화',
      description: '모든 설정이 초기 상태로 되돌아갔습니다.',
      color: 'success',
    });
  }, [setImageViewConfig, addToast]);
  //====여기까지 수정됨====

  // ✅ 수정: 열 개수 업데이트 (실제 그리드에 반영되도록)
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

  // 파일 크기 포맷팅
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  //====여기부터 수정됨====
  // ✅ 수정: "해당 뷰로 추가" 기능 - 현재 설정된 뷰 타입과 레이아웃 그대로 적용
  // 이유: 사용자가 설정한 그리드/매스너리, 열 개수 등을 그대로 유지하여 추가
  const handleAddToPreview = useCallback(() => {
    if (safeImageViewConfig.selectedImages.length === 0) {
      addToast({
        title: '이미지를 선택해주세요',
        description: '미리보기에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    // 현재 사용자가 설정한 모든 옵션을 그대로 적용
    const galleryConfig = {
      id: Date.now().toString(),
      selectedImages: [...safeImageViewConfig.selectedImages],
      clickOrder: [...safeImageViewConfig.clickOrder],
      layout: {
        columns: safeImageViewConfig.layout.columns, // 현재 설정된 열 개수
        gridType: view, // 현재 선택된 뷰 타입 (grid/masonry)
      },
      createdAt: new Date(),
    };

    // useMultiStepForm의 addCustomGalleryView 함수 호출
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

    // 선택 초기화 (처음 상태로 복구)
    resetSelection();
  }, [
    safeImageViewConfig,
    view,
    addCustomGalleryView,
    addToast,
    resetSelection,
  ]);
  //====여기까지 수정됨====

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
      description={`사용 가능한 이미지로 나만의 갤러리를 만들어보세요.`}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* ✅ 향상된 상단 컨트롤 */}
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            {/*====여기부터 수정됨====*/}
            {/* ✅ 수정: 버튼들을 항상 표시하도록 변경 */}
            {/* 이유: 사용자가 선택 여부와 관계없이 언제든 기능에 접근할 수 있도록 */}
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
            {/*====여기까지 수정됨====*/}

            <div className="flex items-center gap-2">
              {/* ✅ 레이아웃 타입 전환 (ButtonGroup) */}
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

              {/* ✅ 수정: 열 개수 선택 (실제 작동하도록) */}
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

          {/*====여기부터 수정됨====*/}
          {/* ✅ 수정: 통계 정보에서 "선택됨" 텍스트 제거 */}
          {/* 이유: 사용자 요청에 따라 깔끔한 UI를 위해 선택 개수 정보 삭제 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
            <span>사용 가능한 이미지 {filteredAndSortedImages.length}개</span>
            <Chip size="sm" variant="flat" color="secondary">
              {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
            </Chip>
            <Chip size="sm" variant="flat" color="primary">
              {safeImageViewConfig.layout.columns}열
            </Chip>
          </div>
          {/*====여기까지 수정됨====*/}
        </div>

        {/* ✅ 매스너리 + 순서 선택이 가능한 이미지 그리드 */}
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

                // ✅ 조건부 크기 적용 (매스너리 vs 일반 그리드)
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

                      {/*====여기부터 수정됨====*/}
                      {/* ✅ 수정: 선택 순서 번호 표시 기능 완전 삭제 */}
                      {/* 이유: 사용자 요청에 따라 순서 번호 표시 기능 제거 */}
                      {/*====여기까지 수정됨====*/}

                      {/* ✅ 수정: + 버튼 제거, 파일 정보만 유지 (하단) */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                        <p className="text-xs font-medium truncate">
                          {image.name}
                        </p>
                        <p className="text-xs opacity-80">
                          {formatFileSize(image.size)}
                        </p>
                      </div>

                      {/* ✅ 선택됨 오버레이 */}
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

        {/*====여기부터 수정됨====*/}
        {/* ✅ 수정: 선택된 이미지 미리보기 섹션 완전 삭제 */}
        {/* 이유: 사용자 요청에 따라 미리보기 섹션 제거하여 UI 단순화 */}
        {/*====여기까지 수정됨====*/}
      </div>
    </AccordionField>
  );
}

export default ImageViewBuilder;
