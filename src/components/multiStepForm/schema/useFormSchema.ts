import React from 'react';
import { formSchema } from './formSchema';
import { FormSchemaValues, SchemaValidationResult } from './schemaTypes';

export const useFormSchema = () => {
  console.log('📄 useFormSchema: 스키마 훅 초기화');

  const validateSchema = React.useCallback(
    (data: Partial<FormSchemaValues>): SchemaValidationResult => {
      console.log('📄 useFormSchema: 스키마 검증 시작', data);

      try {
        const validatedData = formSchema.parse(data);
        console.log('📄 useFormSchema: 스키마 검증 성공');
        return {
          isValid: true,
          errors: [],
          data: validatedData,
        };
      } catch (error) {
        console.log('📄 useFormSchema: 스키마 검증 실패', error);
        return {
          isValid: false,
          errors: [],
        };
      }
    },
    []
  );

  const validateField = React.useCallback(
    (fieldName: keyof FormSchemaValues, value: unknown) => {
      console.log('📄 useFormSchema: 필드 검증', { fieldName, value });

      try {
        const fieldSchema = formSchema.shape[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          console.log('📄 useFormSchema: 필드 검증 성공');
          return { isValid: true, error: null };
        }
        return { isValid: false, error: '필드를 찾을 수 없습니다.' };
      } catch (error) {
        console.log('📄 useFormSchema: 필드 검증 실패', error);
        return { isValid: false, error: '검증에 실패했습니다.' };
      }
    },
    []
  );

  const getDefaultValues = React.useCallback((): Partial<FormSchemaValues> => {
    console.log('📄 useFormSchema: 기본값 생성');
    return {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      tags: '',
      content: '',
      media: [],
      mainImage: null,
      sliderImages: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }, []);

  return {
    schema: formSchema,
    validateSchema,
    validateField,
    getDefaultValues,
  };
};
