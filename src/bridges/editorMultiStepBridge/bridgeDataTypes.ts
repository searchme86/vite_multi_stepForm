// bridges/editorMultiStepBridge/bridgeDataTypes.ts

import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 🔧 Map 기반 스냅샷 메타데이터 타입 정의 - Object가 아닌 Map으로 통일
export interface SnapshotMetadata {
  readonly extractionTimestamp: number;
  readonly processingDurationMs: number;
  readonly validationStatus: boolean;
  readonly dataIntegrity: boolean;
  readonly sourceInfo: {
    readonly coreStoreVersion: string;
    readonly uiStoreVersion: string;
  };
}

// 🔧 에러 컨텍스트용 구체적 타입 정의 - Map 활용으로 성능 최적화
export interface BridgeErrorContext {
  readonly context: string;
  readonly originalError: string | number | boolean | null | undefined | object;
  readonly timestamp: number;
  readonly additionalData: Map<string, string | number | boolean | null>;
  readonly errorMetadata: Map<string, unknown>;
}

// 🔧 변환 메타데이터용 구체적 타입 정의
export interface TransformationMetadata {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly lastModified: Date;
  readonly processingTimeMs: number;
  readonly validationWarnings: Set<string>;
}

// 🔧 검증 결과용 구체적 타입 정의
export interface ValidationResult {
  readonly isValidForTransfer: boolean;
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
  readonly hasMinimumContent: boolean;
  readonly hasRequiredStructure: boolean;
  readonly errorDetails: Map<string, string>;
}

// 🔧 에러 상세 정보용 구체적 타입 정의
export interface ErrorDetails {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly errorTimestamp: Date;
  readonly errorContext: BridgeErrorContext;
  readonly isRecoverable: boolean;
  readonly errorSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 🔧 실행 결과용 구체적 타입 정의
export interface ExecutionResult {
  readonly operationSuccess: boolean;
  readonly operationErrors: readonly ErrorDetails[];
  readonly operationWarnings: readonly string[];
  readonly transferredData: EditorToMultiStepDataTransformationResult | null;
  readonly operationDuration: number;
  readonly executionMetadata: Map<string, unknown>;
}

// 🔧 시스템 설정용 구체적 타입 정의
export interface SystemConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
  readonly maxRetryAttempts: number;
  readonly timeoutMs: number;
}

// 🔧 역방향 변환 결과용 구체적 타입 정의
export interface ReverseTransformationResult {
  readonly editorContent: string;
  readonly editorIsCompleted: boolean;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: readonly string[];
  readonly transformedTimestamp: number;
  readonly contentMetadata: Map<string, unknown>;
}

// 🔧 양방향 동기화 결과용 구체적 타입 정의
export interface BidirectionalResult {
  readonly editorToMultiStepSuccess: boolean;
  readonly multiStepToEditorSuccess: boolean;
  readonly overallSuccess: boolean;
  readonly syncErrors: readonly string[];
  readonly syncDuration: number;
  readonly syncMetadata: Map<string, unknown>;
}

// 🔧 간단한 멀티스텝 스냅샷용 구체적 타입 정의
export interface SimpleSnapshot {
  readonly formValues: FormValues;
  readonly formCurrentStep: number;
  readonly snapshotTimestamp: number;
  readonly validationStatus: Map<string, boolean>;
}

// 🔧 역방향 검증 결과용 구체적 타입 정의
export interface ReverseValidationResult {
  readonly isValidForReverseTransfer: boolean;
  readonly reverseValidationErrors: readonly string[];
  readonly reverseValidationWarnings: readonly string[];
  readonly hasValidMultiStepData: boolean;
  readonly canUpdateEditor: boolean;
  readonly validationMetadata: Map<string, unknown>;
}

// 🔧 양방향 검증 결과용 구체적 타입 정의
export interface BidirectionalValidationResult {
  readonly forwardTransferValid: boolean;
  readonly reverseTransferValid: boolean;
  readonly bidirectionalSyncReady: boolean;
  readonly validationSummary: {
    readonly totalErrors: number;
    readonly totalWarnings: number;
    readonly criticalIssues: readonly string[];
  };
  readonly validationDetails: Map<string, ValidationResult>;
}

// 🔧 에디터 상태 스냅샷 - 구조분해할당을 위한 명확한 인터페이스 (SnapshotMetadata 객체 유지)
export interface EditorStateSnapshotForBridge {
  readonly editorContainers: readonly Container[];
  readonly editorParagraphs: readonly ParagraphBlock[];
  readonly editorCompletedContent: string;
  readonly editorIsCompleted: boolean;
  readonly editorActiveParagraphId: string | null;
  readonly editorSelectedParagraphIds: readonly string[];
  readonly editorIsPreviewOpen: boolean;
  readonly extractedTimestamp: number;
  readonly snapshotMetadata: SnapshotMetadata; // 🎯 SnapshotMetadata 객체 타입 유지
}

// 🔧 멀티스텝 폼 스냅샷 - 구조분해할당을 위한 명확한 인터페이스
export interface MultiStepFormSnapshotForBridge {
  readonly formCurrentStep: number;
  readonly formValues: FormValues;
  readonly formProgressWidth: number;
  readonly formShowPreview: boolean;
  readonly formEditorCompletedContent: string;
  readonly formIsEditorCompleted: boolean;
  readonly snapshotTimestamp: number;
  readonly formMetadata: Map<string, unknown>;
}

// 🔧 에디터 → 멀티스텝 변환 결과
export interface EditorToMultiStepDataTransformationResult {
  readonly transformedContent: string;
  readonly transformedIsCompleted: boolean;
  readonly transformedMetadata: TransformationMetadata;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: readonly string[];
  readonly transformationStrategy:
    | 'EXISTING_CONTENT'
    | 'REBUILD_FROM_CONTAINERS'
    | 'PARAGRAPH_FALLBACK';
}

// 🔧 기존 타입들을 새로운 구체적 타입으로 재정의
export type EditorContentMetadataForBridge = TransformationMetadata;
export type BridgeDataValidationResult = ValidationResult;
export type BridgeOperationErrorDetails = ErrorDetails;
export type BridgeOperationExecutionResult = ExecutionResult;
export type BridgeSystemConfiguration = SystemConfiguration;
export type MultiStepToEditorDataTransformationResult =
  ReverseTransformationResult;
export type BidirectionalSyncResult = BidirectionalResult;
export type SimplifiedMultiStepSnapshot = SimpleSnapshot;
export type ReverseTransferValidationResult = ReverseValidationResult;

// 🔧 함수 타입들을 구체적으로 정의 - unknown 타입 완전 제거
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

export type MultiStepStateExtractionFunction = () => SimpleSnapshot | null;

export type EditorStateUpdateFunction = (
  contentText: string,
  completionStatus: boolean
) => Promise<boolean>;

export type BidirectionalSyncFunction = () => Promise<BidirectionalResult>;

export type ReverseTransferValidationFunction = (
  multiStepStateSnapshot: SimpleSnapshot
) => ReverseValidationResult;

export type MultiStepToEditorTransformationFunction = (
  multiStepStateSnapshot: SimpleSnapshot
) => ReverseTransformationResult;

export type BidirectionalValidationFunction = (
  editorStateSnapshot: EditorStateSnapshotForBridge,
  multiStepStateSnapshot: SimpleSnapshot
) => BidirectionalValidationResult;

// 🔧 타입 가드 함수들을 위한 헬퍼 타입 정의
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
  readonly isValidFormValues: (
    candidateFormValues: unknown
  ) => candidateFormValues is FormValues;
}

// 🔧 성능 최적화를 위한 캐시 타입 정의
export interface BridgeCacheManager {
  readonly validatedContainerIds: Set<string>;
  readonly validatedParagraphIds: Set<string>;
  readonly snapshotCache: Map<string, EditorStateSnapshotForBridge>;
  readonly transformationCache: Map<
    string,
    EditorToMultiStepDataTransformationResult
  >;
}

// 🔧 브릿지 실행 컨텍스트 인터페이스
export interface BridgeExecutionContext {
  readonly startTime: number;
  readonly operationId: string;
  readonly executionMetadata: Map<string, unknown>;
  readonly performanceMetrics: Map<string, number>;
}

// 🔧 브릿지 오케스트레이터 인터페이스
export interface BridgeOrchestrator {
  readonly executeBridgeTransfer: () => Promise<BridgeOperationExecutionResult>;
  readonly checkTransferPreconditions: () => boolean;
  readonly getConfiguration: () => BridgeSystemConfiguration;
  readonly validateState: () => boolean;
}

// 🔧 동기화 매니저 인터페이스
export interface SyncManager {
  readonly syncEditorToMultiStep: () => Promise<boolean>;
  readonly syncMultiStepToEditor: () => Promise<boolean>;
  readonly syncBidirectional: () => Promise<BidirectionalSyncResult>;
  readonly checkSyncPreconditions: () => {
    readonly canSyncToMultiStep: boolean;
    readonly canSyncToEditor: boolean;
  };
}
