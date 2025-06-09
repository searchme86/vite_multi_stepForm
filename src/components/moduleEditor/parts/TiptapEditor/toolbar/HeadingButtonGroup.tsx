import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface HeadingButtonGroupProps {
  editor: Editor;
}

function HeadingButtonGroup({ editor }: HeadingButtonGroupProps) {
  console.log('📰 [HEADING_GROUP] 렌더링:', {
    h1: editor.isActive('heading', { level: 1 }),
    h2: editor.isActive('heading', { level: 2 }),
    h3: editor.isActive('heading', { level: 3 }),
  });

  const handleHeading1 = () => {
    console.log('📝 [HEADING_GROUP] H1 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    }
  };

  const handleHeading2 = () => {
    console.log('📝 [HEADING_GROUP] H2 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  };

  const handleHeading3 = () => {
    console.log('📝 [HEADING_GROUP] H3 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:heading-1"
        onClick={handleHeading1}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      />
      <ToolbarButton
        icon="lucide:heading-2"
        onClick={handleHeading2}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      />
      <ToolbarButton
        icon="lucide:heading-3"
        onClick={handleHeading3}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      />
    </>
  );
}

export default HeadingButtonGroup;
