// src/components/multiStepForm/store/multiStepForm/multiStepFormStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 폼 데이터 인터페이스
interface FormData {
  userImage?: string;
  nickname?: string;
  emailPrefix?: string;
  emailDomain?: string;
  bio?: string;
  title?: string;
  description?: string;
  tags?: string;
  content?: string;
  mainImage?: string | null;
  media?: string[];
  sliderImages?: string[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
  // 인덱스 시그니처 추가 - 동적 키 접근 허용
  [key: string]: string | string[] | boolean | null | undefined;
}

// 토스트 메시지 인터페이스
interface ToastMessage {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'info';
}

// 스토어 인터페이스
interface MultiStepFormStore {
  // 상태
  formData: FormData;
  toasts: ToastMessage[];

  // 액션
  getFormValues: () => FormData;
  updateFormValue: (
    fieldName: string,
    value: string | string[] | boolean | null
  ) => void;
  updateFormValues: (
    values: Record<string, string | string[] | boolean | null>
  ) => void;
  resetFormField: (fieldName: string) => void;
  resetAllFormData: () => void;
  addToast: (toast: ToastMessage) => void;
  removeToast: (index: number) => void;
  clearAllToasts: () => void;
}

// 저장할 데이터 타입 정의
interface StorageData {
  formData: FormData;
  toasts: ToastMessage[];
}

// 🔧 localStorage 저장 시 용량 체크하는 함수
const isStorageSafe = (data: StorageData): boolean => {
  try {
    const serialized = JSON.stringify(data);
    const { length: sizeInBytes } = serialized;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    console.log('📊 [STORAGE_CHECK] 저장할 데이터 크기:', {
      sizeInBytes,
      sizeInMB: sizeInMB.toFixed(2),
      timestamp: new Date().toISOString(),
    });

    // 3MB 이상이면 저장하지 않음
    if (sizeInMB > 3) {
      console.warn(
        '⚠️ [STORAGE_CHECK] 데이터 크기가 3MB 초과, localStorage 저장 건너뛰기'
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [STORAGE_CHECK] 데이터 크기 체크 실패:', error);
    return false;
  }
};

// 🔧 이미지 데이터 제외하고 저장하는 함수
const createSafeStorageData = (state: MultiStepFormStore): StorageData => {
  const { formData, toasts } = state;

  // 이미지 데이터 제외한 안전한 데이터 생성
  const safeFormData = { ...formData };

  // 큰 이미지 데이터 제외
  const { userImage } = safeFormData;
  if (userImage && userImage.length > 100000) {
    console.log(
      '📊 [SAFE_STORAGE] userImage 크기가 크므로 localStorage에서 제외'
    );
    delete safeFormData.userImage;
  }

  const { mainImage } = safeFormData;
  if (mainImage && mainImage.length > 100000) {
    console.log(
      '📊 [SAFE_STORAGE] mainImage 크기가 크므로 localStorage에서 제외'
    );
    delete safeFormData.mainImage;
  }

  // media 배열에서 큰 이미지 제외
  const { media } = safeFormData;
  if (Array.isArray(media)) {
    safeFormData.media = media.filter((item) => {
      if (typeof item === 'string' && item.length > 100000) {
        console.log(
          '📊 [SAFE_STORAGE] media 아이템 크기가 크므로 localStorage에서 제외'
        );
        return false;
      }
      return true;
    });
  }

  // sliderImages 배열에서 큰 이미지 제외
  const { sliderImages } = safeFormData;
  if (Array.isArray(sliderImages)) {
    safeFormData.sliderImages = sliderImages.filter((item) => {
      if (typeof item === 'string' && item.length > 100000) {
        console.log(
          '📊 [SAFE_STORAGE] sliderImages 아이템 크기가 크므로 localStorage에서 제외'
        );
        return false;
      }
      return true;
    });
  }

  // 최근 10개 토스트만 저장
  const { length: totalToasts } = toasts;
  const recentToasts = totalToasts > 10 ? toasts.slice(-10) : toasts;

  return {
    formData: safeFormData,
    toasts: recentToasts,
  };
};

// Zustand 스토어 생성
export const useMultiStepFormStore = create<MultiStepFormStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      formData: {},
      toasts: [],

      // 폼 값 가져오기
      getFormValues: () => {
        try {
          const state = get();
          const { formData } = state;

          console.log('📊 [STORE_GET] 폼 값 가져오기:', {
            formDataKeys: Object.keys(formData || {}),
            timestamp: new Date().toISOString(),
          });

          return formData || {};
        } catch (error) {
          console.error('❌ [STORE_GET] 폼 값 가져오기 실패:', error);
          return {};
        }
      },

      // 단일 폼 값 업데이트
      updateFormValue: (
        fieldName: string,
        value: string | string[] | boolean | null
      ) => {
        try {
          console.log('📝 [STORE_UPDATE] 폼 값 업데이트:', {
            fieldName,
            valueType: typeof value,
            valueLength: typeof value === 'string' ? value.length : 0,
            timestamp: new Date().toISOString(),
          });

          set((state) => {
            const { formData: currentFormData } = state;

            // 현재 폼 데이터가 없는 경우 기본값 사용
            const safeFormData = currentFormData || {};

            const newFormData = {
              ...safeFormData,
              [fieldName]: value,
            };

            console.log('✅ [STORE_UPDATE] 폼 값 업데이트 완료:', {
              fieldName,
              timestamp: new Date().toISOString(),
            });

            return {
              ...state,
              formData: newFormData,
            };
          });
        } catch (error) {
          console.error('❌ [STORE_UPDATE] 폼 값 업데이트 실패:', {
            fieldName,
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 여러 폼 값 업데이트
      updateFormValues: (
        values: Record<string, string | string[] | boolean | null>
      ) => {
        try {
          console.log('📝 [STORE_UPDATE_MULTI] 다중 폼 값 업데이트:', {
            fieldsToUpdate: Object.keys(values),
            timestamp: new Date().toISOString(),
          });

          set((state) => {
            const { formData: currentFormData } = state;

            // 현재 폼 데이터가 없는 경우 기본값 사용
            const safeFormData = currentFormData || {};

            const newFormData = {
              ...safeFormData,
              ...values,
            };

            console.log('✅ [STORE_UPDATE_MULTI] 다중 폼 값 업데이트 완료');

            return {
              ...state,
              formData: newFormData,
            };
          });
        } catch (error) {
          console.error('❌ [STORE_UPDATE_MULTI] 다중 폼 값 업데이트 실패:', {
            fieldsToUpdate: Object.keys(values),
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 폼 필드 초기화
      resetFormField: (fieldName: string) => {
        try {
          console.log('🔄 [STORE_RESET] 폼 필드 초기화:', {
            fieldName,
            timestamp: new Date().toISOString(),
          });

          set((state) => {
            const { formData: currentFormData } = state;

            // 현재 폼 데이터가 없는 경우 그대로 반환
            if (!currentFormData) {
              console.log('⚠️ [STORE_RESET] 폼 데이터가 없음, 변경 없음');
              return state;
            }

            const newFormData = { ...currentFormData };
            delete newFormData[fieldName];

            console.log('✅ [STORE_RESET] 폼 필드 초기화 완료:', {
              fieldName,
            });

            return {
              ...state,
              formData: newFormData,
            };
          });
        } catch (error) {
          console.error('❌ [STORE_RESET] 폼 필드 초기화 실패:', {
            fieldName,
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 전체 폼 데이터 초기화
      resetAllFormData: () => {
        try {
          console.log('🔄 [STORE_RESET_ALL] 전체 폼 데이터 초기화');

          set((state) => ({
            ...state,
            formData: {},
          }));

          console.log('✅ [STORE_RESET_ALL] 전체 폼 데이터 초기화 완료');
        } catch (error) {
          console.error('❌ [STORE_RESET_ALL] 전체 폼 데이터 초기화 실패:', {
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 토스트 메시지 추가
      addToast: (toast: ToastMessage) => {
        try {
          console.log('🍞 [STORE_TOAST] 토스트 메시지 추가:', {
            title: toast.title,
            color: toast.color,
            timestamp: new Date().toISOString(),
          });

          set((state) => {
            const { toasts: currentToasts } = state;

            // 현재 토스트 배열이 없는 경우 기본값 사용
            const safeToasts = Array.isArray(currentToasts)
              ? currentToasts
              : [];

            return {
              ...state,
              toasts: [...safeToasts, toast],
            };
          });

          console.log('✅ [STORE_TOAST] 토스트 메시지 추가 완료');
        } catch (error) {
          console.error('❌ [STORE_TOAST] 토스트 메시지 추가 실패:', {
            toast,
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 토스트 메시지 제거
      removeToast: (index: number) => {
        try {
          console.log('🗑️ [STORE_TOAST] 토스트 메시지 제거:', {
            index,
            timestamp: new Date().toISOString(),
          });

          set((state) => {
            const { toasts: currentToasts } = state;

            // 현재 토스트 배열이 없는 경우 그대로 반환
            if (!Array.isArray(currentToasts)) {
              console.log('⚠️ [STORE_TOAST] 토스트 배열이 없음, 변경 없음');
              return state;
            }

            // 인덱스 유효성 검증
            if (index < 0 || index >= currentToasts.length) {
              console.warn(
                '⚠️ [STORE_TOAST] 유효하지 않은 토스트 인덱스:',
                index
              );
              return state;
            }

            const newToasts = currentToasts.filter(
              (_, toastIndex) => toastIndex !== index
            );

            return {
              ...state,
              toasts: newToasts,
            };
          });

          console.log('✅ [STORE_TOAST] 토스트 메시지 제거 완료');
        } catch (error) {
          console.error('❌ [STORE_TOAST] 토스트 메시지 제거 실패:', {
            index,
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },

      // 모든 토스트 메시지 초기화
      clearAllToasts: () => {
        try {
          console.log('🧹 [STORE_TOAST] 모든 토스트 메시지 초기화');

          set((state) => ({
            ...state,
            toasts: [],
          }));

          console.log('✅ [STORE_TOAST] 모든 토스트 메시지 초기화 완료');
        } catch (error) {
          console.error('❌ [STORE_TOAST] 모든 토스트 메시지 초기화 실패:', {
            error,
            timestamp: new Date().toISOString(),
          });
        }
      },
    }),
    {
      name: 'multi-step-form-storage',
      // 🔧 localStorage 저장 시 안전한 데이터만 저장
      partialize: (state) => {
        try {
          const safeData = createSafeStorageData(state);

          if (isStorageSafe(safeData)) {
            console.log('✅ [PERSIST] 안전한 데이터 localStorage 저장');
            return safeData;
          } else {
            console.warn(
              '⚠️ [PERSIST] 데이터 크기 초과로 localStorage 저장 건너뛰기'
            );
            // 텍스트 데이터만 저장
            const { formData } = state;
            const textOnlyData: StorageData = {
              formData: {
                nickname: formData?.nickname,
                emailPrefix: formData?.emailPrefix,
                emailDomain: formData?.emailDomain,
                bio: formData?.bio,
                title: formData?.title,
                description: formData?.description,
                tags: formData?.tags,
                content: formData?.content,
                editorCompletedContent: formData?.editorCompletedContent,
                isEditorCompleted: formData?.isEditorCompleted,
              },
              toasts: [],
            };

            return textOnlyData;
          }
        } catch (error) {
          console.error('❌ [PERSIST] localStorage 저장 실패:', error);
          // 에러 발생 시 최소 텍스트 데이터만 저장
          const { formData } = state;
          const minimalData: StorageData = {
            formData: {
              nickname: formData?.nickname,
              emailPrefix: formData?.emailPrefix,
              emailDomain: formData?.emailDomain,
              title: formData?.title,
              description: formData?.description,
            },
            toasts: [],
          };

          return minimalData;
        }
      },
      // 🔧 저장 실패 시 에러 처리
      onRehydrateStorage: () => {
        console.log('🔄 [PERSIST] localStorage에서 데이터 복원 시작');

        return (state, error) => {
          if (error) {
            console.error('❌ [PERSIST] localStorage 복원 실패:', error);
            // localStorage 초기화
            localStorage.removeItem('multi-step-form-storage');
          } else {
            console.log('✅ [PERSIST] localStorage 복원 완료:', {
              hasFormData: !!state?.formData,
              formDataKeys: state?.formData ? Object.keys(state.formData) : [],
              timestamp: new Date().toISOString(),
            });
          }
        };
      },
    }
  )
);

console.log('📄 [STORE] multiStepFormStore 모듈 로드 완료');
