import {
  EditorState,
  EditorContainer,
  EditorParagraph,
} from '../../../../types/editorTypes';

export const validateEditorCompletion = (editorState: EditorState): boolean => {
  console.log('📝 editorIntegrationActions: 에디터 완료 여부 검증');

  // 🔧 !! (더블 부정)으로 명시적으로 boolean 타입으로 변환
  const hasContent = !!(
    editorState.completedContent &&
    editorState.completedContent.trim().length > 0
  );
  const isCompleted = editorState.isCompleted;

  console.log('📝 editorIntegrationActions: 검증 결과', {
    hasContent,
    isCompleted,
  });
  return hasContent && isCompleted;
};

export const mergeEditorContent = (
  containers: EditorContainer[],
  paragraphs: EditorParagraph[]
): string => {
  console.log('📝 editorIntegrationActions: 에디터 내용 병합');

  const sortedContainers = [...containers].sort((a, b) => a.order - b.order);
  const sortedParagraphs = [...paragraphs].sort((a, b) => a.order - b.order);

  let mergedContent = '';

  sortedContainers.forEach((container) => {
    mergedContent += container.content + '\n';
  });

  sortedParagraphs.forEach((paragraph) => {
    mergedContent += paragraph.text + '\n';
  });

  console.log('📝 editorIntegrationActions: 병합 완료', mergedContent.length);
  return mergedContent.trim();
};

export const syncEditorToForm = (
  editorState: EditorState,
  setValue: (name: string, value: any) => void
): void => {
  console.log('📝 editorIntegrationActions: 에디터를 폼과 동기화');

  setValue('editorCompletedContent', editorState.completedContent);
  setValue('isEditorCompleted', editorState.isCompleted);

  console.log('📝 editorIntegrationActions: 동기화 완료');
};

export const resetEditorContent = (): EditorState => {
  console.log('📝 editorIntegrationActions: 에디터 내용 초기화');

  return {
    containers: [],
    paragraphs: [],
    completedContent: '',
    isCompleted: false,
  };
};
