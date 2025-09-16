// src/components/multiStepForm/utils/bridgeIntegration.ts

import { useCallback, useEffect, useRef } from 'react';
import { useBridge } from '../../../bridges/hooks/useBridge';
import { useBridgeUI } from '../../../bridges/hooks/useBridgeUI';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import type { StepNumber } from '../types/stepTypes';

// 🔧 Bridge 연결 설정 인터페이스
interface BridgeIntegrationConfig {
  readonly enableAutoTransfer: boolean;
  readonly enableStepTransition: boolean;
  readonly enableErrorHandling: boolean;
  readonly enableProgressSync: boolean;
  readonly enableValidationSync: boolean;
  readonly debugMode: boolean;
  readonly autoTransferStep: StepNumber;
  readonly targetStepAfterTransfer: StepNumber;
}

// 🔧 Bridge 연결 상태 인터페이스
interface BridgeIntegrationState {
  readonly isConnected: boolean;
  readonly isTransferring: boolean;
  readonly lastTransferTime: number | null;
  readonly transferCount: number;
  readonly errorCount: number;
  readonly lastErrorMessage: string;
}

// 🔧 Bridge 작업 결과 인터페이스
interface BridgeTransferResult {
  readonly success: boolean;
  readonly content: string;
  readonly isCompleted: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly duration: number;
  readonly timestamp: number;
}

// 🔧 Form 업데이트 데이터 인터페이스
interface FormUpdateData {
  readonly editorCompletedContent: string;
  readonly isEditorCompleted: boolean;
  readonly transferTimestamp: number;
  readonly transferSuccess: boolean;
}

// 🔧 안전한 타입 변환 유틸리티
const createSafeConverters = () => {
  const convertToSafeString = (
    value: unknown,
    fallback: string = ''
  ): string => {
    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return fallback;
    }

    try {
      return String(value);
    } catch (conversionError) {
      console.warn(
        '⚠️ [BRIDGE_INTEGRATION] 문자열 변환 실패:',
        conversionError
      );
      return fallback;
    }
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallback: boolean = false
  ): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true'
        ? true
        : lowerValue === 'false'
        ? false
        : fallback;
    }

    return fallback;
  };

  const convertToSafeNumber = (
    value: unknown,
    fallback: number = 0
  ): number => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsedValue = parseInt(value, 10);
      return !Number.isNaN(parsedValue) ? parsedValue : fallback;
    }

    return fallback;
  };

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeNumber,
  };
};

// 🔧 Bridge 연결 매니저 생성 함수
export const createBridgeIntegrationManager = () => {
  const safeConverters = createSafeConverters();

  // 🔧 기본 설정 생성
  const createDefaultConfig = (): BridgeIntegrationConfig => {
    console.log('🔧 [BRIDGE_INTEGRATION] 기본 설정 생성');

    return {
      enableAutoTransfer: true,
      enableStepTransition: true,
      enableErrorHandling: true,
      enableProgressSync: true,
      enableValidationSync: true,
      debugMode: false,
      autoTransferStep: 4,
      targetStepAfterTransfer: 5,
    };
  };

  // 🔧 초기 상태 생성
  const createInitialState = (): BridgeIntegrationState => {
    console.log('🔧 [BRIDGE_INTEGRATION] 초기 상태 생성');

    return {
      isConnected: false,
      isTransferring: false,
      lastTransferTime: null,
      transferCount: 0,
      errorCount: 0,
      lastErrorMessage: '',
    };
  };

  // 🔧 Bridge 결과 타입 가드
  const isBridgeTransferResult = (
    data: unknown
  ): data is BridgeTransferResult => {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const result = data;
    const hasSuccess = 'success' in result;
    const hasContent = 'content' in result;
    const hasIsCompleted = 'isCompleted' in result;

    if (!hasSuccess || !hasContent || !hasIsCompleted) {
      return false;
    }

    const successValue = Reflect.get(result, 'success');
    const contentValue = Reflect.get(result, 'content');
    const isCompletedValue = Reflect.get(result, 'isCompleted');

    return (
      typeof successValue === 'boolean' &&
      typeof contentValue === 'string' &&
      typeof isCompletedValue === 'boolean'
    );
  };

  // 🔧 안전한 에러 메시지 추출
  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message.length > 0 ? error.message : '알 수 없는 에러';
    }

    if (typeof error === 'string') {
      return error.length > 0 ? error : '빈 에러 메시지';
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorObject = error;
      const messageValue = Reflect.get(errorObject, 'message');
      return typeof messageValue === 'string'
        ? messageValue
        : '알 수 없는 에러';
    }

    return '브릿지 연결 에러';
  };

  // 🔧 Form 데이터 변환 함수
  const convertBridgeResultToFormData = (
    result: BridgeTransferResult
  ): FormUpdateData => {
    console.log('🔄 [BRIDGE_INTEGRATION] Bridge 결과를 Form 데이터로 변환', {
      success: result.success,
      contentLength: result.content.length,
      isCompleted: result.isCompleted,
    });

    const { success, content, isCompleted } = result;

    const safeContent = safeConverters.convertToSafeString(content);
    const safeIsCompleted = safeConverters.convertToSafeBoolean(isCompleted);
    const safeSuccess = safeConverters.convertToSafeBoolean(success);

    return {
      editorCompletedContent: safeContent,
      isEditorCompleted: safeIsCompleted,
      transferTimestamp: Date.now(),
      transferSuccess: safeSuccess,
    };
  };

  return {
    createDefaultConfig,
    createInitialState,
    isBridgeTransferResult,
    extractErrorMessage,
    convertBridgeResultToFormData,
    safeConverters,
  };
};

// 🔧 Bridge 연결 훅 생성
export const useBridgeIntegration = (
  config?: Partial<BridgeIntegrationConfig>
) => {
  const integrationManager = createBridgeIntegrationManager();

  // 🔧 설정 병합
  const defaultConfig = integrationManager.createDefaultConfig();
  const finalConfig: BridgeIntegrationConfig = { ...defaultConfig, ...config };

  // 🔧 상태 관리
  const stateRef = useRef(integrationManager.createInitialState());
  const lastProcessedResultRef = useRef<unknown>(null);

  // 🔧 MultiStep Form Store 연결
  const { updateFormValue, addToast } = useMultiStepFormStore();

  // 🔧 Bridge 시스템 설정
  const bridgeConfig = {
    enableValidation: finalConfig.enableValidationSync,
    enableErrorRecovery: finalConfig.enableErrorHandling,
    debugMode: finalConfig.debugMode,
    maxRetryAttempts: 3,
    timeoutMs: 15000,
    performanceLogging: finalConfig.debugMode,
    strictTypeChecking: true,
  };

  // 🔧 Bridge 훅들 사용
  const bridgeHook = useBridge(bridgeConfig);
  const bridgeUIHook = useBridgeUI(bridgeConfig);

  // 🔧 Bridge 상태 추출
  const {
    isExecuting: bridgeIsExecuting,
    lastResult: bridgeLastResult,
    errorMessage: bridgeErrorMessage,
    canExecuteForward: bridgeCanExecuteForward,
    executeForwardTransfer: bridgeExecuteForward,
  } = bridgeHook;

  const {
    isLoading: uiIsLoading,
    canExecuteAction: uiCanExecute,
    handleForwardTransfer: uiHandleForward,
    editorStatistics: uiEditorStats,
    validationState: uiValidationState,
    statusMessage: uiStatusMessage,
  } = bridgeUIHook;

  console.log('🔧 [BRIDGE_INTEGRATION] Bridge 상태 확인', {
    bridgeIsExecuting,
    uiIsLoading,
    bridgeCanExecuteForward,
    uiCanExecute,
    hasLastResult: !!bridgeLastResult,
    hasErrorMessage: !!bridgeErrorMessage,
  });

  // 🔧 연결 상태 업데이트
  const updateConnectionState = useCallback(
    (updates: Partial<BridgeIntegrationState>) => {
      const currentState = stateRef.current;
      stateRef.current = { ...currentState, ...updates };

      if (finalConfig.debugMode) {
        console.log('📊 [BRIDGE_INTEGRATION] 연결 상태 업데이트', {
          previousState: currentState,
          updates,
          newState: stateRef.current,
        });
      }
    },
    [finalConfig.debugMode]
  );

  // 🔧 Form 데이터 업데이트 함수
  const updateFormWithBridgeData = useCallback(
    (formData: FormUpdateData) => {
      console.log('📝 [BRIDGE_INTEGRATION] Form 데이터 업데이트 시작', {
        contentLength: formData.editorCompletedContent.length,
        isCompleted: formData.isEditorCompleted,
        transferSuccess: formData.transferSuccess,
      });

      try {
        // 🔧 Form 값들 개별 업데이트
        updateFormValue(
          'editorCompletedContent',
          formData.editorCompletedContent
        );
        updateFormValue('isEditorCompleted', formData.isEditorCompleted);

        // 🔧 성공 토스트 추가
        if (formData.transferSuccess && finalConfig.enableErrorHandling) {
          addToast({
            title: '브릿지 전송 성공',
            description: `${formData.editorCompletedContent.length}자의 콘텐츠가 성공적으로 전송되었습니다.`,
            color: 'success',
          });
        }

        console.log('✅ [BRIDGE_INTEGRATION] Form 데이터 업데이트 완료');
      } catch (updateError) {
        const errorMessage =
          integrationManager.extractErrorMessage(updateError);
        console.error(
          '❌ [BRIDGE_INTEGRATION] Form 데이터 업데이트 실패:',
          errorMessage
        );

        if (finalConfig.enableErrorHandling) {
          addToast({
            title: '데이터 업데이트 실패',
            description: errorMessage,
            color: 'danger',
          });
        }

        updateConnectionState({
          errorCount: stateRef.current.errorCount + 1,
          lastErrorMessage: errorMessage,
        });
      }
    },
    [
      updateFormValue,
      addToast,
      finalConfig.enableErrorHandling,
      integrationManager,
      updateConnectionState,
    ]
  );

  // 🔧 Bridge 결과 처리
  const processBridgeResult = useCallback(
    (result: unknown) => {
      if (!result || result === lastProcessedResultRef.current) {
        return;
      }

      lastProcessedResultRef.current = result;

      console.log('🔄 [BRIDGE_INTEGRATION] Bridge 결과 처리 시작', {
        resultType: typeof result,
        hasResult: !!result,
      });

      // 🔧 새로운 useBridge 훅 형식 처리
      if (result && typeof result === 'object' && 'success' in result) {
        const bridgeResult = result;
        const successValue = Reflect.get(bridgeResult, 'success');
        const dataValue = Reflect.get(bridgeResult, 'data');

        if (typeof successValue === 'boolean' && successValue && dataValue) {
          const contentValue = Reflect.get(dataValue, 'content');
          const isCompletedValue = Reflect.get(dataValue, 'isCompleted');

          const transferResult: BridgeTransferResult = {
            success: true,
            content:
              integrationManager.safeConverters.convertToSafeString(
                contentValue
              ),
            isCompleted:
              integrationManager.safeConverters.convertToSafeBoolean(
                isCompletedValue
              ),
            errors: [],
            warnings: [],
            duration: 0,
            timestamp: Date.now(),
          };

          const formData =
            integrationManager.convertBridgeResultToFormData(transferResult);
          updateFormWithBridgeData(formData);

          updateConnectionState({
            transferCount: stateRef.current.transferCount + 1,
            lastTransferTime: Date.now(),
            isTransferring: false,
          });

          console.log('✅ [BRIDGE_INTEGRATION] Bridge 결과 처리 성공');
          return;
        }
      }

      // 🔧 기존 형식 처리 (호환성)
      if (integrationManager.isBridgeTransferResult(result)) {
        const formData =
          integrationManager.convertBridgeResultToFormData(result);
        updateFormWithBridgeData(formData);

        updateConnectionState({
          transferCount: stateRef.current.transferCount + 1,
          lastTransferTime: Date.now(),
          isTransferring: false,
        });

        console.log('✅ [BRIDGE_INTEGRATION] 기존 형식 Bridge 결과 처리 성공');
        return;
      }

      console.warn('⚠️ [BRIDGE_INTEGRATION] 알 수 없는 Bridge 결과 형식', {
        resultType: typeof result,
        resultKeys:
          result && typeof result === 'object' ? Object.keys(result) : [],
      });
    },
    [integrationManager, updateFormWithBridgeData, updateConnectionState]
  );

  // 🔧 Bridge 결과 감지
  useEffect(() => {
    if (bridgeLastResult) {
      processBridgeResult(bridgeLastResult);
    }
  }, [bridgeLastResult, processBridgeResult]);

  // 🔧 에러 처리
  useEffect(() => {
    if (bridgeErrorMessage && finalConfig.enableErrorHandling) {
      console.error(
        '❌ [BRIDGE_INTEGRATION] Bridge 에러 감지:',
        bridgeErrorMessage
      );

      addToast({
        title: '브릿지 전송 오류',
        description: bridgeErrorMessage,
        color: 'danger',
      });

      updateConnectionState({
        errorCount: stateRef.current.errorCount + 1,
        lastErrorMessage: bridgeErrorMessage,
        isTransferring: false,
      });
    }
  }, [
    bridgeErrorMessage,
    finalConfig.enableErrorHandling,
    addToast,
    updateConnectionState,
  ]);

  // 🔧 연결 상태 감지
  useEffect(() => {
    const isCurrentlyConnected = bridgeCanExecuteForward || uiCanExecute;
    const isCurrentlyTransferring = bridgeIsExecuting || uiIsLoading;

    updateConnectionState({
      isConnected: isCurrentlyConnected,
      isTransferring: isCurrentlyTransferring,
    });
  }, [
    bridgeCanExecuteForward,
    uiCanExecute,
    bridgeIsExecuting,
    uiIsLoading,
    updateConnectionState,
  ]);

  // 🔧 수동 전송 실행 함수
  const executeManualTransfer = useCallback(async (): Promise<boolean> => {
    console.log('🚀 [BRIDGE_INTEGRATION] 수동 전송 시작');

    if (!stateRef.current.isConnected) {
      console.error('❌ [BRIDGE_INTEGRATION] Bridge가 연결되지 않음');
      return false;
    }

    if (stateRef.current.isTransferring) {
      console.warn('⚠️ [BRIDGE_INTEGRATION] 이미 전송 중');
      return false;
    }

    updateConnectionState({ isTransferring: true });

    try {
      // 🔧 UI Bridge 우선 시도
      if (uiCanExecute && typeof uiHandleForward === 'function') {
        console.log('🌉 [BRIDGE_INTEGRATION] UI Bridge로 전송 시도');
        await uiHandleForward();
        return true;
      }

      // 🔧 기본 Bridge 시도
      if (
        bridgeCanExecuteForward &&
        typeof bridgeExecuteForward === 'function'
      ) {
        console.log('🌉 [BRIDGE_INTEGRATION] 기본 Bridge로 전송 시도');
        await bridgeExecuteForward();
        return true;
      }

      console.error('❌ [BRIDGE_INTEGRATION] 사용 가능한 전송 방법 없음');
      return false;
    } catch (transferError) {
      const errorMessage =
        integrationManager.extractErrorMessage(transferError);
      console.error('❌ [BRIDGE_INTEGRATION] 수동 전송 실패:', errorMessage);

      if (finalConfig.enableErrorHandling) {
        addToast({
          title: '수동 전송 실패',
          description: errorMessage,
          color: 'danger',
        });
      }

      updateConnectionState({
        errorCount: stateRef.current.errorCount + 1,
        lastErrorMessage: errorMessage,
        isTransferring: false,
      });

      return false;
    }
  }, [
    stateRef,
    updateConnectionState,
    uiCanExecute,
    uiHandleForward,
    bridgeCanExecuteForward,
    bridgeExecuteForward,
    integrationManager,
    finalConfig.enableErrorHandling,
    addToast,
  ]);

  // 🔧 현재 상태 조회 함수
  const getCurrentState = useCallback((): BridgeIntegrationState => {
    return { ...stateRef.current };
  }, []);

  // 🔧 통계 정보 조회 함수
  const getStatistics = useCallback(() => {
    const currentState = stateRef.current;

    return {
      connectionState: currentState,
      bridgeStats: {
        isExecuting: bridgeIsExecuting,
        canExecuteForward: bridgeCanExecuteForward,
        hasError: !!bridgeErrorMessage,
      },
      uiStats: {
        isLoading: uiIsLoading,
        canExecute: uiCanExecute,
        editorStatistics: uiEditorStats,
        validationState: uiValidationState,
        statusMessage: uiStatusMessage,
      },
      config: finalConfig,
    };
  }, [
    bridgeIsExecuting,
    bridgeCanExecuteForward,
    bridgeErrorMessage,
    uiIsLoading,
    uiCanExecute,
    uiEditorStats,
    uiValidationState,
    uiStatusMessage,
    finalConfig,
  ]);

  return {
    // 상태 정보
    isConnected: stateRef.current.isConnected,
    isTransferring: stateRef.current.isTransferring,
    canTransfer:
      stateRef.current.isConnected && !stateRef.current.isTransferring,

    // 액션 함수들
    executeManualTransfer,
    getCurrentState,
    getStatistics,

    // Bridge 훅 정보
    bridgeHook,
    bridgeUIHook,

    // 설정
    config: finalConfig,
  };
};

console.log('🔧 [BRIDGE_INTEGRATION] Bridge 연결 유틸리티 모듈 로드 완료');
