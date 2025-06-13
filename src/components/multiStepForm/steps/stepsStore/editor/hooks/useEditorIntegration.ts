import React from 'react';
import { useEditorState } from './useEditorState';
import { useEditorFormSync } from './useEditorFormSync';
import { EditorState } from '../../../types/editorTypes';

interface UseEditorIntegrationProps {
  setValue: (name: string, value: any) => void;
  allWatchedValues: any;
}

export const useEditorIntegration = ({
  setValue,
  allWatchedValues,
}: UseEditorIntegrationProps) => {
  console.log('📝 useEditorIntegration: 에디터 통합 관리 훅 초기화');

  const editor = useEditorState();

  useEditorFormSync({
    setValue,
    editorState: editor.editorState,
    allWatchedValues,
  });

  const getEditorProgress = React.useCallback((): number => {
    console.log('📝 useEditorIntegration: 에디터 진행률 계산');

    const { containers, paragraphs, completedContent, isCompleted } =
      editor.editorState;

    let progress = 0;
    if (containers.length > 0) progress += 25;
    if (paragraphs.length > 0) progress += 25;
    if (completedContent.length > 10) progress += 25;
    if (isCompleted) progress += 25;

    console.log('📝 useEditorIntegration: 진행률', progress);
    return progress;
  }, [editor.editorState]);

  const validateEditorState = React.useCallback((): boolean => {
    console.log('📝 useEditorIntegration: 에디터 상태 검증');

    const isValid =
      editor.editorState.isCompleted &&
      editor.editorState.completedContent.trim().length > 0;

    console.log('📝 useEditorIntegration: 검증 결과', isValid);
    return isValid;
  }, [editor.editorState]);

  const exportEditorData = React.useCallback(() => {
    console.log('📝 useEditorIntegration: 에디터 데이터 내보내기');

    return {
      containers: editor.editorState.containers,
      paragraphs: editor.editorState.paragraphs,
      content: editor.editorState.completedContent,
      isCompleted: editor.editorState.isCompleted,
      progress: getEditorProgress(),
    };
  }, [editor.editorState, getEditorProgress]);

  return {
    ...editor,
    getEditorProgress,
    validateEditorState,
    exportEditorData,
  };
};
