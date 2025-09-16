// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/UndoRedoGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface UndoRedoGroupProps {
  editor: Editor;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function UndoRedoGroup({
  editor,
  disabled = false, // 🔧 fallback 기본값 설정
}: UndoRedoGroupProps) {
  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  // 🛡️ Undo 가능 여부 체크 (안전한 방식)
  const canUndo = (): boolean => {
    if (!isEditorValid(editor)) return false;
    try {
      return editor.can().chain().focus().undo().run();
    } catch (undoCheckError) {
      console.error(
        '❌ [UNDO_REDO_GROUP] Undo 가능 여부 체크 실패:',
        undoCheckError
      );
      return false;
    }
  };

  // 🛡️ Redo 가능 여부 체크 (안전한 방식)
  const canRedo = (): boolean => {
    if (!isEditorValid(editor)) return false;
    try {
      return editor.can().chain().focus().redo().run();
    } catch (redoCheckError) {
      console.error(
        '❌ [UNDO_REDO_GROUP] Redo 가능 여부 체크 실패:',
        redoCheckError
      );
      return false;
    }
  };

  console.log('↩️ [UNDO_REDO_GROUP] 렌더링:', {
    canUndo: canUndo(),
    canRedo: canRedo(),
    disabled,
    editorDestroyed: editor?.isDestroyed || false,
  });

  const handleUndo = () => {
    console.log('📝 [UNDO_REDO_GROUP] Undo 실행:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [UNDO_REDO_GROUP] disabled 상태에서 Undo 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        if (canUndo()) {
          editor.chain().focus().undo().run();
        } else {
          console.warn('⚠️ [UNDO_REDO_GROUP] Undo 불가능한 상태');
        }
      } catch (undoError) {
        console.error('❌ [UNDO_REDO_GROUP] Undo 실행 실패:', undoError);
      }
    } else {
      console.warn('⚠️ [UNDO_REDO_GROUP] 유효하지 않은 에디터로 Undo 시도');
    }
  };

  const handleRedo = () => {
    console.log('📝 [UNDO_REDO_GROUP] Redo 실행:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [UNDO_REDO_GROUP] disabled 상태에서 Redo 시도 차단');
      return;
    }

    // 🛡️ 에디터 유효성 검사
    if (isEditorValid(editor)) {
      try {
        if (canRedo()) {
          editor.chain().focus().redo().run();
        } else {
          console.warn('⚠️ [UNDO_REDO_GROUP] Redo 불가능한 상태');
        }
      } catch (redoError) {
        console.error('❌ [UNDO_REDO_GROUP] Redo 실행 실패:', redoError);
      }
    } else {
      console.warn('⚠️ [UNDO_REDO_GROUP] 유효하지 않은 에디터로 Redo 시도');
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:undo"
        onClick={handleUndo}
        isDisabled={disabled || !canUndo()} // 🔧 disabled OR 기능 불가능 상태
        title="실행 취소 (Ctrl+Z)"
      />
      <ToolbarButton
        icon="lucide:redo"
        onClick={handleRedo}
        isDisabled={disabled || !canRedo()} // 🔧 disabled OR 기능 불가능 상태
        title="다시 실행 (Ctrl+Y)"
      />
    </>
  );
}

export default UndoRedoGroup;
