// bridges/editorMultiStepBridge/systemValidator.ts

import type {
  EditorStateSnapshotForBridge,
  ValidationResult,
  MultiStepFormSnapshotForBridge,
} from './modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 검증 기준 상수 정의
const VALIDATION_CRITERIA = {
  minContainers: 1,
  minParagraphs: 1,
  minContentLength: 10,
  maxContainerNameLength: 100,
  maxParagraphContentLength: 10000,
  requiredSnapshotProperties: [
    'editorContainers',
    'editorParagraphs',
    'editorCompletedContent',
    'editorIsCompleted',
  ] as const,
  requiredContainerProperties: ['id', 'name', 'order'] as const,
  requiredParagraphProperties: [
    'id',
    'content',
    'order',
    'containerId',
  ] as const,
} as const;

// 🔧 검증 통계 인터페이스
interface ValidationStatistics {
  readonly totalContainers: number;
  readonly totalParagraphs: number;
  readonly validContainers: number;
  readonly validParagraphs: number;
  readonly assignedParagraphs: number;
  readonly unassignedParagraphs: number;
  readonly totalContentLength: number;
  readonly emptyContainers: number;
  readonly averageContentLength: number;
}

interface ValidationPerformanceMetrics {
  readonly validationStartTime: number;
  readonly validationEndTime: number;
  readonly validationDuration: number;
  readonly containerValidationTime: number;
  readonly paragraphValidationTime: number;
  readonly structureValidationTime: number;
}

// 🔧 타입 가드 모듈
function createValidatorTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return (
      typeof value === 'number' &&
      !Number.isNaN(value) &&
      Number.isFinite(value)
    );
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

  const hasRequiredProperty = (
    obj: Record<string, unknown>,
    propertyName: string,
    expectedType: string
  ): boolean => {
    const hasProperty = propertyName in obj;
    if (!hasProperty) {
      return false;
    }

    const propertyValue = Reflect.get(obj, propertyName);
    const hasCorrectType = typeof propertyValue === expectedType;

    return hasCorrectType;
  };

  const isValidContainer = (candidate: unknown): candidate is Container => {
    const isValidObjectType = isValidObject(candidate);
    if (!isValidObjectType) {
      return false;
    }

    const containerObj = candidate;

    // 필수 속성 존재 및 타입 검증
    const hasValidId = hasRequiredProperty(containerObj, 'id', 'string');
    const hasValidName = hasRequiredProperty(containerObj, 'name', 'string');
    const hasValidOrder = hasRequiredProperty(containerObj, 'order', 'number');

    if (!hasValidId || !hasValidName || !hasValidOrder) {
      return false;
    }

    // 값의 유효성 검증
    const idValue = Reflect.get(containerObj, 'id');
    const nameValue = Reflect.get(containerObj, 'name');
    const orderValue = Reflect.get(containerObj, 'order');

    const isValidIdValue = isValidString(idValue) && idValue.length > 0;
    const isValidNameValue =
      isValidString(nameValue) &&
      nameValue.length > 0 &&
      nameValue.length <= VALIDATION_CRITERIA.maxContainerNameLength;
    const isValidOrderValue = isValidNumber(orderValue) && orderValue >= 0;

    return isValidIdValue && isValidNameValue && isValidOrderValue;
  };

  const isValidParagraph = (
    candidate: unknown
  ): candidate is ParagraphBlock => {
    const isValidObjectType = isValidObject(candidate);
    if (!isValidObjectType) {
      return false;
    }

    const paragraphObj = candidate;

    // 필수 속성 존재 및 타입 검증
    const hasValidId = hasRequiredProperty(paragraphObj, 'id', 'string');
    const hasValidContent = hasRequiredProperty(
      paragraphObj,
      'content',
      'string'
    );
    const hasValidOrder = hasRequiredProperty(paragraphObj, 'order', 'number');

    if (!hasValidId || !hasValidContent || !hasValidOrder) {
      return false;
    }

    // containerId는 string 또는 null이어야 함
    const hasContainerIdProperty = 'containerId' in paragraphObj;
    if (!hasContainerIdProperty) {
      return false;
    }

    const containerIdValue = Reflect.get(paragraphObj, 'containerId');
    const isValidContainerId =
      containerIdValue === null ||
      (isValidString(containerIdValue) && containerIdValue.length > 0);

    if (!isValidContainerId) {
      return false;
    }

    // 값의 유효성 검증
    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');

    const isValidIdValue = isValidString(idValue) && idValue.length > 0;
    const isValidContentValue =
      isValidString(contentValue) &&
      contentValue.length <= VALIDATION_CRITERIA.maxParagraphContentLength;
    const isValidOrderValue = isValidNumber(orderValue) && orderValue >= 0;

    return isValidIdValue && isValidContentValue && isValidOrderValue;
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidArray,
    hasRequiredProperty,
    isValidContainer,
    isValidParagraph,
  };
}

// 🔧 구조 검증 모듈
function createStructureValidationModule() {
  const { isValidObject, isValidArray } = createValidatorTypeGuardModule();

  const validateSnapshotStructure = (
    snapshot: unknown
  ): snapshot is EditorStateSnapshotForBridge => {
    console.log('🔍 [VALIDATOR] 스냅샷 구조 검증 시작');

    // Early Return: 기본 객체 타입 검증
    const isValidObjectType = isValidObject(snapshot);
    if (!isValidObjectType) {
      console.error('❌ [VALIDATOR] 스냅샷이 유효한 객체가 아님');
      return false;
    }

    const snapshotObj = snapshot;

    // 필수 속성 존재 검증
    for (const requiredProperty of VALIDATION_CRITERIA.requiredSnapshotProperties) {
      const hasProperty = requiredProperty in snapshotObj;
      if (!hasProperty) {
        console.error(`❌ [VALIDATOR] 필수 속성 누락: ${requiredProperty}`);
        return false;
      }
    }

    // 배열 속성 타입 검증
    const containersValue = Reflect.get(snapshotObj, 'editorContainers');
    const paragraphsValue = Reflect.get(snapshotObj, 'editorParagraphs');

    const isValidContainersArray = isValidArray(containersValue);
    const isValidParagraphsArray = isValidArray(paragraphsValue);

    if (!isValidContainersArray) {
      console.error('❌ [VALIDATOR] editorContainers가 배열이 아님');
      return false;
    }

    if (!isValidParagraphsArray) {
      console.error('❌ [VALIDATOR] editorParagraphs가 배열이 아님');
      return false;
    }

    // 기본 속성 타입 검증
    const contentValue = Reflect.get(snapshotObj, 'editorCompletedContent');
    const completedValue = Reflect.get(snapshotObj, 'editorIsCompleted');

    const isValidContent = typeof contentValue === 'string';
    const isValidCompleted = typeof completedValue === 'boolean';

    if (!isValidContent) {
      console.error('❌ [VALIDATOR] editorCompletedContent가 문자열이 아님');
      return false;
    }

    if (!isValidCompleted) {
      console.error('❌ [VALIDATOR] editorIsCompleted가 불린이 아님');
      return false;
    }

    console.log('✅ [VALIDATOR] 스냅샷 구조 검증 통과');
    return true;
  };

  const validateMultiStepSnapshot = (
    snapshot: unknown
  ): snapshot is MultiStepFormSnapshotForBridge => {
    console.log('🔍 [VALIDATOR] 멀티스텝 스냅샷 구조 검증 시작');

    const isValidObjectType = isValidObject(snapshot);
    if (!isValidObjectType) {
      console.error('❌ [VALIDATOR] 멀티스텝 스냅샷이 유효한 객체가 아님');
      return false;
    }

    const snapshotObj = snapshot;

    const requiredProperties = [
      'formCurrentStep',
      'formValues',
      'snapshotTimestamp',
    ] as const;

    for (const requiredProperty of requiredProperties) {
      const hasProperty = requiredProperty in snapshotObj;
      if (!hasProperty) {
        console.error(
          `❌ [VALIDATOR] 멀티스텝 필수 속성 누락: ${requiredProperty}`
        );
        return false;
      }
    }

    const currentStepValue = Reflect.get(snapshotObj, 'formCurrentStep');
    const formValuesValue = Reflect.get(snapshotObj, 'formValues');
    const timestampValue = Reflect.get(snapshotObj, 'snapshotTimestamp');

    const isValidCurrentStep =
      typeof currentStepValue === 'number' && currentStepValue > 0;
    const isValidFormValues = isValidObject(formValuesValue);
    const isValidTimestamp =
      typeof timestampValue === 'number' && timestampValue > 0;

    const hasAllValidTypes =
      isValidCurrentStep && isValidFormValues && isValidTimestamp;

    if (!hasAllValidTypes) {
      console.error('❌ [VALIDATOR] 멀티스텝 스냅샷 타입 검증 실패');
      return false;
    }

    console.log('✅ [VALIDATOR] 멀티스텝 스냅샷 구조 검증 통과');
    return true;
  };

  return {
    validateSnapshotStructure,
    validateMultiStepSnapshot,
  };
}

// 🔧 데이터 검증 모듈
function createDataValidationModule() {
  const { isValidContainer, isValidParagraph } =
    createValidatorTypeGuardModule();

  const validateContainers = (
    containers: readonly unknown[]
  ): { valid: Container[]; invalid: unknown[] } => {
    console.log(`🔍 [VALIDATOR] ${containers.length}개 컨테이너 검증 시작`);

    const validContainers: Container[] = [];
    const invalidContainers: unknown[] = [];

    containers.forEach((container, index) => {
      const isValid = isValidContainer(container);

      if (isValid) {
        validContainers.push(container);
      } else {
        console.warn(`⚠️ [VALIDATOR] 컨테이너 ${index} 검증 실패:`, container);
        invalidContainers.push(container);
      }
    });

    console.log(
      `📊 [VALIDATOR] 컨테이너 검증 결과: 유효 ${validContainers.length}개, 무효 ${invalidContainers.length}개`
    );

    return { valid: validContainers, invalid: invalidContainers };
  };

  const validateParagraphs = (
    paragraphs: readonly unknown[]
  ): { valid: ParagraphBlock[]; invalid: unknown[] } => {
    console.log(`🔍 [VALIDATOR] ${paragraphs.length}개 문단 검증 시작`);

    const validParagraphs: ParagraphBlock[] = [];
    const invalidParagraphs: unknown[] = [];

    paragraphs.forEach((paragraph, index) => {
      const isValid = isValidParagraph(paragraph);

      if (isValid) {
        validParagraphs.push(paragraph);
      } else {
        console.warn(`⚠️ [VALIDATOR] 문단 ${index} 검증 실패:`, paragraph);
        invalidParagraphs.push(paragraph);
      }
    });

    console.log(
      `📊 [VALIDATOR] 문단 검증 결과: 유효 ${validParagraphs.length}개, 무효 ${invalidParagraphs.length}개`
    );

    return { valid: validParagraphs, invalid: invalidParagraphs };
  };

  const validateDataConsistency = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): { isConsistent: boolean; issues: string[] } => {
    console.log('🔍 [VALIDATOR] 데이터 일관성 검증 시작');

    const issues: string[] = [];

    // 컨테이너 ID 중복 검사
    const containerIds = containers.map(({ id }) => id);
    const uniqueContainerIds = new Set(containerIds);

    const hasDuplicateContainerIds =
      containerIds.length !== uniqueContainerIds.size;
    if (hasDuplicateContainerIds) {
      issues.push('중복된 컨테이너 ID가 있습니다');
    }

    // 문단 ID 중복 검사
    const paragraphIds = paragraphs.map(({ id }) => id);
    const uniqueParagraphIds = new Set(paragraphIds);

    const hasDuplicateParagraphIds =
      paragraphIds.length !== uniqueParagraphIds.size;
    if (hasDuplicateParagraphIds) {
      issues.push('중복된 문단 ID가 있습니다');
    }

    // 고아 문단 검사 (존재하지 않는 컨테이너를 참조하는 문단)
    const containerIdSet = new Set(containerIds);
    const orphanParagraphs = paragraphs.filter(
      ({ containerId }) =>
        containerId !== null && !containerIdSet.has(containerId)
    );

    const hasOrphanParagraphs = orphanParagraphs.length > 0;
    if (hasOrphanParagraphs) {
      issues.push(
        `${orphanParagraphs.length}개의 고아 문단이 있습니다 (존재하지 않는 컨테이너 참조)`
      );
    }

    // 빈 컨테이너 검사
    const assignedContainerIds = new Set(
      paragraphs
        .filter(({ containerId }) => containerId !== null)
        .map(({ containerId }) => containerId)
    );

    const emptyContainers = containers.filter(
      ({ id }) => !assignedContainerIds.has(id)
    );
    const hasEmptyContainers = emptyContainers.length > 0;

    if (hasEmptyContainers) {
      issues.push(`${emptyContainers.length}개의 빈 컨테이너가 있습니다`);
    }

    const isConsistent = issues.length === 0;

    console.log('📊 [VALIDATOR] 데이터 일관성 검증 결과:', {
      isConsistent,
      issueCount: issues.length,
      issues,
    });

    return { isConsistent, issues };
  };

  return {
    validateContainers,
    validateParagraphs,
    validateDataConsistency,
  };
}

// 🔧 통계 계산 모듈
function createStatisticsModule() {
  const calculateValidationStatistics = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): ValidationStatistics => {
    console.log('📊 [VALIDATOR] 검증 통계 계산 시작');

    const totalContainers = containers.length;
    const totalParagraphs = paragraphs.length;

    const assignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId === null
    );

    const totalContentLength = paragraphs.reduce(
      (total, { content }) => total + content.length,
      0
    );

    const averageContentLength =
      totalParagraphs > 0 ? totalContentLength / totalParagraphs : 0;

    // 할당된 컨테이너 ID 집합
    const assignedContainerIds = new Set(
      assignedParagraphs.map(({ containerId }) => containerId)
    );

    const emptyContainers = totalContainers - assignedContainerIds.size;

    const statistics: ValidationStatistics = {
      totalContainers,
      totalParagraphs,
      validContainers: totalContainers, // 이미 검증된 컨테이너들
      validParagraphs: totalParagraphs, // 이미 검증된 문단들
      assignedParagraphs: assignedParagraphs.length,
      unassignedParagraphs: unassignedParagraphs.length,
      totalContentLength,
      emptyContainers,
      averageContentLength,
    };

    console.log('✅ [VALIDATOR] 검증 통계 계산 완료:', statistics);

    return statistics;
  };

  return {
    calculateValidationStatistics,
  };
}

// 🔧 메인 검증 모듈
function createMainValidationModule() {
  const { validateSnapshotStructure, validateMultiStepSnapshot } =
    createStructureValidationModule();
  const { validateContainers, validateParagraphs, validateDataConsistency } =
    createDataValidationModule();
  const { calculateValidationStatistics } = createStatisticsModule();

  const validateForTransfer = (
    snapshot: EditorStateSnapshotForBridge
  ): ValidationResult => {
    console.log('🚀 [VALIDATOR] 전송 검증 시작');
    const validationStartTime = performance.now();

    try {
      // 1단계: 구조 검증
      const isValidStructure = validateSnapshotStructure(snapshot);
      if (!isValidStructure) {
        return createValidationFailure(
          ['스냅샷 구조가 유효하지 않습니다'],
          [],
          new Map([['structureError', '기본 구조 검증 실패']])
        );
      }

      // 2단계: 데이터 추출
      const { editorContainers, editorParagraphs, editorCompletedContent } =
        snapshot;

      // 3단계: 개별 요소 검증
      const containerValidationResult = validateContainers(editorContainers);
      const paragraphValidationResult = validateParagraphs(editorParagraphs);

      const { valid: validContainers } = containerValidationResult;
      const { valid: validParagraphs } = paragraphValidationResult;

      // 4단계: 데이터 일관성 검증
      const consistencyResult = validateDataConsistency(
        validContainers,
        validParagraphs
      );

      // 5단계: 통계 계산
      const statistics = calculateValidationStatistics(
        validContainers,
        validParagraphs
      );

      // 6단계: 검증 결과 구성
      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];
      const errorDetails = new Map<string, string>();
      const validationMetrics = new Map<string, number>();
      const validationFlags = new Set<string>();

      // 최소 요구사항 검증
      const hasMinimumContainers =
        statistics.totalContainers >= VALIDATION_CRITERIA.minContainers;
      const hasMinimumParagraphs =
        statistics.totalParagraphs >= VALIDATION_CRITERIA.minParagraphs;
      const hasMinimumContent =
        statistics.totalContentLength >= VALIDATION_CRITERIA.minContentLength;

      // 경고 메시지 생성
      const shouldWarnContainers = !hasMinimumContainers;
      const shouldWarnParagraphs = !hasMinimumParagraphs;
      const shouldWarnContent = !hasMinimumContent;

      shouldWarnContainers
        ? validationWarnings.push(
            `권장: 최소 ${VALIDATION_CRITERIA.minContainers}개의 컨테이너 (현재: ${statistics.totalContainers}개)`
          )
        : null;
      shouldWarnParagraphs
        ? validationWarnings.push(
            `권장: 최소 ${VALIDATION_CRITERIA.minParagraphs}개의 문단 (현재: ${statistics.totalParagraphs}개)`
          )
        : null;
      shouldWarnContent
        ? validationWarnings.push(
            `권장: 최소 ${VALIDATION_CRITERIA.minContentLength}자의 내용 (현재: ${statistics.totalContentLength}자)`
          )
        : null;

      // 일관성 문제 추가
      const hasConsistencyIssues = !consistencyResult.isConsistent;
      if (hasConsistencyIssues) {
        validationWarnings.push(...consistencyResult.issues);
      }

      // 메트릭스 설정
      validationMetrics.set('totalContainers', statistics.totalContainers);
      validationMetrics.set('totalParagraphs', statistics.totalParagraphs);
      validationMetrics.set(
        'totalContentLength',
        statistics.totalContentLength
      );
      validationMetrics.set(
        'assignedParagraphs',
        statistics.assignedParagraphs
      );
      validationMetrics.set(
        'unassignedParagraphs',
        statistics.unassignedParagraphs
      );
      validationMetrics.set('emptyContainers', statistics.emptyContainers);
      validationMetrics.set(
        'averageContentLength',
        Math.round(statistics.averageContentLength)
      );

      // 플래그 설정
      const hasAnyData =
        statistics.totalContainers > 0 || statistics.totalParagraphs > 0;
      const hasContent = editorCompletedContent.length > 0;
      const hasRequiredStructure = hasAnyData;

      hasAnyData
        ? validationFlags.add('HAS_DATA')
        : validationFlags.add('NO_DATA');
      hasContent
        ? validationFlags.add('HAS_CONTENT')
        : validationFlags.add('NO_CONTENT');
      hasRequiredStructure
        ? validationFlags.add('VALID_STRUCTURE')
        : validationFlags.add('INVALID_STRUCTURE');
      consistencyResult.isConsistent
        ? validationFlags.add('CONSISTENT')
        : validationFlags.add('INCONSISTENT');

      // 전송 가능 여부 결정 (관대한 검증)
      const isValidForTransfer =
        hasRequiredStructure && validationErrors.length === 0;

      const validationEndTime = performance.now();
      const validationDuration = validationEndTime - validationStartTime;
      validationMetrics.set(
        'validationDurationMs',
        Math.round(validationDuration)
      );

      const result: ValidationResult = {
        isValidForTransfer,
        validationErrors,
        validationWarnings,
        hasMinimumContent: hasContent || hasAnyData,
        hasRequiredStructure,
        errorDetails,
        validationMetrics,
        validationFlags,
      };

      console.log('✅ [VALIDATOR] 전송 검증 완료:', {
        isValidForTransfer,
        errorCount: validationErrors.length,
        warningCount: validationWarnings.length,
        duration: `${validationDuration.toFixed(2)}ms`,
        statistics,
      });

      return result;
    } catch (validationError) {
      console.error('❌ [VALIDATOR] 검증 중 오류 발생:', validationError);

      const errorMessage =
        validationError instanceof Error
          ? validationError.message
          : '검증 중 알 수 없는 오류가 발생했습니다';

      return createValidationFailure(
        [errorMessage],
        [],
        new Map([['validationError', errorMessage]])
      );
    }
  };

  const validateEditorStructure = (
    snapshot: EditorStateSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 에디터 구조 검증');

    const isValidStructure = validateSnapshotStructure(snapshot);
    if (!isValidStructure) {
      return false;
    }

    const { editorContainers, editorParagraphs } = snapshot;
    const containerResult = validateContainers(editorContainers);
    const paragraphResult = validateParagraphs(editorParagraphs);

    const hasValidContainers = containerResult.invalid.length === 0;
    const hasValidParagraphs = paragraphResult.invalid.length === 0;

    const isStructureValid = hasValidContainers && hasValidParagraphs;

    console.log('📊 [VALIDATOR] 에디터 구조 검증 결과:', isStructureValid);

    return isStructureValid;
  };

  const validateMultiStepStructure = (
    snapshot: MultiStepFormSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 멀티스텝 구조 검증');

    const isValidStructure = validateMultiStepSnapshot(snapshot);

    console.log('📊 [VALIDATOR] 멀티스텝 구조 검증 결과:', isValidStructure);

    return isValidStructure;
  };

  const createValidationFailure = (
    errors: string[],
    warnings: string[],
    details: Map<string, string>
  ): ValidationResult => {
    const failureMetrics = new Map<string, number>();
    failureMetrics.set('validationFailed', 1);

    const failureFlags = new Set<string>();
    failureFlags.add('VALIDATION_FAILED');

    return {
      isValidForTransfer: false,
      validationErrors: errors,
      validationWarnings: warnings,
      hasMinimumContent: false,
      hasRequiredStructure: false,
      errorDetails: details,
      validationMetrics: failureMetrics,
      validationFlags: failureFlags,
    };
  };

  return {
    validateForTransfer,
    validateEditorStructure,
    validateMultiStepStructure,
  };
}

// 🔧 메인 팩토리 함수
export function createBridgeDataValidationHandler() {
  console.log('🏭 [VALIDATOR_FACTORY] 브릿지 데이터 검증 핸들러 생성 시작');

  const {
    validateForTransfer,
    validateEditorStructure,
    validateMultiStepStructure,
  } = createMainValidationModule();

  // 디버깅을 위한 상세 검증 함수
  const validateWithDebugInfo = (
    snapshot: EditorStateSnapshotForBridge
  ): ValidationResult & { debugInfo: Map<string, unknown> } => {
    console.log('🐛 [VALIDATOR] 디버그 검증 시작');

    const validationResult = validateForTransfer(snapshot);
    const debugInfo = new Map<string, unknown>();

    debugInfo.set('validationTimestamp', Date.now());
    debugInfo.set('snapshotExists', Boolean(snapshot));
    debugInfo.set('criteriaUsed', VALIDATION_CRITERIA);

    if (snapshot) {
      const { editorContainers, editorParagraphs, editorCompletedContent } =
        snapshot;
      debugInfo.set('containerCount', editorContainers.length);
      debugInfo.set('paragraphCount', editorParagraphs.length);
      debugInfo.set('contentLength', editorCompletedContent.length);
      debugInfo.set('hasContent', editorCompletedContent.length > 0);
    }

    console.log('🐛 [VALIDATOR] 디버그 정보 생성 완료');

    return {
      ...validationResult,
      debugInfo,
    };
  };

  console.log('✅ [VALIDATOR_FACTORY] 브릿지 데이터 검증 핸들러 생성 완료');

  return {
    validateForTransfer,
    validateEditorStructure,
    validateMultiStepStructure,
    validateWithDebugInfo,
  };
}

console.log('🏗️ [SYSTEM_VALIDATOR] 시스템 검증 모듈 초기화 완료');
console.log('📊 [SYSTEM_VALIDATOR] 제공 기능:', {
  transferValidation: '전송 전 데이터 검증',
  structureValidation: '스냅샷 구조 검증',
  dataConsistency: '데이터 일관성 검사',
  performanceMetrics: '검증 성능 메트릭스',
  debugMode: '디버그 정보 제공',
});
console.log('✅ [SYSTEM_VALIDATOR] 모든 검증 기능 준비 완료');
