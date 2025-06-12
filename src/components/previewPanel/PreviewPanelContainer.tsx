//====여기부터 수정됨====
// 미리보기 패널 메인 컨테이너 - 누락된 기능들 추가
import { ReactNode } from 'react';
import { Button, Modal, ModalContent, ModalBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { dispatchClosePreviewPanel } from './utils/eventHandlers';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useStoreData } from './hooks/useStoreData';
import { useDataTransformers } from './hooks/useDataTransformers';
import { usePreviewPanelState } from './hooks/usePreviewPanelState';
import { useTouchHandlers } from './hooks/useTouchHandlers';
import { useModalHandlers } from './hooks/useModalHandlers';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAdditionalState } from './hooks/useAdditionalState';
import StatusIndicatorComponent from './parts/StatusIndicatorComponent';
import PreviewContentComponent from './parts/PreviewContentComponent';
import MobileContentComponent from './parts/MobileContentComponent';
import DesktopContentComponent from './parts/DesktopContentComponent';

function PreviewPanelContainer(): ReactNode {
  console.log('🎯 PreviewPanelContainer 렌더링 시작');

  const { isMobile } = useMobileDetection();
  const storeData = useStoreData();

  // 추가 상태 관리
  const { hasTabChanged, setHasTabChanged, isMountedRef } =
    useAdditionalState();

  const {
    formData,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
  } = storeData;

  // localStorage 기능 추가
  useLocalStorage({
    isMobile,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
  });
  //====여기까지 수정됨====

  const transformedData = useDataTransformers({
    formData,
    editorCompletedContent,
    isEditorCompleted,
    editorContainers,
    editorParagraphs,
  });

  const {
    currentFormValues,
    displayContent,
    editorStatusInfo,
    heroImage,
    isUsingFallbackImage,
    tagArray,
    avatarProps,
    swiperKey,
    email,
    currentDate,
  } = transformedData;

  const { selectedMobileSize, setSelectedMobileSize } = usePreviewPanelState({
    isMobile,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
  });

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleHeaderClick,
  } = useTouchHandlers();

  const {
    isMobileModalOpen,
    isDesktopModalOpen,
    handleMobileModalOpen,
    handleMobileModalClose,
    handleDesktopModalOpen,
    handleDesktopModalClose,
  } = useModalHandlers();

  console.log('🎯 PreviewPanelContainer 렌더링 완료, 반환 시작');

  return (
    <>
      {/* 모바일 배경 오버레이 */}
      {isMobile && isPreviewPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => {
            console.log('🖱️ 배경 클릭 - 패널 닫기');
            dispatchClosePreviewPanel();
          }}
        />
      )}

      {/* 메인 패널 */}
      <div
        className={`
          ${
            isMobile
              ? 'fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-in-out preview-panel-bottom-sheet rounded-t-3xl'
              : 'relative preview-panel-desktop'
          }
          ${
            isMobile && !isPreviewPanelOpen
              ? 'translate-y-full'
              : 'translate-y-0'
          }
          ${isMobile ? 'h-[85vh] max-h-[85vh]' : ''}
        `}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* 모바일 헤더 */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl">
            <div
              className="flex justify-center pt-3 pb-2 cursor-pointer header-clickable"
              onClick={handleHeaderClick}
            >
              <div className="w-12 h-1 transition-all bg-gray-300 rounded-full hover:bg-gray-400 active:bg-gray-500 active:scale-95 drag-handle"></div>
            </div>

            <div
              className="flex items-center justify-between p-4 transition-colors border-b cursor-pointer header-clickable"
              onClick={handleHeaderClick}
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
                  dispatchClosePreviewPanel();
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
            media={currentFormValues.media}
            sliderImages={currentFormValues.sliderImages}
            customGalleryViews={customGalleryViews}
            editorStatusInfo={editorStatusInfo}
            displayContent={displayContent}
            isUsingFallbackImage={isUsingFallbackImage}
          />

          {/* 데스크탑 모달 버튼 */}
          {!isMobile && (
            <div className="flex justify-end gap-2 mb-4">
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                onPress={handleMobileModalOpen}
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
                onPress={handleDesktopModalOpen}
                startContent={<Icon icon="lucide:monitor" />}
                className="text-xs shadow-sm sm:text-sm"
                type="button"
                isDisabled={isDesktopModalOpen}
              >
                데스크탑뷰 보기
              </Button>
            </div>
          )}

          {/* 미리보기 콘텐츠 */}
          <PreviewContentComponent
            currentFormValues={currentFormValues}
            displayContent={displayContent}
            heroImage={heroImage}
            tagArray={tagArray}
            avatarProps={avatarProps}
            swiperKey={swiperKey}
            customGalleryViews={customGalleryViews}
          />

          {/* 모바일 모달 */}
          {isMobileModalOpen && (
            <Modal
              isOpen={isMobileModalOpen}
              onClose={handleMobileModalClose}
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
                        onPress={handleMobileModalClose}
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

          {/* 데스크탑 모달 */}
          {isDesktopModalOpen && (
            <Modal
              isOpen={isDesktopModalOpen}
              onClose={handleDesktopModalClose}
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
                        onPress={handleDesktopModalClose}
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
    </>
  );
}

export default PreviewPanelContainer;
