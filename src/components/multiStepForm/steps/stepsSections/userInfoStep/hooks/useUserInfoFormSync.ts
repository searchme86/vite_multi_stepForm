// src/components/multiStepForm/steps/stepsSections/userInfoStep/hooks/useUserInfoFormSync.ts

import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';

interface ToastMessage {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'info';
}

interface FormValues {
  userImage: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio: string;
}

interface UseUserInfoFormSyncReturn {
  formValues: FormValues;
  updateFormValue: (
    fieldName: string,
    value: string | string[] | boolean | null
  ) => void;
  addToast: (toast: ToastMessage) => void;
}

export function useUserInfoFormSync(): UseUserInfoFormSyncReturn {
  console.log('🔄 [USER_INFO_SYNC] 사용자 정보 동기화 훅 초기화');

  // React Hook Form 컨텍스트
  const { watch, setValue, getValues } = useFormContext();

  // MultiStepForm 스토어
  const multiStepFormStore = useMultiStepFormStore();

  // 🔍 스토어 연결 확인
  console.log('🔍 [USER_INFO_SYNC] 스토어 연결 상태:', {
    hasStore: !!multiStepFormStore,
    hasGetFormValues: !!multiStepFormStore?.getFormValues,
    hasUpdateFormValue: !!multiStepFormStore?.updateFormValue,
    hasAddToast: !!multiStepFormStore?.addToast,
    timestamp: new Date().toISOString(),
  });

  // 현재 폼 값들 가져오기
  const formValues = useMemo(() => {
    try {
      const storeValues = multiStepFormStore?.getFormValues?.() || {};
      const reactHookFormValues = getValues();

      // 구조분해할당으로 안전한 값 추출
      const {
        userImage: storeUserImage,
        nickname: storeNickname,
        emailPrefix: storeEmailPrefix,
        emailDomain: storeEmailDomain,
        bio: storeBio,
      } = storeValues;

      const {
        userImage: formUserImage,
        nickname: formNickname,
        emailPrefix: formEmailPrefix,
        emailDomain: formEmailDomain,
        bio: formBio,
      } = reactHookFormValues || {};

      // 스토어 값 우선, 없으면 React Hook Form 값 사용
      const currentValues = {
        userImage: storeUserImage || formUserImage || '',
        nickname: storeNickname || formNickname || '',
        emailPrefix: storeEmailPrefix || formEmailPrefix || '',
        emailDomain: storeEmailDomain || formEmailDomain || '',
        bio: storeBio || formBio || '',
      };

      console.log('📊 [USER_INFO_SYNC] 현재 폼 값들:', {
        userImage: currentValues.userImage
          ? `있음(${currentValues.userImage.length}자)`
          : '없음',
        nickname: currentValues.nickname || '없음',
        emailPrefix: currentValues.emailPrefix || '없음',
        emailDomain: currentValues.emailDomain || '없음',
        bio: currentValues.bio ? `있음(${currentValues.bio.length}자)` : '없음',
        timestamp: new Date().toISOString(),
      });

      return currentValues;
    } catch (error) {
      console.error('❌ [USER_INFO_SYNC] 폼 값 가져오기 오류:', error);

      // 에러 발생 시 기본값 반환
      return {
        userImage: '',
        nickname: '',
        emailPrefix: '',
        emailDomain: '',
        bio: '',
      };
    }
  }, [multiStepFormStore, getValues]);

  // 📝 폼 값 업데이트 함수
  const updateFormValue = useCallback(
    (fieldName: string, value: string | string[] | boolean | null) => {
      console.log('📝 [USER_INFO_SYNC] 폼 값 업데이트 요청:', {
        fieldName,
        valueType: typeof value,
        valueLength: typeof value === 'string' ? value.length : 0,
        timestamp: new Date().toISOString(),
      });

      try {
        // 🚨 이미지 데이터 크기 체크 (localStorage 에러 방지)
        if (fieldName === 'userImage' && typeof value === 'string') {
          const { length: imageSizeInBytes } = value;
          const imageSizeInMB = imageSizeInBytes / (1024 * 1024);

          console.log('🖼️ [USER_INFO_SYNC] 이미지 크기 확인:', {
            sizeInBytes: imageSizeInBytes,
            sizeInMB: imageSizeInMB.toFixed(2),
            timestamp: new Date().toISOString(),
          });

          // 2MB 이상이면 localStorage 저장 건너뛰기
          if (imageSizeInMB > 2) {
            console.warn(
              '⚠️ [USER_INFO_SYNC] 이미지 크기가 2MB를 초과, localStorage 저장 건너뛰기'
            );

            // 1. React Hook Form에만 저장
            console.log('🔄 [USER_INFO_SYNC] React Hook Form 업데이트 시작');
            setValue(fieldName, value, {
              shouldValidate: true,
              shouldDirty: true,
            });
            console.log('✅ [USER_INFO_SYNC] React Hook Form 업데이트 완료');

            // 2. 메모리에만 저장하고 localStorage는 건너뛰기
            console.log(
              '✅ [USER_INFO_SYNC] 이미지 메모리 저장 완료 (localStorage 건너뛰기)'
            );
            return;
          }
        }

        // 🔄 1단계: React Hook Form 업데이트
        console.log('🔄 [USER_INFO_SYNC] React Hook Form 업데이트 시작');
        setValue(fieldName, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
        console.log('✅ [USER_INFO_SYNC] React Hook Form 업데이트 완료');

        // 🔄 2단계: Zustand 스토어 업데이트 (try-catch로 localStorage 에러 방지)
        const { updateFormValue: storeUpdateFormValue } =
          multiStepFormStore || {};

        if (storeUpdateFormValue) {
          console.log('🔄 [USER_INFO_SYNC] Zustand 스토어 업데이트 시작');

          try {
            storeUpdateFormValue(fieldName, value);
            console.log('✅ [USER_INFO_SYNC] Zustand 스토어 업데이트 성공');
            console.log('✅ [USER_INFO_SYNC] 이미지 메모리 저장 완료');
          } catch (storeError) {
            console.error('❌ [USER_INFO_SYNC] Zustand 스토어 업데이트 실패:', {
              fieldName,
              error: storeError,
              errorName:
                storeError instanceof Error ? storeError.name : 'Unknown',
              errorMessage:
                storeError instanceof Error
                  ? storeError.message
                  : 'Unknown error',
              timestamp: new Date().toISOString(),
            });

            // localStorage 에러인 경우 메모리에만 저장
            if (
              storeError instanceof Error &&
              storeError.name === 'QuotaExceededError'
            ) {
              console.warn(
                '⚠️ [USER_INFO_SYNC] localStorage 용량 초과, 메모리에만 저장'
              );
            }

            // 에러 발생해도 React Hook Form에는 저장됨
            console.log(
              '✅ [USER_INFO_SYNC] 이미지 메모리 저장 완료 (localStorage 에러로 인한 메모리 전용)'
            );
          }
        } else {
          console.warn(
            '⚠️ [USER_INFO_SYNC] Zustand 스토어 updateFormValue 함수 없음'
          );
          console.log(
            '✅ [USER_INFO_SYNC] 이미지 메모리 저장 완료 (스토어 함수 없음)'
          );
        }

        console.log('✅ [USER_INFO_SYNC] 폼 값 업데이트 전체 완료:', {
          fieldName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ [USER_INFO_SYNC] 폼 값 업데이트 실패:', {
          fieldName,
          error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        // 에러 발생해도 최소한 React Hook Form에는 저장
        try {
          setValue(fieldName, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
          console.log(
            '✅ [USER_INFO_SYNC] 에러 발생 시 React Hook Form 백업 저장 완료'
          );
        } catch (backupError) {
          console.error(
            '❌ [USER_INFO_SYNC] React Hook Form 백업 저장도 실패:',
            backupError
          );
        }
      }
    },
    [setValue, multiStepFormStore]
  );

  // 🍞 토스트 메시지 추가 함수
  const addToast = useCallback(
    (toast: ToastMessage) => {
      console.log('🍞 [USER_INFO_SYNC] 토스트 메시지 추가:', {
        title: toast.title,
        color: toast.color,
        timestamp: new Date().toISOString(),
      });

      try {
        const { addToast: storeAddToast } = multiStepFormStore || {};

        if (storeAddToast) {
          storeAddToast(toast);
          console.log('✅ [USER_INFO_SYNC] 토스트 메시지 추가 성공');
        } else {
          console.warn('⚠️ [USER_INFO_SYNC] 토스트 함수 없음, 콘솔에 표시');
          console.log(`📢 [TOAST] ${toast.title}: ${toast.description}`);
        }
      } catch (error) {
        console.error('❌ [USER_INFO_SYNC] 토스트 메시지 추가 실패:', {
          error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });

        // 실패해도 콘솔에 메시지 표시
        console.log(`📢 [TOAST_FALLBACK] ${toast.title}: ${toast.description}`);
      }
    },
    [multiStepFormStore]
  );

  return {
    formValues,
    updateFormValue,
    addToast,
  };
}

console.log('📄 [USER_INFO_SYNC] useUserInfoFormSync 모듈 로드 완료');
