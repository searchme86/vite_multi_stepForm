// 📁 imageUpload/hooks/useImageUploadHandlers.ts

import { useCallback, useMemo, useRef } from 'react';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useFileProcessing } from './useFileProcessing';
import { useFileUploadState } from './useFileUploadState';
import { useMobileTouchState } from './useMobileTouchState';
import type {
  UseImageUploadHandlersParams,
  UseImageUploadHandlersResult,
  FileSelectButtonRef,
  ToastMessage,
  ExtractedFormData,
  ExtractedSelectionData,
  ExtractedStoreData,
} from '../types/imageUploadTypes';

console.log('🔧 [IMPORT] useImageUploadHandlers 모듈 로드 완료');

// 🔧 디바이스 감지 함수
const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator?.userAgent ?? '';
  const hasTouch =
    'ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUserAgent =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return hasTouch || isSmallScreen || isMobileUserAgent;
};

// 🔧 안전한 데이터 추출 함수들
const extractFormData = (formValues: unknown): ExtractedFormData => {
  if (!formValues || typeof formValues !== 'object') {
    return { media: [], mainImage: '' };
  }

  const media = Reflect.get(formValues, 'media');
  const mainImage = Reflect.get(formValues, 'mainImage');

  const safeMedia = Array.isArray(media)
    ? media.filter((item): item is string => typeof item === 'string')
    : [];

  const safeMainImage = typeof mainImage === 'string' ? mainImage : '';

  console.log('🔍 [EXTRACT_FORM] 폼 데이터 추출:', {
    mediaCount: safeMedia.length,
    hasMainImage: safeMainImage.length > 0,
  });

  return { media: safeMedia, mainImage: safeMainImage };
};

const extractSelectionData = (
  selectionState: unknown
): ExtractedSelectionData => {
  if (!selectionState || typeof selectionState !== 'object') {
    return { selectedFileNames: [], selectedSliderIndices: [] };
  }

  const selectedFileNames = Reflect.get(selectionState, 'selectedFileNames');
  const selectedSliderIndices = Reflect.get(
    selectionState,
    'selectedSliderIndices'
  );

  const safeFileNames = Array.isArray(selectedFileNames)
    ? selectedFileNames.filter(
        (item): item is string => typeof item === 'string'
      )
    : [];

  const safeSliderIndices = Array.isArray(selectedSliderIndices)
    ? selectedSliderIndices.filter(
        (item): item is number => typeof item === 'number' && item >= 0
      )
    : [];

  console.log('🔍 [EXTRACT_SELECTION] 선택 데이터 추출:', {
    fileNamesCount: safeFileNames.length,
    sliderIndicesCount: safeSliderIndices.length,
  });

  return {
    selectedFileNames: safeFileNames,
    selectedSliderIndices: safeSliderIndices,
  };
};

const extractStoreData = (imageGalleryStore: unknown): ExtractedStoreData => {
  if (!imageGalleryStore || typeof imageGalleryStore !== 'object') {
    return { selectedSliderIndices: [] };
  }

  const selectedSliderIndices = Reflect.get(
    imageGalleryStore,
    'selectedSliderIndices'
  );
  const setSliderSelectedIndices = Reflect.get(
    imageGalleryStore,
    'setSliderSelectedIndices'
  );
  const updateSliderSelection = Reflect.get(
    imageGalleryStore,
    'updateSliderSelection'
  );
  const setSelectedSliderIndices = Reflect.get(
    imageGalleryStore,
    'setSelectedSliderIndices'
  );

  const safeIndices = Array.isArray(selectedSliderIndices)
    ? selectedSliderIndices.filter(
        (item): item is number => typeof item === 'number' && item >= 0
      )
    : [];

  console.log('🔍 [EXTRACT_STORE] 스토어 데이터 추출:', {
    indicesCount: safeIndices.length,
    hasSetters: {
      setSliderSelectedIndices: typeof setSliderSelectedIndices === 'function',
      updateSliderSelection: typeof updateSliderSelection === 'function',
      setSelectedSliderIndices: typeof setSelectedSliderIndices === 'function',
    },
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

// 🔧 토스트 메시지 생성 함수
const createToast = (
  title: string,
  description: string,
  color: 'success' | 'warning' | 'danger' | 'primary'
): ToastMessage => ({ title, description, color });

// 🔧 슬라이더 권한 검증 함수들
const validateSliderPermission = (
  imageIndex: number,
  selectedSliderIndices: readonly number[],
  action: 'delete' | 'touch' | 'mainImage'
): { canProceed: boolean; reason?: string } => {
  const isSliderSelected = selectedSliderIndices.includes(imageIndex);

  if (!isSliderSelected) {
    return { canProceed: true };
  }

  const reasons = {
    delete: '슬라이더에 선택된 이미지는 먼저 슬라이더에서 해제해주세요.',
    touch: '슬라이더 선택된 이미지는 슬라이더에서 관리할 수 있습니다.',
    mainImage: '슬라이더에 선택된 이미지는 메인 이미지로 설정할 수 없습니다.',
  };

  console.log(`🚨 [SLIDER_PERMISSION] ${action} 권한 차단:`, {
    imageIndex,
    action,
    reason: reasons[action],
  });

  return { canProceed: false, reason: reasons[action] };
};

export const useImageUploadHandlers = (
  params: UseImageUploadHandlersParams
): UseImageUploadHandlersResult => {
  const {
    formValues,
    selectionState,
    updateMediaValue,
    setMainImageValue,
    updateSelectedFileNames,
    showToastMessage,
    imageGalleryStore,
    mapFileActions, // 🚨 FIXED: mapFileActions 받기
  } = params;

  console.log('🚀 [INIT] useImageUploadHandlers 초기화');
  console.log('🔍 [MAPFILE_DEBUG] mapFileActions 수신 상태:', {
    hasMapFileActions: mapFileActions !== undefined,
    mapFileActionsType: typeof mapFileActions,
    mapFileActionsMethods: mapFileActions ? Object.keys(mapFileActions) : [],
  });

  // 🔧 파일 선택 버튼 참조
  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // 🔧 데이터 추출 (메모이제이션)
  const formData = useMemo(() => extractFormData(formValues), [formValues]);
  const selectionData = useMemo(
    () => extractSelectionData(selectionState),
    [selectionState]
  );
  const storeData = useMemo(
    () => extractStoreData(imageGalleryStore),
    [imageGalleryStore]
  );

  // 🔧 최종 슬라이더 선택 상태 결정 (Store 우선)
  const finalSelectedSliderIndices = useMemo(() => {
    const storeIndices = storeData.selectedSliderIndices;
    const selectionIndices = selectionData.selectedSliderIndices;

    // 🔧 Store에 데이터가 있으면 Store 우선, 없으면 Selection 사용
    const indices = storeIndices.length > 0 ? storeIndices : selectionIndices;

    // 🔧 유효한 인덱스만 필터링
    const validIndices = indices.filter(
      (index) => index >= 0 && index < formData.media.length
    );

    console.log('🎯 [SLIDER_STATE] 최종 슬라이더 선택 상태:', {
      storeCount: storeIndices.length,
      selectionCount: selectionIndices.length,
      finalCount: validIndices.length,
      dataSource: storeIndices.length > 0 ? 'store' : 'selection',
    });

    return validIndices;
  }, [
    storeData.selectedSliderIndices,
    selectionData.selectedSliderIndices,
    formData.media.length,
  ]);

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

  // 🔧 이미지 삭제 핸들러 (슬라이더 권한 검증 포함)
  const handleDeleteImage = useCallback(
    (imageIndex: number, imageName: string) => {
      console.log('🗑️ [DELETE] 이미지 삭제 처리:', { imageIndex, imageName });

      // 🚨 슬라이더 권한 검증
      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'delete'
      );

      if (!permission.canProceed) {
        const warningToast = createToast(
          '삭제 불가',
          permission.reason ?? '삭제할 수 없습니다.',
          'warning'
        );
        showToastMessage(warningToast);
        return;
      }

      // 메인 이미지인 경우 해제
      const imageUrl = formData.media[imageIndex];
      if (imageUrl && imageUrl === formData.mainImage) {
        setMainImageValue('');
        console.log('📸 [DELETE] 메인 이미지 해제:', { imageIndex });
      }

      // 파일 목록에서 제거
      updateMediaValue((prev) =>
        prev.filter((_, index) => index !== imageIndex)
      );
      updateSelectedFileNames((prev) =>
        prev.filter((_, index) => index !== imageIndex)
      );

      // 성공 토스트
      const successToast = createToast(
        '삭제 완료',
        `${imageName} 파일이 삭제되었습니다.`,
        'success'
      );
      showToastMessage(successToast);

      console.log('✅ [DELETE] 이미지 삭제 완료:', { imageIndex, imageName });
    },
    [
      finalSelectedSliderIndices,
      formData.media,
      formData.mainImage,
      setMainImageValue,
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
    ]
  );

  // 🔧 삭제 확인 처리
  const {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation(handleDeleteImage);

  // 🔧 파일 처리 콜백들
  const fileProcessingCallbacks = useMemo(
    () => ({
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      showDuplicateMessage,
      startFileUpload,
      updateFileProgress,
      completeFileUpload,
      failFileUpload,
    }),
    [
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      showDuplicateMessage,
      startFileUpload,
      updateFileProgress,
      completeFileUpload,
      failFileUpload,
    ]
  );

  // 🔧 파일 처리 핸들러
  const fileProcessingHandlers = useFileProcessing(
    formData.media,
    selectionData.selectedFileNames,
    fileProcessingCallbacks
  );

  // 🔧 모바일 터치 상태
  const { touchActiveImages, handleImageTouch: originalHandleImageTouch } =
    useMobileTouchState(isMobileDevice);

  // 🔧 이미지 터치 핸들러 (슬라이더 권한 검증 포함)
  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      console.log('👆 [TOUCH] 이미지 터치:', { imageIndex });

      // 🚨 슬라이더 권한 검증
      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'touch'
      );

      if (!permission.canProceed) {
        const infoToast = createToast(
          '터치 제한',
          permission.reason ?? '터치할 수 없습니다.',
          'primary'
        );
        showToastMessage(infoToast);
        return;
      }

      // 권한 통과 시 기존 터치 핸들러 실행
      originalHandleImageTouch?.(imageIndex);
    },
    [finalSelectedSliderIndices, originalHandleImageTouch, showToastMessage]
  );

  // 🔧 파일 선택 버튼 클릭 핸들러
  const handleFileSelectClick = useCallback(() => {
    console.log('📁 [FILE_SELECT] 파일 선택 버튼 클릭');

    const buttonRef = fileSelectButtonRef.current;
    if (buttonRef?.click) {
      try {
        buttonRef.click();
        console.log('✅ [FILE_SELECT] 파일 입력 클릭 성공');
      } catch (error) {
        console.error('❌ [FILE_SELECT] 파일 입력 클릭 실패:', error);
      }
    } else {
      console.warn('⚠️ [FILE_SELECT] 파일 선택 버튼 참조 없음');
    }
  }, []);

  // 🔧 메인 이미지 설정 핸들러 (슬라이더 권한 검증 포함)
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      console.log('📸 [MAIN_IMAGE] 메인 이미지 설정:', {
        imageIndex,
        imageUrl: imageUrl.slice(0, 50),
      });

      if (!imageUrl) {
        console.warn('⚠️ [MAIN_IMAGE] 유효하지 않은 이미지 URL');
        return;
      }

      // 🚨 슬라이더 권한 검증
      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'mainImage'
      );

      if (!permission.canProceed) {
        const warningToast = createToast(
          '메인 이미지 설정 불가',
          permission.reason ?? '설정할 수 없습니다.',
          'warning'
        );
        showToastMessage(warningToast);
        return;
      }

      setMainImageValue(imageUrl);

      const successToast = createToast(
        '메인 이미지 설정',
        '메인 이미지가 설정되었습니다.',
        'success'
      );
      showToastMessage(successToast);

      console.log('✅ [MAIN_IMAGE] 메인 이미지 설정 완료:', { imageIndex });
    },
    [finalSelectedSliderIndices, setMainImageValue, showToastMessage]
  );

  // 🔧 메인 이미지 해제 핸들러
  const handleMainImageCancel = useCallback(() => {
    console.log('📸 [MAIN_IMAGE] 메인 이미지 해제');

    setMainImageValue('');

    const infoToast = createToast(
      '메인 이미지 해제',
      '메인 이미지가 해제되었습니다.',
      'primary'
    );
    showToastMessage(infoToast);

    console.log('✅ [MAIN_IMAGE] 메인 이미지 해제 완료');
  }, [setMainImageValue, showToastMessage]);

  // 🔧 메인 이미지 확인 함수들
  const checkIsMainImage = useCallback(
    (imageUrl: string): boolean => {
      if (!imageUrl || !formData.mainImage) return false;
      return imageUrl === formData.mainImage;
    },
    [formData.mainImage]
  );

  const checkCanSetAsMainImage = useCallback(
    (imageUrl: string): boolean => {
      if (!imageUrl) return false;

      // 플레이스홀더 체크
      const isPlaceholder =
        imageUrl.startsWith('placeholder-') && imageUrl.includes('-processing');
      if (isPlaceholder) return false;

      // 이미 메인 이미지인지 체크
      if (checkIsMainImage(imageUrl)) return false;

      // 유효한 URL인지 체크
      const isValidUrl =
        imageUrl.startsWith('data:image/') ||
        imageUrl.startsWith('http') ||
        imageUrl.startsWith('blob:');

      return isValidUrl;
    },
    [checkIsMainImage]
  );

  // 🔧 슬라이더 관련 함수들
  const isImageSelectedForSlider = useCallback(
    (imageIndex: number): boolean => {
      return finalSelectedSliderIndices.includes(imageIndex);
    },
    [finalSelectedSliderIndices]
  );

  const updateSliderSelection = useCallback(
    (newSelectedIndices: number[]) => {
      console.log('🎯 [SLIDER_UPDATE] 슬라이더 선택 업데이트:', {
        previousCount: finalSelectedSliderIndices.length,
        newCount: newSelectedIndices.length,
      });

      // Store 업데이트 시도 (우선순위: setSliderSelectedIndices > updateSliderSelection > setSelectedSliderIndices)
      const {
        setSliderSelectedIndices,
        updateSliderSelection: storeUpdate,
        setSelectedSliderIndices,
      } = storeData;

      if (setSliderSelectedIndices) {
        setSliderSelectedIndices(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] setSliderSelectedIndices 사용');
      } else if (storeUpdate) {
        storeUpdate(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] updateSliderSelection 사용');
      } else if (setSelectedSliderIndices) {
        setSelectedSliderIndices(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] setSelectedSliderIndices 사용');
      } else {
        console.warn('⚠️ [SLIDER_UPDATE] 사용 가능한 업데이트 메서드 없음');
      }
    },
    [storeData, finalSelectedSliderIndices.length]
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

      // 슬라이더 상태
      selectedSliderIndices: finalSelectedSliderIndices,
      isImageSelectedForSlider,

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

  console.log('🎉 [COMPLETE] useImageUploadHandlers 초기화 완료:', {
    uploadingCount: Object.keys(uploading).length,
    hasActiveUploads,
    mediaCount: formData.media.length,
    sliderIndicesCount: finalSelectedSliderIndices.length,
    isMobileDevice,
    mapFileActionsAvailable: mapFileActions !== undefined,
  });

  return result;
};
