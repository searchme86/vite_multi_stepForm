// bridges/editorMultiStepBridge/bridgeDataValidator.ts

import {
  EditorStateSnapshotForBridge,
  BridgeDataValidationResult,
} from './bridgeDataTypes';
import { VALIDATION_CRITERIA } from './bridgeConfiguration';

export const createBridgeDataValidationHandler = () => {
  // 🔧 관대한 기본 구조 검증 - 빈 데이터도 허용
  const validateBasicStructure = (
    snapshot: EditorStateSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 기본 구조 검증 시작');

    if (!snapshot || typeof snapshot !== 'object') {
      console.error('❌ [VALIDATOR] 스냅샷이 null이거나 객체가 아님');
      return false;
    }

    const { editorContainers, editorParagraphs } = snapshot;

    // 🔧 배열 타입만 확인, 빈 배열도 유효함
    const hasContainers = Array.isArray(editorContainers);
    const hasParagraphs = Array.isArray(editorParagraphs);

    const isValid = hasContainers && hasParagraphs;

    console.log('📊 [VALIDATOR] 기본 구조 검증 결과:', {
      hasContainers,
      hasParagraphs,
      isValid,
      containerCount: editorContainers?.length || 0,
      paragraphCount: editorParagraphs?.length || 0,
    });

    return isValid;
  };

  // 🔧 최소 요구사항 검증 - 더 관대한 기준 적용
  const validateMinimumRequirements = (
    snapshot: EditorStateSnapshotForBridge
  ): { isValid: boolean; errors: string[]; warnings: string[] } => {
    console.log('🔍 [VALIDATOR] 최소 요구사항 검증 시작');

    const errors: string[] = [];
    const warnings: string[] = [];
    const { editorContainers, editorParagraphs } = snapshot;

    // 🔧 기본 타입 검증
    if (!Array.isArray(editorContainers)) {
      errors.push('컨테이너가 유효한 배열이 아닙니다');
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(editorParagraphs)) {
      errors.push('문단이 유효한 배열이 아닙니다');
      return { isValid: false, errors, warnings };
    }

    // 🔧 컨테이너 요구사항 - 관대한 검증
    const containerCount = editorContainers.length;
    if (containerCount < VALIDATION_CRITERIA.minContainers) {
      // 🔧 에러 대신 경고로 변경
      warnings.push(
        `권장: 최소 ${VALIDATION_CRITERIA.minContainers}개의 컨테이너 (현재: ${containerCount}개)`
      );
    }

    // 🔧 문단 요구사항 - 관대한 검증
    const paragraphCount = editorParagraphs.length;
    if (paragraphCount < VALIDATION_CRITERIA.minParagraphs) {
      // 🔧 에러 대신 경고로 변경
      warnings.push(
        `권장: 최소 ${VALIDATION_CRITERIA.minParagraphs}개의 문단 (현재: ${paragraphCount}개)`
      );
    }

    // 🔧 콘텐츠 길이 요구사항 - 더 관대한 검증
    const totalContentLength = editorParagraphs.reduce((total, paragraph) => {
      if (!paragraph || typeof paragraph.content !== 'string') {
        return total;
      }
      return total + paragraph.content.length;
    }, 0);

    if (totalContentLength < VALIDATION_CRITERIA.minContentLength) {
      // 🔧 완전히 빈 콘텐츠일 때만 에러, 아니면 경고
      if (totalContentLength === 0) {
        warnings.push('콘텐츠가 비어있습니다');
      } else {
        warnings.push(
          `권장: 최소 ${VALIDATION_CRITERIA.minContentLength}자의 내용 (현재: ${totalContentLength}자)`
        );
      }
    }

    // 🔧 할당된 문단 검증 - 경고만 표시
    const assignedParagraphs = editorParagraphs.filter(
      (paragraph) => paragraph && paragraph.containerId !== null
    );

    if (assignedParagraphs.length === 0 && paragraphCount > 0) {
      warnings.push('문단이 컨테이너에 할당되지 않았습니다');
    }

    // 🔧 빈 컨테이너 검증 - 경고만 표시
    const emptyContainers = editorContainers.filter((container) => {
      if (!container || !container.id) return false;
      const containerParagraphs = editorParagraphs.filter(
        (p) => p && p.containerId === container.id
      );
      return containerParagraphs.length === 0;
    });

    if (emptyContainers.length > 0) {
      warnings.push(`${emptyContainers.length}개의 빈 컨테이너가 있습니다`);
    }

    // 🔧 더 관대한 검증: 기본 구조만 맞으면 유효
    const isValid = errors.length === 0;

    console.log('📊 [VALIDATOR] 최소 요구사항 검증 결과:', {
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      containerCount,
      paragraphCount,
      totalContentLength,
      assignedParagraphCount: assignedParagraphs.length,
      emptyContainerCount: emptyContainers.length,
      validationMode: 'LENIENT', // 🔧 관대한 모드 표시
    });

    return {
      isValid,
      errors,
      warnings,
    };
  };

  // 🔧 전송 준비 검증 - 매우 관대한 기준
  const validateForTransfer = (
    snapshot: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult => {
    console.log('🔍 [VALIDATOR] 전송 검증 시작 (관대한 모드)');

    // 1. 기본 구조 검증
    if (!validateBasicStructure(snapshot)) {
      console.error('❌ [VALIDATOR] 기본 구조 검증 실패');
      return {
        isValidForTransfer: false,
        validationErrors: ['기본 구조 검증 실패'],
        validationWarnings: [],
        hasMinimumContent: false,
        hasRequiredStructure: false,
      };
    }

    // 2. 최소 요구사항 검증
    const {
      isValid: meetsMinimumRequirements,
      errors,
      warnings,
    } = validateMinimumRequirements(snapshot);
    const { editorContainers, editorParagraphs } = snapshot;

    // 🔧 더 관대한 조건들
    const hasBasicStructure =
      Array.isArray(editorContainers) && Array.isArray(editorParagraphs);

    // 🔧 데이터가 하나라도 있으면 최소 콘텐츠로 인정
    const hasAnyContainers = editorContainers.length > 0;
    const hasAnyParagraphs = editorParagraphs.length > 0;
    const hasAnyContent = editorParagraphs.some(
      (p) => p && p.content && p.content.trim().length > 0
    );

    // 🔧 관대한 최소 콘텐츠 기준
    const hasMinimumContent =
      hasAnyContent || hasAnyParagraphs || hasAnyContainers;

    // 🔧 관대한 필수 구조 기준
    const hasRequiredStructure = hasBasicStructure;

    // 🔧 할당된 콘텐츠 검증 - 선택사항으로 변경
    const assignedParagraphs = editorParagraphs.filter(
      (p) => p && p.containerId !== null
    );

    // 🔧 관대한 할당 콘텐츠 기준: 컨테이너나 문단이 있으면 OK
    const hasAssignedContent = hasAnyContainers || hasAnyParagraphs;

    // 🔧 추가 경고 수집
    const additionalWarnings = [...warnings];

    if (!hasAnyContainers && !hasAnyParagraphs) {
      additionalWarnings.push('컨테이너와 문단이 모두 비어있습니다');
    }

    if (hasAnyParagraphs && assignedParagraphs.length === 0) {
      additionalWarnings.push('문단이 컨테이너에 할당되지 않았습니다');
    }

    // 🔧 매우 관대한 전송 허용 조건
    const canTransfer =
      hasBasicStructure && // 기본 구조만 있으면 됨
      meetsMinimumRequirements && // 에러가 없으면 됨 (경고는 무시)
      (hasAnyContainers || hasAnyParagraphs); // 뭔가 하나라도 있으면 됨

    const result: BridgeDataValidationResult = {
      isValidForTransfer: canTransfer,
      validationErrors: errors,
      validationWarnings: additionalWarnings,
      hasMinimumContent: hasMinimumContent,
      hasRequiredStructure: hasRequiredStructure,
    };

    console.log('📊 [VALIDATOR] 전송 검증 결과:', {
      isValidForTransfer: result.isValidForTransfer,
      errorCount: result.validationErrors.length,
      warningCount: result.validationWarnings.length,
      hasBasicStructure,
      hasAnyContainers,
      hasAnyParagraphs,
      hasAnyContent,
      hasAssignedContent,
      assignedParagraphCount: assignedParagraphs.length,
      totalParagraphCount: editorParagraphs.length,
      totalContainerCount: editorContainers.length,
      validationMode: 'VERY_LENIENT', // 🔧 매우 관대한 모드
      canTransferReason: canTransfer
        ? 'PASSED_LENIENT_VALIDATION'
        : 'FAILED_BASIC_STRUCTURE',
    });

    // 🔧 디버깅 정보 추가
    if (!canTransfer) {
      console.warn('⚠️ [VALIDATOR] 전송 불가 상세 정보:', {
        hasBasicStructure,
        meetsMinimumRequirements,
        hasAnyData: hasAnyContainers || hasAnyParagraphs,
        errors: result.validationErrors,
      });
    } else {
      console.log('✅ [VALIDATOR] 전송 허용됨 (관대한 검증 통과)');
    }

    return result;
  };

  // 🔧 추가: 개발 모드용 디버그 검증
  const validateForDebug = (
    snapshot: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult & { debugInfo: any } => {
    console.log('🐛 [VALIDATOR] 디버그 검증 시작');

    const standardResult = validateForTransfer(snapshot);

    const debugInfo = {
      snapshotExists: !!snapshot,
      snapshotKeys: snapshot ? Object.keys(snapshot) : [],
      containerData:
        snapshot?.editorContainers?.map((c) => ({
          id: c?.id,
          name: c?.name,
          order: c?.order,
          hasValidStructure: !!(
            c?.id &&
            c?.name &&
            typeof c?.order === 'number'
          ),
        })) || [],
      paragraphData:
        snapshot?.editorParagraphs?.map((p) => ({
          id: p?.id,
          containerId: p?.containerId,
          contentLength: p?.content?.length || 0,
          order: p?.order,
          hasValidStructure: !!(
            p?.id &&
            typeof p?.content === 'string' &&
            typeof p?.order === 'number'
          ),
        })) || [],
      extractedTimestamp: snapshot?.extractedTimestamp,
      validationCriteria: VALIDATION_CRITERIA,
    };

    console.log('🐛 [VALIDATOR] 디버그 정보:', debugInfo);

    return {
      ...standardResult,
      debugInfo,
    };
  };

  // 🔧 추가: 빠른 상태 체크 (성능 최적화)
  const quickValidationCheck = (
    snapshot: EditorStateSnapshotForBridge | null
  ): boolean => {
    if (!snapshot) return false;

    const { editorContainers, editorParagraphs } = snapshot;

    // 🔧 최소한의 체크만 수행
    const hasValidArrays =
      Array.isArray(editorContainers) && Array.isArray(editorParagraphs);
    const hasSomeData =
      editorContainers.length > 0 || editorParagraphs.length > 0;

    return hasValidArrays && hasSomeData;
  };

  return {
    validateBasicStructure,
    validateMinimumRequirements,
    validateForTransfer,
    validateForDebug,
    quickValidationCheck,
  };
};
