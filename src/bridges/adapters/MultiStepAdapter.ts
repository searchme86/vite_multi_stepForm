// adapters/MultiStepAdapter.ts

import BaseAdapter from './BaseAdapter';
import type {
  ValidationResult,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
} from '../editorMultiStepBridge/modernBridgeTypes';
import type { FormValues } from '../../components/multiStepForm/types/formTypes';
import type { StepNumber } from '../../components/multiStepForm/types/stepTypes';
import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';

interface MultiStepAdapterEventData {
  readonly eventType:
    | 'STATE_CHANGE'
    | 'FORM_UPDATE'
    | 'STEP_CHANGE'
    | 'VALIDATION_CHANGE';
  readonly eventTimestamp: number;
  readonly eventPayload: Map<string, unknown>;
  readonly previousState?: MultiStepFormSnapshotForBridge;
  readonly currentState: MultiStepFormSnapshotForBridge;
}

interface MultiStepEventListener {
  readonly listenerId: string;
  readonly eventHandler: (eventData: MultiStepAdapterEventData) => void;
  readonly eventTypes: ReadonlySet<string>;
}

interface MultiStepConnectionMetrics {
  readonly storeConnectionSuccess: boolean;
  readonly formValuesAccessible: boolean;
  readonly updateFunctionsAvailable: boolean;
  readonly lastConnectionCheck: number;
}

function createDefaultFormValues(): FormValues {
  console.log('🔧 [MULTISTEP_ADAPTER] 기본 FormValues 생성');

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

function createMultiStepTypeGuards() {
  const isValidString = (candidateValue: unknown): candidateValue is string => {
    return typeof candidateValue === 'string';
  };

  const isValidNumber = (candidateValue: unknown): candidateValue is number => {
    return typeof candidateValue === 'number' && !Number.isNaN(candidateValue);
  };

  const isValidBoolean = (
    candidateValue: unknown
  ): candidateValue is boolean => {
    return typeof candidateValue === 'boolean';
  };

  const isValidArray = (
    candidateValue: unknown
  ): candidateValue is unknown[] => {
    return Array.isArray(candidateValue);
  };

  const isValidObject = (
    candidateValue: unknown
  ): candidateValue is Record<string, unknown> => {
    return (
      candidateValue !== null &&
      typeof candidateValue === 'object' &&
      !Array.isArray(candidateValue)
    );
  };

  const isValidFunction = (
    candidateValue: unknown
  ): candidateValue is Function => {
    return typeof candidateValue === 'function';
  };

  const isValidFormValues = (
    candidateFormValues: unknown
  ): candidateFormValues is FormValues => {
    console.log('🔍 [MULTISTEP_ADAPTER] FormValues 검증 (관대한 모드)');

    const isObjectType = isValidObject(candidateFormValues);
    if (!isObjectType) {
      console.warn('⚠️ [MULTISTEP_ADAPTER] FormValues가 객체가 아님');
      return false;
    }

    // 관대한 검증: 기본 구조만 확인
    return true;
  };

  const isValidStepNumber = (
    candidateValue: unknown
  ): candidateValue is StepNumber => {
    const isNumberType = isValidNumber(candidateValue);
    if (!isNumberType) {
      return false;
    }

    const isIntegerValue = Number.isInteger(candidateValue);
    const isInValidRange = candidateValue >= 1 && candidateValue <= 5;

    return isIntegerValue && isInValidRange;
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidArray,
    isValidObject,
    isValidFunction,
    isValidFormValues,
    isValidStepNumber,
  };
}

function createMultiStepSafeConverters() {
  const { isValidString, isValidNumber, isValidBoolean } =
    createMultiStepTypeGuards();

  const convertToSafeString = (
    sourceValue: unknown,
    fallbackValue: string = ''
  ): string => {
    const isStringValue = isValidString(sourceValue);
    if (isStringValue) {
      return sourceValue;
    }

    const isNullOrUndefined = sourceValue === null || sourceValue === undefined;
    if (isNullOrUndefined) {
      return fallbackValue;
    }

    try {
      return String(sourceValue);
    } catch (conversionError) {
      console.warn('⚠️ [MULTISTEP_ADAPTER] 문자열 변환 실패:', conversionError);
      return fallbackValue;
    }
  };

  const convertToSafeNumber = (
    sourceValue: unknown,
    fallbackValue: number = 0
  ): number => {
    const isNumberValue = isValidNumber(sourceValue);
    if (isNumberValue) {
      return sourceValue;
    }

    const isStringValue = isValidString(sourceValue);
    if (isStringValue) {
      const parsedValue = parseInt(sourceValue, 10);
      const isValidParsed = !Number.isNaN(parsedValue);
      return isValidParsed ? parsedValue : fallbackValue;
    }

    return fallbackValue;
  };

  const convertToSafeBoolean = (
    sourceValue: unknown,
    fallbackValue: boolean = false
  ): boolean => {
    const isBooleanValue = isValidBoolean(sourceValue);
    if (isBooleanValue) {
      return sourceValue;
    }

    const isStringValue = isValidString(sourceValue);
    if (isStringValue) {
      const lowerValue = sourceValue.toLowerCase();
      const isTrueString = lowerValue === 'true';
      const isFalseString = lowerValue === 'false';

      return isTrueString ? true : isFalseString ? false : fallbackValue;
    }

    const isNumberValue = isValidNumber(sourceValue);
    if (isNumberValue) {
      return sourceValue !== 0;
    }

    return fallbackValue;
  };

  return {
    convertToSafeString,
    convertToSafeNumber,
    convertToSafeBoolean,
  };
}

function createFormValuesNormalizer() {
  const { isValidObject, isValidArray } = createMultiStepTypeGuards();
  const { convertToSafeString, convertToSafeBoolean } =
    createMultiStepSafeConverters();

  const normalizeFormValues = (rawFormValuesSource: unknown): FormValues => {
    console.log('🔄 [MULTISTEP_ADAPTER] FormValues 정규화 시작');

    const baseFormValues = createDefaultFormValues();

    const isValidRawObject = isValidObject(rawFormValuesSource);
    if (!isValidRawObject) {
      console.log('✅ [MULTISTEP_ADAPTER] 원본이 유효하지 않음, 기본값 반환');
      return baseFormValues;
    }

    const sourceObject = rawFormValuesSource;

    try {
      // 문자열 필드들 정규화
      const stringFieldNames: Array<keyof FormValues> = [
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
      ];

      stringFieldNames.forEach((fieldKey) => {
        try {
          const fieldExists = fieldKey in sourceObject;
          if (fieldExists) {
            const fieldValue = Reflect.get(sourceObject, fieldKey);
            const normalizedFieldValue = convertToSafeString(fieldValue, '');
            Reflect.set(baseFormValues, fieldKey, normalizedFieldValue);
          }
        } catch (fieldNormalizationError) {
          console.debug(
            `🔍 [MULTISTEP_ADAPTER] ${String(fieldKey)} 필드 정규화 실패:`,
            fieldNormalizationError
          );
        }
      });

      // boolean 필드 정규화
      const isEditorCompletedExists = 'isEditorCompleted' in sourceObject;
      if (isEditorCompletedExists) {
        const isEditorCompletedSourceValue = Reflect.get(
          sourceObject,
          'isEditorCompleted'
        );
        baseFormValues.isEditorCompleted = convertToSafeBoolean(
          isEditorCompletedSourceValue,
          false
        );
      }

      // 배열 필드들 정규화
      const mediaExists = 'media' in sourceObject;
      if (mediaExists) {
        try {
          const mediaSourceValue = Reflect.get(sourceObject, 'media');
          const isValidMediaArray = isValidArray(mediaSourceValue);
          if (isValidMediaArray) {
            baseFormValues.media = mediaSourceValue.filter(
              (mediaItem) => typeof mediaItem === 'string'
            );
          }
        } catch (mediaFieldError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] media 정규화 실패:',
            mediaFieldError
          );
        }
      }

      const sliderImagesExists = 'sliderImages' in sourceObject;
      if (sliderImagesExists) {
        try {
          const sliderImagesSourceValue = Reflect.get(
            sourceObject,
            'sliderImages'
          );
          const isValidSliderArray = isValidArray(sliderImagesSourceValue);
          if (isValidSliderArray) {
            baseFormValues.sliderImages = sliderImagesSourceValue.filter(
              (sliderItem) => typeof sliderItem === 'string'
            );
          }
        } catch (sliderImagesError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] sliderImages 정규화 실패:',
            sliderImagesError
          );
        }
      }

      // mainImage 필드 정규화
      const mainImageExists = 'mainImage' in sourceObject;
      if (mainImageExists) {
        try {
          const mainImageSourceValue = Reflect.get(sourceObject, 'mainImage');
          const isStringOrNull =
            typeof mainImageSourceValue === 'string' ||
            mainImageSourceValue === null;
          if (isStringOrNull) {
            baseFormValues.mainImage = mainImageSourceValue;
          }
        } catch (mainImageFieldError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] mainImage 정규화 실패:',
            mainImageFieldError
          );
        }
      }
    } catch (overallNormalizationError) {
      console.warn(
        '⚠️ [MULTISTEP_ADAPTER] FormValues 정규화 중 오류:',
        overallNormalizationError
      );
    }

    console.log('✅ [MULTISTEP_ADAPTER] FormValues 정규화 완료');
    return baseFormValues;
  };

  return { normalizeFormValues };
}

function createMultiStepValidationModule() {
  const validateFormValues = (formValuesToValidate: FormValues): boolean => {
    console.log('🔍 [MULTISTEP_ADAPTER] 폼 값 검증 시작');

    const isValidObject =
      formValuesToValidate && typeof formValuesToValidate === 'object';
    if (!isValidObject) {
      console.error('❌ [MULTISTEP_ADAPTER] 폼 값이 유효하지 않은 객체');
      return false;
    }

    const {
      nickname = '',
      emailPrefix = '',
      emailDomain = '',
      title = '',
      description = '',
      content = '',
    } = formValuesToValidate;

    const requiredFieldsToCheck = [
      { fieldName: 'nickname', fieldValue: nickname },
      { fieldName: 'emailPrefix', fieldValue: emailPrefix },
      { fieldName: 'emailDomain', fieldValue: emailDomain },
      { fieldName: 'title', fieldValue: title },
      { fieldName: 'description', fieldValue: description },
      { fieldName: 'content', fieldValue: content },
    ];

    const missingRequiredFields = requiredFieldsToCheck.filter(
      ({ fieldName, fieldValue }) => {
        const isValidString =
          typeof fieldValue === 'string' && fieldValue.trim().length > 0;
        const isFieldMissing = !isValidString;
        if (isFieldMissing) {
          console.error(
            `❌ [MULTISTEP_ADAPTER] 필수 필드 '${fieldName}'가 유효하지 않음`
          );
        }
        return isFieldMissing;
      }
    );

    const isValidFormData = missingRequiredFields.length === 0;

    console.log('📊 [MULTISTEP_ADAPTER] 폼 검증 결과:', {
      isValidFormData,
      missingRequiredFieldsCount: missingRequiredFields.length,
    });

    return isValidFormData;
  };

  const calculateFormCompletionPercentage = (
    formValuesToCalculate: FormValues
  ): number => {
    console.log('📊 [MULTISTEP_ADAPTER] 폼 완성률 계산 시작');

    const isValidFormObject =
      formValuesToCalculate && typeof formValuesToCalculate === 'object';
    if (!isValidFormObject) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 유효하지 않은 폼 값으로 완성률 0% 반환'
      );
      return 0;
    }

    const {
      userImage = '',
      nickname = '',
      emailPrefix = '',
      emailDomain = '',
      bio = '',
      title = '',
      description = '',
      tags = '',
      content = '',
      media = [],
      mainImage = null,
      sliderImages = [],
      editorCompletedContent = '',
      isEditorCompleted = false,
    } = formValuesToCalculate;

    const requiredFieldsWithWeight = [
      { fieldName: 'nickname', fieldValue: nickname, weightPercentage: 15 },
      {
        fieldName: 'emailPrefix',
        fieldValue: emailPrefix,
        weightPercentage: 15,
      },
      {
        fieldName: 'emailDomain',
        fieldValue: emailDomain,
        weightPercentage: 15,
      },
      { fieldName: 'title', fieldValue: title, weightPercentage: 15 },
      {
        fieldName: 'description',
        fieldValue: description,
        weightPercentage: 15,
      },
      { fieldName: 'content', fieldValue: content, weightPercentage: 15 },
    ];

    const optionalFieldsWithWeight = [
      { fieldName: 'userImage', fieldValue: userImage, weightPercentage: 5 },
      { fieldName: 'bio', fieldValue: bio, weightPercentage: 5 },
      { fieldName: 'tags', fieldValue: tags, weightPercentage: 5 },
      {
        fieldName: 'editorCompletedContent',
        fieldValue: editorCompletedContent,
        weightPercentage: 5,
      },
    ];

    let completedWeightTotal = 0;
    let totalWeightSum = 0;

    requiredFieldsWithWeight.forEach(
      ({ fieldName, fieldValue, weightPercentage }) => {
        totalWeightSum += weightPercentage;
        const isFieldCompleted =
          typeof fieldValue === 'string' && fieldValue.trim().length > 0;
        if (isFieldCompleted) {
          completedWeightTotal += weightPercentage;
          console.log(
            `✅ [MULTISTEP_ADAPTER] 필수 필드 '${fieldName}' 완료 (${weightPercentage}%)`
          );
        }
      }
    );

    optionalFieldsWithWeight.forEach(
      ({ fieldName, fieldValue, weightPercentage }) => {
        totalWeightSum += weightPercentage;
        const isFieldCompleted =
          typeof fieldValue === 'string' && fieldValue.trim().length > 0;
        if (isFieldCompleted) {
          completedWeightTotal += weightPercentage;
          console.log(
            `✅ [MULTISTEP_ADAPTER] 선택 필드 '${fieldName}' 완료 (${weightPercentage}%)`
          );
        }
      }
    );

    // boolean 필드 처리
    totalWeightSum += 5;
    const isEditorCompletedValue = isEditorCompleted === true;
    if (isEditorCompletedValue) {
      completedWeightTotal += 5;
      console.log('✅ [MULTISTEP_ADAPTER] isEditorCompleted 필드 완료 (5%)');
    }

    // 배열 필드들 처리
    const arrayFieldsWithWeight = [
      { fieldName: 'media', fieldValue: media, weightPercentage: 2.5 },
      {
        fieldName: 'sliderImages',
        fieldValue: sliderImages,
        weightPercentage: 2.5,
      },
    ];

    arrayFieldsWithWeight.forEach(
      ({ fieldName, fieldValue, weightPercentage }) => {
        totalWeightSum += weightPercentage;
        const isArrayCompleted =
          Array.isArray(fieldValue) && fieldValue.length > 0;
        if (isArrayCompleted) {
          completedWeightTotal += weightPercentage;
          console.log(
            `✅ [MULTISTEP_ADAPTER] 배열 필드 '${fieldName}' 완료 (${weightPercentage}%)`
          );
        }
      }
    );

    // mainImage 처리
    totalWeightSum += 5;
    const isMainImageCompleted =
      mainImage && typeof mainImage === 'string' && mainImage.trim().length > 0;
    if (isMainImageCompleted) {
      completedWeightTotal += 5;
      console.log('✅ [MULTISTEP_ADAPTER] mainImage 필드 완료 (5%)');
    }

    const completionPercentage =
      totalWeightSum > 0
        ? Math.round((completedWeightTotal / totalWeightSum) * 100)
        : 0;

    console.log('📊 [MULTISTEP_ADAPTER] 폼 완성률 계산 완료:', {
      completedWeightTotal,
      totalWeightSum,
      completionPercentage: `${completionPercentage}%`,
    });

    return completionPercentage;
  };

  return {
    validateFormValues,
    calculateFormCompletionPercentage,
  };
}

function createMultiStepEventManager() {
  let eventListenersList: MultiStepEventListener[] = [];
  let lastKnownStateSnapshot: MultiStepFormSnapshotForBridge | null = null;

  const generateListenerId = (): string => {
    const currentTimestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `listener_${currentTimestamp}_${randomSuffix}`;
  };

  const addEventListenerForMultiStep = (
    eventHandlerFunction: (eventData: MultiStepAdapterEventData) => void,
    eventTypesToListen: string[] = ['STATE_CHANGE']
  ): string => {
    console.log('📡 [MULTISTEP_ADAPTER] 이벤트 리스너 추가');

    const newListenerId = generateListenerId();
    const eventTypesSet = new Set(eventTypesToListen);

    const newEventListener: MultiStepEventListener = {
      listenerId: newListenerId,
      eventHandler: eventHandlerFunction,
      eventTypes: eventTypesSet,
    };

    eventListenersList = [...eventListenersList, newEventListener];

    console.log('✅ [MULTISTEP_ADAPTER] 이벤트 리스너 추가 완료:', {
      listenerId: newListenerId,
      eventTypes: Array.from(eventTypesSet),
      totalListeners: eventListenersList.length,
    });

    return newListenerId;
  };

  const removeEventListenerForMultiStep = (
    listenerIdToRemove: string
  ): boolean => {
    console.log(
      '📡 [MULTISTEP_ADAPTER] 이벤트 리스너 제거:',
      listenerIdToRemove
    );

    const initialListenerCount = eventListenersList.length;
    eventListenersList = eventListenersList.filter(
      (listenerItem) => listenerItem.listenerId !== listenerIdToRemove
    );
    const wasListenerRemoved = eventListenersList.length < initialListenerCount;

    console.log('✅ [MULTISTEP_ADAPTER] 이벤트 리스너 제거 완료:', {
      listenerId: listenerIdToRemove,
      wasListenerRemoved,
      remainingListeners: eventListenersList.length,
    });

    return wasListenerRemoved;
  };

  const emitMultiStepEvent = (
    eventDataToEmit: MultiStepAdapterEventData
  ): void => {
    console.log(
      '📡 [MULTISTEP_ADAPTER] 이벤트 발생:',
      eventDataToEmit.eventType
    );

    const { eventType } = eventDataToEmit;
    const relevantListenersList = eventListenersList.filter((listenerItem) =>
      listenerItem.eventTypes.has(eventType)
    );

    console.log('📊 [MULTISTEP_ADAPTER] 이벤트 전파:', {
      eventType,
      relevantListenersCount: relevantListenersList.length,
      totalListenersCount: eventListenersList.length,
    });

    relevantListenersList.forEach(({ listenerId, eventHandler }) => {
      try {
        eventHandler(eventDataToEmit);
        console.log(`✅ [MULTISTEP_ADAPTER] 리스너 ${listenerId} 처리 완료`);
      } catch (listenerHandlingError) {
        console.error(
          `❌ [MULTISTEP_ADAPTER] 리스너 ${listenerId} 처리 실패:`,
          listenerHandlingError
        );
      }
    });
  };

  const checkStateChangeAndEmit = (
    currentStateSnapshot: MultiStepFormSnapshotForBridge
  ): void => {
    console.log('🔍 [MULTISTEP_ADAPTER] 상태 변화 검사');

    const hasStateChanged =
      lastKnownStateSnapshot === null ||
      lastKnownStateSnapshot.snapshotTimestamp !==
        currentStateSnapshot.snapshotTimestamp ||
      lastKnownStateSnapshot.formCurrentStep !==
        currentStateSnapshot.formCurrentStep;

    if (hasStateChanged) {
      console.log('📊 [MULTISTEP_ADAPTER] 상태 변화 감지됨');

      const stateChangeEventData: MultiStepAdapterEventData = {
        eventType: 'STATE_CHANGE',
        eventTimestamp: Date.now(),
        eventPayload: new Map<string, unknown>([
          ['currentStep', currentStateSnapshot.formCurrentStep],
          [
            'hasFormValues',
            currentStateSnapshot.formValues !== null &&
              currentStateSnapshot.formValues !== undefined,
          ],
          ['isCompleted', currentStateSnapshot.formIsEditorCompleted],
        ]),
        previousState: lastKnownStateSnapshot || undefined,
        currentState: currentStateSnapshot,
      };

      emitMultiStepEvent(stateChangeEventData);
      lastKnownStateSnapshot = currentStateSnapshot;
    }
  };

  return {
    addEventListenerForMultiStep,
    removeEventListenerForMultiStep,
    emitMultiStepEvent,
    checkStateChangeAndEmit,
  };
}

class MultiStepAdapter extends BaseAdapter<
  MultiStepFormSnapshotForBridge,
  MultiStepFormSnapshotForBridge
> {
  private readonly typeGuardHelpers = createMultiStepTypeGuards();
  private readonly safeConverterHelpers = createMultiStepSafeConverters();
  private readonly formValueNormalizer = createFormValuesNormalizer();
  private readonly validationModuleHelpers = createMultiStepValidationModule();
  private readonly eventManagerHelpers = createMultiStepEventManager();
  private connectionMetricsState: MultiStepConnectionMetrics;

  constructor() {
    console.log('🏗️ [MULTISTEP_ADAPTER] 멀티스텝 어댑터 초기화');

    super('MultiStepAdapter', '1.0.0', {
      timeoutMs: 3000,
      maxRetryAttempts: 2,
      retryDelayMs: 500,
      enableHealthCheck: true,
      healthCheckIntervalMs: 15000,
    });

    this.connectionMetricsState = {
      storeConnectionSuccess: false,
      formValuesAccessible: false,
      updateFunctionsAvailable: false,
      lastConnectionCheck: 0,
    };

    console.log('✅ [MULTISTEP_ADAPTER] 멀티스텝 어댑터 초기화 완료');
  }

  protected async performConnection(): Promise<boolean> {
    console.log('🔗 [MULTISTEP_ADAPTER] 멀티스텝 스토어 연결 시작');

    try {
      const multiStepStoreState = useMultiStepFormStore.getState();

      const isStoreAccessible =
        multiStepStoreState !== null && multiStepStoreState !== undefined;
      if (!isStoreAccessible) {
        console.error('❌ [MULTISTEP_ADAPTER] 멀티스텝 스토어 접근 불가');
        return false;
      }

      const isValidStoreObject =
        this.typeGuardHelpers.isValidObject(multiStepStoreState);
      if (!isValidStoreObject) {
        console.error('❌ [MULTISTEP_ADAPTER] 스토어가 유효한 객체가 아님');
        return false;
      }

      // formValues 접근성 확인
      const hasFormValuesProperty = 'formValues' in multiStepStoreState;
      const formValuesProperty = hasFormValuesProperty
        ? Reflect.get(multiStepStoreState, 'formValues')
        : null;
      const formValuesAccessible =
        formValuesProperty !== null && formValuesProperty !== undefined;

      // 업데이트 함수들 확인
      const updateFunctionNames = [
        'updateEditorContent',
        'setEditorCompleted',
        'updateFormValue',
        'setFormValues',
      ];

      const hasUpdateFunctions = updateFunctionNames.some((functionName) => {
        const functionExists = functionName in multiStepStoreState;
        const functionValue = functionExists
          ? Reflect.get(multiStepStoreState, functionName)
          : null;
        return this.typeGuardHelpers.isValidFunction(functionValue);
      });

      this.connectionMetricsState = {
        storeConnectionSuccess: true,
        formValuesAccessible,
        updateFunctionsAvailable: hasUpdateFunctions,
        lastConnectionCheck: Date.now(),
      };

      console.log('✅ [MULTISTEP_ADAPTER] 멀티스텝 스토어 연결 성공:', {
        formValuesAccessible,
        updateFunctionsAvailable: hasUpdateFunctions,
      });

      return true;
    } catch (connectionError) {
      console.error('❌ [MULTISTEP_ADAPTER] 연결 실패:', connectionError);

      this.connectionMetricsState = {
        storeConnectionSuccess: false,
        formValuesAccessible: false,
        updateFunctionsAvailable: false,
        lastConnectionCheck: Date.now(),
      };

      return false;
    }
  }

  protected async performDisconnection(): Promise<void> {
    console.log('🔌 [MULTISTEP_ADAPTER] 멀티스텝 연결 해제');

    this.connectionMetricsState = {
      storeConnectionSuccess: false,
      formValuesAccessible: false,
      updateFunctionsAvailable: false,
      lastConnectionCheck: Date.now(),
    };

    console.log('✅ [MULTISTEP_ADAPTER] 연결 해제 완료');
  }

  protected async performHealthCheck(): Promise<boolean> {
    console.log('💓 [MULTISTEP_ADAPTER] 멀티스텝 헬스체크');

    try {
      const multiStepStoreState = useMultiStepFormStore.getState();

      const isStoreHealthy =
        multiStepStoreState !== null &&
        this.typeGuardHelpers.isValidObject(multiStepStoreState) &&
        'formValues' in multiStepStoreState;

      this.connectionMetricsState = {
        ...this.connectionMetricsState,
        lastConnectionCheck: Date.now(),
      };

      console.log('✅ [MULTISTEP_ADAPTER] 헬스체크 완료:', { isStoreHealthy });
      return isStoreHealthy;
    } catch (healthCheckError) {
      console.error('❌ [MULTISTEP_ADAPTER] 헬스체크 실패:', healthCheckError);
      return false;
    }
  }

  protected async extractDataFromSystem(): Promise<MultiStepFormSnapshotForBridge> {
    console.log('📤 [MULTISTEP_ADAPTER] 멀티스텝 데이터 추출 시작');

    const multiStepStoreState = useMultiStepFormStore.getState();

    const isStoreStateValid =
      multiStepStoreState &&
      this.typeGuardHelpers.isValidObject(multiStepStoreState);
    if (!isStoreStateValid) {
      throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
    }

    // 안전한 속성 추출
    const rawFormValuesSource = Reflect.get(multiStepStoreState, 'formValues');
    const currentStepSource = this.safeConverterHelpers.convertToSafeNumber(
      Reflect.get(multiStepStoreState, 'currentStep'),
      1
    );
    const progressWidthSource = this.safeConverterHelpers.convertToSafeNumber(
      Reflect.get(multiStepStoreState, 'progressWidth'),
      0
    );
    const showPreviewSource = this.safeConverterHelpers.convertToSafeBoolean(
      Reflect.get(multiStepStoreState, 'showPreview'),
      false
    );
    const editorCompletedContentSource =
      this.safeConverterHelpers.convertToSafeString(
        Reflect.get(multiStepStoreState, 'editorCompletedContent'),
        ''
      );
    const isEditorCompletedSource =
      this.safeConverterHelpers.convertToSafeBoolean(
        Reflect.get(multiStepStoreState, 'isEditorCompleted'),
        false
      );

    // FormValues 정규화
    const normalizedFormValues =
      this.formValueNormalizer.normalizeFormValues(rawFormValuesSource);

    // 메타데이터 생성
    const currentTimestamp = Date.now();
    const formMetadata = new Map<string, unknown>([
      ['extractionTimestamp', currentTimestamp],
      ['currentStep', currentStepSource],
      ['totalSteps', 5],
      [
        'hasFormValues',
        normalizedFormValues !== null && normalizedFormValues !== undefined,
      ],
      ['editorContentLength', editorCompletedContentSource.length],
      ['extractorVersion', '1.0.0'],
      ['isCompleteExtraction', true],
    ]);

    const snapshotResult: MultiStepFormSnapshotForBridge = {
      formValues: normalizedFormValues,
      formCurrentStep: currentStepSource,
      formProgressWidth: progressWidthSource,
      formShowPreview: showPreviewSource,
      formEditorCompletedContent: editorCompletedContentSource,
      formIsEditorCompleted: isEditorCompletedSource,
      snapshotTimestamp: currentTimestamp,
      formMetadata,
      stepValidationResults: new Map(),
      navigationHistory: [currentStepSource],
    };

    // 상태 변화 이벤트 발생
    this.eventManagerHelpers.checkStateChangeAndEmit(snapshotResult);

    console.log('✅ [MULTISTEP_ADAPTER] 데이터 추출 완료:', {
      currentStep: snapshotResult.formCurrentStep,
      hasFormValues: Object.keys(normalizedFormValues).length > 0,
      editorContentLength: editorCompletedContentSource.length,
      isEditorCompleted: snapshotResult.formIsEditorCompleted,
    });

    return snapshotResult;
  }

  protected async updateDataToSystem(
    snapshotToUpdate: MultiStepFormSnapshotForBridge
  ): Promise<boolean> {
    console.log('📥 [MULTISTEP_ADAPTER] 멀티스텝 스냅샷 업데이트');

    try {
      const multiStepStoreState = useMultiStepFormStore.getState();

      const isStoreStateValid =
        multiStepStoreState &&
        this.typeGuardHelpers.isValidObject(multiStepStoreState);
      if (!isStoreStateValid) {
        throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
      }

      const setFormValuesFunctionReference = Reflect.get(
        multiStepStoreState,
        'setFormValues'
      );
      const canSetFormValues = this.typeGuardHelpers.isValidFunction(
        setFormValuesFunctionReference
      );

      if (canSetFormValues && setFormValuesFunctionReference) {
        setFormValuesFunctionReference(snapshotToUpdate.formValues);
        console.log('✅ [MULTISTEP_ADAPTER] 스냅샷 업데이트 완료');
        return true;
      }

      console.error('❌ [MULTISTEP_ADAPTER] setFormValues 함수를 찾을 수 없음');
      return false;
    } catch (updateError) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 스냅샷 업데이트 실패:',
        updateError
      );
      return false;
    }
  }

  public async updateFromTransformationResult(
    transformationResultData: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> {
    console.log(
      '📥 [MULTISTEP_ADAPTER] 변환 결과로 멀티스텝 데이터 업데이트 시작'
    );

    const {
      transformedContent: contentToUpdate,
      transformedIsCompleted: completionStatusToUpdate,
    } = transformationResultData;

    const multiStepStoreState = useMultiStepFormStore.getState();

    const isStoreStateValid =
      multiStepStoreState &&
      this.typeGuardHelpers.isValidObject(multiStepStoreState);
    if (!isStoreStateValid) {
      throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
    }

    let updateSuccess = false;
    const appliedUpdateMethods: string[] = [];

    try {
      // 스토어 레벨 업데이트 함수들 확인 및 실행
      const updateEditorContentFunctionReference = Reflect.get(
        multiStepStoreState,
        'updateEditorContent'
      );
      const setEditorCompletedFunctionReference = Reflect.get(
        multiStepStoreState,
        'setEditorCompleted'
      );
      const updateFormValueFunctionReference = Reflect.get(
        multiStepStoreState,
        'updateFormValue'
      );

      const canUpdateStoreContent = this.typeGuardHelpers.isValidFunction(
        updateEditorContentFunctionReference
      );
      if (canUpdateStoreContent && updateEditorContentFunctionReference) {
        console.log('🔄 [MULTISTEP_ADAPTER] 스토어 콘텐츠 업데이트 실행');
        updateEditorContentFunctionReference(contentToUpdate);
        appliedUpdateMethods.push('STORE_CONTENT');
        updateSuccess = true;
      }

      const canSetStoreCompleted = this.typeGuardHelpers.isValidFunction(
        setEditorCompletedFunctionReference
      );
      if (canSetStoreCompleted && setEditorCompletedFunctionReference) {
        console.log('🔄 [MULTISTEP_ADAPTER] 스토어 완료 상태 업데이트 실행');
        setEditorCompletedFunctionReference(completionStatusToUpdate);
        appliedUpdateMethods.push('STORE_COMPLETED');
        updateSuccess = true;
      }

      const canUpdateFormValue = this.typeGuardHelpers.isValidFunction(
        updateFormValueFunctionReference
      );
      if (canUpdateFormValue && updateFormValueFunctionReference) {
        console.log('🔄 [MULTISTEP_ADAPTER] FormValues 업데이트 실행');
        updateFormValueFunctionReference(
          'editorCompletedContent',
          contentToUpdate
        );
        updateFormValueFunctionReference(
          'isEditorCompleted',
          completionStatusToUpdate
        );
        appliedUpdateMethods.push('FORM_VALUES');
        updateSuccess = true;
      }

      const hasAnyUpdateMethod = updateSuccess;
      if (!hasAnyUpdateMethod) {
        console.error('❌ [MULTISTEP_ADAPTER] 업데이트 함수들을 찾을 수 없음');
        return false;
      }

      console.log('✅ [MULTISTEP_ADAPTER] 데이터 업데이트 성공:', {
        contentLength: contentToUpdate.length,
        isCompleted: completionStatusToUpdate,
        appliedUpdateMethods: appliedUpdateMethods.join(', '),
      });

      // 업데이트 후 이벤트 발생
      setTimeout(async () => {
        try {
          const updatedSnapshot = await this.extractDataFromSystem();
          this.eventManagerHelpers.emitMultiStepEvent({
            eventType: 'FORM_UPDATE',
            eventTimestamp: Date.now(),
            eventPayload: new Map<string, unknown>([
              ['appliedUpdateMethods', appliedUpdateMethods],
              ['contentLength', contentToUpdate.length],
              ['isCompleted', completionStatusToUpdate],
            ]),
            currentState: updatedSnapshot,
          });
        } catch (eventEmissionError) {
          console.warn(
            '⚠️ [MULTISTEP_ADAPTER] 업데이트 이벤트 발생 실패:',
            eventEmissionError
          );
        }
      }, 100);

      return true;
    } catch (updateError) {
      console.error('❌ [MULTISTEP_ADAPTER] 업데이트 실패:', updateError);
      return false;
    }
  }

  protected validateExtractedData(
    snapshotToValidate: MultiStepFormSnapshotForBridge
  ): ValidationResult {
    console.log('🔍 [MULTISTEP_ADAPTER] 추출된 데이터 검증');

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const errorDetails = new Map<string, string>();

    // 기본 구조 검증
    const hasFormValues =
      snapshotToValidate.formValues &&
      typeof snapshotToValidate.formValues === 'object';
    const hasCurrentStep = this.typeGuardHelpers.isValidStepNumber(
      snapshotToValidate.formCurrentStep
    );
    const hasTimestamp = this.typeGuardHelpers.isValidNumber(
      snapshotToValidate.snapshotTimestamp
    );

    if (!hasFormValues) {
      const formValuesError = 'formValues가 유효하지 않음';
      validationErrors.push(formValuesError);
      errorDetails.set('formValues', formValuesError);
    }

    if (!hasCurrentStep) {
      const currentStepError = '현재 스텝이 유효하지 않음';
      validationErrors.push(currentStepError);
      errorDetails.set('currentStep', currentStepError);
    }

    if (!hasTimestamp) {
      const timestampError = '타임스탬프가 유효하지 않음';
      validationErrors.push(timestampError);
      errorDetails.set('timestamp', timestampError);
    }

    // FormValues 상세 검증
    const isFormValidationSuccessful = hasFormValues
      ? this.validationModuleHelpers.validateFormValues(
          snapshotToValidate.formValues
        )
      : false;
    if (hasFormValues && !isFormValidationSuccessful) {
      validationWarnings.push('일부 필수 폼 필드가 누락됨');
    }

    // 완성도 검증
    const completionPercentage = hasFormValues
      ? this.validationModuleHelpers.calculateFormCompletionPercentage(
          snapshotToValidate.formValues
        )
      : 0;

    const hasMinimumContent = completionPercentage >= 70;
    if (!hasMinimumContent) {
      validationWarnings.push(`폼 완성도가 낮음 (${completionPercentage}%)`);
    }

    const hasRequiredStructure =
      hasFormValues && hasCurrentStep && hasTimestamp;
    const isValidForTransfer =
      hasRequiredStructure && validationErrors.length === 0;

    const validationResult: ValidationResult = {
      isValidForTransfer,
      validationErrors,
      validationWarnings,
      hasMinimumContent,
      hasRequiredStructure,
      errorDetails,
      validationMetrics: new Map([
        ['errorCount', validationErrors.length],
        ['warningCount', validationWarnings.length],
        ['completionPercentage', completionPercentage],
      ]),
      validationFlags: new Set([
        isValidForTransfer ? 'VALID' : 'INVALID',
        hasMinimumContent ? 'HAS_CONTENT' : 'NO_CONTENT',
        hasRequiredStructure ? 'STRUCTURED' : 'UNSTRUCTURED',
      ]),
    };

    console.log('📊 [MULTISTEP_ADAPTER] 검증 완료:', {
      isValidForTransfer,
      errorCount: validationErrors.length,
      warningCount: validationWarnings.length,
      completionPercentage: `${completionPercentage}%`,
    });

    return validationResult;
  }

  protected createDataSnapshot(
    snapshotSource: MultiStepFormSnapshotForBridge
  ): MultiStepFormSnapshotForBridge {
    console.log('📸 [MULTISTEP_ADAPTER] 데이터 스냅샷 생성');

    // 스냅샷은 이미 완전한 형태이므로 그대로 반환
    return {
      ...snapshotSource,
      snapshotTimestamp: Date.now(), // 스냅샷 생성 시간 갱신
    };
  }

  // 🔧 BaseAdapter의 updateData를 오버라이드하여 변환 결과 업데이트로 연결
  public async updateData(
    snapshotToUpdate: MultiStepFormSnapshotForBridge
  ): Promise<boolean> {
    console.log('📥 [MULTISTEP_ADAPTER] BaseAdapter updateData 호출');
    return await this.updateDataToSystem(snapshotToUpdate);
  }

  // 🔧 공개 API 메서드들

  public async getFormProgressInfo(): Promise<{
    currentStep: number;
    progressWidth: number;
    totalSteps: number;
    completionPercentage: number;
  }> {
    console.log('🔍 [MULTISTEP_ADAPTER] 폼 진행 정보 조회');

    try {
      const currentSnapshot = await this.extractData();

      const defaultProgressResult = {
        currentStep: 1,
        progressWidth: 0,
        totalSteps: 5,
        completionPercentage: 0,
      };

      if (!currentSnapshot) {
        return defaultProgressResult;
      }

      const { formCurrentStep, formProgressWidth, formValues, formMetadata } =
        currentSnapshot;

      const totalSteps = this.safeConverterHelpers.convertToSafeNumber(
        formMetadata.get('totalSteps'),
        5
      );
      const completionPercentage =
        this.validationModuleHelpers.calculateFormCompletionPercentage(
          formValues
        );

      return {
        currentStep: formCurrentStep,
        progressWidth: formProgressWidth,
        totalSteps,
        completionPercentage,
      };
    } catch (progressInfoError) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 진행 정보 조회 실패:',
        progressInfoError
      );
      return {
        currentStep: 1,
        progressWidth: 0,
        totalSteps: 5,
        completionPercentage: 0,
      };
    }
  }

  public async getEditorContentFromMultiStep(): Promise<{
    content: string;
    isCompleted: boolean;
  }> {
    console.log('🔍 [MULTISTEP_ADAPTER] 에디터 콘텐츠 추출');

    try {
      const currentSnapshot = await this.extractData();

      const defaultContentResult = { content: '', isCompleted: false };

      if (!currentSnapshot) {
        return defaultContentResult;
      }

      const { formEditorCompletedContent, formIsEditorCompleted } =
        currentSnapshot;

      return {
        content: formEditorCompletedContent,
        isCompleted: formIsEditorCompleted,
      };
    } catch (contentExtractionError) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 에디터 콘텐츠 추출 실패:',
        contentExtractionError
      );
      return { content: '', isCompleted: false };
    }
  }

  public addStateChangeListener(
    eventHandlerFunction: (eventData: MultiStepAdapterEventData) => void,
    eventTypesToListen: string[] = ['STATE_CHANGE']
  ): string {
    console.log('📡 [MULTISTEP_ADAPTER] 상태 변화 리스너 추가');
    return this.eventManagerHelpers.addEventListenerForMultiStep(
      eventHandlerFunction,
      eventTypesToListen
    );
  }

  public removeStateChangeListener(listenerIdToRemove: string): boolean {
    console.log('📡 [MULTISTEP_ADAPTER] 상태 변화 리스너 제거');
    return this.eventManagerHelpers.removeEventListenerForMultiStep(
      listenerIdToRemove
    );
  }

  public getConnectionMetrics(): MultiStepConnectionMetrics {
    console.log('📊 [MULTISTEP_ADAPTER] 연결 메트릭 조회');
    return { ...this.connectionMetricsState };
  }
}

export default MultiStepAdapter;

export type {
  MultiStepAdapterEventData,
  MultiStepEventListener,
  MultiStepConnectionMetrics,
};
