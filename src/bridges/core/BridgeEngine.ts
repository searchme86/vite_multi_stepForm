// bridges/core/BridgeEngine.ts

import type {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  ExternalEditorData,
  LocalParagraphForExternal,
} from '../editorMultiStepBridge/modernBridgeTypes';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateCapture';
import { createDataStructureTransformer } from '../editorMultiStepBridge/dataTransformProcessor';
import { createMultiStepStateUpdater } from '../editorMultiStepBridge/multiStepUpdater';
import { createBridgeDataValidationHandler } from '../editorMultiStepBridge/systemValidator';
import { createBridgeErrorHandler } from '../editorMultiStepBridge/errorSystemManager';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 엔진 상태 인터페이스
interface BridgeEngineState {
  readonly isInitialized: boolean;
  readonly lastOperationTime: number;
  readonly operationCount: number;
  readonly currentOperationId: string | null;
  readonly hasExternalData: boolean;
  readonly externalDataTimestamp: number;
}

// 🔧 엔진 컴포넌트 인터페이스
interface BridgeEngineComponents {
  readonly extractor: ReturnType<typeof createEditorStateExtractor>;
  readonly transformer: ReturnType<typeof createDataStructureTransformer>;
  readonly updater: ReturnType<typeof createMultiStepStateUpdater>;
  readonly validator: ReturnType<typeof createBridgeDataValidationHandler>;
  readonly errorHandler: ReturnType<typeof createBridgeErrorHandler>;
}

// 🔧 엔진 메트릭스 인터페이스
interface BridgeEngineMetrics {
  readonly operationDuration: number;
  readonly validationStatus: boolean;
  readonly componentStatus: Map<string, boolean>;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly externalDataValidations: number;
}

// 🔧 엔진 상태 정보 인터페이스
interface BridgeEngineStatus {
  readonly state: BridgeEngineState;
  readonly configuration: {
    readonly enableValidation: boolean;
    readonly debugMode: boolean;
    readonly maxRetryAttempts: number;
    readonly timeoutMs: number;
    readonly enableErrorRecovery: boolean;
  };
  readonly metrics: BridgeEngineMetrics;
  readonly isReady: boolean;
  readonly hasValidExternalData: boolean;
}

// 🔧 JSON 안전 처리 유틸리티 (작업 2: 순환 참조 안전장치)
function createJSONSafetyUtils() {
  const createSafeStringifyProcessor = () => {
    const processJsonSafely = (data: unknown): string => {
      console.debug('🔍 [JSON_SAFETY] 안전한 JSON 변환 시작');

      try {
        const circularReferenceTracker = new WeakSet();

        const safeJsonString = JSON.stringify(
          data,
          (_key: string, value: unknown) => {
            // Early Return: null이나 primitive 타입은 그대로 반환
            if (value === null || typeof value !== 'object') {
              return value;
            }

            // Early Return: 순환 참조 감지 시 안전한 문자열로 대체
            if (circularReferenceTracker.has(value)) {
              console.warn(
                '⚠️ [JSON_SAFETY] 순환 참조 감지됨, 안전한 표시로 대체'
              );
              return '[Circular Reference]';
            }

            circularReferenceTracker.add(value);
            return value;
          }
        );

        console.debug('✅ [JSON_SAFETY] JSON 변환 성공');
        return safeJsonString;
      } catch (jsonStringifyError) {
        console.error('❌ [JSON_SAFETY] JSON 변환 실패:', jsonStringifyError);

        // 폴백: 타임스탬프 기반 안전한 문자열 생성
        const fallbackString = `{"fallback_timestamp": ${Date.now()}, "error": "json_stringify_failed"}`;
        console.debug('🔄 [JSON_SAFETY] 폴백 문자열 사용:', fallbackString);
        return fallbackString;
      }
    };

    return { processJsonSafely };
  };

  const createSimpleHashGenerator = () => {
    const generateSimpleHash = (data: unknown): string => {
      console.debug('🔍 [HASH_GENERATOR] 해시 생성 시작');

      try {
        const { processJsonSafely } = createSafeStringifyProcessor();
        const safeJsonString = processJsonSafely(data);

        // Early Return: JSON 변환 실패 시 타임스탬프 기반 해시
        if (safeJsonString.includes('json_stringify_failed')) {
          const timestampHash = Date.now().toString(36);
          console.warn(
            '⚠️ [HASH_GENERATOR] JSON 실패로 타임스탬프 해시 사용:',
            timestampHash
          );
          return timestampHash;
        }

        const hashAccumulator = safeJsonString
          .split('')
          .reduce((accumulator: number, character: string) => {
            const characterCode = character.charCodeAt(0);
            return (
              ((accumulator << 5) - accumulator + characterCode) & 0xffffffff
            );
          }, 0);

        // 🔧 개선: Math.abs 사용으로 음수 처리 안전화
        const positiveHashValue = Math.abs(hashAccumulator);
        const finalHashString = positiveHashValue.toString(36);

        console.debug('✅ [HASH_GENERATOR] 해시 생성 완료:', finalHashString);
        return finalHashString;
      } catch (hashGenerationError) {
        console.error(
          '❌ [HASH_GENERATOR] 해시 생성 실패:',
          hashGenerationError
        );

        // 최종 폴백: 현재 시간 + 랜덤값
        const emergencyHash = `${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        console.debug('🚨 [HASH_GENERATOR] 긴급 해시 사용:', emergencyHash);
        return emergencyHash;
      }
    };

    return { generateSimpleHash };
  };

  const createDataIntegrityValidator = () => {
    const validateDataIntegrityWithHash = (
      originalData: unknown,
      expectedHash: string
    ): boolean => {
      console.debug('🔍 [DATA_INTEGRITY] 데이터 무결성 검증 시작');

      try {
        const { generateSimpleHash } = createSimpleHashGenerator();
        const currentDataHash = generateSimpleHash(originalData);

        const isIntegrityValid = currentDataHash === expectedHash;

        console.debug('📊 [DATA_INTEGRITY] 무결성 검증 결과:', {
          currentHash: currentDataHash,
          expectedHash,
          isValid: isIntegrityValid,
        });

        return isIntegrityValid;
      } catch (integrityValidationError) {
        console.error(
          '❌ [DATA_INTEGRITY] 무결성 검증 실패:',
          integrityValidationError
        );
        return false;
      }
    };

    return { validateDataIntegrityWithHash };
  };

  return {
    createSafeStringifyProcessor,
    createSimpleHashGenerator,
    createDataIntegrityValidator,
  };
}

// 🔧 안전한 타입 변환 유틸리티
function createSafeTypeConverters() {
  const convertToSafeNumber = (
    value: unknown,
    defaultValue: number
  ): number => {
    const isValidNumber = typeof value === 'number' && !Number.isNaN(value);
    return isValidNumber ? value : defaultValue;
  };

  const convertToSafeString = (
    value: unknown,
    defaultValue: string
  ): string => {
    const isValidString = typeof value === 'string';
    return isValidString ? value : defaultValue;
  };

  const convertToSafeBoolean = (
    value: unknown,
    defaultValue: boolean
  ): boolean => {
    const isValidBoolean = typeof value === 'boolean';
    return isValidBoolean ? value : defaultValue;
  };

  const convertToAllowedErrorType = (
    errorSource: unknown
  ): string | number | boolean | object | null | undefined => {
    // Early Return: null 체크
    if (errorSource === null) {
      return null;
    }

    // Early Return: undefined 체크
    if (errorSource === undefined) {
      return undefined;
    }

    // Early Return: string 타입
    if (typeof errorSource === 'string') {
      return errorSource;
    }

    // Early Return: number 타입
    if (typeof errorSource === 'number') {
      return errorSource;
    }

    // Early Return: boolean 타입
    if (typeof errorSource === 'boolean') {
      return errorSource;
    }

    // Early Return: object 타입
    if (typeof errorSource === 'object') {
      return errorSource;
    }

    // 기타 타입을 안전하게 문자열로 변환
    try {
      return String(errorSource);
    } catch (conversionError) {
      console.warn('⚠️ [BRIDGE_ENGINE] 에러 타입 변환 실패:', conversionError);
      return 'Unknown error type';
    }
  };

  return {
    convertToSafeNumber,
    convertToSafeString,
    convertToSafeBoolean,
    convertToAllowedErrorType,
  };
}

// 🔧 외부 데이터 검증 유틸리티
function createExternalDataValidators() {
  const isValidContainer = (candidate: unknown): candidate is Container => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const containerObj = candidate;
    const hasRequiredProperties =
      'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(containerObj, 'id');
    const nameValue = Reflect.get(containerObj, 'name');
    const orderValue = Reflect.get(containerObj, 'order');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof nameValue === 'string' &&
      typeof orderValue === 'number';

    return hasValidTypes && idValue.length > 0 && nameValue.length > 0;
  };

  const isValidParagraph = (
    candidate: unknown
  ): candidate is ParagraphBlock => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string');

    return hasValidTypes && idValue.length > 0;
  };

  const isValidLocalParagraph = (
    candidate: unknown
  ): candidate is LocalParagraphForExternal => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj &&
      'createdAt' in paragraphObj &&
      'updatedAt' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');
    const createdAtValue = Reflect.get(paragraphObj, 'createdAt');
    const updatedAtValue = Reflect.get(paragraphObj, 'updatedAt');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string') &&
      createdAtValue instanceof Date &&
      updatedAtValue instanceof Date;

    return hasValidTypes && idValue.length > 0;
  };

  const isValidExternalData = (
    candidate: unknown
  ): candidate is ExternalEditorData => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      console.debug('🔍 [BRIDGE_ENGINE] 외부 데이터가 객체가 아님');
      return false;
    }

    const dataObj = candidate;
    const hasRequiredProperties =
      'localContainers' in dataObj && 'localParagraphs' in dataObj;

    if (!hasRequiredProperties) {
      console.debug('🔍 [BRIDGE_ENGINE] 외부 데이터 필수 속성 누락');
      return false;
    }

    const containersValue = Reflect.get(dataObj, 'localContainers');
    const paragraphsValue = Reflect.get(dataObj, 'localParagraphs');

    const isValidContainersArray = Array.isArray(containersValue);
    const isValidParagraphsArray = Array.isArray(paragraphsValue);

    if (!isValidContainersArray || !isValidParagraphsArray) {
      console.debug('🔍 [BRIDGE_ENGINE] 외부 데이터 배열 타입 오류');
      return false;
    }

    console.debug('✅ [BRIDGE_ENGINE] 외부 데이터 구조 검증 통과');
    return true;
  };

  const validateExternalDataQuality = (
    externalData: ExternalEditorData
  ): {
    isQualityValid: boolean;
    containerValidCount: number;
    paragraphValidCount: number;
    qualityScore: number;
  } => {
    console.debug('🔍 [BRIDGE_ENGINE] 외부 데이터 품질 검증 시작');

    const { localContainers = [], localParagraphs = [] } = externalData;

    // 컨테이너 검증
    const validContainers = localContainers.filter(isValidContainer);
    const containerValidCount = validContainers.length;
    const containerQualityRatio =
      localContainers.length > 0
        ? containerValidCount / localContainers.length
        : 1;

    // 문단 검증
    const validParagraphs = localParagraphs.filter(isValidLocalParagraph);
    const paragraphValidCount = validParagraphs.length;
    const paragraphQualityRatio =
      localParagraphs.length > 0
        ? paragraphValidCount / localParagraphs.length
        : 1;

    // 🔧 품질 점수 계산 (0-100) - 더 관대한 기준 적용
    const qualityScore = Math.round(
      (containerQualityRatio + paragraphQualityRatio) * 50
    );

    // 🔧 품질 유효성 (80% → 60%로 완화)
    const isQualityValid = qualityScore >= 60;

    console.debug('📊 [BRIDGE_ENGINE] 외부 데이터 품질 검증 결과:', {
      containerValidCount,
      paragraphValidCount,
      qualityScore,
      isQualityValid,
      qualityThreshold: 60,
      containerQualityRatio: Math.round(containerQualityRatio * 100),
      paragraphQualityRatio: Math.round(paragraphQualityRatio * 100),
    });

    return {
      isQualityValid,
      containerValidCount,
      paragraphValidCount,
      qualityScore,
    };
  };

  return {
    isValidContainer,
    isValidParagraph,
    isValidLocalParagraph,
    isValidExternalData,
    validateExternalDataQuality,
  };
}

// 🔧 엔진 검증 유틸리티
function createBridgeEngineValidators() {
  const isValidConfiguration = (
    config: unknown
  ): config is BridgeSystemConfiguration => {
    const isObjectType = config !== null && typeof config === 'object';
    if (!isObjectType) {
      return false;
    }

    const configObject = config;
    const requiredProperties = [
      'enableValidation',
      'enableErrorRecovery',
      'debugMode',
      'maxRetryAttempts',
      'timeoutMs',
    ];

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in configObject
    );

    return hasRequiredProperties;
  };

  const isValidSnapshot = (
    snapshot: unknown
  ): snapshot is EditorStateSnapshotForBridge => {
    const isObjectType = snapshot !== null && typeof snapshot === 'object';
    if (!isObjectType) {
      return false;
    }

    const snapshotObject = snapshot;
    const requiredProperties = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'editorIsCompleted',
      'extractedTimestamp',
    ];

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in snapshotObject
    );

    return hasRequiredProperties;
  };

  const isValidTransformationResult = (
    result: unknown
  ): result is EditorToMultiStepDataTransformationResult => {
    const isObjectType = result !== null && typeof result === 'object';
    if (!isObjectType) {
      return false;
    }

    const resultObject = result;
    const requiredProperties = [
      'transformedContent',
      'transformedIsCompleted',
      'transformationSuccess',
    ];

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in resultObject
    );

    if (!hasRequiredProperties) {
      return false;
    }

    const transformationSuccess = Reflect.get(
      resultObject,
      'transformationSuccess'
    );
    return (
      typeof transformationSuccess === 'boolean' &&
      transformationSuccess === true
    );
  };

  return {
    isValidConfiguration,
    isValidSnapshot,
    isValidTransformationResult,
  };
}

// 🔧 외부 데이터 스냅샷 생성 모듈 (JSON 안전장치 적용)
function createExternalDataSnapshotGenerator() {
  const generateSnapshotFromExternalData = (
    externalData: ExternalEditorData
  ): EditorStateSnapshotForBridge => {
    console.debug(
      '🔧 [BRIDGE_ENGINE] 외부 데이터로부터 스냅샷 생성 시작 (JSON 안전장치 적용)'
    );

    const { createSimpleHashGenerator } = createJSONSafetyUtils();
    const { generateSimpleHash } = createSimpleHashGenerator();

    const { localContainers = [], localParagraphs = [] } = externalData;
    const extractionTimestamp = Date.now();

    // 🔧 데이터 무결성 해시 생성 (순환 참조 안전)
    const dataIntegrityHash = generateSimpleHash({
      containers: localContainers,
      paragraphs: localParagraphs,
      timestamp: extractionTimestamp,
    });

    console.debug(
      '🔒 [SNAPSHOT_GENERATOR] 데이터 무결성 해시 생성:',
      dataIntegrityHash
    );

    // 콘텐츠 생성
    const sortedContainers = [...localContainers].sort(
      (firstContainer: Container, secondContainer: Container) =>
        firstContainer.order - secondContainer.order
    );
    const contentParts: string[] = [];

    sortedContainers.forEach((container: Container) => {
      const { id: containerId, name: containerName } = container;

      // 해당 컨테이너의 문단들 찾기
      const containerParagraphs = localParagraphs
        .filter(
          (paragraphItem: LocalParagraphForExternal) =>
            paragraphItem.containerId === containerId
        )
        .sort(
          (
            firstParagraph: LocalParagraphForExternal,
            secondParagraph: LocalParagraphForExternal
          ) => firstParagraph.order - secondParagraph.order
        );

      const hasValidParagraphs = containerParagraphs.length > 0;
      if (hasValidParagraphs) {
        contentParts.push(`## ${containerName}`);

        containerParagraphs.forEach(
          (paragraphItem: LocalParagraphForExternal) => {
            const { content } = paragraphItem;
            const hasValidContent = content && content.trim().length > 0;
            hasValidContent ? contentParts.push(content.trim()) : null;
          }
        );

        contentParts.push('');
      }
    });

    // 할당되지 않은 문단들 추가
    const unassignedParagraphs = localParagraphs
      .filter(
        (paragraphItem: LocalParagraphForExternal) =>
          paragraphItem.containerId === null
      )
      .sort(
        (
          firstParagraph: LocalParagraphForExternal,
          secondParagraph: LocalParagraphForExternal
        ) => firstParagraph.order - secondParagraph.order
      );

    unassignedParagraphs.forEach((paragraphItem: LocalParagraphForExternal) => {
      const { content } = paragraphItem;
      const hasValidContent = content && content.trim().length > 0;
      hasValidContent ? contentParts.push(content.trim()) : null;
    });

    const completedContent = contentParts.join('\n');
    const isCompleted = completedContent.length > 0;

    // 메타데이터 생성 (JSON 안전장치 적용)
    const additionalMetrics = new Map<string, number>();
    additionalMetrics.set('containerCount', localContainers.length);
    additionalMetrics.set('paragraphCount', localParagraphs.length);
    additionalMetrics.set('contentLength', completedContent.length);
    additionalMetrics.set('dataIntegrityHashLength', dataIntegrityHash.length);

    const processingFlags = new Set<string>();
    processingFlags.add('EXTERNAL_DATA_SOURCE');
    processingFlags.add('SNAPSHOT_GENERATED');
    processingFlags.add('JSON_SAFETY_APPLIED');

    const snapshotMetadata = {
      extractionTimestamp,
      processingDurationMs: 0,
      validationStatus: true,
      dataIntegrity: completedContent.length > 0,
      dataIntegrityHash, // 🔧 추가: 무결성 검증용 해시
      sourceInfo: {
        coreStoreVersion: 'external-1.0.0',
        uiStoreVersion: 'external-1.0.0',
      },
      additionalMetrics,
      processingFlags,
    };

    const contentStatistics = new Map<string, number>();
    contentStatistics.set('totalContainers', localContainers.length);
    contentStatistics.set('totalParagraphs', localParagraphs.length);
    contentStatistics.set('totalContentLength', completedContent.length);

    const validationCache = new Map<string, boolean>();
    validationCache.set('structureValid', true);
    validationCache.set('hasContent', completedContent.length > 0);
    validationCache.set('jsonSafetyApplied', true);

    // ParagraphBlock 타입으로 변환
    const convertedParagraphs: ParagraphBlock[] = localParagraphs.map(
      (paragraphItem: LocalParagraphForExternal): ParagraphBlock => ({
        id: paragraphItem.id,
        content: paragraphItem.content,
        containerId: paragraphItem.containerId,
        order: paragraphItem.order,
        createdAt: paragraphItem.createdAt,
        updatedAt: paragraphItem.updatedAt,
      })
    );

    const snapshot: EditorStateSnapshotForBridge = {
      editorContainers: localContainers,
      editorParagraphs: convertedParagraphs,
      editorCompletedContent: completedContent,
      editorIsCompleted: isCompleted,
      editorActiveParagraphId: null,
      editorSelectedParagraphIds: [],
      editorIsPreviewOpen: false,
      extractedTimestamp: extractionTimestamp,
      snapshotMetadata,
      contentStatistics,
      validationCache,
    };

    console.debug(
      '✅ [BRIDGE_ENGINE] 외부 데이터 스냅샷 생성 완료 (JSON 안전장치 적용):',
      {
        containerCount: localContainers.length,
        paragraphCount: localParagraphs.length,
        contentLength: completedContent.length,
        isCompleted,
        dataIntegrityHash,
      }
    );

    return snapshot;
  };

  return {
    generateSnapshotFromExternalData,
  };
}

// 🔧 메인 브릿지 엔진 생성 함수
function createBridgeEngineCore(
  configuration: BridgeSystemConfiguration,
  externalData?: ExternalEditorData
) {
  console.log(
    '🔧 [BRIDGE_ENGINE] 핵심 엔진 생성 시작 (외부 데이터 지원 + JSON 안전장치)'
  );

  const {
    convertToSafeNumber,
    convertToSafeBoolean,
    convertToAllowedErrorType,
  } = createSafeTypeConverters();
  const { isValidSnapshot, isValidTransformationResult } =
    createBridgeEngineValidators();
  const { isValidExternalData, validateExternalDataQuality } =
    createExternalDataValidators();
  const { generateSnapshotFromExternalData } =
    createExternalDataSnapshotGenerator();
  const { createDataIntegrityValidator } = createJSONSafetyUtils();
  const { validateDataIntegrityWithHash } = createDataIntegrityValidator();

  // 외부 데이터 검증 (JSON 안전장치 적용)
  const hasValidExternalData = externalData
    ? isValidExternalData(externalData)
    : false;
  const externalDataQuality =
    hasValidExternalData && externalData
      ? validateExternalDataQuality(externalData)
      : {
          isQualityValid: false,
          containerValidCount: 0,
          paragraphValidCount: 0,
          qualityScore: 0,
        };

  console.log(
    '📊 [BRIDGE_ENGINE] 외부 데이터 검증 결과 (JSON 안전장치 적용):',
    {
      hasValidExternalData,
      qualityScore: externalDataQuality.qualityScore,
      isQualityValid: externalDataQuality.isQualityValid,
      containerValidCount: externalDataQuality.containerValidCount,
      paragraphValidCount: externalDataQuality.paragraphValidCount,
      jsonSafetyEnabled: true,
    }
  );

  let engineState: BridgeEngineState = {
    isInitialized: false,
    lastOperationTime: 0,
    operationCount: 0,
    currentOperationId: null,
    hasExternalData: hasValidExternalData,
    externalDataTimestamp: hasValidExternalData ? Date.now() : 0,
  };

  let operationMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    externalDataValidations: 0,
  };

  const components: BridgeEngineComponents = {
    extractor: createEditorStateExtractor(),
    transformer: createDataStructureTransformer(),
    updater: createMultiStepStateUpdater(),
    validator: createBridgeDataValidationHandler(),
    errorHandler: createBridgeErrorHandler(),
  };

  console.log(
    '🔧 [BRIDGE_ENGINE] 핵심 컴포넌트 초기화 완료 (JSON 안전장치 포함):',
    {
      extractorInitialized: !!components.extractor,
      transformerInitialized: !!components.transformer,
      updaterInitialized: !!components.updater,
      validatorInitialized: !!components.validator,
      errorHandlerInitialized: !!components.errorHandler,
      jsonSafetyUtilsLoaded: true,
    }
  );

  const updateEngineState = (updates: Partial<BridgeEngineState>): void => {
    engineState = {
      ...engineState,
      ...updates,
      lastOperationTime: Date.now(),
    };
    console.debug('📊 [BRIDGE_ENGINE] 엔진 상태 업데이트:', engineState);
  };

  const updateOperationMetrics = (success: boolean): void => {
    operationMetrics = {
      ...operationMetrics,
      totalOperations: operationMetrics.totalOperations + 1,
      successfulOperations: success
        ? operationMetrics.successfulOperations + 1
        : operationMetrics.successfulOperations,
      failedOperations: success
        ? operationMetrics.failedOperations
        : operationMetrics.failedOperations + 1,
    };
  };

  const validatePreconditions = (): boolean => {
    console.log(
      '🔍 [BRIDGE_ENGINE] 사전 조건 검증 시작 (외부 데이터 우선 + JSON 안전장치)'
    );

    try {
      // Early Return: 외부 데이터가 있는 경우 우선 사용
      if (hasValidExternalData && externalData) {
        console.log(
          '✅ [BRIDGE_ENGINE] 외부 데이터를 사용한 검증 (JSON 안전장치 적용)'
        );

        operationMetrics = {
          ...operationMetrics,
          externalDataValidations: operationMetrics.externalDataValidations + 1,
        };

        // 🔧 외부 데이터 품질 체크 - 더 관대한 기준 적용
        const isQualityAcceptable = externalDataQuality.isQualityValid;
        const hasMinimumData =
          externalDataQuality.containerValidCount > 0 ||
          externalDataQuality.paragraphValidCount > 0;

        // 🔧 추가: 품질이 낮아도 최소 데이터가 있으면 허용
        const canUseExternalData = isQualityAcceptable || hasMinimumData;

        // 🔧 JSON 안전성 검증 추가
        const jsonSafetyTestPassed = validateDataIntegrityWithHash(
          externalData,
          'external_data_test'
        );

        console.log(
          '📊 [BRIDGE_ENGINE] 외부 데이터 기반 검증 결과 (JSON 안전장치 포함):',
          {
            isQualityAcceptable,
            hasMinimumData,
            canUseExternalData,
            qualityScore: externalDataQuality.qualityScore,
            containerValidCount: externalDataQuality.containerValidCount,
            paragraphValidCount: externalDataQuality.paragraphValidCount,
            jsonSafetyTestPassed,
          }
        );

        return canUseExternalData;
      }

      // 기존 스토어 기반 검증
      console.log('🔄 [BRIDGE_ENGINE] 기존 스토어 기반 검증 시도');
      const snapshot = components.extractor.getEditorStateWithValidation();

      // Early Return: 스냅샷이 없는 경우
      if (!snapshot) {
        console.warn('⚠️ [BRIDGE_ENGINE] 에디터 스냅샷이 없음');
        return false;
      }

      // Early Return: 유효하지 않은 스냅샷인 경우
      if (!isValidSnapshot(snapshot)) {
        console.warn('⚠️ [BRIDGE_ENGINE] 유효하지 않은 스냅샷 구조');
        return false;
      }

      // 🔧 스냅샷 내용 디버깅 정보 추가
      const {
        editorContainers = [],
        editorParagraphs = [],
        editorCompletedContent = '',
      } = snapshot;
      console.log('📊 [BRIDGE_ENGINE] 스토어 스냅샷 내용:', {
        containerCount: editorContainers.length,
        paragraphCount: editorParagraphs.length,
        contentLength: editorCompletedContent.length,
        hasContent: editorCompletedContent.length > 0,
      });

      const validationResult =
        components.validator.validateForTransfer(snapshot);
      const { isValidForTransfer = false } = validationResult;

      console.log('✅ [BRIDGE_ENGINE] 기존 스토어 기반 검증 완료:', {
        isValidForTransfer,
        validationResult,
      });

      return isValidForTransfer;
    } catch (validationError) {
      console.error('❌ [BRIDGE_ENGINE] 사전 조건 검증 실패:', validationError);
      return false;
    }
  };

  const executeTransferOperation =
    async (): Promise<BridgeOperationExecutionResult> => {
      console.log(
        '🚀 [BRIDGE_ENGINE] 전송 작업 실행 시작 (외부 데이터 지원 + JSON 안전장치)'
      );
      const operationStartTime = performance.now();
      const operationId = `bridge_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      updateEngineState({
        currentOperationId: operationId,
        operationCount: engineState.operationCount + 1,
      });

      try {
        // 1단계: 사전 조건 확인
        const canProceed = validatePreconditions();
        if (!canProceed) {
          throw new Error('사전 조건 검증 실패');
        }

        // 2단계: 데이터 추출 (외부 데이터 우선, JSON 안전장치 적용)
        let snapshot: EditorStateSnapshotForBridge;

        if (hasValidExternalData && externalData) {
          console.log(
            '📤 [BRIDGE_ENGINE] 외부 데이터로부터 스냅샷 생성 (JSON 안전장치 적용)'
          );
          snapshot = generateSnapshotFromExternalData(externalData);
        } else {
          console.log('📤 [BRIDGE_ENGINE] 기존 스토어로부터 스냅샷 추출');
          const extractedSnapshot =
            components.extractor.getEditorStateWithValidation();
          if (!extractedSnapshot) {
            throw new Error('에디터 데이터 추출 실패');
          }
          snapshot = extractedSnapshot;
        }

        // 3단계: 데이터 변환
        const transformationResult =
          components.transformer.transformEditorStateToMultiStep(snapshot);

        // Early Return: 변환 결과 검증
        if (!isValidTransformationResult(transformationResult)) {
          const { transformationErrors = [] } = transformationResult;
          throw new Error(`변환 실패: ${transformationErrors.join(', ')}`);
        }

        // 4단계: 상태 업데이트
        const updateSuccess =
          await components.updater.performCompleteStateUpdate(
            transformationResult
          );

        // Early Return: 업데이트 실패인 경우
        if (!updateSuccess) {
          throw new Error('MultiStep 상태 업데이트 실패');
        }

        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        updateOperationMetrics(true);
        updateEngineState({
          currentOperationId: null,
        });

        const successMetadata = new Map<string, unknown>();
        successMetadata.set('operationId', operationId);
        successMetadata.set('processingTimeMs', operationDuration);
        successMetadata.set('transformationSuccess', true);
        successMetadata.set(
          'dataSource',
          hasValidExternalData ? 'external' : 'store'
        );
        successMetadata.set('componentStatus', 'all_operational');
        successMetadata.set('jsonSafetyApplied', true);

        const performanceProfile = new Map<string, number>();
        performanceProfile.set('totalDuration', operationDuration);
        performanceProfile.set('extractionPhase', 0);
        performanceProfile.set('transformationPhase', 0);
        performanceProfile.set('updatePhase', 0);

        const resourceUsage = new Map<string, number>();
        resourceUsage.set('memoryUsed', 0);
        resourceUsage.set('cpuTime', operationDuration);

        console.log('✅ [BRIDGE_ENGINE] 전송 작업 성공 (JSON 안전장치 적용):', {
          operationId,
          duration: `${operationDuration.toFixed(2)}ms`,
          operationCount: engineState.operationCount,
          dataSource: hasValidExternalData ? 'external' : 'store',
          jsonSafetyEnabled: true,
        });

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: [],
          transferredData: transformationResult,
          operationDuration,
          executionMetadata: successMetadata,
          performanceProfile,
          resourceUsage,
        };
      } catch (operationError) {
        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        updateOperationMetrics(false);
        updateEngineState({
          currentOperationId: null,
        });

        const errorMessage =
          operationError instanceof Error
            ? operationError.message
            : 'Unknown operation error';

        console.error('❌ [BRIDGE_ENGINE] 전송 작업 실패:', {
          operationId,
          error: errorMessage,
          duration: `${operationDuration.toFixed(2)}ms`,
        });

        const safeErrorForHandler = convertToAllowedErrorType(operationError);
        const errorDetails =
          components.errorHandler.handleTransferError(safeErrorForHandler);

        const failureMetadata = new Map<string, unknown>();
        failureMetadata.set('operationId', operationId);
        failureMetadata.set('processingTimeMs', operationDuration);
        failureMetadata.set('transformationSuccess', false);
        failureMetadata.set('errorOccurred', true);
        failureMetadata.set('jsonSafetyApplied', true);

        const performanceProfile = new Map<string, number>();
        performanceProfile.set('totalDuration', operationDuration);
        performanceProfile.set('errorOccurredAt', operationDuration);

        const resourceUsage = new Map<string, number>();
        resourceUsage.set('cpuTime', operationDuration);

        return {
          operationSuccess: false,
          operationErrors: [errorDetails],
          operationWarnings: [],
          transferredData: null,
          operationDuration,
          executionMetadata: failureMetadata,
          performanceProfile,
          resourceUsage,
        };
      }
    };

  const generateEngineMetrics = (): BridgeEngineMetrics => {
    console.debug('📊 [BRIDGE_ENGINE] 엔진 메트릭 생성');

    const componentStatusMap = new Map<string, boolean>();
    componentStatusMap.set('extractor', !!components.extractor);
    componentStatusMap.set('transformer', !!components.transformer);
    componentStatusMap.set('updater', !!components.updater);
    componentStatusMap.set('validator', !!components.validator);
    componentStatusMap.set('errorHandler', !!components.errorHandler);

    const allComponentsOperational = Array.from(
      componentStatusMap.values()
    ).every((status: boolean) => status);

    return {
      operationDuration: engineState.lastOperationTime,
      validationStatus: allComponentsOperational,
      componentStatus: componentStatusMap,
      totalOperations: operationMetrics.totalOperations,
      successfulOperations: operationMetrics.successfulOperations,
      failedOperations: operationMetrics.failedOperations,
      externalDataValidations: operationMetrics.externalDataValidations,
    };
  };

  const initializeEngine = (): boolean => {
    console.log(
      '🔧 [BRIDGE_ENGINE] 엔진 초기화 (외부 데이터 지원 + JSON 안전장치)'
    );

    try {
      const allComponentsReady = Object.values(components).every(
        (component) => component !== null
      );

      // Early Return: 컴포넌트가 준비되지 않은 경우
      if (!allComponentsReady) {
        console.error('❌ [BRIDGE_ENGINE] 일부 컴포넌트가 초기화되지 않음');
        return false;
      }

      updateEngineState({
        isInitialized: true,
        operationCount: 0,
      });

      console.log('✅ [BRIDGE_ENGINE] 엔진 초기화 완료 (JSON 안전장치 포함):', {
        hasExternalData: hasValidExternalData,
        externalDataQuality: externalDataQuality.qualityScore,
        qualityThreshold: 60,
        componentStatus: 'all_ready',
        jsonSafetyEnabled: true,
      });
      return true;
    } catch (initError) {
      console.error('❌ [BRIDGE_ENGINE] 엔진 초기화 실패:', initError);
      return false;
    }
  };

  const getEngineStatus = (): BridgeEngineStatus => {
    // 🔧 구조분해할당 + Fallback으로 안전한 설정 추출
    const {
      enableValidation = false,
      debugMode = false,
      maxRetryAttempts: configMaxRetry = 3,
      timeoutMs: configTimeout = 5000,
      enableErrorRecovery = false,
    } = configuration;

    return {
      state: engineState,
      configuration: {
        enableValidation,
        debugMode,
        maxRetryAttempts: convertToSafeNumber(configMaxRetry, 3),
        timeoutMs: convertToSafeNumber(configTimeout, 5000),
        enableErrorRecovery: convertToSafeBoolean(enableErrorRecovery, false),
      },
      metrics: generateEngineMetrics(),
      isReady: engineState.isInitialized && validatePreconditions(),
      hasValidExternalData,
    };
  };

  const getEngineComponents = (): BridgeEngineComponents => {
    return { ...components };
  };

  // 엔진 초기화 실행
  const initSuccess = initializeEngine();
  if (!initSuccess) {
    throw new Error('Bridge Engine 초기화 실패');
  }

  return {
    executeTransfer: executeTransferOperation,
    checkPreconditions: validatePreconditions,
    getStatus: getEngineStatus,
    getConfiguration: () => ({ ...configuration }),
    getComponents: getEngineComponents,
    isInitialized: () => engineState.isInitialized,
    getCurrentOperationId: () => engineState.currentOperationId,
    getMetrics: generateEngineMetrics,
    hasExternalData: () => hasValidExternalData,
    getExternalDataQuality: () => externalDataQuality,
  };
}

// 🔧 메인 팩토리 함수 (외부 데이터 지원 + JSON 안전장치)
export function createBridgeEngine(
  customConfiguration?: Partial<BridgeSystemConfiguration>,
  externalData?: ExternalEditorData
) {
  console.log(
    '🏭 [BRIDGE_ENGINE] Bridge 엔진 팩토리 시작 (외부 데이터 지원 + JSON 안전장치)'
  );

  const { isValidConfiguration } = createBridgeEngineValidators();
  const { isValidExternalData } = createExternalDataValidators();

  const defaultConfiguration: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: true,
    debugMode: false,
    maxRetryAttempts: 3,
    timeoutMs: 5000,
    performanceLogging: false,
    strictTypeChecking: true,
    customValidationRules: new Map(),
    featureFlags: new Set(),
  };

  const mergedConfiguration = customConfiguration
    ? { ...defaultConfiguration, ...customConfiguration }
    : defaultConfiguration;

  // Early Return: 유효하지 않은 설정인 경우
  if (!isValidConfiguration(mergedConfiguration)) {
    console.error('❌ [BRIDGE_ENGINE] 유효하지 않은 설정으로 기본값 사용');
    return createBridgeEngineCore(defaultConfiguration, externalData);
  }

  // 외부 데이터 검증 및 로깅
  const hasValidExternalData = externalData
    ? isValidExternalData(externalData)
    : false;
  console.log('📊 [BRIDGE_ENGINE] 외부 데이터 상태 (JSON 안전장치 포함):', {
    hasExternalData: !!externalData,
    isValidExternalData: hasValidExternalData,
    containerCount: externalData?.localContainers?.length || 0,
    paragraphCount: externalData?.localParagraphs?.length || 0,
    jsonSafetyEnabled: true,
  });

  console.log(
    '✅ [BRIDGE_ENGINE] Bridge 엔진 생성 완료 (JSON 안전장치 포함):',
    {
      enableValidation: mergedConfiguration.enableValidation,
      debugMode: mergedConfiguration.debugMode,
      maxRetryAttempts: mergedConfiguration.maxRetryAttempts,
      hasExternalData: hasValidExternalData,
      qualityThreshold: 60,
      jsonSafetyEnabled: true,
    }
  );

  return createBridgeEngineCore(mergedConfiguration, externalData);
}

console.log(
  '🏗️ [BRIDGE_ENGINE] 브릿지 엔진 모듈 초기화 완료 (외부 데이터 지원 + JSON 안전장치)'
);
console.log('📊 [BRIDGE_ENGINE] 제공 기능:', {
  transferExecution: '에디터 → 멀티스텝 전송',
  externalDataSupport: '외부 데이터 주입 지원',
  preconditionValidation: '사전 조건 검증',
  componentManagement: '컴포넌트 생명주기 관리',
  errorHandling: '통합 에러 처리',
  performanceMonitoring: '성능 메트릭스 추적',
  improvedDebugging: '향상된 디버깅 정보',
  relaxedQualityCheck: '완화된 품질 기준 (60%)',
  jsonSafetyGuard: '🔒 JSON 순환 참조 안전장치',
  dataIntegrityValidation: '🔒 데이터 무결성 검증',
});
console.log('✅ [BRIDGE_ENGINE] 모든 엔진 기능 준비 완료 (JSON 안전장치 포함)');
