// 📁 src/components/moduleEditor/parts/TiptapEditor/TiptapEditor.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    contentPreview: (initialContent || '').slice(0, 100),
    hasImages: (initialContent || '').includes('!['),
    isActive,
    timestamp: Date.now(),
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previousContentRef = useRef<string>(initialContent);
  const editorInstanceRef = useRef<any>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const forceSyncContent = useCallback(() => {
    if (editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
      const currentHtml = editorInstanceRef.current.getHTML();
      console.log('🔄 [TIPTAP] 강제 동기화 실행:', {
        paragraphId,
        currentHtml: currentHtml.substring(0, 50),
        previousContent: previousContentRef.current.substring(0, 50),
        hasChange: currentHtml !== previousContentRef.current,
      });

      if (currentHtml !== previousContentRef.current) {
        previousContentRef.current = currentHtml;
        if (onContentChange && typeof onContentChange === 'function') {
          onContentChange(currentHtml);
          lastSyncTimeRef.current = Date.now();
        }
      }
    }
  }, [paragraphId, onContentChange]);

  const handleImmediateSync = useCallback(
    (newContent: string) => {
      const now = Date.now();
      if (now - lastSyncTimeRef.current < 100) return;

      console.log('⚡ [TIPTAP] 즉시 동기화:', {
        paragraphId,
        contentLength: newContent.length,
        hasRealChange: newContent !== previousContentRef.current,
      });

      if (newContent !== previousContentRef.current) {
        previousContentRef.current = newContent;
        lastSyncTimeRef.current = now;

        if (onContentChange && typeof onContentChange === 'function') {
          try {
            onContentChange(newContent);
            console.log('✅ [TIPTAP] 즉시 동기화 성공');
          } catch (error) {
            console.error('❌ [TIPTAP] 즉시 동기화 실패:', error);
          }
        }
      }
    },
    [paragraphId, onContentChange]
  );

  const handleRealTimeContentChange = useCallback(
    (newContent: string) => {
      console.log('📝 [TIPTAP] 실시간 내용 변경:', {
        paragraphId,
        oldContent: previousContentRef.current.substring(0, 50),
        newContent: newContent.substring(0, 50),
        contentLength: newContent.length,
        hasRealChange: newContent !== previousContentRef.current,
      });

      const isImportantChange =
        newContent.includes('![') ||
        newContent.length > previousContentRef.current.length + 10 ||
        Math.abs(newContent.length - previousContentRef.current.length) > 50;

      if (isImportantChange) {
        handleImmediateSync(newContent);
      } else {
        if (newContent !== previousContentRef.current) {
          previousContentRef.current = newContent;

          if (onContentChange && typeof onContentChange === 'function') {
            try {
              onContentChange(newContent);
              console.log('🎉 [TIPTAP] onContentChange 호출 성공');
            } catch (error) {
              console.error('❌ [TIPTAP] onContentChange 호출 실패:', error);
            }
          }
        }
      }
    },
    [paragraphId, onContentChange, handleImmediateSync]
  );

  const { handleLocalChange, isContentChanged } = useMarkdownEditorState({
    initialContent: initialContent || '',
    onContentChange: handleRealTimeContentChange,
    debounceDelay: 300,
  });

  useEffect(() => {
    if (
      initialContent !== previousContentRef.current &&
      initialContent !== undefined
    ) {
      console.log('🔄 [TIPTAP] 외부 content 변경 감지:', {
        paragraphId,
        oldContent: previousContentRef.current,
        newContent: initialContent,
      });

      previousContentRef.current = initialContent;

      if (editorInstanceRef.current && !editorInstanceRef.current.isDestroyed) {
        const currentHtml = editorInstanceRef.current.getHTML();
        if (currentHtml !== initialContent) {
          console.log('🔧 [TIPTAP] 에디터 내용 동기화');
          editorInstanceRef.current.commands.setContent(
            initialContent || '<p></p>'
          );
        }
      }
    }
  }, [initialContent, paragraphId]);

  const { handleImageUpload } = useImageUpload({
    setIsUploadingImage,
    setUploadError,
  });

  const { editor } = useTiptapEditor({
    paragraphId,
    initialContent: initialContent || '<p></p>',
    handleLocalChange: (content: string) => {
      console.log('🔄 [TIPTAP] 에디터 내용 업데이트:', {
        paragraphId,
        contentLength: content.length,
        contentPreview: content.substring(0, 50),
      });
      handleLocalChange(content);
    },
    handleImageUpload,
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editorInstanceRef.current = editor;

      if (initialContent && editor.getHTML() !== initialContent) {
        console.log('🔧 [TIPTAP] 에디터 초기화 - 내용 설정:', {
          paragraphId,
          settingContent: initialContent.substring(0, 50),
        });
        editor.commands.setContent(initialContent);
      }

      const handleUpdate = () => {
        if (editor && !editor.isDestroyed) {
          const currentHtml = editor.getHTML();
          handleLocalChange(currentHtml);
        }
      };

      const handleBlur = () => {
        if (editor && !editor.isDestroyed) {
          const finalHtml = editor.getHTML();
          console.log('🎯 [TIPTAP] 포커스 아웃, 최종 저장:', {
            paragraphId,
            finalContent: finalHtml.substring(0, 50),
          });
          handleImmediateSync(finalHtml);
        }
      };

      editor.on('update', handleUpdate);
      editor.on('blur', handleBlur);

      return () => {
        if (editor && !editor.isDestroyed) {
          editor.off('update', handleUpdate);
          editor.off('blur', handleBlur);
        }
      };
    }
  }, [
    editor,
    initialContent,
    paragraphId,
    handleLocalChange,
    handleImmediateSync,
  ]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      const urls = await handleImageUpload(files);

      urls.forEach((url) => {
        if (url && editor && !editor.isDestroyed) {
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
    const url = window.prompt('링크 URL을 입력하세요:');
    if (url && editor && !editor.isDestroyed) {
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

      {isActive && (
        <div className="absolute px-2 py-1 text-xs text-white bg-blue-500 rounded top-2 right-2">
          활성
        </div>
      )}
    </div>
  );
}

export default React.memo(TiptapEditor);
