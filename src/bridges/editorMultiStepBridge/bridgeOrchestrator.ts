// bridges/editorMultiStepBridge/bridgeOrchestrator.ts

import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  BridgeDataValidationResult,
  BridgeOperationErrorDetails,
} from './bridgeTypes';
import { createBridgeErrorManagementHandler } from './bridgeErrorHandler';
import { createBridgeDataValidationHandler } from './bridgeValidator';
import { createEditorToMultiStepDataTransformer } from './dataTransformer';
import { createEditorStateExtractor } from './editorStateExtractor';
import { createMultiStepStateUpdater } from './multiStepStateUpdater';

export const createEditorMultiStepBridgeOrchestrator = (
  customBridgeConfiguration?: Partial<BridgeSystemConfiguration>
) => {
  const defaultBridgeSystemConfiguration: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: false,
  };

  const {
    enableValidation = true,
    enableErrorRecovery = true,
    validationMode = 'strict',
    debugMode = false,
  } = { ...defaultBridgeSystemConfiguration, ...customBridgeConfiguration };

  const finalBridgeConfiguration: BridgeSystemConfiguration = {
    enableValidation,
    enableErrorRecovery,
    validationMode,
    debugMode,
  };

  const bridgeErrorManagementHandler = createBridgeErrorManagementHandler();
  const bridgeDataValidationHandler = createBridgeDataValidationHandler();
  const editorToMultiStepDataTransformer =
    createEditorToMultiStepDataTransformer();
  const editorStateExtractorHandler = createEditorStateExtractor();
  const multiStepStateUpdaterHandler = createMultiStepStateUpdater();

  const {
    createBridgeErrorDetails: createStandardizedBridgeErrorDetails,
    logErrorDetails: logStructuredErrorDetails,
    createRecoveryStrategy: formulateErrorRecoveryStrategy,
  } = bridgeErrorManagementHandler;

  const {
    validateEditorStateForTransfer: performComprehensiveEditorStateValidation,
  } = bridgeDataValidationHandler;

  const {
    transformEditorStateToMultiStep:
      performCompleteEditorToMultiStepTransformation,
  } = editorToMultiStepDataTransformer;

  const { getEditorStateWithValidation: getValidatedEditorStateSnapshot } =
    editorStateExtractorHandler;

  const { performCompleteStateUpdate: executeCompleteMultiStepStateUpdate } =
    multiStepStateUpdaterHandler;

  let preconditionCache = {
    result: false,
    timestamp: 0,
    cacheTimeout: 1000,
  };

  const executeBridgeDataTransferOperation =
    async (): Promise<BridgeOperationExecutionResult> => {
      const operationStartTimestamp = performance.now();
      const operationErrorsList: BridgeOperationErrorDetails[] = [];
      const operationWarningsList: string[] = [];
      let transferredDataResult: EditorToMultiStepDataTransformationResult | null =
        null;

      try {
        const extractedEditorStateSnapshot = getValidatedEditorStateSnapshot();

        if (!extractedEditorStateSnapshot) {
          const extractionErrorDetails = createStandardizedBridgeErrorDetails(
            new Error('에디터 상태 추출 실패'),
            'EXTRACTION'
          );
          logStructuredErrorDetails(extractionErrorDetails);
          operationErrorsList.push(extractionErrorDetails);

          const operationEndTimestamp = performance.now();
          const totalOperationDuration =
            operationEndTimestamp - operationStartTimestamp;

          return {
            operationSuccess: false,
            operationErrors: operationErrorsList,
            operationWarnings: operationWarningsList,
            transferredData: null,
            operationDuration: totalOperationDuration,
          };
        }

        if (enableValidation) {
          const validationResultData =
            performComprehensiveEditorStateValidation(
              extractedEditorStateSnapshot
            );

          const {
            isValidForTransfer: isDataValidForTransfer,
            validationErrors: criticalValidationErrors,
            validationWarnings: nonCriticalValidationWarnings,
          } = validationResultData;

          if (nonCriticalValidationWarnings.length > 0) {
            operationWarningsList.push(...nonCriticalValidationWarnings);
          }

          if (!isDataValidForTransfer) {
            for (const singleValidationError of criticalValidationErrors) {
              const validationErrorDetails =
                createStandardizedBridgeErrorDetails(
                  new Error(singleValidationError),
                  'VALIDATION'
                );
              logStructuredErrorDetails(validationErrorDetails);
              operationErrorsList.push(validationErrorDetails);
            }

            const operationEndTimestamp = performance.now();
            const totalOperationDuration =
              operationEndTimestamp - operationStartTimestamp;

            return {
              operationSuccess: false,
              operationErrors: operationErrorsList,
              operationWarnings: operationWarningsList,
              transferredData: null,
              operationDuration: totalOperationDuration,
            };
          }
        }

        const transformationResultData =
          performCompleteEditorToMultiStepTransformation(
            extractedEditorStateSnapshot
          );

        const {
          transformationSuccess: wasTransformationSuccessful,
          transformationErrors: transformationErrorMessages,
        } = transformationResultData;

        if (!wasTransformationSuccessful) {
          for (const singleTransformationError of transformationErrorMessages) {
            const transformationErrorDetails =
              createStandardizedBridgeErrorDetails(
                new Error(singleTransformationError),
                'TRANSFORMATION'
              );
            logStructuredErrorDetails(transformationErrorDetails);
            operationErrorsList.push(transformationErrorDetails);
          }

          const operationEndTimestamp = performance.now();
          const totalOperationDuration =
            operationEndTimestamp - operationStartTimestamp;

          return {
            operationSuccess: false,
            operationErrors: operationErrorsList,
            operationWarnings: operationWarningsList,
            transferredData: null,
            operationDuration: totalOperationDuration,
          };
        }

        transferredDataResult = transformationResultData;

        const stateUpdateSuccessful = await executeCompleteMultiStepStateUpdate(
          transformationResultData
        );

        if (!stateUpdateSuccessful) {
          const updateErrorDetails = createStandardizedBridgeErrorDetails(
            new Error('멀티스텝 상태 업데이트 실패'),
            'UPDATE'
          );
          logStructuredErrorDetails(updateErrorDetails);
          operationErrorsList.push(updateErrorDetails);

          const operationEndTimestamp = performance.now();
          const totalOperationDuration =
            operationEndTimestamp - operationStartTimestamp;

          return {
            operationSuccess: false,
            operationErrors: operationErrorsList,
            operationWarnings: operationWarningsList,
            transferredData: transferredDataResult,
            operationDuration: totalOperationDuration,
          };
        }

        const operationEndTimestamp = performance.now();
        const totalOperationDuration =
          operationEndTimestamp - operationStartTimestamp;

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: operationWarningsList,
          transferredData: transferredDataResult,
          operationDuration: totalOperationDuration,
        };
      } catch (unexpectedBridgeError) {
        const unexpectedErrorDetails = createStandardizedBridgeErrorDetails(
          unexpectedBridgeError,
          'GENERAL'
        );
        logStructuredErrorDetails(unexpectedErrorDetails);
        operationErrorsList.push(unexpectedErrorDetails);

        if (enableErrorRecovery) {
          const recoveryStrategies = formulateErrorRecoveryStrategy(
            unexpectedErrorDetails
          );
          operationWarningsList.push(
            `복구 전략 제안: ${recoveryStrategies.join(', ')}`
          );
        }

        const operationEndTimestamp = performance.now();
        const totalOperationDuration =
          operationEndTimestamp - operationStartTimestamp;

        return {
          operationSuccess: false,
          operationErrors: operationErrorsList,
          operationWarnings: operationWarningsList,
          transferredData: transferredDataResult,
          operationDuration: totalOperationDuration,
        };
      }
    };

  const checkBridgeTransferPreconditions = (): boolean => {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - preconditionCache.timestamp;

    if (timeSinceLastCheck < preconditionCache.cacheTimeout) {
      return preconditionCache.result;
    }

    try {
      const currentEditorStateSnapshot = getValidatedEditorStateSnapshot();

      if (!currentEditorStateSnapshot) {
        if (debugMode) {
          console.warn('⚠️ [BRIDGE_ORCHESTRATOR] 사전 검증 실패');
        }
        preconditionCache = {
          result: false,
          timestamp: currentTime,
          cacheTimeout: 1000,
        };
        return false;
      }

      if (enableValidation) {
        const preValidationResult = performComprehensiveEditorStateValidation(
          currentEditorStateSnapshot
        );
        const { isValidForTransfer: preCheckValidForTransfer } =
          preValidationResult;

        if (!preCheckValidForTransfer) {
          if (debugMode) {
            console.warn('⚠️ [BRIDGE_ORCHESTRATOR] 사전 검증 실패');
          }
          preconditionCache = {
            result: false,
            timestamp: currentTime,
            cacheTimeout: 1000,
          };
          return false;
        }
      }

      preconditionCache = {
        result: true,
        timestamp: currentTime,
        cacheTimeout: 1000,
      };
      return true;
    } catch (preconditionError) {
      if (debugMode) {
        console.error(
          '❌ [BRIDGE_ORCHESTRATOR] 사전 조건 확인 중 오류:',
          preconditionError
        );
      }
      preconditionCache = {
        result: false,
        timestamp: currentTime,
        cacheTimeout: 2000,
      };
      return false;
    }
  };

  const getBridgeSystemConfiguration = (): BridgeSystemConfiguration => {
    return finalBridgeConfiguration;
  };

  const triggerManualBridgeTransfer =
    async (): Promise<BridgeOperationExecutionResult> => {
      return await executeBridgeDataTransferOperation();
    };

  return {
    executeBridgeTransfer: executeBridgeDataTransferOperation,
    checkTransferPreconditions: checkBridgeTransferPreconditions,
    getConfiguration: getBridgeSystemConfiguration,
    triggerManualTransfer: triggerManualBridgeTransfer,
  };
};
