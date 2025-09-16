// 📁 components/moduleEditor/parts/TiptapEditor/toolbar/TiptapToolbar.tsx

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
  disabled?: boolean;
}

function TiptapToolbar({
  editor,
  addImage,
  addLink,
  copyContent,
  selectAllContent,
  requestClearContent,
  disabled = false,
}: TiptapToolbarProps) {
  console.log('🛠️ [TIPTAP_TOOLBAR] 렌더링:', {
    editorDestroyed: editor.isDestroyed,
    disabled,
  });

  if (editor.isDestroyed) {
    console.warn('⚠️ [TIPTAP_TOOLBAR] 파괴된 에디터로 툴바 렌더링 시도');
    return null;
  }

  const toolbarClassName = `flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 ${
    disabled ? 'opacity-50 pointer-events-none' : ''
  }`;

  return (
    <div className={toolbarClassName}>
      <UndoRedoGroup editor={editor} disabled={disabled} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <FormatButtonGroup editor={editor} disabled={disabled} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <HeadingButtonGroup editor={editor} disabled={disabled} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <ListButtonGroup editor={editor} disabled={disabled} />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <MediaButtonGroup
        editor={editor}
        addImage={addImage}
        addLink={addLink}
        disabled={disabled}
      />

      <div className="w-px h-6 mx-1 bg-gray-300" />

      <CopyButtonGroup
        editor={editor}
        copyContent={copyContent}
        selectAllContent={selectAllContent}
        requestClearContent={requestClearContent}
        disabled={disabled}
      />
    </div>
  );
}

export default TiptapToolbar;
