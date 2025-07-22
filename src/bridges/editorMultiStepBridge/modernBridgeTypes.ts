// 📁 bridges/editorMultiStepBridge/modernBridgeTypes.ts

// 🔧 **통합된 타입들을 commonTypes에서 import** (타입 통일)
import type {
  Container,
  ParagraphBlock,
  FormValues,
} from '../../store/shared/commonTypes';

// 🔧 **Bridge 전용 FormValues 별칭** (호환성 유지)
export type BridgeFormValues = FormValues;
export type BridgeCompatibleFormValues = FormValues;
export type ExpectedBridgeFormValues = FormValues;

// 🔧 외부 에디터 데이터 인터페이스
export interface ExternalEditorData {
  readonly localContainers: readonly Container[];
  readonly localParagraphs: readonly LocalParagraphForExternal[];
}

// 🔧 외부 데이터용 문단 인터페이스
export interface LocalParagraphForExternal {
  readonly id: string;
  readonly content: string;
  readonly containerId: string | null;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly originalId?: string;
}

// 🔧 기본 스냅샷 메타데이터 인터페이스 - Map 기반 최적화
export interface SnapshotMetadata {
  readonly extractionTimestamp: number;
  readonly processingDurationMs: number;
  readonly validationStatus: boolean;
  readonly dataIntegrity: boolean;
  readonly sourceInfo: {
    readonly coreStoreVersion: string;
    readonly uiStoreVersion: string;
  };
  readonly additionalMetrics: Map<string, number>;
  readonly processingFlags: Set<string>;
}

// 🔧 브릿지 에러 컨텍스트 - Map 기반 성능 최적화
export interface BridgeErrorContext {
  readonly contextIdentifier: string;
  readonly originalErrorSource:
    | string
    | number
    | boolean
    | null
    | undefined
    | object;
  readonly errorTimestamp: number;
  readonly contextualData: Map<string, string | number | boolean | null>;
  readonly errorMetadata: Map<string, unknown>;
  readonly errorSeverityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly isRecoverableError: boolean;
}

// 🔧 변환 메타데이터 - 구체적 타입 정의
export interface TransformationMetadata {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly lastModifiedDate: Date;
  readonly processingTimeMs: number;
  readonly validationWarnings: Set<string>;
  readonly performanceMetrics: Map<string, number>;
  readonly transformationStrategy: TransformationStrategyType;
}

// 🔧 변환 전략 타입 - 명확한 전략 정의
export type TransformationStrategyType =
  | 'EXISTING_CONTENT'
  | 'REBUILD_FROM_CONTAINERS'
  | 'PARAGRAPH_FALLBACK'
  | 'HYBRID_APPROACH'
  | 'EMERGENCY_RECOVERY';

// 🔧 검증 결과 인터페이스 - 구체적 에러 정보
export interface ValidationResult {
  readonly isValidForTransfer: boolean;
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
  readonly hasMinimumContent: boolean;
  readonly hasRequiredStructure: boolean;
  readonly errorDetails: Map<string, string>;
  readonly validationMetrics: Map<string, number>;
  readonly validationFlags: Set<string>;
}

// 🔧 에러 상세 정보 - 복구 가능성 포함
export interface ErrorDetails {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly errorTimestamp: Date;
  readonly errorContext: BridgeErrorContext;
  readonly isRecoverable: boolean;
  readonly errorSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly recoveryAttempts: number;
  readonly maxRecoveryAttempts: number;
  readonly recoveryStrategies: Set<string>;
}

// 🔧 브릿지 시스템 설정 - 환경별 구성
export interface BridgeSystemConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
  readonly maxRetryAttempts: number;
  readonly timeoutMs: number;
  readonly performanceLogging: boolean;
  readonly strictTypeChecking: boolean;
  readonly customValidationRules: Map<string, (data: unknown) => boolean>;
  readonly featureFlags: Set<string>;
  readonly [key: string]: unknown; // 인덱스 시그니처 추가
}

// 🔧 에디터 상태 스냅샷 - 모든 필수 데이터 포함
export interface EditorStateSnapshotForBridge {
  readonly editorContainers: readonly Container[];
  readonly editorParagraphs: readonly ParagraphBlock[];
  readonly editorCompletedContent: string;
  readonly editorIsCompleted: boolean;
  readonly editorActiveParagraphId: string | null;
  readonly editorSelectedParagraphIds: readonly string[];
  readonly editorIsPreviewOpen: boolean;
  readonly extractedTimestamp: number;
  readonly snapshotMetadata: SnapshotMetadata;
  readonly contentStatistics: Map<string, number>;
  readonly validationCache: Map<string, boolean>;
}

// 🔧 멀티스텝 폼 스냅샷 - 완전한 상태 정보 (통합된 FormValues 사용)
export interface MultiStepFormSnapshotForBridge {
  readonly formCurrentStep: number;
  readonly formValues: BridgeFormValues; // 🔧 통합된 FormValues 사용
  readonly formProgressWidth: number;
  readonly formShowPreview: boolean;
  readonly formEditorCompletedContent: string;
  readonly formIsEditorCompleted: boolean;
  readonly snapshotTimestamp: number;
  readonly formMetadata: Map<string, unknown>;
  readonly stepValidationResults: Map<number, ValidationResult>;
  readonly navigationHistory: readonly number[];
}

// 🔧 에디터 → 멀티스텝 변환 결과
export interface EditorToMultiStepDataTransformationResult {
  readonly transformedContent: string;
  readonly transformedIsCompleted: boolean;
  readonly transformedMetadata: TransformationMetadata;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: readonly string[];
  readonly transformationStrategy: TransformationStrategyType;
  readonly transformationTimestamp: number;
  readonly qualityMetrics: Map<string, number>;
  readonly contentIntegrityHash: string;
}

// 🔧 멀티스텝 → 에디터 역변환 결과
export interface MultiStepToEditorDataTransformationResult {
  readonly editorContent: string;
  readonly editorIsCompleted: boolean;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: readonly string[];
  readonly transformedTimestamp: number;
  readonly contentMetadata: Map<string, unknown>;
  readonly reverseTransformationStrategy: TransformationStrategyType;
  readonly dataIntegrityValidation: boolean;
}

// 🔧 양방향 동기화 결과
export interface BidirectionalSyncResult {
  readonly editorToMultiStepSuccess: boolean;
  readonly multiStepToEditorSuccess: boolean;
  readonly overallSyncSuccess: boolean;
  readonly syncErrors: readonly string[];
  readonly syncDuration: number;
  readonly syncMetadata: Map<string, unknown>;
  readonly conflictResolutionLog: readonly string[];
  readonly syncStrategy:
    | 'FORCE_EDITOR'
    | 'FORCE_MULTISTEP'
    | 'MERGE'
    | 'CONFLICT_RESOLUTION';
}

// 🔧 브릿지 연산 실행 결과
export interface BridgeOperationExecutionResult {
  readonly operationSuccess: boolean;
  readonly operationErrors: readonly ErrorDetails[];
  readonly operationWarnings: readonly string[];
  readonly transferredData: EditorToMultiStepDataTransformationResult | null;
  readonly operationDuration: number;
  readonly executionMetadata: Map<string, unknown>;
  readonly performanceProfile: Map<string, number>;
  readonly resourceUsage: Map<string, number>;
}

// 🔧 타입 가드 헬퍼 인터페이스
export interface TypeGuardHelpers {
  readonly hasRequiredProperty: <T extends object, K extends keyof T>(
    targetObject: T,
    propertyKey: K,
    expectedType: string
  ) => boolean;
  readonly isValidContainer: (
    candidateContainer: unknown
  ) => candidateContainer is Container;
  readonly isValidParagraph: (
    candidateParagraph: unknown
  ) => candidateParagraph is ParagraphBlock;
  readonly isValidBridgeFormValues: (
    candidateFormValues: unknown
  ) => candidateFormValues is BridgeFormValues;
  readonly validateObjectStructure: (
    candidate: unknown,
    requiredKeys: readonly string[]
  ) => boolean;
  readonly safeTypeConversion: <T>(
    value: unknown,
    validator: (v: unknown) => v is T
  ) => T | null;
}

// 🔧 브릿지 캐시 관리자
export interface BridgeCacheManager {
  readonly validatedContainerIds: Set<string>;
  readonly validatedParagraphIds: Set<string>;
  readonly snapshotCache: Map<string, EditorStateSnapshotForBridge>;
  readonly transformationCache: Map<
    string,
    EditorToMultiStepDataTransformationResult
  >;
  readonly validationResultCache: Map<string, ValidationResult>;
  readonly performanceCache: Map<string, number>;
  readonly cacheExpirationTimes: Map<string, number>;
}

// 🔧 브릿지 실행 컨텍스트
export interface BridgeExecutionContext {
  readonly startTime: number;
  readonly operationId: string;
  readonly executionMetadata: Map<string, unknown>;
  readonly performanceMetrics: Map<string, number>;
  readonly executionPhase:
    | 'INITIALIZATION'
    | 'VALIDATION'
    | 'TRANSFORMATION'
    | 'UPDATE'
    | 'COMPLETION';
  readonly resourceLimits: Map<string, number>;
}

// 🔧 동기화 관리자 인터페이스
export interface SyncManager {
  readonly syncEditorToMultiStep: () => Promise<boolean>;
  readonly syncMultiStepToEditor: () => Promise<boolean>;
  readonly syncBidirectional: () => Promise<BidirectionalSyncResult>;
  readonly checkSyncPreconditions: () => {
    readonly canSyncToMultiStep: boolean;
    readonly canSyncToEditor: boolean;
    readonly conflictDetected: boolean;
    readonly recommendedAction:
      | 'SYNC_TO_MULTISTEP'
      | 'SYNC_TO_EDITOR'
      | 'RESOLVE_CONFLICTS'
      | 'ABORT';
  };
  readonly resolveSyncConflicts: (
    strategy: 'FORCE_EDITOR' | 'FORCE_MULTISTEP' | 'MERGE'
  ) => Promise<boolean>;
}

// 🔧 함수 타입 정의 - 완전한 타입 안전성 (통합된 FormValues 사용)
export type EditorStateExtractionFunction =
  () => EditorStateSnapshotForBridge | null;

export type MultiStepStateUpdateFunction = (
  transformationData: EditorToMultiStepDataTransformationResult
) => Promise<boolean>;

export type DataStructureTransformationFunction = (
  editorStateSnapshot: EditorStateSnapshotForBridge
) => EditorToMultiStepDataTransformationResult;

export type BridgeValidationFunction = (
  editorStateSnapshot: EditorStateSnapshotForBridge
) => ValidationResult;

export type BridgeErrorHandlingFunction = (
  errorSource: string | number | boolean | null | undefined | object
) => ErrorDetails;

export type MultiStepStateExtractionFunction =
  () => MultiStepFormSnapshotForBridge | null;

export type EditorStateUpdateFunction = (
  contentText: string,
  completionStatus: boolean
) => Promise<boolean>;

export type BidirectionalSyncFunction = () => Promise<BidirectionalSyncResult>;

export type ReverseTransferValidationFunction = (
  multiStepStateSnapshot: MultiStepFormSnapshotForBridge
) => ValidationResult;

export type MultiStepToEditorTransformationFunction = (
  multiStepStateSnapshot: MultiStepFormSnapshotForBridge
) => MultiStepToEditorDataTransformationResult;

export type BidirectionalValidationFunction = (
  editorStateSnapshot: EditorStateSnapshotForBridge,
  multiStepStateSnapshot: MultiStepFormSnapshotForBridge
) => ValidationResult;

// 🔧 타입 변환 유틸리티 함수 타입
export type SafeStringConverter = (value: unknown) => string;
export type SafeNumberConverter = (value: unknown) => number;
export type SafeBooleanConverter = (value: unknown) => boolean;

// 🔧 성능 모니터링 인터페이스
export interface PerformanceMonitor {
  readonly startTiming: (operationName: string) => string;
  readonly endTiming: (timingId: string) => number;
  readonly getAverageTime: (operationName: string) => number;
  readonly getPerformanceReport: () => Map<string, number>;
  readonly clearMetrics: () => void;
  readonly setPerformanceThreshold: (
    operationName: string,
    thresholdMs: number
  ) => void;
}

// 🔧 데이터 무결성 검증 인터페이스
export interface DataIntegrityValidator {
  readonly validateContentHash: (
    content: string,
    expectedHash: string
  ) => boolean;
  readonly generateContentHash: (content: string) => string;
  readonly validateStructuralIntegrity: (
    snapshot: EditorStateSnapshotForBridge
  ) => boolean;
  readonly detectDataCorruption: (
    before: EditorStateSnapshotForBridge,
    after: EditorStateSnapshotForBridge
  ) => readonly string[];
}

// 🔧 확장된 타입 가드 유틸리티
export interface ExtendedTypeGuards {
  readonly isValidSnapshot: (
    candidate: unknown
  ) => candidate is EditorStateSnapshotForBridge;
  readonly isValidTransformationResult: (
    candidate: unknown
  ) => candidate is EditorToMultiStepDataTransformationResult;
  readonly isValidConfiguration: (
    candidate: unknown
  ) => candidate is BridgeSystemConfiguration;
  readonly isValidErrorDetails: (
    candidate: unknown
  ) => candidate is ErrorDetails;
  readonly isValidValidationResult: (
    candidate: unknown
  ) => candidate is ValidationResult;
  readonly hasRequiredKeys: <T extends Record<string, unknown>>(
    obj: T,
    keys: readonly (keyof T)[]
  ) => boolean;
}

// 🔧 로깅 및 디버깅 인터페이스
export interface BridgeLogger {
  readonly logInfo: (message: string, data?: Map<string, unknown>) => void;
  readonly logWarning: (message: string, data?: Map<string, unknown>) => void;
  readonly logError: (message: string, error?: ErrorDetails) => void;
  readonly logPerformance: (operation: string, duration: number) => void;
  readonly enableDebugMode: () => void;
  readonly disableDebugMode: () => void;
  readonly getLogHistory: () => readonly string[];
  readonly clearLogs: () => void;
}

// 🔧 리소스 관리 인터페이스
export interface ResourceManager {
  readonly allocateMemory: (sizeBytes: number) => string;
  readonly deallocateMemory: (allocationId: string) => boolean;
  readonly getMemoryUsage: () => Map<string, number>;
  readonly setMemoryLimit: (limitBytes: number) => void;
  readonly cleanupUnusedResources: () => Promise<number>;
  readonly getResourceReport: () => {
    readonly memoryUsed: number;
    readonly memoryLimit: number;
    readonly activeAllocations: number;
    readonly cleanupRecommended: boolean;
  };
}

// 🔧 **Bridge 타입 가드 유틸리티 생성기**
export const createBridgeTypeGuards = () => {
  console.log('🔧 [BRIDGE_TYPES] Bridge 타입 가드 생성');

  const isValidBridgeFormValues = (
    candidate: unknown
  ): candidate is BridgeFormValues => {
    console.log('🔍 [BRIDGE_TYPES] BridgeFormValues 검증 시작');

    const isObjectType = candidate !== null && typeof candidate === 'object';
    if (!isObjectType) {
      console.log('❌ [BRIDGE_TYPES] 후보가 객체가 아님');
      return false;
    }

    // Bridge FormValues는 통합된 FormValues와 동일한 구조
    const requiredFields = [
      'nickname',
      'emailPrefix',
      'emailDomain',
      'title',
      'description',
      'content',
    ];

    const candidateObject = candidate;
    const hasAllRequiredFields = requiredFields.every((fieldName) => {
      const hasField = fieldName in candidateObject;
      return hasField;
    });

    if (!hasAllRequiredFields) {
      console.log('❌ [BRIDGE_TYPES] BridgeFormValues 필수 필드 누락');
      return false;
    }

    console.log('✅ [BRIDGE_TYPES] BridgeFormValues 검증 완료');
    return true;
  };

  const isValidEditorSnapshot = (
    candidate: unknown
  ): candidate is EditorStateSnapshotForBridge => {
    console.log('🔍 [BRIDGE_TYPES] EditorSnapshot 검증 시작');

    const isObjectType = candidate !== null && typeof candidate === 'object';
    if (!isObjectType) {
      console.log('❌ [BRIDGE_TYPES] 스냅샷이 객체가 아님');
      return false;
    }

    const snapshotCandidate = candidate;
    const requiredFields = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'editorIsCompleted',
      'extractedTimestamp',
    ];

    const hasAllRequiredFields = requiredFields.every((fieldName) => {
      const hasField = fieldName in snapshotCandidate;
      return hasField;
    });

    if (!hasAllRequiredFields) {
      console.log('❌ [BRIDGE_TYPES] EditorSnapshot 필수 필드 누락');
      return false;
    }

    // 필드 타입 검증
    const editorContainers = Reflect.get(snapshotCandidate, 'editorContainers');
    const editorParagraphs = Reflect.get(snapshotCandidate, 'editorParagraphs');
    const editorCompletedContent = Reflect.get(
      snapshotCandidate,
      'editorCompletedContent'
    );
    const editorIsCompleted = Reflect.get(
      snapshotCandidate,
      'editorIsCompleted'
    );
    const extractedTimestamp = Reflect.get(
      snapshotCandidate,
      'extractedTimestamp'
    );

    const hasValidTypes =
      Array.isArray(editorContainers) &&
      Array.isArray(editorParagraphs) &&
      typeof editorCompletedContent === 'string' &&
      typeof editorIsCompleted === 'boolean' &&
      typeof extractedTimestamp === 'number';

    if (!hasValidTypes) {
      console.log('❌ [BRIDGE_TYPES] EditorSnapshot 타입 불일치');
      return false;
    }

    console.log('✅ [BRIDGE_TYPES] EditorSnapshot 검증 완료');
    return true;
  };

  const isValidMultiStepSnapshot = (
    candidate: unknown
  ): candidate is MultiStepFormSnapshotForBridge => {
    console.log('🔍 [BRIDGE_TYPES] MultiStepSnapshot 검증 시작');

    const isObjectType = candidate !== null && typeof candidate === 'object';
    if (!isObjectType) {
      console.log('❌ [BRIDGE_TYPES] 스냅샷이 객체가 아님');
      return false;
    }

    const snapshotCandidate = candidate;
    const requiredFields = [
      'formCurrentStep',
      'formValues',
      'snapshotTimestamp',
    ];

    const hasAllRequiredFields = requiredFields.every((fieldName) => {
      const hasField = fieldName in snapshotCandidate;
      return hasField;
    });

    if (!hasAllRequiredFields) {
      console.log('❌ [BRIDGE_TYPES] MultiStepSnapshot 필수 필드 누락');
      return false;
    }

    // FormValues 검증
    const formValues = Reflect.get(snapshotCandidate, 'formValues');
    const formValuesIsValid = isValidBridgeFormValues(formValues);

    if (!formValuesIsValid) {
      console.log('❌ [BRIDGE_TYPES] MultiStepSnapshot의 FormValues 무효');
      return false;
    }

    console.log('✅ [BRIDGE_TYPES] MultiStepSnapshot 검증 완료');
    return true;
  };

  const isValidTransformationResult = (
    candidate: unknown
  ): candidate is EditorToMultiStepDataTransformationResult => {
    console.log('🔍 [BRIDGE_TYPES] TransformationResult 검증 시작');

    const isObjectType = candidate !== null && typeof candidate === 'object';
    if (!isObjectType) {
      console.log('❌ [BRIDGE_TYPES] 변환 결과가 객체가 아님');
      return false;
    }

    const resultCandidate = candidate;
    const requiredFields = [
      'transformedContent',
      'transformedIsCompleted',
      'transformationSuccess',
    ];

    const hasAllRequiredFields = requiredFields.every((fieldName) => {
      const hasField = fieldName in resultCandidate;
      return hasField;
    });

    if (!hasAllRequiredFields) {
      console.log('❌ [BRIDGE_TYPES] TransformationResult 필수 필드 누락');
      return false;
    }

    console.log('✅ [BRIDGE_TYPES] TransformationResult 검증 완료');
    return true;
  };

  console.log('✅ [BRIDGE_TYPES] Bridge 타입 가드 생성 완료');

  return {
    isValidBridgeFormValues,
    isValidEditorSnapshot,
    isValidMultiStepSnapshot,
    isValidTransformationResult,
  };
};

// 🔧 **Bridge 타입 변환 유틸리티 생성기**
export const createBridgeTypeConverters = () => {
  console.log('🔧 [BRIDGE_TYPES] Bridge 타입 변환기 생성');

  const convertToBridgeFormValues = (
    rawFormValues: unknown
  ): BridgeFormValues | null => {
    console.log('🔄 [BRIDGE_TYPES] BridgeFormValues 변환 시작');

    const typeGuards = createBridgeTypeGuards();
    const { isValidBridgeFormValues } = typeGuards;

    const isValid = isValidBridgeFormValues(rawFormValues);
    if (!isValid) {
      console.log('❌ [BRIDGE_TYPES] 유효하지 않은 FormValues');
      return null;
    }

    // 타입 가드를 통과했으므로 안전하게 변환
    const validFormValues = rawFormValues;

    console.log('✅ [BRIDGE_TYPES] BridgeFormValues 변환 완료');
    return validFormValues;
  };

  const createDefaultBridgeFormValues = (): BridgeFormValues => {
    console.log('🔧 [BRIDGE_TYPES] 기본 BridgeFormValues 생성');

    const defaultBridgeFormValues: BridgeFormValues = {
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
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };

    console.log('✅ [BRIDGE_TYPES] 기본 BridgeFormValues 생성 완료');
    return defaultBridgeFormValues;
  };

  const mergeBridgeFormValues = (
    baseBridgeFormValues: BridgeFormValues,
    updateBridgeFormValues: Partial<BridgeFormValues>
  ): BridgeFormValues => {
    console.log('🔄 [BRIDGE_TYPES] BridgeFormValues 병합 시작');

    // 구조분해할당으로 안전한 병합
    const mergedFormValues: BridgeFormValues = {
      ...baseBridgeFormValues,
      ...updateBridgeFormValues,
    };

    console.log('✅ [BRIDGE_TYPES] BridgeFormValues 병합 완료');
    return mergedFormValues;
  };

  console.log('✅ [BRIDGE_TYPES] Bridge 타입 변환기 생성 완료');

  return {
    convertToBridgeFormValues,
    createDefaultBridgeFormValues,
    mergeBridgeFormValues,
  };
};

// 🔧 기본 내보내기 - 호환성을 위한 별칭 (통합된 타입 사용)
export type BridgeDataValidationResult = ValidationResult;
export type BridgeOperationErrorDetails = ErrorDetails;
export type BridgeSystemConfig = BridgeSystemConfiguration;
export type EditorContentMetadataForBridge = TransformationMetadata;
export type SimplifiedMultiStepSnapshot = MultiStepFormSnapshotForBridge;
export type ReverseTransformationResult =
  MultiStepToEditorDataTransformationResult;
export type ReverseTransferValidationResult = ValidationResult;

// 🔧 디버깅 및 개발용 타입 유틸리티
export interface DevelopmentUtilities {
  readonly createMockSnapshot: (
    containerCount?: number,
    paragraphCount?: number
  ) => EditorStateSnapshotForBridge;
  readonly createMockConfiguration: (
    overrides?: Partial<BridgeSystemConfiguration>
  ) => BridgeSystemConfiguration;
  readonly validateAllInterfaces: () => Map<string, boolean>;
  readonly generateTypeReport: () => string;
  readonly createPerformanceTestData: (size: 'SMALL' | 'MEDIUM' | 'LARGE') => {
    readonly containers: readonly Container[];
    readonly paragraphs: readonly ParagraphBlock[];
    readonly expectedTransformTime: number;
  };
}

console.log('🏗️ [MODERN_BRIDGE_TYPES] 모든 브릿지 타입 정의 완료');
console.log('📊 [MODERN_BRIDGE_TYPES] 인터페이스 개수:', {
  coreInterfaces: 17,
  utilityTypes: 12,
  functionTypes: 11,
  helperInterfaces: 8,
  bridgeAliases: 4, // 🔧 새로 추가된 Bridge 별칭들
});
console.log('✅ [MODERN_BRIDGE_TYPES] 타입 안전성 및 성능 최적화 완료');
console.log('🔧 [MODERN_BRIDGE_TYPES] 통합된 FormValues 타입 사용');
console.log('🎯 [MODERN_BRIDGE_TYPES] Bridge 호환성 별칭 추가 완료');
