// src/components/multiStepForm/utils/useBridgeIntegration.ts

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useToastStore } from '../../../store/toast/toastStore';
import { useErrorHandlingIntegration } from './errorHandlingIntegration';
import type { StepNumber } from '../types/stepTypes';

// 🔧 Bridge 전역 뮤텍스 시스템 (Race Condition 해결)
let isBridgeUpdating = false;
let lastBridgeOperationTime = 0;
const BRIDGE_COOLDOWN_MS = 3000; // 통일된 쿨다운 시간 (3초)

// 🔧 안전한 Bridge 작업 실행 함수
const safeExecuteBridgeOperation = async (
  operationName: string,
  operation: () => Promise<boolean>
): Promise<boolean> => {
  const currentTime = Date.now();

  // 이미 다른 Bridge 작업이 진행 중인 경우
  if (isBridgeUpdating) {
    console.warn(
      `⚠️ [BRIDGE_MUTEX] ${operationName} - 다른 Bridge 작업 진행 중`
    );
    return false;
  }

  // 쿨다운 시간 확인
  const timeSinceLastOperation = currentTime - lastBridgeOperationTime;
  if (timeSinceLastOperation < BRIDGE_COOLDOWN_MS) {
    const remainingTime = BRIDGE_COOLDOWN_MS - timeSinceLastOperation;
    console.warn(
      `⚠️ [BRIDGE_MUTEX] ${operationName} - 쿨다운 중 (${remainingTime}ms 남음)`
    );
    return false;
  }

  console.log(`🔒 [BRIDGE_MUTEX] ${operationName} - 뮤텍스 락 획득`);
  isBridgeUpdating = true;
  lastBridgeOperationTime = currentTime;

  try {
    const result = await operation();
    console.log(`✅ [BRIDGE_MUTEX] ${operationName} - 작업 완료: ${result}`);
    return result;
  } catch (error) {
    console.error(`❌ [BRIDGE_MUTEX] ${operationName} - 작업 실패:`, error);
    throw error;
  } finally {
    isBridgeUpdating = false;
    console.log(`🔓 [BRIDGE_MUTEX] ${operationName} - 뮤텍스 락 해제`);
  }
};

// 🔧 Bridge 설정 인터페이스 (Phase 3 단순화)
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

// 🔧 Bridge 연결 상태 인터페이스 (단순화)
interface BridgeConnectionState {
  readonly isConnected: boolean;
  readonly isTransferring: boolean;
  readonly transferCount: number;
  readonly errorCount: number;
  readonly lastTransferTime: number | null;
  readonly lastErrorTime: number | null;
}

// 🔧 Bridge 통계 인터페이스 (단순화)
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

// 🔧 Bridge 전송 결과 인터페이스 (단순화)
interface BridgeTransferResult {
  readonly success: boolean;
  readonly data: {
    readonly content: string;
    readonly isCompleted: boolean;
    readonly transferredAt: number;
    readonly containerCount: number;
    readonly paragraphCount: number;
  } | null;
  readonly errorMessage: string | null;
  readonly timestamp: number;
  readonly duration: number;
}

// 🆕 Phase 3: 에디터 데이터 추출 함수
const extractEditorDataForTransfer = () => {
  console.log('📤 [BRIDGE_PHASE3] 에디터 데이터 추출 시작');

  try {
    const editorCoreState = useEditorCoreStore.getState();
    const { containers, paragraphs, completedContent, isCompleted } =
      editorCoreState;

    // 안전한 데이터 추출
    const safeContainers = Array.isArray(containers) ? containers : [];
    const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
    const safeCompletedContent =
      typeof completedContent === 'string' ? completedContent : '';
    const safeIsCompleted =
      typeof isCompleted === 'boolean' ? isCompleted : false;

    // 할당된 문단만 필터링
    const assignedParagraphs = safeParagraphs.filter((paragraph) => {
      if (!paragraph || typeof paragraph !== 'object') {
        return false;
      }

      const containerId = Reflect.get(paragraph, 'containerId');
      const content = Reflect.get(paragraph, 'content');

      const hasValidContainerId =
        containerId !== null && containerId !== undefined && containerId !== '';
      const hasValidContent =
        typeof content === 'string' && content.trim().length > 0;

      return hasValidContainerId && hasValidContent;
    });

    const extractedData = {
      containers: safeContainers,
      paragraphs: safeParagraphs,
      assignedParagraphs,
      completedContent: safeCompletedContent,
      isCompleted: safeIsCompleted,
      containerCount: safeContainers.length,
      paragraphCount: safeParagraphs.length,
      assignedParagraphCount: assignedParagraphs.length,
      unassignedParagraphCount:
        safeParagraphs.length - assignedParagraphs.length,
    };

    console.log('✅ [BRIDGE_PHASE3] 에디터 데이터 추출 완료:', {
      containerCount: extractedData.containerCount,
      paragraphCount: extractedData.paragraphCount,
      assignedCount: extractedData.assignedParagraphCount,
      unassignedCount: extractedData.unassignedParagraphCount,
      hasCompletedContent: extractedData.completedContent.length > 0,
      isCompleted: extractedData.isCompleted,
    });

    return extractedData;
  } catch (error) {
    console.error('❌ [BRIDGE_PHASE3] 에디터 데이터 추출 실패:', error);
    return null;
  }
};

// 🆕 Phase 3: 마크다운 콘텐츠 생성 함수
const generateMarkdownContentFromEditor = (
  editorData: ReturnType<typeof extractEditorDataForTransfer>
) => {
  console.log('📝 [BRIDGE_PHASE3] 마크다운 콘텐츠 생성 시작');

  if (!editorData) {
    console.error('❌ [BRIDGE_PHASE3] 에디터 데이터가 없어 마크다운 생성 불가');
    return '';
  }

  try {
    const { containers, assignedParagraphs, completedContent } = editorData;

    // 이미 완성된 콘텐츠가 있으면 그것을 사용
    if (completedContent && completedContent.trim().length > 0) {
      console.log('✅ [BRIDGE_PHASE3] 기존 완성된 콘텐츠 사용:', {
        contentLength: completedContent.length,
      });
      return completedContent;
    }

    // 동적으로 마크다운 생성
    const sortedContainers = [...containers].sort((a, b) => {
      const orderA = Reflect.get(a, 'order') || 0;
      const orderB = Reflect.get(b, 'order') || 0;
      return orderA - orderB;
    });

    let markdownContent = '';

    sortedContainers.forEach((container) => {
      const containerId = Reflect.get(container, 'id');
      const containerName = Reflect.get(container, 'name');

      if (
        typeof containerId !== 'string' ||
        typeof containerName !== 'string'
      ) {
        return;
      }

      // 해당 컨테이너의 문단들 찾기
      const containerParagraphs = assignedParagraphs.filter((paragraph) => {
        const paragraphContainerId = Reflect.get(paragraph, 'containerId');
        return paragraphContainerId === containerId;
      });

      if (containerParagraphs.length === 0) {
        return;
      }

      // 문단 정렬
      const sortedParagraphs = [...containerParagraphs].sort((a, b) => {
        const orderA = Reflect.get(a, 'order') || 0;
        const orderB = Reflect.get(b, 'order') || 0;
        return orderA - orderB;
      });

      // 마크다운에 추가
      markdownContent += `## ${containerName}\n\n`;

      sortedParagraphs.forEach((paragraph) => {
        const content = Reflect.get(paragraph, 'content');
        if (typeof content === 'string' && content.trim().length > 0) {
          markdownContent += `${content.trim()}\n\n`;
        }
      });
    });

    console.log('✅ [BRIDGE_PHASE3] 마크다운 콘텐츠 생성 완료:', {
      contentLength: markdownContent.length,
      containerCount: sortedContainers.length,
      paragraphCount: assignedParagraphs.length,
    });

    return markdownContent.trim();
  } catch (error) {
    console.error('❌ [BRIDGE_PHASE3] 마크다운 콘텐츠 생성 실패:', error);
    return '';
  }
};

// 🆕 Phase 3: 현재 스텝 추론 함수 (단순화) - 타입 안전성 수정
const inferCurrentStepFromPath = (): StepNumber => {
  try {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // URL에서 스텝 번호 추출 시도
    if (lastSegment && !Number.isNaN(parseInt(lastSegment, 10))) {
      const stepFromPath = parseInt(lastSegment, 10);

      // StepNumber 타입으로 안전하게 변환
      switch (stepFromPath) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 3:
          return 3;
        case 4:
          return 4;
        case 5:
          return 5;
        default:
          // 범위를 벗어나면 기본값 반환
          console.warn(
            '⚠️ [BRIDGE_PHASE3] 스텝 번호가 범위를 벗어남:',
            stepFromPath
          );
          return 4;
      }
    }

    // 기본값 반환 (에디터 스텝)
    return 4;
  } catch (error) {
    console.warn('⚠️ [BRIDGE_PHASE3] 스텝 추론 실패, 기본값 사용:', error);
    return 4;
  }
};

// 🆕 Phase 3: 타입 안전성 검증 함수들 (단순화)
const createPhase3TypeValidators = () => {
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
      'debugMode',
    ];

    return requiredKeys.every((key) => key in configObj);
  };

  const isValidStepNumber = (value: unknown): value is StepNumber => {
    return typeof value === 'number' && value >= 1 && value <= 5;
  };

  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  return {
    isValidConfig,
    isValidStepNumber,
    isValidString,
    isValidBoolean,
  };
};

// 🔧 Phase 3: 메인 Bridge 통합 훅 (Race Condition 해결 적용)
export const useBridgeIntegration = (inputConfig: BridgeIntegrationConfig) => {
  console.log('🌉 [BRIDGE_PHASE3] Bridge 통합 훅 초기화 - 뮤텍스 보호 버전');

  // 🔧 타입 검증 유틸리티
  const typeValidators = useMemo(() => {
    console.log('🔧 [BRIDGE_PHASE3] 타입 검증 유틸리티 생성');
    return createPhase3TypeValidators();
  }, []);

  // 🔧 설정 검증 및 기본값 설정
  const validatedConfig = useMemo((): BridgeIntegrationConfig => {
    console.log('🔧 [BRIDGE_PHASE3] 설정 검증:', inputConfig);

    if (!typeValidators.isValidConfig(inputConfig)) {
      console.warn('⚠️ [BRIDGE_PHASE3] 유효하지 않은 설정, 기본값 사용');

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
  }, [inputConfig, typeValidators]);

  // 🔧 상태 관리 (단순화)
  const [connectionState, setConnectionState] = useState<BridgeConnectionState>(
    () => {
      console.log('🔧 [BRIDGE_PHASE3] 초기 연결 상태 생성');
      return {
        isConnected: true, // Phase 3에서는 항상 연결됨
        isTransferring: false,
        transferCount: 0,
        errorCount: 0,
        lastTransferTime: null,
        lastErrorTime: null,
      };
    }
  );

  const [statistics, setStatistics] = useState<BridgeStatistics>(() => {
    console.log('🔧 [BRIDGE_PHASE3] 초기 통계 상태 생성');
    return {
      bridgeStats: {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageOperationTime: 0,
      },
      uiStats: {
        isLoading: false,
        canExecute: true, // Phase 3에서는 기본적으로 실행 가능
        editorStatistics: null,
        validationState: null,
        statusMessage: null,
      },
      connectionState: {
        isConnected: true,
        isTransferring: false,
        transferCount: 0,
        errorCount: 0,
        lastTransferTime: null,
        lastErrorTime: null,
      },
    };
  });

  // 🔧 실제 Store 연결
  const multiStepFormStore = useMultiStepFormStore();
  const { updateEditorContent, setEditorCompleted, updateFormValue } =
    multiStepFormStore;

  // 🔧 Toast Store 연결
  const toastStore = useToastStore();
  const { addToast } = toastStore;

  // 🔧 현재 스텝 추론
  const currentStep = useMemo(() => {
    const step = inferCurrentStepFromPath();
    console.log('🔧 [BRIDGE_PHASE3] 현재 스텝 추론:', step);
    return step;
  }, []);

  // 🔧 에러 처리 통합
  const errorHandlerConfig = useMemo(
    () => ({
      showTechnicalDetails: validatedConfig.debugMode,
      enableAutoRetry: true,
      enableRecoveryActions: true,
    }),
    [validatedConfig.debugMode]
  );

  const errorHandler = useErrorHandlingIntegration(errorHandlerConfig);

  // 🔧 통계 업데이트 함수
  const updateStatistics = useCallback(
    (operationResult: BridgeTransferResult) => {
      console.log('📊 [BRIDGE_PHASE3] 통계 업데이트:', operationResult.success);

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

  // 🔧 전송 가능 여부 계산 (뮤텍스 상태 포함)
  const canTransfer = useMemo(() => {
    const { isConnected } = connectionState;
    const isValidStep = typeValidators.isValidStepNumber(currentStep);
    const isBridgeNotBusy = !isBridgeUpdating; // 뮤텍스 상태 확인

    const result = isConnected && isBridgeNotBusy && isValidStep;

    if (validatedConfig.debugMode) {
      console.log('🔧 [BRIDGE_PHASE3] 전송 가능 여부 계산:', {
        isConnected,
        isBridgeNotBusy,
        isValidStep,
        result,
      });
    }

    return result;
  }, [connectionState, currentStep, typeValidators, validatedConfig.debugMode]);

  // ✅ 🎯 **Phase 3 핵심**: executeManualTransfer 뮤텍스 보호 적용
  const executeManualTransfer = useCallback(async (): Promise<boolean> => {
    console.log('🚀 [BRIDGE_PHASE3] 뮤텍스 보호된 수동 전송 시작');

    // 🔒 뮤텍스로 보호된 실제 전송 로직
    const performActualTransfer = async (): Promise<boolean> => {
      if (!canTransfer) {
        if (validatedConfig.debugMode) {
          console.warn('⚠️ [BRIDGE_PHASE3] 전송 불가능한 상태');
        }
        return false;
      }

      // 전송 시작
      setConnectionState((prevState) => ({
        ...prevState,
        isTransferring: true,
      }));

      const operationStartTime = Date.now();

      try {
        console.log('📤 [BRIDGE_PHASE3] 직접 스토어 연결 전송 시작');

        // 🆕 1단계: 에디터 데이터 추출
        const editorData = extractEditorDataForTransfer();
        if (!editorData) {
          throw new Error('에디터 데이터 추출 실패');
        }

        // 🆕 2단계: 전송 가능성 검증
        if (editorData.unassignedParagraphCount > 0) {
          throw new Error(
            `미할당 문단이 ${editorData.unassignedParagraphCount}개 있습니다`
          );
        }

        if (editorData.containerCount === 0) {
          throw new Error('컨테이너가 없습니다');
        }

        if (editorData.assignedParagraphCount === 0) {
          throw new Error('할당된 문단이 없습니다');
        }

        // 🆕 3단계: 마크다운 콘텐츠 생성
        const markdownContent = generateMarkdownContentFromEditor(editorData);
        if (!markdownContent || markdownContent.trim().length === 0) {
          throw new Error('마크다운 콘텐츠 생성 실패');
        }

        // 🆕 4단계: 멀티스텝 폼 스토어에 직접 업데이트
        console.log('📝 [BRIDGE_PHASE3] 멀티스텝 폼 스토어 업데이트 시작');

        // 에디터 콘텐츠 업데이트
        if (typeof updateEditorContent === 'function') {
          updateEditorContent(markdownContent);
          console.log('✅ [BRIDGE_PHASE3] 에디터 콘텐츠 업데이트 완료:', {
            contentLength: markdownContent.length,
          });
        } else {
          console.warn('⚠️ [BRIDGE_PHASE3] updateEditorContent 함수가 없음');
        }

        // 에디터 완료 상태 설정
        if (typeof setEditorCompleted === 'function') {
          setEditorCompleted(true);
          console.log('✅ [BRIDGE_PHASE3] 에디터 완료 상태 설정 완료');
        } else {
          console.warn('⚠️ [BRIDGE_PHASE3] setEditorCompleted 함수가 없음');
        }

        // 기타 메타데이터 업데이트
        if (typeof updateFormValue === 'function') {
          updateFormValue('lastEditorTransferAt', new Date().toISOString());
          updateFormValue(
            'editorTransferMetadata',
            JSON.stringify({
              containerCount: editorData.containerCount,
              paragraphCount: editorData.paragraphCount,
              assignedParagraphCount: editorData.assignedParagraphCount,
              transferredAt: operationStartTime,
            })
          );
          console.log('✅ [BRIDGE_PHASE3] 메타데이터 업데이트 완료');
        }

        const operationEndTime = Date.now();
        const operationDuration = operationEndTime - operationStartTime;

        // 🆕 5단계: 성공 결과 생성
        const transferResult: BridgeTransferResult = {
          success: true,
          data: {
            content: markdownContent,
            isCompleted: true,
            transferredAt: operationEndTime,
            containerCount: editorData.containerCount,
            paragraphCount: editorData.assignedParagraphCount,
          },
          errorMessage: null,
          timestamp: operationEndTime,
          duration: operationDuration,
        };

        // 성공 토스트 표시
        if (typeof addToast === 'function') {
          addToast({
            title: '✅ 전송 완료',
            description: `에디터 콘텐츠가 성공적으로 전송되었습니다. (${editorData.containerCount}개 섹션, ${editorData.assignedParagraphCount}개 문단)`,
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
          console.log('✅ [BRIDGE_PHASE3] 직접 스토어 연결 전송 성공:', {
            duration: operationDuration,
            contentLength: markdownContent.length,
            containerCount: editorData.containerCount,
            paragraphCount: editorData.assignedParagraphCount,
          });
        }

        return true;
      } catch (error) {
        const operationEndTime = Date.now();
        const operationDuration = operationEndTime - operationStartTime;

        console.error('❌ [BRIDGE_PHASE3] 직접 스토어 연결 전송 실패:', error);

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
            title: '❌ 전송 실패',
            description: errorMessage,
            color: 'danger',
          });
        }

        // 에러 처리
        if (validatedConfig.enableErrorHandling && errorHandler?.handleError) {
          try {
            await errorHandler.handleError(
              error,
              currentStep,
              'manual_transfer'
            );
          } catch (handlerError) {
            console.error('❌ [BRIDGE_PHASE3] 에러 핸들러 실패:', handlerError);
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
    };

    // 🔒 뮤텍스로 보호된 실행
    return await safeExecuteBridgeOperation(
      'executeManualTransfer',
      performActualTransfer
    );
  }, [
    canTransfer,
    validatedConfig.debugMode,
    validatedConfig.enableErrorHandling,
    updateEditorContent,
    setEditorCompleted,
    updateFormValue,
    addToast,
    updateStatistics,
    currentStep,
    errorHandler,
  ]);

  // 🔧 통계 조회 함수
  const getStatistics = useCallback((): BridgeStatistics => {
    return { ...statistics };
  }, [statistics]);

  // 🔧 연결 상태 조회 함수
  const getConnectionState = useCallback((): BridgeConnectionState => {
    return { ...connectionState };
  }, [connectionState]);

  // 🔧 뮤텍스 상태 조회 함수 (새로 추가)
  const getBridgeMutexState = useCallback(() => {
    return {
      isBridgeUpdating,
      lastBridgeOperationTime,
      cooldownMs: BRIDGE_COOLDOWN_MS,
      timeUntilNextOperation: Math.max(
        0,
        BRIDGE_COOLDOWN_MS - (Date.now() - lastBridgeOperationTime)
      ),
    };
  }, []);

  // 🔧 디버그 정보 주기적 출력 (뮤텍스 정보 포함)
  useEffect(() => {
    if (!validatedConfig.debugMode) {
      return;
    }

    console.log('🔧 [BRIDGE_PHASE3] 디버그 모드 인터벌 시작 (뮤텍스 포함)');
    const debugInterval = setInterval(() => {
      const mutexState = getBridgeMutexState();
      console.log('📊 [BRIDGE_PHASE3] 상태 리포트:', {
        connectionState: getConnectionState(),
        mutexState,
        canTransfer,
        currentStep,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 30000); // 30초마다

    return () => {
      console.log('🔧 [BRIDGE_PHASE3] 디버그 모드 인터벌 정리');
      clearInterval(debugInterval);
    };
  }, [
    validatedConfig.debugMode,
    getConnectionState,
    getBridgeMutexState,
    canTransfer,
    currentStep,
  ]);

  // 🔧 반환 객체 (뮤텍스 상태 추가)
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
      getBridgeMutexState, // 새로 추가

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
      getBridgeMutexState,
      validatedConfig,
    ]
  );

  console.log('🔧 [BRIDGE_PHASE3] 훅 반환값 생성 완료 (뮤텍스 보호):', {
    isConnected: returnValue.isConnected,
    isTransferring: returnValue.isTransferring,
    canTransfer: returnValue.canTransfer,
    mutexProtected: true,
  });

  return returnValue;
};

// 🔧 전역 뮤텍스 상태 조회 유틸리티 (외부에서 사용 가능)
export const getBridgeMutexInfo = () => ({
  isBridgeUpdating,
  lastBridgeOperationTime,
  cooldownMs: BRIDGE_COOLDOWN_MS,
  timeUntilNextOperation: Math.max(
    0,
    BRIDGE_COOLDOWN_MS - (Date.now() - lastBridgeOperationTime)
  ),
});

console.log(
  '🌉 [BRIDGE_PHASE3] useBridgeIntegration 훅 모듈 로드 완료 - 뮤텍스 보호 적용'
);
console.log('🔒 [BRIDGE_MUTEX] 전역 뮤텍스 시스템 초기화 완료:', {
  cooldownMs: BRIDGE_COOLDOWN_MS,
  mutexEnabled: true,
});
