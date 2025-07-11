// 📁 imageUpload/hooks/useImageUploadHandlers.ts

import { useRef, useCallback } from 'react';
import { createLogger } from '../utils/loggerUtils';
import { useMainImageManagement } from '../../mainImage/hooks/useMainImageManagement';
import { useMainImageValidation } from '../../mainImage/hooks/useMainImageValidation';
import { useFileUploadState } from './useFileUploadState';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useMobileTouchState } from './useMobileTouchState';
import { useFileProcessing } from './useFileProcessing';
import type {
  FormValues,
  ToastItem,
} from '../../../../../../../store/shared/commonTypes';

const logger = createLogger('IMAGE_UPLOAD_HANDLERS');

type StateUpdaterFunction<T> = (previousValue: T) => T;

interface ToastMessage {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
}

interface FileProcessingCallbacks {
  updateMediaValue: (
    filesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  updateSelectedFileNames: (
    namesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  showToastMessage: (toast: unknown) => void;
  showDuplicateMessage: (files: File[]) => void;
  startFileUpload: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  completeFileUpload: (fileId: string, fileName: string) => void;
  failFileUpload: (fileId: string, fileName: string) => void;
}

interface ImageUploadHandlersProps {
  formValues: FormValues;
  uiState: {
    isMobile: boolean;
  };
  selectionState: {
    selectedFileNames: string[];
  };
  updateMediaValue: (
    filesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  setMainImageValue: (imageUrl: string) => void;
  updateSelectedFileNames: (
    namesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  showToastMessage: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void;
  imageGalleryStore: unknown;
}

interface FileSelectButtonElement {
  clickFileInput: () => void;
}

export const useImageUploadHandlers = ({
  formValues: currentFormValues,
  uiState: currentUiState,
  selectionState: currentSelectionState,
  updateMediaValue,
  setMainImageValue,
  updateSelectedFileNames,
  showToastMessage,
  imageGalleryStore: galleryStoreInstance,
}: ImageUploadHandlersProps) => {
  const { media: mediaFromForm } = currentFormValues;
  const currentMediaFilesList =
    mediaFromForm !== null && mediaFromForm !== undefined ? mediaFromForm : [];
  const { isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  const fileSelectButtonRef = useRef<FileSelectButtonElement | null>(null);

  logger.debug('useImageUploadHandlers 초기화 - 단순화된 콜백 체인', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isMobileDevice,
    hasGalleryStore:
      galleryStoreInstance !== null && galleryStoreInstance !== undefined,
    simplifiedCallbackChain: true,
    directStateUpdates: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  const mainImageManagementHook = useMainImageManagement({
    formValues: currentFormValues,
    setMainImageValue,
    addToast: showToastMessage,
  });

  const mainImageValidationHook = useMainImageValidation({
    formValues: currentFormValues,
  });

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

  const createSafeToastMessage = useCallback(
    (toast: Omit<ToastItem, 'id' | 'createdAt'>): ToastMessage => {
      const { title = '', description = '', color = 'primary' } = toast;

      const safeTitle = typeof title === 'string' ? title : 'Notification';
      const safeDescription =
        typeof description === 'string' ? description : '';

      const validColors = ['success', 'warning', 'danger', 'primary'] as const;
      type ValidColor = (typeof validColors)[number];

      const isValidColor = (colorValue: unknown): colorValue is ValidColor => {
        return (
          typeof colorValue === 'string' &&
          validColors.some((validColorItem) => validColorItem === colorValue)
        );
      };

      const safeColor = isValidColor(color) ? color : 'primary';

      return {
        title: safeTitle,
        description: safeDescription,
        color: safeColor,
      };
    },
    []
  );

  const displayToastMessage = useCallback(
    (toast: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const safeToast = createSafeToastMessage(toast);
      showToastMessage(safeToast);
    },
    [createSafeToastMessage, showToastMessage]
  );

  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      logger.debug('메인 이미지 설정 핸들러 호출 - 단순화된 처리', {
        imageIndex,
        imageUrlPreview,
        simplifiedProcessing: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const validationResult = validateMainImageSelectionFunction(imageUrl);
      const { isValid: isValidSelection, message: validationMessage } =
        validationResult;

      const isInvalidSelection = !isValidSelection;

      if (isInvalidSelection) {
        const safeValidationMessage =
          validationMessage !== null && validationMessage !== undefined
            ? validationMessage
            : '메인 이미지로 설정할 수 없습니다.';

        logger.warn('메인 이미지 설정 불가능', {
          imageIndex,
          imageUrlPreview,
          validationMessage: safeValidationMessage,
        });

        displayToastMessage({
          title: '메인 이미지 설정 불가',
          description: safeValidationMessage,
          color: 'warning',
        });
        return;
      }

      setImageAsMainImageDirectly(imageIndex);

      logger.info('메인 이미지 설정 완료 - 단순화된 처리', {
        imageIndex,
        imageUrlPreview,
        simplifiedProcessing: true,
        directUpdate: true,
      });
    },
    [
      validateMainImageSelectionFunction,
      setImageAsMainImageDirectly,
      displayToastMessage,
    ]
  );

  const handleMainImageCancel = useCallback(() => {
    logger.debug('메인 이미지 해제 핸들러 호출 - 단순화된 처리');

    cancelCurrentMainImage();

    logger.info('메인 이미지 해제 완료 - 단순화된 처리', {
      simplifiedProcessing: true,
      directUpdate: true,
    });
  }, [cancelCurrentMainImage]);

  const handleDeleteAction = useCallback(
    (imageIndex: number, imageName: string) => {
      logger.debug('실제 삭제 처리 - 단순화된 상태 업데이트', {
        imageIndex,
        imageName,
        simplifiedProcessing: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        const safeCurrentMediaFiles =
          currentMediaFilesList !== null && currentMediaFilesList !== undefined
            ? currentMediaFilesList
            : [];
        const safeCurrentSelectedFileNames =
          currentSelectedFileNames !== null &&
          currentSelectedFileNames !== undefined
            ? currentSelectedFileNames
            : [];

        const updatedMediaFiles = safeCurrentMediaFiles.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );
        const updatedFileNames = safeCurrentSelectedFileNames.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );

        console.log('🔍 [DELETE_DEBUG] 단순화된 삭제 처리:', {
          이미지명: imageName,
          이미지인덱스: imageIndex,
          이전미디어개수: safeCurrentMediaFiles.length,
          새미디어개수: updatedMediaFiles.length,
          이전파일명개수: safeCurrentSelectedFileNames.length,
          새파일명개수: updatedFileNames.length,
          단순화된처리: true,
          directUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        updateMediaValue(() => updatedMediaFiles);
        updateSelectedFileNames(() => updatedFileNames);

        displayToastMessage({
          title: '이미지 삭제 완료',
          description: `"${imageName}" 이미지가 삭제되었습니다.`,
          color: 'success',
        });

        logger.info('이미지 삭제 완료 - 단순화된 처리', {
          imageName,
          remainingMediaCount: updatedMediaFiles.length,
          simplifiedProcessing: true,
          directUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (deleteError) {
        const errorMessage =
          deleteError instanceof Error
            ? deleteError.message
            : 'Unknown delete error';

        logger.error('삭제 처리 중 오류', {
          imageName,
          error: errorMessage,
        });

        displayToastMessage({
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
      displayToastMessage,
    ]
  );

  const deleteConfirmation = useDeleteConfirmation(handleDeleteAction);

  const createSafeToastFromUnknown = useCallback(
    (toast: unknown): ToastMessage => {
      const hasToastValue = toast !== null && toast !== undefined;
      const isToastObject = hasToastValue && typeof toast === 'object';

      const titleProperty = isToastObject
        ? Reflect.get(toast, 'title')
        : undefined;
      const descriptionProperty = isToastObject
        ? Reflect.get(toast, 'description')
        : undefined;
      const colorProperty = isToastObject
        ? Reflect.get(toast, 'color')
        : undefined;

      const title =
        typeof titleProperty === 'string' ? titleProperty : 'Notification';
      const description =
        typeof descriptionProperty === 'string' ? descriptionProperty : '';

      type ValidToastColor = 'success' | 'warning' | 'danger' | 'primary';
      const validToastColors: ValidToastColor[] = [
        'success',
        'warning',
        'danger',
        'primary',
      ];

      const isValidToastColor = (
        colorValue: unknown
      ): colorValue is ValidToastColor => {
        return (
          typeof colorValue === 'string' &&
          validToastColors.some((validColor) => validColor === colorValue)
        );
      };

      const color = isValidToastColor(colorProperty)
        ? colorProperty
        : 'primary';

      return { title, description, color };
    },
    []
  );

  const fileProcessingCallbacks: FileProcessingCallbacks = {
    updateMediaValue: (filesOrUpdater) => {
      console.log('🔍 [CALLBACK_DEBUG] 단순화된 updateMediaValue 콜백:', {
        입력타입:
          typeof filesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        단순화된처리: true,
        directCallbackExecution: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      updateMediaValue(filesOrUpdater);
    },

    updateSelectedFileNames: (namesOrUpdater) => {
      console.log(
        '🔍 [CALLBACK_DEBUG] 단순화된 updateSelectedFileNames 콜백:',
        {
          입력타입:
            typeof namesOrUpdater === 'function'
              ? '함수형업데이터'
              : '직접배열',
          단순화된처리: true,
          directCallbackExecution: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      updateSelectedFileNames(namesOrUpdater);
    },

    showToastMessage: (toast: unknown) => {
      const safeToastData = createSafeToastFromUnknown(toast);
      showToastMessage(safeToastData);
    },

    showDuplicateMessage: duplicateHandler.showDuplicateMessage,
    startFileUpload: uploadState.startFileUpload,
    updateFileProgress: uploadState.updateFileProgress,
    completeFileUpload: uploadState.completeFileUpload,
    failFileUpload: uploadState.failFileUpload,
  };

  const fileProcessing = useFileProcessing(
    currentMediaFilesList,
    currentSelectedFileNames !== null && currentSelectedFileNames !== undefined
      ? currentSelectedFileNames
      : [],
    fileProcessingCallbacks
  );

  const handleFileSelectClick = useCallback(() => {
    const { hasActiveUploads } = uploadState;

    logger.debug('handleFileSelectClick - 단순화된 처리', {
      hasActiveUploads,
      simplifiedProcessing: true,
      timestamp: new Date().toLocaleTimeString(),
    });

    const isUploadInProgress = hasActiveUploads;

    if (isUploadInProgress) {
      logger.warn('업로드 중이므로 파일 선택 무시');
      displayToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const hasClickFunction =
      fileSelectButtonElement !== null &&
      fileSelectButtonElement !== undefined &&
      typeof fileSelectButtonElement.clickFileInput === 'function';

    const clickAction = hasClickFunction ? 'execute-click' : 'skip-click';

    if (hasClickFunction) {
      logger.debug('파일 선택 버튼 클릭 실행', { clickAction });
      fileSelectButtonElement.clickFileInput();
    } else {
      logger.warn('파일 선택 버튼 참조가 유효하지 않음', { clickAction });
    }
  }, [uploadState.hasActiveUploads, displayToastMessage]);

  const validateHandlersState = useCallback((): boolean => {
    const hasMainImageManagement =
      mainImageManagementHook !== null && mainImageManagementHook !== undefined;
    const hasMainImageValidation =
      mainImageValidationHook !== null && mainImageValidationHook !== undefined;
    const hasUploadState = uploadState !== null && uploadState !== undefined;
    const hasFileProcessing =
      fileProcessing !== null && fileProcessing !== undefined;

    const isValidState =
      hasMainImageManagement &&
      hasMainImageValidation &&
      hasUploadState &&
      hasFileProcessing;

    logger.debug('핸들러 상태 검증 - 단순화된 구조', {
      hasMainImageManagement,
      hasMainImageValidation,
      hasUploadState,
      hasFileProcessing,
      isValidState,
      simplifiedStructure: true,
    });

    return isValidState;
  }, [
    mainImageManagementHook,
    mainImageValidationHook,
    uploadState,
    fileProcessing,
  ]);

  logger.info('useImageUploadHandlers 초기화 완료 - 단순화된 콜백 체인', {
    hasMainImageManagement:
      mainImageManagementHook !== null && mainImageManagementHook !== undefined,
    hasMainImageValidation:
      mainImageValidationHook !== null && mainImageValidationHook !== undefined,
    uploadingCount: Object.keys(uploadState.uploading).length,
    hasGalleryStore:
      galleryStoreInstance !== null && galleryStoreInstance !== undefined,
    simplifiedCallbackChain: true,
    directStateUpdates: true,
    noComplexConversions: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    uploading: uploadState.uploading,
    uploadStatus: uploadState.uploadStatus,
    hasActiveUploads: uploadState.hasActiveUploads,
    deleteConfirmState: deleteConfirmation.deleteConfirmState,
    duplicateMessageState: duplicateHandler.duplicateMessageState,
    touchActiveImages: mobileTouchState.touchActiveImages,

    fileSelectButtonRef,

    handleFiles: fileProcessing.processFiles,
    handleFilesDropped: fileProcessing.handleFilesDropped,
    handleFileSelectClick,
    handleFileChange: fileProcessing.handleFileChange,
    handleDeleteButtonClick: deleteConfirmation.showDeleteConfirmation,
    handleDeleteConfirm: deleteConfirmation.confirmDelete,
    handleDeleteCancel: deleteConfirmation.cancelDelete,
    handleImageTouch: mobileTouchState.handleImageTouch,

    handleMainImageSet,
    handleMainImageCancel,

    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,

    currentMediaFilesList,
    currentSelectedFileNames:
      currentSelectedFileNames !== null &&
      currentSelectedFileNames !== undefined
        ? currentSelectedFileNames
        : [],
    isMobileDevice,

    imageGalleryStore: galleryStoreInstance,

    validateHandlersState,
  };
};
