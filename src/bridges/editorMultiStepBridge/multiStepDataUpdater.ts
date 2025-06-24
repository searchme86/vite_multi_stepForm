// bridges/editorMultiStepBridge/multiStepDataUpdater.ts

import { useMultiStepFormStore } from '../../components/multiStepForm/store/multiStepForm/multiStepFormStore';
import { EditorToMultiStepDataTransformationResult } from './bridgeDataTypes';
import { FormValues } from '../../components/multiStepForm/types/formTypes';

// 🔧 타입 안전성을 위한 인터페이스 정의
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

export const createMultiStepStateUpdater = () => {
  const validateResult = (
    result: EditorToMultiStepDataTransformationResult
  ): boolean => {
    console.log('🔍 [UPDATER] 변환 결과 검증');

    if (!result) {
      console.error('❌ [UPDATER] 변환 결과가 null');
      return false;
    }

    const {
      transformedContent,
      transformedIsCompleted,
      transformedMetadata,
      transformationSuccess,
      transformationErrors,
    } = result;

    const hasValidContent = typeof transformedContent === 'string';
    const hasValidCompleted = typeof transformedIsCompleted === 'boolean';
    const hasValidMetadata =
      transformedMetadata && typeof transformedMetadata === 'object';
    const hasValidSuccess = typeof transformationSuccess === 'boolean';
    const hasValidErrors = Array.isArray(transformationErrors);

    const isValid =
      hasValidContent &&
      hasValidCompleted &&
      hasValidMetadata &&
      hasValidSuccess &&
      hasValidErrors &&
      transformationSuccess;

    console.log('📊 [UPDATER] 검증 결과:', {
      hasValidContent,
      hasValidCompleted,
      hasValidMetadata,
      hasValidSuccess,
      hasValidErrors,
      transformationSuccess,
      isValid,
      contentLength: transformedContent?.length || 0,
    });

    return isValid;
  };

  const getCurrentState = () => {
    console.log('🔍 [UPDATER] 현재 상태 조회');

    try {
      const store = useMultiStepFormStore.getState() as MultiStepStore;

      if (!store) {
        console.error('❌ [UPDATER] 멀티스텝 스토어 없음');
        return null;
      }

      // 🔧 타입 안전한 기본값 설정
      const safeFormValues: FormValues = store.formValues || {
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

      const {
        currentStep = 1,
        progressWidth = 0,
        showPreview = false,
        editorCompletedContent = '',
        isEditorCompleted = false,
      } = store;

      const currentState = {
        formValues: safeFormValues,
        currentStep,
        progressWidth,
        showPreview,
        editorCompletedContent,
        isEditorCompleted,
      };

      console.log('✅ [UPDATER] 상태 조회 완료:', {
        currentStep,
        hasFormValues: Object.keys(safeFormValues).length > 0,
        contentLength: editorCompletedContent.length,
        isEditorCompleted,
        formValuesEditorContent:
          safeFormValues.editorCompletedContent?.length || 0,
        formValuesEditorCompleted: safeFormValues.isEditorCompleted,
      });

      return currentState;
    } catch (error) {
      console.error('❌ [UPDATER] 상태 조회 실패:', error);
      return null;
    }
  };

  // 🔧 강화된 에디터 콘텐츠 업데이트
  const updateEditorContent = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 에디터 콘텐츠 업데이트');

    if (!validateResult(result)) {
      console.error('❌ [UPDATER] 유효하지 않은 결과');
      return false;
    }

    try {
      const { transformedContent, transformedIsCompleted } = result;
      const store = useMultiStepFormStore.getState() as MultiStepStore;

      if (!store) {
        console.error('❌ [UPDATER] 스토어 접근 불가');
        return false;
      }

      console.log('📊 [UPDATER] 업데이트할 데이터:', {
        contentLength: transformedContent.length,
        isCompleted: transformedIsCompleted,
        storeAvailable: !!store,
      });

      // 🔧 1단계: 스토어 레벨 에디터 콘텐츠 업데이트
      const {
        updateEditorContent: storeUpdateContent,
        setEditorCompleted: storeSetCompleted,
        updateFormValue,
      } = store;

      // 🔧 스토어 함수 존재 여부 확인
      console.log('🔍 [UPDATER] 사용 가능한 스토어 함수들:', {
        hasUpdateEditorContent: typeof storeUpdateContent === 'function',
        hasSetEditorCompleted: typeof storeSetCompleted === 'function',
        hasUpdateFormValue: typeof updateFormValue === 'function',
        storeKeys: Object.keys(store),
      });

      let updateSuccess = false;

      // 🔧 2단계: 스토어 레벨 업데이트 시도
      if (typeof storeUpdateContent === 'function') {
        console.log('🔄 [UPDATER] 스토어 레벨 콘텐츠 업데이트 실행');
        storeUpdateContent(transformedContent);
        updateSuccess = true;
      }

      if (typeof storeSetCompleted === 'function') {
        console.log('🔄 [UPDATER] 스토어 레벨 완료 상태 업데이트 실행');
        storeSetCompleted(transformedIsCompleted);
        updateSuccess = true;
      }

      // 🔧 3단계: FormValues 레벨 업데이트 시도 (중요!)
      if (typeof updateFormValue === 'function') {
        console.log('🔄 [UPDATER] FormValues 레벨 업데이트 실행');

        // editorCompletedContent 업데이트
        updateFormValue('editorCompletedContent', transformedContent);
        console.log(
          '✅ [UPDATER] FormValues.editorCompletedContent 업데이트 완료'
        );

        // isEditorCompleted 업데이트
        updateFormValue('isEditorCompleted', transformedIsCompleted);
        console.log('✅ [UPDATER] FormValues.isEditorCompleted 업데이트 완료');

        updateSuccess = true;
      }

      // 🔧 4단계: 업데이트 결과 검증
      if (updateSuccess) {
        // 잠시 후 상태 재확인
        setTimeout(() => {
          const updatedState = getCurrentState();
          console.log('🔍 [UPDATER] 업데이트 후 상태 검증:', {
            storeEditorContent:
              updatedState?.editorCompletedContent?.length || 0,
            storeEditorCompleted: updatedState?.isEditorCompleted,
            formEditorContent:
              updatedState?.formValues?.editorCompletedContent?.length || 0,
            formEditorCompleted: updatedState?.formValues?.isEditorCompleted,
            expectedContentLength: transformedContent.length,
            expectedCompleted: transformedIsCompleted,
          });
        }, 100);

        console.log('✅ [UPDATER] 에디터 콘텐츠 업데이트 성공:', {
          contentLength: transformedContent.length,
          isCompleted: transformedIsCompleted,
          updateMethods: {
            storeLevel:
              typeof storeUpdateContent === 'function' &&
              typeof storeSetCompleted === 'function',
            formLevel: typeof updateFormValue === 'function',
          },
        });

        return true;
      } else {
        console.error('❌ [UPDATER] 업데이트 함수들을 찾을 수 없음');
        return false;
      }
    } catch (error) {
      console.error('❌ [UPDATER] 업데이트 중 오류:', error);
      return false;
    }
  };

  // 🔧 강화된 폼 필드 업데이트
  const updateFormField = async <K extends keyof FormValues>(
    fieldName: K,
    fieldValue: FormValues[K]
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 폼 필드 업데이트:', { fieldName, fieldValue });

    if (
      !fieldName ||
      (typeof fieldName === 'string' && fieldName.trim().length === 0)
    ) {
      console.error('❌ [UPDATER] 유효하지 않은 필드명:', fieldName);
      return false;
    }

    try {
      const store = useMultiStepFormStore.getState() as MultiStepStore;

      if (!store) {
        console.error('❌ [UPDATER] 스토어 접근 불가');
        return false;
      }

      const { updateFormValue } = store;

      if (typeof updateFormValue !== 'function') {
        console.error('❌ [UPDATER] updateFormValue 함수 없음');

        // 🔧 fallback: 직접 상태 조작 시도
        try {
          console.log('🔄 [UPDATER] fallback: 직접 상태 조작 시도');

          // 🔧 타입 안전한 현재 FormValues 가져오기
          const currentFormValues: FormValues = store.formValues || {
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

          const updatedFormValues: FormValues = {
            ...currentFormValues,
            [fieldName]: fieldValue,
          };

          // 직접 상태 설정 시도 (만약 setFormValues 같은 함수가 있다면)
          if (typeof store.setFormValues === 'function') {
            store.setFormValues(updatedFormValues);
            console.log('✅ [UPDATER] fallback 업데이트 성공');
            return true;
          }
        } catch (fallbackError) {
          console.error('❌ [UPDATER] fallback도 실패:', fallbackError);
        }

        return false;
      }

      updateFormValue(fieldName, fieldValue);

      console.log('✅ [UPDATER] 폼 필드 업데이트 완료:', { fieldName });
      return true;
    } catch (error) {
      console.error('❌ [UPDATER] 폼 필드 업데이트 실패:', error);
      return false;
    }
  };

  // 🔧 강화된 전체 상태 업데이트
  const performCompleteStateUpdate = async (
    result: EditorToMultiStepDataTransformationResult
  ): Promise<boolean> => {
    console.log('🔄 [UPDATER] 전체 상태 업데이트 시작');
    console.log('📊 [UPDATER] 업데이트할 결과 데이터:', {
      transformedContent: result.transformedContent?.substring(0, 100) + '...',
      transformedContentLength: result.transformedContent?.length || 0,
      transformedIsCompleted: result.transformedIsCompleted,
      transformationSuccess: result.transformationSuccess,
      hasMetadata: !!result.transformedMetadata,
    });

    const startTime = performance.now();

    try {
      // 🔧 1단계: 에디터 콘텐츠 업데이트 (핵심!)
      const editorUpdateSuccess = await updateEditorContent(result);
      if (!editorUpdateSuccess) {
        console.error('❌ [UPDATER] 에디터 콘텐츠 업데이트 실패');
        return false;
      }

      // 🔧 2단계: 추가 폼 필드 업데이트 (안전장치)
      const { transformedContent, transformedIsCompleted } = result;

      const contentUpdateSuccess = await updateFormField(
        'editorCompletedContent',
        transformedContent
      );

      const completedUpdateSuccess = await updateFormField(
        'isEditorCompleted',
        transformedIsCompleted
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      const overallSuccess =
        editorUpdateSuccess && contentUpdateSuccess && completedUpdateSuccess;

      console.log('📊 [UPDATER] 전체 업데이트 결과:', {
        editorUpdateSuccess,
        contentUpdateSuccess,
        completedUpdateSuccess,
        overallSuccess,
        duration: `${duration.toFixed(2)}ms`,
        finalContentLength: transformedContent.length,
        finalCompleted: transformedIsCompleted,
      });

      if (overallSuccess) {
        console.log('✅ [UPDATER] 전체 업데이트 완료');

        // 🔧 최종 검증
        setTimeout(() => {
          const finalState = getCurrentState();

          // 🔧 타입 안전한 접근
          const storeContent = finalState?.editorCompletedContent?.length || 0;
          const storeCompleted = finalState?.isEditorCompleted;
          const formContent =
            finalState?.formValues?.editorCompletedContent?.length || 0;
          const formCompleted = finalState?.formValues?.isEditorCompleted;

          console.log('🔍 [UPDATER] 최종 상태 검증:', {
            storeContent,
            storeCompleted,
            formContent,
            formCompleted,
            expectedContent: transformedContent.length,
            expectedCompleted: transformedIsCompleted,
            synchronizationSuccess:
              formContent > 0 && formCompleted === transformedIsCompleted,
          });
        }, 200);

        return true;
      } else {
        console.error('❌ [UPDATER] 일부 업데이트 실패');
        return false;
      }
    } catch (error) {
      console.error('❌ [UPDATER] 전체 업데이트 중 오류:', error);
      return false;
    }
  };

  return {
    validateTransformationResult: validateResult,
    getCurrentMultiStepState: getCurrentState,
    updateEditorContentInMultiStep: updateEditorContent,
    updateFormValueInMultiStep: updateFormField,
    performCompleteStateUpdate,
  };
};
