// 📁 store/editorState.ts

import { useState, useCallback } from 'react';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';

interface Toast {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger';
}

interface EditorState {
  containers: Container[];
  paragraphs: LocalParagraph[];
  completedContent: string;
  isCompleted: boolean;
}

const initialEditorState: EditorState = {
  containers: [],
  paragraphs: [],
  completedContent: '',
  isCompleted: false,
};

export function useEditorState() {
  console.log('🏪 [EDITOR_STATE] useEditorState 훅 초기화');

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  console.log('🏪 [EDITOR_STATE] 현재 에디터 상태:', {
    containers: editorState.containers.length,
    paragraphs: editorState.paragraphs.length,
    isCompleted: editorState.isCompleted,
    toastCount: toasts.length,
  });

  const updateEditorContainers = useCallback(
    (containers: Container[]) => {
      console.log('🏪 [EDITOR_STATE] 컨테이너 업데이트:', {
        이전개수: editorState.containers.length,
        새개수: containers.length,
        컨테이너목록: containers.map((c) => ({ id: c.id, name: c.name })),
      });

      setEditorState((prev) => ({
        ...prev,
        containers: [...containers],
      }));
    },
    [editorState.containers.length]
  );

  const updateEditorParagraphs = useCallback(
    (paragraphs: LocalParagraph[]) => {
      console.log('🏪 [EDITOR_STATE] 단락 업데이트:', {
        이전개수: editorState.paragraphs.length,
        새개수: paragraphs.length,
        할당된단락: paragraphs.filter((p) => p.containerId).length,
        미할당단락: paragraphs.filter((p) => !p.containerId).length,
      });

      setEditorState((prev) => ({
        ...prev,
        paragraphs: [...paragraphs],
      }));
    },
    [editorState.paragraphs.length]
  );

  const updateEditorCompletedContent = useCallback(
    (content: string) => {
      console.log('🏪 [EDITOR_STATE] 완성된 내용 업데이트:', {
        이전길이: editorState.completedContent.length,
        새길이: content.length,
        변경여부: editorState.completedContent !== content,
      });

      setEditorState((prev) => ({
        ...prev,
        completedContent: content,
      }));
    },
    [editorState.completedContent]
  );

  const setEditorCompleted = useCallback(
    (completed: boolean) => {
      console.log('🏪 [EDITOR_STATE] 완료 상태 변경:', {
        이전상태: editorState.isCompleted,
        새상태: completed,
      });

      setEditorState((prev) => ({
        ...prev,
        isCompleted: completed,
      }));
    },
    [editorState.isCompleted]
  );

  const addToast = useCallback(
    (toast: Toast) => {
      console.log('🏪 [EDITOR_STATE] 토스트 추가:', {
        title: toast.title,
        description: toast.description,
        color: toast.color,
        현재토스트개수: toasts.length,
      });

      const toastId = Date.now() + Math.random();
      const newToast = { ...toast, id: toastId };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        console.log('🏪 [EDITOR_STATE] 토스트 자동 제거:', toastId);
        setToasts((prev) => prev.filter((t) => (t as any).id !== toastId));
      }, 3000);
    },
    [toasts.length]
  );

  const resetEditor = useCallback(() => {
    console.log('🏪 [EDITOR_STATE] 에디터 초기화 실행');

    setEditorState(initialEditorState);
    setToasts([]);

    console.log('🏪 [EDITOR_STATE] 에디터 초기화 완료');
  }, []);

  console.log('✅ [EDITOR_STATE] useEditorState 훅 준비 완료');

  return {
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
    resetEditor,
  };
}
