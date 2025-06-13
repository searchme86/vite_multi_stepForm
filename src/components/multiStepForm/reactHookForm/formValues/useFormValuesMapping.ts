import React from 'react';
import { FormSchemaValues, FormValues } from '../../types/formTypes';
import { createFormValuesFromSchema } from '../utils/validationHelpers';

export const useFormValuesMapping = (allWatchedValues: FormSchemaValues) => {
  console.log('🔄 useFormValuesMapping: 폼 값 매핑 시작');

  const mapFormValues = React.useCallback(
    (watchedValues: FormSchemaValues): FormValues => {
      console.log('🔄 useFormValuesMapping: 폼 값 변환', watchedValues);
      return createFormValuesFromSchema(watchedValues);
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
