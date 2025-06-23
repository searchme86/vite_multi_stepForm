// bridges/editorMultiStepBridge/bidirectionalBridgeOrchestrator.ts

import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
} from './bridgeDataTypes';
import { bridgeConfigManager } from './bridgeConfiguration';
import { createEditorStateExtractor } from './editorDataExtractor';
import { createDataStructureTransformer } from './editorToMultiStepTransformer';
import { createMultiStepStateUpdater } from './multiStepDataUpdater';
import { createBridgeDataValidationHandler } from './bridgeDataValidator';
import { createBridgeErrorHandler } from './bridgeErrorManager';

export const createEditorMultiStepBridgeOrchestrator = (
  customConfig?: Partial<BridgeSystemConfiguration>
) => {
  const config = customConfig
    ? { ...bridgeConfigManager.createSimple(), ...customConfig }
    : bridgeConfigManager.createSimple();

  const extractor = createEditorStateExtractor();
  const transformer = createDataStructureTransformer();
  const updater = createMultiStepStateUpdater();
  const validator = createBridgeDataValidationHandler();
  const errorHandler = createBridgeErrorHandler();

  const checkTransferPreconditions = (): boolean => {
    try {
      const editorState = extractor.getEditorStateWithValidation();
      if (!editorState) {
        return false;
      }

      const validation = validator.validateForTransfer(editorState);
      return validation.isValidForTransfer;
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] 사전 조건 체크 실패:', error);
      return false;
    }
  };

  const executeBridgeTransfer =
    async (): Promise<BridgeOperationExecutionResult> => {
      const startTime = performance.now();
      console.log('🚀 [ORCHESTRATOR] Bridge 전송 시작');

      try {
        const editorState = extractor.getEditorStateWithValidation();
        if (!editorState) {
          throw new Error('Editor 상태 추출 실패');
        }

        const validation = validator.validateForTransfer(editorState);
        if (!validation.isValidForTransfer) {
          throw new Error(
            `검증 실패: ${validation.validationErrors.join(', ')}`
          );
        }

        const transformResult =
          transformer.transformEditorStateToMultiStep(editorState);
        if (!transformResult.transformationSuccess) {
          throw new Error(
            `변환 실패: ${transformResult.transformationErrors.join(', ')}`
          );
        }

        const updateSuccess = await updater.performCompleteStateUpdate(
          transformResult
        );
        if (!updateSuccess) {
          throw new Error('MultiStep 상태 업데이트 실패');
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log('✅ [ORCHESTRATOR] Bridge 전송 완료');

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: validation.validationWarnings,
          transferredData: transformResult,
          operationDuration: duration,
        };
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.error('❌ [ORCHESTRATOR] Bridge 전송 실패:', error);

        const errorDetails = errorHandler.handleTransferError(error);

        return {
          operationSuccess: false,
          operationErrors: [errorDetails],
          operationWarnings: [],
          transferredData: null,
          operationDuration: duration,
        };
      }
    };

  const getConfiguration = (): BridgeSystemConfiguration => {
    return config;
  };

  return {
    executeBridgeTransfer,
    checkTransferPreconditions,
    getConfiguration,
  };
};
