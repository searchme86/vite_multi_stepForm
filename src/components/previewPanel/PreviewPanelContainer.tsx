// src/components/previewPanel/PreviewPanelContainer.tsx

import { ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Modal, ModalContent, ModalBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useStoreData } from './hooks/useStoreData';
import { useDataTransformers } from './hooks/useDataTransformers';
import { useTouchHandlers } from './hooks/useTouchHandlers';
import StatusIndicatorComponent from './parts/StatusIndicatorComponent';
import MobileContentComponent from './parts/MobileContentComponent';
import DesktopContentComponent from './parts/DesktopContentComponent';

// 🎯 모바일 사이즈 타입 및 검증 함수 import
import {
  validateMobileSize,
  getMobileDeviceInfo,
  type MobileDeviceSize,
} from './types/previewPanel.types';

// Zustand 스토어 import
import { usePreviewPanelStore } from './store/previewPanelStore';

function PreviewPanelContainer(): ReactNode {
  console.log('🎯 [PREVIEW_PANEL] 컴포넌트 렌더링 시작');

  // 패널 엘리먼트 참조
  const panelElementRef = useRef<HTMLDivElement>(null);

  // 모바일 감지 훅
  const { isMobile } = useMobileDetection();

  // 완전한 터치 핸들러 훅 사용 (모바일에서만)
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleHeaderClick,
  } = useTouchHandlers();

  // 🎯 Zustand 상태들을 개별적으로 구독
  const selectedMobileSize = usePreviewPanelStore(
    (state) => state.selectedMobileSize
  );
  const isPreviewPanelOpen = usePreviewPanelStore(
    (state) => state.isPreviewPanelOpen
  );
  const hasTabChanged = usePreviewPanelStore((state) => state.hasTabChanged);
  const isMobileModalOpen = usePreviewPanelStore(
    (state) => state.isMobileModalOpen
  );
  const isDesktopModalOpen = usePreviewPanelStore(
    (state) => state.isDesktopModalOpen
  );
  const deviceType = usePreviewPanelStore((state) => state.deviceType);

  // 🎯 Zustand 액션들을 개별적으로 구독
  const zustandSetSelectedMobileSize = usePreviewPanelStore(
    (state) => state.setSelectedMobileSize
  );
  const setHasTabChanged = usePreviewPanelStore(
    (state) => state.setHasTabChanged
  );
  const setDeviceType = usePreviewPanelStore((state) => state.setDeviceType);
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
  const handleCloseButtonClick = usePreviewPanelStore(
    (state) => state.handleCloseButtonClick
  );

  // 🎯 모바일에서만 배경 스크롤 차단
  useEffect(() => {
    const shouldBlockBackgroundScroll = isMobile && isPreviewPanelOpen;

    if (shouldBlockBackgroundScroll) {
      const currentScrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      console.log('🚫 [SCROLL_LOCK] 모바일 배경 스크롤 차단 활성화:', {
        currentScrollY,
        timestamp: new Date().toISOString(),
      });
    } else {
      const scrollY = parseInt(document.body.style.top || '0', 10);

      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';

      const shouldRestoreScroll = scrollY !== 0;
      if (shouldRestoreScroll) {
        window.scrollTo(0, Math.abs(scrollY));
      }

      console.log('✅ [SCROLL_LOCK] 배경 스크롤 차단 해제:', {
        restoredScrollY: Math.abs(scrollY),
        timestamp: new Date().toISOString(),
      });
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isMobile, isPreviewPanelOpen]);

  // 🎯 MobileContentComponent를 위한 픽셀 기반 사이즈 검증 함수
  const setSelectedMobileSize = useCallback(
    (requestedSizeValue: string) => {
      console.log('🔍 [MOBILE_TAB] 모바일 사이즈 변경 요청 시작:', {
        requestedSize: requestedSizeValue,
        currentSize: selectedMobileSize,
        timestamp: new Date().toISOString(),
      });

      const validationResult = validateMobileSize(requestedSizeValue);
      const { isValid, validatedSize, errorMessage } = validationResult;

      if (!isValid) {
        console.warn('⚠️ [MOBILE_TAB] 유효하지 않은 모바일 사이즈:', {
          requestedSize: requestedSizeValue,
          errorMessage,
          fallbackSize: validatedSize,
          timestamp: new Date().toISOString(),
        });
      }

      const deviceConfigInfo = getMobileDeviceInfo(validatedSize);
      const {
        size: finalSize,
        width: deviceWidth,
        label: deviceLabel,
        description: deviceDescription,
      } = deviceConfigInfo;

      console.log('📏 [MOBILE_TAB] 모바일 사이즈 설정 완료:', {
        requestedSize: requestedSizeValue,
        isValid,
        finalSize,
        deviceWidth,
        deviceLabel,
        deviceDescription,
        timestamp: new Date().toISOString(),
      });

      const hasSizeChanged = selectedMobileSize !== finalSize;
      if (hasSizeChanged) {
        setHasTabChanged(true);
        console.log('🔄 [MOBILE_TAB] 탭 변경 상태 업데이트:', {
          previousSize: selectedMobileSize,
          newSize: finalSize,
          hasChanged: true,
          timestamp: new Date().toISOString(),
        });
      }

      zustandSetSelectedMobileSize(finalSize);
    },
    [selectedMobileSize, zustandSetSelectedMobileSize, setHasTabChanged]
  );

  // 🎯 디바이스 타입 계산 및 자동 동기화
  const calculatedDeviceType = useMemo(() => {
    return isMobile ? 'mobile' : 'desktop';
  }, [isMobile]);

  useEffect(() => {
    const isDeviceTypeOutOfSync = deviceType !== calculatedDeviceType;

    if (isDeviceTypeOutOfSync) {
      console.log('📱 [DEVICE_TYPE] 디바이스 타입 동기화:', {
        from: deviceType,
        to: calculatedDeviceType,
        trigger: 'mobile_detection_change',
        timestamp: new Date().toISOString(),
      });

      setDeviceType(calculatedDeviceType);
    }
  }, [calculatedDeviceType, deviceType, setDeviceType]);

  // 스토어 데이터 훅
  const storeData = useStoreData();
  const {
    formData: rawFormData,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
  } = storeData;

  // 🎯 formData fallback 처리
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
          mainImage: undefined,
          media: [],
          sliderImages: [],
          author: '',
          isEditorCompleted: false,
          editorCompletedContent: '',
        };
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

  // 🎯 타입 안전성 처리
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
          media: Array.isArray(rawCurrentFormValues.media)
            ? rawCurrentFormValues.media.filter(
                (item): item is string => typeof item === 'string'
              )
            : [],
          sliderImages: Array.isArray(rawCurrentFormValues.sliderImages)
            ? rawCurrentFormValues.sliderImages.filter(
                (item): item is string => typeof item === 'string'
              )
            : [],
          tags: rawCurrentFormValues.tags ?? '',
          editorCompletedContent:
            rawCurrentFormValues.editorCompletedContent ?? '',
          isEditorCompleted: rawCurrentFormValues.isEditorCompleted ?? false,
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
          media: [],
          sliderImages: [],
          tags: '',
          editorCompletedContent: '',
          isEditorCompleted: false,
        };
  }, [rawCurrentFormValues]);

  const displayContent = useMemo(() => {
    const isStringContent = typeof rawDisplayContent === 'string';

    return isStringContent
      ? {
          text: rawDisplayContent,
          source: 'editor' as const,
        }
      : rawDisplayContent ?? {
          text: '',
          source: 'basic' as const,
        };
  }, [rawDisplayContent]);

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

  const avatarProps = useMemo(() => {
    const hasRawAvatarProps = rawAvatarProps !== undefined;

    return hasRawAvatarProps
      ? {
          src: rawAvatarProps.src ?? '',
          name: rawAvatarProps.name ?? '',
          fallback: rawAvatarProps.fallback ?? '',
          className: rawAvatarProps.className ?? '',
          showFallback: rawAvatarProps.showFallback ?? true,
          isBordered: rawAvatarProps.isBordered ?? false,
        }
      : {
          src: '',
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

  console.log('🎯 [PREVIEW_PANEL] 렌더링 완료, JSX 반환:', {
    isMobile,
    isPreviewPanelOpen,
    timestamp: new Date().toISOString(),
  });

  return (
    <div
      ref={panelElementRef}
      className="flex flex-col h-full bg-white"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* 🎯 헤더 - 모바일과 데스크탑 다르게 처리 */}
      {isMobile ? (
        <MobileHeader
          onHeaderClick={handleHeaderClick}
          onCloseClick={handleCloseButtonClickAction}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
        />
      ) : (
        <DesktopHeader onCloseClick={handleCloseButtonClickAction} />
      )}

      {/* 🎯 패널 내용 */}
      <div
        className={`flex-1 ${
          isMobile
            ? 'preview-panel-mobile-content'
            : 'preview-panel-desktop-content'
        }`}
      >
        <div className={isMobile ? 'p-4' : 'p-6'}>
          {/* 상태 표시기 */}
          <div className="preview-panel-status-indicator">
            <StatusIndicatorComponent
              mainImage={currentFormValues.mainImage}
              media={safeMedia}
              sliderImages={safeSliderImages}
              customGalleryViews={customGalleryViews}
              editorStatusInfo={editorStatusInfo}
              displayContent={displayContent}
              isUsingFallbackImage={isUsingFallbackImage}
            />
          </div>

          {/* 🎯 데스크탑 뷰 전용 - 미리보기 섹션 상단 버튼들 */}
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

          {/* 🎯 메인 콘텐츠 */}
          <div className="preview-panel-content-fade">
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
      </div>

      {/* 🎯 모달들 */}
      <PreviewModals
        isMobileModalOpen={isMobileModalOpen}
        isDesktopModalOpen={isDesktopModalOpen}
        closeMobileModal={closeMobileModal}
        closeDesktopModal={closeDesktopModal}
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
  );
}

// 🎯 모바일 헤더 컴포넌트
interface MobileHeaderProps {
  onHeaderClick: () => void;
  onCloseClick: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

function MobileHeader({
  onHeaderClick,
  onCloseClick,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
}: MobileHeaderProps): ReactNode {
  return (
    <div className="preview-panel-mobile-header">
      {/* 드래그 핸들 */}
      <div
        className="preview-panel-drag-handle"
        onClick={onHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* 헤더 콘텐츠 */}
      <div
        className="flex items-center justify-between p-4 transition-colors duration-300 border-b cursor-pointer"
        onClick={onHeaderClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">미리보기</h2>
          <span className="text-xs text-gray-400 opacity-75">탭하여 닫기</span>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onCloseClick}
          aria-label="패널 닫기"
          type="button"
        >
          <Icon icon="lucide:x" />
        </Button>
      </div>
    </div>
  );
}

// 🎯 데스크탑 헤더 컴포넌트
interface DesktopHeaderProps {
  onCloseClick: () => void;
}

function DesktopHeader({ onCloseClick }: DesktopHeaderProps): ReactNode {
  return (
    <div className="preview-panel-desktop-header">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">미리보기</h2>
          <span className="px-2 py-1 text-xs text-blue-600 bg-blue-100 rounded-full">
            실시간 동기화
          </span>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onCloseClick}
          aria-label="패널 닫기"
          type="button"
          className="hover:bg-gray-100"
        >
          <Icon icon="lucide:x" />
        </Button>
      </div>
    </div>
  );
}

// 🎯 미리보기 모달들 컴포넌트
interface PreviewModalsProps {
  isMobileModalOpen: boolean;
  isDesktopModalOpen: boolean;
  closeMobileModal: () => void;
  closeDesktopModal: () => void;
  currentFormValues: any;
  displayContent: any;
  heroImage: string;
  tagArray: string[];
  avatarProps: any;
  swiperKey: string;
  customGalleryViews: any[];
  selectedMobileSize: string;
  setSelectedMobileSize: (size: string) => void;
  hasTabChanged: boolean;
  setHasTabChanged: (changed: boolean) => void;
}

function PreviewModals({
  isMobileModalOpen,
  isDesktopModalOpen,
  closeMobileModal,
  closeDesktopModal,
  currentFormValues,
  displayContent,
  heroImage,
  tagArray,
  avatarProps,
  swiperKey,
  customGalleryViews,
  selectedMobileSize,
  setSelectedMobileSize,
  hasTabChanged,
  setHasTabChanged,
}: PreviewModalsProps): ReactNode {
  return (
    <>
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
    </>
  );
}

export default PreviewPanelContainer;
