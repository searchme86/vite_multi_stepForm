import { FormSchemaValues } from './formTypes';
import { StepNumber } from './stepTypes';
import { EditorState } from './editorTypes';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorMessages?: string[];
}

export interface StepValidationConfig {
  step: StepNumber;
  fieldsToValidate: (keyof FormSchemaValues)[];
  customValidator?: () => Promise<boolean>;
}

export interface ValidationContext {
  validateCurrentStep: (step: StepNumber) => Promise<boolean>;
  validateField: (fieldName: keyof FormSchemaValues) => Promise<boolean>;
  validateAllFields: () => Promise<boolean>;
  getFieldErrors: (fieldName: keyof FormSchemaValues) => string[];
  clearFieldErrors: (fieldName: keyof FormSchemaValues) => void;
}

export interface EditorValidationProps {
  editorState: EditorState;
  showToast: (message: string, type: 'error' | 'warning') => void;
}

export interface FieldValidatorProps {
  fieldName: keyof FormSchemaValues;
  value: unknown;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: number | string | RegExp;
  message: string;
  validator?: (value: unknown) => boolean;
}
