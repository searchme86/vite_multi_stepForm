// 📁 imageUpload/hooks/useImageUploadHandlers.ts

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
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

// 🔧 슬라이더 선택 상태 인터페이스
interface SliderSelectionState {
  readonly selectedSliderIndices: readonly number[];
}

// 🔧 ImageGalleryStore 인터페이스 정의 (강화됨)
interface ImageGalleryStoreInterface {
  readonly selectedSliderIndices: readonly number[];
  readonly setSliderSelectedIndices?: (indices: number[]) => void;
  readonly updateSliderSelection?: (indices: number[]) => void;
  readonly setSelectedSliderIndices?: (indices: number[]) => void;
}

// 🆕 상태 동기화 추적 인터페이스
interface StateSyncTracker {
  readonly lastSliderUpdate: number;
  readonly lastMainImageUpdate: number;
  readonly pendingUpdates: Set<string>;
  readonly isStateSynced: boolean;
}

// 🔧 매개변수 타입 정의 (슬라이더 지원 강화)
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

// 🔧 반환 타입 정의 (슬라이더 관련 추가)
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

  // 슬라이더 상태 추가
  selectedSliderIndices: readonly number[];
  isImageSelectedForSlider: (imageIndex: number) => boolean;

  // 파일 처리 핸들러
  handleFilesDropped: (files: File[]) => void;
  handleFileSelectClick: () => void;
  handleFileChange: (files: FileList) => void;

  // 이미지 관리 핸들러 (슬라이더 권한 검증 강화)
  handleDeleteButtonClick: (index: number, name: string) => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  handleImageTouch: (index: number) => void;

  // 메인 이미지 핸들러
  handleMainImageSet: (imageIndex: number, imageUrl: string) => void;
  handleMainImageCancel: () => void;
  checkIsMainImage: (imageUrl: string) => boolean;
  checkCanSetAsMainImage: (imageUrl: string) => boolean;

  // 슬라이더 전용 핸들러
  updateSliderSelection: (newSelectedIndices: number[]) => void;
}

// 🔧 안전한 추출 함수들 (타입 안전성 강화)
const extractCurrentMedia = (formValues: unknown): readonly string[] => {
  if (!formValues || typeof formValues !== 'object') return [];

  const media = Reflect.get(formValues, 'media');
  if (!Array.isArray(media)) return [];

  return media.filter((item): item is string => typeof item === 'string');
};

const extractCurrentFileNames = (
  selectionState: unknown
): readonly string[] => {
  if (!selectionState || typeof selectionState !== 'object') return [];

  const selectedFileNames = Reflect.get(selectionState, 'selectedFileNames');
  if (!Array.isArray(selectedFileNames)) return [];

  return selectedFileNames.filter(
    (item): item is string => typeof item === 'string'
  );
};

const extractMainImageUrl = (formValues: unknown): string => {
  if (!formValues || typeof formValues !== 'object') return '';

  const mainImage = Reflect.get(formValues, 'mainImage');
  return typeof mainImage === 'string' ? mainImage : '';
};

// 🆕 슬라이더 선택 상태 추출 함수 (안전성 강화)
const extractSliderSelectionState = (
  selectionState: unknown
): SliderSelectionState => {
  if (!selectionState || typeof selectionState !== 'object') {
    return { selectedSliderIndices: [] };
  }

  const rawIndices = Reflect.get(selectionState, 'selectedSliderIndices');
  if (!Array.isArray(rawIndices)) {
    return { selectedSliderIndices: [] };
  }

  const selectedSliderIndices = rawIndices.filter(
    (item): item is number => typeof item === 'number' && item >= 0
  );

  console.log('🔍 [SLIDER_EXTRACTION] 슬라이더 선택 상태 추출:', {
    rawIndicesType: typeof rawIndices,
    rawIndicesLength: rawIndices.length,
    extractedCount: selectedSliderIndices.length,
    extractedIndices: selectedSliderIndices,
  });

  return { selectedSliderIndices };
};

// 🆕 ImageGalleryStore 안전 추출 함수 (타입 안전성 강화)
const extractImageGalleryStore = (
  store: unknown
): ImageGalleryStoreInterface => {
  if (!store || typeof store !== 'object') {
    return { selectedSliderIndices: [] };
  }

  const selectedSliderIndices = Reflect.get(store, 'selectedSliderIndices');
  const setSliderSelectedIndices = Reflect.get(
    store,
    'setSliderSelectedIndices'
  );
  const updateSliderSelection = Reflect.get(store, 'updateSliderSelection');
  const setSelectedSliderIndices = Reflect.get(
    store,
    'setSelectedSliderIndices'
  );

  let safeIndices: readonly number[] = [];
  if (Array.isArray(selectedSliderIndices)) {
    safeIndices = selectedSliderIndices.filter(
      (item): item is number => typeof item === 'number' && item >= 0
    );
  }

  console.log('🔍 [STORE_EXTRACTION] ImageGalleryStore 상태 추출:', {
    selectedSliderIndicesCount: safeIndices.length,
    hasSetSliderSelectedIndices: typeof setSliderSelectedIndices === 'function',
    hasUpdateSliderSelection: typeof updateSliderSelection === 'function',
    hasSetSelectedSliderIndices: typeof setSelectedSliderIndices === 'function',
  });

  return {
    selectedSliderIndices: safeIndices,
    setSliderSelectedIndices:
      typeof setSliderSelectedIndices === 'function'
        ? setSliderSelectedIndices
        : undefined,
    updateSliderSelection:
      typeof updateSliderSelection === 'function'
        ? updateSliderSelection
        : undefined,
    setSelectedSliderIndices:
      typeof setSelectedSliderIndices === 'function'
        ? setSelectedSliderIndices
        : undefined,
  };
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

// 🆕 슬라이더 권한 검증 함수들 (강화됨)
const validateSliderPermissionForDelete = (
  imageIndex: number,
  imageName: string,
  selectedSliderIndices: readonly number[]
): { canDelete: boolean; reason?: string } => {
  const isSliderSelected = selectedSliderIndices.includes(imageIndex);

  if (isSliderSelected) {
    console.log(
      '🚨 [SLIDER_PERMISSION] 슬라이더 선택된 이미지 삭제 시도 차단:',
      {
        imageIndex,
        imageName,
        reason: 'slider_selected_image_cannot_be_deleted',
      }
    );

    return {
      canDelete: false,
      reason: '슬라이더에 선택된 이미지는 먼저 슬라이더에서 해제해주세요.',
    };
  }

  return { canDelete: true };
};

const validateSliderPermissionForTouch = (
  imageIndex: number,
  selectedSliderIndices: readonly number[]
): { canTouch: boolean; reason?: string } => {
  const isSliderSelected = selectedSliderIndices.includes(imageIndex);

  if (isSliderSelected) {
    console.log(
      '🚨 [SLIDER_PERMISSION] 슬라이더 선택된 이미지 터치 시도 차단:',
      {
        imageIndex,
        reason: 'slider_selected_image_touch_blocked',
      }
    );

    return {
      canTouch: false,
      reason: '슬라이더 선택된 이미지는 슬라이더에서 관리할 수 있습니다.',
    };
  }

  return { canTouch: true };
};

const validateSliderPermissionForMainImage = (
  imageIndex: number,
  imageUrl: string,
  selectedSliderIndices: readonly number[]
): { canSetAsMain: boolean; reason?: string } => {
  const isSliderSelected = selectedSliderIndices.includes(imageIndex);

  if (isSliderSelected) {
    console.log(
      '🚨 [SLIDER_PERMISSION] 슬라이더 선택된 이미지 메인 설정 시도 차단:',
      {
        imageIndex,
        imageUrl: imageUrl.slice(0, 30) + '...',
        reason: 'slider_selected_image_cannot_be_main',
      }
    );

    return {
      canSetAsMain: false,
      reason: '슬라이더에 선택된 이미지는 메인 이미지로 설정할 수 없습니다.',
    };
  }

  return { canSetAsMain: true };
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
    imageGalleryStore,
  } = params;

  // 🆕 상태 동기화 추적
  const [stateSyncTracker, setStateSyncTracker] = useState<StateSyncTracker>({
    lastSliderUpdate: 0,
    lastMainImageUpdate: 0,
    pendingUpdates: new Set(),
    isStateSynced: true,
  });

  // 파일 선택 버튼 참조
  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // 🆕 상태 동기화 추적 함수
  const trackStateUpdate = useCallback(
    (updateType: 'slider' | 'mainImage', operationId: string): void => {
      const currentTime = Date.now();

      setStateSyncTracker((prev) => {
        const newPendingUpdates = new Set(prev.pendingUpdates);
        newPendingUpdates.add(operationId);

        return {
          ...prev,
          lastSliderUpdate:
            updateType === 'slider' ? currentTime : prev.lastSliderUpdate,
          lastMainImageUpdate:
            updateType === 'mainImage' ? currentTime : prev.lastMainImageUpdate,
          pendingUpdates: newPendingUpdates,
          isStateSynced: false,
        };
      });

      // 일정 시간 후 동기화 완료 처리
      setTimeout(() => {
        setStateSyncTracker((prev) => {
          const newPendingUpdates = new Set(prev.pendingUpdates);
          newPendingUpdates.delete(operationId);

          return {
            ...prev,
            pendingUpdates: newPendingUpdates,
            isStateSynced: newPendingUpdates.size === 0,
          };
        });
      }, 100);
    },
    []
  );

  logger.debug('useImageUploadHandlers 초기화 - 상태 동기화 강화', {
    hasFormValues: formValues !== null,
    hasUiState: uiState !== null,
    hasSelectionState: selectionState !== null,
    hasImageGalleryStore: imageGalleryStore !== null,
    stateSyncEnabled: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 현재 상태 추출 (메모이제이션 강화)
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

  // 🆕 슬라이더 선택 상태 추출 (안정성 강화)
  const sliderSelectionState = useMemo(
    () => extractSliderSelectionState(selectionState),
    [selectionState]
  );

  // 🆕 ImageGalleryStore 상태 추출 (안정성 강화)
  const imageGalleryStoreState = useMemo(
    () => extractImageGalleryStore(imageGalleryStore),
    [imageGalleryStore]
  );

  // 🆕 최종 슬라이더 선택 상태 결정 (Race Condition 해결)
  const finalSelectedSliderIndices = useMemo(() => {
    const storeIndices = imageGalleryStoreState.selectedSliderIndices;
    const selectionIndices = sliderSelectionState.selectedSliderIndices;

    // 🔧 상태 동기화 상태 확인
    const { isStateSynced, pendingUpdates } = stateSyncTracker;

    // 동기화 중이면 더 최근 상태 사용
    if (!isStateSynced && pendingUpdates.size > 0) {
      const hasSliderPendingUpdate = Array.from(pendingUpdates).some((update) =>
        update.includes('slider')
      );

      if (hasSliderPendingUpdate) {
        // 슬라이더 업데이트 대기 중이면 store 우선
        console.log('🔄 [SLIDER_STATE] 슬라이더 업데이트 대기 중 - store 우선');
        return storeIndices;
      }
    }

    // 🔧 데이터 소스 우선순위 결정 (store > selection)
    const finalIndices =
      storeIndices.length > 0 ? storeIndices : selectionIndices;

    // 🔧 인덱스 유효성 검증
    const validIndices = finalIndices.filter(
      (index) =>
        typeof index === 'number' &&
        index >= 0 &&
        index < currentMediaFiles.length
    );

    console.log('🔧 [SLIDER_STATE] 최종 슬라이더 선택 상태 결정:', {
      storeIndicesCount: storeIndices.length,
      selectionIndicesCount: selectionIndices.length,
      finalIndicesCount: validIndices.length,
      finalIndices: validIndices,
      dataSource:
        storeIndices.length > 0 ? 'imageGalleryStore' : 'selectionState',
      isStateSynced,
      pendingUpdatesCount: pendingUpdates.size,
    });

    return validIndices;
  }, [
    imageGalleryStoreState.selectedSliderIndices,
    sliderSelectionState.selectedSliderIndices,
    currentMediaFiles.length,
    stateSyncTracker,
  ]);

  // 🔧 모바일 디바이스 감지 (메모이제이션)
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

  // 🔧 파일 처리 콜백 함수들 생성 (메모이제이션 강화)
  const fileProcessingCallbacks = useMemo(() => {
    return {
      updateMediaValue: (
        filesOrUpdater:
          | readonly string[]
          | StateUpdaterFunction<readonly string[]>
      ) => {
        const operationId = `media-${Date.now()}`;
        trackStateUpdate('slider', operationId);
        updateMediaValue(filesOrUpdater);
      },
      updateSelectedFileNames: (
        namesOrUpdater:
          | readonly string[]
          | StateUpdaterFunction<readonly string[]>
      ) => {
        const operationId = `filenames-${Date.now()}`;
        trackStateUpdate('slider', operationId);
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
    trackStateUpdate,
  ]);

  // 🔧 파일 처리 로직
  const fileProcessingHandlers = useFileProcessing(
    currentMediaFiles,
    currentFileNames,
    fileProcessingCallbacks
  );

  // 🆕 슬라이더 권한 검증이 포함된 삭제 핸들러 (강화됨)
  const handleDeleteImage = useCallback(
    (imageIndex: number, imageName: string) => {
      logger.debug('이미지 삭제 처리 - 슬라이더 권한 검증 포함', {
        imageIndex,
        imageName,
        selectedSliderIndices: finalSelectedSliderIndices,
      });

      // 🚨 슬라이더 권한 검증
      const deletePermission = validateSliderPermissionForDelete(
        imageIndex,
        imageName,
        finalSelectedSliderIndices
      );

      if (!deletePermission.canDelete) {
        const warningToast: unknown = createSafeToast(
          '삭제 불가',
          deletePermission.reason || '삭제할 수 없습니다.',
          'warning'
        );
        showToastMessage(warningToast);

        logger.warn('이미지 삭제 차단 - 슬라이더 권한', {
          imageIndex,
          imageName,
          reason: deletePermission.reason,
        });
        return;
      }

      // 메인 이미지인 경우 해제
      const imageUrl = currentMediaFiles[imageIndex];
      if (imageUrl && imageUrl === currentMainImageUrl) {
        const operationId = `main-clear-${Date.now()}`;
        trackStateUpdate('mainImage', operationId);
        setMainImageValue('');
        logger.info('메인 이미지 해제됨', { imageIndex, imageName });
      }

      // 파일 목록에서 제거
      const operationId = `delete-${Date.now()}`;
      trackStateUpdate('slider', operationId);

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
      finalSelectedSliderIndices,
      setMainImageValue,
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      trackStateUpdate,
    ]
  );

  const {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation(handleDeleteImage);

  // 🔧 모바일 터치 상태
  const { touchActiveImages, handleImageTouch: originalHandleImageTouch } =
    useMobileTouchState(isMobileDevice);

  // 🆕 슬라이더 권한 검증이 포함된 터치 핸들러 (강화됨)
  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      console.log('🔧 [IMAGE_TOUCH] 슬라이더 권한 검증 포함 터치 처리:', {
        imageIndex,
        selectedSliderIndices: finalSelectedSliderIndices,
      });

      // 🚨 슬라이더 권한 검증
      const touchPermission = validateSliderPermissionForTouch(
        imageIndex,
        finalSelectedSliderIndices
      );

      if (!touchPermission.canTouch) {
        const infoToast: unknown = createSafeToast(
          '터치 제한',
          touchPermission.reason || '터치할 수 없습니다.',
          'primary'
        );
        showToastMessage(infoToast);

        logger.info('이미지 터치 차단 - 슬라이더 권한', {
          imageIndex,
          reason: touchPermission.reason,
        });
        return;
      }

      // 권한 검증 통과 시 기존 터치 핸들러 실행
      if (originalHandleImageTouch) {
        originalHandleImageTouch(imageIndex);
      }

      logger.info('이미지 터치 처리 완료', { imageIndex });
    },
    [finalSelectedSliderIndices, originalHandleImageTouch, showToastMessage]
  );

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

  // 🆕 슬라이더 권한 검증이 포함된 메인 이미지 설정 핸들러 (강화됨)
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      logger.debug('메인 이미지 설정 - 슬라이더 권한 검증 포함', {
        imageIndex,
        imageUrl: imageUrl.slice(0, 50) + '...',
        selectedSliderIndices: finalSelectedSliderIndices,
      });

      if (!imageUrl || imageUrl.length === 0) {
        logger.warn('유효하지 않은 이미지 URL');
        return;
      }

      // 🚨 슬라이더 권한 검증
      const mainImagePermission = validateSliderPermissionForMainImage(
        imageIndex,
        imageUrl,
        finalSelectedSliderIndices
      );

      if (!mainImagePermission.canSetAsMain) {
        const warningToast: unknown = createSafeToast(
          '메인 이미지 설정 불가',
          mainImagePermission.reason || '메인 이미지로 설정할 수 없습니다.',
          'warning'
        );
        showToastMessage(warningToast);

        logger.warn('메인 이미지 설정 차단 - 슬라이더 권한', {
          imageIndex,
          reason: mainImagePermission.reason,
        });
        return;
      }

      const operationId = `main-set-${Date.now()}`;
      trackStateUpdate('mainImage', operationId);
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
    [
      setMainImageValue,
      showToastMessage,
      finalSelectedSliderIndices,
      trackStateUpdate,
    ]
  );

  const handleMainImageCancel = useCallback(() => {
    logger.debug('메인 이미지 해제');

    const operationId = `main-cancel-${Date.now()}`;
    trackStateUpdate('mainImage', operationId);
    setMainImageValue('');

    // 정보 토스트 표시
    const infoToast: unknown = createSafeToast(
      '메인 이미지 해제',
      '메인 이미지가 해제되었습니다.',
      'primary'
    );
    showToastMessage(infoToast);

    logger.info('메인 이미지 해제 완료');
  }, [setMainImageValue, showToastMessage, trackStateUpdate]);

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

  // 🆕 슬라이더 선택 관련 함수들 (상태 동기화 강화)
  const isImageSelectedForSlider = useCallback(
    (imageIndex: number): boolean => {
      const isSelected = finalSelectedSliderIndices.includes(imageIndex);

      console.log('🔍 [SLIDER_CHECK] 슬라이더 선택 확인:', {
        imageIndex,
        selectedIndices: finalSelectedSliderIndices,
        isSelected,
      });

      return isSelected;
    },
    [finalSelectedSliderIndices]
  );

  const updateSliderSelection = useCallback(
    (newSelectedIndices: number[]) => {
      console.log('🔧 [SLIDER_UPDATE] 슬라이더 선택 상태 업데이트:', {
        previousCount: finalSelectedSliderIndices.length,
        newCount: newSelectedIndices.length,
        newIndices: newSelectedIndices,
      });

      const operationId = `slider-update-${Date.now()}`;
      trackStateUpdate('slider', operationId);

      // ImageGalleryStore 업데이트 시도
      const storeActions = imageGalleryStoreState;
      let updateSuccess = false;

      if (storeActions.setSliderSelectedIndices) {
        storeActions.setSliderSelectedIndices(newSelectedIndices);
        updateSuccess = true;
        logger.debug('setSliderSelectedIndices 사용하여 업데이트');
      } else if (storeActions.updateSliderSelection) {
        storeActions.updateSliderSelection(newSelectedIndices);
        updateSuccess = true;
        logger.debug('updateSliderSelection 사용하여 업데이트');
      } else if (storeActions.setSelectedSliderIndices) {
        storeActions.setSelectedSliderIndices(newSelectedIndices);
        updateSuccess = true;
        logger.debug('setSelectedSliderIndices 사용하여 업데이트');
      }

      if (!updateSuccess) {
        logger.warn(
          '슬라이더 선택 상태 업데이트 실패 - 사용 가능한 메서드 없음'
        );
      } else {
        logger.info('슬라이더 선택 상태 업데이트 완료', {
          newCount: newSelectedIndices.length,
          operationId,
        });
      }
    },
    [imageGalleryStoreState, trackStateUpdate, finalSelectedSliderIndices]
  );

  // 🔧 최종 반환값 (메모이제이션 강화)
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

      // 슬라이더 상태
      selectedSliderIndices: finalSelectedSliderIndices,
      isImageSelectedForSlider,

      // 파일 처리 핸들러
      handleFilesDropped: fileProcessingHandlers.handleFilesDropped,
      handleFileSelectClick,
      handleFileChange: fileProcessingHandlers.handleFileChange,

      // 이미지 관리 핸들러 (슬라이더 권한 검증 포함)
      handleDeleteButtonClick: showDeleteConfirmation,
      handleDeleteConfirm: confirmDelete,
      handleDeleteCancel: cancelDelete,
      handleImageTouch,

      // 메인 이미지 핸들러 (슬라이더 권한 검증 포함)
      handleMainImageSet,
      handleMainImageCancel,
      checkIsMainImage,
      checkCanSetAsMainImage,

      // 슬라이더 전용 핸들러
      updateSliderSelection,
    }),
    [
      uploading,
      uploadStatus,
      deleteConfirmState,
      duplicateMessageState,
      touchActiveImages,
      hasActiveUploads,
      isMobileDevice,
      finalSelectedSliderIndices,
      isImageSelectedForSlider,
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
      updateSliderSelection,
    ]
  );

  // 🆕 상태 동기화 모니터링
  useEffect(() => {
    const { isStateSynced, pendingUpdates } = stateSyncTracker;

    if (!isStateSynced) {
      logger.debug('상태 동기화 대기 중', {
        pendingUpdatesCount: pendingUpdates.size,
        pendingUpdatesList: Array.from(pendingUpdates),
      });
    } else {
      logger.debug('상태 동기화 완료');
    }
  }, [stateSyncTracker]);

  logger.debug('useImageUploadHandlers 완료 - 상태 동기화 강화됨', {
    uploadingCount: Object.keys(uploading).length,
    hasActiveUploads,
    currentMediaCount: currentMediaFiles.length,
    selectedSliderIndicesCount: finalSelectedSliderIndices.length,
    isMobileDevice,
    stateSyncEnabled: true,
    isStateSynced: stateSyncTracker.isStateSynced,
    timestamp: new Date().toLocaleTimeString(),
  });

  return result;
};
