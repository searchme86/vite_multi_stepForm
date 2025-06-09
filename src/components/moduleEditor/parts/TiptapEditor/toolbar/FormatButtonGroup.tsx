import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface FormatButtonGroupProps {
  editor: Editor;
}

function FormatButtonGroup({ editor }: FormatButtonGroupProps) {
  console.log('🔤 [FORMAT_GROUP] 렌더링:', {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    strike: editor.isActive('strike'),
  });

  const handleBold = () => {
    console.log('📝 [FORMAT_GROUP] Bold 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleBold().run();
    }
  };

  const handleItalic = () => {
    console.log('📝 [FORMAT_GROUP] Italic 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleItalic().run();
    }
  };

  const handleStrike = () => {
    console.log('📝 [FORMAT_GROUP] Strike 토글');
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().toggleStrike().run();
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:bold"
        onClick={handleBold}
        isActive={editor.isActive('bold')}
        title="굵게 (Ctrl+B)"
      />
      <ToolbarButton
        icon="lucide:italic"
        onClick={handleItalic}
        isActive={editor.isActive('italic')}
        title="기울임 (Ctrl+I)"
      />
      <ToolbarButton
        icon="lucide:strikethrough"
        onClick={handleStrike}
        isActive={editor.isActive('strike')}
        title="취소선"
      />
    </>
  );
}

export default FormatButtonGroup;
