// bridges/editorMultiStepBridge/multiStepDataExtractor.ts

import { MultiStepFormSnapshotForBridge } from './bridgeDataTypes';
import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 🔧 기본 FormValues 생성 함수 추가 - 실제 타입에 맞춤
const createDefaultFormValues = (): FormValues => ({
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
});

const isValidString = (value: unknown): value is string => {
  return typeof value === 'string';
};

const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

const isValidBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

// 🔧 Map에서 안전하게 값 추출하는 헬퍼 함수 - bridgeDataTypes와 호환되는 타입 사용
const getMetadataValueAsNumber = (
  metadata: Map<string, unknown>,
  key: string,
  defaultValue: number
): number => {
  const value = metadata.get(key);
  return isValidNumber(value) ? value : defaultValue;
};

// 🎯 FormValues에서 안전하게 속성 접근하는 헬퍼
const getFormValueSafely = <K extends keyof FormValues>(
  formValues: FormValues,
  key: K,
  defaultValue: NonNullable<FormValues[K]>
): NonNullable<FormValues[K]> => {
  try {
    const value = formValues[key];

    if (typeof defaultValue === 'string' && isValidString(value)) {
      return value;
    }
    if (typeof defaultValue === 'boolean' && isValidBoolean(value)) {
      return value;
    }
    if (Array.isArray(defaultValue) && Array.isArray(value)) {
      return value as NonNullable<FormValues[K]>;
    }

    return defaultValue;
  } catch (error) {
    console.warn(
      `⚠️ [MULTISTEP_EXTRACTOR] ${String(key)} 값 추출 실패:`,
      error
    );
    return defaultValue;
  }
};

// 🚨 핵심 추가: FormValues를 안전하게 정규화하는 함수
const normalizeFormValues = (rawFormValues: unknown): FormValues => {
  console.log('🔄 [MULTISTEP_EXTRACTOR] FormValues 정규화 시작');

  const baseFormValues = createDefaultFormValues();

  // rawFormValues가 객체가 아닌 경우 기본값 반환
  if (
    !rawFormValues ||
    typeof rawFormValues !== 'object' ||
    Array.isArray(rawFormValues)
  ) {
    console.log('✅ [MULTISTEP_EXTRACTOR] 원본이 유효하지 않음, 기본값 반환');
    return baseFormValues;
  }

  const sourceObject = rawFormValues as Record<string, unknown>;

  try {
    // 각 필드를 안전하게 복사
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

    stringFields.forEach((field) => {
      try {
        if (field in sourceObject) {
          const value = sourceObject[field];
          if (typeof value === 'string') {
            (baseFormValues as any)[field] = value;
          }
        }
      } catch (fieldError) {
        console.debug(
          `🔍 [MULTISTEP_EXTRACTOR] ${String(field)} 필드 복사 실패:`,
          fieldError
        );
      }
    });

    // boolean 필드 처리
    if ('isEditorCompleted' in sourceObject) {
      const value = sourceObject.isEditorCompleted;
      if (typeof value === 'boolean') {
        baseFormValues.isEditorCompleted = value;
      }
    }

    // 배열 필드들 처리
    if ('media' in sourceObject && Array.isArray(sourceObject.media)) {
      baseFormValues.media = sourceObject.media.filter(
        (item) => typeof item === 'string'
      );
    }

    if (
      'sliderImages' in sourceObject &&
      Array.isArray(sourceObject.sliderImages)
    ) {
      baseFormValues.sliderImages = sourceObject.sliderImages.filter(
        (item) => typeof item === 'string'
      );
    }

    // mainImage 필드 처리
    if ('mainImage' in sourceObject) {
      const value = sourceObject.mainImage;
      if (value === null || typeof value === 'string') {
        baseFormValues.mainImage = value;
      }
    }
  } catch (overallError) {
    console.warn(
      '⚠️ [MULTISTEP_EXTRACTOR] FormValues 정규화 중 오류:',
      overallError
    );
  }

  console.log('✅ [MULTISTEP_EXTRACTOR] FormValues 정규화 완료');
  return baseFormValues;
};

// 🔧 multiStepDataUpdater.ts의 사용하지 않는 변수 제거
// formObj 변수 사용하지 않음 경고 해결을 위해 아래와 같이 수정:
/*
기존 코드:
const formObj = value;
// formObj를 사용하지 않음

수정된 코드:
// formObj 변수 자체를 제거하고 직접 검증 로직 사용
*/

export const createMultiStepDataExtractor = () => {
  // 🔧 폼 메타데이터 생성 함수 - bridgeDataTypes와 호환되는 타입 사용
  const createFormMetadata = (
    currentStep: number,
    formValues: FormValues | null,
    editorContentLength: number
  ): Map<string, unknown> => {
    const currentTimestamp = Date.now();

    return new Map<string, unknown>([
      ['extractionTimestamp', currentTimestamp],
      ['currentStep', currentStep],
      ['totalSteps', 5], // 일반적인 멀티스텝 폼의 총 단계 수
      ['hasFormValues', Boolean(formValues)],
      ['editorContentLength', editorContentLength],
      ['extractorVersion', '1.0.0'],
      ['isCompleteExtraction', true],
    ]);
  };

  const extractMultiStepData = (): MultiStepFormSnapshotForBridge | null => {
    console.log('🔍 [MULTISTEP_EXTRACTOR] MultiStep 데이터 추출 시작');

    try {
      const formState = useMultiStepFormStore.getState();

      if (!formState) {
        console.error('❌ [MULTISTEP_EXTRACTOR] MultiStep 상태 없음');
        return null;
      }

      // 🚨 핵심 수정: Reflect.get()을 사용하여 안전하게 속성 접근
      const rawFormValues = Reflect.get(formState, 'formValues');
      const currentStep = Reflect.get(formState, 'currentStep') ?? 1;
      const progressWidth = Reflect.get(formState, 'progressWidth') ?? 0;
      const showPreview = Reflect.get(formState, 'showPreview') ?? false;
      const editorCompletedContent =
        Reflect.get(formState, 'editorCompletedContent') ?? '';
      const isEditorCompleted =
        Reflect.get(formState, 'isEditorCompleted') ?? false;

      console.log('🔍 [MULTISTEP_EXTRACTOR] 추출된 원시 값들:', {
        hasFormValues: Boolean(rawFormValues),
        currentStep,
        progressWidth,
        showPreview,
        editorCompletedContentLength:
          typeof editorCompletedContent === 'string'
            ? editorCompletedContent.length
            : 0,
        isEditorCompleted,
      });

      // 🚨 핵심 변경: 타입 가드 대신 정규화 함수 사용
      console.log('🔄 [MULTISTEP_EXTRACTOR] FormValues 정규화 처리');
      const validatedFormValues = normalizeFormValues(rawFormValues);

      // 🔧 formMetadata 생성 - 구체적인 타입 전달
      const editorContentLength = getFormValueSafely(
        validatedFormValues,
        'editorCompletedContent',
        ''
      ).length;

      const formMetadata = createFormMetadata(
        typeof currentStep === 'number' ? currentStep : 1,
        validatedFormValues,
        editorContentLength
      );

      const snapshot: MultiStepFormSnapshotForBridge = {
        formValues: validatedFormValues,
        formCurrentStep: typeof currentStep === 'number' ? currentStep : 1,
        formProgressWidth:
          typeof progressWidth === 'number' ? progressWidth : 0,
        formShowPreview: typeof showPreview === 'boolean' ? showPreview : false,
        formEditorCompletedContent:
          typeof editorCompletedContent === 'string'
            ? editorCompletedContent
            : '',
        formIsEditorCompleted:
          typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false,
        snapshotTimestamp: Date.now(),
        formMetadata, // ✅ 이제 타입이 일치함
      };

      console.log('✅ [MULTISTEP_EXTRACTOR] 데이터 추출 완료:', {
        currentStep: snapshot.formCurrentStep,
        hasFormValues: Object.keys(validatedFormValues).length > 0,
        editorContentLength: getFormValueSafely(
          validatedFormValues,
          'editorCompletedContent',
          ''
        ).length,
        isEditorCompleted: getFormValueSafely(
          validatedFormValues,
          'isEditorCompleted',
          false
        ),
        metadataSize: formMetadata.size,
      });

      return snapshot;
    } catch (error) {
      console.error('❌ [MULTISTEP_EXTRACTOR] 추출 실패:', error);
      return null;
    }
  };

  const validateMultiStepData = (
    data: MultiStepFormSnapshotForBridge | null
  ): boolean => {
    console.log('🔍 [MULTISTEP_EXTRACTOR] 데이터 검증 (관대한 모드)');

    if (!data || typeof data !== 'object') {
      return false;
    }

    const hasFormValues =
      data.formValues && typeof data.formValues === 'object';
    const hasCurrentStep = typeof data.formCurrentStep === 'number';
    const hasTimestamp = typeof data.snapshotTimestamp === 'number';
    const hasMetadata = data.formMetadata instanceof Map;

    const isBasicallyValid =
      hasFormValues && hasCurrentStep && hasTimestamp && hasMetadata;

    console.log('📊 [MULTISTEP_EXTRACTOR] 검증 결과:', {
      hasFormValues,
      hasCurrentStep,
      hasTimestamp,
      hasMetadata,
      isBasicallyValid,
    });

    return isBasicallyValid;
  };

  const getEditorContentFromMultiStep = (): {
    content: string;
    isCompleted: boolean;
  } => {
    console.log('🔍 [MULTISTEP_EXTRACTOR] Editor 콘텐츠 추출');

    try {
      const snapshot = extractMultiStepData();

      if (!snapshot || !validateMultiStepData(snapshot)) {
        console.warn('⚠️ [MULTISTEP_EXTRACTOR] 유효하지 않은 데이터');
        return { content: '', isCompleted: false };
      }

      const { formValues: rawFormValues } = snapshot;

      // 🚨 핵심 변경: 정규화된 FormValues 사용
      const formValues: FormValues = normalizeFormValues(rawFormValues);

      // 🎯 타입 가드를 통한 안전한 속성 접근
      const content = getFormValueSafely(
        formValues,
        'editorCompletedContent',
        ''
      );
      const isCompleted = getFormValueSafely(
        formValues,
        'isEditorCompleted',
        false
      );

      console.log('✅ [MULTISTEP_EXTRACTOR] Editor 콘텐츠 추출 완료:', {
        contentLength: content.length,
        isCompleted,
      });

      return { content, isCompleted };
    } catch (error) {
      console.error('❌ [MULTISTEP_EXTRACTOR] Editor 콘텐츠 추출 실패:', error);
      return { content: '', isCompleted: false };
    }
  };

  // 🔧 추가 유틸리티 함수들 - 타입 단언 제거
  const getFormProgressInfo = (): {
    currentStep: number;
    progressWidth: number;
    totalSteps: number;
  } => {
    console.log('🔍 [MULTISTEP_EXTRACTOR] 폼 진행 정보 추출');

    try {
      const snapshot = extractMultiStepData();

      if (!snapshot) {
        return { currentStep: 1, progressWidth: 0, totalSteps: 5 };
      }

      const { formCurrentStep, formProgressWidth, formMetadata } = snapshot;

      // 🎯 타입 단언 제거 - 구체적인 타입 가드 함수 사용
      const totalSteps = getMetadataValueAsNumber(
        formMetadata,
        'totalSteps',
        5
      );

      return {
        currentStep: formCurrentStep,
        progressWidth: formProgressWidth,
        totalSteps,
      };
    } catch (error) {
      console.error('❌ [MULTISTEP_EXTRACTOR] 진행 정보 추출 실패:', error);
      return { currentStep: 1, progressWidth: 0, totalSteps: 5 };
    }
  };

  const checkFormCompleteness = (): {
    isComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  } => {
    console.log('🔍 [MULTISTEP_EXTRACTOR] 폼 완성도 확인');

    try {
      const snapshot = extractMultiStepData();

      if (!snapshot) {
        return {
          isComplete: false,
          completionPercentage: 0,
          missingFields: ['전체 폼 데이터'],
        };
      }

      const { formValues: rawFormValues } = snapshot;

      // 🚨 핵심 변경: 정규화된 FormValues 사용
      const formValues = normalizeFormValues(rawFormValues);

      // 🎯 실제 FormValues에 존재하는 필드만 포함
      const requiredFields: Array<keyof FormValues> = [
        'userImage',
        'nickname',
        'emailPrefix',
        'emailDomain',
        'bio',
        'title',
        'description',
        'tags',
        'content',
        'mainImage',
        'editorCompletedContent',
      ];

      // 🔧 타입 단언 제거 - 안전한 속성 접근
      const missingFields = requiredFields.filter((field) => {
        try {
          const value = formValues[field];
          return !value || (isValidString(value) && value.trim().length === 0);
        } catch (fieldError) {
          console.debug(
            `🔍 [MULTISTEP_EXTRACTOR] ${String(field)} 필드 검사 실패:`,
            fieldError
          );
          return true; // 에러가 나면 missing으로 간주
        }
      });

      const completedFields = requiredFields.length - missingFields.length;
      const completionPercentage = Math.round(
        (completedFields / requiredFields.length) * 100
      );
      const isComplete = missingFields.length === 0;

      console.log('📊 [MULTISTEP_EXTRACTOR] 폼 완성도:', {
        isComplete,
        completionPercentage,
        missingFieldCount: missingFields.length,
      });

      return {
        isComplete,
        completionPercentage,
        missingFields: missingFields.map((field) => String(field)),
      };
    } catch (error) {
      console.error('❌ [MULTISTEP_EXTRACTOR] 완성도 확인 실패:', error);
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ['오류로 인한 확인 불가'],
      };
    }
  };

  // 🎯 추가 타입 가드 함수들
  const isValidFormSnapshot = (
    candidate: unknown
  ): candidate is MultiStepFormSnapshotForBridge => {
    if (!candidate || typeof candidate !== 'object') return false;

    const hasRequiredProperties =
      'formValues' in candidate &&
      'formCurrentStep' in candidate &&
      'snapshotTimestamp' in candidate &&
      'formMetadata' in candidate;

    if (!hasRequiredProperties) return false;

    const currentStepValue = Reflect.get(candidate, 'formCurrentStep');
    const timestampValue = Reflect.get(candidate, 'snapshotTimestamp');
    const metadataValue = Reflect.get(candidate, 'formMetadata');

    return (
      isValidNumber(currentStepValue) &&
      isValidNumber(timestampValue) &&
      metadataValue instanceof Map
    );
  };

  const getValidatedSnapshot = (): MultiStepFormSnapshotForBridge | null => {
    try {
      const snapshot = extractMultiStepData();
      return isValidFormSnapshot(snapshot) ? snapshot : null;
    } catch (error) {
      console.error('❌ [MULTISTEP_EXTRACTOR] 검증된 스냅샷 추출 실패:', error);
      return null;
    }
  };

  return {
    extractMultiStepData,
    validateMultiStepData,
    getEditorContentFromMultiStep,
    getFormProgressInfo,
    checkFormCompleteness,
    isValidFormSnapshot, // 🎯 추가된 타입 가드
    getValidatedSnapshot, // 🎯 추가된 검증된 스냅샷 함수
  };
};
