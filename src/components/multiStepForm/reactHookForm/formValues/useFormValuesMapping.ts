import React from 'react';
import { FormSchemaValues, FormValues } from '../../types/formTypes';

export const useFormValuesMapping = (allWatchedValues: FormSchemaValues) => {
  console.log('🔄 useFormValuesMapping: 폼 값 매핑 시작');

  const mapFormValues = React.useCallback(
    (watchedValues: FormSchemaValues): FormValues => {
      console.log('🔄 useFormValuesMapping: 폼 값 변환', watchedValues);

      return {
        userImage: watchedValues.userImage || '',
        nickname: watchedValues.nickname || '',
        emailPrefix: watchedValues.emailPrefix || '',
        emailDomain: watchedValues.emailDomain || '',
        bio: watchedValues.bio || '',
        title: watchedValues.title || '',
        description: watchedValues.description || '',
        tags: watchedValues.tags || '',
        content: watchedValues.content || '',
        media: Array.isArray(watchedValues.media) ? watchedValues.media : [],
        mainImage: watchedValues.mainImage || null,
        sliderImages: Array.isArray(watchedValues.sliderImages)
          ? watchedValues.sliderImages
          : [],
        editorCompletedContent: watchedValues.editorCompletedContent || '',
        isEditorCompleted: watchedValues.isEditorCompleted || false,
      };
    },
    []
  );

  const mappedValues = React.useMemo(() => {
    const mapped = mapFormValues(allWatchedValues);
    console.log('🔄 useFormValuesMapping: 매핑 완료', mapped);
    return mapped;
  }, [allWatchedValues, mapFormValues]);

  return { mappedValues, mapFormValues };
};
