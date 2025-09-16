// src/components/multiStepForm/reactHookForm/actions/useFormSubmit.ts

import { useCallback } from 'react';
import type { FormSchemaValues } from '../../types/formTypes';
import {
  getAllFieldNames,
  getEmailFields,
  getBooleanFields,
  getArrayFields,
  getStringFields,
} from '../../utils/formFieldsLoader.ts';

// 🔧 토스트 옵션
interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'info';
}

// 🔧 Props 인터페이스
interface UseFormSubmitProps {
  addToast: (options: ToastOptions) => void;
}

// 🔧 검증 결과
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 🔧 이미지 최적화 결과
interface ImageOptimizationResult {
  optimizedValue: string | string[] | null;
  wasOptimized: boolean;
  originalSize: number;
  optimizedSize: number;
}

// 🚀 동적 필드 그룹 생성
const createFieldGroupValidators = () => {
  const allFields = getAllFieldNames();
  const emailFields = getEmailFields();
  const booleanFields = getBooleanFields();
  const arrayFields = getArrayFields();
  const stringFields = getStringFields();

  console.log('🔧 useFormSubmit: 필드 그룹 생성 완료', {
    totalFields: allFields.length,
    emailFields: emailFields.length,
    booleanFields: booleanFields.length,
    arrayFields: arrayFields.length,
    stringFields: stringFields.length,
  });

  return {
    allFieldsSet: new Set(allFields),
    emailFieldsSet: new Set(emailFields),
    booleanFieldsSet: new Set(booleanFields),
    arrayFieldsSet: new Set(arrayFields),
    stringFieldsSet: new Set(stringFields),

    isEmailField: (fieldName: string): boolean =>
      new Set(emailFields).has(fieldName),
    isBooleanField: (fieldName: string): boolean =>
      new Set(booleanFields).has(fieldName),
    isArrayField: (fieldName: string): boolean =>
      new Set(arrayFields).has(fieldName),
    isStringField: (fieldName: string): boolean =>
      new Set(stringFields).has(fieldName),
  };
};

const FIELD_VALIDATORS = createFieldGroupValidators();

// 🚀 필드 값 조회 - Reflect 기반
const getFieldValue = (
  formData: FormSchemaValues,
  fieldName: string
): unknown => {
  return Reflect.get(formData, fieldName);
};

// 🚀 문자열 필드 검증 - 실무형
const validateStringField = (
  fieldName: string,
  fieldValue: unknown
): { isValid: boolean; error?: string } => {
  if (!FIELD_VALIDATORS.isStringField(fieldName)) {
    return { isValid: true };
  }

  if (typeof fieldValue !== 'string') {
    return {
      isValid: false,
      error: `${fieldName} 필드는 문자열이어야 합니다`,
    };
  }

  const trimmedValue = fieldValue.trim();

  if (trimmedValue === '') {
    return {
      isValid: false,
      error: `${fieldName} 필드가 필요합니다`,
    };
  }

  // 실무형 길이 검증
  const maxLength =
    fieldName === 'bio' || fieldName === 'description' ? 1000 : 200;

  if (trimmedValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} 필드가 너무 깁니다 (최대 ${maxLength}자)`,
    };
  }

  return { isValid: true };
};

// 🚀 이메일 필드 검증 - 동적 그룹 기반
const validateEmailFields = (
  formData: FormSchemaValues
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  console.log('📧 useFormSubmit: 이메일 필드 검증 시작');

  const errors: string[] = [];
  const warnings: string[] = [];
  const emailFields = Array.from(FIELD_VALIDATORS.emailFieldsSet);

  if (emailFields.length === 0) {
    console.log('📧 useFormSubmit: 이메일 필드 없음');
    return { isValid: true, errors, warnings };
  }

  const emailValues = new Map<string, string>();

  // 이메일 필드 값 수집
  emailFields.forEach((fieldName) => {
    const fieldValue = getFieldValue(formData, fieldName);
    const stringValue = typeof fieldValue === 'string' ? fieldValue.trim() : '';
    emailValues.set(fieldName, stringValue);
  });

  // 이메일 조합 검증
  const prefixFields = emailFields.filter((field) =>
    field.toLowerCase().includes('prefix')
  );
  const domainFields = emailFields.filter((field) =>
    field.toLowerCase().includes('domain')
  );

  prefixFields.forEach((prefixField) => {
    const prefixValue = emailValues.get(prefixField) || '';

    if (prefixValue !== '') {
      // @ 포함 여부 검증
      if (prefixValue.includes('@')) {
        errors.push(`${prefixField}에는 @를 포함하지 마세요`);
      }

      // 길이 검증
      if (prefixValue.length < 2) {
        warnings.push(`${prefixField}이 너무 짧습니다`);
      } else if (prefixValue.length > 64) {
        errors.push(`${prefixField}이 너무 깁니다 (최대 64자)`);
      }

      // 도메인 필드 확인
      const hasMatchingDomain = domainFields.some((domainField) => {
        const domainValue = emailValues.get(domainField) || '';
        return domainValue.trim() !== '';
      });

      if (!hasMatchingDomain) {
        warnings.push(`${prefixField}에 대응하는 도메인이 누락되었습니다`);
      }
    }
  });

  domainFields.forEach((domainField) => {
    const domainValue = emailValues.get(domainField) || '';

    if (domainValue !== '') {
      // @ 포함 여부 검증
      if (domainValue.includes('@')) {
        errors.push(`${domainField}에는 @를 포함하지 마세요`);
      }

      // 길이 검증
      if (domainValue.length < 3) {
        warnings.push(`${domainField}이 너무 짧습니다`);
      } else if (domainValue.length > 253) {
        errors.push(`${domainField}이 너무 깁니다 (최대 253자)`);
      }

      // 프리픽스 필드 확인
      const hasMatchingPrefix = prefixFields.some((prefixField) => {
        const prefixValue = emailValues.get(prefixField) || '';
        return prefixValue.trim() !== '';
      });

      if (!hasMatchingPrefix) {
        warnings.push(`${domainField}에 대응하는 아이디가 누락되었습니다`);
      }
    }
  });

  console.log('✅ useFormSubmit: 이메일 필드 검증 완료', {
    errors: errors.length,
    warnings: warnings.length,
  });
  return { isValid: errors.length === 0, errors, warnings };
};

// 🚀 불린 필드 검증 - 동적 그룹 기반
const validateBooleanFields = (
  formData: FormSchemaValues
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  console.log('🔘 useFormSubmit: 불린 필드 검증 시작');

  const errors: string[] = [];
  const warnings: string[] = [];
  const booleanFields = Array.from(FIELD_VALIDATORS.booleanFieldsSet);

  booleanFields.forEach((fieldName) => {
    const fieldValue = getFieldValue(formData, fieldName);

    if (typeof fieldValue !== 'boolean') {
      errors.push(`${fieldName} 필드는 불린 값이어야 합니다`);
      return;
    }

    // 에디터 완료 상태 특별 처리
    if (fieldName === 'isEditorCompleted') {
      if (fieldValue) {
        // 에디터 완료 시 내용 존재 여부 확인
        const editorContentFields = ['editorCompletedContent', 'content'];
        const hasContent = editorContentFields.some((contentField) => {
          if (FIELD_VALIDATORS.allFieldsSet.has(contentField)) {
            const contentValue = getFieldValue(formData, contentField);
            return (
              typeof contentValue === 'string' && contentValue.trim() !== ''
            );
          }
          return false;
        });

        if (!hasContent) {
          warnings.push('에디터 완료 상태이지만 내용이 없습니다');
        }
      }
    }
  });

  console.log('✅ useFormSubmit: 불린 필드 검증 완료', {
    errors: errors.length,
    warnings: warnings.length,
  });
  return { isValid: errors.length === 0, errors, warnings };
};

// 🚀 배열 필드 검증 - 동적 그룹 기반
const validateArrayFields = (
  formData: FormSchemaValues
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  console.log('📋 useFormSubmit: 배열 필드 검증 시작');

  const errors: string[] = [];
  const warnings: string[] = [];
  const arrayFields = Array.from(FIELD_VALIDATORS.arrayFieldsSet);

  arrayFields.forEach((fieldName) => {
    const fieldValue = getFieldValue(formData, fieldName);

    if (!Array.isArray(fieldValue)) {
      errors.push(`${fieldName} 필드는 배열이어야 합니다`);
      return;
    }

    // 배열 항목 타입 검증 (현재는 문자열 배열로 가정)
    const invalidItems = fieldValue.filter((item) => typeof item !== 'string');

    if (invalidItems.length > 0) {
      warnings.push(
        `${fieldName} 배열에 문자열이 아닌 항목이 있습니다 (${invalidItems.length}개)`
      );
    }

    // 배열 크기 제한
    const maxArraySize =
      fieldName.includes('media') || fieldName.includes('slider') ? 10 : 50;

    if (fieldValue.length > maxArraySize) {
      warnings.push(`${fieldName} 배열이 너무 큽니다 (최대 ${maxArraySize}개)`);
    }
  });

  console.log('✅ useFormSubmit: 배열 필드 검증 완료', {
    errors: errors.length,
    warnings: warnings.length,
  });
  return { isValid: errors.length === 0, errors, warnings };
};

// 🚀 폼 데이터 검증 - 완전 동적화
const validateFormSubmission = (data: FormSchemaValues): ValidationResult => {
  console.log('📋 useFormSubmit: 폼 검증 시작');

  let allErrors: string[] = [];
  let allWarnings: string[] = [];

  // 1. 모든 필드 기본 검증
  const allFields = getAllFieldNames();

  allFields.forEach((fieldName) => {
    const fieldValue = getFieldValue(data, fieldName);

    // 문자열 필드 검증
    if (FIELD_VALIDATORS.isStringField(fieldName)) {
      const stringValidation = validateStringField(fieldName, fieldValue);
      if (!stringValidation.isValid && stringValidation.error) {
        allErrors.push(stringValidation.error);
      }
    }
  });

  // 2. 이메일 필드 검증
  const emailValidation = validateEmailFields(data);
  allErrors.push(...emailValidation.errors);
  allWarnings.push(...emailValidation.warnings);

  // 3. 불린 필드 검증
  const booleanValidation = validateBooleanFields(data);
  allErrors.push(...booleanValidation.errors);
  allWarnings.push(...booleanValidation.warnings);

  // 4. 배열 필드 검증
  const arrayValidation = validateArrayFields(data);
  allErrors.push(...arrayValidation.errors);
  allWarnings.push(...arrayValidation.warnings);

  const validationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };

  console.log('✅ useFormSubmit: 폼 검증 완료', {
    isValid: validationResult.isValid,
    errorCount: allErrors.length,
    warningCount: allWarnings.length,
  });

  return validationResult;
};

// 🚀 이미지 데이터 최적화 - 실무형
const optimizeImageData = (
  imageData: unknown,
  fieldName: string,
  maxSizeKB: number = 200
): ImageOptimizationResult => {
  const maxSizeBytes = maxSizeKB * 1000;

  // null 체크
  if (imageData === null || imageData === undefined) {
    return {
      optimizedValue: null,
      wasOptimized: false,
      originalSize: 0,
      optimizedSize: 0,
    };
  }

  // string 타입 처리
  if (typeof imageData === 'string') {
    const originalSize = imageData.length;
    const optimizedValue = originalSize <= maxSizeBytes ? imageData : '';

    console.log(`🖼️ useFormSubmit: ${fieldName} 이미지 최적화`, {
      originalSize,
      optimizedSize: optimizedValue.length,
      wasOptimized: originalSize > maxSizeBytes,
    });

    return {
      optimizedValue,
      wasOptimized: originalSize > maxSizeBytes,
      originalSize,
      optimizedSize: optimizedValue.length,
    };
  }

  // array 타입 처리
  if (Array.isArray(imageData)) {
    const validImages = imageData.filter((item): item is string => {
      return typeof item === 'string' && item.length <= maxSizeBytes;
    });

    const originalSize = imageData.length;
    const optimizedSize = validImages.length;

    console.log(`📸 useFormSubmit: ${fieldName} 이미지 배열 최적화`, {
      originalCount: originalSize,
      optimizedCount: optimizedSize,
      wasOptimized: originalSize !== optimizedSize,
    });

    return {
      optimizedValue: validImages,
      wasOptimized: originalSize !== optimizedSize,
      originalSize,
      optimizedSize,
    };
  }

  // 기타 타입 처리
  console.log(
    `⚠️ useFormSubmit: ${fieldName} 알 수 없는 타입`,
    typeof imageData
  );
  return {
    optimizedValue: null,
    wasOptimized: true,
    originalSize: 0,
    optimizedSize: 0,
  };
};

// 🚀 제출 데이터 최적화 - 동적 필드 기반
const optimizeSubmissionData = (data: FormSchemaValues): FormSchemaValues => {
  console.log('⚡ useFormSubmit: 데이터 최적화 시작');

  const optimized = { ...data };
  const arrayFields = Array.from(FIELD_VALIDATORS.arrayFieldsSet);
  const stringFields = Array.from(FIELD_VALIDATORS.stringFieldsSet);

  // 이미지 관련 필드 식별 및 최적화
  const imageFieldPatterns = ['image', 'media', 'slider'];

  stringFields.forEach((fieldName) => {
    const isImageField = imageFieldPatterns.some((pattern) =>
      fieldName.toLowerCase().includes(pattern)
    );

    if (isImageField) {
      const fieldValue = getFieldValue(data, fieldName);
      const optimization = optimizeImageData(fieldValue, fieldName);

      if (optimization.wasOptimized) {
        Reflect.set(optimized, fieldName, optimization.optimizedValue);
        console.log(`🔧 useFormSubmit: ${fieldName} 최적화 적용`);
      }
    }
  });

  arrayFields.forEach((fieldName) => {
    const isImageField = imageFieldPatterns.some((pattern) =>
      fieldName.toLowerCase().includes(pattern)
    );

    if (isImageField) {
      const fieldValue = getFieldValue(data, fieldName);
      const optimization = optimizeImageData(fieldValue, fieldName);

      if (optimization.wasOptimized) {
        Reflect.set(optimized, fieldName, optimization.optimizedValue);
        console.log(`🔧 useFormSubmit: ${fieldName} 배열 최적화 적용`);
      }
    }
  });

  console.log('✅ useFormSubmit: 데이터 최적화 완료');
  return optimized;
};

export const useFormSubmit = ({ addToast }: UseFormSubmitProps) => {
  const onSubmit = useCallback(
    (data: FormSchemaValues) => {
      console.log('📤 useFormSubmit: 폼 제출 시작');

      // 1단계: 데이터 검증
      const validation = validateFormSubmission(data);
      if (!validation.isValid) {
        addToast({
          title: '폼 제출 실패',
          description: `검증 실패: ${validation.errors.join(', ')}`,
          color: 'danger',
        });
        return;
      }

      // 경고 사항 알림
      if (validation.warnings.length > 0) {
        addToast({
          title: '제출 경고',
          description: validation.warnings.join(', '),
          color: 'warning',
        });
      }

      // 2단계: 데이터 최적화
      const optimizedData = optimizeSubmissionData(data);

      // 3단계: 실제 제출 처리 (모의)
      setTimeout(() => {
        // 성공률 90%로 모의 실패 케이스 포함
        const shouldFail = Math.random() < 0.1;

        if (shouldFail) {
          addToast({
            title: '제출 실패',
            description: '서버 오류로 제출에 실패했습니다',
            color: 'danger',
          });
          return;
        }

        // 최적화된 데이터를 사용한 성공 로그
        console.log('📤 useFormSubmit: 최적화된 데이터로 제출', {
          fieldCount: Object.keys(optimizedData).length,
          optimizedData: Object.keys(optimizedData),
        });

        addToast({
          title: '폼 제출 성공',
          description: '블로그 포스트가 성공적으로 생성되었습니다.',
          color: 'success',
        });

        console.log('✅ useFormSubmit: 폼 제출 성공');
      }, 1000);
    },
    [addToast]
  );

  return { onSubmit };
};
