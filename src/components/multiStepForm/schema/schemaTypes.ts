import * as z from 'zod';
import { formSchema } from './formSchema';

export type FormSchemaValues = z.infer<typeof formSchema>;

export interface SchemaValidationError {
  field: keyof FormSchemaValues;
  message: string;
  code: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  data?: FormSchemaValues;
}

export type SchemaFieldType = keyof FormSchemaValues;

export interface SchemaFieldConfig {
  fieldName: SchemaFieldType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

console.log('📄 schemaTypes: 스키마 타입 정의 완료');
