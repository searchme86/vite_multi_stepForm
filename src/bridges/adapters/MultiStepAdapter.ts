// adapters/MultiStepAdapter.ts

import BaseAdapter from './BaseAdapter';
import type {
  ValidationResult,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
} from '../editorMultiStepBridge/bridgeDataTypes';
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

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidFunction = (value: unknown): value is Function => {
    return typeof value === 'function';
  };

  const isValidFormValues = (candidate: unknown): candidate is FormValues => {
    console.log('🔍 [MULTISTEP_ADAPTER] FormValues 검증 (관대한 모드)');

    const isObjectType = isValidObject(candidate);
    if (!isObjectType) {
      console.warn('⚠️ [MULTISTEP_ADAPTER] FormValues가 객체가 아님');
      return false;
    }

    // 관대한 검증: 기본 구조만 확인
    return true;
  };

  const isValidStepNumber = (value: unknown): value is StepNumber => {
    const isNumberType = isValidNumber(value);
    if (!isNumberType) {
      return false;
    }

    const isIntegerValue = Number.isInteger(value);
    const isInValidRange = value >= 1 && value <= 5;

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
    value: unknown,
    fallback: string = ''
  ): string => {
    const isStringValue = isValidString(value);
    if (isStringValue) {
      return value;
    }

    const isNullOrUndefined = value === null || value === undefined;
    if (isNullOrUndefined) {
      return fallback;
    }

    try {
      return String(value);
    } catch (conversionError) {
      console.warn('⚠️ [MULTISTEP_ADAPTER] 문자열 변환 실패:', conversionError);
      return fallback;
    }
  };

  const convertToSafeNumber = (
    value: unknown,
    fallback: number = 0
  ): number => {
    const isNumberValue = isValidNumber(value);
    if (isNumberValue) {
      return value;
    }

    const isStringValue = isValidString(value);
    if (isStringValue) {
      const parsedValue = parseInt(value, 10);
      const isValidParsed = !Number.isNaN(parsedValue);
      return isValidParsed ? parsedValue : fallback;
    }

    return fallback;
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallback: boolean = false
  ): boolean => {
    const isBooleanValue = isValidBoolean(value);
    if (isBooleanValue) {
      return value;
    }

    const isStringValue = isValidString(value);
    if (isStringValue) {
      const lowerValue = value.toLowerCase();
      const isTrueString = lowerValue === 'true';
      const isFalseString = lowerValue === 'false';

      return isTrueString ? true : isFalseString ? false : fallback;
    }

    const isNumberValue = isValidNumber(value);
    if (isNumberValue) {
      return value !== 0;
    }

    return fallback;
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

  const normalizeFormValues = (rawFormValues: unknown): FormValues => {
    console.log('🔄 [MULTISTEP_ADAPTER] FormValues 정규화 시작');

    const baseFormValues = createDefaultFormValues();

    const isValidRawObject = isValidObject(rawFormValues);
    if (!isValidRawObject) {
      console.log('✅ [MULTISTEP_ADAPTER] 원본이 유효하지 않음, 기본값 반환');
      return baseFormValues;
    }

    const sourceObject = rawFormValues;

    try {
      // 문자열 필드들 정규화
      const stringFields: Array<keyof FormValues> = [
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

      stringFields.forEach((fieldKey) => {
        try {
          const fieldExists = fieldKey in sourceObject;
          if (fieldExists) {
            const fieldValue = Reflect.get(sourceObject, fieldKey);
            const normalizedValue = convertToSafeString(fieldValue, '');
            Reflect.set(baseFormValues, fieldKey, normalizedValue);
          }
        } catch (fieldError) {
          console.debug(
            `🔍 [MULTISTEP_ADAPTER] ${String(fieldKey)} 필드 정규화 실패:`,
            fieldError
          );
        }
      });

      // boolean 필드 정규화
      const isEditorCompletedExists = 'isEditorCompleted' in sourceObject;
      if (isEditorCompletedExists) {
        const isEditorCompletedValue = Reflect.get(
          sourceObject,
          'isEditorCompleted'
        );
        baseFormValues.isEditorCompleted = convertToSafeBoolean(
          isEditorCompletedValue,
          false
        );
      }

      // 배열 필드들 정규화
      const mediaExists = 'media' in sourceObject;
      if (mediaExists) {
        try {
          const mediaValue = Reflect.get(sourceObject, 'media');
          const isValidMediaArray = isValidArray(mediaValue);
          if (isValidMediaArray) {
            baseFormValues.media = mediaValue.filter(
              (item) => typeof item === 'string'
            );
          }
        } catch (mediaError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] media 정규화 실패:',
            mediaError
          );
        }
      }

      const sliderImagesExists = 'sliderImages' in sourceObject;
      if (sliderImagesExists) {
        try {
          const sliderImagesValue = Reflect.get(sourceObject, 'sliderImages');
          const isValidSliderArray = isValidArray(sliderImagesValue);
          if (isValidSliderArray) {
            baseFormValues.sliderImages = sliderImagesValue.filter(
              (item) => typeof item === 'string'
            );
          }
        } catch (sliderError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] sliderImages 정규화 실패:',
            sliderError
          );
        }
      }

      // mainImage 필드 정규화
      const mainImageExists = 'mainImage' in sourceObject;
      if (mainImageExists) {
        try {
          const mainImageValue = Reflect.get(sourceObject, 'mainImage');
          const isStringOrNull =
            typeof mainImageValue === 'string' || mainImageValue === null;
          if (isStringOrNull) {
            baseFormValues.mainImage = mainImageValue;
          }
        } catch (mainImageError) {
          console.debug(
            '🔍 [MULTISTEP_ADAPTER] mainImage 정규화 실패:',
            mainImageError
          );
        }
      }
    } catch (overallError) {
      console.warn(
        '⚠️ [MULTISTEP_ADAPTER] FormValues 정규화 중 오류:',
        overallError
      );
    }

    console.log('✅ [MULTISTEP_ADAPTER] FormValues 정규화 완료');
    return baseFormValues;
  };

  return { normalizeFormValues };
}

function createMultiStepValidationModule() {
  const validateFormValues = (formValues: FormValues): boolean => {
    console.log('🔍 [MULTISTEP_ADAPTER] 폼 값 검증 시작');

    const isValidObject = formValues && typeof formValues === 'object';
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
    } = formValues;

    const requiredFields = [
      { field: 'nickname', value: nickname },
      { field: 'emailPrefix', value: emailPrefix },
      { field: 'emailDomain', value: emailDomain },
      { field: 'title', value: title },
      { field: 'description', value: description },
      { field: 'content', value: content },
    ];

    const missingRequiredFields = requiredFields.filter(({ field, value }) => {
      const isValidString =
        typeof value === 'string' && value.trim().length > 0;
      const isFieldMissing = !isValidString;
      if (isFieldMissing) {
        console.error(
          `❌ [MULTISTEP_ADAPTER] 필수 필드 '${field}'가 유효하지 않음`
        );
      }
      return isFieldMissing;
    });

    const isValidForm = missingRequiredFields.length === 0;

    console.log('📊 [MULTISTEP_ADAPTER] 폼 검증 결과:', {
      isValidForm,
      missingRequiredFields: missingRequiredFields.length,
    });

    return isValidForm;
  };

  const calculateFormCompletionPercentage = (
    formValues: FormValues
  ): number => {
    console.log('📊 [MULTISTEP_ADAPTER] 폼 완성률 계산 시작');

    const isValidFormObject = formValues && typeof formValues === 'object';
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
    } = formValues;

    const requiredFields = [
      { field: 'nickname', value: nickname, weight: 15 },
      { field: 'emailPrefix', value: emailPrefix, weight: 15 },
      { field: 'emailDomain', value: emailDomain, weight: 15 },
      { field: 'title', value: title, weight: 15 },
      { field: 'description', value: description, weight: 15 },
      { field: 'content', value: content, weight: 15 },
    ];

    const optionalFields = [
      { field: 'userImage', value: userImage, weight: 5 },
      { field: 'bio', value: bio, weight: 5 },
      { field: 'tags', value: tags, weight: 5 },
      {
        field: 'editorCompletedContent',
        value: editorCompletedContent,
        weight: 5,
      },
    ];

    let completedWeight = 0;
    let totalWeight = 0;

    requiredFields.forEach(({ field, value, weight }) => {
      totalWeight += weight;
      const isFieldCompleted =
        typeof value === 'string' && value.trim().length > 0;
      if (isFieldCompleted) {
        completedWeight += weight;
        console.log(
          `✅ [MULTISTEP_ADAPTER] 필수 필드 '${field}' 완료 (${weight}%)`
        );
      }
    });

    optionalFields.forEach(({ field, value, weight }) => {
      totalWeight += weight;
      const isFieldCompleted =
        typeof value === 'string' && value.trim().length > 0;
      if (isFieldCompleted) {
        completedWeight += weight;
        console.log(
          `✅ [MULTISTEP_ADAPTER] 선택 필드 '${field}' 완료 (${weight}%)`
        );
      }
    });

    // boolean 필드 처리
    totalWeight += 5;
    const isEditorCompletedValue = isEditorCompleted === true;
    if (isEditorCompletedValue) {
      completedWeight += 5;
      console.log('✅ [MULTISTEP_ADAPTER] isEditorCompleted 필드 완료 (5%)');
    }

    // 배열 필드들 처리
    const arrayFields = [
      { field: 'media', value: media, weight: 2.5 },
      { field: 'sliderImages', value: sliderImages, weight: 2.5 },
    ];

    arrayFields.forEach(({ field, value, weight }) => {
      totalWeight += weight;
      const isArrayCompleted = Array.isArray(value) && value.length > 0;
      if (isArrayCompleted) {
        completedWeight += weight;
        console.log(
          `✅ [MULTISTEP_ADAPTER] 배열 필드 '${field}' 완료 (${weight}%)`
        );
      }
    });

    // mainImage 처리
    totalWeight += 5;
    const isMainImageCompleted =
      mainImage && typeof mainImage === 'string' && mainImage.trim().length > 0;
    if (isMainImageCompleted) {
      completedWeight += 5;
      console.log('✅ [MULTISTEP_ADAPTER] mainImage 필드 완료 (5%)');
    }

    const completionPercentage =
      totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    console.log('📊 [MULTISTEP_ADAPTER] 폼 완성률 계산 완료:', {
      completedWeight,
      totalWeight,
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
  let eventListeners: MultiStepEventListener[] = [];
  let lastKnownState: MultiStepFormSnapshotForBridge | null = null;

  const generateListenerId = (): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `listener_${timestamp}_${randomSuffix}`;
  };

  const addEventListenerForMultiStep = (
    eventHandler: (eventData: MultiStepAdapterEventData) => void,
    eventTypes: string[] = ['STATE_CHANGE']
  ): string => {
    console.log('📡 [MULTISTEP_ADAPTER] 이벤트 리스너 추가');

    const listenerId = generateListenerId();
    const eventTypesSet = new Set(eventTypes);

    const newListener: MultiStepEventListener = {
      listenerId,
      eventHandler,
      eventTypes: eventTypesSet,
    };

    eventListeners = [...eventListeners, newListener];

    console.log('✅ [MULTISTEP_ADAPTER] 이벤트 리스너 추가 완료:', {
      listenerId,
      eventTypes: Array.from(eventTypesSet),
      totalListeners: eventListeners.length,
    });

    return listenerId;
  };

  const removeEventListenerForMultiStep = (listenerId: string): boolean => {
    console.log('📡 [MULTISTEP_ADAPTER] 이벤트 리스너 제거:', listenerId);

    const initialLength = eventListeners.length;
    eventListeners = eventListeners.filter(
      (listener) => listener.listenerId !== listenerId
    );
    const wasRemoved = eventListeners.length < initialLength;

    console.log('✅ [MULTISTEP_ADAPTER] 이벤트 리스너 제거 완료:', {
      listenerId,
      wasRemoved,
      remainingListeners: eventListeners.length,
    });

    return wasRemoved;
  };

  const emitMultiStepEvent = (eventData: MultiStepAdapterEventData): void => {
    console.log('📡 [MULTISTEP_ADAPTER] 이벤트 발생:', eventData.eventType);

    const { eventType } = eventData;
    const relevantListeners = eventListeners.filter((listener) =>
      listener.eventTypes.has(eventType)
    );

    console.log('📊 [MULTISTEP_ADAPTER] 이벤트 전파:', {
      eventType,
      relevantListeners: relevantListeners.length,
      totalListeners: eventListeners.length,
    });

    relevantListeners.forEach(({ listenerId, eventHandler }) => {
      try {
        eventHandler(eventData);
        console.log(`✅ [MULTISTEP_ADAPTER] 리스너 ${listenerId} 처리 완료`);
      } catch (listenerError) {
        console.error(
          `❌ [MULTISTEP_ADAPTER] 리스너 ${listenerId} 처리 실패:`,
          listenerError
        );
      }
    });
  };

  const checkStateChangeAndEmit = (
    currentState: MultiStepFormSnapshotForBridge
  ): void => {
    console.log('🔍 [MULTISTEP_ADAPTER] 상태 변화 검사');

    const hasStateChanged =
      lastKnownState === null ||
      lastKnownState.snapshotTimestamp !== currentState.snapshotTimestamp ||
      lastKnownState.formCurrentStep !== currentState.formCurrentStep;

    if (hasStateChanged) {
      console.log('📊 [MULTISTEP_ADAPTER] 상태 변화 감지됨');

      const eventData: MultiStepAdapterEventData = {
        eventType: 'STATE_CHANGE',
        eventTimestamp: Date.now(),
        eventPayload: new Map<string, unknown>([
          ['currentStep', currentState.formCurrentStep],
          [
            'hasFormValues',
            currentState.formValues !== null &&
              currentState.formValues !== undefined,
          ],
          ['isCompleted', currentState.formIsEditorCompleted],
        ]),
        previousState: lastKnownState || undefined,
        currentState,
      };

      emitMultiStepEvent(eventData);
      lastKnownState = currentState;
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
  private readonly typeGuards = createMultiStepTypeGuards();
  private readonly safeConverters = createMultiStepSafeConverters();
  private readonly formNormalizer = createFormValuesNormalizer();
  private readonly validationModule = createMultiStepValidationModule();
  private readonly eventManager = createMultiStepEventManager();
  private connectionMetrics: MultiStepConnectionMetrics;

  constructor() {
    console.log('🏗️ [MULTISTEP_ADAPTER] 멀티스텝 어댑터 초기화');

    super('MultiStepAdapter', '1.0.0', {
      timeoutMs: 3000,
      maxRetryAttempts: 2,
      retryDelayMs: 500,
      enableHealthCheck: true,
      healthCheckIntervalMs: 15000,
    });

    this.connectionMetrics = {
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
      const storeState = useMultiStepFormStore.getState();

      const isStoreAccessible = storeState !== null && storeState !== undefined;
      if (!isStoreAccessible) {
        console.error('❌ [MULTISTEP_ADAPTER] 멀티스텝 스토어 접근 불가');
        return false;
      }

      const isValidStoreObject = this.typeGuards.isValidObject(storeState);
      if (!isValidStoreObject) {
        console.error('❌ [MULTISTEP_ADAPTER] 스토어가 유효한 객체가 아님');
        return false;
      }

      // formValues 접근성 확인
      const hasFormValues = 'formValues' in storeState;
      const formValuesValue = hasFormValues
        ? Reflect.get(storeState, 'formValues')
        : null;
      const formValuesAccessible =
        formValuesValue !== null && formValuesValue !== undefined;

      // 업데이트 함수들 확인
      const hasUpdateFunctions = [
        'updateEditorContent',
        'setEditorCompleted',
        'updateFormValue',
        'setFormValues',
      ].some((funcName) => {
        const funcExists = funcName in storeState;
        const funcValue = funcExists ? Reflect.get(storeState, funcName) : null;
        return this.typeGuards.isValidFunction(funcValue);
      });

      this.connectionMetrics = {
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

      this.connectionMetrics = {
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

    this.connectionMetrics = {
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
      const storeState = useMultiStepFormStore.getState();

      const isStoreHealthy =
        storeState !== null &&
        this.typeGuards.isValidObject(storeState) &&
        'formValues' in storeState;

      this.connectionMetrics = {
        ...this.connectionMetrics,
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

    const storeState = useMultiStepFormStore.getState();

    const isStoreStateValid =
      storeState && this.typeGuards.isValidObject(storeState);
    if (!isStoreStateValid) {
      throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
    }

    // 안전한 속성 추출
    const rawFormValues = Reflect.get(storeState, 'formValues');
    const currentStep = this.safeConverters.convertToSafeNumber(
      Reflect.get(storeState, 'currentStep'),
      1
    );
    const progressWidth = this.safeConverters.convertToSafeNumber(
      Reflect.get(storeState, 'progressWidth'),
      0
    );
    const showPreview = this.safeConverters.convertToSafeBoolean(
      Reflect.get(storeState, 'showPreview'),
      false
    );
    const editorCompletedContent = this.safeConverters.convertToSafeString(
      Reflect.get(storeState, 'editorCompletedContent'),
      ''
    );
    const isEditorCompleted = this.safeConverters.convertToSafeBoolean(
      Reflect.get(storeState, 'isEditorCompleted'),
      false
    );

    // FormValues 정규화
    const normalizedFormValues =
      this.formNormalizer.normalizeFormValues(rawFormValues);

    // 메타데이터 생성
    const formMetadata = new Map<string, unknown>([
      ['extractionTimestamp', Date.now()],
      ['currentStep', currentStep],
      ['totalSteps', 5],
      [
        'hasFormValues',
        normalizedFormValues !== null && normalizedFormValues !== undefined,
      ],
      ['editorContentLength', editorCompletedContent.length],
      ['extractorVersion', '1.0.0'],
      ['isCompleteExtraction', true],
    ]);

    const snapshot: MultiStepFormSnapshotForBridge = {
      formValues: normalizedFormValues,
      formCurrentStep: currentStep,
      formProgressWidth: progressWidth,
      formShowPreview: showPreview,
      formEditorCompletedContent: editorCompletedContent,
      formIsEditorCompleted: isEditorCompleted,
      snapshotTimestamp: Date.now(),
      formMetadata,
    };

    // 상태 변화 이벤트 발생
    this.eventManager.checkStateChangeAndEmit(snapshot);

    console.log('✅ [MULTISTEP_ADAPTER] 데이터 추출 완료:', {
      currentStep: snapshot.formCurrentStep,
      hasFormValues: Object.keys(normalizedFormValues).length > 0,
      editorContentLength: editorCompletedContent.length,
      isEditorCompleted: snapshot.formIsEditorCompleted,
    });

    return snapshot;
  }

  protected async updateDataToSystem(
    snapshot: MultiStepFormSnapshotForBridge
  ): Promise<boolean> {
    console.log('📥 [MULTISTEP_ADAPTER] 멀티스텝 스냅샷 업데이트');

    try {
      const storeState = useMultiStepFormStore.getState();

      const isStoreStateValid =
        storeState && this.typeGuards.isValidObject(storeState);
      if (!isStoreStateValid) {
        throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
      }

      const setFormValuesFunc = Reflect.get(storeState, 'setFormValues');
      const canSetFormValues =
        this.typeGuards.isValidFunction(setFormValuesFunc);

      if (canSetFormValues && setFormValuesFunc) {
        setFormValuesFunc(snapshot.formValues);
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
    transformationResult: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> {
    console.log(
      '📥 [MULTISTEP_ADAPTER] 변환 결과로 멀티스텝 데이터 업데이트 시작'
    );

    const { transformedContent, transformedIsCompleted } = transformationResult;

    const storeState = useMultiStepFormStore.getState();

    const isStoreStateValid =
      storeState && this.typeGuards.isValidObject(storeState);
    if (!isStoreStateValid) {
      throw new Error('멀티스텝 스토어 상태가 유효하지 않음');
    }

    let updateSuccess = false;
    const updateMethods: string[] = [];

    try {
      // 스토어 레벨 업데이트 함수들 확인 및 실행
      const updateEditorContentFunc = Reflect.get(
        storeState,
        'updateEditorContent'
      );
      const setEditorCompletedFunc = Reflect.get(
        storeState,
        'setEditorCompleted'
      );
      const updateFormValueFunc = Reflect.get(storeState, 'updateFormValue');

      const canUpdateStoreContent = this.typeGuards.isValidFunction(
        updateEditorContentFunc
      );
      if (canUpdateStoreContent && updateEditorContentFunc) {
        console.log('🔄 [MULTISTEP_ADAPTER] 스토어 콘텐츠 업데이트 실행');
        updateEditorContentFunc(transformedContent);
        updateMethods.push('STORE_CONTENT');
        updateSuccess = true;
      }

      const canSetStoreCompleted = this.typeGuards.isValidFunction(
        setEditorCompletedFunc
      );
      if (canSetStoreCompleted && setEditorCompletedFunc) {
        console.log('🔄 [MULTISTEP_ADAPTER] 스토어 완료 상태 업데이트 실행');
        setEditorCompletedFunc(transformedIsCompleted);
        updateMethods.push('STORE_COMPLETED');
        updateSuccess = true;
      }

      const canUpdateFormValue =
        this.typeGuards.isValidFunction(updateFormValueFunc);
      if (canUpdateFormValue && updateFormValueFunc) {
        console.log('🔄 [MULTISTEP_ADAPTER] FormValues 업데이트 실행');
        updateFormValueFunc('editorCompletedContent', transformedContent);
        updateFormValueFunc('isEditorCompleted', transformedIsCompleted);
        updateMethods.push('FORM_VALUES');
        updateSuccess = true;
      }

      const hasAnyUpdateMethod = updateSuccess;
      if (!hasAnyUpdateMethod) {
        console.error('❌ [MULTISTEP_ADAPTER] 업데이트 함수들을 찾을 수 없음');
        return false;
      }

      console.log('✅ [MULTISTEP_ADAPTER] 데이터 업데이트 성공:', {
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
        updateMethods: updateMethods.join(', '),
      });

      // 업데이트 후 이벤트 발생
      setTimeout(async () => {
        try {
          const updatedSnapshot = await this.extractDataFromSystem();
          this.eventManager.emitMultiStepEvent({
            eventType: 'FORM_UPDATE',
            eventTimestamp: Date.now(),
            eventPayload: new Map<string, unknown>([
              ['updateMethods', updateMethods],
              ['contentLength', transformedContent.length],
              ['isCompleted', transformedIsCompleted],
            ]),
            currentState: updatedSnapshot,
          });
        } catch (eventError) {
          console.warn(
            '⚠️ [MULTISTEP_ADAPTER] 업데이트 이벤트 발생 실패:',
            eventError
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
    snapshot: MultiStepFormSnapshotForBridge
  ): ValidationResult {
    console.log('🔍 [MULTISTEP_ADAPTER] 추출된 데이터 검증');

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const errorDetails = new Map<string, string>();

    // 기본 구조 검증
    const hasFormValues =
      snapshot.formValues && typeof snapshot.formValues === 'object';
    const hasCurrentStep = this.typeGuards.isValidStepNumber(
      snapshot.formCurrentStep
    );
    const hasTimestamp = this.typeGuards.isValidNumber(
      snapshot.snapshotTimestamp
    );

    if (!hasFormValues) {
      const error = 'formValues가 유효하지 않음';
      validationErrors.push(error);
      errorDetails.set('formValues', error);
    }

    if (!hasCurrentStep) {
      const error = '현재 스텝이 유효하지 않음';
      validationErrors.push(error);
      errorDetails.set('currentStep', error);
    }

    if (!hasTimestamp) {
      const error = '타임스탬프가 유효하지 않음';
      validationErrors.push(error);
      errorDetails.set('timestamp', error);
    }

    // FormValues 상세 검증
    const isFormValid = hasFormValues
      ? this.validationModule.validateFormValues(snapshot.formValues)
      : false;
    if (hasFormValues && !isFormValid) {
      validationWarnings.push('일부 필수 폼 필드가 누락됨');
    }

    // 완성도 검증
    const completionPercentage = hasFormValues
      ? this.validationModule.calculateFormCompletionPercentage(
          snapshot.formValues
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
    snapshot: MultiStepFormSnapshotForBridge
  ): MultiStepFormSnapshotForBridge {
    console.log('📸 [MULTISTEP_ADAPTER] 데이터 스냅샷 생성');

    // 스냅샷은 이미 완전한 형태이므로 그대로 반환
    return {
      ...snapshot,
      snapshotTimestamp: Date.now(), // 스냅샷 생성 시간 갱신
    };
  }

  // 🔧 BaseAdapter의 updateData를 오버라이드하여 변환 결과 업데이트로 연결
  public async updateData(
    snapshot: MultiStepFormSnapshotForBridge
  ): Promise<boolean> {
    console.log('📥 [MULTISTEP_ADAPTER] BaseAdapter updateData 호출');
    return await this.updateDataToSystem(snapshot);
  }

  // 🔧 변환 결과를 위한 전용 업데이트 메서드

  // 🔧 공개 API 메서드들

  public async getFormProgressInfo(): Promise<{
    currentStep: number;
    progressWidth: number;
    totalSteps: number;
    completionPercentage: number;
  }> {
    console.log('🔍 [MULTISTEP_ADAPTER] 폼 진행 정보 조회');

    try {
      const snapshot = await this.extractData();

      const defaultResult = {
        currentStep: 1,
        progressWidth: 0,
        totalSteps: 5,
        completionPercentage: 0,
      };

      if (!snapshot) {
        return defaultResult;
      }

      const { formCurrentStep, formProgressWidth, formValues, formMetadata } =
        snapshot;
      const totalSteps = this.safeConverters.convertToSafeNumber(
        formMetadata.get('totalSteps'),
        5
      );
      const completionPercentage =
        this.validationModule.calculateFormCompletionPercentage(formValues);

      return {
        currentStep: formCurrentStep,
        progressWidth: formProgressWidth,
        totalSteps,
        completionPercentage,
      };
    } catch (progressError) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 진행 정보 조회 실패:',
        progressError
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
      const snapshot = await this.extractData();

      const defaultResult = { content: '', isCompleted: false };

      if (!snapshot) {
        return defaultResult;
      }

      const { formEditorCompletedContent, formIsEditorCompleted } = snapshot;

      return {
        content: formEditorCompletedContent,
        isCompleted: formIsEditorCompleted,
      };
    } catch (contentError) {
      console.error(
        '❌ [MULTISTEP_ADAPTER] 에디터 콘텐츠 추출 실패:',
        contentError
      );
      return { content: '', isCompleted: false };
    }
  }

  public addStateChangeListener(
    eventHandler: (eventData: MultiStepAdapterEventData) => void,
    eventTypes: string[] = ['STATE_CHANGE']
  ): string {
    console.log('📡 [MULTISTEP_ADAPTER] 상태 변화 리스너 추가');
    return this.eventManager.addEventListenerForMultiStep(
      eventHandler,
      eventTypes
    );
  }

  public removeStateChangeListener(listenerId: string): boolean {
    console.log('📡 [MULTISTEP_ADAPTER] 상태 변화 리스너 제거');
    return this.eventManager.removeEventListenerForMultiStep(listenerId);
  }

  public getConnectionMetrics(): MultiStepConnectionMetrics {
    console.log('📊 [MULTISTEP_ADAPTER] 연결 메트릭 조회');
    return { ...this.connectionMetrics };
  }
}

export default MultiStepAdapter;

export type {
  MultiStepAdapterEventData,
  MultiStepEventListener,
  MultiStepConnectionMetrics,
};
