import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Slider,
  Chip,
  Tooltip,
  ButtonGroup,
  Badge,
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

  // ✅ 안전한 기본값 설정 - 무한 렌더링 방지를 위해 useMemo 사용
  const safeImageViewConfig = useMemo(() => {
    return (
      imageViewConfig || {
        selectedImages: [],
        clickOrder: [],
        layout: {
          columns: 3,
          spacing: 'medium' as const,
        },
        filter: 'all',
      }
    );
  }, [imageViewConfig]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [thumbnailSize, setThumbnailSize] = useState(140);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Modal states
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // 파일명 매핑을 위한 더미 데이터 (실제로는 파일 메타데이터에서 가져와야 함)
  const getFileName = useCallback((imageUrl: string, index: number) => {
    // URL에서 파일명 추출 시도, 실패하면 기본 이름 사용
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

  // 파일 크기 시뮬레이션 (실제로는 파일 메타데이터에서 가져와야 함)
  const getFileSize = useCallback((imageUrl: string) => {
    // 간단한 해시 함수로 일관된 크기 생성
    const hash = imageUrl.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 5000000) + 500000; // 0.5MB ~ 5.5MB 범위
  }, []);

  // ✅ 수정: 안전한 접근을 위해 safeImageViewConfig 사용
  const filteredAndSortedImages = useMemo(() => {
    // mediaFiles가 배열인지 확인하고 기본값 제공
    const safeMediaFiles = Array.isArray(mediaFiles) ? mediaFiles : [];

    let images = safeMediaFiles.map((img, index) => ({
      url: img,
      index,
      name: getFileName(img, index),
      size: getFileSize(img),
    }));

    // ✅ 수정: 안전한 필터링 적용
    if (safeImageViewConfig.filter === 'available') {
      images = images.filter(
        (img) =>
          (!mainImage || mainImage !== img.url) &&
          !(Array.isArray(sliderImages) && sliderImages.includes(img.url))
      );
    }

    // 검색 적용
    if (searchQuery) {
      images = images.filter((img) =>
        img.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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
    safeImageViewConfig.filter, // ✅ 수정: 안전한 접근
    searchQuery,
    sortBy,
    sortOrder,
    mainImage,
    sliderImages,
    getFileName,
    getFileSize,
  ]);

  // 이미지 클릭 핸들러 (기존 로직 유지하되 향상)
  const handleImageClick = useCallback(
    (imageUrl: string, index: number) => {
      // 이미 메인 이미지나 슬라이더로 사용된 이미지인지 확인
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

      // ✅ 수정: setImageViewConfig가 있는지 확인
      if (!setImageViewConfig) {
        console.warn('setImageViewConfig가 정의되지 않았습니다.');
        return;
      }

      setImageViewConfig((prev) => {
        // ✅ 수정: 이전 상태가 없는 경우 기본값 사용
        const safePrev = prev || {
          selectedImages: [],
          clickOrder: [],
          layout: { columns: 3, spacing: 'medium' as const },
          filter: 'all',
        };

        const isAlreadySelected = safePrev.selectedImages.includes(imageUrl);

        if (isAlreadySelected) {
          // 이미 선택된 이미지라면 제거
          const selectedIndex = safePrev.selectedImages.indexOf(imageUrl);
          const newSelectedImages = safePrev.selectedImages.filter(
            (img) => img !== imageUrl
          );
          const newClickOrder = safePrev.clickOrder.filter(
            (_, i) => i !== selectedIndex
          );

          // 제거된 이미지 이후의 순서 번호들을 하나씩 감소
          const adjustedClickOrder = newClickOrder.map((order, i) =>
            order > selectedIndex + 1 ? order - 1 : order
          );

          return {
            ...safePrev,
            selectedImages: newSelectedImages,
            clickOrder: adjustedClickOrder,
          };
        } else {
          // 새로 선택된 이미지라면 추가
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

  // 선택 초기화
  const resetSelection = useCallback(() => {
    if (!setImageViewConfig) {
      console.warn('setImageViewConfig가 정의되지 않았습니다.');
      return;
    }

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

  // 레이아웃 업데이트
  const updateLayout = useCallback(
    (layoutUpdate: Partial<typeof safeImageViewConfig.layout>) => {
      if (!setImageViewConfig) {
        console.warn('setImageViewConfig가 정의되지 않았습니다.');
        return;
      }

      setImageViewConfig((prev) => {
        const safePrev = prev || safeImageViewConfig;
        return {
          ...safePrev,
          layout: {
            ...safePrev.layout,
            ...layoutUpdate,
          },
        };
      });
    },
    [setImageViewConfig, safeImageViewConfig]
  );

  // 필터 업데이트
  const updateFilter = useCallback(
    (filter: string) => {
      if (!setImageViewConfig) {
        console.warn('setImageViewConfig가 정의되지 않았습니다.');
        return;
      }

      setImageViewConfig((prev) => {
        const safePrev = prev || safeImageViewConfig;
        return {
          ...safePrev,
          filter,
        };
      });
    },
    [setImageViewConfig, safeImageViewConfig]
  );

  // 미리보기 모달 핸들러
  const openPreview = useCallback(
    (index: number) => {
      setCurrentPreviewIndex(index);
      onPreviewOpen();
    },
    [onPreviewOpen]
  );

  const nextImage = useCallback(() => {
    setCurrentPreviewIndex((prev) =>
      prev < filteredAndSortedImages.length - 1 ? prev + 1 : 0
    );
  }, [filteredAndSortedImages.length]);

  const prevImage = useCallback(() => {
    setCurrentPreviewIndex((prev) =>
      prev > 0 ? prev - 1 : filteredAndSortedImages.length - 1
    );
  }, [filteredAndSortedImages.length]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPreviewOpen) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextImage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'Escape':
          onPreviewClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, nextImage, prevImage, onPreviewClose]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = useCallback(
    (e: React.DragEvent, imageUrl: string) => {
      setDraggedItem(imageUrl);
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetUrl: string) => {
      e.preventDefault();

      if (!draggedItem || draggedItem === targetUrl || !setImageViewConfig)
        return;

      setImageViewConfig((prev) => {
        const safePrev = prev || safeImageViewConfig;
        const dragIndex = safePrev.selectedImages.indexOf(draggedItem);
        const dropIndex = safePrev.selectedImages.indexOf(targetUrl);

        if (dragIndex === -1 || dropIndex === -1) return safePrev;

        const newSelectedImages = [...safePrev.selectedImages];
        const newClickOrder = [...safePrev.clickOrder];

        // 배열 요소 이동
        const [draggedImage] = newSelectedImages.splice(dragIndex, 1);
        const [draggedOrder] = newClickOrder.splice(dragIndex, 1);

        newSelectedImages.splice(dropIndex, 0, draggedImage);
        newClickOrder.splice(dropIndex, 0, draggedOrder);

        return {
          ...safePrev,
          selectedImages: newSelectedImages,
          clickOrder: newClickOrder,
        };
      });

      setDraggedItem(null);
    },
    [draggedItem, setImageViewConfig, safeImageViewConfig]
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
      description={`업로드된 이미지로 나만의 갤러리를 만들어보세요. (${safeImageViewConfig.selectedImages.length}개 선택됨)`}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* 향상된 상단 컨트롤 */}
        <div className="space-y-4">
          {/* 첫 번째 행: 검색 및 기본 액션 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="이미지 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={
                <Icon icon="lucide:search" className="text-default-400" />
              }
              className="flex-1"
              size="sm"
            />

            {safeImageViewConfig.selectedImages.length > 0 && (
              <Button
                color="warning"
                size="sm"
                variant="flat"
                startContent={
                  <Icon icon="lucide:refresh-cw" className="text-sm" />
                }
                onPress={resetSelection}
              >
                선택 초기화
              </Button>
            )}
          </div>

          {/* 두 번째 행: 필터 및 레이아웃 옵션 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 필터 */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  size="sm"
                  startContent={
                    <Icon icon="lucide:filter" className="text-sm" />
                  }
                >
                  {safeImageViewConfig.filter === 'all' ? '전체' : '사용 가능'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="필터 옵션">
                <DropdownItem key="all" onPress={() => updateFilter('all')}>
                  전체 이미지
                </DropdownItem>
                <DropdownItem
                  key="available"
                  onPress={() => updateFilter('available')}
                >
                  사용 가능한 이미지만
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 정렬 */}
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

            {/* 열 개수 */}
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
                  <DropdownItem
                    key={num}
                    onPress={() => updateLayout({ columns: num })}
                  >
                    {num}열
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {/* 간격 조절 */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  size="sm"
                  startContent={<Icon icon="lucide:move" className="text-sm" />}
                >
                  간격
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="간격 옵션">
                <DropdownItem
                  key="small"
                  onPress={() => updateLayout({ spacing: 'small' })}
                >
                  좁게
                </DropdownItem>
                <DropdownItem
                  key="medium"
                  onPress={() => updateLayout({ spacing: 'medium' })}
                >
                  보통
                </DropdownItem>
                <DropdownItem
                  key="large"
                  onPress={() => updateLayout({ spacing: 'large' })}
                >
                  넓게
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>

            {/* 썸네일 크기 조절 */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-default-600">크기:</span>
              <Slider
                size="sm"
                step={20}
                maxValue={200}
                minValue={100}
                value={thumbnailSize}
                onChange={(value) =>
                  setThumbnailSize(Array.isArray(value) ? value[0] : value)
                }
                className="w-20"
              />
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
            <span>총 {filteredAndSortedImages.length}개 이미지</span>
            {searchQuery && (
              <Chip size="sm" variant="flat" color="primary">
                검색: "{searchQuery}"
              </Chip>
            )}
            {safeImageViewConfig.selectedImages.length > 0 && (
              <Chip size="sm" variant="flat" color="success">
                {safeImageViewConfig.selectedImages.length}개 선택됨
              </Chip>
            )}
          </div>
        </div>

        {/* 향상된 이미지 그리드 */}
        {filteredAndSortedImages.length > 0 ? (
          <motion.div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${safeImageViewConfig.layout.columns}, 1fr)`,
              gap:
                safeImageViewConfig.layout.spacing === 'small'
                  ? '8px'
                  : safeImageViewConfig.layout.spacing === 'medium'
                  ? '16px'
                  : '24px',
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

                return (
                  <motion.div
                    key={image.url}
                    layout
                    variants={item}
                    className={`relative group cursor-pointer transition-all duration-200 ${
                      isDisabled ? 'opacity-60' : 'hover:scale-105'
                    } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    style={{ aspectRatio: '1' }}
                  >
                    <div
                      className="relative w-full h-full overflow-hidden rounded-lg bg-default-100"
                      style={{ height: `${thumbnailSize}px` }}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        onClick={() =>
                          !isDisabled &&
                          handleImageClick(image.url, image.index)
                        }
                      />

                      {/* 선택 순서 번호 (이미지 중앙) */}
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

                      {/* 미리보기 버튼 */}
                      <div className="absolute top-2 right-2">
                        <Tooltip content="미리보기">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="solid"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(index);
                            }}
                          >
                            <Icon icon="lucide:eye" className="text-sm" />
                          </Button>
                        </Tooltip>
                      </div>

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
              {searchQuery
                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                : safeImageViewConfig.filter === 'available'
                ? '사용 가능한 이미지가 없습니다.'
                : '업로드된 이미지가 없습니다.'}
            </p>
            {searchQuery && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => setSearchQuery('')}
              >
                검색 초기화
              </Button>
            )}
          </div>
        )}

        {/* 향상된 선택된 이미지 미리보기 */}
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
                  <Tooltip content="드래그하여 순서 변경">
                    <Icon
                      icon="lucide:info"
                      className="text-default-400 text-sm"
                    />
                  </Tooltip>
                </div>
              </div>

              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(
                    safeImageViewConfig.layout.columns,
                    safeImageViewConfig.selectedImages.length
                  )}, 1fr)`,
                }}
              >
                <AnimatePresence>
                  {safeImageViewConfig.selectedImages.map((imageUrl, index) => (
                    <motion.div
                      key={imageUrl}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative aspect-square cursor-move group"
                      draggable
                      onDragStart={(e) => handleDragStart(e, imageUrl)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, imageUrl)}
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

                      {/* 드래그 인디케이터 */}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon icon="lucide:move" className="text-xs" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <p className="text-xs text-default-500 mt-3 text-center">
                이미지를 드래그하여 순서를 변경할 수 있습니다
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* 향상된 미리보기 모달 */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        size="full"
        classNames={{
          base: 'bg-black/90',
          body: 'p-0',
        }}
      >
        <ModalContent>
          <ModalHeader className="text-white">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <span>
                  {currentPreviewIndex + 1} / {filteredAndSortedImages.length}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  className="bg-white/20 text-white"
                >
                  {filteredAndSortedImages[currentPreviewIndex]?.name}
                </Chip>
              </div>
              <div className="flex gap-2">
                <Tooltip content="이전 이미지 (←)">
                  <Button
                    isIconOnly
                    variant="light"
                    className="text-white"
                    onPress={prevImage}
                  >
                    <Icon icon="lucide:chevron-left" />
                  </Button>
                </Tooltip>
                <Tooltip content="다음 이미지 (→)">
                  <Button
                    isIconOnly
                    variant="light"
                    className="text-white"
                    onPress={nextImage}
                  >
                    <Icon icon="lucide:chevron-right" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="flex items-center justify-center">
            {filteredAndSortedImages[currentPreviewIndex] && (
              <img
                src={filteredAndSortedImages[currentPreviewIndex].url}
                alt={filteredAndSortedImages[currentPreviewIndex].name}
                className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105"
              />
            )}
          </ModalBody>
          <ModalFooter className="text-white">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <span className="text-sm opacity-80">
                  {filteredAndSortedImages[currentPreviewIndex] &&
                    formatFileSize(
                      filteredAndSortedImages[currentPreviewIndex].size
                    )}
                </span>
              </div>
              <div className="text-xs opacity-60">
                방향키로 이동 • ESC로 닫기
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AccordionField>
  );
}

export default ImageViewBuilder;
