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

// 🚀 안전한 메모리 사용량 확인 함수
const getMemoryUsageSafely = (): number => {
  try {
    const performanceWithMemory = performance as any;
    const memoryInfo = performanceWithMemory?.memory;

    if (memoryInfo && typeof memoryInfo.usedJSHeapSize === 'number') {
      return memoryInfo.usedJSHeapSize;
    }

    return 0;
  } catch (memoryError) {
    console.warn('⚠️ 메모리 정보 접근 실패:', memoryError);
    return 0;
  }
};

// 🚀 메모리 효율적인 setter 작업 캐시
const setterOperationCache = new Map<string, SetterCacheEntry>();

// 🚀 WeakMap 기반 setter 메타데이터 (자동 GC)
const setterMetadataWeakMap = new WeakMap<MultiStepFormState, SetterMetadata>();

// 🚀 setter 캐시 관리자
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
    console.log('🧠 FormSettersCacheManager 초기화:', {
      maxSize,
      expirationMs,
    });
  }

  private startPeriodicCleanup(): void {
    const cleanupIntervalMs = 2 * 60 * 1000; // 2분마다 정리
    this.cleanupIntervalId = window.setInterval(() => {
      this.performCacheCleanup();
    }, cleanupIntervalMs);
  }

  private performCacheCleanup(): void {
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

    // 만료된 캐시 제거
    for (const expiredKey of expiredKeys) {
      setterOperationCache.delete(expiredKey);
    }

    // 용량 초과 시 오래된 캐시 제거
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

    // 작업 히스토리 관리 (최근 100개만 유지)
    const maxHistorySize = 100;
    const isHistoryOverflow = this.operationHistory.length > maxHistorySize;
    if (isHistoryOverflow) {
      const excessHistoryCount = this.operationHistory.length - maxHistorySize;
      this.operationHistory.splice(0, excessHistoryCount);
    }

    console.log(
      '🧹 폼 setter 캐시 정리 완료, 현재 크기:',
      setterOperationCache.size
    );
  }

  recordOperation(
    operationHash: string,
    operationType: string,
    executionTime: number,
    affectedFields: string[]
  ): void {
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
      '📝 setter 작업 기록:',
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
    const recentOperations = this.operationHistory.slice(-20); // 최근 20개
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

  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    setterOperationCache.clear();
    this.operationHistory = [];
    this.totalSetterOperations = 0;
    console.log('🧹 FormSettersCacheManager 완전 정리');
  }
}

// 🚀 전역 setter 캐시 매니저
const globalSettersCacheManager = new FormSettersCacheManager(
  40,
  3 * 60 * 1000
);

// 🚀 메모리 효율적인 작업 해시 생성
const generateOperationHash = (
  operationType: string,
  affectedFields: string[],
  timestamp: number
): string => {
  const operationData = [
    operationType,
    affectedFields.sort().join('|'),
    String(timestamp),
  ];

  const combinedString = operationData.join('#');

  // 빠른 해시 알고리즘
  let hashValue = 0;
  for (let charIndex = 0; charIndex < combinedString.length; charIndex += 1) {
    const charCode = combinedString.charCodeAt(charIndex);
    hashValue = (hashValue << 5) - hashValue + charCode;
    hashValue = hashValue & hashValue;
  }

  return hashValue.toString(36);
};

// 🚀 setter 메타데이터 업데이트
const updateSetterMetadata = (
  currentState: MultiStepFormState,
  operationEntry: SetterCacheEntry
): void => {
  const existingMetadata = setterMetadataWeakMap.get(currentState);

  const updatedMetadata: SetterMetadata = {
    totalOperations: existingMetadata
      ? existingMetadata.totalOperations + 1
      : 1,
    lastOperationTime: operationEntry.timestamp,
    operationHistory: existingMetadata
      ? [...existingMetadata.operationHistory, operationEntry].slice(-50) // 최근 50개만 유지
      : [operationEntry],
    averageExecutionTime: existingMetadata
      ? (existingMetadata.averageExecutionTime + operationEntry.executionTime) /
        2
      : operationEntry.executionTime,
  };

  setterMetadataWeakMap.set(currentState, updatedMetadata);
};

// 🚀 메모리 최적화된 setter 함수 생성
const createOptimizedSetter = <T>(
  setterName: string,
  setterFn: (
    value: T,
    currentState: MultiStepFormState
  ) => Partial<MultiStepFormState>,
  affectedFields: string[]
) => {
  return (
    set: (updater: (state: MultiStepFormState) => MultiStepFormState) => void
  ) => {
    return (value: T): void => {
      const startTime = performance.now();

      console.log(`🔧 [SETTERS] ${setterName} 실행 시작:`, { value });

      set((currentState) => {
        try {
          // setter 함수 실행
          const stateUpdates = setterFn(value, currentState);

          // 새로운 상태 생성
          const newState: MultiStepFormState = {
            ...currentState,
            ...stateUpdates,
          };

          const executionTime = performance.now() - startTime;
          const operationHash = generateOperationHash(
            setterName,
            affectedFields,
            Date.now()
          );

          // 작업 기록
          const operationEntry: SetterCacheEntry = {
            operationHash,
            operationType: setterName,
            timestamp: Date.now(),
            executionTime,
            affectedFields: Object.freeze(affectedFields),
          };

          globalSettersCacheManager.recordOperation(
            operationHash,
            setterName,
            executionTime,
            affectedFields
          );

          updateSetterMetadata(newState, operationEntry);

          console.log(
            `✅ [SETTERS] ${setterName} 실행 완료:`,
            executionTime.toFixed(2),
            'ms'
          );

          return newState;
        } catch (setterError) {
          console.error(`❌ [SETTERS] ${setterName} 오류:`, setterError);
          return currentState; // 오류 시 기존 상태 유지
        }
      });
    };
  };
};

/**
 * 멀티스텝 폼 Setter 함수들을 생성하는 팩토리 함수
 *
 * 메모리 최적화 변경사항:
 * - 작업 기록 캐싱으로 성능 모니터링
 * - WeakMap 메타데이터로 자동 GC
 * - 에러 핸들링 강화
 * - 성능 측정 및 최적화
 *
 * @param set Zustand 스토어의 set 함수
 * @returns MultiStepFormSetters 객체
 */
export const createMultiStepFormSetters = (
  set: (updater: (state: MultiStepFormState) => MultiStepFormState) => void
): MultiStepFormSetters => {
  console.log('🔧 [SETTERS] 메모리 최적화된 MultiStepFormSetters 생성 중...');

  return {
    /**
     * 폼 값 전체 설정
     */
    setFormValues: createOptimizedSetter(
      'setFormValues',
      (values: FormValues) => {
        console.log('📝 [SETTERS] 폼 값 전체 설정:', {
          hasNickname: !!values.nickname,
          hasTitle: !!values.title,
          fieldCount: Object.keys(values).length,
        });

        return {
          formValues: Object.freeze({ ...values }),
        };
      },
      ['formValues']
    )(set),

    /**
     * 현재 스텝 설정
     */
    setCurrentStep: createOptimizedSetter(
      'setCurrentStep',
      (step: StepNumber) => {
        const isValidStep = typeof step === 'number' && step >= 1 && step <= 5;
        if (!isValidStep) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 스텝:', step);
          return {}; // 상태 변경 없음
        }

        console.log('📍 [SETTERS] 스텝 변경:', step);

        return {
          currentStep: step,
        };
      },
      ['currentStep']
    )(set),

    /**
     * 진행률 설정
     */
    setProgressWidth: createOptimizedSetter(
      'setProgressWidth',
      (width: number) => {
        const isValidWidth =
          typeof width === 'number' && width >= 0 && width <= 100;
        if (!isValidWidth) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 진행률:', width);
          return {}; // 상태 변경 없음
        }

        console.log('📊 [SETTERS] 진행률 설정:', width);

        return {
          progressWidth: width,
        };
      },
      ['progressWidth']
    )(set),

    /**
     * 미리보기 표시 상태 설정
     */
    setShowPreview: createOptimizedSetter(
      'setShowPreview',
      (show: boolean) => {
        const isBooleanType = typeof show === 'boolean';
        if (!isBooleanType) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 미리보기 상태:', show);
          return {}; // 상태 변경 없음
        }

        console.log('👁️ [SETTERS] 미리보기 상태 설정:', show);

        return {
          showPreview: show,
        };
      },
      ['showPreview']
    )(set),

    /**
     * 에디터 완성 내용 설정
     */
    setEditorCompletedContent: createOptimizedSetter(
      'setEditorCompletedContent',
      (content: string) => {
        const isStringType = typeof content === 'string';
        if (!isStringType) {
          console.warn(
            '⚠️ [SETTERS] 유효하지 않은 에디터 내용:',
            typeof content
          );
          return {}; // 상태 변경 없음
        }

        console.log('✏️ [SETTERS] 에디터 내용 설정:', {
          contentLength: content.length,
          hasContent: content.length > 0,
        });

        return {
          editorCompletedContent: content,
        };
      },
      ['editorCompletedContent']
    )(set),

    /**
     * 에디터 완료 상태 설정
     */
    setIsEditorCompleted: createOptimizedSetter(
      'setIsEditorCompleted',
      (completed: boolean) => {
        const isBooleanType = typeof completed === 'boolean';
        if (!isBooleanType) {
          console.warn(
            '⚠️ [SETTERS] 유효하지 않은 에디터 완료 상태:',
            completed
          );
          return {}; // 상태 변경 없음
        }

        console.log('✅ [SETTERS] 에디터 완료 상태 설정:', completed);

        return {
          isEditorCompleted: completed,
        };
      },
      ['isEditorCompleted']
    )(set),

    /**
     * 개별 폼 필드 업데이트
     */
    updateFormField: createOptimizedSetter(
      'updateFormField',
      <K extends keyof FormValues>(
        updateData: { field: K; value: FormValues[K] },
        currentState: MultiStepFormState
      ) => {
        const { field, value } = updateData;
        const { formValues: currentFormValues } = currentState;

        const safeFormValues = currentFormValues || {};

        console.log('🔄 [SETTERS] 개별 필드 업데이트:', {
          field: String(field),
          valueType: typeof value,
        });

        const updatedFormValues: FormValues = {
          ...safeFormValues,
          [field]: value,
        };

        return {
          formValues: Object.freeze(updatedFormValues),
        };
      },
      ['formValues']
    )(set) as <K extends keyof FormValues>(
      field: K,
      value: FormValues[K]
    ) => void,

    /**
     * 폼을 초기 상태로 리셋
     */
    resetFormToInitialState: createOptimizedSetter(
      'resetFormToInitialState',
      () => {
        console.log('🔄 [SETTERS] 폼 초기 상태로 리셋');

        // 초기 폼 값 생성
        const initialFormValues: FormValues = Object.freeze({
          userImage: '',
          nickname: '',
          emailPrefix: '',
          emailDomain: '',
          bio: '',
          title: '',
          description: '',
          tags: '',
          content: '',
          media: Object.freeze([]),
          mainImage: null,
          sliderImages: Object.freeze([]),
          editorCompletedContent: '',
          isEditorCompleted: false,
        });

        return {
          formValues: initialFormValues,
          currentStep: 1 as StepNumber,
          progressWidth: 0,
          showPreview: false,
          editorCompletedContent: '',
          isEditorCompleted: false,
        };
      },
      [
        'formValues',
        'currentStep',
        'progressWidth',
        'showPreview',
        'editorCompletedContent',
        'isEditorCompleted',
      ]
    )(set),
  };
};

// 🚀 배치 setter 최적화 (여러 값 동시 설정)
export const batchUpdateMultiStepFormState = (
  set: (updater: (state: MultiStepFormState) => MultiStepFormState) => void,
  updates: Partial<MultiStepFormState>
): void => {
  console.log('🚀 배치 상태 업데이트 시작:', Object.keys(updates));

  const startTime = performance.now();

  set((currentState) => {
    try {
      const newState: MultiStepFormState = {
        ...currentState,
        ...updates,
      };

      const executionTime = performance.now() - startTime;
      const affectedFields = Object.keys(updates);
      const operationHash = generateOperationHash(
        'batchUpdate',
        affectedFields,
        Date.now()
      );

      globalSettersCacheManager.recordOperation(
        operationHash,
        'batchUpdate',
        executionTime,
        affectedFields
      );

      console.log(
        '🏁 배치 상태 업데이트 완료:',
        executionTime.toFixed(2),
        'ms'
      );

      return newState;
    } catch (batchError) {
      console.error('❌ 배치 상태 업데이트 오류:', batchError);
      return currentState;
    }
  });
};

// 🚀 메모리 정리 유틸리티 함수들
export const clearFormSettersCache = (): void => {
  globalSettersCacheManager.destroy();
  console.log('🧹 폼 setter 캐시 완전 정리');
};

export const getFormSettersStats = (): {
  readonly operationStats: ReturnType<
    typeof globalSettersCacheManager.getOperationStats
  >;
  readonly memoryUsageMB: number;
} => {
  const operationStats = globalSettersCacheManager.getOperationStats();
  const memoryUsageBytes = getMemoryUsageSafely();
  const memoryUsageMB = memoryUsageBytes / (1024 * 1024);

  return {
    operationStats,
    memoryUsageMB,
  };
};

// 🚀 setter 메타데이터 조회
export const getSetterMetadata = (
  state: MultiStepFormState
): SetterMetadata | null => {
  return setterMetadataWeakMap.get(state) || null;
};

// 🚀 강제 메모리 정리
export const forceFormSettersCleanup = (): void => {
  globalSettersCacheManager.destroy();

  // 브라우저 GC 힌트 (안전한 방식)
  const hasWindow = typeof window !== 'undefined';
  if (hasWindow) {
    try {
      const windowWithGC = window as any;
      if (typeof windowWithGC.gc === 'function') {
        windowWithGC.gc();
        console.log('🧹 브라우저 GC 강제 실행');
      }
    } catch (gcError) {
      console.log('⚠️ GC 실행 실패:', gcError);
    }
  }

  console.log('🧹 폼 setter 강제 메모리 정리 완료');
};

console.log('📄 [SETTERS] 메모리 최적화된 multiStepFormSetters 모듈 로드 완료');
