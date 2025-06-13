import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { FormSchemaValues, FormValues } from '../../types/formTypes';
import { logFormValuesUpdate } from '../../utils/debugUtils';
import { createFormValuesFromSchema } from '../utils/validationHelpers';

export const useWatchedValues = (watch: UseFormWatch<FormSchemaValues>) => {
  const allWatchedValues = watch();

  const formValues = React.useMemo(() => {
    console.log('🔄 useWatchedValues: 폼 값 메모이제이션 업데이트');

    const values = createFormValuesFromSchema(allWatchedValues);

    logFormValuesUpdate(values);
    return values;
  }, [allWatchedValues]);

  return { formValues, allWatchedValues };
};
