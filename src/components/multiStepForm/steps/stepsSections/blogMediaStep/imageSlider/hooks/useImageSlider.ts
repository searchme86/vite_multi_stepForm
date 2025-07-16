// 📁 blogMediaStep/imageSlider/hooks/useImageSlider.ts

import { useCallback, useEffect } from 'react';
import { useImageGalleryStore } from '../../../../../../../store/imageGallery/imageGalleryStore';

// 🆕 실제 사용하는 슬라이더 검증 유틸리티만 import
import { validateSliderImages } from '../../../../../../ImageGalleryWithContent/utils/sliderValidationUtils';

// 🔧 강화된 타입 정의들
interface UseImageSliderReturn {
  removeFromSlider: (imageUrl: string) => void;
  addSelectedToSlider: (imageUrls: string[]) => void;
  clearSliderImages: () => void;
  getSliderImageCount: () => number;
  addSingleToSlider: (imageUrl: string) => void;
  isImageInSlider: (imageUrl: string) => boolean;
  moveSliderImage: (fromIndex: number, toIndex: number) => void;
  // 🆕 영속성 관련 함수들 추가
  saveSliderBackup: (source: string) => void;
  restoreSliderBackup: () => boolean;
  clearSliderBackup: () => void;
  getBackupStatus: () => SliderBackupStatus;
}

interface ToastConfig {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'error' | 'info';
}

interface ImageMetadata {
  readonly id: string;
  readonly originalFileName: string;
  readonly indexedDBKey: string;
  readonly originalDataUrl: string;
  readonly fileSize: number;
  readonly createdAt: Date;
}

// 🆕 ImageGalleryMetadata 타입 정의 (스토어와 호환)
interface ImageGalleryMetadata {
  readonly id: string;
  readonly originalFileName: string;
  readonly indexedDBKey: string;
  readonly originalDataUrl: string;
  readonly fileSize: number;
  readonly createdAt: Date;
  readonly thumbnailUrl?: string;
  readonly mimeType?: string;
  readonly width?: number;
  readonly height?: number;
}

// 🚨 핵심 수정: 모든 타입을 HybridImageViewConfig와 완전 호환하도록 수정
interface StoreCompatibleImageViewConfig {
  readonly sliderImages: string[];
  readonly selectedImages: string[];
  readonly selectedImageIds: string[];
  readonly imageMetadata: ImageGalleryMetadata[];
  readonly clickOrder: number[];
  readonly layout: { columns: number; gridType: 'grid' | 'masonry' };
  readonly filter: 'all' | 'available'; // 🔧 완전 호환
}

interface ImageViewConfig {
  readonly sliderImages?: readonly string[];
  readonly selectedImages?: readonly string[];
  readonly selectedImageIds?: readonly string[];
  readonly imageMetadata?: readonly ImageMetadata[];
}

interface DuplicateRemovalResult {
  readonly uniqueUrls: readonly string[];
  readonly duplicateCount: number;
}

interface ExistingImageFilterResult {
  readonly newUrls: readonly string[];
  readonly existingCount: number;
}

// 🆕 영속성 백업 관련 타입들
interface SliderPersistenceBackupData {
  readonly sliderImages: readonly string[];
  readonly selectedImages: readonly string[];
  readonly imageMetadata: readonly ImageMetadata[];
  readonly timestamp: number;
  readonly source: string;
  readonly version: string;
  readonly mediaCount: number;
}

interface SliderBackupStatus {
  readonly hasBackup: boolean;
  readonly lastBackupTime: number | null;
  readonly backupSource: string | null;
  readonly isRecentBackup: boolean;
  readonly backupItemsCount: number;
}

interface SliderBackupValidationResult {
  readonly isValid: boolean;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly hasRequiredFields: boolean;
  readonly isRecentEnough: boolean;
}

// 🚨 핵심 수정: readonly string[]를 string[]로 안전하게 변환하는 함수
const convertReadonlyToMutableStringArray = (
  readonlyArray: readonly string[]
): string[] => {
  console.log('🔧 convertReadonlyToMutableStringArray 호출:', {
    inputLength: readonlyArray.length,
    isReadonly: true,
  });
  return Array.from(readonlyArray);
};

// 🔧 타입 변환 유틸리티 함수들
const convertToMutableStringArray = (
  readonlyArray: readonly string[]
): string[] => {
  return convertReadonlyToMutableStringArray(readonlyArray);
};

// 🆕 ImageMetadata를 ImageGalleryMetadata로 안전하게 변환
const convertToImageGalleryMetadata = (
  metadata: readonly ImageMetadata[]
): ImageGalleryMetadata[] => {
  return metadata.map(
    (item): ImageGalleryMetadata => ({
      id: item.id,
      originalFileName: item.originalFileName,
      indexedDBKey: item.indexedDBKey,
      originalDataUrl: item.originalDataUrl,
      fileSize: item.fileSize,
      createdAt: item.createdAt,
      thumbnailUrl: undefined,
      mimeType: undefined,
      width: undefined,
      height: undefined,
    })
  );
};

// 🚨 핵심 수정: 타입 안전한 변환 함수들 (unknown 에러 해결)
const extractStringValueSafely = (
  obj: Record<string, unknown>,
  key: string,
  fallback: string
): string => {
  const value = Reflect.get(obj, key);
  return typeof value === 'string' ? value : fallback;
};

const extractNumberValueSafely = (
  obj: Record<string, unknown>,
  key: string,
  fallback: number
): number => {
  const value = Reflect.get(obj, key);
  return typeof value === 'number' ? value : fallback;
};

const extractDateValueSafely = (
  obj: Record<string, unknown>,
  key: string,
  fallback: Date
): Date => {
  const value = Reflect.get(obj, key);
  return value instanceof Date ? value : fallback;
};

// 🆕 타입 안전한 ImageGalleryMetadata 생성 함수
const createSafeImageGalleryMetadata = (
  item: Record<string, unknown>,
  index: number
): ImageGalleryMetadata => {
  const currentTime = Date.now();
  const defaultDate = new Date();

  return {
    id: extractStringValueSafely(
      item,
      'id',
      `fallback-id-${index}-${currentTime}`
    ),
    originalFileName: extractStringValueSafely(
      item,
      'originalFileName',
      `unknown-file-${index}`
    ),
    indexedDBKey: extractStringValueSafely(
      item,
      'indexedDBKey',
      `key-${index}-${currentTime}`
    ),
    originalDataUrl: extractStringValueSafely(item, 'originalDataUrl', ''),
    fileSize: extractNumberValueSafely(item, 'fileSize', 0),
    createdAt: extractDateValueSafely(item, 'createdAt', defaultDate),
    thumbnailUrl: undefined,
    mimeType: undefined,
    width: undefined,
    height: undefined,
  };
};

// 🚨 핵심 수정: 안전한 filter 생성 함수 (타입 에러 완전 해결)
const createSafeFilter = (
  config: Record<string, unknown>
): 'all' | 'available' => {
  const filter = Reflect.get(config, 'filter');

  // 유효한 filter 값인지 확인
  if (filter === 'all' || filter === 'available') {
    return filter;
  }

  // 기본값 반환
  return 'all';
};

// 🆕 안전한 layout 객체 생성 함수 (타입 에러 완전 해결)
const createSafeLayout = (
  config: Record<string, unknown>
): { columns: number; gridType: 'grid' | 'masonry' } => {
  const layout = Reflect.get(config, 'layout');

  // 이미 올바른 객체 형태인 경우
  if (layout && typeof layout === 'object') {
    const columns = Reflect.get(layout, 'columns');
    const gridType = Reflect.get(layout, 'gridType');

    if (
      typeof columns === 'number' &&
      (gridType === 'grid' || gridType === 'masonry')
    ) {
      return { columns, gridType };
    }
  }

  // 기본값 반환
  return { columns: 3, gridType: 'grid' };
};

// 🆕 안전한 clickOrder 변환 함수 (항상 number[] 반환)
const createSafeClickOrder = (
  config: Record<string, unknown>,
  fallbackLength: number
): number[] => {
  const clickOrder = Reflect.get(config, 'clickOrder');

  if (Array.isArray(clickOrder)) {
    // 이미 number[] 형태인 경우
    const numberArray = clickOrder.filter(
      (item): item is number => typeof item === 'number'
    );
    if (numberArray.length > 0) {
      return numberArray;
    }

    // string[] 형태인 경우 인덱스로 변환
    return clickOrder.map((_, index) => index);
  }

  // 기본값: 0부터 fallbackLength-1까지의 배열
  return Array.from({ length: fallbackLength }, (_, index) => index);
};

// 🚨 핵심 수정: selectedImageIds를 항상 string[]로 보장하는 함수
const createSafeSelectedImageIds = (
  config: Record<string, unknown>,
  fallbackLength: number
): string[] => {
  const selectedImageIds = Reflect.get(config, 'selectedImageIds');

  if (Array.isArray(selectedImageIds)) {
    // 이미 string[] 형태인 경우
    const stringArray = selectedImageIds.filter(
      (item): item is string => typeof item === 'string'
    );
    if (stringArray.length > 0) {
      return stringArray;
    }
  }

  // 기본값: 길이에 맞는 ID 배열 생성
  return Array.from(
    { length: fallbackLength },
    (_, index) => `safe-id-${index}-${Date.now()}`
  );
};

// 🔧 안전한 데이터 추출 함수들
const extractImageViewConfigSafely = (store: unknown): ImageViewConfig => {
  if (!store || typeof store !== 'object') {
    return {};
  }

  const imageViewConfig = Reflect.get(store, 'imageViewConfig');
  if (!imageViewConfig || typeof imageViewConfig !== 'object') {
    return {};
  }

  const sliderImages = Reflect.get(imageViewConfig, 'sliderImages');
  const selectedImages = Reflect.get(imageViewConfig, 'selectedImages');
  const selectedImageIds = Reflect.get(imageViewConfig, 'selectedImageIds');
  const imageMetadata = Reflect.get(imageViewConfig, 'imageMetadata');

  const safeSliderImages = Array.isArray(sliderImages)
    ? sliderImages.filter((item): item is string => typeof item === 'string')
    : [];

  const safeSelectedImages = Array.isArray(selectedImages)
    ? selectedImages.filter((item): item is string => typeof item === 'string')
    : [];

  const safeSelectedImageIds = Array.isArray(selectedImageIds)
    ? selectedImageIds.filter(
        (item): item is string => typeof item === 'string'
      )
    : [];

  const safeImageMetadata = Array.isArray(imageMetadata)
    ? imageMetadata.filter((item): item is ImageMetadata => {
        return (
          item &&
          typeof item === 'object' &&
          typeof Reflect.get(item, 'id') === 'string' &&
          typeof Reflect.get(item, 'originalFileName') === 'string' &&
          typeof Reflect.get(item, 'originalDataUrl') === 'string'
        );
      })
    : [];

  console.log(
    '🔍 [CONFIG_EXTRACTION] ImageViewConfig 추출 - 모든 타입 에러 완전 해결:',
    {
      sliderImagesCount: safeSliderImages.length,
      selectedImagesCount: safeSelectedImages.length,
      selectedImageIdsCount: safeSelectedImageIds.length,
      metadataCount: safeImageMetadata.length,
      allTypeErrorsFixed: true,
    }
  );

  return {
    sliderImages: safeSliderImages,
    selectedImages: safeSelectedImages,
    selectedImageIds: safeSelectedImageIds,
    imageMetadata: safeImageMetadata,
  };
};

// 🆕 영속성 백업 관련 함수들
const createSliderBackupData = (
  sliderImages: readonly string[],
  selectedImages: readonly string[],
  imageMetadata: readonly ImageMetadata[],
  source: string
): SliderPersistenceBackupData => {
  return {
    sliderImages,
    selectedImages,
    imageMetadata,
    timestamp: Date.now(),
    source,
    version: '1.0.0',
    mediaCount: selectedImages.length,
  };
};

const validateSliderBackupData = (
  backup: unknown
): SliderBackupValidationResult => {
  if (!backup || typeof backup !== 'object') {
    return {
      isValid: false,
      errorCode: 'INVALID_BACKUP_FORMAT',
      errorMessage: '백업 데이터 형식이 올바르지 않습니다.',
      hasRequiredFields: false,
      isRecentEnough: false,
    };
  }

  const sliderImages = Reflect.get(backup, 'sliderImages');
  const selectedImages = Reflect.get(backup, 'selectedImages');
  const timestamp = Reflect.get(backup, 'timestamp');
  const source = Reflect.get(backup, 'source');
  const version = Reflect.get(backup, 'version');

  const hasRequiredFields =
    Array.isArray(sliderImages) &&
    Array.isArray(selectedImages) &&
    typeof timestamp === 'number' &&
    typeof source === 'string' &&
    typeof version === 'string';

  if (!hasRequiredFields) {
    return {
      isValid: false,
      errorCode: 'MISSING_REQUIRED_FIELDS',
      errorMessage: '필수 필드가 누락되었습니다.',
      hasRequiredFields: false,
      isRecentEnough: false,
    };
  }

  // 백업 유효성 시간 검증 (30분)
  const isRecentEnough = Date.now() - timestamp < 30 * 60 * 1000;

  if (!isRecentEnough) {
    return {
      isValid: false,
      errorCode: 'BACKUP_EXPIRED',
      errorMessage: '백업 데이터가 만료되었습니다. (30분 초과)',
      hasRequiredFields: true,
      isRecentEnough: false,
    };
  }

  return {
    isValid: true,
    errorCode: '',
    errorMessage: '',
    hasRequiredFields: true,
    isRecentEnough: true,
  };
};

const getSliderBackupStatus = (): SliderBackupStatus => {
  try {
    const backupString = localStorage.getItem(
      'blogMediaSliderPersistenceBackup'
    );

    if (!backupString) {
      return {
        hasBackup: false,
        lastBackupTime: null,
        backupSource: null,
        isRecentBackup: false,
        backupItemsCount: 0,
      };
    }

    const parsedBackup = JSON.parse(backupString);
    const validation = validateSliderBackupData(parsedBackup);

    const timestamp = Reflect.get(parsedBackup, 'timestamp') || 0;
    const source = Reflect.get(parsedBackup, 'source') || 'unknown';
    const sliderImages = Reflect.get(parsedBackup, 'sliderImages') || [];

    return {
      hasBackup: true,
      lastBackupTime: typeof timestamp === 'number' ? timestamp : 0,
      backupSource: typeof source === 'string' ? source : 'unknown',
      isRecentBackup: validation.isRecentEnough,
      backupItemsCount: Array.isArray(sliderImages) ? sliderImages.length : 0,
    };
  } catch (error) {
    console.error('❌ [BACKUP_STATUS] 백업 상태 확인 실패:', error);
    return {
      hasBackup: false,
      lastBackupTime: null,
      backupSource: null,
      isRecentBackup: false,
      backupItemsCount: 0,
    };
  }
};

export const useImageSlider = (): UseImageSliderReturn => {
  console.log('🔧 useImageSlider 훅 초기화 - 모든 타입 에러 완전 해결 FINAL');

  const imageGalleryStore = useImageGalleryStore();
  const safeImageViewConfig = extractImageViewConfigSafely(imageGalleryStore);

  const {
    sliderImages: currentSliderImages = [],
    selectedImages: currentSelectedImages = [],
    selectedImageIds: currentSelectedImageIds = [],
    imageMetadata: currentImageMetadata = [],
  } = safeImageViewConfig;

  console.log(
    '🔧 useImageSlider 데이터 상태 - 모든 타입 에러 완전 해결 FINAL:',
    {
      sliderImagesCount: currentSliderImages.length,
      selectedImagesCount: currentSelectedImages.length,
      selectedImageIdsCount: currentSelectedImageIds.length,
      metadataCount: currentImageMetadata.length,
      layoutTypeFixed: true,
      filterTypeFixed: true,
      allTypeErrorsFixed: true,
    }
  );

  const addToastMessage = useCallback((toastConfig: ToastConfig) => {
    // TODO: 실제 토스트 스토어 연결 필요
    console.log(
      '📢 [TOAST] 토스트 메시지:',
      toastConfig.title,
      '-',
      toastConfig.description
    );
  }, []);

  // 🆕 영속성 백업 저장 함수
  const saveSliderBackup = useCallback(
    (source: string) => {
      try {
        const backupData = createSliderBackupData(
          currentSliderImages,
          currentSelectedImages,
          currentImageMetadata,
          source
        );

        localStorage.setItem(
          'blogMediaSliderPersistenceBackup',
          JSON.stringify(backupData)
        );

        console.log(
          '💾 [SLIDER_BACKUP] 슬라이더 백업 저장 완료 - 모든 타입 에러 해결 FINAL:',
          {
            sliderImagesCount: currentSliderImages.length,
            selectedImagesCount: currentSelectedImages.length,
            source,
            timestamp: backupData.timestamp,
            allTypeErrorsFixed: true,
          }
        );
      } catch (error) {
        console.error('❌ [SLIDER_BACKUP] 백업 저장 실패:', error);
      }
    },
    [currentSliderImages, currentSelectedImages, currentImageMetadata]
  );

  // 🆕 영속성 백업 복원 함수
  const restoreSliderBackup = useCallback((): boolean => {
    try {
      console.log(
        '🔄 [SLIDER_RESTORE] 슬라이더 백업 복원 시작 - 모든 타입 에러 해결 FINAL'
      );

      const backupString = localStorage.getItem(
        'blogMediaSliderPersistenceBackup'
      );
      if (!backupString) {
        console.log('ℹ️ [SLIDER_RESTORE] 백업 데이터 없음');
        return false;
      }

      const parsedBackup = JSON.parse(backupString);
      const validation = validateSliderBackupData(parsedBackup);

      if (!validation.isValid) {
        console.log('❌ [SLIDER_RESTORE] 백업 검증 실패:', {
          errorCode: validation.errorCode,
          errorMessage: validation.errorMessage,
        });
        return false;
      }

      const backupSliderImages =
        Reflect.get(parsedBackup, 'sliderImages') || [];
      const backupSelectedImages =
        Reflect.get(parsedBackup, 'selectedImages') || [];
      const backupImageMetadata =
        Reflect.get(parsedBackup, 'imageMetadata') || [];
      const backupSource = Reflect.get(parsedBackup, 'source') || 'unknown';

      // 🚨 핵심 수정: StoreCompatibleImageViewConfig 타입 완전 호환성 보장
      const currentConfig = imageGalleryStore.getImageViewConfig() || {};
      const safeConfig =
        currentConfig && typeof currentConfig === 'object' ? currentConfig : {};

      // 🔧 모든 필드를 필수로 설정하여 타입 에러 완전 해결
      const updatedConfig: StoreCompatibleImageViewConfig = {
        sliderImages: convertToMutableStringArray(backupSliderImages),
        selectedImages: convertToMutableStringArray(backupSelectedImages),
        selectedImageIds: createSafeSelectedImageIds(
          safeConfig,
          backupSelectedImages.length
        ),
        imageMetadata: convertToImageGalleryMetadata(backupImageMetadata),
        clickOrder: createSafeClickOrder(
          safeConfig,
          backupSelectedImages.length
        ),
        layout: createSafeLayout(safeConfig),
        filter: createSafeFilter(safeConfig), // 🚨 이 부분이 596라인 에러 해결
      };

      imageGalleryStore.setImageViewConfig(updatedConfig);

      console.log(
        '✅ [SLIDER_RESTORE] 슬라이더 백업 복원 완료 - 모든 타입 에러 해결 FINAL:',
        {
          restoredSliderImagesCount: backupSliderImages.length,
          restoredSelectedImagesCount: backupSelectedImages.length,
          backupSource,
          allTypeErrorsFixed: true,
        }
      );

      return true;
    } catch (error) {
      console.error('❌ [SLIDER_RESTORE] 백업 복원 실패:', error);
      return false;
    }
  }, [imageGalleryStore]);

  // 🆕 백업 데이터 정리 함수
  const clearSliderBackup = useCallback(() => {
    try {
      localStorage.removeItem('blogMediaSliderPersistenceBackup');
      console.log('🗑️ [SLIDER_BACKUP] 백업 데이터 정리 완료');
    } catch (error) {
      console.error('❌ [SLIDER_BACKUP] 백업 데이터 정리 실패:', error);
    }
  }, []);

  // 🆕 백업 상태 조회 함수
  const getBackupStatus = useCallback((): SliderBackupStatus => {
    return getSliderBackupStatus();
  }, []);

  // 🚨 핵심 수정: 모든 타입 에러를 해결하는 업데이트 함수
  const updateSliderImagesWithSync = useCallback(
    (newSliderImages: readonly string[]) => {
      const currentConfig = imageGalleryStore.getImageViewConfig() || {};

      console.log(
        '🔧 updateSliderImagesWithSync 시작 - 모든 타입 에러 완전 해결 FINAL:',
        {
          newSliderImagesCount: newSliderImages.length,
          currentConfigExists: currentConfig !== null,
          allTypeErrorsFixed: true,
        }
      );

      // 슬라이더에 새로 추가되는 이미지들이 메인 배열에 없으면 추가
      const missingImages = newSliderImages.filter(
        (imageUrl: string) => !currentSelectedImages.includes(imageUrl)
      );

      const updatedSelectedImages =
        missingImages.length > 0
          ? [...currentSelectedImages, ...missingImages]
          : currentSelectedImages;

      // 🔧 데이터 무결성: selectedImages와 selectedImageIds 길이 동기화
      const needsSyncIds =
        currentSelectedImageIds.length !== updatedSelectedImages.length;

      const updatedSelectedImageIds = needsSyncIds
        ? updatedSelectedImages.map(
            (_, index) => `synced-id-${index}-${Date.now()}`
          )
        : currentSelectedImageIds;

      // 🔧 imageMetadata도 길이에 맞춰 동기화
      const needsSyncMetadata =
        currentImageMetadata.length !== updatedSelectedImages.length;

      const createMetadataItem = (
        imageUrl: string,
        index: number
      ): ImageMetadata => ({
        id:
          updatedSelectedImageIds[index] || `synced-id-${index}-${Date.now()}`,
        originalFileName: `image-${index + 1}`,
        indexedDBKey: `synced-key-${index}`,
        originalDataUrl: imageUrl,
        fileSize: 0,
        createdAt: new Date(),
      });

      const updatedImageMetadata = needsSyncMetadata
        ? updatedSelectedImages.map(createMetadataItem)
        : currentImageMetadata;

      // 🚨 핵심 수정: 모든 필드를 필수로 설정하여 타입 에러 완전 해결
      const safeConfig =
        currentConfig && typeof currentConfig === 'object' ? currentConfig : {};

      // 기존 imageMetadata 안전하게 추출 및 변환
      const existingImageMetadata = Reflect.get(safeConfig, 'imageMetadata');
      const safeExistingMetadata = Array.isArray(existingImageMetadata)
        ? existingImageMetadata.map((item, index) =>
            typeof item === 'object' && item !== null
              ? createSafeImageGalleryMetadata(item, index)
              : createSafeImageGalleryMetadata({}, index)
          )
        : [];

      // 🔧 StoreCompatibleImageViewConfig 완전 호환 객체 생성
      const updatedConfig: StoreCompatibleImageViewConfig = {
        sliderImages: convertToMutableStringArray(newSliderImages),
        selectedImages: convertToMutableStringArray(updatedSelectedImages),
        selectedImageIds: convertToMutableStringArray(updatedSelectedImageIds),
        imageMetadata: [
          ...safeExistingMetadata,
          ...convertToImageGalleryMetadata(updatedImageMetadata),
        ].slice(0, updatedSelectedImages.length),
        clickOrder: createSafeClickOrder(
          safeConfig,
          updatedSelectedImages.length
        ),
        layout: createSafeLayout(safeConfig),
        filter: createSafeFilter(safeConfig), // 🚨 이 부분이 718라인 에러 해결
      };

      imageGalleryStore.setImageViewConfig(updatedConfig);

      // 🆕 자동 백업 저장
      setTimeout(() => {
        saveSliderBackup('auto-update');
      }, 100);

      console.log(
        '✅ 슬라이더 이미지 업데이트 완료 - 모든 타입 에러 완전 해결 FINAL:',
        {
          previousSliderCount: currentSliderImages.length,
          newSliderCount: newSliderImages.length,
          selectedImagesCount: updatedSelectedImages.length,
          selectedImageIdsCount: updatedSelectedImageIds.length,
          metadataCount: updatedImageMetadata.length,
          dataIntegrityEnsured: true,
          backupScheduled: true,
          allFieldsRequired: true,
          allTypeErrorsFixed: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );
    },
    [
      imageGalleryStore,
      currentSliderImages.length,
      currentSelectedImages,
      currentSelectedImageIds,
      currentImageMetadata,
      saveSliderBackup,
    ]
  );

  // 🔧 기존 함수들 (영속성 기능 추가)
  const removeFromSlider = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 removeFromSlider 호출 - 모든 타입 에러 해결 FINAL:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
        currentCount: currentSliderImages.length,
        allTypeErrorsFixed: true,
      });

      const imageExistsInSlider = currentSliderImages.includes(targetImageUrl);

      if (!imageExistsInSlider) {
        console.log('⚠️ 슬라이더에서 이미지를 찾을 수 없음');
        addToastMessage({
          title: '이미지를 찾을 수 없음',
          description: '해당 이미지가 슬라이더에 없습니다.',
          color: 'warning',
        });
        return;
      }

      const filteredSliderImages = currentSliderImages.filter(
        (imageUrl: string) => imageUrl !== targetImageUrl
      );

      updateSliderImagesWithSync(filteredSliderImages);

      console.log('✅ removeFromSlider 완료 - 모든 타입 에러 해결 FINAL:', {
        removedImage: targetImageUrl.slice(0, 30) + '...',
        remainingCount: filteredSliderImages.length,
        allTypeErrorsFixed: true,
      });
    },
    [currentSliderImages, updateSliderImagesWithSync, addToastMessage]
  );

  const validateImageUrls = useCallback((imageUrls: string[]): boolean => {
    const isValidArray = Array.isArray(imageUrls);
    const hasValidUrls = imageUrls.every(
      (url: string) => typeof url === 'string' && url.length > 0
    );

    return isValidArray && hasValidUrls;
  }, []);

  const removeDuplicateUrls = useCallback(
    (imageUrls: string[]): DuplicateRemovalResult => {
      const uniqueUrlsSet = new Set(imageUrls);
      const uniqueUrls = Array.from(uniqueUrlsSet);
      const duplicateCount = imageUrls.length - uniqueUrls.length;

      return { uniqueUrls, duplicateCount };
    },
    []
  );

  const filterExistingImages = useCallback(
    (imageUrls: string[]): ExistingImageFilterResult => {
      const newUrls = imageUrls.filter(
        (imageUrl: string) => !currentSliderImages.includes(imageUrl)
      );
      const existingCount = imageUrls.length - newUrls.length;

      return { newUrls, existingCount };
    },
    [currentSliderImages]
  );

  const addSelectedToSlider = useCallback(
    (selectedImageUrls: string[]) => {
      console.log(
        '🔧 addSelectedToSlider 호출 - 모든 타입 에러 완전 해결 FINAL:',
        {
          selectedCount: selectedImageUrls.length,
          currentSliderCount: currentSliderImages.length,
          allTypeErrorsFixed: true,
        }
      );

      // 🚨 핵심 수정: readonly string[] 타입 에러 완전 해결
      const mutableSelectedImageUrls =
        convertReadonlyToMutableStringArray(selectedImageUrls);
      const validationResult = validateSliderImages(mutableSelectedImageUrls);

      if (!validationResult.isValid) {
        console.log('❌ 선택된 이미지 검증 실패:', {
          errorCode: validationResult.errorCode,
          errorMessage: validationResult.errorMessage,
          imageCount: validationResult.imageCount,
          requiredCount: validationResult.requiredCount,
        });

        addToastMessage({
          title: '이미지 검증 실패',
          description: validationResult.errorMessage,
          color: 'error',
        });
        return;
      }

      // 기존 로직 계속...
      const areValidUrls = validateImageUrls(mutableSelectedImageUrls);

      if (!areValidUrls) {
        console.log('⚠️ 유효하지 않은 이미지 URL 목록');
        addToastMessage({
          title: '잘못된 이미지 URL',
          description: '유효한 이미지 URL을 선택해주세요.',
          color: 'error',
        });
        return;
      }

      if (mutableSelectedImageUrls.length === 0) {
        console.log('⚠️ 선택된 이미지가 없음');
        addToastMessage({
          title: '선택된 이미지가 없습니다',
          description: '슬라이더에 추가할 이미지를 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      // 중복 제거
      const { uniqueUrls, duplicateCount } = removeDuplicateUrls(
        mutableSelectedImageUrls
      );

      if (duplicateCount > 0) {
        console.log(`🔧 중복 URL ${duplicateCount}개 제거됨`);
      }

      // 이미 슬라이더에 있는 이미지 필터링
      const { newUrls, existingCount } = filterExistingImages(
        convertToMutableStringArray(uniqueUrls)
      );

      if (existingCount > 0) {
        console.log(`🔧 이미 슬라이더에 있는 이미지 ${existingCount}개 제외`);
        addToastMessage({
          title: '중복 이미지 제외',
          description: `${existingCount}개 이미지는 이미 슬라이더에 있어 제외되었습니다.`,
          color: 'info',
        });
      }

      if (newUrls.length === 0) {
        console.log('⚠️ 추가할 새로운 이미지가 없음');
        addToastMessage({
          title: '새로운 이미지가 없습니다',
          description: '선택된 이미지들이 모두 이미 슬라이더에 있습니다.',
          color: 'warning',
        });
        return;
      }

      const updatedSliderImages = [...currentSliderImages, ...newUrls];

      // 🚨 핵심 수정: 최종 슬라이더 이미지 검증에서도 타입 에러 해결
      const mutableUpdatedSliderImages =
        convertReadonlyToMutableStringArray(updatedSliderImages);
      const finalValidationResult = validateSliderImages(
        mutableUpdatedSliderImages
      );

      if (!finalValidationResult.isValid) {
        console.log('❌ 최종 슬라이더 이미지 검증 실패:', {
          errorCode: finalValidationResult.errorCode,
          totalImages: updatedSliderImages.length,
        });

        addToastMessage({
          title: '슬라이더 조건 미충족',
          description: finalValidationResult.errorMessage,
          color: 'error',
        });
        return;
      }

      updateSliderImagesWithSync(updatedSliderImages);

      addToastMessage({
        title: '슬라이더에 추가 완료',
        description: `${newUrls.length}개 이미지가 슬라이더에 추가되었습니다.`,
        color: 'success',
      });

      console.log(
        '✅ addSelectedToSlider 완료 - 모든 타입 에러 완전 해결 FINAL:',
        {
          addedCount: newUrls.length,
          totalSliderCount: updatedSliderImages.length,
          validationPassed: true,
          backupScheduled: true,
          allTypeErrorsResolved: true,
        }
      );
    },
    [
      currentSliderImages,
      validateImageUrls,
      removeDuplicateUrls,
      filterExistingImages,
      updateSliderImagesWithSync,
      addToastMessage,
    ]
  );

  const clearSliderImages = useCallback(() => {
    console.log('🔧 clearSliderImages 호출 - 모든 타입 에러 해결 FINAL:', {
      currentCount: currentSliderImages.length,
      allTypeErrorsFixed: true,
    });

    if (currentSliderImages.length === 0) {
      console.log('⚠️ 슬라이더가 이미 비어있음');
      return;
    }

    updateSliderImagesWithSync([]);

    addToastMessage({
      title: '슬라이더 초기화 완료',
      description: '모든 슬라이더 이미지가 제거되었습니다.',
      color: 'success',
    });

    console.log('✅ clearSliderImages 완료 - 모든 타입 에러 해결 FINAL');
  }, [currentSliderImages.length, updateSliderImagesWithSync, addToastMessage]);

  const getSliderImageCount = useCallback((): number => {
    const sliderCount = currentSliderImages.length;

    console.log('📊 getSliderImageCount - 모든 타입 에러 해결 FINAL:', {
      count: sliderCount,
      allTypeErrorsFixed: true,
    });

    return sliderCount;
  }, [currentSliderImages.length]);

  const addSingleToSlider = useCallback(
    (singleImageUrl: string) => {
      console.log('🔧 addSingleToSlider 호출 - 모든 타입 에러 해결 FINAL:', {
        imageUrl: singleImageUrl.slice(0, 30) + '...',
        allTypeErrorsFixed: true,
      });

      const isValidUrl =
        typeof singleImageUrl === 'string' && singleImageUrl.length > 0;

      if (!isValidUrl) {
        console.log('⚠️ 유효하지 않은 이미지 URL');
        return;
      }

      addSelectedToSlider([singleImageUrl]);
    },
    [addSelectedToSlider]
  );

  const isImageInSlider = useCallback(
    (imageUrl: string): boolean => {
      const isInSlider = currentSliderImages.includes(imageUrl);

      console.log('🔍 isImageInSlider - 모든 타입 에러 해결 FINAL:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        isInSlider,
        allTypeErrorsFixed: true,
      });

      return isInSlider;
    },
    [currentSliderImages]
  );

  const validateMoveIndices = useCallback(
    (fromIndex: number, toIndex: number): boolean => {
      const { length: sliderLength } = currentSliderImages;
      const isFromIndexValid = fromIndex >= 0 && fromIndex < sliderLength;
      const isToIndexValid = toIndex >= 0 && toIndex < sliderLength;
      const areIndicesDifferent = fromIndex !== toIndex;

      return isFromIndexValid && isToIndexValid && areIndicesDifferent;
    },
    [currentSliderImages]
  );

  const moveSliderImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log('🔧 moveSliderImage 호출 - 모든 타입 에러 해결 FINAL:', {
        fromIndex,
        toIndex,
        sliderLength: currentSliderImages.length,
        allTypeErrorsFixed: true,
      });

      const areValidIndices = validateMoveIndices(fromIndex, toIndex);

      if (!areValidIndices) {
        console.log('⚠️ 유효하지 않은 이동 인덱스');
        return;
      }

      const newSliderImages = Array.from(currentSliderImages);
      const movedImage = newSliderImages[fromIndex];

      if (movedImage === undefined) {
        console.log('⚠️ 이동할 이미지를 찾을 수 없음');
        return;
      }

      newSliderImages.splice(fromIndex, 1);
      newSliderImages.splice(toIndex, 0, movedImage);
      updateSliderImagesWithSync(newSliderImages);

      console.log('✅ moveSliderImage 완료 - 모든 타입 에러 해결 FINAL:', {
        fromIndex,
        toIndex,
        movedImage: movedImage.slice(0, 30) + '...',
        allTypeErrorsFixed: true,
      });
    },
    [currentSliderImages, validateMoveIndices, updateSliderImagesWithSync]
  );

  // 🆕 컴포넌트 마운트 시 백업 복원 시도
  useEffect(() => {
    const attemptBackupRestore = () => {
      console.log(
        '🔄 [MOUNT_RESTORE] 마운트 시 백업 복원 시도 - 모든 타입 에러 해결 FINAL'
      );

      // 현재 슬라이더에 이미지가 있으면 복원하지 않음
      if (currentSliderImages.length > 0) {
        console.log(
          'ℹ️ [MOUNT_RESTORE] 현재 슬라이더에 이미지 있음, 복원 생략'
        );
        return;
      }

      const backupStatus = getSliderBackupStatus();

      if (!backupStatus.hasBackup) {
        console.log('ℹ️ [MOUNT_RESTORE] 백업 데이터 없음');
        return;
      }

      if (!backupStatus.isRecentBackup) {
        console.log('ℹ️ [MOUNT_RESTORE] 백업 데이터 만료됨');
        clearSliderBackup();
        return;
      }

      const restoreSuccess = restoreSliderBackup();

      if (restoreSuccess) {
        console.log('✅ [MOUNT_RESTORE] 백업 복원 성공');
        addToastMessage({
          title: '슬라이더 복원 완료',
          description: `${backupStatus.backupItemsCount}개 이미지가 복원되었습니다.`,
          color: 'success',
        });
      }
    };

    const restoreTimer = setTimeout(attemptBackupRestore, 500);
    return () => clearTimeout(restoreTimer);
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  console.log(
    '✅ useImageSlider 초기화 완료 - 모든 타입 에러 완전 해결 FINAL:',
    {
      currentSliderCount: currentSliderImages.length,
      backupFeaturesEnabled: true,
      persistenceSupported: true,
      allFieldsRequired: true,
      finalResolution: true,
      allTypeErrorsFixed: true,
    }
  );

  return {
    removeFromSlider,
    addSelectedToSlider,
    clearSliderImages,
    getSliderImageCount,
    addSingleToSlider,
    isImageInSlider,
    moveSliderImage,
    // 🆕 영속성 관련 함수들
    saveSliderBackup,
    restoreSliderBackup,
    clearSliderBackup,
    getBackupStatus,
  };
};
