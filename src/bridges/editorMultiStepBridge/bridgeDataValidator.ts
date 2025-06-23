// bridges/editorMultiStepBridge/bridgeValidator.ts

import {
  EditorStateSnapshotForBridge,
  BridgeDataValidationResult,
} from './bridgeDataTypes';
import { VALIDATION_CRITERIA } from './bridgeConfiguration';

export const createBridgeDataValidationHandler = () => {
  const validateBasicStructure = (
    snapshot: EditorStateSnapshotForBridge
  ): boolean => {
    if (!snapshot || typeof snapshot !== 'object') {
      return false;
    }

    const { editorContainers, editorParagraphs } = snapshot;

    const hasContainers = Array.isArray(editorContainers);
    const hasParagraphs = Array.isArray(editorParagraphs);

    return hasContainers && hasParagraphs;
  };

  const validateMinimumRequirements = (
    snapshot: EditorStateSnapshotForBridge
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const { editorContainers, editorParagraphs } = snapshot;

    if (editorContainers.length < VALIDATION_CRITERIA.minContainers) {
      errors.push(
        `최소 ${VALIDATION_CRITERIA.minContainers}개의 컨테이너가 필요합니다`
      );
    }

    if (editorParagraphs.length < VALIDATION_CRITERIA.minParagraphs) {
      errors.push(
        `최소 ${VALIDATION_CRITERIA.minParagraphs}개의 단락이 필요합니다`
      );
    }

    const totalContentLength = editorParagraphs.reduce(
      (total, paragraph) => total + (paragraph?.content?.length || 0),
      0
    );

    if (totalContentLength < VALIDATION_CRITERIA.minContentLength) {
      errors.push(
        `최소 ${VALIDATION_CRITERIA.minContentLength}자의 내용이 필요합니다`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateForTransfer = (
    snapshot: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult => {
    console.log('🔍 [VALIDATOR] 전송 검증 시작');

    if (!validateBasicStructure(snapshot)) {
      return {
        isValidForTransfer: false,
        validationErrors: ['기본 구조 검증 실패'],
        validationWarnings: [],
        hasMinimumContent: false,
        hasRequiredStructure: false,
      };
    }

    const { isValid, errors } = validateMinimumRequirements(snapshot);
    const { editorContainers, editorParagraphs } = snapshot;

    const assignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId !== null
    );
    const hasAssignedContent = assignedParagraphs.length > 0;
    const hasValidContainers = editorContainers.length > 0;

    const warnings: string[] = [];
    if (assignedParagraphs.length < editorParagraphs.length) {
      warnings.push('일부 단락이 컨테이너에 할당되지 않았습니다');
    }

    return {
      isValidForTransfer: isValid && hasAssignedContent && hasValidContainers,
      validationErrors: errors,
      validationWarnings: warnings,
      hasMinimumContent: isValid,
      hasRequiredStructure: hasValidContainers,
    };
  };

  return {
    validateBasicStructure,
    validateMinimumRequirements,
    validateForTransfer,
  };
};
