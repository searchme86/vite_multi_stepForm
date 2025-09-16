// 📁 components/multiStepForm/types/formTypes.ts

import * as z from 'zod';
import { formSchema } from '../schema/formSchema';

// 🔧 **통합된 FormValues 타입을 commonTypes에서 import** (중복 제거)
import type { FormValues } from '../../../store/shared/commonTypes';

// 🔧 **FormValues 관련 유틸리티들도 import** (편의성)
import {
  isValidFormValues,
  createFormValuesTypeGuards,
  createFormValuesConverters,
  createFormValuesUtilities,
} from '../../../store/shared/commonTypes';

// 🔧 **FormValues 타입 re-export** (외부에서 사용할 수 있도록)
export type { FormValues };

// 🔧 **유틸리티 함수들 re-export**
export {
  isValidFormValues,
  createFormValuesTypeGuards,
  createFormValuesConverters,
  createFormValuesUtilities,
};

// ✅ 기존 Zod 관련 타입들은 유지 (스키마 검증용)
export type FormSchemaValues = z.infer<typeof formSchema>;

// ✅ 기본 스키마 export 유지 (하위 호환성)
export default formSchema;

// 🔧 **FormValues와 FormSchemaValues 간 변환 유틸리티 추가**
export const createFormValuesSchemaUtils = () => {
  console.log('🔧 [FORM_TYPES] FormValues-Schema 변환 유틸리티 생성');

  const convertSchemaToFormValues = (
    schemaValues: FormSchemaValues
  ): Partial<FormValues> => {
    console.log('🔄 [FORM_TYPES] Schema → FormValues 변환 시작');

    // 구조분해할당으로 schema 값들 안전하게 추출
    const {
      userImage = '',
      nickname = '',
      emailPrefix = '',
      emailDomain = '',
      bio = '',
      title = '',
      description = '',
      tags = '',
      content = '',
      media = [],
      mainImage = null,
      sliderImages = [],
      editorCompletedContent = '',
      isEditorCompleted = false,
    } = schemaValues || {};

    // FormValues 형태로 변환
    const convertedFormValues: Partial<FormValues> = {
      userImage: typeof userImage === 'string' ? userImage : '',
      nickname: typeof nickname === 'string' ? nickname : '',
      emailPrefix: typeof emailPrefix === 'string' ? emailPrefix : '',
      emailDomain: typeof emailDomain === 'string' ? emailDomain : '',
      bio: typeof bio === 'string' ? bio : '',
      title: typeof title === 'string' ? title : '',
      description: typeof description === 'string' ? description : '',
      tags: typeof tags === 'string' ? tags : '',
      content: typeof content === 'string' ? content : '',
      media: Array.isArray(media) ? media : [],
      mainImage:
        mainImage === null || typeof mainImage === 'string' ? mainImage : null,
      sliderImages: Array.isArray(sliderImages) ? sliderImages : [],
      editorCompletedContent:
        typeof editorCompletedContent === 'string'
          ? editorCompletedContent
          : '',
      isEditorCompleted:
        typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false,
    };

    console.log('✅ [FORM_TYPES] Schema → FormValues 변환 완료:', {
      nickname: convertedFormValues.nickname,
      title: convertedFormValues.title,
      hasContent: (convertedFormValues.content || '').length > 0,
    });

    return convertedFormValues;
  };

  const convertFormValuesToSchema = (
    formValues: FormValues
  ): Partial<FormSchemaValues> => {
    console.log('🔄 [FORM_TYPES] FormValues → Schema 변환 시작');

    // 구조분해할당으로 FormValues 안전하게 추출
    const {
      userImage = '',
      nickname = '',
      emailPrefix = '',
      emailDomain = '',
      bio = '',
      title = '',
      description = '',
      tags = '',
      content = '',
      media = [],
      mainImage = null,
      sliderImages = [],
      editorCompletedContent = '',
      isEditorCompleted = false,
    } = formValues || {};

    // Schema 형태로 변환
    const convertedSchemaValues: Partial<FormSchemaValues> = {
      userImage: typeof userImage === 'string' ? userImage : '',
      nickname: typeof nickname === 'string' ? nickname : '',
      emailPrefix: typeof emailPrefix === 'string' ? emailPrefix : '',
      emailDomain: typeof emailDomain === 'string' ? emailDomain : '',
      bio: typeof bio === 'string' ? bio : '',
      title: typeof title === 'string' ? title : '',
      description: typeof description === 'string' ? description : '',
      tags: typeof tags === 'string' ? tags : '',
      content: typeof content === 'string' ? content : '',
      media: Array.isArray(media) ? media : [],
      mainImage:
        mainImage === null || typeof mainImage === 'string' ? mainImage : null,
      sliderImages: Array.isArray(sliderImages) ? sliderImages : [],
      editorCompletedContent:
        typeof editorCompletedContent === 'string'
          ? editorCompletedContent
          : '',
      isEditorCompleted:
        typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false,
    };

    console.log('✅ [FORM_TYPES] FormValues → Schema 변환 완료:', {
      nickname: convertedSchemaValues.nickname,
      title: convertedSchemaValues.title,
      hasContent: (convertedSchemaValues.content || '').length > 0,
    });

    return convertedSchemaValues;
  };

  const validateFormValuesWithSchema = (formValues: unknown): boolean => {
    console.log('🔍 [FORM_TYPES] FormValues 스키마 검증 시작');

    try {
      // Early Return: formValues가 없는 경우
      if (!formValues || typeof formValues !== 'object') {
        console.log('❌ [FORM_TYPES] FormValues가 객체가 아님');
        return false;
      }

      // Zod 스키마로 검증 시도
      const validationResult = formSchema.safeParse(formValues);
      const isValidSchema = validationResult.success;

      if (!isValidSchema) {
        console.log('❌ [FORM_TYPES] 스키마 검증 실패:', {
          errorCount: validationResult.error?.errors?.length || 0,
        });
        return false;
      }

      console.log('✅ [FORM_TYPES] 스키마 검증 성공');
      return true;
    } catch (validationError) {
      console.error('❌ [FORM_TYPES] 스키마 검증 중 오류:', validationError);
      return false;
    }
  };

  const parseFormValuesWithSchema = (
    formValues: unknown
  ): FormSchemaValues | null => {
    console.log('🔄 [FORM_TYPES] FormValues 스키마 파싱 시작');

    try {
      // Early Return: formValues가 없는 경우
      if (!formValues || typeof formValues !== 'object') {
        console.log('❌ [FORM_TYPES] 파싱할 수 없는 입력');
        return null;
      }

      // Zod 스키마로 파싱 시도
      const parsingResult = formSchema.safeParse(formValues);
      const isParsedSuccessfully = parsingResult.success;

      if (!isParsedSuccessfully) {
        console.log('❌ [FORM_TYPES] 스키마 파싱 실패:', {
          errorCount: parsingResult.error?.errors?.length || 0,
        });
        return null;
      }

      const parsedData = parsingResult.data;

      console.log('✅ [FORM_TYPES] 스키마 파싱 성공:', {
        nickname: parsedData.nickname,
        title: parsedData.title,
      });

      return parsedData;
    } catch (parsingError) {
      console.error('❌ [FORM_TYPES] 스키마 파싱 중 오류:', parsingError);
      return null;
    }
  };

  console.log('✅ [FORM_TYPES] FormValues-Schema 변환 유틸리티 생성 완료');

  return {
    convertSchemaToFormValues,
    convertFormValuesToSchema,
    validateFormValuesWithSchema,
    parseFormValuesWithSchema,
  };
};

// 🔧 **타입 호환성 검증 유틸리티**
export const createTypeCompatibilityUtils = () => {
  console.log('🔧 [FORM_TYPES] 타입 호환성 유틸리티 생성');

  const checkFormValuesCompatibility = (candidate: unknown): boolean => {
    console.log('🔍 [FORM_TYPES] FormValues 호환성 검증 시작');

    // Early Return: 기본 객체 타입 검증
    const isObjectType = candidate !== null && typeof candidate === 'object';
    if (!isObjectType) {
      console.log('❌ [FORM_TYPES] 후보가 객체가 아님');
      return false;
    }

    // 🔧 안전한 객체 속성 검사를 위한 헬퍼
    const hasPropertySafely = (
      targetObject: unknown,
      propertyName: string
    ): boolean => {
      const isValidObject =
        targetObject !== null && typeof targetObject === 'object';
      if (!isValidObject) {
        return false;
      }

      return propertyName in targetObject;
    };

    // 필수 필드들 존재 여부 검증
    const requiredFormFields = [
      'nickname',
      'emailPrefix',
      'emailDomain',
      'title',
      'description',
      'content',
    ];

    const hasAllRequiredFields = requiredFormFields.every((fieldName) => {
      const hasField = hasPropertySafely(candidate, fieldName);
      return hasField;
    });

    if (!hasAllRequiredFields) {
      console.log('❌ [FORM_TYPES] 필수 필드 누락');
      return false;
    }

    console.log('✅ [FORM_TYPES] FormValues 호환성 검증 완료');
    return true;
  };

  const normalizeToFormValuesStructure = (
    rawData: unknown
  ): Partial<FormValues> => {
    console.log('🔄 [FORM_TYPES] FormValues 구조로 정규화 시작');

    // Early Return: 유효하지 않은 입력
    const isCompatible = checkFormValuesCompatibility(rawData);
    if (!isCompatible) {
      console.log('⚠️ [FORM_TYPES] 호환되지 않는 데이터, 빈 객체 반환');
      return {};
    }

    // 🔧 타입 가드를 통한 안전한 객체 접근
    const createSafeObjectAccessor = (targetObject: unknown) => {
      const isValidObjectType =
        targetObject !== null && typeof targetObject === 'object';
      if (!isValidObjectType) {
        return null;
      }

      return {
        getProperty: (propertyName: string): unknown => {
          return Reflect.get(targetObject, propertyName);
        },
        hasProperty: (propertyName: string): boolean => {
          return propertyName in targetObject;
        },
      };
    };

    const objectAccessor = createSafeObjectAccessor(rawData);
    if (!objectAccessor) {
      console.log('❌ [FORM_TYPES] 객체 접근자 생성 실패');
      return {};
    }

    // 각 필드를 안전하게 추출하고 타입 변환
    const extractStringField = (
      fieldName: string,
      fallbackValue: string
    ): string => {
      const fieldValue = objectAccessor.getProperty(fieldName);
      return typeof fieldValue === 'string' ? fieldValue : fallbackValue;
    };

    const extractBooleanField = (
      fieldName: string,
      fallbackValue: boolean
    ): boolean => {
      const fieldValue = objectAccessor.getProperty(fieldName);
      return typeof fieldValue === 'boolean' ? fieldValue : fallbackValue;
    };

    const extractStringArrayField = (fieldName: string): string[] => {
      const fieldValue = objectAccessor.getProperty(fieldName);
      const isValidArray = Array.isArray(fieldValue);

      if (!isValidArray) {
        return [];
      }

      const stringItems = fieldValue.filter((item: unknown): item is string => {
        return typeof item === 'string';
      });

      return stringItems;
    };

    const extractStringOrNullField = (fieldName: string): string | null => {
      const fieldValue = objectAccessor.getProperty(fieldName);

      if (fieldValue === null) {
        return null;
      }

      return typeof fieldValue === 'string' ? fieldValue : null;
    };

    const normalizedFormValues: Partial<FormValues> = {
      userImage: extractStringField('userImage', ''),
      nickname: extractStringField('nickname', ''),
      emailPrefix: extractStringField('emailPrefix', ''),
      emailDomain: extractStringField('emailDomain', ''),
      bio: extractStringField('bio', ''),
      title: extractStringField('title', ''),
      description: extractStringField('description', ''),
      tags: extractStringField('tags', ''),
      content: extractStringField('content', ''),
      media: extractStringArrayField('media'),
      mainImage: extractStringOrNullField('mainImage'),
      sliderImages: extractStringArrayField('sliderImages'),
      editorCompletedContent: extractStringField('editorCompletedContent', ''),
      isEditorCompleted: extractBooleanField('isEditorCompleted', false),
    };

    console.log('✅ [FORM_TYPES] FormValues 구조로 정규화 완료:', {
      fieldsCount: Object.keys(normalizedFormValues).length,
      nickname: normalizedFormValues.nickname,
      title: normalizedFormValues.title,
    });

    return normalizedFormValues;
  };

  console.log('✅ [FORM_TYPES] 타입 호환성 유틸리티 생성 완료');

  return {
    checkFormValuesCompatibility,
    normalizeToFormValuesStructure,
  };
};

// 🔧 **메인 유틸리티 팩토리 함수**
export const createFormTypesUtilities = () => {
  console.log('🏭 [FORM_TYPES] FormTypes 유틸리티 팩토리 생성');

  const schemaUtils = createFormValuesSchemaUtils();
  const compatibilityUtils = createTypeCompatibilityUtils();

  console.log('✅ [FORM_TYPES] FormTypes 유틸리티 팩토리 생성 완료');

  return {
    ...schemaUtils,
    ...compatibilityUtils,
  };
};

console.log('📄 [FORM_TYPES] formTypes 모듈 로드 완료');
console.log('🔧 [FORM_TYPES] 통합된 FormValues 타입 사용');
console.log('📊 [FORM_TYPES] 제공 기능:', {
  typeReExport: 'FormValues 타입 re-export',
  schemaConversion: 'Schema ↔ FormValues 변환',
  compatibility: '타입 호환성 검증',
  normalization: '데이터 정규화',
});
