// 📁 imageUpload/hooks/useImageUploadHandlers.ts

import { useCallback, useMemo, useRef } from 'react';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useFileProcessing } from './useFileProcessing';
import { useFileUploadState } from './useFileUploadState';
import { useMobileTouchState } from './useMobileTouchState';
import { createLogger } from '../utils/loggerUtils';
import type { FileSelectButtonRef } from '../types/imageUploadTypes';

const logger = createLogger('IMAGE_UPLOAD_HANDLERS');

// 🔧 디바이스 감지 함수
const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUserAgent =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return hasTouch || isSmallScreen || isMobileUserAgent;
};

// 🔧 Toast 타입 정의
interface ToastMessage {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary';
}

// 🔧 상태 업데이트 함수 타입 정의
type StateUpdaterFunction<T> = (prev: T) => T;

// 🔧 매개변수 타입 정의 (readonly string[] 지원)
interface UseImageUploadHandlersParams {
  formValues: unknown;
  uiState: unknown;
  selectionState: unknown;
  updateMediaValue: (
    filesOrUpdater: readonly string[] | StateUpdaterFunction<readonly string[]>
  ) => void;
  setMainImageValue: (value: string) => void;
  updateSelectedFileNames: (
    namesOrUpdater: readonly string[] | StateUpdaterFunction<readonly string[]>
  ) => void;
  showToastMessage: (toast: unknown) => void;
  imageGalleryStore: unknown;
}

// 🔧 반환 타입 정의
interface UseImageUploadHandlersResult {
  // 상태 데이터
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  deleteConfirmState: {
    isVisible: boolean;
    imageIndex: number;
    imageName: string;
  };
  duplicateMessageState: {
    isVisible: boolean;
    message: string;
    fileNames: readonly string[];
    animationKey: number;
  };
  touchActiveImages: Set<number>;
  hasActiveUploads: boolean;
  isMobileDevice: boolean;

  // 파일 처리 핸들러
  handleFilesDropped: (files: File[]) => void;
  handleFileSelectClick: () => void;
  handleFileChange: (files: FileList) => void;

  // 이미지 관리 핸들러
  handleDeleteButtonClick: (index: number, name: string) => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  handleImageTouch: (index: number) => void;

  // 메인 이미지 핸들러
  handleMainImageSet: (imageIndex: number, imageUrl: string) => void;
  handleMainImageCancel: () => void;
  checkIsMainImage: (imageUrl: string) => boolean;
  checkCanSetAsMainImage: (imageUrl: string) => boolean;
}

// 🔧 안전한 추출 함수들
const extractCurrentMedia = (formValues: unknown): readonly string[] => {
  if (!formValues || typeof formValues !== 'object') return [];

  const media = Reflect.get(formValues, 'media');
  return Array.isArray(media) ? media : [];
};

const extractCurrentFileNames = (
  selectionState: unknown
): readonly string[] => {
  if (!selectionState || typeof selectionState !== 'object') return [];

  const selectedFileNames = Reflect.get(selectionState, 'selectedFileNames');
  return Array.isArray(selectedFileNames) ? selectedFileNames : [];
};

const extractMainImageUrl = (formValues: unknown): string => {
  if (!formValues || typeof formValues !== 'object') return '';

  const mainImage = Reflect.get(formValues, 'mainImage');
  return typeof mainImage === 'string' ? mainImage : '';
};

// 🔧 안전한 Toast 생성 함수
const createSafeToast = (
  title: string,
  description: string,
  color: 'success' | 'warning' | 'danger' | 'primary'
): ToastMessage => {
  return {
    title,
    description,
    color,
  };
};

export const useImageUploadHandlers = (
  params: UseImageUploadHandlersParams
): UseImageUploadHandlersResult => {
  const {
    formValues,
    uiState,
    selectionState,
    updateMediaValue,
    setMainImageValue,
    updateSelectedFileNames,
    showToastMessage,
  } = params;

  // 파일 선택 버튼 참조
  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  logger.debug('useImageUploadHandlers 초기화', {
    hasFormValues: formValues !== null,
    hasUiState: uiState !== null,
    hasSelectionState: selectionState !== null,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 현재 상태 추출
  const currentMediaFiles = useMemo(
    () => extractCurrentMedia(formValues),
    [formValues]
  );
  const currentFileNames = useMemo(
    () => extractCurrentFileNames(selectionState),
    [selectionState]
  );
  const currentMainImageUrl = useMemo(
    () => extractMainImageUrl(formValues),
    [formValues]
  );

  // 🔧 모바일 디바이스 감지
  const isMobileDevice = useMemo(() => detectMobileDevice(), []);

  // 🔧 파일 업로드 상태 관리
  const {
    uploading,
    uploadStatus,
    hasActiveUploads,
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
  } = useFileUploadState();

  // 🔧 중복 파일 처리
  const { duplicateMessageState, showDuplicateMessage } =
    useDuplicateFileHandler();

  // 🔧 파일 처리 콜백 함수들 생성
  const fileProcessingCallbacks = useMemo(() => {
    return {
      updateMediaValue: (
        filesOrUpdater:
          | readonly string[]
          | StateUpdaterFunction<readonly string[]>
      ) => {
        updateMediaValue(filesOrUpdater);
      },
      updateSelectedFileNames: (
        namesOrUpdater:
          | readonly string[]
          | StateUpdaterFunction<readonly string[]>
      ) => {
        updateSelectedFileNames(namesOrUpdater);
      },
      showToastMessage: (toast: unknown) => {
        showToastMessage(toast);
      },
      showDuplicateMessage: (files: readonly File[]) => {
        showDuplicateMessage(files);
      },
      startFileUpload: (fileId: string, fileName: string) => {
        startFileUpload(fileId, fileName);
      },
      updateFileProgress: (fileId: string, progress: number) => {
        updateFileProgress(fileId, progress);
      },
      completeFileUpload: (fileId: string, fileName: string) => {
        completeFileUpload(fileId, fileName);
      },
      failFileUpload: (fileId: string, fileName: string) => {
        failFileUpload(fileId, fileName);
      },
    };
  }, [
    updateMediaValue,
    updateSelectedFileNames,
    showToastMessage,
    showDuplicateMessage,
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
  ]);

  // 🔧 파일 처리 로직
  const fileProcessingHandlers = useFileProcessing(
    currentMediaFiles,
    currentFileNames,
    fileProcessingCallbacks
  );

  // 🔧 삭제 확인 처리
  const handleDeleteImage = useCallback(
    (imageIndex: number, imageName: string) => {
      logger.debug('이미지 삭제 처리', { imageIndex, imageName });

      // 메인 이미지인 경우 해제
      const imageUrl = currentMediaFiles[imageIndex];
      if (imageUrl && imageUrl === currentMainImageUrl) {
        setMainImageValue('');
        logger.info('메인 이미지 해제됨', { imageIndex, imageName });
      }

      // 파일 목록에서 제거
      updateMediaValue((prev: readonly string[]) =>
        prev.filter((_, index) => index !== imageIndex)
      );
      updateSelectedFileNames((prev: readonly string[]) =>
        prev.filter((_, index) => index !== imageIndex)
      );

      // 성공 토스트 표시
      const successToast: unknown = createSafeToast(
        '삭제 완료',
        `${imageName} 파일이 삭제되었습니다.`,
        'success'
      );
      showToastMessage(successToast);

      logger.info('이미지 삭제 완료', { imageIndex, imageName });
    },
    [
      currentMediaFiles,
      currentMainImageUrl,
      setMainImageValue,
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
    ]
  );

  const {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation(handleDeleteImage);

  // 🔧 모바일 터치 상태
  const { touchActiveImages, handleImageTouch } =
    useMobileTouchState(isMobileDevice);

  // 🔧 파일 선택 버튼 클릭 핸들러
  const handleFileSelectClick = useCallback(() => {
    logger.debug('파일 선택 버튼 클릭');

    const buttonRef = fileSelectButtonRef.current;
    if (buttonRef && typeof buttonRef.clickFileInput === 'function') {
      try {
        buttonRef.clickFileInput();
        logger.info('파일 입력 클릭 성공');
      } catch (clickError) {
        logger.error('파일 입력 클릭 실패', { error: clickError });
      }
    } else {
      logger.warn('파일 선택 버튼 참조를 찾을 수 없음');
    }
  }, []);

  // 🔧 메인 이미지 관리 핸들러들
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      logger.debug('메인 이미지 설정', {
        imageIndex,
        imageUrl: imageUrl.slice(0, 50) + '...',
      });

      if (!imageUrl || imageUrl.length === 0) {
        logger.warn('유효하지 않은 이미지 URL');
        return;
      }

      setMainImageValue(imageUrl);

      // 성공 토스트 표시
      const successToast: unknown = createSafeToast(
        '메인 이미지 설정',
        '메인 이미지가 설정되었습니다.',
        'success'
      );
      showToastMessage(successToast);

      logger.info('메인 이미지 설정 완료', { imageIndex });
    },
    [setMainImageValue, showToastMessage]
  );

  const handleMainImageCancel = useCallback(() => {
    logger.debug('메인 이미지 해제');
    setMainImageValue('');

    // 정보 토스트 표시
    const infoToast: unknown = createSafeToast(
      '메인 이미지 해제',
      '메인 이미지가 해제되었습니다.',
      'primary'
    );
    showToastMessage(infoToast);

    logger.info('메인 이미지 해제 완료');
  }, [setMainImageValue, showToastMessage]);

  const checkIsMainImage = useCallback(
    (imageUrl: string): boolean => {
      if (!imageUrl || imageUrl.length === 0) return false;
      if (!currentMainImageUrl || currentMainImageUrl.length === 0)
        return false;

      const isMain = imageUrl === currentMainImageUrl;
      logger.debug('메인 이미지 확인', {
        imageUrl: imageUrl.slice(0, 50) + '...',
        isMain,
      });

      return isMain;
    },
    [currentMainImageUrl]
  );

  const checkCanSetAsMainImage = useCallback(
    (imageUrl: string): boolean => {
      if (!imageUrl || imageUrl.length === 0) return false;

      // 플레이스홀더는 메인 이미지로 설정 불가
      const isPlaceholder =
        imageUrl.startsWith('placeholder-') && imageUrl.includes('-processing');
      if (isPlaceholder) return false;

      // 이미 메인 이미지인 경우는 설정 불가
      const isAlreadyMain = checkIsMainImage(imageUrl);
      if (isAlreadyMain) return false;

      // 유효한 이미지 URL인지 확인
      const isValidUrl =
        imageUrl.startsWith('data:image/') ||
        imageUrl.startsWith('http') ||
        imageUrl.startsWith('blob:');

      logger.debug('메인 이미지 설정 가능 여부', {
        imageUrl: imageUrl.slice(0, 50) + '...',
        isPlaceholder,
        isAlreadyMain,
        isValidUrl,
        canSet: isValidUrl,
      });

      return isValidUrl;
    },
    [checkIsMainImage]
  );

  // 🔧 최종 반환값
  const result: UseImageUploadHandlersResult = useMemo(
    () => ({
      // 상태 데이터
      uploading,
      uploadStatus,
      deleteConfirmState,
      duplicateMessageState,
      touchActiveImages,
      hasActiveUploads,
      isMobileDevice,

      // 파일 처리 핸들러
      handleFilesDropped: fileProcessingHandlers.handleFilesDropped,
      handleFileSelectClick,
      handleFileChange: fileProcessingHandlers.handleFileChange,

      // 이미지 관리 핸들러
      handleDeleteButtonClick: showDeleteConfirmation,
      handleDeleteConfirm: confirmDelete,
      handleDeleteCancel: cancelDelete,
      handleImageTouch,

      // 메인 이미지 핸들러
      handleMainImageSet,
      handleMainImageCancel,
      checkIsMainImage,
      checkCanSetAsMainImage,
    }),
    [
      uploading,
      uploadStatus,
      deleteConfirmState,
      duplicateMessageState,
      touchActiveImages,
      hasActiveUploads,
      isMobileDevice,
      fileProcessingHandlers.handleFilesDropped,
      fileProcessingHandlers.handleFileChange,
      handleFileSelectClick,
      showDeleteConfirmation,
      confirmDelete,
      cancelDelete,
      handleImageTouch,
      handleMainImageSet,
      handleMainImageCancel,
      checkIsMainImage,
      checkCanSetAsMainImage,
    ]
  );

  logger.debug('useImageUploadHandlers 완료', {
    uploadingCount: Object.keys(uploading).length,
    hasActiveUploads,
    currentMediaCount: currentMediaFiles.length,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  return result;
};
