// 📁 blogMediaStep/imageUpload/ImageUploadContainer.tsx

import React from 'react';
import { Progress } from '@heroui/react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageUploadHandlers } from './hooks/useImageUploadHandlers';
import { type MainImageHandlers } from './types/imageUploadTypes';
import FileDropZone from './parts/FileDropZone';
import FileSelectButton from './parts/FileSelectButton';
import UploadedImageSection from './parts/UploadedImageSection';
import MobileTip from './parts/MobileTip';

function ImageUploadContainer(): React.ReactNode {
  console.log('🚀 ImageUploadContainer 렌더링 시작 - Props전달구조변경:', {
    timestamp: new Date().toLocaleTimeString(),
    componentName: 'ImageUploadContainer',
  });

  // 🔧 핵심 수정: useBlogMediaStepState를 한 곳에서만 호출
  const blogMediaStepStateHook = useBlogMediaStepState();
  const {
    formValues: currentFormValuesData,
    uiState: currentUiState,
    selectionState: currentSelectionState,
    setMediaValue: updateMediaValue,
    setMainImageValue: updateMainImageValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    imageGalleryStore: galleryStoreInstance,
  } = blogMediaStepStateHook;

  // 🔧 Props로 전달하여 중복 훅 호출 방지
  const imageUploadHandlersHook = useImageUploadHandlers({
    formValues: currentFormValuesData,
    uiState: currentUiState,
    selectionState: currentSelectionState,
    updateMediaValue,
    setMainImageValue: updateMainImageValue,
    updateSelectedFileNames,
    showToastMessage,
    imageGalleryStore: galleryStoreInstance,
  });

  const {
    uploading: currentUploadProgressMap,
    uploadStatus: currentUploadStatusMap,
    hasActiveUploads: isCurrentlyUploading,
    deleteConfirmState: deleteConfirmationModalState,
    duplicateMessageState: duplicateAlertMessageState,
    touchActiveImages: touchActivatedImageSet,
    fileSelectButtonRef: fileInputElementRef,
    handleFilesDropped: handleFileListDroppedEvent,
    handleFileSelectClick: handleFileSelectionButtonClick,
    handleFileChange: handleFileInputChangeEvent,
    handleDeleteButtonClick: handleDeleteButtonClickEvent,
    handleDeleteConfirm: handleDeleteConfirmationSubmit,
    handleDeleteCancel: handleDeleteCancellationAction,
    handleImageTouch: handleImageTouchInteraction,
    currentMediaFilesList: uploadedMediaFileUrlList,
    currentSelectedFileNames: selectedFileNameList,
    isMobileDevice: isMobileUserAgent,

    // 메인 이미지 관련 핸들러들
    handleMainImageSet: handleMainImageSetAction,
    handleMainImageCancel: handleMainImageCancelAction,
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
  } = imageUploadHandlersHook;

  // 메인 이미지 핸들러 타입 체크
  const isMainImageSetHandlerValid =
    typeof handleMainImageSetAction === 'function';
  const isMainImageCancelHandlerValid =
    typeof handleMainImageCancelAction === 'function';
  const isCheckIsMainHandlerValid =
    typeof checkIsMainImageFunction === 'function';
  const isCheckCanSetHandlerValid =
    typeof checkCanSetAsMainImageFunction === 'function';

  console.log(
    '📊 ImageUploadHandlers 훅 데이터 로드 완료 - Props전달구조변경:',
    {
      uploadProgressMapSize: Object.keys(currentUploadProgressMap).length,
      uploadStatusMapSize: Object.keys(currentUploadStatusMap).length,
      isCurrentlyUploading,
      isDeleteConfirmVisible: deleteConfirmationModalState.isVisible,
      touchActiveImageCount: touchActivatedImageSet.size,
      isDuplicateMessageVisible: duplicateAlertMessageState.isVisible,
      uploadedMediaFileCount: uploadedMediaFileUrlList.length,
      isMobileUserAgent,
      isMainImageSetHandlerValid,
      isMainImageCancelHandlerValid,
      isCheckIsMainHandlerValid,
      isCheckCanSetHandlerValid,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  // 메인 이미지 핸들러 객체 구성
  const mainImageHandlersObject: MainImageHandlers | undefined =
    isMainImageSetHandlerValid &&
    isMainImageCancelHandlerValid &&
    isCheckIsMainHandlerValid &&
    isCheckCanSetHandlerValid
      ? {
          onMainImageSet: handleMainImageSetAction,
          onMainImageCancel: handleMainImageCancelAction,
          checkIsMainImage: checkIsMainImageFunction,
          checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
        }
      : undefined;

  const hasCompleteMainImageHandlers =
    typeof mainImageHandlersObject === 'object' &&
    mainImageHandlersObject !== null;

  console.log('📊 메인 이미지 핸들러 객체 구성 완료 - Props전달구조변경:', {
    hasCompleteMainImageHandlers,
    handlersValidation: {
      setHandlerValid: isMainImageSetHandlerValid,
      cancelHandlerValid: isMainImageCancelHandlerValid,
      checkIsMainHandlerValid: isCheckIsMainHandlerValid,
      checkCanSetHandlerValid: isCheckCanSetHandlerValid,
    },
    timestamp: new Date().toLocaleTimeString(),
  });

  const renderUploadProgressSection = () => {
    console.log('🔄 renderUploadProgressSection 호출:', {
      isCurrentlyUploading,
      progressMapEntries: Object.entries(currentUploadProgressMap).length,
    });

    return isCurrentlyUploading ? (
      <section
        role="status"
        aria-labelledby="upload-progress-section-title"
        aria-live="polite"
        className="p-4 space-y-3 border border-blue-200 rounded-lg bg-blue-50"
      >
        <h3
          id="upload-progress-section-title"
          className="flex items-center gap-2 text-sm font-semibold text-blue-900"
        >
          <div className="w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          업로드 진행 중...
        </h3>

        <div className="space-y-3">
          {Object.entries(currentUploadProgressMap).map(
            ([fileIdentifier, progressPercentage]) => {
              console.log('🔄 업로드 진행률 아이템 렌더링:', {
                fileIdentifier,
                progressPercentage,
                timestamp: new Date().toLocaleTimeString(),
              });

              const roundedProgressPercentage = Math.round(progressPercentage);

              return (
                <div key={fileIdentifier} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-800">
                      파일 업로드 중
                    </span>
                    <span className="font-bold text-blue-600">
                      {roundedProgressPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    color="primary"
                    size="sm"
                    aria-label={`파일 업로드 진행률 ${roundedProgressPercentage}%`}
                    classNames={{
                      base: 'w-full',
                      track: 'bg-blue-200',
                      indicator:
                        'transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-blue-600',
                    }}
                  />
                </div>
              );
            }
          )}
        </div>
      </section>
    ) : null;
  };

  const renderFileDropZoneSection = () => {
    console.log('🔄 renderFileDropZoneSection 호출:', {
      isCurrentlyUploading,
      timestamp: new Date().toLocaleTimeString(),
    });

    return (
      <FileDropZone
        dragActive={false}
        setDragActive={(isDragActive: boolean) => {
          console.log('🔧 FileDropZone setDragActive 호출:', {
            isDragActive,
            timestamp: new Date().toLocaleTimeString(),
          });
        }}
        onFilesDropped={handleFileListDroppedEvent}
        onFileSelectClick={handleFileSelectionButtonClick}
        isUploading={isCurrentlyUploading}
        className="transition-all duration-300 hover:shadow-lg hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
      />
    );
  };

  const renderFileSelectButtonSection = () => {
    console.log('🔄 renderFileSelectButtonSection 호출:', {
      isCurrentlyUploading,
      hasFileInputRef:
        fileInputElementRef !== null && fileInputElementRef !== undefined,
    });

    return (
      <FileSelectButton
        ref={fileInputElementRef}
        onFileChange={handleFileInputChangeEvent}
        multiple={true}
        disabled={isCurrentlyUploading}
      />
    );
  };

  const renderUploadedImageManagementSection = () => {
    console.log(
      '🔄 renderUploadedImageManagementSection 호출 - Props전달구조변경:',
      {
        uploadedImageCount: uploadedMediaFileUrlList.length,
        selectedFileNameCount: selectedFileNameList.length,
        isMobileUserAgent,
        hasCompleteMainImageHandlers,
      }
    );

    return (
      <UploadedImageSection
        mediaFiles={uploadedMediaFileUrlList}
        selectedFileNames={selectedFileNameList}
        deleteConfirmState={deleteConfirmationModalState}
        duplicateMessageState={duplicateAlertMessageState}
        touchActiveImages={touchActivatedImageSet}
        isMobileDevice={isMobileUserAgent}
        onDeleteButtonClick={handleDeleteButtonClickEvent}
        onDeleteConfirm={handleDeleteConfirmationSubmit}
        onDeleteCancel={handleDeleteCancellationAction}
        onImageTouch={handleImageTouchInteraction}
        // 메인 이미지 핸들러 전달
        mainImageHandlers={mainImageHandlersObject}
      />
    );
  };

  const renderMobileTipSection = () => {
    console.log('🔄 renderMobileTipSection 호출:', {
      isMobileUserAgent,
      shouldShow: isMobileUserAgent,
    });

    return isMobileUserAgent ? (
      <MobileTip isMobileDevice={isMobileUserAgent} />
    ) : null;
  };

  console.log('🎨 ImageUploadContainer 최종 렌더링 준비 - Props전달구조변경:', {
    isCurrentlyUploading,
    uploadedImageCount: uploadedMediaFileUrlList.length,
    isMobileUserAgent,
    hasDeleteConfirm: deleteConfirmationModalState.isVisible,
    hasDuplicateMessage: duplicateAlertMessageState.isVisible,
    hasCompleteMainImageHandlers,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className="space-y-6"
      role="region"
      aria-labelledby="image-upload-main-section-title"
      aria-describedby="image-upload-main-section-description"
    >
      <header className="sr-only">
        <h2 id="image-upload-main-section-title">이미지 업로드 및 관리 섹션</h2>
        <p id="image-upload-main-section-description">
          드래그 앤 드롭 또는 파일 선택 버튼을 통해 이미지를 업로드하고 관리할
          수 있습니다. 업로드된 이미지는 메인 이미지로 설정할 수 있습니다.
        </p>
      </header>

      <main className="space-y-4">
        {renderFileDropZoneSection()}

        {renderFileSelectButtonSection()}

        {renderUploadProgressSection()}

        {renderUploadedImageManagementSection()}

        {renderMobileTipSection()}
      </main>
    </section>
  );
}

export default ImageUploadContainer;
