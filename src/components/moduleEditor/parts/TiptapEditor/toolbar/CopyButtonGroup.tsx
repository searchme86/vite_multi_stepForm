// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/CopyButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface CopyButtonGroupProps {
  editor: Editor;
  copyContent: () => void;
  selectAllContent: () => void;
  clearAllContent: () => void;
}

function CopyButtonGroup({
  editor,
  copyContent,
  selectAllContent,
  clearAllContent,
}: CopyButtonGroupProps) {
  console.log('📋 [COPY_GROUP] 렌더링:', {
    editorDestroyed: editor.isDestroyed,
  });

  const handleCopyContent = () => {
    console.log('📋 [COPY_GROUP] 내용 복사 버튼 클릭');
    copyContent();
  };

  const handleSelectAll = () => {
    console.log('📋 [COPY_GROUP] 전체 선택 버튼 클릭');
    selectAllContent();
  };

  const handleClearAll = () => {
    console.log('📋 [COPY_GROUP] 내용 지우기 버튼 클릭');
    clearAllContent();
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:copy"
        onClick={handleCopyContent}
        title="내용 복사 (Ctrl+C)"
        variant="success"
      />
      <ToolbarButton
        icon="lucide:select-all"
        onClick={handleSelectAll}
        title="전체 선택 (Ctrl+A)"
      />
      <ToolbarButton
        icon="lucide:trash-2"
        onClick={handleClearAll}
        title="모든 내용 지우기"
        variant="danger"
      />
    </>
  );
}

export default CopyButtonGroup;
