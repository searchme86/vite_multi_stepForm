import React, { useState, useCallback } from 'react';
import EditorCore from './EditorCore';
import TiptapToolbar from './toolbar/TiptapToolbar';
import EditorStatusBar from './EditorStatusBar';
import LoadingOverlay from './overlays/LoadingOverlay';
import ErrorOverlay from './overlays/ErrorOverlay';
import InfoOverlay from './overlays/InfoOverlay';
import { useMarkdownEditorState } from '../../hooks/useMarkdownEditorState';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';

interface TiptapEditorProps {
  paragraphId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  isActive: boolean;
}

function TiptapEditor({
  paragraphId,
  initialContent = '',
  onContentChange,
  isActive,
}: TiptapEditorProps) {
  console.log('📝 [TIPTAP] 렌더링:', {
    paragraphId,
    contentLength: (initialContent || '').length,
    isActive,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { handleLocalChange, isContentChanged } = useMarkdownEditorState({
    initialContent: initialContent || '',
    onContentChange,
    debounceDelay: 1000,
  });

  const { handleImageUpload } = useImageUpload({
    setIsUploadingImage,
    setUploadError,
  });

  const { editor } = useTiptapEditor({
    paragraphId,
    initialContent,
    handleLocalChange,
    handleImageUpload,
  });

  const addImage = useCallback(() => {
    console.log('🖼️ [TIPTAP] 이미지 추가 버튼 클릭');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const urls = await handleImageUpload(files);

      urls.forEach((url) => {
        if (url && editor && !editor.isDestroyed) {
          console.log('✅ [TIPTAP] 이미지 삽입:', url.slice(0, 50) + '...');
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'image',
              attrs: {
                src: url,
                alt: 'Uploaded image',
                title: 'Uploaded image',
              },
            })
            .run();
        }
      });
    };
    input.click();
  }, [editor, handleImageUpload]);

  const addLink = useCallback(() => {
    console.log('🔗 [TIPTAP] 링크 추가 버튼 클릭');
    const url = window.prompt('링크 URL을 입력하세요:');
    if (url && editor && !editor.isDestroyed) {
      console.log('✅ [TIPTAP] 링크 설정:', url);
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin" />
          <span className="text-gray-500">에디터를 로딩 중입니다...</span>
        </div>
      </div>
    );
  }

  if (editor.isDestroyed) {
    console.error('❌ [TIPTAP] 에디터가 파괴된 상태');
    return (
      <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
        <span className="text-red-500">
          에디터가 파괴되었습니다. 새로고침해주세요.
        </span>
      </div>
    );
  }

  return (
    <div
      className={`mb-4 transition-all duration-300 border border-gray-200 rounded-lg ${
        isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
    >
      <EditorStatusBar
        isContentChanged={isContentChanged}
        isUploadingImage={isUploadingImage}
        uploadError={uploadError}
        onErrorClose={() => setUploadError(null)}
      />

      <TiptapToolbar editor={editor} addImage={addImage} addLink={addLink} />

      <InfoOverlay />

      <EditorCore editor={editor} paragraphId={paragraphId} />

      <LoadingOverlay isVisible={isUploadingImage} />
      <ErrorOverlay error={uploadError} onClose={() => setUploadError(null)} />
    </div>
  );
}

export default React.memo(TiptapEditor);
