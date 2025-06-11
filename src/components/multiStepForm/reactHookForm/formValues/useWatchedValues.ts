import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { FormSchemaValues, FormValues } from '../../types/formTypes';
import { logFormValuesUpdate } from '../../utils/debugUtils';

export const useWatchedValues = (watch: UseFormWatch<FormSchemaValues>) => {
  const allWatchedValues = watch();

  const formValues = React.useMemo(() => {
    console.log('🔄 useWatchedValues: 폼 값 메모이제이션 업데이트');

    const values = {
      userImage: allWatchedValues.userImage || '',
      nickname: allWatchedValues.nickname || '',
      emailPrefix: allWatchedValues.emailPrefix || '',
      emailDomain: allWatchedValues.emailDomain || '',
      bio: allWatchedValues.bio || '',
      title: allWatchedValues.title || '',
      description: allWatchedValues.description || '',
      tags: allWatchedValues.tags || '',
      content: allWatchedValues.content || '',
      media: Array.isArray(allWatchedValues.media)
        ? allWatchedValues.media
        : [],
      mainImage: allWatchedValues.mainImage || null,
      sliderImages: Array.isArray(allWatchedValues.sliderImages)
        ? allWatchedValues.sliderImages
        : [],
      editorCompletedContent: allWatchedValues.editorCompletedContent || '',
      isEditorCompleted: allWatchedValues.isEditorCompleted || false,
    } as FormValues;

    logFormValuesUpdate(values);
    return values;
  }, [allWatchedValues]);

  return { formValues, allWatchedValues };
};
