// src/components/multiStepForm/reactHookForm/validation/StepValidator.tsx

import React from 'react';
import type { StepNumber } from '../../types/stepTypes';
import type { FormSchemaValues } from '../../types/formTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import { createValidationLogger } from '../utils/consoleLoggingUtils';
import {
  isValidFormSchemaKey,
  normalizeFieldName,
  FIELD_MAPPINGS,
} from '../utils/validationHelpers';

interface StepValidatorProps {
  readonly currentStep: StepNumber;
  readonly formValues: FormSchemaValues;
  readonly onValidationResult: (isValid: boolean) => void;
  readonly children: React.ReactNode;
}

interface FieldMappingResult {
  readonly mappedFieldName: keyof FormSchemaValues | null;
  readonly mappingMethod: 'direct' | 'lookup' | 'normalization' | 'none';
}

interface ValidationAnalysis {
  readonly totalFields: number;
  readonly validFields: number;
  readonly invalidFields: number;
  readonly isStepValid: boolean;
}

// 캐싱을 위한 Map 인스턴스 생성
const fieldMappingCache = new Map<string, keyof FormSchemaValues | null>();
const formKeysCache = new Map<string, (keyof FormSchemaValues)[]>();

const isValidFormField = (
  field: string,
  formValues: FormSchemaValues
): field is keyof FormSchemaValues => {
  return field in formValues;
};

const getCachedFormKeys = (
  formValues: FormSchemaValues
): (keyof FormSchemaValues)[] => {
  const cacheKey = 'formKeys';
  const cachedKeys = formKeysCache.get(cacheKey);

  if (cachedKeys) {
    return cachedKeys;
  }

  const freshFormKeys = Object.keys(formValues).filter(isValidFormSchemaKey);
  formKeysCache.set(cacheKey, freshFormKeys);

  return freshFormKeys;
};

const findFieldByNormalization = (
  normalizedValidationField: string,
  formKeys: readonly (keyof FormSchemaValues)[]
): keyof FormSchemaValues | null => {
  const matchingField = formKeys.find((key) => {
    const normalizedKey = normalizeFieldName(String(key));
    return (
      normalizedKey === normalizedValidationField ||
      normalizedKey.includes(normalizedValidationField) ||
      normalizedValidationField.includes(normalizedKey)
    );
  });

  return matchingField ?? null;
};

const validateDirectFieldMatch = (
  validationField: string,
  formValues: FormSchemaValues
): keyof FormSchemaValues | null => {
  const isDirectMatch = isValidFormField(validationField, formValues);
  return isDirectMatch ? validationField : null;
};

const validateMappedFieldMatch = (
  normalizedValidationField: string,
  formValues: FormSchemaValues
): keyof FormSchemaValues | null => {
  const mappedField = FIELD_MAPPINGS[normalizedValidationField];

  if (!mappedField) {
    return null;
  }

  const isMappedFieldValid = isValidFormField(mappedField, formValues);
  return isMappedFieldValid ? mappedField : null;
};

const getActualFieldNameWithCaching = (
  validationField: string,
  formValues: FormSchemaValues
): FieldMappingResult => {
  const cachedResult = fieldMappingCache.get(validationField);

  if (cachedResult !== undefined) {
    return {
      mappedFieldName: cachedResult,
      mappingMethod: 'direct',
    };
  }

  // 1차: 직접 매칭 시도
  const directMatch = validateDirectFieldMatch(validationField, formValues);

  if (directMatch) {
    fieldMappingCache.set(validationField, directMatch);
    return {
      mappedFieldName: directMatch,
      mappingMethod: 'direct',
    };
  }

  // 2차: 정규화 후 FIELD_MAPPINGS 조회
  const normalizedValidationField = normalizeFieldName(validationField);
  const lookupMatch = validateMappedFieldMatch(
    normalizedValidationField,
    formValues
  );

  if (lookupMatch) {
    fieldMappingCache.set(validationField, lookupMatch);
    return {
      mappedFieldName: lookupMatch,
      mappingMethod: 'lookup',
    };
  }

  // 3차: 정규화 기반 유사도 매칭
  const formKeys = getCachedFormKeys(formValues);
  const similarityMatch = findFieldByNormalization(
    normalizedValidationField,
    formKeys
  );

  if (similarityMatch) {
    fieldMappingCache.set(validationField, similarityMatch);
    return {
      mappedFieldName: similarityMatch,
      mappingMethod: 'normalization',
    };
  }

  // 4차: 매칭 실패
  fieldMappingCache.set(validationField, null);
  return {
    mappedFieldName: null,
    mappingMethod: 'none',
  };
};

const validateFieldValue = (value: unknown, fieldName: string): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  const normalizedFieldName = normalizeFieldName(fieldName);
  const isEditorField =
    normalizedFieldName.includes('editor') &&
    normalizedFieldName.includes('completed');

  if (isEditorField) {
    return Boolean(value);
  }

  const isStringOrNumber =
    typeof value === 'string' || typeof value === 'number';

  if (isStringOrNumber) {
    const stringValue = String(value);
    const trimmedValue = stringValue.trim();
    return trimmedValue.length > 0;
  }

  return Boolean(value);
};

const executeStepValidation = (
  currentStep: StepNumber,
  formValues: FormSchemaValues
): ValidationAnalysis => {
  const logger = createValidationLogger(parseInt(String(currentStep), 10));

  const validationFields = getStepValidationFields(currentStep);
  const totalFields = validationFields.length;

  if (totalFields === 0) {
    logger.logSuccess(0);
    return {
      totalFields: 0,
      validFields: 0,
      invalidFields: 0,
      isStepValid: true,
    };
  }

  let validFields = 0;
  let invalidFields = 0;

  const validationResults = validationFields.map((field) => {
    const mappingResult = getActualFieldNameWithCaching(field, formValues);
    const { mappedFieldName, mappingMethod } = mappingResult;

    if (!mappedFieldName) {
      logger.logField(field, false);
      invalidFields += 1;
      return false;
    }

    const fieldValue = formValues[mappedFieldName];
    const isFieldValid = validateFieldValue(fieldValue, field);

    if (isFieldValid) {
      validFields += 1;
    } else {
      invalidFields += 1;
    }

    logger.logField(String(mappedFieldName), isFieldValid);
    return isFieldValid;
  });

  const isStepValid = validationResults.every((result) => result === true);

  const analysis: ValidationAnalysis = {
    totalFields,
    validFields,
    invalidFields,
    isStepValid,
  };

  isStepValid
    ? logger.logSuccess(validFields)
    : logger.logFailure([`${invalidFields}개 필드 검증 실패`]);

  return analysis;
};

const processStepValidation = (
  currentStep: StepNumber,
  formValues: FormSchemaValues,
  onValidationResult: (isValid: boolean) => void
): void => {
  const validationAnalysis = executeStepValidation(currentStep, formValues);
  const { isStepValid } = validationAnalysis;

  onValidationResult(isStepValid);
};

function StepValidator({
  currentStep,
  formValues,
  onValidationResult,
  children,
}: StepValidatorProps): React.ReactElement {
  React.useEffect(() => {
    processStepValidation(currentStep, formValues, onValidationResult);
  }, [currentStep, formValues, onValidationResult]);

  return <>{children}</>;
}

export default StepValidator;
