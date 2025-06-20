// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/TiptapToolbar.tsx

import { Editor } from '@tiptap/react';
import FormatButtonGroup from './FormatButtonGroup';
import HeadingButtonGroup from './HeadingButtonGroup';
import ListButtonGroup from './ListButtonGroup';
import MediaButtonGroup from './MediaButtonGroup';
import UndoRedoGroup from './UndoRedoGroup';
import CopyButtonGroup from './CopyButtonGroup';

interface TiptapToolbarProps {
  editor: Editor;
  addImage: () => void;
  addLink: () => void;
  copyContent: () => void;
  selectAllContent: () => void;
  requestClearContent: () => void;
}

function TiptapToolbar({
  editor,
  addImage,
  addLink,
  copyContent,
  selectAllContent,
  requestClearContent,
}: TiptapToolbarProps) {
  console.log('🛠️ [TIPTAP_TOOLBAR] 렌더링:', {
    editorDestroyed: editor.isDestroyed,
  });

  if (editor.isDestroyed) {
    console.warn('⚠️ [TIPTAP_TOOLBAR] 파괴된 에디터로 툴바 렌더링 시도');
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <UndoRedoGroup editor={editor} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <FormatButtonGroup editor={editor} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <HeadingButtonGroup editor={editor} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <ListButtonGroup editor={editor} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <MediaButtonGroup editor={editor} addImage={addImage} addLink={addLink} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <CopyButtonGroup
        editor={editor}
        copyContent={copyContent}
        selectAllContent={selectAllContent}
        requestClearContent={requestClearContent}
      />
    </div>
  );
}

export default TiptapToolbar;
