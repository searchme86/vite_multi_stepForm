// bridges/editorMultiStepBridge/bridgeTypes.ts

import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 에디터 상태 스냅샷
export interface EditorStateSnapshotForBridge {
  readonly editorContainers: Container[];
  readonly editorParagraphs: ParagraphBlock[];
  readonly editorCompletedContent: string;
  readonly editorIsCompleted: boolean;
  readonly editorActiveParagraphId: string | null;
  readonly editorSelectedParagraphIds: string[];
  readonly editorIsPreviewOpen: boolean;
  readonly extractedTimestamp: number;
}

// 멀티스텝 폼 스냅샷
export interface MultiStepFormSnapshotForBridge {
  readonly formCurrentStep: number;
  readonly formValues: FormValues;
  readonly formProgressWidth: number;
  readonly formShowPreview: boolean;
  readonly formEditorCompletedContent: string;
  readonly formIsEditorCompleted: boolean;
  readonly snapshotTimestamp: number;
}

// 에디터 → 멀티스텝 변환 결과
export interface EditorToMultiStepDataTransformationResult {
  readonly transformedContent: string;
  readonly transformedIsCompleted: boolean;
  readonly transformedMetadata: EditorContentMetadataForBridge;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: string[];
}

// 에디터 콘텐츠 메타데이터
export interface EditorContentMetadataForBridge {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly lastModified: Date;
}

// 브릿지 검증 결과
export interface BridgeDataValidationResult {
  readonly isValidForTransfer: boolean;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly hasMinimumContent: boolean;
  readonly hasRequiredStructure: boolean;
}

// 브릿지 오류 상세 정보
export interface BridgeOperationErrorDetails {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly errorTimestamp: Date;
  readonly errorContext: Record<string, unknown>;
  readonly isRecoverable: boolean;
}

// 브릿지 작업 실행 결과
export interface BridgeOperationExecutionResult {
  readonly operationSuccess: boolean;
  readonly operationErrors: BridgeOperationErrorDetails[];
  readonly operationWarnings: string[];
  readonly transferredData: EditorToMultiStepDataTransformationResult | null;
  readonly operationDuration: number;
}

// 브릿지 시스템 설정
export interface BridgeSystemConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly validationMode: 'strict' | 'lenient';
  readonly debugMode: boolean;
}

// 함수 타입 정의
export type EditorStateExtractionFunction =
  () => EditorStateSnapshotForBridge | null;

export type MultiStepStateUpdateFunction = (
  data: EditorToMultiStepDataTransformationResult
) => Promise<boolean>;

export type DataStructureTransformationFunction = (
  editorState: EditorStateSnapshotForBridge
) => EditorToMultiStepDataTransformationResult;

export type BridgeValidationFunction = (
  editorState: EditorStateSnapshotForBridge
) => BridgeDataValidationResult;

export type BridgeErrorHandlingFunction = (
  error: unknown
) => BridgeOperationErrorDetails;
