// bridges/editorMultiStepBridge/bridgeValidator.ts

import {
  EditorStateSnapshotForBridge,
  BridgeDataValidationResult,
} from './bridgeTypes';
import { VALIDATION_CRITERIA } from './bridgeConfig';

export const createBridgeDataValidationHandler = () => {
  // 실제 작업 완료 상태를 동적으로 판단하는 함수 - 핵심 수정
  const checkWorkCompletion = (
    snapshot: EditorStateSnapshotForBridge
  ): boolean => {
    const {
      editorContainers = [],
      editorParagraphs = [],
      editorIsCompleted = false,
    } = snapshot;

    // 1. 명시적 완료 플래그가 true면 완료
    if (editorIsCompleted === true) {
      return true;
    }

    // 2. 기본 데이터 존재 여부 확인
    const hasContainers =
      editorContainers.length >= VALIDATION_CRITERIA.minContainers;
    const hasParagraphs =
      editorParagraphs.length >= VALIDATION_CRITERIA.minParagraphs;

    if (!hasContainers || !hasParagraphs) {
      return false;
    }

    // 3. 할당된 문단 확인
    const assignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId !== null
    );
    const assignmentRatio = assignedParagraphs.length / editorParagraphs.length;

    // 4. 콘텐츠 길이 확인
    const totalContentLength = editorParagraphs.reduce(
      (total, p) => total + (p?.content?.length || 0),
      0
    );

    // 5. 완료 점수 계산 (동적)
    let score = 0;
    if (hasContainers) score += 30;
    if (hasParagraphs) score += 30;
    if (assignmentRatio >= VALIDATION_CRITERIA.minAssignmentRatio) score += 25;
    if (totalContentLength >= VALIDATION_CRITERIA.minContentLength) score += 15;

    const isCompleted = score >= VALIDATION_CRITERIA.completionScoreThreshold;

    console.log('📊 [VALIDATOR] 작업 완료 판단:', {
      explicitFlag: editorIsCompleted,
      score: `${score}/${VALIDATION_CRITERIA.completionScoreThreshold}`,
      assignmentRatio: `${(assignmentRatio * 100).toFixed(1)}%`,
      isCompleted,
    });

    return isCompleted;
  };

  const checkMinimumContent = (
    snapshot: EditorStateSnapshotForBridge
  ): boolean => {
    const {
      editorContainers = [],
      editorParagraphs = [],
      editorCompletedContent = '',
    } = snapshot;

    const hasContainers =
      editorContainers.length >= VALIDATION_CRITERIA.minContainers;
    const hasParagraphs =
      editorParagraphs.length >= VALIDATION_CRITERIA.minParagraphs;
    const hasContent = editorCompletedContent.trim().length > 0;

    return hasContainers && hasParagraphs && hasContent;
  };

  const checkStructure = (snapshot: EditorStateSnapshotForBridge): boolean => {
    const { editorContainers = [], editorParagraphs = [] } = snapshot;

    // 컨테이너 구조 검증
    const validContainers = editorContainers.every(
      (container) =>
        container?.id &&
        typeof container.id === 'string' &&
        typeof container.name === 'string' &&
        typeof container.order === 'number'
    );

    // 문단 구조 검증
    const validParagraphs = editorParagraphs.every(
      (paragraph) =>
        paragraph?.id &&
        typeof paragraph.id === 'string' &&
        typeof paragraph.content === 'string'
    );

    // 할당된 문단 존재 여부
    const hasAssignedParagraphs = editorParagraphs.some(
      (p) => p.containerId !== null
    );

    // 작업 완료 상태 (핵심 수정)
    const workCompleted = checkWorkCompletion(snapshot);

    return (
      validContainers &&
      validParagraphs &&
      hasAssignedParagraphs &&
      workCompleted
    );
  };

  const collectErrors = (snapshot: EditorStateSnapshotForBridge): string[] => {
    const errors: string[] = [];

    if (!snapshot) {
      errors.push('데이터가 없습니다');
      return errors;
    }

    const {
      editorContainers = [],
      editorParagraphs = [],
      editorCompletedContent = '',
      extractedTimestamp = 0,
    } = snapshot;

    if (editorContainers.length === 0) {
      errors.push('컨테이너가 없습니다');
    }

    if (editorParagraphs.length === 0) {
      errors.push('문단이 없습니다');
    }

    if (editorCompletedContent.trim().length === 0) {
      errors.push('완성된 콘텐츠가 없습니다');
    }

    if (!checkWorkCompletion(snapshot)) {
      errors.push('작업이 완료되지 않았습니다');
    }

    if (extractedTimestamp <= 0) {
      errors.push('데이터가 유효하지 않습니다');
    }

    const assignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId !== null
    );
    if (assignedParagraphs.length === 0) {
      errors.push('할당된 문단이 없습니다');
    }

    return errors;
  };

  const collectWarnings = (
    snapshot: EditorStateSnapshotForBridge
  ): string[] => {
    const warnings: string[] = [];

    if (!snapshot) return warnings;

    const {
      editorContainers = [],
      editorParagraphs = [],
      editorCompletedContent = '',
    } = snapshot;

    if (editorContainers.length < 2) {
      warnings.push('컨테이너가 2개 미만입니다');
    }

    if (editorParagraphs.length < 3) {
      warnings.push('문단이 3개 미만입니다');
    }

    if (editorCompletedContent.length < 100) {
      warnings.push('콘텐츠가 짧습니다 (100자 미만)');
    }

    const unassignedParagraphs = editorParagraphs.filter(
      (p) => p.containerId === null
    );
    if (unassignedParagraphs.length > 0) {
      warnings.push(`미할당 문단이 ${unassignedParagraphs.length}개 있습니다`);
    }

    return warnings;
  };

  const validateForTransfer = (
    snapshot: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult => {
    console.log('🔍 [VALIDATOR] 전송 검증 시작');

    const hasMinContent = checkMinimumContent(snapshot);
    const hasValidStructure = checkStructure(snapshot);
    const errors = collectErrors(snapshot);
    const warnings = collectWarnings(snapshot);

    const isValid = hasMinContent && hasValidStructure && errors.length === 0;

    console.log('✅ [VALIDATOR] 검증 완료:', {
      isValid,
      errors: errors.length,
      warnings: warnings.length,
    });

    return {
      isValidForTransfer: isValid,
      validationErrors: errors,
      validationWarnings: warnings,
      hasMinimumContent: hasMinContent,
      hasRequiredStructure: hasValidStructure,
    };
  };

  return {
    checkWorkCompletion,
    checkMinimumContent,
    checkStructure,
    collectErrors,
    collectWarnings,
    validateForTransfer,
  };
};
