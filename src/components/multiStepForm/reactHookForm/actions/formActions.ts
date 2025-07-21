// src/components/multiStepForm/reactHookForm/actions/formActions.ts

import type { FormSchemaValues } from '../../types/formTypes';
import { isValidFormSchemaKey } from '../utils/validationHelpers';

const DEFAULT_FORM_VALUES: FormSchemaValues = {
  userImage: '',
  nickname: '',
  emailPrefix: '',
  emailDomain: '',
  bio: '',
  title: '',
  description: '',
  tags: '',
  content: '',
  media: [],
  mainImage: null,
  sliderImages: [],
  editorCompletedContent: '',
  isEditorCompleted: false,
};

// 🔧 안전한 setValue 함수 타입
type SafeSetValueFunction = (
  name: keyof FormSchemaValues,
  value: string | string[] | boolean | null
) => void;

// 🔧 Draft 저장/로드 결과 인터페이스
interface DraftSaveResult {
  success: boolean;
  error?: string;
  savedFields: number;
  skippedFields: string[];
}

interface DraftLoadResult {
  success: boolean;
  data: Partial<FormSchemaValues> | null;
  error?: string;
  loadedFields: number;
}

// 🔧 안전한 JSON 파싱
const safeJsonParse = <T>(jsonString: string): T | null => {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('❌ JSON 파싱 실패:', parseError);
    return null;
  }
};

// 🔧 FormSchemaValues 타입 검증
const validateFormSchemaValues = (
  data: unknown
): data is Partial<FormSchemaValues> => {
  if (data === null || data === undefined || typeof data !== 'object') {
    return false;
  }

  const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  };

  if (!isRecord(data)) {
    return false;
  }

  const dataKeys = Object.keys(data);

  if (dataKeys.length === 0) {
    return true;
  }

  return dataKeys.every((key) => isValidFormSchemaKey(key));
};

// 🔧 localStorage 사용 가능성 체크
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__';
    const testValue = 'test';

    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    return retrieved === testValue;
  } catch (storageError) {
    console.warn('⚠️ localStorage 사용 불가:', storageError);
    return false;
  }
};

// 🔧 큰 필드 제외하고 Draft 생성
const createSafeDraft = (data: FormSchemaValues): Partial<FormSchemaValues> => {
  const {
    userImage = '',
    mainImage = null,
    media = [],
    sliderImages = [],
    ...textOnlyData
  } = data;

  // 이미지 데이터 크기 체크 (50KB 제한)
  const smallUserImage =
    typeof userImage === 'string' && userImage.length <= 50000 ? userImage : '';
  const smallMainImage =
    typeof mainImage === 'string' && mainImage.length <= 50000
      ? mainImage
      : null;

  const smallMedia = Array.isArray(media)
    ? media.filter((item): item is string => {
        return typeof item === 'string' && item.length <= 50000;
      })
    : [];

  const smallSliderImages = Array.isArray(sliderImages)
    ? sliderImages.filter((item): item is string => {
        return typeof item === 'string' && item.length <= 50000;
      })
    : [];

  return {
    ...textOnlyData,
    userImage: smallUserImage,
    mainImage: smallMainImage,
    media: smallMedia,
    sliderImages: smallSliderImages,
  };
};

// 폼 초기화
export const resetForm = (setValue: SafeSetValueFunction): void => {
  console.log('🔄 폼 초기화 시작');

  const defaultEntries = Object.entries(DEFAULT_FORM_VALUES);
  let processedFields = 0;

  defaultEntries.forEach(([fieldKey, fieldValue]) => {
    if (isValidFormSchemaKey(fieldKey)) {
      setValue(fieldKey, fieldValue);
      processedFields += 1;
    } else {
      console.warn('⚠️ 유효하지 않은 필드 키:', fieldKey);
    }
  });

  console.log('✅ 폼 초기화 완료:', {
    totalFields: defaultEntries.length,
    processedFields,
  });
};

// 폼 제출
export const submitForm = (
  data: FormSchemaValues
): Promise<FormSchemaValues> => {
  console.log('📤 폼 제출 시작');

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ 폼 제출 완료');
      resolve(data);
    }, 1000);
  });
};

// 🔧 폼 임시저장
export const saveFormDraft = (data: FormSchemaValues): DraftSaveResult => {
  console.log('💾 폼 임시저장 시작');

  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: 'localStorage 사용 불가',
      savedFields: 0,
      skippedFields: Object.keys(data),
    };
  }

  const safeDraft = createSafeDraft(data);

  try {
    const draftKey = 'formDraft';
    const serialized = JSON.stringify(safeDraft);

    // 크기 제한 체크 (500KB)
    if (serialized.length > 500 * 1024) {
      // 텍스트 데이터만 저장
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
      } = data;

      const textOnlyDraft = {
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
      };

      localStorage.setItem(draftKey, JSON.stringify(textOnlyDraft));

      return {
        success: true,
        savedFields: Object.keys(textOnlyDraft).length,
        skippedFields: ['userImage', 'mainImage', 'media', 'sliderImages'],
      };
    }

    localStorage.setItem(draftKey, serialized);

    return {
      success: true,
      savedFields: Object.keys(safeDraft).length,
      skippedFields: [],
    };
  } catch (saveError) {
    console.error('❌ 폼 임시저장 실패:', saveError);
    return {
      success: false,
      error: 'localStorage 저장 실패',
      savedFields: 0,
      skippedFields: Object.keys(data),
    };
  }
};

// 🔧 폼 임시저장 불러오기
export const loadFormDraft = (): DraftLoadResult => {
  console.log('📂 폼 임시저장 불러오기 시작');

  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      data: null,
      error: 'localStorage 사용 불가',
      loadedFields: 0,
    };
  }

  try {
    const draftKey = 'formDraft';
    const draftJson = localStorage.getItem(draftKey);

    if (draftJson === null) {
      return {
        success: false,
        data: null,
        error: '저장된 임시저장 데이터 없음',
        loadedFields: 0,
      };
    }

    const parsedData = safeJsonParse<Partial<FormSchemaValues>>(draftJson);
    if (parsedData === null) {
      return {
        success: false,
        data: null,
        error: 'JSON 파싱 실패',
        loadedFields: 0,
      };
    }

    if (!validateFormSchemaValues(parsedData)) {
      return {
        success: false,
        data: null,
        error: '유효하지 않은 데이터 형식',
        loadedFields: 0,
      };
    }

    return {
      success: true,
      data: parsedData,
      loadedFields: Object.keys(parsedData).length,
    };
  } catch (loadError) {
    console.error('❌ 폼 임시저장 불러오기 실패:', loadError);
    return {
      success: false,
      data: null,
      error: 'localStorage 읽기 실패',
      loadedFields: 0,
    };
  }
};

// 🔧 Draft 삭제
export const clearFormDraft = (): boolean => {
  console.log('🗑️ 폼 임시저장 삭제 시작');

  if (!isLocalStorageAvailable()) {
    console.warn('⚠️ localStorage 사용 불가로 삭제 실패');
    return false;
  }

  try {
    const draftKey = 'formDraft';
    localStorage.removeItem(draftKey);
    console.log('✅ 폼 임시저장 삭제 완료');
    return true;
  } catch (deleteError) {
    console.error('❌ 폼 임시저장 삭제 실패:', deleteError);
    return false;
  }
};
