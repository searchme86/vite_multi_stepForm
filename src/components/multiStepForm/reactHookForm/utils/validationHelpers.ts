// src/components/multiStepForm/reactHookForm/utils/validationHelpers.ts

import type { FormSchemaValues, FormValues } from '../../types/formTypes';

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

// 🚀 성능 최적화: 사전 계산된 정적 매핑 테이블
const STATIC_FIELD_CONFIGS: ReadonlyMap<string, FieldConfigItem> = new Map([
  [
    'userImage',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'userimage',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('🖼️ validationHelpers: userImage 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'nickname',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'nickname',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('👤 validationHelpers: nickname 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'emailPrefix',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'emailprefix',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('📧 validationHelpers: emailPrefix 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'emailDomain',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'emaildomain',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('🌐 validationHelpers: emailDomain 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'bio',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'bio',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('📝 validationHelpers: bio 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'title',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'title',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('📰 validationHelpers: title 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'description',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'description',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('📄 validationHelpers: description 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'tags',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'tags',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('🏷️ validationHelpers: tags 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'content',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'content',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log('📚 validationHelpers: content 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'editorCompletedContent',
    {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping: 'editorcompletedcontent',
      processor: (value: PossibleFormValue): string => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : '';
        console.log(
          '✏️ validationHelpers: editorCompletedContent 처리됨',
          processedValue
        );
        return processedValue;
      },
    },
  ],
  [
    'media',
    {
      type: FIELD_TYPES.ARRAY,
      default: [],
      mapping: 'media',
      processor: (value: PossibleFormValue): string[] => {
        const processedValue = Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string')
          : [];
        console.log('🎥 validationHelpers: media 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
  [
    'sliderImages',
    {
      type: FIELD_TYPES.ARRAY,
      default: [],
      mapping: 'sliderimages',
      processor: (value: PossibleFormValue): string[] => {
        const processedValue = Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string')
          : [];
        console.log(
          '🖼️ validationHelpers: sliderImages 처리됨',
          processedValue
        );
        return processedValue;
      },
    },
  ],
  [
    'isEditorCompleted',
    {
      type: FIELD_TYPES.BOOLEAN,
      default: false,
      mapping: 'iseditorcompleted',
      processor: (value: PossibleFormValue): boolean => {
        let processedValue = false;

        if (typeof value === 'boolean') {
          processedValue = value;
        } else if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          processedValue = lowerValue === 'true' || lowerValue === '1';
        } else if (typeof value === 'number') {
          processedValue = value !== 0;
        }

        console.log(
          '✅ validationHelpers: isEditorCompleted 처리됨',
          processedValue
        );
        return processedValue;
      },
    },
  ],
  [
    'mainImage',
    {
      type: FIELD_TYPES.NULLABLE_STRING,
      default: null,
      mapping: 'mainimage',
      processor: (value: PossibleFormValue): string | null => {
        const processedValue =
          typeof value === 'string' && value.trim() !== '' ? value : null;
        console.log('🎨 validationHelpers: mainImage 처리됨', processedValue);
        return processedValue;
      },
    },
  ],
]);

// 🚀 O(1) 조회를 위한 사전 계산된 매핑 테이블
const OPTIMIZED_FIELD_MAPPINGS: ReadonlyMap<string, string> = (() => {
  const mappingTable = new Map<string, string>();

  // 기본 매핑 생성
  for (const [fieldKey, config] of STATIC_FIELD_CONFIGS) {
    const { mapping } = config;
    mappingTable.set(mapping, fieldKey);
    mappingTable.set(fieldKey.toLowerCase(), fieldKey);
  }

  // 추가 특수 매핑
  const additionalMappingsList = [
    { from: 'editorcompleted', to: 'isEditorCompleted' },
    { from: 'editor', to: 'isEditorCompleted' },
  ];

  for (const { from, to } of additionalMappingsList) {
    mappingTable.set(from, to);
  }

  console.log(
    '🗺️ validationHelpers: 매핑 테이블 초기화 완료',
    mappingTable.size
  );
  return mappingTable;
})();

// 🚀 사전 계산된 유효한 키 목록 (O(1) 조회)
const VALID_FORM_FIELD_KEYS_SET: ReadonlySet<string> = new Set(
  STATIC_FIELD_CONFIGS.keys()
);

// 🚀 타입 가드 - O(1) 성능
const isFormFieldKeyGuard = (key: string): key is keyof FormValues => {
  const isValid = VALID_FORM_FIELD_KEYS_SET.has(key);
  console.log('🔍 validationHelpers: 필드 키 검증', key, isValid);
  return isValid;
};

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

// 🚀 필드 값 처리 - O(1) 조회
const processFieldValueOptimized = (
  fieldKey: string,
  inputValue: PossibleFormValue
): string | boolean | string[] | null => {
  const fieldConfig = STATIC_FIELD_CONFIGS.get(fieldKey);

  if (!fieldConfig) {
    console.log('⚠️ validationHelpers: 알 수 없는 필드', fieldKey);
    return inputValue !== null && inputValue !== undefined
      ? String(inputValue)
      : '';
  }

  const { processor } = fieldConfig;
  return processor(inputValue);
};

// 🚀 스키마 값을 FormValues로 변환 - 최적화된 버전
const createOptimizedFormValuesFromSchema = (
  schemaValues: FormSchemaValues
): FormValues => {
  console.log('🏗️ validationHelpers: FormValues 생성 시작');

  // 기본값으로 초기화
  const resultFormValues = Object.create(null);

  for (const [fieldKey, config] of STATIC_FIELD_CONFIGS) {
    resultFormValues[fieldKey] = config.default;
  }

  // 스키마 값으로 업데이트
  const schemaKeysArray = Object.keys(schemaValues);

  for (const schemaKey of schemaKeysArray) {
    if (!isFormFieldKeyGuard(schemaKey)) {
      continue;
    }

    const schemaValue = schemaValues[schemaKey];
    const processedValue = processFieldValueOptimized(schemaKey, schemaValue);

    // 타입 안전성 검증 후 할당
    const fieldConfig = STATIC_FIELD_CONFIGS.get(schemaKey);

    if (!fieldConfig) {
      continue;
    }

    const isValidType = validateProcessedValueType(
      processedValue,
      fieldConfig.type
    );

    if (isValidType) {
      resultFormValues[schemaKey] = processedValue;
    }
  }

  console.log('✅ validationHelpers: FormValues 생성 완료');
  return Object.freeze(resultFormValues);
};

// 🚀 타입 검증 - 구체적인 타입 체크
const validateProcessedValueType = (
  processedValue: string | boolean | string[] | null,
  expectedFieldType: FieldType
): boolean => {
  const typeValidationMap = new Map<
    FieldType,
    (value: string | boolean | string[] | null) => boolean
  >([
    [FIELD_TYPES.STRING, (value): value is string => typeof value === 'string'],
    [FIELD_TYPES.ARRAY, (value): value is string[] => Array.isArray(value)],
    [
      FIELD_TYPES.BOOLEAN,
      (value): value is boolean => typeof value === 'boolean',
    ],
    [
      FIELD_TYPES.NULLABLE_STRING,
      (value): value is string | null =>
        typeof value === 'string' || value === null,
    ],
  ]);

  const validationFunction = typeValidationMap.get(expectedFieldType);

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

// 🚀 배열 필터링 - 최적화된 버전
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

// 🚀 스키마 키 검증 - O(1) 성능
export const isValidFormSchemaKey = (
  key: string
): key is keyof FormSchemaValues => {
  return isFormFieldKeyGuard(key);
};

// 🚀 FormValue 키 검증
export const isValidFormValueKey = (key: string): key is keyof FormValues => {
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

// 🚀 필드 매핑 조회 - O(1) 성능
export const FIELD_MAPPINGS = Object.fromEntries(OPTIMIZED_FIELD_MAPPINGS);

// 🚀 디버깅용 정보 조회
export const getFieldInfo = (fieldKey: string): FieldConfigItem | undefined => {
  return STATIC_FIELD_CONFIGS.get(fieldKey);
};

export const getAllFieldsInfo = (): Record<string, FieldConfigItem> => {
  return Object.fromEntries(STATIC_FIELD_CONFIGS);
};
