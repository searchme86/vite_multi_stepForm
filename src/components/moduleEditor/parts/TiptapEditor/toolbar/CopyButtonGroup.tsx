// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/CopyButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface CopyButtonGroupProps {
  editor: Editor;
  copyContent: () => void;
  selectAllContent: () => void;
  requestClearContent: () => void;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function CopyButtonGroup({
  editor,
  copyContent,
  selectAllContent,
  requestClearContent,
  disabled = false, // 🔧 fallback 기본값 설정
}: CopyButtonGroupProps) {
  console.log('📋 [COPY_GROUP] 렌더링:', {
    editorDestroyed: editor?.isDestroyed || false,
    disabled,
    copyContentType: typeof copyContent,
    selectAllContentType: typeof selectAllContent,
    requestClearContentType: typeof requestClearContent,
  });

  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  const handleCopyContent = () => {
    console.log('📋 [COPY_GROUP] 내용 복사 버튼 클릭:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [COPY_GROUP] disabled 상태에서 복사 시도 차단');
      return;
    }

    // 🛡️ 함수 유효성 검사
    const safeCopyCallback =
      copyContent ||
      (() => {
        console.warn('⚠️ [COPY_GROUP] copyContent 콜백이 제공되지 않음');
      });

    if (typeof safeCopyCallback === 'function') {
      safeCopyCallback();
    }
  };

  const handleSelectAll = () => {
    console.log('📋 [COPY_GROUP] 전체 선택 버튼 클릭:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [COPY_GROUP] disabled 상태에서 전체 선택 시도 차단');
      return;
    }

    // 🛡️ 함수 유효성 검사
    const safeSelectAllCallback =
      selectAllContent ||
      (() => {
        console.warn('⚠️ [COPY_GROUP] selectAllContent 콜백이 제공되지 않음');
      });

    if (typeof safeSelectAllCallback === 'function') {
      safeSelectAllCallback();
    }
  };

  const handleRequestClear = () => {
    console.log('📋 [COPY_GROUP] 내용 지우기 요청 버튼 클릭:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [COPY_GROUP] disabled 상태에서 내용 지우기 시도 차단');
      return;
    }

    // 🛡️ 함수 유효성 검사
    const safeClearCallback =
      requestClearContent ||
      (() => {
        console.warn(
          '⚠️ [COPY_GROUP] requestClearContent 콜백이 제공되지 않음'
        );
      });

    if (typeof safeClearCallback === 'function') {
      safeClearCallback();
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:copy"
        onClick={handleCopyContent}
        title="내용 복사 (Ctrl+C)"
        variant="success"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:mouse-pointer-square-dashed"
        onClick={handleSelectAll}
        title="전체 선택 (Ctrl+A)"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:trash-2"
        onClick={handleRequestClear}
        title="모든 내용 지우기"
        variant="danger"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
    </>
  );
}

export default CopyButtonGroup;
