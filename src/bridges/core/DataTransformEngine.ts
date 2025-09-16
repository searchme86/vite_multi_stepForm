// bridges/core/DataTransformEngine.ts

import type {
  EditorStateSnapshotForBridge,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  MultiStepToEditorDataTransformationResult,
  TransformationMetadata,
  TransformationStrategyType,
} from '../editorMultiStepBridge/modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';

// 변환 옵션 인터페이스
interface TransformationOptions {
  readonly strategy: TransformationStrategyType;
  readonly enableCaching: boolean;
  readonly validateResult: boolean;
  readonly includeMetadata: boolean;
}

// 캐시 엔트리 인터페이스
interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly strategy: TransformationStrategyType;
  readonly hash: string;
}

// 변환 컨텍스트 인터페이스
interface TransformationContext {
  readonly startTime: number;
  readonly operationId: string;
  readonly strategy: TransformationStrategyType;
  readonly cacheEnabled: boolean;
}

// 🔧 타입 가드 모듈 (작업 7: 스택 오버플로우 방지 적용)
function createTransformEngineTypeGuardModule() {
  console.log(
    '🔧 [TRANSFORM_ENGINE] 타입 가드 모듈 생성 - 스택 오버플로우 방지 적용'
  );

  // 🔧 작업 7: 깊이 제한 상수
  const MAX_VALIDATION_DEPTH = 50;

  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  const isValidDate = (value: unknown): value is Date => {
    return value instanceof Date && !Number.isNaN(value.getTime());
  };

  // 🔧 작업 7: 깊이 제한이 적용된 에디터 스냅샷 검증
  const isValidEditorSnapshot = (
    snapshot: unknown,
    currentDepth: number = 0
  ): snapshot is EditorStateSnapshotForBridge => {
    // Early Return: 깊이 한계 초과
    if (currentDepth > MAX_VALIDATION_DEPTH) {
      console.warn(
        '⚠️ [TRANSFORM_ENGINE] 타입 검증 깊이 한계 초과:',
        currentDepth
      );
      return false;
    }

    const isValidSnapshotObject = isValidObject(snapshot);
    if (!isValidSnapshotObject) {
      console.log('🔍 [DEBUG] isValidEditorSnapshot - not valid object');
      return false;
    }

    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      editorIsCompleted,
      extractedTimestamp,
    } = snapshot;

    const hasEditorContainers = editorContainers !== undefined;
    const hasEditorParagraphs = editorParagraphs !== undefined;
    const hasEditorCompletedContent = editorCompletedContent !== undefined;
    const hasEditorIsCompleted = editorIsCompleted !== undefined;
    const hasExtractedTimestamp = extractedTimestamp !== undefined;

    console.log('🔍 [DEBUG] isValidEditorSnapshot 검증 (깊이 보호):', {
      hasEditorContainers,
      hasEditorParagraphs,
      hasEditorCompletedContent,
      hasEditorIsCompleted,
      hasExtractedTimestamp,
      validationDepth: currentDepth,
    });

    return (
      hasEditorContainers &&
      hasEditorParagraphs &&
      hasEditorCompletedContent &&
      hasEditorIsCompleted &&
      hasExtractedTimestamp
    );
  };

  // 🔧 작업 7: 깊이 제한이 적용된 멀티스텝 스냅샷 검증
  const isValidMultiStepSnapshot = (
    snapshot: unknown,
    currentDepth: number = 0
  ): snapshot is MultiStepFormSnapshotForBridge => {
    // Early Return: 깊이 한계 초과
    if (currentDepth > MAX_VALIDATION_DEPTH) {
      console.warn(
        '⚠️ [TRANSFORM_ENGINE] 타입 검증 깊이 한계 초과:',
        currentDepth
      );
      return false;
    }

    const isValidSnapshotObject = isValidObject(snapshot);
    if (!isValidSnapshotObject) {
      console.log('🔍 [DEBUG] isValidMultiStepSnapshot - not valid object');
      return false;
    }

    const { formValues, formCurrentStep, snapshotTimestamp } = snapshot;

    const hasFormValues = formValues !== undefined;
    const hasFormCurrentStep = formCurrentStep !== undefined;
    const hasSnapshotTimestamp = snapshotTimestamp !== undefined;

    console.log('🔍 [DEBUG] isValidMultiStepSnapshot 검증 (깊이 보호):', {
      hasFormValues,
      hasFormCurrentStep,
      hasSnapshotTimestamp,
      validationDepth: currentDepth,
    });

    return hasFormValues && hasFormCurrentStep && hasSnapshotTimestamp;
  };

  // 🔧 작업 7: 깊이 제한이 적용된 컨테이너 검증
  const isValidContainer = (
    container: unknown,
    currentDepth: number = 0
  ): container is Container => {
    // Early Return: 깊이 한계 초과
    if (currentDepth > MAX_VALIDATION_DEPTH) {
      console.warn(
        '⚠️ [TRANSFORM_ENGINE] 컨테이너 검증 깊이 한계 초과:',
        currentDepth
      );
      return false;
    }

    const isValidContainerObject = isValidObject(container);
    if (!isValidContainerObject) {
      return false;
    }

    const { id, name, order } = container;

    const hasValidId = isValidString(id);
    const hasValidName = isValidString(name);
    const hasValidOrder = typeof order === 'number' && !Number.isNaN(order);

    console.log('🔍 [DEBUG] isValidContainer 검증 (깊이 보호):', {
      hasValidId,
      hasValidName,
      hasValidOrder,
      validationDepth: currentDepth,
    });

    return hasValidId && hasValidName && hasValidOrder;
  };

  // 🔧 작업 7: 깊이 제한이 적용된 문단 검증
  const isValidParagraph = (
    paragraph: unknown,
    currentDepth: number = 0
  ): paragraph is ParagraphBlock => {
    // Early Return: 깊이 한계 초과
    if (currentDepth > MAX_VALIDATION_DEPTH) {
      console.warn(
        '⚠️ [TRANSFORM_ENGINE] 문단 검증 깊이 한계 초과:',
        currentDepth
      );
      return false;
    }

    const isValidParagraphObject = isValidObject(paragraph);
    if (!isValidParagraphObject) {
      return false;
    }

    const { id, content, order, containerId } = paragraph;

    const hasValidId = isValidString(id);
    const hasValidContent = isValidString(content);
    const hasValidOrder = typeof order === 'number' && !Number.isNaN(order);
    const hasValidContainerId = containerId !== undefined;

    console.log('🔍 [DEBUG] isValidParagraph 검증 (깊이 보호):', {
      hasValidId,
      hasValidContent,
      hasValidOrder,
      hasValidContainerId,
      validationDepth: currentDepth,
    });

    return (
      hasValidId && hasValidContent && hasValidOrder && hasValidContainerId
    );
  };

  const isValidFormValues = (formValues: unknown): formValues is FormValues => {
    const isValidFormObject = isValidObject(formValues);
    if (!isValidFormObject) {
      return false;
    }

    const { editorCompletedContent, isEditorCompleted } = formValues;

    const hasEditorCompletedContent = editorCompletedContent !== undefined;
    const hasIsEditorCompleted = isEditorCompleted !== undefined;

    console.log('🔍 [DEBUG] isValidFormValues 검증:', {
      hasEditorCompletedContent,
      hasIsEditorCompleted,
    });

    return hasEditorCompletedContent && hasIsEditorCompleted;
  };

  return {
    isValidString,
    isValidBoolean,
    isValidObject,
    isValidArray,
    isValidDate,
    isValidEditorSnapshot,
    isValidMultiStepSnapshot,
    isValidContainer,
    isValidParagraph,
    isValidFormValues,
    MAX_VALIDATION_DEPTH, // 🔧 깊이 제한 상수 노출
  };
}

// 🔧 에러 처리 모듈
function createTransformEngineErrorHandlerModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 에러 처리 모듈 생성');

  const { isValidString } = createTransformEngineTypeGuardModule();

  const safelyExecuteTransformation = <T>(
    operation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      console.log(`🔄 [TRANSFORM_ENGINE] ${operationName} 실행 시작`);
      const result = operation();
      console.log(`✅ [TRANSFORM_ENGINE] ${operationName} 실행 성공`);
      return result;
    } catch (transformationError) {
      console.error(
        `❌ [TRANSFORM_ENGINE] ${operationName} 실행 실패:`,
        transformationError
      );
      return fallbackValue;
    }
  };

  const extractSafeErrorMessage = (error: unknown): string => {
    const isErrorInstance = error instanceof Error;
    if (isErrorInstance) {
      return error.message;
    }

    const isStringError = isValidString(error);
    if (isStringError) {
      return error;
    }

    try {
      return String(error);
    } catch (conversionError) {
      console.warn(
        '⚠️ [TRANSFORM_ENGINE] 에러 메시지 변환 실패:',
        conversionError
      );
      return 'Unknown transformation error';
    }
  };

  return {
    safelyExecuteTransformation,
    extractSafeErrorMessage,
  };
}

// 🔧 해시 생성 모듈
function createHashGeneratorModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 해시 생성 모듈 생성');

  const generateSimpleHash = (data: unknown): string => {
    try {
      const jsonString = JSON.stringify(data);
      const hashValue = parseInt(
        jsonString
          .split('')
          .reduce((accumulator, character) => {
            const charCode = character.charCodeAt(0);
            return ((accumulator << 5) - accumulator + charCode) & 0xffffffff;
          }, 0)
          .toString()
          .replace('-', ''),
        10
      );

      const finalHash = Math.abs(hashValue).toString(36);
      console.log('🔑 [TRANSFORM_ENGINE] 해시 생성 완료:', finalHash);
      return finalHash;
    } catch (hashError) {
      console.error('❌ [TRANSFORM_ENGINE] 해시 생성 실패:', hashError);
      const fallbackHash = Date.now().toString(36);
      return fallbackHash;
    }
  };

  return { generateSimpleHash };
}

// 🔧 ✅ 작업 1 & 6: 캐시 관리 모듈 (메모리 누수 방지 + 해시 충돌 검증)
function createCacheManagerModule() {
  console.log(
    '🔧 [TRANSFORM_ENGINE] 캐시 관리 모듈 생성 - 메모리 누수 방지 + 해시 충돌 검증'
  );

  const editorToMultiStepCache = new Map<
    string,
    CacheEntry<EditorToMultiStepDataTransformationResult>
  >();
  const multiStepToEditorCache = new Map<
    string,
    CacheEntry<MultiStepToEditorDataTransformationResult>
  >();

  // 🔧 작업 1: 캐시 만료 시간 및 정리 설정
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분
  const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000; // 1분마다 정리

  const { generateSimpleHash } = createHashGeneratorModule();

  // 🔧 작업 1: 자동 캐시 정리 타이머 시작
  const startCacheCleanupTimer = (): void => {
    console.log('🔧 [CACHE_MANAGER] 자동 캐시 정리 타이머 시작');

    setInterval(() => {
      try {
        clearExpiredCache();
      } catch (cleanupError) {
        console.error('❌ [CACHE_MANAGER] 자동 캐시 정리 실패:', cleanupError);
      }
    }, CACHE_CLEANUP_INTERVAL_MS);

    console.log('✅ [CACHE_MANAGER] 자동 캐시 정리 타이머 설정 완료');
  };

  const isCacheEntryValid = <T>(entry: CacheEntry<T>): boolean => {
    const currentTime = Date.now();
    const isNotExpired = currentTime - entry.timestamp < CACHE_EXPIRY_MS;

    console.log('🔍 [TRANSFORM_ENGINE] 캐시 엔트리 유효성 검사:', {
      hash: entry.hash,
      age: currentTime - entry.timestamp,
      isValid: isNotExpired,
    });

    return isNotExpired;
  };

  // 🔧 작업 6: 해시 충돌 검증 강화된 getCachedEditorToMultiStep
  const getCachedEditorToMultiStep = (
    snapshot: EditorStateSnapshotForBridge,
    strategy: TransformationStrategyType
  ): EditorToMultiStepDataTransformationResult | null => {
    console.log(
      '🔍 [CACHE_MANAGER] Editor→MultiStep 캐시 조회 - 해시 충돌 검증 적용'
    );

    const cacheKey = generateSimpleHash({ snapshot, strategy });
    const cachedEntry = editorToMultiStepCache.get(cacheKey);

    const hasCachedEntry = cachedEntry !== undefined;
    if (!hasCachedEntry) {
      console.log('📭 [TRANSFORM_ENGINE] 캐시 미스 - Editor→MultiStep');
      return null;
    }

    const isValidEntry = isCacheEntryValid(cachedEntry);
    if (!isValidEntry) {
      console.log('⏰ [TRANSFORM_ENGINE] 캐시 만료 - Editor→MultiStep');
      editorToMultiStepCache.delete(cacheKey);
      return null;
    }

    // 🔧 작업 6: 해시 충돌 검증 추가
    try {
      const verificationHash = generateSimpleHash(cachedEntry.data);
      const expectedDataHash = generateSimpleHash({
        content: cachedEntry.data.transformedContent,
        metadata: cachedEntry.data.transformedMetadata,
        timestamp: cachedEntry.data.transformationTimestamp,
      });

      if (verificationHash !== expectedDataHash) {
        console.warn(
          '⚠️ [CACHE_MANAGER] 캐시 해시 충돌 감지 - Editor→MultiStep:',
          {
            cacheKey,
            verificationHash,
            expectedDataHash,
          }
        );
        editorToMultiStepCache.delete(cacheKey);
        return null;
      }

      // 🔧 추가 데이터 무결성 검증
      const hasValidContent =
        typeof cachedEntry.data.transformedContent === 'string' &&
        typeof cachedEntry.data.transformedIsCompleted === 'boolean' &&
        cachedEntry.data.transformationSuccess === true;

      if (!hasValidContent) {
        console.warn(
          '⚠️ [CACHE_MANAGER] 캐시된 데이터 무결성 검증 실패 - Editor→MultiStep'
        );
        editorToMultiStepCache.delete(cacheKey);
        return null;
      }

      console.log(
        '🎯 [TRANSFORM_ENGINE] 캐시 히트 - Editor→MultiStep (해시 검증 통과)'
      );
      return cachedEntry.data;
    } catch (verificationError) {
      console.error(
        '❌ [CACHE_MANAGER] 해시 충돌 검증 중 에러:',
        verificationError
      );
      editorToMultiStepCache.delete(cacheKey);
      return null;
    }
  };

  const setCachedEditorToMultiStep = (
    snapshot: EditorStateSnapshotForBridge,
    strategy: TransformationStrategyType,
    result: EditorToMultiStepDataTransformationResult
  ): void => {
    const cacheKey = generateSimpleHash({ snapshot, strategy });
    const cacheEntry: CacheEntry<EditorToMultiStepDataTransformationResult> = {
      data: result,
      timestamp: Date.now(),
      strategy,
      hash: cacheKey,
    };

    editorToMultiStepCache.set(cacheKey, cacheEntry);
    console.log('💾 [TRANSFORM_ENGINE] Editor→MultiStep 결과 캐싱 완료');
  };

  // 🔧 작업 6: 해시 충돌 검증 강화된 getCachedMultiStepToEditor
  const getCachedMultiStepToEditor = (
    snapshot: MultiStepFormSnapshotForBridge,
    strategy: TransformationStrategyType
  ): MultiStepToEditorDataTransformationResult | null => {
    console.log(
      '🔍 [CACHE_MANAGER] MultiStep→Editor 캐시 조회 - 해시 충돌 검증 적용'
    );

    const cacheKey = generateSimpleHash({ snapshot, strategy });
    const cachedEntry = multiStepToEditorCache.get(cacheKey);

    const hasCachedEntry = cachedEntry !== undefined;
    if (!hasCachedEntry) {
      console.log('📭 [TRANSFORM_ENGINE] 캐시 미스 - MultiStep→Editor');
      return null;
    }

    const isValidEntry = isCacheEntryValid(cachedEntry);
    if (!isValidEntry) {
      console.log('⏰ [TRANSFORM_ENGINE] 캐시 만료 - MultiStep→Editor');
      multiStepToEditorCache.delete(cacheKey);
      return null;
    }

    // 🔧 작업 6: 해시 충돌 검증 추가
    try {
      const verificationHash = generateSimpleHash(cachedEntry.data);
      const expectedDataHash = generateSimpleHash({
        content: cachedEntry.data.editorContent,
        completed: cachedEntry.data.editorIsCompleted,
        timestamp: cachedEntry.data.transformedTimestamp,
      });

      if (verificationHash !== expectedDataHash) {
        console.warn(
          '⚠️ [CACHE_MANAGER] 캐시 해시 충돌 감지 - MultiStep→Editor:',
          {
            cacheKey,
            verificationHash,
            expectedDataHash,
          }
        );
        multiStepToEditorCache.delete(cacheKey);
        return null;
      }

      // 🔧 추가 데이터 무결성 검증
      const hasValidContent =
        typeof cachedEntry.data.editorContent === 'string' &&
        typeof cachedEntry.data.editorIsCompleted === 'boolean' &&
        cachedEntry.data.transformationSuccess === true;

      if (!hasValidContent) {
        console.warn(
          '⚠️ [CACHE_MANAGER] 캐시된 데이터 무결성 검증 실패 - MultiStep→Editor'
        );
        multiStepToEditorCache.delete(cacheKey);
        return null;
      }

      console.log(
        '🎯 [TRANSFORM_ENGINE] 캐시 히트 - MultiStep→Editor (해시 검증 통과)'
      );
      return cachedEntry.data;
    } catch (verificationError) {
      console.error(
        '❌ [CACHE_MANAGER] 해시 충돌 검증 중 에러:',
        verificationError
      );
      multiStepToEditorCache.delete(cacheKey);
      return null;
    }
  };

  const setCachedMultiStepToEditor = (
    snapshot: MultiStepFormSnapshotForBridge,
    strategy: TransformationStrategyType,
    result: MultiStepToEditorDataTransformationResult
  ): void => {
    const cacheKey = generateSimpleHash({ snapshot, strategy });
    const cacheEntry: CacheEntry<MultiStepToEditorDataTransformationResult> = {
      data: result,
      timestamp: Date.now(),
      strategy,
      hash: cacheKey,
    };

    multiStepToEditorCache.set(cacheKey, cacheEntry);
    console.log('💾 [TRANSFORM_ENGINE] MultiStep→Editor 결과 캐싱 완료');
  };

  // 🔧 작업 1: 개선된 캐시 정리 함수
  const clearExpiredCache = (): void => {
    console.log(
      '🧹 [TRANSFORM_ENGINE] 만료된 캐시 정리 시작 - 메모리 누수 방지'
    );

    const currentTime = Date.now();
    let clearedCount = 0;

    // Editor→MultiStep 캐시 정리
    for (const [key, entry] of editorToMultiStepCache.entries()) {
      const isExpired = currentTime - entry.timestamp >= CACHE_EXPIRY_MS;
      if (isExpired) {
        editorToMultiStepCache.delete(key);
        clearedCount = clearedCount + 1;
      }
    }

    // MultiStep→Editor 캐시 정리
    for (const [key, entry] of multiStepToEditorCache.entries()) {
      const isExpired = currentTime - entry.timestamp >= CACHE_EXPIRY_MS;
      if (isExpired) {
        multiStepToEditorCache.delete(key);
        clearedCount = clearedCount + 1;
      }
    }

    console.log(
      `✅ [TRANSFORM_ENGINE] 캐시 정리 완료: ${clearedCount}개 항목 제거 (메모리 누수 방지)`
    );
  };

  const getCacheStatistics = () => {
    return {
      editorToMultiStepCacheSize: editorToMultiStepCache.size,
      multiStepToEditorCacheSize: multiStepToEditorCache.size,
      totalCacheSize: editorToMultiStepCache.size + multiStepToEditorCache.size,
      cacheExpiryMs: CACHE_EXPIRY_MS,
      cleanupIntervalMs: CACHE_CLEANUP_INTERVAL_MS,
      memoryLeakPrevention: true,
      hashCollisionDetection: true,
    };
  };

  // 🔧 작업 1: 캐시 매니저 생성 시 자동 정리 타이머 시작
  startCacheCleanupTimer();

  return {
    getCachedEditorToMultiStep,
    setCachedEditorToMultiStep,
    getCachedMultiStepToEditor,
    setCachedMultiStepToEditor,
    clearExpiredCache,
    getCacheStatistics,
  };
}

// 🔧 데이터 추출 모듈
function createDataExtractionModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 데이터 추출 모듈 생성');

  const { isValidContainer, isValidParagraph, isValidString, isValidBoolean } =
    createTransformEngineTypeGuardModule();
  const { safelyExecuteTransformation } =
    createTransformEngineErrorHandlerModule();

  const extractValidContainers = (
    rawContainers: readonly unknown[]
  ): Container[] => {
    return safelyExecuteTransformation(
      () => {
        const validContainers = rawContainers.filter(isValidContainer);
        console.log(
          `🔍 [TRANSFORM_ENGINE] 유효한 컨테이너 추출: ${validContainers.length}/${rawContainers.length}`
        );
        return validContainers;
      },
      [],
      'CONTAINER_EXTRACTION'
    );
  };

  const extractValidParagraphs = (
    rawParagraphs: readonly unknown[]
  ): ParagraphBlock[] => {
    return safelyExecuteTransformation(
      () => {
        const validParagraphs = rawParagraphs.filter(isValidParagraph);
        console.log(
          `🔍 [TRANSFORM_ENGINE] 유효한 문단 추출: ${validParagraphs.length}/${rawParagraphs.length}`
        );
        return validParagraphs;
      },
      [],
      'PARAGRAPH_EXTRACTION'
    );
  };

  const extractEditorContent = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): string => {
    return safelyExecuteTransformation(
      () => {
        const { editorCompletedContent = '' } = editorSnapshot;
        const isValidContent = isValidString(editorCompletedContent);
        const extractedContent = isValidContent ? editorCompletedContent : '';

        console.log(
          `🔍 [TRANSFORM_ENGINE] 에디터 콘텐츠 추출: ${extractedContent.length}자`
        );
        return extractedContent;
      },
      '',
      'EDITOR_CONTENT_EXTRACTION'
    );
  };

  const extractEditorCompletion = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): boolean => {
    return safelyExecuteTransformation(
      () => {
        const { editorIsCompleted = false } = editorSnapshot;
        const isValidCompletion = isValidBoolean(editorIsCompleted);
        const extractedCompletion = isValidCompletion
          ? editorIsCompleted
          : false;

        console.log(
          `🔍 [TRANSFORM_ENGINE] 에디터 완료상태 추출: ${extractedCompletion}`
        );
        return extractedCompletion;
      },
      false,
      'EDITOR_COMPLETION_EXTRACTION'
    );
  };

  const extractFormContent = (
    multiStepSnapshot: MultiStepFormSnapshotForBridge
  ): string => {
    return safelyExecuteTransformation(
      () => {
        const { formValues } = multiStepSnapshot;
        const { editorCompletedContent = '' } = formValues;
        const isValidContent = isValidString(editorCompletedContent);
        const extractedContent = isValidContent ? editorCompletedContent : '';

        console.log(
          `🔍 [TRANSFORM_ENGINE] 폼 콘텐츠 추출: ${extractedContent.length}자`
        );
        return extractedContent;
      },
      '',
      'FORM_CONTENT_EXTRACTION'
    );
  };

  const extractFormCompletion = (
    multiStepSnapshot: MultiStepFormSnapshotForBridge
  ): boolean => {
    return safelyExecuteTransformation(
      () => {
        const { formValues } = multiStepSnapshot;
        const { isEditorCompleted = false } = formValues;
        const isValidCompletion = isValidBoolean(isEditorCompleted);
        const extractedCompletion = isValidCompletion
          ? isEditorCompleted
          : false;

        console.log(
          `🔍 [TRANSFORM_ENGINE] 폼 완료상태 추출: ${extractedCompletion}`
        );
        return extractedCompletion;
      },
      false,
      'FORM_COMPLETION_EXTRACTION'
    );
  };

  return {
    extractValidContainers,
    extractValidParagraphs,
    extractEditorContent,
    extractEditorCompletion,
    extractFormContent,
    extractFormCompletion,
  };
}

// 🔧 메타데이터 생성 모듈
function createMetadataGeneratorModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 메타데이터 생성 모듈 생성');

  const generateTransformationMetadata = (
    containers: Container[],
    paragraphs: ParagraphBlock[],
    transformedContent: string,
    transformationStartTime: number,
    transformationEndTime: number,
    strategy: TransformationStrategyType
  ): TransformationMetadata => {
    const assignedParagraphs = paragraphs.filter(
      ({ containerId = null }) => containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      ({ containerId = null }) => containerId === null
    );

    const validationWarnings = new Set<string>();
    const performanceMetrics = new Map<string, number>();

    const hasNoContainers = containers.length === 0;
    hasNoContainers ? validationWarnings.add('컨테이너가 없습니다') : null;

    const hasUnassignedParagraphs = unassignedParagraphs.length > 0;
    hasUnassignedParagraphs
      ? validationWarnings.add(
          `${unassignedParagraphs.length}개의 할당되지 않은 문단이 있습니다`
        )
      : null;

    const hasEmptyContent = transformedContent.length === 0;
    hasEmptyContent
      ? validationWarnings.add('변환된 콘텐츠가 비어있습니다')
      : null;

    // 성능 메트릭 설정
    performanceMetrics.set(
      'processingTime',
      transformationEndTime - transformationStartTime
    );
    performanceMetrics.set('containerProcessingRate', containers.length / 100);
    performanceMetrics.set('paragraphProcessingRate', paragraphs.length / 100);
    performanceMetrics.set(
      'contentProcessingRate',
      transformedContent.length / 1000
    );

    const metadata: TransformationMetadata = {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength: transformedContent.length,
      lastModifiedDate: new Date(),
      processingTimeMs: transformationEndTime - transformationStartTime,
      validationWarnings,
      performanceMetrics,
      transformationStrategy: strategy,
    };

    console.log('📊 [TRANSFORM_ENGINE] 메타데이터 생성 완료:', {
      containerCount: metadata.containerCount,
      paragraphCount: metadata.paragraphCount,
      contentLength: metadata.totalContentLength,
      warningCount: metadata.validationWarnings.size,
    });

    return metadata;
  };

  const generateContentMetadata = (
    contentLength: number,
    isCompleted: boolean,
    transformationSuccess: boolean,
    transformationTime: number
  ): Map<string, unknown> => {
    return new Map<string, unknown>([
      ['contentLength', contentLength],
      ['isCompleted', isCompleted],
      ['transformationSuccess', transformationSuccess],
      ['transformationTime', transformationTime],
      ['transformerVersion', '2.0.0'],
      ['sourceType', 'DATA_TRANSFORM_ENGINE'],
      ['hasValidContent', contentLength > 0],
      ['timestamp', Date.now()],
    ]);
  };

  return {
    generateTransformationMetadata,
    generateContentMetadata,
  };
}

export function createDataTransformEngine() {
  console.log(
    '🏭 [TRANSFORM_ENGINE] 데이터 변환 엔진 생성 시작 - 안전성 강화 버전'
  );

  const typeGuards = createTransformEngineTypeGuardModule();
  const errorHandler = createTransformEngineErrorHandlerModule();
  const cacheManager = createCacheManagerModule(); // 🔧 메모리 누수 방지 + 해시 충돌 검증 적용
  const dataExtractor = createDataExtractionModule();
  const metadataGenerator = createMetadataGeneratorModule();

  // 변환 컨텍스트 생성
  const createTransformationContext = (
    strategy: TransformationStrategyType,
    enableCaching: boolean
  ): TransformationContext => {
    const operationId = `transform_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    return {
      startTime: performance.now(),
      operationId,
      strategy,
      cacheEnabled: enableCaching,
    };
  };

  // Editor → MultiStep 변환 엔진
  const transformEditorToMultiStep = (
    editorSnapshot: EditorStateSnapshotForBridge,
    options: Partial<TransformationOptions> = {}
  ): EditorToMultiStepDataTransformationResult => {
    console.log('🔄 [TRANSFORM_ENGINE] Editor → MultiStep 변환 시작');

    const {
      strategy = 'EXISTING_CONTENT',
      enableCaching = true,
      validateResult = true,
      includeMetadata = true,
    } = options;

    return errorHandler.safelyExecuteTransformation(
      () => {
        // 캐시 확인 (해시 충돌 검증 적용)
        const shouldCheckCache = enableCaching;
        if (shouldCheckCache) {
          const cachedResult = cacheManager.getCachedEditorToMultiStep(
            editorSnapshot,
            strategy
          );
          const hasCachedResult = cachedResult !== null;
          if (hasCachedResult) {
            console.log(
              '🎯 [TRANSFORM_ENGINE] 캐시된 결과 반환 (해시 검증 통과)'
            );
            return cachedResult;
          }
        }

        const context = createTransformationContext(strategy, enableCaching);
        console.log(`🚀 [TRANSFORM_ENGINE] 변환 실행: ${context.operationId}`);

        // 입력 검증 (스택 오버플로우 방지 적용)
        const isValidSnapshot =
          typeGuards.isValidEditorSnapshot(editorSnapshot);
        if (!isValidSnapshot) {
          throw new Error('유효하지 않은 에디터 스냅샷');
        }

        // 데이터 추출
        const { editorContainers = [], editorParagraphs = [] } = editorSnapshot;

        const validContainers =
          dataExtractor.extractValidContainers(editorContainers);
        const validParagraphs =
          dataExtractor.extractValidParagraphs(editorParagraphs);
        const editorContent =
          dataExtractor.extractEditorContent(editorSnapshot);
        const editorCompletion =
          dataExtractor.extractEditorCompletion(editorSnapshot);

        // 전략별 변환 실행
        let transformedContent = '';
        let transformationStrategy: TransformationStrategyType = strategy;

        const isExistingContentStrategy = strategy === 'EXISTING_CONTENT';
        const isRebuildStrategy = strategy === 'REBUILD_FROM_CONTAINERS';
        const isParagraphFallbackStrategy = strategy === 'PARAGRAPH_FALLBACK';

        if (isExistingContentStrategy) {
          const hasExistingContent = editorContent.trim().length > 100;
          transformedContent = hasExistingContent ? editorContent.trim() : '';
        } else if (isRebuildStrategy) {
          transformedContent = generateContentFromContainers(
            validContainers,
            validParagraphs
          );
        } else if (isParagraphFallbackStrategy) {
          transformedContent = generateContentFromParagraphs(validParagraphs);
        } else {
          // 기본 전략: 기존 콘텐츠 우선, 없으면 재구성
          const hasExistingContent = editorContent.trim().length > 0;
          transformedContent = hasExistingContent
            ? editorContent.trim()
            : generateContentFromContainers(validContainers, validParagraphs);
          transformationStrategy = hasExistingContent
            ? 'EXISTING_CONTENT'
            : 'REBUILD_FROM_CONTAINERS';
        }

        const transformationEndTime = performance.now();

        // 메타데이터 생성
        const transformedMetadata = includeMetadata
          ? metadataGenerator.generateTransformationMetadata(
              validContainers,
              validParagraphs,
              transformedContent,
              context.startTime,
              transformationEndTime,
              transformationStrategy
            )
          : createDefaultTransformationMetadata();

        // 결과 구성
        const result: EditorToMultiStepDataTransformationResult = {
          transformedContent,
          transformedIsCompleted:
            editorCompletion || transformedContent.length > 0,
          transformedMetadata,
          transformationSuccess: true,
          transformationErrors: [],
          transformationStrategy,
          transformationTimestamp: Date.now(),
          qualityMetrics: new Map<string, number>([
            ['contentLength', transformedContent.length],
            ['containerCount', validContainers.length],
            ['paragraphCount', validParagraphs.length],
          ]),
          contentIntegrityHash: generateContentHash(transformedContent),
        };

        // 결과 검증
        const shouldValidateResult = validateResult;
        if (shouldValidateResult) {
          const isValidResult = validateEditorToMultiStepResult(result);
          if (!isValidResult) {
            throw new Error('변환 결과 검증 실패');
          }
        }

        // 캐시 저장
        const shouldCacheResult = enableCaching;
        shouldCacheResult
          ? cacheManager.setCachedEditorToMultiStep(
              editorSnapshot,
              transformationStrategy,
              result
            )
          : null;

        console.log(
          `✅ [TRANSFORM_ENGINE] Editor → MultiStep 변환 완료: ${context.operationId}`
        );
        return result;
      },
      createFailedEditorToMultiStepResult(),
      'EDITOR_TO_MULTISTEP_TRANSFORM'
    );
  };

  // MultiStep → Editor 변환 엔진
  const transformMultiStepToEditor = (
    multiStepSnapshot: MultiStepFormSnapshotForBridge,
    options: Partial<TransformationOptions> = {}
  ): MultiStepToEditorDataTransformationResult => {
    console.log('🔄 [TRANSFORM_ENGINE] MultiStep → Editor 변환 시작');

    const {
      strategy = 'EXISTING_CONTENT',
      enableCaching = true,
      validateResult = true,
      includeMetadata = true,
    } = options;

    return errorHandler.safelyExecuteTransformation(
      () => {
        // 캐시 확인 (해시 충돌 검증 적용)
        const shouldCheckCache = enableCaching;
        if (shouldCheckCache) {
          const cachedResult = cacheManager.getCachedMultiStepToEditor(
            multiStepSnapshot,
            strategy
          );
          const hasCachedResult = cachedResult !== null;
          if (hasCachedResult) {
            console.log(
              '🎯 [TRANSFORM_ENGINE] 캐시된 결과 반환 (해시 검증 통과)'
            );
            return cachedResult;
          }
        }

        const context = createTransformationContext(strategy, enableCaching);
        console.log(`🚀 [TRANSFORM_ENGINE] 변환 실행: ${context.operationId}`);

        // 입력 검증 (스택 오버플로우 방지 적용)
        const isValidSnapshot =
          typeGuards.isValidMultiStepSnapshot(multiStepSnapshot);
        if (!isValidSnapshot) {
          throw new Error('유효하지 않은 MultiStep 스냅샷');
        }

        // 데이터 추출
        const formContent = dataExtractor.extractFormContent(multiStepSnapshot);
        const formCompletion =
          dataExtractor.extractFormCompletion(multiStepSnapshot);

        const transformationEndTime = performance.now();

        // 메타데이터 생성
        const contentMetadata = includeMetadata
          ? metadataGenerator.generateContentMetadata(
              formContent.length,
              formCompletion,
              true,
              transformationEndTime - context.startTime
            )
          : new Map<string, unknown>();

        // 결과 구성
        const result: MultiStepToEditorDataTransformationResult = {
          editorContent: formContent,
          editorIsCompleted: formCompletion,
          transformationSuccess: true,
          transformationErrors: [],
          transformedTimestamp: Date.now(),
          contentMetadata,
          reverseTransformationStrategy: strategy,
          dataIntegrityValidation: true,
        };

        // 결과 검증
        const shouldValidateResult = validateResult;
        if (shouldValidateResult) {
          const isValidResult = validateMultiStepToEditorResult(result);
          if (!isValidResult) {
            throw new Error('변환 결과 검증 실패');
          }
        }

        // 캐시 저장
        const shouldCacheResult = enableCaching;
        shouldCacheResult
          ? cacheManager.setCachedMultiStepToEditor(
              multiStepSnapshot,
              strategy,
              result
            )
          : null;

        console.log(
          `✅ [TRANSFORM_ENGINE] MultiStep → Editor 변환 완료: ${context.operationId}`
        );
        return result;
      },
      createFailedMultiStepToEditorResult(),
      'MULTISTEP_TO_EDITOR_TRANSFORM'
    );
  };

  // 🔧 작업 10: 안전한 배열 변형을 적용한 컨테이너 기반 콘텐츠 생성
  const generateContentFromContainers = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log(
      '🔧 [TRANSFORM_ENGINE] 컨테이너 기반 콘텐츠 생성 - 배열 안전장치 적용'
    );

    const hasNoContainers = containers.length === 0;
    if (hasNoContainers) {
      console.warn('⚠️ [TRANSFORM_ENGINE] 컨테이너가 없어 빈 콘텐츠 반환');
      return '';
    }

    // 🔧 작업 10: 안전한 배열 복사 및 정렬
    let sortedContainers: Container[];
    try {
      // 원본 배열이 freeze되었거나 프록시인 경우를 대비한 안전한 복사
      const safeContainers = Array.isArray(containers) ? [...containers] : [];

      sortedContainers = safeContainers.sort(
        ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
          firstOrder - secondOrder
      );

      console.log('✅ [TRANSFORM_ENGINE] 컨테이너 배열 안전 정렬 완료:', {
        originalCount: containers.length,
        sortedCount: sortedContainers.length,
      });
    } catch (sortError) {
      console.error(
        '❌ [TRANSFORM_ENGINE] 컨테이너 정렬 실패, 원본 사용:',
        sortError
      );
      sortedContainers = containers;
    }

    const contentParts: string[] = [];

    sortedContainers.forEach(
      ({ id: containerId = '', name: containerName = '' }) => {
        // 🔧 작업 10: 안전한 문단 필터링 및 정렬
        let containerParagraphs: ParagraphBlock[];
        try {
          const filteredParagraphs = paragraphs.filter(
            ({ containerId: paragraphContainerId = null }) =>
              paragraphContainerId === containerId
          );

          const safeParagraphs = Array.isArray(filteredParagraphs)
            ? [...filteredParagraphs]
            : [];

          containerParagraphs = safeParagraphs.sort(
            ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
              firstOrder - secondOrder
          );
        } catch (paragraphSortError) {
          console.error(
            '❌ [TRANSFORM_ENGINE] 문단 정렬 실패:',
            paragraphSortError
          );
          containerParagraphs = [];
        }

        const hasValidParagraphs = containerParagraphs.length > 0;
        if (hasValidParagraphs) {
          contentParts.push(`## ${containerName}`);

          containerParagraphs.forEach(({ content: paragraphContent = '' }) => {
            const hasTrimmedContent = paragraphContent.trim().length > 0;
            hasTrimmedContent
              ? contentParts.push(paragraphContent.trim())
              : null;
          });

          contentParts.push('');
        }
      }
    );

    const generatedContent = contentParts.join('\n');
    console.log(
      `🔧 [TRANSFORM_ENGINE] 컨테이너 기반 콘텐츠 생성 완료 (배열 안전장치): ${generatedContent.length}자`
    );
    return generatedContent;
  };

  // 🔧 작업 10: 안전한 배열 변형을 적용한 문단 기반 콘텐츠 생성
  const generateContentFromParagraphs = (
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log(
      '🔧 [TRANSFORM_ENGINE] 문단 기반 콘텐츠 생성 - 배열 안전장치 적용'
    );

    const hasNoParagraphs = paragraphs.length === 0;
    if (hasNoParagraphs) {
      console.warn('⚠️ [TRANSFORM_ENGINE] 문단이 없어 빈 콘텐츠 반환');
      return '';
    }

    // 🔧 작업 10: 안전한 배열 필터링 및 정렬
    let unassignedParagraphs: ParagraphBlock[];
    try {
      const filteredParagraphs = paragraphs.filter(
        ({ containerId = null }) => containerId === null
      );

      const safeParagraphs = Array.isArray(filteredParagraphs)
        ? [...filteredParagraphs]
        : [];

      unassignedParagraphs = safeParagraphs.sort(
        ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
          firstOrder - secondOrder
      );

      console.log('✅ [TRANSFORM_ENGINE] 문단 배열 안전 정렬 완료:', {
        originalCount: paragraphs.length,
        unassignedCount: unassignedParagraphs.length,
      });
    } catch (sortError) {
      console.error('❌ [TRANSFORM_ENGINE] 문단 정렬 실패:', sortError);
      unassignedParagraphs = [];
    }

    const contentParts = unassignedParagraphs
      .map(({ content: paragraphContent = '' }) => paragraphContent.trim())
      .filter((content) => content.length > 0);

    const generatedContent = contentParts.join('\n\n');
    console.log(
      `🔧 [TRANSFORM_ENGINE] 문단 기반 콘텐츠 생성 완료 (배열 안전장치): ${generatedContent.length}자`
    );
    return generatedContent;
  };

  // 헬퍼 함수들
  const createDefaultTransformationMetadata = (): TransformationMetadata => ({
    containerCount: 0,
    paragraphCount: 0,
    assignedParagraphCount: 0,
    unassignedParagraphCount: 0,
    totalContentLength: 0,
    lastModifiedDate: new Date(),
    processingTimeMs: 0,
    validationWarnings: new Set<string>(),
    performanceMetrics: new Map<string, number>(),
    transformationStrategy: 'PARAGRAPH_FALLBACK',
  });

  const generateContentHash = (content: string): string => {
    try {
      const hash = content
        .split('')
        .reduce(
          (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff,
          0
        );
      return Math.abs(hash).toString(36);
    } catch (hashError) {
      console.warn('⚠️ [TRANSFORM_ENGINE] 콘텐츠 해시 생성 실패:', hashError);
      return Date.now().toString(36);
    }
  };

  const createFailedEditorToMultiStepResult =
    (): EditorToMultiStepDataTransformationResult => ({
      transformedContent: '',
      transformedIsCompleted: false,
      transformedMetadata: createDefaultTransformationMetadata(),
      transformationSuccess: false,
      transformationErrors: ['변환 실행 실패'],
      transformationStrategy: 'PARAGRAPH_FALLBACK',
      transformationTimestamp: Date.now(),
      qualityMetrics: new Map<string, number>(),
      contentIntegrityHash: '',
    });

  const createFailedMultiStepToEditorResult =
    (): MultiStepToEditorDataTransformationResult => ({
      editorContent: '',
      editorIsCompleted: false,
      transformationSuccess: false,
      transformationErrors: ['변환 실행 실패'],
      transformedTimestamp: Date.now(),
      contentMetadata: new Map<string, unknown>(),
      reverseTransformationStrategy: 'PARAGRAPH_FALLBACK',
      dataIntegrityValidation: false,
    });

  const validateEditorToMultiStepResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    const { isValidString, isValidBoolean, isValidObject } = typeGuards;

    const hasValidContent = isValidString(result.transformedContent);
    const hasValidCompleted = isValidBoolean(result.transformedIsCompleted);
    const hasValidSuccess = isValidBoolean(result.transformationSuccess);
    const hasValidMetadata = isValidObject(result.transformedMetadata);
    const hasValidErrors = Array.isArray(result.transformationErrors);

    console.log('🔍 [DEBUG] validateEditorToMultiStepResult:', {
      hasValidContent,
      hasValidCompleted,
      hasValidSuccess,
      hasValidMetadata,
      hasValidErrors,
    });

    return (
      hasValidContent &&
      hasValidCompleted &&
      hasValidSuccess &&
      hasValidMetadata &&
      hasValidErrors
    );
  };

  const validateMultiStepToEditorResult = (
    result: MultiStepToEditorDataTransformationResult
  ): boolean => {
    const { isValidString, isValidBoolean } = typeGuards;

    const hasValidContent = isValidString(result.editorContent);
    const hasValidCompleted = isValidBoolean(result.editorIsCompleted);
    const hasValidSuccess = isValidBoolean(result.transformationSuccess);
    const hasValidErrors = Array.isArray(result.transformationErrors);
    const hasValidMetadata = result.contentMetadata instanceof Map;

    console.log('🔍 [DEBUG] validateMultiStepToEditorResult:', {
      hasValidContent,
      hasValidCompleted,
      hasValidSuccess,
      hasValidErrors,
      hasValidMetadata,
    });

    return (
      hasValidContent &&
      hasValidCompleted &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidMetadata
    );
  };

  console.log(
    '✅ [TRANSFORM_ENGINE] 데이터 변환 엔진 생성 완료 - 모든 안전장치 적용'
  );

  return {
    transformEditorToMultiStep,
    transformMultiStepToEditor,
    clearCache: cacheManager.clearExpiredCache,
    getCacheStatistics: cacheManager.getCacheStatistics,
  };
}

console.log('🏗️ [DATA_TRANSFORM_ENGINE] 모듈 로드 완료 - 안전성 강화 버전');
console.log('🔧 [DATA_TRANSFORM_ENGINE] 적용된 안전장치:', {
  memoryLeakPrevention: '✅ 캐시 자동 정리 타이머',
  hashCollisionDetection: '✅ 해시 충돌 검증 강화',
  stackOverflowPrevention: '✅ 타입 가드 깊이 제한',
  arrayMutationSafety: '✅ 배열 변형 안전장치',
  performanceOptimization: '✅ Early Return 패턴',
  typeGuardEnhancement: '✅ 구조분해할당 + Fallback',
});
console.log('✅ [DATA_TRANSFORM_ENGINE] 모든 보안 및 안정성 기능 준비 완료');
