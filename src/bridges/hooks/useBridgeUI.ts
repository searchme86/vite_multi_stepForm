// bridges/hooks/useBridgeUI.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useBridge } from './useBridge';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateCapture';
import {
  createStandardizationUtils,
  type StandardSize,
  type StandardVariant,
} from '../common/componentStandardization';
import type { ParagraphBlock, Container } from '../../store/shared/commonTypes';
import type {
  ExternalEditorData,
  LocalParagraphForExternal,
} from '../editorMultiStepBridge/modernBridgeTypes';

// 🔧 표준화된 UI 상태 색상 타입 (StandardVariant와 매핑)
type UIStatusColor = StandardVariant;

// 🔧 표준화된 UI 상태 아이콘 타입
type UIStatusIcon =
  | 'waiting'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'ready';

// 🔧 표준화된 진행률 데이터 인터페이스
interface ProgressData {
  readonly percentage: number;
  readonly currentValue: number;
  readonly totalValue: number;
  readonly label: string;
  readonly description: string;
  readonly color: UIStatusColor;
}

// 🔧 표준화된 에디터 통계 데이터 인터페이스
interface EditorStatistics {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly assignmentProgress: number; // 0-100 백분율
  readonly hasUnassignedContent: boolean;
  readonly dataSource: 'external' | 'store' | 'unknown';
}

// 🔧 표준화된 UI 상태 정보 인터페이스
interface UIStatusInfo {
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly hasWarning: boolean;
  readonly statusMessage: string;
  readonly statusColor: UIStatusColor;
  readonly statusIcon: UIStatusIcon;
  readonly canExecuteAction: boolean;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

// 🔧 표준화된 UI 액션 핸들러 인터페이스
interface UIActionHandlers {
  readonly handleForwardTransfer: () => Promise<void>;
  readonly handleReverseTransfer: () => Promise<void>;
  readonly handleBidirectionalSync: () => Promise<void>;
  readonly handleReset: () => void;
  readonly handleRefresh: () => void;
  readonly handleValidateOnly: () => void;
  readonly handleExternalDataRefresh: (newData: ExternalEditorData) => void;
}

// 🔧 표준화된 실행 메트릭스 인터페이스
interface ExecutionMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly lastDuration: number;
  readonly averageDuration: number;
  readonly successRate: number; // 0-100 백분율
  readonly lastExecutionTime: Date | null;
  readonly operationsPerMinute: number;
  readonly externalDataUsageCount: number;
}

// 🔧 표준화된 검증 상태 인터페이스
interface ValidationState {
  readonly isValid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly infoCount: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly infos: readonly string[];
  readonly validationProgress: number; // 0-100 백분율
}

// 🔧 브릿지 설정 레코드 타입 (인덱스 시그니처 지원)
interface BridgeConfigurationRecord {
  enableValidation: boolean;
  enableErrorRecovery: boolean;
  debugMode: boolean;
  maxRetryAttempts: number;
  timeoutMs: number;
  performanceLogging: boolean;
  strictTypeChecking: boolean;
  [key: string]: unknown;
}

// 🔧 표준화된 UI Hook 반환 인터페이스 (외부 데이터 지원 확장)
interface UseBridgeUIReturn extends UIStatusInfo, UIActionHandlers {
  readonly progressData: ProgressData;
  readonly editorStatistics: EditorStatistics;
  readonly bridgeConfiguration: BridgeConfigurationRecord;
  readonly executionMetrics: ExecutionMetrics;
  readonly validationState: ValidationState;
  readonly hasExternalData: boolean;
  readonly externalDataQuality: {
    readonly isValid: boolean;
    readonly qualityScore: number;
    readonly issues: readonly string[];
  };
  readonly componentProps: {
    readonly button: {
      readonly size: StandardSize;
      readonly variant: UIStatusColor;
      readonly disabled: boolean;
      readonly loading: boolean;
    };
    readonly statusCard: {
      readonly size: StandardSize;
      readonly variant: UIStatusColor;
      readonly elevation: 'sm' | 'md' | 'lg';
    };
    readonly toast: {
      readonly variant: UIStatusColor;
      readonly duration: number;
    };
    readonly statusBar: {
      readonly size: StandardSize;
      readonly variant: UIStatusColor;
      readonly position: 'top' | 'bottom';
    };
  };
}

// 🔧 표준화된 타입 변환 및 검증 함수들
const createStandardizedTypeHelpers = () => {
  const { validateSize, validateVariant, validateBoolean, logComponentAction } =
    createStandardizationUtils();

  const convertToSafeNumber = (
    value: unknown,
    fallbackValue: number
  ): number => {
    // Early Return: 이미 유효한 숫자인 경우
    if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
      return value;
    }

    // Early Return: 문자열을 숫자로 변환 시도
    if (typeof value === 'string' && value.length > 0) {
      const parsedNumber = parseInt(value, 10);
      return Number.isNaN(parsedNumber) ? fallbackValue : parsedNumber;
    }

    return fallbackValue;
  };

  const convertToSafeString = (
    value: unknown,
    fallbackValue: string
  ): string => {
    // Early Return: 이미 문자열인 경우
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    // Early Return: null/undefined인 경우
    if (value === null || value === undefined) {
      return fallbackValue;
    }

    try {
      return String(value);
    } catch (conversionError) {
      logComponentAction('BRIDGE_UI', '문자열 변환 실패', {
        error: conversionError,
      });
      return fallbackValue;
    }
  };

  const convertToSafeDate = (value: unknown): Date | null => {
    // Early Return: 이미 Date 객체인 경우
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }

    // Early Return: 숫자나 문자열로부터 Date 생성 시도
    if (typeof value === 'number' || typeof value === 'string') {
      try {
        const dateValue = new Date(value);
        return isNaN(dateValue.getTime()) ? null : dateValue;
      } catch (dateError) {
        return null;
      }
    }

    return null;
  };

  const convertToStandardSize = (value: unknown): StandardSize => {
    const validSizes: StandardSize[] = ['sm', 'md', 'lg', 'xl'];

    // Early Return: 이미 유효한 StandardSize인 경우
    if (
      typeof value === 'string' &&
      validSizes.includes(value as StandardSize)
    ) {
      return value as StandardSize;
    }

    // 기본값 반환
    return 'md';
  };

  const convertToSafeBoolean = (
    value: unknown,
    defaultValue: boolean
  ): boolean => {
    const isValidBoolean = typeof value === 'boolean';
    return isValidBoolean ? value : defaultValue;
  };

  const calculateSeverity = (
    errorCount: number,
    warningCount: number,
    canExecute: boolean
  ): UIStatusInfo['severity'] => {
    // Early Return: 심각한 에러가 있는 경우
    if (errorCount >= 5) {
      return 'critical';
    }

    // Early Return: 에러가 있는 경우
    if (errorCount > 0) {
      return 'high';
    }

    // Early Return: 경고가 많은 경우
    if (warningCount >= 3) {
      return 'medium';
    }

    // Early Return: 실행 불가능한 경우
    if (!canExecute) {
      return 'medium';
    }

    return 'low';
  };

  return {
    validateSize,
    validateVariant,
    validateBoolean,
    convertToSafeNumber,
    convertToSafeString,
    convertToSafeDate,
    convertToStandardSize,
    calculateSeverity,
    logComponentAction,
  };
};

// 🔧 외부 데이터 검증 및 처리 함수들
const createExternalDataHelpers = () => {
  const isValidContainer = (candidate: unknown): candidate is Container => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const containerObj = candidate;
    const hasRequiredProperties =
      'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(containerObj, 'id');
    const nameValue = Reflect.get(containerObj, 'name');
    const orderValue = Reflect.get(containerObj, 'order');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof nameValue === 'string' &&
      typeof orderValue === 'number';

    return hasValidTypes && idValue.length > 0 && nameValue.length > 0;
  };

  const isValidParagraph = (
    candidate: unknown
  ): candidate is ParagraphBlock => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string');

    return hasValidTypes && idValue.length > 0;
  };

  const isValidLocalParagraph = (
    candidate: unknown
  ): candidate is LocalParagraphForExternal => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj &&
      'createdAt' in paragraphObj &&
      'updatedAt' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');
    const createdAtValue = Reflect.get(paragraphObj, 'createdAt');
    const updatedAtValue = Reflect.get(paragraphObj, 'updatedAt');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string') &&
      createdAtValue instanceof Date &&
      updatedAtValue instanceof Date;

    return hasValidTypes && idValue.length > 0;
  };

  const isValidExternalData = (
    candidate: unknown
  ): candidate is ExternalEditorData => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const dataObj = candidate;
    const hasRequiredProperties =
      'localContainers' in dataObj && 'localParagraphs' in dataObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const containersValue = Reflect.get(dataObj, 'localContainers');
    const paragraphsValue = Reflect.get(dataObj, 'localParagraphs');

    const isValidContainersArray = Array.isArray(containersValue);
    const isValidParagraphsArray = Array.isArray(paragraphsValue);

    return isValidContainersArray && isValidParagraphsArray;
  };

  const analyzeExternalDataQuality = (
    externalData: ExternalEditorData
  ): {
    isValid: boolean;
    qualityScore: number;
    issues: string[];
    containerCount: number;
    paragraphCount: number;
  } => {
    const { logComponentAction } = createStandardizedTypeHelpers();

    logComponentAction('BRIDGE_UI', '외부 데이터 품질 분석 시작');

    const { localContainers = [], localParagraphs = [] } = externalData;
    const issues: string[] = [];

    // 컨테이너 검증
    const validContainers = localContainers.filter(isValidContainer);
    const containerCount = validContainers.length;
    const invalidContainerCount = localContainers.length - containerCount;

    invalidContainerCount > 0
      ? issues.push(`${invalidContainerCount}개의 유효하지 않은 컨테이너`)
      : null;

    // 문단 검증
    const validParagraphs = localParagraphs.filter(isValidLocalParagraph);
    const paragraphCount = validParagraphs.length;
    const invalidParagraphCount = localParagraphs.length - paragraphCount;

    invalidParagraphCount > 0
      ? issues.push(`${invalidParagraphCount}개의 유효하지 않은 문단`)
      : null;

    // 품질 점수 계산
    const totalItems = localContainers.length + localParagraphs.length;
    const validItems = containerCount + paragraphCount;
    const qualityScore =
      totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 100;

    // 최소 데이터 요구사항 검증
    const hasMinimumData = containerCount > 0 || paragraphCount > 0;
    hasMinimumData ? null : issues.push('최소 데이터 요구사항 미충족');

    const isValid = issues.length === 0 && qualityScore >= 80;

    logComponentAction('BRIDGE_UI', '외부 데이터 품질 분석 완료', {
      isValid,
      qualityScore,
      containerCount,
      paragraphCount,
      issueCount: issues.length,
    });

    return {
      isValid,
      qualityScore,
      issues,
      containerCount,
      paragraphCount,
    };
  };

  return {
    isValidContainer,
    isValidParagraph,
    isValidLocalParagraph,
    isValidExternalData,
    analyzeExternalDataQuality,
  };
};

// 🔧 표준화된 에디터 데이터 추출 함수들 (외부 데이터 지원)
const createStandardizedEditorExtractor = () => {
  const { convertToSafeNumber, logComponentAction } =
    createStandardizedTypeHelpers();
  const { isValidExternalData, analyzeExternalDataQuality } =
    createExternalDataHelpers();

  const extractEditorStatistics = (
    externalData?: ExternalEditorData
  ): EditorStatistics => {
    logComponentAction(
      'BRIDGE_UI',
      '표준화된 에디터 통계 추출 시작 (외부 데이터 지원)'
    );

    try {
      // Early Return: 외부 데이터가 있는 경우 우선 사용
      if (externalData && isValidExternalData(externalData)) {
        logComponentAction('BRIDGE_UI', '외부 데이터를 사용한 통계 추출');
        return extractStatisticsFromExternalData(externalData);
      }

      // 기존 스토어 기반 추출
      logComponentAction('BRIDGE_UI', '스토어 기반 통계 추출');
      return extractStatisticsFromStore();
    } catch (extractionError) {
      logComponentAction('BRIDGE_UI', '에디터 통계 추출 실패', {
        error: extractionError,
      });
      return createDefaultStatistics();
    }
  };

  const extractStatisticsFromExternalData = (
    externalData: ExternalEditorData
  ): EditorStatistics => {
    const { localParagraphs = [] } = externalData;
    const quality = analyzeExternalDataQuality(externalData);

    const containerCount = quality.containerCount;
    const paragraphCount = quality.paragraphCount;

    // 할당된 문단 계산
    const assignedParagraphs = localParagraphs.filter(
      (paragraphItem: LocalParagraphForExternal) =>
        paragraphItem.containerId !== null
    );
    const assignedParagraphCount = assignedParagraphs.length;
    const unassignedParagraphCount = paragraphCount - assignedParagraphCount;

    // 총 콘텐츠 길이 계산
    const totalContentLength = localParagraphs.reduce(
      (totalLength: number, paragraphItem: LocalParagraphForExternal) =>
        totalLength + (paragraphItem.content?.length || 0),
      0
    );

    // 진행률 계산
    const assignmentProgress =
      paragraphCount > 0
        ? Math.round((assignedParagraphCount / paragraphCount) * 100)
        : 0;

    const hasUnassignedContent = unassignedParagraphCount > 0;

    const statisticsResult: EditorStatistics = {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      unassignedParagraphCount,
      totalContentLength,
      assignmentProgress,
      hasUnassignedContent,
      dataSource: 'external',
    };

    logComponentAction('BRIDGE_UI', '외부 데이터 통계 추출 완료', {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      totalContentLength,
      assignmentProgress,
      dataSource: 'external',
    });

    return statisticsResult;
  };

  const extractStatisticsFromStore = (): EditorStatistics => {
    try {
      const editorExtractor = createEditorStateExtractor();
      const editorSnapshot = editorExtractor.getEditorStateWithValidation();

      // Early Return: 스냅샷이 없는 경우
      if (!editorSnapshot) {
        logComponentAction('BRIDGE_UI', '에디터 스냅샷 없음, 기본값 반환');
        return createDefaultStatistics();
      }

      // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
      const {
        editorContainers = [],
        editorParagraphs = [],
        editorCompletedContent = '',
      } = editorSnapshot;

      const containerCount = convertToSafeNumber(editorContainers.length, 0);
      const paragraphCount = convertToSafeNumber(editorParagraphs.length, 0);

      // 할당된 문단 계산
      let assignedParagraphCount = 0;
      try {
        assignedParagraphCount = editorParagraphs.filter(
          (paragraphItem: ParagraphBlock) => {
            return (
              paragraphItem !== null &&
              typeof paragraphItem === 'object' &&
              'containerId' in paragraphItem &&
              paragraphItem.containerId !== null &&
              paragraphItem.containerId !== undefined
            );
          }
        ).length;
      } catch (filterError) {
        logComponentAction('BRIDGE_UI', '할당된 문단 계산 실패', {
          error: filterError,
        });
        assignedParagraphCount = 0;
      }

      const unassignedParagraphCount = Math.max(
        0,
        paragraphCount - assignedParagraphCount
      );
      const totalContentLength = convertToSafeNumber(
        editorCompletedContent.length,
        0
      );

      // 진행률 계산
      const assignmentProgress =
        paragraphCount > 0
          ? Math.round((assignedParagraphCount / paragraphCount) * 100)
          : 0;

      const hasUnassignedContent = unassignedParagraphCount > 0;

      const statisticsResult: EditorStatistics = {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        assignmentProgress,
        hasUnassignedContent,
        dataSource: 'store',
      };

      logComponentAction('BRIDGE_UI', '스토어 기반 통계 추출 완료', {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        totalContentLength,
        assignmentProgress,
        dataSource: 'store',
      });

      return statisticsResult;
    } catch (storeExtractionError) {
      logComponentAction('BRIDGE_UI', '스토어 통계 추출 실패', {
        error: storeExtractionError,
      });
      return createDefaultStatistics();
    }
  };

  const createDefaultStatistics = (): EditorStatistics => {
    return {
      containerCount: 0,
      paragraphCount: 0,
      assignedParagraphCount: 0,
      unassignedParagraphCount: 0,
      totalContentLength: 0,
      assignmentProgress: 0,
      hasUnassignedContent: false,
      dataSource: 'unknown',
    };
  };

  return {
    extractEditorStatistics,
  };
};

// 🔧 표준화된 UI 상태 계산 함수들
const createStandardizedUICalculator = () => {
  const {
    convertToSafeString,
    convertToSafeNumber,
    convertToSafeDate,
    convertToStandardSize,
    calculateSeverity,
    logComponentAction,
  } = createStandardizedTypeHelpers();

  const calculateStatusInfo = (
    isExecuting: boolean,
    errorMessage: string | null,
    canExecuteForward: boolean,
    editorStatistics: EditorStatistics,
    validationState: ValidationState,
    hasExternalData: boolean
  ): UIStatusInfo => {
    logComponentAction(
      'BRIDGE_UI',
      '표준화된 UI 상태 계산 시작 (외부 데이터 고려)'
    );

    const { hasUnassignedContent, dataSource } = editorStatistics;
    const { errorCount, warningCount } = validationState;

    // Early Return: 실행 중인 경우
    if (isExecuting) {
      const executingMessage = hasExternalData
        ? '외부 데이터를 사용하여 작업 진행 중입니다'
        : '작업 진행 중입니다';

      return {
        isLoading: true,
        hasError: false,
        hasWarning: false,
        statusMessage: executingMessage,
        statusColor: 'primary',
        statusIcon: 'loading',
        canExecuteAction: false,
        severity: 'low',
      };
    }

    // Early Return: 에러가 있는 경우
    if (errorMessage && errorMessage.length > 0) {
      const safeErrorMessage = convertToSafeString(
        errorMessage,
        '알 수 없는 오류'
      );
      return {
        isLoading: false,
        hasError: true,
        hasWarning: false,
        statusMessage: safeErrorMessage,
        statusColor: 'error',
        statusIcon: 'error',
        canExecuteAction: false,
        severity: calculateSeverity(errorCount, warningCount, false),
      };
    }

    // Early Return: 검증 오류가 있는 경우
    if (errorCount > 0) {
      return {
        isLoading: false,
        hasError: true,
        hasWarning: false,
        statusMessage: `${errorCount}개의 검증 오류가 있습니다`,
        statusColor: 'error',
        statusIcon: 'error',
        canExecuteAction: false,
        severity: calculateSeverity(errorCount, warningCount, false),
      };
    }

    // Early Return: 전송 불가능한 경우
    if (!canExecuteForward) {
      const cannotExecuteMessage = hasExternalData
        ? '외부 데이터가 있지만 실행 조건을 충족하지 않습니다'
        : '실행 조건을 충족하지 않습니다';

      return {
        isLoading: false,
        hasError: false,
        hasWarning: true,
        statusMessage: cannotExecuteMessage,
        statusColor: 'warning',
        statusIcon: 'warning',
        canExecuteAction: false,
        severity: calculateSeverity(errorCount, warningCount, false),
      };
    }

    // 미할당 콘텐츠가 있는 경우 경고
    if (hasUnassignedContent) {
      const { unassignedParagraphCount } = editorStatistics;
      const unassignedMessage =
        dataSource === 'external'
          ? `외부 데이터에서 ${unassignedParagraphCount}개 문단이 할당되지 않았습니다`
          : `${unassignedParagraphCount}개 문단이 할당되지 않았습니다`;

      return {
        isLoading: false,
        hasError: false,
        hasWarning: true,
        statusMessage: unassignedMessage,
        statusColor: 'warning',
        statusIcon: 'warning',
        canExecuteAction: true,
        severity: calculateSeverity(errorCount, warningCount, true),
      };
    }

    // 경고가 있는 경우
    if (warningCount > 0) {
      return {
        isLoading: false,
        hasError: false,
        hasWarning: true,
        statusMessage: `${warningCount}개의 경고가 있습니다`,
        statusColor: 'warning',
        statusIcon: 'warning',
        canExecuteAction: true,
        severity: calculateSeverity(errorCount, warningCount, true),
      };
    }

    // 모든 조건 충족 - 성공 상태
    const successMessage =
      hasExternalData && dataSource === 'external'
        ? '외부 데이터를 사용하여 모든 조건이 충족되었습니다'
        : '모든 조건이 충족되었습니다';

    return {
      isLoading: false,
      hasError: false,
      hasWarning: false,
      statusMessage: successMessage,
      statusColor: 'success',
      statusIcon: 'ready',
      canExecuteAction: true,
      severity: 'low',
    };
  };

  const calculateProgressData = (
    editorStatistics: EditorStatistics
  ): ProgressData => {
    logComponentAction('BRIDGE_UI', '표준화된 진행률 데이터 계산');

    const {
      paragraphCount = 0,
      assignedParagraphCount = 0,
      assignmentProgress = 0,
      dataSource = 'unknown',
    } = editorStatistics;

    // Early Return: 문단이 없는 경우
    if (paragraphCount === 0) {
      return {
        percentage: 0,
        currentValue: 0,
        totalValue: 0,
        label: '문단 할당 진행률',
        description: '문단이 없습니다',
        color: 'default',
      };
    }

    const safeCurrentValue = convertToSafeNumber(assignedParagraphCount, 0);
    const safeTotalValue = convertToSafeNumber(paragraphCount, 1);
    const safePercentage = Math.max(0, Math.min(100, assignmentProgress));

    // 진행률에 따른 색상 결정
    let progressColor: UIStatusColor = 'default';
    if (safePercentage === 100) {
      progressColor = 'success';
    } else if (safePercentage >= 75) {
      progressColor = 'primary';
    } else if (safePercentage >= 50) {
      progressColor = 'warning';
    } else {
      progressColor = 'error';
    }

    const descriptionPrefix = dataSource === 'external' ? '외부 데이터: ' : '';
    const safeDescription = convertToSafeString(
      `${descriptionPrefix}${safeCurrentValue}/${safeTotalValue} 문단 할당 완료`,
      '진행률 계산 불가'
    );

    const progressResult: ProgressData = {
      percentage: safePercentage,
      currentValue: safeCurrentValue,
      totalValue: safeTotalValue,
      label: '문단 할당 진행률',
      description: safeDescription,
      color: progressColor,
    };

    logComponentAction('BRIDGE_UI', '표준화된 진행률 계산 완료', {
      percentage: safePercentage,
      currentValue: safeCurrentValue,
      totalValue: safeTotalValue,
      dataSource,
    });

    return progressResult;
  };

  const calculateExecutionMetrics = (rawMetrics: unknown): ExecutionMetrics => {
    logComponentAction('BRIDGE_UI', '표준화된 실행 메트릭스 계산');

    // 기본값 정의
    const defaultMetrics: ExecutionMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastDuration: 0,
      averageDuration: 0,
      successRate: 0,
      lastExecutionTime: null,
      operationsPerMinute: 0,
      externalDataUsageCount: 0,
    };

    // Early Return: 유효하지 않은 메트릭스인 경우
    if (!rawMetrics || typeof rawMetrics !== 'object') {
      logComponentAction('BRIDGE_UI', '유효하지 않은 메트릭스, 기본값 사용');
      return defaultMetrics;
    }

    const metricsObject = rawMetrics;

    // 안전한 속성 추출
    const totalOperations = convertToSafeNumber(
      Reflect.get(metricsObject, 'totalOperations'),
      0
    );
    const successfulOperations = convertToSafeNumber(
      Reflect.get(metricsObject, 'successfulOperations'),
      0
    );
    const failedOperations = convertToSafeNumber(
      Reflect.get(metricsObject, 'failedOperations'),
      0
    );
    const lastDuration = convertToSafeNumber(
      Reflect.get(metricsObject, 'lastDuration'),
      0
    );
    const averageDuration = convertToSafeNumber(
      Reflect.get(metricsObject, 'averageDuration'),
      0
    );
    const externalDataUsageCount = convertToSafeNumber(
      Reflect.get(metricsObject, 'externalDataUsageCount'),
      0
    );

    // 성공률 계산
    const successRate =
      totalOperations > 0
        ? Math.round((successfulOperations / totalOperations) * 100)
        : 0;

    // 마지막 실행 시간 계산
    const lastExecutionTime = convertToSafeDate(
      Reflect.get(metricsObject, 'lastExecutionTime')
    );

    // 분당 작업 수 계산 (최근 10분 기준으로 가정)
    const operationsPerMinute =
      totalOperations > 0 ? Math.round(totalOperations / 10) : 0;

    const calculatedMetrics: ExecutionMetrics = {
      totalOperations,
      successfulOperations,
      failedOperations,
      lastDuration,
      averageDuration,
      successRate,
      lastExecutionTime,
      operationsPerMinute,
      externalDataUsageCount,
    };

    logComponentAction('BRIDGE_UI', '표준화된 실행 메트릭스 처리 완료', {
      totalOperations,
      successfulOperations,
      externalDataUsageCount,
      successRate,
    });

    return calculatedMetrics;
  };

  const calculateValidationState = (
    errors: readonly string[] = [],
    warnings: readonly string[] = [],
    infos: readonly string[] = []
  ): ValidationState => {
    const errorCount = Array.isArray(errors) ? errors.length : 0;
    const warningCount = Array.isArray(warnings) ? warnings.length : 0;
    const infoCount = Array.isArray(infos) ? infos.length : 0;

    const totalIssues = errorCount + warningCount + infoCount;
    const resolvedIssues = infoCount; // 정보성 메시지는 해결된 것으로 간주

    const validationProgress =
      totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

    return {
      isValid: errorCount === 0,
      errorCount,
      warningCount,
      infoCount,
      errors: Array.isArray(errors) ? [...errors] : [],
      warnings: Array.isArray(warnings) ? [...warnings] : [],
      infos: Array.isArray(infos) ? [...infos] : [],
      validationProgress,
    };
  };

  const calculateComponentProps = (
    statusInfo: UIStatusInfo,
    editorStatistics: EditorStatistics
  ) => {
    const { statusColor, isLoading, canExecuteAction, severity } = statusInfo;
    const { assignmentProgress } = editorStatistics;

    // 심각도에 따른 크기 조정
    const getSizeForSeverity = (
      baseSeverity: UIStatusInfo['severity']
    ): StandardSize => {
      const severityToSizeMap = new Map<UIStatusInfo['severity'], string>([
        ['low', 'md'],
        ['medium', 'lg'],
        ['high', 'lg'],
        ['critical', 'xl'],
      ]);

      const mappedSize = severityToSizeMap.get(baseSeverity) || 'md';
      return convertToStandardSize(mappedSize);
    };

    // 진행률에 따른 elevation 조정
    const getElevationForProgress = (progress: number): 'sm' | 'md' | 'lg' => {
      if (progress >= 90) return 'lg';
      if (progress >= 50) return 'md';
      return 'sm';
    };

    // 심각도에 따른 토스트 지속시간 조정
    const getDurationForSeverity = (
      baseSeverity: UIStatusInfo['severity']
    ): number => {
      const durationMap = new Map([
        ['low', 3000],
        ['medium', 5000],
        ['high', 7000],
        ['critical', 10000],
      ]);

      const selectedDuration = durationMap.get(baseSeverity);
      return selectedDuration !== undefined ? selectedDuration : 5000;
    };

    return {
      button: {
        size: getSizeForSeverity(severity),
        variant: statusColor,
        disabled: !canExecuteAction,
        loading: isLoading,
      },
      statusCard: {
        size: getSizeForSeverity(severity),
        variant: statusColor,
        elevation: getElevationForProgress(assignmentProgress),
      },
      toast: {
        variant: statusColor,
        duration: getDurationForSeverity(severity),
      },
      statusBar: {
        size: getSizeForSeverity(severity),
        variant: statusColor,
        position: 'top' as const,
      },
    };
  };

  return {
    calculateStatusInfo,
    calculateProgressData,
    calculateExecutionMetrics,
    calculateValidationState,
    calculateComponentProps,
  };
};

// 🔧 브릿지 설정 변환 함수
const convertBridgeConfigurationToRecord = (
  bridgeConfig: unknown
): BridgeConfigurationRecord => {
  const defaultConfig: BridgeConfigurationRecord = {
    enableValidation: true,
    enableErrorRecovery: true,
    debugMode: false,
    maxRetryAttempts: 3,
    timeoutMs: 5000,
    performanceLogging: false,
    strictTypeChecking: true,
  };

  // Early Return: 유효하지 않은 설정인 경우
  if (!bridgeConfig || typeof bridgeConfig !== 'object') {
    return defaultConfig;
  }

  const configObj = bridgeConfig;

  // 안전한 타입 변환 함수들
  const convertToSafeNumber = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      const parsedNumber = parseInt(value, 10);
      return Number.isNaN(parsedNumber) ? fallback : parsedNumber;
    }
    return fallback;
  };

  const convertToSafeBoolean = (value: unknown, fallback: boolean): boolean => {
    return typeof value === 'boolean' ? value : fallback;
  };

  // 안전한 속성 추출 및 변환
  const enableValidation = convertToSafeBoolean(
    Reflect.get(configObj, 'enableValidation'),
    true
  );
  const enableErrorRecovery = convertToSafeBoolean(
    Reflect.get(configObj, 'enableErrorRecovery'),
    true
  );
  const debugMode = convertToSafeBoolean(
    Reflect.get(configObj, 'debugMode'),
    false
  );
  const maxRetryAttempts = convertToSafeNumber(
    Reflect.get(configObj, 'maxRetryAttempts'),
    3
  );
  const timeoutMs = convertToSafeNumber(
    Reflect.get(configObj, 'timeoutMs'),
    5000
  );
  const performanceLogging = convertToSafeBoolean(
    Reflect.get(configObj, 'performanceLogging'),
    false
  );
  const strictTypeChecking = convertToSafeBoolean(
    Reflect.get(configObj, 'strictTypeChecking'),
    true
  );

  // 추가 속성들을 위한 확장
  const extendedConfig: BridgeConfigurationRecord = {
    enableValidation,
    enableErrorRecovery,
    debugMode,
    maxRetryAttempts,
    timeoutMs,
    performanceLogging,
    strictTypeChecking,
  };

  // 객체의 모든 속성을 복사 (타입 안전성 유지)
  Object.keys(configObj).forEach((key: string) => {
    if (!(key in extendedConfig)) {
      extendedConfig[key] = Reflect.get(configObj, key);
    }
  });

  return extendedConfig;
};

// 🔧 메인 useBridgeUI Hook (외부 데이터 지원 추가)
export function useBridgeUI(
  customBridgeConfiguration?: Record<string, unknown>,
  externalData?: ExternalEditorData | null // 🔧 null도 허용하도록 수정
): UseBridgeUIReturn {
  const { logComponentAction } = createStandardizedTypeHelpers();
  const { isValidExternalData, analyzeExternalDataQuality } =
    createExternalDataHelpers();

  logComponentAction(
    'BRIDGE_UI',
    '표준화된 UI 브릿지 훅 초기화 시작 (외부 데이터 지원)'
  );

  // 🔧 외부 데이터 검증 및 품질 분석
  const validatedExternalData = useMemo(() => {
    // null이나 undefined인 경우 undefined로 통일
    if (externalData === null || externalData === undefined) {
      return undefined;
    }

    return isValidExternalData(externalData) ? externalData : undefined;
  }, [externalData]);

  const externalDataQuality = useMemo(() => {
    return validatedExternalData
      ? analyzeExternalDataQuality(validatedExternalData)
      : {
          isValid: false,
          qualityScore: 0,
          issues: ['외부 데이터가 제공되지 않음'],
          containerCount: 0,
          paragraphCount: 0,
        };
  }, [validatedExternalData]);

  // 🔧 통합 브릿지 훅 사용 (외부 데이터 전달)
  const bridgeHook = useBridge(
    customBridgeConfiguration,
    validatedExternalData // 이미 undefined로 변환됨
  );

  // 🔧 유틸리티 함수들
  const { extractEditorStatistics } = createStandardizedEditorExtractor();
  const {
    calculateStatusInfo,
    calculateProgressData,
    calculateExecutionMetrics,
    calculateValidationState,
    calculateComponentProps,
  } = createStandardizedUICalculator();

  // 🔧 UI 상태 관리
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const lastRefreshTime = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);

  // 🔧 초기화 Effect
  useEffect(() => {
    // Early Return: 이미 초기화된 경우
    if (isInitialized.current) {
      return;
    }

    logComponentAction('BRIDGE_UI', '표준화된 UI 훅 초기화 (외부 데이터 지원)');
    setRefreshTrigger(0);
    lastRefreshTime.current = 0;
    isInitialized.current = true;
    logComponentAction('BRIDGE_UI', '표준화된 UI 훅 초기화 완료');
  }, []);

  // 🔧 에디터 통계 계산 (메모이제이션, 외부 데이터 지원)
  const currentEditorStatistics = useMemo((): EditorStatistics => {
    logComponentAction(
      'BRIDGE_UI',
      '에디터 통계 메모이제이션 실행 (외부 데이터 지원)'
    );
    return extractEditorStatistics(validatedExternalData);
  }, [refreshTrigger, validatedExternalData]);

  // 🔧 검증 상태 계산 (메모이제이션)
  const currentValidationState = useMemo((): ValidationState => {
    logComponentAction('BRIDGE_UI', '검증 상태 메모이제이션 실행');

    const errors: string[] = [];
    const warnings: string[] = [];
    const infos: string[] = [];

    // 에디터 통계를 기반으로 검증 상태 생성
    const { hasUnassignedContent, unassignedParagraphCount, dataSource } =
      currentEditorStatistics;

    if (hasUnassignedContent) {
      const warningMessage =
        dataSource === 'external'
          ? `외부 데이터에서 ${unassignedParagraphCount}개의 문단이 할당되지 않았습니다`
          : `${unassignedParagraphCount}개의 문단이 할당되지 않았습니다`;
      warnings.push(warningMessage);
    }

    // 외부 데이터 품질 이슈 추가
    if (validatedExternalData && externalDataQuality.issues.length > 0) {
      externalDataQuality.issues.forEach((issue: string) => {
        warnings.push(`외부 데이터: ${issue}`);
      });
    }

    return calculateValidationState(errors, warnings, infos);
  }, [currentEditorStatistics, validatedExternalData, externalDataQuality]);

  // 🔧 UI 상태 정보 계산 (메모이제이션, 외부 데이터 고려)
  const currentUIStatusInfo = useMemo((): UIStatusInfo => {
    logComponentAction(
      'BRIDGE_UI',
      'UI 상태 정보 메모이제이션 실행 (외부 데이터 고려)'
    );

    const {
      isExecuting = false,
      errorMessage = null,
      canExecuteForward = false,
      hasExternalData = false,
    } = bridgeHook;

    return calculateStatusInfo(
      isExecuting,
      errorMessage,
      canExecuteForward,
      currentEditorStatistics,
      currentValidationState,
      hasExternalData
    );
  }, [
    bridgeHook.isExecuting,
    bridgeHook.errorMessage,
    bridgeHook.canExecuteForward,
    bridgeHook.hasExternalData,
    currentEditorStatistics,
    currentValidationState,
  ]);

  // 🔧 진행률 데이터 계산 (메모이제이션)
  const currentProgressData = useMemo((): ProgressData => {
    logComponentAction('BRIDGE_UI', '진행률 데이터 메모이제이션 실행');
    return calculateProgressData(currentEditorStatistics);
  }, [currentEditorStatistics]);

  // 🔧 실행 메트릭스 조회 (메모이제이션)
  const currentExecutionMetrics = useMemo((): ExecutionMetrics => {
    logComponentAction('BRIDGE_UI', '실행 메트릭스 메모이제이션 실행');
    return calculateExecutionMetrics(bridgeHook.metrics);
  }, [bridgeHook.metrics]);

  // 🔧 컴포넌트 Props 계산 (메모이제이션)
  const currentComponentProps = useMemo(() => {
    logComponentAction('BRIDGE_UI', '컴포넌트 Props 메모이제이션 실행');
    return calculateComponentProps(
      currentUIStatusInfo,
      currentEditorStatistics
    );
  }, [currentUIStatusInfo, currentEditorStatistics]);

  // 🔧 새로고침 트리거 함수
  const triggerUIRefresh = useCallback((): void => {
    const currentTime = Date.now();
    const timeSinceLastRefresh = currentTime - lastRefreshTime.current;

    // Early Return: 너무 빠른 연속 호출 방지 (300ms 제한)
    if (timeSinceLastRefresh < 300) {
      logComponentAction('BRIDGE_UI', '새로고침 제한 (300ms 미만)');
      return;
    }

    logComponentAction('BRIDGE_UI', 'UI 새로고침 트리거');
    lastRefreshTime.current = currentTime;
    setRefreshTrigger((previousValue: number) => (previousValue + 1) % 1000);
  }, []);

  // 🔧 표준화된 액션 핸들러들 (외부 데이터 지원)
  const handleForwardTransfer = useCallback(async (): Promise<void> => {
    logComponentAction('BRIDGE_UI', '표준화된 전방향 전송 핸들러 실행');

    // Early Return: 실행 불가능한 상태
    if (!currentUIStatusInfo.canExecuteAction || bridgeHook.isExecuting) {
      logComponentAction('BRIDGE_UI', '전방향 전송 실행 불가능');
      return;
    }

    try {
      await bridgeHook.executeForwardTransfer();
      triggerUIRefresh();
      logComponentAction('BRIDGE_UI', '표준화된 전방향 전송 완료');
    } catch (transferError) {
      logComponentAction('BRIDGE_UI', '전방향 전송 실패', {
        error: transferError,
      });
      triggerUIRefresh();
    }
  }, [
    currentUIStatusInfo.canExecuteAction,
    bridgeHook.isExecuting,
    bridgeHook.executeForwardTransfer,
    triggerUIRefresh,
  ]);

  const handleReverseTransfer = useCallback(async (): Promise<void> => {
    logComponentAction('BRIDGE_UI', '표준화된 역방향 전송 핸들러 실행');

    // Early Return: 실행 불가능한 상태
    if (!bridgeHook.canExecuteReverse || bridgeHook.isExecuting) {
      logComponentAction('BRIDGE_UI', '역방향 전송 실행 불가능');
      return;
    }

    try {
      await bridgeHook.executeReverseTransfer();
      triggerUIRefresh();
      logComponentAction('BRIDGE_UI', '표준화된 역방향 전송 완료');
    } catch (transferError) {
      logComponentAction('BRIDGE_UI', '역방향 전송 실패', {
        error: transferError,
      });
      triggerUIRefresh();
    }
  }, [
    bridgeHook.canExecuteReverse,
    bridgeHook.isExecuting,
    bridgeHook.executeReverseTransfer,
    triggerUIRefresh,
  ]);

  const handleBidirectionalSync = useCallback(async (): Promise<void> => {
    logComponentAction('BRIDGE_UI', '표준화된 양방향 동기화 핸들러 실행');

    // Early Return: 실행 불가능한 상태
    if (!bridgeHook.canExecuteBidirectional || bridgeHook.isExecuting) {
      logComponentAction('BRIDGE_UI', '양방향 동기화 실행 불가능');
      return;
    }

    try {
      await bridgeHook.executeBidirectionalSync();
      triggerUIRefresh();
      logComponentAction('BRIDGE_UI', '표준화된 양방향 동기화 완료');
    } catch (syncError) {
      logComponentAction('BRIDGE_UI', '양방향 동기화 실패', {
        error: syncError,
      });
      triggerUIRefresh();
    }
  }, [
    bridgeHook.canExecuteBidirectional,
    bridgeHook.isExecuting,
    bridgeHook.executeBidirectionalSync,
    triggerUIRefresh,
  ]);

  const handleReset = useCallback((): void => {
    logComponentAction('BRIDGE_UI', '표준화된 상태 초기화 핸들러 실행');

    try {
      bridgeHook.resetState();
      setRefreshTrigger(0);
      lastRefreshTime.current = 0;
      logComponentAction('BRIDGE_UI', '표준화된 상태 초기화 완료');
    } catch (resetError) {
      logComponentAction('BRIDGE_UI', '상태 초기화 실패', {
        error: resetError,
      });
    }
  }, [bridgeHook.resetState]);

  const handleRefresh = useCallback((): void => {
    logComponentAction('BRIDGE_UI', '표준화된 수동 새로고침 핸들러 실행');
    triggerUIRefresh();
  }, [triggerUIRefresh]);

  const handleValidateOnly = useCallback((): void => {
    logComponentAction('BRIDGE_UI', '검증 전용 핸들러 실행');
    triggerUIRefresh();
  }, [triggerUIRefresh]);

  const handleExternalDataRefresh = useCallback(
    (newData: ExternalEditorData): void => {
      logComponentAction('BRIDGE_UI', '외부 데이터 새로고침 핸들러 실행');

      try {
        bridgeHook.refreshExternalData(newData);
        triggerUIRefresh();
        logComponentAction('BRIDGE_UI', '외부 데이터 새로고침 완료');
      } catch (refreshError) {
        logComponentAction('BRIDGE_UI', '외부 데이터 새로고침 실패', {
          error: refreshError,
        });
      }
    },
    [bridgeHook.refreshExternalData, triggerUIRefresh]
  );

  // 🔧 브릿지 설정 조회 (메모이제이션)
  const currentBridgeConfiguration = useMemo((): BridgeConfigurationRecord => {
    try {
      const rawConfig = bridgeHook.getConfiguration();
      return convertBridgeConfigurationToRecord(rawConfig);
    } catch (configError) {
      logComponentAction('BRIDGE_UI', '설정 조회 실패', { error: configError });
      return {
        enableValidation: true,
        enableErrorRecovery: true,
        debugMode: false,
        maxRetryAttempts: 3,
        timeoutMs: 5000,
        performanceLogging: false,
        strictTypeChecking: true,
      };
    }
  }, [bridgeHook.getConfiguration]);

  logComponentAction(
    'BRIDGE_UI',
    '표준화된 UI 훅 렌더링 완료 (외부 데이터 지원)',
    {
      status: currentUIStatusInfo.statusMessage,
      isLoading: currentUIStatusInfo.isLoading,
      canExecute: currentUIStatusInfo.canExecuteAction,
      progressPercentage: currentProgressData.percentage,
      severity: currentUIStatusInfo.severity,
      hasExternalData: bridgeHook.hasExternalData,
      dataSource: currentEditorStatistics.dataSource,
      externalDataQuality: externalDataQuality.qualityScore,
    }
  );

  // 🔧 표준화된 Hook 반환값 (외부 데이터 정보 추가)
  return {
    // UI 상태 정보
    isLoading: currentUIStatusInfo.isLoading,
    hasError: currentUIStatusInfo.hasError,
    hasWarning: currentUIStatusInfo.hasWarning,
    statusMessage: currentUIStatusInfo.statusMessage,
    statusColor: currentUIStatusInfo.statusColor,
    statusIcon: currentUIStatusInfo.statusIcon,
    canExecuteAction: currentUIStatusInfo.canExecuteAction,
    severity: currentUIStatusInfo.severity,

    // 데이터
    progressData: currentProgressData,
    editorStatistics: currentEditorStatistics,
    bridgeConfiguration: currentBridgeConfiguration,
    executionMetrics: currentExecutionMetrics,
    validationState: currentValidationState,

    // 외부 데이터 정보
    hasExternalData: bridgeHook.hasExternalData,
    externalDataQuality: {
      isValid: externalDataQuality.isValid,
      qualityScore: externalDataQuality.qualityScore,
      issues: [...externalDataQuality.issues],
    },

    // 액션 핸들러
    handleForwardTransfer,
    handleReverseTransfer,
    handleBidirectionalSync,
    handleReset,
    handleRefresh,
    handleValidateOnly,
    handleExternalDataRefresh,

    // 표준화된 컴포넌트 Props
    componentProps: currentComponentProps,
  };
}
