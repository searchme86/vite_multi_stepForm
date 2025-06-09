import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface MediaButtonGroupProps {
  editor: Editor;
  addImage: () => void;
  addLink: () => void;
}

function MediaButtonGroup({
  editor,
  addImage,
  addLink,
}: MediaButtonGroupProps) {
  console.log('🎨 [MEDIA_GROUP] 렌더링:', {
    hasLink: editor.isActive('link'),
  });

  const handleAddImage = () => {
    console.log('🖼️ [MEDIA_GROUP] 이미지 추가 버튼 클릭');
    addImage();
  };

  const handleAddLink = () => {
    console.log('🔗 [MEDIA_GROUP] 링크 추가 버튼 클릭');
    addLink();
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:image"
        onClick={handleAddImage}
        title="이미지 추가"
        variant="success"
      />
      <ToolbarButton
        icon="lucide:link"
        onClick={handleAddLink}
        isActive={editor.isActive('link')}
        title="링크 추가"
      />
    </>
  );
}

export default MediaButtonGroup;
