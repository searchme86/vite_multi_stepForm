import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface UndoRedoGroupProps {
  editor: Editor;
}

function UndoRedoGroup({ editor }: UndoRedoGroupProps) {
  console.log('↩️ [UNDO_REDO_GROUP] 렌더링:', {
    canUndo: editor.can().chain().focus().undo().run(),
    canRedo: editor.can().chain().focus().redo().run(),
  });

  const handleUndo = () => {
    console.log('📝 [UNDO_REDO_GROUP] Undo 실행');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().undo().run();
    }
  };

  const handleRedo = () => {
    console.log('📝 [UNDO_REDO_GROUP] Redo 실행');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().redo().run();
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:undo"
        onClick={handleUndo}
        isDisabled={!editor.can().chain().focus().undo().run()}
        title="실행 취소 (Ctrl+Z)"
      />
      <ToolbarButton
        icon="lucide:redo"
        onClick={handleRedo}
        isDisabled={!editor.can().chain().focus().redo().run()}
        title="다시 실행 (Ctrl+Y)"
      />
    </>
  );
}

export default UndoRedoGroup;
