// bridges/core/DataTransformEngine.ts

import type {
  EditorStateSnapshotForBridge,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  MultiStepToEditorDataTransformationResult,
  TransformationMetadata,
} from '../editorMultiStepBridge/bridgeDataTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';

// 변환 전략 타입 정의 - bridgeDataTypes와 일치시킴
type TransformationStrategyType =
  | 'EXISTING_CONTENT'
  | 'REBUILD_FROM_CONTAINERS'
  | 'PARAGRAPH_FALLBACK';

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

// 🔧 타입 가드 모듈
function createTransformEngineTypeGuardModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 타입 가드 모듈 생성');

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

  const isValidEditorSnapshot = (
    snapshot: unknown
  ): snapshot is EditorStateSnapshotForBridge => {
    const isValidSnapshotObject = isValidObject(snapshot);
    if (!isValidSnapshotObject) {
      return false;
    }

    const hasEditorContainers = 'editorContainers' in snapshot;
    const hasEditorParagraphs = 'editorParagraphs' in snapshot;
    const hasEditorCompletedContent = 'editorCompletedContent' in snapshot;
    const hasEditorIsCompleted = 'editorIsCompleted' in snapshot;
    const hasExtractedTimestamp = 'extractedTimestamp' in snapshot;

    return (
      hasEditorContainers &&
      hasEditorParagraphs &&
      hasEditorCompletedContent &&
      hasEditorIsCompleted &&
      hasExtractedTimestamp
    );
  };

  const isValidMultiStepSnapshot = (
    snapshot: unknown
  ): snapshot is MultiStepFormSnapshotForBridge => {
    const isValidSnapshotObject = isValidObject(snapshot);
    if (!isValidSnapshotObject) {
      return false;
    }

    const hasFormValues = 'formValues' in snapshot;
    const hasFormCurrentStep = 'formCurrentStep' in snapshot;
    const hasSnapshotTimestamp = 'snapshotTimestamp' in snapshot;

    return hasFormValues && hasFormCurrentStep && hasSnapshotTimestamp;
  };

  const isValidContainer = (container: unknown): container is Container => {
    const isValidContainerObject = isValidObject(container);
    if (!isValidContainerObject) {
      return false;
    }

    const hasValidId =
      'id' in container && isValidString(Reflect.get(container, 'id'));
    const hasValidName =
      'name' in container && isValidString(Reflect.get(container, 'name'));
    const hasValidOrder =
      'order' in container &&
      typeof Reflect.get(container, 'order') === 'number' &&
      !Number.isNaN(Reflect.get(container, 'order'));

    return hasValidId && hasValidName && hasValidOrder;
  };

  const isValidParagraph = (
    paragraph: unknown
  ): paragraph is ParagraphBlock => {
    const isValidParagraphObject = isValidObject(paragraph);
    if (!isValidParagraphObject) {
      return false;
    }

    const hasValidId =
      'id' in paragraph && isValidString(Reflect.get(paragraph, 'id'));
    const hasValidContent =
      'content' in paragraph &&
      isValidString(Reflect.get(paragraph, 'content'));
    const hasValidOrder =
      'order' in paragraph &&
      typeof Reflect.get(paragraph, 'order') === 'number' &&
      !Number.isNaN(Reflect.get(paragraph, 'order'));
    const hasValidContainerId = 'containerId' in paragraph;

    return (
      hasValidId && hasValidContent && hasValidOrder && hasValidContainerId
    );
  };

  const isValidFormValues = (formValues: unknown): formValues is FormValues => {
    const isValidFormObject = isValidObject(formValues);
    if (!isValidFormObject) {
      return false;
    }

    const hasEditorCompletedContent = 'editorCompletedContent' in formValues;
    const hasIsEditorCompleted = 'isEditorCompleted' in formValues;

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

// 🔧 캐시 관리 모듈
function createCacheManagerModule() {
  console.log('🔧 [TRANSFORM_ENGINE] 캐시 관리 모듈 생성');

  const editorToMultiStepCache = new Map<
    string,
    CacheEntry<EditorToMultiStepDataTransformationResult>
  >();
  const multiStepToEditorCache = new Map<
    string,
    CacheEntry<MultiStepToEditorDataTransformationResult>
  >();

  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5분

  const { generateSimpleHash } = createHashGeneratorModule();

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

  const getCachedEditorToMultiStep = (
    snapshot: EditorStateSnapshotForBridge,
    strategy: TransformationStrategyType
  ): EditorToMultiStepDataTransformationResult | null => {
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

    console.log('🎯 [TRANSFORM_ENGINE] 캐시 히트 - Editor→MultiStep');
    return cachedEntry.data;
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

  const getCachedMultiStepToEditor = (
    snapshot: MultiStepFormSnapshotForBridge,
    strategy: TransformationStrategyType
  ): MultiStepToEditorDataTransformationResult | null => {
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

    console.log('🎯 [TRANSFORM_ENGINE] 캐시 히트 - MultiStep→Editor');
    return cachedEntry.data;
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

  const clearExpiredCache = (): void => {
    console.log('🧹 [TRANSFORM_ENGINE] 만료된 캐시 정리 시작');

    const currentTime = Date.now();
    let clearedCount = 0;

    // Editor→MultiStep 캐시 정리
    for (const [key, entry] of editorToMultiStepCache.entries()) {
      const isExpired = currentTime - entry.timestamp >= CACHE_EXPIRY_MS;
      if (isExpired) {
        editorToMultiStepCache.delete(key);
        clearedCount++;
      }
    }

    // MultiStep→Editor 캐시 정리
    for (const [key, entry] of multiStepToEditorCache.entries()) {
      const isExpired = currentTime - entry.timestamp >= CACHE_EXPIRY_MS;
      if (isExpired) {
        multiStepToEditorCache.delete(key);
        clearedCount++;
      }
    }

    console.log(
      `✅ [TRANSFORM_ENGINE] 캐시 정리 완료: ${clearedCount}개 항목 제거`
    );
  };

  const getCacheStatistics = () => {
    return {
      editorToMultiStepCacheSize: editorToMultiStepCache.size,
      multiStepToEditorCacheSize: multiStepToEditorCache.size,
      totalCacheSize: editorToMultiStepCache.size + multiStepToEditorCache.size,
    };
  };

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
        const formContentField = Reflect.get(
          formValues,
          'editorCompletedContent'
        );
        const isValidContent = isValidString(formContentField);
        const extractedContent = isValidContent ? formContentField : '';

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
        const formCompletionField = Reflect.get(
          formValues,
          'isEditorCompleted'
        );
        const isValidCompletion = isValidBoolean(formCompletionField);
        const extractedCompletion = isValidCompletion
          ? formCompletionField
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
    transformationEndTime: number
  ): TransformationMetadata => {
    const assignedParagraphs = paragraphs.filter(
      ({ containerId = null }) => containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      ({ containerId = null }) => containerId === null
    );

    const validationWarnings = new Set<string>();

    const hasNoContainers = containers.length === 0;
    if (hasNoContainers) {
      validationWarnings.add('컨테이너가 없습니다');
    }

    const hasUnassignedParagraphs = unassignedParagraphs.length > 0;
    if (hasUnassignedParagraphs) {
      validationWarnings.add(
        `${unassignedParagraphs.length}개의 할당되지 않은 문단이 있습니다`
      );
    }

    const hasEmptyContent = transformedContent.length === 0;
    if (hasEmptyContent) {
      validationWarnings.add('변환된 콘텐츠가 비어있습니다');
    }

    const metadata: TransformationMetadata = {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount: unassignedParagraphs.length,
      totalContentLength: transformedContent.length,
      lastModified: new Date(),
      processingTimeMs: transformationEndTime - transformationStartTime,
      validationWarnings,
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
  console.log('🏭 [TRANSFORM_ENGINE] 데이터 변환 엔진 생성 시작');

  const typeGuards = createTransformEngineTypeGuardModule();
  const errorHandler = createTransformEngineErrorHandlerModule();
  const cacheManager = createCacheManagerModule();
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
        // 캐시 확인
        const shouldCheckCache = enableCaching;
        if (shouldCheckCache) {
          const cachedResult = cacheManager.getCachedEditorToMultiStep(
            editorSnapshot,
            strategy
          );
          const hasCachedResult = cachedResult !== null;
          if (hasCachedResult) {
            console.log('🎯 [TRANSFORM_ENGINE] 캐시된 결과 반환');
            return cachedResult;
          }
        }

        const context = createTransformationContext(strategy, enableCaching);
        console.log(`🚀 [TRANSFORM_ENGINE] 변환 실행: ${context.operationId}`);

        // 입력 검증
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
              transformationEndTime
            )
          : createDefaultTransformationMetadata();

        // 결과 구성
        const result: EditorToMultiStepDataTransformationResult = {
          transformedContent,
          transformedIsCompleted: Boolean(
            editorCompletion || transformedContent.length > 0
          ),
          transformedMetadata,
          transformationSuccess: true,
          transformationErrors: [],
          transformationStrategy,
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
        if (shouldCacheResult) {
          cacheManager.setCachedEditorToMultiStep(
            editorSnapshot,
            transformationStrategy,
            result
          );
        }

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
        // 캐시 확인
        const shouldCheckCache = enableCaching;
        if (shouldCheckCache) {
          const cachedResult = cacheManager.getCachedMultiStepToEditor(
            multiStepSnapshot,
            strategy
          );
          const hasCachedResult = cachedResult !== null;
          if (hasCachedResult) {
            console.log('🎯 [TRANSFORM_ENGINE] 캐시된 결과 반환');
            return cachedResult;
          }
        }

        const context = createTransformationContext(strategy, enableCaching);
        console.log(`🚀 [TRANSFORM_ENGINE] 변환 실행: ${context.operationId}`);

        // 입력 검증
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
        if (shouldCacheResult) {
          cacheManager.setCachedMultiStepToEditor(
            multiStepSnapshot,
            strategy,
            result
          );
        }

        console.log(
          `✅ [TRANSFORM_ENGINE] MultiStep → Editor 변환 완료: ${context.operationId}`
        );
        return result;
      },
      createFailedMultiStepToEditorResult(),
      'MULTISTEP_TO_EDITOR_TRANSFORM'
    );
  };

  // 컨테이너 기반 콘텐츠 생성
  const generateContentFromContainers = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    const hasNoContainers = containers.length === 0;
    if (hasNoContainers) {
      console.warn('⚠️ [TRANSFORM_ENGINE] 컨테이너가 없어 빈 콘텐츠 반환');
      return '';
    }

    const sortedContainers = [...containers].sort(
      ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
        firstOrder - secondOrder
    );

    const contentParts: string[] = [];

    sortedContainers.forEach(
      ({ id: containerId = '', name: containerName = '' }) => {
        const containerParagraphs = paragraphs
          .filter(
            ({ containerId: paragraphContainerId = null }) =>
              paragraphContainerId === containerId
          )
          .sort(
            ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
              firstOrder - secondOrder
          );

        const hasValidParagraphs = containerParagraphs.length > 0;
        if (hasValidParagraphs) {
          contentParts.push(`## ${containerName}`);

          containerParagraphs.forEach(({ content: paragraphContent = '' }) => {
            const hasTrimmedContent = paragraphContent.trim().length > 0;
            if (hasTrimmedContent) {
              contentParts.push(paragraphContent.trim());
            }
          });

          contentParts.push('');
        }
      }
    );

    const generatedContent = contentParts.join('\n');
    console.log(
      `🔧 [TRANSFORM_ENGINE] 컨테이너 기반 콘텐츠 생성: ${generatedContent.length}자`
    );
    return generatedContent;
  };

  // 문단 기반 콘텐츠 생성
  const generateContentFromParagraphs = (
    paragraphs: ParagraphBlock[]
  ): string => {
    const hasNoParagraphs = paragraphs.length === 0;
    if (hasNoParagraphs) {
      console.warn('⚠️ [TRANSFORM_ENGINE] 문단이 없어 빈 콘텐츠 반환');
      return '';
    }

    const unassignedParagraphs = paragraphs
      .filter(({ containerId = null }) => containerId === null)
      .sort(
        ({ order: firstOrder = 0 }, { order: secondOrder = 0 }) =>
          firstOrder - secondOrder
      );

    const contentParts = unassignedParagraphs
      .map(({ content: paragraphContent = '' }) => paragraphContent.trim())
      .filter((content) => content.length > 0);

    const generatedContent = contentParts.join('\n\n');
    console.log(
      `🔧 [TRANSFORM_ENGINE] 문단 기반 콘텐츠 생성: ${generatedContent.length}자`
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
    lastModified: new Date(),
    processingTimeMs: 0,
    validationWarnings: new Set<string>(),
  });

  const createFailedEditorToMultiStepResult =
    (): EditorToMultiStepDataTransformationResult => ({
      transformedContent: '',
      transformedIsCompleted: false,
      transformedMetadata: createDefaultTransformationMetadata(),
      transformationSuccess: false,
      transformationErrors: ['변환 실행 실패'],
      transformationStrategy: 'PARAGRAPH_FALLBACK',
    });

  const createFailedMultiStepToEditorResult =
    (): MultiStepToEditorDataTransformationResult => ({
      editorContent: '',
      editorIsCompleted: false,
      transformationSuccess: false,
      transformationErrors: ['변환 실행 실패'],
      transformedTimestamp: Date.now(),
      contentMetadata: new Map<string, unknown>(),
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

    return (
      hasValidContent &&
      hasValidCompleted &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidMetadata
    );
  };

  console.log('✅ [TRANSFORM_ENGINE] 데이터 변환 엔진 생성 완료');

  return {
    transformEditorToMultiStep,
    transformMultiStepToEditor,
    clearCache: cacheManager.clearExpiredCache,
    getCacheStatistics: cacheManager.getCacheStatistics,
  };
}
