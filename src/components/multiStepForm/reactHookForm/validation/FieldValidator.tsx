import React from 'react';
import { FormSchemaValues } from '../../types/formTypes';

interface FieldValidatorProps {
  fieldName: keyof FormSchemaValues;
  value: unknown;
  onValidationChange: (
    fieldName: keyof FormSchemaValues,
    isValid: boolean,
    message?: string
  ) => void;
  children: React.ReactNode;
}

function FieldValidator({
  fieldName,
  value,
  onValidationChange,
  children,
}: FieldValidatorProps) {
  console.log('🔍 FieldValidator: 필드 검증기 렌더링', { fieldName, value });

  React.useEffect(() => {
    console.log('🔍 FieldValidator: 필드 값 변경 감지, 검증 실행');

    const validateField = () => {
      switch (fieldName) {
        case 'nickname':
          if (!value || (value as string).length < 4) {
            onValidationChange(
              fieldName,
              false,
              '닉네임은 최소 4자 이상이어야 합니다.'
            );
          } else {
            onValidationChange(fieldName, true);
          }
          break;

        case 'emailPrefix':
        case 'emailDomain':
          if (!value || (value as string).trim().length === 0) {
            onValidationChange(fieldName, false, '이메일을 입력해주세요.');
          } else {
            onValidationChange(fieldName, true);
          }
          break;

        case 'title':
          if (!value || (value as string).length < 5) {
            onValidationChange(
              fieldName,
              false,
              '제목은 5자 이상 100자 이하로 작성해주세요.'
            );
          } else if ((value as string).length > 100) {
            onValidationChange(
              fieldName,
              false,
              '제목은 5자 이상 100자 이하로 작성해주세요.'
            );
          } else {
            onValidationChange(fieldName, true);
          }
          break;

        case 'description':
          if (!value || (value as string).length < 10) {
            onValidationChange(
              fieldName,
              false,
              '요약은 10자 이상 작성해주세요.'
            );
          } else {
            onValidationChange(fieldName, true);
          }
          break;

        case 'content':
          if (!value || (value as string).length < 5) {
            onValidationChange(
              fieldName,
              false,
              '블로그 내용이 최소 5자 이상이어야 합니다.'
            );
          } else {
            onValidationChange(fieldName, true);
          }
          break;

        default:
          onValidationChange(fieldName, true);
      }
    };

    validateField();
  }, [fieldName, value, onValidationChange]);

  return <>{children}</>;
}

export default FieldValidator;
