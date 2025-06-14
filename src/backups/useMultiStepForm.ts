// 🔧 useMultiStepForm.ts - 에디터 상태 관리 실제 구현 추가

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

// ====기존 타입 정의들 (그대로 유지)====
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

  // 모듈화된 에디터 관련 필드들
  editorContainers?: Container[];
  editorParagraphs?: ParagraphBlock[];
  editorCompletedContent?: string;
  isEditorCompleted?: boolean;
}

/**
 * 컨테이너 - 사용자가 정의한 글 구조의 각 섹션
 */
export interface Container {
  id: string; // 고유 식별자
  name: string; // 컨테이너 이름 (예: "글 요약", "서론")
  order: number; // 순서
  createdAt: Date; // 생성 시간
}

/**
 * 단락 블록 - 개별적으로 작성된 마크다운 단락
 */
export interface ParagraphBlock {
  id: string; // 고유 식별자
  content: string; // 마크다운 내용
  containerId: string | null; // 할당된 컨테이너 ID (null이면 미할당)
  order: number; // 컨테이너 내 순서
  createdAt: Date; // 생성 시간
  updatedAt: Date; // 수정 시간
}

/**
 * 에디터 상태 - 에디터의 전체 상태 정보
 */
export interface EditorState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
}

// ====기존 ImageViewConfig 관련 타입들 (그대로 유지)====
export interface ImageViewConfig {
  clickOrder: number[];
  selectedImages: string[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';
}

export interface CustomGalleryView {
  id: string;
  name: string;
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  createdAt: Date;
}

export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
}

// ====Context 타입 정의====
export interface MultiStepFormContextType {
  // 기존 기능들
  addToast: (options: ToastOptions) => void;
  formValues: FormValues;
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (isOpen: boolean) => void;
  togglePreviewPanel: () => void;
  imageViewConfig: ImageViewConfig;
  setImageViewConfig: React.Dispatch<React.SetStateAction<ImageViewConfig>>;
  customGalleryViews: CustomGalleryView[];
  addCustomGalleryView: (view: CustomGalleryView) => void;
  removeCustomGalleryView: (id: string) => void;
  clearCustomGalleryViews: () => void;
  updateCustomGalleryView: (
    id: string,
    updates: Partial<CustomGalleryView>
  ) => void;

  // ====여기부터 새로 추가 - 에디터 관련 상태 및 함수들====
  editorState: EditorState;
  updateEditorContainers: (containers: Container[]) => void;
  updateEditorParagraphs: (paragraphs: ParagraphBlock[]) => void;
  updateEditorCompletedContent: (content: string) => void;
  setEditorCompleted: (isCompleted: boolean) => void;
  resetEditorState: () => void;
  // ====여기까지 새로 추가====
}

// ====Context 생성====
export const MultiStepFormContext =
  createContext<MultiStepFormContextType | null>(null);

// ====에디터 관련 유틸리티 함수들====

/**
 * 새로운 Container 객체를 생성하는 팩토리 함수
 */
export const createContainer = (name: string, order: number): Container => {
  return {
    id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    order,
    createdAt: new Date(),
  };
};

/**
 * 새로운 ParagraphBlock 객체를 생성하는 팩토리 함수
 */
export const createParagraphBlock = (content: string): ParagraphBlock => {
  return {
    id: `paragraph-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    content: content.trim(),
    containerId: null,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * 컨테이너 배열을 순서대로 정렬하는 함수
 */
export const sortContainers = (containers: Container[]): Container[] => {
  return [...containers].sort((a, b) => a.order - b.order);
};

/**
 * 특정 컨테이너에 속한 단락들을 순서대로 반환하는 함수
 */
export const getParagraphsByContainer = (
  paragraphs: ParagraphBlock[],
  containerId: string
): ParagraphBlock[] => {
  return paragraphs
    .filter((p) => p.containerId === containerId)
    .sort((a, b) => a.order - b.order);
};

/**
 * 할당되지 않은 단락들을 반환하는 함수
 */
export const getUnassignedParagraphs = (
  paragraphs: ParagraphBlock[]
): ParagraphBlock[] => {
  return paragraphs
    .filter((p) => p.containerId === null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

/**
 * 전체 컨테이너와 단락을 하나의 완성된 마크다운 텍스트로 변환하는 함수
 */
export const generateCompletedContent = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string => {
  const sortedContainers = sortContainers(containers);

  const sections = sortedContainers.map((container) => {
    const containerParagraphs = getParagraphsByContainer(
      paragraphs,
      container.id
    );

    if (containerParagraphs.length === 0) {
      return '';
    }

    // 컨테이너별로 단락들을 결합 (컨테이너 구조는 최종 결과에서 제거)
    return containerParagraphs.map((p) => p.content).join('\n\n');
  });

  // 빈 섹션 제거하고 결합
  return sections.filter((section) => section.trim().length > 0).join('\n\n');
};

/**
 * 에디터 상태 유효성 검사 함수
 */
export const validateEditorState = (state: Partial<EditorState>): boolean => {
  // 최소 1개 이상의 컨테이너 필요
  if (!state.containers || state.containers.length === 0) {
    return false;
  }

  // 최소 1개 이상의 할당된 단락 필요
  if (!state.paragraphs || state.paragraphs.length === 0) {
    return false;
  }

  const assignedParagraphs = state.paragraphs.filter(
    (p) => p.containerId !== null
  );
  if (assignedParagraphs.length === 0) {
    return false;
  }

  return true;
};

/**
 * 기본 에디터 상태를 생성하는 함수
 */
export const createDefaultEditorState = (): EditorState => {
  return {
    containers: [],
    paragraphs: [],
    completedContent: '',
    isCompleted: false,
  };
};

/**
 * 기본 ImageViewConfig를 생성하는 함수
 */
export const createDefaultImageViewConfig = (): ImageViewConfig => {
  return {
    clickOrder: [],
    selectedImages: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'all',
  };
};

// ====여기부터 새로 추가 - 에디터 상태 관리 훅====

/**
 * 에디터 상태를 관리하는 커스텀 훅
 * @returns 에디터 상태와 관련 액션 함수들
 */
export const useEditorState = () => {
  // 에디터 상태 관리
  const [editorState, setEditorState] = useState<EditorState>(
    createDefaultEditorState
  );

  // 컨테이너 업데이트 함수
  const updateEditorContainers = useCallback((containers: Container[]) => {
    setEditorState((prev) => ({
      ...prev,
      containers,
      // 컨테이너가 변경되면 완성된 컨텐츠도 재생성
      completedContent: generateCompletedContent(containers, prev.paragraphs),
    }));
  }, []);

  // 단락 업데이트 함수
  const updateEditorParagraphs = useCallback((paragraphs: ParagraphBlock[]) => {
    setEditorState((prev) => ({
      ...prev,
      paragraphs,
      // 단락이 변경되면 완성된 컨텐츠도 재생성
      completedContent: generateCompletedContent(prev.containers, paragraphs),
    }));
  }, []);

  // 완성된 컨텐츠 직접 업데이트 함수
  const updateEditorCompletedContent = useCallback((content: string) => {
    setEditorState((prev) => ({
      ...prev,
      completedContent: content,
    }));
  }, []);

  // 에디터 완료 상태 설정 함수
  const setEditorCompleted = useCallback((isCompleted: boolean) => {
    setEditorState((prev) => ({
      ...prev,
      isCompleted,
    }));
  }, []);

  // 에디터 상태 초기화 함수
  const resetEditorState = useCallback(() => {
    setEditorState(createDefaultEditorState());
  }, []);

  return {
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    resetEditorState,
  };
};

/**
 * MultiStepForm Context를 사용하는 훅
 */
export const useMultiStepForm = (): MultiStepFormContextType | null => {
  const context = useContext(MultiStepFormContext);

  if (!context) {
    console.warn(
      'useMultiStepForm은 MultiStepFormContext.Provider 내부에서 사용되어야 합니다.'
    );
    return null;
  }

  return context;
};

// ====여기까지 새로 추가====
