// bridges/editorMultiStepBridge/multiStepDataExtractor.ts

import { MultiStepFormSnapshotForBridge } from './bridgeDataTypes';
import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';

export const createMultiStepDataExtractor = () => {
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

      const snapshot: MultiStepFormSnapshotForBridge = {
        formValues,
        formCurrentStep: currentStep,
        formProgressWidth: progressWidth,
        formShowPreview: showPreview,
        formEditorCompletedContent: editorCompletedContent,
        formIsEditorCompleted: isEditorCompleted,
        snapshotTimestamp: Date.now(),
      };

      console.log('✅ [MULTISTEP_EXTRACTOR] 데이터 추출 완료:', {
        currentStep,
        hasFormValues: Object.keys(formValues).length > 0,
        editorContentLength: formValues.editorCompletedContent?.length || 0,
        isEditorCompleted: formValues.isEditorCompleted,
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

    return (
      data.formValues &&
      typeof data.formValues === 'object' &&
      typeof data.formCurrentStep === 'number' &&
      typeof data.snapshotTimestamp === 'number'
    );
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

      const { formValues } = snapshot;
      const content = formValues.editorCompletedContent || '';
      const isCompleted = Boolean(formValues.isEditorCompleted);

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

  return {
    extractMultiStepData,
    validateMultiStepData,
    getEditorContentFromMultiStep,
  };
};
