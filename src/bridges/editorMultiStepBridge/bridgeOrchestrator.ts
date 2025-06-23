// bridges/editorMultiStepBridge/bridgeOrchestrator.ts

import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  EditorToMultiStepDataTransformationResult,
  BridgeOperationErrorDetails,
} from './bridgeTypes';
import { createBridgeErrorManagementHandler } from './bridgeErrorHandler';
import { createBridgeDataValidationHandler } from './bridgeValidator';
import { createEditorToMultiStepDataTransformer } from './dataTransformer';
import { createEditorStateExtractor } from './editorStateExtractor';
import { createMultiStepStateUpdater } from './multiStepStateUpdater';
import { VALIDATION_CRITERIA } from './bridgeConfig';

export const createEditorMultiStepBridgeOrchestrator = (
  customConfig?: Partial<BridgeSystemConfiguration>
) => {
  const defaultConfig: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: false,
  };

  const config = { ...defaultConfig, ...customConfig };

  // 핸들러들 생성
  const errorHandler = createBridgeErrorManagementHandler();
  const validator = createBridgeDataValidationHandler();
  const transformer = createEditorToMultiStepDataTransformer();
  const extractor = createEditorStateExtractor();
  const updater = createMultiStepStateUpdater();

  // 사전 조건 캐시
  let preconditionCache = {
    result: false,
    timestamp: 0,
  };

  const executeBridgeTransfer =
    async (): Promise<BridgeOperationExecutionResult> => {
      const startTime = performance.now();
      const errors: BridgeOperationErrorDetails[] = [];
      const warnings: string[] = [];
      let transferredData: EditorToMultiStepDataTransformationResult | null =
        null;

      try {
        console.log('🚀 [ORCHESTRATOR] 브릿지 전송 시작');

        // 1. 에디터 상태 추출
        const editorState = extractor.getEditorStateWithValidation();
        if (!editorState) {
          const error = errorHandler.createBridgeErrorDetails(
            new Error('에디터 상태 추출 실패'),
            'EXTRACTION'
          );
          errors.push(error);

          return {
            operationSuccess: false,
            operationErrors: errors,
            operationWarnings: warnings,
            transferredData: null,
            operationDuration: performance.now() - startTime,
          };
        }

        // 2. 검증 (설정에 따라)
        if (config.enableValidation) {
          const validationResult = validator.validateForTransfer(editorState);

          if (validationResult.validationWarnings.length > 0) {
            warnings.push(...validationResult.validationWarnings);
          }

          if (!validationResult.isValidForTransfer) {
            for (const errorMessage of validationResult.validationErrors) {
              const error = errorHandler.createBridgeErrorDetails(
                new Error(errorMessage),
                'VALIDATION'
              );
              errors.push(error);
            }

            return {
              operationSuccess: false,
              operationErrors: errors,
              operationWarnings: warnings,
              transferredData: null,
              operationDuration: performance.now() - startTime,
            };
          }
        }

        // 3. 데이터 변환
        const transformResult =
          transformer.transformEditorStateToMultiStep(editorState);

        if (!transformResult.transformationSuccess) {
          for (const errorMessage of transformResult.transformationErrors) {
            const error = errorHandler.createBridgeErrorDetails(
              new Error(errorMessage),
              'TRANSFORMATION'
            );
            errors.push(error);
          }

          return {
            operationSuccess: false,
            operationErrors: errors,
            operationWarnings: warnings,
            transferredData: null,
            operationDuration: performance.now() - startTime,
          };
        }

        transferredData = transformResult;

        // 4. 상태 업데이트
        const updateSuccess = await updater.performCompleteStateUpdate(
          transformResult
        );

        if (!updateSuccess) {
          const error = errorHandler.createBridgeErrorDetails(
            new Error('멀티스텝 상태 업데이트 실패'),
            'UPDATE'
          );
          errors.push(error);

          return {
            operationSuccess: false,
            operationErrors: errors,
            operationWarnings: warnings,
            transferredData: transferredData,
            operationDuration: performance.now() - startTime,
          };
        }

        console.log('✅ [ORCHESTRATOR] 브릿지 전송 성공');

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: warnings,
          transferredData: transferredData,
          operationDuration: performance.now() - startTime,
        };
      } catch (error) {
        console.error('❌ [ORCHESTRATOR] 브릿지 전송 중 예외:', error);

        const errorDetail = errorHandler.createBridgeErrorDetails(
          error,
          'GENERAL'
        );
        errors.push(errorDetail);

        if (config.enableErrorRecovery) {
          const recoverySteps =
            errorHandler.createRecoveryStrategy(errorDetail);
          warnings.push(`복구 제안: ${recoverySteps.join(', ')}`);
        }

        return {
          operationSuccess: false,
          operationErrors: errors,
          operationWarnings: warnings,
          transferredData: transferredData,
          operationDuration: performance.now() - startTime,
        };
      }
    };

  const checkTransferPreconditions = (): boolean => {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - preconditionCache.timestamp;

    // 캐시 사용
    if (timeSinceLastCheck < VALIDATION_CRITERIA.cacheDuration) {
      return preconditionCache.result;
    }

    try {
      const editorState = extractor.getEditorStateWithValidation();

      if (!editorState) {
        if (config.debugMode) {
          console.warn('⚠️ [ORCHESTRATOR] 에디터 상태 없음');
        }
        preconditionCache = { result: false, timestamp: currentTime };
        return false;
      }

      if (config.enableValidation) {
        const validationResult = validator.validateForTransfer(editorState);

        if (!validationResult.isValidForTransfer) {
          if (config.debugMode) {
            console.warn('⚠️ [ORCHESTRATOR] 검증 실패');
          }
          preconditionCache = { result: false, timestamp: currentTime };
          return false;
        }
      }

      preconditionCache = { result: true, timestamp: currentTime };
      return true;
    } catch (error) {
      if (config.debugMode) {
        console.error('❌ [ORCHESTRATOR] 사전 조건 확인 실패:', error);
      }
      preconditionCache = { result: false, timestamp: currentTime };
      return false;
    }
  };

  const getConfiguration = (): BridgeSystemConfiguration => config;

  return {
    executeBridgeTransfer,
    checkTransferPreconditions,
    getConfiguration,
    triggerManualTransfer: executeBridgeTransfer,
  };
};
