// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/FormatButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface FormatButtonGroupProps {
  editor: Editor;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function FormatButtonGroup({
  editor,
  disabled = false, // 🔧 fallback 기본값 설정
}: FormatButtonGroupProps) {
  console.log('🔤 [FORMAT_GROUP] 렌더링:', {
    bold: editor?.isActive?.('bold') || false,
    italic: editor?.isActive?.('italic') || false,
    strike: editor?.isActive?.('strike') || false,
    disabled,
    editorDestroyed: editor?.isDestroyed || false,
  });

  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  const handleBold = () => {
    console.log('📝 [FORMAT_GROUP] Bold 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [FORMAT_GROUP] disabled 상태에서 Bold 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleBold().run();
      } catch (editorError) {
        console.error('❌ [FORMAT_GROUP] Bold 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [FORMAT_GROUP] 유효하지 않은 에디터로 Bold 시도');
    }
  };

  const handleItalic = () => {
    console.log('📝 [FORMAT_GROUP] Italic 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [FORMAT_GROUP] disabled 상태에서 Italic 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleItalic().run();
      } catch (editorError) {
        console.error('❌ [FORMAT_GROUP] Italic 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [FORMAT_GROUP] 유효하지 않은 에디터로 Italic 시도');
    }
  };

  const handleStrike = () => {
    console.log('📝 [FORMAT_GROUP] Strike 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [FORMAT_GROUP] disabled 상태에서 Strike 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleStrike().run();
      } catch (editorError) {
        console.error('❌ [FORMAT_GROUP] Strike 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [FORMAT_GROUP] 유효하지 않은 에디터로 Strike 시도');
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:bold"
        onClick={handleBold}
        isActive={editor?.isActive?.('bold') || false}
        title="굵게 (Ctrl+B)"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:italic"
        onClick={handleItalic}
        isActive={editor?.isActive?.('italic') || false}
        title="기울임 (Ctrl+I)"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:strikethrough"
        onClick={handleStrike}
        isActive={editor?.isActive?.('strike') || false}
        title="취소선"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
    </>
  );
}

export default FormatButtonGroup;
