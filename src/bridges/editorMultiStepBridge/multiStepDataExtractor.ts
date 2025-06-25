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

const isFormValues = (candidate: unknown): candidate is FormValues => {
  return candidate !== null && typeof candidate === 'object';
};

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
  const value = formValues[key];

  if (typeof defaultValue === 'string' && isValidString(value)) {
    return value;
  }
  if (typeof defaultValue === 'boolean' && isValidBoolean(value)) {
    return value;
  }

  return defaultValue;
};

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

      const {
        formValues,
        currentStep,
        progressWidth = 0,
        showPreview = false,
        editorCompletedContent = '',
        isEditorCompleted = false,
      } = formState;

      // 🎯 타입 가드를 통한 안전한 타입 체크
      const validatedFormValues = isFormValues(formValues)
        ? formValues
        : createDefaultFormValues();

      // 🔧 formMetadata 생성 - 구체적인 타입 전달
      const editorContentLength = getFormValueSafely(
        validatedFormValues,
        'editorCompletedContent',
        ''
      ).length;

      const formMetadata = createFormMetadata(
        currentStep,
        validatedFormValues,
        editorContentLength
      );

      const snapshot: MultiStepFormSnapshotForBridge = {
        formValues: validatedFormValues,
        formCurrentStep: currentStep,
        formProgressWidth: progressWidth,
        formShowPreview: showPreview,
        formEditorCompletedContent: editorCompletedContent,
        formIsEditorCompleted: isEditorCompleted,
        snapshotTimestamp: Date.now(),
        formMetadata, // ✅ 이제 타입이 일치함
      };

      console.log('✅ [MULTISTEP_EXTRACTOR] 데이터 추출 완료:', {
        currentStep,
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
    console.log('🔍 [MULTISTEP_EXTRACTOR] 데이터 검증');

    if (!data || typeof data !== 'object') {
      return false;
    }

    const hasFormValues =
      data.formValues && typeof data.formValues === 'object';
    const hasCurrentStep = typeof data.formCurrentStep === 'number';
    const hasTimestamp = typeof data.snapshotTimestamp === 'number';
    const hasMetadata = data.formMetadata instanceof Map; // 🔧 formMetadata 검증 추가

    return hasFormValues && hasCurrentStep && hasTimestamp && hasMetadata;
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

      // 🎯 타입 안전한 FormValues 보장
      const formValues: FormValues = {
        ...createDefaultFormValues(),
        ...rawFormValues,
      };

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

      const { formValues } = snapshot;

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
        const value = formValues[field];
        return !value || (isValidString(value) && value.trim().length === 0);
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

    return (
      'formValues' in candidate &&
      'formCurrentStep' in candidate &&
      'snapshotTimestamp' in candidate &&
      'formMetadata' in candidate &&
      isValidNumber(Reflect.get(candidate, 'formCurrentStep')) &&
      isValidNumber(Reflect.get(candidate, 'snapshotTimestamp')) &&
      Reflect.get(candidate, 'formMetadata') instanceof Map
    );
  };

  const getValidatedSnapshot = (): MultiStepFormSnapshotForBridge | null => {
    const snapshot = extractMultiStepData();
    return isValidFormSnapshot(snapshot) ? snapshot : null;
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
