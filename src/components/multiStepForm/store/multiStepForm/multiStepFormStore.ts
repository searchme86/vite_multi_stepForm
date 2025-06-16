import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
//====여기부터 수정됨====
import {
  MultiStepFormState,
  createInitialMultiStepFormState, // 함수만 import (상수 완전 제거)
} from './initialMultiStepFormState';
//====여기까지 수정됨====
import {
  MultiStepFormGetters,
  createMultiStepFormGetters,
} from './multiStepFormGetters';
import {
  MultiStepFormSetters,
  createMultiStepFormSetters,
} from './multiStepFormSetters';

export interface Toast {
  id: string;
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'default';
  createdAt: Date;
}

export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'default';
}

export interface MultiStepFormStore
  extends MultiStepFormState,
    MultiStepFormGetters,
    MultiStepFormSetters {
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  setIsPreviewPanelOpen: (open: boolean) => void;
  togglePreviewPanel: () => void;
}

/**
 * 멀티스텝 폼 Zustand 스토어
 *
 * 최종 변경사항:
 * - initialMultiStepFormState 상수 import 완전 제거
 * - createInitialMultiStepFormState() 함수만 사용
 * - STEP_CONFIG 기반 직접 계산으로 초기화 순서 문제 완전 해결
 * - 동적 import 불필요, 하드코딩 불필요
 *
 * 장점:
 * 1. 모듈 초기화 순서와 완전히 독립적
 * 2. STEP_CONFIG 변경 시 자동으로 반영
 * 3. 안전하고 예측 가능한 동작
 */
export const useMultiStepFormStore = create<MultiStepFormStore>()(
  devtools(
    persist(
      (set, get) => {
        console.log('🏗️ Zustand 스토어 생성 시작 (함수 전용 최종 버전)');

        // getters와 setters 생성
        const getters = createMultiStepFormGetters(get);
        const setters = createMultiStepFormSetters(set); // 공유 계산 함수 사용

        // 초기 상태를 함수 호출로만 생성 (상수 사용 완전 제거)
        // 이제 STEP_CONFIG를 직접 읽어서 계산하므로 초기화 순서 문제 없음
        const initialState = createInitialMultiStepFormState();
        console.log(
          '✅ 초기 상태 생성 완료 (STEP_CONFIG 직접 계산):',
          initialState
        );

        return {
          // 함수 호출로 생성된 안전한 초기 상태 사용
          ...initialState,
          ...getters,
          ...setters,

          toasts: [],

          addToast: (options: ToastOptions) => {
            console.log('🔔 토스트 추가:', options.title);
            set((state) => ({
              toasts: [
                ...state.toasts,
                {
                  ...options,
                  id: Date.now().toString(),
                  createdAt: new Date(),
                },
              ],
            }));
          },

          removeToast: (id: string) => {
            console.log('🗑️ 토스트 제거:', id);
            set((state) => ({
              toasts: state.toasts.filter((toast) => toast.id !== id),
            }));
          },

          clearAllToasts: () => {
            console.log('🧹 모든 토스트 제거');
            set({ toasts: [] });
          },

          setIsPreviewPanelOpen: (open: boolean) => {
            console.log('👀 미리보기 패널 상태 변경:', open);
            set({ showPreview: open });
          },

          togglePreviewPanel: () => {
            console.log('🔄 미리보기 패널 토글');
            set((state) => ({ showPreview: !state.showPreview }));
          },
        };
      },
      {
        name: 'multi-step-form-storage',
        partialize: (state) => ({
          formValues: state.formValues,
          currentStep: state.currentStep,
          editorCompletedContent: state.editorCompletedContent,
          isEditorCompleted: state.isEditorCompleted,
        }),
      }
    ),
    {
      name: 'multi-step-form-store',
    }
  )
);
