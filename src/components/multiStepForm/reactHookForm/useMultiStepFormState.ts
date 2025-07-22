// src/components/multiStepForm/reactHookForm/useMultiStepFormState.ts

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from '../schema/formSchema';
import type { FormSchemaValues } from '../types/formTypes';
import {
  getDefaultFormSchemaValues,
  getAllFieldNames,
  getFieldType,
  getStringFields,
  getArrayFields,
  getBooleanFields,
} from '../utils/formFieldsLoader';

// 🔧 구체적 타입 검증을 위한 FormSchemaValues 키 검증기
const createFormSchemaKeysValidator = () => {
  console.log('🔍 [KEYS_VALIDATOR] FormSchemaValues 키 검증기 생성');

  const formSchemaKeysSet = new Set<string>();
  const defaultFormValues = getDefaultFormSchemaValues();

  // 실제 FormSchemaValues 키들을 Set에 저장
  Object.keys(defaultFormValues).forEach((fieldKey) => {
    formSchemaKeysSet.add(fieldKey);
  });

  const isValidFormSchemaKey = (
    fieldKey: string
  ): fieldKey is keyof FormSchemaValues => {
    return formSchemaKeysSet.has(fieldKey);
  };

  const validateAndConvertToFormSchemaKeys = (
    rawFieldNames: string[]
  ): (keyof FormSchemaValues)[] => {
    console.log(
      '🔍 [VALIDATE_KEYS] 필드명 검증 및 변환:',
      rawFieldNames.length
    );

    const validatedFormSchemaKeys: (keyof FormSchemaValues)[] = [];

    for (const currentFieldName of rawFieldNames) {
      if (isValidFormSchemaKey(currentFieldName)) {
        validatedFormSchemaKeys.push(currentFieldName);
        console.log('✅ [VALIDATE_KEYS] 유효한 키:', currentFieldName);
      } else {
        console.warn(
          '⚠️ [VALIDATE_KEYS] 유효하지 않은 키 제외:',
          currentFieldName
        );
      }
    }

    console.log('✅ [VALIDATE_KEYS] 검증 완료:', {
      원본: rawFieldNames.length,
      검증통과: validatedFormSchemaKeys.length,
    });

    return validatedFormSchemaKeys;
  };

  console.log('✅ [KEYS_VALIDATOR] FormSchemaValues 키 검증기 생성 완료');

  return {
    isValidFormSchemaKey,
    validateAndConvertToFormSchemaKeys,
    formSchemaKeysSet,
  };
};

// 🔧 완전 동적 타입 맵 생성 (타입단언 완전 제거)
const createDynamicFormSchemaFieldTypeMap = () => {
  console.log('🗺️ [DYNAMIC_TYPE_MAP] 동적 FormSchema 필드 타입 맵 생성 시작');

  const keysValidator = createFormSchemaKeysValidator();

  // 동적으로 각 타입별 필드 집합 생성 (타입단언 제거)
  const rawStringFieldNames = getStringFields();
  const rawArrayFieldNames = getArrayFields();
  const rawBooleanFieldNames = getBooleanFields();

  const validatedStringFields =
    keysValidator.validateAndConvertToFormSchemaKeys(rawStringFieldNames);
  const validatedArrayFields =
    keysValidator.validateAndConvertToFormSchemaKeys(rawArrayFieldNames);
  const validatedBooleanFields =
    keysValidator.validateAndConvertToFormSchemaKeys(rawBooleanFieldNames);

  // nullable 필드는 fieldTypes에서 'string|null' 타입 찾기 (타입단언 제거)
  const rawAllFieldNames = getAllFieldNames();
  const rawNullableStringFieldNames: string[] = [];

  for (const currentFieldName of rawAllFieldNames) {
    const fieldType = getFieldType(currentFieldName);
    if (fieldType === 'string|null') {
      rawNullableStringFieldNames.push(currentFieldName);
    }
  }

  const validatedNullableStringFields =
    keysValidator.validateAndConvertToFormSchemaKeys(
      rawNullableStringFieldNames
    );

  // Set 생성 (구체적 검증된 키들로만)
  const stringFieldsSet = new Set<keyof FormSchemaValues>(
    validatedStringFields
  );
  const arrayFieldsSet = new Set<keyof FormSchemaValues>(validatedArrayFields);
  const nullableStringFieldsSet = new Set<keyof FormSchemaValues>(
    validatedNullableStringFields
  );
  const booleanFieldsSet = new Set<keyof FormSchemaValues>(
    validatedBooleanFields
  );

  console.log(
    '✅ [DYNAMIC_TYPE_MAP] 동적 필드 타입 맵 생성 완료 (타입단언 제거):',
    {
      stringFields: stringFieldsSet.size,
      arrayFields: arrayFieldsSet.size,
      nullableFields: nullableStringFieldsSet.size,
      booleanFields: booleanFieldsSet.size,
      totalValidated:
        validatedStringFields.length +
        validatedArrayFields.length +
        validatedNullableStringFields.length +
        validatedBooleanFields.length,
    }
  );

  return {
    stringFieldsSet,
    arrayFieldsSet,
    nullableStringFieldsSet,
    booleanFieldsSet,
    keysValidator,
  };
};

// 🔧 구체적 타입 가드 함수들 생성
const createConcreteTypeGuards = () => {
  console.log('🏭 [TYPE_GUARDS] 구체적 타입 가드 생성 시작');

  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidStringArray = (value: unknown): value is string[] => {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.every((item): item is string => typeof item === 'string');
  };

  const isValidNullableString = (value: unknown): value is string | null => {
    return value === null || typeof value === 'string';
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const extractSafeString = (rawValue: unknown, fallback: unknown): string => {
    if (isValidString(rawValue)) {
      return rawValue;
    }
    if (isValidString(fallback)) {
      return fallback;
    }
    return '';
  };

  const extractSafeStringArray = (
    rawValue: unknown,
    fallback: unknown
  ): string[] => {
    if (isValidStringArray(rawValue)) {
      return rawValue;
    }
    if (isValidStringArray(fallback)) {
      return fallback;
    }
    return [];
  };

  const extractSafeNullableString = (
    rawValue: unknown,
    fallback: unknown
  ): string | null => {
    if (isValidNullableString(rawValue)) {
      return rawValue;
    }
    if (isValidNullableString(fallback)) {
      return fallback;
    }
    return null;
  };

  const extractSafeBoolean = (
    rawValue: unknown,
    fallback: unknown
  ): boolean => {
    if (isValidBoolean(rawValue)) {
      return rawValue;
    }
    if (isValidBoolean(fallback)) {
      return fallback;
    }
    return false;
  };

  console.log('✅ [TYPE_GUARDS] 구체적 타입 가드 생성 완료');

  return {
    isValidString,
    isValidStringArray,
    isValidNullableString,
    isValidBoolean,
    extractSafeString,
    extractSafeStringArray,
    extractSafeNullableString,
    extractSafeBoolean,
  };
};

// 🔧 안전한 타입 변환 유틸리티 팩토리 (실무형 변환)
const createSafeTypeConverterFactory = () => {
  console.log('🏭 [CONVERTER_FACTORY] 실무형 타입 변환 팩토리 생성 시작');

  const convertToFormSchemaString = (
    rawValue: unknown,
    fallbackValue: string
  ): string => {
    console.log('🔄 [CONVERT_STRING] 실무형 문자열 변환:', typeof rawValue);

    if (typeof rawValue === 'string') {
      return rawValue;
    }

    if (typeof rawValue === 'number') {
      const numberToString = String(rawValue);
      return numberToString;
    }

    if (
      rawValue !== null &&
      rawValue !== undefined &&
      typeof rawValue === 'object'
    ) {
      const objectToJsonString = JSON.stringify(rawValue);
      return objectToJsonString;
    }

    console.log('⚠️ [CONVERT_STRING] fallback 사용:', fallbackValue);
    return fallbackValue;
  };

  const convertToFormSchemaBoolean = (
    rawValue: unknown,
    fallbackValue: boolean
  ): boolean => {
    console.log('🔄 [CONVERT_BOOLEAN] 실무형 불린 변환:', typeof rawValue);

    if (typeof rawValue === 'boolean') {
      return rawValue;
    }

    if (typeof rawValue === 'number') {
      return rawValue !== 0;
    }

    if (typeof rawValue === 'string') {
      const normalizedString = rawValue.toLowerCase().trim();

      // 실무에서 자주 사용되는 불린 변환 패턴
      const truthyValues = new Set(['true', '1', 'yes', 'on', 'enabled']);
      const falsyValues = new Set(['false', '0', 'no', 'off', 'disabled']);

      if (truthyValues.has(normalizedString)) return true;
      if (falsyValues.has(normalizedString)) return false;
    }

    console.log('⚠️ [CONVERT_BOOLEAN] fallback 사용:', fallbackValue);
    return fallbackValue;
  };

  const convertToFormSchemaStringArray = (
    rawValue: unknown,
    fallbackValue: string[]
  ): string[] => {
    console.log(
      '🔄 [CONVERT_ARRAY] 실무형 배열 변환:',
      Array.isArray(rawValue)
    );

    if (!Array.isArray(rawValue)) {
      console.log('⚠️ [CONVERT_ARRAY] fallback 사용:', fallbackValue.length);
      return fallbackValue;
    }

    const validatedStringItems: string[] = [];

    for (const currentItem of rawValue) {
      if (typeof currentItem === 'string') {
        validatedStringItems.push(currentItem);
      } else if (currentItem !== null && currentItem !== undefined) {
        // 실무형 변환: null/undefined가 아닌 값들을 문자열로 변환
        const convertedString = String(currentItem);
        validatedStringItems.push(convertedString);
      }
    }

    console.log(
      '✅ [CONVERT_ARRAY] 유효한 문자열 항목:',
      validatedStringItems.length
    );
    return validatedStringItems;
  };

  const convertToFormSchemaNullableString = (
    rawValue: unknown,
    fallbackValue: string | null
  ): string | null => {
    console.log(
      '🔄 [CONVERT_NULLABLE] 실무형 nullable 변환:',
      rawValue === null ? 'null' : typeof rawValue
    );

    if (rawValue === null) {
      return null;
    }

    if (typeof rawValue === 'string') {
      return rawValue;
    }

    if (typeof rawValue === 'undefined') {
      return null;
    }

    // 실무형 변환: 다른 타입들을 문자열로 변환
    if (rawValue !== null && rawValue !== undefined) {
      const convertedString = String(rawValue);
      return convertedString;
    }

    console.log('⚠️ [CONVERT_NULLABLE] fallback 사용:', fallbackValue);
    return fallbackValue;
  };

  console.log('✅ [CONVERTER_FACTORY] 실무형 타입 변환 팩토리 생성 완료');

  return {
    convertToFormSchemaString,
    convertToFormSchemaBoolean,
    convertToFormSchemaStringArray,
    convertToFormSchemaNullableString,
  };
};

// 🔧 동적 FormSchemaValues 구조체 생성 (하드코딩 완전 제거)
const createDynamicFormSchemaStructure = (): FormSchemaValues => {
  console.log('🏗️ [DYNAMIC_STRUCTURE] 동적 FormSchemaValues 구조 생성');

  const defaultValues = getDefaultFormSchemaValues();

  // 기본값을 그대로 FormSchemaValues 타입으로 반환
  console.log('✅ [DYNAMIC_STRUCTURE] 동적 구조 생성 완료:', {
    fieldsCount: Object.keys(defaultValues).length,
  });

  return defaultValues;
};

// 🔧 동적 필드 값 추출 함수 (타입단언 완전 제거)
const extractFormSchemaValuesSafely = (
  rawFormData: unknown
): FormSchemaValues => {
  console.log(
    '🔧 [EXTRACT_VALUES] 안전한 FormSchema 값 추출 시작 (타입단언 제거)'
  );

  // Early Return: 유효하지 않은 입력
  const isValidObject = rawFormData !== null && typeof rawFormData === 'object';
  if (!isValidObject) {
    console.log('❌ [EXTRACT_VALUES] 유효하지 않은 객체, 기본값 반환');
    return getDefaultFormSchemaValues();
  }

  const typeConverters = createSafeTypeConverterFactory();
  const fieldTypeMap = createDynamicFormSchemaFieldTypeMap();
  const typeGuards = createConcreteTypeGuards();
  const defaultValues = getDefaultFormSchemaValues();

  // 동적으로 FormSchemaValues 구조체 생성
  const extractedFormSchemaValues = createDynamicFormSchemaStructure();

  // 동적으로 모든 필드명 가져오기 (타입단언 제거)
  const rawAllFieldNames = getAllFieldNames();
  const validatedFieldNames =
    fieldTypeMap.keysValidator.validateAndConvertToFormSchemaKeys(
      rawAllFieldNames
    );

  console.log(
    '🔄 [EXTRACT_VALUES] 각 필드별 타입 안전 변환 시작 (타입단언 제거)'
  );

  for (const currentFieldName of validatedFieldNames) {
    console.log('🔄 [FIELD_EXTRACT] 동적 필드 추출:', currentFieldName);

    const rawFieldValue = Reflect.get(rawFormData, currentFieldName);
    const defaultFieldValue = Reflect.get(defaultValues, currentFieldName);

    const isStringField = fieldTypeMap.stringFieldsSet.has(currentFieldName);
    const isArrayField = fieldTypeMap.arrayFieldsSet.has(currentFieldName);
    const isNullableField =
      fieldTypeMap.nullableStringFieldsSet.has(currentFieldName);
    const isBooleanField = fieldTypeMap.booleanFieldsSet.has(currentFieldName);

    if (isStringField) {
      const safeDefaultString = typeGuards.extractSafeString(
        defaultFieldValue,
        ''
      );
      const convertedStringValue = typeConverters.convertToFormSchemaString(
        rawFieldValue,
        safeDefaultString
      );
      Reflect.set(
        extractedFormSchemaValues,
        currentFieldName,
        convertedStringValue
      );
      console.log(
        '✅ [FIELD_EXTRACT] 문자열 필드 처리 완료:',
        currentFieldName
      );
      continue;
    }

    if (isArrayField) {
      const safeDefaultArray = typeGuards.extractSafeStringArray(
        defaultFieldValue,
        []
      );
      const convertedArrayValue = typeConverters.convertToFormSchemaStringArray(
        rawFieldValue,
        safeDefaultArray
      );
      Reflect.set(
        extractedFormSchemaValues,
        currentFieldName,
        convertedArrayValue
      );
      console.log('✅ [FIELD_EXTRACT] 배열 필드 처리 완료:', currentFieldName);
      continue;
    }

    if (isNullableField) {
      const safeDefaultNullable = typeGuards.extractSafeNullableString(
        defaultFieldValue,
        null
      );
      const convertedNullableValue =
        typeConverters.convertToFormSchemaNullableString(
          rawFieldValue,
          safeDefaultNullable
        );
      Reflect.set(
        extractedFormSchemaValues,
        currentFieldName,
        convertedNullableValue
      );
      console.log(
        '✅ [FIELD_EXTRACT] nullable 필드 처리 완료:',
        currentFieldName
      );
      continue;
    }

    if (isBooleanField) {
      const safeDefaultBoolean = typeGuards.extractSafeBoolean(
        defaultFieldValue,
        false
      );
      const convertedBooleanValue = typeConverters.convertToFormSchemaBoolean(
        rawFieldValue,
        safeDefaultBoolean
      );
      Reflect.set(
        extractedFormSchemaValues,
        currentFieldName,
        convertedBooleanValue
      );
      console.log('✅ [FIELD_EXTRACT] 불린 필드 처리 완료:', currentFieldName);
      continue;
    }

    console.log('⚠️ [FIELD_EXTRACT] 알 수 없는 필드 타입:', currentFieldName);
  }

  console.log(
    '✅ [EXTRACT_VALUES] 안전한 FormSchema 값 추출 완료 (타입단언 제거):',
    {
      fieldsCount: Object.keys(extractedFormSchemaValues).length,
    }
  );

  return extractedFormSchemaValues;
};

// 🔧 구체적 타입별 필드 값 반환 함수들 (타입 단언 완전 제거)
const createTypedFieldValueReturners = () => {
  console.log('🏭 [FIELD_RETURNERS] 타입별 필드 값 반환기 생성');

  const returnStringFieldValue = (fieldValue: unknown): string => {
    console.log('🔄 [RETURN_STRING] 문자열 반환 처리');

    if (typeof fieldValue === 'string') {
      return fieldValue;
    }

    console.log('⚠️ [RETURN_STRING] 빈 문자열 반환');
    return '';
  };

  const returnArrayFieldValue = (fieldValue: unknown): string[] => {
    console.log('🔄 [RETURN_ARRAY] 배열 반환 처리');

    if (Array.isArray(fieldValue)) {
      const validStringArray: string[] = [];

      for (const currentItem of fieldValue) {
        if (typeof currentItem === 'string') {
          validStringArray.push(currentItem);
        }
      }

      return validStringArray;
    }

    console.log('⚠️ [RETURN_ARRAY] 빈 배열 반환');
    return [];
  };

  const returnNullableStringFieldValue = (
    fieldValue: unknown
  ): string | null => {
    console.log('🔄 [RETURN_NULLABLE] nullable 반환 처리');

    if (fieldValue === null) {
      return null;
    }

    if (typeof fieldValue === 'string') {
      return fieldValue;
    }

    console.log('⚠️ [RETURN_NULLABLE] null 반환');
    return null;
  };

  const returnBooleanFieldValue = (fieldValue: unknown): boolean => {
    console.log('🔄 [RETURN_BOOLEAN] 불린 반환 처리');

    if (typeof fieldValue === 'boolean') {
      return fieldValue;
    }

    console.log('⚠️ [RETURN_BOOLEAN] false 반환');
    return false;
  };

  console.log('✅ [FIELD_RETURNERS] 타입별 필드 값 반환기 생성 완료');

  return {
    returnStringFieldValue,
    returnArrayFieldValue,
    returnNullableStringFieldValue,
    returnBooleanFieldValue,
  };
};

// 🔧 동적 setValue를 위한 구체적 타입별 설정 함수들 (타입단언 완전 제거)
const createDynamicTypedFieldValueSetters = (
  formMethods: ReturnType<typeof useForm<FormSchemaValues>>
) => {
  console.log(
    '🏭 [DYNAMIC_FIELD_SETTERS] 동적 타입별 필드 설정기 생성 (타입단언 제거)'
  );

  // 동적으로 필드 타입별로 분류
  const fieldTypeMap = createDynamicFormSchemaFieldTypeMap();

  const setStringFieldValues = new Map<
    keyof FormSchemaValues,
    (value: string) => void
  >();
  const setArrayFieldValues = new Map<
    keyof FormSchemaValues,
    (value: string[]) => void
  >();
  const setNullableStringFieldValues = new Map<
    keyof FormSchemaValues,
    (value: string | null) => void
  >();
  const setBooleanFieldValues = new Map<
    keyof FormSchemaValues,
    (value: boolean) => void
  >();

  // 동적으로 문자열 필드 setter들 생성
  for (const stringFieldName of fieldTypeMap.stringFieldsSet) {
    const stringSetterFunction = (value: string) => {
      formMethods.setValue(stringFieldName, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    setStringFieldValues.set(stringFieldName, stringSetterFunction);
  }

  // 동적으로 배열 필드 setter들 생성
  for (const arrayFieldName of fieldTypeMap.arrayFieldsSet) {
    const arraySetterFunction = (value: string[]) => {
      formMethods.setValue(arrayFieldName, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    setArrayFieldValues.set(arrayFieldName, arraySetterFunction);
  }

  // 동적으로 nullable 필드 setter들 생성
  for (const nullableFieldName of fieldTypeMap.nullableStringFieldsSet) {
    const nullableSetterFunction = (value: string | null) => {
      formMethods.setValue(nullableFieldName, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    setNullableStringFieldValues.set(nullableFieldName, nullableSetterFunction);
  }

  // 동적으로 불린 필드 setter들 생성
  for (const booleanFieldName of fieldTypeMap.booleanFieldsSet) {
    const booleanSetterFunction = (value: boolean) => {
      formMethods.setValue(booleanFieldName, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    setBooleanFieldValues.set(booleanFieldName, booleanSetterFunction);
  }

  console.log(
    '✅ [DYNAMIC_FIELD_SETTERS] 동적 타입별 필드 설정기 생성 완료 (타입단언 제거):',
    {
      stringSetters: setStringFieldValues.size,
      arraySetters: setArrayFieldValues.size,
      nullableSetters: setNullableStringFieldValues.size,
      booleanSetters: setBooleanFieldValues.size,
    }
  );

  return {
    setStringFieldValues,
    setArrayFieldValues,
    setNullableStringFieldValues,
    setBooleanFieldValues,
  };
};

// 🔧 폼 상태 훅 생성 함수
export const createMultiStepFormStateHook = () => {
  console.log('🔧 [HOOK_FACTORY] MultiStepFormState 훅 팩토리 시작');

  const useMultiStepFormState = () => {
    console.log('🔧 [USE_FORM_STATE] useMultiStepFormState 훅 시작');

    // 동적으로 FormSchemaValues 타입 기본값 로드
    const defaultFormSchemaValues = getDefaultFormSchemaValues();
    console.log(
      '🔧 [USE_FORM_STATE] 동적 FormSchemaValues 타입 기본값 로드 완료:',
      {
        fieldsCount: Object.keys(defaultFormSchemaValues).length,
      }
    );

    // React Hook Form 설정
    const formMethods = useForm<FormSchemaValues>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultFormSchemaValues,
      mode: 'onChange',
    });

    console.log('🔧 [USE_FORM_STATE] React Hook Form 초기화 완료');

    // 동적 유틸리티 생성
    const fieldTypeMap = createDynamicFormSchemaFieldTypeMap();
    const fieldReturners = createTypedFieldValueReturners();
    const fieldSetters = createDynamicTypedFieldValueSetters(formMethods);

    // 현재 폼 값들을 안전하게 가져오는 함수
    const getCurrentFormValuesSafely = (): FormSchemaValues => {
      console.log('🔧 [GET_CURRENT_VALUES] 현재 폼 값 안전 추출 시작');

      try {
        const currentRawValues = formMethods.getValues();
        console.log('🔧 [GET_CURRENT_VALUES] getValues() 호출 성공');

        const safelyExtractedValues =
          extractFormSchemaValuesSafely(currentRawValues);

        console.log('✅ [GET_CURRENT_VALUES] 현재 폼 값 안전 추출 완료');
        return safelyExtractedValues;
      } catch (getCurrentValuesError) {
        console.error(
          '❌ [GET_CURRENT_VALUES] getValues() 호출 실패:',
          getCurrentValuesError
        );
        return defaultFormSchemaValues;
      }
    };

    // 타입 단언 완전 제거된 특정 필드 값 추출 함수
    const getFieldValueSafely = <K extends keyof FormSchemaValues>(
      fieldName: K
    ) => {
      console.log('🔧 [GET_FIELD_VALUE] 필드 값 안전 추출:', fieldName);

      try {
        const allCurrentValues = formMethods.getValues();
        console.log('🔧 [GET_FIELD_VALUE] getValues() 호출 성공');

        const safeExtractedValues =
          extractFormSchemaValuesSafely(allCurrentValues);
        const extractedFieldValue = Reflect.get(safeExtractedValues, fieldName);

        // 구체적 타입별 분기 처리 (타입 단언 완전 제거)
        const isStringField = fieldTypeMap.stringFieldsSet.has(fieldName);
        const isArrayField = fieldTypeMap.arrayFieldsSet.has(fieldName);
        const isNullableField =
          fieldTypeMap.nullableStringFieldsSet.has(fieldName);
        const isBooleanField = fieldTypeMap.booleanFieldsSet.has(fieldName);

        if (isStringField) {
          const stringValue =
            fieldReturners.returnStringFieldValue(extractedFieldValue);
          console.log(
            '✅ [GET_FIELD_VALUE] 문자열 필드 값 추출 완료:',
            fieldName
          );
          return stringValue;
        }

        if (isArrayField) {
          const arrayValue =
            fieldReturners.returnArrayFieldValue(extractedFieldValue);
          console.log(
            '✅ [GET_FIELD_VALUE] 배열 필드 값 추출 완료:',
            fieldName
          );
          return arrayValue;
        }

        if (isNullableField) {
          const nullableValue =
            fieldReturners.returnNullableStringFieldValue(extractedFieldValue);
          console.log(
            '✅ [GET_FIELD_VALUE] nullable 필드 값 추출 완료:',
            fieldName
          );
          return nullableValue;
        }

        if (isBooleanField) {
          const booleanValue =
            fieldReturners.returnBooleanFieldValue(extractedFieldValue);
          console.log(
            '✅ [GET_FIELD_VALUE] 불린 필드 값 추출 완료:',
            fieldName
          );
          return booleanValue;
        }

        // fallback: 직접 반환 (타입 단언 없이)
        console.log(
          '⚠️ [GET_FIELD_VALUE] 알 수 없는 필드 타입, 직접 반환:',
          fieldName
        );
        return extractedFieldValue;
      } catch (getFieldError) {
        console.error(
          '❌ [GET_FIELD_VALUE] 필드 값 추출 실패:',
          fieldName,
          getFieldError
        );

        const fallbackValue = Reflect.get(defaultFormSchemaValues, fieldName);
        return fallbackValue;
      }
    };

    // 타입 단언 완전 제거된 필드 값 설정 함수
    const setFieldValueSafely = <K extends keyof FormSchemaValues>(
      fieldName: K,
      newFieldValue: FormSchemaValues[K]
    ): void => {
      console.log('🔧 [SET_FIELD_VALUE] 필드 값 안전 설정:', fieldName);

      try {
        // Map 기반 구체적 타입별 분기 처리 (타입 단언 없이)
        const isStringField = fieldTypeMap.stringFieldsSet.has(fieldName);
        const isArrayField = fieldTypeMap.arrayFieldsSet.has(fieldName);
        const isNullableField =
          fieldTypeMap.nullableStringFieldsSet.has(fieldName);
        const isBooleanField = fieldTypeMap.booleanFieldsSet.has(fieldName);

        if (isStringField && typeof newFieldValue === 'string') {
          const stringFieldSetter =
            fieldSetters.setStringFieldValues.get(fieldName);
          const isValidSetter = stringFieldSetter !== undefined;

          if (isValidSetter) {
            stringFieldSetter(newFieldValue);
            console.log(
              '✅ [SET_FIELD_VALUE] 문자열 필드 값 설정 완료:',
              fieldName
            );
          }
          return;
        }

        if (isArrayField && Array.isArray(newFieldValue)) {
          const arrayFieldSetter =
            fieldSetters.setArrayFieldValues.get(fieldName);
          const isValidSetter = arrayFieldSetter !== undefined;

          if (isValidSetter) {
            arrayFieldSetter(newFieldValue);
            console.log(
              '✅ [SET_FIELD_VALUE] 배열 필드 값 설정 완료:',
              fieldName
            );
          }
          return;
        }

        if (
          isNullableField &&
          (newFieldValue === null || typeof newFieldValue === 'string')
        ) {
          const nullableFieldSetter =
            fieldSetters.setNullableStringFieldValues.get(fieldName);
          const isValidSetter = nullableFieldSetter !== undefined;

          if (isValidSetter) {
            nullableFieldSetter(newFieldValue);
            console.log(
              '✅ [SET_FIELD_VALUE] nullable 필드 값 설정 완료:',
              fieldName
            );
          }
          return;
        }

        if (isBooleanField && typeof newFieldValue === 'boolean') {
          const booleanFieldSetter =
            fieldSetters.setBooleanFieldValues.get(fieldName);
          const isValidSetter = booleanFieldSetter !== undefined;

          if (isValidSetter) {
            booleanFieldSetter(newFieldValue);
            console.log(
              '✅ [SET_FIELD_VALUE] 불린 필드 값 설정 완료:',
              fieldName
            );
          }
          return;
        }

        console.log(
          '⚠️ [SET_FIELD_VALUE] 알 수 없는 필드 타입 또는 값:',
          fieldName
        );
      } catch (setFieldError) {
        console.error(
          '❌ [SET_FIELD_VALUE] 필드 값 설정 실패:',
          fieldName,
          setFieldError
        );
      }
    };

    // 폼을 기본값으로 초기화하는 함수
    const resetFormSafely = (): void => {
      console.log('🔄 [RESET_FORM] 폼 안전 초기화 시작');

      try {
        const currentDefaultValues = getDefaultFormSchemaValues();
        formMethods.reset(currentDefaultValues);
        console.log('✅ [RESET_FORM] 폼 안전 초기화 완료');
      } catch (resetFormError) {
        console.error('❌ [RESET_FORM] 폼 초기화 실패:', resetFormError);
      }
    };

    // 폼 유효성 검사를 안전하게 수행하는 함수
    const validateFormSafely = async (): Promise<boolean> => {
      console.log('🔍 [VALIDATE_FORM] 폼 안전 검증 시작');

      try {
        const isFormValid = await formMethods.trigger();
        console.log('✅ [VALIDATE_FORM] 폼 안전 검증 완료:', isFormValid);
        return isFormValid;
      } catch (validateFormError) {
        console.error('❌ [VALIDATE_FORM] 폼 검증 실패:', validateFormError);
        return false;
      }
    };

    // 특정 필드들만 검증하는 함수
    const validateSpecificFieldsSafely = async (
      fieldNames: (keyof FormSchemaValues)[]
    ): Promise<boolean> => {
      console.log(
        '🔍 [VALIDATE_FIELDS] 특정 필드 검증 시작:',
        fieldNames.length
      );

      try {
        const validationPromises: Promise<boolean>[] = [];

        for (const currentFieldName of fieldNames) {
          const validationPromise = formMethods.trigger(currentFieldName);
          validationPromises.push(validationPromise);
        }

        const validationResults = await Promise.all(validationPromises);

        let areAllFieldsValid = true;
        for (
          let resultIndex = 0;
          resultIndex < validationResults.length;
          resultIndex++
        ) {
          const currentResult = validationResults[resultIndex];
          const currentFieldName = fieldNames[resultIndex];

          console.log(
            '🔍 [VALIDATE_FIELDS] 필드 검증 결과:',
            currentFieldName,
            currentResult
          );

          if (!currentResult) {
            areAllFieldsValid = false;
          }
        }

        console.log(
          '✅ [VALIDATE_FIELDS] 특정 필드 검증 완료:',
          areAllFieldsValid
        );
        return areAllFieldsValid;
      } catch (validateFieldsError) {
        console.error(
          '❌ [VALIDATE_FIELDS] 특정 필드 검증 실패:',
          validateFieldsError
        );
        return false;
      }
    };

    // 동적 폼 에러 상태 확인 함수 (타입단언 완전 제거)
    const getFormErrorsSafely = (): Partial<
      Record<keyof FormSchemaValues, string>
    > => {
      console.log(
        '🔧 [GET_ERRORS] 동적 폼 에러 안전 추출 시작 (타입단언 제거)'
      );

      try {
        const currentFormErrors = formMethods.formState.errors;
        const processedErrors: Partial<Record<keyof FormSchemaValues, string>> =
          {};

        // 동적으로 모든 필드명 가져오기 (타입단언 제거)
        const rawAllFieldNames = getAllFieldNames();
        const validatedFormFieldNames =
          fieldTypeMap.keysValidator.validateAndConvertToFormSchemaKeys(
            rawAllFieldNames
          );

        for (const currentFieldName of validatedFormFieldNames) {
          const fieldError = Reflect.get(currentFormErrors, currentFieldName);
          const hasFieldError = fieldError && typeof fieldError === 'object';

          if (hasFieldError) {
            const errorMessage = Reflect.get(fieldError, 'message');
            const isValidErrorMessage = typeof errorMessage === 'string';

            if (isValidErrorMessage) {
              Reflect.set(processedErrors, currentFieldName, errorMessage);
            }
          }
        }

        console.log(
          '✅ [GET_ERRORS] 동적 폼 에러 안전 추출 완료 (타입단언 제거):',
          {
            errorCount: Object.keys(processedErrors).length,
            totalFields: validatedFormFieldNames.length,
          }
        );

        return processedErrors;
      } catch (getErrorsException) {
        console.error('❌ [GET_ERRORS] 폼 에러 추출 실패:', getErrorsException);
        return {};
      }
    };

    console.log(
      '🔧 [USE_FORM_STATE] useMultiStepFormState 훅 완료 (타입단언 완전 제거)'
    );

    return {
      // React Hook Form 메서드들
      ...formMethods,

      // 커스텀 안전 메서드들 (타입단언 완전 제거)
      getCurrentFormValuesSafely,
      getFieldValueSafely,
      setFieldValueSafely,
      resetFormSafely,
      validateFormSafely,
      validateSpecificFieldsSafely,
      getFormErrorsSafely,
    };
  };

  console.log(
    '✅ [HOOK_FACTORY] MultiStepFormState 훅 팩토리 완료 (타입단언 완전 제거)'
  );
  return useMultiStepFormState;
};

// 실제 훅 생성
const useMultiStepFormState = createMultiStepFormStateHook();

export { useMultiStepFormState };

// 기본 내보내기
export default useMultiStepFormState;
