// 📁 src/components/moduleEditor/parts/TiptapEditor/toolbar/MediaButtonGroup.tsx

import { Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';

interface MediaButtonGroupProps {
  editor: Editor;
  addImage: () => void;
  addLink: () => void;
  disabled?: boolean; // 🔧 disabled 속성 추가
}

function MediaButtonGroup({
  editor,
  addImage,
  addLink,
  disabled = false, // 🔧 fallback 기본값 설정
}: MediaButtonGroupProps) {
  console.log('🎨 [MEDIA_GROUP] 렌더링:', {
    hasLink: editor?.isActive?.('link') || false,
    disabled,
    editorDestroyed: editor?.isDestroyed || false,
    addImageType: typeof addImage,
    addLinkType: typeof addLink,
  });

  // 🛡️ 에디터 상태 검사 함수 (타입 가드)
  const isEditorValid = (editorInstance: Editor): boolean => {
    return editorInstance && !editorInstance.isDestroyed;
  };

  const handleAddImage = () => {
    console.log('🖼️ [MEDIA_GROUP] 이미지 추가 버튼 클릭:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [MEDIA_GROUP] disabled 상태에서 이미지 추가 시도 차단');
      return;
    }

    // 🛡️ 함수 유효성 검사
    const safeAddImageCallback =
      addImage ||
      (() => {
        console.warn('⚠️ [MEDIA_GROUP] addImage 콜백이 제공되지 않음');
      });

    if (typeof safeAddImageCallback === 'function') {
      try {
        safeAddImageCallback();
      } catch (imageError) {
        console.error('❌ [MEDIA_GROUP] 이미지 추가 실패:', imageError);
      }
    }
  };

  const handleAddLink = () => {
    console.log('🔗 [MEDIA_GROUP] 링크 추가 버튼 클릭:', { disabled });

    // 🚨 disabled 상태 체크
    if (disabled) {
      console.warn('⚠️ [MEDIA_GROUP] disabled 상태에서 링크 추가 시도 차단');
      return;
    }

    // 🛡️ 함수 유효성 검사
    const safeAddLinkCallback =
      addLink ||
      (() => {
        console.warn('⚠️ [MEDIA_GROUP] addLink 콜백이 제공되지 않음');
      });

    if (typeof safeAddLinkCallback === 'function') {
      try {
        safeAddLinkCallback();
      } catch (linkError) {
        console.error('❌ [MEDIA_GROUP] 링크 추가 실패:', linkError);
      }
    }
  };

  return (
    <>
      <ToolbarButton
        icon="lucide:image"
        onClick={handleAddImage}
        title="이미지 추가"
        variant="success"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
      <ToolbarButton
        icon="lucide:link"
        onClick={handleAddLink}
        isActive={editor?.isActive?.('link') || false}
        title="링크 추가"
        isDisabled={disabled} // 🔧 disabled 상태 전달
      />
    </>
  );
}

export default MediaButtonGroup;
