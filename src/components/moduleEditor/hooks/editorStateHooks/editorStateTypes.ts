import {
  Container,
  ParagraphBlock,
  ToastOptions,
} from '../../../../store/shared/commonTypes';
import { SubStep } from '../../types/editor';

// MultiStepForm에서 사용하는 context 타입 정의
interface MultiStepFormContextType {
  editorState: {
    containers: Container[];
    paragraphs: ParagraphBlock[];
    completedContent: string;
    isCompleted: boolean;
  };
  updateEditorContainers: (containers: Container[]) => void;
  updateEditorParagraphs: (paragraphs: ParagraphBlock[]) => void;
  updateEditorCompletedContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
  addToast: (options: ToastOptions) => void;
}

// useEditorState 훅의 props 타입 정의
interface UseEditorStateProps {
  context?: MultiStepFormContextType;
}

// 로컬에서 사용하는 단락 타입 별칭
type LocalParagraph = ParagraphBlock;

// ✨ [공통 타입 정의] 모든 파일에서 사용할 store 액션 타입들을 한 곳에서 정의
// EditorCore Store 액션 타입 정의 - 에디터의 핵심 데이터를 관리하는 store
interface EditorCoreStoreActions {
  getContainers: () => Container[];
  getParagraphs: () => LocalParagraph[];
  getCompletedContent: () => string;
  getIsCompleted: () => boolean;
  setContainers: (containers: Container[]) => void;
  setParagraphs: (paragraphs: LocalParagraph[]) => void;
  setCompletedContent: (content: string) => void;
  setIsCompleted: (completed: boolean) => void;
}

// EditorUI Store 액션 타입 정의 - 에디터의 UI 상태를 관리하는 store
interface EditorUIStoreActions {
  getCurrentSubStep: () => SubStep;
  getIsTransitioning: () => boolean;
  getActiveParagraphId: () => string | null;
  getIsPreviewOpen: () => boolean;
  getSelectedParagraphIds: () => string[];
  getTargetContainerId: () => string;
  goToWritingStep: () => void;
  goToStructureStep: () => void;
  setActiveParagraphId: (id: string | null) => void;
  togglePreview: () => void;
  toggleParagraphSelection: (paragraphId: string) => void;
  setSelectedParagraphIds: (ids: string[]) => void;
  setTargetContainerId: (containerId: string) => void;
  clearSelectedParagraphs: () => void;
}

// Toast Store 액션 타입 정의 - 알림 메시지를 관리하는 store
interface ToastStoreActions {
  addToast: (options: ToastOptions) => void;
}

//====여기부터 수정됨====
// 모든 타입들을 export - 다른 파일들에서 import할 수 있도록
export type {
  MultiStepFormContextType,
  UseEditorStateProps,
  LocalParagraph,
  EditorCoreStoreActions,
  EditorUIStoreActions,
  ToastStoreActions,
};
//====여기까지 수정됨====
