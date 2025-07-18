// bridges/editorMultiStepBridge/multiStepUpdater.ts

import type { EditorToMultiStepDataTransformationResult } from './modernBridgeTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';
import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';

// 🔧 업데이트 결과 인터페이스
interface UpdateResult {
  readonly success: boolean;
  readonly method: string;
  readonly operationId: string;
  readonly timestamp: number;
  readonly details: Map<string, unknown>;
  readonly performance: Map<string, number>;
}

interface UpdateContext {
  readonly operationId: string;
  readonly startTime: number;
  readonly targetContent: string;
  readonly targetCompleted: boolean;
  readonly updateStrategies: Set<string>;
}

interface StoreUpdateMethods {
  readonly updateEditorContent?: (content: string) => void;
  readonly setEditorCompleted?: (completed: boolean) => void;
  readonly updateFormValue?: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  readonly setFormValues?: (values: FormValues) => void;
}

interface CurrentStoreState {
  readonly formValues: FormValues;
  readonly currentStep: number;
  readonly editorCompletedContent: string;
  readonly isEditorCompleted: boolean;
  readonly availableMethods: StoreUpdateMethods;
}

// 🔧 안전한 타입 변환 유틸리티
function createSafeConverter() {
  const convertToString = (value: unknown, fallback: string): string => {
    return typeof value === 'string' ? value : fallback;
  };

  const convertToBoolean = (value: unknown, fallback: boolean): boolean => {
    return typeof value === 'boolean' ? value : fallback;
  };

  const convertToNumber = (value: unknown, fallback: number): number => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
  };

  const convertToFunction = (value: unknown): Function | null => {
    return typeof value === 'function' ? value : null;
  };

  return {
    convertToString,
    convertToBoolean,
    convertToNumber,
    convertToFunction,
  };
}

// 🔧 타입 가드 모듈
function createTypeGuardModule() {
  const isValidObject = (
    candidate: unknown
  ): candidate is Record<string, unknown> => {
    return (
      candidate !== null &&
      typeof candidate === 'object' &&
      !Array.isArray(candidate)
    );
  };

  const isValidFormValues = (candidate: unknown): candidate is FormValues => {
    // 관대한 검증: 객체 타입만 확인
    return isValidObject(candidate);
  };

  const isValidTransformationResult = (
    candidate: unknown
  ): candidate is EditorToMultiStepDataTransformationResult => {
    const isObject = isValidObject(candidate);
    if (!isObject) {
      return false;
    }

    const requiredFields = [
      'transformedContent',
      'transformedIsCompleted',
      'transformationSuccess',
    ];

    const hasRequiredFields = requiredFields.every(
      (field) => field in candidate
    );
    if (!hasRequiredFields) {
      return false;
    }

    const transformedContent = Reflect.get(candidate, 'transformedContent');
    const transformedIsCompleted = Reflect.get(
      candidate,
      'transformedIsCompleted'
    );
    const transformationSuccess = Reflect.get(
      candidate,
      'transformationSuccess'
    );

    const hasValidTypes =
      typeof transformedContent === 'string' &&
      typeof transformedIsCompleted === 'boolean' &&
      typeof transformationSuccess === 'boolean';

    return hasValidTypes && transformationSuccess === true;
  };

  return {
    isValidObject,
    isValidFormValues,
    isValidTransformationResult,
  };
}

// 🔧 스토어 접근 모듈
function createStoreAccessModule() {
  const { isValidObject, isValidFormValues } = createTypeGuardModule();
  const {
    convertToString,
    convertToBoolean,
    convertToNumber,
    convertToFunction,
  } = createSafeConverter();

  const extractCurrentState = (): CurrentStoreState | null => {
    console.log('🔍 [UPDATER] 현재 스토어 상태 추출 시작');

    try {
      const storeState = useMultiStepFormStore.getState();

      // Early Return: 스토어 상태가 없는 경우
      if (!storeState || !isValidObject(storeState)) {
        console.error('❌ [UPDATER] 유효하지 않은 스토어 상태');
        return null;
      }

      // 🔧 구조분해할당 + Fallback으로 안전한 상태 추출
      const {
        formValues: rawFormValues = {},
        currentStep: rawCurrentStep = 1,
        editorCompletedContent: rawEditorContent = '',
        isEditorCompleted: rawIsCompleted = false,
        updateEditorContent: rawUpdateContent = null,
        setEditorCompleted: rawSetCompleted = null,
        updateFormValue: rawUpdateFormValue = null,
        setFormValues: rawSetFormValues = null,
      } = storeState;

      // 안전한 타입 변환
      const safeFormValues = isValidFormValues(rawFormValues)
        ? rawFormValues
        : createDefaultFormValues();

      const safeCurrentStep = convertToNumber(rawCurrentStep, 1);
      const safeEditorContent = convertToString(rawEditorContent, '');
      const safeIsCompleted = convertToBoolean(rawIsCompleted, false);

      // 메서드 함수들 안전하게 추출 - 타입 단언 제거
      const updateEditorContentFunc = convertToFunction(rawUpdateContent);
      const setEditorCompletedFunc = convertToFunction(rawSetCompleted);
      const updateFormValueFunc = convertToFunction(rawUpdateFormValue);
      const setFormValuesFunc = convertToFunction(rawSetFormValues);

      // 함수 타입 검증을 위한 추가 체크
      const isValidUpdateEditorContent =
        updateEditorContentFunc !== null &&
        typeof updateEditorContentFunc === 'function';
      const isValidSetEditorCompleted =
        setEditorCompletedFunc !== null &&
        typeof setEditorCompletedFunc === 'function';
      const isValidUpdateFormValue =
        updateFormValueFunc !== null &&
        typeof updateFormValueFunc === 'function';
      const isValidSetFormValues =
        setFormValuesFunc !== null && typeof setFormValuesFunc === 'function';

      const availableMethods: StoreUpdateMethods = {
        updateEditorContent: isValidUpdateEditorContent
          ? (content: string) => updateEditorContentFunc(content)
          : undefined,
        setEditorCompleted: isValidSetEditorCompleted
          ? (completed: boolean) => setEditorCompletedFunc(completed)
          : undefined,
        updateFormValue: isValidUpdateFormValue
          ? <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
              updateFormValueFunc(key, value)
          : undefined,
        setFormValues: isValidSetFormValues
          ? (values: FormValues) => setFormValuesFunc(values)
          : undefined,
      };

      const currentState: CurrentStoreState = {
        formValues: safeFormValues,
        currentStep: safeCurrentStep,
        editorCompletedContent: safeEditorContent,
        isEditorCompleted: safeIsCompleted,
        availableMethods,
      };

      console.log('✅ [UPDATER] 스토어 상태 추출 완료:', {
        currentStep: safeCurrentStep,
        contentLength: safeEditorContent.length,
        isCompleted: safeIsCompleted,
        hasFormValues: Boolean(safeFormValues),
        availableMethodsCount:
          Object.values(availableMethods).filter(Boolean).length,
      });

      return currentState;
    } catch (extractionError) {
      console.error('❌ [UPDATER] 스토어 상태 추출 실패:', extractionError);
      return null;
    }
  };

  const createDefaultFormValues = (): FormValues => {
    return {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      tags: '',
      content: '',
      media: [],
      mainImage: null,
      sliderImages: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  };

  return {
    extractCurrentState,
    createDefaultFormValues,
  };
}

// 🔧 업데이트 실행 모듈
function createUpdateExecutionModule() {
  const { extractCurrentState } = createStoreAccessModule();

  const executeStoreUpdate = async (
    updateContext: UpdateContext
  ): Promise<UpdateResult> => {
    console.log('🔄 [UPDATER] 스토어 업데이트 실행 시작');
    const executionStartTime = globalThis.performance.now();

    try {
      const currentState = extractCurrentState();

      // Early Return: 현재 상태를 가져올 수 없는 경우
      if (!currentState) {
        return createFailureResult(
          'STORE_ACCESS_FAILED',
          updateContext.operationId,
          executionStartTime,
          '스토어 상태 접근 실패'
        );
      }

      const { availableMethods } = currentState;
      const { targetContent, targetCompleted } = updateContext;

      const updateResults = new Map<string, boolean>();
      const updateMethods: string[] = [];

      // 스토어 레벨 에디터 콘텐츠 업데이트
      const { updateEditorContent } = availableMethods;
      const canUpdateStoreContent = updateEditorContent !== undefined;
      if (canUpdateStoreContent && updateEditorContent) {
        console.log('🔄 [UPDATER] 스토어 에디터 콘텐츠 업데이트 실행');
        updateEditorContent(targetContent);
        updateResults.set('storeContent', true);
        updateMethods.push('STORE_CONTENT');
      }

      // 스토어 레벨 완료 상태 업데이트
      const { setEditorCompleted } = availableMethods;
      const canUpdateStoreCompleted = setEditorCompleted !== undefined;
      if (canUpdateStoreCompleted && setEditorCompleted) {
        console.log('🔄 [UPDATER] 스토어 완료 상태 업데이트 실행');
        setEditorCompleted(targetCompleted);
        updateResults.set('storeCompleted', true);
        updateMethods.push('STORE_COMPLETED');
      }

      // FormValues 레벨 업데이트
      const { updateFormValue } = availableMethods;
      const canUpdateFormValue = updateFormValue !== undefined;
      if (canUpdateFormValue && updateFormValue) {
        console.log('🔄 [UPDATER] FormValues 레벨 업데이트 실행');

        updateFormValue('editorCompletedContent', targetContent);
        updateFormValue('isEditorCompleted', targetCompleted);

        updateResults.set('formValues', true);
        updateMethods.push('FORM_VALUES');
      }

      const executionEndTime = globalThis.performance.now();
      const executionDuration = executionEndTime - executionStartTime;

      const successfulUpdates = Array.from(updateResults.values()).filter(
        Boolean
      ).length;
      const isUpdateSuccessful = successfulUpdates > 0;

      // Early Return: 업데이트가 하나도 성공하지 않은 경우
      if (!isUpdateSuccessful) {
        return createFailureResult(
          'NO_UPDATE_METHODS',
          updateContext.operationId,
          executionStartTime,
          '사용 가능한 업데이트 메서드가 없음'
        );
      }

      console.log('✅ [UPDATER] 스토어 업데이트 실행 완료:', {
        successfulUpdates,
        updateMethods: updateMethods.join(', '),
        contentLength: targetContent.length,
        isCompleted: targetCompleted,
        duration: `${executionDuration.toFixed(2)}ms`,
      });

      return createSuccessResult(
        updateMethods.join(', '),
        updateContext.operationId,
        executionStartTime,
        {
          successfulUpdates,
          methodCount: updateMethods.length,
          contentLength: targetContent.length,
          isCompleted: targetCompleted,
        }
      );
    } catch (updateError) {
      console.error('❌ [UPDATER] 스토어 업데이트 실행 실패:', updateError);

      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : String(updateError);

      return createFailureResult(
        'UPDATE_EXECUTION_ERROR',
        updateContext.operationId,
        executionStartTime,
        errorMessage
      );
    }
  };

  const createSuccessResult = (
    method: string,
    operationId: string,
    startTime: number,
    additionalData: Record<string, unknown>
  ): UpdateResult => {
    const endTime = globalThis.performance.now();
    const duration = endTime - startTime;

    const details = new Map<string, unknown>();
    details.set('timestamp', Date.now());
    details.set('success', true);

    Object.entries(additionalData).forEach(([key, value]) => {
      details.set(key, value);
    });

    const performanceData = new Map<string, number>();
    performanceData.set('executionTime', duration);
    performanceData.set('startTime', startTime);
    performanceData.set('endTime', endTime);

    return {
      success: true,
      method,
      operationId,
      timestamp: Date.now(),
      details,
      performance: performanceData,
    };
  };

  const createFailureResult = (
    method: string,
    operationId: string,
    startTime: number,
    errorMessage: string
  ): UpdateResult => {
    const endTime = globalThis.performance.now();
    const duration = endTime - startTime;

    const details = new Map<string, unknown>();
    details.set('timestamp', Date.now());
    details.set('success', false);
    details.set('error', errorMessage);

    const performanceData = new Map<string, number>();
    performanceData.set('executionTime', duration);
    performanceData.set('startTime', startTime);
    performanceData.set('endTime', endTime);

    return {
      success: false,
      method,
      operationId,
      timestamp: Date.now(),
      details,
      performance: performanceData,
    };
  };

  return {
    executeStoreUpdate,
  };
}

// 🔧 검증 모듈
function createValidationModule() {
  const performFinalValidation = async (
    expectedContent: string,
    expectedCompleted: boolean,
    operationId: string
  ): Promise<boolean> => {
    console.log('🔍 [UPDATER] 최종 검증 시작');

    // 업데이트 후 잠시 대기하여 상태 안정화
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const { extractCurrentState } = createStoreAccessModule();
      const finalState = extractCurrentState();

      // Early Return: 최종 상태를 가져올 수 없는 경우
      if (!finalState) {
        console.warn('⚠️ [UPDATER] 최종 상태 조회 실패');
        return false;
      }

      const {
        editorCompletedContent: storeContent,
        isEditorCompleted: storeCompleted,
        formValues,
      } = finalState;

      // FormValues에서 에디터 관련 필드 안전하게 추출
      const formContent = Reflect.get(formValues, 'editorCompletedContent');
      const formCompleted = Reflect.get(formValues, 'isEditorCompleted');

      const storeContentMatch = storeContent === expectedContent;
      const storeCompletedMatch = storeCompleted === expectedCompleted;
      const formContentMatch = formContent === expectedContent;
      const formCompletedMatch = formCompleted === expectedCompleted;

      const isValidationSuccessful =
        (storeContentMatch && storeCompletedMatch) ||
        (formContentMatch && formCompletedMatch);

      console.log('📊 [UPDATER] 최종 검증 결과:', {
        operationId,
        storeContent:
          typeof storeContent === 'string' ? storeContent.length : 0,
        storeCompleted,
        formContent: typeof formContent === 'string' ? formContent.length : 0,
        formCompleted,
        expectedContent: expectedContent.length,
        expectedCompleted,
        storeContentMatch,
        storeCompletedMatch,
        formContentMatch,
        formCompletedMatch,
        isValidationSuccessful,
      });

      return isValidationSuccessful;
    } catch (validationError) {
      console.error('❌ [UPDATER] 최종 검증 실패:', validationError);
      return false;
    }
  };

  return {
    performFinalValidation,
  };
}

// 🔧 메인 업데이트 조합 모듈
function createCompleteUpdateModule() {
  const { isValidTransformationResult } = createTypeGuardModule();
  const { executeStoreUpdate } = createUpdateExecutionModule();
  const { performFinalValidation } = createValidationModule();

  const performCompleteStateUpdate = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🚀 [UPDATER] 전체 상태 업데이트 시작');
    const operationStartTime = globalThis.performance.now();

    try {
      // 1단계: 입력 검증
      const isValidInput = isValidTransformationResult(result);
      if (!isValidInput) {
        console.error('❌ [UPDATER] 유효하지 않은 변환 결과');
        return false;
      }

      // 2단계: 업데이트 컨텍스트 생성
      const { transformedContent, transformedIsCompleted } = result;
      const operationId = `update_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const updateContext: UpdateContext = {
        operationId,
        startTime: operationStartTime,
        targetContent: transformedContent,
        targetCompleted: transformedIsCompleted,
        updateStrategies: new Set(['STORE_LEVEL', 'FORM_VALUES']),
      };

      console.log('📊 [UPDATER] 업데이트 대상 데이터:', {
        operationId,
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
        transformationSuccess: result.transformationSuccess,
      });

      // 3단계: 스토어 업데이트 실행
      const updateResult = await executeStoreUpdate(updateContext);

      // Early Return: 업데이트 실패
      if (!updateResult.success) {
        console.error(
          '❌ [UPDATER] 스토어 업데이트 실패:',
          updateResult.details.get('error')
        );
        return false;
      }

      // 4단계: 최종 검증
      const isValidationSuccessful = await performFinalValidation(
        transformedContent,
        transformedIsCompleted,
        operationId
      );

      const operationEndTime = globalThis.performance.now();
      const operationDuration = operationEndTime - operationStartTime;

      console.log('✅ [UPDATER] 전체 상태 업데이트 완료:', {
        operationId,
        updateSuccess: updateResult.success,
        validationSuccess: isValidationSuccessful,
        finalResult: isValidationSuccessful,
        duration: `${operationDuration.toFixed(2)}ms`,
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
      });

      return isValidationSuccessful;
    } catch (completeUpdateError) {
      console.error(
        '❌ [UPDATER] 전체 상태 업데이트 실패:',
        completeUpdateError
      );
      return false;
    }
  };

  return {
    performCompleteStateUpdate,
  };
}

// 🔧 유틸리티 함수들
function createUpdaterUtilities() {
  const generateOperationId = (): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `updater_${timestamp}_${randomSuffix}`;
  };

  const createUpdatePerformanceReport = (
    updateResults: UpdateResult[]
  ): Map<string, number> => {
    const report = new Map<string, number>();

    const totalOperations = updateResults.length;
    const successfulOperations = updateResults.filter(
      ({ success }) => success
    ).length;
    const failedOperations = totalOperations - successfulOperations;

    const totalDuration = updateResults.reduce(
      (total, { performance: performanceData }) => {
        const executionTime = performanceData.get('executionTime') ?? 0;
        return total + executionTime;
      },
      0
    );

    const averageDuration =
      totalOperations > 0 ? totalDuration / totalOperations : 0;

    report.set('totalOperations', totalOperations);
    report.set('successfulOperations', successfulOperations);
    report.set('failedOperations', failedOperations);
    report.set('totalDuration', totalDuration);
    report.set('averageDuration', averageDuration);
    report.set(
      'successRate',
      totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0
    );

    return report;
  };

  return {
    generateOperationId,
    createUpdatePerformanceReport,
  };
}

// 🔧 메인 팩토리 함수
export function createMultiStepStateUpdater() {
  console.log('🏭 [UPDATER_FACTORY] 멀티스텝 상태 업데이터 생성 시작');

  const { extractCurrentState } = createStoreAccessModule();
  const { performCompleteStateUpdate } = createCompleteUpdateModule();
  const { performFinalValidation } = createValidationModule();
  const { generateOperationId, createUpdatePerformanceReport } =
    createUpdaterUtilities();

  // 단일 필드 업데이트 함수
  const updateFormValues = async (
    fieldName: keyof FormValues,
    fieldValue: FormValues[keyof FormValues]
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 단일 폼 필드 업데이트:', {
      fieldName,
      fieldValue,
    });

    try {
      const currentState = extractCurrentState();

      // Early Return: 현재 상태를 가져올 수 없는 경우
      if (!currentState) {
        console.error('❌ [UPDATER] 현재 상태 조회 실패');
        return false;
      }

      const { availableMethods } = currentState;
      const { updateFormValue } = availableMethods;

      // Early Return: 업데이트 함수가 없는 경우
      if (!updateFormValue) {
        console.error('❌ [UPDATER] updateFormValue 함수 없음');
        return false;
      }

      updateFormValue(fieldName, fieldValue);

      console.log('✅ [UPDATER] 단일 폼 필드 업데이트 완료:', { fieldName });
      return true;
    } catch (fieldUpdateError) {
      console.error(
        '❌ [UPDATER] 단일 폼 필드 업데이트 실패:',
        fieldUpdateError
      );
      return false;
    }
  };

  // 에디터 콘텐츠만 업데이트하는 함수
  const updateEditorContentOnly = async (content: string): Promise<boolean> => {
    console.log('🔄 [UPDATER] 에디터 콘텐츠만 업데이트');

    try {
      const currentState = extractCurrentState();

      // Early Return: 현재 상태를 가져올 수 없는 경우
      if (!currentState) {
        return false;
      }

      const { availableMethods } = currentState;
      const { updateEditorContent: storeUpdateContent } = availableMethods;

      // Early Return: 업데이트 함수가 없는 경우
      if (!storeUpdateContent) {
        return false;
      }

      storeUpdateContent(content);

      console.log('✅ [UPDATER] 에디터 콘텐츠 업데이트 완료:', {
        contentLength: content.length,
      });

      return true;
    } catch (contentUpdateError) {
      console.error(
        '❌ [UPDATER] 에디터 콘텐츠 업데이트 실패:',
        contentUpdateError
      );
      return false;
    }
  };

  console.log('✅ [UPDATER_FACTORY] 멀티스텝 상태 업데이터 생성 완료');

  return {
    performCompleteStateUpdate,
    updateFormValues,
    updateEditorContent: updateEditorContentOnly,
    getCurrentState: extractCurrentState,
    validateFinalState: performFinalValidation,
    generateOperationId,
    createPerformanceReport: createUpdatePerformanceReport,
  };
}

console.log('🏗️ [MULTI_STEP_UPDATER] 멀티스텝 업데이터 모듈 초기화 완료');
console.log('📊 [MULTI_STEP_UPDATER] 제공 기능:', {
  completeUpdate: '전체 상태 업데이트',
  fieldUpdate: '단일 필드 업데이트',
  contentUpdate: '에디터 콘텐츠 업데이트',
  validation: '최종 상태 검증',
  performance: '성능 모니터링',
});
console.log('✅ [MULTI_STEP_UPDATER] 모든 업데이트 기능 준비 완료');
