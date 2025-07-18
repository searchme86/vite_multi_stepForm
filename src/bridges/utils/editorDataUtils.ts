// bridges/utils/editorDataUtils.ts

import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import {
  isValidString,
  isValidNumber,
  isValidDate,
  isValidArray,
  isValidObject,
} from '../common/typeGuards';
import { logDebug, logInfo, logWarn, logError } from '../common/logger';
import {
  extractErrorMessage,
  handleErrorGracefully,
} from '../common/errorHandlers';

interface ContainerValidationDetail {
  readonly containerId: string;
  readonly containerName: string;
  readonly containerOrder: number;
  readonly hasValidId: boolean;
  readonly hasValidName: boolean;
  readonly hasValidOrder: boolean;
  readonly hasValidCreatedAt: boolean;
  readonly hasValidUpdatedAt: boolean;
  readonly isCompletelyValid: boolean;
}

interface ParagraphValidationDetail {
  readonly paragraphId: string;
  readonly paragraphContent: string;
  readonly paragraphContainerId: string | null;
  readonly paragraphOrder: number;
  readonly hasValidId: boolean;
  readonly hasValidContent: boolean;
  readonly hasValidContainerId: boolean;
  readonly hasValidOrder: boolean;
  readonly hasValidCreatedAt: boolean;
  readonly hasValidUpdatedAt: boolean;
  readonly isCompletelyValid: boolean;
}

interface ContainerUtilizationMetric {
  readonly containerId: string;
  readonly containerName: string;
  readonly assignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly averageContentLength: number;
  readonly utilizationPercentage: number;
  readonly isEmpty: boolean;
}

interface EditorStatisticsResult {
  readonly totalContainers: number;
  readonly totalParagraphs: number;
  readonly assignedParagraphs: number;
  readonly unassignedParagraphs: number;
  readonly totalContentLength: number;
  readonly averageContentLength: number;
  readonly emptyContainers: number;
  readonly containerUtilization: readonly ContainerUtilizationMetric[];
}

function createContainerValidationModule() {
  const validateSingleContainerStructure = (
    candidateContainer: unknown
  ): ContainerValidationDetail | null => {
    logDebug('단일 컨테이너 구조 검증 시작', 'CONTAINER_VALIDATION', {
      containerType: typeof candidateContainer,
    });

    const isValidObjectType = isValidObject(candidateContainer);
    if (!isValidObjectType) {
      logWarn('컨테이너가 유효한 객체가 아님', 'CONTAINER_VALIDATION');
      return null;
    }

    const containerObject = candidateContainer;

    const containerIdValue = Reflect.get(containerObject, 'id');
    const containerNameValue = Reflect.get(containerObject, 'name');
    const containerOrderValue = Reflect.get(containerObject, 'order');
    const containerCreatedAtValue = Reflect.get(containerObject, 'createdAt');
    const containerUpdatedAtValue = Reflect.get(containerObject, 'updatedAt');

    const hasValidId = isValidString(containerIdValue);
    const hasValidName = isValidString(containerNameValue);
    const hasValidOrder = isValidNumber(containerOrderValue);
    const hasValidCreatedAt = isValidDate(containerCreatedAtValue);
    const hasValidUpdatedAt = isValidDate(containerUpdatedAtValue);

    const safeContainerId = hasValidId ? containerIdValue : 'INVALID_ID';
    const safeContainerName = hasValidName
      ? containerNameValue
      : 'INVALID_NAME';
    const safeContainerOrder = hasValidOrder ? containerOrderValue : -1;

    const isCompletelyValid =
      hasValidId &&
      hasValidName &&
      hasValidOrder &&
      hasValidCreatedAt &&
      hasValidUpdatedAt;

    const validationDetail: ContainerValidationDetail = {
      containerId: safeContainerId,
      containerName: safeContainerName,
      containerOrder: safeContainerOrder,
      hasValidId,
      hasValidName,
      hasValidOrder,
      hasValidCreatedAt,
      hasValidUpdatedAt,
      isCompletelyValid,
    };

    logDebug('단일 컨테이너 구조 검증 완료', 'CONTAINER_VALIDATION', {
      containerId: safeContainerId,
      isValid: isCompletelyValid,
      validFields: [
        hasValidId,
        hasValidName,
        hasValidOrder,
        hasValidCreatedAt,
        hasValidUpdatedAt,
      ].filter(Boolean).length,
    });

    return validationDetail;
  };

  const validateContainerListStructure = (
    containerList: readonly Container[]
  ): readonly ContainerValidationDetail[] => {
    logInfo('컨테이너 리스트 구조 검증 시작', 'CONTAINER_VALIDATION', {
      containerCount: containerList.length,
    });

    const validationDetailList: ContainerValidationDetail[] = [];

    containerList.forEach((containerItem, containerIndex) => {
      try {
        const validationDetail =
          validateSingleContainerStructure(containerItem);

        const hasValidDetail = validationDetail !== null;
        if (hasValidDetail) {
          validationDetailList.push(validationDetail);
        } else {
          logWarn(
            `컨테이너 인덱스 ${containerIndex} 검증 실패`,
            'CONTAINER_VALIDATION',
            { index: containerIndex }
          );
        }
      } catch (containerValidationError) {
        const errorMessage = extractErrorMessage(containerValidationError);
        logError(
          `컨테이너 인덱스 ${containerIndex} 검증 중 오류`,
          'CONTAINER_VALIDATION',
          { index: containerIndex, error: errorMessage }
        );
      }
    });

    const validContainerCount = validationDetailList.filter(
      (detail) => detail.isCompletelyValid
    ).length;

    logInfo('컨테이너 리스트 구조 검증 완료', 'CONTAINER_VALIDATION', {
      totalContainers: containerList.length,
      validContainers: validContainerCount,
      invalidContainers: containerList.length - validContainerCount,
    });

    return validationDetailList;
  };

  const checkContainerListConsistency = (
    validationDetailList: readonly ContainerValidationDetail[]
  ): boolean => {
    logDebug('컨테이너 리스트 일관성 검사 시작', 'CONTAINER_VALIDATION');

    const containerIdSet = new Set<string>();
    const containerOrderSet = new Set<number>();
    let hasDuplicateIds = false;
    let hasDuplicateOrders = false;

    validationDetailList.forEach((validationDetail) => {
      const { containerId, containerOrder, isCompletelyValid } =
        validationDetail;

      if (!isCompletelyValid) {
        return;
      }

      const hasExistingId = containerIdSet.has(containerId);
      if (hasExistingId) {
        hasDuplicateIds = true;
        logWarn(
          `중복된 컨테이너 ID 발견: ${containerId}`,
          'CONTAINER_VALIDATION',
          { duplicateId: containerId }
        );
      } else {
        containerIdSet.add(containerId);
      }

      const hasExistingOrder = containerOrderSet.has(containerOrder);
      if (hasExistingOrder) {
        hasDuplicateOrders = true;
        logWarn(
          `중복된 컨테이너 순서 발견: ${containerOrder}`,
          'CONTAINER_VALIDATION',
          { duplicateOrder: containerOrder }
        );
      } else {
        containerOrderSet.add(containerOrder);
      }
    });

    const isConsistent = !hasDuplicateIds && !hasDuplicateOrders;

    logDebug('컨테이너 리스트 일관성 검사 완료', 'CONTAINER_VALIDATION', {
      isConsistent,
      hasDuplicateIds,
      hasDuplicateOrders,
      uniqueIds: containerIdSet.size,
      uniqueOrders: containerOrderSet.size,
    });

    return isConsistent;
  };

  return {
    validateSingleContainerStructure,
    validateContainerListStructure,
    checkContainerListConsistency,
  };
}

function createParagraphValidationModule() {
  const validateSingleParagraphStructure = (
    candidateParagraph: unknown
  ): ParagraphValidationDetail | null => {
    logDebug('단일 문단 구조 검증 시작', 'PARAGRAPH_VALIDATION', {
      paragraphType: typeof candidateParagraph,
    });

    const isValidObjectType = isValidObject(candidateParagraph);
    if (!isValidObjectType) {
      logWarn('문단이 유효한 객체가 아님', 'PARAGRAPH_VALIDATION');
      return null;
    }

    const paragraphObject = candidateParagraph;

    const paragraphIdValue = Reflect.get(paragraphObject, 'id');
    const paragraphContentValue = Reflect.get(paragraphObject, 'content');
    const paragraphContainerIdValue = Reflect.get(
      paragraphObject,
      'containerId'
    );
    const paragraphOrderValue = Reflect.get(paragraphObject, 'order');
    const paragraphCreatedAtValue = Reflect.get(paragraphObject, 'createdAt');
    const paragraphUpdatedAtValue = Reflect.get(paragraphObject, 'updatedAt');

    const hasValidId = isValidString(paragraphIdValue);
    const hasValidContent = isValidString(paragraphContentValue);
    const hasValidContainerId =
      paragraphContainerIdValue === null
        ? true
        : isValidString(paragraphContainerIdValue);
    const hasValidOrder = isValidNumber(paragraphOrderValue);
    const hasValidCreatedAt = isValidDate(paragraphCreatedAtValue);
    const hasValidUpdatedAt = isValidDate(paragraphUpdatedAtValue);

    const safeParagraphId = hasValidId ? paragraphIdValue : 'INVALID_ID';
    const safeParagraphContent = hasValidContent ? paragraphContentValue : '';
    const safeParagraphContainerId: string | null =
      hasValidContainerId && isValidString(paragraphContainerIdValue)
        ? paragraphContainerIdValue
        : null;
    const safeParagraphOrder = hasValidOrder ? paragraphOrderValue : -1;

    const isCompletelyValid =
      hasValidId &&
      hasValidContent &&
      hasValidContainerId &&
      hasValidOrder &&
      hasValidCreatedAt &&
      hasValidUpdatedAt;

    const validationDetail: ParagraphValidationDetail = {
      paragraphId: safeParagraphId,
      paragraphContent: safeParagraphContent,
      paragraphContainerId: safeParagraphContainerId,
      paragraphOrder: safeParagraphOrder,
      hasValidId,
      hasValidContent,
      hasValidContainerId,
      hasValidOrder,
      hasValidCreatedAt,
      hasValidUpdatedAt,
      isCompletelyValid,
    };

    logDebug('단일 문단 구조 검증 완료', 'PARAGRAPH_VALIDATION', {
      paragraphId: safeParagraphId,
      isValid: isCompletelyValid,
      validFields: [
        hasValidId,
        hasValidContent,
        hasValidContainerId,
        hasValidOrder,
        hasValidCreatedAt,
        hasValidUpdatedAt,
      ].filter(Boolean).length,
    });

    return validationDetail;
  };

  const validateParagraphListStructure = (
    paragraphList: readonly ParagraphBlock[]
  ): readonly ParagraphValidationDetail[] => {
    logInfo('문단 리스트 구조 검증 시작', 'PARAGRAPH_VALIDATION', {
      paragraphCount: paragraphList.length,
    });

    const validationDetailList: ParagraphValidationDetail[] = [];

    paragraphList.forEach((paragraphItem, paragraphIndex) => {
      try {
        const validationDetail =
          validateSingleParagraphStructure(paragraphItem);

        const hasValidDetail = validationDetail !== null;
        if (hasValidDetail) {
          validationDetailList.push(validationDetail);
        } else {
          logWarn(
            `문단 인덱스 ${paragraphIndex} 검증 실패`,
            'PARAGRAPH_VALIDATION',
            { index: paragraphIndex }
          );
        }
      } catch (paragraphValidationError) {
        const errorMessage = extractErrorMessage(paragraphValidationError);
        logError(
          `문단 인덱스 ${paragraphIndex} 검증 중 오류`,
          'PARAGRAPH_VALIDATION',
          { index: paragraphIndex, error: errorMessage }
        );
      }
    });

    const validParagraphCount = validationDetailList.filter(
      (detail) => detail.isCompletelyValid
    ).length;

    logInfo('문단 리스트 구조 검증 완료', 'PARAGRAPH_VALIDATION', {
      totalParagraphs: paragraphList.length,
      validParagraphs: validParagraphCount,
      invalidParagraphs: paragraphList.length - validParagraphCount,
    });

    return validationDetailList;
  };

  const checkParagraphListConsistency = (
    validationDetailList: readonly ParagraphValidationDetail[]
  ): boolean => {
    logDebug('문단 리스트 일관성 검사 시작', 'PARAGRAPH_VALIDATION');

    const paragraphIdSet = new Set<string>();
    let hasDuplicateIds = false;

    validationDetailList.forEach((validationDetail) => {
      const { paragraphId, isCompletelyValid } = validationDetail;

      if (!isCompletelyValid) {
        return;
      }

      const hasExistingId = paragraphIdSet.has(paragraphId);
      if (hasExistingId) {
        hasDuplicateIds = true;
        logWarn(`중복된 문단 ID 발견: ${paragraphId}`, 'PARAGRAPH_VALIDATION', {
          duplicateId: paragraphId,
        });
      } else {
        paragraphIdSet.add(paragraphId);
      }
    });

    const isConsistent = !hasDuplicateIds;

    logDebug('문단 리스트 일관성 검사 완료', 'PARAGRAPH_VALIDATION', {
      isConsistent,
      hasDuplicateIds,
      uniqueIds: paragraphIdSet.size,
    });

    return isConsistent;
  };

  return {
    validateSingleParagraphStructure,
    validateParagraphListStructure,
    checkParagraphListConsistency,
  };
}

function createStatisticsCalculationModule() {
  const calculateContainerUtilizationMetrics = (
    containerList: readonly Container[],
    paragraphList: readonly ParagraphBlock[]
  ): readonly ContainerUtilizationMetric[] => {
    logDebug('컨테이너 활용도 메트릭 계산 시작', 'STATISTICS_CALCULATION', {
      containerCount: containerList.length,
      paragraphCount: paragraphList.length,
    });

    const utilizationMetricList: ContainerUtilizationMetric[] = [];

    containerList.forEach((containerItem) => {
      try {
        const { id: containerId = '', name: containerName = '' } =
          containerItem;

        const hasValidContainerId = isValidString(containerId);
        const hasValidContainerName = isValidString(containerName);

        if (!hasValidContainerId || !hasValidContainerName) {
          logWarn('유효하지 않은 컨테이너 정보', 'STATISTICS_CALCULATION', {
            containerId,
            containerName,
          });
          return;
        }

        const assignedParagraphList = paragraphList.filter((paragraphItem) => {
          const { containerId: paragraphContainerId } = paragraphItem;
          return paragraphContainerId === containerId;
        });

        const assignedParagraphCount = assignedParagraphList.length;
        const totalContentLength = assignedParagraphList.reduce(
          (accumulator, paragraphItem) => {
            const { content: paragraphContent = '' } = paragraphItem;
            const contentLength = isValidString(paragraphContent)
              ? paragraphContent.length
              : 0;
            return accumulator + contentLength;
          },
          0
        );

        const averageContentLength =
          assignedParagraphCount > 0
            ? totalContentLength / assignedParagraphCount
            : 0;
        const utilizationPercentage =
          paragraphList.length > 0
            ? (assignedParagraphCount / paragraphList.length) * 100
            : 0;
        const isEmpty = assignedParagraphCount === 0;

        const utilizationMetric: ContainerUtilizationMetric = {
          containerId,
          containerName,
          assignedParagraphCount,
          totalContentLength,
          averageContentLength: parseFloat(averageContentLength.toFixed(2)),
          utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2)),
          isEmpty,
        };

        utilizationMetricList.push(utilizationMetric);

        logDebug(
          `컨테이너 ${containerId} 활용도 계산 완료`,
          'STATISTICS_CALCULATION',
          {
            containerId,
            assignedParagraphs: assignedParagraphCount,
            utilizationPercentage: utilizationMetric.utilizationPercentage,
          }
        );
      } catch (utilizationCalculationError) {
        const errorMessage = extractErrorMessage(utilizationCalculationError);
        logError('컨테이너 활용도 계산 중 오류', 'STATISTICS_CALCULATION', {
          containerId: containerItem.id,
          error: errorMessage,
        });
      }
    });

    logInfo('컨테이너 활용도 메트릭 계산 완료', 'STATISTICS_CALCULATION', {
      totalMetrics: utilizationMetricList.length,
    });

    return utilizationMetricList;
  };

  const calculateOverallStatistics = (
    containerList: readonly Container[],
    paragraphList: readonly ParagraphBlock[]
  ): EditorStatisticsResult => {
    logInfo('전체 에디터 통계 계산 시작', 'STATISTICS_CALCULATION', {
      containerCount: containerList.length,
      paragraphCount: paragraphList.length,
    });

    try {
      const totalContainers = containerList.length;
      const totalParagraphs = paragraphList.length;

      const assignedParagraphList = paragraphList.filter((paragraphItem) => {
        const { containerId: paragraphContainerId } = paragraphItem;
        return paragraphContainerId !== null;
      });

      const assignedParagraphs = assignedParagraphList.length;
      const unassignedParagraphs = totalParagraphs - assignedParagraphs;

      const totalContentLength = paragraphList.reduce(
        (accumulator, paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem;
          const contentLength = isValidString(paragraphContent)
            ? paragraphContent.length
            : 0;
          return accumulator + contentLength;
        },
        0
      );

      const averageContentLength =
        totalParagraphs > 0 ? totalContentLength / totalParagraphs : 0;

      const containerUtilization = calculateContainerUtilizationMetrics(
        containerList,
        paragraphList
      );
      const emptyContainers = containerUtilization.filter(
        (metric) => metric.isEmpty
      ).length;

      const statisticsResult: EditorStatisticsResult = {
        totalContainers,
        totalParagraphs,
        assignedParagraphs,
        unassignedParagraphs,
        totalContentLength,
        averageContentLength: parseFloat(averageContentLength.toFixed(2)),
        emptyContainers,
        containerUtilization,
      };

      logInfo('전체 에디터 통계 계산 완료', 'STATISTICS_CALCULATION', {
        totalContainers,
        totalParagraphs,
        assignedParagraphs,
        unassignedParagraphs,
        emptyContainers,
        averageContentLength: statisticsResult.averageContentLength,
      });

      return statisticsResult;
    } catch (statisticsCalculationError) {
      const errorMessage = extractErrorMessage(statisticsCalculationError);
      logError('전체 통계 계산 중 오류', 'STATISTICS_CALCULATION', {
        error: errorMessage,
      });

      const fallbackStatistics: EditorStatisticsResult = {
        totalContainers: containerList.length,
        totalParagraphs: paragraphList.length,
        assignedParagraphs: 0,
        unassignedParagraphs: paragraphList.length,
        totalContentLength: 0,
        averageContentLength: 0,
        emptyContainers: containerList.length,
        containerUtilization: [],
      };

      return fallbackStatistics;
    }
  };

  return {
    calculateContainerUtilizationMetrics,
    calculateOverallStatistics,
  };
}

export function validateEditorContainers(containerList: Container[]): boolean {
  logInfo('에디터 컨테이너 검증 시작', 'EDITOR_DATA_UTILS', {
    containerCount: containerList.length,
  });

  return handleErrorGracefully(
    () => {
      const isValidContainerArray = isValidArray(containerList);
      if (!isValidContainerArray) {
        logWarn('컨테이너 리스트가 유효한 배열이 아님', 'EDITOR_DATA_UTILS');
        return false;
      }

      const hasContainers = containerList.length > 0;
      if (!hasContainers) {
        logWarn('빈 컨테이너 리스트', 'EDITOR_DATA_UTILS');
        return false;
      }

      const containerValidationModule = createContainerValidationModule();
      const validationDetailList =
        containerValidationModule.validateContainerListStructure(containerList);
      const isConsistent =
        containerValidationModule.checkContainerListConsistency(
          validationDetailList
        );

      const validContainerCount = validationDetailList.filter(
        (detail) => detail.isCompletelyValid
      ).length;
      const validationSuccessRate = validContainerCount / containerList.length;
      const isValidationSuccessful = validationSuccessRate >= 0.8;

      const overallValidation = isConsistent && isValidationSuccessful;

      logInfo('에디터 컨테이너 검증 완료', 'EDITOR_DATA_UTILS', {
        isValid: overallValidation,
        validContainers: validContainerCount,
        totalContainers: containerList.length,
        successRate: parseFloat((validationSuccessRate * 100).toFixed(2)),
        isConsistent,
      });

      return overallValidation;
    },
    false,
    'validateEditorContainers'
  );
}

export function validateEditorParagraphs(
  paragraphList: ParagraphBlock[]
): boolean {
  logInfo('에디터 문단 검증 시작', 'EDITOR_DATA_UTILS', {
    paragraphCount: paragraphList.length,
  });

  return handleErrorGracefully(
    () => {
      const isValidParagraphArray = isValidArray(paragraphList);
      if (!isValidParagraphArray) {
        logWarn('문단 리스트가 유효한 배열이 아님', 'EDITOR_DATA_UTILS');
        return false;
      }

      const hasParagraphs = paragraphList.length > 0;
      if (!hasParagraphs) {
        logWarn('빈 문단 리스트', 'EDITOR_DATA_UTILS');
        return false;
      }

      const paragraphValidationModule = createParagraphValidationModule();
      const validationDetailList =
        paragraphValidationModule.validateParagraphListStructure(paragraphList);
      const isConsistent =
        paragraphValidationModule.checkParagraphListConsistency(
          validationDetailList
        );

      const validParagraphCount = validationDetailList.filter(
        (detail) => detail.isCompletelyValid
      ).length;
      const validationSuccessRate = validParagraphCount / paragraphList.length;
      const isValidationSuccessful = validationSuccessRate >= 0.8;

      const overallValidation = isConsistent && isValidationSuccessful;

      logInfo('에디터 문단 검증 완료', 'EDITOR_DATA_UTILS', {
        isValid: overallValidation,
        validParagraphs: validParagraphCount,
        totalParagraphs: paragraphList.length,
        successRate: parseFloat((validationSuccessRate * 100).toFixed(2)),
        isConsistent,
      });

      return overallValidation;
    },
    false,
    'validateEditorParagraphs'
  );
}

export function calculateEditorStatistics(
  containerList: Container[],
  paragraphList: ParagraphBlock[]
): EditorStatisticsResult {
  logInfo('에디터 통계 계산 시작', 'EDITOR_DATA_UTILS', {
    containerCount: containerList.length,
    paragraphCount: paragraphList.length,
  });

  return handleErrorGracefully(
    () => {
      const isValidContainerArray = isValidArray(containerList);
      const isValidParagraphArray = isValidArray(paragraphList);

      if (!isValidContainerArray || !isValidParagraphArray) {
        logWarn('유효하지 않은 배열 타입', 'EDITOR_DATA_UTILS', {
          containerArrayValid: isValidContainerArray,
          paragraphArrayValid: isValidParagraphArray,
        });

        const fallbackStatistics: EditorStatisticsResult = {
          totalContainers: 0,
          totalParagraphs: 0,
          assignedParagraphs: 0,
          unassignedParagraphs: 0,
          totalContentLength: 0,
          averageContentLength: 0,
          emptyContainers: 0,
          containerUtilization: [],
        };

        return fallbackStatistics;
      }

      const statisticsCalculationModule = createStatisticsCalculationModule();
      const calculatedStatistics =
        statisticsCalculationModule.calculateOverallStatistics(
          containerList,
          paragraphList
        );

      logInfo('에디터 통계 계산 완료', 'EDITOR_DATA_UTILS', {
        totalContainers: calculatedStatistics.totalContainers,
        totalParagraphs: calculatedStatistics.totalParagraphs,
        assignedParagraphs: calculatedStatistics.assignedParagraphs,
        emptyContainers: calculatedStatistics.emptyContainers,
        averageContentLength: calculatedStatistics.averageContentLength,
      });

      return calculatedStatistics;
    },
    {
      totalContainers: 0,
      totalParagraphs: 0,
      assignedParagraphs: 0,
      unassignedParagraphs: 0,
      totalContentLength: 0,
      averageContentLength: 0,
      emptyContainers: 0,
      containerUtilization: [],
    },
    'calculateEditorStatistics'
  );
}
