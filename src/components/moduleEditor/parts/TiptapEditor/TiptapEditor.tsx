import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import EditorCore from './EditorCore';
import TiptapToolbar from './toolbar/TiptapToolbar';
import EditorStatusBar from './EditorStatusBar';
import LoadingOverlay from './overlays/LoadingOverlay';
import ErrorOverlay from './overlays/ErrorOverlay';
import InfoOverlay from './overlays/InfoOverlay';
import ConfirmBar from './ConfirmBar';
import { useMarkdownEditorState } from '../../hooks/useMarkdownEditorState';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';
import TextCountContainer from './textCount/TextCountContainer';

interface TiptapEditorProps {
  paragraphId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  isActive: boolean;
  enableTextCount?: boolean;
}

interface CharacterCount {
  withSpaces: number;
  withoutSpaces: number;
  words: number;
  paragraphs: number;
}

interface ConfirmBarState {
  isVisible: boolean;
  message: string;
  onConfirm: () => void;
}

const arePropsEqual = (
  prevProps: TiptapEditorProps,
  nextProps: TiptapEditorProps
) => {
  return (
    prevProps.paragraphId === nextProps.paragraphId &&
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.enableTextCount === nextProps.enableTextCount
  );
};

function TiptapEditor({
  paragraphId,
  initialContent = '',
  onContentChange,
  isActive,
  enableTextCount = true,
}: TiptapEditorProps) {
  const [isImageUploadInProgress, setIsImageUploadInProgress] = useState(false);
  const [imageUploadErrorMessage, setImageUploadErrorMessage] = useState<
    string | null
  >(null);
  const [characterCount, setCharacterCount] = useState<CharacterCount>({
    withSpaces: 0,
    withoutSpaces: 0,
    words: 0,
    paragraphs: 0,
  });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [confirmBarState, setConfirmBarState] = useState<ConfirmBarState>({
    isVisible: false,
    message: '',
    onConfirm: () => {},
  });

  const editorInstanceRef = useRef<any>(null);

  const calculateCharacterCount = useCallback(
    (content: string): CharacterCount => {
      const plainText = content.replace(/<[^>]*>/g, '').trim();

      const withSpaces = plainText.length;
      const withoutSpaces = plainText.replace(/\s/g, '').length;
      const words =
        plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).length;
      const paragraphs =
        plainText.trim() === ''
          ? 0
          : plainText.split(/\n\n+/).filter((p) => p.trim()).length;

      return { withSpaces, withoutSpaces, words, paragraphs };
    },
    []
  );

  const stableOnContentChangeRef = useRef(onContentChange);
  stableOnContentChangeRef.current = onContentChange;

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      const safeUpdatedContent = updatedContent || '';

      const newCharacterCount = calculateCharacterCount(safeUpdatedContent);
      setCharacterCount(newCharacterCount);

      const externalCallback = stableOnContentChangeRef.current;
      if (typeof externalCallback === 'function') {
        externalCallback(safeUpdatedContent);
      }
    },
    [paragraphId, calculateCharacterCount]
  );

  const { handleLocalChange: handleMarkdownStateChange, isContentChanged } =
    useMarkdownEditorState({
      initialContent: initialContent || '',
      onContentChange: handleContentChange,
      debounceDelay: 500,
    });

  const imageUploadConfig = useMemo(
    () => ({
      setIsUploadingImage: setIsImageUploadInProgress,
      setUploadError: setImageUploadErrorMessage,
    }),
    []
  );

  const { handleImageUpload: processImageUpload } =
    useImageUpload(imageUploadConfig);

  const stableHandleMarkdownStateChangeRef = useRef(handleMarkdownStateChange);
  stableHandleMarkdownStateChangeRef.current = handleMarkdownStateChange;

  const tiptapEditorConfig = useMemo(
    () => ({
      paragraphId: paragraphId || '',
      initialContent: initialContent || '<p></p>',
      handleLocalChange: (updatedContent: string) => {
        const stableHandler = stableHandleMarkdownStateChangeRef.current;
        if (typeof stableHandler === 'function') {
          stableHandler(updatedContent);
        }
      },
      handleImageUpload: processImageUpload,
    }),
    [paragraphId, initialContent, processImageUpload]
  );

  const { editor: tiptapEditorInstance } = useTiptapEditor(tiptapEditorConfig);

  useEffect(() => {
    if (tiptapEditorInstance && !tiptapEditorInstance.isDestroyed) {
      editorInstanceRef.current = tiptapEditorInstance;
      const initialCharCount = calculateCharacterCount(initialContent || '');
      setCharacterCount(initialCharCount);
    }
  }, [tiptapEditorInstance, initialContent, calculateCharacterCount]);

  useEffect(() => {
    const safeInitialContent = initialContent || '';

    if (
      tiptapEditorInstance &&
      !tiptapEditorInstance.isDestroyed &&
      safeInitialContent
    ) {
      const currentEditorContent = tiptapEditorInstance.getHTML();

      if (currentEditorContent !== safeInitialContent) {
        tiptapEditorInstance.commands.setContent(safeInitialContent);
        const newCharCount = calculateCharacterCount(safeInitialContent);
        setCharacterCount(newCharCount);
      }
    }
  }, [initialContent, tiptapEditorInstance, calculateCharacterCount]);

  const copyContentToClipboard = useCallback(async () => {
    const { current: editorInstance = null } = editorInstanceRef;

    if (!editorInstance || editorInstance.isDestroyed) {
      setCopyFeedback('❌ 에디터를 찾을 수 없습니다');
      return;
    }

    try {
      const htmlContent = editorInstance.getHTML();
      const textContent = editorInstance.getText();

      if (!textContent.trim()) {
        setCopyFeedback('⚠️ 복사할 내용이 없습니다');
        return;
      }

      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' }),
        });

        await navigator.clipboard.write([clipboardItem]);
        setCopyFeedback('✅ 내용이 복사되었습니다');
      } else {
        await navigator.clipboard.writeText(textContent);
        setCopyFeedback('✅ 텍스트가 복사되었습니다');
      }
    } catch (copyError) {
      console.error('복사 실패:', copyError);
      setCopyFeedback('❌ 복사에 실패했습니다');
    }

    setTimeout(() => setCopyFeedback(null), 3000);
  }, []);

  const selectAllContent = useCallback(() => {
    const { current: editorInstance = null } = editorInstanceRef;

    if (editorInstance && !editorInstance.isDestroyed) {
      editorInstance.commands.selectAll();
      editorInstance.commands.focus();
    }
  }, []);

  const requestClearContent = useCallback(() => {
    const { current: editorInstance = null } = editorInstanceRef;

    if (!editorInstance || editorInstance.isDestroyed) {
      return;
    }

    const currentContent = editorInstance.getText().trim();

    if (currentContent.length === 0) {
      setCopyFeedback('ℹ️ 삭제할 내용이 없습니다');
      setTimeout(() => setCopyFeedback(null), 2000);
      return;
    }

    const contentPreview =
      currentContent.length > 30
        ? `${currentContent.substring(0, 30)}...`
        : currentContent;

    setConfirmBarState({
      isVisible: true,
      message: `"${contentPreview}" 내용을 모두 삭제하시겠습니까?`,
      onConfirm: () => {
        if (editorInstance && !editorInstance.isDestroyed) {
          editorInstance.commands.clearContent();
          editorInstance.commands.focus();
          setCopyFeedback('🗑️ 모든 내용이 삭제되었습니다');
          setTimeout(() => setCopyFeedback(null), 2000);
        }
        setConfirmBarState((prev) => ({ ...prev, isVisible: false }));
      },
    });
  }, []);

  const cancelConfirm = useCallback(() => {
    setConfirmBarState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const addImageToEditor = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.setAttribute('aria-label', '이미지 파일 선택');

    fileInput.onchange = async (changeEvent) => {
      const { target = null } = changeEvent;
      const inputElement = target as HTMLInputElement;
      const { files = null } = inputElement;
      const selectedFiles = Array.from(files || []);

      if (selectedFiles.length === 0) {
        return;
      }

      try {
        const uploadedImageUrls = await processImageUpload(selectedFiles);

        uploadedImageUrls.forEach((imageUrl, imageIndex) => {
          const safeImageUrl = imageUrl || '';
          const { current: editorInstance = null } = editorInstanceRef;

          if (safeImageUrl && editorInstance && !editorInstance.isDestroyed) {
            const imageAltText = `업로드된 이미지 ${imageIndex + 1}`;

            editorInstance
              .chain()
              .focus()
              .insertContent({
                type: 'image',
                attrs: {
                  src: safeImageUrl,
                  alt: imageAltText,
                  title: imageAltText,
                },
              })
              .run();
          }
        });
      } catch (uploadError) {
        console.error('이미지 업로드 실패:', uploadError);
      }
    };

    fileInput.click();
  }, [processImageUpload]);

  const addLinkToEditor = useCallback(() => {
    const linkUrl = window.prompt('링크 URL을 입력하세요:');
    const safeLinkUrl = linkUrl?.trim() || '';
    const { current: editorInstance = null } = editorInstanceRef;

    if (safeLinkUrl && editorInstance && !editorInstance.isDestroyed) {
      editorInstance.chain().focus().setLink({ href: safeLinkUrl }).run();
    }
  }, []);

  if (!tiptapEditorInstance) {
    return (
      <div
        className="flex items-center justify-center p-8 border border-gray-200 rounded-lg"
        role="status"
        aria-label="에디터 로딩 중"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <span className="text-gray-500">에디터를 로딩 중입니다...</span>
        </div>
      </div>
    );
  }

  if (tiptapEditorInstance.isDestroyed) {
    return (
      <div
        className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50"
        role="alert"
        aria-label="에디터 오류"
      >
        <span className="text-red-500">
          에디터가 파괴되었습니다. 새로고침해주세요.
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative transition-all duration-300 border border-gray-200 rounded-lg ${
        confirmBarState.isVisible ? 'h-[530px]' : 'h-[490px]'
      } max-[400px] overflow-scroll ${
        isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      role="region"
      aria-label={`문단 에디터 ${paragraphId?.slice(-8) || 'unknown'}`}
    >
      {enableTextCount && (
        <TextCountContainer
          editorContent={initialContent}
          initialTargetChars={30}
        />
      )}

      <EditorStatusBar
        isContentChanged={isContentChanged}
        isUploadingImage={isImageUploadInProgress}
        uploadError={imageUploadErrorMessage}
        onErrorClose={() => setImageUploadErrorMessage(null)}
        characterCount={characterCount}
        copyFeedback={copyFeedback}
      />

      <TiptapToolbar
        editor={tiptapEditorInstance}
        addImage={addImageToEditor}
        addLink={addLinkToEditor}
        copyContent={copyContentToClipboard}
        selectAllContent={selectAllContent}
        requestClearContent={requestClearContent}
      />

      <InfoOverlay />

      <div
        className={`${
          confirmBarState.isVisible
            ? 'h-[calc(100%-120px)]'
            : 'h-[calc(100%-80px)]'
        } overflow-auto`}
      >
        <EditorCore
          editor={tiptapEditorInstance}
          paragraphId={paragraphId || ''}
        />
      </div>

      <ConfirmBar
        isVisible={confirmBarState.isVisible}
        message={confirmBarState.message}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={confirmBarState.onConfirm}
        onCancel={cancelConfirm}
        variant="danger"
      />

      <LoadingOverlay isVisible={isImageUploadInProgress} />
      <ErrorOverlay
        error={imageUploadErrorMessage}
        onClose={() => setImageUploadErrorMessage(null)}
      />

      {isActive && (
        <div
          className="absolute px-2 py-1 text-xs text-white bg-blue-500 rounded top-2 right-2"
          aria-label="현재 활성 에디터"
        >
          활성
        </div>
      )}
    </div>
  );
}

export default React.memo(TiptapEditor, arePropsEqual);
