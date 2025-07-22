// src/components/multiStepForm/reactHookForm/actions/formActions.ts

import type { FormSchemaValues } from '../../types/formTypes';

import {
  getDefaultFormSchemaValues,
  getAllFieldNames,
} from '../../utils/formFieldsLoader';

// 🔧 안전한 setValue 함수 타입 - keyof 활용으로 타입 안전성 보장
interface SafeSetValueFunction {
  <K extends keyof FormSchemaValues>(name: K, value: FormSchemaValues[K]): void;
}

// 🔧 Draft 저장/로드 결과 인터페이스
interface DraftSaveResult {
  readonly success: boolean;
  readonly error?: string;
  readonly savedFields: number;
  readonly skippedFields: string[];
}

interface DraftLoadResult {
  readonly success: boolean;
  readonly data: Partial<FormSchemaValues> | null;
  readonly error?: string;
  readonly loadedFields: number;
}

// 🔧 타입 안전한 키 검증 함수 - string 키만 처리
const isValidFormFieldKey = (
  key: string,
  obj: FormSchemaValues
): key is keyof FormSchemaValues => {
  const validKeys = Object.keys(obj);
  const isValid = validKeys.includes(key);
  console.log(`🔍 [FormActions] 키 검증: ${key} = ${isValid}`);
  return isValid;
};

// 🆕 동적 FormValues 생성 함수
const getDefaultFormValues = (): FormSchemaValues => {
  console.log('🔧 [FormActions] 동적 FormValues 생성 시작');

  const dynamicFormValues = getDefaultFormSchemaValues();

  console.log('✅ [FormActions] 동적 FormValues 생성 완료:', {
    fieldCount: Object.keys(dynamicFormValues).length,
    fieldNames: Object.keys(dynamicFormValues),
    timestamp: new Date().toISOString(),
  });

  return dynamicFormValues;
};

// 🔧 안전한 JSON 파싱
const safeJsonParse = <T>(jsonString: string): T | null => {
  const isValidString =
    typeof jsonString === 'string' && jsonString.trim() !== '';
  if (!isValidString) {
    console.warn('⚠️ [FormActions] JSON 문자열이 유효하지 않음');
    return null;
  }

  try {
    const parsedData = JSON.parse(jsonString);
    console.log('✅ [FormActions] JSON 파싱 성공');
    return parsedData;
  } catch (parseError) {
    console.error('❌ [FormActions] JSON 파싱 실패:', parseError);
    return null;
  }
};

// 🔧 FormSchemaValues 타입 검증 - Map 기반으로 개선
const validateFormSchemaValues = (
  data: unknown
): data is Partial<FormSchemaValues> => {
  console.log('🔍 [FormActions] FormSchemaValues 검증 시작');

  const isValidObject =
    data !== null && data !== undefined && typeof data === 'object';
  if (!isValidObject) {
    console.log('❌ [FormActions] 데이터가 객체가 아님');
    return false;
  }

  const dataRecord = data;
  const dataKeys = Object.keys(dataRecord);
  const hasNoKeys = dataKeys.length === 0;

  if (hasNoKeys) {
    console.log('✅ [FormActions] 빈 객체는 유효함');
    return true;
  }

  // Set을 활용한 키 유효성 검증
  const validKeysSet = new Set(getAllFieldNames());
  const allKeysValid = dataKeys.every((key) => {
    const isValidKey = validKeysSet.has(key);
    if (!isValidKey) {
      console.log(`❌ [FormActions] 유효하지 않은 키: ${key}`);
    }
    return isValidKey;
  });

  console.log(
    `${allKeysValid ? '✅' : '❌'} [FormActions] FormSchemaValues 검증 완료`
  );
  return allKeysValid;
};

// 🔧 localStorage 사용 가능성 체크
const isLocalStorageAvailable = (): boolean => {
  console.log('🔍 [FormActions] localStorage 사용 가능성 검사');

  try {
    const testKey = '__localStorage_test__';
    const testValue = 'test';

    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    const isAvailable = retrieved === testValue;
    console.log(
      `${
        isAvailable ? '✅' : '❌'
      } [FormActions] localStorage 사용 가능: ${isAvailable}`
    );
    return isAvailable;
  } catch (storageError) {
    console.warn('⚠️ [FormActions] localStorage 사용 불가:', storageError);
    return false;
  }
};

// 🆕 동적 안전한 Draft 생성 함수 - Map 기반 필드 처리
const createSafeDraft = (data: FormSchemaValues): Partial<FormSchemaValues> => {
  console.log('🔧 [FormActions] 동적 안전한 Draft 생성 시작');

  const allFieldNames = getAllFieldNames();
  const safeDraft: Partial<FormSchemaValues> = {};
  const fieldProcessingMap = new Map<string, unknown>();

  let processedFields = 0;

  // 먼저 모든 필드 데이터를 Map에 수집
  for (const fieldName of allFieldNames) {
    const fieldValue = Reflect.get(data, fieldName);
    fieldProcessingMap.set(fieldName, fieldValue);
  }

  // Map을 이용해 안전하게 처리
  for (const [fieldName, fieldValue] of fieldProcessingMap) {
    if (fieldValue === null || fieldValue === undefined) {
      console.log(
        `⚠️ [FormActions] 필드 ${fieldName}이 null/undefined, 건너뛰기`
      );
      continue;
    }

    // 이미지 데이터 크기 체크 (50KB 제한)
    const isStringValue = typeof fieldValue === 'string';
    if (isStringValue) {
      const isImageField =
        fieldName.includes('Image') || fieldName === 'mainImage';
      if (isImageField) {
        const isSmallImage = fieldValue.length <= 50000;
        const processedImageValue = isSmallImage ? fieldValue : '';
        Reflect.set(safeDraft, fieldName, processedImageValue);
      } else {
        Reflect.set(safeDraft, fieldName, fieldValue);
      }
    } else {
      const isArrayValue = Array.isArray(fieldValue);
      if (isArrayValue) {
        const filteredArray = fieldValue.filter((item): item is string => {
          const isStringItem = typeof item === 'string';
          const isSmallItem = isStringItem && item.length <= 50000;
          return isSmallItem;
        });
        Reflect.set(safeDraft, fieldName, filteredArray);
      } else {
        Reflect.set(safeDraft, fieldName, fieldValue);
      }
    }

    processedFields += 1;
  }

  console.log('✅ [FormActions] 동적 안전한 Draft 생성 완료:', {
    totalFields: allFieldNames.length,
    processedFields,
    timestamp: new Date().toISOString(),
  });

  return safeDraft;
};

// 폼 초기화 - Map 기반으로 개선
export const resetForm = (setValue: SafeSetValueFunction): void => {
  console.log('🔄 [FormActions] 동적 폼 초기화 시작');

  const defaultFormValues = getDefaultFormValues();
  const fieldsMap = new Map(Object.entries(defaultFormValues));
  let processedFields = 0;

  for (const [fieldKey, fieldValue] of fieldsMap) {
    // 타입 안전한 키 검증
    if (isValidFormFieldKey(fieldKey, defaultFormValues)) {
      setValue(fieldKey, fieldValue);
      processedFields += 1;
      console.log('✅ [FormActions] 필드 설정 완료:', fieldKey);
    } else {
      console.warn('⚠️ [FormActions] 유효하지 않은 필드 키:', fieldKey);
    }
  }

  console.log('✅ [FormActions] 동적 폼 초기화 완료:', {
    totalFields: fieldsMap.size,
    processedFields,
    timestamp: new Date().toISOString(),
  });
};

// 폼 제출
export const submitForm = (
  data: FormSchemaValues
): Promise<FormSchemaValues> => {
  console.log('📤 [FormActions] 폼 제출 시작');

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ [FormActions] 폼 제출 완료');
      resolve(data);
    }, 1000);
  });
};

// 🆕 동적 폼 임시저장 - Map 기반 필드 처리
export const saveFormDraft = (data: FormSchemaValues): DraftSaveResult => {
  console.log('💾 [FormActions] 동적 폼 임시저장 시작');

  const isStorageAvailable = isLocalStorageAvailable();
  if (!isStorageAvailable) {
    const allFieldNames = getAllFieldNames();
    return {
      success: false,
      error: 'localStorage 사용 불가',
      savedFields: 0,
      skippedFields: allFieldNames,
    };
  }

  const safeDraft = createSafeDraft(data);

  try {
    const draftKey = 'formDraft';
    const serialized = JSON.stringify(safeDraft);

    // 크기 제한 체크 (500KB)
    const isSizeExceeded = serialized.length > 500 * 1024;
    if (isSizeExceeded) {
      console.warn('⚠️ [FormActions] 데이터 크기 초과, 텍스트만 저장');

      const allFieldNames = getAllFieldNames();
      const textOnlyDraftMap = new Map<string, unknown>();
      const skippedFields: string[] = [];

      // Map을 활용한 필드 분류
      for (const fieldName of allFieldNames) {
        const fieldValue = Reflect.get(data, fieldName);
        const isStringValue = typeof fieldValue === 'string';
        const isBooleanValue = typeof fieldValue === 'boolean';

        if (isStringValue || isBooleanValue) {
          const isImageField =
            fieldName.includes('Image') || fieldName === 'mainImage';
          if (!isImageField) {
            textOnlyDraftMap.set(fieldName, fieldValue);
          } else {
            skippedFields.push(fieldName);
          }
        } else {
          const isArrayValue = Array.isArray(fieldValue);
          if (isArrayValue) {
            skippedFields.push(fieldName);
          }
        }
      }

      const textOnlyDraft = Object.fromEntries(textOnlyDraftMap);
      localStorage.setItem(draftKey, JSON.stringify(textOnlyDraft));

      return {
        success: true,
        savedFields: textOnlyDraftMap.size,
        skippedFields,
      };
    }

    localStorage.setItem(draftKey, serialized);

    return {
      success: true,
      savedFields: Object.keys(safeDraft).length,
      skippedFields: [],
    };
  } catch (saveError) {
    console.error('❌ [FormActions] 폼 임시저장 실패:', saveError);
    const allFieldNames = getAllFieldNames();
    return {
      success: false,
      error: 'localStorage 저장 실패',
      savedFields: 0,
      skippedFields: allFieldNames,
    };
  }
};

// 🔧 폼 임시저장 불러오기
export const loadFormDraft = (): DraftLoadResult => {
  console.log('📂 [FormActions] 폼 임시저장 불러오기 시작');

  const isStorageAvailable = isLocalStorageAvailable();
  if (!isStorageAvailable) {
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

    const hasDraftData = draftJson !== null;
    if (!hasDraftData) {
      return {
        success: false,
        data: null,
        error: '저장된 임시저장 데이터 없음',
        loadedFields: 0,
      };
    }

    const parsedData = safeJsonParse<Partial<FormSchemaValues>>(draftJson);
    const isParsingSuccessful = parsedData !== null;
    if (!isParsingSuccessful) {
      return {
        success: false,
        data: null,
        error: 'JSON 파싱 실패',
        loadedFields: 0,
      };
    }

    const isValidData = validateFormSchemaValues(parsedData);
    if (!isValidData) {
      return {
        success: false,
        data: null,
        error: '유효하지 않은 데이터 형식',
        loadedFields: 0,
      };
    }

    console.log('✅ [FormActions] 폼 임시저장 불러오기 완료:', {
      loadedFields: Object.keys(parsedData).length,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: parsedData,
      loadedFields: Object.keys(parsedData).length,
    };
  } catch (loadError) {
    console.error('❌ [FormActions] 폼 임시저장 불러오기 실패:', loadError);
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
  console.log('🗑️ [FormActions] 폼 임시저장 삭제 시작');

  const isStorageAvailable = isLocalStorageAvailable();
  if (!isStorageAvailable) {
    console.warn('⚠️ [FormActions] localStorage 사용 불가로 삭제 실패');
    return false;
  }

  try {
    const draftKey = 'formDraft';
    localStorage.removeItem(draftKey);
    console.log('✅ [FormActions] 폼 임시저장 삭제 완료');
    return true;
  } catch (deleteError) {
    console.error('❌ [FormActions] 폼 임시저장 삭제 실패:', deleteError);
    return false;
  }
};

console.log('📄 [FormActions] ✅ 에러 수정 완료된 formActions 모듈 로드 완료');
console.log('🎯 [FormActions] 주요 수정사항:', {
  typeAssertions: '타입 단언(as) 완전 제거',
  anyTypes: 'any 타입 완전 제거',
  mapBasedAccess: 'Map/Set 활용한 안전한 객체 접근',
  reflectUsage: 'Reflect.get/set으로 동적 속성 접근',
  concreteTypes: '구체적 타입 변환 및 타입 가드 활용',
});
