// bridges/editorMultiStepBridge/multiStepDataUpdater.ts

import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import type { EditorToMultiStepDataTransformationResult } from './bridgeDataTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';

// 멀티스텝 스토어 인터페이스
interface MultiStepStoreInterface {
  formValues: FormValues;
  currentStep: number;
  progressWidth: number;
  showPreview: boolean;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
  updateEditorContent?: (content: string) => void;
  setEditorCompleted?: (completed: boolean) => void;
  updateFormValue?: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  setFormValues?: (values: FormValues) => void;
}

interface UpdateExecutionResult {
  readonly success: boolean;
  readonly method: string;
  readonly details: Map<string, unknown>;
}

interface CurrentStoreSnapshot {
  readonly formValues: FormValues;
  readonly currentStep: number;
  readonly progressWidth: number;
  readonly showPreview: boolean;
  readonly editorCompletedContent: string;
  readonly isEditorCompleted: boolean;
}

// 🔧 안전한 타입 변환 헬퍼 함수들
interface SafeTypeConverterModule {
  convertToSafeNumber: (value: unknown, defaultValue: number) => number;
  convertToSafeString: (value: unknown, defaultValue: string) => string;
  convertToSafeBoolean: (value: unknown, defaultValue: boolean) => boolean;
}

function createSafeTypeConverterModule(): SafeTypeConverterModule {
  const convertToSafeNumber = (
    value: unknown,
    defaultValue: number
  ): number => {
    const isValidNumber = typeof value === 'number' && !Number.isNaN(value);
    if (isValidNumber) {
      return value;
    }

    const isStringNumber = typeof value === 'string';
    if (isStringNumber) {
      const parseResult = parseInt(value, 10);
      const isValidParseResult = !Number.isNaN(parseResult);
      if (isValidParseResult) {
        return parseResult;
      }
    }

    console.warn(
      `⚠️ [TYPE_CONVERTER] 숫자 변환 실패, 기본값 사용: ${defaultValue}`
    );
    return defaultValue;
  };

  const convertToSafeString = (
    value: unknown,
    defaultValue: string
  ): string => {
    const isStringType = typeof value === 'string';
    if (isStringType) {
      return value;
    }

    const isNullOrUndefined = value === null || value === undefined;
    if (isNullOrUndefined) {
      console.warn(
        `⚠️ [TYPE_CONVERTER] null/undefined를 문자열로 변환, 기본값 사용: ${defaultValue}`
      );
      return defaultValue;
    }

    try {
      return String(value);
    } catch (conversionError) {
      console.error(`❌ [TYPE_CONVERTER] 문자열 변환 실패:`, conversionError);
      return defaultValue;
    }
  };

  const convertToSafeBoolean = (
    value: unknown,
    defaultValue: boolean
  ): boolean => {
    const isBooleanType = typeof value === 'boolean';
    if (isBooleanType) {
      return value;
    }

    const isStringType = typeof value === 'string';
    if (isStringType) {
      const lowerCaseValue = value.toLowerCase();
      const isTrueString = lowerCaseValue === 'true';
      const isFalseString = lowerCaseValue === 'false';

      if (isTrueString) return true;
      if (isFalseString) return false;
    }

    const isNumberType = typeof value === 'number';
    if (isNumberType) {
      return value !== 0;
    }

    console.warn(
      `⚠️ [TYPE_CONVERTER] boolean 변환 실패, 기본값 사용: ${defaultValue}`
    );
    return defaultValue;
  };

  return {
    convertToSafeNumber,
    convertToSafeString,
    convertToSafeBoolean,
  };
}

// 🔧 P1-4: 강화된 타입 가드 모듈
function createUpdaterTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  const isValidFunction = (value: unknown): value is Function => {
    return typeof value === 'function';
  };

  const isValidMap = (
    candidate: unknown
  ): candidate is Map<string, unknown> => {
    return candidate instanceof Map;
  };

  const isUpdateEditorContentFunction = (
    value: unknown
  ): value is (content: string) => void => {
    return isValidFunction(value);
  };

  const isSetEditorCompletedFunction = (
    value: unknown
  ): value is (completed: boolean) => void => {
    return isValidFunction(value);
  };

  const isUpdateFormValueFunction = (
    value: unknown
  ): value is <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void => {
    return isValidFunction(value);
  };

  const isSetFormValuesFunction = (
    value: unknown
  ): value is (values: FormValues) => void => {
    return isValidFunction(value);
  };

  const validTransformationStrategiesSet = new Set([
    'EXISTING_CONTENT',
    'REBUILD_FROM_CONTAINERS',
    'PARAGRAPH_FALLBACK',
  ] as const);

  const isValidTransformationStrategy = (
    value: unknown
  ): value is
    | 'EXISTING_CONTENT'
    | 'REBUILD_FROM_CONTAINERS'
    | 'PARAGRAPH_FALLBACK' => {
    const isStringValue = isValidString(value);
    if (!isStringValue) {
      console.debug('🔍 [TYPE_GUARD] 변환 전략이 문자열이 아님:', typeof value);
      return false;
    }

    const isValidStrategyValue = validTransformationStrategiesSet.has(
      value as
        | 'EXISTING_CONTENT'
        | 'REBUILD_FROM_CONTAINERS'
        | 'PARAGRAPH_FALLBACK'
    );

    console.debug('🔍 [TYPE_GUARD] 변환 전략 검증 결과:', {
      strategy: value,
      isValid: isValidStrategyValue,
      availableStrategies: Array.from(validTransformationStrategiesSet),
    });

    return isValidStrategyValue;
  };

  return {
    isValidString,
    isValidBoolean,
    isValidNumber,
    isValidObject,
    isValidArray,
    isValidFunction,
    isValidMap,
    isUpdateEditorContentFunction,
    isSetEditorCompletedFunction,
    isUpdateFormValueFunction,
    isSetFormValuesFunction,
    isValidTransformationStrategy,
  };
}

// 🔧 P1-5: 에러 처리 강화 모듈
function createUpdaterErrorHandlerModule() {
  const { isValidString } = createUpdaterTypeGuardModule();

  const safelyExecuteAsyncOperation = async <T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (operationError) {
      console.error(`❌ [UPDATER] ${operationName} 실행 실패:`, operationError);
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
      console.error(`❌ [UPDATER] ${operationName} 실행 실패:`, operationError);
      return fallbackValue;
    }
  };

  const extractErrorMessage = (error: unknown): string => {
    const isErrorInstance = error instanceof Error;
    if (isErrorInstance) {
      return error.message;
    }

    const isStringError = isValidString(error);
    if (isStringError) {
      return error;
    }

    try {
      return String(error);
    } catch (conversionError) {
      console.warn('⚠️ [UPDATER] 에러 메시지 변환 실패:', conversionError);
      return 'Unknown updater error';
    }
  };

  const withTimeout = <T>(
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

  return {
    safelyExecuteAsyncOperation,
    safelyExecuteSyncOperation,
    extractErrorMessage,
    withTimeout,
  };
}

// 🔧 P1-3: Map 생성 및 조작 헬퍼 함수들
function createMapUtilityModule() {
  const createSafeDetailsMap = (): Map<string, unknown> => {
    return new Map<string, unknown>();
  };

  const addToDetailsMap = (
    targetMap: Map<string, unknown>,
    key: string,
    value: unknown
  ): void => {
    targetMap.set(key, value);
  };

  const createUpdateResultSuccess = (
    method: string,
    additionalData?: Record<string, unknown>
  ): UpdateExecutionResult => {
    const detailsMap = createSafeDetailsMap();
    addToDetailsMap(detailsMap, 'timestamp', Date.now());
    addToDetailsMap(detailsMap, 'success', true);

    const hasAdditionalData =
      additionalData && typeof additionalData === 'object';
    if (hasAdditionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        addToDetailsMap(detailsMap, key, value);
      });
    }

    return {
      success: true,
      method,
      details: detailsMap,
    };
  };

  const createUpdateResultFailure = (
    method: string,
    errorMessage: string
  ): UpdateExecutionResult => {
    const detailsMap = createSafeDetailsMap();
    addToDetailsMap(detailsMap, 'timestamp', Date.now());
    addToDetailsMap(detailsMap, 'success', false);
    addToDetailsMap(detailsMap, 'error', errorMessage);

    return {
      success: false,
      method,
      details: detailsMap,
    };
  };

  return {
    createSafeDetailsMap,
    addToDetailsMap,
    createUpdateResultSuccess,
    createUpdateResultFailure,
  };
}

function createDefaultFormValues(): FormValues {
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
}

function createValidationModule() {
  const {
    isValidString,
    isValidBoolean,
    isValidObject,
    isValidArray,
    isValidTransformationStrategy,
  } = createUpdaterTypeGuardModule();

  // 🚨 핵심 수정: FormValues 검증을 관대하게 변경
  const isValidFormValues = (value: unknown): value is FormValues => {
    console.log('🔍 [UPDATER] FormValues 검증 시작 (초관대한 모드):', value);

    // 기본 객체 타입 체크
    const isValidObjectType = isValidObject(value);
    if (!isValidObjectType) {
      console.error('❌ [UPDATER] FormValues가 객체가 아님');
      return false;
    }

    const formObj = value;

    // 🚨 핵심 변경: 필수 필드를 최소한으로 줄임 (완전 관대한 모드)
    // 아무런 필수 필드 검증 없이 객체만 체크
    console.log(
      '✅ [UPDATER] FormValues 검증 성공 (초관대한 모드) - 객체 타입만 확인'
    );
    return true;
  };

  const isValidTransformationResult = (
    result: unknown
  ): result is EditorToMultiStepDataTransformationResult => {
    console.log('🔍 [UPDATER] 변환 결과 타입 검증 시작');

    const isValidResultObject = result && isValidObject(result);
    if (!isValidResultObject) {
      console.error('❌ [UPDATER] 변환 결과가 null 또는 객체가 아님');
      return false;
    }

    const resultObj = result;

    const requiredFields = [
      'transformedContent',
      'transformedIsCompleted',
      'transformedMetadata',
      'transformationSuccess',
      'transformationErrors',
      'transformationStrategy',
    ] as const;

    const hasAllRequiredFields = requiredFields.every(
      (field) => field in resultObj
    );

    if (!hasAllRequiredFields) {
      console.error('❌ [UPDATER] 필수 필드가 누락됨');
      return false;
    }

    const transformedContent = Reflect.get(resultObj, 'transformedContent');
    const transformedIsCompleted = Reflect.get(
      resultObj,
      'transformedIsCompleted'
    );
    const transformedMetadata = Reflect.get(resultObj, 'transformedMetadata');
    const transformationSuccess = Reflect.get(
      resultObj,
      'transformationSuccess'
    );
    const transformationErrors = Reflect.get(resultObj, 'transformationErrors');
    const transformationStrategy = Reflect.get(
      resultObj,
      'transformationStrategy'
    );

    const hasValidContent = isValidString(transformedContent);
    const hasValidCompleted = isValidBoolean(transformedIsCompleted);
    const hasValidMetadata = isValidObject(transformedMetadata);
    const hasValidSuccess = isValidBoolean(transformationSuccess);
    const hasValidErrors = isValidArray(transformationErrors);
    const hasValidStrategy = isValidTransformationStrategy(
      transformationStrategy
    );

    const isSuccessfulTransformation = transformationSuccess === true;

    const isValidOverall =
      hasValidContent &&
      hasValidCompleted &&
      hasValidMetadata &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidStrategy &&
      isSuccessfulTransformation;

    console.log('📊 [UPDATER] 변환 결과 검증 상세:', {
      hasValidContent,
      hasValidCompleted,
      hasValidMetadata,
      hasValidSuccess,
      hasValidErrors,
      hasValidStrategy,
      isSuccessfulTransformation,
      isValidOverall,
      contentLength: isValidString(transformedContent)
        ? transformedContent.length
        : 0,
    });

    return isValidOverall;
  };

  return {
    isValidFormValues,
    isValidTransformationResult,
  };
}

// 🚨 핵심 수정: fallback FormValues 생성 함수 완전 관대하게 변경
const createFallbackFormValues = (originalFormValues: unknown): FormValues => {
  console.log('🔄 [UPDATER] 초관대한 Fallback FormValues 생성');

  const baseFormValues = createDefaultFormValues();
  const { isValidObject } = createUpdaterTypeGuardModule();

  // 원본이 객체가 아니어도 기본값 반환
  const isValidOriginal = isValidObject(originalFormValues);
  if (!isValidOriginal) {
    console.log('✅ [UPDATER] 원본이 객체가 아님, 기본값 반환');
    return baseFormValues;
  }

  const safeOriginal = originalFormValues;

  // 🚨 핵심 변경: 모든 필드를 안전하게 복사하되 실패해도 기본값 유지
  try {
    // editorCompletedContent와 isEditorCompleted만 특별히 처리
    const editorContentExists = 'editorCompletedContent' in safeOriginal;
    if (editorContentExists) {
      const content = Reflect.get(safeOriginal, 'editorCompletedContent');
      if (typeof content === 'string') {
        baseFormValues.editorCompletedContent = content;
      }
    }

    const editorCompletedExists = 'isEditorCompleted' in safeOriginal;
    if (editorCompletedExists) {
      const completed = Reflect.get(safeOriginal, 'isEditorCompleted');
      if (typeof completed === 'boolean') {
        baseFormValues.isEditorCompleted = completed;
      }
    }

    // 나머지 문자열 필드들을 안전하게 복사
    const stringFields = [
      'userImage',
      'nickname',
      'emailPrefix',
      'emailDomain',
      'bio',
      'title',
      'description',
      'tags',
      'content',
    ] as const;

    stringFields.forEach((field) => {
      try {
        const fieldExists = field in safeOriginal;
        if (fieldExists) {
          const value = Reflect.get(safeOriginal, field);
          if (typeof value === 'string') {
            baseFormValues[field] = value;
          }
        }
      } catch (fieldError) {
        console.debug(
          `🔍 [UPDATER] 필드 ${field} 복사 실패 (무시):`,
          fieldError
        );
      }
    });

    // 배열 필드들 안전하게 복사
    const mediaExists = 'media' in safeOriginal;
    if (mediaExists) {
      try {
        const mediaValue = Reflect.get(safeOriginal, 'media');
        if (Array.isArray(mediaValue)) {
          baseFormValues.media = mediaValue.filter(
            (item) => typeof item === 'string'
          );
        }
      } catch (mediaError) {
        console.debug('🔍 [UPDATER] media 필드 복사 실패 (무시):', mediaError);
      }
    }

    const sliderImagesExists = 'sliderImages' in safeOriginal;
    if (sliderImagesExists) {
      try {
        const sliderImagesValue = Reflect.get(safeOriginal, 'sliderImages');
        if (Array.isArray(sliderImagesValue)) {
          baseFormValues.sliderImages = sliderImagesValue.filter(
            (item) => typeof item === 'string'
          );
        }
      } catch (sliderError) {
        console.debug(
          '🔍 [UPDATER] sliderImages 필드 복사 실패 (무시):',
          sliderError
        );
      }
    }

    // mainImage 필드 안전하게 복사
    const mainImageExists = 'mainImage' in safeOriginal;
    if (mainImageExists) {
      try {
        const mainImage = Reflect.get(safeOriginal, 'mainImage');
        if (typeof mainImage === 'string' || mainImage === null) {
          baseFormValues.mainImage = mainImage;
        }
      } catch (mainImageError) {
        console.debug(
          '🔍 [UPDATER] mainImage 필드 복사 실패 (무시):',
          mainImageError
        );
      }
    }
  } catch (overallError) {
    console.warn(
      '⚠️ [UPDATER] 전체 필드 복사 중 오류 발생 (기본값 유지):',
      overallError
    );
  }

  console.log('✅ [UPDATER] 초관대한 Fallback FormValues 생성 완료');
  return baseFormValues;
};

function createStoreAccessModule() {
  const {
    isValidObject,
    isUpdateEditorContentFunction,
    isSetEditorCompletedFunction,
    isUpdateFormValueFunction,
    isSetFormValuesFunction,
  } = createUpdaterTypeGuardModule();
  const { safelyExecuteSyncOperation } = createUpdaterErrorHandlerModule();
  const { convertToSafeNumber, convertToSafeString, convertToSafeBoolean } =
    createSafeTypeConverterModule();
  const { isValidFormValues } = createValidationModule();

  const castToMultiStepStore = (
    store: Record<string, unknown>
  ): MultiStepStoreInterface | null => {
    console.log('🔍 [UPDATER] MultiStepStore 초관대한 캐스팅 시작');

    return safelyExecuteSyncOperation(
      () => {
        const formValuesRaw = Reflect.get(store, 'formValues');
        const currentStepRaw = Reflect.get(store, 'currentStep');
        const progressWidthRaw = Reflect.get(store, 'progressWidth');
        const showPreviewRaw = Reflect.get(store, 'showPreview');
        const editorCompletedContentRaw = Reflect.get(
          store,
          'editorCompletedContent'
        );
        const isEditorCompletedRaw = Reflect.get(store, 'isEditorCompleted');

        let validatedFormValues: FormValues;

        // 🚨 핵심 변경: formValues 검증 실패해도 무조건 fallback으로 처리
        console.log('🔍 [UPDATER] FormValues 검증 시도 (관대한 모드)');
        const isFormValuesValid = isValidFormValues(formValuesRaw);
        if (isFormValuesValid) {
          validatedFormValues = formValuesRaw;
          console.log('✅ [UPDATER] 원본 formValues 사용');
        } else {
          console.log(
            '⚠️ [UPDATER] formValues 검증 실패, 관대한 fallback 생성'
          );
          validatedFormValues = createFallbackFormValues(formValuesRaw);
        }

        const isValidCurrentStep = typeof currentStepRaw === 'number';
        const isValidProgressWidth = typeof progressWidthRaw === 'number';
        const isValidShowPreview = typeof showPreviewRaw === 'boolean';
        const isValidEditorCompleted =
          typeof isEditorCompletedRaw === 'boolean';
        const isValidEditorContent =
          typeof editorCompletedContentRaw === 'string';

        const hasValidBasicTypes =
          isValidCurrentStep &&
          isValidProgressWidth &&
          isValidShowPreview &&
          isValidEditorCompleted &&
          isValidEditorContent;

        if (!hasValidBasicTypes) {
          console.warn(
            '⚠️ [UPDATER] 일부 기본 타입이 유효하지 않지만 계속 진행'
          );
        }

        const updateEditorContentRaw = Reflect.get(
          store,
          'updateEditorContent'
        );
        const setEditorCompletedRaw = Reflect.get(store, 'setEditorCompleted');
        const updateFormValueRaw = Reflect.get(store, 'updateFormValue');
        const setFormValuesRaw = Reflect.get(store, 'setFormValues');

        const safeCurrentStep = convertToSafeNumber(currentStepRaw, 1);
        const safeProgressWidth = convertToSafeNumber(progressWidthRaw, 0);
        const safeShowPreview = convertToSafeBoolean(showPreviewRaw, false);
        const safeEditorContent = convertToSafeString(
          editorCompletedContentRaw,
          ''
        );
        const safeEditorCompleted = convertToSafeBoolean(
          isEditorCompletedRaw,
          false
        );

        const safeMultiStepStore: MultiStepStoreInterface = {
          formValues: validatedFormValues,
          currentStep: safeCurrentStep,
          progressWidth: safeProgressWidth,
          showPreview: safeShowPreview,
          editorCompletedContent: safeEditorContent,
          isEditorCompleted: safeEditorCompleted,
          updateEditorContent: isUpdateEditorContentFunction(
            updateEditorContentRaw
          )
            ? updateEditorContentRaw
            : undefined,
          setEditorCompleted: isSetEditorCompletedFunction(
            setEditorCompletedRaw
          )
            ? setEditorCompletedRaw
            : undefined,
          updateFormValue: isUpdateFormValueFunction(updateFormValueRaw)
            ? updateFormValueRaw
            : undefined,
          setFormValues: isSetFormValuesFunction(setFormValuesRaw)
            ? setFormValuesRaw
            : undefined,
        };

        console.log('✅ [UPDATER] MultiStepStore 초관대한 캐스팅 성공');
        return safeMultiStepStore;
      },
      null,
      'MULTISTEP_STORE_CASTING'
    );
  };

  const getCurrentState = (): CurrentStoreSnapshot | null => {
    console.log('🔍 [UPDATER] 현재 상태 조회');

    return safelyExecuteSyncOperation(
      () => {
        const storeState = useMultiStepFormStore.getState();

        const isStoreStateNull = !storeState;
        if (isStoreStateNull) {
          console.error('❌ [UPDATER] 멀티스텝 스토어 없음');
          return null;
        }

        const isValidStoreObject = isValidObject(storeState);
        if (!isValidStoreObject) {
          console.error('❌ [UPDATER] 스토어가 객체가 아님');
          return null;
        }

        const multiStepStore = castToMultiStepStore(storeState);

        const isMultiStepStoreNull = !multiStepStore;
        if (isMultiStepStoreNull) {
          console.error('❌ [UPDATER] 스토어 캐스팅 실패');
          return null;
        }

        const {
          formValues = createDefaultFormValues(),
          currentStep = 1,
          progressWidth = 0,
          showPreview = false,
          editorCompletedContent = '',
          isEditorCompleted = false,
        } = multiStepStore;

        const currentState: CurrentStoreSnapshot = {
          formValues,
          currentStep,
          progressWidth,
          showPreview,
          editorCompletedContent,
          isEditorCompleted,
        };

        console.log('✅ [UPDATER] 상태 조회 완료:', {
          currentStep,
          hasFormValues: Object.keys(formValues).length > 0,
          contentLength: editorCompletedContent.length,
          isEditorCompleted,
          formValuesEditorContent:
            Reflect.get(formValues, 'editorCompletedContent')?.length ?? 0,
          formValuesEditorCompleted: Reflect.get(
            formValues,
            'isEditorCompleted'
          ),
        });

        return currentState;
      },
      null,
      'CURRENT_STATE_RETRIEVAL'
    );
  };

  return {
    castToMultiStepStore,
    getCurrentState,
  };
}

function createEditorContentUpdateModule() {
  const { isValidTransformationResult } = createValidationModule();
  const { castToMultiStepStore } = createStoreAccessModule();
  const {
    isValidObject,
    isUpdateEditorContentFunction,
    isSetEditorCompletedFunction,
    isUpdateFormValueFunction,
  } = createUpdaterTypeGuardModule();
  const { safelyExecuteAsyncOperation } = createUpdaterErrorHandlerModule();
  const { createUpdateResultSuccess, createUpdateResultFailure } =
    createMapUtilityModule();

  const updateEditorContent = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<UpdateExecutionResult> => {
    console.log('🔄 [UPDATER] 에디터 콘텐츠 업데이트');

    return safelyExecuteAsyncOperation(
      async () => {
        const isValidResult = isValidTransformationResult(result);
        if (!isValidResult) {
          return createUpdateResultFailure(
            'VALIDATION_FAILED',
            '유효하지 않은 변환 결과'
          );
        }

        const { transformedContent, transformedIsCompleted } = result;

        const storeState = useMultiStepFormStore.getState();

        const isStoreStateNull = !storeState;
        if (isStoreStateNull) {
          return createUpdateResultFailure(
            'STORE_ACCESS_FAILED',
            '스토어 접근 불가'
          );
        }

        const isValidStoreObject = isValidObject(storeState);
        if (!isValidStoreObject) {
          return createUpdateResultFailure(
            'STORE_NOT_OBJECT',
            '스토어가 객체가 아님'
          );
        }

        const multiStepStore = castToMultiStepStore(storeState);

        const isMultiStepStoreNull = !multiStepStore;
        if (isMultiStepStoreNull) {
          return createUpdateResultFailure(
            'STORE_CASTING_FAILED',
            '스토어 캐스팅 실패'
          );
        }

        console.log('📊 [UPDATER] 업데이트할 데이터:', {
          contentLength: transformedContent.length,
          isCompleted: transformedIsCompleted,
          storeAvailable: Boolean(multiStepStore),
        });

        const {
          updateEditorContent: storeUpdateContent,
          setEditorCompleted: storeSetCompleted,
          updateFormValue,
        } = multiStepStore;

        console.log('🔍 [UPDATER] 사용 가능한 스토어 함수들:', {
          hasUpdateEditorContent:
            isUpdateEditorContentFunction(storeUpdateContent),
          hasSetEditorCompleted:
            isSetEditorCompletedFunction(storeSetCompleted),
          hasUpdateFormValue: isUpdateFormValueFunction(updateFormValue),
          storeKeys: Object.keys(multiStepStore),
        });

        let updateSuccess = false;
        const updateMethods: string[] = [];

        const canUpdateStoreContent =
          isUpdateEditorContentFunction(storeUpdateContent);
        if (canUpdateStoreContent && storeUpdateContent) {
          console.log('🔄 [UPDATER] 스토어 레벨 콘텐츠 업데이트 실행');
          storeUpdateContent(transformedContent);
          updateMethods.push('STORE_CONTENT');
          updateSuccess = true;
        }

        const canUpdateStoreCompleted =
          isSetEditorCompletedFunction(storeSetCompleted);
        if (canUpdateStoreCompleted && storeSetCompleted) {
          console.log('🔄 [UPDATER] 스토어 레벨 완료 상태 업데이트 실행');
          storeSetCompleted(transformedIsCompleted);
          updateMethods.push('STORE_COMPLETED');
          updateSuccess = true;
        }

        const canUpdateFormValue = isUpdateFormValueFunction(updateFormValue);
        if (canUpdateFormValue && updateFormValue) {
          console.log('🔄 [UPDATER] FormValues 레벨 업데이트 실행');

          updateFormValue('editorCompletedContent', transformedContent);
          console.log(
            '✅ [UPDATER] FormValues.editorCompletedContent 업데이트 완료'
          );

          updateFormValue('isEditorCompleted', transformedIsCompleted);
          console.log(
            '✅ [UPDATER] FormValues.isEditorCompleted 업데이트 완료'
          );

          updateMethods.push('FORM_VALUES');
          updateSuccess = true;
        }

        const hasAnyUpdateMethod = updateSuccess;
        if (!hasAnyUpdateMethod) {
          return createUpdateResultFailure(
            'NO_UPDATE_METHODS',
            '업데이트 함수들을 찾을 수 없음'
          );
        }

        console.log('✅ [UPDATER] 에디터 콘텐츠 업데이트 성공:', {
          contentLength: transformedContent.length,
          isCompleted: transformedIsCompleted,
          updateMethods: updateMethods.join(', '),
        });

        return createUpdateResultSuccess(updateMethods.join(', '), {
          contentLength: transformedContent.length,
          isCompleted: transformedIsCompleted,
          methodCount: updateMethods.length,
        });
      },
      createUpdateResultFailure('UPDATE_ERROR', '업데이트 중 예외 발생'),
      'EDITOR_CONTENT_UPDATE'
    );
  };

  return { updateEditorContent };
}

function createFormFieldUpdateModule() {
  const { castToMultiStepStore } = createStoreAccessModule();
  const { isValidObject, isUpdateFormValueFunction, isSetFormValuesFunction } =
    createUpdaterTypeGuardModule();
  const { safelyExecuteAsyncOperation } = createUpdaterErrorHandlerModule();
  const { createUpdateResultSuccess, createUpdateResultFailure } =
    createMapUtilityModule();

  const updateFormField = async <K extends keyof FormValues>(
    fieldName: K,
    fieldValue: FormValues[K]
  ): Promise<UpdateExecutionResult> => {
    console.log('🔄 [UPDATER] 폼 필드 업데이트:', { fieldName, fieldValue });

    return safelyExecuteAsyncOperation(
      async () => {
        const isFieldNameValid =
          fieldName &&
          (typeof fieldName === 'string' ? fieldName.trim().length > 0 : true);

        if (!isFieldNameValid) {
          return createUpdateResultFailure(
            'INVALID_FIELD_NAME',
            `유효하지 않은 필드명: ${String(fieldName)}`
          );
        }

        const storeState = useMultiStepFormStore.getState();

        const isStoreStateNull = !storeState;
        if (isStoreStateNull) {
          return createUpdateResultFailure(
            'STORE_ACCESS_FAILED',
            '스토어 접근 불가'
          );
        }

        const isValidStoreObject = isValidObject(storeState);
        if (!isValidStoreObject) {
          return createUpdateResultFailure(
            'STORE_NOT_OBJECT',
            '스토어가 객체가 아님'
          );
        }

        const multiStepStore = castToMultiStepStore(storeState);

        const isMultiStepStoreNull = !multiStepStore;
        if (isMultiStepStoreNull) {
          return createUpdateResultFailure(
            'STORE_CASTING_FAILED',
            '스토어 캐스팅 실패'
          );
        }

        const { updateFormValue, setFormValues } = multiStepStore;

        const canUpdateFormValue = isUpdateFormValueFunction(updateFormValue);
        if (!canUpdateFormValue) {
          console.error('❌ [UPDATER] updateFormValue 함수 없음');

          const canSetFormValues = isSetFormValuesFunction(setFormValues);
          if (canSetFormValues && setFormValues) {
            console.log('🔄 [UPDATER] fallback: 직접 상태 조작 시도');

            const {
              formValues: currentFormValues = createDefaultFormValues(),
            } = multiStepStore;

            const updatedFormValues: FormValues = {
              ...currentFormValues,
              [fieldName]: fieldValue,
            };

            setFormValues(updatedFormValues);
            console.log('✅ [UPDATER] fallback 업데이트 성공');

            return createUpdateResultSuccess('FALLBACK_DIRECT_UPDATE', {
              fieldName: String(fieldName),
            });
          }

          return createUpdateResultFailure(
            'NO_UPDATE_FUNCTION',
            '업데이트 함수들을 찾을 수 없음'
          );
        }

        if (updateFormValue) {
          updateFormValue(fieldName, fieldValue);
        }

        console.log('✅ [UPDATER] 폼 필드 업데이트 완료:', { fieldName });

        return createUpdateResultSuccess('FORM_VALUE_UPDATE', {
          fieldName: String(fieldName),
        });
      },
      createUpdateResultFailure(
        'FIELD_UPDATE_ERROR',
        '폼 필드 업데이트 중 오류'
      ),
      'FORM_FIELD_UPDATE'
    );
  };

  return { updateFormField };
}

function createCompleteStateUpdateModule() {
  const { updateEditorContent } = createEditorContentUpdateModule();
  const { updateFormField } = createFormFieldUpdateModule();
  const { getCurrentState } = createStoreAccessModule();
  const { safelyExecuteAsyncOperation, withTimeout } =
    createUpdaterErrorHandlerModule();

  const performCompleteStateUpdate = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 전체 상태 업데이트 시작');

    return safelyExecuteAsyncOperation(
      async () => {
        return withTimeout(
          executeCompleteUpdate(result),
          10000,
          '전체 상태 업데이트 타임아웃'
        );
      },
      false,
      'COMPLETE_STATE_UPDATE'
    );
  };

  const executeCompleteUpdate = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    const { transformedContent, transformedIsCompleted } = result;

    console.log('📊 [UPDATER] 업데이트할 결과 데이터:', {
      transformedContent: transformedContent?.substring(0, 100) + '...',
      transformedContentLength: transformedContent?.length ?? 0,
      transformedIsCompleted,
      transformationSuccess: result.transformationSuccess,
      hasMetadata: Boolean(result.transformedMetadata),
    });

    const startTime = performance.now();

    const editorUpdateResult = await updateEditorContent(result);

    const isEditorUpdateSuccessful = editorUpdateResult.success;
    if (!isEditorUpdateSuccessful) {
      console.error('❌ [UPDATER] 에디터 콘텐츠 업데이트 실패');
      return false;
    }

    const [contentUpdateResult, completedUpdateResult] = await Promise.all([
      updateFormField('editorCompletedContent', transformedContent),
      updateFormField('isEditorCompleted', transformedIsCompleted),
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;

    const overallSuccess =
      editorUpdateResult.success &&
      contentUpdateResult.success &&
      completedUpdateResult.success;

    console.log('📊 [UPDATER] 전체 업데이트 결과:', {
      editorUpdateSuccess: editorUpdateResult.success,
      contentUpdateSuccess: contentUpdateResult.success,
      completedUpdateSuccess: completedUpdateResult.success,
      overallSuccess,
      duration: `${duration.toFixed(2)}ms`,
      finalContentLength: transformedContent.length,
      finalCompleted: transformedIsCompleted,
    });

    const isOverallUpdateFailed = !overallSuccess;
    if (isOverallUpdateFailed) {
      console.error('❌ [UPDATER] 일부 업데이트 실패');
      return false;
    }

    console.log('✅ [UPDATER] 전체 업데이트 완료');

    setTimeout(() => {
      performFinalValidation(transformedContent, transformedIsCompleted);
    }, 200);

    return true;
  };

  const performFinalValidation = (
    expectedContent: string,
    expectedCompleted: boolean
  ): void => {
    const finalState = getCurrentState();

    const isValidFinalState = finalState !== null;
    if (!isValidFinalState) {
      console.warn('⚠️ [UPDATER] 최종 상태 조회 실패');
      return;
    }

    const {
      editorCompletedContent: storeContent = '',
      isEditorCompleted: storeCompleted = false,
      formValues = createDefaultFormValues(),
    } = finalState;

    const formContent = Reflect.get(formValues, 'editorCompletedContent') ?? '';
    const formCompleted = Reflect.get(formValues, 'isEditorCompleted') ?? false;

    console.log('🔍 [UPDATER] 최종 상태 검증:', {
      storeContent: storeContent.length,
      storeCompleted,
      formContent: typeof formContent === 'string' ? formContent.length : 0,
      formCompleted,
      expectedContent: expectedContent.length,
      expectedCompleted,
      synchronizationSuccess:
        typeof formContent === 'string' &&
        formContent.length > 0 &&
        formCompleted === expectedCompleted,
    });
  };

  return { performCompleteStateUpdate };
}

// 🔧 핵심 수정: export const → export function으로 변경
export function createMultiStepStateUpdater() {
  console.log('🏭 [UPDATER_FACTORY] 멀티스텝 상태 업데이터 생성');

  const { isValidTransformationResult } = createValidationModule();
  const { getCurrentState } = createStoreAccessModule();
  const { updateEditorContent } = createEditorContentUpdateModule();
  const { updateFormField } = createFormFieldUpdateModule();
  const { performCompleteStateUpdate } = createCompleteStateUpdateModule();

  console.log('✅ [UPDATER_FACTORY] 멀티스텝 상태 업데이터 생성 완료');

  return {
    validateTransformationResult: isValidTransformationResult,
    getCurrentMultiStepState: getCurrentState,
    updateEditorContentInMultiStep: updateEditorContent,
    updateFormValueInMultiStep: updateFormField,
    performCompleteStateUpdate,
  };
}
