import {
  EditorStateSnapshotForBridge,
  BridgeDataValidationResult,
} from './bridgeTypes';

// 브릿지 데이터 검증을 담당하는 핸들러 생성 함수
// 에디터 상태의 무결성과 전송 가능성을 다각도로 검증
export const createBridgeDataValidationHandler = () => {
  // 에디터 콘텐츠가 전송에 필요한 최소 요구사항을 충족하는지 검증
  // 빈 콘텐츠나 불완전한 데이터의 전송을 방지
  const verifyMinimumContentRequirements = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 최소 콘텐츠 검증 시작');

    // 스냅샷에서 핵심 데이터 추출 및 안전한 기본값 설정
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorCompletedContent: rawCompletedContent = '',
    } = editorSnapshot;

    // 배열 타입 안전성 보장 - 잘못된 데이터 타입 방어
    const safeContainerArray = Array.isArray(rawContainerData)
      ? rawContainerData
      : [];
    const safeParagraphArray = Array.isArray(rawParagraphData)
      ? rawParagraphData
      : [];
    // 문자열 타입 안전성 보장 - null/undefined 방어
    const safeContentString =
      typeof rawCompletedContent === 'string' ? rawCompletedContent : '';

    // 각 최소 요구사항 개별 검증
    const hasAtLeastOneContainer = safeContainerArray.length >= 1; // 최소 1개 컨테이너 필요
    const hasAtLeastOneParagraph = safeParagraphArray.length >= 1; // 최소 1개 문단 필요
    const hasNonEmptyContent = safeContentString.trim().length > 0; // 실제 내용 존재 필요

    // 모든 최소 요구사항이 충족되어야 전송 가능
    const meetsAllMinimumRequirements =
      hasAtLeastOneContainer && hasAtLeastOneParagraph && hasNonEmptyContent;

    console.log('📊 [VALIDATOR] 최소 콘텐츠 검증 결과:', {
      hasAtLeastOneContainer,
      hasAtLeastOneParagraph,
      hasNonEmptyContent,
      meetsAllMinimumRequirements,
    });

    return meetsAllMinimumRequirements;
  };

  // 에디터 데이터의 구조적 완전성을 검증하는 함수
  // 컨테이너-문단 관계, 데이터 일관성, 완료 상태 등을 종합 점검
  const validateStructuralDataIntegrity = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 필수 구조 검증 시작');

    // 스냅샷에서 구조 검증에 필요한 데이터 추출
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorIsCompleted: rawCompletionStatus = false,
    } = editorSnapshot;

    // 타입 안전성을 보장하는 데이터 정제
    const safeContainerArray = Array.isArray(rawContainerData)
      ? rawContainerData
      : [];
    const safeParagraphArray = Array.isArray(rawParagraphData)
      ? rawParagraphData
      : [];

    // 컨테이너에 할당된 문단들만 필터링 - 구조화된 콘텐츠 식별
    const assignedParagraphsToContainers = safeParagraphArray.filter(
      (paragraph) => {
        const { containerId: paragraphContainerId = null } = paragraph || {};
        return paragraphContainerId !== null; // containerId가 있는 문단만 할당된 것으로 간주
      }
    );

    // 모든 컨테이너의 데이터 구조 유효성 검증
    const areAllContainersStructurallyValid = safeContainerArray.every(
      (container) => {
        const {
          id: containerId = '',
          name: containerName = '',
          order: containerOrder = -1,
        } = container || {};

        // 각 컨테이너의 필수 필드 검증
        return (
          typeof containerId === 'string' && // ID는 문자열이어야 함
          containerId.length > 0 && // 빈 ID 불허
          typeof containerName === 'string' && // 이름은 문자열이어야 함
          typeof containerOrder === 'number' && // 순서는 숫자여야 함
          containerOrder >= 0 // 음수 순서 불허
        );
      }
    );

    // 모든 문단의 데이터 구조 유효성 검증
    const areAllParagraphsStructurallyValid = safeParagraphArray.every(
      (paragraph) => {
        const { id: paragraphId = '', content: paragraphContent = '' } =
          paragraph || {};

        // 각 문단의 필수 필드 검증
        return (
          typeof paragraphId === 'string' && // ID는 문자열이어야 함
          paragraphId.length > 0 && // 빈 ID 불허
          typeof paragraphContent === 'string' // 내용은 문자열이어야 함 (빈 문자열 허용)
        );
      }
    );

    // 실제로 구조화된 콘텐츠가 존재하는지 검증
    const hasAtLeastOneAssignedParagraph =
      assignedParagraphsToContainers.length > 0;

    // 에디터 작업 완료 상태 검증
    const isWorkProperlyCompleted = Boolean(rawCompletionStatus);

    // 모든 구조적 요구사항이 충족되어야 유효한 구조로 인정
    const hasCompleteValidStructure =
      areAllContainersStructurallyValid &&
      areAllParagraphsStructurallyValid &&
      hasAtLeastOneAssignedParagraph &&
      isWorkProperlyCompleted;

    console.log('📊 [VALIDATOR] 구조 검증 결과:', {
      areAllContainersStructurallyValid,
      areAllParagraphsStructurallyValid,
      hasAtLeastOneAssignedParagraph,
      isWorkProperlyCompleted,
      assignedCount: assignedParagraphsToContainers.length,
      totalParagraphs: safeParagraphArray.length,
      hasCompleteValidStructure,
    });

    return hasCompleteValidStructure;
  };

  // 전송을 차단해야 하는 치명적 오류들을 수집하는 함수
  // 이 배열에 항목이 있으면 전송 불가능
  const collectCriticalValidationErrors = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): string[] => {
    console.log('🔍 [VALIDATOR] 검증 오류 수집 시작');

    const criticalValidationErrors: string[] = [];

    // 스냅샷 자체의 존재성 검증 - 가장 기본적인 검사
    if (!editorSnapshot) {
      criticalValidationErrors.push('스냅샷이 존재하지 않음');
      return criticalValidationErrors; // 더 이상 검증 불가능
    }

    // 스냅샷에서 검증할 핵심 데이터 추출
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorCompletedContent: rawCompletedContent = '',
      editorIsCompleted: rawCompletionStatus = false,
      extractedTimestamp: rawTimestamp = 0,
    } = editorSnapshot;

    // 컨테이너 데이터 유효성 검증
    if (!Array.isArray(rawContainerData) || rawContainerData.length === 0) {
      criticalValidationErrors.push('컨테이너가 없거나 유효하지 않음');
    }

    // 문단 데이터 유효성 검증
    if (!Array.isArray(rawParagraphData) || rawParagraphData.length === 0) {
      criticalValidationErrors.push('문단이 없거나 유효하지 않음');
    }

    // 완성된 콘텐츠 유효성 검증
    if (
      typeof rawCompletedContent !== 'string' ||
      rawCompletedContent.trim().length === 0
    ) {
      criticalValidationErrors.push('완성된 콘텐츠가 없거나 유효하지 않음');
    }

    // 작업 완료 상태 검증
    if (!rawCompletionStatus) {
      criticalValidationErrors.push('에디터 작업이 완료되지 않음');
    }

    // 타임스탬프 유효성 검증 - 데이터 신선도 확인
    if (typeof rawTimestamp !== 'number' || rawTimestamp <= 0) {
      criticalValidationErrors.push('추출 타임스탬프가 유효하지 않음');
    }

    // 컨테이너에 할당된 문단 존재 여부 검증 - 구조화 완료도 검사
    const assignedParagraphsInSnapshot = rawParagraphData.filter(
      (paragraph) => {
        const { containerId: paragraphContainerId = null } = paragraph || {};
        return paragraphContainerId !== null;
      }
    );

    if (assignedParagraphsInSnapshot.length === 0) {
      criticalValidationErrors.push('할당된 문단이 없음');
    }

    console.log('📊 [VALIDATOR] 수집된 오류:', {
      errorCount: criticalValidationErrors.length,
      errors: criticalValidationErrors,
    });

    return criticalValidationErrors;
  };

  // 전송은 가능하지만 주의가 필요한 상황들을 수집하는 함수
  // 사용자에게 알림을 제공하여 더 나은 콘텐츠 작성 유도
  const collectValidationWarningsForImprovement = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): string[] => {
    console.log('🔍 [VALIDATOR] 검증 경고 수집 시작');

    const validationWarnings: string[] = [];

    // 스냅샷 존재하지 않으면 경고도 수집할 수 없음
    if (!editorSnapshot) {
      return validationWarnings;
    }

    // 경고 수집을 위한 데이터 추출
    const {
      editorContainers: rawContainerData = [],
      editorParagraphs: rawParagraphData = [],
      editorCompletedContent: rawCompletedContent = '',
    } = editorSnapshot;

    // 타입 안전성 보장
    const safeContainerArray = Array.isArray(rawContainerData)
      ? rawContainerData
      : [];
    const safeParagraphArray = Array.isArray(rawParagraphData)
      ? rawParagraphData
      : [];
    const safeContentString =
      typeof rawCompletedContent === 'string' ? rawCompletedContent : '';

    // 컨테이너 수량 권장사항 검사
    if (safeContainerArray.length < 2) {
      validationWarnings.push('컨테이너가 2개 미만입니다 (권장: 2개 이상)');
    }

    // 문단 수량 권장사항 검사
    if (safeParagraphArray.length < 3) {
      validationWarnings.push('문단이 3개 미만입니다 (권장: 3개 이상)');
    }

    // 콘텐츠 길이 권장사항 검사
    if (safeContentString.length < 100) {
      validationWarnings.push(
        '콘텐츠 길이가 100자 미만입니다 (권장: 100자 이상)'
      );
    }

    // 미할당 문단 존재 여부 검사 - 작업 미완료 알림
    const unassignedParagraphsInEditor = safeParagraphArray.filter(
      (paragraph) => {
        const { containerId: paragraphContainerId = null } = paragraph || {};
        return paragraphContainerId === null;
      }
    );

    if (unassignedParagraphsInEditor.length > 0) {
      validationWarnings.push(
        `${unassignedParagraphsInEditor.length}개의 미할당 문단이 있습니다`
      );
    }

    // 빈 컨테이너 존재 여부 검사 - 불필요한 구조 알림
    const emptyContainersInEditor = safeContainerArray.filter((container) => {
      const { id: containerId = '' } = container || {};
      const containerAssignedParagraphs = safeParagraphArray.filter(
        (paragraph) => {
          const { containerId: paragraphContainerId = null } = paragraph || {};
          return paragraphContainerId === containerId;
        }
      );
      return containerAssignedParagraphs.length === 0;
    });

    if (emptyContainersInEditor.length > 0) {
      validationWarnings.push(
        `${emptyContainersInEditor.length}개의 빈 컨테이너가 있습니다`
      );
    }

    console.log('📊 [VALIDATOR] 수집된 경고:', {
      warningCount: validationWarnings.length,
      warnings: validationWarnings,
    });

    return validationWarnings;
  };

  // 모든 검증 과정을 종합하여 최종 전송 가능 여부를 판단하는 함수
  // 브릿지의 핵심 게이트키퍼 역할 수행
  const performComprehensiveEditorStateValidation = (
    editorSnapshot: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult => {
    console.log('🔍 [VALIDATOR] 전송용 에디터 상태 검증 시작');

    const validationProcessStartTime = performance.now();

    // 각 검증 단계 순차 실행
    const meetsMinimumContentRequirements =
      verifyMinimumContentRequirements(editorSnapshot);
    const hasValidStructuralIntegrity =
      validateStructuralDataIntegrity(editorSnapshot);
    const foundCriticalErrors = collectCriticalValidationErrors(editorSnapshot);
    const foundWarnings =
      collectValidationWarningsForImprovement(editorSnapshot);

    // 최종 전송 가능 여부 판단 - 모든 조건이 충족되고 치명적 오류가 없어야 함
    const isSafeForDataTransfer =
      meetsMinimumContentRequirements &&
      hasValidStructuralIntegrity &&
      foundCriticalErrors.length === 0;

    // 검증 결과를 표준화된 형식으로 구성
    const comprehensiveValidationResult: BridgeDataValidationResult = {
      isValidForTransfer: isSafeForDataTransfer,
      validationErrors: foundCriticalErrors,
      validationWarnings: foundWarnings,
      hasMinimumContent: meetsMinimumContentRequirements,
      hasRequiredStructure: hasValidStructuralIntegrity,
    };

    const validationProcessEndTime = performance.now();
    const totalValidationDuration =
      validationProcessEndTime - validationProcessStartTime;

    console.log('✅ [VALIDATOR] 검증 완료:', {
      isSafeForDataTransfer,
      errorCount: foundCriticalErrors.length,
      warningCount: foundWarnings.length,
      meetsMinimumContentRequirements,
      hasValidStructuralIntegrity,
      duration: `${totalValidationDuration.toFixed(2)}ms`,
    });

    return comprehensiveValidationResult;
  };

  return {
    validateMinimumContent: verifyMinimumContentRequirements,
    validateRequiredStructure: validateStructuralDataIntegrity,
    collectValidationErrors: collectCriticalValidationErrors,
    collectValidationWarnings: collectValidationWarningsForImprovement,
    validateEditorStateForTransfer: performComprehensiveEditorStateValidation,
  };
};
