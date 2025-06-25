// bridges/editorMultiStepBridge/bidirectionalSyncManager.ts

import { BidirectionalSyncResult } from './bridgeDataTypes';
import { createEditorStateExtractor } from './editorDataExtractor';
import { createMultiStepDataExtractor } from './multiStepDataExtractor';
import { createDataStructureTransformer } from './editorToMultiStepTransformer';
import { createMultiStepToEditorTransformer } from './multiStepToEditorTransformer';
import { createMultiStepStateUpdater } from './multiStepDataUpdater';
import { createEditorDataUpdater } from './editorDataUpdater';

// 🔧 P1-4: 타입 가드 함수 강화
function createSyncTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  const isValidMap = (
    candidate: unknown
  ): candidate is Map<string, unknown> => {
    return candidate instanceof Map;
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidArray,
    isValidMap,
  };
}

// 🔧 P1-5: 에러 처리 강화
function createSyncErrorHandlerModule() {
  const { isValidString } = createSyncTypeGuardModule();

  const safelyExecuteAsyncOperation = async <T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (operationError) {
      console.error(`❌ [${operationName}] 비동기 실행 실패:`, operationError);
      return fallbackValue;
    }
  };

  const safelyExecuteSyncOperation = <T>(
    operation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      return operation();
    } catch (operationError) {
      console.error(`❌ [${operationName}] 동기 실행 실패:`, operationError);
      return fallbackValue;
    }
  };

  const withAsyncTimeout = <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  };

  const extractErrorMessage = (error: unknown): string => {
    // Early Return: 에러가 Error 인스턴스인 경우
    if (error instanceof Error) {
      return error.message;
    }

    // Early Return: 에러가 문자열인 경우
    if (isValidString(error)) {
      return error;
    }

    // 기타 타입을 안전하게 문자열로 변환
    try {
      return String(error);
    } catch (conversionError) {
      console.warn('⚠️ [SYNC_MANAGER] 에러 메시지 변환 실패:', conversionError);
      return 'Unknown sync error';
    }
  };

  return {
    safelyExecuteAsyncOperation,
    safelyExecuteSyncOperation,
    withAsyncTimeout,
    extractErrorMessage,
  };
}

export const createBidirectionalSyncManager = () => {
  // 🔧 P1-3: 구조분해할당으로 모듈 인스턴스 생성
  const editorExtractor = createEditorStateExtractor();
  const multiStepExtractor = createMultiStepDataExtractor();
  const editorToMultiStepTransformer = createDataStructureTransformer();
  const multiStepToEditorTransformer = createMultiStepToEditorTransformer();
  const multiStepUpdater = createMultiStepStateUpdater();
  const editorUpdater = createEditorDataUpdater();

  const {
    safelyExecuteAsyncOperation,
    safelyExecuteSyncOperation,
    withAsyncTimeout,
    extractErrorMessage,
  } = createSyncErrorHandlerModule();
  const { isValidString, isValidNumber, isValidBoolean } =
    createSyncTypeGuardModule();

  // 🔧 P1-3: 구조분해할당과 Fallback을 활용한 동기화 메타데이터 생성 함수
  const createSyncMetadata = (
    startTime: number,
    endTime: number,
    editorToMultiStepSuccess: boolean,
    multiStepToEditorSuccess: boolean,
    syncErrors: string[]
  ): Map<string, string | number | boolean> => {
    const syncDuration = endTime - startTime;

    return new Map<string, string | number | boolean>([
      ['syncStartTime', startTime],
      ['syncEndTime', endTime],
      ['syncDuration', syncDuration],
      ['editorToMultiStepSuccess', editorToMultiStepSuccess],
      ['multiStepToEditorSuccess', multiStepToEditorSuccess],
      ['totalErrors', syncErrors.length],
      ['overallSuccess', editorToMultiStepSuccess && multiStepToEditorSuccess],
      ['syncTimestamp', new Date().toISOString()],
    ]);
  };

  const syncEditorToMultiStep = async (): Promise<boolean> => {
    console.log('🔄 [SYNC_MANAGER] Editor → MultiStep 동기화 시작');
    const startTime = performance.now();

    return safelyExecuteAsyncOperation(
      async () => {
        // 🔧 P1-5: 타임아웃과 함께 실행
        return withAsyncTimeout(
          executeSyncEditorToMultiStep(startTime),
          10000, // 10초 타임아웃
          'Editor → MultiStep 동기화 타임아웃'
        );
      },
      false,
      'EDITOR_TO_MULTISTEP_SYNC'
    );
  };

  const executeSyncEditorToMultiStep = async (
    startTime: number
  ): Promise<boolean> => {
    const editorData = editorExtractor.getEditorStateWithValidation();

    // Early Return: 에디터 데이터 추출 실패
    if (!editorData) {
      throw new Error('Editor 데이터 추출 실패');
    }

    const transformResult =
      editorToMultiStepTransformer.transformEditorStateToMultiStep(editorData);

    // 🔧 P1-3: 구조분해할당 + Fallback
    const { transformationSuccess = false, transformationErrors = [] } =
      transformResult;

    // Early Return: 데이터 변환 실패
    if (!transformationSuccess) {
      throw new Error(`데이터 변환 실패: ${transformationErrors.join(', ')}`);
    }

    const updateSuccess = await multiStepUpdater.performCompleteStateUpdate(
      transformResult
    );

    // Early Return: MultiStep 업데이트 실패
    if (!updateSuccess) {
      throw new Error('MultiStep 업데이트 실패');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log('✅ [SYNC_MANAGER] Editor → MultiStep 동기화 완료:', {
      duration: `${duration.toFixed(2)}ms`,
      contentLength: transformResult.transformedContent?.length ?? 0,
    });

    return true;
  };

  const syncMultiStepToEditor = async (): Promise<boolean> => {
    console.log('🔄 [SYNC_MANAGER] MultiStep → Editor 동기화 시작');
    const startTime = performance.now();

    return safelyExecuteAsyncOperation(
      async () => {
        // 🔧 P1-5: 타임아웃과 함께 실행
        return withAsyncTimeout(
          executeSyncMultiStepToEditor(startTime),
          10000, // 10초 타임아웃
          'MultiStep → Editor 동기화 타임아웃'
        );
      },
      false,
      'MULTISTEP_TO_EDITOR_SYNC'
    );
  };

  const executeSyncMultiStepToEditor = async (
    startTime: number
  ): Promise<boolean> => {
    const multiStepData = multiStepExtractor.extractMultiStepData();

    // Early Return: MultiStep 데이터 추출 실패
    if (!multiStepData) {
      throw new Error('MultiStep 데이터 추출 실패');
    }

    const isValidData = multiStepExtractor.validateMultiStepData(multiStepData);

    // Early Return: MultiStep 데이터 검증 실패
    if (!isValidData) {
      throw new Error('MultiStep 데이터 검증 실패');
    }

    const transformResult =
      multiStepToEditorTransformer.transformMultiStepToEditor(multiStepData);

    // 🔧 P1-3: 구조분해할당 + Fallback
    const {
      transformationSuccess = false,
      transformationErrors = [],
      editorContent = '',
      editorIsCompleted = false,
    } = transformResult;

    // Early Return: 데이터 변환 실패
    if (!transformationSuccess) {
      throw new Error(`데이터 변환 실패: ${transformationErrors.join(', ')}`);
    }

    const updateSuccess = await editorUpdater.updateEditorState(
      editorContent,
      editorIsCompleted
    );

    // Early Return: Editor 업데이트 실패
    if (!updateSuccess) {
      throw new Error('Editor 업데이트 실패');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log('✅ [SYNC_MANAGER] MultiStep → Editor 동기화 완료:', {
      duration: `${duration.toFixed(2)}ms`,
      contentLength: editorContent.length,
      isCompleted: editorIsCompleted,
    });

    return true;
  };

  const syncBidirectional = async (): Promise<BidirectionalSyncResult> => {
    console.log('🔄 [SYNC_MANAGER] 양방향 동기화 시작');
    const startTime = performance.now();

    return safelyExecuteAsyncOperation(
      async () => {
        // 🔧 P1-5: 타임아웃과 함께 실행
        return withAsyncTimeout(
          executeBidirectionalSync(startTime),
          15000, // 15초 타임아웃
          '양방향 동기화 타임아웃'
        );
      },
      createEmptyBidirectionalResult('양방향 동기화 실행 실패'),
      'BIDIRECTIONAL_SYNC'
    );
  };

  const executeBidirectionalSync = async (
    startTime: number
  ): Promise<BidirectionalSyncResult> => {
    const syncErrors: string[] = [];

    // 🔧 P1-5: 안전한 에러 처리로 각 동기화 실행
    const editorToMultiStepSuccess = await syncEditorToMultiStep().catch(
      (error) => {
        const errorMessage = extractErrorMessage(error);
        syncErrors.push(`Editor → MultiStep: ${errorMessage}`);
        return false;
      }
    );

    const multiStepToEditorSuccess = await syncMultiStepToEditor().catch(
      (error) => {
        const errorMessage = extractErrorMessage(error);
        syncErrors.push(`MultiStep → Editor: ${errorMessage}`);
        return false;
      }
    );

    // 🔧 P1-2: 삼항연산자로 전체 성공 여부 결정
    const overallSuccess =
      editorToMultiStepSuccess && multiStepToEditorSuccess ? true : false;
    const endTime = performance.now();
    const syncDuration = endTime - startTime;

    // 🔧 P1-3: 구조분해할당으로 syncMetadata 생성
    const syncMetadata = createSyncMetadata(
      startTime,
      endTime,
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      syncErrors
    );

    const result: BidirectionalSyncResult = {
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      overallSuccess,
      syncErrors: [...syncErrors], // 새 배열로 복사
      syncDuration,
      syncMetadata,
    };

    console.log('📊 [SYNC_MANAGER] 양방향 동기화 결과:', {
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      overallSuccess,
      errorCount: syncErrors.length,
      duration: `${syncDuration.toFixed(2)}ms`,
    });

    return result;
  };

  // 🔧 수정: 동기 함수로 변경하여 타입 에러 해결
  const checkSyncPreconditions = (): {
    canSyncToMultiStep: boolean;
    canSyncToEditor: boolean;
  } => {
    console.log('🔍 [SYNC_MANAGER] 동기화 사전 조건 확인');

    return safelyExecuteSyncOperation(
      () => {
        // 🔧 P1-2: 삼항연산자로 초기값 설정
        let canSyncToMultiStep = false;
        let canSyncToEditor = false;

        // Editor → MultiStep 사전 조건 체크
        try {
          const editorData = editorExtractor.getEditorStateWithValidation();
          canSyncToMultiStep = editorData ? true : false;
        } catch (error) {
          console.warn(
            '⚠️ [SYNC_MANAGER] Editor → MultiStep 사전 조건 실패:',
            error
          );
          canSyncToMultiStep = false;
        }

        // MultiStep → Editor 사전 조건 체크
        try {
          const multiStepData = multiStepExtractor.extractMultiStepData();
          const isValidData = multiStepData
            ? multiStepExtractor.validateMultiStepData(multiStepData)
            : false;
          canSyncToEditor = multiStepData && isValidData ? true : false;
        } catch (error) {
          console.warn(
            '⚠️ [SYNC_MANAGER] MultiStep → Editor 사전 조건 실패:',
            error
          );
          canSyncToEditor = false;
        }

        console.log('📋 [SYNC_MANAGER] 사전 조건 확인 결과:', {
          canSyncToMultiStep,
          canSyncToEditor,
          canSyncBidirectional: canSyncToMultiStep && canSyncToEditor,
        });

        return { canSyncToMultiStep, canSyncToEditor };
      },
      { canSyncToMultiStep: false, canSyncToEditor: false },
      'SYNC_PRECONDITION_CHECK'
    );
  };

  const validateSyncResult = (result: BidirectionalSyncResult): boolean => {
    // Early Return: result가 없는 경우
    if (!result || typeof result !== 'object') {
      return false;
    }

    // 🔧 P1-3: 구조분해할당으로 속성 추출
    const {
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      overallSuccess,
      syncErrors,
      syncDuration,
      syncMetadata,
    } = result;

    // 🔧 P1-4: 타입 가드를 통한 검증
    const hasValidBooleans =
      isValidBoolean(editorToMultiStepSuccess) &&
      isValidBoolean(multiStepToEditorSuccess) &&
      isValidBoolean(overallSuccess);

    // Early Return: boolean 타입이 유효하지 않은 경우
    if (!hasValidBooleans) {
      return false;
    }

    const hasValidErrors =
      Array.isArray(syncErrors) &&
      syncErrors.every((error) => isValidString(error));

    // Early Return: 에러 배열이 유효하지 않은 경우
    if (!hasValidErrors) {
      return false;
    }

    const hasValidDuration = isValidNumber(syncDuration);
    const hasValidMetadata = syncMetadata instanceof Map;

    return hasValidDuration && hasValidMetadata;
  };

  const createEmptyBidirectionalResult = (
    errorMessage: string
  ): BidirectionalSyncResult => {
    const currentTime = performance.now();

    // 🔧 P1-3: 구조분해할당으로 빈 메타데이터 생성
    const emptySyncMetadata = createSyncMetadata(
      currentTime,
      currentTime,
      false,
      false,
      [errorMessage]
    );

    return {
      editorToMultiStepSuccess: false,
      multiStepToEditorSuccess: false,
      overallSuccess: false,
      syncErrors: [errorMessage],
      syncDuration: 0,
      syncMetadata: emptySyncMetadata,
    };
  };

  const createEmptySyncResult = (): BidirectionalSyncResult => {
    return createEmptyBidirectionalResult('동기화가 실행되지 않음');
  };

  // 🔧 P1-5: 추가 유틸리티 함수들
  const getSyncStatistics = () => {
    return safelyExecuteSyncOperation(
      () => {
        const editorData = editorExtractor.getEditorStateWithValidation();
        const multiStepData = multiStepExtractor.extractMultiStepData();

        // 🔧 P1-3: 구조분해할당으로 통계 데이터 생성
        const {
          editorContainers: containerList = [],
          editorParagraphs: paragraphList = [],
          editorCompletedContent: completedContent = '',
        } = editorData ?? {};

        const { formCurrentStep = 0, formValues = null } = multiStepData ?? {};

        return {
          editor: {
            containerCount: containerList.length,
            paragraphCount: paragraphList.length,
            contentLength: completedContent.length,
            hasData: Boolean(editorData),
          },
          multiStep: {
            currentStep: formCurrentStep,
            hasFormValues: Boolean(formValues),
            hasData: Boolean(multiStepData),
          },
          canSync: {
            toMultiStep: Boolean(editorData),
            toEditor: Boolean(multiStepData),
          },
        };
      },
      {
        editor: {
          containerCount: 0,
          paragraphCount: 0,
          contentLength: 0,
          hasData: false,
        },
        multiStep: { currentStep: 0, hasFormValues: false, hasData: false },
        canSync: { toMultiStep: false, toEditor: false },
      },
      'SYNC_STATISTICS'
    );
  };

  return {
    syncEditorToMultiStep,
    syncMultiStepToEditor,
    syncBidirectional,
    checkSyncPreconditions,
    validateSyncResult,
    createEmptySyncResult,
    getSyncStatistics, // 🔧 P1-5: 추가된 통계 함수
  };
};
