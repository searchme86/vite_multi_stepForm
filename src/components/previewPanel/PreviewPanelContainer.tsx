// src/components/previewPanel/PreviewPanelContainer.tsx

import { ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Button, Modal, ModalContent, ModalBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useStoreData } from './hooks/useStoreData';
import { useDataTransformers } from './hooks/useDataTransformers';
import { useTouchHandlers } from './hooks/useTouchHandlers';
import StatusIndicatorComponent from './parts/StatusIndicatorComponent';
import MobileContentComponent from './parts/MobileContentComponent';
import DesktopContentComponent from './parts/DesktopContentComponent';

// Zustand 스토어 import
import { usePreviewPanelStore } from './store/previewPanelStore';

function PreviewPanelContainer(): ReactNode {
  console.log('🎯 [PREVIEW_PANEL] 컴포넌트 렌더링 시작');

  // 모바일 감지 훅
  const { isMobile } = useMobileDetection();

  // 완전한 터치 핸들러 훅 사용
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleHeaderClick,
  } = useTouchHandlers();

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

  // MobileContentComponent를 위한 타입 안전한 래퍼 함수
  const setSelectedMobileSize = useCallback(
    (sizeValue: string) => {
      const validSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const isValidSize = validSizes.includes(sizeValue as any);

      const finalSize = isValidSize
        ? (sizeValue as 'xs' | 'sm' | 'md' | 'lg' | 'xl')
        : 'md';

      console.log('📏 [MOBILE_SIZE] 모바일 사이즈 설정:', {
        requestedSize: sizeValue,
        isValid: isValidSize,
        finalSize,
        timestamp: new Date().toISOString(),
      });

      const shouldWarn = !isValidSize;
      if (shouldWarn) {
        console.warn(
          '⚠️ [MOBILE_SIZE] 유효하지 않은 모바일 사이즈, 기본값 사용'
        );
      }

      zustandSetSelectedMobileSize(finalSize);
    },
    [zustandSetSelectedMobileSize]
  );

  // 디바이스 타입 자동 감지 및 설정
  useEffect(() => {
    const newDeviceType = isMobile ? 'mobile' : 'desktop';
    const shouldUpdateDeviceType = deviceType !== newDeviceType;

    if (shouldUpdateDeviceType) {
      console.log('📱 [DEVICE_TYPE] 디바이스 타입 업데이트:', {
        from: deviceType,
        to: newDeviceType,
        timestamp: new Date().toISOString(),
      });
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

  // formData fallback 처리
  const formData = useMemo(() => {
    const hasRawFormData = rawFormData !== undefined;

    return hasRawFormData
      ? rawFormData
      : {
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
  }, [rawFormData]);

  // localStorage 기능 - early return 패턴
  useEffect(() => {
    const shouldSkipLocalStorage = !isMobile || !isPreviewPanelOpen;
    if (shouldSkipLocalStorage) return;

    try {
      localStorage.setItem('previewPanelOpen', 'true');
      console.log('💾 [LOCAL_STORAGE] 미리보기 패널 상태 저장 완료');
    } catch (storageError) {
      console.warn('⚠️ [LOCAL_STORAGE] 저장 실패:', storageError);
    }
  }, [isMobile, isPreviewPanelOpen]);

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
    const hasRawCurrentFormValues = rawCurrentFormValues !== undefined;

    return hasRawCurrentFormValues
      ? {
          title: rawCurrentFormValues.title ?? '',
          description: rawCurrentFormValues.description ?? '',
          content: rawCurrentFormValues.content ?? '',
          nickname: rawCurrentFormValues.nickname ?? '',
          emailPrefix: rawCurrentFormValues.emailPrefix ?? '',
          emailDomain: rawCurrentFormValues.emailDomain ?? '',
          bio: rawCurrentFormValues.bio ?? '',
          userImage: rawCurrentFormValues.userImage ?? null,
          mainImage: rawCurrentFormValues.mainImage ?? null,
        }
      : {
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
  }, [rawCurrentFormValues]);

  // DisplayContent 타입 처리
  const displayContent = useMemo(() => {
    const isStringContent = typeof rawDisplayContent === 'string';

    return isStringContent
      ? {
          content: rawDisplayContent,
          type: 'text' as const,
          metadata: {},
        }
      : rawDisplayContent ?? {
          content: '',
          type: 'text' as const,
          metadata: {},
        };
  }, [rawDisplayContent]);

  // EditorStatusInfo 타입 처리 - 누락된 속성들 추가
  const editorStatusInfo = useMemo(() => {
    const hasRawEditorStatusInfo = rawEditorStatusInfo !== undefined;

    return hasRawEditorStatusInfo
      ? {
          isCompleted: rawEditorStatusInfo.isCompleted ?? false,
          contentLength: rawEditorStatusInfo.contentLength ?? 0,
          hasContainers: rawEditorStatusInfo.hasContainers ?? false,
          hasParagraphs: rawEditorStatusInfo.hasParagraphs ?? false,
          hasEditor: rawEditorStatusInfo.hasEditor ?? false,
          containerCount: rawEditorStatusInfo.containerCount ?? 0,
          paragraphCount: rawEditorStatusInfo.paragraphCount ?? 0,
        }
      : {
          isCompleted: false,
          contentLength: 0,
          hasContainers: false,
          hasParagraphs: false,
          hasEditor: false,
          containerCount: 0,
          paragraphCount: 0,
        };
  }, [rawEditorStatusInfo]);

  // AvatarProps 타입 처리 - 누락된 속성들 추가
  const avatarProps = useMemo(() => {
    const hasRawAvatarProps = rawAvatarProps !== undefined;

    return hasRawAvatarProps
      ? {
          src: rawAvatarProps.src,
          name: rawAvatarProps.name ?? '',
          fallback: rawAvatarProps.fallback ?? '',
          className: rawAvatarProps.className ?? '',
          showFallback: rawAvatarProps.showFallback ?? true,
          isBordered: rawAvatarProps.isBordered ?? false,
        }
      : {
          src: undefined,
          name: '',
          fallback: '',
          className: '',
          showFallback: true,
          isBordered: false,
        };
  }, [rawAvatarProps]);

  // 타입 안전한 배열 처리
  const safeMedia = useMemo(() => {
    const hasMainImage = currentFormValues.mainImage !== null;
    const mediaArray = hasMainImage ? [currentFormValues.mainImage] : [];

    return mediaArray.filter(
      (mediaItem): mediaItem is string => typeof mediaItem === 'string'
    );
  }, [currentFormValues.mainImage]);

  const safeSliderImages = useMemo(() => {
    const isValidSliderImages = Array.isArray(formData.sliderImages);
    return isValidSliderImages ? formData.sliderImages : [];
  }, [formData.sliderImages]);

  // 모바일 오버레이 표시 여부
  const shouldShowMobileOverlay = useMemo(() => {
    return isMobile && isPreviewPanelOpen;
  }, [isMobile, isPreviewPanelOpen]);

  // 패널 변환 클래스 계산
  const panelTransformClass = useMemo(() => {
    const isMobileAndClosed = isMobile && !isPreviewPanelOpen;
    return isMobileAndClosed ? 'translate-y-full' : 'translate-y-0';
  }, [isMobile, isPreviewPanelOpen]);

  // 닫기 버튼 클릭 핸들러
  const handleCloseButtonClickAction = useCallback(() => {
    console.log('❌ [CLOSE_BUTTON] 닫기 버튼 클릭:', {
      deviceType: isMobile ? 'mobile' : 'desktop',
      currentState: isPreviewPanelOpen ? 'open' : 'closed',
      action: 'CLOSE_PANEL',
      timestamp: new Date().toISOString(),
    });

    handleCloseButtonClick();
  }, [handleCloseButtonClick, isMobile, isPreviewPanelOpen]);

  // 배경 클릭 핸들러
  const handleBackgroundClickAction = useCallback(() => {
    console.log('🖱️ [BACKGROUND_CLICK] 배경 클릭:', {
      deviceType: 'mobile',
      currentState: isPreviewPanelOpen ? 'open' : 'closed',
      action: 'CLOSE_PANEL',
      timestamp: new Date().toISOString(),
    });

    handleBackgroundClick();
  }, [handleBackgroundClick, isPreviewPanelOpen]);

  console.log('🎯 [PREVIEW_PANEL] 렌더링 완료, JSX 반환');

  return (
    <>
      {/* 모바일 배경 오버레이 - 더 부드러운 애니메이션 */}
      {shouldShowMobileOverlay ? (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-700 ease-panel-smooth bg-black/50 md:hidden"
          onClick={handleBackgroundClickAction}
        />
      ) : null}

      {/* 메인 패널 - 애니메이션 속도 조절 (350ms → 700ms) */}
      <div
        className={`
          ${
            isMobile
              ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-700 ease-panel-smooth preview-panel-bottom-sheet rounded-t-3xl'
              : 'relative preview-panel-desktop'
          }
          ${panelTransformClass}
          ${isMobile ? 'h-[85vh] max-h-[85vh]' : ''}
        `}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* 모바일 헤더 - 터치 이벤트 추가 */}
        {isMobile ? (
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer header-clickable"
              onClick={handleHeaderClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1 transition-all duration-300 bg-gray-300 rounded-full hover:bg-gray-400 active:bg-gray-500 active:scale-95 drag-handle"></div>
            </div>

            <div
              className="flex items-center justify-between p-4 transition-colors duration-300 border-b cursor-pointer header-clickable"
              onClick={handleHeaderClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
                onPress={handleCloseButtonClickAction}
                aria-label="패널 닫기"
                type="button"
              >
                <Icon icon="lucide:x" />
              </Button>
            </div>
          </div>
        ) : null}

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

          {/* 데스크탑 뷰 전용 - 미리보기 섹션 상단 */}
          {!isMobile ? (
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
          ) : null}

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
          {isMobileModalOpen ? (
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
          ) : null}

          {/* 데스크탑뷰 보기 모달 */}
          {isDesktopModalOpen ? (
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
          ) : null}
        </div>
      </div>
    </>
  );
}

export default PreviewPanelContainer;
