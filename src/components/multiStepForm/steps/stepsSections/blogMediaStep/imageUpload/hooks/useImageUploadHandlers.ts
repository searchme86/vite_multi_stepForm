// blogMediaStep/imageUpload/hooks/useImageUploadHandlers.ts

import { useRef, useCallback } from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useMainImageManagement } from '../../mainImage/hooks/useMainImageManagement';
import { useMainImageValidation } from '../../mainImage/hooks/useMainImageValidation';
import { useFileUploadState } from './useFileUploadState';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useMobileTouchState } from './useMobileTouchState';
import { useFileProcessing } from './useFileProcessing';
import type { ImageViewConfig } from '../../../../../../../store/shared/commonTypes';

export const useImageUploadHandlers = () => {
  const {
    formValues: currentFormValues,
    uiState: currentUiState,
    setMediaValue: updateMediaValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    selectionState: currentSelectionState,
    imageGalleryStore: galleryStoreInstance, // ✅ Zustand 스토어 추가
  } = useBlogMediaStepState();

  const { media: currentMediaFilesList } = currentFormValues;
  const { isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  const fileSelectButtonRef = useRef<any>(null);

  console.log(
    '🔧 [MAIN_HANDLERS] useImageUploadHandlers 초기화 - Zustand연동:',
    {
      currentMediaFilesCount: currentMediaFilesList.length,
      currentSelectedFileNamesCount: currentSelectedFileNames.length,
      isMobileDevice,
      hasGalleryStore: galleryStoreInstance ? true : false,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  // ✅ 새로 추가: Zustand 갤러리 스토어 업데이트 함수
  const updateImageGalleryStore = useCallback(
    (config: Partial<ImageViewConfig>) => {
      if (!galleryStoreInstance) {
        console.log('⚠️ [GALLERY_STORE] 갤러리 스토어 인스턴스가 없음');
        return;
      }

      try {
        // 타입 안전한 메서드 접근
        const updateImageViewConfig = Reflect.get(
          galleryStoreInstance,
          'updateImageViewConfig'
        );

        if (typeof updateImageViewConfig !== 'function') {
          console.error(
            '❌ [GALLERY_STORE] updateImageViewConfig가 함수가 아님'
          );
          return;
        }

        updateImageViewConfig(config);

        console.log('✅ [GALLERY_STORE] 이미지 갤러리 스토어 업데이트 완료:', {
          selectedImagesCount: config.selectedImages?.length || 0,
          clickOrderLength: config.clickOrder?.length || 0,
          hasLayout: config.layout ? true : false,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (storeError) {
        console.error('❌ [GALLERY_STORE] 스토어 업데이트 실패:', {
          error: storeError,
          config,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [galleryStoreInstance]
  );

  // ✅ 새로 추가: 이미지 삭제 시 Zustand 동기화
  const syncImageDeletionToStore = useCallback(
    (updatedMediaFiles: string[], deletedImageUrl: string) => {
      const { mainImage } = currentFormValues;
      const isMainImageDeleted = mainImage === deletedImageUrl;

      // 메인 이미지가 삭제된 경우 clickOrder 재조정
      let updatedClickOrder = updatedMediaFiles.map(
        (_, imageIndex) => imageIndex
      );

      if (isMainImageDeleted && updatedMediaFiles.length > 0) {
        // 메인 이미지가 삭제되면 첫 번째 이미지를 메인으로 설정
        updatedClickOrder = [0, ...updatedClickOrder.slice(1)];

        console.log(
          '🏠 [MAIN_IMAGE_DELETED] 메인 이미지 삭제로 인한 clickOrder 재조정:',
          {
            deletedImageUrl: deletedImageUrl.slice(0, 30) + '...',
            newMainImageIndex: 0,
            newClickOrder: updatedClickOrder,
          }
        );
      }

      const galleryConfig: Partial<ImageViewConfig> = {
        selectedImages: updatedMediaFiles,
        clickOrder: updatedClickOrder,
      };

      updateImageGalleryStore(galleryConfig);
    },
    [currentFormValues, updateImageGalleryStore]
  );

  // ✅ 새로 추가: 메인 이미지 설정 시 Zustand 동기화
  const syncMainImageToStore = useCallback(
    (imageIndex: number, imageUrl: string) => {
      // 메인 이미지를 clickOrder의 첫 번째로 이동
      const currentClickOrder = currentMediaFilesList.map((_, index) => index);
      const newClickOrder = [
        imageIndex,
        ...currentClickOrder.filter((index) => index !== imageIndex),
      ];

      const galleryConfig: Partial<ImageViewConfig> = {
        selectedImages: currentMediaFilesList,
        clickOrder: newClickOrder,
      };

      updateImageGalleryStore(galleryConfig);

      console.log('🏠 [MAIN_IMAGE_SET] 메인 이미지 설정 Zustand 동기화:', {
        imageIndex,
        imageUrlPreview: imageUrl.slice(0, 30) + '...',
        newClickOrder,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [currentMediaFilesList, updateImageGalleryStore]
  );

  // ✅ Phase1: 메인 이미지 관리 로직 추가
  const mainImageManagementHook = useMainImageManagement();
  const mainImageValidationHook = useMainImageValidation();

  const {
    setAsMainImageDirect: setImageAsMainImageDirectly,
    cancelMainImage: cancelCurrentMainImage,
    isMainImage: checkIsMainImageFunction,
  } = mainImageManagementHook;

  const {
    canSetAsMainImage: checkCanSetAsMainImageFunction,
    validateMainImageSelection: validateMainImageSelectionFunction,
  } = mainImageValidationHook;

  const uploadState = useFileUploadState();
  const duplicateHandler = useDuplicateFileHandler();
  const mobileTouchState = useMobileTouchState(isMobileDevice);

  // ✅ Phase2: 메인 이미지 설정 핸들러 + Zustand 동기화 추가
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      console.log(
        '🏠 [MAIN_IMAGE_SET] 메인 이미지 설정 핸들러 호출 - Zustand연동:',
        {
          imageIndex,
          imageUrlPreview,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      const validationResult = validateMainImageSelectionFunction(imageUrl);
      const { isValid: isValidSelection, message: validationMessage } =
        validationResult;

      if (!isValidSelection) {
        console.log('❌ [MAIN_IMAGE_SET] 메인 이미지 설정 불가능:', {
          imageIndex,
          imageUrlPreview,
          validationMessage,
        });

        showToastMessage({
          title: '메인 이미지 설정 불가',
          description: validationMessage ?? '메인 이미지로 설정할 수 없습니다.',
          color: 'warning',
        });
        return;
      }

      // ✅ 기존 로직: React Hook Form 업데이트
      setImageAsMainImageDirectly(imageIndex);

      // ✅ 새로 추가: Zustand 스토어 동기화
      syncMainImageToStore(imageIndex, imageUrl);

      console.log(
        '✅ [MAIN_IMAGE_SET] 메인 이미지 설정 및 Zustand 동기화 완료:',
        {
          imageIndex,
          imageUrlPreview,
          zustandSyncCompleted: true,
        }
      );
    },
    [
      validateMainImageSelectionFunction,
      setImageAsMainImageDirectly,
      showToastMessage,
      syncMainImageToStore,
    ]
  );

  // ✅ Phase2: 메인 이미지 해제 핸들러 + Zustand 동기화 추가
  const handleMainImageCancel = useCallback(() => {
    console.log(
      '❌ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 핸들러 호출 - Zustand연동'
    );

    // ✅ 기존 로직: React Hook Form 업데이트
    cancelCurrentMainImage();

    // ✅ 새로 추가: Zustand 스토어 동기화 (메인 이미지 없이 일반 순서로)
    const normalClickOrder = currentMediaFilesList.map((_, index) => index);
    const galleryConfig: Partial<ImageViewConfig> = {
      selectedImages: currentMediaFilesList,
      clickOrder: normalClickOrder,
    };

    updateImageGalleryStore(galleryConfig);

    console.log(
      '✅ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 및 Zustand 동기화 완료:',
      {
        resetClickOrder: normalClickOrder,
        zustandSyncCompleted: true,
      }
    );
  }, [cancelCurrentMainImage, currentMediaFilesList, updateImageGalleryStore]);

  // ✅ 기존 삭제 액션 핸들러 + Zustand 동기화 추가
  const handleDeleteAction = useCallback(
    (imageIndex: number, imageName: string) => {
      console.log('✅ [DELETE_ACTION] 실제 삭제 처리 - Zustand연동:', {
        imageIndex,
        imageName,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        const deletedImageUrl = currentMediaFilesList[imageIndex];

        const updatedMediaFiles = currentMediaFilesList.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );
        const updatedFileNames = currentSelectedFileNames.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );

        // ✅ 기존 로직: React Hook Form 업데이트
        updateMediaValue(updatedMediaFiles);
        updateSelectedFileNames(updatedFileNames);

        // ✅ 새로 추가: Zustand 스토어 동기화
        if (deletedImageUrl) {
          syncImageDeletionToStore(updatedMediaFiles, deletedImageUrl);
        }

        showToastMessage({
          title: '이미지 삭제 완료',
          description: `"${imageName}" 이미지가 삭제되었습니다.`,
          color: 'success',
        });

        console.log('✅ [DELETE] 이미지 삭제 및 Zustand 동기화 완료:', {
          imageName,
          remainingMediaCount: updatedMediaFiles.length,
          zustandSyncCompleted: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (deleteError) {
        console.error('❌ [DELETE_ERROR] 삭제 처리 중 오류:', {
          imageName,
          error: deleteError,
        });

        showToastMessage({
          title: '삭제 실패',
          description: '이미지 삭제 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [
      currentMediaFilesList,
      currentSelectedFileNames,
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      syncImageDeletionToStore,
    ]
  );

  const deleteConfirmation = useDeleteConfirmation(handleDeleteAction);

  const fileProcessing = useFileProcessing(
    currentMediaFilesList,
    currentSelectedFileNames,
    {
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      showDuplicateMessage: duplicateHandler.showDuplicateMessage,
      startFileUpload: uploadState.startFileUpload,
      updateFileProgress: uploadState.updateFileProgress,
      completeFileUpload: uploadState.completeFileUpload,
      failFileUpload: uploadState.failFileUpload,
      // ✅ 새로 추가: Zustand 스토어 업데이트 콜백 전달
      updateImageGalleryStore,
    }
  );

  const handleFileSelectClick = useCallback(() => {
    const hasActiveUploads = uploadState.hasActiveUploads;

    console.log('🚨 [CLICK] handleFileSelectClick:', {
      hasActiveUploads,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (hasActiveUploads) {
      console.log('⚠️ [CLICK] 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const hasClickFunction = fileSelectButtonElement?.clickFileInput;

    if (hasClickFunction) {
      fileSelectButtonElement.clickFileInput();
    }
  }, [uploadState.hasActiveUploads, showToastMessage]);

  console.log(
    '✅ [MAIN_HANDLERS] useImageUploadHandlers 초기화 완료 - Zustand연동:',
    {
      hasMainImageManagement: mainImageManagementHook ? true : false,
      hasMainImageValidation: mainImageValidationHook ? true : false,
      uploadingCount: Object.keys(uploadState.uploading).length,
      hasGalleryStore: galleryStoreInstance ? true : false,
      zustandSyncEnabled: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  return {
    // 기존 상태들
    uploading: uploadState.uploading,
    uploadStatus: uploadState.uploadStatus,
    hasActiveUploads: uploadState.hasActiveUploads,
    deleteConfirmState: deleteConfirmation.deleteConfirmState,
    duplicateMessageState: duplicateHandler.duplicateMessageState,
    touchActiveImages: mobileTouchState.touchActiveImages,

    // Refs
    fileSelectButtonRef,

    // 기존 핸들러들
    handleFiles: fileProcessing.processFiles,
    handleFilesDropped: fileProcessing.handleFilesDropped,
    handleFileSelectClick,
    handleFileChange: fileProcessing.handleFileChange,
    handleDeleteButtonClick: deleteConfirmation.showDeleteConfirmation,
    handleDeleteConfirm: deleteConfirmation.confirmDelete,
    handleDeleteCancel: deleteConfirmation.cancelDelete,
    handleImageTouch: mobileTouchState.handleImageTouch,

    // ✅ Phase2: 새로 추가된 메인 이미지 관리 핸들러들
    handleMainImageSet,
    handleMainImageCancel,

    // ✅ Phase2: 메인 이미지 상태 체크 함수들
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,

    // 기타 상태
    currentMediaFilesList,
    currentSelectedFileNames,
    isMobileDevice,

    // ✅ 새로 추가: Zustand 관련 함수들
    updateImageGalleryStore,
  };
};
