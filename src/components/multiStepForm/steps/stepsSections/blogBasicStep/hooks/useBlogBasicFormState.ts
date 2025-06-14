// blogBasicStep/hooks/useBlogBasicFormState.ts

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';

interface UseBlogBasicFormStateReturn {
  readonly titleValue: string;
  readonly descriptionValue: string;
  readonly isInitialized: boolean;
}

interface PreviousValues {
  title: string;
  description: string;
}

export function useBlogBasicFormState(): UseBlogBasicFormStateReturn {
  const { watch, setValue } = useFormContext();
  const { formValues, updateFormValue } = useMultiStepFormStore();

  const watchedTitle = watch('title') ?? '';
  const watchedDescription = watch('description') ?? '';

  const storeTitle = formValues.title ?? '';
  const storeDescription = formValues.description ?? '';

  const previousValuesRef = React.useRef<PreviousValues>({
    title: '',
    description: '',
  });

  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);

  React.useEffect(() => {
    const previousValues = previousValuesRef.current;
    const titleChanged = previousValues.title !== watchedTitle;
    const descriptionChanged =
      previousValues.description !== watchedDescription;

    if (titleChanged) {
      updateFormValue('title', watchedTitle);
      previousValuesRef.current.title = watchedTitle;
    }

    if (descriptionChanged) {
      updateFormValue('description', watchedDescription);
      previousValuesRef.current.description = watchedDescription;
    }

    if (!isInitialized && (titleChanged || descriptionChanged)) {
      setIsInitialized(true);
    }
  }, [watchedTitle, watchedDescription, updateFormValue, isInitialized]);

  React.useEffect(() => {
    if (storeTitle && storeTitle !== watchedTitle) {
      setValue('title', storeTitle);
    }

    if (storeDescription && storeDescription !== watchedDescription) {
      setValue('description', storeDescription);
    }

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, []);

  return {
    titleValue: watchedTitle,
    descriptionValue: watchedDescription,
    isInitialized,
  };
}
