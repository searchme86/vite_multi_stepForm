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
      '🔧 [INITIAL_STATE] 하이브리드 이미지 갤러리 초기 상태 생성 (React Hook Form 동기화 포함)'
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

  const hasSelectedImageIds = Array.isArray(selectedImageIds);
  const hasImageMetadata = Array.isArray(imageMetadata);
  const hasSelectedImages = Array.isArray(selectedImages); // 🆕 추가 검증

  const isValidImageConfig =
    hasSelectedImageIds && hasImageMetadata && hasSelectedImages; // 🆕 조건 추가
  if (!isValidImageConfig) {
    console.warn('⚠️ [VALIDATE] imageViewConfig 내부 검증 실패:', {
      hasSelectedImageIds,
      hasImageMetadata,
      hasSelectedImages, // 🆕 추가
    });
    return false;
  }

  console.log(
    '✅ [VALIDATE] 하이브리드 상태 검증 완료 (React Hook Form 동기화 포함):',
    {
      _isInitialized,
      hasReactHookFormSyncCallback: hasValidSyncCallback,
      selectedImagesCount: selectedImages?.length || 0, // 🆕 추가
    }
  );
  return true;
};
