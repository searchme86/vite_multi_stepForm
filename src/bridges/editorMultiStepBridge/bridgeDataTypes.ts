// bridges/editorMultiStepBridge/bridgeDataTypes.ts

import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

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

export interface MultiStepFormSnapshotForBridge {
  readonly formCurrentStep: number;
  readonly formValues: FormValues;
  readonly formProgressWidth: number;
  readonly formShowPreview: boolean;
  readonly formEditorCompletedContent: string;
  readonly formIsEditorCompleted: boolean;
  readonly snapshotTimestamp: number;
}

export interface EditorToMultiStepDataTransformationResult {
  readonly transformedContent: string;
  readonly transformedIsCompleted: boolean;
  readonly transformedMetadata: EditorContentMetadataForBridge;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: string[];
}

export interface EditorContentMetadataForBridge {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly lastModified: Date;
}

export interface BridgeDataValidationResult {
  readonly isValidForTransfer: boolean;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly hasMinimumContent: boolean;
  readonly hasRequiredStructure: boolean;
}

export interface BridgeOperationErrorDetails {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly errorTimestamp: Date;
  readonly errorContext: Record<string, unknown>;
  readonly isRecoverable: boolean;
}

export interface BridgeOperationExecutionResult {
  readonly operationSuccess: boolean;
  readonly operationErrors: BridgeOperationErrorDetails[];
  readonly operationWarnings: string[];
  readonly transferredData: EditorToMultiStepDataTransformationResult | null;
  readonly operationDuration: number;
}

export interface BridgeSystemConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
}

export interface MultiStepToEditorDataTransformationResult {
  readonly editorContent: string;
  readonly editorIsCompleted: boolean;
  readonly transformationSuccess: boolean;
  readonly transformationErrors: string[];
  readonly transformedTimestamp: number;
}

export interface BidirectionalSyncResult {
  readonly editorToMultiStepSuccess: boolean;
  readonly multiStepToEditorSuccess: boolean;
  readonly overallSuccess: boolean;
  readonly syncErrors: string[];
  readonly syncDuration: number;
}

export interface SimplifiedMultiStepSnapshot {
  readonly formValues: FormValues;
  readonly formCurrentStep: number;
  readonly snapshotTimestamp: number;
}

export interface ReverseTransferValidationResult {
  readonly isValidForReverseTransfer: boolean;
  readonly reverseValidationErrors: string[];
  readonly reverseValidationWarnings: string[];
  readonly hasValidMultiStepData: boolean;
  readonly canUpdateEditor: boolean;
}

export interface BidirectionalValidationResult {
  readonly forwardTransferValid: boolean;
  readonly reverseTransferValid: boolean;
  readonly bidirectionalSyncReady: boolean;
  readonly validationSummary: {
    readonly totalErrors: number;
    readonly totalWarnings: number;
    readonly criticalIssues: string[];
  };
}

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

export type MultiStepStateExtractionFunction =
  () => SimplifiedMultiStepSnapshot | null;

export type EditorStateUpdateFunction = (
  content: string,
  isCompleted: boolean
) => Promise<boolean>;

export type BidirectionalSyncFunction = () => Promise<BidirectionalSyncResult>;

export type ReverseTransferValidationFunction = (
  multiStepState: SimplifiedMultiStepSnapshot
) => ReverseTransferValidationResult;

export type MultiStepToEditorTransformationFunction = (
  multiStepState: SimplifiedMultiStepSnapshot
) => MultiStepToEditorDataTransformationResult;

export type BidirectionalValidationFunction = (
  editorState: EditorStateSnapshotForBridge,
  multiStepState: SimplifiedMultiStepSnapshot
) => BidirectionalValidationResult;
