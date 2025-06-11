import React from 'react';
import { EditorState } from '../../types/editorTypes';

interface EditorContentValidatorProps {
  editorState: EditorState;
  minContentLength?: number;
  onValidationResult: (isValid: boolean, message?: string) => void;
  children: React.ReactNode;
}

function EditorContentValidator({
  editorState,
  minContentLength = 10,
  onValidationResult,
  children,
}: EditorContentValidatorProps) {
  console.log('📄 EditorContentValidator: 에디터 내용 검증기 렌더링');

  React.useEffect(() => {
    console.log('📄 EditorContentValidator: 에디터 내용 변화 감지');

    const validateContent = () => {
      const content = editorState.completedContent;
      const contentLength = content ? content.trim().length : 0;

      console.log('📄 EditorContentValidator: 내용 검증', {
        contentLength,
        minRequired: minContentLength,
        hasContainers: editorState.containers?.length || 0,
        hasParagraphs: editorState.paragraphs?.length || 0,
      });

      if (contentLength < minContentLength) {
        console.log('📄 EditorContentValidator: 내용 길이 부족');
        onValidationResult(
          false,
          `에디터 내용은 최소 ${minContentLength}자 이상이어야 합니다.`
        );
        return;
      }

      if (!editorState.containers || editorState.containers.length === 0) {
        console.log('📄 EditorContentValidator: 컨테이너 없음');
        onValidationResult(
          false,
          '에디터에서 최소 하나의 블록을 작성해주세요.'
        );
        return;
      }

      console.log('📄 EditorContentValidator: 내용 검증 성공');
      onValidationResult(true);
    };

    validateContent();
  }, [
    editorState.completedContent,
    editorState.containers,
    editorState.paragraphs,
    minContentLength,
    onValidationResult,
  ]);

  return <>{children}</>;
}

export default EditorContentValidator;
