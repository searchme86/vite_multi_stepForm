import React from 'react';

//====여기부터 수정됨====
// ✅ 추가: Context 관련 타입 및 인터페이스 정의
// 이유: 타입 안전성 확보 및 컴포넌트 간 일관성 유지
interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

// Form Values 타입 정의 (MultiStepForm에서 import하여 사용)
export interface FormValues {
  userImage?: string;
  nickname: string;
  emailPrefix: string;
  emailDomain: string;
  bio?: string;
  title: string;
  description: string;
  tags?: string;
  content: string;
  media?: string[];
  mainImage?: string | null;
  sliderImages?: string[];
}

// MultiStepForm Context 타입 정의
export interface MultiStepFormContextType {
  addToast: (options: ToastOptions) => void;
  formValues: FormValues;
  // PreviewPanel 제어를 위한 새로운 속성
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (isOpen: boolean) => void;
  togglePreviewPanel: () => void;
}

// Context 생성
export const MultiStepFormContext =
  React.createContext<MultiStepFormContextType | null>(null);

// Custom hook for using the context
export const useMultiStepForm = () => {
  const context = React.useContext(MultiStepFormContext);
  if (!context) {
    throw new Error(
      'useMultiStepForm must be used within MultiStepFormProvider'
    );
  }
  return context;
};
//====여기까지 수정됨====
