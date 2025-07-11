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

// 🔧 핵심 수정: 함수형 상태 업데이트를 지원하는 타입 정의
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

  logger.debug('useImageUploadHandlers 초기화 - 함수형 업데이트 지원', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isMobileDevice,
    hasGalleryStore:
      galleryStoreInstance !== null && galleryStoreInstance !== undefined,
    functionalUpdateSupported: true,
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

  // 🔧 타입 안전한 Toast 메시지 변환 함수
  const createSafeToastMessage = useCallback(
    (toast: Omit<ToastItem, 'id' | 'createdAt'>): ToastMessage => {
      const { title = '', description = '', color = 'primary' } = toast;

      const safeTitle = typeof title === 'string' ? title : 'Notification';
      const safeDescription =
        typeof description === 'string' ? description : '';

      // 🔧 타입 가드를 사용한 안전한 색상 검증
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

      logger.debug('메인 이미지 설정 핸들러 호출 - 함수형 업데이트 지원', {
        imageIndex,
        imageUrlPreview,
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

      logger.info('메인 이미지 설정 완료 (자동 동기화 대기)', {
        imageIndex,
        imageUrlPreview,
        reactHookFormUpdated: true,
        zustandAutoSyncPending: true,
      });
    },
    [
      validateMainImageSelectionFunction,
      setImageAsMainImageDirectly,
      displayToastMessage,
    ]
  );

  const handleMainImageCancel = useCallback(() => {
    logger.debug('메인 이미지 해제 핸들러 호출 - 함수형 업데이트 지원');

    cancelCurrentMainImage();

    logger.info('메인 이미지 해제 완료 (자동 동기화 대기)', {
      reactHookFormUpdated: true,
      zustandAutoSyncPending: true,
    });
  }, [cancelCurrentMainImage]);

  const handleDeleteAction = useCallback(
    (imageIndex: number, imageName: string) => {
      logger.debug('실제 삭제 처리 - 함수형 업데이트 지원', {
        imageIndex,
        imageName,
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

        // 🔧 핵심 수정: 함수형 업데이트 방식으로 호출
        console.log('🔍 [DELETE_DEBUG] 함수형 업데이트로 삭제 처리:', {
          이미지명: imageName,
          이미지인덱스: imageIndex,
          이전미디어개수: safeCurrentMediaFiles.length,
          새미디어개수: updatedMediaFiles.length,
          이전파일명개수: safeCurrentSelectedFileNames.length,
          새파일명개수: updatedFileNames.length,
          함수형업데이트사용: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        updateMediaValue(() => updatedMediaFiles);
        updateSelectedFileNames(() => updatedFileNames);

        displayToastMessage({
          title: '이미지 삭제 완료',
          description: `"${imageName}" 이미지가 삭제되었습니다.`,
          color: 'success',
        });

        logger.info('이미지 삭제 완료 (자동 동기화 대기) - 함수형 업데이트', {
          imageName,
          remainingMediaCount: updatedMediaFiles.length,
          reactHookFormUpdated: true,
          zustandAutoSyncPending: true,
          functionalUpdateUsed: true,
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

  // 🔧 핵심 수정: 함수형 상태 업데이트를 지원하는 콜백 구현
  const fileProcessingCallbacks: FileProcessingCallbacks = {
    updateMediaValue: (filesOrUpdater) => {
      console.log('🔍 [CALLBACK_DEBUG] updateMediaValue 콜백 호출:', {
        입력타입:
          typeof filesOrUpdater === 'function'
            ? '함수형 업데이터'
            : '직접 배열',
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const isUpdaterFunction = typeof filesOrUpdater === 'function';

      if (isUpdaterFunction) {
        console.log('🔍 [CALLBACK_DEBUG] 함수형 업데이터 감지, 직접 전달:', {
          업데이터함수: true,
          timestamp: new Date().toLocaleTimeString(),
        });
        updateMediaValue(filesOrUpdater);
      } else {
        console.log('🔍 [CALLBACK_DEBUG] 직접 배열 감지, 함수형으로 변환:', {
          배열길이: filesOrUpdater.length,
          timestamp: new Date().toLocaleTimeString(),
        });
        updateMediaValue(() => filesOrUpdater);
      }
    },

    updateSelectedFileNames: (namesOrUpdater) => {
      console.log('🔍 [CALLBACK_DEBUG] updateSelectedFileNames 콜백 호출:', {
        입력타입:
          typeof namesOrUpdater === 'function'
            ? '함수형 업데이터'
            : '직접 배열',
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const isUpdaterFunction = typeof namesOrUpdater === 'function';

      if (isUpdaterFunction) {
        console.log('🔍 [CALLBACK_DEBUG] 함수형 업데이터 감지, 직접 전달:', {
          업데이터함수: true,
          timestamp: new Date().toLocaleTimeString(),
        });
        updateSelectedFileNames(namesOrUpdater);
      } else {
        console.log('🔍 [CALLBACK_DEBUG] 직접 배열 감지, 함수형으로 변환:', {
          배열길이: namesOrUpdater.length,
          timestamp: new Date().toLocaleTimeString(),
        });
        updateSelectedFileNames(() => namesOrUpdater);
      }
    },

    showToastMessage: (toast: unknown) => {
      // unknown을 안전하게 처리하여 Toast 형식으로 변환
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

      // 🔧 타입 가드를 사용한 안전한 색상 처리
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

      const safeToastData = { title, description, color };
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

    logger.debug('handleFileSelectClick', {
      hasActiveUploads,
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

    logger.debug('핸들러 상태 검증', {
      hasMainImageManagement,
      hasMainImageValidation,
      hasUploadState,
      hasFileProcessing,
      isValidState,
    });

    return isValidState;
  }, [
    mainImageManagementHook,
    mainImageValidationHook,
    uploadState,
    fileProcessing,
  ]);

  logger.info('useImageUploadHandlers 초기화 완료 - 함수형 업데이트 지원', {
    hasMainImageManagement:
      mainImageManagementHook !== null && mainImageManagementHook !== undefined,
    hasMainImageValidation:
      mainImageValidationHook !== null && mainImageValidationHook !== undefined,
    uploadingCount: Object.keys(uploadState.uploading).length,
    hasGalleryStore:
      galleryStoreInstance !== null && galleryStoreInstance !== undefined,
    reactHookFormCentricSync: true,
    functionalUpdateSupported: true,
    timestamp: new Date().toLocaleTimeString(),
  });

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

    // 메인 이미지 관리 핸들러들
    handleMainImageSet,
    handleMainImageCancel,

    // 메인 이미지 상태 체크 함수들
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,

    // 기타 상태
    currentMediaFilesList,
    currentSelectedFileNames:
      currentSelectedFileNames !== null &&
      currentSelectedFileNames !== undefined
        ? currentSelectedFileNames
        : [],
    isMobileDevice,

    // 갤러리 스토어 참조만 유지
    imageGalleryStore: galleryStoreInstance,

    // 추가 유틸리티
    validateHandlersState,
  };
};
