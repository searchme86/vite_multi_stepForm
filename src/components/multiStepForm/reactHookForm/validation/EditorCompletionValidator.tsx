import React from 'react';
import { EditorState } from '../../types/editorTypes';

interface EditorCompletionValidatorProps {
  editorState: EditorState;
  onValidationResult: (isValid: boolean) => void;
  onShowToast: (message: string) => void;
  children: React.ReactNode;
}

function EditorCompletionValidator({
  editorState,
  onValidationResult,
  onShowToast,
  children,
}: EditorCompletionValidatorProps) {
  console.log('📝 EditorCompletionValidator: 에디터 완료 검증기 렌더링');

  React.useEffect(() => {
    console.log('📝 EditorCompletionValidator: 에디터 상태 변화 감지');

    const validateEditor = () => {
      const hasContent =
        editorState.completedContent &&
        editorState.completedContent.trim().length > 0;
      const isCompleted = editorState.isCompleted;

      console.log('📝 EditorCompletionValidator: 에디터 검증', {
        hasContent,
        isCompleted,
        contentLength: editorState.completedContent?.length || 0,
      });

      if (!isCompleted) {
        console.log('📝 EditorCompletionValidator: 에디터 미완료');
        onValidationResult(false);
        return;
      }

      if (!hasContent) {
        console.log('📝 EditorCompletionValidator: 에디터 내용 없음');
        onValidationResult(false);
        onShowToast('에디터에서 글 작성을 완료해주세요.');
        return;
      }

      console.log('📝 EditorCompletionValidator: 에디터 검증 성공');
      onValidationResult(true);
    };

    validateEditor();
  }, [
    editorState.isCompleted,
    editorState.completedContent,
    onValidationResult,
    onShowToast,
  ]);

  return <>{children}</>;
}

export default EditorCompletionValidator;
