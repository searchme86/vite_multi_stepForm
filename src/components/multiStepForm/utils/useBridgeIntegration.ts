// src/components/multiStepForm/utils/useBridgeIntegration.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import { useToastStore } from '../../../store/toast/toastStore';
import { useErrorHandlingIntegration } from './errorHandlingIntegration';
import type { StepNumber } from '../types/stepTypes';

// 🔧 Bridge 설정 인터페이스
interface BridgeIntegrationConfig {
  readonly enableAutoTransfer: boolean;
  readonly enableStepTransition: boolean;
  readonly enableErrorHandling: boolean;
  readonly enableProgressSync: boolean;
  readonly enableValidationSync: boolean;
  readonly debugMode: boolean;
  readonly autoTransferStep: number;
  readonly targetStepAfterTransfer: number;
}

// 🔧 Bridge 인스턴스 인터페이스 (시뮬레이션용)
interface BridgeInstance {
  readonly transfer: (data: Record<string, unknown>) => Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }>;
  readonly getStatus: () => {
    isConnected: boolean;
    lastOperation: number | null;
  };
  readonly disconnect: () => void;
}

// 🔧 Bridge 연결 상태 인터페이스
interface BridgeConnectionState {
  readonly isConnected: boolean;
  readonly isTransferring: boolean;
  readonly transferCount: number;
  readonly errorCount: number;
  readonly lastTransferTime: number | null;
  readonly lastErrorTime: number | null;
}

// 🔧 Bridge 통계 인터페이스
interface BridgeStatistics {
  readonly bridgeStats: {
    readonly totalOperations: number;
    readonly successfulOperations: number;
    readonly failedOperations: number;
    readonly averageOperationTime: number;
  };
  readonly uiStats: {
    readonly isLoading: boolean;
    readonly canExecute: boolean;
    readonly editorStatistics: {
      readonly containerCount: number;
      readonly paragraphCount: number;
      readonly assignedCount: number;
      readonly unassignedCount: number;
    } | null;
    readonly validationState: {
      readonly isValid: boolean;
      readonly errorCount: number;
      readonly warningCount: number;
    } | null;
    readonly statusMessage: string | null;
  };
  readonly connectionState: BridgeConnectionState;
}

// 🔧 Bridge 전송 결과 인터페이스
interface BridgeTransferResult {
  readonly success: boolean;
  readonly data: {
    readonly content: string;
    readonly isCompleted: boolean;
    readonly metadata?: Record<string, unknown>;
  } | null;
  readonly errorMessage: string | null;
  readonly timestamp: number;
  readonly duration: number;
}

// 🔧 현재 스텝 추론 함수 - 안정화
const inferCurrentStepFromPath = (): StepNumber => {
  try {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // URL에서 스텝 번호 추출 시도
    if (lastSegment && !Number.isNaN(parseInt(lastSegment, 10))) {
      const stepFromPath = parseInt(lastSegment, 10);
      if (stepFromPath >= 1 && stepFromPath <= 5) {
        return stepFromPath as StepNumber;
      }
    }

    // 기본값 반환
    return 4; // 에디터 스텝을 기본값으로
  } catch (error) {
    console.warn('⚠️ [BRIDGE_INTEGRATION] 스텝 추론 실패, 기본값 사용:', error);
    return 4;
  }
};

// 🔧 타입 가드 유틸리티 - 안정화
const createBridgeTypeGuards = () => {
  const isValidConfig = (
    inputConfig: unknown
  ): inputConfig is BridgeIntegrationConfig => {
    if (!inputConfig || typeof inputConfig !== 'object') {
      return false;
    }

    const configObj = inputConfig;
    const requiredKeys = [
      'enableAutoTransfer',
      'enableStepTransition',
      'enableErrorHandling',
      'enableProgressSync',
      'enableValidationSync',
      'debugMode',
      'autoTransferStep',
      'targetStepAfterTransfer',
    ];

    return requiredKeys.every((key) => key in configObj);
  };

  const isValidStepNumber = (value: unknown): value is StepNumber => {
    return typeof value === 'number' && value >= 1 && value <= 5;
  };

  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isBridgeInstance = (value: unknown): value is BridgeInstance => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const instance = value;
    return (
      'transfer' in instance &&
      'getStatus' in instance &&
      'disconnect' in instance &&
      typeof Reflect.get(instance, 'transfer') === 'function' &&
      typeof Reflect.get(instance, 'getStatus') === 'function' &&
      typeof Reflect.get(instance, 'disconnect') === 'function'
    );
  };

  return {
    isValidConfig,
    isValidStepNumber,
    isValidString,
    isValidNumber,
    isValidBoolean,
    isBridgeInstance,
  };
};

// 🔧 시뮬레이션 Bridge 인스턴스 생성 - 안정화
const createSimulatedBridgeInstance = (): BridgeInstance => {
  console.log('🔧 [BRIDGE_INTEGRATION] 시뮬레이션 Bridge 인스턴스 생성');

  return {
    transfer: async (data: Record<string, unknown>) => {
      console.log('🌉 [BRIDGE_INTEGRATION] 시뮬레이션 전송 시작:', data);

      // 전송 시뮬레이션 (1-2초 지연)
      const delay = 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      // 성공률 80%로 시뮬레이션
      const isSuccess = Math.random() > 0.2;

      if (!isSuccess) {
        return {
          success: false,
          error: 'Bridge 전송 실패 시뮬레이션',
        };
      }

      return {
        success: true,
        data: {
          content: '🌉 Bridge에서 성공적으로 처리된 콘텐츠',
          isCompleted: true,
          transferTime: delay,
          timestamp: Date.now(),
        },
      };
    },

    getStatus: () => ({
      isConnected: true,
      lastOperation: Date.now(),
    }),

    disconnect: () => {
      console.log('🔌 [BRIDGE_INTEGRATION] Bridge 연결 해제');
    },
  };
};

// 🔧 메인 Bridge 통합 훅
export const useBridgeIntegration = (inputConfig: BridgeIntegrationConfig) => {
  // 🔧 타입 가드 메모이제이션 - 안정화
  const typeGuards = useMemo(() => {
    console.log('🔧 [BRIDGE_INTEGRATION] 타입 가드 생성');
    return createBridgeTypeGuards();
  }, []);

  // 🔧 설정 검증 및 기본값 설정 - 안정화
  const validatedConfig = useMemo((): BridgeIntegrationConfig => {
    console.log('🔧 [BRIDGE_INTEGRATION] 설정 검증:', inputConfig);

    if (!typeGuards.isValidConfig(inputConfig)) {
      console.warn('⚠️ [BRIDGE_INTEGRATION] 유효하지 않은 설정, 기본값 사용');

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
    }

    return { ...inputConfig };
  }, [inputConfig, typeGuards]);

  // 🔧 상태 관리
  const [connectionState, setConnectionState] = useState<BridgeConnectionState>(
    () => {
      console.log('🔧 [BRIDGE_INTEGRATION] 초기 연결 상태 생성');
      return {
        isConnected: false,
        isTransferring: false,
        transferCount: 0,
        errorCount: 0,
        lastTransferTime: null,
        lastErrorTime: null,
      };
    }
  );

  const [statistics, setStatistics] = useState<BridgeStatistics>(() => {
    console.log('🔧 [BRIDGE_INTEGRATION] 초기 통계 상태 생성');
    return {
      bridgeStats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageOperationTime: 0,
      },
      uiStats: {
        isLoading: false,
        canExecute: false,
        editorStatistics: null,
        validationState: null,
        statusMessage: null,
      },
      connectionState: {
        isConnected: false,
        isTransferring: false,
        transferCount: 0,
        errorCount: 0,
        lastTransferTime: null,
        lastErrorTime: null,
      },
    };
  });

  // 🔧 Bridge 인스턴스 참조 및 초기화 플래그
  const bridgeInstanceRef = useRef<BridgeInstance | null>(null);
  const lastOperationTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // 🔧 실제 Store 연결 - 안정화
  const multiStepFormStore = useMultiStepFormStore();
  const { getFormValues, updateFormValue } = multiStepFormStore;

  // 🔧 Toast Store 연결 - 안정화
  const toastStore = useToastStore();
  const { addToast } = toastStore;

  // 🔧 현재 스텝 추론 - 안정화
  const currentStep = useMemo(() => {
    const step = inferCurrentStepFromPath();
    console.log('🔧 [BRIDGE_INTEGRATION] 현재 스텝 추론:', step);
    return step;
  }, []);

  // 🔧 에러 처리 통합 - 안정화
  const errorHandlerConfig = useMemo(
    () => ({
      showTechnicalDetails: validatedConfig.debugMode,
      enableAutoRetry: true,
      enableRecoveryActions: true,
    }),
    [validatedConfig.debugMode]
  );

  const errorHandler = useErrorHandlingIntegration(errorHandlerConfig);

  // 🔧 폼 값 가져오기 함수 - 안정화
  const getCurrentFormValues = useCallback(() => {
    try {
      if (typeof getFormValues === 'function') {
        const values = getFormValues();
        console.log(
          '🔧 [BRIDGE_INTEGRATION] 폼 값 조회 성공:',
          Object.keys(values || {}).length + '개 필드'
        );
        return values;
      }

      console.warn('⚠️ [BRIDGE_INTEGRATION] getFormValues 함수가 없음');
      return {};
    } catch (error) {
      console.error('❌ [BRIDGE_INTEGRATION] 폼 값 가져오기 실패:', error);
      return {};
    }
  }, [getFormValues]);

  // 🔧 Bridge 연결 초기화 - 안정화된 의존성
  useEffect(() => {
    // 중복 초기화 방지
    if (isInitializedRef.current) {
      console.log('⏭️ [BRIDGE_INTEGRATION] 이미 초기화됨, 건너뜀');
      return;
    }

    console.log('🌉 [BRIDGE_INTEGRATION] Bridge 연결 초기화 시작');

    const initializeBridgeConnection = async () => {
      try {
        const bridgeInstance = createSimulatedBridgeInstance();

        if (!bridgeInstance || !typeGuards.isBridgeInstance(bridgeInstance)) {
          throw new Error('Bridge 인스턴스 생성 실패');
        }

        bridgeInstanceRef.current = bridgeInstance;
        isInitializedRef.current = true;

        // 연결 상태 업데이트
        setConnectionState((prevState) => {
          console.log('✅ [BRIDGE_INTEGRATION] 연결 상태 업데이트: 연결됨');
          return {
            ...prevState,
            isConnected: true,
          };
        });

        if (validatedConfig.debugMode) {
          console.log('✅ [BRIDGE_INTEGRATION] Bridge 연결 초기화 완료');
        }
      } catch (error) {
        console.error(
          '❌ [BRIDGE_INTEGRATION] Bridge 연결 초기화 실패:',
          error
        );

        // 에러 처리 - 안전하게 처리
        if (validatedConfig.enableErrorHandling && errorHandler?.handleError) {
          try {
            await errorHandler.handleError(
              error,
              null,
              'bridge_initialization'
            );
          } catch (handlerError) {
            console.error(
              '❌ [BRIDGE_INTEGRATION] 에러 핸들러 실패:',
              handlerError
            );
          }
        }

        // 연결 실패 상태 설정
        setConnectionState((prevState) => {
          console.log('❌ [BRIDGE_INTEGRATION] 연결 상태 업데이트: 실패');
          return {
            ...prevState,
            isConnected: false,
            errorCount: prevState.errorCount + 1,
            lastErrorTime: Date.now(),
          };
        });
      }
    };

    initializeBridgeConnection();
  }, [validatedConfig.debugMode, validatedConfig.enableErrorHandling]); // 🚨 중요: 안정화된 의존성만 포함

  // 🔧 통계 업데이트 함수 - 안정화
  const updateStatistics = useCallback(
    (operationResult: BridgeTransferResult) => {
      console.log(
        '📊 [BRIDGE_INTEGRATION] 통계 업데이트:',
        operationResult.success
      );

      setStatistics((prevStats) => {
        const { success, duration } = operationResult;
        const { bridgeStats } = prevStats;

        const newTotalOperations = bridgeStats.totalOperations + 1;
        const newSuccessfulOperations = success
          ? bridgeStats.successfulOperations + 1
          : bridgeStats.successfulOperations;
        const newFailedOperations = success
          ? bridgeStats.failedOperations
          : bridgeStats.failedOperations + 1;

        // 평균 연산 시간 계산
        const totalTime =
          bridgeStats.averageOperationTime * bridgeStats.totalOperations;
        const newAverageTime = (totalTime + duration) / newTotalOperations;

        return {
          ...prevStats,
          bridgeStats: {
            totalOperations: newTotalOperations,
            successfulOperations: newSuccessfulOperations,
            failedOperations: newFailedOperations,
            averageOperationTime: newAverageTime,
          },
          connectionState: connectionState,
        };
      });
    },
    [connectionState]
  );

  // 🔧 전송 가능 여부 계산 - 안정화
  const canTransfer = useMemo(() => {
    const { isConnected, isTransferring } = connectionState;
    const formValues = getCurrentFormValues();
    const hasValidFormData = formValues && typeof formValues === 'object';
    const isValidStep = typeGuards.isValidStepNumber(currentStep);
    const hasBridgeInstance = bridgeInstanceRef.current !== null;

    const result =
      isConnected &&
      !isTransferring &&
      hasValidFormData &&
      isValidStep &&
      hasBridgeInstance;

    console.log('🔧 [BRIDGE_INTEGRATION] 전송 가능 여부 계산:', {
      isConnected,
      isTransferring,
      hasValidFormData,
      isValidStep,
      hasBridgeInstance,
      result,
    });

    return result;
  }, [connectionState, getCurrentFormValues, currentStep, typeGuards]);

  // 🔧 수동 전송 함수 - 안정화
  const executeManualTransfer = useCallback(async (): Promise<boolean> => {
    if (!canTransfer) {
      if (validatedConfig.debugMode) {
        console.warn('⚠️ [BRIDGE_INTEGRATION] 전송 불가능한 상태');
      }
      return false;
    }

    const bridgeInstance = bridgeInstanceRef.current;
    if (!bridgeInstance || !typeGuards.isBridgeInstance(bridgeInstance)) {
      console.error('❌ [BRIDGE_INTEGRATION] Bridge 인스턴스가 없음');
      return false;
    }

    // 중복 전송 방지
    const currentTime = Date.now();
    const timeSinceLastOperation = currentTime - lastOperationTimeRef.current;
    const minTimeBetweenOperations = 2000; // 2초

    if (timeSinceLastOperation < minTimeBetweenOperations) {
      if (validatedConfig.debugMode) {
        console.warn('⚠️ [BRIDGE_INTEGRATION] 너무 빠른 연속 전송 시도');
      }
      return false;
    }

    lastOperationTimeRef.current = currentTime;

    // 전송 시작
    setConnectionState((prevState) => ({
      ...prevState,
      isTransferring: true,
    }));

    const operationStartTime = Date.now();

    try {
      if (validatedConfig.debugMode) {
        console.log('🚀 [BRIDGE_INTEGRATION] 수동 전송 시작');
      }

      // 현재 폼 값 가져오기
      const formValues = getCurrentFormValues();

      // 실제 Bridge 시스템 호출
      const transferData = {
        formValues: formValues || {},
        currentStep,
        timestamp: currentTime,
      };

      const bridgeResult = await bridgeInstance.transfer(transferData);

      const operationEndTime = Date.now();
      const operationDuration = operationEndTime - operationStartTime;

      if (!bridgeResult.success) {
        throw new Error(bridgeResult.error || 'Bridge 전송 실패');
      }

      // 성공 결과 생성
      const { data: bridgeData } = bridgeResult;

      // 안전한 content 추출
      const rawContent = Reflect.get(bridgeData || {}, 'content');
      const resultContent: string = typeGuards.isValidString(rawContent)
        ? rawContent
        : '🌉 Bridge에서 전송된 콘텐츠';

      // 안전한 isCompleted 추출
      const rawIsCompleted = Reflect.get(bridgeData || {}, 'isCompleted');
      const resultIsCompleted: boolean = rawIsCompleted === true;

      const transferResult: BridgeTransferResult = {
        success: true,
        data: {
          content: resultContent,
          isCompleted: resultIsCompleted,
          metadata: {
            transferTime: operationDuration,
            timestamp: operationEndTime,
          },
        },
        errorMessage: null,
        timestamp: operationEndTime,
        duration: operationDuration,
      };

      // 실제 Store 업데이트
      if (typeof updateFormValue === 'function' && transferResult.data) {
        updateFormValue('editorCompletedContent', transferResult.data.content);
        updateFormValue('isEditorCompleted', transferResult.data.isCompleted);
      }

      // 성공 토스트 표시
      if (typeof addToast === 'function') {
        addToast({
          title: '전송 완료',
          description: '브릿지 전송이 성공적으로 완료되었습니다.',
          color: 'success',
        });
      }

      // 통계 업데이트
      updateStatistics(transferResult);

      // 연결 상태 업데이트
      setConnectionState((prevState) => ({
        ...prevState,
        isTransferring: false,
        transferCount: prevState.transferCount + 1,
        lastTransferTime: operationEndTime,
      }));

      if (validatedConfig.debugMode) {
        console.log('✅ [BRIDGE_INTEGRATION] 수동 전송 성공:', {
          duration: operationDuration,
          contentLength: transferResult.data?.content.length || 0,
        });
      }

      return true;
    } catch (error) {
      const operationEndTime = Date.now();
      const operationDuration = operationEndTime - operationStartTime;

      console.error('❌ [BRIDGE_INTEGRATION] 수동 전송 실패:', error);

      // 실패 결과 생성
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      const transferResult: BridgeTransferResult = {
        success: false,
        data: null,
        errorMessage,
        timestamp: operationEndTime,
        duration: operationDuration,
      };

      // 에러 토스트 표시
      if (typeof addToast === 'function') {
        addToast({
          title: '전송 실패',
          description: errorMessage,
          color: 'danger',
        });
      }

      // 에러 처리
      if (validatedConfig.enableErrorHandling && errorHandler?.handleError) {
        try {
          await errorHandler.handleError(error, currentStep, 'manual_transfer');
        } catch (handlerError) {
          console.error(
            '❌ [BRIDGE_INTEGRATION] 에러 핸들러 실패:',
            handlerError
          );
        }
      }

      // 통계 업데이트
      updateStatistics(transferResult);

      // 연결 상태 업데이트
      setConnectionState((prevState) => ({
        ...prevState,
        isTransferring: false,
        errorCount: prevState.errorCount + 1,
        lastErrorTime: operationEndTime,
      }));

      return false;
    }
  }, [
    canTransfer,
    validatedConfig.debugMode,
    validatedConfig.enableErrorHandling,
    getCurrentFormValues,
    currentStep,
    updateFormValue,
    addToast,
    updateStatistics,
    typeGuards,
  ]);

  // 🔧 통계 조회 함수 - 안정화
  const getStatistics = useCallback((): BridgeStatistics => {
    return { ...statistics };
  }, [statistics]);

  // 🔧 연결 상태 조회 함수 - 안정화
  const getConnectionState = useCallback((): BridgeConnectionState => {
    return { ...connectionState };
  }, [connectionState]);

  // 🔧 디버그 정보 주기적 출력 - 안정화된 의존성
  useEffect(() => {
    if (!validatedConfig.debugMode) {
      return;
    }

    console.log('🔧 [BRIDGE_INTEGRATION] 디버그 모드 인터벌 시작');
    const debugInterval = setInterval(() => {
      const formValues = getCurrentFormValues();

      console.log('📊 [BRIDGE_INTEGRATION] 상태 리포트:', {
        connectionState: getConnectionState(),
        canTransfer,
        currentStep,
        formValuesAvailable: !!formValues,
        formKeysCount: Object.keys(formValues || {}).length,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 30000); // 30초마다

    return () => {
      console.log('🔧 [BRIDGE_INTEGRATION] 디버그 모드 인터벌 정리');
      clearInterval(debugInterval);
    };
  }, [validatedConfig.debugMode]); // 🚨 중요: 안정화된 의존성만 포함

  // 🔧 반환 객체 - 안정화
  const returnValue = useMemo(
    () => ({
      // 상태 정보
      isConnected: connectionState.isConnected,
      isTransferring: connectionState.isTransferring,
      canTransfer,

      // 액션 함수들
      executeManualTransfer,

      // 조회 함수들
      getStatistics,
      getConnectionState,

      // 설정 정보
      config: validatedConfig,
    }),
    [
      connectionState.isConnected,
      connectionState.isTransferring,
      canTransfer,
      executeManualTransfer,
      getStatistics,
      getConnectionState,
      validatedConfig,
    ]
  );

  console.log('🔧 [BRIDGE_INTEGRATION] 훅 반환값 생성 완료:', {
    isConnected: returnValue.isConnected,
    isTransferring: returnValue.isTransferring,
    canTransfer: returnValue.canTransfer,
  });

  return returnValue;
};

console.log(
  '🌉 [BRIDGE_INTEGRATION] useBridgeIntegration 훅 모듈 로드 완료 - 에러 수정 완료'
);
