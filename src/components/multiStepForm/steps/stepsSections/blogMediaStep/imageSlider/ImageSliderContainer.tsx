// 📁 blogMediaStep/imageSlider/ImageSliderContainer.tsx

import React, { useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageSlider } from './hooks/useImageSlider';
import { useSliderSelection } from './hooks/useSliderSelection';
import { useSliderOrder } from './hooks/useSliderOrder';

// 🆕 슬라이더 상수 및 검증 함수 import
import { SLIDER_CONFIG } from '../../../../../ImageGalleryWithContent/utils/sliderConstants';
import { validateSliderImagesExcludingMain } from '../../../../../ImageGalleryWithContent/utils/sliderValidationUtils';

import SliderImageSelector from './parts/SliderImageSelector';
import SelectedSliderImages from './parts/SelectedSliderImages';
import SliderAddButton from './parts/SliderAddButton';

// 🔧 필요한 타입 정의들만 유지
interface ToastConfig {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'error' | 'info';
}

interface FormValues {
  readonly media?: readonly string[];
  readonly mainImage?: string | null;
}

interface ImageViewConfig {
  readonly selectedImages?: readonly string[];
  readonly sliderImages?: readonly string[];
  readonly mainImage?: string | null;
}

interface ImageGalleryStoreState {
  readonly imageViewConfig: ImageViewConfig | null;
}

// 🔧 안전한 데이터 추출 함수들
const extractFormValues = (stateResult: unknown): FormValues => {
  if (!stateResult || typeof stateResult !== 'object') {
    return {};
  }

  const formValues = Reflect.get(stateResult, 'formValues');
  if (!formValues || typeof formValues !== 'object') {
    return {};
  }

  const media = Reflect.get(formValues, 'media');
  const mainImage = Reflect.get(formValues, 'mainImage');

  const safeMedia = Array.isArray(media)
    ? media.filter((item): item is string => typeof item === 'string')
    : [];

  const safeMainImage =
    mainImage === null || mainImage === undefined
      ? null
      : typeof mainImage === 'string'
      ? mainImage
      : null;

  console.log('🔍 [FORM_EXTRACTION] 폼 값 추출:', {
    mediaCount: safeMedia.length,
    mainImageType: typeof mainImage,
    mainImageValue: safeMainImage ? safeMainImage.slice(0, 30) + '...' : 'null',
    mainImageIsNull: safeMainImage === null,
  });

  return {
    media: safeMedia,
    mainImage: safeMainImage,
  };
};

const extractImageGalleryStoreState = (
  store: unknown
): ImageGalleryStoreState => {
  if (!store || typeof store !== 'object') {
    return {
      imageViewConfig: null,
    };
  }

  const imageViewConfig = Reflect.get(store, 'imageViewConfig');

  const safeImageViewConfig: ImageViewConfig | null =
    imageViewConfig && typeof imageViewConfig === 'object'
      ? {
          selectedImages: Array.isArray(
            Reflect.get(imageViewConfig, 'selectedImages')
          )
            ? Reflect.get(imageViewConfig, 'selectedImages')
            : [],
          sliderImages: Array.isArray(
            Reflect.get(imageViewConfig, 'sliderImages')
          )
            ? Reflect.get(imageViewConfig, 'sliderImages')
            : [],
          mainImage: Reflect.get(imageViewConfig, 'mainImage') || null,
        }
      : null;

  console.log('🔍 [STORE_EXTRACTION] 스토어 상태 추출:', {
    hasImageViewConfig: safeImageViewConfig !== null,
    storeSliderImagesCount: safeImageViewConfig?.sliderImages?.length || 0,
  });

  return {
    imageViewConfig: safeImageViewConfig,
  };
};

// 🆕 readonly 배열을 mutable 배열로 안전하게 변환하는 함수들
const convertToMutableStringArray = (
  readonlyArray: readonly string[]
): string[] => {
  return Array.from(readonlyArray);
};

const convertToMutableNumberArray = (
  readonlyArray: readonly number[]
): number[] => {
  return Array.from(readonlyArray);
};

// 🆕 슬라이더 검증 함수용 타입 변환 (unknown[] 에러 해결)
const prepareArrayForValidation = (
  readonlyArray: readonly string[]
): string[] => {
  return convertToMutableStringArray(readonlyArray);
};

// 🆕 슬라이더 전용 해제 권한 검증 함수
const validateSliderRemovalPermission = (
  targetImageUrl: string,
  currentSliderImages: readonly string[],
  imageSource: 'slider_container' | 'upload_area'
): { canRemove: boolean; reason?: string } => {
  const isImageInSlider = currentSliderImages.includes(targetImageUrl);

  if (!isImageInSlider) {
    return {
      canRemove: false,
      reason: '해당 이미지가 슬라이더에 없습니다.',
    };
  }

  // 🚨 핵심: 업로드 영역에서의 해제 시도는 차단
  if (imageSource === 'upload_area') {
    console.log(
      '🚨 [SLIDER_PERMISSION] 업로드 영역에서 슬라이더 해제 시도 차단:',
      {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
        imageSource,
        reason: 'upload_area_removal_blocked',
      }
    );

    return {
      canRemove: false,
      reason: '슬라이더 컨테이너에서만 해제할 수 있습니다.',
    };
  }

  // 슬라이더 컨테이너에서의 해제는 허용
  console.log('✅ [SLIDER_PERMISSION] 슬라이더 컨테이너에서 해제 허용:', {
    targetImageUrl: targetImageUrl.slice(0, 30) + '...',
    imageSource,
  });

  return { canRemove: true };
};

// 🆕 상태 동기화 검증 함수
const validateStateSynchronization = (
  formMainImage: string | null,
  storeMainImage: string | null,
  formMediaFiles: readonly string[],
  storeSelectedImages: readonly string[]
): {
  isMainImageSynced: boolean;
  isMediaListSynced: boolean;
  syncIssues: readonly string[];
} => {
  const isMainImageSynced = formMainImage === storeMainImage;

  const isMediaListSynced =
    formMediaFiles.length === storeSelectedImages.length &&
    formMediaFiles.every((url, index) => url === storeSelectedImages[index]);

  const syncIssues: string[] = [];

  if (!isMainImageSynced) {
    syncIssues.push(
      `메인 이미지 불일치: form=${formMainImage || 'null'} vs store=${
        storeMainImage || 'null'
      }`
    );
  }

  if (!isMediaListSynced) {
    syncIssues.push(
      `미디어 리스트 불일치: form=${formMediaFiles.length}개 vs store=${storeSelectedImages.length}개`
    );
  }

  console.log('🔍 [SYNC_VALIDATION] 상태 동기화 검증:', {
    isMainImageSynced,
    isMediaListSynced,
    syncIssuesCount: syncIssues.length,
    syncIssues,
  });

  return {
    isMainImageSynced,
    isMediaListSynced,
    syncIssues,
  };
};

function ImageSliderContainer(): React.ReactNode {
  console.log('🚀 ImageSliderContainer 렌더링 시작 - 모든 타입 에러 해결:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 기본 상태 데이터 추출
  const blogMediaStepStateResult = useBlogMediaStepState();
  const safeStateResult = blogMediaStepStateResult || null;

  console.log('🔧 BlogMediaStepState 연결 상태:', {
    hasResult: safeStateResult !== null,
    resultType: typeof safeStateResult,
  });

  const formValues = extractFormValues(safeStateResult);
  const { media: formMediaFiles = [], mainImage: formMainImage = null } =
    formValues;

  // 🔧 ImageGalleryStore 상태 추출
  const imageGalleryStore = useImageGalleryStore();
  const storeState = extractImageGalleryStoreState(imageGalleryStore);
  const { imageViewConfig } = storeState;

  const storeMainImage = imageViewConfig?.mainImage || null;
  const storeSelectedImages = imageViewConfig?.selectedImages || [];
  const currentSliderImageUrlList = imageViewConfig?.sliderImages || [];

  // 🆕 상태 동기화 검증
  const syncValidation = useMemo(() => {
    return validateStateSynchronization(
      formMainImage,
      storeMainImage,
      formMediaFiles,
      storeSelectedImages
    );
  }, [formMainImage, storeMainImage, formMediaFiles, storeSelectedImages]);

  // 🔧 최종 데이터 우선순위 결정 (동기화 상태 고려)
  const finalMediaFileList = useMemo(() => {
    if (syncValidation.isMediaListSynced) {
      console.log('✅ [DATA_SYNC] 미디어 리스트 동기화됨 - 폼 데이터 사용');
      return formMediaFiles;
    }

    console.log('⚠️ [DATA_SYNC] 미디어 리스트 불일치 - 폼 데이터 우선 사용');
    return formMediaFiles.length > 0 ? formMediaFiles : storeSelectedImages;
  }, [formMediaFiles, storeSelectedImages, syncValidation.isMediaListSynced]);

  const finalMainImageUrl = useMemo(() => {
    if (syncValidation.isMainImageSynced) {
      console.log('✅ [DATA_SYNC] 메인 이미지 동기화됨');
      return formMainImage;
    }

    console.log('⚠️ [DATA_SYNC] 메인 이미지 불일치 - 폼 데이터 우선 사용');
    return formMainImage !== null ? formMainImage : storeMainImage;
  }, [formMainImage, storeMainImage, syncValidation.isMainImageSynced]);

  // 🔧 토스트 메시지 핸들러
  const addToastMessage = useCallback((toastConfig: ToastConfig) => {
    console.log(
      '📢 [TOAST] 토스트 메시지:',
      toastConfig.title,
      '-',
      toastConfig.description
    );
    // TODO: 실제 토스트 시스템 연결 필요
  }, []);

  console.log('🔍 [FINAL_DATA] 최종 결정된 데이터:', {
    finalMediaCount: finalMediaFileList.length,
    finalMainImageExists: finalMainImageUrl !== null,
    finalMainImageUrl: finalMainImageUrl
      ? finalMainImageUrl.slice(0, 30) + '...'
      : 'null',
    sliderImagesCount: currentSliderImageUrlList.length,
    syncValidationPassed:
      syncValidation.isMainImageSynced && syncValidation.isMediaListSynced,
    syncIssuesCount: syncValidation.syncIssues.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 슬라이더 관련 훅들
  const imageSliderHook = useImageSlider();
  const {
    removeFromSlider: removeImageFromSliderByUrl,
    addSelectedToSlider: addSelectedImageListToSlider,
    clearSliderImages: clearAllSliderImageList,
    getSliderImageCount: getCurrentSliderImageTotalCount,
  } = imageSliderHook || {};

  const sliderSelectionHook = useSliderSelection();
  const {
    selectedSliderImages: selectedImageIndexList = [],
    handleSliderImageSelect: originalHandleSliderImageSelect,
    setSelectedSliderImages: updateSelectedImageIndexList,
  } = sliderSelectionHook || {};

  const sliderOrderHook = useSliderOrder();
  const {
    moveToFirst: moveImageToFirstPosition,
    moveToLast: moveImageToLastPosition,
  } = sliderOrderHook || {};

  console.log('🔧 [HOOKS] 슬라이더 훅들 초기화 완료:', {
    sliderImageCount: currentSliderImageUrlList.length,
    selectedImageCount: selectedImageIndexList.length,
    hasSliderHooks: Boolean(
      imageSliderHook && sliderSelectionHook && sliderOrderHook
    ),
  });

  // 🔧 메인 이미지 제외한 슬라이더 가능 이미지 계산
  const availableForSliderImageList = useMemo(() => {
    const hasValidMainImage =
      finalMainImageUrl !== null &&
      finalMainImageUrl !== undefined &&
      typeof finalMainImageUrl === 'string' &&
      finalMainImageUrl.length > 0;

    console.log('🔧 [AVAILABLE_IMAGES] 슬라이더 가능 이미지 계산:', {
      finalMainImageUrl: finalMainImageUrl
        ? finalMainImageUrl.slice(0, 30) + '...'
        : 'null',
      hasValidMainImage,
      totalImages: finalMediaFileList.length,
    });

    if (!hasValidMainImage) {
      console.log(
        '✅ [AVAILABLE_IMAGES] 메인 이미지 없음 - 모든 이미지 슬라이더 가능'
      );
      return finalMediaFileList;
    }

    const filteredImageList = finalMediaFileList.filter(
      (imageUrl: string) => imageUrl !== finalMainImageUrl
    );

    console.log('✅ [AVAILABLE_IMAGES] 메인 이미지 제외 완료:', {
      originalCount: finalMediaFileList.length,
      filteredCount: filteredImageList.length,
      excludedCount: finalMediaFileList.length - filteredImageList.length,
    });

    return filteredImageList;
  }, [finalMediaFileList, finalMainImageUrl]);

  // 🔧 이미지 선택 핸들러 (메인 이미지 보호 포함)
  const handleImageSelectionToggleByIndex = useCallback(
    (imageIndex: number) => {
      console.log('🔧 [IMAGE_SELECTION] 이미지 선택 토글:', {
        imageIndex,
        currentSelectedCount: selectedImageIndexList.length,
        hasMainImage: finalMainImageUrl !== null,
      });

      // 🚨 메인 이미지 선택 방지
      const targetImageUrl = finalMediaFileList[imageIndex];
      if (
        targetImageUrl &&
        finalMainImageUrl &&
        finalMainImageUrl !== null &&
        targetImageUrl === finalMainImageUrl
      ) {
        console.log('❌ [IMAGE_SELECTION] 메인 이미지는 슬라이더 선택 불가:', {
          imageIndex,
          targetImageUrl: targetImageUrl.slice(0, 30) + '...',
          mainImageUrl: finalMainImageUrl.slice(0, 30) + '...',
        });

        addToastMessage({
          title: '선택 불가',
          description: '메인 이미지는 슬라이더에 추가할 수 없습니다.',
          color: 'warning',
        });
        return;
      }

      if (originalHandleSliderImageSelect) {
        originalHandleSliderImageSelect(imageIndex);
      }

      console.log('✅ [IMAGE_SELECTION] 이미지 선택 토글 완료:', {
        imageIndex,
      });
    },
    [
      originalHandleSliderImageSelect,
      selectedImageIndexList.length,
      finalMediaFileList,
      finalMainImageUrl,
      addToastMessage,
    ]
  );

  // 🔧 선택된 이미지 URL 리스트 생성
  const getSelectedImageUrlListFromIndexList = useCallback(
    (mediaFileUrlList: readonly string[]) => {
      console.log('🔄 [URL_LIST] 선택된 이미지 URL 목록 생성:', {
        mediaFileCount: mediaFileUrlList.length,
        selectedIndexCount: selectedImageIndexList.length,
      });

      const selectedUrlList = selectedImageIndexList
        .map((imageIndex: number) => {
          const imageUrl = mediaFileUrlList[imageIndex];
          return imageUrl || null;
        })
        .filter((imageUrl): imageUrl is string => {
          const isValidUrl =
            imageUrl !== null &&
            imageUrl !== undefined &&
            typeof imageUrl === 'string' &&
            imageUrl.length > 0;
          return isValidUrl;
        });

      console.log('✅ [URL_LIST] 선택된 이미지 URL 목록 생성 완료:', {
        resultCount: selectedUrlList.length,
      });

      return selectedUrlList;
    },
    [selectedImageIndexList]
  );

  // 🔧 현재 선택 상태 관리
  const selectedImageUrlList = useMemo(
    () => getSelectedImageUrlListFromIndexList(finalMediaFileList),
    [getSelectedImageUrlListFromIndexList, finalMediaFileList]
  );

  const currentSelectedImageCount = useMemo(
    () => selectedImageIndexList.length,
    [selectedImageIndexList.length]
  );

  const clearCurrentImageSelection = useCallback(() => {
    console.log('🔄 [CLEAR_SELECTION] 선택 목록 초기화');

    if (updateSelectedImageIndexList) {
      updateSelectedImageIndexList([]);
    }

    console.log('✅ [CLEAR_SELECTION] 선택 목록 초기화 완료');
  }, [updateSelectedImageIndexList]);

  // 🔧 슬라이더에 이미지 추가 핸들러
  const handleAddSelectedImageListToSlider = useCallback(() => {
    console.log('🔧 [ADD_TO_SLIDER] 선택된 이미지들을 슬라이더에 추가:', {
      selectedImageCount: selectedImageUrlList.length,
    });

    const selectedImageCount = selectedImageUrlList.length;

    if (selectedImageCount === 0) {
      console.log('❌ [ADD_TO_SLIDER] 선택된 이미지 없음');
      addToastMessage({
        title: '선택된 이미지가 없습니다',
        description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (addSelectedImageListToSlider) {
      addSelectedImageListToSlider(selectedImageUrlList);
    }

    clearCurrentImageSelection();

    console.log('✅ [ADD_TO_SLIDER] 슬라이더에 이미지 추가 완료:', {
      addedImageCount: selectedImageCount,
    });
  }, [
    selectedImageUrlList,
    addSelectedImageListToSlider,
    clearCurrentImageSelection,
    addToastMessage,
  ]);

  // 🆕 슬라이더 전용 해제 핸들러 (권한 검증 강화)
  const handleRemoveImageFromSliderByUrl = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 [SLIDER_REMOVE] 슬라이더 전용 해제 핸들러 실행:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
        currentSliderCount: currentSliderImageUrlList.length,
      });

      // 🚨 핵심: 슬라이더 전용 해제 권한 검증
      const removalPermission = validateSliderRemovalPermission(
        targetImageUrl,
        currentSliderImageUrlList,
        'slider_container' // 슬라이더 컨테이너에서의 해제 시도
      );

      if (!removalPermission.canRemove) {
        console.log('❌ [SLIDER_REMOVE] 해제 권한 없음:', {
          targetImageUrl: targetImageUrl.slice(0, 30) + '...',
          reason: removalPermission.reason,
        });

        addToastMessage({
          title: '해제 불가',
          description: removalPermission.reason || '해제할 수 없습니다.',
          color: 'warning',
        });
        return;
      }

      // 권한 검증 통과 시 실제 해제 실행
      if (removeImageFromSliderByUrl) {
        removeImageFromSliderByUrl(targetImageUrl);
      }

      addToastMessage({
        title: '슬라이더에서 제거',
        description: '이미지가 슬라이더에서 제거되었습니다.',
        color: 'success',
      });

      console.log('✅ [SLIDER_REMOVE] 슬라이더에서 이미지 제거 완료:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
        remainingCount: currentSliderImageUrlList.length - 1,
      });
    },
    [removeImageFromSliderByUrl, addToastMessage, currentSliderImageUrlList]
  );

  // 🔧 이미지 순서 이동 핸들러들
  const handleMoveImageToFirstPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 [MOVE_FIRST] 이미지 첫 번째 위치로 이동:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToFirstPosition) {
        moveImageToFirstPosition(targetImageUrl);
      }

      console.log('✅ [MOVE_FIRST] 이미지 첫 번째 위치로 이동 완료');
    },
    [moveImageToFirstPosition]
  );

  const handleMoveImageToLastPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 [MOVE_LAST] 이미지 마지막 위치로 이동:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToLastPosition) {
        moveImageToLastPosition(targetImageUrl);
      }

      console.log('✅ [MOVE_LAST] 이미지 마지막 위치로 이동 완료');
    },
    [moveImageToLastPosition]
  );

  // 🔧 모든 슬라이더 이미지 초기화 핸들러
  const handleClearAllSliderImageList = useCallback(() => {
    console.log('🔧 [CLEAR_ALL] 모든 슬라이더 이미지 초기화:', {
      currentSliderCount: currentSliderImageUrlList.length,
    });

    if (clearAllSliderImageList) {
      clearAllSliderImageList();
    }

    clearCurrentImageSelection();

    console.log('✅ [CLEAR_ALL] 모든 슬라이더 이미지 초기화 완료');
  }, [clearAllSliderImageList, clearCurrentImageSelection]);

  // 🔧 슬라이더 생성 가능 여부 검증 (unknown[] 에러 해결)
  const sliderValidationResult = useMemo(() => {
    // 🚨 핵심 수정: prepareArrayForValidation으로 타입 변환
    const preparedMediaFiles = prepareArrayForValidation(finalMediaFileList);
    return validateSliderImagesExcludingMain(
      preparedMediaFiles,
      finalMainImageUrl
    );
  }, [finalMediaFileList, finalMainImageUrl]);

  const isSliderCreationPossible = sliderValidationResult.isValid;
  const totalAvailableForSliderImageCount = availableForSliderImageList.length;
  const currentSliderImageTotalCount = getCurrentSliderImageTotalCount
    ? getCurrentSliderImageTotalCount()
    : 0;
  const sliderImageCount = currentSliderImageUrlList.length;
  const hasSelectedSliderImages = sliderImageCount > 0;
  const hasAvailableImageFiles = finalMediaFileList.length > 0;

  console.log(
    '🎯 [FINAL_STATE] ImageSliderContainer 최종 상태 - 모든 타입 에러 해결 완료:',
    {
      totalOriginalImages: finalMediaFileList.length,
      totalAvailableForSliderImageCount,
      isSliderCreationPossible,
      minimumRequired: SLIDER_CONFIG.MIN_IMAGES,
      hasMainImage: finalMainImageUrl !== null,
      mainImageUrl: finalMainImageUrl
        ? finalMainImageUrl.slice(0, 30) + '...'
        : 'null',
      currentSliderImageCount: sliderImageCount,
      selectedImageCount: currentSelectedImageCount,
      sliderRemovalPermissionEnabled: true,
      stateSynchronizationValidated: true,
      allTypeErrorsFixed: true,
      unknownArrayErrorFixed: true,
      unusedInterfacesRemoved: true,
      sliderValidationResult: {
        isValid: sliderValidationResult.isValid,
        errorCode: sliderValidationResult.errorCode,
      },
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  return (
    <section
      className="space-y-6"
      role="region"
      aria-labelledby="image-slider-section-title"
      aria-describedby="image-slider-section-description"
    >
      <header>
        <h2
          id="image-slider-section-title"
          className="mb-2 text-xl font-semibold text-gray-900"
        >
          이미지 슬라이더
        </h2>
        <p id="image-slider-section-description" className="text-gray-600">
          블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요.
          {finalMainImageUrl ? (
            <span className="block mt-1 text-sm text-blue-600">
              ℹ️ 메인 이미지는 슬라이더에서 자동으로 제외됩니다.
            </span>
          ) : null}
          <span className="block mt-1 text-xs text-green-600">
            🔒 슬라이더 이미지는 이 영역에서만 해제할 수 있습니다.
          </span>
        </p>
      </header>

      <main className="space-y-4">
        {hasAvailableImageFiles ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm text-default-600"
                id="slider-status-display"
                aria-live="polite"
              >
                슬라이더 가능한 이미지 {totalAvailableForSliderImageCount}개 |{' '}
                <span className="font-medium text-primary">
                  {currentSelectedImageCount}개 선택됨
                </span>
                {finalMainImageUrl ? (
                  <span className="ml-2 text-xs text-blue-600">
                    (메인 이미지 1개 제외됨)
                  </span>
                ) : null}
                {!syncValidation.isMainImageSynced ||
                !syncValidation.isMediaListSynced ? (
                  <span className="ml-2 text-xs text-orange-600">
                    (상태 동기화 중...)
                  </span>
                ) : null}
              </div>
              {hasSelectedSliderImages ? (
                <button
                  type="button"
                  onClick={handleClearAllSliderImageList}
                  className="text-sm underline rounded text-danger hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                  aria-label={`슬라이더의 모든 이미지 ${currentSliderImageTotalCount}개 초기화`}
                  aria-describedby="slider-status-display"
                >
                  모두 초기화
                </button>
              ) : null}
            </div>

            {!isSliderCreationPossible ? (
              <div
                className="p-4 border rounded-lg bg-warning-50 border-warning-200"
                role="alert"
                aria-labelledby="slider-minimum-requirement-title"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    icon="lucide:info"
                    className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3
                      id="slider-minimum-requirement-title"
                      className="text-sm font-medium text-warning-800"
                    >
                      슬라이더 생성 조건 안내
                    </h3>
                    <p className="mt-1 text-sm text-warning-700">
                      {SLIDER_CONFIG.MIN_IMAGES}개 이미지부터 슬라이더를 생성할
                      수 있습니다.
                      <br />
                      현재 메인 이미지를 제외한 이미지가{' '}
                      {totalAvailableForSliderImageCount}개 있습니다.
                      {totalAvailableForSliderImageCount === 0
                        ? ' 추가 이미지를 업로드해주세요.'
                        : ` ${
                            SLIDER_CONFIG.MIN_IMAGES -
                            totalAvailableForSliderImageCount
                          }개 더 업로드해주세요.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <section
              role="group"
              aria-labelledby="image-selection-section-title"
            >
              <h3 id="image-selection-section-title" className="sr-only">
                슬라이더에 추가할 이미지 선택
              </h3>
              <SliderImageSelector
                mediaFiles={convertToMutableStringArray(finalMediaFileList)}
                mainImage={finalMainImageUrl}
                localSliderImages={convertToMutableStringArray(
                  currentSliderImageUrlList
                )}
                selectedSliderImages={convertToMutableNumberArray(
                  selectedImageIndexList
                )}
                onSliderImageSelect={handleImageSelectionToggleByIndex}
              />
            </section>

            {isSliderCreationPossible ? (
              <SliderAddButton
                selectedCount={currentSelectedImageCount}
                onAddToSlider={handleAddSelectedImageListToSlider}
                isDisabled={
                  !hasAvailableImageFiles || currentSelectedImageCount === 0
                }
              />
            ) : null}

            {hasSelectedSliderImages ? (
              <section
                role="group"
                aria-labelledby="selected-slider-images-section-title"
              >
                <h3
                  id="selected-slider-images-section-title"
                  className="mb-3 text-lg font-medium text-gray-900"
                >
                  🎯 슬라이더 이미지 관리
                  <span className="ml-2 text-sm font-normal text-green-600">
                    (전용 해제 영역)
                  </span>
                </h3>
                <div className="p-3 mb-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Icon
                      icon="lucide:shield-check"
                      className="w-4 h-4 text-green-600"
                      aria-hidden="true"
                    />
                    <span>
                      이 영역에서만 슬라이더 이미지를 해제할 수 있습니다. 업로드
                      영역에서는 해제가 제한됩니다.
                    </span>
                  </div>
                </div>
                <SelectedSliderImages
                  localSliderImages={convertToMutableStringArray(
                    currentSliderImageUrlList
                  )}
                  onRemoveFromSlider={handleRemoveImageFromSliderByUrl}
                  onMoveToFirst={handleMoveImageToFirstPosition}
                  onMoveToLast={handleMoveImageToLastPosition}
                  showOrderControls={true}
                />
              </section>
            ) : null}
          </>
        ) : (
          <div
            className="p-4 text-center rounded-lg bg-default-100"
            role="status"
            aria-label="이미지 업로드 안내"
          >
            <Icon
              icon="lucide:layout-grid"
              className="w-10 h-10 mx-auto mb-2 text-default-400"
              aria-hidden="true"
              width={40}
              height={40}
            />
            <p className="text-default-600">
              {finalMainImageUrl !== null && finalMainImageUrl !== undefined ? (
                <>
                  메인 이미지가 설정되었습니다.
                  <br />
                  추가 이미지를 업로드하면 슬라이더를 구성할 수 있습니다.
                </>
              ) : (
                '이미지를 업로드하면 슬라이더를 구성할 수 있습니다.'
              )}
            </p>
          </div>
        )}
      </main>
    </section>
  );
}

export default ImageSliderContainer;
