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
 * - stepCalculations에서 제공하는 계산 함수들 사용
 * - 동적 import 제거, 하드코딩 제거
 * - initialMultiStepFormState.ts와 동일한 계산 로직 공유
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
  console.log('🔧 MultiStepFormSetters 생성 중... (공유 계산 함수 버전)');

  return {
    /**
     * 전체 폼 값들을 설정하는 함수
     * 이유: 폼 전체를 한 번에 초기화하거나 복원할 때 사용
     */
    setFormValues: (formValues: FormValues) => {
      console.log('📝 setFormValues 호출됨:', formValues);
      set({ formValues });
    },

    /**
     * 특정 폼 필드의 값을 업데이트하는 함수
     * 이유: 개별 필드 변경 시 전체 폼을 다시 설정할 필요 없이 효율적으로 업데이트
     */
    updateFormValue: <K extends keyof FormValues>(
      key: K,
      value: FormValues[K]
    ) => {
      console.log(`📝 updateFormValue 호출됨: ${String(key)} =`, value);
      set((state) => ({
        formValues: {
          ...state.formValues,
          [key]: value,
        },
      }));
    },

    /**
     * 현재 스텝을 직접 설정하는 함수
     * 이유: 특정 스텝으로 직접 이동할 때 사용
     */
    setCurrentStep: (step: StepNumber) => {
      console.log('📍 setCurrentStep 호출됨:', step);
      set({ currentStep: step });
    },

    /**
     * 진행률 너비를 직접 설정하는 함수
     * 이유: 프로그레스 바 UI를 수동으로 조정할 때 사용
     */
    setProgressWidth: (width: number) => {
      console.log('📊 setProgressWidth 호출됨:', width);
      set({ progressWidth: width });
    },

    /**
     * 미리보기 패널 표시 상태를 설정하는 함수
     * 이유: 미리보기 패널을 열거나 닫을 때 사용
     */
    setShowPreview: (show: boolean) => {
      console.log('👀 setShowPreview 호출됨:', show);
      set({ showPreview: show });
    },

    /**
     * 미리보기 패널 표시 상태를 토글하는 함수
     * 이유: 미리보기 패널 열림/닫힘을 전환할 때 사용
     */
    togglePreview: () => {
      console.log('🔄 togglePreview 호출됨');
      set((state) => ({ showPreview: !state.showPreview }));
    },

    //====여기부터 수정됨====
    /**
     * 다음 스텝으로 이동하는 함수
     * 이유: 사용자가 다음 단계로 진행할 때 사용
     *
     * 변경사항: stepCalculations의 공유 함수들 사용
     */
    goToNextStep: () => {
      console.log('➡️ goToNextStep 호출됨 (공유 계산 함수)');
      set((state) => {
        const currentStep = state.currentStep;

        // initialMultiStepFormState.ts와 동일한 계산 로직 사용
        const maxStep = stepCalculations.calculateMaxStep();
        const nextStepNumber = currentStep + 1;

        console.log('➡️ 다음 스텝 계산:', {
          currentStep,
          nextStepNumber,
          maxStep,
        });

        // 다음 스텝이 유효한 범위 내인지 확인
        const nextStep: StepNumber =
          nextStepNumber <= maxStep &&
          stepCalculations.isSafeValidStepNumber(nextStepNumber)
            ? nextStepNumber
            : state.currentStep;

        // 공유 계산 함수로 진행률 계산
        const progress = stepCalculations.calculateProgressWidth(nextStep);

        console.log(
          `➡️ 스텝 이동 완료: ${currentStep} → ${nextStep} (진행률: ${progress.toFixed(
            1
          )}%)`
        );

        return {
          currentStep: nextStep,
          progressWidth: progress,
        };
      });
    },

    /**
     * 이전 스텝으로 이동하는 함수
     * 이유: 사용자가 이전 단계로 돌아갈 때 사용
     *
     * 변경사항: stepCalculations의 공유 함수들 사용
     */
    goToPrevStep: () => {
      console.log('⬅️ goToPrevStep 호출됨 (공유 계산 함수)');
      set((state) => {
        const currentStep = state.currentStep;

        // initialMultiStepFormState.ts와 동일한 계산 로직 사용
        const minStep = stepCalculations.calculateMinStep();
        const prevStepNumber = currentStep - 1;

        console.log('⬅️ 이전 스텝 계산:', {
          currentStep,
          prevStepNumber,
          minStep,
        });

        // 이전 스텝이 유효한 범위 내인지 확인
        const prevStep: StepNumber =
          prevStepNumber >= minStep &&
          stepCalculations.isSafeValidStepNumber(prevStepNumber)
            ? prevStepNumber
            : state.currentStep;

        // 공유 계산 함수로 진행률 계산
        const progress = stepCalculations.calculateProgressWidth(prevStep);

        console.log(
          `⬅️ 스텝 이동 완료: ${currentStep} → ${prevStep} (진행률: ${progress.toFixed(
            1
          )}%)`
        );

        return {
          currentStep: prevStep,
          progressWidth: progress,
        };
      });
    },

    /**
     * 특정 스텝으로 직접 이동하는 함수
     * 이유: 스텝 네비게이션이나 특정 조건에 따른 스텝 점프 시 사용
     *
     * 변경사항: stepCalculations의 공유 함수들 사용
     */
    goToStep: (step: StepNumber) => {
      console.log('🎯 goToStep 호출됨 (공유 계산 함수):', step);
      set(() => {
        // initialMultiStepFormState.ts와 동일한 계산 로직 사용
        const minStep = stepCalculations.calculateMinStep();

        console.log('🎯 스텝 점프 검증:', { targetStep: step, minStep });

        // 목표 스텝이 유효한지 확인
        const targetStep: StepNumber = stepCalculations.isSafeValidStepNumber(
          step
        )
          ? step
          : minStep; // fallback으로 최소 스텝 사용

        // 공유 계산 함수로 진행률 계산
        const progress = stepCalculations.calculateProgressWidth(targetStep);

        console.log(
          `🎯 스텝 점프 완료: → ${targetStep} (진행률: ${progress.toFixed(1)}%)`
        );

        return {
          currentStep: targetStep,
          progressWidth: progress,
        };
      });
    },
    //====여기까지 수정됨====

    /**
     * 에디터 내용을 업데이트하는 함수
     * 이유: 모듈화 에디터에서 작성된 내용을 상태에 저장할 때 사용
     */
    updateEditorContent: (content: string) => {
      console.log(
        '📝 updateEditorContent 호출됨:',
        content?.slice(0, 50) + '...'
      );
      set((state) => ({
        editorCompletedContent: content,
        formValues: {
          ...state.formValues,
          editorCompletedContent: content,
        },
      }));
    },

    /**
     * 에디터 완료 상태를 설정하는 함수
     * 이유: 에디터 작업이 완료되었는지 표시할 때 사용
     */
    setEditorCompleted: (completed: boolean) => {
      console.log('✅ setEditorCompleted 호출됨:', completed);
      set((state) => ({
        isEditorCompleted: completed,
        formValues: {
          ...state.formValues,
          isEditorCompleted: completed,
        },
      }));
    },
  };
};
