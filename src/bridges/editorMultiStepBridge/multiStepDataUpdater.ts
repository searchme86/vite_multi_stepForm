import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import { EditorToMultiStepDataTransformationResult } from './bridgeDataTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 멀티스텝 스토어 인터페이스
interface MultiStepStore {
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

interface UpdateResult {
  readonly success: boolean;
  readonly method: string;
  readonly details: Map<string, unknown>;
}

interface CurrentStateSnapshot {
  readonly formValues: FormValues;
  readonly currentStep: number;
  readonly progressWidth: number;
  readonly showPreview: boolean;
  readonly editorCompletedContent: string;
  readonly isEditorCompleted: boolean;
}

// 🔧 안전한 타입 변환 헬퍼 함수들
interface SafeTypeConversionModule {
  safeToNumber: (value: unknown, defaultValue: number) => number;
  safeToString: (value: unknown, defaultValue: string) => string;
  safeToBoolean: (value: unknown, defaultValue: boolean) => boolean;
}

function createSafeTypeConversionModule(): SafeTypeConversionModule {
  const safeToNumber = (value: unknown, defaultValue: number): number => {
    // 이미 숫자이고 유효한 경우
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    // 문자열에서 숫자 변환 시도
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    console.warn(
      `⚠️ [TYPE_CONVERTER] 숫자 변환 실패, 기본값 사용: ${defaultValue}`
    );
    return defaultValue;
  };

  const safeToString = (value: unknown, defaultValue: string): string => {
    // 이미 문자열인 경우
    if (typeof value === 'string') {
      return value;
    }

    // null이나 undefined인 경우
    if (value === null || value === undefined) {
      console.warn(
        `⚠️ [TYPE_CONVERTER] null/undefined를 문자열로 변환, 기본값 사용: ${defaultValue}`
      );
      return defaultValue;
    }

    // 다른 타입을 문자열로 변환
    try {
      return String(value);
    } catch (conversionError) {
      console.error(`❌ [TYPE_CONVERTER] 문자열 변환 실패:`, conversionError);
      return defaultValue;
    }
  };

  const safeToBoolean = (value: unknown, defaultValue: boolean): boolean => {
    // 이미 boolean인 경우
    if (typeof value === 'boolean') {
      return value;
    }

    // 문자열에서 boolean 변환
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }

    // 숫자에서 boolean 변환
    if (typeof value === 'number') {
      return value !== 0;
    }

    console.warn(
      `⚠️ [TYPE_CONVERTER] boolean 변환 실패, 기본값 사용: ${defaultValue}`
    );
    return defaultValue;
  };

  return {
    safeToNumber,
    safeToString,
    safeToBoolean,
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
    return typeof value === 'number' && !isNaN(value);
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

  // 🔧 P1-4: 구체적 함수 타입 가드들
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

  // 🔧 변환 전략 상수를 readonly Set으로 구현하여 성능과 타입 안전성 향상
  const validStrategiesSet = new Set([
    'EXISTING_CONTENT',
    'REBUILD_FROM_CONTAINERS',
    'PARAGRAPH_FALLBACK',
  ] as const);

  // 🔧 P1-4: 변환 전략 타입 가드 - 타입 단언 제거 및 Set 활용
  const isValidTransformationStrategy = (
    value: unknown
  ): value is
    | 'EXISTING_CONTENT'
    | 'REBUILD_FROM_CONTAINERS'
    | 'PARAGRAPH_FALLBACK' => {
    // Early Return: 문자열이 아닌 경우
    if (!isValidString(value)) {
      console.debug('🔍 [TYPE_GUARD] 변환 전략이 문자열이 아님:', typeof value);
      return false;
    }

    // 🎯 Set.has()를 사용한 효율적이고 타입 안전한 검증
    // value는 이미 isValidString 타입 가드를 통과했으므로 string 타입으로 좁혀짐
    const isValidStrategy = validStrategiesSet.has(
      value as
        | 'EXISTING_CONTENT'
        | 'REBUILD_FROM_CONTAINERS'
        | 'PARAGRAPH_FALLBACK'
    );

    console.debug('🔍 [TYPE_GUARD] 변환 전략 검증 결과:', {
      strategy: value,
      isValid: isValidStrategy,
      availableStrategies: Array.from(validStrategiesSet),
    });

    return isValidStrategy;
  };

  // 🔧 P1-4: FormValues 타입 가드 강화
  const isValidFormValues = (value: unknown): value is FormValues => {
    // Early Return: 객체가 아닌 경우
    if (!isValidObject(value)) {
      return false;
    }

    const formObj = value;

    // 🔧 P1-3: 구조분해할당으로 필수 속성들 검증
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
      'editorCompletedContent',
    ] as const;

    const hasValidStringFields = stringFields.every(
      (field) => field in formObj && isValidString(formObj[field])
    );

    // Early Return: 문자열 필드가 유효하지 않은 경우
    if (!hasValidStringFields) {
      return false;
    }

    // 배열 속성들 검증
    const hasValidMedia = 'media' in formObj && isValidArray(formObj.media);
    const hasValidSliderImages =
      'sliderImages' in formObj && isValidArray(formObj.sliderImages);

    // Early Return: 배열 필드가 유효하지 않은 경우
    if (!hasValidMedia || !hasValidSliderImages) {
      return false;
    }

    // boolean 속성 검증
    const hasValidCompleted =
      'isEditorCompleted' in formObj &&
      isValidBoolean(formObj.isEditorCompleted);

    // Early Return: boolean 필드가 유효하지 않은 경우
    if (!hasValidCompleted) {
      return false;
    }

    // mainImage는 string | null
    const hasValidMainImage =
      'mainImage' in formObj &&
      (formObj.mainImage === null || isValidString(formObj.mainImage));

    return hasValidMainImage;
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
    isValidFormValues,
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
  ): UpdateResult => {
    const detailsMap = createSafeDetailsMap();
    addToDetailsMap(detailsMap, 'timestamp', Date.now());
    addToDetailsMap(detailsMap, 'success', true);

    // 🔧 P1-2: 삼항연산자로 추가 데이터 처리 + undefined 체크
    if (additionalData && typeof additionalData === 'object') {
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
  ): UpdateResult => {
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
    isValidFormValues,
  } = createUpdaterTypeGuardModule();

  // 🔧 P1-4: EditorToMultiStepDataTransformationResult 타입 가드 강화
  const isValidTransformationResult = (
    result: unknown
  ): result is EditorToMultiStepDataTransformationResult => {
    console.log('🔍 [UPDATER] 변환 결과 타입 검증 시작');

    // Early Return: null이나 undefined
    if (!result || !isValidObject(result)) {
      console.error('❌ [UPDATER] 변환 결과가 null 또는 객체가 아님');
      return false;
    }

    const resultObj = result;

    // 🔧 P1-3: 구조분해할당으로 필수 필드들 검증
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

    // Early Return: 필수 필드가 없는 경우
    if (!hasAllRequiredFields) {
      console.error('❌ [UPDATER] 필수 필드가 누락됨');
      return false;
    }

    // 🔧 P1-4: 각 필드의 타입을 구체적으로 검증
    const hasValidContent = isValidString(resultObj.transformedContent);
    const hasValidCompleted = isValidBoolean(resultObj.transformedIsCompleted);
    const hasValidMetadata = isValidObject(resultObj.transformedMetadata);
    const hasValidSuccess = isValidBoolean(resultObj.transformationSuccess);
    const hasValidErrors = isValidArray(resultObj.transformationErrors);
    const hasValidStrategy = isValidTransformationStrategy(
      resultObj.transformationStrategy
    );

    // 🔧 P1-2: 삼항연산자로 성공 여부 확인
    const isSuccessful =
      resultObj.transformationSuccess === true ? true : false;

    const isValid =
      hasValidContent &&
      hasValidCompleted &&
      hasValidMetadata &&
      hasValidSuccess &&
      hasValidErrors &&
      hasValidStrategy &&
      isSuccessful;

    console.log('📊 [UPDATER] 변환 결과 검증 상세:', {
      hasValidContent,
      hasValidCompleted,
      hasValidMetadata,
      hasValidSuccess,
      hasValidErrors,
      hasValidStrategy,
      isSuccessful,
      isValid,
      contentLength: isValidString(resultObj.transformedContent)
        ? resultObj.transformedContent.length
        : 0,
    });

    return isValid;
  };

  return {
    isValidFormValues,
    isValidTransformationResult,
  };
}

function createStoreAccessModule() {
  const {
    isValidObject,
    isValidFormValues,
    isUpdateEditorContentFunction,
    isSetEditorCompletedFunction,
    isUpdateFormValueFunction,
    isSetFormValuesFunction,
  } = createUpdaterTypeGuardModule();
  const { safelyExecuteSyncOperation } = createUpdaterErrorHandlerModule();
  const { safeToNumber, safeToString, safeToBoolean } =
    createSafeTypeConversionModule();

  // 🔧 P1-4: MultiStepStore 안전한 캐스팅 함수
  const castToMultiStepStore = (
    store: Record<string, unknown>
  ): MultiStepStore | null => {
    console.log('🔍 [UPDATER] MultiStepStore 안전한 캐스팅 시작');

    return safelyExecuteSyncOperation(
      () => {
        // 🔧 P1-3: 구조분해할당으로 필수 속성들 추출 및 검증
        const {
          formValues: formValuesRaw,
          currentStep: currentStepRaw,
          progressWidth: progressWidthRaw,
          showPreview: showPreviewRaw,
          editorCompletedContent: editorCompletedContentRaw,
          isEditorCompleted: isEditorCompletedRaw,
        } = store;

        // Early Return: formValues가 유효하지 않은 경우
        if (!isValidFormValues(formValuesRaw)) {
          console.error('❌ [UPDATER] formValues가 유효하지 않음');
          return null;
        }

        // 🔧 타입 가드를 통한 안전한 검증
        const isValidCurrentStep = typeof currentStepRaw === 'number';
        const isValidProgressWidth = typeof progressWidthRaw === 'number';
        const isValidShowPreview = typeof showPreviewRaw === 'boolean';
        const isValidEditorCompleted =
          typeof isEditorCompletedRaw === 'boolean';
        const isValidEditorContent =
          typeof editorCompletedContentRaw === 'string';

        // Early Return: 필수 속성들이 유효하지 않은 경우
        if (
          !isValidCurrentStep ||
          !isValidProgressWidth ||
          !isValidShowPreview ||
          !isValidEditorCompleted ||
          !isValidEditorContent
        ) {
          console.error('❌ [UPDATER] 필수 속성들이 유효하지 않음');
          return null;
        }

        // 🔧 P1-3: 구조분해할당으로 선택적 함수 속성들 추출
        const {
          updateEditorContent: updateEditorContentRaw,
          setEditorCompleted: setEditorCompletedRaw,
          updateFormValue: updateFormValueRaw,
          setFormValues: setFormValuesRaw,
        } = store;

        // 🔧 안전한 타입 변환 (타입 단언 대신)
        const safeCurrentStep = safeToNumber(currentStepRaw, 1);
        const safeProgressWidth = safeToNumber(progressWidthRaw, 0);
        const safeShowPreview = safeToBoolean(showPreviewRaw, false);
        const safeEditorContent = safeToString(editorCompletedContentRaw, '');
        const safeEditorCompleted = safeToBoolean(isEditorCompletedRaw, false);

        const safeMultiStepStore: MultiStepStore = {
          formValues: formValuesRaw,
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

        console.log('✅ [UPDATER] MultiStepStore 안전한 캐스팅 성공');
        return safeMultiStepStore;
      },
      null,
      'MULTISTEP_STORE_CASTING'
    );
  };

  const getCurrentState = (): CurrentStateSnapshot | null => {
    console.log('🔍 [UPDATER] 현재 상태 조회');

    return safelyExecuteSyncOperation(
      () => {
        const storeState = useMultiStepFormStore.getState();

        // Early Return: 스토어가 없는 경우
        if (!storeState) {
          console.error('❌ [UPDATER] 멀티스텝 스토어 없음');
          return null;
        }

        // Early Return: 유효한 객체가 아닌 경우
        if (!isValidObject(storeState)) {
          console.error('❌ [UPDATER] 스토어가 객체가 아님');
          return null;
        }

        const multiStepStore = castToMultiStepStore(storeState);

        // Early Return: 캐스팅 실패
        if (!multiStepStore) {
          console.error('❌ [UPDATER] 스토어 캐스팅 실패');
          return null;
        }

        // 🔧 P1-3: 구조분해할당 + Fallback으로 안전한 기본값 설정
        const {
          formValues = createDefaultFormValues(),
          currentStep = 1,
          progressWidth = 0,
          showPreview = false,
          editorCompletedContent = '',
          isEditorCompleted = false,
        } = multiStepStore;

        const currentState: CurrentStateSnapshot = {
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
            formValues.editorCompletedContent?.length ?? 0,
          formValuesEditorCompleted: formValues.isEditorCompleted,
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
  ): Promise<UpdateResult> => {
    console.log('🔄 [UPDATER] 에디터 콘텐츠 업데이트');

    return safelyExecuteAsyncOperation(
      async () => {
        // Early Return: 유효하지 않은 결과
        if (!isValidTransformationResult(result)) {
          return createUpdateResultFailure(
            'VALIDATION_FAILED',
            '유효하지 않은 변환 결과'
          );
        }

        // 🔧 P1-3: 구조분해할당으로 변환 결과 추출
        const { transformedContent, transformedIsCompleted } = result;

        const storeState = useMultiStepFormStore.getState();

        // Early Return: 스토어 접근 불가
        if (!storeState) {
          return createUpdateResultFailure(
            'STORE_ACCESS_FAILED',
            '스토어 접근 불가'
          );
        }

        // Early Return: 유효하지 않은 스토어
        if (!isValidObject(storeState)) {
          return createUpdateResultFailure(
            'STORE_NOT_OBJECT',
            '스토어가 객체가 아님'
          );
        }

        const multiStepStore = castToMultiStepStore(storeState);

        // Early Return: 스토어 캐스팅 실패
        if (!multiStepStore) {
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

        // 🔧 P1-3: 구조분해할당으로 스토어 함수들 추출
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

        // 🔧 P1-2: 삼항연산자로 스토어 레벨 업데이트 시도
        const canUpdateStoreContent = isUpdateEditorContentFunction(
          storeUpdateContent
        )
          ? true
          : false;

        if (canUpdateStoreContent && storeUpdateContent) {
          console.log('🔄 [UPDATER] 스토어 레벨 콘텐츠 업데이트 실행');
          storeUpdateContent(transformedContent);
          updateMethods.push('STORE_CONTENT');
          updateSuccess = true;
        }

        const canUpdateStoreCompleted = isSetEditorCompletedFunction(
          storeSetCompleted
        )
          ? true
          : false;

        if (canUpdateStoreCompleted && storeSetCompleted) {
          console.log('🔄 [UPDATER] 스토어 레벨 완료 상태 업데이트 실행');
          storeSetCompleted(transformedIsCompleted);
          updateMethods.push('STORE_COMPLETED');
          updateSuccess = true;
        }

        // 🔧 P1-2: 삼항연산자로 FormValues 레벨 업데이트 시도
        const canUpdateFormValue = isUpdateFormValueFunction(updateFormValue)
          ? true
          : false;

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

        // Early Return: 업데이트 실패
        if (!updateSuccess) {
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
  ): Promise<UpdateResult> => {
    console.log('🔄 [UPDATER] 폼 필드 업데이트:', { fieldName, fieldValue });

    return safelyExecuteAsyncOperation(
      async () => {
        // Early Return: 유효하지 않은 필드명
        if (
          !fieldName ||
          (typeof fieldName === 'string' && fieldName.trim().length === 0)
        ) {
          return createUpdateResultFailure(
            'INVALID_FIELD_NAME',
            `유효하지 않은 필드명: ${String(fieldName)}`
          );
        }

        const storeState = useMultiStepFormStore.getState();

        // Early Return: 스토어 접근 불가
        if (!storeState) {
          return createUpdateResultFailure(
            'STORE_ACCESS_FAILED',
            '스토어 접근 불가'
          );
        }

        // Early Return: 유효하지 않은 스토어
        if (!isValidObject(storeState)) {
          return createUpdateResultFailure(
            'STORE_NOT_OBJECT',
            '스토어가 객체가 아님'
          );
        }

        const multiStepStore = castToMultiStepStore(storeState);

        // Early Return: 스토어 캐스팅 실패
        if (!multiStepStore) {
          return createUpdateResultFailure(
            'STORE_CASTING_FAILED',
            '스토어 캐스팅 실패'
          );
        }

        // 🔧 P1-3: 구조분해할당으로 업데이트 함수 추출
        const { updateFormValue, setFormValues } = multiStepStore;

        // 🔧 P1-2: 삼항연산자로 업데이트 함수 존재 여부 확인
        const canUpdateFormValue = isUpdateFormValueFunction(updateFormValue)
          ? true
          : false;

        // Early Return: updateFormValue 함수가 없는 경우 fallback 시도
        if (!canUpdateFormValue) {
          console.error('❌ [UPDATER] updateFormValue 함수 없음');

          // fallback: 직접 상태 조작 시도
          const canSetFormValues = isSetFormValuesFunction(setFormValues)
            ? true
            : false;

          if (canSetFormValues && setFormValues) {
            console.log('🔄 [UPDATER] fallback: 직접 상태 조작 시도');

            // 🔧 P1-3: 구조분해할당으로 현재 폼 값 추출
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
        // 🔧 P1-5: 타임아웃과 함께 실행
        return withTimeout(
          executeCompleteUpdate(result),
          10000, // 10초 타임아웃
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
    // 🔧 P1-3: 구조분해할당으로 변환 결과 추출
    const { transformedContent, transformedIsCompleted } = result;

    console.log('📊 [UPDATER] 업데이트할 결과 데이터:', {
      transformedContent: transformedContent?.substring(0, 100) + '...',
      transformedContentLength: transformedContent?.length ?? 0,
      transformedIsCompleted,
      transformationSuccess: result.transformationSuccess,
      hasMetadata: Boolean(result.transformedMetadata),
    });

    const startTime = performance.now();

    // 1단계: 에디터 콘텐츠 업데이트 (핵심!)
    const editorUpdateResult = await updateEditorContent(result);

    // Early Return: 에디터 업데이트 실패
    if (!editorUpdateResult.success) {
      console.error('❌ [UPDATER] 에디터 콘텐츠 업데이트 실패');
      return false;
    }

    // 2단계: 추가 폼 필드 업데이트 (안전장치)
    const [contentUpdateResult, completedUpdateResult] = await Promise.all([
      updateFormField('editorCompletedContent', transformedContent),
      updateFormField('isEditorCompleted', transformedIsCompleted),
    ]);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 🔧 P1-2: 삼항연산자로 전체 성공 여부 결정
    const overallSuccess =
      editorUpdateResult.success &&
      contentUpdateResult.success &&
      completedUpdateResult.success
        ? true
        : false;

    console.log('📊 [UPDATER] 전체 업데이트 결과:', {
      editorUpdateSuccess: editorUpdateResult.success,
      contentUpdateSuccess: contentUpdateResult.success,
      completedUpdateSuccess: completedUpdateResult.success,
      overallSuccess,
      duration: `${duration.toFixed(2)}ms`,
      finalContentLength: transformedContent.length,
      finalCompleted: transformedIsCompleted,
    });

    // Early Return: 일부라도 실패한 경우
    if (!overallSuccess) {
      console.error('❌ [UPDATER] 일부 업데이트 실패');
      return false;
    }

    console.log('✅ [UPDATER] 전체 업데이트 완료');

    // 🔧 P1-5: 최종 검증 (비동기)
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

    // 🔧 P1-3: 구조분해할당 + Fallback으로 최종 상태 추출
    const {
      editorCompletedContent: storeContent = '',
      isEditorCompleted: storeCompleted = false,
      formValues: {
        editorCompletedContent: formContent = '',
        isEditorCompleted: formCompleted = false,
      } = {},
    } = finalState ?? {};

    console.log('🔍 [UPDATER] 최종 상태 검증:', {
      storeContent: storeContent.length,
      storeCompleted,
      formContent: formContent.length,
      formCompleted,
      expectedContent: expectedContent.length,
      expectedCompleted,
      synchronizationSuccess:
        formContent.length > 0 && formCompleted === expectedCompleted,
    });
  };

  return { performCompleteStateUpdate };
}

export const createMultiStepStateUpdater = () => {
  console.log('🏭 [UPDATER_FACTORY] 멀티스텝 상태 업데이터 생성');

  // 🔧 P1-3: 구조분해할당으로 모듈 함수들 추출
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
};
