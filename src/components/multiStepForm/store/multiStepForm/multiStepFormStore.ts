// src/components/multiStepForm/store/multiStepForm/multiStepFormStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 폼 데이터 인터페이스
interface FormData {
  userImage?: string;
  nickname?: string;
  emailPrefix?: string;
  emailDomain?: string;
  bio?: string;
  title?: string;
  description?: string;
  tags?: string;
  content?: string;
  mainImage?: string | null;
  media?: string[];
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 인덱스 시그니처 추가 - 동적 키 접근 허용
  [key: string]: string | string[] | boolean | null | undefined;
}

// 토스트 메시지 인터페이스
interface ToastMessage {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'info';
}

// 🔧 Bridge 호환성을 위한 FormValues 인터페이스 (commonTypes.ts와 호환)
interface BridgeCompatibleFormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
}

// 스토어 인터페이스 - Bridge 메서드 추가
interface MultiStepFormStore {
  formData: FormData;
  toasts: ToastMessage[];
  getFormValues: () => FormData;
  updateFormValue: (
    fieldName: string,
    value: string | string[] | boolean | null
  ) => void;
  updateFormValues: (
    values: Record<string, string | string[] | boolean | null>
  ) => void;
  resetFormField: (fieldName: string) => void;
  resetAllFormData: () => void;
  addToast: (toast: ToastMessage) => void;
  removeToast: (index: number) => void;
  clearAllToasts: () => void;
  updateEditorContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
  setFormValues: (values: BridgeCompatibleFormValues) => void;
}

// 저장할 데이터 타입 정의
interface StorageData {
  formData: FormData;
  toasts: ToastMessage[];
}

// 🔧 필드별 예상 크기 맵 (바이트 단위)
const FIELD_SIZE_ESTIMATES = new Map<string, number>([
  ['userImage', 0], // 이미지는 별도 처리
  ['nickname', 100],
  ['emailPrefix', 50],
  ['emailDomain', 50],
  ['bio', 500],
  ['title', 200],
  ['description', 1000],
  ['tags', 200],
  ['content', 5000],
  ['mainImage', 0], // 이미지는 별도 처리
  ['media', 0], // 배열은 별도 처리
  ['sliderImages', 0], // 배열은 별도 처리
  ['editorCompletedContent', 10000],
  ['isEditorCompleted', 10],
]);

// 🔧 직렬화 캐시 관리
interface SerializationCache {
  data: StorageData | null;
  serialized: string | null;
  timestamp: number;
}

const serializationCache: SerializationCache = {
  data: null,
  serialized: null,
  timestamp: 0,
};

// 🔧 캐시 유효성 검사 (5초간 유효)
const isCacheValid = (cache: SerializationCache): boolean => {
  const currentTime = Date.now();
  const cacheAge = currentTime - cache.timestamp;
  const maxCacheAge = 5000; // 5초

  const isValid =
    cacheAge < maxCacheAge && cache.data !== null && cache.serialized !== null;

  console.log('📋 [CACHE_CHECK] 캐시 유효성 검사:', {
    cacheAge,
    maxCacheAge,
    isValid,
    hasCachedData: cache.data !== null,
    timestamp: new Date().toISOString(),
  });

  return isValid;
};

// 🔧 데이터 동일성 검사
const isDataEqual = (data1: StorageData, data2: StorageData): boolean => {
  const data1Keys = Object.keys(data1.formData || {});
  const data2Keys = Object.keys(data2.formData || {});

  const keysMatch =
    data1Keys.length === data2Keys.length &&
    data1Keys.every((key) => data2Keys.includes(key));

  const toastsMatch =
    (data1.toasts?.length || 0) === (data2.toasts?.length || 0);

  console.log('🔍 [DATA_COMPARE] 데이터 동일성 검사:', {
    keysMatch,
    toastsMatch,
    data1KeysLength: data1Keys.length,
    data2KeysLength: data2Keys.length,
    timestamp: new Date().toISOString(),
  });

  return keysMatch && toastsMatch;
};

// 🔧 캐시된 직렬화 결과 가져오기
const getCachedSerialization = (data: StorageData): string => {
  console.log('📋 [CACHE_GET] 캐시된 직렬화 시도');

  const cacheIsValid = isCacheValid(serializationCache);
  if (!cacheIsValid) {
    console.log('📋 [CACHE_GET] 캐시 만료됨, 새로 직렬화');
    const serialized = JSON.stringify(data);

    // 캐시 업데이트
    serializationCache.data = data;
    serializationCache.serialized = serialized;
    serializationCache.timestamp = Date.now();

    return serialized;
  }

  const cachedData = serializationCache.data;
  const cachedSerialized = serializationCache.serialized;

  if (cachedData === null || cachedSerialized === null) {
    console.log('📋 [CACHE_GET] 캐시 데이터 없음, 새로 직렬화');
    const serialized = JSON.stringify(data);

    serializationCache.data = data;
    serializationCache.serialized = serialized;
    serializationCache.timestamp = Date.now();

    return serialized;
  }

  const dataMatches = isDataEqual(data, cachedData);
  if (dataMatches) {
    console.log('✅ [CACHE_GET] 캐시 히트! 기존 직렬화 결과 사용');
    return cachedSerialized;
  }

  console.log('📋 [CACHE_GET] 데이터 변경됨, 새로 직렬화');
  const serialized = JSON.stringify(data);

  serializationCache.data = data;
  serializationCache.serialized = serialized;
  serializationCache.timestamp = Date.now();

  return serialized;
};

// 🔧 안전한 타입 변환 유틸리티
const createSafeTypeConverters = () => {
  const convertToSafeString = (value: unknown, fallback: string): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return fallback;
  };

  const convertToSafeBoolean = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') {
        return true;
      }
      if (lowerValue === 'false') {
        return false;
      }
    }
    return fallback;
  };

  const convertToSafeStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  };

  const convertToSafeStringOrNull = (value: unknown): string | null => {
    if (value === null) {
      return null;
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  };

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  };
};

// 🔧 이미지 데이터 크기 추정
const estimateImageDataSize = (imageData: string): number => {
  if (typeof imageData !== 'string') {
    return 0;
  }

  // Base64 이미지인 경우
  const isBase64 = imageData.startsWith('data:image/');
  if (isBase64) {
    return imageData.length;
  }

  // URL인 경우 작은 크기로 추정
  return 100;
};

// 🔧 스마트 크기 추정 (실제 직렬화 없이)
const estimateDataSize = (data: StorageData): number => {
  console.log('📊 [SIZE_ESTIMATE] 스마트 크기 추정 시작');

  const { formData, toasts } = data;
  let totalEstimatedSize = 0;

  // FormData 크기 추정
  if (formData) {
    const formDataEntries = Object.entries(formData);

    formDataEntries.forEach(([fieldName, fieldValue]) => {
      if (fieldValue === null || fieldValue === undefined) {
        return;
      }

      const fieldEstimate = FIELD_SIZE_ESTIMATES.get(fieldName) || 100;

      if (typeof fieldValue === 'string') {
        // 이미지 필드인 경우 별도 처리
        const isImageField =
          fieldName.includes('Image') || fieldName === 'mainImage';
        if (isImageField) {
          const imageSize = estimateImageDataSize(fieldValue);
          totalEstimatedSize += imageSize;
          console.log('📊 [SIZE_ESTIMATE] 이미지 필드:', {
            fieldName,
            imageSize,
            isLarge: imageSize > 100000,
          });
        } else {
          const actualSize = fieldValue.length;
          totalEstimatedSize += actualSize;
        }
      } else if (Array.isArray(fieldValue)) {
        const arraySize = fieldValue.reduce((acc, item) => {
          if (typeof item === 'string') {
            const isImageData = item.length > 100;
            return (
              acc + (isImageData ? estimateImageDataSize(item) : item.length)
            );
          }
          return acc;
        }, 0);
        totalEstimatedSize += arraySize;
      } else {
        totalEstimatedSize += fieldEstimate;
      }
    });
  }

  // Toasts 크기 추정
  if (Array.isArray(toasts)) {
    const toastsSize = toasts.length * 200; // 토스트당 평균 200바이트
    totalEstimatedSize += toastsSize;
  }

  const estimatedSizeInMB = totalEstimatedSize / (1024 * 1024);

  console.log('📊 [SIZE_ESTIMATE] 크기 추정 완료:', {
    totalEstimatedSize,
    estimatedSizeInMB: estimatedSizeInMB.toFixed(2),
    isLikelyTooLarge: estimatedSizeInMB > 2.5, // 2.5MB 이상은 위험
    timestamp: new Date().toISOString(),
  });

  return totalEstimatedSize;
};

// 🔧 정확한 크기 체크 (직렬화 기반)
const getAccurateDataSize = (
  data: StorageData
): { sizeInBytes: number; sizeInMB: number } => {
  console.log('📏 [ACCURATE_SIZE] 정확한 크기 측정 시작');

  const serialized = getCachedSerialization(data);
  const sizeInBytes = serialized.length;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  console.log('📏 [ACCURATE_SIZE] 정확한 크기 측정 완료:', {
    sizeInBytes,
    sizeInMB: sizeInMB.toFixed(2),
    timestamp: new Date().toISOString(),
  });

  return { sizeInBytes, sizeInMB };
};

// 🔧 localStorage 저장 안전성 검사 (최적화된 버전)
const isStorageSafe = (data: StorageData): boolean => {
  console.log('🔍 [STORAGE_SAFE] 저장 안전성 검사 시작');

  // 1단계: 스마트 크기 추정
  const estimatedSize = estimateDataSize(data);
  const estimatedSizeInMB = estimatedSize / (1024 * 1024);

  // 추정 크기가 2.5MB 이하면 안전하다고 가정
  if (estimatedSizeInMB <= 2.5) {
    console.log('✅ [STORAGE_SAFE] 추정 크기 안전함, 정확한 측정 생략');
    return true;
  }

  // 추정 크기가 4MB 이상이면 위험하다고 가정
  if (estimatedSizeInMB >= 4) {
    console.log('⚠️ [STORAGE_SAFE] 추정 크기 위험함, 저장 거부');
    return false;
  }

  // 2단계: 정확한 크기 측정 (2.5MB ~ 4MB 범위)
  console.log('📏 [STORAGE_SAFE] 정확한 크기 측정 필요');
  const { sizeInMB } = getAccurateDataSize(data);

  const isSizeSafe = sizeInMB <= 3;

  console.log('🔍 [STORAGE_SAFE] 저장 안전성 검사 완료:', {
    estimatedSizeInMB: estimatedSizeInMB.toFixed(2),
    accurateSizeInMB: sizeInMB.toFixed(2),
    isSizeSafe,
    timestamp: new Date().toISOString(),
  });

  return isSizeSafe;
};

// 🔧 이미지 데이터 제외하고 저장하는 함수 (최적화된 버전)
const createSafeStorageData = (state: MultiStepFormStore): StorageData => {
  console.log('🛡️ [SAFE_STORAGE] 안전한 저장 데이터 생성 시작');

  const { formData, toasts } = state;

  // 구조분해할당 + Fallback으로 안전한 데이터 추출
  const {
    userImage = '',
    mainImage = null,
    media = [],
    sliderImages = [],
    ...otherFormData
  } = formData || {};

  // 이미지 필드들 처리
  const processedUserImage =
    typeof userImage === 'string' && userImage.length <= 100000
      ? userImage
      : '';
  const processedMainImage =
    typeof mainImage === 'string' && mainImage.length <= 100000
      ? mainImage
      : null;

  // media 배열 필터링
  const processedMedia = Array.isArray(media)
    ? media.filter((item): item is string => {
        const isValidString = typeof item === 'string';
        const isSafeSize = isValidString && item.length <= 100000;

        if (isValidString && !isSafeSize) {
          console.log('🛡️ [SAFE_STORAGE] media 아이템 크기 초과로 제외');
        }

        return isValidString && isSafeSize;
      })
    : [];

  // sliderImages 배열 필터링
  const processedSliderImages = Array.isArray(sliderImages)
    ? sliderImages.filter((item): item is string => {
        const isValidString = typeof item === 'string';
        const isSafeSize = isValidString && item.length <= 100000;

        if (isValidString && !isSafeSize) {
          console.log('🛡️ [SAFE_STORAGE] sliderImages 아이템 크기 초과로 제외');
        }

        return isValidString && isSafeSize;
      })
    : [];

  // 안전한 폼 데이터 생성
  const safeFormData: FormData = {
    ...otherFormData,
    userImage: processedUserImage,
    mainImage: processedMainImage,
    media: processedMedia,
    sliderImages: processedSliderImages,
  };

  // 토스트 데이터 처리 - 최근 5개만 유지
  const safeToasts = Array.isArray(toasts) ? toasts.slice(-5) : [];

  const safeStorageData: StorageData = {
    formData: safeFormData,
    toasts: safeToasts,
  };

  console.log('🛡️ [SAFE_STORAGE] 안전한 저장 데이터 생성 완료:', {
    originalMediaCount: Array.isArray(media) ? media.length : 0,
    processedMediaCount: processedMedia.length,
    originalSliderImagesCount: Array.isArray(sliderImages)
      ? sliderImages.length
      : 0,
    processedSliderImagesCount: processedSliderImages.length,
    originalToastsCount: Array.isArray(toasts) ? toasts.length : 0,
    processedToastsCount: safeToasts.length,
    timestamp: new Date().toISOString(),
  });

  return safeStorageData;
};

// 🔧 Bridge FormValues를 FormData로 변환하는 함수
const convertBridgeFormValuesToFormData = (
  bridgeFormValues: BridgeCompatibleFormValues
): FormData => {
  console.log('🔄 [BRIDGE_CONVERTER] Bridge FormValues → FormData 변환 시작');

  const {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
  } = createSafeTypeConverters();

  // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
  const {
    userImage: bridgeUserImage = '',
    nickname: bridgeNickname = '',
    emailPrefix: bridgeEmailPrefix = '',
    emailDomain: bridgeEmailDomain = '',
    bio: bridgeBio = '',
    title: bridgeTitle = '',
    description: bridgeDescription = '',
    tags: bridgeTags = '',
    content: bridgeContent = '',
    media: bridgeMedia = [],
    mainImage: bridgeMainImage = null,
    sliderImages: bridgeSliderImages = [],
    editorCompletedContent: bridgeEditorContent = '',
    isEditorCompleted: bridgeIsCompleted = false,
  } = bridgeFormValues;

  const convertedFormData: FormData = {
    userImage: convertToSafeString(bridgeUserImage, ''),
    nickname: convertToSafeString(bridgeNickname, ''),
    emailPrefix: convertToSafeString(bridgeEmailPrefix, ''),
    emailDomain: convertToSafeString(bridgeEmailDomain, ''),
    bio: convertToSafeString(bridgeBio, ''),
    title: convertToSafeString(bridgeTitle, ''),
    description: convertToSafeString(bridgeDescription, ''),
    tags: convertToSafeString(bridgeTags, ''),
    content: convertToSafeString(bridgeContent, ''),
    media: convertToSafeStringArray(bridgeMedia),
    mainImage: convertToSafeStringOrNull(bridgeMainImage),
    sliderImages: convertToSafeStringArray(bridgeSliderImages),
    editorCompletedContent: convertToSafeString(bridgeEditorContent, ''),
    isEditorCompleted: convertToSafeBoolean(bridgeIsCompleted, false),
  };

  console.log('✅ [BRIDGE_CONVERTER] 변환 완료:', {
    nicknameLength: convertedFormData.nickname?.length || 0,
    titleLength: convertedFormData.title?.length || 0,
    editorContentLength: convertedFormData.editorCompletedContent?.length || 0,
    isEditorCompleted: convertedFormData.isEditorCompleted,
    timestamp: new Date().toISOString(),
  });

  return convertedFormData;
};

// Zustand 스토어 생성
export const useMultiStepFormStore = create<MultiStepFormStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      formData: {},
      toasts: [],

      // 폼 값 가져오기
      getFormValues: () => {
        const state = get();
        const { formData } = state;

        console.log('📊 [STORE_GET] 폼 값 가져오기:', {
          formDataKeys: Object.keys(formData || {}),
          timestamp: new Date().toISOString(),
        });

        return formData || {};
      },

      // 단일 폼 값 업데이트
      updateFormValue: (
        fieldName: string,
        value: string | string[] | boolean | null
      ) => {
        console.log('📝 [STORE_UPDATE] 폼 값 업데이트:', {
          fieldName,
          valueType: typeof value,
          valueLength: typeof value === 'string' ? value.length : 0,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formData: currentFormData } = state;
          const safeFormData = currentFormData || {};

          const newFormData = {
            ...safeFormData,
            [fieldName]: value,
          };

          console.log('✅ [STORE_UPDATE] 폼 값 업데이트 완료:', {
            fieldName,
            timestamp: new Date().toISOString(),
          });

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 여러 폼 값 업데이트
      updateFormValues: (
        values: Record<string, string | string[] | boolean | null>
      ) => {
        console.log('📝 [STORE_UPDATE_MULTI] 다중 폼 값 업데이트:', {
          fieldsToUpdate: Object.keys(values),
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formData: currentFormData } = state;
          const safeFormData = currentFormData || {};

          const newFormData = {
            ...safeFormData,
            ...values,
          };

          console.log('✅ [STORE_UPDATE_MULTI] 다중 폼 값 업데이트 완료');

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 🔧 Bridge 호환: 에디터 콘텐츠 업데이트
      updateEditorContent: (content: string) => {
        console.log('📝 [BRIDGE_STORE] 에디터 콘텐츠 업데이트:', {
          contentLength: content?.length || 0,
          hasContent: !!content,
          preview: content?.slice(0, 50) + (content?.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });

        const isValidContent = typeof content === 'string';
        if (!isValidContent) {
          console.warn(
            '⚠️ [BRIDGE_STORE] 유효하지 않은 에디터 내용:',
            typeof content
          );
          return;
        }

        set((state) => {
          const { formData: currentFormData } = state;
          const safeFormData = currentFormData || {};

          const newFormData = {
            ...safeFormData,
            editorCompletedContent: content,
          };

          console.log('✅ [BRIDGE_STORE] 에디터 콘텐츠 업데이트 완료');

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 🔧 Bridge 호환: 에디터 완료 상태 설정
      setEditorCompleted: (completed: boolean) => {
        console.log('✅ [BRIDGE_STORE] 에디터 완료 상태 설정:', {
          completed,
          timestamp: new Date().toISOString(),
        });

        const isValidCompleted = typeof completed === 'boolean';
        if (!isValidCompleted) {
          console.warn(
            '⚠️ [BRIDGE_STORE] 유효하지 않은 에디터 완료 상태:',
            completed
          );
          return;
        }

        set((state) => {
          const { formData: currentFormData } = state;
          const safeFormData = currentFormData || {};

          const newFormData = {
            ...safeFormData,
            isEditorCompleted: completed,
          };

          console.log('✅ [BRIDGE_STORE] 에디터 완료 상태 설정 완료');

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 🔧 Bridge 호환: FormValues 전체 설정
      setFormValues: (values: BridgeCompatibleFormValues) => {
        console.log('📝 [BRIDGE_STORE] Bridge FormValues 전체 설정:', {
          hasNickname: !!values.nickname,
          hasTitle: !!values.title,
          hasEditorContent: !!values.editorCompletedContent,
          isEditorCompleted: values.isEditorCompleted,
          timestamp: new Date().toISOString(),
        });

        const isValidValues = values && typeof values === 'object';
        if (!isValidValues) {
          console.warn(
            '⚠️ [BRIDGE_STORE] 유효하지 않은 FormValues:',
            typeof values
          );
          return;
        }

        set((state) => {
          const convertedFormData = convertBridgeFormValuesToFormData(values);

          console.log('✅ [BRIDGE_STORE] Bridge FormValues 전체 설정 완료');

          return {
            ...state,
            formData: convertedFormData,
          };
        });
      },

      // 폼 필드 초기화
      resetFormField: (fieldName: string) => {
        console.log('🔄 [STORE_RESET] 폼 필드 초기화:', {
          fieldName,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formData: currentFormData } = state;

          const hasFormData =
            currentFormData !== null && currentFormData !== undefined;
          if (!hasFormData) {
            console.log('⚠️ [STORE_RESET] 폼 데이터가 없음, 변경 없음');
            return state;
          }

          const newFormData = { ...currentFormData };
          delete newFormData[fieldName];

          console.log('✅ [STORE_RESET] 폼 필드 초기화 완료:', { fieldName });

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 전체 폼 데이터 초기화
      resetAllFormData: () => {
        console.log('🔄 [STORE_RESET_ALL] 전체 폼 데이터 초기화');

        set((state) => ({
          ...state,
          formData: {},
        }));

        console.log('✅ [STORE_RESET_ALL] 전체 폼 데이터 초기화 완료');
      },

      // 토스트 메시지 추가
      addToast: (toast: ToastMessage) => {
        console.log('🍞 [STORE_TOAST] 토스트 메시지 추가:', {
          title: toast.title,
          color: toast.color,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { toasts: currentToasts } = state;
          const safeToasts = Array.isArray(currentToasts) ? currentToasts : [];

          return {
            ...state,
            toasts: [...safeToasts, toast],
          };
        });

        console.log('✅ [STORE_TOAST] 토스트 메시지 추가 완료');
      },

      // 토스트 메시지 제거
      removeToast: (index: number) => {
        console.log('🗑️ [STORE_TOAST] 토스트 메시지 제거:', {
          index,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { toasts: currentToasts } = state;

          const isToastsArray = Array.isArray(currentToasts);
          if (!isToastsArray) {
            console.log('⚠️ [STORE_TOAST] 토스트 배열이 없음, 변경 없음');
            return state;
          }

          const isValidIndex = index >= 0 && index < currentToasts.length;
          if (!isValidIndex) {
            console.warn(
              '⚠️ [STORE_TOAST] 유효하지 않은 토스트 인덱스:',
              index
            );
            return state;
          }

          const newToasts = currentToasts.filter(
            (_, toastIndex) => toastIndex !== index
          );

          return {
            ...state,
            toasts: newToasts,
          };
        });

        console.log('✅ [STORE_TOAST] 토스트 메시지 제거 완료');
      },

      // 모든 토스트 메시지 초기화
      clearAllToasts: () => {
        console.log('🧹 [STORE_TOAST] 모든 토스트 메시지 초기화');

        set((state) => ({
          ...state,
          toasts: [],
        }));

        console.log('✅ [STORE_TOAST] 모든 토스트 메시지 초기화 완료');
      },
    }),
    {
      name: 'multi-step-form-storage',
      partialize: (state) => {
        console.log('💾 [PERSIST] localStorage 저장 시작');

        const safeData = createSafeStorageData(state);
        const isSafeToStore = isStorageSafe(safeData);

        if (isSafeToStore) {
          console.log('✅ [PERSIST] 안전한 데이터 localStorage 저장');
          return safeData;
        }

        console.warn('⚠️ [PERSIST] 데이터 크기 초과로 필수 텍스트만 저장');

        const { formData } = state;
        const {
          nickname = '',
          emailPrefix = '',
          emailDomain = '',
          bio = '',
          title = '',
          description = '',
          tags = '',
          content = '',
          editorCompletedContent = '',
          isEditorCompleted = false,
        } = formData || {};

        const textOnlyData: StorageData = {
          formData: {
            nickname,
            emailPrefix,
            emailDomain,
            bio,
            title,
            description,
            tags,
            content,
            editorCompletedContent,
            isEditorCompleted,
          },
          toasts: [],
        };

        return textOnlyData;
      },
      onRehydrateStorage: () => {
        console.log('🔄 [PERSIST] localStorage에서 데이터 복원 시작');

        return (state, error) => {
          if (error) {
            console.error('❌ [PERSIST] localStorage 복원 실패:', error);
            localStorage.removeItem('multi-step-form-storage');
          } else {
            console.log('✅ [PERSIST] localStorage 복원 완료:', {
              hasFormData: !!state?.formData,
              formDataKeys: state?.formData ? Object.keys(state.formData) : [],
              timestamp: new Date().toISOString(),
            });
          }
        };
      },
    }
  )
);

console.log(
  '📄 [STORE] localStorage 최적화된 multiStepFormStore 모듈 로드 완료'
);
