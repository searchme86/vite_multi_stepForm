// src/components/multiStepForm/utils/errorHandlingIntegration.ts

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import type { StepNumber } from '../types/stepTypes';

// 🔧 에러 심각도 레벨
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// 🔧 에러 카테고리
type ErrorCategory =
  | 'BRIDGE_CONNECTION'
  | 'BRIDGE_TRANSFER'
  | 'BRIDGE_VALIDATION'
  | 'FORM_VALIDATION'
  | 'NETWORK_ERROR'
  | 'SYSTEM_ERROR'
  | 'USER_INPUT_ERROR'
  | 'TIMEOUT_ERROR';

// 🔧 에러 컨텍스트 정보
interface ErrorContext {
  readonly step: StepNumber | null;
  readonly operation: string;
  readonly timestamp: number;
  readonly userAgent: string;
  readonly formData: Record<string, unknown>;
  readonly systemState: Record<string, unknown>;
}

// 🔧 표준화된 에러 정보
interface StandardizedError {
  readonly id: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly title: string;
  readonly message: string;
  readonly technicalDetails: string;
  readonly userFriendlyMessage: string;
  readonly context: ErrorContext;
  readonly timestamp: number;
  readonly isRecoverable: boolean;
  readonly suggestedActions: readonly string[];
  readonly retryCount: number;
  readonly maxRetryAttempts: number;
}

// 🔧 복구 전략 인터페이스
interface RecoveryStrategy {
  readonly name: string;
  readonly description: string;
  readonly action: () => Promise<boolean>;
  readonly requiresUserConfirmation: boolean;
  readonly estimatedTime: number;
}

// 🔧 토스트 설정 인터페이스
interface ToastConfiguration {
  readonly showTechnicalDetails: boolean;
  readonly enableAutoRetry: boolean;
  readonly enableRecoveryActions: boolean;
  readonly groupSimilarErrors: boolean;
  readonly maxToastsPerCategory: number;
  readonly defaultDuration: number;
  readonly criticalErrorDuration: number;
}

// 🔧 에러 통계 인터페이스
interface ErrorStatistics {
  readonly totalErrors: number;
  readonly errorsByCategory: Map<ErrorCategory, number>;
  readonly errorsBySeverity: Map<ErrorSeverity, number>;
  readonly recoveredErrors: number;
  readonly unrecoveredErrors: number;
  readonly averageRecoveryTime: number;
  readonly lastErrorTime: number | null;
}

// 🔧 안전한 타입 검증 유틸리티
const createErrorTypeGuards = () => {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidErrorSeverity = (value: unknown): value is ErrorSeverity => {
    const validSeverities: ErrorSeverity[] = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    return (
      isValidString(value) && validSeverities.includes(value as ErrorSeverity)
    );
  };

  const isValidErrorCategory = (value: unknown): value is ErrorCategory => {
    const validCategories: ErrorCategory[] = [
      'BRIDGE_CONNECTION',
      'BRIDGE_TRANSFER',
      'BRIDGE_VALIDATION',
      'FORM_VALIDATION',
      'NETWORK_ERROR',
      'SYSTEM_ERROR',
      'USER_INPUT_ERROR',
      'TIMEOUT_ERROR',
    ];
    return (
      isValidString(value) && validCategories.includes(value as ErrorCategory)
    );
  };

  const isValidStepNumber = (value: unknown): value is StepNumber => {
    return isValidNumber(value) && value >= 1 && value <= 5;
  };

  return {
    isValidString,
    isValidNumber,
    isValidObject,
    isValidErrorSeverity,
    isValidErrorCategory,
    isValidStepNumber,
  };
};

// 🔧 에러 분석 엔진
const createErrorAnalysisEngine = () => {
  const typeGuards = createErrorTypeGuards();

  // 🔧 에러 메시지에서 카테고리 추론
  const inferErrorCategory = (errorMessage: string): ErrorCategory => {
    const lowerMessage = errorMessage.toLowerCase();

    // Bridge 관련 에러 패턴
    if (lowerMessage.includes('bridge') || lowerMessage.includes('transfer')) {
      if (
        lowerMessage.includes('connection') ||
        lowerMessage.includes('connect')
      ) {
        return 'BRIDGE_CONNECTION';
      }
      if (
        lowerMessage.includes('validation') ||
        lowerMessage.includes('validate')
      ) {
        return 'BRIDGE_VALIDATION';
      }
      return 'BRIDGE_TRANSFER';
    }

    // 네트워크 관련 에러 패턴
    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('request') ||
      lowerMessage.includes('timeout')
    ) {
      if (lowerMessage.includes('timeout')) {
        return 'TIMEOUT_ERROR';
      }
      return 'NETWORK_ERROR';
    }

    // 폼 검증 관련 에러 패턴
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('required') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('form')
    ) {
      return 'FORM_VALIDATION';
    }

    // 사용자 입력 관련 에러 패턴
    if (
      lowerMessage.includes('input') ||
      lowerMessage.includes('field') ||
      lowerMessage.includes('value') ||
      lowerMessage.includes('empty')
    ) {
      return 'USER_INPUT_ERROR';
    }

    // 기본값: 시스템 에러
    return 'SYSTEM_ERROR';
  };

  // 🔧 에러 심각도 추론
  const inferErrorSeverity = (
    errorMessage: string,
    category: ErrorCategory
  ): ErrorSeverity => {
    const lowerMessage = errorMessage.toLowerCase();

    // Critical 패턴
    if (
      lowerMessage.includes('critical') ||
      lowerMessage.includes('fatal') ||
      lowerMessage.includes('crash') ||
      lowerMessage.includes('corrupted')
    ) {
      return 'critical';
    }

    // High 패턴
    if (
      lowerMessage.includes('failed') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('unable') ||
      lowerMessage.includes('cannot')
    ) {
      return 'high';
    }

    // Medium 패턴
    if (
      lowerMessage.includes('warning') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('missing') ||
      lowerMessage.includes('incomplete')
    ) {
      return 'medium';
    }

    // 카테고리별 기본 심각도
    const categoryDefaultSeverity: Record<ErrorCategory, ErrorSeverity> = {
      BRIDGE_CONNECTION: 'high',
      BRIDGE_TRANSFER: 'high',
      BRIDGE_VALIDATION: 'medium',
      FORM_VALIDATION: 'medium',
      NETWORK_ERROR: 'high',
      SYSTEM_ERROR: 'high',
      USER_INPUT_ERROR: 'low',
      TIMEOUT_ERROR: 'medium',
    };

    return categoryDefaultSeverity[category];
  };

  // 🔧 사용자 친화적 메시지 생성
  const generateUserFriendlyMessage = (
    category: ErrorCategory,
    severity: ErrorSeverity
  ): string => {
    const messageMap: Record<ErrorCategory, Record<ErrorSeverity, string>> = {
      BRIDGE_CONNECTION: {
        low: '브릿지 연결에 일시적인 문제가 있습니다.',
        medium: '브릿지 시스템과의 연결이 불안정합니다.',
        high: '브릿지 시스템에 연결할 수 없습니다.',
        critical: '브릿지 시스템이 완전히 중단되었습니다.',
      },
      BRIDGE_TRANSFER: {
        low: '데이터 전송에 지연이 발생했습니다.',
        medium: '데이터 전송 중 일부 문제가 발생했습니다.',
        high: '데이터 전송에 실패했습니다.',
        critical: '데이터 전송이 완전히 중단되었습니다.',
      },
      BRIDGE_VALIDATION: {
        low: '일부 데이터 검증에서 경고가 발생했습니다.',
        medium: '데이터 검증에서 문제를 발견했습니다.',
        high: '데이터 검증에 실패했습니다.',
        critical: '심각한 데이터 무결성 문제가 발견되었습니다.',
      },
      FORM_VALIDATION: {
        low: '입력 형식을 확인해주세요.',
        medium: '필수 입력 항목을 확인해주세요.',
        high: '폼 검증에 실패했습니다.',
        critical: '폼 데이터에 심각한 문제가 있습니다.',
      },
      NETWORK_ERROR: {
        low: '네트워크 연결이 느립니다.',
        medium: '네트워크 연결에 문제가 있습니다.',
        high: '네트워크 오류가 발생했습니다.',
        critical: '네트워크에 연결할 수 없습니다.',
      },
      SYSTEM_ERROR: {
        low: '시스템에서 작은 문제가 발생했습니다.',
        medium: '시스템 오류가 발생했습니다.',
        high: '심각한 시스템 오류가 발생했습니다.',
        critical: '시스템이 정상적으로 작동하지 않습니다.',
      },
      USER_INPUT_ERROR: {
        low: '입력 내용을 다시 확인해주세요.',
        medium: '입력 형식이 올바르지 않습니다.',
        high: '입력 데이터에 오류가 있습니다.',
        critical: '입력 데이터가 시스템을 손상시킬 수 있습니다.',
      },
      TIMEOUT_ERROR: {
        low: '작업이 예상보다 오래 걸리고 있습니다.',
        medium: '작업 시간이 초과되었습니다.',
        high: '작업이 시간 초과로 중단되었습니다.',
        critical: '시스템이 응답하지 않습니다.',
      },
    };

    const categoryMessages = messageMap[category];
    const selectedMessage = categoryMessages[severity];

    return selectedMessage || '알 수 없는 오류가 발생했습니다.';
  };

  // 🔧 제안 액션 생성
  const generateSuggestedActions = (
    category: ErrorCategory,
    severity: ErrorSeverity
  ): readonly string[] => {
    const actionMap: Record<
      ErrorCategory,
      Record<ErrorSeverity, readonly string[]>
    > = {
      BRIDGE_CONNECTION: {
        low: ['잠시 후 다시 시도해주세요'],
        medium: ['페이지를 새로고침해주세요', '네트워크 연결을 확인해주세요'],
        high: ['브라우저를 재시작해주세요', '관리자에게 문의해주세요'],
        critical: ['시스템 관리자에게 즉시 연락해주세요'],
      },
      BRIDGE_TRANSFER: {
        low: ['다시 시도해주세요'],
        medium: ['입력 내용을 확인하고 다시 시도해주세요'],
        high: ['이전 단계로 돌아가서 다시 진행해주세요'],
        critical: ['데이터를 백업하고 관리자에게 연락해주세요'],
      },
      BRIDGE_VALIDATION: {
        low: ['내용을 다시 확인해주세요'],
        medium: ['필수 항목이 모두 입력되었는지 확인해주세요'],
        high: ['이전 단계부터 다시 진행해주세요'],
        critical: ['데이터를 백업하고 새로 시작해주세요'],
      },
      FORM_VALIDATION: {
        low: ['입력 형식을 확인해주세요'],
        medium: ['빨간색 표시된 항목을 수정해주세요'],
        high: ['모든 필수 항목을 입력해주세요'],
        critical: ['폼을 초기화하고 다시 시작해주세요'],
      },
      NETWORK_ERROR: {
        low: ['네트워크 연결을 확인해주세요'],
        medium: ['WiFi 또는 모바일 데이터를 확인해주세요'],
        high: ['잠시 후 다시 시도하거나 네트워크를 재연결해주세요'],
        critical: ['네트워크 관리자에게 문의해주세요'],
      },
      SYSTEM_ERROR: {
        low: ['페이지를 새로고침해주세요'],
        medium: ['브라우저를 재시작해주세요'],
        high: ['캐시를 삭제하고 다시 시도해주세요'],
        critical: ['기술 지원팀에 즉시 연락해주세요'],
      },
      USER_INPUT_ERROR: {
        low: ['입력 내용을 다시 확인해주세요'],
        medium: ['올바른 형식으로 입력해주세요'],
        high: ['필수 항목을 모두 입력해주세요'],
        critical: ['입력을 초기화하고 다시 시작해주세요'],
      },
      TIMEOUT_ERROR: {
        low: ['잠시 후 다시 시도해주세요'],
        medium: ['네트워크 속도를 확인해주세요'],
        high: ['페이지를 새로고침하고 다시 시도해주세요'],
        critical: ['시스템 상태를 확인하고 관리자에게 연락해주세요'],
      },
    };

    const categoryActions = actionMap[category];
    const selectedActions = categoryActions[severity];

    return selectedActions || ['관리자에게 문의해주세요'];
  };

  return {
    inferErrorCategory,
    inferErrorSeverity,
    generateUserFriendlyMessage,
    generateSuggestedActions,
    typeGuards,
  };
};

// 🔧 복구 전략 매니저
const createRecoveryStrategyManager = () => {
  // 🔧 자동 복구 전략 생성
  const createAutoRecoveryStrategies = (
    standardizedError: StandardizedError
  ): readonly RecoveryStrategy[] => {
    const { category, severity } = standardizedError;
    const strategies: RecoveryStrategy[] = [];

    // Bridge 연결 복구 전략
    if (category === 'BRIDGE_CONNECTION') {
      strategies.push({
        name: 'reconnect',
        description: '브릿지 연결 재시도',
        action: async (): Promise<boolean> => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return Math.random() > 0.3; // 70% 성공률 시뮬레이션
        },
        requiresUserConfirmation: false,
        estimatedTime: 2000,
      });
    }

    // Bridge 전송 복구 전략
    if (category === 'BRIDGE_TRANSFER') {
      strategies.push({
        name: 'retry_transfer',
        description: '데이터 재전송',
        action: async (): Promise<boolean> => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return Math.random() > 0.4; // 60% 성공률 시뮬레이션
        },
        requiresUserConfirmation:
          severity === 'high' || severity === 'critical',
        estimatedTime: 3000,
      });
    }

    // 폼 검증 복구 전략
    if (category === 'FORM_VALIDATION') {
      strategies.push({
        name: 'clear_invalid_fields',
        description: '잘못된 입력 필드 초기화',
        action: async (): Promise<boolean> => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return true; // 항상 성공
        },
        requiresUserConfirmation: true,
        estimatedTime: 1000,
      });
    }

    // 네트워크 에러 복구 전략
    if (category === 'NETWORK_ERROR') {
      strategies.push({
        name: 'retry_with_delay',
        description: '지연 후 재시도',
        action: async (): Promise<boolean> => {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return Math.random() > 0.5; // 50% 성공률 시뮬레이션
        },
        requiresUserConfirmation: false,
        estimatedTime: 5000,
      });
    }

    return strategies;
  };

  // 🔧 복구 가능성 판단
  const isErrorRecoverable = (
    standardizedError: StandardizedError
  ): boolean => {
    const { category, severity } = standardizedError;

    // Critical 에러는 일반적으로 복구 불가능
    if (severity === 'critical') {
      return false;
    }

    // 시스템 에러 중 일부는 복구 불가능
    if (category === 'SYSTEM_ERROR' && severity === 'high') {
      return false;
    }

    // 나머지는 복구 가능
    return true;
  };

  return {
    createAutoRecoveryStrategies,
    isErrorRecoverable,
  };
};

// 🔧 메인 에러 처리 매니저
export const useErrorHandlingIntegration = (
  config?: Partial<ToastConfiguration>
) => {
  const recoveryManager = createRecoveryStrategyManager();

  // 🔧 기본 설정
  const defaultConfig: ToastConfiguration = {
    showTechnicalDetails: false,
    enableAutoRetry: true,
    enableRecoveryActions: true,
    groupSimilarErrors: true,
    maxToastsPerCategory: 3,
    defaultDuration: 5000,
    criticalErrorDuration: 10000,
  };

  const finalConfig: ToastConfiguration = { ...defaultConfig, ...config };

  // 🔧 상태 관리
  const [errorStatistics, setErrorStatistics] = useState<ErrorStatistics>({
    totalErrors: 0,
    errorsByCategory: new Map(),
    errorsBySeverity: new Map(),
    recoveredErrors: 0,
    unrecoveredErrors: 0,
    averageRecoveryTime: 0,
    lastErrorTime: null,
  });

  const processedErrorsRef = useRef<Set<string>>(new Set());
  const activeRecoveriesRef = useRef<Map<string, Promise<boolean>>>(new Map());

  // 🔧 MultiStep Form Store 연결 - removeToast 제거
  const { addToast, clearAllToasts } = useMultiStepFormStore();

  // 🔧 고유 에러 ID 생성
  const generateErrorId = useCallback((): string => {
    const timestamp = Date.now().toString(36);
    const randomValue = Math.random().toString(36).substring(2, 8);
    return `error_${timestamp}_${randomValue}`;
  }, []);

  // 🔧 현재 컨텍스트 수집
  const collectErrorContext = useCallback(
    (step: StepNumber | null, operation: string): ErrorContext => {
      return {
        step,
        operation,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        formData: {},
        systemState: {
          memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 0,
          connectionType:
            (navigator as any)?.connection?.effectiveType || 'unknown',
          onlineStatus: navigator.onLine,
        },
      };
    },
    []
  );

  // 🔧 원시 에러를 표준화된 에러로 변환
  const standardizeError = useCallback(
    (
      rawError: unknown,
      step: StepNumber | null = null,
      operation: string = 'unknown'
    ): StandardizedError => {
      console.log('🔍 [ERROR_INTEGRATION] 에러 표준화 시작:', {
        errorType: typeof rawError,
        step,
        operation,
      });

      // 🔧 분석 엔진 생성 (함수 내부에서 생성하여 사용)
      const analysisEngine = createErrorAnalysisEngine();

      // 에러 메시지 추출
      let errorMessage = '';
      let technicalDetails = '';

      if (rawError instanceof Error) {
        errorMessage = rawError.message;
        technicalDetails = rawError.stack || rawError.message;
      } else if (analysisEngine.typeGuards.isValidString(rawError)) {
        errorMessage = rawError;
        technicalDetails = rawError;
      } else if (analysisEngine.typeGuards.isValidObject(rawError)) {
        const errorObj = rawError;
        const messageValue = Reflect.get(errorObj, 'message');
        const detailsValue = Reflect.get(errorObj, 'details');

        errorMessage = analysisEngine.typeGuards.isValidString(messageValue)
          ? messageValue
          : '알 수 없는 오류';
        technicalDetails = analysisEngine.typeGuards.isValidString(detailsValue)
          ? detailsValue
          : errorMessage;
      } else {
        errorMessage = '알 수 없는 오류가 발생했습니다';
        technicalDetails = String(rawError);
      }

      // 에러 분석
      const category = analysisEngine.inferErrorCategory(errorMessage);
      const severity = analysisEngine.inferErrorSeverity(
        errorMessage,
        category
      );
      const userFriendlyMessage = analysisEngine.generateUserFriendlyMessage(
        category,
        severity
      );
      const suggestedActions = analysisEngine.generateSuggestedActions(
        category,
        severity
      );
      const context = collectErrorContext(step, operation);
      const isRecoverable = recoveryManager.isErrorRecoverable({
        id: '',
        category,
        severity,
        title: '',
        message: errorMessage,
        technicalDetails,
        userFriendlyMessage,
        context,
        timestamp: Date.now(),
        isRecoverable: true,
        suggestedActions,
        retryCount: 0,
        maxRetryAttempts: 3,
      });

      const standardizedError: StandardizedError = {
        id: generateErrorId(),
        category,
        severity,
        title: `${category.replace('_', ' ')} 오류`,
        message: errorMessage,
        technicalDetails,
        userFriendlyMessage,
        context,
        timestamp: Date.now(),
        isRecoverable,
        suggestedActions,
        retryCount: 0,
        maxRetryAttempts: isRecoverable ? 3 : 0,
      };

      console.log('✅ [ERROR_INTEGRATION] 에러 표준화 완료:', {
        id: standardizedError.id,
        category: standardizedError.category,
        severity: standardizedError.severity,
        isRecoverable: standardizedError.isRecoverable,
      });

      return standardizedError;
    },
    [recoveryManager, collectErrorContext, generateErrorId]
  );

  // 🔧 토스트 생성 및 표시
  const createAndShowToast = useCallback(
    (standardizedError: StandardizedError): void => {
      console.log('🍞 [ERROR_INTEGRATION] 토스트 생성 시작:', {
        id: standardizedError.id,
        category: standardizedError.category,
        severity: standardizedError.severity,
      });

      // 심각도에 따른 토스트 색상 매핑
      const severityColorMap: Record<
        ErrorSeverity,
        'success' | 'danger' | 'warning' | 'info'
      > = {
        low: 'info',
        medium: 'warning',
        high: 'danger',
        critical: 'danger',
      };

      const toastColor = severityColorMap[standardizedError.severity];
      const toastDuration =
        standardizedError.severity === 'critical'
          ? finalConfig.criticalErrorDuration
          : finalConfig.defaultDuration;

      // 토스트 메시지 구성
      let description = standardizedError.userFriendlyMessage;

      if (
        finalConfig.showTechnicalDetails &&
        standardizedError.technicalDetails
      ) {
        description += `\n\n기술적 세부사항: ${standardizedError.technicalDetails}`;
      }

      if (standardizedError.suggestedActions.length > 0) {
        description += `\n\n권장 조치: ${standardizedError.suggestedActions.join(
          ', '
        )}`;
      }

      // 토스트 표시
      addToast({
        title: standardizedError.title,
        description,
        color: toastColor,
      });

      console.log('✅ [ERROR_INTEGRATION] 토스트 생성 완료:', {
        title: standardizedError.title,
        color: toastColor,
        duration: toastDuration,
      });
    },
    [finalConfig, addToast]
  );

  // 🔧 자동 복구 실행
  const executeAutoRecovery = useCallback(
    async (standardizedError: StandardizedError): Promise<boolean> => {
      if (!standardizedError.isRecoverable || !finalConfig.enableAutoRetry) {
        return false;
      }

      const { id: errorId } = standardizedError;

      // 이미 복구 중인 에러인지 확인
      const existingRecovery = activeRecoveriesRef.current.get(errorId);
      if (existingRecovery) {
        console.log('⏳ [ERROR_INTEGRATION] 이미 복구 진행 중:', errorId);
        return existingRecovery;
      }

      console.log('🔧 [ERROR_INTEGRATION] 자동 복구 시작:', errorId);

      const recoveryPromise = (async (): Promise<boolean> => {
        try {
          const recoveryStrategies =
            recoveryManager.createAutoRecoveryStrategies(standardizedError);

          if (recoveryStrategies.length === 0) {
            console.log(
              '❌ [ERROR_INTEGRATION] 사용 가능한 복구 전략 없음:',
              errorId
            );
            return false;
          }

          // 첫 번째 전략 시도
          const firstStrategy = recoveryStrategies[0];
          if (!firstStrategy) {
            return false;
          }

          console.log('🎯 [ERROR_INTEGRATION] 복구 전략 실행:', {
            errorId,
            strategyName: firstStrategy.name,
            estimatedTime: firstStrategy.estimatedTime,
          });

          const recoveryResult = await firstStrategy.action();

          if (recoveryResult) {
            console.log('✅ [ERROR_INTEGRATION] 자동 복구 성공:', errorId);

            // 성공 토스트 표시
            addToast({
              title: '문제 해결됨',
              description: '자동으로 문제가 해결되었습니다.',
              color: 'success',
            });

            return true;
          } else {
            console.log('❌ [ERROR_INTEGRATION] 자동 복구 실패:', errorId);
            return false;
          }
        } catch (recoveryError) {
          console.error('❌ [ERROR_INTEGRATION] 복구 중 오류:', recoveryError);
          return false;
        } finally {
          activeRecoveriesRef.current.delete(errorId);
        }
      })();

      activeRecoveriesRef.current.set(errorId, recoveryPromise);
      return recoveryPromise;
    },
    [finalConfig.enableAutoRetry, recoveryManager, addToast]
  );

  // 🔧 통계 업데이트
  const updateStatistics = useCallback(
    (standardizedError: StandardizedError, wasRecovered: boolean): void => {
      setErrorStatistics((prevStats) => {
        const newCategoryMap = new Map(prevStats.errorsByCategory);
        const newSeverityMap = new Map(prevStats.errorsBySeverity);

        // 카테고리별 통계 업데이트
        const currentCategoryCount =
          newCategoryMap.get(standardizedError.category) || 0;
        newCategoryMap.set(
          standardizedError.category,
          currentCategoryCount + 1
        );

        // 심각도별 통계 업데이트
        const currentSeverityCount =
          newSeverityMap.get(standardizedError.severity) || 0;
        newSeverityMap.set(
          standardizedError.severity,
          currentSeverityCount + 1
        );

        return {
          totalErrors: prevStats.totalErrors + 1,
          errorsByCategory: newCategoryMap,
          errorsBySeverity: newSeverityMap,
          recoveredErrors: wasRecovered
            ? prevStats.recoveredErrors + 1
            : prevStats.recoveredErrors,
          unrecoveredErrors: wasRecovered
            ? prevStats.unrecoveredErrors
            : prevStats.unrecoveredErrors + 1,
          averageRecoveryTime: prevStats.averageRecoveryTime, // 실제 구현시 계산 필요
          lastErrorTime: standardizedError.timestamp,
        };
      });
    },
    []
  );

  // 🔧 메인 에러 처리 함수
  const handleError = useCallback(
    async (
      rawError: unknown,
      step: StepNumber | null = null,
      operation: string = 'unknown'
    ): Promise<void> => {
      console.log('🚨 [ERROR_INTEGRATION] 에러 처리 시작:', {
        errorType: typeof rawError,
        step,
        operation,
        timestamp: new Date().toISOString(),
      });

      try {
        // 에러 표준화
        const standardizedError = standardizeError(rawError, step, operation);

        // 중복 처리 방지
        const isDuplicateError = processedErrorsRef.current.has(
          standardizedError.id
        );
        if (isDuplicateError) {
          console.log(
            '⚠️ [ERROR_INTEGRATION] 중복 에러 처리 방지:',
            standardizedError.id
          );
          return;
        }

        processedErrorsRef.current.add(standardizedError.id);

        // 토스트 표시
        createAndShowToast(standardizedError);

        // 자동 복구 시도
        const wasRecovered = await executeAutoRecovery(standardizedError);

        // 통계 업데이트
        updateStatistics(standardizedError, wasRecovered);

        console.log('✅ [ERROR_INTEGRATION] 에러 처리 완료:', {
          id: standardizedError.id,
          wasRecovered,
          timestamp: new Date().toISOString(),
        });
      } catch (handlingError) {
        console.error(
          '❌ [ERROR_INTEGRATION] 에러 처리 중 오류:',
          handlingError
        );

        // 최후의 수단: 기본 토스트 표시
        addToast({
          title: '시스템 오류',
          description:
            '오류 처리 중 문제가 발생했습니다. 페이지를 새로고침해주세요.',
          color: 'danger',
        });
      }
    },
    [
      standardizeError,
      createAndShowToast,
      executeAutoRecovery,
      updateStatistics,
      addToast,
    ]
  );

  // 🔧 통계 조회 함수
  const getErrorStatistics = useCallback((): ErrorStatistics => {
    return { ...errorStatistics };
  }, [errorStatistics]);

  // 🔧 에러 로그 정리 (메모리 관리)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentTime = Date.now();
      const oneHourAgo = currentTime - 60 * 60 * 1000;

      // 1시간 이상 된 에러 ID 제거
      const errorIdsToRemove: string[] = [];

      processedErrorsRef.current.forEach((errorId) => {
        const timestamp = parseInt(errorId.split('_')[1], 36);
        if (timestamp < oneHourAgo) {
          errorIdsToRemove.push(errorId);
        }
      });

      errorIdsToRemove.forEach((errorId) => {
        processedErrorsRef.current.delete(errorId);
      });

      if (errorIdsToRemove.length > 0) {
        console.log('🧹 [ERROR_INTEGRATION] 오래된 에러 로그 정리:', {
          removedCount: errorIdsToRemove.length,
          remainingCount: processedErrorsRef.current.size,
        });
      }
    }, 10 * 60 * 1000); // 10분마다 정리

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    // 메인 에러 처리 함수
    handleError,

    // 통계 및 상태 조회
    getErrorStatistics,

    // 토스트 제어
    clearAllToasts,

    // 설정
    config: finalConfig,

    // 복구 매니저 (고급 사용)
    recoveryManager,
  };
};

console.log(
  '🚨 [ERROR_INTEGRATION] 에러 처리 및 토스트 통합 시스템 모듈 로드 완료'
);
