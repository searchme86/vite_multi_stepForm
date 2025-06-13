import React from 'react';
import { StepNumber, getStepValidationFields } from '../../types/stepTypes';
import { FormSchemaValues } from '../../types/formTypes';
import {
  isValidFormSchemaKey,
  normalizeFieldName,
  FIELD_MAPPINGS,
} from '../utils/validationHelpers';

interface StepValidatorProps {
  currentStep: StepNumber;
  formValues: FormSchemaValues;
  onValidationResult: (isValid: boolean) => void;
  children: React.ReactNode;
}

function StepValidator({
  currentStep,
  formValues,
  onValidationResult,
  children,
}: StepValidatorProps) {
  console.log('✅ StepValidator: 스텝 검증 관리자 렌더링', { currentStep });

  React.useEffect(() => {
    console.log('✅ StepValidator: 스텝 변경 감지, 검증 실행');

    const validateStep = () => {
      const validationFields = getStepValidationFields(currentStep);

      if (validationFields.length === 0) {
        onValidationResult(true);
        return;
      }

      const isValidFormField = (
        field: string
      ): field is keyof FormSchemaValues => {
        return field in formValues;
      };

      const getFormKeys = (): (keyof FormSchemaValues)[] => {
        return Object.keys(formValues).filter(isValidFormSchemaKey);
      };

      const getActualFieldName = (
        validationField: string
      ): keyof FormSchemaValues | null => {
        if (isValidFormField(validationField)) {
          return validationField;
        }

        const normalizedValidationField = normalizeFieldName(validationField);
        const mappedField = FIELD_MAPPINGS[normalizedValidationField];

        if (mappedField && isValidFormField(mappedField)) {
          return mappedField;
        }

        const formKeys = getFormKeys();
        const fieldByNormalizedMatch = formKeys.find((key) => {
          const normalizedKey = normalizeFieldName(`${key}`);
          return (
            normalizedKey === normalizedValidationField ||
            normalizedKey.includes(normalizedValidationField) ||
            normalizedValidationField.includes(normalizedKey)
          );
        });

        return fieldByNormalizedMatch || null;
      };

      const validateFieldValue = (
        value: unknown,
        fieldName: string
      ): boolean => {
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
          return !!value;
        }

        if (typeof value === 'string' || typeof value === 'number') {
          return `${value}`.trim().length > 0;
        }

        return !!value;
      };

      const isValid = validationFields.every((field) => {
        const actualField = getActualFieldName(field);

        if (!actualField) {
          console.warn(`StepValidator: 필드 매핑을 찾을 수 없습니다: ${field}`);
          return false;
        }

        const value = formValues[actualField];
        const isFieldValid = validateFieldValue(value, field);

        if (!isFieldValid) {
          console.log(
            `StepValidator: 검증 실패 - ${field}(${actualField}):`,
            value
          );
        }

        return isFieldValid;
      });

      onValidationResult(isValid);
    };

    validateStep();
  }, [currentStep, formValues, onValidationResult]);

  return <>{children}</>;
}

export default StepValidator;
