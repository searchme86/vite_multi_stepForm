// bridges/utils/bridgeSystemUtils.ts

import type { BridgeSystemConfiguration } from '../editorMultiStepBridge/modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import {
  isValidString,
  isValidNumber,
  isValidBoolean,
  isValidObject,
  isValidArray,
} from '../common/typeGuards';
import { logDebug, logInfo, logWarn, logError } from '../common/logger';

interface MarkdownParseResult {
  readonly containers: Container[];
  readonly paragraphs: ParagraphBlock[];
  readonly parseErrors: readonly string[];
  readonly parseWarnings: readonly string[];
}

interface BridgeOperationIdOptions {
  readonly prefix?: string;
  readonly includeTimestamp?: boolean;
  readonly includeRandomSuffix?: boolean;
  readonly customSeparator?: string;
}

interface ConfigurationMergeResult {
  readonly mergedConfiguration: BridgeSystemConfiguration;
  readonly mergeConflicts: readonly string[];
  readonly appliedOverrides: readonly string[];
}

interface MarkdownGenerationOptions {
  readonly includeContainerHeaders?: boolean;
  readonly useOrderedContainers?: boolean;
  readonly skipEmptyContainers?: boolean;
  readonly headerLevel?: number;
  readonly paragraphSeparator?: string;
}

function createBridgeOperationIdGenerator() {
  const generateTimestampComponent = (): string => {
    const currentTimestamp = Date.now();
    const timestampString = currentTimestamp.toString();
    const shortTimestamp = timestampString.slice(-8);

    logDebug('타임스탬프 컴포넌트 생성', 'OPERATION_ID_GENERATOR', {
      timestamp: currentTimestamp,
      shortForm: shortTimestamp,
    });

    return shortTimestamp;
  };

  const generateRandomComponent = (): string => {
    const randomValue = Math.random();
    const randomString = randomValue.toString(36);
    const cleanRandomString = randomString.substring(2, 8);

    logDebug('랜덤 컴포넌트 생성', 'OPERATION_ID_GENERATOR', {
      randomValue,
      cleanRandom: cleanRandomString,
    });

    return cleanRandomString;
  };

  const createOperationIdWithOptions = (
    options: BridgeOperationIdOptions
  ): string => {
    const {
      prefix = 'BRIDGE',
      includeTimestamp = true,
      includeRandomSuffix = true,
      customSeparator = '_',
    } = options;

    const idComponents: string[] = [];

    const isValidPrefix = isValidString(prefix);
    const sanitizedPrefix = isValidPrefix ? prefix : 'BRIDGE';
    idComponents.push(sanitizedPrefix);

    const shouldIncludeTimestamp = isValidBoolean(includeTimestamp)
      ? includeTimestamp
      : true;
    if (shouldIncludeTimestamp) {
      const timestampComponent = generateTimestampComponent();
      idComponents.push(timestampComponent);
    }

    const shouldIncludeRandom = isValidBoolean(includeRandomSuffix)
      ? includeRandomSuffix
      : true;
    if (shouldIncludeRandom) {
      const randomComponent = generateRandomComponent();
      idComponents.push(randomComponent);
    }

    const isValidSeparator = isValidString(customSeparator);
    const finalSeparator = isValidSeparator ? customSeparator : '_';

    const operationId = idComponents.join(finalSeparator);

    logInfo('브릿지 연산 ID 생성 완료', 'OPERATION_ID_GENERATOR', {
      operationId,
      componentCount: idComponents.length,
      includeTimestamp: shouldIncludeTimestamp,
      includeRandom: shouldIncludeRandom,
    });

    return operationId;
  };

  return { createOperationIdWithOptions };
}

function createBridgeConfigurationValidator() {
  const validateConfigurationStructure = (
    candidateConfig: unknown
  ): candidateConfig is Partial<BridgeSystemConfiguration> => {
    const isObjectType = isValidObject(candidateConfig);
    if (!isObjectType) {
      logWarn('설정이 유효한 객체가 아님', 'CONFIG_VALIDATOR', {
        configType: typeof candidateConfig,
      });
      return false;
    }

    const configObject = candidateConfig;
    const validBooleanProperties = [
      'enableValidation',
      'enableErrorRecovery',
      'debugMode',
      'performanceLogging',
      'strictTypeChecking',
    ];

    const validNumberProperties = ['maxRetryAttempts', 'timeoutMs'];

    const booleanPropertiesValid = validBooleanProperties.every(
      (propertyName) => {
        const hasProperty = propertyName in configObject;
        if (!hasProperty) {
          return true; // 선택적 속성이므로 없어도 됨
        }

        const propertyValue = Reflect.get(configObject, propertyName);
        const isValidBooleanProperty = isValidBoolean(propertyValue);

        if (!isValidBooleanProperty) {
          logWarn(
            `유효하지 않은 불린 속성: ${propertyName}`,
            'CONFIG_VALIDATOR',
            { propertyValue, expectedType: 'boolean' }
          );
        }

        return isValidBooleanProperty;
      }
    );

    const numberPropertiesValid = validNumberProperties.every(
      (propertyName) => {
        const hasProperty = propertyName in configObject;
        if (!hasProperty) {
          return true; // 선택적 속성이므로 없어도 됨
        }

        const propertyValue = Reflect.get(configObject, propertyName);
        const isValidNumberProperty = isValidNumber(propertyValue);

        if (!isValidNumberProperty) {
          logWarn(
            `유효하지 않은 숫자 속성: ${propertyName}`,
            'CONFIG_VALIDATOR',
            { propertyValue, expectedType: 'number' }
          );
        }

        return isValidNumberProperty;
      }
    );

    const isConfigurationValid =
      booleanPropertiesValid && numberPropertiesValid;

    logInfo('설정 구조 검증 완료', 'CONFIG_VALIDATOR', {
      isValid: isConfigurationValid,
      booleanPropertiesValid,
      numberPropertiesValid,
    });

    return isConfigurationValid;
  };

  const validateConfigurationValues = (
    config: Partial<BridgeSystemConfiguration>
  ): boolean => {
    const { maxRetryAttempts, timeoutMs } = config;

    const validationResults: boolean[] = [];

    if (maxRetryAttempts !== undefined) {
      const isValidRetryAttempts =
        isValidNumber(maxRetryAttempts) && maxRetryAttempts >= 0;
      validationResults.push(isValidRetryAttempts);

      if (!isValidRetryAttempts) {
        logWarn('유효하지 않은 재시도 횟수', 'CONFIG_VALIDATOR', {
          maxRetryAttempts,
          expectedRange: '≥ 0',
        });
      }
    }

    if (timeoutMs !== undefined) {
      const isValidTimeout = isValidNumber(timeoutMs) && timeoutMs > 0;
      validationResults.push(isValidTimeout);

      if (!isValidTimeout) {
        logWarn('유효하지 않은 타임아웃 값', 'CONFIG_VALIDATOR', {
          timeoutMs,
          expectedRange: '> 0',
        });
      }
    }

    const allValidationsPassed = validationResults.every(
      (result) => result === true
    );

    logInfo('설정 값 검증 완료', 'CONFIG_VALIDATOR', {
      allValid: allValidationsPassed,
      validationCount: validationResults.length,
      passedCount: validationResults.filter((result) => result).length,
    });

    return allValidationsPassed;
  };

  return {
    validateConfigurationStructure,
    validateConfigurationValues,
  };
}

function createBridgeConfigurationMerger() {
  const createDefaultBridgeConfiguration = (): BridgeSystemConfiguration => {
    const defaultConfiguration: BridgeSystemConfiguration = {
      enableValidation: true,
      enableErrorRecovery: true,
      debugMode: false,
      maxRetryAttempts: 3,
      timeoutMs: 5000,
      performanceLogging: false,
      strictTypeChecking: true,
      customValidationRules: new Map(),
      featureFlags: new Set(),
    };

    logDebug('기본 브릿지 설정 생성', 'CONFIG_MERGER', {
      configKeys: Object.keys(defaultConfiguration),
    });

    return defaultConfiguration;
  };

  const mergeConfigurationsWithConflictDetection = (
    baseConfiguration: BridgeSystemConfiguration,
    overrideConfiguration: Partial<BridgeSystemConfiguration>
  ): ConfigurationMergeResult => {
    const mergeConflicts: string[] = [];
    const appliedOverrides: string[] = [];

    const mergedConfig = { ...baseConfiguration };

    const overrideKeys = Object.keys(overrideConfiguration);

    overrideKeys.forEach((overrideKey) => {
      const hasBaseProperty = overrideKey in baseConfiguration;

      if (hasBaseProperty) {
        const baseValue = Reflect.get(baseConfiguration, overrideKey);
        const overrideValue = Reflect.get(overrideConfiguration, overrideKey);

        const valuesAreDifferent = baseValue !== overrideValue;
        if (valuesAreDifferent) {
          mergeConflicts.push(overrideKey);
        }

        appliedOverrides.push(overrideKey);
        Reflect.set(mergedConfig, overrideKey, overrideValue);
      }
    });

    const mergeResult: ConfigurationMergeResult = {
      mergedConfiguration: mergedConfig,
      mergeConflicts,
      appliedOverrides,
    };

    logInfo('설정 병합 완료', 'CONFIG_MERGER', {
      totalOverrides: overrideKeys.length,
      appliedOverrides: appliedOverrides.length,
      conflicts: mergeConflicts.length,
    });

    return mergeResult;
  };

  return {
    createDefaultBridgeConfiguration,
    mergeConfigurationsWithConflictDetection,
  };
}

function createMarkdownGenerator() {
  const validateMarkdownGenerationData = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): boolean => {
    const isValidContainerArray = isValidArray(containers);
    const isValidParagraphArray = isValidArray(paragraphs);

    if (!isValidContainerArray) {
      logWarn('유효하지 않은 컨테이너 배열', 'MARKDOWN_GENERATOR', {
        containerType: typeof containers,
      });
      return false;
    }

    if (!isValidParagraphArray) {
      logWarn('유효하지 않은 문단 배열', 'MARKDOWN_GENERATOR', {
        paragraphType: typeof paragraphs,
      });
      return false;
    }

    const allContainersValid = containers.every((containerItem: unknown) => {
      const isValidContainerObject = isValidObject(containerItem);
      if (!isValidContainerObject) {
        return false;
      }

      const container = containerItem;
      const hasValidId = 'id' in container && isValidString(container.id);
      const hasValidName = 'name' in container && isValidString(container.name);
      const hasValidOrder =
        'order' in container && isValidNumber(container.order);

      return hasValidId && hasValidName && hasValidOrder;
    });

    const allParagraphsValid = paragraphs.every((paragraphItem: unknown) => {
      const isValidParagraphObject = isValidObject(paragraphItem);
      if (!isValidParagraphObject) {
        return false;
      }

      const paragraph = paragraphItem;
      const hasValidId = 'id' in paragraph && isValidString(paragraph.id);
      const hasValidContent =
        'content' in paragraph && isValidString(paragraph.content);
      const hasValidOrder =
        'order' in paragraph && isValidNumber(paragraph.order);

      return hasValidId && hasValidContent && hasValidOrder;
    });

    const isDataValid = allContainersValid && allParagraphsValid;

    logInfo('마크다운 생성 데이터 검증 완료', 'MARKDOWN_GENERATOR', {
      isValid: isDataValid,
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      allContainersValid,
      allParagraphsValid,
    });

    return isDataValid;
  };

  const generateMarkdownFromContainersAndParagraphs = (
    containers: Container[],
    paragraphs: ParagraphBlock[],
    options: MarkdownGenerationOptions = {}
  ): string => {
    const {
      includeContainerHeaders = true,
      useOrderedContainers = true,
      skipEmptyContainers = true,
      headerLevel = 2,
      paragraphSeparator = '\n\n',
    } = options;

    const isDataValid = validateMarkdownGenerationData(containers, paragraphs);
    if (!isDataValid) {
      logError(
        '유효하지 않은 데이터로 인한 마크다운 생성 실패',
        'MARKDOWN_GENERATOR'
      );
      return '';
    }

    const sortedContainers = useOrderedContainers
      ? [...containers].sort((firstContainer, secondContainer) => {
          const firstOrder = firstContainer.order || 0;
          const secondOrder = secondContainer.order || 0;
          return firstOrder - secondOrder;
        })
      : [...containers];

    const markdownParts: string[] = [];
    const headerPrefix = '#'.repeat(Math.max(1, Math.min(6, headerLevel)));

    sortedContainers.forEach((container) => {
      const { id: containerId, name: containerName } = container;

      const containerParagraphs = paragraphs
        .filter((paragraph) => paragraph.containerId === containerId)
        .sort((firstParagraph, secondParagraph) => {
          const firstOrder = firstParagraph.order || 0;
          const secondOrder = secondParagraph.order || 0;
          return firstOrder - secondOrder;
        });

      const hasNoParagraphs = containerParagraphs.length === 0;
      const shouldSkipEmptyContainer = skipEmptyContainers && hasNoParagraphs;

      if (shouldSkipEmptyContainer) {
        logDebug(`빈 컨테이너 스킵: ${containerName}`, 'MARKDOWN_GENERATOR', {
          containerId,
          containerName,
        });
        return;
      }

      if (includeContainerHeaders) {
        markdownParts.push(`${headerPrefix} ${containerName}`);
        markdownParts.push('');
      }

      containerParagraphs.forEach((paragraph) => {
        const { content: paragraphContent } = paragraph;
        const hasValidContent =
          isValidString(paragraphContent) && paragraphContent.trim().length > 0;

        if (hasValidContent) {
          markdownParts.push(paragraphContent.trim());
        }
      });

      const hasAddedContent = containerParagraphs.length > 0;
      if (hasAddedContent) {
        markdownParts.push('');
      }
    });

    const unassignedParagraphs = paragraphs
      .filter((paragraph) => paragraph.containerId === null)
      .sort((firstParagraph, secondParagraph) => {
        const firstOrder = firstParagraph.order || 0;
        const secondOrder = secondParagraph.order || 0;
        return firstOrder - secondOrder;
      });

    const hasUnassignedParagraphs = unassignedParagraphs.length > 0;
    if (hasUnassignedParagraphs) {
      if (includeContainerHeaders) {
        markdownParts.push(`${headerPrefix} 기타`);
        markdownParts.push('');
      }

      unassignedParagraphs.forEach((paragraph) => {
        const { content: paragraphContent } = paragraph;
        const hasValidContent =
          isValidString(paragraphContent) && paragraphContent.trim().length > 0;

        if (hasValidContent) {
          markdownParts.push(paragraphContent.trim());
        }
      });
    }

    const finalMarkdown = markdownParts.join(paragraphSeparator);
    const cleanedMarkdown = finalMarkdown.replace(/\n{3,}/g, '\n\n').trim();

    logInfo('마크다운 생성 완료', 'MARKDOWN_GENERATOR', {
      totalParts: markdownParts.length,
      finalLength: cleanedMarkdown.length,
      containerCount: sortedContainers.length,
      unassignedCount: unassignedParagraphs.length,
    });

    return cleanedMarkdown;
  };

  return { generateMarkdownFromContainersAndParagraphs };
}

function createMarkdownParser() {
  const parseMarkdownContentToStructure = (
    markdownContent: string
  ): MarkdownParseResult => {
    const isValidMarkdownString = isValidString(markdownContent);
    if (!isValidMarkdownString) {
      logError('유효하지 않은 마크다운 콘텐츠', 'MARKDOWN_PARSER', {
        contentType: typeof markdownContent,
      });

      return {
        containers: [],
        paragraphs: [],
        parseErrors: ['유효하지 않은 마크다운 콘텐츠'],
        parseWarnings: [],
      };
    }

    const trimmedContent = markdownContent.trim();
    const hasNoContent = trimmedContent.length === 0;
    if (hasNoContent) {
      logWarn('빈 마크다운 콘텐츠', 'MARKDOWN_PARSER');

      return {
        containers: [],
        paragraphs: [],
        parseErrors: [],
        parseWarnings: ['빈 마크다운 콘텐츠'],
      };
    }

    const lines = trimmedContent.split('\n');
    const containers: Container[] = [];
    const paragraphs: ParagraphBlock[] = [];
    const parseErrors: string[] = [];
    const parseWarnings: string[] = [];

    let currentContainerId: string | null = null;
    let containerOrder = 0;
    let paragraphOrder = 0;

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      const hasNoLineContent = trimmedLine.length === 0;

      if (hasNoLineContent) {
        return; // 빈 줄 스킵
      }

      const isHeaderLine = trimmedLine.startsWith('#');
      if (isHeaderLine) {
        const headerMatch = trimmedLine.match(/^#+\s+(.+)$/);
        const hasValidHeaderMatch = headerMatch && headerMatch[1];

        if (hasValidHeaderMatch) {
          const headerText = headerMatch[1].trim();
          const containerId = `container_${containerOrder + 1}`;

          const newContainer: Container = {
            id: containerId,
            name: headerText,
            order: containerOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          containers.push(newContainer);
          currentContainerId = containerId;
          containerOrder++;

          logDebug(`컨테이너 생성: ${headerText}`, 'MARKDOWN_PARSER', {
            containerId,
            order: containerOrder - 1,
          });
        } else {
          parseErrors.push(`라인 ${lineIndex + 1}: 유효하지 않은 헤더 형식`);
        }
      } else {
        const paragraphId = `paragraph_${paragraphOrder + 1}`;

        const newParagraph: ParagraphBlock = {
          id: paragraphId,
          content: trimmedLine,
          containerId: currentContainerId,
          order: paragraphOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        paragraphs.push(newParagraph);
        paragraphOrder++;

        logDebug(
          `문단 생성: ${trimmedLine.substring(0, 30)}...`,
          'MARKDOWN_PARSER',
          {
            paragraphId,
            containerId: currentContainerId,
            order: paragraphOrder - 1,
          }
        );
      }
    });

    const hasNoContainers = containers.length === 0;
    if (hasNoContainers && paragraphs.length > 0) {
      parseWarnings.push('헤더 없이 문단만 존재함');
    }

    const parseResult: MarkdownParseResult = {
      containers,
      paragraphs,
      parseErrors,
      parseWarnings,
    };

    logInfo('마크다운 파싱 완료', 'MARKDOWN_PARSER', {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
      errorCount: parseErrors.length,
      warningCount: parseWarnings.length,
      totalLines: lines.length,
    });

    return parseResult;
  };

  return { parseMarkdownContentToStructure };
}

function createBridgeSystemUtilityModule() {
  const operationIdGenerator = createBridgeOperationIdGenerator();
  const configurationValidator = createBridgeConfigurationValidator();
  const configurationMerger = createBridgeConfigurationMerger();
  const markdownGenerator = createMarkdownGenerator();
  const markdownParser = createMarkdownParser();

  const createBridgeOperationIdWithDefaults = (): string => {
    return operationIdGenerator.createOperationIdWithOptions({
      prefix: 'BRIDGE',
      includeTimestamp: true,
      includeRandomSuffix: true,
      customSeparator: '_',
    });
  };

  const validateBridgeConfigurationCompletely = (
    config: Partial<BridgeSystemConfiguration>
  ): boolean => {
    logDebug('브릿지 설정 완전 검증 시작', 'BRIDGE_SYSTEM_UTILS', {
      configKeys: Object.keys(config),
    });

    const structureValid =
      configurationValidator.validateConfigurationStructure(config);
    if (!structureValid) {
      logError('브릿지 설정 구조 검증 실패', 'BRIDGE_SYSTEM_UTILS');
      return false;
    }

    const valuesValid =
      configurationValidator.validateConfigurationValues(config);
    if (!valuesValid) {
      logError('브릿지 설정 값 검증 실패', 'BRIDGE_SYSTEM_UTILS');
      return false;
    }

    logInfo('브릿지 설정 완전 검증 성공', 'BRIDGE_SYSTEM_UTILS');

    return true;
  };

  const mergeBridgeConfigurationsSafely = (
    baseConfiguration: BridgeSystemConfiguration,
    overrideConfiguration: Partial<BridgeSystemConfiguration>
  ): BridgeSystemConfiguration => {
    logDebug('브릿지 설정 안전 병합 시작', 'BRIDGE_SYSTEM_UTILS', {
      baseKeys: Object.keys(baseConfiguration).length,
      overrideKeys: Object.keys(overrideConfiguration).length,
    });

    const isValidBaseConfig =
      configurationValidator.validateConfigurationStructure(baseConfiguration);
    if (!isValidBaseConfig) {
      logWarn('기본 설정이 유효하지 않음, 기본값 생성', 'BRIDGE_SYSTEM_UTILS');
      const defaultConfig =
        configurationMerger.createDefaultBridgeConfiguration();
      return mergeBridgeConfigurationsSafely(
        defaultConfig,
        overrideConfiguration
      );
    }

    const isValidOverrideConfig =
      configurationValidator.validateConfigurationStructure(
        overrideConfiguration
      );
    if (!isValidOverrideConfig) {
      logWarn(
        '오버라이드 설정이 유효하지 않음, 기본 설정 반환',
        'BRIDGE_SYSTEM_UTILS'
      );
      return baseConfiguration;
    }

    const mergeResult =
      configurationMerger.mergeConfigurationsWithConflictDetection(
        baseConfiguration,
        overrideConfiguration
      );

    const { mergedConfiguration, mergeConflicts, appliedOverrides } =
      mergeResult;

    logInfo('브릿지 설정 안전 병합 완료', 'BRIDGE_SYSTEM_UTILS', {
      conflicts: mergeConflicts.length,
      overrides: appliedOverrides.length,
    });

    return mergedConfiguration;
  };

  const generateMarkdownFromDataSafely = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    logDebug('데이터에서 마크다운 안전 생성 시작', 'BRIDGE_SYSTEM_UTILS', {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
    });

    try {
      const generatedMarkdown =
        markdownGenerator.generateMarkdownFromContainersAndParagraphs(
          containers,
          paragraphs,
          {
            includeContainerHeaders: true,
            useOrderedContainers: true,
            skipEmptyContainers: true,
            headerLevel: 2,
            paragraphSeparator: '\n\n',
          }
        );

      logInfo('마크다운 안전 생성 완료', 'BRIDGE_SYSTEM_UTILS', {
        markdownLength: generatedMarkdown.length,
      });

      return generatedMarkdown;
    } catch (markdownGenerationError) {
      logError('마크다운 생성 중 오류 발생', 'BRIDGE_SYSTEM_UTILS', {
        error: markdownGenerationError,
      });
      return '';
    }
  };

  const parseMarkdownToStructureSafely = (
    markdownContent: string
  ): { containers: Container[]; paragraphs: ParagraphBlock[] } => {
    logDebug('마크다운에서 구조 안전 파싱 시작', 'BRIDGE_SYSTEM_UTILS', {
      contentLength: markdownContent.length,
    });

    try {
      const parseResult =
        markdownParser.parseMarkdownContentToStructure(markdownContent);
      const { containers, paragraphs, parseErrors, parseWarnings } =
        parseResult;

      const hasParseErrors = parseErrors.length > 0;
      if (hasParseErrors) {
        logWarn('마크다운 파싱 중 오류 발생', 'BRIDGE_SYSTEM_UTILS', {
          errors: parseErrors,
        });
      }

      const hasParseWarnings = parseWarnings.length > 0;
      if (hasParseWarnings) {
        logWarn('마크다운 파싱 중 경고 발생', 'BRIDGE_SYSTEM_UTILS', {
          warnings: parseWarnings,
        });
      }

      logInfo('마크다운 구조 안전 파싱 완료', 'BRIDGE_SYSTEM_UTILS', {
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
        errorCount: parseErrors.length,
        warningCount: parseWarnings.length,
      });

      return { containers, paragraphs };
    } catch (markdownParsingError) {
      logError('마크다운 파싱 중 오류 발생', 'BRIDGE_SYSTEM_UTILS', {
        error: markdownParsingError,
      });

      return { containers: [], paragraphs: [] };
    }
  };

  return {
    createBridgeOperationIdWithDefaults,
    validateBridgeConfigurationCompletely,
    mergeBridgeConfigurationsSafely,
    generateMarkdownFromDataSafely,
    parseMarkdownToStructureSafely,
  };
}

const bridgeSystemUtilityModule = createBridgeSystemUtilityModule();

export function createBridgeOperationId(): string {
  logDebug('브릿지 연산 ID 생성 요청', 'BRIDGE_SYSTEM_UTILS_EXPORT');

  return bridgeSystemUtilityModule.createBridgeOperationIdWithDefaults();
}

export function validateBridgeConfiguration(
  config: Partial<BridgeSystemConfiguration>
): boolean {
  logDebug('브릿지 설정 검증 요청', 'BRIDGE_SYSTEM_UTILS_EXPORT', {
    configKeys: Object.keys(config),
  });

  return bridgeSystemUtilityModule.validateBridgeConfigurationCompletely(
    config
  );
}

export function mergeBridgeConfigurations(
  baseConfiguration: BridgeSystemConfiguration,
  overrideConfiguration: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration {
  logDebug('브릿지 설정 병합 요청', 'BRIDGE_SYSTEM_UTILS_EXPORT', {
    baseKeys: Object.keys(baseConfiguration).length,
    overrideKeys: Object.keys(overrideConfiguration).length,
  });

  return bridgeSystemUtilityModule.mergeBridgeConfigurationsSafely(
    baseConfiguration,
    overrideConfiguration
  );
}

export function generateMarkdownFromData(
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string {
  logDebug('마크다운 생성 요청', 'BRIDGE_SYSTEM_UTILS_EXPORT', {
    containerCount: containers.length,
    paragraphCount: paragraphs.length,
  });

  return bridgeSystemUtilityModule.generateMarkdownFromDataSafely(
    containers,
    paragraphs
  );
}

export function parseMarkdownToStructure(markdownContent: string): {
  containers: Container[];
  paragraphs: ParagraphBlock[];
} {
  logDebug('마크다운 파싱 요청', 'BRIDGE_SYSTEM_UTILS_EXPORT', {
    contentLength: markdownContent.length,
  });

  return bridgeSystemUtilityModule.parseMarkdownToStructureSafely(
    markdownContent
  );
}

logInfo('브릿지 시스템 유틸리티 모듈 초기화 완료', 'BRIDGE_SYSTEM_UTILS', {
  exportedFunctions: [
    'createBridgeOperationId',
    'validateBridgeConfiguration',
    'mergeBridgeConfigurations',
    'generateMarkdownFromData',
    'parseMarkdownToStructure',
  ],
});
