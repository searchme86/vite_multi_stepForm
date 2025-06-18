// useUserInfoFormSync.ts

import { useCallback, useEffect, useRef } from 'react';
import { useFormContext, FieldPath, FieldPathValue } from 'react-hook-form';
import { useMultiStepFormState } from '../../../../reactHookForm/useMultiStepFormState';
import { FormValues } from '../../../../types/formTypes';
import { createDebounce, isValidFormFieldName } from '../utils/userInfoHelpers';
import {
  ToastColor,
  isStringValue,
  debugTypeCheck,
} from '../types/userInfoTypes';

type UserInfoFormFields = {
  readonly nickname: string;
  readonly emailPrefix: string;
  readonly emailDomain: string;
  readonly bio: string;
  readonly userImage: string;
};

type UserInfoFieldKey = keyof UserInfoFormFields;

interface UseUserInfoFormSyncReturn {
  readonly updateFormValue: <K extends FieldPath<FormValues>>(
    key: K,
    value: FieldPathValue<FormValues, K>
  ) => void;
  readonly addToast: (options: {
    title: string;
    description: string;
    color: string;
  }) => void;
  readonly formValues: FormValues;
  readonly isFormValueChanged: (fieldName: string, newValue: string) => boolean;
}

const isUserInfoField = (key: string): key is UserInfoFieldKey => {
  const userInfoFields: readonly string[] = [
    'nickname',
    'emailPrefix',
    'emailDomain',
    'bio',
    'userImage',
  ];
  return userInfoFields.includes(key);
};

const isValidFormField = <T extends FormValues>(
  key: string,
  value: unknown
): key is FieldPath<T> => {
  return isValidFormFieldName(key) && value !== undefined;
};

const ensureWatchValue = (value: unknown): string => {
  if (isStringValue(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.join(',');
  }

  try {
    return String(value);
  } catch (error) {
    console.warn('⚠️ ensureWatchValue: 문자열 변환 실패, 빈 문자열 반환', {
      value,
      error,
    });
    return '';
  }
};

const isValidToastColorType = (color: string): color is ToastColor => {
  const validColors: readonly string[] = [
    'success',
    'danger',
    'warning',
    'primary',
    'default',
  ];

  return validColors.includes(color);
};

export const useUserInfoFormSync = (): UseUserInfoFormSyncReturn => {
  const { watch, setValue } = useFormContext<FormValues>();

  const {
    updateFormValue: storeUpdateFormValue,
    addToast: storeAddToast,
    formValues: storeFormValues,
  } = useMultiStepFormState();

  const previousValuesRef = useRef<Record<UserInfoFieldKey, string>>({
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    userImage: '',
  });

  const lastValidationTimeRef = useRef<Record<string, number>>({});
  const validationTimeoutRef = useRef<number>();

  const watchedValues: UserInfoFormFields = {
    nickname: ensureWatchValue(watch('nickname')),
    emailPrefix: ensureWatchValue(watch('emailPrefix')),
    emailDomain: ensureWatchValue(watch('emailDomain')),
    bio: ensureWatchValue(watch('bio')),
    userImage: ensureWatchValue(watch('userImage')),
  };

  const hasValueChanged = useCallback(
    (key: string, newValue: unknown): boolean => {
      const prevValue = previousValuesRef.current[key as UserInfoFieldKey];

      if (typeof newValue !== 'object' || newValue === null) {
        return prevValue !== newValue;
      }

      if (Array.isArray(newValue) && Array.isArray(prevValue)) {
        return (
          newValue.length !== prevValue.length ||
          newValue.some((item, index) => item !== prevValue[index])
        );
      }

      try {
        return JSON.stringify(newValue) !== JSON.stringify(prevValue);
      } catch {
        return true;
      }
    },
    []
  );

  const performValidationWithThrottle = useCallback(
    (fieldName: string, value: unknown, expectedType: string) => {
      const now = Date.now();
      const lastValidationTime = lastValidationTimeRef.current[fieldName] || 0;

      if (now - lastValidationTime < 1000) {
        return;
      }

      if (hasValueChanged(fieldName, value)) {
        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }

        validationTimeoutRef.current = setTimeout(() => {
          debugTypeCheck(value, expectedType);
          lastValidationTimeRef.current[fieldName] = now;

          if (isUserInfoField(fieldName) && isStringValue(value)) {
            previousValuesRef.current[fieldName] = value;
          }
        }, 500);
      }
    },
    [hasValueChanged]
  );

  const isFormValueChanged = useCallback(
    (fieldName: string, newValue: string): boolean => {
      performValidationWithThrottle(fieldName, fieldName, 'string');
      performValidationWithThrottle(`${fieldName}_value`, newValue, 'string');

      if (!isStringValue(fieldName) || !isStringValue(newValue)) {
        return false;
      }

      if (!isValidFormFieldName(fieldName)) {
        return false;
      }

      if (!isUserInfoField(fieldName)) {
        return false;
      }

      const previousValue = previousValuesRef.current[fieldName];
      const hasChanged = previousValue !== newValue;

      return hasChanged;
    },
    [performValidationWithThrottle]
  );

  const debouncedStoreUpdate = useCallback(
    createDebounce((key: string, value: string) => {
      performValidationWithThrottle(key, key, 'string');
      performValidationWithThrottle(`${key}_value`, value, 'string');

      if (!isStringValue(key) || !isValidFormFieldName(key)) {
        return;
      }

      try {
        if (isUserInfoField(key)) {
          const formValueKey: keyof FormValues = key;
          const formValue: FormValues[typeof formValueKey] = value;
          storeUpdateFormValue(formValueKey, formValue);

          if (isStringValue(value)) {
            previousValuesRef.current = {
              ...previousValuesRef.current,
              [key]: value,
            };
          }
        }
      } catch (error) {
        console.error('❌ debouncedStoreUpdate: 업데이트 실패', error);

        storeAddToast({
          title: '상태 업데이트 오류',
          description: '폼 값 저장 중 오류가 발생했습니다.',
          color: 'danger' satisfies ToastColor,
        });
      }
    }, 500),
    [storeUpdateFormValue, storeAddToast, performValidationWithThrottle]
  );

  useEffect(() => {
    const fieldsToSync = Object.entries(watchedValues).filter(
      ([fieldName, value]) => {
        if (!isStringValue(fieldName) || !isStringValue(value)) {
          return false;
        }
        return true;
      }
    );

    if (fieldsToSync.length > 0) {
      fieldsToSync.forEach(([fieldName, value]) => {
        if (
          isValidFormField<FormValues>(fieldName, value) &&
          isFormValueChanged(fieldName, value)
        ) {
          debouncedStoreUpdate(fieldName, value);
        }
      });
    }
  }, [watchedValues, isFormValueChanged, debouncedStoreUpdate]);

  const updateFormValue = useCallback(
    <K extends FieldPath<FormValues>>(
      key: K,
      value: FieldPathValue<FormValues, K>
    ) => {
      performValidationWithThrottle(key, key, 'string');
      performValidationWithThrottle(`${key}_value`, value, typeof value);

      if (!isStringValue(key) || !isValidFormFieldName(key)) {
        storeAddToast({
          title: '입력 오류',
          description: '유효하지 않은 필드명입니다.',
          color: 'danger' satisfies ToastColor,
        });
        return;
      }

      try {
        setValue(key, value);

        if (isUserInfoField(key) && isStringValue(value)) {
          const formValueKey: keyof FormValues = key;
          const formValue: FormValues[typeof formValueKey] = value;
          storeUpdateFormValue(formValueKey, formValue);

          previousValuesRef.current = {
            ...previousValuesRef.current,
            [key]: value,
          };
        }
      } catch (error) {
        console.error('❌ updateFormValue: 직접 업데이트 실패', error);
        storeAddToast({
          title: '입력 오류',
          description: '값 저장 중 오류가 발생했습니다.',
          color: 'danger' satisfies ToastColor,
        });
      }
    },
    [
      setValue,
      storeUpdateFormValue,
      storeAddToast,
      performValidationWithThrottle,
    ]
  );

  const addToast = useCallback(
    (options: { title: string; description: string; color: string }) => {
      performValidationWithThrottle('toast_options', options, 'object');

      const validatedColor: ToastColor = isValidToastColorType(options.color)
        ? options.color
        : 'default';

      if (options.color !== validatedColor) {
        console.warn('⚠️ addToast: 유효하지 않은 색상 값, default로 fallback', {
          providedColor: options.color,
          fallbackColor: validatedColor,
        });
      }

      storeAddToast({
        title: options.title,
        description: options.description,
        color: validatedColor,
      });
    },
    [storeAddToast, performValidationWithThrottle]
  );

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return {
    updateFormValue,
    addToast,
    formValues: storeFormValues,
    isFormValueChanged,
  };
};
