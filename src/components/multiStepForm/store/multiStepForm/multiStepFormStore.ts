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

// 🆕 Phase 2: Bridge가 기대하는 정확한 FormValues 타입 (formTypes.ts 기반)
interface ExpectedBridgeFormValues {
  nickname: string; // required
  title: string; // required
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  [key: string]: string | string[] | boolean | null | undefined;
}

// 스토어 인터페이스 - Bridge 메서드 및 속성 추가
interface MultiStepFormStore {
  formData: FormData;
  toasts: ToastMessage[];

  // 🆕 Phase 2: Bridge 호환성을 위한 직접 속성 접근
  formValues: ExpectedBridgeFormValues; // Bridge가 기대하는 getter 속성
  currentStep: number; // Bridge가 기대하는 스텝 번호
  editorCompletedContent: string; // Bridge가 기대하는 에디터 내용 getter
  isEditorCompleted: boolean; // Bridge가 기대하는 완료 상태 getter
  progressWidth: number; // Bridge가 기대하는 진행률

  // 기존 메서드들
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

  // 🆕 Phase 2: Bridge 호환성을 위한 추가 메서드들
  updateCurrentStep: (step: number) => void;
  updateProgressWidth: (width: number) => void;
  getBridgeCompatibleFormValues: () => ExpectedBridgeFormValues;
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
      const isTrueString = lowerValue === 'true';
      if (isTrueString) {
        return true;
      }
      const isFalseString = lowerValue === 'false';
      if (isFalseString) {
        return false;
      }
    }
    return fallback;
  };

  const convertToSafeStringArray = (value: unknown): string[] => {
    const isArray = Array.isArray(value);
    if (!isArray) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  };

  const convertToSafeStringOrNull = (value: unknown): string | null => {
    const isNull = value === null;
    if (isNull) {
      return null;
    }
    const isString = typeof value === 'string';
    if (isString) {
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
  const isString = typeof imageData === 'string';
  if (!isString) {
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

    for (const [fieldName, fieldValue] of formDataEntries) {
      const isNullOrUndefined = fieldValue === null || fieldValue === undefined;
      if (isNullOrUndefined) {
        continue;
      }

      const fieldEstimate = FIELD_SIZE_ESTIMATES.get(fieldName) || 100;

      const isString = typeof fieldValue === 'string';
      if (isString) {
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
      } else {
        const isArray = Array.isArray(fieldValue);
        if (isArray) {
          const arraySize = fieldValue.reduce((acc, item) => {
            const isStringItem = typeof item === 'string';
            if (isStringItem) {
              const isImageData = item.length > 100;
              const itemSize = isImageData
                ? estimateImageDataSize(item)
                : item.length;
              return acc + itemSize;
            }
            return acc;
          }, 0);
          totalEstimatedSize += arraySize;
        } else {
          totalEstimatedSize += fieldEstimate;
        }
      }
    }
  }

  // Toasts 크기 추정
  const isToastsArray = Array.isArray(toasts);
  if (isToastsArray) {
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
  const isSizeUnderSafeLimit = estimatedSizeInMB <= 2.5;
  if (isSizeUnderSafeLimit) {
    console.log('✅ [STORAGE_SAFE] 추정 크기 안전함, 정확한 측정 생략');
    return true;
  }

  // 추정 크기가 4MB 이상이면 위험하다고 가정
  const isSizeOverDangerLimit = estimatedSizeInMB >= 4;
  if (isSizeOverDangerLimit) {
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
  const isUserImageValid =
    typeof userImage === 'string' && userImage.length <= 100000;
  const processedUserImage = isUserImageValid ? userImage : '';

  const isMainImageValid =
    typeof mainImage === 'string' && mainImage.length <= 100000;
  const processedMainImage = isMainImageValid ? mainImage : null;

  // media 배열 필터링
  const isMediaArray = Array.isArray(media);
  const processedMedia = isMediaArray
    ? media.filter((item): item is string => {
        const isValidString = typeof item === 'string';
        const isSafeSize = isValidString && item.length <= 100000;

        const isValidButUnsafe = isValidString && !isSafeSize;
        if (isValidButUnsafe) {
          console.log('🛡️ [SAFE_STORAGE] media 아이템 크기 초과로 제외');
        }

        return isValidString && isSafeSize;
      })
    : [];

  // sliderImages 배열 필터링
  const isSliderImagesArray = Array.isArray(sliderImages);
  const processedSliderImages = isSliderImagesArray
    ? sliderImages.filter((item): item is string => {
        const isValidString = typeof item === 'string';
        const isSafeSize = isValidString && item.length <= 100000;

        const isValidButUnsafe = isValidString && !isSafeSize;
        if (isValidButUnsafe) {
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
  const isToastsArray = Array.isArray(toasts);
  const safeToasts = isToastsArray ? toasts.slice(-5) : [];

  const safeStorageData: StorageData = {
    formData: safeFormData,
    toasts: safeToasts,
  };

  console.log('🛡️ [SAFE_STORAGE] 안전한 저장 데이터 생성 완료:', {
    originalMediaCount: isMediaArray ? media.length : 0,
    processedMediaCount: processedMedia.length,
    originalSliderImagesCount: isSliderImagesArray ? sliderImages.length : 0,
    processedSliderImagesCount: processedSliderImages.length,
    originalToastsCount: isToastsArray ? toasts.length : 0,
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

// 🆕 Phase 2: FormData를 Bridge 호환 FormValues로 변환하는 함수 (🚨 에러 수정)
const convertFormDataToBridgeFormValues = (
  formData: FormData | undefined | null
): ExpectedBridgeFormValues => {
  console.log('🔄 [BRIDGE_CONVERTER] FormData → Bridge FormValues 변환 시작');

  const { convertToSafeString, convertToSafeBoolean } =
    createSafeTypeConverters();

  // 🚨 핵심 수정: formData가 없는 경우 기본값 반환
  const isFormDataValid = formData && typeof formData === 'object';
  if (!isFormDataValid) {
    console.warn('⚠️ [BRIDGE_CONVERTER] formData가 없음, 기본값 사용');
    return {
      nickname: '',
      title: '',
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }

  const {
    nickname = '',
    title = '',
    editorCompletedContent = '',
    isEditorCompleted = false,
    ...otherFields
  } = formData;

  const bridgeFormValues: ExpectedBridgeFormValues = {
    nickname: convertToSafeString(nickname, ''),
    title: convertToSafeString(title, ''),
    editorCompletedContent: convertToSafeString(editorCompletedContent, ''),
    isEditorCompleted: convertToSafeBoolean(isEditorCompleted, false),
    ...otherFields,
  };

  console.log('✅ [BRIDGE_CONVERTER] Bridge FormValues 변환 완료:', {
    nickname: bridgeFormValues.nickname,
    title: bridgeFormValues.title,
    hasEditorContent: !!bridgeFormValues.editorCompletedContent,
    isEditorCompleted: bridgeFormValues.isEditorCompleted,
    otherFieldsCount: Object.keys(otherFields).length,
    timestamp: new Date().toISOString(),
  });

  return bridgeFormValues;
};

// 🆕 Phase 2: 진행률 계산 함수 (🚨 에러 방지 버전)
const calculateProgressWidthSafely = (
  formData: FormData | null | undefined,
  hardcodedCurrentStep: number
): number => {
  console.log('📊 [PROGRESS_CALC] 안전한 진행률 계산 시작:', {
    hasFormData: !!formData,
    hardcodedCurrentStep,
    timestamp: new Date().toISOString(),
  });

  // 🚨 안전성 검사: formData 유효성 확인
  const safeFormData = formData || {};

  const requiredFields = ['nickname', 'title'];
  const completedRequiredFields = requiredFields.filter((field) => {
    const fieldValue = safeFormData[field];
    const isStringValue = typeof fieldValue === 'string';
    const hasContent = isStringValue && fieldValue.trim().length > 0;
    return hasContent;
  });

  const baseProgress = (hardcodedCurrentStep / 5) * 100; // 5단계 기준
  const fieldProgress =
    (completedRequiredFields.length / requiredFields.length) * 20; // 최대 20% 추가

  const totalProgress = Math.min(100, baseProgress + fieldProgress);

  console.log('📊 [PROGRESS_CALC] 안전한 진행률 계산 완료:', {
    hardcodedCurrentStep,
    baseProgress,
    fieldProgress,
    totalProgress,
    completedRequiredFields,
    timestamp: new Date().toISOString(),
  });

  return totalProgress;
};

// 🔧 기본 FormData 생성 함수 (🚨 에러 방지)
const createDefaultFormData = (): FormData => {
  return {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    tags: '',
    content: '',
    mainImage: null,
    media: [],
    sliderImages: [],
    editorCompletedContent: '',
    isEditorCompleted: false,
  };
};

// Zustand 스토어 생성 (🚨 에러 수정 버전)
export const useMultiStepFormStore = create<MultiStepFormStore>()(
  persist(
    (set, get) => ({
      // 초기 상태 (🚨 기본값 보장)
      formData: createDefaultFormData(),
      toasts: [],

      // 🆕 Phase 2: Bridge 호환성을 위한 계산된 속성들 (🚨 순환 참조 해결)
      get formValues() {
        console.log('🔄 [BRIDGE_GETTER] formValues getter 호출 시작');

        try {
          const state = get();

          // 🚨 핵심 수정: 안전한 formData 접근
          const { formData = null } = state || {};

          const bridgeFormValues = convertFormDataToBridgeFormValues(formData);

          console.log('🔄 [BRIDGE_GETTER] formValues getter 호출 완료:', {
            hasFormData: !!formData,
            formDataKeys: formData ? Object.keys(formData).length : 0,
            bridgeFormValuesKeys: Object.keys(bridgeFormValues).length,
            nickname: bridgeFormValues.nickname,
            title: bridgeFormValues.title,
            timestamp: new Date().toISOString(),
          });

          return bridgeFormValues;
        } catch (getterError) {
          console.error(
            '❌ [BRIDGE_GETTER] formValues getter 오류:',
            getterError
          );
          return {
            nickname: '',
            title: '',
            editorCompletedContent: '',
            isEditorCompleted: false,
          };
        }
      },

      get currentStep() {
        // 🎯 Phase 2: Writing 단계로 하드코딩 (Bridge 요구사항)
        console.log(
          '🔄 [BRIDGE_GETTER] currentStep getter 호출: 4 (Writing Step)'
        );
        return 4;
      },

      get editorCompletedContent() {
        console.log(
          '🔄 [BRIDGE_GETTER] editorCompletedContent getter 호출 시작'
        );

        try {
          const state = get();

          // 🚨 핵심 수정: 안전한 접근
          const { formData = null } = state || {};
          const content = formData?.editorCompletedContent || '';

          console.log(
            '🔄 [BRIDGE_GETTER] editorCompletedContent getter 호출 완료:',
            {
              hasFormData: !!formData,
              contentLength: content.length,
              hasContent: !!content,
              preview:
                content.slice(0, 50) + (content.length > 50 ? '...' : ''),
              timestamp: new Date().toISOString(),
            }
          );

          const isString = typeof content === 'string';
          return isString ? content : '';
        } catch (getterError) {
          console.error(
            '❌ [BRIDGE_GETTER] editorCompletedContent getter 오류:',
            getterError
          );
          return '';
        }
      },

      get isEditorCompleted() {
        console.log('🔄 [BRIDGE_GETTER] isEditorCompleted getter 호출 시작');

        try {
          const state = get();

          // 🚨 핵심 수정: 안전한 접근
          const { formData = null } = state || {};
          const completed = formData?.isEditorCompleted || false;

          console.log(
            '🔄 [BRIDGE_GETTER] isEditorCompleted getter 호출 완료:',
            {
              hasFormData: !!formData,
              completed,
              timestamp: new Date().toISOString(),
            }
          );

          const isBoolean = typeof completed === 'boolean';
          return isBoolean ? completed : false;
        } catch (getterError) {
          console.error(
            '❌ [BRIDGE_GETTER] isEditorCompleted getter 오류:',
            getterError
          );
          return false;
        }
      },

      get progressWidth() {
        console.log('🔄 [BRIDGE_GETTER] progressWidth getter 호출 시작');

        try {
          const state = get();

          // 🚨 핵심 수정: state 안전성 검사 + getter 의존성 제거
          if (!state) {
            console.warn('⚠️ [BRIDGE_GETTER] state가 없음, 기본 진행률 반환');
            return 0;
          }

          const { formData = null } = state;

          // 🚨 핵심 수정: 하드코딩된 currentStep 사용 (getter 의존성 제거)
          const hardcodedCurrentStep = 4; // state.currentStep 대신 직접 값 사용

          const progress = calculateProgressWidthSafely(
            formData,
            hardcodedCurrentStep
          );

          console.log('🔄 [BRIDGE_GETTER] progressWidth getter 호출 완료:', {
            hasFormData: !!formData,
            hardcodedCurrentStep,
            progress,
            timestamp: new Date().toISOString(),
          });

          return progress;
        } catch (getterError) {
          console.error(
            '❌ [BRIDGE_GETTER] progressWidth getter 오류:',
            getterError
          );
          return 0;
        }
      },

      // 기존 메서드들 유지...
      getFormValues: () => {
        const state = get();
        const { formData } = state;

        console.log('📊 [STORE_GET] 폼 값 가져오기:', {
          formDataKeys: Object.keys(formData || {}),
          timestamp: new Date().toISOString(),
        });

        return formData || createDefaultFormData();
      },

      // 🆕 Phase 2: Bridge 호환성을 위한 추가 메서드들
      updateCurrentStep: (step: number) => {
        console.log('📝 [BRIDGE_STORE] currentStep 업데이트:', {
          step,
          timestamp: new Date().toISOString(),
        });

        // 현재는 하드코딩된 값이므로 실제 업데이트는 하지 않음
        // 추후 필요시 상태로 관리 가능
      },

      updateProgressWidth: (width: number) => {
        console.log('📝 [BRIDGE_STORE] progressWidth 업데이트:', {
          width,
          timestamp: new Date().toISOString(),
        });

        // 현재는 계산된 값이므로 실제 업데이트는 하지 않음
        // 진행률은 formData와 currentStep에서 자동 계산됨
      },

      getBridgeCompatibleFormValues: () => {
        const state = get();

        // 🚨 핵심 수정: 안전한 접근
        const { formData = null } = state || {};
        const bridgeFormValues = convertFormDataToBridgeFormValues(formData);

        console.log('📊 [BRIDGE_STORE] Bridge 호환 FormValues 반환:', {
          hasFormData: !!formData,
          bridgeFormValues,
          timestamp: new Date().toISOString(),
        });

        return bridgeFormValues;
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
          const { formData: currentFormData = null } = state;
          const safeFormData = currentFormData || createDefaultFormData();

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
          const { formData: currentFormData = null } = state;
          const safeFormData = currentFormData || createDefaultFormData();

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
          const { formData: currentFormData = null } = state;
          const safeFormData = currentFormData || createDefaultFormData();

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
          const { formData: currentFormData = null } = state;
          const safeFormData = currentFormData || createDefaultFormData();

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
          const { formData: currentFormData = null } = state;

          if (!currentFormData) {
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
          formData: createDefaultFormData(),
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

        try {
          const safeData = createSafeStorageData(state);
          const isSafeToStore = isStorageSafe(safeData);

          if (isSafeToStore) {
            console.log('✅ [PERSIST] 안전한 데이터 localStorage 저장');
            return safeData;
          }

          console.warn('⚠️ [PERSIST] 데이터 크기 초과로 필수 텍스트만 저장');

          const { formData } = state;
          const safeFormData = formData || createDefaultFormData();
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
          } = safeFormData;

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
        } catch (persistError) {
          console.error('❌ [PERSIST] 저장 처리 오류:', persistError);
          return {
            formData: createDefaultFormData(),
            toasts: [],
          };
        }
      },
      onRehydrateStorage: () => {
        console.log('🔄 [PERSIST] localStorage에서 데이터 복원 시작');

        return (state, error) => {
          if (error) {
            console.error('❌ [PERSIST] localStorage 복원 실패:', error);

            try {
              localStorage.removeItem('multi-step-form-storage');
            } catch (cleanupError) {
              console.error(
                '❌ [PERSIST] localStorage 정리 실패:',
                cleanupError
              );
            }

            // 🚨 에러 시 기본 상태로 초기화
            try {
              const store = useMultiStepFormStore.getState();
              store.resetAllFormData();
            } catch (resetError) {
              console.error('❌ [PERSIST] 상태 리셋 실패:', resetError);
            }
          } else {
            console.log('✅ [PERSIST] localStorage 복원 완료:', {
              hasState: !!state,
              hasFormData: !!state?.formData,
              formDataKeys: state?.formData ? Object.keys(state.formData) : [],
              timestamp: new Date().toISOString(),
            });

            // 🚨 복원된 데이터 검증 및 보완
            if (state && !state.formData) {
              console.warn('⚠️ [PERSIST] formData가 없어 기본값으로 초기화');
              state.formData = createDefaultFormData();
            }
          }
        };
      },
    }
  )
);

console.log('📄 [STORE] 🚨 에러 수정 완료된 multiStepFormStore 모듈 로드 완료');
