// src/components/multiStepForm/utils/formFieldsLoader.ts

import formFieldsConfig from '../config/formFieldsConfig.json';
import type { FormSchemaValues } from '../types/formTypes';

interface FormFieldsConfigType {
  readonly version: string;
  readonly formFields: Record<string, string | string[] | null | boolean>;
  readonly fieldTypes: Record<string, string>;
  readonly emailFields: readonly string[];
}

// 🔧 구체적인 타입 변환 함수들 생성
const createFieldTypeConverters = () => {
  console.log('🔧 [FIELD_CONVERTERS] 필드 타입 변환기 생성 시작');

  const convertToSafeString = (
    rawValue: unknown,
    defaultValue: string
  ): string => {
    console.log('🔄 [CONVERT_STRING] 안전한 문자열 변환:', typeof rawValue);

    if (typeof rawValue === 'string') {
      return rawValue;
    }

    if (typeof rawValue === 'number') {
      return rawValue.toString();
    }

    console.log('⚠️ [CONVERT_STRING] 기본값 사용:', defaultValue);
    return defaultValue;
  };

  const convertToSafeStringArray = (
    rawValue: unknown,
    defaultValue: string[]
  ): string[] => {
    console.log(
      '🔄 [CONVERT_ARRAY] 안전한 배열 변환:',
      Array.isArray(rawValue)
    );

    if (!Array.isArray(rawValue)) {
      console.log('⚠️ [CONVERT_ARRAY] 배열이 아님, 기본값 사용');
      return defaultValue;
    }

    const filteredStringItems = rawValue.filter(
      (currentItem: unknown): currentItem is string => {
        return typeof currentItem === 'string';
      }
    );

    console.log(
      '✅ [CONVERT_ARRAY] 문자열 배열 변환 완료:',
      filteredStringItems.length
    );
    return filteredStringItems;
  };

  const convertToSafeStringOrNull = (
    rawValue: unknown,
    defaultValue: string | null
  ): string | null => {
    console.log(
      '🔄 [CONVERT_NULLABLE] nullable 문자열 변환:',
      rawValue === null ? 'null' : typeof rawValue
    );

    if (rawValue === null) {
      return null;
    }

    if (typeof rawValue === 'string') {
      return rawValue;
    }

    console.log('⚠️ [CONVERT_NULLABLE] 기본값 사용:', defaultValue);
    return defaultValue;
  };

  const convertToSafeBoolean = (
    rawValue: unknown,
    defaultValue: boolean
  ): boolean => {
    console.log('🔄 [CONVERT_BOOLEAN] 안전한 불린 변환:', typeof rawValue);

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const lowerCaseValue = rawValue.toLowerCase().trim();
      const isTrueString = lowerCaseValue === 'true';
      const isFalseString = lowerCaseValue === 'false';

      if (isTrueString) return true;
      if (isFalseString) return false;
    }

    console.log('⚠️ [CONVERT_BOOLEAN] 기본값 사용:', defaultValue);
    return defaultValue;
  };

  console.log('✅ [FIELD_CONVERTERS] 필드 타입 변환기 생성 완료');

  return {
    convertToSafeString,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeBoolean,
  };
};

// 🔧 FormSchemaValues 타입에 맞는 필드 매핑 생성
const createFormSchemaFieldMap = () => {
  console.log('🗺️ [FIELD_MAP] FormSchema 필드 맵 생성 시작');

  const stringFieldsSet = new Set([
    'userImage',
    'nickname',
    'emailPrefix',
    'emailDomain',
    'bio',
    'title',
    'description',
    'editorCompletedContent',
  ]);

  const arrayFieldsSet = new Set(['media', 'sliderImages']);

  const nullableStringFieldsSet = new Set(['mainImage']);

  const booleanFieldsSet = new Set(['isEditorCompleted']);

  console.log('✅ [FIELD_MAP] 필드 맵 생성 완료:', {
    stringFields: stringFieldsSet.size,
    arrayFields: arrayFieldsSet.size,
    nullableFields: nullableStringFieldsSet.size,
    booleanFields: booleanFieldsSet.size,
  });

  return {
    stringFieldsSet,
    arrayFieldsSet,
    nullableStringFieldsSet,
    booleanFieldsSet,
  };
};

const validateFormFieldsConfig = (config: unknown): FormFieldsConfigType => {
  console.log('🔧 [CONFIG_VALIDATION] formFieldsConfig 검증 시작');

  if (!config || typeof config !== 'object') {
    console.error('❌ [CONFIG_VALIDATION] config가 객체가 아님');
    throw new Error('formFieldsConfig가 유효하지 않습니다');
  }

  const configReflection = {
    formFields: Reflect.get(config, 'formFields'),
    fieldTypes: Reflect.get(config, 'fieldTypes'),
    emailFields: Reflect.get(config, 'emailFields'),
    version: Reflect.get(config, 'version'),
  };

  const { formFields, fieldTypes, emailFields, version } = configReflection;

  if (!formFields || typeof formFields !== 'object') {
    console.error('❌ [CONFIG_VALIDATION] formFields가 객체가 아님');
    throw new Error('formFields가 유효하지 않습니다');
  }

  if (!fieldTypes || typeof fieldTypes !== 'object') {
    console.error('❌ [CONFIG_VALIDATION] fieldTypes가 객체가 아님');
    throw new Error('fieldTypes가 유효하지 않습니다');
  }

  if (!Array.isArray(emailFields)) {
    console.error('❌ [CONFIG_VALIDATION] emailFields가 배열이 아님');
    throw new Error('emailFields가 유효하지 않습니다');
  }

  const validatedConfig: FormFieldsConfigType = {
    version: typeof version === 'string' ? version : '1.0.0',
    formFields,
    fieldTypes,
    emailFields,
  };

  console.log('✅ [CONFIG_VALIDATION] config 검증 완료');
  return validatedConfig;
};

const safeFormFieldsConfig = validateFormFieldsConfig(formFieldsConfig);

// 🔧 FormSchemaValues 타입으로 정확히 반환하는 함수
export const getDefaultFormSchemaValues = (): FormSchemaValues => {
  console.log('🔧 [GET_DEFAULTS] FormSchemaValues 타입 기본값 생성 시작');

  const {
    convertToSafeString,
    convertToSafeStringArray,
    convertToSafeStringOrNull,
    convertToSafeBoolean,
  } = createFieldTypeConverters();
  const {
    stringFieldsSet,
    arrayFieldsSet,
    nullableStringFieldsSet,
    booleanFieldsSet,
  } = createFormSchemaFieldMap();

  const { formFields } = safeFormFieldsConfig;
  const formFieldEntries = Object.entries(formFields);

  // 🚨 수정: FormSchemaValues 타입에 정확히 맞는 객체 생성
  const typedFormSchemaValues: FormSchemaValues = {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    media: [],
    mainImage: null,
    sliderImages: [],
    editorCompletedContent: '',
    isEditorCompleted: false,
  };

  console.log('🔧 [GET_DEFAULTS] 기본 구조 생성 완료, 동적 값 적용 시작');

  // 동적으로 각 필드 값 변환 및 적용
  for (const [currentFieldName, currentRawValue] of formFieldEntries) {
    console.log('🔄 [FIELD_PROCESS] 필드 처리:', currentFieldName);

    const isStringField = stringFieldsSet.has(currentFieldName);
    const isArrayField = arrayFieldsSet.has(currentFieldName);
    const isNullableField = nullableStringFieldsSet.has(currentFieldName);
    const isBooleanField = booleanFieldsSet.has(currentFieldName);

    if (isStringField) {
      const convertedStringValue = convertToSafeString(currentRawValue, '');
      Reflect.set(
        typedFormSchemaValues,
        currentFieldName,
        convertedStringValue
      );
      console.log(
        '✅ [FIELD_PROCESS] 문자열 필드 처리 완료:',
        currentFieldName
      );
      continue;
    }

    if (isArrayField) {
      const convertedArrayValue = convertToSafeStringArray(currentRawValue, []);
      Reflect.set(typedFormSchemaValues, currentFieldName, convertedArrayValue);
      console.log('✅ [FIELD_PROCESS] 배열 필드 처리 완료:', currentFieldName);
      continue;
    }

    if (isNullableField) {
      const convertedNullableValue = convertToSafeStringOrNull(
        currentRawValue,
        null
      );
      Reflect.set(
        typedFormSchemaValues,
        currentFieldName,
        convertedNullableValue
      );
      console.log(
        '✅ [FIELD_PROCESS] nullable 필드 처리 완료:',
        currentFieldName
      );
      continue;
    }

    if (isBooleanField) {
      const convertedBooleanValue = convertToSafeBoolean(
        currentRawValue,
        false
      );
      Reflect.set(
        typedFormSchemaValues,
        currentFieldName,
        convertedBooleanValue
      );
      console.log('✅ [FIELD_PROCESS] 불린 필드 처리 완료:', currentFieldName);
      continue;
    }

    console.log('⚠️ [FIELD_PROCESS] 알 수 없는 필드 타입:', currentFieldName);
  }

  console.log('✅ [GET_DEFAULTS] FormSchemaValues 타입 기본값 생성 완료:', {
    fieldsCount: Object.keys(typedFormSchemaValues).length,
    nickname: typedFormSchemaValues.nickname,
    title: typedFormSchemaValues.title,
    hasMedia: typedFormSchemaValues.media.length > 0,
    isEditorCompleted: typedFormSchemaValues.isEditorCompleted,
  });

  return typedFormSchemaValues;
};

export const getAllFieldNames = (): string[] => {
  console.log('🔧 [GET_FIELD_NAMES] 모든 필드명 조회 시작');

  const { formFields } = safeFormFieldsConfig;
  const fieldNamesList = Object.keys(formFields);

  console.log(
    `✅ [GET_FIELD_NAMES] ${fieldNamesList.length}개 필드명 반환 완료`
  );
  return fieldNamesList;
};

export const getFieldType = (targetFieldName: string): string => {
  console.log(`🔧 [GET_FIELD_TYPE] 필드 타입 조회: ${targetFieldName}`);

  const isValidFieldName =
    targetFieldName && typeof targetFieldName === 'string';
  if (!isValidFieldName) {
    console.error('❌ [GET_FIELD_TYPE] 유효하지 않은 필드명');
    return 'string';
  }

  const { fieldTypes } = safeFormFieldsConfig;
  const foundFieldType = Reflect.get(fieldTypes, targetFieldName);

  const resultFieldType =
    typeof foundFieldType === 'string' ? foundFieldType : 'string';

  console.log(
    `✅ [GET_FIELD_TYPE] ${targetFieldName}의 타입: ${resultFieldType}`
  );
  return resultFieldType;
};

export const getEmailFields = (): string[] => {
  console.log('🔧 [GET_EMAIL_FIELDS] 이메일 필드 조회 시작');

  const { emailFields } = safeFormFieldsConfig;
  const clonedEmailFields = [...emailFields];

  console.log(
    `✅ [GET_EMAIL_FIELDS] ${clonedEmailFields.length}개 이메일 필드 반환 완료`
  );
  return clonedEmailFields;
};

export const getStringFields = (): string[] => {
  console.log('🔧 [GET_STRING_FIELDS] 문자열 필드 조회 시작');

  const { fieldTypes } = safeFormFieldsConfig;
  const fieldTypeEntries = Object.entries(fieldTypes);

  const stringFieldsList: string[] = [];

  for (const [currentFieldName, currentFieldType] of fieldTypeEntries) {
    const isStringType = currentFieldType === 'string';

    if (isStringType) {
      stringFieldsList.push(currentFieldName);
    }
  }

  console.log(
    `✅ [GET_STRING_FIELDS] ${stringFieldsList.length}개 string 필드 반환 완료`
  );
  return stringFieldsList;
};

export const getArrayFields = (): string[] => {
  console.log('🔧 [GET_ARRAY_FIELDS] 배열 필드 조회 시작');

  const { fieldTypes } = safeFormFieldsConfig;
  const fieldTypeEntries = Object.entries(fieldTypes);

  const arrayFieldsList: string[] = [];

  for (const [currentFieldName, currentFieldType] of fieldTypeEntries) {
    const isArrayType = currentFieldType === 'array';

    if (isArrayType) {
      arrayFieldsList.push(currentFieldName);
    }
  }

  console.log(
    `✅ [GET_ARRAY_FIELDS] ${arrayFieldsList.length}개 array 필드 반환 완료`
  );
  return arrayFieldsList;
};

export const getBooleanFields = (): string[] => {
  console.log('🔧 [GET_BOOLEAN_FIELDS] 불린 필드 조회 시작');

  const { fieldTypes } = safeFormFieldsConfig;
  const fieldTypeEntries = Object.entries(fieldTypes);

  const booleanFieldsList: string[] = [];

  for (const [currentFieldName, currentFieldType] of fieldTypeEntries) {
    const isBooleanType = currentFieldType === 'boolean';

    if (isBooleanType) {
      booleanFieldsList.push(currentFieldName);
    }
  }

  console.log(
    `✅ [GET_BOOLEAN_FIELDS] ${booleanFieldsList.length}개 boolean 필드 반환 완료`
  );
  return booleanFieldsList;
};

export const getNullableFields = (): string[] => {
  console.log('🔧 [GET_NULLABLE_FIELDS] nullable 필드 조회 시작');

  const { fieldTypes } = safeFormFieldsConfig;
  const fieldTypeEntries = Object.entries(fieldTypes);

  const nullableFieldsList: string[] = [];

  for (const [currentFieldName, currentFieldType] of fieldTypeEntries) {
    const isNullableType = currentFieldType.includes('null');

    if (isNullableType) {
      nullableFieldsList.push(currentFieldName);
    }
  }

  console.log(
    `✅ [GET_NULLABLE_FIELDS] ${nullableFieldsList.length}개 nullable 필드 반환 완료`
  );
  return nullableFieldsList;
};
