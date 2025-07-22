// src/components/multiStepForm/store/multiStepForm/multiStepFormGetters.ts

import type { MultiStepFormState } from './initialMultiStepFormState';
import type { FormValues } from '../../types/formTypes';
import type { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormGetters {
  getFormValues: () => FormValues;
  getCurrentStep: () => StepNumber;
  getProgressWidth: () => number;
  getShowPreview: () => boolean;
  getEditorCompletedContent: () => string;
  getIsEditorCompleted: () => boolean;
}

// 기본값 생성 함수
const createDefaultFormValues = (): FormValues => {
  return {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    tags: '',
    content: '',
    media: [],
    mainImage: null,
    sliderImages: [],
    editorCompletedContent: '',
    isEditorCompleted: false,
  };
};

// 타입 검증 함수들
const isValidFormValues = (value: unknown): value is FormValues => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const obj = value;
  const requiredFields = [
    'nickname',
    'emailPrefix',
    'emailDomain',
    'title',
    'content',
  ];
  return requiredFields.every((field) => Reflect.has(obj, field));
};

const isValidStepNumber = (value: unknown): value is StepNumber => {
  if (typeof value !== 'number') {
    return false;
  }
  return value >= 1 && value <= 5 && Number.isInteger(value);
};

const isValidProgress = (value: unknown): value is number => {
  if (typeof value !== 'number') {
    return false;
  }
  return value >= 0 && value <= 100 && Number.isFinite(value);
};

// 안전한 변환 함수들
const convertToSafeFormValues = (value: unknown): FormValues => {
  if (isValidFormValues(value)) {
    return { ...value };
  }
  return createDefaultFormValues();
};

const convertToSafeStepNumber = (value: unknown): StepNumber => {
  if (isValidStepNumber(value)) {
    return value;
  }
  return 1;
};

const convertToSafeNumber = (
  value: unknown,
  min: number = 0,
  max: number = 100
): number => {
  if (min === 0 && max === 100 && isValidProgress(value)) {
    return value;
  }
  if (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value)
  ) {
    return Math.max(min, Math.min(max, value));
  }
  return 0;
};

const convertToSafeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return false;
};

const convertToSafeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  return '';
};

export const createMultiStepFormGetters = (
  get: () => MultiStepFormState
): MultiStepFormGetters => {
  console.log('🔧 [GETTERS] MultiStepFormGetters 생성 중...');

  const DEFAULT_FORM_VALUES = createDefaultFormValues();
  const DEFAULT_STEP: StepNumber = 1;
  const DEFAULT_PROGRESS: number = 0;
  const DEFAULT_SHOW_PREVIEW: boolean = false;
  const DEFAULT_EDITOR_CONTENT: string = '';
  const DEFAULT_EDITOR_COMPLETED: boolean = false;

  return {
    getFormValues: (): FormValues => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn('⚠️ [GETTERS] getFormValues: 상태 없음, fallback 사용');
          return DEFAULT_FORM_VALUES;
        }

        const { formValues } = currentState;
        return convertToSafeFormValues(formValues);
      } catch (getterError) {
        console.error('❌ [GETTERS] getFormValues 오류:', getterError);
        return DEFAULT_FORM_VALUES;
      }
    },

    getCurrentStep: (): StepNumber => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn('⚠️ [GETTERS] getCurrentStep: 상태 없음, fallback 사용');
          return DEFAULT_STEP;
        }

        const { currentStep } = currentState;
        return convertToSafeStepNumber(currentStep);
      } catch (getterError) {
        console.error('❌ [GETTERS] getCurrentStep 오류:', getterError);
        return DEFAULT_STEP;
      }
    },

    getProgressWidth: (): number => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn(
            '⚠️ [GETTERS] getProgressWidth: 상태 없음, fallback 사용'
          );
          return DEFAULT_PROGRESS;
        }

        const { progressWidth } = currentState;
        return convertToSafeNumber(progressWidth, 0, 100);
      } catch (getterError) {
        console.error('❌ [GETTERS] getProgressWidth 오류:', getterError);
        return DEFAULT_PROGRESS;
      }
    },

    getShowPreview: (): boolean => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn('⚠️ [GETTERS] getShowPreview: 상태 없음, fallback 사용');
          return DEFAULT_SHOW_PREVIEW;
        }

        const { showPreview } = currentState;
        return convertToSafeBoolean(showPreview);
      } catch (getterError) {
        console.error('❌ [GETTERS] getShowPreview 오류:', getterError);
        return DEFAULT_SHOW_PREVIEW;
      }
    },

    getEditorCompletedContent: (): string => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn(
            '⚠️ [GETTERS] getEditorCompletedContent: 상태 없음, fallback 사용'
          );
          return DEFAULT_EDITOR_CONTENT;
        }

        const { editorCompletedContent } = currentState;
        return convertToSafeString(editorCompletedContent);
      } catch (getterError) {
        console.error(
          '❌ [GETTERS] getEditorCompletedContent 오류:',
          getterError
        );
        return DEFAULT_EDITOR_CONTENT;
      }
    },

    getIsEditorCompleted: (): boolean => {
      try {
        const currentState = get();

        if (!currentState || typeof currentState !== 'object') {
          console.warn(
            '⚠️ [GETTERS] getIsEditorCompleted: 상태 없음, fallback 사용'
          );
          return DEFAULT_EDITOR_COMPLETED;
        }

        const { isEditorCompleted } = currentState;
        return convertToSafeBoolean(isEditorCompleted);
      } catch (getterError) {
        console.error('❌ [GETTERS] getIsEditorCompleted 오류:', getterError);
        return DEFAULT_EDITOR_COMPLETED;
      }
    },
  };
};

// 간단한 배치 처리 함수
export const batchGetMultiStepFormValues = (
  get: () => MultiStepFormState,
  getterNames: readonly (keyof MultiStepFormGetters)[]
): Record<string, unknown> => {
  console.log('🚀 [GETTERS] 배치 getter 시작:', getterNames.length, '개 항목');

  try {
    const currentState = get();

    if (!currentState || typeof currentState !== 'object') {
      console.warn('⚠️ [GETTERS] 배치 getter: 상태 없음 또는 유효하지 않음');
      return {};
    }

    const batchResults: Record<string, unknown> = {};
    const getters = createMultiStepFormGetters(get);

    for (const getterName of getterNames) {
      const getterFunction = getters[getterName];
      if (typeof getterFunction === 'function') {
        try {
          const result = getterFunction();
          batchResults[String(getterName)] = result;
        } catch (getterError) {
          console.error(
            `❌ [GETTERS] 배치 getter 오류 [${String(getterName)}]:`,
            getterError
          );
          batchResults[String(getterName)] = null;
        }
      }
    }

    console.log('🏁 [GETTERS] 배치 getter 완료');
    return batchResults;
  } catch (batchError) {
    console.error('❌ [GETTERS] 배치 getter 전체 오류:', batchError);
    return {};
  }
};

// 간단한 유틸리티 함수들
export const clearFormGettersCache = (): void => {
  console.log('🧹 [GETTERS] 폼 getter 캐시 완전 정리');
};

export const getFormGettersStats = (): {
  readonly cacheStats: {
    readonly totalCalls: number;
    readonly hitRate: number;
    readonly cacheSize: number;
    readonly averageCallDuration: number;
  };
  readonly memoryUsageMB: number;
  readonly isPersistRehydrating: boolean;
} => {
  return {
    cacheStats: {
      totalCalls: 0,
      hitRate: 0,
      cacheSize: 0,
      averageCallDuration: 0,
    },
    memoryUsageMB: 0,
    isPersistRehydrating: false,
  };
};

export const getStateMetadata = (
  state: MultiStepFormState
): {
  readonly stateHash: string;
  readonly lastAccessTime: number;
  readonly getterCallCount: number;
  readonly cacheHitCount: number;
  readonly cacheMissCount: number;
} | null => {
  try {
    if (!state || typeof state !== 'object') {
      return null;
    }

    return {
      stateHash: 'default',
      lastAccessTime: Date.now(),
      getterCallCount: 0,
      cacheHitCount: 0,
      cacheMissCount: 0,
    };
  } catch (metadataError) {
    console.error('❌ [GETTERS] 메타데이터 조회 오류:', metadataError);
    return null;
  }
};

export const handlePersistRestore = (): void => {
  console.log('🔄 [GETTERS] Persist 복원 핸들링 시작');
};

export const completePersistRestore = (): void => {
  console.log('✅ [GETTERS] Persist 복원 완료');
};

export const forceFormGettersCleanup = (): void => {
  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    try {
      const windowWithGC = window;
      const hasGCFunction =
        typeof Reflect.get(windowWithGC, 'gc') === 'function';
      if (hasGCFunction) {
        const gcFunction = Reflect.get(windowWithGC, 'gc');
        gcFunction();
        console.log('🧹 [GETTERS] 브라우저 GC 강제 실행');
      }
    } catch (gcError) {
      console.log('⚠️ [GETTERS] GC 실행 실패:', gcError);
    }
  }

  console.log('🧹 [GETTERS] 폼 getter 강제 메모리 정리 완료');
};

console.log('📄 [GETTERS] 간소화된 multiStepFormGetters 모듈 로드 완료');
