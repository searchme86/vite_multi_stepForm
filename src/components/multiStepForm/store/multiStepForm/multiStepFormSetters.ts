// src/components/multiStepForm/store/multiStepForm/multiStepFormSetters.ts

import {
  MultiStepFormState,
  stepCalculations,
} from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

// 🔧 Bridge 전송 결과 인터페이스
interface BridgeTransferResult {
  readonly success: boolean;
  readonly content: string;
  readonly isCompleted: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly duration: number;
  readonly timestamp: number;
}

// 🔧 Bridge 상태 인터페이스
interface BridgeState {
  readonly isTransferInProgress: boolean;
  readonly lastTransferResult: BridgeTransferResult | null;
  readonly errorMessage: string;
  readonly transferCount: number;
  readonly lastTransferTime: number | null;
  readonly isConnected: boolean;
}

// 🔧 확장된 MultiStepFormState (Bridge 상태 포함)
interface ExtendedMultiStepFormState extends MultiStepFormState {
  readonly bridgeState?: BridgeState;
}

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

  // 🔧 Bridge 관련 액션들 추가
  setBridgeTransferInProgress: (inProgress: boolean) => void;
  setBridgeTransferResult: (result: BridgeTransferResult | null) => void;
  setBridgeErrorMessage: (errorMessage: string) => void;
  setBridgeConnected: (connected: boolean) => void;
  triggerBridgeTransfer: () => Promise<boolean>;
  resetBridgeState: () => void;
  updateEditorFromBridge: (content: string, isCompleted: boolean) => void;
  incrementBridgeTransferCount: () => void;
}

/**
 * 멀티스텝 폼 Setter 함수들을 생성하는 팩토리 함수
 *
 * 변경사항:
 * - Bridge 관련 액션들 추가
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
      | Partial<ExtendedMultiStepFormState>
      | ((
          state: ExtendedMultiStepFormState
        ) => Partial<ExtendedMultiStepFormState>)
  ) => void
): MultiStepFormSetters => {
  console.log('🔧 [SETTERS] MultiStepFormSetters 생성 중...');

  // 🔧 기본 Bridge 상태 생성 함수
  const createDefaultBridgeState = (): BridgeState => {
    console.log('🌉 [SETTERS] 기본 Bridge 상태 생성');

    return {
      isTransferInProgress: false,
      lastTransferResult: null,
      errorMessage: '',
      transferCount: 0,
      lastTransferTime: null,
      isConnected: false,
    };
  };

  // 🔧 안전한 Bridge 상태 접근 함수
  const getSafeBridgeState = (
    state: ExtendedMultiStepFormState
  ): BridgeState => {
    const { bridgeState } = state;

    if (bridgeState && typeof bridgeState === 'object') {
      return bridgeState;
    }

    console.log('🔧 [SETTERS] Bridge 상태가 없어서 기본값 생성');
    return createDefaultBridgeState();
  };

  // 🔧 안전한 에러 메시지 추출
  const extractSafeErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
      return error.length > 0 ? error : '알 수 없는 에러';
    }

    if (error instanceof Error) {
      return error.message.length > 0 ? error.message : '알 수 없는 에러';
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorObject = error;
      const messageValue = Reflect.get(errorObject, 'message');
      return typeof messageValue === 'string'
        ? messageValue
        : '알 수 없는 에러';
    }

    return '브릿지 시스템 에러';
  };

  // 🔧 Bridge 전송 결과 타입 가드
  const isBridgeTransferResult = (
    data: unknown
  ): data is BridgeTransferResult => {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const result = data;
    const hasSuccess = 'success' in result;
    const hasContent = 'content' in result;
    const hasIsCompleted = 'isCompleted' in result;

    if (!hasSuccess || !hasContent || !hasIsCompleted) {
      return false;
    }

    const successValue = Reflect.get(result, 'success');
    const contentValue = Reflect.get(result, 'content');
    const isCompletedValue = Reflect.get(result, 'isCompleted');

    return (
      typeof successValue === 'boolean' &&
      typeof contentValue === 'string' &&
      typeof isCompletedValue === 'boolean'
    );
  };

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

    // 🔧 ============ Bridge 관련 새로운 액션들 ============

    /**
     * Bridge 전송 진행 상태를 설정하는 함수
     * 수정사항: Bridge 상태 안전 접근, 타입 검증 추가
     */
    setBridgeTransferInProgress: (inProgress: boolean) => {
      try {
        console.log('🌉 [SETTERS] setBridgeTransferInProgress 호출됨:', {
          inProgress,
          timestamp: new Date().toISOString(),
        });

        // boolean 타입 검증
        if (typeof inProgress !== 'boolean') {
          console.warn(
            '⚠️ [SETTERS] 유효하지 않은 전송 진행 상태:',
            inProgress
          );
          return;
        }

        set((state) => {
          const currentBridgeState = getSafeBridgeState(state);

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            isTransferInProgress: inProgress,
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        console.log(
          '✅ [SETTERS] setBridgeTransferInProgress 완료:',
          inProgress
        );
      } catch (error) {
        console.error('❌ [SETTERS] setBridgeTransferInProgress 오류:', {
          inProgress,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge 전송 결과를 설정하는 함수
     * 수정사항: 타입 가드 사용, 안전한 상태 업데이트
     */
    setBridgeTransferResult: (result: BridgeTransferResult | null) => {
      try {
        console.log('🌉 [SETTERS] setBridgeTransferResult 호출됨:', {
          hasResult: !!result,
          resultType: typeof result,
          timestamp: new Date().toISOString(),
        });

        // 결과 타입 검증
        if (result !== null && !isBridgeTransferResult(result)) {
          console.warn('⚠️ [SETTERS] 유효하지 않은 Bridge 전송 결과:', result);
          return;
        }

        set((state) => {
          const currentBridgeState = getSafeBridgeState(state);

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            lastTransferResult: result,
            lastTransferTime: result
              ? Date.now()
              : currentBridgeState.lastTransferTime,
            isTransferInProgress: false, // 결과가 오면 전송 완료
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        console.log('✅ [SETTERS] setBridgeTransferResult 완료');
      } catch (error) {
        console.error('❌ [SETTERS] setBridgeTransferResult 오류:', {
          hasResult: !!result,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge 에러 메시지를 설정하는 함수
     * 수정사항: 안전한 에러 메시지 추출, 상태 업데이트
     */
    setBridgeErrorMessage: (errorMessage: string) => {
      try {
        console.log('🌉 [SETTERS] setBridgeErrorMessage 호출됨:', {
          hasError: !!errorMessage,
          errorLength: errorMessage?.length || 0,
          timestamp: new Date().toISOString(),
        });

        // 문자열 타입 검증
        const safeErrorMessage =
          typeof errorMessage === 'string' ? errorMessage : '';

        set((state) => {
          const currentBridgeState = getSafeBridgeState(state);

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            errorMessage: safeErrorMessage,
            isTransferInProgress: false, // 에러가 발생하면 전송 중단
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        console.log('✅ [SETTERS] setBridgeErrorMessage 완료');
      } catch (error) {
        console.error('❌ [SETTERS] setBridgeErrorMessage 오류:', {
          errorMessage,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge 연결 상태를 설정하는 함수
     * 수정사항: boolean 타입 검증, 안전한 상태 업데이트
     */
    setBridgeConnected: (connected: boolean) => {
      try {
        console.log('🌉 [SETTERS] setBridgeConnected 호출됨:', {
          connected,
          timestamp: new Date().toISOString(),
        });

        // boolean 타입 검증
        if (typeof connected !== 'boolean') {
          console.warn('⚠️ [SETTERS] 유효하지 않은 연결 상태:', connected);
          return;
        }

        set((state) => {
          const currentBridgeState = getSafeBridgeState(state);

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            isConnected: connected,
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        console.log('✅ [SETTERS] setBridgeConnected 완료:', connected);
      } catch (error) {
        console.error('❌ [SETTERS] setBridgeConnected 오류:', {
          connected,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge 전송을 트리거하는 비동기 함수
     * 수정사항: 안전한 비동기 처리, 상태 관리 통합
     */
    triggerBridgeTransfer: async (): Promise<boolean> => {
      try {
        console.log('🚀 [SETTERS] triggerBridgeTransfer 호출됨');

        // 전송 시작 상태 설정
        set((currentState) => {
          const currentBridgeState = getSafeBridgeState(currentState);

          if (currentBridgeState.isTransferInProgress) {
            console.warn('⚠️ [SETTERS] 이미 전송이 진행 중');
            return currentState; // 상태 변경 없음
          }

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            isTransferInProgress: true,
            errorMessage: '', // 에러 메시지 초기화
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        // 실제 Bridge 전송은 외부에서 처리
        // 이 함수는 상태 관리만 담당
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log('✅ [SETTERS] triggerBridgeTransfer 완료');
        return true;
      } catch (error) {
        const errorMessage = extractSafeErrorMessage(error);
        console.error('❌ [SETTERS] triggerBridgeTransfer 오류:', errorMessage);

        // 에러 상태 설정
        set((currentState) => {
          const currentBridgeState = getSafeBridgeState(currentState);

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            isTransferInProgress: false,
            errorMessage,
          };

          return {
            bridgeState: updatedBridgeState,
          };
        });

        return false;
      }
    },

    /**
     * Bridge 상태를 초기화하는 함수
     * 수정사항: 완전한 상태 초기화, 안전한 기본값 설정
     */
    resetBridgeState: () => {
      try {
        console.log('🔄 [SETTERS] resetBridgeState 호출됨');

        set(() => {
          const resetBridgeState = createDefaultBridgeState();

          return {
            bridgeState: resetBridgeState,
          };
        });

        console.log('✅ [SETTERS] resetBridgeState 완료');
      } catch (error) {
        console.error('❌ [SETTERS] resetBridgeState 오류:', {
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge에서 받은 데이터로 에디터를 업데이트하는 함수
     * 수정사항: 통합된 상태 업데이트, 안전한 타입 검증
     */
    updateEditorFromBridge: (content: string, isCompleted: boolean) => {
      try {
        console.log('🔄 [SETTERS] updateEditorFromBridge 호출됨:', {
          contentLength: content?.length || 0,
          isCompleted,
          timestamp: new Date().toISOString(),
        });

        // 타입 검증
        const safeContent = typeof content === 'string' ? content : '';
        const safeIsCompleted =
          typeof isCompleted === 'boolean' ? isCompleted : false;

        set((state) => {
          const { formValues: currentFormValues } = state;
          const currentBridgeState = getSafeBridgeState(state);

          // 폼 값 업데이트
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

          const updatedFormValues: FormValues = {
            ...safeFormValues,
            editorCompletedContent: safeContent,
            isEditorCompleted: safeIsCompleted,
          };

          // Bridge 상태도 업데이트
          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            isTransferInProgress: false,
            lastTransferTime: Date.now(),
          };

          return {
            formValues: updatedFormValues,
            editorCompletedContent: safeContent,
            isEditorCompleted: safeIsCompleted,
            bridgeState: updatedBridgeState,
          };
        });

        console.log('✅ [SETTERS] updateEditorFromBridge 완료');
      } catch (error) {
        console.error('❌ [SETTERS] updateEditorFromBridge 오류:', {
          contentLength: content?.length || 0,
          isCompleted,
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },

    /**
     * Bridge 전송 횟수를 증가시키는 함수
     * 수정사항: 안전한 숫자 증가, 상태 업데이트
     */
    incrementBridgeTransferCount: () => {
      try {
        console.log('📈 [SETTERS] incrementBridgeTransferCount 호출됨');

        set((state) => {
          const currentBridgeState = getSafeBridgeState(state);
          const currentCount = currentBridgeState.transferCount || 0;
          const newCount = currentCount + 1;

          const updatedBridgeState: BridgeState = {
            ...currentBridgeState,
            transferCount: newCount,
          };

          console.log('📈 [SETTERS] 전송 횟수 증가:', {
            previousCount: currentCount,
            newCount,
          });

          return {
            bridgeState: updatedBridgeState,
          };
        });

        console.log('✅ [SETTERS] incrementBridgeTransferCount 완료');
      } catch (error) {
        console.error('❌ [SETTERS] incrementBridgeTransferCount 오류:', {
          error,
          timestamp: new Date().toISOString(),
        });
      }
    },
  };
};

console.log(
  '📄 [SETTERS] multiStepFormSetters 모듈 로드 완료 - Bridge 액션 추가됨'
);
