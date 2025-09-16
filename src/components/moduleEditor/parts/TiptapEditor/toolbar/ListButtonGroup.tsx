// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/ListButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface ListButtonGroupProps {
  editor: Editor;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function ListButtonGroup({
  editor,
  disabled = false, // 🔧 fallback 기본값 설정
}: ListButtonGroupProps) {
  console.log('📋 [LIST_GROUP] 렌더링:', {
    bulletList: editor?.isActive?.('bulletList') || false,
    orderedList: editor?.isActive?.('orderedList') || false,
    blockquote: editor?.isActive?.('blockquote') || false,
    disabled,
    editorDestroyed: editor?.isDestroyed || false,
  });

  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  const handleBulletList = () => {
    console.log('📝 [LIST_GROUP] BulletList 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn(
        '⚠️ [LIST_GROUP] disabled 상태에서 BulletList 토글 시도 차단'
      );
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleBulletList().run();
      } catch (editorError) {
        console.error('❌ [LIST_GROUP] BulletList 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [LIST_GROUP] 유효하지 않은 에디터로 BulletList 시도');
    }
  };

  const handleOrderedList = () => {
    console.log('📝 [LIST_GROUP] OrderedList 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn(
        '⚠️ [LIST_GROUP] disabled 상태에서 OrderedList 토글 시도 차단'
      );
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleOrderedList().run();
      } catch (editorError) {
        console.error('❌ [LIST_GROUP] OrderedList 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [LIST_GROUP] 유효하지 않은 에디터로 OrderedList 시도');
    }
  };

  const handleBlockquote = () => {
    console.log('📝 [LIST_GROUP] Blockquote 토글:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn(
        '⚠️ [LIST_GROUP] disabled 상태에서 Blockquote 토글 시도 차단'
      );
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        editor.chain().focus().toggleBlockquote().run();
      } catch (editorError) {
        console.error('❌ [LIST_GROUP] Blockquote 토글 실패:', editorError);
      }
    } else {
      console.warn('⚠️ [LIST_GROUP] 유효하지 않은 에디터로 Blockquote 시도');
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:list"
        onClick={handleBulletList}
        isActive={editor?.isActive?.('bulletList') || false}
        title="불릿 리스트"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:list-ordered"
        onClick={handleOrderedList}
        isActive={editor?.isActive?.('orderedList') || false}
        title="순서 리스트"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:quote"
        onClick={handleBlockquote}
        isActive={editor?.isActive?.('blockquote') || false}
        title="인용구"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
    </>
  );
}

export default ListButtonGroup;
