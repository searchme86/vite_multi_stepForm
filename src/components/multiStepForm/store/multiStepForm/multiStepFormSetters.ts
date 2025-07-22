// src/components/multiStepForm/store/multiStepForm/multiStepFormSetters.ts

import type { MultiStepFormState } from './initialMultiStepFormState';
import type { FormValues } from '../../types/formTypes';
import type { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormSetters {
  setFormValues: (values: FormValues) => void;
  setCurrentStep: (step: StepNumber) => void;
  setProgressWidth: (width: number) => void;
  setShowPreview: (show: boolean) => void;
  setEditorCompletedContent: (content: string) => void;
  setIsEditorCompleted: (completed: boolean) => void;
  updateFormField: <K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) => void;
  resetFormToInitialState: () => void;
}

interface SetterCacheEntry {
  readonly operationHash: string;
  readonly operationType: string;
  readonly timestamp: number;
  readonly executionTime: number;
  readonly affectedFields: readonly string[];
}

interface SetterMetadata {
  readonly totalOperations: number;
  readonly lastOperationTime: number;
  readonly operationHistory: readonly SetterCacheEntry[];
  readonly averageExecutionTime: number;
}

const getMemoryUsageSafely = (): number => {
  try {
    const hasPerformance = typeof performance !== 'undefined';
    if (!hasPerformance) {
      return 0;
    }

    const performanceWithMemory = performance;
    const memoryInfo = Reflect.get(performanceWithMemory, 'memory');

    const hasMemoryInfo =
      memoryInfo &&
      typeof Reflect.get(memoryInfo, 'usedJSHeapSize') === 'number';
    if (hasMemoryInfo) {
      return Reflect.get(memoryInfo, 'usedJSHeapSize');
    }

    return 0;
  } catch (memoryError) {
    console.warn('⚠️ [SETTERS] 메모리 정보 접근 실패:', memoryError);
    return 0;
  }
};

const setterOperationCache = new Map<string, SetterCacheEntry>();
const setterMetadataWeakMap = new WeakMap<MultiStepFormState, SetterMetadata>();

let isPersistRehydrating = false;
let isInitialLoadComplete = false;

const setPersistRehydrationState = (rehydrating: boolean): void => {
  isPersistRehydrating = rehydrating;

  if (!rehydrating && !isInitialLoadComplete) {
    console.log('✅ [SETTERS] Persist 복원 완료, 캐시 초기화');
    setterOperationCache.clear();
    isInitialLoadComplete = true;
  }
};

class FormSettersCacheManager {
  private readonly maxCacheSize: number;
  private readonly cacheExpirationMs: number;
  private cleanupIntervalId: number | null;
  private totalSetterOperations: number;
  private operationHistory: SetterCacheEntry[];

  constructor(maxSize: number = 50, expirationMs: number = 5 * 60 * 1000) {
    this.maxCacheSize = maxSize;
    this.cacheExpirationMs = expirationMs;
    this.cleanupIntervalId = null;
    this.totalSetterOperations = 0;
    this.operationHistory = [];
    this.startPeriodicCleanup();
    console.log('🧠 [SETTERS] FormSettersCacheManager 초기화:', {
      maxSize,
      expirationMs,
    });
  }

  private startPeriodicCleanup(): void {
    const cleanupIntervalMs = 2 * 60 * 1000;

    this.cleanupIntervalId = window.setInterval(() => {
      if (isPersistRehydrating) {
        console.log('⏳ [SETTERS] Persist 복원 중으로 캐시 정리 지연');
        return;
      }

      this.performCacheCleanup();
    }, cleanupIntervalMs);
  }

  private performCacheCleanup(): void {
    try {
      const currentTime = Date.now();
      const expiredKeys: string[] = [];

      for (const [cacheKey, cacheEntry] of setterOperationCache) {
        const { timestamp } = cacheEntry;
        const cacheAge = currentTime - timestamp;

        const isExpired = cacheAge > this.cacheExpirationMs;
        if (isExpired) {
          expiredKeys.push(cacheKey);
        }
      }

      for (const expiredKey of expiredKeys) {
        setterOperationCache.delete(expiredKey);
      }

      const isOverCapacity = setterOperationCache.size > this.maxCacheSize;
      if (isOverCapacity) {
        const sortedEntries = Array.from(setterOperationCache.entries()).sort(
          ([, entryA], [, entryB]) => entryA.timestamp - entryB.timestamp
        );

        const excessCount = setterOperationCache.size - this.maxCacheSize;
        const entriesToRemove = sortedEntries.slice(0, excessCount);

        for (const [keyToRemove] of entriesToRemove) {
          setterOperationCache.delete(keyToRemove);
        }
      }

      const maxHistorySize = 100;
      const isHistoryOverflow = this.operationHistory.length > maxHistorySize;
      if (isHistoryOverflow) {
        const excessHistoryCount =
          this.operationHistory.length - maxHistorySize;
        this.operationHistory.splice(0, excessHistoryCount);
      }

      console.log(
        '🧹 [SETTERS] 폼 setter 캐시 정리 완료, 현재 크기:',
        setterOperationCache.size
      );
    } catch (cleanupError) {
      console.error('❌ [SETTERS] 캐시 정리 오류:', cleanupError);
    }
  }

  recordOperation(
    operationHash: string,
    operationType: string,
    executionTime: number,
    affectedFields: string[]
  ): void {
    if (isPersistRehydrating) {
      return;
    }

    this.totalSetterOperations += 1;

    const operationEntry: SetterCacheEntry = {
      operationHash,
      operationType,
      timestamp: Date.now(),
      executionTime,
      affectedFields: Object.freeze(affectedFields),
    };

    setterOperationCache.set(operationHash, operationEntry);
    this.operationHistory.push(operationEntry);

    console.log(
      '📝 [SETTERS] setter 작업 기록:',
      operationType,
      executionTime.toFixed(2),
      'ms'
    );
  }

  getOperationStats(): {
    readonly totalOperations: number;
    readonly cacheSize: number;
    readonly averageExecutionTime: number;
    readonly recentOperationsCount: number;
  } {
    const recentOperations = this.operationHistory.slice(-20);
    const averageExecutionTime =
      recentOperations.length > 0
        ? recentOperations.reduce((sum, op) => sum + op.executionTime, 0) /
          recentOperations.length
        : 0;

    return {
      totalOperations: this.totalSetterOperations,
      cacheSize: setterOperationCache.size,
      averageExecutionTime,
      recentOperationsCount: recentOperations.length,
    };
  }

  clearCacheForPersistRestore(): void {
    console.log('🔄 [SETTERS] Persist 복원을 위한 캐시 초기화');
    setterOperationCache.clear();
    this.operationHistory = [];
  }

  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    setterOperationCache.clear();
    this.operationHistory = [];
    this.totalSetterOperations = 0;
    console.log('🧹 [SETTERS] FormSettersCacheManager 완전 정리');
  }
}

const globalSettersCacheManager = new FormSettersCacheManager(
  40,
  3 * 60 * 1000
);

const generateOperationHash = (
  operationType: string,
  affectedFields: string[],
  timestamp: number
): string => {
  try {
    const operationData = [
      operationType,
      affectedFields.sort().join('|'),
      String(timestamp),
    ];

    const combinedString = operationData.join('#');

    let hashValue = 0;
    for (let charIndex = 0; charIndex < combinedString.length; charIndex += 1) {
      const charCode = combinedString.charCodeAt(charIndex);
      hashValue = (hashValue << 5) - hashValue + charCode;
      hashValue = hashValue & hashValue;
    }

    return hashValue.toString(36);
  } catch (hashError) {
    console.error('❌ [SETTERS] 작업 해시 생성 오류:', hashError);
    return `error_${Date.now()}`;
  }
};

const updateSetterMetadata = (
  currentState: MultiStepFormState,
  operationEntry: SetterCacheEntry
): void => {
  try {
    if (isPersistRehydrating) {
      return;
    }

    const existingMetadata = setterMetadataWeakMap.get(currentState);

    const updatedMetadata: SetterMetadata = {
      totalOperations: existingMetadata
        ? existingMetadata.totalOperations + 1
        : 1,
      lastOperationTime: operationEntry.timestamp,
      operationHistory: existingMetadata
        ? [...existingMetadata.operationHistory, operationEntry].slice(-50)
        : [operationEntry],
      averageExecutionTime: existingMetadata
        ? (existingMetadata.averageExecutionTime +
            operationEntry.executionTime) /
          2
        : operationEntry.executionTime,
    };

    setterMetadataWeakMap.set(currentState, updatedMetadata);
  } catch (metadataError) {
    console.error('❌ [SETTERS] 메타데이터 업데이트 오류:', metadataError);
  }
};

// 타입 가드 함수들
const isValidFormValues = (values: unknown): values is FormValues => {
  if (!values || typeof values !== 'object') {
    return false;
  }

  const requiredFields = [
    'nickname',
    'emailPrefix',
    'emailDomain',
    'title',
    'content',
  ];
  return requiredFields.every((field) => Reflect.has(values, field));
};

const isValidStepNumber = (step: unknown): step is StepNumber => {
  if (typeof step !== 'number') {
    return false;
  }
  return step >= 1 && step <= 5 && Number.isInteger(step);
};

const isValidProgress = (width: unknown): width is number => {
  if (typeof width !== 'number') {
    return false;
  }
  return width >= 0 && width <= 100 && Number.isFinite(width);
};

// 기본 FormValues 생성 함수
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

export const createMultiStepFormSetters = (
  set: (updater: (state: MultiStepFormState) => MultiStepFormState) => void
): MultiStepFormSetters => {
  console.log('🔧 [SETTERS] 메모리 최적화된 MultiStepFormSetters 생성 중...');

  return {
    setFormValues: (values: FormValues): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setFormValues 실행 시작');

      if (!isValidFormValues(values)) {
        console.warn('⚠️ [SETTERS] 유효하지 않은 FormValues:', values);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            formValues: { ...values },
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setFormValues',
            ['formValues'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setFormValues',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['formValues']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setFormValues',
            executionTime,
            ['formValues']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setFormValues 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error('❌ [SETTERS] setFormValues 오류:', setterError);
          return currentState;
        }
      });
    },

    setCurrentStep: (step: StepNumber): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setCurrentStep 실행 시작:', step);

      if (!isValidStepNumber(step)) {
        console.warn('⚠️ [SETTERS] 유효하지 않은 스텝:', step);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            currentStep: step,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setCurrentStep',
            ['currentStep'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setCurrentStep',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['currentStep']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setCurrentStep',
            executionTime,
            ['currentStep']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setCurrentStep 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error('❌ [SETTERS] setCurrentStep 오류:', setterError);
          return currentState;
        }
      });
    },

    setProgressWidth: (width: number): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setProgressWidth 실행 시작:', width);

      if (!isValidProgress(width)) {
        console.warn('⚠️ [SETTERS] 유효하지 않은 진행률:', width);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            progressWidth: width,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setProgressWidth',
            ['progressWidth'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setProgressWidth',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['progressWidth']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setProgressWidth',
            executionTime,
            ['progressWidth']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setProgressWidth 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error('❌ [SETTERS] setProgressWidth 오류:', setterError);
          return currentState;
        }
      });
    },

    setShowPreview: (show: boolean): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setShowPreview 실행 시작:', show);

      if (typeof show !== 'boolean') {
        console.warn('⚠️ [SETTERS] 유효하지 않은 미리보기 상태:', show);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            showPreview: show,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setShowPreview',
            ['showPreview'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setShowPreview',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['showPreview']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setShowPreview',
            executionTime,
            ['showPreview']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setShowPreview 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error('❌ [SETTERS] setShowPreview 오류:', setterError);
          return currentState;
        }
      });
    },

    setEditorCompletedContent: (content: string): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setEditorCompletedContent 실행 시작');

      if (typeof content !== 'string') {
        console.warn('⚠️ [SETTERS] 유효하지 않은 에디터 내용:', typeof content);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            editorCompletedContent: content,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setEditorCompletedContent',
            ['editorCompletedContent'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setEditorCompletedContent',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['editorCompletedContent']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setEditorCompletedContent',
            executionTime,
            ['editorCompletedContent']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setEditorCompletedContent 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error(
            '❌ [SETTERS] setEditorCompletedContent 오류:',
            setterError
          );
          return currentState;
        }
      });
    },

    setIsEditorCompleted: (completed: boolean): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] setIsEditorCompleted 실행 시작:', completed);

      if (typeof completed !== 'boolean') {
        console.warn('⚠️ [SETTERS] 유효하지 않은 에디터 완료 상태:', completed);
        return;
      }

      set((currentState) => {
        try {
          const updatedState: MultiStepFormState = {
            ...currentState,
            isEditorCompleted: completed,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'setIsEditorCompleted',
            ['isEditorCompleted'],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'setIsEditorCompleted',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(['isEditorCompleted']),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'setIsEditorCompleted',
            executionTime,
            ['isEditorCompleted']
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] setIsEditorCompleted 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (setterError) {
          console.error('❌ [SETTERS] setIsEditorCompleted 오류:', setterError);
          return currentState;
        }
      });
    },

    updateFormField: <K extends keyof FormValues>(
      field: K,
      value: FormValues[K]
    ): void => {
      const startTime = performance.now();
      console.log('🔧 [SETTERS] updateFormField 실행 시작:', { field, value });

      set((currentState) => {
        try {
          if (!currentState || typeof currentState !== 'object') {
            console.error(
              '❌ [SETTERS] updateFormField: 유효하지 않은 현재 상태'
            );
            return currentState;
          }

          const { formValues = null } = currentState;
          const safeFormValues = formValues || createDefaultFormValues();

          const updatedFormValues: FormValues = {
            ...safeFormValues,
            [field]: value,
          };

          const updatedState: MultiStepFormState = {
            ...currentState,
            formValues: updatedFormValues,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'updateFormField',
            [String(field)],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'updateFormField',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze([String(field)]),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'updateFormField',
            executionTime,
            [String(field)]
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] updateFormField 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (updateError) {
          console.error('❌ [SETTERS] updateFormField 오류:', updateError);
          return currentState;
        }
      });
    },

    resetFormToInitialState: (): void => {
      const startTime = performance.now();
      console.log('🔄 [SETTERS] resetFormToInitialState 실행 시작');

      set((currentState) => {
        try {
          const initialFormValues = createDefaultFormValues();

          const updatedState: MultiStepFormState = {
            ...currentState,
            formValues: initialFormValues,
            currentStep: 1,
            progressWidth: 0,
            showPreview: false,
            editorCompletedContent: '',
            isEditorCompleted: false,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            'resetFormToInitialState',
            [
              'formValues',
              'currentStep',
              'progressWidth',
              'showPreview',
              'editorCompletedContent',
              'isEditorCompleted',
            ],
            Date.now()
          );

          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: 'resetFormToInitialState',
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze([
              'formValues',
              'currentStep',
              'progressWidth',
              'showPreview',
              'editorCompletedContent',
              'isEditorCompleted',
            ]),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            'resetFormToInitialState',
            executionTime,
            [
              'formValues',
              'currentStep',
              'progressWidth',
              'showPreview',
              'editorCompletedContent',
              'isEditorCompleted',
            ]
          );

          updateSetterMetadata(updatedState, operationEntry);
          console.log(
            '✅ [SETTERS] resetFormToInitialState 완료:',
            executionTime.toFixed(2),
            'ms'
          );

          return updatedState;
        } catch (resetError) {
          console.error(
            '❌ [SETTERS] resetFormToInitialState 오류:',
            resetError
          );
          return currentState;
        }
      });
    },
  };
};

export const clearFormSettersCache = (): void => {
  globalSettersCacheManager.destroy();
  console.log('🧹 [SETTERS] 폼 setter 캐시 완전 정리');
};

export const getFormSettersStats = (): {
  readonly operationStats: ReturnType<
    typeof globalSettersCacheManager.getOperationStats
  >;
  readonly memoryUsageMB: number;
  readonly isPersistRehydrating: boolean;
} => {
  const operationStats = globalSettersCacheManager.getOperationStats();
  const memoryUsageBytes = getMemoryUsageSafely();
  const memoryUsageMB = memoryUsageBytes / (1024 * 1024);

  return {
    operationStats,
    memoryUsageMB,
    isPersistRehydrating,
  };
};

export const getSetterMetadata = (
  state: MultiStepFormState
): SetterMetadata | null => {
  try {
    return setterMetadataWeakMap.get(state) || null;
  } catch (metadataError) {
    console.error('❌ [SETTERS] 메타데이터 조회 오류:', metadataError);
    return null;
  }
};

export const handlePersistRestoreSetters = (): void => {
  console.log('🔄 [SETTERS] Persist 복원 핸들링 시작');
  setPersistRehydrationState(true);
  globalSettersCacheManager.clearCacheForPersistRestore();
};

export const completePersistRestoreSetters = (): void => {
  console.log('✅ [SETTERS] Persist 복원 완료');
  setPersistRehydrationState(false);
};

export const forceFormSettersCleanup = (): void => {
  globalSettersCacheManager.destroy();

  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    try {
      const windowWithGC = window;
      const hasGCFunction =
        typeof Reflect.get(windowWithGC, 'gc') === 'function';
      if (hasGCFunction) {
        const gcFunction = Reflect.get(windowWithGC, 'gc');
        gcFunction();
        console.log('🧹 [SETTERS] 브라우저 GC 강제 실행');
      }
    } catch (gcError) {
      console.log('⚠️ [SETTERS] GC 실행 실패:', gcError);
    }
  }

  console.log('🧹 [SETTERS] 폼 setter 강제 메모리 정리 완료');
};

console.log(
  '📄 [SETTERS] 🚨 Persist 호환성 강화된 multiStepFormSetters 모듈 로드 완료'
);
