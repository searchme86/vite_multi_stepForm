// src/components/multiStepForm/reactHookForm/utils/validationHelpers.ts

import type { FormSchemaValues, FormValues } from '../../types/formTypes';
import {
  getAllFieldNames,
  getFieldType,
  getDefaultFormSchemaValues,
  getStringFields,
  getArrayFields,
  getBooleanFields,
} from '../../utils/formFieldsLoader.ts';

type PossibleFormValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

const FIELD_TYPES = {
  STRING: 'string',
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  NULLABLE_STRING: 'nullable_string',
} as const;

type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

interface FieldConfigItem {
  readonly type: FieldType;
  readonly default: string | boolean | string[] | null;
  readonly mapping: string;
  readonly processor: (
    value: PossibleFormValue
  ) => string | boolean | string[] | null;
}

// 🚀 동적 프로세서 생성기
const createDynamicProcessor = (fieldName: string, fieldType: string) => {
  return (value: PossibleFormValue): string | boolean | string[] | null => {
    console.log(`🔧 validationHelpers: ${fieldName} 처리 시작`, {
      value,
      fieldType,
    });

    if (fieldType === 'array') {
      return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
    }

    if (fieldType === 'boolean') {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        return (
          lowerValue === 'true' ||
          lowerValue === '1' ||
          lowerValue === 'yes' ||
          lowerValue === 'on'
        );
      }
      if (typeof value === 'number') {
        return value !== 0;
      }
      return false;
    }

    if (fieldType === 'string|null') {
      return typeof value === 'string' && value.trim() !== '' ? value : null;
    }

    // string 타입 처리
    const stringValue =
      typeof value === 'string' && value.trim() !== '' ? value : '';
    console.log(`✅ validationHelpers: ${fieldName} 처리 완료`, stringValue);
    return stringValue;
  };
};

// 🚀 동적 필드 설정 생성
const createDynamicFieldConfig = (fieldName: string): FieldConfigItem => {
  const fieldType = getFieldType(fieldName);
  const defaultFormValues = getDefaultFormSchemaValues();
  const defaultValue = Reflect.get(defaultFormValues, fieldName);

  console.log(`🏗️ validationHelpers: ${fieldName} 설정 생성`, {
    fieldType,
    defaultValue,
  });

  const fieldTypeMapping = new Map<string, FieldType>([
    ['array', FIELD_TYPES.ARRAY],
    ['boolean', FIELD_TYPES.BOOLEAN],
    ['string|null', FIELD_TYPES.NULLABLE_STRING],
    ['string', FIELD_TYPES.STRING],
  ]);

  const mappedFieldType = fieldTypeMapping.get(fieldType) ?? FIELD_TYPES.STRING;

  return {
    type: mappedFieldType,
    default: defaultValue,
    mapping: fieldName.toLowerCase(),
    processor: createDynamicProcessor(fieldName, fieldType),
  };
};

// 🚀 동적 필드 설정 캐시 생성
const createDynamicFieldConfigs = (): ReadonlyMap<string, FieldConfigItem> => {
  console.log('🗂️ validationHelpers: 동적 필드 설정 생성 시작');

  const allFieldNames = getAllFieldNames();
  const configsMap = new Map<string, FieldConfigItem>();

  allFieldNames.forEach((fieldName) => {
    const fieldConfig = createDynamicFieldConfig(fieldName);
    configsMap.set(fieldName, fieldConfig);
  });

  console.log(
    `✅ validationHelpers: 동적 필드 설정 완료 (${configsMap.size}개 필드)`
  );
  return configsMap;
};

// 🚀 동적 매핑 테이블 생성
const createDynamicFieldMappings = (
  fieldConfigs: ReadonlyMap<string, FieldConfigItem>
): ReadonlyMap<string, string> => {
  console.log('🗺️ validationHelpers: 동적 매핑 테이블 생성');

  const mappingTable = new Map<string, string>();

  // 기본 매핑 생성
  for (const [fieldKey, config] of fieldConfigs) {
    const { mapping } = config;
    mappingTable.set(mapping, fieldKey);
    mappingTable.set(fieldKey.toLowerCase(), fieldKey);
  }

  // 에디터 관련 특수 매핑
  const editorFieldsSet = new Set([
    'isEditorCompleted',
    'editorCompletedContent',
  ]);
  const allFieldNames = getAllFieldNames();

  const editorFields = allFieldNames.filter((fieldName) =>
    editorFieldsSet.has(fieldName)
  );

  editorFields.forEach((fieldName) => {
    if (fieldName === 'isEditorCompleted') {
      mappingTable.set('editorcompleted', fieldName);
      mappingTable.set('editor', fieldName);
    }
  });

  console.log(
    `✅ validationHelpers: 매핑 테이블 완료 (${mappingTable.size}개 매핑)`
  );
  return mappingTable;
};

// 🚀 동적 유효 키 집합 생성
const createDynamicValidFieldKeys = (): ReadonlySet<string> => {
  const allFields = getAllFieldNames();
  return new Set(allFields);
};

// 🚀 전역 동적 설정 초기화
const DYNAMIC_FIELD_CONFIGS = createDynamicFieldConfigs();
const DYNAMIC_FIELD_MAPPINGS = createDynamicFieldMappings(
  DYNAMIC_FIELD_CONFIGS
);
const DYNAMIC_VALID_KEYS = createDynamicValidFieldKeys();

// 🚀 정규화 함수 - 메모이제이션으로 최적화
const normalizeFieldNameCachingMap = new Map<string, string>();

const normalizeFieldNameOptimized = (fieldName: string): string => {
  const cachedResult = normalizeFieldNameCachingMap.get(fieldName);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  const normalizedResult = fieldName.toLowerCase().replace(/[_-]/g, '');
  normalizeFieldNameCachingMap.set(fieldName, normalizedResult);

  console.log(
    '🔧 validationHelpers: 필드명 정규화',
    fieldName,
    '→',
    normalizedResult
  );
  return normalizedResult;
};

// 🚀 타입 가드 - 동적 키 검증 (string 타입으로 수정)
const isFormFieldKeyGuard = (key: string): key is string => {
  const isValid = DYNAMIC_VALID_KEYS.has(key);
  console.log('🔍 validationHelpers: 필드 키 검증', key, isValid);
  return isValid;
};

// 🚀 필드 값 처리 - 동적 설정 기반
const processFieldValueOptimized = (
  fieldKey: string,
  inputValue: PossibleFormValue
): string | boolean | string[] | null => {
  const fieldConfig = DYNAMIC_FIELD_CONFIGS.get(fieldKey);

  if (!fieldConfig) {
    console.log('⚠️ validationHelpers: 알 수 없는 필드', fieldKey);
    return inputValue !== null && inputValue !== undefined
      ? String(inputValue)
      : '';
  }

  const { processor } = fieldConfig;
  return processor(inputValue);
};

// 🚀 타입 검증 - Map 기반 구체적인 타입 체크
const createTypeValidationMap = (): Map<
  FieldType,
  (value: string | boolean | string[] | null) => boolean
> => {
  const validationMap = new Map<
    FieldType,
    (value: string | boolean | string[] | null) => boolean
  >();

  validationMap.set(
    FIELD_TYPES.STRING,
    (value): value is string => typeof value === 'string'
  );
  validationMap.set(FIELD_TYPES.ARRAY, (value): value is string[] =>
    Array.isArray(value)
  );
  validationMap.set(
    FIELD_TYPES.BOOLEAN,
    (value): value is boolean => typeof value === 'boolean'
  );
  validationMap.set(
    FIELD_TYPES.NULLABLE_STRING,
    (value): value is string | null =>
      typeof value === 'string' || value === null
  );

  return validationMap;
};

const TYPE_VALIDATION_MAP = createTypeValidationMap();

const validateProcessedValueType = (
  processedValue: string | boolean | string[] | null,
  expectedFieldType: FieldType
): boolean => {
  const validationFunction = TYPE_VALIDATION_MAP.get(expectedFieldType);

  if (!validationFunction) {
    console.log('❌ validationHelpers: 알 수 없는 타입', expectedFieldType);
    return false;
  }

  const isValidTypeResult = validationFunction(processedValue);
  console.log(
    '🔎 validationHelpers: 타입 검증',
    expectedFieldType,
    isValidTypeResult
  );

  return isValidTypeResult;
};

// 🚀 FormSchemaValues를 FormValues로 변환 - 완전 동적화
const createOptimizedFormValuesFromSchema = (
  schemaValues: FormSchemaValues
): FormValues => {
  console.log('🏗️ validationHelpers: FormValues 생성 시작');

  // 기본값으로 초기화 - 동적 생성
  const resultFormValues = Object.create(null);

  for (const [fieldKey, config] of DYNAMIC_FIELD_CONFIGS) {
    resultFormValues[fieldKey] = config.default;
  }

  // 스키마 값으로 업데이트 - Reflect 사용
  const schemaKeysArray = Object.keys(schemaValues);

  for (const schemaKey of schemaKeysArray) {
    if (!isFormFieldKeyGuard(schemaKey)) {
      continue;
    }

    const schemaValue = Reflect.get(schemaValues, schemaKey);
    const processedValue = processFieldValueOptimized(schemaKey, schemaValue);

    // 타입 안전성 검증 후 할당
    const fieldConfig = DYNAMIC_FIELD_CONFIGS.get(schemaKey);

    if (!fieldConfig) {
      continue;
    }

    const isValidType = validateProcessedValueType(
      processedValue,
      fieldConfig.type
    );

    if (isValidType) {
      Reflect.set(resultFormValues, schemaKey, processedValue);
    }
  }

  console.log('✅ validationHelpers: FormValues 생성 완료');
  return Object.freeze(resultFormValues);
};

// 🚀 배열 필터링 - 동적 키 기반
const filterValidFormFieldsOptimized = (
  fieldsList: readonly string[]
): string[] => {
  console.log('🧹 validationHelpers: 유효한 필드 필터링 시작');

  const validFieldsList = fieldsList.filter(isFormFieldKeyGuard);

  console.log(
    '✅ validationHelpers: 필터링 완료',
    validFieldsList.length,
    '개 필드'
  );
  return validFieldsList;
};

// 🚀 정의된 문자열 필터링
const filterDefinedStringsOptimized = (
  stringsList: readonly (string | undefined)[]
): string[] => {
  console.log('🧽 validationHelpers: 정의된 문자열 필터링');

  const validStringsList = stringsList.filter((str): str is string => {
    return typeof str === 'string' && str.trim() !== '';
  });

  console.log(
    '✅ validationHelpers: 문자열 필터링 완료',
    validStringsList.length
  );
  return validStringsList;
};

// 🚀 외부 인터페이스 - 스키마 키 검증 (string 반환으로 수정)
export const isValidFormSchemaKey = (key: string): key is string => {
  return isFormFieldKeyGuard(key);
};

// 🚀 FormValue 키 검증 (string 반환으로 수정)
export const isValidFormValueKey = (key: string): key is string => {
  return isFormFieldKeyGuard(key);
};

// 🚀 필드 필터링 (외부 인터페이스)
export const filterValidFormFields = filterValidFormFieldsOptimized;

// 🚀 문자열 필터링 (외부 인터페이스)
export const filterDefinedStrings = filterDefinedStringsOptimized;

// 🚀 필드명 정규화 (외부 인터페이스)
export const normalizeFieldName = normalizeFieldNameOptimized;

// 🚀 스키마 변환 (외부 인터페이스)
export const createFormValuesFromSchema = createOptimizedFormValuesFromSchema;

// 🚀 동적 필드 매핑 조회
export const FIELD_MAPPINGS = Object.fromEntries(DYNAMIC_FIELD_MAPPINGS);

// 🚀 디버깅용 정보 조회 - 동적 설정 기반
export const getFieldInfo = (fieldKey: string): FieldConfigItem | undefined => {
  return DYNAMIC_FIELD_CONFIGS.get(fieldKey);
};

export const getAllFieldsInfo = (): Record<string, FieldConfigItem> => {
  return Object.fromEntries(DYNAMIC_FIELD_CONFIGS);
};

// 🚀 동적 필드 그룹 조회 API
export const getDynamicStringFields = (): string[] => {
  return getStringFields();
};

export const getDynamicArrayFields = (): string[] => {
  return getArrayFields();
};

export const getDynamicBooleanFields = (): string[] => {
  return getBooleanFields();
};

export const getDynamicAllFields = (): string[] => {
  return getAllFieldNames();
};
