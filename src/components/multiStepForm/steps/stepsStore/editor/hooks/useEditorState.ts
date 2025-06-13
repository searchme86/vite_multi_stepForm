import React from 'react';
import {
  EditorState,
  EditorContainer,
  EditorParagraph,
} from '../../../types/editorTypes';

const initialEditorState: EditorState = {
  containers: [],
  paragraphs: [],
  completedContent: '',
  isCompleted: false,
};

export const useEditorState = () => {
  const [editorState, setEditorState] =
    React.useState<EditorState>(initialEditorState);

  const updateEditorContainers = React.useCallback(
    (containers: EditorContainer[]) => {
      console.log(
        '📝 updateEditorContainers: 에디터 컨테이너 업데이트',
        containers
      );
      setEditorState((prev) => ({
        ...prev,
        containers,
      }));
    },
    []
  );

  const updateEditorParagraphs = React.useCallback(
    (paragraphs: EditorParagraph[]) => {
      console.log(
        '📝 updateEditorParagraphs: 에디터 문단 업데이트',
        paragraphs
      );
      setEditorState((prev) => ({
        ...prev,
        paragraphs,
      }));
    },
    []
  );

  const updateEditorCompletedContent = React.useCallback((content: string) => {
    console.log(
      '📝 updateEditorCompletedContent: 완성된 컨텐츠 업데이트',
      content.slice(0, 50) + '...'
    );
    setEditorState((prev) => ({
      ...prev,
      completedContent: content,
    }));
  }, []);

  const setEditorCompleted = React.useCallback((isCompleted: boolean) => {
    console.log('📝 setEditorCompleted: 에디터 완료 상태 설정', isCompleted);
    setEditorState((prev) => ({
      ...prev,
      isCompleted,
    }));
  }, []);

  const resetEditorState = React.useCallback(() => {
    console.log('📝 resetEditorState: 에디터 상태 초기화');
    setEditorState(initialEditorState);
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
