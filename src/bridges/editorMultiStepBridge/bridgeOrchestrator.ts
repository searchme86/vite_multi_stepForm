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
  console.log('🌉 [BRIDGE_ORCHESTRATOR] 브릿지 오케스트레이터 생성 시작');

  const defaultBridgeSystemConfiguration: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: true,
  };

  const {
    enableValidation = true,
    enableErrorRecovery = true,
    validationMode = 'strict',
    debugMode = true,
  } = { ...defaultBridgeSystemConfiguration, ...customBridgeConfiguration };

  const finalBridgeConfiguration: BridgeSystemConfiguration = {
    enableValidation,
    enableErrorRecovery,
    validationMode,
    debugMode,
  };

  console.log(
    '🔧 [BRIDGE_ORCHESTRATOR] 브릿지 설정 적용:',
    finalBridgeConfiguration
  );

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

  const executeBridgeDataTransferOperation =
    async (): Promise<BridgeOperationExecutionResult> => {
      console.log('🚀 [BRIDGE_ORCHESTRATOR] 브릿지 데이터 전송 작업 시작');

      const operationStartTimestamp = performance.now();
      const operationErrorsList: BridgeOperationErrorDetails[] = [];
      const operationWarningsList: string[] = [];
      let transferredDataResult: EditorToMultiStepDataTransformationResult | null =
        null;

      try {
        console.log('📤 [BRIDGE_ORCHESTRATOR] 1단계: 에디터 상태 추출');
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

        console.log('✅ [BRIDGE_ORCHESTRATOR] 에디터 상태 추출 성공');

        if (enableValidation) {
          console.log('🔍 [BRIDGE_ORCHESTRATOR] 2단계: 데이터 검증');
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
            console.warn(
              '⚠️ [BRIDGE_ORCHESTRATOR] 검증 경고 발견:',
              nonCriticalValidationWarnings
            );
          }

          if (!isDataValidForTransfer) {
            console.error(
              '❌ [BRIDGE_ORCHESTRATOR] 데이터 검증 실패:',
              criticalValidationErrors
            );

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

          console.log('✅ [BRIDGE_ORCHESTRATOR] 데이터 검증 통과');
        }

        console.log('🔄 [BRIDGE_ORCHESTRATOR] 3단계: 데이터 변환');
        const transformationResultData =
          performCompleteEditorToMultiStepTransformation(
            extractedEditorStateSnapshot
          );

        const {
          transformationSuccess: wasTransformationSuccessful,
          transformationErrors: transformationErrorMessages,
        } = transformationResultData;

        if (!wasTransformationSuccessful) {
          console.error(
            '❌ [BRIDGE_ORCHESTRATOR] 데이터 변환 실패:',
            transformationErrorMessages
          );

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

        console.log('✅ [BRIDGE_ORCHESTRATOR] 데이터 변환 성공');
        transferredDataResult = transformationResultData;

        console.log('💾 [BRIDGE_ORCHESTRATOR] 4단계: 멀티스텝 상태 업데이트');
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

        console.log('✅ [BRIDGE_ORCHESTRATOR] 멀티스텝 상태 업데이트 성공');

        const operationEndTimestamp = performance.now();
        const totalOperationDuration =
          operationEndTimestamp - operationStartTimestamp;

        console.log('🎉 [BRIDGE_ORCHESTRATOR] 브릿지 작업 완료 성공');

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: operationWarningsList,
          transferredData: transferredDataResult,
          operationDuration: totalOperationDuration,
        };
      } catch (unexpectedBridgeError) {
        console.error(
          '💥 [BRIDGE_ORCHESTRATOR] 예상치 못한 브릿지 오류:',
          unexpectedBridgeError
        );

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
          console.log(
            '🔧 [BRIDGE_ORCHESTRATOR] 복구 전략 제안:',
            recoveryStrategies
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
    console.log('🔍 [BRIDGE_ORCHESTRATOR] 브릿지 전송 사전 조건 확인');

    try {
      const currentEditorStateSnapshot = getValidatedEditorStateSnapshot();

      if (!currentEditorStateSnapshot) {
        console.warn('⚠️ [BRIDGE_ORCHESTRATOR] 유효한 에디터 상태가 없음');
        return false;
      }

      if (enableValidation) {
        const preValidationResult = performComprehensiveEditorStateValidation(
          currentEditorStateSnapshot
        );
        const { isValidForTransfer: preCheckValidForTransfer } =
          preValidationResult;

        if (!preCheckValidForTransfer) {
          console.warn('⚠️ [BRIDGE_ORCHESTRATOR] 사전 검증 실패');
          return false;
        }
      }

      console.log('✅ [BRIDGE_ORCHESTRATOR] 사전 조건 모두 충족');
      return true;
    } catch (preconditionError) {
      console.error(
        '❌ [BRIDGE_ORCHESTRATOR] 사전 조건 확인 중 오류:',
        preconditionError
      );
      return false;
    }
  };

  const getBridgeSystemConfiguration = (): BridgeSystemConfiguration => {
    return finalBridgeConfiguration;
  };

  const triggerManualBridgeTransfer =
    async (): Promise<BridgeOperationExecutionResult> => {
      console.log('🔧 [BRIDGE_ORCHESTRATOR] 수동 브릿지 전송 트리거');
      return await executeBridgeDataTransferOperation();
    };

  console.log('✅ [BRIDGE_ORCHESTRATOR] 브릿지 오케스트레이터 생성 완료');

  return {
    executeBridgeTransfer: executeBridgeDataTransferOperation,
    checkTransferPreconditions: checkBridgeTransferPreconditions,
    getConfiguration: getBridgeSystemConfiguration,
    triggerManualTransfer: triggerManualBridgeTransfer,
  };
};
