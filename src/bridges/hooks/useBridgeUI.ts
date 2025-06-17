// bridges/hooks/useBridgeUI.ts

//====여기부터 수정됨====
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
//====여기까지 수정됨====
import { useEditorMultiStepBridge } from '../editorMultiStepBridge/useEditorMultiStepBridge';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
} from '../editorMultiStepBridge/bridgeTypes';

// 에디터 상태 훅 import - 실제 에디터 데이터 연결을 위함
import { useEditorState } from '../../components/moduleEditor/hooks/editorStateHooks/useEditorStateMain';

// 브릿지 UI 상태를 나타내는 인터페이스
// 사용자가 화면에서 볼 수 있는 모든 정보를 담음
interface BridgeUIState {
  // 현재 마크다운 전송이 가능한지 여부 - 버튼 활성화/비활성화 결정
  readonly canTransfer: boolean;

  // 전송 작업이 진행 중인지 여부 - 로딩 상태 표시용
  readonly isTransferring: boolean;

  // 마지막 전송 시도의 결과 - 성공/실패 피드백 표시용
  readonly lastTransferResult: BridgeOperationExecutionResult | null;

  // 발생한 오류들의 목록 - 사용자에게 문제 상황 알림용
  readonly transferErrors: BridgeOperationErrorDetails[];

  // 경고 메시지들의 목록 - 개선 권장사항 표시용
  readonly transferWarnings: string[];

  // 총 전송 시도 횟수 - 사용 통계 표시용
  readonly transferAttemptCount: number;
}

// 에디터 데이터 검증 상태를 나타내는 인터페이스
// 전송 전 데이터 품질을 사용자에게 시각적으로 표시
interface EditorValidationStatus {
  // 전체 컨테이너 개수 - 구조화 수준 파악용
  readonly containerCount: number;

  // 전체 문단 개수 - 콘텐츠 볼륨 파악용
  readonly paragraphCount: number;

  // 컨테이너에 할당된 문단 수 - 구조화 완료도 표시용
  readonly assignedParagraphCount: number;

  // 아직 할당되지 않은 문단 수 - 미완료 작업량 표시용
  readonly unassignedParagraphCount: number;

  // 전체 콘텐츠 글자 수 - 콘텐츠 분량 표시용
  readonly totalContentLength: number;

  // 검증에서 발견된 오류들 - 전송 차단 요인들
  readonly validationErrors: string[];

  // 검증에서 발견된 경고들 - 개선 권장사항들
  readonly validationWarnings: string[];

  // 전송 준비가 완료되었는지 여부 - 최종 전송 가능 상태
  readonly isReadyForTransfer: boolean;
}

// 브릿지 UI용 액션 함수들을 정의하는 인터페이스
// 사용자가 UI에서 수행할 수 있는 모든 작업들
interface BridgeUIActions {
  // 수동으로 마크다운 전송을 실행하는 함수
  executeManualTransfer: () => Promise<void>;

  // 현재 전송 가능 여부를 즉시 확인하는 함수
  checkCurrentTransferStatus: () => boolean;

  // 모든 브릿지 상태를 초기화하는 함수
  resetAllBridgeState: () => void;

  // 에디터 데이터의 현재 검증 상태를 새로고침하는 함수
  refreshValidationStatus: () => void;
}

// 브릿지 UI 훅의 전체 반환 타입
// 상태와 액션을 모두 포함하는 완전한 인터페이스
interface BridgeUIHookReturn extends BridgeUIState, BridgeUIActions {
  // 현재 적용된 브릿지 설정 정보
  readonly bridgeConfiguration: BridgeSystemConfiguration;

  // 에디터 데이터의 검증 상태 정보
  readonly validationStatus: EditorValidationStatus;
}

/**
 * 브릿지 UI 기능을 제공하는 커스텀 훅
 * 에디터와 멀티스텝 폼 사이의 데이터 전송을 UI 관점에서 관리
 *
 * @param customBridgeConfig - 선택적 브릿지 설정 (기본값으로 표준 설정 사용)
 * @returns 브릿지 UI에 필요한 모든 상태와 액션 함수들
 *
 * 주요 기능:
 * 1. 전송 가능 여부 실시간 판단
 * 2. 전송 상태 추적 및 표시
 * 3. 검증 결과 시각화
 * 4. 오류 및 경고 메시지 관리
 * 5. 사용자 액션 처리
 */
export const useBridgeUI = (
  customBridgeConfig?: Partial<BridgeSystemConfiguration>
): BridgeUIHookReturn => {
  console.log('🎨 [BRIDGE_UI] 브릿지 UI 훅 초기화 시작');

  //====여기부터 수정됨====
  // 초기화 완료 여부를 추적하는 ref
  // 1. 한 번만 초기화 실행되도록 보장 2. 중복 초기화 방지
  const isInitializedRef = useRef(false);
  //====여기까지 수정됨====

  // 기본 브릿지 훅과 연결 - 실제 데이터 전송 로직 제공
  const bridgeHook = useEditorMultiStepBridge(customBridgeConfig);

  // 에디터 상태 훅과 연결 - 실제 에디터 데이터 가져오기
  const editorState = useEditorState();
  const {
    localContainers: currentContainers,
    localParagraphs: currentParagraphs,
    internalState: editorInternalState,
  } = editorState;

  // 검증 상태를 강제로 새로고침하기 위한 트리거 상태
  // 사용자가 "새로고침" 버튼을 클릭했을 때 재계산 유도
  const [validationRefreshTrigger, setValidationRefreshTrigger] =
    useState<number>(0);

  // 마지막 검증 실행 시간을 추적하여 불필요한 재계산 방지
  const lastValidationTimeRef = useRef<number>(0);

  //====여기부터 수정됨====
  // 컴포넌트 마운트 시 UI 브릿지 상태 완전 초기화
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [BRIDGE_UI] UI 브릿지 훅 완전 초기화 시작');

      // 1. 검증 상태 트리거 초기화
      setValidationRefreshTrigger(0);

      // 2. 마지막 검증 시간 초기화
      lastValidationTimeRef.current = 0;

      // 3. 기본 브릿지 훅도 초기화 (필요시)
      try {
        if (bridgeHook.resetBridgeState) {
          bridgeHook.resetBridgeState();
          console.log('🔄 [BRIDGE_UI] 기본 브릿지 상태도 초기화 완료');
        }
      } catch (error) {
        console.error('❌ [BRIDGE_UI] 기본 브릿지 초기화 중 오류:', error);
      }

      isInitializedRef.current = true;
      console.log('✅ [BRIDGE_UI] UI 브릿지 훅 완전 초기화 완료');
    }
  }, []); // 1. 빈 의존성 배열 2. 마운트 시 한 번만 실행
  //====여기까지 수정됨====

  // 브릿지 훅에서 필요한 상태들을 구조분해할당으로 추출
  const {
    isTransferInProgress: currentTransferInProgress,
    lastTransferResult: mostRecentTransferResult,
    transferErrorDetails: accumulatedTransferErrors,
    transferWarningMessages: accumulatedWarningMessages,
    transferCount: totalTransferAttempts,
    executeManualTransfer: performManualTransfer,
    checkCanTransfer: validateCurrentTransferCapability,
    resetBridgeState: clearAllBridgeState,
    bridgeConfiguration: activeBridgeConfiguration,
  } = bridgeHook;

  // 에디터 데이터 검증 상태를 실시간으로 계산하는 메모이제이션
  // 에디터 상태나 새로고침 트리거가 변경될 때만 재계산
  const calculatedValidationStatus = useMemo<EditorValidationStatus>(() => {
    console.log('🔍 [BRIDGE_UI] 검증 상태 계산 시작');

    const calculationStartTime = performance.now();

    try {
      // 현재 전송 가능 여부를 먼저 확인
      const isCurrentlyTransferable = validateCurrentTransferCapability();

      // 실제 에디터 데이터를 활용한 통계 계산
      const containerCount = currentContainers?.length || 0;
      const paragraphCount = currentParagraphs?.length || 0;

      // 컨테이너에 할당된 문단들 계산
      // containerId가 null이 아닌 문단들은 할당된 것으로 간주
      const assignedParagraphs =
        currentParagraphs?.filter(
          (paragraph) =>
            paragraph.containerId !== null &&
            paragraph.containerId !== undefined
        ) || [];
      const assignedParagraphCount = assignedParagraphs.length;

      // 아직 할당되지 않은 문단들 계산
      // containerId가 null인 문단들은 미할당으로 간주
      const unassignedParagraphs =
        currentParagraphs?.filter(
          (paragraph) =>
            paragraph.containerId === null ||
            paragraph.containerId === undefined
        ) || [];
      const unassignedParagraphCount = unassignedParagraphs.length;

      // 전체 콘텐츠 길이 계산
      // 모든 문단의 content 필드 길이를 합산
      const totalContentLength =
        currentParagraphs?.reduce((totalLength, paragraph) => {
          const contentLength = paragraph?.content?.length || 0;
          return totalLength + contentLength;
        }, 0) || 0;

      // 기본적인 검증 오류 확인
      const validationErrors: string[] = [];

      // 최소 콘텐츠 요구사항 검증
      if (containerCount === 0) {
        validationErrors.push('컨테이너가 없습니다');
      }

      if (paragraphCount === 0) {
        validationErrors.push('문단이 없습니다');
      }

      if (totalContentLength < 10) {
        validationErrors.push('콘텐츠가 너무 짧습니다 (최소 10자 필요)');
      }

      // 기본적인 검증 경고 확인
      const validationWarnings: string[] = [];

      // 권장사항 검증
      if (containerCount < 2) {
        validationWarnings.push('컨테이너가 2개 미만입니다 (권장: 2개 이상)');
      }

      if (paragraphCount < 3) {
        validationWarnings.push('문단이 3개 미만입니다 (권장: 3개 이상)');
      }

      if (unassignedParagraphCount > 0) {
        validationWarnings.push(
          `미할당 문단이 ${unassignedParagraphCount}개 있습니다`
        );
      }

      if (totalContentLength < 100) {
        validationWarnings.push('콘텐츠가 100자 미만입니다 (권장: 100자 이상)');
      }

      // 빈 컨테이너 확인
      const emptyContainers =
        currentContainers?.filter((container) => {
          const containerParagraphs =
            currentParagraphs?.filter(
              (paragraph) => paragraph.containerId === container.id
            ) || [];
          return containerParagraphs.length === 0;
        }) || [];

      if (emptyContainers.length > 0) {
        validationWarnings.push(
          `빈 컨테이너가 ${emptyContainers.length}개 있습니다`
        );
      }

      // 최종 전송 준비 상태 판단
      // 기본 브릿지 검증과 UI 검증이 모두 통과되어야 함
      const isReadyForTransfer =
        isCurrentlyTransferable && validationErrors.length === 0;

      const calculatedValidationData: EditorValidationStatus = {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        validationErrors,
        validationWarnings,
        isReadyForTransfer,
      };

      const calculationEndTime = performance.now();
      const calculationDuration = calculationEndTime - calculationStartTime;

      console.log('✅ [BRIDGE_UI] 검증 상태 계산 완료:', {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        errorCount: validationErrors.length,
        warningCount: validationWarnings.length,
        isReadyForTransfer,
        calculationDuration: `${calculationDuration.toFixed(2)}ms`,
      });

      return calculatedValidationData;
    } catch (validationCalculationError) {
      console.error(
        '❌ [BRIDGE_UI] 검증 상태 계산 중 오류:',
        validationCalculationError
      );

      // 오류 발생 시 안전한 기본값 반환
      return {
        containerCount: 0,
        paragraphCount: 0,
        assignedParagraphCount: 0,
        unassignedParagraphCount: 0,
        totalContentLength: 0,
        validationErrors: ['검증 상태 계산 중 오류가 발생했습니다'],
        validationWarnings: [],
        isReadyForTransfer: false,
      };
    }
  }, [
    validateCurrentTransferCapability, // 전송 가능성이 변경될 때
    validationRefreshTrigger, // 사용자가 수동 새로고침할 때
    currentContainers, // 에디터 컨테이너가 변경될 때
    currentParagraphs, // 에디터 문단이 변경될 때
  ]);

  // UI에서 사용할 수 있는 향상된 전송 실행 함수
  // 기본 전송 기능에 UI 피드백과 오류 처리를 추가
  const executeTransferWithUIFeedback = useCallback(async (): Promise<void> => {
    console.log('🚀 [BRIDGE_UI] UI 피드백 포함 전송 실행 시작');

    // 전송 진행 중이면 중복 실행 방지
    if (currentTransferInProgress) {
      console.warn('⚠️ [BRIDGE_UI] 이미 전송 진행 중, 중복 실행 차단');
      return;
    }

    // 전송 가능 상태가 아니면 사전 차단
    if (!calculatedValidationStatus.isReadyForTransfer) {
      console.warn('⚠️ [BRIDGE_UI] 전송 불가능 상태, 실행 차단');
      // TODO: 사용자에게 전송 불가 이유를 토스트로 알림
      return;
    }

    const transferStartTime = performance.now();

    try {
      // 실제 브릿지 전송 실행
      await performManualTransfer();

      const transferEndTime = performance.now();
      const transferDuration = transferEndTime - transferStartTime;

      console.log('✅ [BRIDGE_UI] 전송 완료:', {
        duration: `${transferDuration.toFixed(2)}ms`,
        hasErrors: accumulatedTransferErrors.length > 0,
        hasWarnings: accumulatedWarningMessages.length > 0,
      });

      // 전송 완료 후 검증 상태 새로고침
      setValidationRefreshTrigger((prev) => prev + 1);

      // TODO: 성공 토스트 표시
    } catch (transferExecutionError) {
      console.error(
        '❌ [BRIDGE_UI] 전송 실행 중 오류:',
        transferExecutionError
      );

      // TODO: 실패 토스트 표시
    }
  }, [
    currentTransferInProgress,
    calculatedValidationStatus.isReadyForTransfer,
    performManualTransfer,
    accumulatedTransferErrors.length,
    accumulatedWarningMessages.length,
  ]);

  // 현재 전송 상태를 즉시 확인하는 함수
  // 실시간으로 버튼 활성화/비활성화 상태 결정에 사용
  const checkCurrentTransferCapability = useCallback((): boolean => {
    console.log('🔍 [BRIDGE_UI] 현재 전송 가능성 확인');

    // 전송 진행 중이면 불가능
    if (currentTransferInProgress) {
      console.log('📊 [BRIDGE_UI] 전송 진행 중으로 불가능');
      return false;
    }

    // 검증 상태가 준비되지 않았으면 불가능
    if (!calculatedValidationStatus.isReadyForTransfer) {
      console.log('📊 [BRIDGE_UI] 검증 상태 미준비로 불가능');
      return false;
    }

    // 기본 브릿지 검증도 통과해야 함
    const basicTransferCapability = validateCurrentTransferCapability();

    console.log(
      '📊 [BRIDGE_UI] 전송 가능성 최종 결과:',
      basicTransferCapability
    );
    return basicTransferCapability;
  }, [
    currentTransferInProgress,
    calculatedValidationStatus.isReadyForTransfer,
    validateCurrentTransferCapability,
  ]);

  // 모든 브릿지 상태를 초기화하고 UI 상태도 함께 리셋
  const resetAllBridgeAndUIState = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI] 전체 브릿지 및 UI 상태 초기화');

    //====여기부터 수정됨====
    try {
      // 1. 기본 브릿지 상태 초기화
      clearAllBridgeState();

      // 2. UI 특화 상태들도 초기화
      setValidationRefreshTrigger(0);
      lastValidationTimeRef.current = 0;

      // 3. 초기화 플래그 리셋 (재초기화 허용)
      isInitializedRef.current = false;

      console.log('✅ [BRIDGE_UI] 전체 상태 초기화 완료');
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 상태 초기화 중 오류:', error);
    }
    //====여기까지 수정됨====
  }, [clearAllBridgeState]);

  // 검증 상태를 수동으로 새로고침하는 함수
  // 사용자가 에디터 내용을 변경한 후 즉시 상태 업데이트가 필요할 때 사용
  const refreshCurrentValidationStatus = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI] 검증 상태 수동 새로고침');

    const currentTime = Date.now();
    const timeSinceLastValidation = currentTime - lastValidationTimeRef.current;

    // 너무 빈번한 새로고침 방지 (최소 100ms 간격)
    if (timeSinceLastValidation < 100) {
      console.warn('⚠️ [BRIDGE_UI] 새로고침 요청이 너무 빈번함, 무시');
      return;
    }

    lastValidationTimeRef.current = currentTime;
    setValidationRefreshTrigger((prev) => prev + 1);

    console.log('✅ [BRIDGE_UI] 검증 상태 새로고침 트리거 완료');
  }, []);

  // 최종 반환 객체 구성
  const bridgeUIReturn: BridgeUIHookReturn = {
    // 브릿지 상태 정보
    canTransfer: checkCurrentTransferCapability(),
    isTransferring: currentTransferInProgress,
    lastTransferResult: mostRecentTransferResult,
    transferErrors: accumulatedTransferErrors,
    transferWarnings: accumulatedWarningMessages,
    transferAttemptCount: totalTransferAttempts,

    // 브릿지 설정 정보
    bridgeConfiguration: activeBridgeConfiguration,

    // 검증 상태 정보
    validationStatus: calculatedValidationStatus,

    // 액션 함수들
    executeManualTransfer: executeTransferWithUIFeedback,
    checkCurrentTransferStatus: checkCurrentTransferCapability,
    resetAllBridgeState: resetAllBridgeAndUIState,
    refreshValidationStatus: refreshCurrentValidationStatus,
  };

  console.log('✅ [BRIDGE_UI] 브릿지 UI 훅 초기화 완료:', {
    canTransfer: bridgeUIReturn.canTransfer,
    isTransferring: bridgeUIReturn.isTransferring,
    errorCount: bridgeUIReturn.transferErrors.length,
    warningCount: bridgeUIReturn.transferWarnings.length,
  });

  return bridgeUIReturn;
};
