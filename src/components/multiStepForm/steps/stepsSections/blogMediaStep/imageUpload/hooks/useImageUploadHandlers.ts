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

const detectMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const { userAgent = '', maxTouchPoints = 0 } = navigator ?? {};
  const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  const isMobileUserAgent =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return hasTouch || isSmallScreen || isMobileUserAgent;
};

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

const createToast = (
  title: string,
  description: string,
  color: 'success' | 'warning' | 'danger' | 'primary'
): ToastMessage => ({ title, description, color });

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

const convertFileIdToString = (fileId: unknown): string | null => {
  if (typeof fileId === 'string') {
    return fileId.trim() !== '' ? fileId : null;
  }

  if (typeof fileId === 'number') {
    return Number.isFinite(fileId) ? fileId.toString() : null;
  }

  console.warn('⚠️ [TYPE_CONVERT] 지원하지 않는 fileId 타입:', {
    type: typeof fileId,
    value: fileId,
  });

  return null;
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
    mapFileActions,
  } = params;

  console.log('🚀 [INIT] useImageUploadHandlers 초기화');
  console.log('🔍 [MAPFILE_DEBUG] mapFileActions 수신 상태:', {
    hasMapFileActions: mapFileActions !== undefined,
    mapFileActionsType: typeof mapFileActions,
    mapFileActionsMethods: mapFileActions ? Object.keys(mapFileActions) : [],
  });

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  const formData = useMemo(() => extractFormData(formValues), [formValues]);
  const selectionData = useMemo(
    () => extractSelectionData(selectionState),
    [selectionState]
  );
  const storeData = useMemo(
    () => extractStoreData(imageGalleryStore),
    [imageGalleryStore]
  );

  const finalSelectedSliderIndices = useMemo(() => {
    const { selectedSliderIndices: storeIndices } = storeData;
    const { selectedSliderIndices: selectionIndices } = selectionData;

    const indices = storeIndices.length > 0 ? storeIndices : selectionIndices;

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

  const isMobileDevice = useMemo(() => detectMobileDevice(), []);

  const {
    uploading,
    uploadStatus,
    hasActiveUploads,
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
  } = useFileUploadState();

  const { duplicateMessageState, showDuplicateMessage } =
    useDuplicateFileHandler();

  // 🚨 FIXED: 타입 안전성을 위한 Map 파일 제거 로직 개선
  const handleDeleteImage = useCallback(
    (imageIndex: number, imageName: string) => {
      console.log('🗑️ [DELETE] 이미지 삭제 처리:', { imageIndex, imageName });

      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'delete'
      );

      if (!permission.canProceed) {
        const { reason = '삭제할 수 없습니다.' } = permission;
        const warningToast = createToast('삭제 불가', reason, 'warning');
        showToastMessage(warningToast);
        return;
      }

      const imageUrl = formData.media[imageIndex];
      if (imageUrl && imageUrl === formData.mainImage) {
        setMainImageValue('');
        console.log('📸 [DELETE] 메인 이미지 해제:', { imageIndex });
      }

      // 🚨 FIXED: Map 기반 파일 제거 - 타입 안전성 개선
      if (mapFileActions) {
        try {
          const allFiles = mapFileActions.getFileUrls();
          const urlIndex = allFiles.indexOf(imageUrl);

          if (urlIndex === -1) {
            console.warn('⚠️ [DELETE] Map에서 URL을 찾을 수 없음:', {
              imageUrl: imageUrl?.slice(0, 50),
              urlIndex,
            });
          } else {
            const allNames = mapFileActions.getFileNames();
            const fileName = allNames[urlIndex];
            const legacyArrays = mapFileActions.convertToLegacyArrays();
            const fileIds = Array.from(legacyArrays.urls.keys());
            const rawFileId = fileIds[urlIndex];

            console.log('🔍 [DELETE_DEBUG] 타입 정보:', {
              rawFileIdType: typeof rawFileId,
              rawFileIdValue: rawFileId,
              urlIndex,
              fileName,
            });

            if (rawFileId !== undefined) {
              const convertedFileId = convertFileIdToString(rawFileId);

              if (convertedFileId === null) {
                console.error('❌ [DELETE] fileId 변환 실패:', {
                  rawFileId,
                  type: typeof rawFileId,
                });
                return;
              }

              mapFileActions.removeFile(convertedFileId);
              console.log('✅ [DELETE] Map에서 파일 제거 완료:', {
                originalFileId: rawFileId,
                convertedFileId,
                fileName,
                imageIndex,
              });
            } else {
              console.error('❌ [DELETE] fileId가 undefined:', {
                urlIndex,
                fileIdsLength: fileIds.length,
              });
            }
          }
        } catch (mapDeleteError) {
          console.error('❌ [DELETE] Map에서 파일 제거 실패:', mapDeleteError);
        }
      }

      updateMediaValue((previousMedia) =>
        previousMedia.filter((_, index) => index !== imageIndex)
      );
      updateSelectedFileNames((previousNames) =>
        previousNames.filter((_, index) => index !== imageIndex)
      );

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
      mapFileActions,
    ]
  );

  const {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  } = useDeleteConfirmation(handleDeleteImage);

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
      mapFileActions: mapFileActions,
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
      mapFileActions,
    ]
  );

  console.log('🔍 [PHASE2_FIX] fileProcessingCallbacks 생성:', {
    hasMapFileActions: fileProcessingCallbacks.mapFileActions !== undefined,
    mapFileActionsType: typeof fileProcessingCallbacks.mapFileActions,
    callbackKeys: Object.keys(fileProcessingCallbacks),
  });

  const fileProcessingHandlers = useFileProcessing(
    formData.media,
    selectionData.selectedFileNames,
    fileProcessingCallbacks
  );

  const { touchActiveImages, handleImageTouch: originalHandleImageTouch } =
    useMobileTouchState(isMobileDevice);

  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      console.log('👆 [TOUCH] 이미지 터치:', { imageIndex });

      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'touch'
      );

      if (!permission.canProceed) {
        const { reason = '터치할 수 없습니다.' } = permission;
        const infoToast = createToast('터치 제한', reason, 'primary');
        showToastMessage(infoToast);
        return;
      }

      if (originalHandleImageTouch) {
        originalHandleImageTouch(imageIndex);
      }
    },
    [finalSelectedSliderIndices, originalHandleImageTouch, showToastMessage]
  );

  const handleFileSelectClick = useCallback(() => {
    console.log('📁 [FILE_SELECT] 파일 선택 버튼 클릭');

    const { current: buttonRef } = fileSelectButtonRef;
    if (!buttonRef?.click) {
      console.warn('⚠️ [FILE_SELECT] 파일 선택 버튼 참조 없음');
      return;
    }

    try {
      buttonRef.click();
      console.log('✅ [FILE_SELECT] 파일 입력 클릭 성공');
    } catch (clickError) {
      console.error('❌ [FILE_SELECT] 파일 입력 클릭 실패:', clickError);
    }
  }, []);

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

      const permission = validateSliderPermission(
        imageIndex,
        finalSelectedSliderIndices,
        'mainImage'
      );

      if (!permission.canProceed) {
        const { reason = '설정할 수 없습니다.' } = permission;
        const warningToast = createToast(
          '메인 이미지 설정 불가',
          reason,
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

      const isPlaceholder =
        imageUrl.startsWith('placeholder-') && imageUrl.includes('-processing');
      if (isPlaceholder) return false;

      if (checkIsMainImage(imageUrl)) return false;

      const isValidUrl =
        imageUrl.startsWith('data:image/') ||
        imageUrl.startsWith('http') ||
        imageUrl.startsWith('blob:');

      return isValidUrl;
    },
    [checkIsMainImage]
  );

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

      const {
        setSliderSelectedIndices,
        updateSliderSelection: storeUpdate,
        setSelectedSliderIndices,
      } = storeData;

      if (setSliderSelectedIndices) {
        setSliderSelectedIndices(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] setSliderSelectedIndices 사용');
        return;
      }

      if (storeUpdate) {
        storeUpdate(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] updateSliderSelection 사용');
        return;
      }

      if (setSelectedSliderIndices) {
        setSelectedSliderIndices(newSelectedIndices);
        console.log('✅ [SLIDER_UPDATE] setSelectedSliderIndices 사용');
        return;
      }

      console.warn('⚠️ [SLIDER_UPDATE] 사용 가능한 업데이트 메서드 없음');
    },
    [storeData, finalSelectedSliderIndices.length]
  );

  const result: UseImageUploadHandlersResult = useMemo(
    () => ({
      uploading,
      uploadStatus,
      deleteConfirmState,
      duplicateMessageState,
      touchActiveImages,
      hasActiveUploads,
      isMobileDevice,
      selectedSliderIndices: finalSelectedSliderIndices,
      isImageSelectedForSlider,
      handleFilesDropped: fileProcessingHandlers.handleFilesDropped,
      handleFileSelectClick,
      handleFileChange: fileProcessingHandlers.handleFileChange,
      handleDeleteButtonClick: showDeleteConfirmation,
      handleDeleteConfirm: confirmDelete,
      handleDeleteCancel: cancelDelete,
      handleImageTouch,
      handleMainImageSet,
      handleMainImageCancel,
      checkIsMainImage,
      checkCanSetAsMainImage,
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
    fileProcessingCallbacksWithMapActions:
      fileProcessingCallbacks.mapFileActions !== undefined,
  });

  return result;
};
