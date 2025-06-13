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
  console.log('🔄 useUserInfoFormSync: 폼 동기화 훅 초기화 시작');

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

  const watchedValues: UserInfoFormFields = {
    nickname: ensureWatchValue(watch('nickname')),
    emailPrefix: ensureWatchValue(watch('emailPrefix')),
    emailDomain: ensureWatchValue(watch('emailDomain')),
    bio: ensureWatchValue(watch('bio')),
    userImage: ensureWatchValue(watch('userImage')),
  };

  console.log('👀 useUserInfoFormSync: 현재 감시중인 값들', watchedValues);

  Object.entries(watchedValues).forEach(([fieldName, value]) => {
    if (!isStringValue(value)) {
      console.warn(`⚠️ useUserInfoFormSync: ${fieldName} 값이 문자열이 아님`, {
        fieldName,
        value,
        type: typeof value,
      });
    }
  });

  const isFormValueChanged = useCallback(
    (fieldName: string, newValue: string): boolean => {
      debugTypeCheck(fieldName, 'string');
      debugTypeCheck(newValue, 'string');

      if (!isStringValue(fieldName) || !isStringValue(newValue)) {
        console.log('❌ isFormValueChanged: 입력 값이 문자열이 아님', {
          fieldName,
          newValue,
          fieldNameType: typeof fieldName,
          newValueType: typeof newValue,
        });
        return false;
      }

      if (!isValidFormFieldName(fieldName)) {
        console.log('❌ isFormValueChanged: 유효하지 않은 필드명', fieldName);
        return false;
      }

      if (!isUserInfoField(fieldName)) {
        console.log('❌ isFormValueChanged: UserInfo 필드가 아님', fieldName);
        return false;
      }

      const previousValue = previousValuesRef.current[fieldName];
      const hasChanged = previousValue !== newValue;

      console.log('🔍 isFormValueChanged: 값 변경 확인', {
        fieldName,
        previousValue,
        newValue,
        hasChanged,
      });

      return hasChanged;
    },
    []
  );

  const debouncedStoreUpdate = useCallback(
    createDebounce((key: string, value: string) => {
      console.log('💾 debouncedStoreUpdate: zustand 스토어 업데이트 실행', {
        key,
        value,
      });
      debugTypeCheck(key, 'string');
      debugTypeCheck(value, 'string');

      if (!isStringValue(key) || !isValidFormFieldName(key)) {
        console.error('❌ debouncedStoreUpdate: 유효하지 않은 키', {
          key,
          keyType: typeof key,
        });
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

        console.log('✅ debouncedStoreUpdate: 업데이트 성공', { key, value });
      } catch (error) {
        console.error('❌ debouncedStoreUpdate: 업데이트 실패', error);

        storeAddToast({
          title: '상태 업데이트 오류',
          description: '폼 값 저장 중 오류가 발생했습니다.',
          color: 'danger' satisfies ToastColor,
        });
      }
    }, 300),
    [storeUpdateFormValue, storeAddToast]
  );

  useEffect(() => {
    console.log('🔄 useUserInfoFormSync: 실시간 동기화 실행');

    Object.entries(watchedValues).forEach(([fieldName, value]) => {
      if (!isStringValue(fieldName) || !isStringValue(value)) {
        console.warn('⚠️ useUserInfoFormSync: 필드명 또는 값이 문자열이 아님', {
          fieldName,
          value,
          fieldNameType: typeof fieldName,
          valueType: typeof value,
        });
        return;
      }

      if (
        isValidFormField<FormValues>(fieldName, value) &&
        isFormValueChanged(fieldName, value)
      ) {
        console.log(
          `🔄 useUserInfoFormSync: ${fieldName} 필드 변경 감지`,
          value
        );
        debouncedStoreUpdate(fieldName, value);
      }
    });
  }, [watchedValues, isFormValueChanged, debouncedStoreUpdate]);

  const updateFormValue = useCallback(
    <K extends FieldPath<FormValues>>(
      key: K,
      value: FieldPathValue<FormValues, K>
    ) => {
      console.log('📝 updateFormValue: 직접 폼 값 업데이트', { key, value });
      debugTypeCheck(key, 'string');
      debugTypeCheck(value, typeof value);

      if (!isStringValue(key) || !isValidFormFieldName(key)) {
        console.error('❌ updateFormValue: 유효하지 않은 키', {
          key,
          keyType: typeof key,
        });
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

        console.log('✅ updateFormValue: 직접 업데이트 성공', { key, value });
      } catch (error) {
        console.error('❌ updateFormValue: 직접 업데이트 실패', error);
        storeAddToast({
          title: '입력 오류',
          description: '값 저장 중 오류가 발생했습니다.',
          color: 'danger' satisfies ToastColor,
        });
      }
    },
    [setValue, storeUpdateFormValue, storeAddToast]
  );

  const addToast = useCallback(
    (options: { title: string; description: string; color: string }) => {
      console.log('🍞 addToast: 토스트 메시지 추가', options);
      debugTypeCheck(options, 'object');

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
    [storeAddToast]
  );

  console.log('✅ useUserInfoFormSync: 폼 동기화 훅 초기화 완료');

  return {
    updateFormValue,
    addToast,
    formValues: storeFormValues,
    isFormValueChanged,
  };
};
