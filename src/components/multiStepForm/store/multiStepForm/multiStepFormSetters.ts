// src/components/multiStepForm/store/multiStepForm/multiStepFormSetters.ts

import {
  MultiStepFormState,
  stepCalculations,
} from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormSetters {
  setFormValues: (formValues: FormValues) => void;
  updateFormValue: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  setCurrentStep: (step: StepNumber) => void;
  setProgressWidth: (width: number) => void;
  setShowPreview: (show: boolean) => void;
  togglePreview: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: StepNumber) => void;
  updateEditorContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
}

/**
 * 멀티스텝 폼 Setter 함수들을 생성하는 팩토리 함수
 *
 * 변경사항:
 * - 타입단언 제거
 * - 구조분해할당과 fallback 처리 추가
 * - 점 연산자를 구조분해할당으로 변경
 * - 실무형 타입 변환 방법 사용
 * - 에러 처리 및 디버깅 로그 강화
 *
 * @param set Zustand 스토어의 set 함수
 * @returns MultiStepFormSetters 객체
 */
export const createMultiStepFormSetters = (
  set: (
    partial:
      | Partial<MultiStepFormState>
      | ((state: MultiStepFormState) => Partial<MultiStepFormState>)
  ) => void
): MultiStepFormSetters => {
  console.log('🔧 [SETTERS] MultiStepFormSetters 생성 중...');

  return {
    /**
     * 전체 폼 값들을 설정하는 함수
     * 수정사항: 에러 처리와 디버깅 로그 추가
     */
    setFormValues: (formValues: FormValues) => {
      try {
        console.log('📝 [SETTERS] setFormValues 호출됨:', {
          hasUserImage: !!formValues.userImage,
          nickname: formValues.nickname || '없음',
          title: formValues.title || '없음',
          timestamp: new Date().toISOString(),
        });

        set({ formValues });

        console.log('✅ [SETTERS] setFormValues 완료');
      } catch (error) {
        console.error('❌ [SETTERS] setFormValues 오류:', error);
      }
    },

    /**
     * 특정 폼 필드의 값을 업데이트하는 함수
     * 수정사항: 구조분해할당과 에러 처리 추가
     */
    updateFormValue: <K extends keyof FormValues>(
      key: K,
      value: FormValues[K]
    ) => {
      try {
        console.log('📝 [SETTERS] updateFormValue 호출됨:', {
          fieldName: String(key),
          valueType: typeof value,
          valueLength: typeof value === 'string' ? value.length : 0,
          timestamp: new Date().toISOString(),
        });

        set((state) => {
          const { formValues: currentFormValues } = state;

          // 현재 폼 값이 없는 경우 기본값 사용
          const safeFormValues = currentFormValues || {
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

          return {
            formValues: {
              ...safeFormValues,
              [key]: value,
            },
          };
        });

        console.log('✅ [SETTERS] updateFormValue 완료:', String(key));
      } catch (error) {
        console.error('❌ [SETTERS] updateFormValue 오류:', {
          fieldName: String(key),
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 현재 스텝을 직접 설정하는 함수
     * 수정사항: 유효성 검증과 에러 처리 추가
     */
    setCurrentStep: (step: StepNumber) => {
      try {
        console.log('📍 [SETTERS] setCurrentStep 호출됨:', {
          newStep: step,
          timestamp: new Date().toISOString(),
        });

        // 스텝 유효성 검증
        if (typeof step !== 'number' || step < 1 || step > 5) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 스텝 번호:', step);
          return;
        }

        set({ currentStep: step });

        console.log('✅ [SETTERS] setCurrentStep 완료:', step);
      } catch (error) {
        console.error('❌ [SETTERS] setCurrentStep 오류:', {
          step,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 진행률 너비를 직접 설정하는 함수
     * 수정사항: 유효성 검증과 에러 처리 추가
     */
    setProgressWidth: (width: number) => {
      try {
        console.log('📊 [SETTERS] setProgressWidth 호출됨:', {
          newWidth: width,
          timestamp: new Date().toISOString(),
        });

        // 진행률 유효성 검증
        if (typeof width !== 'number' || width < 0 || width > 100) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 진행률:', width);
          return;
        }

        set({ progressWidth: width });

        console.log('✅ [SETTERS] setProgressWidth 완료:', width);
      } catch (error) {
        console.error('❌ [SETTERS] setProgressWidth 오류:', {
          width,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 미리보기 패널 표시 상태를 설정하는 함수
     * 수정사항: 유효성 검증과 에러 처리 추가
     */
    setShowPreview: (show: boolean) => {
      try {
        console.log('👀 [SETTERS] setShowPreview 호출됨:', {
          newShowState: show,
          timestamp: new Date().toISOString(),
        });

        // boolean 타입 검증
        if (typeof show !== 'boolean') {
          console.warn('⚠️ [SETTERS] 유효하지 않은 미리보기 상태:', show);
          return;
        }

        set({ showPreview: show });

        console.log('✅ [SETTERS] setShowPreview 완료:', show);
      } catch (error) {
        console.error('❌ [SETTERS] setShowPreview 오류:', {
          show,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 미리보기 패널 표시 상태를 토글하는 함수
     * 수정사항: 구조분해할당과 에러 처리 추가
     */
    togglePreview: () => {
      try {
        console.log('🔄 [SETTERS] togglePreview 호출됨');

        set((state) => {
          const { showPreview: currentShowPreview } = state;

          // 현재 상태가 boolean이 아닌 경우 기본값 사용
          const safeCurrentShow =
            typeof currentShowPreview === 'boolean'
              ? currentShowPreview
              : false;
          const newShowState = !safeCurrentShow;

          console.log('🔄 [SETTERS] 미리보기 토글:', {
            from: safeCurrentShow,
            to: newShowState,
            timestamp: new Date().toISOString(),
          });

          return { showPreview: newShowState };
        });

        console.log('✅ [SETTERS] togglePreview 완료');
      } catch (error) {
        console.error('❌ [SETTERS] togglePreview 오류:', {
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 다음 스텝으로 이동하는 함수
     * 수정사항: stepCalculations 공유 함수 사용, 구조분해할당 추가
     */
    goToNextStep: () => {
      try {
        console.log('➡️ [SETTERS] goToNextStep 호출됨');

        set((state) => {
          const { currentStep } = state;

          // 현재 스텝이 유효하지 않은 경우 기본값 사용
          const safeCurrentStep =
            typeof currentStep === 'number' &&
            currentStep >= 1 &&
            currentStep <= 5
              ? currentStep
              : 1;

          // initialMultiStepFormState.ts와 동일한 계산 로직 사용
          const maxStep = stepCalculations.calculateMaxStep();
          const nextStepNumber = safeCurrentStep + 1;

          console.log('➡️ [SETTERS] 다음 스텝 계산:', {
            currentStep: safeCurrentStep,
            nextStepNumber,
            maxStep,
            timestamp: new Date().toISOString(),
          });

          // 다음 스텝이 유효한 범위 내인지 확인
          const nextStep: StepNumber =
            nextStepNumber <= maxStep &&
            stepCalculations.isSafeValidStepNumber(nextStepNumber)
              ? nextStepNumber
              : safeCurrentStep;

          // 공유 계산 함수로 진행률 계산
          const progress = stepCalculations.calculateProgressWidth(nextStep);

          console.log(
            `➡️ [SETTERS] 스텝 이동 완료: ${safeCurrentStep} → ${nextStep} (진행률: ${progress.toFixed(
              1
            )}%)`
          );

          return {
            currentStep: nextStep,
            progressWidth: progress,
          };
        });

        console.log('✅ [SETTERS] goToNextStep 완료');
      } catch (error) {
        console.error('❌ [SETTERS] goToNextStep 오류:', {
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 이전 스텝으로 이동하는 함수
     * 수정사항: stepCalculations 공유 함수 사용, 구조분해할당 추가
     */
    goToPrevStep: () => {
      try {
        console.log('⬅️ [SETTERS] goToPrevStep 호출됨');

        set((state) => {
          const { currentStep } = state;

          // 현재 스텝이 유효하지 않은 경우 기본값 사용
          const safeCurrentStep =
            typeof currentStep === 'number' &&
            currentStep >= 1 &&
            currentStep <= 5
              ? currentStep
              : 1;

          // initialMultiStepFormState.ts와 동일한 계산 로직 사용
          const minStep = stepCalculations.calculateMinStep();
          const prevStepNumber = safeCurrentStep - 1;

          console.log('⬅️ [SETTERS] 이전 스텝 계산:', {
            currentStep: safeCurrentStep,
            prevStepNumber,
            minStep,
            timestamp: new Date().toISOString(),
          });

          // 이전 스텝이 유효한 범위 내인지 확인
          const prevStep: StepNumber =
            prevStepNumber >= minStep &&
            stepCalculations.isSafeValidStepNumber(prevStepNumber)
              ? prevStepNumber
              : safeCurrentStep;

          // 공유 계산 함수로 진행률 계산
          const progress = stepCalculations.calculateProgressWidth(prevStep);

          console.log(
            `⬅️ [SETTERS] 스텝 이동 완료: ${safeCurrentStep} → ${prevStep} (진행률: ${progress.toFixed(
              1
            )}%)`
          );

          return {
            currentStep: prevStep,
            progressWidth: progress,
          };
        });

        console.log('✅ [SETTERS] goToPrevStep 완료');
      } catch (error) {
        console.error('❌ [SETTERS] goToPrevStep 오류:', {
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 특정 스텝으로 직접 이동하는 함수
     * 수정사항: stepCalculations 공유 함수 사용, 구조분해할당 추가
     */
    goToStep: (step: StepNumber) => {
      try {
        console.log('🎯 [SETTERS] goToStep 호출됨:', {
          targetStep: step,
          timestamp: new Date().toISOString(),
        });

        set(() => {
          // initialMultiStepFormState.ts와 동일한 계산 로직 사용
          const minStep = stepCalculations.calculateMinStep();

          console.log('🎯 [SETTERS] 스텝 점프 검증:', {
            targetStep: step,
            minStep,
            timestamp: new Date().toISOString(),
          });

          // 목표 스텝이 유효한지 확인
          const targetStep: StepNumber = stepCalculations.isSafeValidStepNumber(
            step
          )
            ? step
            : minStep; // fallback으로 최소 스텝 사용

          // 공유 계산 함수로 진행률 계산
          const progress = stepCalculations.calculateProgressWidth(targetStep);

          console.log(
            `🎯 [SETTERS] 스텝 점프 완료: → ${targetStep} (진행률: ${progress.toFixed(
              1
            )}%)`
          );

          return {
            currentStep: targetStep,
            progressWidth: progress,
          };
        });

        console.log('✅ [SETTERS] goToStep 완료');
      } catch (error) {
        console.error('❌ [SETTERS] goToStep 오류:', {
          step,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 에디터 내용을 업데이트하는 함수
     * 수정사항: 구조분해할당과 에러 처리 추가
     */
    updateEditorContent: (content: string) => {
      try {
        console.log('📝 [SETTERS] updateEditorContent 호출됨:', {
          contentLength: content?.length || 0,
          hasContent: !!content,
          preview: content?.slice(0, 50) + (content?.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });

        // 문자열 유효성 검증
        if (typeof content !== 'string') {
          console.warn(
            '⚠️ [SETTERS] 유효하지 않은 에디터 내용:',
            typeof content
          );
          return;
        }

        set((state) => {
          const { formValues: currentFormValues } = state;

          // 현재 폼 값이 없는 경우 기본값 사용
          const safeFormValues = currentFormValues || {
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

          return {
            editorCompletedContent: content,
            formValues: {
              ...safeFormValues,
              editorCompletedContent: content,
            },
          };
        });

        console.log('✅ [SETTERS] updateEditorContent 완료');
      } catch (error) {
        console.error('❌ [SETTERS] updateEditorContent 오류:', {
          contentLength: content?.length || 0,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * 에디터 완료 상태를 설정하는 함수
     * 수정사항: 구조분해할당과 에러 처리 추가
     */
    setEditorCompleted: (completed: boolean) => {
      try {
        console.log('✅ [SETTERS] setEditorCompleted 호출됨:', {
          completed,
          timestamp: new Date().toISOString(),
        });

        // boolean 타입 검증
        if (typeof completed !== 'boolean') {
          console.warn(
            '⚠️ [SETTERS] 유효하지 않은 에디터 완료 상태:',
            completed
          );
          return;
        }

        set((state) => {
          const { formValues: currentFormValues } = state;

          // 현재 폼 값이 없는 경우 기본값 사용
          const safeFormValues = currentFormValues || {
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

          return {
            isEditorCompleted: completed,
            formValues: {
              ...safeFormValues,
              isEditorCompleted: completed,
            },
          };
        });

        console.log('✅ [SETTERS] setEditorCompleted 완료');
      } catch (error) {
        console.error('❌ [SETTERS] setEditorCompleted 오류:', {
          completed,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };
};

console.log('📄 [SETTERS] multiStepFormSetters 모듈 로드 완료');
