// src/components/previewPanel/PreviewPanelContainer.tsx

import { ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Button, Modal, ModalContent, ModalBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useStoreData } from './hooks/useStoreData';
import { useDataTransformers } from './hooks/useDataTransformers';
import StatusIndicatorComponent from './parts/StatusIndicatorComponent';
import MobileContentComponent from './parts/MobileContentComponent';
import DesktopContentComponent from './parts/DesktopContentComponent';

// Zustand 스토어 import
import { usePreviewPanelStore } from './store/previewPanelStore';

function PreviewPanelContainer(): ReactNode {
  // 모바일 감지 훅
  const { isMobile } = useMobileDetection();

  // Zustand 상태들을 개별적으로 구독
  const isPreviewPanelOpen = usePreviewPanelStore(
    (state) => state.isPreviewPanelOpen
  );
  const selectedMobileSize = usePreviewPanelStore(
    (state) => state.selectedMobileSize
  );
  const hasTabChanged = usePreviewPanelStore((state) => state.hasTabChanged);
  const isMobileModalOpen = usePreviewPanelStore(
    (state) => state.isMobileModalOpen
  );
  const isDesktopModalOpen = usePreviewPanelStore(
    (state) => state.isDesktopModalOpen
  );
  const deviceType = usePreviewPanelStore((state) => state.deviceType);
  const touchStartY = usePreviewPanelStore((state) => state.touchStartY);
  const touchCurrentY = usePreviewPanelStore((state) => state.touchCurrentY);
  const isDragging = usePreviewPanelStore((state) => state.isDragging);

  // Zustand 액션들을 개별적으로 구독
  const zustandSetSelectedMobileSize = usePreviewPanelStore(
    (state) => state.setSelectedMobileSize
  );
  const setHasTabChanged = usePreviewPanelStore(
    (state) => state.setHasTabChanged
  );
  const setDeviceType = usePreviewPanelStore((state) => state.setDeviceType);
  const handleBackgroundClick = usePreviewPanelStore(
    (state) => state.handleBackgroundClick
  );
  const handleHeaderClick = usePreviewPanelStore(
    (state) => state.handleHeaderClick
  );
  const handleCloseButtonClick = usePreviewPanelStore(
    (state) => state.handleCloseButtonClick
  );
  const openMobileModal = usePreviewPanelStore(
    (state) => state.openMobileModal
  );
  const closeMobileModal = usePreviewPanelStore(
    (state) => state.closeMobileModal
  );
  const openDesktopModal = usePreviewPanelStore(
    (state) => state.openDesktopModal
  );
  const closeDesktopModal = usePreviewPanelStore(
    (state) => state.closeDesktopModal
  );
  const closePreviewPanel = usePreviewPanelStore(
    (state) => state.closePreviewPanel
  );
  const setTouchStartY = usePreviewPanelStore((state) => state.setTouchStartY);
  const setTouchCurrentY = usePreviewPanelStore(
    (state) => state.setTouchCurrentY
  );
  const setIsDragging = usePreviewPanelStore((state) => state.setIsDragging);
  const resetTouchState = usePreviewPanelStore(
    (state) => state.resetTouchState
  );

  // MobileContentComponent를 위한 타입 안전한 래퍼 함수
  const setSelectedMobileSize = useCallback(
    (size: string) => {
      const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const isValidSize = validSizes.includes(size as any);

      if (isValidSize) {
        zustandSetSelectedMobileSize(size as 'xs' | 'sm' | 'md' | 'lg' | 'xl');
      } else {
        console.warn('⚠️ 유효하지 않은 모바일 사이즈:', size);
        zustandSetSelectedMobileSize('md');
      }
    },
    [zustandSetSelectedMobileSize]
  );

  // 디바이스 타입 자동 감지 및 설정
  useEffect(() => {
    const newDeviceType = isMobile ? 'mobile' : 'desktop';
    if (deviceType !== newDeviceType) {
      setDeviceType(newDeviceType);
    }
  }, [isMobile, deviceType, setDeviceType]);

  // 스토어 데이터 훅 - fallback 처리 추가
  const storeData = useStoreData();
  const {
    formData: rawFormData,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
  } = storeData;

  // formData가 undefined일 경우 기본값 제공
  const formData = useMemo(() => {
    if (!rawFormData) {
      return {
        userImage: undefined,
        nickname: '',
        emailPrefix: '',
        emailDomain: '',
        bio: undefined,
        title: '',
        description: '',
        tags: undefined,
        content: '',
        mainImage: null,
        media: [],
        sliderImages: [],
        author: '',
        isEditorCompleted: false,
        editorCompletedContent: '',
      };
    }
    return rawFormData;
  }, [rawFormData]);

  // 데이터 변환 훅
  const transformedData = useDataTransformers({
    formData,
    editorCompletedContent,
    isEditorCompleted,
    editorContainers,
    editorParagraphs,
  });

  const {
    currentFormValues: rawCurrentFormValues,
    displayContent: rawDisplayContent,
    editorStatusInfo: rawEditorStatusInfo,
    heroImage,
    isUsingFallbackImage,
    tagArray,
    avatarProps: rawAvatarProps,
    swiperKey,
  } = transformedData;

  // 타입 안전성을 위한 변환 및 fallback 처리
  const currentFormValues = useMemo(() => {
    if (!rawCurrentFormValues) {
      return {
        title: '',
        description: '',
        content: '',
        nickname: '',
        emailPrefix: '',
        emailDomain: '',
        bio: '',
        userImage: null,
        mainImage: null,
      };
    }
    return {
      title: rawCurrentFormValues.title || '',
      description: rawCurrentFormValues.description || '',
      content: rawCurrentFormValues.content || '',
      nickname: rawCurrentFormValues.nickname || '',
      emailPrefix: rawCurrentFormValues.emailPrefix || '',
      emailDomain: rawCurrentFormValues.emailDomain || '',
      bio: rawCurrentFormValues.bio || '',
      userImage: rawCurrentFormValues.userImage || null,
      mainImage: rawCurrentFormValues.mainImage || null,
    };
  }, [rawCurrentFormValues]);

  // DisplayContent 타입 처리
  const displayContent = useMemo(() => {
    if (typeof rawDisplayContent === 'string') {
      return {
        content: rawDisplayContent,
        type: 'text' as const,
        metadata: {},
      };
    }
    return (
      rawDisplayContent || { content: '', type: 'text' as const, metadata: {} }
    );
  }, [rawDisplayContent]);

  // EditorStatusInfo 타입 처리 - 누락된 속성들 추가
  const editorStatusInfo = useMemo(() => {
    if (!rawEditorStatusInfo) {
      return {
        isCompleted: false,
        contentLength: 0,
        hasContainers: false,
        hasParagraphs: false,
        hasEditor: false,
        containerCount: 0,
        paragraphCount: 0,
      };
    }
    return {
      isCompleted: rawEditorStatusInfo.isCompleted || false,
      contentLength: rawEditorStatusInfo.contentLength || 0,
      hasContainers: rawEditorStatusInfo.hasContainers || false,
      hasParagraphs: rawEditorStatusInfo.hasParagraphs || false,
      hasEditor: rawEditorStatusInfo.hasEditor || false,
      containerCount: rawEditorStatusInfo.containerCount || 0,
      paragraphCount: rawEditorStatusInfo.paragraphCount || 0,
    };
  }, [rawEditorStatusInfo]);

  // AvatarProps 타입 처리 - 누락된 속성들 추가
  const avatarProps = useMemo(() => {
    if (!rawAvatarProps) {
      return {
        src: undefined,
        name: '',
        fallback: '',
        className: '',
        showFallback: true,
        isBordered: false,
      };
    }
    return {
      src: rawAvatarProps.src,
      name: rawAvatarProps.name || '',
      fallback: rawAvatarProps.fallback || '',
      className: rawAvatarProps.className || '',
      showFallback: rawAvatarProps.showFallback ?? true,
      isBordered: rawAvatarProps.isBordered ?? false,
    };
  }, [rawAvatarProps]);

  // 타입 안전한 배열 처리
  const safeMedia = useMemo(() => {
    const mediaArray = currentFormValues.mainImage
      ? [currentFormValues.mainImage]
      : [];
    return mediaArray.filter(
      (item): item is string => typeof item === 'string'
    );
  }, [currentFormValues.mainImage]);

  const safeSliderImages = useMemo(() => {
    return Array.isArray(formData.sliderImages) ? formData.sliderImages : [];
  }, [formData.sliderImages]);

  // 패널 표시 상태 계산 - 모바일과 데스크탑 모두 isPreviewPanelOpen 상태 기반
  const shouldShowPanel = useMemo(() => {
    return isPreviewPanelOpen;
  }, [isPreviewPanelOpen]);

  // 패널 변환 클래스 계산
  const panelTransformClass = useMemo(() => {
    if (isMobile && !isPreviewPanelOpen) {
      return 'translate-y-full';
    }
    return 'translate-y-0';
  }, [isMobile, isPreviewPanelOpen]);

  // 드래그 다운 감지 및 패널 닫기 로직
  const calculateDragDistance = useCallback(() => {
    if (!isDragging || touchStartY === 0) return 0;

    const dragDistance = touchCurrentY - touchStartY;
    return dragDistance;
  }, [isDragging, touchStartY, touchCurrentY]);

  const shouldCloseOnDragDown = useCallback(() => {
    const dragDistance = calculateDragDistance();
    const minimumDragDistance = 50; // 50px 이상 드래그해야 닫힘
    const isDragDown = dragDistance > minimumDragDistance;

    return isDragDown;
  }, [calculateDragDistance]);

  // 터치 핸들러 함수들 - 드래그 다운 시 패널 닫기 기능 추가
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!isMobile) return;

      const touch = event.touches[0];
      if (!touch) return;

      const startY = touch.clientY;
      setTouchStartY(startY);
      setIsDragging(true);
    },
    [isMobile, setTouchStartY, setIsDragging]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isMobile || !isDragging) return;

      const touch = event.touches[0];
      if (!touch) return;

      const currentY = touch.clientY;
      setTouchCurrentY(currentY);
    },
    [isMobile, isDragging, setTouchCurrentY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;

    // 드래그 다운 시 패널 닫기 확인
    const shouldClose = shouldCloseOnDragDown();

    if (shouldClose) {
      closePreviewPanel();
    }

    resetTouchState();
  }, [isMobile, shouldCloseOnDragDown, closePreviewPanel, resetTouchState]);

  // 마우스 드래그 핸들러 - 데스크탑용
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isMobile) return;

      const startY = event.clientY;
      setTouchStartY(startY);
      setIsDragging(true);
    },
    [isMobile, setTouchStartY, setIsDragging]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isMobile || !isDragging) return;

      const currentY = event.clientY;
      setTouchCurrentY(currentY);
    },
    [isMobile, isDragging, setTouchCurrentY]
  );

  const handleMouseUp = useCallback(() => {
    if (isMobile) return;

    // 드래그 다운 시 패널 닫기 확인
    const shouldClose = shouldCloseOnDragDown();

    if (shouldClose) {
      closePreviewPanel();
    }

    resetTouchState();
  }, [isMobile, shouldCloseOnDragDown, closePreviewPanel, resetTouchState]);

  // 헤더 클릭 시 패널 닫기 핸들러
  const handleHeaderClickClose = useCallback(() => {
    closePreviewPanel();
  }, [closePreviewPanel]);

  // 패널이 열려있지 않으면 렌더링하지 않음
  if (!shouldShowPanel) {
    return null;
  }

  return (
    <div
      className={`
        ${
          isMobile
            ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-in-out preview-panel-bottom-sheet rounded-t-3xl'
            : 'relative preview-panel-desktop'
        }
        ${panelTransformClass}
        ${isMobile ? 'h-[85vh] max-h-[85vh]' : ''}
      `}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onMouseDown={!isMobile ? handleMouseDown : undefined}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseUp={!isMobile ? handleMouseUp : undefined}
    >
      {/* 모바일 헤더 - 드래그 및 클릭 핸들러 추가 */}
      {isMobile && (
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
          <div
            className="flex justify-center pt-3 pb-2 cursor-pointer header-clickable"
            onClick={handleHeaderClickClose}
          >
            <div className="w-12 h-1 transition-all bg-gray-300 rounded-full hover:bg-gray-400 active:bg-gray-500 active:scale-95 drag-handle"></div>
          </div>

          <div
            className="flex items-center justify-between p-4 transition-colors border-b cursor-pointer header-clickable"
            onClick={handleHeaderClickClose}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">미리보기</h2>
              <span className="text-xs text-gray-400 opacity-75">
                탭하여 닫기
              </span>
            </div>

            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => {
                console.log('❌ 닫기 버튼 클릭');
                handleCloseButtonClick();
              }}
              aria-label="패널 닫기"
              type="button"
            >
              <Icon icon="lucide:x" />
            </Button>
          </div>
        </div>
      )}

      {/* 패널 내용 */}
      <div className={isMobile ? 'p-4' : ''}>
        {/* 상태 표시기 */}
        <StatusIndicatorComponent
          mainImage={currentFormValues.mainImage}
          media={safeMedia}
          sliderImages={safeSliderImages}
          customGalleryViews={customGalleryViews}
          editorStatusInfo={editorStatusInfo}
          displayContent={displayContent}
          isUsingFallbackImage={isUsingFallbackImage}
        />

        {/* 데스크탑 뷰 일 경우, 미리보기 섹션 상단 */}
        {!isMobile && (
          <div className="flex justify-end gap-2 mb-4">
            <Button
              color="secondary"
              variant="flat"
              size="sm"
              onPress={openMobileModal}
              startContent={<Icon icon="lucide:smartphone" />}
              className="text-xs shadow-sm sm:text-sm"
              type="button"
              isDisabled={isMobileModalOpen}
            >
              모바일뷰 보기
            </Button>

            <Button
              color="primary"
              variant="flat"
              size="sm"
              onPress={openDesktopModal}
              startContent={<Icon icon="lucide:monitor" />}
              className="text-xs shadow-sm sm:text-sm"
              type="button"
              isDisabled={isDesktopModalOpen}
            >
              데스크탑뷰 보기
            </Button>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        <DesktopContentComponent
          currentFormValues={currentFormValues}
          displayContent={displayContent}
          heroImage={heroImage}
          tagArray={tagArray}
          avatarProps={avatarProps}
          swiperKey={swiperKey}
          customGalleryViews={customGalleryViews}
        />

        {/* 모바일뷰 보기 모달 */}
        {isMobileModalOpen && (
          <Modal
            isOpen={isMobileModalOpen}
            onClose={closeMobileModal}
            size="full"
            scrollBehavior="inside"
            hideCloseButton={false}
            backdrop="blur"
          >
            <ModalContent>
              {() => (
                <ModalBody className="p-0">
                  <div className="relative h-full">
                    <Button
                      isIconOnly
                      color="default"
                      variant="flat"
                      size="sm"
                      className="absolute z-50 top-4 right-4 bg-white/80 backdrop-blur-sm"
                      onPress={closeMobileModal}
                      type="button"
                    >
                      <Icon icon="lucide:x" />
                    </Button>
                    <MobileContentComponent
                      currentFormValues={currentFormValues}
                      displayContent={displayContent}
                      heroImage={heroImage}
                      tagArray={tagArray}
                      avatarProps={avatarProps}
                      swiperKey={swiperKey}
                      customGalleryViews={customGalleryViews}
                      selectedMobileSize={selectedMobileSize}
                      setSelectedMobileSize={setSelectedMobileSize}
                      hasTabChanged={hasTabChanged}
                      setHasTabChanged={setHasTabChanged}
                    />
                  </div>
                </ModalBody>
              )}
            </ModalContent>
          </Modal>
        )}

        {/* 데스크탑뷰 보기 모달 */}
        {isDesktopModalOpen && (
          <Modal
            isOpen={isDesktopModalOpen}
            onClose={closeDesktopModal}
            size="full"
            scrollBehavior="inside"
            hideCloseButton={false}
            backdrop="blur"
          >
            <ModalContent>
              {() => (
                <ModalBody className="p-0">
                  <div className="relative">
                    <Button
                      isIconOnly
                      color="default"
                      variant="flat"
                      size="sm"
                      className="absolute z-50 top-4 right-4 bg-white/80 backdrop-blur-sm"
                      onPress={closeDesktopModal}
                      type="button"
                    >
                      <Icon icon="lucide:x" />
                    </Button>
                    <div className="max-w-4xl mx-auto">
                      <DesktopContentComponent
                        currentFormValues={currentFormValues}
                        displayContent={displayContent}
                        heroImage={heroImage}
                        tagArray={tagArray}
                        avatarProps={avatarProps}
                        swiperKey={swiperKey}
                        customGalleryViews={customGalleryViews}
                      />
                    </div>
                  </div>
                </ModalBody>
              )}
            </ModalContent>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default PreviewPanelContainer;
