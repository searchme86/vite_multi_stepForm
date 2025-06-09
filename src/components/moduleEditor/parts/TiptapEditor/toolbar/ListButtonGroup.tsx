import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface ListButtonGroupProps {
  editor: Editor;
}

function ListButtonGroup({ editor }: ListButtonGroupProps) {
  console.log('📋 [LIST_GROUP] 렌더링:', {
    bulletList: editor.isActive('bulletList'),
    orderedList: editor.isActive('orderedList'),
    blockquote: editor.isActive('blockquote'),
  });

  const handleBulletList = () => {
    console.log('📝 [LIST_GROUP] BulletList 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  const handleOrderedList = () => {
    console.log('📝 [LIST_GROUP] OrderedList 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleOrderedList().run();
    }
  };

  const handleBlockquote = () => {
    console.log('📝 [LIST_GROUP] Blockquote 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleBlockquote().run();
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:list"
        onClick={handleBulletList}
        isActive={editor.isActive('bulletList')}
        title="불릿 리스트"
      />
      <ToolbarButton
        icon="lucide:list-ordered"
        onClick={handleOrderedList}
        isActive={editor.isActive('orderedList')}
        title="순서 리스트"
      />
      <ToolbarButton
        icon="lucide:quote"
        onClick={handleBlockquote}
        isActive={editor.isActive('blockquote')}
        title="인용구"
      />
    </>
  );
}

export default ListButtonGroup;
