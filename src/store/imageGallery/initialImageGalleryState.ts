// 📁 store/imageGallery/initialImageGalleryState.ts

import type {
  HybridImageViewConfig,
  HybridCustomGalleryView,
} from '../shared/commonTypes';
import { createDefaultHybridImageViewConfig } from '../shared/commonTypes';

// 🆕 초기화 상태를 포함한 하이브리드 이미지 갤러리 상태
export interface HybridImageGalleryState {
  imageViewConfig: HybridImageViewConfig;
  customGalleryViews: HybridCustomGalleryView[];
  isPreviewPanelOpen: boolean;
  isHybridMode: boolean;
  lastSyncTimestamp: Date | null;

  // 🆕 초기화 관련 상태 추가
  _isInitialized: boolean;
  _initializationPromise: Promise<void> | null;
}

// 🆕 하이브리드 초기 상태 생성 함수 (초기화 플래그 포함)
export const createInitialHybridImageGalleryState =
  (): HybridImageGalleryState => {
    console.log(
      '🔧 [INITIAL_STATE] 하이브리드 이미지 갤러리 초기 상태 생성 (초기화플래그포함)'
    );

    const hybridImageViewConfig = createDefaultHybridImageViewConfig();

    const hybridInitialState: HybridImageGalleryState = {
      imageViewConfig: hybridImageViewConfig,
      customGalleryViews: [],
      isPreviewPanelOpen: false,
      isHybridMode: true,
      lastSyncTimestamp: null,

      // 🆕 초기화 상태 기본값
      _isInitialized: false,
      _initializationPromise: null,
    };

    return hybridInitialState;
  };

// 🆕 개선된 상태 검증 함수 (초기화 플래그 포함)
export const validateHybridImageGalleryState = (
  state: unknown
): state is HybridImageGalleryState => {
  const isObject = typeof state === 'object' && state !== null;
  if (!isObject) {
    return false;
  }

  // Reflect.get을 사용한 타입 안전한 속성 확인
  const imageViewConfig = Reflect.get(state, 'imageViewConfig');
  const customGalleryViews = Reflect.get(state, 'customGalleryViews');
  const isPreviewPanelOpen = Reflect.get(state, 'isPreviewPanelOpen');
  const isHybridMode = Reflect.get(state, 'isHybridMode');
  const _isInitialized = Reflect.get(state, '_isInitialized');

  // 핵심 속성들 검증
  const hasImageViewConfig =
    imageViewConfig !== null && imageViewConfig !== undefined;
  const hasCustomGalleryViews = Array.isArray(customGalleryViews);
  const hasIsPreviewPanelOpen = typeof isPreviewPanelOpen === 'boolean';
  const hasIsHybridMode = typeof isHybridMode === 'boolean';

  // 🆕 초기화 플래그 검증 (선택적)
  const hasValidInitializationFlag =
    _isInitialized === undefined || typeof _isInitialized === 'boolean';

  const isValidBasicState =
    hasImageViewConfig &&
    hasCustomGalleryViews &&
    hasIsPreviewPanelOpen &&
    hasIsHybridMode &&
    hasValidInitializationFlag;

  if (!isValidBasicState) {
    console.warn('⚠️ [VALIDATE] 기본 하이브리드 상태 검증 실패:', {
      hasImageViewConfig,
      hasCustomGalleryViews,
      hasIsPreviewPanelOpen,
      hasIsHybridMode,
      hasValidInitializationFlag,
      _isInitialized,
    });
    return false;
  }

  // imageViewConfig 내부 검증
  const isImageConfigObject =
    typeof imageViewConfig === 'object' && imageViewConfig !== null;
  if (!isImageConfigObject) {
    console.warn('⚠️ [VALIDATE] imageViewConfig가 객체가 아님');
    return false;
  }

  const selectedImageIds = Reflect.get(imageViewConfig, 'selectedImageIds');
  const imageMetadata = Reflect.get(imageViewConfig, 'imageMetadata');

  const hasSelectedImageIds = Array.isArray(selectedImageIds);
  const hasImageMetadata = Array.isArray(imageMetadata);

  const isValidImageConfig = hasSelectedImageIds && hasImageMetadata;
  if (!isValidImageConfig) {
    console.warn('⚠️ [VALIDATE] imageViewConfig 내부 검증 실패:', {
      hasSelectedImageIds,
      hasImageMetadata,
    });
    return false;
  }

  console.log('✅ [VALIDATE] 하이브리드 상태 검증 완료 (초기화플래그포함):', {
    _isInitialized,
  });
  return true;
};
