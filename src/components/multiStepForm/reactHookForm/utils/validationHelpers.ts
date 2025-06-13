import { FormSchemaValues, FormValues } from '../../types/formTypes';

// 가능한 모든 값의 타입 정의
type PossibleFormValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

// 필드 타입 열거
const FIELD_TYPES = {
  STRING: 'string',
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  NULLABLE_STRING: 'nullable_string',
} as const;

type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

// 완전 동적 필드 설정 (타입 메타데이터 포함)
const createFieldConfig = () => {
  const config = new Map();

  // 설정 정의 함수들
  const addStringField = (key: string, mapping: string) => {
    config.set(key, {
      type: FIELD_TYPES.STRING,
      default: '',
      mapping,
      processor: (value: PossibleFormValue) =>
        typeof value === 'string' && value.trim() !== '' ? value : '',
    });
  };

  const addArrayField = (key: string, mapping: string) => {
    config.set(key, {
      type: FIELD_TYPES.ARRAY,
      default: [],
      mapping,
      processor: (value: PossibleFormValue) => {
        if (Array.isArray(value)) {
          return value.filter(
            (item): item is string => typeof item === 'string'
          );
        }
        return [];
      },
    });
  };

  const addBooleanField = (key: string, mapping: string) => {
    config.set(key, {
      type: FIELD_TYPES.BOOLEAN,
      default: false,
      mapping,
      processor: (value: PossibleFormValue) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        if (typeof value === 'number') return value !== 0;
        return false;
      },
    });
  };

  const addNullableStringField = (key: string, mapping: string) => {
    config.set(key, {
      type: FIELD_TYPES.NULLABLE_STRING,
      default: null,
      mapping,
      processor: (value: PossibleFormValue) =>
        typeof value === 'string' && value.trim() !== '' ? value : null,
    });
  };

  // 필드 등록 (여기만 수정하면 모든 것이 자동 처리됨!)
  addStringField('userImage', 'userimage');
  addStringField('nickname', 'nickname');
  addStringField('emailPrefix', 'emailprefix');
  addStringField('emailDomain', 'emaildomain');
  addStringField('bio', 'bio');
  addStringField('title', 'title');
  addStringField('description', 'description');
  addStringField('tags', 'tags');
  addStringField('content', 'content');
  addStringField('editorCompletedContent', 'editorcompletedcontent');

  addArrayField('media', 'media');
  addArrayField('sliderImages', 'sliderimages');

  addBooleanField('isEditorCompleted', 'iseditorcompleted');

  addNullableStringField('mainImage', 'mainimage');

  return config;
};

// 동적 설정 생성
const FIELD_CONFIG = createFieldConfig();

// 동적 타입 및 키 추출
type FormFieldKey = keyof FormValues;
const getFormFieldKeys = (): string[] => Array.from(FIELD_CONFIG.keys());
const FORM_FIELD_KEYS = getFormFieldKeys();

// 타입 가드
const isFormFieldKey = (key: string): key is FormFieldKey => {
  return FIELD_CONFIG.has(key);
};

// 동적 매핑 테이블 생성
const createFieldMappings = (): Record<string, string> => {
  const mappings: Record<string, string> = {};

  FIELD_CONFIG.forEach((config, key) => {
    mappings[config.mapping] = key;
    mappings[key.toLowerCase()] = key;
  });

  // 추가 매핑 (설정 가능)
  const additionalMappings = [
    { from: 'editorcompleted', to: 'isEditorCompleted' },
    { from: 'editor', to: 'isEditorCompleted' },
  ];

  additionalMappings.forEach(({ from, to }) => {
    mappings[from] = to;
  });

  return mappings;
};

// 동적 기본값 생성
const createDefaultValues = (): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {};

  FIELD_CONFIG.forEach((config, key) => {
    defaults[key] = config.default;
  });

  return defaults;
};

// 동적 값 처리
const processFieldValue = (key: string, value: PossibleFormValue): unknown => {
  const config = FIELD_CONFIG.get(key);
  if (!config) return value;

  return config.processor(value);
};

// 상수들
const FIELD_MAPPINGS = createFieldMappings();
const DEFAULT_VALUES = createDefaultValues();

// 타입 안전한 키 검증
const isValidStringKey = (key: string, validKeys: string[]): boolean => {
  return validKeys.includes(key);
};

// 내보낼 함수들
export const isValidFormSchemaKey = (
  key: string
): key is keyof FormSchemaValues => {
  return isValidStringKey(key, FORM_FIELD_KEYS);
};

export const isValidFormValueKey = (key: string): key is keyof FormValues => {
  return isValidStringKey(key, FORM_FIELD_KEYS);
};

export const filterValidFormFields = (fields: readonly string[]): string[] => {
  return fields.filter((field) => isFormFieldKey(field));
};

export const filterDefinedStrings = (
  strings: readonly (string | undefined)[]
): string[] => {
  return strings.filter(
    (str): str is string => typeof str === 'string' && str.trim() !== ''
  );
};

export const normalizeFieldName = (fieldName: string): string => {
  return fieldName.toLowerCase().replace(/[_-]/g, '');
};

// 완전 동적 스키마 변환 (진짜 100% 메타프로그래밍)
export const createFormValuesFromSchema = (
  schemaValues: FormSchemaValues
): FormValues => {
  // 동적 결과 객체 생성
  const result = Object.create(null);

  // 모든 기본값 설정
  FIELD_CONFIG.forEach((config, key) => {
    result[key] = config.default;
  });

  // 스키마 값들로 동적 업데이트
  Object.keys(schemaValues).forEach((key) => {
    if (isFormFieldKey(key) && key in schemaValues) {
      const schemaValue = schemaValues[key];
      const processedValue = processFieldValue(key, schemaValue);

      // 타입 검증 후 할당
      const config = FIELD_CONFIG.get(key);
      if (config && isValidProcessedValue(processedValue, config.type)) {
        result[key] = processedValue;
      }
    }
  });

  // 완전 동적 FormValues 구조 생성
  return createFormValuesStructure(result);
};

// FormValues 구조를 동적으로 생성하는 함수
const createFormValuesStructure = (
  data: Record<string, unknown>
): FormValues => {
  const structure = Object.create(null);

  // 설정 기반으로 구조 생성
  FIELD_CONFIG.forEach((config, key) => {
    structure[key] = data[key] !== undefined ? data[key] : config.default;
  });

  // 타입 체크를 통한 안전한 변환
  return validateAndConvertToFormValues(structure);
};

// 타입 검증 및 FormValues 변환
const validateAndConvertToFormValues = (
  obj: Record<string, unknown>
): FormValues => {
  // 각 필드의 타입 검증
  const validatedData = Object.create(null);

  FIELD_CONFIG.forEach((config, key) => {
    const value = obj[key];

    switch (config.type) {
      case FIELD_TYPES.STRING:
        validatedData[key] = typeof value === 'string' ? value : config.default;
        break;
      case FIELD_TYPES.ARRAY:
        validatedData[key] = Array.isArray(value) ? value : config.default;
        break;
      case FIELD_TYPES.BOOLEAN:
        validatedData[key] =
          typeof value === 'boolean' ? value : config.default;
        break;
      case FIELD_TYPES.NULLABLE_STRING:
        validatedData[key] =
          typeof value === 'string' || value === null ? value : config.default;
        break;
      default:
        validatedData[key] = config.default;
    }
  });

  // 구조적 타이핑을 통한 FormValues 반환
  return Object.freeze(validatedData) satisfies FormValues;
};

// 타입 검증 헬퍼
const isValidProcessedValue = (
  value: unknown,
  expectedType: FieldType
): boolean => {
  switch (expectedType) {
    case FIELD_TYPES.STRING:
      return typeof value === 'string';
    case FIELD_TYPES.ARRAY:
      return Array.isArray(value);
    case FIELD_TYPES.BOOLEAN:
      return typeof value === 'boolean';
    case FIELD_TYPES.NULLABLE_STRING:
      return typeof value === 'string' || value === null;
    default:
      return false;
  }
};

// 필드 설정 정보 조회 (디버깅/검증용)
export const getFieldInfo = (key: string) => {
  return FIELD_CONFIG.get(key);
};

// 모든 필드 정보 조회
export const getAllFieldsInfo = () => {
  return Object.fromEntries(FIELD_CONFIG);
};

export { FIELD_MAPPINGS };
