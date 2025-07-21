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

interface GetterCacheEntry {
  readonly stateHash: string;
  readonly cachedValue: unknown;
  readonly creationTime: number;
  readonly accessCount: number;
  readonly getterName: string;
}

interface StateMetadata {
  readonly stateHash: string;
  readonly lastAccessTime: number;
  readonly getterCallCount: number;
  readonly cacheHitCount: number;
  readonly cacheMissCount: number;
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

// 🚀 메모리 효율적인 getter 결과 캐시
const getterResultCache = new Map<string, GetterCacheEntry>();

// 🚀 WeakMap 기반 상태 메타데이터 (자동 GC)
const stateMetadataWeakMap = new WeakMap<MultiStepFormState, StateMetadata>();

// 🚀 getter 캐시 관리자
class FormGettersCacheManager {
  private readonly maxCacheSize: number;
  private readonly cacheExpirationMs: number;
  private cleanupIntervalId: number | null;
  private totalGetterCalls: number;
  private totalCacheHits: number;
  private totalCacheMisses: number;
  private getterCallHistory: {
    getterName: string;
    timestamp: number;
    duration: number;
  }[];

  constructor(maxSize: number = 30, expirationMs: number = 2 * 60 * 1000) {
    this.maxCacheSize = maxSize;
    this.cacheExpirationMs = expirationMs;
    this.cleanupIntervalId = null;
    this.totalGetterCalls = 0;
    this.totalCacheHits = 0;
    this.totalCacheMisses = 0;
    this.getterCallHistory = [];
    this.startPeriodicCleanup();
    console.log('🧠 FormGettersCacheManager 초기화:', {
      maxSize,
      expirationMs,
    });
  }

  private startPeriodicCleanup(): void {
    const cleanupIntervalMs = 60 * 1000; // 1분마다 정리
    this.cleanupIntervalId = window.setInterval(() => {
      this.performCacheCleanup();
    }, cleanupIntervalMs);
  }

  private performCacheCleanup(): void {
    const currentTime = Date.now();
    const expiredKeys: string[] = [];

    for (const [cacheKey, cacheEntry] of getterResultCache) {
      const { creationTime } = cacheEntry;
      const cacheAge = currentTime - creationTime;

      const isExpired = cacheAge > this.cacheExpirationMs;
      if (isExpired) {
        expiredKeys.push(cacheKey);
      }
    }

    // 만료된 캐시 제거
    for (const expiredKey of expiredKeys) {
      getterResultCache.delete(expiredKey);
    }

    // 용량 초과 시 LRU + 접근 빈도 기반 제거
    const isOverCapacity = getterResultCache.size > this.maxCacheSize;
    if (isOverCapacity) {
      const sortedEntries = Array.from(getterResultCache.entries()).sort(
        ([, entryA], [, entryB]) => {
          // 접근 빈도(70%)와 최신성(30%)을 고려한 점수
          const scoreA =
            entryA.accessCount * 0.7 +
            (currentTime - entryA.creationTime) * 0.3;
          const scoreB =
            entryB.accessCount * 0.7 +
            (currentTime - entryB.creationTime) * 0.3;
          return scoreA - scoreB;
        }
      );

      const excessCount = getterResultCache.size - this.maxCacheSize;
      const entriesToRemove = sortedEntries.slice(0, excessCount);

      for (const [keyToRemove] of entriesToRemove) {
        getterResultCache.delete(keyToRemove);
      }
    }

    // 호출 히스토리 관리 (최근 200개만 유지)
    const maxHistorySize = 200;
    const isHistoryOverflow = this.getterCallHistory.length > maxHistorySize;
    if (isHistoryOverflow) {
      const excessHistoryCount = this.getterCallHistory.length - maxHistorySize;
      this.getterCallHistory.splice(0, excessHistoryCount);
    }

    console.log(
      '🧹 폼 getter 캐시 정리 완료, 현재 크기:',
      getterResultCache.size
    );
  }

  recordGetterCall(getterName: string, duration: number): void {
    this.totalGetterCalls += 1;
    this.getterCallHistory.push({
      getterName,
      timestamp: Date.now(),
      duration,
    });
  }

  getFromCache(cacheKey: string): unknown | null {
    const cacheEntry = getterResultCache.get(cacheKey);

    if (cacheEntry) {
      this.totalCacheHits += 1;

      // 접근 횟수 증가
      const updatedEntry: GetterCacheEntry = {
        ...cacheEntry,
        accessCount: cacheEntry.accessCount + 1,
      };
      getterResultCache.set(cacheKey, updatedEntry);

      console.log(
        '⚡ getter 캐시 히트:',
        cacheEntry.getterName,
        cacheKey.slice(0, 8)
      );
      return cacheEntry.cachedValue;
    }

    this.totalCacheMisses += 1;
    return null;
  }

  setToCache(
    cacheKey: string,
    value: unknown,
    getterName: string,
    stateHash: string
  ): void {
    const currentTime = Date.now();

    const cacheEntry: GetterCacheEntry = {
      stateHash,
      cachedValue: value,
      creationTime: currentTime,
      accessCount: 1,
      getterName,
    };

    getterResultCache.set(cacheKey, cacheEntry);
    console.log(
      '💾 새로운 getter 캐시 저장:',
      getterName,
      cacheKey.slice(0, 8)
    );
  }

  getCacheStats(): {
    readonly totalCalls: number;
    readonly hitRate: number;
    readonly cacheSize: number;
    readonly averageCallDuration: number;
  } {
    const totalRequests = this.totalCacheHits + this.totalCacheMisses;
    const hitRate =
      totalRequests > 0 ? (this.totalCacheHits / totalRequests) * 100 : 0;

    const recentCallDurations = this.getterCallHistory
      .slice(-50) // 최근 50개
      .map((call) => call.duration);

    const averageCallDuration =
      recentCallDurations.length > 0
        ? recentCallDurations.reduce((sum, duration) => sum + duration, 0) /
          recentCallDurations.length
        : 0;

    return {
      totalCalls: this.totalGetterCalls,
      hitRate,
      cacheSize: getterResultCache.size,
      averageCallDuration,
    };
  }

  destroy(): void {
    if (this.cleanupIntervalId !== null) {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }

    getterResultCache.clear();
    this.totalGetterCalls = 0;
    this.totalCacheHits = 0;
    this.totalCacheMisses = 0;
    this.getterCallHistory = [];
    console.log('🧹 FormGettersCacheManager 완전 정리');
  }
}

// 🚀 전역 getter 캐시 매니저
const globalGettersCacheManager = new FormGettersCacheManager(25, 90 * 1000);

// 🚀 메모리 효율적인 상태 해시 생성
const generateStateHashOptimized = (state: MultiStepFormState): string => {
  const {
    currentStep = 1,
    progressWidth = 0,
    showPreview = false,
    editorCompletedContent = '',
    isEditorCompleted = false,
    formValues = null,
  } = state;

  // 핵심 상태 값들을 계층별로 구성
  const coreStateComponents = [
    String(currentStep),
    String(progressWidth),
    String(showPreview),
    String(isEditorCompleted),
  ];

  const contentComponents = [
    editorCompletedContent.slice(0, 50), // 내용은 첫 50자만
    formValues?.nickname || '',
    formValues?.title || '',
  ];

  const stateGroups = [
    coreStateComponents.join('|'),
    contentComponents.join('|'),
  ];

  const combinedString = stateGroups.join('#');

  // 빠른 해시 알고리즘 (FNV-1a 변형)
  let hashValue = 2166136261;
  for (let charIndex = 0; charIndex < combinedString.length; charIndex += 1) {
    const charCode = combinedString.charCodeAt(charIndex);
    hashValue ^= charCode;
    hashValue *= 16777619;
    hashValue = hashValue >>> 0; // 32비트 unsigned 정수로 변환
  }

  const hashString = hashValue.toString(36);
  console.log('🔢 상태 해시 생성:', hashString);
  return hashString;
};

// 🚀 상태 메타데이터 업데이트
const updateStateMetadata = (
  state: MultiStepFormState,
  stateHash: string,
  isHit: boolean
): void => {
  const existingMetadata = stateMetadataWeakMap.get(state);

  const updatedMetadata: StateMetadata = {
    stateHash,
    lastAccessTime: Date.now(),
    getterCallCount: existingMetadata
      ? existingMetadata.getterCallCount + 1
      : 1,
    cacheHitCount: existingMetadata
      ? existingMetadata.cacheHitCount + (isHit ? 1 : 0)
      : isHit
      ? 1
      : 0,
    cacheMissCount: existingMetadata
      ? existingMetadata.cacheMissCount + (isHit ? 0 : 1)
      : isHit
      ? 0
      : 1,
  };

  stateMetadataWeakMap.set(state, updatedMetadata);
};

// 🚀 타입 안전한 캐시 값 변환 함수 (제네릭 제약 조건 수정)
const convertCachedValueSafely = <T extends string | number | boolean | object>(
  cachedValue: unknown,
  fallbackValue: T,
  getterName: string
): T => {
  // null/undefined 체크
  const isNullOrUndefined = cachedValue === null || cachedValue === undefined;
  if (isNullOrUndefined) {
    console.warn(`⚠️ [GETTERS] ${getterName}: 캐시 값이 null/undefined`);
    return fallbackValue;
  }

  // 타입별 검증 및 안전한 변환
  const fallbackType = typeof fallbackValue;
  const cachedType = typeof cachedValue;

  // 타입이 일치하는 경우에만 처리
  const isTypeMatching = fallbackType === cachedType;
  if (!isTypeMatching) {
    console.warn(`⚠️ [GETTERS] ${getterName}: 타입 불일치`, {
      expected: fallbackType,
      actual: cachedType,
    });
    return fallbackValue;
  }

  console.log(`✅ [GETTERS] ${getterName}: 캐시 타입 검증 통과`);

  // 타입별 안전한 변환
  if (fallbackType === 'number') {
    const isNumber = typeof cachedValue === 'number';
    if (isNumber) {
      const isValidNumber =
        !Number.isNaN(cachedValue) && Number.isFinite(cachedValue);
      if (isValidNumber) {
        return cachedValue as T;
      }
    }
    return fallbackValue;
  }

  if (fallbackType === 'string') {
    const isString = typeof cachedValue === 'string';
    if (isString) {
      return cachedValue as T;
    }
    return fallbackValue;
  }

  if (fallbackType === 'boolean') {
    const isBoolean = typeof cachedValue === 'boolean';
    if (isBoolean) {
      return cachedValue as T;
    }
    return fallbackValue;
  }

  if (fallbackType === 'object' && fallbackValue !== null) {
    const isObject = typeof cachedValue === 'object' && cachedValue !== null;
    if (isObject) {
      const objectValue = cachedValue;

      // Record 타입 검증
      const isCachedRecord =
        objectValue !== null && typeof objectValue === 'object';
      const isFallbackRecord =
        fallbackValue !== null && typeof fallbackValue === 'object';

      if (isCachedRecord && isFallbackRecord) {
        const fallbackKeys = Object.keys(fallbackValue);
        const hasRequiredKeys = fallbackKeys.every((key) =>
          Reflect.has(objectValue, key)
        );

        if (hasRequiredKeys) {
          return cachedValue as T;
        }
      }
    }
    return fallbackValue;
  }

  // 기타 타입은 fallback 사용
  console.warn(`⚠️ [GETTERS] ${getterName}: 지원하지 않는 타입`, fallbackType);
  return fallbackValue;
};

// 🚀 메모리 최적화된 캐시 키 생성
const generateCacheKey = (stateHash: string, getterName: string): string => {
  return `${stateHash}_${getterName}`;
};

// 🚀 메모리 최적화된 기본 FormValues 생성
const createDefaultFormValuesOptimized = (): FormValues => {
  return Object.freeze({
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
};

// 🚀 메모리 최적화된 getter 함수 생성 (시그니처 수정)
const createOptimizedGetter = <T extends string | number | boolean | object>(
  getterName: string,
  extractorFn: (state: MultiStepFormState) => T,
  fallbackValue: T
) => {
  return (get: () => MultiStepFormState): T => {
    const startTime = performance.now();

    try {
      const currentState = get();

      if (!currentState) {
        console.warn(`⚠️ [GETTERS] ${getterName}: 상태 없음, fallback 사용`);
        globalGettersCacheManager.recordGetterCall(
          getterName,
          performance.now() - startTime
        );
        return fallbackValue;
      }

      // 상태 해시 생성
      const stateHash = generateStateHashOptimized(currentState);
      const cacheKey = generateCacheKey(stateHash, getterName);

      // 캐시 확인
      const cachedResult = globalGettersCacheManager.getFromCache(cacheKey);
      if (cachedResult !== null) {
        // 타입 안전한 변환 사용
        const safeResult = convertCachedValueSafely(
          cachedResult,
          fallbackValue,
          getterName
        );
        updateStateMetadata(currentState, stateHash, true);
        globalGettersCacheManager.recordGetterCall(
          getterName,
          performance.now() - startTime
        );
        return safeResult;
      }

      // 새로운 값 추출
      const extractedValue = extractorFn(currentState);

      // 캐시에 저장
      globalGettersCacheManager.setToCache(
        cacheKey,
        extractedValue,
        getterName,
        stateHash
      );
      updateStateMetadata(currentState, stateHash, false);

      const duration = performance.now() - startTime;
      globalGettersCacheManager.recordGetterCall(getterName, duration);

      console.log(
        `📋 [GETTERS] ${getterName} 완료:`,
        duration.toFixed(2),
        'ms'
      );
      return extractedValue;
    } catch (getterError) {
      console.error(`❌ [GETTERS] ${getterName} 오류:`, getterError);
      globalGettersCacheManager.recordGetterCall(
        getterName,
        performance.now() - startTime
      );
      return fallbackValue;
    }
  };
};

/**
 * 멀티스텝 폼 Getter 함수들을 생성하는 팩토리 함수
 *
 * 메모리 최적화 변경사항:
 * - 상태 해시 기반 캐싱으로 중복 계산 방지
 * - WeakMap 메타데이터로 자동 GC
 * - 참조 안정성을 위한 Object.freeze 적용
 * - 성능 모니터링 및 자동 최적화
 * - 타입 안전성 강화
 *
 * @param get Zustand 스토어의 get 함수
 * @returns MultiStepFormGetters 객체
 */
export const createMultiStepFormGetters = (
  get: () => MultiStepFormState
): MultiStepFormGetters => {
  console.log('🔧 [GETTERS] 메모리 최적화된 MultiStepFormGetters 생성 중...');

  // 🚀 메모리 최적화된 기본값들 (불변 객체)
  const DEFAULT_FORM_VALUES = createDefaultFormValuesOptimized();
  const DEFAULT_STEP: StepNumber = 1;
  const DEFAULT_PROGRESS: number = 0;
  const DEFAULT_SHOW_PREVIEW: boolean = false;
  const DEFAULT_EDITOR_CONTENT: string = '';
  const DEFAULT_EDITOR_COMPLETED: boolean = false;

  return {
    /**
     * 현재 폼 값들을 가져오는 함수 (메모리 최적화)
     */
    getFormValues: createOptimizedGetter(
      'getFormValues',
      (state) => {
        const { formValues } = state;

        if (!formValues) {
          console.warn('⚠️ [GETTERS] formValues 없음, 기본값 반환');
          return DEFAULT_FORM_VALUES;
        }

        // 불변 객체로 반환 (참조 안정성)
        return Object.freeze({ ...formValues });
      },
      DEFAULT_FORM_VALUES
    ),

    /**
     * 현재 스텝 번호를 가져오는 함수 (메모리 최적화)
     */
    getCurrentStep: createOptimizedGetter(
      'getCurrentStep',
      (state) => {
        const { currentStep } = state;

        const isValidStep =
          typeof currentStep === 'number' &&
          currentStep >= 1 &&
          currentStep <= 5;
        if (!isValidStep) {
          console.warn('⚠️ [GETTERS] 유효하지 않은 스텝:', currentStep);
          return DEFAULT_STEP;
        }

        return currentStep;
      },
      DEFAULT_STEP
    ),

    /**
     * 현재 진행률을 가져오는 함수 (메모리 최적화)
     */
    getProgressWidth: createOptimizedGetter(
      'getProgressWidth',
      (state) => {
        const { progressWidth } = state;

        const isValidProgress =
          typeof progressWidth === 'number' &&
          progressWidth >= 0 &&
          progressWidth <= 100;
        if (!isValidProgress) {
          console.warn('⚠️ [GETTERS] 유효하지 않은 진행률:', progressWidth);
          return DEFAULT_PROGRESS;
        }

        return progressWidth;
      },
      DEFAULT_PROGRESS
    ),

    /**
     * 미리보기 표시 상태를 가져오는 함수 (메모리 최적화)
     */
    getShowPreview: createOptimizedGetter(
      'getShowPreview',
      (state) => {
        const { showPreview } = state;

        const isBooleanType = typeof showPreview === 'boolean';
        if (!isBooleanType) {
          console.warn(
            '⚠️ [GETTERS] 유효하지 않은 미리보기 상태:',
            showPreview
          );
          return DEFAULT_SHOW_PREVIEW;
        }

        return showPreview;
      },
      DEFAULT_SHOW_PREVIEW
    ),

    /**
     * 에디터 완성 내용을 가져오는 함수 (메모리 최적화)
     */
    getEditorCompletedContent: createOptimizedGetter(
      'getEditorCompletedContent',
      (state) => {
        const { editorCompletedContent } = state;

        const isStringType = typeof editorCompletedContent === 'string';
        if (!isStringType) {
          console.warn(
            '⚠️ [GETTERS] 유효하지 않은 에디터 내용:',
            typeof editorCompletedContent
          );
          return DEFAULT_EDITOR_CONTENT;
        }

        return editorCompletedContent;
      },
      DEFAULT_EDITOR_CONTENT
    ),

    /**
     * 에디터 완료 상태를 가져오는 함수 (메모리 최적화)
     */
    getIsEditorCompleted: createOptimizedGetter(
      'getIsEditorCompleted',
      (state) => {
        const { isEditorCompleted } = state;

        const isBooleanType = typeof isEditorCompleted === 'boolean';
        if (!isBooleanType) {
          console.warn(
            '⚠️ [GETTERS] 유효하지 않은 에디터 완료 상태:',
            isEditorCompleted
          );
          return DEFAULT_EDITOR_COMPLETED;
        }

        return isEditorCompleted;
      },
      DEFAULT_EDITOR_COMPLETED
    ),
  };
};

// 🚀 배치 getter 최적화 (여러 값 동시 조회)
export const batchGetMultiStepFormValues = (
  get: () => MultiStepFormState,
  getterNames: readonly (keyof MultiStepFormGetters)[]
): Record<string, unknown> => {
  console.log('🚀 배치 getter 시작:', getterNames.length, '개 항목');

  const batchStartTime = performance.now();
  const currentState = get();

  if (!currentState) {
    console.warn('⚠️ 배치 getter: 상태 없음');
    return {};
  }

  const stateHash = generateStateHashOptimized(currentState);
  const batchResults: Record<string, unknown> = {};
  const getters = createMultiStepFormGetters(get);

  // 배치로 처리
  for (const getterName of getterNames) {
    const cacheKey = generateCacheKey(stateHash, String(getterName));

    // 캐시 확인
    const cachedResult = globalGettersCacheManager.getFromCache(cacheKey);
    if (cachedResult !== null) {
      batchResults[String(getterName)] = cachedResult;
      continue;
    }

    // getter 실행
    const getterFunction = getters[getterName];
    if (typeof getterFunction === 'function') {
      try {
        const result = getterFunction();
        batchResults[String(getterName)] = result;

        // 캐시에 저장
        globalGettersCacheManager.setToCache(
          cacheKey,
          result,
          String(getterName),
          stateHash
        );
      } catch (getterError) {
        console.error(
          `❌ 배치 getter 오류 [${String(getterName)}]:`,
          getterError
        );
        batchResults[String(getterName)] = null;
      }
    }
  }

  const batchDuration = performance.now() - batchStartTime;
  console.log('🏁 배치 getter 완료:', batchDuration.toFixed(2), 'ms');

  return batchResults;
};

// 🚀 메모리 정리 유틸리티 함수들
export const clearFormGettersCache = (): void => {
  globalGettersCacheManager.destroy();
  console.log('🧹 폼 getter 캐시 완전 정리');
};

export const getFormGettersStats = (): {
  readonly cacheStats: ReturnType<
    typeof globalGettersCacheManager.getCacheStats
  >;
  readonly memoryUsageMB: number;
} => {
  const cacheStats = globalGettersCacheManager.getCacheStats();
  const memoryUsageBytes = getMemoryUsageSafely();
  const memoryUsageMB = memoryUsageBytes / (1024 * 1024);

  return {
    cacheStats,
    memoryUsageMB,
  };
};

// 🚀 상태 메타데이터 조회
export const getStateMetadata = (
  state: MultiStepFormState
): StateMetadata | null => {
  return stateMetadataWeakMap.get(state) || null;
};

// 🚀 강제 메모리 정리
export const forceFormGettersCleanup = (): void => {
  globalGettersCacheManager.destroy();

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

  console.log('🧹 폼 getter 강제 메모리 정리 완료');
};

console.log('📄 [GETTERS] 메모리 최적화된 multiStepFormGetters 모듈 로드 완료');
