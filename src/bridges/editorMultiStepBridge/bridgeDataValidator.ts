// bridges/editorMultiStepBridge/bridgeDataValidator.ts

import {
  EditorStateSnapshotForBridge,
  BridgeDataValidationResult,
} from './bridgeDataTypes';
import { VALIDATION_CRITERIA } from './bridgeConfiguration';

interface ValidatedEditorContainer {
  readonly id: string;
  readonly name: string;
  readonly order: number;
}

interface ValidatedEditorParagraph {
  readonly id: string;
  readonly content: string;
  readonly containerId: string | null;
  readonly order: number;
}

interface ValidationStatistics {
  readonly totalContainers: number;
  readonly totalParagraphs: number;
  readonly assignedParagraphs: number;
  readonly unassignedParagraphs: number;
  readonly totalContentLength: number;
  readonly emptyContainers: number;
}

interface ObjectWithProperties {
  readonly [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | ObjectWithProperties
    | ObjectWithProperties[];
}

const REQUIRED_CONTAINER_PROPERTY_SET = new Set(['id', 'name', 'order']);
const REQUIRED_PARAGRAPH_PROPERTY_SET = new Set(['id', 'content', 'order']);

function createPropertyValidationModule() {
  const hasValidStringProperty = (
    targetObject: ObjectWithProperties,
    propertyName: string
  ): boolean => {
    const hasProperty = propertyName in targetObject;
    if (!hasProperty) {
      return false;
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty.call(
      targetObject,
      propertyName
    );
    if (!hasOwnProperty) {
      return false;
    }

    const propertyValue = targetObject[propertyName];
    const isStringType = typeof propertyValue === 'string';
    if (!isStringType) {
      return false;
    }

    const stringValue = propertyValue;
    const isNonEmptyString = stringValue.trim().length > 0;
    if (!isNonEmptyString) {
      return false;
    }

    return true;
  };

  const hasValidNumberProperty = (
    targetObject: ObjectWithProperties,
    propertyName: string
  ): boolean => {
    const hasProperty = propertyName in targetObject;
    if (!hasProperty) {
      return false;
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty.call(
      targetObject,
      propertyName
    );
    if (!hasOwnProperty) {
      return false;
    }

    const propertyValue = targetObject[propertyName];
    const isNumberType = typeof propertyValue === 'number';
    if (!isNumberType) {
      return false;
    }

    const numberValue = propertyValue;
    const isValidNumber = !Number.isNaN(numberValue);
    if (!isValidNumber) {
      return false;
    }

    const isNonNegativeNumber = numberValue >= 0;
    if (!isNonNegativeNumber) {
      return false;
    }

    return true;
  };

  const hasValidContainerIdProperty = (
    targetObject: ObjectWithProperties
  ): boolean => {
    const hasContainerIdProperty = 'containerId' in targetObject;
    if (!hasContainerIdProperty) {
      return false;
    }

    const containerIdValue = targetObject['containerId'];
    const isNullValue = containerIdValue === null;
    const isValidStringValue =
      typeof containerIdValue === 'string' &&
      containerIdValue.trim().length > 0;

    const isValidContainerId = isNullValue
      ? true
      : isValidStringValue
      ? true
      : false;
    return isValidContainerId;
  };

  return {
    hasValidStringProperty,
    hasValidNumberProperty,
    hasValidContainerIdProperty,
  };
}

function createTypeGuardModule() {
  const {
    hasValidStringProperty,
    hasValidNumberProperty,
    hasValidContainerIdProperty,
  } = createPropertyValidationModule();

  const isValidObjectWithProperties = (
    candidateObject: unknown
  ): candidateObject is ObjectWithProperties => {
    const isNullValue = candidateObject === null;
    if (isNullValue) {
      return false;
    }

    const isUndefinedValue = candidateObject === undefined;
    if (isUndefinedValue) {
      return false;
    }

    const isObjectType = typeof candidateObject === 'object';
    if (!isObjectType) {
      return false;
    }

    const isArrayType = Array.isArray(candidateObject);
    if (isArrayType) {
      return false;
    }

    return true;
  };

  const isValidEditorContainer = (
    candidateContainer: unknown
  ): candidateContainer is ValidatedEditorContainer => {
    const isValidObject = isValidObjectWithProperties(candidateContainer);
    if (!isValidObject) {
      return false;
    }

    const containerObject = candidateContainer;

    for (const requiredPropertyName of REQUIRED_CONTAINER_PROPERTY_SET) {
      const isStringProperty = ['id', 'name'].includes(requiredPropertyName);
      const isNumberProperty = requiredPropertyName === 'order';

      const hasValidProperty = isStringProperty
        ? hasValidStringProperty(containerObject, requiredPropertyName)
        : isNumberProperty
        ? hasValidNumberProperty(containerObject, requiredPropertyName)
        : false;

      if (!hasValidProperty) {
        return false;
      }
    }

    return true;
  };

  const isValidEditorParagraph = (
    candidateParagraph: unknown
  ): candidateParagraph is ValidatedEditorParagraph => {
    const isValidObject = isValidObjectWithProperties(candidateParagraph);
    if (!isValidObject) {
      return false;
    }

    const paragraphObject = candidateParagraph;

    for (const requiredPropertyName of REQUIRED_PARAGRAPH_PROPERTY_SET) {
      const isStringProperty = ['id', 'content'].includes(requiredPropertyName);
      const isNumberProperty = requiredPropertyName === 'order';

      const hasValidProperty = isStringProperty
        ? hasValidStringProperty(paragraphObject, requiredPropertyName)
        : isNumberProperty
        ? hasValidNumberProperty(paragraphObject, requiredPropertyName)
        : false;

      if (!hasValidProperty) {
        return false;
      }
    }

    const hasValidContainerId = hasValidContainerIdProperty(paragraphObject);
    if (!hasValidContainerId) {
      return false;
    }

    return true;
  };

  return {
    isValidObjectWithProperties,
    isValidEditorContainer,
    isValidEditorParagraph,
  };
}

function createDataFilterModule() {
  const { isValidEditorContainer, isValidEditorParagraph } =
    createTypeGuardModule();

  const extractValidContainerList = (
    rawContainerList: readonly unknown[]
  ): ValidatedEditorContainer[] => {
    console.log(
      `🔍 [FILTER] ${rawContainerList.length}개 컨테이너 필터링 시작`
    );

    const validatedContainerList = rawContainerList.filter(
      isValidEditorContainer
    );

    console.log(
      `📊 [FILTER] 유효한 컨테이너: ${validatedContainerList.length}개`
    );
    return validatedContainerList;
  };

  const extractValidParagraphList = (
    rawParagraphList: readonly unknown[]
  ): ValidatedEditorParagraph[] => {
    console.log(`🔍 [FILTER] ${rawParagraphList.length}개 문단 필터링 시작`);

    const validatedParagraphList = rawParagraphList.filter(
      isValidEditorParagraph
    );

    console.log(`📊 [FILTER] 유효한 문단: ${validatedParagraphList.length}개`);
    return validatedParagraphList;
  };

  return {
    extractValidContainerList,
    extractValidParagraphList,
  };
}

function createBasicValidationModule() {
  const validateBasicStructure = (
    editorSnapshotData: EditorStateSnapshotForBridge
  ): boolean => {
    console.log('🔍 [VALIDATOR] 기본 구조 검증 시작');

    const isNullSnapshot = !editorSnapshotData;
    if (isNullSnapshot) {
      console.error('❌ [VALIDATOR] 스냅샷이 null 또는 undefined');
      return false;
    }

    const isValidObjectType = typeof editorSnapshotData === 'object';
    if (!isValidObjectType) {
      console.error('❌ [VALIDATOR] 스냅샷이 유효한 객체가 아님');
      return false;
    }

    const {
      editorContainers: containerList = [],
      editorParagraphs: paragraphList = [],
    } = editorSnapshotData;

    const isValidContainerArray = Array.isArray(containerList);
    if (!isValidContainerArray) {
      console.error('❌ [VALIDATOR] 컨테이너가 배열이 아님');
      return false;
    }

    const isValidParagraphArray = Array.isArray(paragraphList);
    if (!isValidParagraphArray) {
      console.error('❌ [VALIDATOR] 문단이 배열이 아님');
      return false;
    }

    console.log('📊 [VALIDATOR] 기본 구조 검증 통과:', {
      containerCount: containerList.length,
      paragraphCount: paragraphList.length,
    });

    return true;
  };

  const quickValidationCheck = (
    editorSnapshotData: EditorStateSnapshotForBridge | null
  ): boolean => {
    console.log('⚡ [VALIDATOR] 빠른 검증 시작');

    const isNullSnapshot = !editorSnapshotData;
    if (isNullSnapshot) {
      console.log('❌ [VALIDATOR] 스냅샷 데이터 없음');
      return false;
    }

    const hasValidStructure = validateBasicStructure(editorSnapshotData);
    if (!hasValidStructure) {
      console.log('❌ [VALIDATOR] 기본 구조 검증 실패');
      return false;
    }

    const {
      editorContainers: containerList = [],
      editorParagraphs: paragraphList = [],
    } = editorSnapshotData;

    const hasContainerData = containerList.length > 0;
    const hasParagraphData = paragraphList.length > 0;
    const hasAnyValidData = hasContainerData
      ? true
      : hasParagraphData
      ? true
      : false;

    console.log('📊 [VALIDATOR] 빠른 검증 결과:', {
      hasAnyValidData,
      containerCount: containerList.length,
      paragraphCount: paragraphList.length,
    });

    return hasAnyValidData;
  };

  return {
    validateBasicStructure,
    quickValidationCheck,
  };
}

function createStatisticsModule() {
  const { extractValidContainerList, extractValidParagraphList } =
    createDataFilterModule();

  const calculateValidationStatistics = (
    editorSnapshotData: EditorStateSnapshotForBridge
  ): ValidationStatistics => {
    const {
      editorContainers: originalContainerList = [],
      editorParagraphs: originalParagraphList = [],
    } = editorSnapshotData;

    const mutableContainerList = [...originalContainerList];
    const mutableParagraphList = [...originalParagraphList];

    const validContainerList = extractValidContainerList(mutableContainerList);
    const validParagraphList = extractValidParagraphList(mutableParagraphList);

    const assignedParagraphList = validParagraphList.filter(
      ({ containerId: paragraphContainerId }) => paragraphContainerId !== null
    );
    const unassignedParagraphList = validParagraphList.filter(
      ({ containerId: paragraphContainerId }) => paragraphContainerId === null
    );

    const totalContentLength = validParagraphList.reduce(
      (totalLength, { content: paragraphContent }) =>
        totalLength + paragraphContent.length,
      0
    );

    const assignedContainerIdSet = new Set(
      assignedParagraphList.map(
        ({ containerId: paragraphContainerId }) => paragraphContainerId
      )
    );
    const emptyContainerCount =
      validContainerList.length - assignedContainerIdSet.size;

    return {
      totalContainers: validContainerList.length,
      totalParagraphs: validParagraphList.length,
      assignedParagraphs: assignedParagraphList.length,
      unassignedParagraphs: unassignedParagraphList.length,
      totalContentLength,
      emptyContainers: emptyContainerCount,
    };
  };

  return { calculateValidationStatistics };
}

function createAdvancedValidationModule() {
  const { validateBasicStructure } = createBasicValidationModule();
  const { calculateValidationStatistics } = createStatisticsModule();

  const validateMinimumRequirements = (
    editorSnapshotData: EditorStateSnapshotForBridge
  ): { isValid: boolean; errors: string[]; warnings: string[] } => {
    console.log('🔍 [VALIDATOR] 최소 요구사항 검증 시작');

    const errorMessageSet = new Set<string>();
    const warningMessageSet = new Set<string>();

    const hasValidBasicStructure = validateBasicStructure(editorSnapshotData);
    if (!hasValidBasicStructure) {
      errorMessageSet.add('기본 구조가 유효하지 않습니다');
      return {
        isValid: false,
        errors: Array.from(errorMessageSet),
        warnings: Array.from(warningMessageSet),
      };
    }

    const statistics = calculateValidationStatistics(editorSnapshotData);
    const {
      totalContainers: containerCount,
      totalParagraphs: paragraphCount,
      unassignedParagraphs: unassignedParagraphCount,
      totalContentLength: contentLength,
      emptyContainers: emptyContainerCount,
    } = statistics;

    const isContainerCountSufficient =
      containerCount >= VALIDATION_CRITERIA.minContainers;
    const containerWarningMessage = isContainerCountSufficient
      ? null
      : `권장: 최소 ${VALIDATION_CRITERIA.minContainers}개의 컨테이너 (현재: ${containerCount}개)`;

    const isParagraphCountSufficient =
      paragraphCount >= VALIDATION_CRITERIA.minParagraphs;
    const paragraphWarningMessage = isParagraphCountSufficient
      ? null
      : `권장: 최소 ${VALIDATION_CRITERIA.minParagraphs}개의 문단 (현재: ${paragraphCount}개)`;

    const isContentLengthSufficient =
      contentLength >= VALIDATION_CRITERIA.minContentLength;
    const contentWarningMessage = isContentLengthSufficient
      ? null
      : contentLength === 0
      ? '콘텐츠가 비어있습니다'
      : `권장: 최소 ${VALIDATION_CRITERIA.minContentLength}자의 내용 (현재: ${contentLength}자)`;

    containerWarningMessage
      ? warningMessageSet.add(containerWarningMessage)
      : null;
    paragraphWarningMessage
      ? warningMessageSet.add(paragraphWarningMessage)
      : null;
    contentWarningMessage ? warningMessageSet.add(contentWarningMessage) : null;

    const hasUnassignedParagraphs = unassignedParagraphCount > 0;
    const unassignedWarningMessage = hasUnassignedParagraphs
      ? `${unassignedParagraphCount}개의 문단이 컨테이너에 할당되지 않았습니다`
      : null;
    unassignedWarningMessage
      ? warningMessageSet.add(unassignedWarningMessage)
      : null;

    const hasEmptyContainers = emptyContainerCount > 0;
    const emptyContainerWarningMessage = hasEmptyContainers
      ? `${emptyContainerCount}개의 빈 컨테이너가 있습니다`
      : null;
    emptyContainerWarningMessage
      ? warningMessageSet.add(emptyContainerWarningMessage)
      : null;

    const isValidForRequirements = errorMessageSet.size === 0;

    console.log('📊 [VALIDATOR] 최소 요구사항 검증 결과:', {
      isValidForRequirements,
      errorCount: errorMessageSet.size,
      warningCount: warningMessageSet.size,
      statistics,
    });

    return {
      isValid: isValidForRequirements,
      errors: Array.from(errorMessageSet),
      warnings: Array.from(warningMessageSet),
    };
  };

  const validateForTransfer = (
    editorSnapshotData: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult => {
    console.log('🔍 [VALIDATOR] 전송 검증 시작 (관대한 모드)');

    const hasValidBasicStructure = validateBasicStructure(editorSnapshotData);
    if (!hasValidBasicStructure) {
      console.error('❌ [VALIDATOR] 기본 구조 검증 실패');
      return {
        isValidForTransfer: false,
        validationErrors: ['기본 구조 검증 실패'],
        validationWarnings: [],
        hasMinimumContent: false,
        hasRequiredStructure: false,
        errorDetails: new Map([
          ['structureError', '기본 구조가 유효하지 않습니다'],
        ]),
      };
    }

    const requirementValidationResult =
      validateMinimumRequirements(editorSnapshotData);
    const {
      isValid: meetsMinimumRequirements,
      errors: requirementErrorList,
      warnings: requirementWarningList,
    } = requirementValidationResult;

    const statistics = calculateValidationStatistics(editorSnapshotData);
    const {
      totalContainers: containerCount,
      totalParagraphs: paragraphCount,
      totalContentLength: contentLength,
    } = statistics;

    const hasDataStructure =
      containerCount > 0 ? true : paragraphCount > 0 ? true : false;
    const hasActualContent = contentLength > 0;
    const hasMinimumContent = hasActualContent
      ? true
      : hasDataStructure
      ? true
      : false;
    const hasRequiredStructure = hasDataStructure;

    const additionalWarningSet = new Set(requirementWarningList);

    const isCompletelyEmpty = containerCount === 0 && paragraphCount === 0;
    const emptyWarningMessage = isCompletelyEmpty
      ? '컨테이너와 문단이 모두 비어있습니다'
      : null;
    emptyWarningMessage ? additionalWarningSet.add(emptyWarningMessage) : null;

    const canProceedWithTransfer =
      hasRequiredStructure &&
      (meetsMinimumRequirements ? true : hasDataStructure ? true : false);

    const errorDetailsMap = new Map<string, string>();
    requirementErrorList.forEach((errorMessage, errorIndex) => {
      errorDetailsMap.set(`error_${errorIndex}`, errorMessage);
    });

    const transferValidationResult: BridgeDataValidationResult = {
      isValidForTransfer: canProceedWithTransfer,
      validationErrors: requirementErrorList,
      validationWarnings: Array.from(additionalWarningSet),
      hasMinimumContent,
      hasRequiredStructure,
      errorDetails: errorDetailsMap,
    };

    console.log('📊 [VALIDATOR] 전송 검증 결과:', {
      isValidForTransfer: transferValidationResult.isValidForTransfer,
      errorCount: transferValidationResult.validationErrors.length,
      warningCount: transferValidationResult.validationWarnings.length,
      statistics,
      transferDecision: canProceedWithTransfer ? 'ALLOWED' : 'BLOCKED',
    });

    return transferValidationResult;
  };

  return {
    validateMinimumRequirements,
    validateForTransfer,
  };
}

function createDebugValidationModule() {
  const { validateForTransfer } = createAdvancedValidationModule();

  const validateForDebug = (
    editorSnapshotData: EditorStateSnapshotForBridge
  ): BridgeDataValidationResult & {
    debugInfo: Map<string, unknown>;
  } => {
    console.log('🐛 [VALIDATOR] 디버그 검증 시작');

    const standardValidationResult = validateForTransfer(editorSnapshotData);

    // 🔧 수정: Map 타입을 unknown으로 확장하여 배열도 허용
    const debugInfoMap = new Map<string, unknown>();

    debugInfoMap.set('snapshotExists', Boolean(editorSnapshotData));
    debugInfoMap.set('validationCriteria', VALIDATION_CRITERIA);
    debugInfoMap.set('debugTimestamp', Date.now());

    const isNullSnapshot = !editorSnapshotData;
    if (isNullSnapshot) {
      debugInfoMap.set('debugInfo', 'No snapshot data available');
      return {
        ...standardValidationResult,
        debugInfo: debugInfoMap,
      };
    }

    const {
      editorContainers: containerList = [],
      editorParagraphs: paragraphList = [],
    } = editorSnapshotData;

    // 🔧 수정: Object.keys() 결과를 배열로 안전하게 설정
    debugInfoMap.set('availableSnapshotKeys', Object.keys(editorSnapshotData));
    debugInfoMap.set('containerCount', containerList.length);
    debugInfoMap.set('paragraphCount', paragraphList.length);

    const hasTimestamp = 'extractedTimestamp' in editorSnapshotData;
    const timestampValue = hasTimestamp
      ? editorSnapshotData.extractedTimestamp
      : null;

    if (timestampValue !== null) {
      debugInfoMap.set('extractedTimestamp', timestampValue);
    }

    console.log(
      '🐛 [VALIDATOR] 디버그 정보:',
      Object.fromEntries(debugInfoMap)
    );

    return {
      ...standardValidationResult,
      debugInfo: debugInfoMap,
    };
  };

  return { validateForDebug };
}

export const createBridgeDataValidationHandler = () => {
  console.log('🔍 [MAIN_FACTORY] 브릿지 데이터 검증 핸들러 생성 시작');

  const { validateBasicStructure, quickValidationCheck } =
    createBasicValidationModule();
  const { validateMinimumRequirements, validateForTransfer } =
    createAdvancedValidationModule();
  const { validateForDebug } = createDebugValidationModule();

  const bridgeDataValidationHandlerInstance = {
    validateBasicStructure,
    quickValidationCheck,
    validateMinimumRequirements,
    validateForTransfer,
    validateForDebug,
  };

  console.log('✅ [MAIN_FACTORY] 브릿지 데이터 검증 핸들러 생성 완료');
  return bridgeDataValidationHandlerInstance;
};
