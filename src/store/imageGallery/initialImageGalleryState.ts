// 📁 store/imageGallery/initialImageGalleryState.ts

import type {
  HybridImageViewConfig,
  HybridCustomGalleryView,
} from '../shared/commonTypes';
import { createDefaultHybridImageViewConfig } from '../shared/commonTypes';

// 🆕 React Hook Form 동기화를 포함한 하이브리드 이미지 갤러리 상태
export interface HybridImageGalleryState {
  imageViewConfig: HybridImageViewConfig;
  customGalleryViews: HybridCustomGalleryView[];
  isPreviewPanelOpen: boolean;
  isHybridMode: boolean;
  lastSyncTimestamp: Date | null;

  // 초기화 관련 상태
  _isInitialized: boolean;
  _initializationPromise: Promise<void> | null;

  // 🆕 React Hook Form 동기화 관련 상태 추가
  _reactHookFormSyncCallback: ((images: string[]) => void) | null;
}

export const createInitialHybridImageGalleryState =
  (): HybridImageGalleryState => {
    console.log(
      '🔧 [INITIAL_STATE] 슬라이더 필드 포함 하이브리드 이미지 갤러리 초기 상태 생성 (React Hook Form 동기화 포함)'
    );

    const hybridImageViewConfig = createDefaultHybridImageViewConfig();

    const hybridInitialState: HybridImageGalleryState = {
      imageViewConfig: hybridImageViewConfig,
      customGalleryViews: [],
      isPreviewPanelOpen: false,
      isHybridMode: true,
      lastSyncTimestamp: null,

      // 초기화 상태 기본값
      _isInitialized: false,
      _initializationPromise: null,

      // 🆕 React Hook Form 동기화 상태 기본값
      _reactHookFormSyncCallback: null,
    };

    console.log('✅ [INITIAL_STATE] 초기 상태 생성 완료:', {
      hasSliderFields: true,
      sliderImagesCount: hybridImageViewConfig.sliderImages.length,
      mainImageSet: hybridImageViewConfig.mainImage !== null,
      selectedImagesCount: hybridImageViewConfig.selectedImages.length,
      selectedImageIdsCount: hybridImageViewConfig.selectedImageIds.length,
      dataIntegrityEnsured: true,
    });

    return hybridInitialState;
  };

export const validateHybridImageGalleryState = (
  state: unknown
): state is HybridImageGalleryState => {
  const isObject = typeof state === 'object' && state !== null;
  if (!isObject) {
    return false;
  }

  const imageViewConfig = Reflect.get(state, 'imageViewConfig');
  const customGalleryViews = Reflect.get(state, 'customGalleryViews');
  const isPreviewPanelOpen = Reflect.get(state, 'isPreviewPanelOpen');
  const isHybridMode = Reflect.get(state, 'isHybridMode');
  const _isInitialized = Reflect.get(state, '_isInitialized');

  // 🆕 React Hook Form 동기화 상태 검증 (선택적)
  const _reactHookFormSyncCallback = Reflect.get(
    state,
    '_reactHookFormSyncCallback'
  );

  const hasImageViewConfig =
    imageViewConfig !== null && imageViewConfig !== undefined;
  const hasCustomGalleryViews = Array.isArray(customGalleryViews);
  const hasIsPreviewPanelOpen = typeof isPreviewPanelOpen === 'boolean';
  const hasIsHybridMode = typeof isHybridMode === 'boolean';

  const hasValidInitializationFlag =
    _isInitialized === undefined || typeof _isInitialized === 'boolean';

  // 🆕 React Hook Form 동기화 콜백 검증 (선택적)
  const hasValidSyncCallback =
    _reactHookFormSyncCallback === null ||
    _reactHookFormSyncCallback === undefined ||
    typeof _reactHookFormSyncCallback === 'function';

  const isValidBasicState =
    hasImageViewConfig &&
    hasCustomGalleryViews &&
    hasIsPreviewPanelOpen &&
    hasIsHybridMode &&
    hasValidInitializationFlag &&
    hasValidSyncCallback; // 🆕 추가

  if (!isValidBasicState) {
    console.warn('⚠️ [VALIDATE] 기본 하이브리드 상태 검증 실패:', {
      hasImageViewConfig,
      hasCustomGalleryViews,
      hasIsPreviewPanelOpen,
      hasIsHybridMode,
      hasValidInitializationFlag,
      hasValidSyncCallback, // 🆕 추가
      _isInitialized,
    });
    return false;
  }

  const isImageConfigObject =
    typeof imageViewConfig === 'object' && imageViewConfig !== null;
  if (!isImageConfigObject) {
    console.warn('⚠️ [VALIDATE] imageViewConfig가 객체가 아님');
    return false;
  }

  const selectedImageIds = Reflect.get(imageViewConfig, 'selectedImageIds');
  const imageMetadata = Reflect.get(imageViewConfig, 'imageMetadata');
  const selectedImages = Reflect.get(imageViewConfig, 'selectedImages'); // 🆕 추가 검증

  // 🚨 슬라이더 필드 검증 추가
  const mainImage = Reflect.get(imageViewConfig, 'mainImage');
  const sliderImages = Reflect.get(imageViewConfig, 'sliderImages');

  const hasSelectedImageIds = Array.isArray(selectedImageIds);
  const hasImageMetadata = Array.isArray(imageMetadata);
  const hasSelectedImages = Array.isArray(selectedImages); // 🆕 추가 검증

  // 🚨 슬라이더 필드 검증
  const hasValidMainImage =
    mainImage === null ||
    mainImage === undefined ||
    typeof mainImage === 'string';
  const hasValidSliderImages = Array.isArray(sliderImages);

  const isValidImageConfig =
    hasSelectedImageIds &&
    hasImageMetadata &&
    hasSelectedImages &&
    hasValidMainImage &&
    hasValidSliderImages; // 🚨 슬라이더 조건 추가

  if (!isValidImageConfig) {
    console.warn('⚠️ [VALIDATE] imageViewConfig 내부 검증 실패:', {
      hasSelectedImageIds,
      hasImageMetadata,
      hasSelectedImages, // 🆕 추가
      hasValidMainImage, // 🚨 슬라이더 추가
      hasValidSliderImages, // 🚨 슬라이더 추가
    });
    return false;
  }

  // 🚨 슬라이더 데이터 무결성 추가 검증
  if (sliderImages && sliderImages.length > 0) {
    const isSliderSubsetOfSelected = sliderImages.every(
      (sliderUrl: unknown) =>
        typeof sliderUrl === 'string' && selectedImages.includes(sliderUrl)
    );

    if (!isSliderSubsetOfSelected) {
      console.warn(
        '⚠️ [VALIDATE] 슬라이더 이미지가 선택된 이미지의 부분집합이 아님:',
        {
          sliderImagesCount: sliderImages.length,
          selectedImagesCount: selectedImages.length,
        }
      );
      return false;
    }
  }

  console.log(
    '✅ [VALIDATE] 슬라이더 포함 하이브리드 상태 검증 완료 (React Hook Form 동기화 포함):',
    {
      _isInitialized,
      hasReactHookFormSyncCallback: hasValidSyncCallback,
      selectedImagesCount: selectedImages?.length || 0, // 🆕 추가
      sliderImagesCount: sliderImages?.length || 0, // 🚨 슬라이더 추가
      mainImageSet: mainImage !== null && mainImage !== undefined, // 🚨 슬라이더 추가
      dataIntegrityEnsured: true,
    }
  );
  return true;
};
