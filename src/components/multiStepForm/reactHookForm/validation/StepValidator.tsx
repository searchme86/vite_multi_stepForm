import React from 'react';
import { StepNumber } from '../../types/stepTypes';
import { FormSchemaValues } from '../../types/formTypes';

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
      switch (currentStep) {
        case 1:
          const step1Valid = !!(
            formValues.nickname &&
            formValues.emailPrefix &&
            formValues.emailDomain
          );
          onValidationResult(step1Valid);
          break;
        case 2:
          const step2Valid = !!(formValues.title && formValues.description);
          onValidationResult(step2Valid);
          break;
        case 3:
          const step3Valid = !!formValues.content;
          onValidationResult(step3Valid);
          break;
        case 4:
          const step4Valid = !!formValues.isEditorCompleted;
          onValidationResult(step4Valid);
          break;
        case 5:
          onValidationResult(true);
          break;
        default:
          onValidationResult(false);
      }
    };

    validateStep();
  }, [currentStep, formValues, onValidationResult]);

  return <>{children}</>;
}

export default StepValidator;
