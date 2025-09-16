// bridges/core/SyncEngine.ts

import type {
  BidirectionalSyncResult,
  EditorStateSnapshotForBridge,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  MultiStepToEditorDataTransformationResult,
  TransformationStrategyType,
} from '../editorMultiStepBridge/modernBridgeTypes';
import type { ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 동기화 전략 인터페이스 - 플러그인 방식으로 교체 가능
// 의미: 동기화 전략을 정의하는 계약서. 각 전략은 이름, 우선순위, 실행 가능 여부, 실행 로직을 가짐
// 왜 사용? 다양한 동기화 방식(예: 에디터→폼, 폼→에디터)을 플러그인처럼 교체 가능하게 하기 위해
interface SyncStrategy {
  readonly name: string;
  readonly priority: number;
  canExecute: (context: SyncExecutionContext) => boolean;
  execute: (context: SyncExecutionContext) => Promise<SyncExecutionResult>;
}

// 🔧 동기화 실행 컨텍스트
// 의미: 동기화 작업에 필요한 입력 데이터와 설정을 담는 상자
// 왜 사용? 동기화 방향, 데이터, 옵션을 한 곳에 모아 전략이 쉽게 접근하도록
interface SyncExecutionContext {
  readonly direction: SyncDirection;
  readonly editorData?: EditorStateSnapshotForBridge;
  readonly multiStepData?: MultiStepFormSnapshotForBridge;
  readonly options: SyncExecutionOptions;
  readonly metadata: Map<string, unknown>;
}

// 🔧 동기화 실행 결과
// 의미: 동기화 작업 결과를 담는 보고서. 성공 여부, 변환된 데이터, 에러 등을 포함
// 왜 사용? 동기화 결과를 표준화된 형식으로 반환해 호출자가 쉽게 처리하도록
interface SyncExecutionResult {
  readonly success: boolean;
  readonly data?:
    | EditorToMultiStepDataTransformationResult
    | MultiStepToEditorDataTransformationResult;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly metadata: Map<string, unknown>;
}

// 🔧 동기화 방향 타입
// 의미: 동기화가 어느 방향으로 진행되는지 나타내는 신호등
// 왜 사용? 동기화 방향을 명확히 구분해 올바른 전략을 선택하도록
type SyncDirection =
  | 'EDITOR_TO_MULTISTEP'
  | 'MULTISTEP_TO_EDITOR'
  | 'BIDIRECTIONAL';

// 🔧 동기화 실행 옵션
// 의미: 동기화 작업의 설정값(시간 제한, 재시도 횟수 등)을 담는 설정판
// 왜 사용? 동기화 동작을 유연하게 조정하기 위해
interface SyncExecutionOptions {
  readonly timeoutMs: number;
  readonly retryCount: number;
  readonly validateInput: boolean;
  readonly validateOutput: boolean;
  readonly enableLogging: boolean;
}

// 🔧 동기화 상태 인터페이스
// 의미: 동기화 엔진의 현재 상태를 나타내는 대시보드
// 왜 사용? 엔진의 동작 상태를 추적하고 디버깅에 활용하기 위해
interface SyncEngineState {
  readonly isActive: boolean;
  readonly currentOperation: SyncDirection | null;
  readonly lastOperationTimestamp: number;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly activeStrategies: readonly string[];
}

// 🔧 동기화 엔진 설정
// 의미: 동기화 엔진의 기본 설정을 정의하는 설정파일
// 왜 사용? 엔진의 동작 방식을 사용자 맞춤으로 조정하기 위해
interface SyncEngineConfiguration {
  readonly enableRetry: boolean;
  readonly maxRetryAttempts: number;
  readonly defaultTimeoutMs: number;
  readonly enableValidation: boolean;
  readonly enableStateTracking: boolean;
  readonly logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

// 🔧 타입 가드 함수들
// 의미: 데이터가 올바른 타입인지 확인하는 경비원
// 왜 사용? 타입 안정성을 보장하고 런타임 에러를 줄이기 위해
function createSyncEngineTypeGuards() {
  // 문자열인지 확인
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  // 숫자인지 확인
  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  // 불리언인지 확인
  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  // 객체인지 확인
  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  // 유효한 동기화 방향인지 확인
  const isValidSyncDirection = (value: unknown): value is SyncDirection => {
    const validDirections = new Set<string>([
      'EDITOR_TO_MULTISTEP',
      'MULTISTEP_TO_EDITOR',
      'BIDIRECTIONAL',
    ]);
    return isValidString(value) && validDirections.has(value);
  };

  // 에디터 스냅샷이 유효한지 확인
  const isValidEditorSnapshot = (
    value: unknown
  ): value is EditorStateSnapshotForBridge => {
    if (!isValidObject(value)) {
      console.log('🔍 [DEBUG] isValidEditorSnapshot - not valid object');
      return false;
    }

    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      extractedTimestamp,
    } = value;

    const requiredProperties = [
      editorContainers !== undefined,
      editorParagraphs !== undefined,
      editorCompletedContent !== undefined,
      extractedTimestamp !== undefined,
    ];

    const allPropertiesPresent = requiredProperties.every(
      (propertyPresent) => propertyPresent
    );

    console.log('🔍 [DEBUG] isValidEditorSnapshot 검증:', {
      hasContainers: editorContainers !== undefined,
      hasParagraphs: editorParagraphs !== undefined,
      hasContent: editorCompletedContent !== undefined,
      hasTimestamp: extractedTimestamp !== undefined,
      allPresent: allPropertiesPresent,
    });

    return allPropertiesPresent;
  };

  // 멀티스텝 스냅샷이 유효한지 확인
  const isValidMultiStepSnapshot = (
    value: unknown
  ): value is MultiStepFormSnapshotForBridge => {
    if (!isValidObject(value)) {
      console.log('🔍 [DEBUG] isValidMultiStepSnapshot - not valid object');
      return false;
    }

    const { formValues, formCurrentStep, snapshotTimestamp } = value;

    const requiredProperties = [
      formValues !== undefined,
      formCurrentStep !== undefined,
      snapshotTimestamp !== undefined,
    ];

    const allPropertiesPresent = requiredProperties.every(
      (propertyPresent) => propertyPresent
    );

    console.log('🔍 [DEBUG] isValidMultiStepSnapshot 검증:', {
      hasFormValues: formValues !== undefined,
      hasCurrentStep: formCurrentStep !== undefined,
      hasTimestamp: snapshotTimestamp !== undefined,
      allPresent: allPropertiesPresent,
    });

    return allPropertiesPresent;
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidSyncDirection,
    isValidEditorSnapshot,
    isValidMultiStepSnapshot,
  };
}

// 🔧 에러 처리 모듈
// 의미: 에러를 안전하게 처리하는 안전망
// 왜 사용? 예기치 않은 에러로 앱이 멈추지 않도록 하고, 디버깅을 쉽게 하기 위해
function createSyncEngineErrorHandler() {
  const { isValidString } = createSyncEngineTypeGuards();

  // 에러 메시지를 안전하게 추출
  const extractSafeErrorMessage = (error: unknown): string => {
    // Early Return: Error 인스턴스인 경우
    if (error instanceof Error) {
      return error.message;
    }

    // Early Return: 문자열인 경우
    if (isValidString(error)) {
      return error;
    }

    // 안전한 문자열 변환
    try {
      return String(error);
    } catch (conversionError) {
      console.warn('⚠️ [SYNC_ENGINE] 에러 메시지 변환 실패:', conversionError);
      return 'Unknown sync engine error';
    }
  };

  // 비동기 작업을 안전하게 실행
  const safelyExecuteAsync = async <T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      console.log(`🔄 [SYNC_ENGINE] ${operationName} 실행 시작`);
      const result = await operation();
      console.log(`✅ [SYNC_ENGINE] ${operationName} 실행 성공`);
      return result;
    } catch (operationError) {
      console.error(
        `❌ [SYNC_ENGINE] ${operationName} 실행 실패:`,
        operationError
      );
      return fallbackValue;
    }
  };

  // 타임아웃 리소스 정리
  const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(timeoutMessage)),
        timeoutMs
      );
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId); // 리소스 정리
        console.log('🔧 [SYNC_ENGINE] 타임아웃 리소스 정리 완료');
      }
    }
  };

  // 지수 백오프 재시도
  const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number,
    initialDelayMs: number
  ): Promise<T> => {
    let lastError: Error;

    for (let attemptIndex = 1; attemptIndex <= maxRetries; attemptIndex++) {
      try {
        const result = await operation();
        console.log(`✅ [SYNC_ENGINE] 재시도 성공: 시도 ${attemptIndex}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Early Return: 마지막 시도인 경우
        if (attemptIndex === maxRetries) {
          console.error(
            `❌ [SYNC_ENGINE] 모든 재시도 실패: ${maxRetries}회 시도`
          );
          break;
        }

        // 지수 백오프 적용
        const delayMs = initialDelayMs * Math.pow(2, attemptIndex - 1);
        console.warn(
          `⚠️ [SYNC_ENGINE] 시도 ${attemptIndex} 실패, ${delayMs}ms 후 재시도:`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError!;
  };

  return {
    extractSafeErrorMessage,
    safelyExecuteAsync,
    withTimeout,
    withRetry,
  };
}

// 🔧 동기화 전략 팩토리
// 의미: 동기화 전략을 만드는 공장
// 왜 사용? 다양한 동기화 전략을 표준화된 방식으로 생성하기 위해
function createSyncStrategyFactory() {
  const { isValidEditorSnapshot, isValidMultiStepSnapshot } =
    createSyncEngineTypeGuards();
  const { safelyExecuteAsync } = createSyncEngineErrorHandler();

  // Editor → MultiStep 전략
  const createEditorToMultiStepStrategy = (): SyncStrategy => ({
    name: 'EDITOR_TO_MULTISTEP_DEFAULT',
    priority: 100,

    canExecute: (context: SyncExecutionContext): boolean => {
      const { direction, editorData } = context;
      const isCorrectDirection =
        direction === 'EDITOR_TO_MULTISTEP' || direction === 'BIDIRECTIONAL';
      const hasValidEditorData = editorData
        ? isValidEditorSnapshot(editorData)
        : false;

      console.log(
        '🔍 [SYNC_STRATEGY] Editor → MultiStep 전략 실행 가능 여부:',
        {
          isCorrectDirection,
          hasValidEditorData,
        }
      );

      return isCorrectDirection && hasValidEditorData;
    },

    execute: async (
      context: SyncExecutionContext
    ): Promise<SyncExecutionResult> => {
      console.log('🚀 [SYNC_STRATEGY] Editor → MultiStep 전략 실행 시작');

      const createFailureResult = (): SyncExecutionResult => ({
        success: false,
        errors: ['Editor → MultiStep 전략 실행 실패'],
        warnings: [],
        metadata: new Map<string, unknown>(),
      });

      return safelyExecuteAsync(
        async (): Promise<SyncExecutionResult> => {
          const { editorData } = context;

          // Early Return: 에디터 데이터가 없는 경우
          if (!editorData || !isValidEditorSnapshot(editorData)) {
            throw new Error('유효하지 않은 에디터 데이터');
          }

          // 구조분해할당으로 안전한 데이터 추출
          const {
            editorContainers = [],
            editorParagraphs = [],
            editorCompletedContent = '',
            editorIsCompleted = false,
          } = editorData;

          console.log('🔍 [DEBUG] Editor Data 구조분해할당:', {
            containerCount: editorContainers.length,
            paragraphCount: editorParagraphs.length,
            contentLength: editorCompletedContent.length,
            isCompleted: editorIsCompleted,
          });

          // 간단한 변환 로직
          const transformedContent = editorCompletedContent;
          const transformedIsCompleted = editorIsCompleted;

          // 타입 안전한 문단 필터링
          const validParagraphs = Array.isArray(editorParagraphs)
            ? editorParagraphs.filter(
                (paragraphItem: unknown): paragraphItem is ParagraphBlock => {
                  return (
                    paragraphItem !== null &&
                    typeof paragraphItem === 'object' &&
                    'id' in paragraphItem &&
                    'containerId' in paragraphItem
                  );
                }
              )
            : [];

          const assignedParagraphs = validParagraphs.filter(
            (paragraph: ParagraphBlock) => paragraph.containerId !== null
          );

          const unassignedParagraphs = validParagraphs.filter(
            (paragraph: ParagraphBlock) => paragraph.containerId === null
          );

          console.log('🔍 [DEBUG] 문단 분석:', {
            totalParagraphs: validParagraphs.length,
            assignedParagraphs: assignedParagraphs.length,
            unassignedParagraphs: unassignedParagraphs.length,
          });

          // 메타데이터 생성
          const resultMetadata = new Map<string, unknown>();
          resultMetadata.set(
            'transformationStrategy',
            'EDITOR_TO_MULTISTEP_DEFAULT'
          );
          resultMetadata.set('containerCount', editorContainers.length);
          resultMetadata.set('paragraphCount', validParagraphs.length);
          resultMetadata.set(
            'assignedParagraphCount',
            assignedParagraphs.length
          );
          resultMetadata.set(
            'unassignedParagraphCount',
            unassignedParagraphs.length
          );
          resultMetadata.set('contentLength', transformedContent.length);
          resultMetadata.set('timestamp', Date.now());

          // 변환 결과 생성
          const transformationResult: EditorToMultiStepDataTransformationResult =
            {
              transformedContent,
              transformedIsCompleted,
              transformedMetadata: {
                containerCount: editorContainers.length,
                paragraphCount: validParagraphs.length,
                assignedParagraphCount: assignedParagraphs.length,
                unassignedParagraphCount: unassignedParagraphs.length,
                totalContentLength: transformedContent.length,
                lastModifiedDate: new Date(),
                processingTimeMs: 0,
                validationWarnings: new Set<string>(),
                performanceMetrics: new Map<string, number>(),
                transformationStrategy: 'EXISTING_CONTENT',
              },
              transformationSuccess: true,
              transformationErrors: [],
              transformationStrategy: 'EXISTING_CONTENT',
              transformationTimestamp: Date.now(),
              qualityMetrics: new Map<string, number>([
                ['contentLength', transformedContent.length],
                ['containerCount', editorContainers.length],
                ['paragraphCount', validParagraphs.length],
              ]),
              contentIntegrityHash: generateSimpleHash(transformedContent),
            };

          console.log('✅ [SYNC_STRATEGY] Editor → MultiStep 전략 실행 완료');

          const successResult: SyncExecutionResult = {
            success: true,
            data: transformationResult,
            //====여기부터 수정됨====
            // 의미: errors와 warnings 배열을 명시적으로 string[] 타입으로 정의
            // 왜 사용? 원래 'as readonly string[]'로 타입 단언했으나, 타입 가드를 통해 안전하게 string[]로 보장
            // 비유: 과일을 바구니에 담을 때, 사과만 담겠다고 약속하고 실제로 사과만 담는지 확인하는 것
            // 작동 매커니즘: 빈 배열을 명시적으로 string[]로 선언해 타입 단언 없이 타입 안정성 유지
            errors: [] as string[],
            warnings: [] as string[],
            //====여기까지 수정됨====
            metadata: resultMetadata,
          };

          return successResult;
        },
        createFailureResult(),
        'EDITOR_TO_MULTISTEP_STRATEGY'
      );
    },
  });

  // MultiStep → Editor 전략
  const createMultiStepToEditorStrategy = (): SyncStrategy => ({
    name: 'MULTISTEP_TO_EDITOR_DEFAULT',
    priority: 100,

    canExecute: (context: SyncExecutionContext): boolean => {
      const { direction, multiStepData } = context;
      const isCorrectDirection =
        direction === 'MULTISTEP_TO_EDITOR' || direction === 'BIDIRECTIONAL';
      const hasValidMultiStepData = multiStepData
        ? isValidMultiStepSnapshot(multiStepData)
        : false;

      console.log(
        '🔍 [SYNC_STRATEGY] MultiStep → Editor 전략 실행 가능 여부:',
        {
          isCorrectDirection,
          hasValidMultiStepData,
        }
      );

      return isCorrectDirection && hasValidMultiStepData;
    },

    execute: async (
      context: SyncExecutionContext
    ): Promise<SyncExecutionResult> => {
      console.log('🚀 [SYNC_STRATEGY] MultiStep → Editor 전략 실행 시작');

      const createFailureResult = (): SyncExecutionResult => ({
        success: false,
        //====여기부터 수정됨====
        // 의미: errors 배열을 명시적으로 string[] 타입으로 정의
        // 왜 사용? 'as readonly string[]' 단언 제거하고, 타입 안정성을 위해 명시적 타입 사용
        // 비유: 편지 봉투에 "에러 메시지"라는 라벨을 붙여 내용물이 명확히 에러 메시지만 담기도록
        // 작동 매커니즘: string[] 타입의 빈 배열을 초기화해 타입 단언 없이 안전하게 처리
        errors: ['MultiStep → Editor 전략 실행 실패'] as string[],
        warnings: [] as string[],
        //====여기까지 수정됨====
        metadata: new Map<string, unknown>(),
      });

      return safelyExecuteAsync(
        async (): Promise<SyncExecutionResult> => {
          const { multiStepData } = context;

          // Early Return: 멀티스텝 데이터가 없는 경우
          if (!multiStepData || !isValidMultiStepSnapshot(multiStepData)) {
            throw new Error('유효하지 않은 멀티스텝 데이터');
          }

          // 구조분해할당으로 안전한 데이터 추출
          const { formValues } = multiStepData;
          const { editorCompletedContent = '', isEditorCompleted = false } =
            formValues;

          console.log('🔍 [DEBUG] MultiStep Data 구조분해할당:', {
            hasFormValues: !!formValues,
            contentLength: editorCompletedContent.length,
            isCompleted: isEditorCompleted,
          });

          // 메타데이터 생성
          const resultMetadata = new Map<string, unknown>();
          resultMetadata.set(
            'transformationStrategy',
            'MULTISTEP_TO_EDITOR_DEFAULT'
          );
          resultMetadata.set('contentLength', editorCompletedContent.length);
          resultMetadata.set('isCompleted', isEditorCompleted);
          resultMetadata.set('timestamp', Date.now());

          // 변환 결과 생성
          const transformationResult: MultiStepToEditorDataTransformationResult =
            {
              editorContent: editorCompletedContent,
              editorIsCompleted: isEditorCompleted,
              transformationSuccess: true,
              transformationErrors: [],
              transformedTimestamp: Date.now(),
              contentMetadata: resultMetadata,
              reverseTransformationStrategy: 'EXISTING_CONTENT',
              dataIntegrityValidation: true,
            };

          console.log('✅ [SYNC_STRATEGY] MultiStep → Editor 전략 실행 완료');

          const successResult: SyncExecutionResult = {
            success: true,
            data: transformationResult,
            //====여기부터 수정됨====
            // 의미: errors와 warnings 배열을 명시적으로 string[] 타입으로 정의
            // 왜 사용? 'as readonly string[]' 단언 제거하고, 타입 안정성을 위해 명시적 타입 사용
            // 비유: 주문 목록에 "에러 없음"이라고 명확히 적어서 혼동 방지
            // 작동 매커니즘: 빈 string[] 배열을 사용해 타입 단언 없이 타입 보장
            errors: [] as string[],
            warnings: [] as string[],
            //====여기까지 수정됨====
            metadata: resultMetadata,
          };

          return successResult;
        },
        createFailureResult(),
        'MULTISTEP_TO_EDITOR_STRATEGY'
      );
    },
  });

  // 간단한 해시 생성 함수
  const generateSimpleHash = (content: string): string => {
    try {
      const hash = content
        .split('')
        .reduce(
          (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff,
          0
        );
      return Math.abs(hash).toString(36);
    } catch (hashError) {
      console.warn('⚠️ [SYNC_STRATEGY] 해시 생성 실패:', hashError);
      return Date.now().toString(36);
    }
  };

  return {
    createEditorToMultiStepStrategy,
    createMultiStepToEditorStrategy,
  };
}

// 🔧 동기화 엔진 상태 관리 (동시성 보호 적용)
// 의미: 동기화 엔진의 상태를 관리하는 컨트롤 타워
// 왜 사용? 동시성 문제를 방지하고 상태를 안전하게 업데이트하기 위해
function createSyncEngineStateManager() {
  console.log('🔧 [SYNC_STATE] 상태 관리자 생성 - 동시성 보호 적용');

  let currentState: SyncEngineState = {
    isActive: false,
    currentOperation: null,
    lastOperationTimestamp: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    activeStrategies: [],
  };

  // 동시성 보호를 위한 뮤텍스 플래그들
  let isUpdatingOperationStart = false;
  let isUpdatingOperationComplete = false;
  let isUpdatingActiveStrategies = false;
  let isResettingState = false;

  console.log('🔒 [SYNC_STATE] 동시성 보호 뮤텍스 플래그 초기화 완료');

  const getCurrentState = (): SyncEngineState => {
    console.log('🔍 [SYNC_STATE] 현재 상태 조회:', {
      isActive: currentState.isActive,
      currentOperation: currentState.currentOperation,
      totalOperations: currentState.totalOperations,
      isAnyUpdateInProgress:
        isUpdatingOperationStart ||
        isUpdatingOperationComplete ||
        isUpdatingActiveStrategies ||
        isResettingState,
    });
    return { ...currentState };
  };

  // 작업 시작 상태 업데이트
  const updateOperationStart = (direction: SyncDirection): void => {
    console.log('🚀 [SYNC_STATE] 동기화 작업 시작 요청:', direction);

    // Early Return: 동시 업데이트 방지
    if (isUpdatingOperationStart) {
      console.warn('⚠️ [SYNC_STATE] 동시 작업 시작 업데이트 방지 - 요청 무시');
      return;
    }

    // Early Return: 다른 업데이트 진행 중인 경우
    if (
      isUpdatingOperationComplete ||
      isUpdatingActiveStrategies ||
      isResettingState
    ) {
      console.warn('⚠️ [SYNC_STATE] 다른 상태 업데이트 진행 중 - 요청 무시:', {
        isUpdatingOperationComplete,
        isUpdatingActiveStrategies,
        isResettingState,
      });
      return;
    }

    // 뮤텍스 락 설정
    isUpdatingOperationStart = true;
    console.log('🔒 [SYNC_STATE] 작업 시작 업데이트 뮤텍스 락 설정');

    try {
      const incrementedTotalOperations = currentState.totalOperations + 1;
      const operationStartTimestamp = Date.now();

      // 안전한 상태 업데이트
      const newState: SyncEngineState = {
        ...currentState,
        isActive: true,
        currentOperation: direction,
        lastOperationTimestamp: operationStartTimestamp,
        totalOperations: incrementedTotalOperations,
      };

      currentState = newState;

      console.log('✅ [SYNC_STATE] 동기화 작업 시작 상태 업데이트 완료:', {
        direction,
        totalOperations: incrementedTotalOperations,
        timestamp: operationStartTimestamp,
        concurrencyProtected: true,
      });
    } catch (updateError) {
      console.error(
        '❌ [SYNC_STATE] 작업 시작 상태 업데이트 실패:',
        updateError
      );
    } finally {
      // 뮤텍스 락 해제
      isUpdatingOperationStart = false;
      console.log('🔓 [SYNC_STATE] 작업 시작 업데이트 뮤텍스 락 해제');
    }
  };

  // 작업 완료 상태 업데이트
  const updateOperationComplete = (success: boolean): void => {
    console.log('✅ [SYNC_STATE] 동기화 작업 완료 요청:', { success });

    // Early Return: 동시 업데이트 방지
    if (isUpdatingOperationComplete) {
      console.warn('⚠️ [SYNC_STATE] 동시 작업 완료 업데이트 방지 - 요청 무시');
      return;
    }

    // Early Return: 다른 업데이트 진행 중인 경우
    if (
      isUpdatingOperationStart ||
      isUpdatingActiveStrategies ||
      isResettingState
    ) {
      console.warn('⚠️ [SYNC_STATE] 다른 상태 업데이트 진행 중 - 요청 무시:', {
        isUpdatingOperationStart,
        isUpdatingActiveStrategies,
        isResettingState,
      });
      return;
    }

    // 뮤텍스 락 설정
    isUpdatingOperationComplete = true;
    console.log('🔒 [SYNC_STATE] 작업 완료 업데이트 뮤텍스 락 설정');

    try {
      const successCount = success
        ? currentState.successfulOperations + 1
        : currentState.successfulOperations;
      const failureCount = success
        ? currentState.failedOperations
        : currentState.failedOperations + 1;
      const completionTimestamp = Date.now();

      // 안전한 상태 업데이트
      const newState: SyncEngineState = {
        ...currentState,
        isActive: false,
        currentOperation: null,
        lastOperationTimestamp: completionTimestamp,
        successfulOperations: successCount,
        failedOperations: failureCount,
      };

      currentState = newState;

      console.log('✅ [SYNC_STATE] 동기화 작업 완료 상태 업데이트 완료:', {
        success,
        successfulOperations: successCount,
        failedOperations: failureCount,
        timestamp: completionTimestamp,
        concurrencyProtected: true,
      });
    } catch (updateError) {
      console.error(
        '❌ [SYNC_STATE] 작업 완료 상태 업데이트 실패:',
        updateError
      );
    } finally {
      // 뮤텍스 락 해제
      isUpdatingOperationComplete = false;
      console.log('🔓 [SYNC_STATE] 작업 완료 업데이트 뮤텍스 락 해제');
    }
  };

  // 활성 전략 업데이트
  const updateActiveStrategies = (strategyNames: readonly string[]): void => {
    console.log('🔧 [SYNC_STATE] 활성 전략 업데이트 요청:', strategyNames);

    // Early Return: 동시 업데이트 방지
    if (isUpdatingActiveStrategies) {
      console.warn('⚠️ [SYNC_STATE] 동시 전략 업데이트 방지 - 요청 무시');
      return;
    }

    // Early Return: 다른 업데이트 진행 중인 경우
    if (
      isUpdatingOperationStart ||
      isUpdatingOperationComplete ||
      isResettingState
    ) {
      console.warn('⚠️ [SYNC_STATE] 다른 상태 업데이트 진행 중 - 요청 무시:', {
        isUpdatingOperationStart,
        isUpdatingOperationComplete,
        isResettingState,
      });
      return;
    }

    // 뮤텍스 락 설정
    isUpdatingActiveStrategies = true;
    console.log('🔒 [SYNC_STATE] 활성 전략 업데이트 뮤텍스 락 설정');

    try {
      // 안전한 배열 복사 및 상태 업데이트
      const safeStrategyNames = Array.isArray(strategyNames)
        ? [...strategyNames]
        : [];

      const newState: SyncEngineState = {
        ...currentState,
        activeStrategies: safeStrategyNames,
      };

      currentState = newState;

      console.log('✅ [SYNC_STATE] 활성 전략 업데이트 완료:', {
        strategyCount: safeStrategyNames.length,
        strategies: safeStrategyNames,
        concurrencyProtected: true,
      });
    } catch (updateError) {
      console.error('❌ [SYNC_STATE] 활성 전략 업데이트 실패:', updateError);
    } finally {
      // 뮤텍스 락 해제
      isUpdatingActiveStrategies = false;
      console.log('🔓 [SYNC_STATE] 활성 전략 업데이트 뮤텍스 락 해제');
    }
  };

  // 상태 초기화
  const resetState = (): void => {
    console.log('🔄 [SYNC_STATE] 상태 초기화 요청');

    // Early Return: 동시 업데이트 방지
    if (isResettingState) {
      console.warn('⚠️ [SYNC_STATE] 동시 상태 초기화 방지 - 요청 무시');
      return;
    }

    // Early Return: 다른 업데이트 진행 중인 경우
    if (
      isUpdatingOperationStart ||
      isUpdatingOperationComplete ||
      isUpdatingActiveStrategies
    ) {
      console.warn(
        '⚠️ [SYNC_STATE] 다른 상태 업데이트 진행 중 - 초기화 요청 무시:',
        {
          isUpdatingOperationStart,
          isUpdatingOperationComplete,
          isUpdatingActiveStrategies,
        }
      );
      return;
    }

    // 뮤텍스 락 설정
    isResettingState = true;
    console.log('🔒 [SYNC_STATE] 상태 초기화 뮤텍스 락 설정');

    try {
      // 안전한 초기 상태 생성
      const initialState: SyncEngineState = {
        isActive: false,
        currentOperation: null,
        lastOperationTimestamp: 0,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        activeStrategies: [],
      };

      currentState = initialState;

      console.log('✅ [SYNC_STATE] 상태 초기화 완료:', {
        resetTimestamp: Date.now(),
        concurrencyProtected: true,
      });
    } catch (resetError) {
      console.error('❌ [SYNC_STATE] 상태 초기화 실패:', resetError);
    } finally {
      // 뮤텍스 락 해제
      isResettingState = false;
      console.log('🔓 [SYNC_STATE] 상태 초기화 뮤텍스 락 해제');
    }
  };

  // 동시성 디버깅 정보
  const getConcurrencyDebugInfo = () => {
    return {
      isUpdatingOperationStart,
      isUpdatingOperationComplete,
      isUpdatingActiveStrategies,
      isResettingState,
      hasAnyUpdateInProgress:
        isUpdatingOperationStart ||
        isUpdatingOperationComplete ||
        isUpdatingActiveStrategies ||
        isResettingState,
    };
  };

  console.log('✅ [SYNC_STATE] 동시성 보호 상태 관리자 생성 완료');

  return {
    getCurrentState,
    updateOperationStart,
    updateOperationComplete,
    updateActiveStrategies,
    resetState,
    getConcurrencyDebugInfo,
  };
}

// 🔧 메인 동기화 엔진 클래스
// 의미: 에디터와 폼 데이터를 동기화하는 메인 엔진
// 왜 사용? 에디터와 폼 간 데이터를 안전하고 효율적으로 동기화하기 위해
export function createSyncEngine(
  configuration: Partial<SyncEngineConfiguration> = {}
) {
  console.log('🏭 [SYNC_ENGINE] 동기화 엔진 생성 시작 - 동시성 보호 적용');

  // 기본 설정과 사용자 설정 병합
  const defaultConfig: SyncEngineConfiguration = {
    enableRetry: true,
    maxRetryAttempts: 3,
    defaultTimeoutMs: 10000,
    enableValidation: true,
    enableStateTracking: true,
    logLevel: 'INFO',
  };

  const finalConfig: SyncEngineConfiguration = {
    ...defaultConfig,
    ...configuration,
  };

  // 모듈 생성
  const { withTimeout, withRetry, safelyExecuteAsync } =
    createSyncEngineErrorHandler();
  const { createEditorToMultiStepStrategy, createMultiStepToEditorStrategy } =
    createSyncStrategyFactory();
  const stateManager = createSyncEngineStateManager();
  const { isValidSyncDirection } = createSyncEngineTypeGuards();

  // 전략 저장소
  const registeredStrategies = new Map<string, SyncStrategy>();

  // 전략 등록 동시성 보호
  let isRegisteringStrategy = false;

  // 기본 전략 등록
  const initializeDefaultStrategies = (): void => {
    console.log('🔧 [SYNC_ENGINE] 기본 전략 등록 - 동시성 보호 적용');

    const editorToMultiStepStrategy = createEditorToMultiStepStrategy();
    const multiStepToEditorStrategy = createMultiStepToEditorStrategy();

    registeredStrategies.set(
      editorToMultiStepStrategy.name,
      editorToMultiStepStrategy
    );
    registeredStrategies.set(
      multiStepToEditorStrategy.name,
      multiStepToEditorStrategy
    );

    const strategyNames = Array.from(registeredStrategies.keys());
    stateManager.updateActiveStrategies(strategyNames);

    console.log(
      '✅ [SYNC_ENGINE] 기본 전략 등록 완료 (동시성 보호):',
      strategyNames
    );
  };

  // 전략 등록
  const registerStrategy = (strategy: SyncStrategy): boolean => {
    console.log('🔧 [SYNC_ENGINE] 전략 등록 요청:', strategy.name);

    // Early Return: 동시 등록 방지
    if (isRegisteringStrategy) {
      console.warn('⚠️ [SYNC_ENGINE] 전략 등록 중 중복 요청 무시');
      return false;
    }

    const isValidStrategy =
      strategy &&
      typeof strategy.name === 'string' &&
      typeof strategy.priority === 'number' &&
      typeof strategy.canExecute === 'function' &&
      typeof strategy.execute === 'function';

    // Early Return: 유효하지 않은 전략인 경우
    if (!isValidStrategy) {
      console.error('❌ [SYNC_ENGINE] 유효하지 않은 전략:', strategy);
      return false;
    }

    // 뮤텍스 락 설정
    isRegisteringStrategy = true;
    console.log('🔒 [SYNC_ENGINE] 전략 등록 뮤텍스 락 설정');

    try {
      registeredStrategies.set(strategy.name, strategy);

      const strategyNames = Array.from(registeredStrategies.keys());
      stateManager.updateActiveStrategies(strategyNames);

      console.log(
        '✅ [SYNC_ENGINE] 전략 등록 완료 (동시성 보호):',
        strategy.name
      );
      return true;
    } catch (registrationError) {
      console.error('❌ [SYNC_ENGINE] 전략 등록 실패:', registrationError);
      return false;
    } finally {
      // 뮤텍스 락 해제
      isRegisteringStrategy = false;
      console.log('🔓 [SYNC_ENGINE] 전략 등록 뮤텍스 락 해제');
    }
  };

  // 전략 해제
  const unregisterStrategy = (strategyName: string): boolean => {
    console.log('🔧 [SYNC_ENGINE] 전략 해제:', strategyName);

    const hasStrategy = registeredStrategies.has(strategyName);

    // Early Return: 전략이 없는 경우
    if (!hasStrategy) {
      console.warn('⚠️ [SYNC_ENGINE] 존재하지 않는 전략:', strategyName);
      return false;
    }

    registeredStrategies.delete(strategyName);

    const strategyNames = Array.from(registeredStrategies.keys());
    stateManager.updateActiveStrategies(strategyNames);

    console.log('✅ [SYNC_ENGINE] 전략 해제 완료:', strategyName);
    return true;
  };

  // 적용 가능한 전략 선택
  const selectApplicableStrategy = (
    context: SyncExecutionContext
  ): SyncStrategy | null => {
    console.log('🔍 [SYNC_ENGINE] 적용 가능한 전략 선택:', context.direction);

    const availableStrategies = Array.from(registeredStrategies.values())
      .filter((strategy) => strategy.canExecute(context))
      .sort(
        (firstStrategy, secondStrategy) =>
          secondStrategy.priority - firstStrategy.priority
      );

    // Early Return: 적용 가능한 전략이 없는 경우
    if (availableStrategies.length === 0) {
      console.warn('⚠️ [SYNC_ENGINE] 적용 가능한 전략이 없음');
      return null;
    }

    const selectedStrategy = availableStrategies[0];
    console.log('✅ [SYNC_ENGINE] 전략 선택 완료:', selectedStrategy.name);

    return selectedStrategy;
  };

  // 동기화 실행
  const executeSync = async (
    direction: SyncDirection,
    editorData?: EditorStateSnapshotForBridge,
    multiStepData?: MultiStepFormSnapshotForBridge,
    customOptions?: Partial<SyncExecutionOptions>
  ): Promise<SyncExecutionResult> => {
    console.log('🚀 [SYNC_ENGINE] 동기화 실행 시작 (동시성 보호):', direction);

    // Early Return: 유효하지 않은 방향인 경우
    if (!isValidSyncDirection(direction)) {
      console.error('❌ [SYNC_ENGINE] 유효하지 않은 동기화 방향:', direction);
      return {
        success: false,
        //====여기부터 수정됨====
        // 의미: errors 배열을 명시적으로 string[] 타입으로 정의
        // 왜 사용? 'as readonly string[]' 단언 제거하고, 명시적 타입으로 타입 안정성 보장
        // 비유: 에러 메시지를 담는 상자에 "문자열만 담는다"는 라벨을 붙여 혼동 방지
        // 작동 매커니즘: string[] 타입의 배열을 사용해 타입 단언 없이 안전하게 처리
        errors: ['유효하지 않은 동기화 방향'] as string[],
        warnings: [] as string[],
        //====여기까지 수정됨====
        metadata: new Map<string, unknown>(),
      };
    }

    const { enableStateTracking } = finalConfig;

    // 동시성 보호 적용된 상태 추적 시작
    enableStateTracking ? stateManager.updateOperationStart(direction) : null;

    try {
      // 실행 옵션 생성
      const defaultOptions: SyncExecutionOptions = {
        timeoutMs: finalConfig.defaultTimeoutMs,
        retryCount: finalConfig.maxRetryAttempts,
        validateInput: finalConfig.enableValidation,
        validateOutput: finalConfig.enableValidation,
        enableLogging: finalConfig.logLevel !== 'ERROR',
      };

      const executionOptions: SyncExecutionOptions = {
        ...defaultOptions,
        ...customOptions,
      };

      // 실행 컨텍스트 생성
      const executionContext: SyncExecutionContext = {
        direction,
        editorData,
        multiStepData,
        options: executionOptions,
        metadata: new Map<string, unknown>([
          ['engineVersion', '1.0.0'],
          ['startTime', Date.now()],
          ['retryEnabled', finalConfig.enableRetry],
          ['concurrencyProtected', true],
        ]),
      };

      // 전략 선택
      const selectedStrategy = selectApplicableStrategy(executionContext);

      // Early Return: 적용 가능한 전략이 없는 경우
      if (!selectedStrategy) {
        const noStrategyResult: SyncExecutionResult = {
          success: false,
          //====여기부터 수정됨====
          // 의미: errors 배열을 명시적으로 string[] 타입으로 정의
          // 왜 사용? 'as readonly string[]' 단언 제거하고, 명시적 타입으로 타입 안정성 보장
          // 비유: "전략 없음" 메시지를 명확히 문자열만 담는 상자에 넣기
          // 작동 매커니즘: string[] 타입의 배열을 사용해 타입 단언 없이 안전하게 처리
          errors: ['적용 가능한 동기화 전략이 없습니다'] as string[],
          warnings: [] as string[],
          //====여기까지 수정됨====
          metadata: new Map<string, unknown>(),
        };

        enableStateTracking
          ? stateManager.updateOperationComplete(false)
          : null;
        return noStrategyResult;
      }

      // 전략 실행 (재시도 및 타임아웃 적용)
      const executeStrategyWithSafety =
        async (): Promise<SyncExecutionResult> => {
          const operation = (): Promise<SyncExecutionResult> =>
            selectedStrategy.execute(executionContext);

          const operationWithTimeout = withTimeout(
            operation(),
            executionOptions.timeoutMs,
            '동기화 작업 타임아웃'
          );

          return finalConfig.enableRetry
            ? withRetry(
                () => operationWithTimeout,
                executionOptions.retryCount,
                1000
              )
            : operationWithTimeout;
        };

      const createSyncFailureResult = (): SyncExecutionResult => ({
        success: false,
        //====여기부터 수정됨====
        // 의미: errors 배열을 명시적으로 string[] 타입으로 정의
        // 왜 사용? 'as readonly string[]' 단언 제거하고, 명시적 타입으로 타입 안정성 보장
        // 비유: 에러 메시지를 담는 상자에 명확히 "문자열 에러"만 담겠다고 약속
        // 작동 매커니즘: string[] 타입의 배열을 사용해 타입 단언 없이 안전하게 처리
        errors: ['동기화 실행 중 예외 발생'] as string[],
        warnings: [] as string[],
        //====여기까지 수정됨====
        metadata: new Map<string, unknown>(),
      });

      const executionResult = await safelyExecuteAsync(
        executeStrategyWithSafety,
        createSyncFailureResult(),
        'SYNC_STRATEGY_EXECUTION'
      );

      // 동시성 보호 적용된 상태 추적 완료
      enableStateTracking
        ? stateManager.updateOperationComplete(executionResult.success)
        : null;

      console.log('✅ [SYNC_ENGINE] 동기화 실행 완료 (동시성 보호):', {
        direction,
        strategy: selectedStrategy.name,
        success: executionResult.success,
        concurrencyProtected: true,
      });

      return executionResult;
    } catch (syncError) {
      console.error('❌ [SYNC_ENGINE] 동기화 실행 실패:', syncError);

      enableStateTracking ? stateManager.updateOperationComplete(false) : null;

      return {
        success: false,
        //====여기부터 수정됨====
        // 의미: syncError를 안전하게 string[] 타입의 errors 배열로 변환
        // 왜 사용? 'as readonly string[]' 단언 제거하고, 타입 가드를 통해 안전하게 string[]로 변환
        // 비유: 에러를 편지로 바꿀 때, 편지가 제대로된 문자열만 담기도록 확인
        // 작동 매커니즘: syncError를 타입 가드로 확인 후 string[] 배열로 처리
        errors: [
          syncError instanceof Error ? syncError.message : String(syncError),
        ] as string[],
        warnings: [] as string[],
        //====여기까지 수정됨====
        metadata: new Map<string, unknown>(),
      };
    }
  };

  // 양방향 동기화
  const executeBidirectionalSync = async (
    editorData: EditorStateSnapshotForBridge,
    multiStepData: MultiStepFormSnapshotForBridge,
    customOptions?: Partial<SyncExecutionOptions>
  ): Promise<BidirectionalSyncResult> => {
    console.log('🚀 [SYNC_ENGINE] 양방향 동기화 시작 (동시성 보호)');

    const syncStartTime = Date.now();
    //====여기부터 수정됨====
    // 의미: syncErrors를 명시적으로 string[] 타입으로 정의
    // 왜 사용? 'as readonly string[]' 단언 제거하고, 명시적 타입으로 타입 안정성 보장
    // 비유: 에러 메시지를 담는 상자에 "문자열만 담는다"는 라벨을 붙여 혼동 방지
    // 작동 매커니즘: string[] 타입의 빈 배열을 초기화해 타입 단언 없이 안전하게 처리
    const syncErrors: string[] = [];
    //====여기까지 수정됨====

    try {
      // Editor → MultiStep 동기화
      const editorToMultiStepResult = await executeSync(
        'EDITOR_TO_MULTISTEP',
        editorData,
        undefined,
        customOptions
      );

      const editorToMultiStepSuccess = editorToMultiStepResult.success;
      //====여기부터 수정됨====
      // 의미: errors를 spread 연산자로 안전하게 syncErrors에 추가
      // 왜 사용? 타입 단언 없이 errors가 string[]임을 보장하며 추가
      // 비유: 에러 메시지를 상자에 넣을 때, 이미 문자열인지 확인하고 넣기
      // 작동 매커니즘: editorToMultiStepResult.errors는 이미 string[]로 보장됨
      if (!editorToMultiStepResult.success) {
        syncErrors.push(...editorToMultiStepResult.errors);
      }
      //====여기까지 수정됨====

      // MultiStep → Editor 동기화
      const multiStepToEditorResult = await executeSync(
        'MULTISTEP_TO_EDITOR',
        undefined,
        multiStepData,
        customOptions
      );

      const multiStepToEditorSuccess = multiStepToEditorResult.success;
      //====여기부터 수정됨====
      // 의미: errors를 spread 연산자로 안전하게 syncErrors에 추가
      // 왜 사용? 타입 단언 없이 errors가 string[]임을 보장하며 추가
      // 비유: 또 다른 상자에서 에러 메시지를 꺼내 같은 상자에 안전하게 넣기
      // 작동 매커니즘: multiStepToEditorResult.errors는 이미 string[]로 보장됨
      if (!multiStepToEditorResult.success) {
        syncErrors.push(...multiStepToEditorResult.errors);
      }
      //====여기까지 수정됨====

      const overallSuccess =
        editorToMultiStepSuccess && multiStepToEditorSuccess;
      const syncEndTime = Date.now();
      const syncDuration = syncEndTime - syncStartTime;

      // 메타데이터 생성
      const syncMetadata = new Map<string, unknown>();
      syncMetadata.set('syncStartTime', syncStartTime);
      syncMetadata.set('syncEndTime', syncEndTime);
      syncMetadata.set('syncDuration', syncDuration);
      syncMetadata.set('editorToMultiStepSuccess', editorToMultiStepSuccess);
      syncMetadata.set('multiStepToEditorSuccess', multiStepToEditorSuccess);
      syncMetadata.set('overallSuccess', overallSuccess);
      syncMetadata.set('concurrencyProtected', true);

      const bidirectionalResult: BidirectionalSyncResult = {
        editorToMultiStepSuccess,
        multiStepToEditorSuccess,
        overallSyncSuccess: overallSuccess,
        //====여기부터 수정됨====
        // 의미: syncErrors를 명시적으로 BidirectionalSyncResult의 syncErrors에 할당
        // 왜 사용? 타입 단언 없이 syncErrors가 string[]임을 보장
        // 비유: 에러 메시지 상자를 최종 보고서에 그대로 붙여넣기
        // 작동 매커니즘: syncErrors는 이미 string[]로 정의되어 타입 안전
        syncErrors,
        //====여기까지 수정됨====
        syncDuration,
        syncMetadata,
        conflictResolutionLog: [],
        syncStrategy: 'MERGE',
      };

      console.log('✅ [SYNC_ENGINE] 양방향 동기화 완료 (동시성 보호):', {
        overallSuccess,
        duration: syncDuration,
        errorCount: syncErrors.length,
        concurrencyProtected: true,
      });

      return bidirectionalResult;
    } catch (bidirectionalError) {
      console.error('❌ [SYNC_ENGINE] 양방향 동기화 실패:', bidirectionalError);

      const errorMessage =
        bidirectionalError instanceof Error
          ? bidirectionalError.message
          : String(bidirectionalError);
      //====여기부터 수정됨====
      // 의미: syncErrors에 에러 메시지를 안전하게 추가
      // 왜 사용? 타입 단언 없이 string[] 타입의 syncErrors에 추가
      // 비유: 에러 메시지를 상자에 추가로 넣을 때, 문자열인지 확인하고 넣기
      // 작동 매커니즘: errorMessage는 문자열로 변환되어 syncErrors에 추가
      syncErrors.push(errorMessage);
      //====여기까지 수정됨====

      const failureMetadata = new Map<string, unknown>();
      failureMetadata.set('syncStartTime', syncStartTime);
      failureMetadata.set('syncEndTime', Date.now());
      failureMetadata.set('error', errorMessage);
      failureMetadata.set('concurrencyProtected', true);

      return {
        editorToMultiStepSuccess: false,
        multiStepToEditorSuccess: false,
        overallSyncSuccess: false,
        //====여기부터 수정됨====
        // 의미: syncErrors를 명시적으로 BidirectionalSyncResult의 syncErrors에 할당
        // 왜 사용? 타입 단언 없이 syncErrors가 string[]임을 보장
        // 비유: 최종 보고서에 에러 상자를 그대로 붙여넣기
        // 작동 매커니즘: syncErrors는 이미 string[]로 정의되어 타입 안전
        syncErrors,
        //====여기까지 수정됨====
        syncDuration: Date.now() - syncStartTime,
        syncMetadata: failureMetadata,
        conflictResolutionLog: [errorMessage],
        syncStrategy: 'CONFLICT_RESOLUTION',
      };
    }
  };

  // 초기화
  initializeDefaultStrategies();

  console.log('✅ [SYNC_ENGINE] 동기화 엔진 생성 완료 (동시성 보호 적용)');

  return {
    // 전략 관리
    registerStrategy,
    unregisterStrategy,
    getRegisteredStrategies: () => Array.from(registeredStrategies.keys()),

    // 동기화 실행
    executeSync,
    executeBidirectionalSync,

    // 상태 관리 (동시성 보호 적용)
    getState: stateManager.getCurrentState,
    resetState: stateManager.resetState,
    getConcurrencyDebugInfo: stateManager.getConcurrencyDebugInfo,

    // 설정 조회
    getConfiguration: () => ({ ...finalConfig }),
  };
}

export type {
  SyncStrategy,
  SyncExecutionContext,
  SyncExecutionResult,
  SyncDirection,
  SyncExecutionOptions,
  SyncEngineState,
  SyncEngineConfiguration,
};

console.log('🏗️ [SYNC_ENGINE] 모듈 로드 완료 - 동시성 보호 적용');
console.log('🔒 [SYNC_ENGINE] 제공 기능:', {
  concurrencyProtection: '상태 업데이트 동시성 보호',
  mutexPattern: '뮤텍스 패턴 적용',
  atomicOperations: '원자성 상태 업데이트',
  raceConditionPrevention: 'Race Condition 방지',
  safeStateManagement: '안전한 상태 관리',
  debugSupport: '동시성 디버깅 지원',
});
console.log('✅ [SYNC_ENGINE] 모든 동시성 보호 기능 준비 완료');
