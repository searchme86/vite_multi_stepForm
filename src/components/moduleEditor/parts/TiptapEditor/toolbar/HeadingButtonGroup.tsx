// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/HeadingButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface HeadingButtonGroupProps {
  editor: Editor;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function HeadingButtonGroup({
  editor,
  disabled = false, // 🔧 fallback 기본값 설정
}: HeadingButtonGroupProps) {
  console.log('📰 [HEADING_GROUP] 렌더링:', {
    h1: editor?.isActive?.('heading', { level: 1 }) || false,
    h2: editor?.isActive?.('heading', { level: 2 }) || false,
    h3: editor?.isActive?.('heading', { level: 3 }) || false,
    disabled,
    editorDestroyed: editor?.isDestroyed || false,
  });

  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  const handleHeading1 = () => {
    console.log('📝 [HEADING_GROUP] H1 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [HEADING_GROUP] disabled 상태에서 H1 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      } catch (editorError) {
        console.error('❌ [HEADING_GROUP] H1 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [HEADING_GROUP] 유효하지 않은 에디터로 H1 시도');
    }
  };

  const handleHeading2 = () => {
    console.log('📝 [HEADING_GROUP] H2 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [HEADING_GROUP] disabled 상태에서 H2 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      } catch (editorError) {
        console.error('❌ [HEADING_GROUP] H2 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [HEADING_GROUP] 유효하지 않은 에디터로 H2 시도');
    }
  };

  const handleHeading3 = () => {
    console.log('📝 [HEADING_GROUP] H3 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [HEADING_GROUP] disabled 상태에서 H3 토글 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      } catch (editorError) {
        console.error('❌ [HEADING_GROUP] H3 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [HEADING_GROUP] 유효하지 않은 에디터로 H3 시도');
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:heading-1"
        onClick={handleHeading1}
        isActive={editor?.isActive?.('heading', { level: 1 }) || false}
        title="제목 1"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:heading-2"
        onClick={handleHeading2}
        isActive={editor?.isActive?.('heading', { level: 2 }) || false}
        title="제목 2"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:heading-3"
        onClick={handleHeading3}
        isActive={editor?.isActive?.('heading', { level: 3 }) || false}
        title="제목 3"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
    </>
  );
}

export default HeadingButtonGroup;
