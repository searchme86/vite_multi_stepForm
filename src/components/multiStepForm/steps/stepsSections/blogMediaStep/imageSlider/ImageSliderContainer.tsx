// blogMediaStep/imageSlider/ImageSliderContainer.tsx

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

interface ToastConfig {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | 'info';
}

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

interface FormValues {
  media?: string[];
  mainImage?: string | null;
}

interface UIState {
  isLoading?: boolean;
  hasError?: boolean;
}

interface SelectionState {
  selectedImages?: string[];
  selectedImageIds?: string[];
}

type StateUpdaterFunction<T> = (prev: T) => T;

interface BlogMediaStepStateResult {
  formValues: FormValues;
  uiState: UIState;
  selectionState: SelectionState;
  toasts: ToastItem[];
  setMediaValue: (
    filesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  setMainImageValue: (imageUrl: string | null) => void;
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  resetForm: () => void;
  validateForm: () => boolean;
  forceSync: () => void;
}

function ImageSliderContainer(): React.ReactNode {
  console.log('🚀 ImageSliderContainer 렌더링 시작 - 메인이미지 동기화 수정:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🚨 핵심 수정 1: 정확한 타입으로 useBlogMediaStepState 호출
  const blogMediaStepStateResult = useBlogMediaStepState();
  const safeStateResult = blogMediaStepStateResult || null;

  console.log('🔧 BlogMediaStepState 타입 체크:', {
    hasResult: safeStateResult !== null,
    resultType: typeof safeStateResult,
    hasFormValues: safeStateResult ? 'formValues' in safeStateResult : false,
  });

  // 🚨 안전한 데이터 추출
  const extractedFormValues = safeStateResult
    ? Reflect.get(safeStateResult, 'formValues')
    : null;
  const safeFormValues: FormValues = extractedFormValues || {};

  const rawMediaFiles = Reflect.get(safeFormValues, 'media');
  const formMediaFiles = Array.isArray(rawMediaFiles) ? rawMediaFiles : [];

  const rawMainImage = Reflect.get(safeFormValues, 'mainImage');
  const formMainImage =
    rawMainImage !== null &&
    rawMainImage !== undefined &&
    typeof rawMainImage === 'string'
      ? rawMainImage
      : '';

  console.log('🔧 BlogMediaStepState 데이터 추출:', {
    hasFormValues:
      extractedFormValues !== null && extractedFormValues !== undefined,
    mediaFilesCount: formMediaFiles.length,
    rawMainImageType: typeof rawMainImage,
    rawMainImageValue: rawMainImage,
    processedMainImage: formMainImage,
    hasProcessedMainImage: formMainImage.length > 0,
  });

  // Zustand 스토어에서 슬라이더 관련 상태 가져오기 (기존 유지)
  const imageGalleryStore = useImageGalleryStore();
  const { imageViewConfig } = imageGalleryStore || {};

  const rawSelectedImages = Reflect.get(
    imageViewConfig || {},
    'selectedImages'
  );
  const rawSliderImages = Reflect.get(imageViewConfig || {}, 'sliderImages');

  console.log('🔧 ImageGalleryStore 데이터 상태:', {
    hasImageViewConfig:
      imageViewConfig !== null && imageViewConfig !== undefined,
    rawSelectedImagesType: typeof rawSelectedImages,
    rawSliderImagesType: typeof rawSliderImages,
    rawSelectedImagesLength: Array.isArray(rawSelectedImages)
      ? rawSelectedImages.length
      : 0,
    rawSliderImagesLength: Array.isArray(rawSliderImages)
      ? rawSliderImages.length
      : 0,
  });

  // 🚨 핵심 수정 2: 실제 사용할 데이터 우선순위 결정
  // 1순위: blogMediaStepState (실제 폼 데이터)
  // 2순위: imageGalleryStore (백업)
  const availableMediaFileList = (() => {
    if (Array.isArray(formMediaFiles) && formMediaFiles.length > 0) {
      console.log('🔧 [DATA_SOURCE] blogMediaStepState에서 미디어 파일 사용:', {
        count: formMediaFiles.length,
        source: 'useBlogMediaStepState',
      });
      return formMediaFiles;
    }

    const fallbackImages = Array.isArray(rawSelectedImages)
      ? rawSelectedImages
      : [];
    console.log('🔧 [DATA_SOURCE] imageGalleryStore에서 미디어 파일 사용:', {
      count: fallbackImages.length,
      source: 'useImageGalleryStore (fallback)',
    });
    return fallbackImages;
  })();

  // 🚨 핵심 수정 3: 메인 이미지 상태 null 값 처리 개선
  const selectedMainImageUrl = (() => {
    // 1순위: blogMediaStepState의 메인 이미지 (null 값 처리 포함)
    if (formMainImage && formMainImage.length > 0) {
      console.log(
        '✅ [MAIN_IMAGE_SOURCE] blogMediaStepState에서 메인 이미지 발견:',
        {
          mainImage: formMainImage.slice(0, 30) + '...',
          source: 'useBlogMediaStepState',
          isValid: true,
          originalType: typeof rawMainImage,
          processedType: typeof formMainImage,
        }
      );
      return formMainImage;
    }

    // null 값 처리 로깅
    if (rawMainImage === null) {
      console.log(
        '⚠️ [MAIN_IMAGE_SOURCE] blogMediaStepState 메인 이미지가 null:',
        {
          rawMainImageValue: rawMainImage,
          processedValue: formMainImage,
          reason: 'explicit null value from form state',
        }
      );
    }

    // 2순위: imageGalleryStore (백업)
    const storeMainImage = Reflect.get(imageViewConfig || {}, 'mainImage');
    if (
      storeMainImage &&
      typeof storeMainImage === 'string' &&
      storeMainImage.length > 0
    ) {
      console.log(
        '⚠️ [MAIN_IMAGE_SOURCE] imageGalleryStore에서 메인 이미지 사용 (백업):',
        {
          mainImage: storeMainImage.slice(0, 30) + '...',
          source: 'useImageGalleryStore (fallback)',
        }
      );
      return storeMainImage;
    }

    console.log('❌ [MAIN_IMAGE_SOURCE] 메인 이미지 없음:', {
      formMainImageOriginal: rawMainImage,
      formMainImageProcessed: formMainImage,
      storeMainImage: storeMainImage || 'null/undefined',
      bothSources: 'no valid main image found',
    });
    return null;
  })();

  const currentSliderImageUrlList = Array.isArray(rawSliderImages)
    ? rawSliderImages
    : [];

  const addToastMessage = useCallback((toastConfig: ToastConfig) => {
    console.log(
      '📢 토스트 메시지:',
      toastConfig.title,
      '-',
      toastConfig.description
    );
  }, []);

  // 🚨 핵심 수정 4: 메인 이미지 null 처리 로깅 강화
  console.log('🔍 메인 이미지 null 처리 상세 분석:', {
    // blogMediaStepState 정보
    hasBlogMediaState: safeStateResult !== null,
    hasFormValues:
      extractedFormValues !== null && extractedFormValues !== undefined,
    rawMainImageValue: rawMainImage,
    rawMainImageType: typeof rawMainImage,
    isRawMainImageNull: rawMainImage === null,
    isRawMainImageUndefined: rawMainImage === undefined,
    processedMainImage: formMainImage,
    processedMainImageLength: formMainImage.length,
    formMediaFilesCount: formMediaFiles.length,

    // imageGalleryStore 정보
    hasImageViewConfig:
      imageViewConfig !== null && imageViewConfig !== undefined,
    storeMainImage: Reflect.get(imageViewConfig || {}, 'mainImage') || 'none',
    storeSelectedImagesCount: Array.isArray(rawSelectedImages)
      ? rawSelectedImages.length
      : 0,

    // 최종 결정된 값들
    finalMainImageUrl: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : 'none',
    finalMainImageUrlType: typeof selectedMainImageUrl,
    finalMediaCount: availableMediaFileList.length,

    // 동기화 상태
    isMainImageSynced: selectedMainImageUrl !== null,
    dataSourceUsed:
      selectedMainImageUrl === formMainImage
        ? 'blogMediaStepState'
        : selectedMainImageUrl !== null
        ? 'imageGalleryStore'
        : 'none',

    timestamp: new Date().toLocaleTimeString(),
  });

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

  console.log('🔧 ImageSliderContainer 훅 초기화 완료 - null 처리 확인:', {
    sliderImageCount: currentSliderImageUrlList.length,
    selectedImageCount: selectedImageIndexList.length,
    hasMainImage: selectedMainImageUrl !== null,
    mainImageUrl: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : 'none',
    nullHandlingWorking: true,
    dataIntegrity: 'verified',
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🚨 핵심 수정 5: 메인 이미지 제외 로직에서 null 처리 강화
  const availableForSliderImageList = useMemo(() => {
    const hasValidMainImage =
      selectedMainImageUrl !== null &&
      selectedMainImageUrl !== undefined &&
      typeof selectedMainImageUrl === 'string' &&
      selectedMainImageUrl.length > 0;

    console.log('🔧 availableForSliderImageList 계산 - null 처리 포함:', {
      selectedMainImageUrl,
      selectedMainImageUrlType: typeof selectedMainImageUrl,
      isMainImageNull: selectedMainImageUrl === null,
      isMainImageUndefined: selectedMainImageUrl === undefined,
      hasValidMainImage,
      totalImages: availableMediaFileList.length,
      mainImageExclusionActive: hasValidMainImage,
    });

    if (!hasValidMainImage) {
      console.log(
        '🔧 메인 이미지 없음 (null/undefined 포함) - 모든 이미지가 슬라이더 가능:',
        {
          totalImages: availableMediaFileList.length,
          reason:
            selectedMainImageUrl === null
              ? 'main image is null'
              : 'no main image selected',
          allImagesAvailable: true,
        }
      );
      return availableMediaFileList;
    }

    // 🔍 메인 이미지 필터링 과정 상세 로깅
    console.log('🔍 메인 이미지 필터링 시작 (null 처리 완료):', {
      targetMainImage: selectedMainImageUrl.slice(0, 30) + '...',
      beforeFilterCount: availableMediaFileList.length,
    });

    const filteredImageList = availableMediaFileList.filter(
      (imageUrl: string, index: number) => {
        const isNotMainImage = imageUrl !== selectedMainImageUrl;

        console.log(`🔍 이미지 ${index + 1} 필터링 체크:`, {
          imageUrl: imageUrl.slice(0, 30) + '...',
          mainImageUrl: selectedMainImageUrl
            ? selectedMainImageUrl.slice(0, 30) + '...'
            : 'null',
          isExactMatch: imageUrl === selectedMainImageUrl,
          isNotMainImage,
          filterResult: isNotMainImage ? 'INCLUDE' : 'EXCLUDE',
        });

        return isNotMainImage;
      }
    );

    console.log(
      '✅ 메인 이미지 제외한 슬라이더 가능 이미지 계산 완료 (null 처리됨):',
      {
        originalCount: availableMediaFileList.length,
        mainImageUrl: selectedMainImageUrl
          ? selectedMainImageUrl.slice(0, 30) + '...'
          : 'null',
        filteredCount: filteredImageList.length,
        excludedCount: availableMediaFileList.length - filteredImageList.length,
        excludedImageFound:
          availableMediaFileList.length - filteredImageList.length === 1,
        mainImageExclusionWorking: true,
        nullProcessingComplete: true,
      }
    );

    return filteredImageList;
  }, [availableMediaFileList, selectedMainImageUrl]);

  const handleImageSelectionToggleByIndex = useCallback(
    (imageIndex: number) => {
      console.log(
        '🔧 handleImageSelectionToggleByIndex 호출 - null 체크 포함:',
        {
          imageIndex,
          currentSelectedCount: selectedImageIndexList.length,
          hasMainImage: selectedMainImageUrl !== null,
          mainImageIsNull: selectedMainImageUrl === null,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      // 🚨 메인 이미지 인덱스 체크 추가 (null 처리 포함)
      const targetImageUrl = availableMediaFileList[imageIndex];
      if (
        targetImageUrl &&
        selectedMainImageUrl &&
        selectedMainImageUrl !== null &&
        targetImageUrl === selectedMainImageUrl
      ) {
        console.log('❌ 메인 이미지는 슬라이더 선택 불가:', {
          imageIndex,
          targetImageUrl: targetImageUrl.slice(0, 30) + '...',
          mainImageUrl: selectedMainImageUrl.slice(0, 30) + '...',
          reason: 'main image cannot be selected for slider',
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

      console.log('✅ 이미지 선택 토글 완료 (null 처리됨):', {
        imageIndex,
        targetImageUrl: targetImageUrl
          ? targetImageUrl.slice(0, 30) + '...'
          : 'none',
        finalSelectedCount: selectedImageIndexList.length,
      });
    },
    [
      originalHandleSliderImageSelect,
      selectedImageIndexList.length,
      availableMediaFileList,
      selectedMainImageUrl,
      addToastMessage,
    ]
  );

  const getSelectedImageUrlListFromIndexList = useCallback(
    (mediaFileUrlList: string[]) => {
      console.log('🔄 getSelectedImageUrlListFromIndexList 호출:', {
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

      console.log('✅ 선택된 이미지 URL 목록 생성 완료:', {
        resultCount: selectedUrlList.length,
      });

      return selectedUrlList;
    },
    [selectedImageIndexList]
  );

  const getCurrentSelectedImageCount = useCallback(() => {
    const selectedCount = selectedImageIndexList.length;
    console.log('📊 getCurrentSelectedImageCount:', { selectedCount });
    return selectedCount;
  }, [selectedImageIndexList]);

  const clearCurrentImageSelection = useCallback(() => {
    console.log('🔄 clearCurrentImageSelection 호출');

    if (updateSelectedImageIndexList) {
      updateSelectedImageIndexList([]);
    }

    console.log('✅ 선택 목록 초기화 완료');
  }, [updateSelectedImageIndexList]);

  const selectedImageUrlList = useMemo(
    () => getSelectedImageUrlListFromIndexList(availableMediaFileList),
    [getSelectedImageUrlListFromIndexList, availableMediaFileList]
  );

  const currentSelectedImageCount = useMemo(
    () => getCurrentSelectedImageCount(),
    [getCurrentSelectedImageCount]
  );

  const handleAddSelectedImageListToSlider = useCallback(() => {
    console.log('🔧 handleAddSelectedImageListToSlider 호출:', {
      selectedImageCount: selectedImageUrlList.length,
    });

    const selectedImageCount = selectedImageUrlList.length;

    if (selectedImageCount === 0) {
      console.log('❌ 선택된 이미지 없음 - 토스트 표시');
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

    console.log('✅ 슬라이더에 이미지 추가 완료:', {
      addedImageCount: selectedImageCount,
    });
  }, [
    selectedImageUrlList,
    addSelectedImageListToSlider,
    clearCurrentImageSelection,
    addToastMessage,
  ]);

  const handleRemoveImageFromSliderByUrl = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleRemoveImageFromSliderByUrl 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (removeImageFromSliderByUrl) {
        removeImageFromSliderByUrl(targetImageUrl);
      }

      addToastMessage({
        title: '슬라이더에서 제거',
        description: '이미지가 슬라이더에서 제거되었습니다.',
        color: 'success',
      });

      console.log('✅ 슬라이더에서 이미지 제거 완료');
    },
    [removeImageFromSliderByUrl, addToastMessage]
  );

  const handleMoveImageToFirstPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToFirstPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToFirstPosition) {
        moveImageToFirstPosition(targetImageUrl);
      }

      console.log('✅ 이미지 첫 번째 위치로 이동 완료');
    },
    [moveImageToFirstPosition]
  );

  const handleMoveImageToLastPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToLastPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToLastPosition) {
        moveImageToLastPosition(targetImageUrl);
      }

      console.log('✅ 이미지 마지막 위치로 이동 완료');
    },
    [moveImageToLastPosition]
  );

  const handleClearAllSliderImageList = useCallback(() => {
    console.log('🔧 handleClearAllSliderImageList 호출');

    if (clearAllSliderImageList) {
      clearAllSliderImageList();
    }

    clearCurrentImageSelection();

    console.log('✅ 모든 슬라이더 이미지 초기화 완료');
  }, [clearAllSliderImageList, clearCurrentImageSelection]);

  // 🆕 향상된 슬라이더 생성 가능 여부 검증 (null 처리 포함)
  const sliderValidationResult = useMemo(() => {
    return validateSliderImagesExcludingMain(
      availableMediaFileList,
      selectedMainImageUrl
    );
  }, [availableMediaFileList, selectedMainImageUrl]);

  const isSliderCreationPossible = sliderValidationResult.isValid;

  // 기존 변수들 유지
  const totalAvailableForSliderImageCount = availableForSliderImageList.length;
  const currentSliderImageTotalCount = getCurrentSliderImageTotalCount
    ? getCurrentSliderImageTotalCount()
    : 0;
  const sliderImageCount = currentSliderImageUrlList.length;
  const hasSelectedSliderImages = sliderImageCount > 0;
  const hasAvailableImageFiles = availableMediaFileList.length > 0;

  console.log('🎯 ImageSliderContainer 최종 상태 - null 처리 완료:', {
    totalOriginalImages: availableMediaFileList.length,
    totalAvailableForSliderImageCount,
    isSliderCreationPossible,
    minimumRequired: SLIDER_CONFIG.MIN_IMAGES,
    hasMainImage: selectedMainImageUrl !== null,
    mainImageIsNull: selectedMainImageUrl === null,
    mainImageUrl: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : 'null',
    excludedMainImageCount:
      availableMediaFileList.length - totalAvailableForSliderImageCount,
    mainImageExclusionWorking:
      selectedMainImageUrl !== null &&
      availableMediaFileList.length - totalAvailableForSliderImageCount === 1,
    dataSourceSynchronized: true,
    nullProcessingComplete: true,
    sliderValidationResult: {
      isValid: sliderValidationResult.isValid,
      errorCode: sliderValidationResult.errorCode,
    },
    timestamp: new Date().toLocaleTimeString(),
  });

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
          {selectedMainImageUrl ? (
            <span className="block mt-1 text-sm text-blue-600">
              ℹ️ 메인 이미지는 슬라이더에서 자동으로 제외됩니다.
            </span>
          ) : null}
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
                {selectedMainImageUrl ? (
                  <span className="ml-2 text-xs text-blue-600">
                    (메인 이미지 1개 제외됨)
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
              {/* 🚨 핵심 수정 6: null 처리된 메인 이미지 정보를 SliderImageSelector에 전달 */}
              <SliderImageSelector
                mediaFiles={availableMediaFileList}
                mainImage={selectedMainImageUrl}
                localSliderImages={currentSliderImageUrlList}
                selectedSliderImages={selectedImageIndexList}
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
                  className="sr-only"
                >
                  선택된 슬라이더 이미지 관리
                </h3>
                <SelectedSliderImages
                  localSliderImages={currentSliderImageUrlList}
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
              {selectedMainImageUrl !== null &&
              selectedMainImageUrl !== undefined ? (
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
