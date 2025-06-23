// bridges/editorMultiStepBridge/bridgeErrorManager.ts

import { BridgeOperationErrorDetails } from './bridgeDataTypes';

export const createBridgeErrorHandler = () => {
  const createBridgeErrorDetails = (
    error: unknown,
    context: string = 'UNKNOWN'
  ): BridgeOperationErrorDetails => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = `BRIDGE_${context}_${Date.now()}`;

    return {
      errorCode,
      errorMessage,
      errorTimestamp: new Date(),
      errorContext: { context, originalError: error },
      isRecoverable: true,
    };
  };

  const handleTransferError = (error: unknown): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 전송 오류 처리');
    return createBridgeErrorDetails(error, 'TRANSFER');
  };

  const handleValidationError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 검증 오류 처리');
    return createBridgeErrorDetails(error, 'VALIDATION');
  };

  const handleExtractionError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 추출 오류 처리');
    return createBridgeErrorDetails(error, 'EXTRACTION');
  };

  const handleTransformationError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 변환 오류 처리');
    return createBridgeErrorDetails(error, 'TRANSFORMATION');
  };

  const handleUpdateError = (error: unknown): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 업데이트 오류 처리');
    return createBridgeErrorDetails(error, 'UPDATE');
  };

  const handleReverseTransferError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 역방향 전송 오류 처리');
    return createBridgeErrorDetails(error, 'REVERSE_TRANSFER');
  };

  const handleBidirectionalSyncError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 양방향 동기화 오류 처리');
    return createBridgeErrorDetails(error, 'BIDIRECTIONAL_SYNC');
  };

  return {
    createBridgeErrorDetails,
    handleTransferError,
    handleValidationError,
    handleExtractionError,
    handleTransformationError,
    handleUpdateError,
    handleReverseTransferError,
    handleBidirectionalSyncError,
  };
};
