import React from 'react';
import { FormValues } from '../../types/formTypes';

export const useFormValuesOptimization = (formValues: FormValues) => {
  console.log('⚡ useFormValuesOptimization: 폼 값 최적화 시작');

  const memoizedFormValues = React.useMemo(() => {
    console.log('⚡ useFormValuesOptimization: 폼 값 메모이제이션');
    return { ...formValues };
  }, [
    formValues.userImage,
    formValues.nickname,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.bio,
    formValues.title,
    formValues.description,
    formValues.tags,
    formValues.content,
    formValues.media?.length,
    formValues.mainImage,
    formValues.sliderImages?.length,
    formValues.editorCompletedContent,
    formValues.isEditorCompleted,
  ]);

  const hasChanges = React.useMemo(() => {
    const isEmpty =
      !formValues.nickname && !formValues.title && !formValues.content;
    console.log('⚡ useFormValuesOptimization: 변경사항 확인', !isEmpty);
    return !isEmpty;
  }, [formValues.nickname, formValues.title, formValues.content]);

  const isFormComplete = React.useMemo(() => {
    const complete = !!(
      formValues.nickname &&
      formValues.emailPrefix &&
      formValues.emailDomain &&
      formValues.title &&
      formValues.description &&
      formValues.content
    );
    console.log('⚡ useFormValuesOptimization: 폼 완성도 확인', complete);
    return complete;
  }, [
    formValues.nickname,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.title,
    formValues.description,
    formValues.content,
  ]);

  return {
    optimizedFormValues: memoizedFormValues,
    hasChanges,
    isFormComplete,
  };
};
