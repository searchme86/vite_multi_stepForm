import { MultiStepFormState } from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormGetters {
  getFormValues: () => FormValues;
  getCurrentStep: () => StepNumber;
  getProgressWidth: () => number;
  getShowPreview: () => boolean;
  getEditorCompletedContent: () => string;
  getIsEditorCompleted: () => boolean;
}

/**
 * 멀티스텝 폼 Getter 함수들을 생성하는 팩토리 함수
 *
 * 변경사항 없음:
 * - 이 파일은 MIN_STEP, MAX_STEP 등을 직접 사용하지 않음
 * - 단순히 Zustand 상태값을 가져오는 함수들만 제공
 * - 초기화 순서 문제의 영향을 받지 않음
 * - 다른 파일들의 수정사항과 자동으로 호환됨
 *
 * 작동 방식:
 * 1. Zustand의 get 함수를 매개변수로 받음
 * 2. 각 상태값에 접근하는 getter 함수들을 반환
 * 3. 함수 호출 시점에 현재 상태값을 안전하게 가져옴
 *
 * @param get Zustand 스토어의 get 함수
 * @returns MultiStepFormGetters 객체
 */
export const createMultiStepFormGetters = (
  get: () => MultiStepFormState
): MultiStepFormGetters => {
  console.log('🔧 MultiStepFormGetters 생성 중... (일관성 유지)');

  return {
    /**
     * 현재 폼 값들을 가져오는 함수
     * 이유: 모든 폼 필드의 현재 값들을 한 번에 조회할 때 사용
     */
    getFormValues: () => {
      const formValues = get().formValues;
      console.log('📋 getFormValues 호출됨:', formValues);
      return formValues;
    },

    /**
     * 현재 스텝 번호를 가져오는 함수
     * 이유: 현재 진행 중인 스텝을 확인할 때 사용
     *
     * 참고: 이 값은 이제 STEP_CONFIG 기반으로 안전하게 계산된 값
     */
    getCurrentStep: () => {
      const currentStep = get().currentStep;
      console.log('📍 getCurrentStep 호출됨:', currentStep);
      return currentStep;
    },

    /**
     * 현재 진행률 퍼센트를 가져오는 함수
     * 이유: 프로그레스 바 UI 업데이트에 사용
     *
     * 참고: 이 값은 이제 STEP_CONFIG 기반으로 정확하게 계산된 값
     */
    getProgressWidth: () => {
      const progressWidth = get().progressWidth;
      console.log('📊 getProgressWidth 호출됨:', progressWidth);
      return progressWidth;
    },

    /**
     * 미리보기 패널 표시 상태를 가져오는 함수
     * 이유: 미리보기 패널의 열림/닫힘 상태 확인에 사용
     */
    getShowPreview: () => {
      const showPreview = get().showPreview;
      console.log('👀 getShowPreview 호출됨:', showPreview);
      return showPreview;
    },

    /**
     * 에디터 완성 내용을 가져오는 함수
     * 이유: 모듈화 에디터에서 작성된 최종 내용 조회에 사용
     */
    getEditorCompletedContent: () => {
      const content = get().editorCompletedContent;
      console.log(
        '📝 getEditorCompletedContent 호출됨:',
        content?.slice(0, 50) + '...'
      );
      return content;
    },

    /**
     * 에디터 완료 상태를 가져오는 함수
     * 이유: 에디터 작업이 완료되었는지 확인할 때 사용
     */
    getIsEditorCompleted: () => {
      const isCompleted = get().isEditorCompleted;
      console.log('✅ getIsEditorCompleted 호출됨:', isCompleted);
      return isCompleted;
    },
  };
};
