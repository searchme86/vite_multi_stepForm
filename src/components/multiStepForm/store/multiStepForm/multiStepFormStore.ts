// src/components/multiStepForm/store/multiStepForm/multiStepFormStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getDefaultFormSchemaValues,
  getAllFieldNames,
  getStringFields,
  getEmailFields,
} from '../../utils/formFieldsLoader';

// 🆕 수정 가능한 폼 데이터 인터페이스 (readonly 제거)
interface FormData {
  userImage?: string;
  nickname?: string;
  emailPrefix?: string;
  emailDomain?: string;
  bio?: string;
  title?: string;
  description?: string;
  mainImage?: string | null;
  media?: string[];
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 동적 키 접근 허용 (readonly 제거)
  [key: string]: string | string[] | boolean | null | undefined;
}

// 토스트 메시지 인터페이스
interface ToastMessage {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'danger' | 'warning' | 'info';
}

// 🆕 수정 가능한 Bridge 호환성을 위한 FormValues 인터페이스 (readonly 제거)
interface BridgeCompatibleFormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 동적 키 접근 허용 (readonly 제거)
  [key: string]: string | string[] | boolean | null | undefined;
}

// 🆕 수정 가능한 Bridge가 기대하는 정확한 FormValues 타입 (readonly 제거)
interface ExpectedBridgeFormValues {
  nickname: string; // required
  title: string; // required
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 동적 키 접근 허용 (readonly 제거)
  [key: string]: string | string[] | boolean | null | undefined;
}

// 스토어 인터페이스 - Bridge 메서드 및 속성 추가
interface MultiStepFormStore {
  readonly formData: FormData;
  readonly toasts: ToastMessage[];

  // Bridge 호환성을 위한 직접 속성 접근
  readonly formValues: ExpectedBridgeFormValues; // Bridge가 기대하는 getter 속성
  readonly currentStep: number; // Bridge가 기대하는 스텝 번호
  readonly editorCompletedContent: string; // Bridge가 기대하는 에디터 내용 getter
  readonly isEditorCompleted: boolean; // Bridge가 기대하는 완료 상태 getter
  readonly progressWidth: number; // Bridge가 기대하는 진행률

  // 기존 메서드들
  readonly getFormValues: () => FormData;
  readonly updateFormValue: (
    fieldName: string,
    value: string | string[] | boolean | null
  ) => void;
  readonly updateFormValues: (
    values: Record<string, string | string[] | boolean | null>
  ) => void;
  readonly resetFormField: (fieldName: string) => void;
  readonly resetAllFormData: () => void;
  readonly addToast: (toast: ToastMessage) => void;
  readonly removeToast: (index: number) => void;
  readonly clearAllToasts: () => void;
  readonly updateEditorContent: (content: string) => void;
  readonly setEditorCompleted: (completed: boolean) => void;
  readonly setFormValues: (values: BridgeCompatibleFormValues) => void;

  // Bridge 호환성을 위한 추가 메서드들
  readonly updateCurrentStep: (step: number) => void;
  readonly updateProgressWidth: (width: number) => void;
  readonly getBridgeCompatibleFormValues: () => ExpectedBridgeFormValues;
}

// 저장할 데이터 타입 정의
interface StorageData {
  readonly formData: FormData;
  readonly toasts: ToastMessage[];
}

// 🔧 안전한 문자열 배열 검증 함수
const validateStringArray = (value: unknown): value is string[] => {
  const isArray = Array.isArray(value);
  if (!isArray) {
    return false;
  }

  const allItemsAreStrings = value.every((item) => typeof item === 'string');
  return allItemsAreStrings;
};

// 🔧 타입 안전한 문자열 배열 가드 함수 (강화)
const createSafeStringArrayFromUnknown = (value: unknown): string[] => {
  console.log('🔧 [TYPE_GUARD] 안전한 문자열 배열 생성:', {
    inputType: typeof value,
    isArray: Array.isArray(value),
    timestamp: new Date().toISOString(),
  });

  // 1차 검증: 배열인지 확인
  const isArrayValue = Array.isArray(value);
  if (!isArrayValue) {
    console.log('⚠️ [TYPE_GUARD] 배열이 아님, 빈 배열 반환');
    return [];
  }

  // 2차 검증: 모든 요소가 문자열인지 확인
  const isValidStringArray = validateStringArray(value);
  if (!isValidStringArray) {
    console.log('⚠️ [TYPE_GUARD] 배열 내 비문자열 요소 존재, 문자열만 필터링');

    // 문자열 요소만 안전하게 추출
    const stringItems: string[] = [];
    for (const item of value) {
      const isStringItem = typeof item === 'string';
      if (isStringItem) {
        stringItems.push(item);
      }
    }

    console.log('✅ [TYPE_GUARD] 문자열 필터링 완료:', {
      originalLength: value.length,
      filteredLength: stringItems.length,
    });

    return stringItems;
  }

  // 3차 검증: 완전한 문자열 배열 반환
  console.log('✅ [TYPE_GUARD] 안전한 문자열 배열 생성 완료:', {
    originalLength: value.length,
    allItemsValid: true,
  });

  return value;
};

// 🔧 필드명으로부터 크기 맵 생성
const createFieldSizeMapFromFieldNames = (
  fieldNames: string[]
): Map<string, number> => {
  const fieldSizeMap = new Map<string, number>();

  // 기본 크기 추정값 (바이트 단위)
  const defaultSizes: Record<string, number> = {
    userImage: 0, // 이미지는 별도 처리
    nickname: 100,
    emailPrefix: 50,
    emailDomain: 50,
    bio: 500,
    title: 200,
    description: 1000,
    mainImage: 0, // 이미지는 별도 처리
    media: 0, // 배열은 별도 처리
    sliderImages: 0, // 배열은 별도 처리
    editorCompletedContent: 10000,
    isEditorCompleted: 10,
  };

  // 안전한 반복문으로 맵 생성
  for (const fieldName of fieldNames) {
    const isValidFieldName =
      typeof fieldName === 'string' && fieldName.length > 0;
    if (!isValidFieldName) {
      continue;
    }

    const estimatedSize = Reflect.get(defaultSizes, fieldName) || 100; // 알 수 없는 필드는 100바이트
    fieldSizeMap.set(fieldName, estimatedSize);
  }

  console.log('✅ [STORE] 필드 크기 맵 생성 완료:', {
    inputFieldsCount: fieldNames.length,
    mapSize: fieldSizeMap.size,
    fields: Array.from(fieldSizeMap.keys()),
    timestamp: new Date().toISOString(),
  });

  return fieldSizeMap;
};

// 🆕 동적 필드별 예상 크기 맵 생성 (타입 안전성 강화)
const createDynamicFieldSizeEstimates = (): Map<string, number> => {
  console.log('🔧 [STORE] 동적 필드 크기 추정 맵 생성');

  try {
    const allFieldNamesRaw = getAllFieldNames();

    // 타입 안전성 검증
    const isValidFieldNames = validateStringArray(allFieldNamesRaw);
    if (!isValidFieldNames) {
      console.warn(
        '⚠️ [STORE] getAllFieldNames() 반환값이 유효하지 않음, 기본 필드 사용'
      );

      // Fallback 필드들
      const defaultFieldNames: string[] = [
        'userImage',
        'nickname',
        'emailPrefix',
        'emailDomain',
        'bio',
        'title',
        'description',
        'mainImage',
        'media',
        'sliderImages',
        'editorCompletedContent',
        'isEditorCompleted',
      ];

      return createFieldSizeMapFromFieldNames(defaultFieldNames);
    }

    const allFieldNames: string[] = allFieldNamesRaw;
    return createFieldSizeMapFromFieldNames(allFieldNames);
  } catch (error) {
    console.error('❌ [STORE] 필드 크기 추정 맵 생성 실패:', error);

    // 최소한의 기본 필드들
    const fallbackFieldNames: string[] = ['nickname', 'title'];
    return createFieldSizeMapFromFieldNames(fallbackFieldNames);
  }
};

const DYNAMIC_FIELD_SIZE_ESTIMATES = createDynamicFieldSizeEstimates();

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
  const data1FormData = data1.formData || {};
  const data2FormData = data2.formData || {};

  const data1Keys = Object.keys(data1FormData);
  const data2Keys = Object.keys(data2FormData);

  const keysMatch =
    data1Keys.length === data2Keys.length &&
    data1Keys.every((key) => data2Keys.includes(key));

  const data1Toasts = data1.toasts || [];
  const data2Toasts = data2.toasts || [];
  const toastsMatch = data1Toasts.length === data2Toasts.length;

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

  const { data: cachedData, serialized: cachedSerialized } = serializationCache;

  const hasValidCacheData = cachedData !== null && cachedSerialized !== null;
  if (!hasValidCacheData) {
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

// 🆕 동적 안전한 타입 변환 유틸리티
const createDynamicSafeTypeConverters = () => {
  console.log('🔧 [STORE] 동적 안전한 타입 변환기 생성');

  const convertToSafeString = (value: unknown, fallback: string): string => {
    const isStringType = typeof value === 'string';
    if (isStringType) {
      return value;
    }
    const isNumberType = typeof value === 'number';
    if (isNumberType) {
      return String(value);
    }
    return fallback;
  };

  const convertToSafeBoolean = (value: unknown, fallback: boolean): boolean => {
    const isBooleanType = typeof value === 'boolean';
    if (isBooleanType) {
      return value;
    }
    const isStringType = typeof value === 'string';
    if (isStringType) {
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
    return createSafeStringArrayFromUnknown(value);
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

  console.log('✅ [STORE] 동적 안전한 타입 변환기 생성 완료');

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

// 🆕 동적 스마트 크기 추정 (실제 직렬화 없이)
const estimateDataSize = (data: StorageData): number => {
  console.log('📊 [SIZE_ESTIMATE] 동적 스마트 크기 추정 시작');

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

      const fieldEstimate = DYNAMIC_FIELD_SIZE_ESTIMATES.get(fieldName) || 100;

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
              const itemLength = item.length;
              const isImageData = itemLength > 100;
              const itemSize = isImageData
                ? estimateImageDataSize(item)
                : itemLength;
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

  console.log('📊 [SIZE_ESTIMATE] 동적 크기 추정 완료:', {
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

// 🔧 이미지 필드 값 처리
const processImageFieldValue = (
  fieldValue: unknown
): string | null | undefined => {
  const isStringValue = typeof fieldValue === 'string';
  if (isStringValue) {
    const isValidSize = fieldValue.length <= 100000;
    return isValidSize ? fieldValue : '';
  }

  const isStringOrNull = fieldValue === null || typeof fieldValue === 'string';
  if (isStringOrNull) {
    const isValidImage =
      typeof fieldValue === 'string' && fieldValue.length <= 100000;
    return isValidImage ? fieldValue : null;
  }

  return undefined;
};

// 🔧 배열 필드 값 처리
const processArrayFieldValue = (
  fieldName: string,
  fieldValue: unknown[]
): string[] => {
  const filteredArray: string[] = [];

  for (const item of fieldValue) {
    const isValidString = typeof item === 'string';
    const isSafeSize = isValidString && item.length <= 100000;

    if (isValidString && isSafeSize) {
      filteredArray.push(item);
    } else if (isValidString && !isSafeSize) {
      console.log(`🛡️ [SAFE_STORAGE] ${fieldName} 아이템 크기 초과로 제외`);
    }
  }

  return filteredArray;
};

// 🔧 기본 안전한 저장 데이터 생성
const createBasicSafeStorageData = (
  formData: FormData | undefined,
  toasts: ToastMessage[]
): StorageData => {
  const safeFormData: FormData = formData ? { ...formData } : {};
  const isToastsArray = Array.isArray(toasts);
  const safeToasts = isToastsArray ? toasts.slice(-5) : [];

  return {
    formData: safeFormData,
    toasts: safeToasts,
  };
};

// 🔧 필드명으로 폼 데이터 처리
const processFormDataWithFieldNames = (
  formData: FormData | undefined,
  toasts: ToastMessage[],
  fieldNames: string[]
): StorageData => {
  const safeFormData: FormData = {};
  let processedImageFields = 0;

  for (const fieldName of fieldNames) {
    const isValidFieldName =
      typeof fieldName === 'string' && fieldName.length > 0;
    if (!isValidFieldName) {
      continue;
    }

    const fieldValue = formData ? Reflect.get(formData, fieldName) : undefined;

    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }

    // 이미지 필드들 처리
    const isImageField =
      fieldName.includes('Image') || fieldName === 'mainImage';

    if (isImageField) {
      const processedImageValue = processImageFieldValue(fieldValue);
      if (processedImageValue !== undefined) {
        Reflect.set(safeFormData, fieldName, processedImageValue);
        processedImageFields += 1;
      }
    } else {
      // 배열 필드 처리
      const isArrayValue = Array.isArray(fieldValue);
      if (isArrayValue) {
        const safeArrayValue = processArrayFieldValue(fieldName, fieldValue);
        Reflect.set(safeFormData, fieldName, safeArrayValue);
      } else {
        // 일반 필드 처리
        Reflect.set(safeFormData, fieldName, fieldValue);
      }
    }
  }

  // 토스트 데이터 처리 - 최근 5개만 유지
  const isToastsArray = Array.isArray(toasts);
  const safeToasts = isToastsArray ? toasts.slice(-5) : [];

  const safeStorageData: StorageData = {
    formData: safeFormData,
    toasts: safeToasts,
  };

  console.log('🛡️ [SAFE_STORAGE] 동적 안전한 저장 데이터 생성 완료:', {
    totalFields: fieldNames.length,
    processedImageFields,
    originalToastsCount: isToastsArray ? toasts.length : 0,
    processedToastsCount: safeToasts.length,
    timestamp: new Date().toISOString(),
  });

  return safeStorageData;
};

// 🆕 동적 안전한 저장 데이터 생성 함수 (타입 안전성 강화)
const createDynamicSafeStorageData = (
  state: MultiStepFormStore
): StorageData => {
  console.log('🛡️ [SAFE_STORAGE] 동적 안전한 저장 데이터 생성 시작');

  const { formData, toasts } = state;

  try {
    const allFieldNamesRaw = getAllFieldNames();
    const isValidFieldNames = validateStringArray(allFieldNamesRaw);

    if (!isValidFieldNames) {
      console.warn('⚠️ [SAFE_STORAGE] 필드명 배열이 유효하지 않음, 기본 처리');
      return createBasicSafeStorageData(formData, toasts);
    }

    const allFieldNames: string[] = allFieldNamesRaw;
    return processFormDataWithFieldNames(formData, toasts, allFieldNames);
  } catch (error) {
    console.error('❌ [SAFE_STORAGE] 저장 데이터 생성 실패:', error);
    return createBasicSafeStorageData(formData, toasts);
  }
};

// 🔧 Bridge FormValues 기본 변환
const convertBridgeFormValuesBasic = (
  bridgeFormValues: BridgeCompatibleFormValues
): FormData => {
  const typeConverters = createDynamicSafeTypeConverters();
  const convertedFormData: FormData = {};

  // 기본 필수 필드들만 처리
  const basicFields = [
    'nickname',
    'title',
    'editorCompletedContent',
    'isEditorCompleted',
  ];

  for (const fieldName of basicFields) {
    const fieldValue = Reflect.get(bridgeFormValues, fieldName);

    if (fieldValue === null || fieldValue === undefined) {
      Reflect.set(convertedFormData, fieldName, fieldValue);
      continue;
    }

    if (fieldName === 'isEditorCompleted') {
      const convertedBoolean = typeConverters.convertToSafeBoolean(
        fieldValue,
        false
      );
      Reflect.set(convertedFormData, fieldName, convertedBoolean);
    } else {
      const convertedString = typeConverters.convertToSafeString(
        fieldValue,
        ''
      );
      Reflect.set(convertedFormData, fieldName, convertedString);
    }
  }

  return convertedFormData;
};

// 🔧 필드명 기반 Bridge FormValues 변환
const convertBridgeFormValuesWithFieldNames = (
  bridgeFormValues: BridgeCompatibleFormValues,
  fieldNames: string[]
): FormData => {
  const typeConverters = createDynamicSafeTypeConverters();
  const convertedFormData: FormData = {};

  for (const fieldName of fieldNames) {
    const isValidFieldName =
      typeof fieldName === 'string' && fieldName.length > 0;
    if (!isValidFieldName) {
      continue;
    }

    const fieldValue = Reflect.get(bridgeFormValues, fieldName);

    if (fieldValue === null || fieldValue === undefined) {
      Reflect.set(convertedFormData, fieldName, fieldValue);
      continue;
    }

    // 필드별 타입 변환
    const isArrayField = fieldName === 'media' || fieldName === 'sliderImages';
    const isImageField =
      fieldName.includes('Image') || fieldName === 'mainImage';
    const isBooleanField = fieldName === 'isEditorCompleted';

    if (isArrayField) {
      const convertedArray =
        typeConverters.convertToSafeStringArray(fieldValue);
      Reflect.set(convertedFormData, fieldName, convertedArray);
    } else if (isImageField && fieldName === 'mainImage') {
      const convertedNullable =
        typeConverters.convertToSafeStringOrNull(fieldValue);
      Reflect.set(convertedFormData, fieldName, convertedNullable);
    } else if (isBooleanField) {
      const convertedBoolean = typeConverters.convertToSafeBoolean(
        fieldValue,
        false
      );
      Reflect.set(convertedFormData, fieldName, convertedBoolean);
    } else {
      const convertedString = typeConverters.convertToSafeString(
        fieldValue,
        ''
      );
      Reflect.set(convertedFormData, fieldName, convertedString);
    }
  }

  console.log('✅ [BRIDGE_CONVERTER] 동적 변환 완료:', {
    inputFields: Object.keys(bridgeFormValues).length,
    outputFields: Object.keys(convertedFormData).length,
    processedFields: fieldNames.length,
    timestamp: new Date().toISOString(),
  });

  return convertedFormData;
};

// 🆕 동적 Bridge FormValues를 FormData로 변환하는 함수 (타입 안전성 강화)
const convertBridgeFormValuesToFormData = (
  bridgeFormValues: BridgeCompatibleFormValues
): FormData => {
  console.log(
    '🔄 [BRIDGE_CONVERTER] 동적 Bridge FormValues → FormData 변환 시작'
  );

  try {
    const allFieldNamesRaw = getAllFieldNames();
    const isValidFieldNames = validateStringArray(allFieldNamesRaw);

    if (!isValidFieldNames) {
      console.warn(
        '⚠️ [BRIDGE_CONVERTER] 필드명이 유효하지 않음, 기본 변환 수행'
      );
      return convertBridgeFormValuesBasic(bridgeFormValues);
    }

    const allFieldNames: string[] = allFieldNamesRaw;
    return convertBridgeFormValuesWithFieldNames(
      bridgeFormValues,
      allFieldNames
    );
  } catch (error) {
    console.error('❌ [BRIDGE_CONVERTER] 변환 중 오류:', error);
    return convertBridgeFormValuesBasic(bridgeFormValues);
  }
};

// 🔧 FormData → Bridge 기본 변환
const convertFormDataToBridgeBasic = (
  formData: FormData,
  bridgeFormValues: ExpectedBridgeFormValues
): ExpectedBridgeFormValues => {
  const typeConverters = createDynamicSafeTypeConverters();

  // 기본 필수 필드들만 처리
  const basicFields = [
    'nickname',
    'title',
    'editorCompletedContent',
    'isEditorCompleted',
  ];

  for (const fieldName of basicFields) {
    const fieldValue = Reflect.get(formData, fieldName);

    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }

    if (fieldName === 'isEditorCompleted') {
      const convertedBoolean = typeConverters.convertToSafeBoolean(
        fieldValue,
        false
      );
      Reflect.set(bridgeFormValues, fieldName, convertedBoolean);
    } else {
      const isStringValue = typeof fieldValue === 'string';
      if (isStringValue) {
        const convertedString = typeConverters.convertToSafeString(
          fieldValue,
          ''
        );
        Reflect.set(bridgeFormValues, fieldName, convertedString);
      } else {
        // 배열이나 다른 타입들은 그대로 전달
        Reflect.set(bridgeFormValues, fieldName, fieldValue);
      }
    }
  }

  return bridgeFormValues;
};

// 🔧 필드명 기반 FormData → Bridge 변환
const convertFormDataToBridgeWithFieldNames = (
  formData: FormData,
  bridgeFormValues: ExpectedBridgeFormValues,
  fieldNames: string[]
): ExpectedBridgeFormValues => {
  const typeConverters = createDynamicSafeTypeConverters();

  for (const fieldName of fieldNames) {
    const isValidFieldName =
      typeof fieldName === 'string' && fieldName.length > 0;
    if (!isValidFieldName) {
      continue;
    }

    const fieldValue = Reflect.get(formData, fieldName);

    if (fieldValue === null || fieldValue === undefined) {
      continue;
    }

    const isBooleanField = fieldName === 'isEditorCompleted';

    if (isBooleanField) {
      const convertedBoolean = typeConverters.convertToSafeBoolean(
        fieldValue,
        false
      );
      Reflect.set(bridgeFormValues, fieldName, convertedBoolean);
    } else {
      const isStringValue = typeof fieldValue === 'string';
      if (isStringValue) {
        const convertedString = typeConverters.convertToSafeString(
          fieldValue,
          ''
        );
        Reflect.set(bridgeFormValues, fieldName, convertedString);
      } else {
        // 배열이나 다른 타입들은 그대로 전달
        Reflect.set(bridgeFormValues, fieldName, fieldValue);
      }
    }
  }

  console.log('✅ [BRIDGE_CONVERTER] 동적 Bridge FormValues 변환 완료:', {
    nickname: bridgeFormValues.nickname,
    title: bridgeFormValues.title,
    hasEditorContent: !!bridgeFormValues.editorCompletedContent,
    isEditorCompleted: bridgeFormValues.isEditorCompleted,
    totalFields: Object.keys(bridgeFormValues).length,
    processedFields: fieldNames.length,
    timestamp: new Date().toISOString(),
  });

  return bridgeFormValues;
};

// 🆕 동적 FormData를 Bridge 호환 FormValues로 변환하는 함수 (타입 안전성 강화)
const convertFormDataToBridgeFormValues = (
  formData: FormData | undefined | null
): ExpectedBridgeFormValues => {
  console.log(
    '🔄 [BRIDGE_CONVERTER] 동적 FormData → Bridge FormValues 변환 시작'
  );

  // 기본값으로 초기화
  const bridgeFormValues: ExpectedBridgeFormValues = {
    nickname: '',
    title: '',
    editorCompletedContent: '',
    isEditorCompleted: false,
  };

  // formData가 없는 경우 기본값 반환
  const isFormDataValid = formData && typeof formData === 'object';
  if (!isFormDataValid) {
    console.warn('⚠️ [BRIDGE_CONVERTER] formData가 없음, 기본값 사용');
    return bridgeFormValues;
  }

  try {
    const allFieldNamesRaw = getAllFieldNames();
    const isValidFieldNames = validateStringArray(allFieldNamesRaw);

    if (!isValidFieldNames) {
      console.warn(
        '⚠️ [BRIDGE_CONVERTER] 필드명이 유효하지 않음, 기본 필드만 처리'
      );
      return convertFormDataToBridgeBasic(formData, bridgeFormValues);
    }

    const allFieldNames: string[] = allFieldNamesRaw;
    return convertFormDataToBridgeWithFieldNames(
      formData,
      bridgeFormValues,
      allFieldNames
    );
  } catch (error) {
    console.error('❌ [BRIDGE_CONVERTER] FormData → Bridge 변환 실패:', error);
    return convertFormDataToBridgeBasic(formData, bridgeFormValues);
  }
};

// 🔧 안전한 필드 배열 생성 함수 (타입 안전성 강화)
const createSafeRequiredFieldsArray = (): string[] => {
  console.log('🔧 [SAFE_FIELDS] 안전한 필수 필드 배열 생성 시작');

  // 기본 필수 필드 (항상 안전함)
  const coreRequiredFields: string[] = ['nickname', 'title'];

  try {
    const emailFieldsRaw = getEmailFields();

    // 타입 검증을 통한 안전한 변환
    const isValidEmailFieldsArray = validateStringArray(emailFieldsRaw);
    if (!isValidEmailFieldsArray) {
      console.warn(
        '⚠️ [SAFE_FIELDS] getEmailFields() 반환값이 문자열 배열이 아님'
      );
      return coreRequiredFields;
    }

    const emailFields: string[] = emailFieldsRaw;
    const allRequiredFields: string[] = [...coreRequiredFields, ...emailFields];

    // 최종 검증: 빈 배열이면 기본값 사용
    const hasFields = allRequiredFields.length > 0;
    if (!hasFields) {
      console.warn('⚠️ [SAFE_FIELDS] 필수 필드가 없음, 기본값 사용');
      return coreRequiredFields;
    }

    console.log('✅ [SAFE_FIELDS] 안전한 필수 필드 배열 생성 완료:', {
      coreFieldsCount: coreRequiredFields.length,
      emailFieldsCount: emailFields.length,
      totalFieldsCount: allRequiredFields.length,
      fields: allRequiredFields,
      timestamp: new Date().toISOString(),
    });

    return allRequiredFields;
  } catch (fieldsError) {
    console.error('❌ [SAFE_FIELDS] 필드 배열 생성 실패:', fieldsError);

    console.log('🔄 [SAFE_FIELDS] Fallback 필드 사용:', {
      fallbackFields: coreRequiredFields,
      timestamp: new Date().toISOString(),
    });

    return coreRequiredFields;
  }
};

// 🆕 동적 진행률 계산 함수 (타입 안전성 강화)
const calculateDynamicProgressWidth = (
  formData: FormData | null | undefined,
  hardcodedCurrentStep: number
): number => {
  console.log('📊 [PROGRESS_CALC] 동적 진행률 계산 시작:', {
    hasFormData: !!formData,
    hardcodedCurrentStep,
    timestamp: new Date().toISOString(),
  });

  // 안전성 검사: formData 유효성 확인
  const safeFormData = formData || {};

  // 안전한 필수 필드 배열 생성
  const allRequiredFields: string[] = createSafeRequiredFieldsArray();

  // 필수 필드 배열 검증
  const hasRequiredFields =
    Array.isArray(allRequiredFields) && allRequiredFields.length > 0;
  if (!hasRequiredFields) {
    console.warn('⚠️ [PROGRESS_CALC] 필수 필드가 없음, 기본 진행률만 반환');
    const baseProgress = (hardcodedCurrentStep / 4) * 100; // 4단계 기준
    return Math.min(100, baseProgress);
  }

  // 완료된 필드 필터링 - 타입 안전성 보장
  const completedFieldsList: string[] = [];

  for (const fieldName of allRequiredFields) {
    const fieldValue = Reflect.get(safeFormData, fieldName);
    const isStringValue = typeof fieldValue === 'string';
    const hasContent = isStringValue && fieldValue.trim().length > 0;

    if (hasContent) {
      completedFieldsList.push(fieldName);
    }
  }

  // 타입이 확실한 배열들로 계산
  const completedCount = completedFieldsList.length;
  const totalRequiredCount = allRequiredFields.length;

  console.log('📊 [PROGRESS_CALC] 필드 완료 상태:', {
    completedCount,
    totalRequiredCount,
    completedFields: completedFieldsList,
    allRequiredFields,
    timestamp: new Date().toISOString(),
  });

  const baseProgress = (hardcodedCurrentStep / 4) * 100; // 4단계 기준

  // 안전한 나눗셈: 분모가 0이 아닌 경우에만 계산
  const fieldProgressRatio =
    totalRequiredCount > 0 ? completedCount / totalRequiredCount : 0;

  const fieldProgress = fieldProgressRatio * 20; // 최대 20% 추가
  const totalProgress = Math.min(100, baseProgress + fieldProgress);

  console.log('📊 [PROGRESS_CALC] 동적 진행률 계산 완료:', {
    hardcodedCurrentStep,
    baseProgress,
    fieldProgress,
    totalProgress,
    completedCount,
    totalRequiredCount,
    timestamp: new Date().toISOString(),
  });

  return totalProgress;
};

// 🆕 동적 기본 FormData 생성 함수
const createDynamicDefaultFormData = (): FormData => {
  console.log('🔧 [STORE] 동적 기본 FormData 생성 시작');

  try {
    const dynamicFormValues = getDefaultFormSchemaValues();

    console.log('✅ [STORE] 동적 기본 FormData 생성 완료:', {
      fieldCount: Object.keys(dynamicFormValues).length,
      fieldNames: Object.keys(dynamicFormValues),
      timestamp: new Date().toISOString(),
    });

    return dynamicFormValues;
  } catch (formDataError) {
    console.error('❌ [STORE] 동적 FormData 생성 실패:', formDataError);

    // Fallback
    return {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      mainImage: null,
      media: [],
      sliderImages: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }
};

// 🔧 텍스트 전용 FormData 생성
const createTextOnlyFormData = (
  safeFormData: FormData,
  stringFields: string[]
): FormData => {
  const textOnlyFormData: FormData = {};

  for (const fieldName of stringFields) {
    const isValidFieldName =
      typeof fieldName === 'string' && fieldName.length > 0;
    if (!isValidFieldName) {
      continue;
    }

    const fieldValue = Reflect.get(safeFormData, fieldName);
    const isStringValue = typeof fieldValue === 'string';
    if (isStringValue) {
      Reflect.set(textOnlyFormData, fieldName, fieldValue);
    }
  }

  return textOnlyFormData;
};

// 🔧 텍스트 전용 저장 데이터 생성
const createTextOnlyStorageData = (textOnlyFormData: FormData): StorageData => {
  // 에디터 관련 필드도 포함
  const editorCompletedContent = Reflect.get(
    textOnlyFormData,
    'editorCompletedContent'
  );
  const isEditorCompleted = Reflect.get(textOnlyFormData, 'isEditorCompleted');

  // 에디터 필드가 없으면 추가
  const hasEditorContent = typeof editorCompletedContent === 'string';
  if (!hasEditorContent) {
    Reflect.set(textOnlyFormData, 'editorCompletedContent', '');
  }

  const hasEditorCompleted = typeof isEditorCompleted === 'boolean';
  if (!hasEditorCompleted) {
    Reflect.set(textOnlyFormData, 'isEditorCompleted', false);
  }

  const textOnlyData: StorageData = {
    formData: textOnlyFormData,
    toasts: [],
  };

  return textOnlyData;
};

// 🆕 동적 Zustand 스토어 생성
export const useMultiStepFormStore = create<MultiStepFormStore>()(
  persist(
    (set, get) => ({
      // 초기 상태 (동적 기본값 보장)
      formData: createDynamicDefaultFormData(),
      toasts: [],

      // Bridge 호환성을 위한 계산된 속성들
      get formValues() {
        console.log('🔄 [BRIDGE_GETTER] 동적 formValues getter 호출 시작');

        try {
          const state = get();
          const { formData = null } = state || {};
          const bridgeFormValues = convertFormDataToBridgeFormValues(formData);

          console.log('🔄 [BRIDGE_GETTER] 동적 formValues getter 호출 완료:', {
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
        // Writing 단계로 하드코딩 (Bridge 요구사항)
        console.log(
          '🔄 [BRIDGE_GETTER] currentStep getter 호출: 3 (Writing Step - 4개 스텝 기준)'
        );
        return 3; // 4개 스텝 기준으로 조정
      },

      get editorCompletedContent() {
        console.log(
          '🔄 [BRIDGE_GETTER] editorCompletedContent getter 호출 시작'
        );

        try {
          const state = get();
          const { formData = null } = state || {};
          const content = formData
            ? Reflect.get(formData, 'editorCompletedContent')
            : '';

          console.log(
            '🔄 [BRIDGE_GETTER] editorCompletedContent getter 호출 완료:',
            {
              hasFormData: !!formData,
              contentLength: typeof content === 'string' ? content.length : 0,
              hasContent: !!content,
              preview:
                typeof content === 'string'
                  ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
                  : '',
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
          const { formData = null } = state || {};
          const completed = formData
            ? Reflect.get(formData, 'isEditorCompleted')
            : false;

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
        console.log('🔄 [BRIDGE_GETTER] 동적 progressWidth getter 호출 시작');

        try {
          const state = get();

          if (!state) {
            console.warn('⚠️ [BRIDGE_GETTER] state가 없음, 기본 진행률 반환');
            return 0;
          }

          const { formData = null } = state;
          const hardcodedCurrentStep = 3; // 4개 스텝 기준

          const progress = calculateDynamicProgressWidth(
            formData,
            hardcodedCurrentStep
          );

          console.log(
            '🔄 [BRIDGE_GETTER] 동적 progressWidth getter 호출 완료:',
            {
              hasFormData: !!formData,
              hardcodedCurrentStep,
              progress,
              timestamp: new Date().toISOString(),
            }
          );

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

        console.log('📊 [STORE_GET] 동적 폼 값 가져오기:', {
          formDataKeys: Object.keys(formData || {}),
          timestamp: new Date().toISOString(),
        });

        return formData || createDynamicDefaultFormData();
      },

      // Bridge 호환성을 위한 추가 메서드들
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
        const { formData = null } = state || {};
        const bridgeFormValues = convertFormDataToBridgeFormValues(formData);

        console.log('📊 [BRIDGE_STORE] 동적 Bridge 호환 FormValues 반환:', {
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
        console.log('📝 [STORE_UPDATE] 동적 폼 값 업데이트:', {
          fieldName,
          valueType: typeof value,
          valueLength: typeof value === 'string' ? value.length : 0,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formData: currentFormData = null } = state;
          const safeFormData =
            currentFormData || createDynamicDefaultFormData();

          const newFormData = {
            ...safeFormData,
            [fieldName]: value,
          };

          console.log('✅ [STORE_UPDATE] 동적 폼 값 업데이트 완료:', {
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
        console.log('📝 [STORE_UPDATE_MULTI] 동적 다중 폼 값 업데이트:', {
          fieldsToUpdate: Object.keys(values),
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formData: currentFormData = null } = state;
          const safeFormData =
            currentFormData || createDynamicDefaultFormData();

          const newFormData = {
            ...safeFormData,
            ...values,
          };

          console.log('✅ [STORE_UPDATE_MULTI] 동적 다중 폼 값 업데이트 완료');

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // Bridge 호환: 에디터 콘텐츠 업데이트
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
          const safeFormData =
            currentFormData || createDynamicDefaultFormData();

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

      // Bridge 호환: 에디터 완료 상태 설정
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
          const safeFormData =
            currentFormData || createDynamicDefaultFormData();

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

      // Bridge 호환: FormValues 전체 설정
      setFormValues: (values: BridgeCompatibleFormValues) => {
        console.log('📝 [BRIDGE_STORE] 동적 Bridge FormValues 전체 설정:', {
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

          console.log(
            '✅ [BRIDGE_STORE] 동적 Bridge FormValues 전체 설정 완료'
          );

          return {
            ...state,
            formData: convertedFormData,
          };
        });
      },

      // 폼 필드 초기화
      resetFormField: (fieldName: string) => {
        console.log('🔄 [STORE_RESET] 동적 폼 필드 초기화:', {
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

          console.log('✅ [STORE_RESET] 동적 폼 필드 초기화 완료:', {
            fieldName,
          });

          return {
            ...state,
            formData: newFormData,
          };
        });
      },

      // 전체 폼 데이터 초기화
      resetAllFormData: () => {
        console.log('🔄 [STORE_RESET_ALL] 동적 전체 폼 데이터 초기화');

        set((state) => ({
          ...state,
          formData: createDynamicDefaultFormData(),
        }));

        console.log('✅ [STORE_RESET_ALL] 동적 전체 폼 데이터 초기화 완료');
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
        console.log('💾 [PERSIST] 동적 localStorage 저장 시작');

        try {
          const safeData = createDynamicSafeStorageData(state);
          const isSafeToStore = isStorageSafe(safeData);

          if (isSafeToStore) {
            console.log('✅ [PERSIST] 안전한 데이터 localStorage 저장');
            return safeData;
          }

          console.warn('⚠️ [PERSIST] 데이터 크기 초과로 필수 텍스트만 저장');

          const { formData } = state;
          const safeFormData = formData || createDynamicDefaultFormData();

          // 동적 텍스트 데이터만 저장
          try {
            const stringFieldsRaw = getStringFields();
            const isValidStringFields = validateStringArray(stringFieldsRaw);

            if (!isValidStringFields) {
              console.warn(
                '⚠️ [PERSIST] getStringFields() 반환값이 유효하지 않음'
              );

              // 기본 텍스트 필드들 사용
              const defaultStringFields: string[] = [
                'nickname',
                'title',
                'description',
                'bio',
                'emailPrefix',
                'emailDomain',
              ];

              const textOnlyFormData = createTextOnlyFormData(
                safeFormData,
                defaultStringFields
              );
              return createTextOnlyStorageData(textOnlyFormData);
            }

            const stringFields: string[] = stringFieldsRaw;
            const textOnlyFormData = createTextOnlyFormData(
              safeFormData,
              stringFields
            );
            return createTextOnlyStorageData(textOnlyFormData);
          } catch (stringFieldsError) {
            console.error(
              '❌ [PERSIST] 텍스트 필드 처리 실패:',
              stringFieldsError
            );

            // 최소한의 텍스트 데이터만 저장
            const minimalTextData: FormData = {
              nickname:
                typeof safeFormData.nickname === 'string'
                  ? safeFormData.nickname
                  : '',
              title:
                typeof safeFormData.title === 'string'
                  ? safeFormData.title
                  : '',
              editorCompletedContent:
                typeof safeFormData.editorCompletedContent === 'string'
                  ? safeFormData.editorCompletedContent
                  : '',
              isEditorCompleted:
                typeof safeFormData.isEditorCompleted === 'boolean'
                  ? safeFormData.isEditorCompleted
                  : false,
            };

            return {
              formData: minimalTextData,
              toasts: [],
            };
          }
        } catch (persistError) {
          console.error('❌ [PERSIST] 저장 처리 오류:', persistError);
          return {
            formData: createDynamicDefaultFormData(),
            toasts: [],
          };
        }
      },
      onRehydrateStorage: () => {
        console.log('🔄 [PERSIST] 동적 localStorage에서 데이터 복원 시작');

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

            // 에러 시 기본 상태로 초기화
            try {
              const store = useMultiStepFormStore.getState();
              store.resetAllFormData();
            } catch (resetError) {
              console.error('❌ [PERSIST] 상태 리셋 실패:', resetError);
            }
          } else {
            console.log('✅ [PERSIST] 동적 localStorage 복원 완료:', {
              hasState: !!state,
              hasFormData: !!state?.formData,
              formDataKeys: state?.formData ? Object.keys(state.formData) : [],
              timestamp: new Date().toISOString(),
            });

            // 복원된 데이터 검증 및 보완
            const hasFormDataIssue = state && !state.formData;
            if (hasFormDataIssue && state) {
              console.warn('⚠️ [PERSIST] formData가 없어 기본값으로 초기화');
              // state.formData 직접 할당 대신 store의 resetAllFormData 호출
              try {
                const store = useMultiStepFormStore.getState();
                store.resetAllFormData();
              } catch (resetError) {
                console.error('❌ [PERSIST] 기본값 설정 실패:', resetError);
              }
            }
          }
        };
      },
    }
  )
);

console.log(
  '📄 [STORE] ✅ TypeScript never 타입 에러 완전 해결된 multiStepFormStore 모듈 로드 완료'
);
console.log('🎯 [STORE] 주요 수정사항:', {
  validateStringArray: '명시적 배열 타입 검증 함수 추가',
  strongerTypeGuards: '더 강력한 타입 가드로 never 타입 문제 해결',
  explicitLoopProcessing: 'filter 대신 for 루프로 명확한 타입 추론',
  safeArrayAccess: '배열 길이 접근 전 타입 검증 강화',
  errorRecoveryEnhanced: '모든 함수에 Fallback 메커니즘 적용',
  noFilterTypeIssues: 'filter 결과의 never 타입 문제 완전 제거',
  functionSignatureFixed: '함수 시그니처 일관성 완전 해결',
});
