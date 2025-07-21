// src/components/multiStepForm/reactHookForm/useMultiStepFormState.ts

import { useCallback, useMemo, useState } from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import {
  getTotalSteps,
  getMaxStep,
  getMinStep,
  isValidStepNumber,
} from '../types/stepTypes';
import type { StepNumber } from '../types/stepTypes';
import {
  convertCompatibleFormDataToFormValues,
  convertFormValuesToCompatibleFormData,
  isValidFormValues,
  isValidCompatibleFormData,
} from '../../../store/shared/commonTypes';
import type {
  FormValues,
  BridgeFormValues,
  CompatibleFormData,
} from '../../../store/shared/commonTypes';

// 🔧 토스트 옵션 타입
interface ValidationToastOptions {
  readonly title: string;
  readonly description?: string;
  readonly color: string;
}

interface FormSubmitToastOptions {
  readonly title?: string;
  readonly color?: string;
  readonly message?: string;
}

// 🔧 스토어 데이터 타입 (mutable)
interface MultiStepFormStoreData {
  getFormValues?: () => CompatibleFormData;
  updateFormValue?: (
    fieldName: string,
    value: string | string[] | boolean | null
  ) => void;
  updateFormValues?: (
    values: Record<string, string | string[] | boolean | null>
  ) => void;
  addToast?: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void;
  updateEditorContent?: (content: string) => void;
  setEditorCompleted?: (completed: boolean) => void;
  setFormValues?: (values: BridgeFormValues) => void;
}

// 🔧 실행 결과 타입
interface ExecutionResult<DataType = void> {
  success: boolean;
  data?: DataType;
  error?: string;
}

// 🔧 기본 폼 데이터
const DEFAULT_FORM_DATA: FormValues = {
  nickname: '',
  emailPrefix: '',
  emailDomain: '',
  bio: '',
  title: '',
  description: '',
  tags: '',
  content: '',
  userImage: '',
  mainImage: null,
  media: [],
  sliderImages: [],
  editorCompletedContent: '',
  isEditorCompleted: false,
};

// 🔧 스텝 번호 계산
const calculateNextStepNumber = (currentStep: StepNumber): StepNumber => {
  const nextStep = currentStep + 1;
  return isValidStepNumber(nextStep) ? nextStep : currentStep;
};

const calculatePrevStepNumber = (currentStep: StepNumber): StepNumber => {
  const prevStep = currentStep - 1;
  return isValidStepNumber(prevStep) ? prevStep : currentStep;
};

// 🔧 안전 실행 유틸리티
const executeGetFormValues = (
  storeData: MultiStepFormStoreData | null
): ExecutionResult<CompatibleFormData> => {
  try {
    const { getFormValues } = storeData || {};
    const result = typeof getFormValues === 'function' ? getFormValues() : {};
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `getFormValues 실행 실패: ${error}` };
  }
};

const executeUpdateFormValue = (
  storeData: MultiStepFormStoreData | null,
  fieldName: string,
  value: string | string[] | boolean | null
): ExecutionResult => {
  try {
    const { updateFormValue } = storeData || {};
    if (typeof updateFormValue === 'function') {
      updateFormValue(fieldName, value);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `updateFormValue 실행 실패: ${error}` };
  }
};

const executeUpdateFormValues = (
  storeData: MultiStepFormStoreData | null,
  values: Record<string, string | string[] | boolean | null>
): ExecutionResult => {
  try {
    const { updateFormValues } = storeData || {};
    if (typeof updateFormValues === 'function') {
      updateFormValues(values);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `updateFormValues 실행 실패: ${error}` };
  }
};

const executeAddToast = (
  storeData: MultiStepFormStoreData | null,
  toast: { title: string; description: string; color: string }
): ExecutionResult => {
  try {
    const { addToast } = storeData || {};
    if (typeof addToast === 'function') {
      addToast(toast);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `addToast 실행 실패: ${error}` };
  }
};

const executeUpdateEditorContent = (
  storeData: MultiStepFormStoreData | null,
  content: string
): ExecutionResult => {
  try {
    const { updateEditorContent } = storeData || {};
    if (typeof updateEditorContent === 'function') {
      updateEditorContent(content);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `updateEditorContent 실행 실패: ${error}` };
  }
};

const executeSetEditorCompleted = (
  storeData: MultiStepFormStoreData | null,
  completed: boolean
): ExecutionResult => {
  try {
    const { setEditorCompleted } = storeData || {};
    if (typeof setEditorCompleted === 'function') {
      setEditorCompleted(completed);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `setEditorCompleted 실행 실패: ${error}` };
  }
};

const executeSetFormValues = (
  storeData: MultiStepFormStoreData | null,
  values: BridgeFormValues
): ExecutionResult => {
  try {
    const { setFormValues } = storeData || {};
    if (typeof setFormValues === 'function') {
      setFormValues(values);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: `setFormValues 실행 실패: ${error}` };
  }
};

export const useMultiStepFormState = () => {
  const { methods, handleSubmit, errors, trigger } = useFormMethods();
  const rawStoreData = useMultiStepFormStore();

  // 🔧 스토어 데이터 변환
  const storeData = useMemo<MultiStepFormStoreData | null>(() => {
    if (!rawStoreData) {
      return null;
    }

    const storeMap = new Map(Object.entries(rawStoreData));
    const typedStoreData: MultiStepFormStoreData = {};

    // Map을 사용하여 안전하게 변환
    const getFormValues = storeMap.get('getFormValues');
    if (typeof getFormValues === 'function') {
      typedStoreData.getFormValues = getFormValues;
    }

    const updateFormValue = storeMap.get('updateFormValue');
    if (typeof updateFormValue === 'function') {
      typedStoreData.updateFormValue = updateFormValue;
    }

    const updateFormValues = storeMap.get('updateFormValues');
    if (typeof updateFormValues === 'function') {
      typedStoreData.updateFormValues = updateFormValues;
    }

    const addToast = storeMap.get('addToast');
    if (typeof addToast === 'function') {
      typedStoreData.addToast = addToast;
    }

    const updateEditorContent = storeMap.get('updateEditorContent');
    if (typeof updateEditorContent === 'function') {
      typedStoreData.updateEditorContent = updateEditorContent;
    }

    const setEditorCompleted = storeMap.get('setEditorCompleted');
    if (typeof setEditorCompleted === 'function') {
      typedStoreData.setEditorCompleted = setEditorCompleted;
    }

    const setFormValues = storeMap.get('setFormValues');
    if (typeof setFormValues === 'function') {
      typedStoreData.setFormValues = setFormValues;
    }

    return typedStoreData;
  }, [rawStoreData]);

  // 🔧 로컬 상태로 스텝 관리
  const [currentStep, setCurrentStep] = useState<StepNumber>(() =>
    getMinStep()
  );
  const [progressWidth, setProgressWidth] = useState<number>(0);

  // 🔧 폼 데이터 조회
  const formData = useMemo<FormValues>(() => {
    const result = executeGetFormValues(storeData);

    if (!result.success || !result.data) {
      return DEFAULT_FORM_DATA;
    }

    try {
      const { data: rawFormData } = result;

      if (!isValidCompatibleFormData(rawFormData)) {
        return DEFAULT_FORM_DATA;
      }

      const convertedFormValues =
        convertCompatibleFormDataToFormValues(rawFormData);
      const formDataMap = new Map(Object.entries(convertedFormValues));

      const extractedFormData: FormValues = {
        nickname:
          typeof formDataMap.get('nickname') === 'string'
            ? formDataMap.get('nickname')
            : '',
        emailPrefix:
          typeof formDataMap.get('emailPrefix') === 'string'
            ? formDataMap.get('emailPrefix')
            : '',
        emailDomain:
          typeof formDataMap.get('emailDomain') === 'string'
            ? formDataMap.get('emailDomain')
            : '',
        bio:
          typeof formDataMap.get('bio') === 'string'
            ? formDataMap.get('bio')
            : '',
        title:
          typeof formDataMap.get('title') === 'string'
            ? formDataMap.get('title')
            : '',
        description:
          typeof formDataMap.get('description') === 'string'
            ? formDataMap.get('description')
            : '',
        tags:
          typeof formDataMap.get('tags') === 'string'
            ? formDataMap.get('tags')
            : '',
        content:
          typeof formDataMap.get('content') === 'string'
            ? formDataMap.get('content')
            : '',
        userImage:
          typeof formDataMap.get('userImage') === 'string'
            ? formDataMap.get('userImage')
            : '',
        mainImage:
          formDataMap.get('mainImage') !== undefined
            ? formDataMap.get('mainImage')
            : null,
        media: Array.isArray(formDataMap.get('media'))
          ? formDataMap.get('media')
          : [],
        sliderImages: Array.isArray(formDataMap.get('sliderImages'))
          ? formDataMap.get('sliderImages')
          : [],
        editorCompletedContent:
          typeof formDataMap.get('editorCompletedContent') === 'string'
            ? formDataMap.get('editorCompletedContent')
            : '',
        isEditorCompleted:
          typeof formDataMap.get('isEditorCompleted') === 'boolean'
            ? formDataMap.get('isEditorCompleted')
            : false,
      };

      return extractedFormData;
    } catch (error) {
      console.error('❌ 폼 데이터 변환 실패:', error);
      return DEFAULT_FORM_DATA;
    }
  }, [storeData]);

  const { editorCompletedContent = '', isEditorCompleted = false } = formData;

  const stepInformation = useMemo(
    () => ({
      totalSteps: getTotalSteps(),
      maxStep: getMaxStep(),
    }),
    []
  );

  // 🔧 진행률 계산
  const calculateProgressWidth = useCallback((step: StepNumber): number => {
    const minStep = getMinStep();
    const totalSteps = getTotalSteps();

    if (totalSteps <= 1) {
      return 100;
    }

    const progress = ((step - minStep) / (totalSteps - 1)) * 100;
    return Math.max(0, Math.min(100, progress));
  }, []);

  // 🔧 색상 검증 - 타입 단언 제거
  const validateToastColor = useCallback(
    (color: string): 'success' | 'danger' | 'warning' | 'info' => {
      // Set을 사용하여 안전한 타입 체크
      const validColorSet = new Set<string>([
        'success',
        'danger',
        'warning',
        'info',
      ]);

      if (validColorSet.has(color)) {
        // 이미 검증된 색상이므로 안전하게 반환
        return color === 'success'
          ? 'success'
          : color === 'danger'
          ? 'danger'
          : color === 'warning'
          ? 'warning'
          : 'info';
      }

      return 'info';
    },
    []
  );

  // 🔧 토스트 함수
  const safeAddToast = useCallback(
    (
      message: string,
      color: 'success' | 'danger' | 'warning' | 'info'
    ): void => {
      const toastMessage = { title: message, description: '', color };
      executeAddToast(storeData, toastMessage);
    },
    [storeData]
  );

  // 🔧 검증용 토스트 래퍼
  const validationAddToast = useCallback(
    (options: ValidationToastOptions): void => {
      const { title, color } = options;
      const validColor = validateToastColor(color);
      safeAddToast(title, validColor);
    },
    [safeAddToast, validateToastColor]
  );

  const { validateCurrentStep } = useValidation({
    trigger,
    errors,
    editorState: {
      containers: [],
      paragraphs: [],
      completedContent: editorCompletedContent,
      isCompleted: isEditorCompleted,
    },
    addToast: validationAddToast,
  });

  // 🔧 폼 제출용 토스트 래퍼
  const formSubmitAddToast = useCallback(
    (options: FormSubmitToastOptions): void => {
      const { title = '', message = '', color = 'info' } = options;
      const finalMessage =
        title.length > 0 ? title : message.length > 0 ? message : '알림';
      const validColor = validateToastColor(color);
      safeAddToast(finalMessage, validColor);
    },
    [safeAddToast, validateToastColor]
  );

  const { onSubmit } = useFormSubmit({ addToast: formSubmitAddToast });

  // 🔧 스텝 이동 함수들
  const goToNextStep = useCallback(async (): Promise<void> => {
    if (!isValidStepNumber(currentStep)) {
      const recoveryStep = getMinStep();
      setCurrentStep(recoveryStep);
      setProgressWidth(calculateProgressWidth(recoveryStep));
      return;
    }

    if (currentStep >= stepInformation.maxStep) {
      return;
    }

    try {
      const stepValidationResult = validateCurrentStep
        ? await validateCurrentStep(currentStep)
        : true;

      if (stepValidationResult && currentStep < stepInformation.maxStep) {
        const nextStep = calculateNextStepNumber(currentStep);
        setCurrentStep(nextStep);
        setProgressWidth(calculateProgressWidth(nextStep));
      }
    } catch (validationError) {
      console.error('❌ 스텝 검증 중 에러:', validationError);
      safeAddToast('스텝 이동 중 오류가 발생했습니다.', 'danger');
    }
  }, [
    validateCurrentStep,
    currentStep,
    stepInformation.maxStep,
    safeAddToast,
    calculateProgressWidth,
  ]);

  const goToPrevStep = useCallback((): void => {
    const minStep = getMinStep();

    if (currentStep > minStep) {
      const prevStep = calculatePrevStepNumber(currentStep);
      setCurrentStep(prevStep);
      setProgressWidth(calculateProgressWidth(prevStep));
    }
  }, [currentStep, calculateProgressWidth]);

  const goToStep = useCallback(
    async (targetStep: number): Promise<void> => {
      if (!isValidStepNumber(targetStep)) {
        return;
      }

      if (targetStep === currentStep) {
        return;
      }

      try {
        const isMovingForward = targetStep > currentStep;

        if (isMovingForward && validateCurrentStep) {
          const stepValidationResult = await validateCurrentStep(currentStep);
          if (!stepValidationResult) {
            return;
          }
        }

        setCurrentStep(targetStep);
        setProgressWidth(calculateProgressWidth(targetStep));
      } catch (navigationError) {
        console.error('❌ 스텝 이동 에러:', navigationError);
        safeAddToast('스텝 이동 중 오류가 발생했습니다.', 'danger');
      }
    },
    [currentStep, validateCurrentStep, safeAddToast, calculateProgressWidth]
  );

  // 🔧 Bridge 호환 에디터 관련 함수들
  const updateEditorContent = useCallback(
    (content: string): void => {
      const bridgeResult = executeUpdateEditorContent(storeData, content);

      if (!bridgeResult.success) {
        const fallbackResult = executeUpdateFormValue(
          storeData,
          'editorCompletedContent',
          content
        );
        if (!fallbackResult.success) {
          console.warn('⚠️ 에디터 내용 업데이트 실패');
        }
      }
    },
    [storeData]
  );

  const setEditorCompleted = useCallback(
    (completed: boolean): void => {
      const bridgeResult = executeSetEditorCompleted(storeData, completed);

      if (!bridgeResult.success) {
        const fallbackResult = executeUpdateFormValue(
          storeData,
          'isEditorCompleted',
          completed
        );
        if (!fallbackResult.success) {
          console.warn('⚠️ 에디터 완료 상태 설정 실패');
        }
      }
    },
    [storeData]
  );

  const setFormValues = useCallback(
    (formValues: FormValues): void => {
      if (!isValidFormValues(formValues)) {
        return;
      }

      const bridgeFormValues: BridgeFormValues = {
        userImage: formValues.userImage,
        nickname: formValues.nickname,
        emailPrefix: formValues.emailPrefix,
        emailDomain: formValues.emailDomain,
        bio: formValues.bio,
        title: formValues.title,
        description: formValues.description,
        tags: formValues.tags,
        content: formValues.content,
        media: formValues.media,
        mainImage: formValues.mainImage,
        sliderImages: formValues.sliderImages,
        editorCompletedContent: formValues.editorCompletedContent,
        isEditorCompleted: formValues.isEditorCompleted,
      };

      const bridgeResult = executeSetFormValues(storeData, bridgeFormValues);

      if (!bridgeResult.success) {
        const compatibleFormData =
          convertFormValuesToCompatibleFormData(formValues);
        const safeFormDataMap = new Map(Object.entries(compatibleFormData));
        const safeFormData: Record<string, string | string[] | boolean | null> =
          {};

        safeFormDataMap.forEach((value, key) => {
          if (value !== undefined) {
            safeFormData[key] = value;
          }
        });

        executeUpdateFormValues(storeData, safeFormData);
      }
    },
    [storeData]
  );

  const updateFormValue = useCallback(
    (fieldName: string, value: string | string[] | boolean | null): void => {
      executeUpdateFormValue(storeData, fieldName, value);
    },
    [storeData]
  );

  const getFormAnalytics = useCallback(() => {
    const errorEntries = Object.entries(errors);
    return {
      currentStep,
      totalSteps: stepInformation.totalSteps,
      errorCount: errorEntries.length,
      hasUnsavedChanges: false,
      isFormValid: errorEntries.length === 0,
    };
  }, [currentStep, errors, stepInformation.totalSteps]);

  // 편의 상태 계산
  const isFirstStep = currentStep === getMinStep();
  const isLastStep = currentStep === stepInformation.maxStep;
  const canGoNext = currentStep < stepInformation.maxStep;
  const canGoPrev = currentStep > getMinStep();

  // 🔧 훅 초기화 상태
  const isHookInitialized = useMemo(() => {
    const hasValidCurrentStep = isValidStepNumber(currentStep);
    const hasValidStoreConnection = storeData !== null;
    const hasValidMethods = methods && handleSubmit;

    return hasValidCurrentStep && hasValidStoreConnection && hasValidMethods;
  }, [currentStep, storeData, methods, handleSubmit]);

  return {
    // 폼 메서드들
    methods,
    handleSubmit,
    onSubmit,

    // 폼 데이터
    formValues: formData,
    updateFormValue,

    // Bridge 호환 메서드들
    updateEditorContent,
    setEditorCompleted,
    setFormValues,

    // 스텝 관련
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,

    // 검증 관련
    validateCurrentStep,

    // 토스트
    addToast: safeAddToast,

    // 분석 관련
    getFormAnalytics,

    // 스텝 정보
    stepInfo: stepInformation,

    // 편의 상태들
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,

    // 훅 초기화 상태
    isHookInitialized,
  };
};
