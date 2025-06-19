// 📁 src/components/moduleEditor/parts/TiptapEditor/TiptapEditor.tsx

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
import { useMarkdownEditorState } from '../../hooks/useMarkdownEditorState';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useTiptapEditor } from '../../hooks/useTiptapEditor';

interface TiptapEditorProps {
  paragraphId: string;
  initialContent: string;
  onContentChange: (content: string) => void;
  isActive: boolean;
}

// 🎯 렌더링 최적화를 위한 비교 함수 (핵심 props만 비교)
const arePropsEqual = (
  prevProps: TiptapEditorProps,
  nextProps: TiptapEditorProps
) => {
  return (
    prevProps.paragraphId === nextProps.paragraphId &&
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.isActive === nextProps.isActive
    // 🚨 onContentChange는 의도적으로 제외 (상위 컴포넌트 함수 재생성 무시)
  );
};

function TiptapEditor({
  paragraphId,
  initialContent = '',
  onContentChange,
  isActive,
}: TiptapEditorProps) {
  console.log('📝 [TIPTAP_BASIC] 기본 에디터 렌더링:', {
    paragraphId: paragraphId?.slice(-8) || 'unknown',
    contentLength: (initialContent || '').length,
    contentPreview: (initialContent || '').slice(0, 50),
    hasImages: (initialContent || '').includes('!['),
    isActive,
    renderTimestamp: Date.now(),
  });

  // 🔧 기본 상태 관리만
  const [isImageUploadInProgress, setIsImageUploadInProgress] = useState(false);
  const [imageUploadErrorMessage, setImageUploadErrorMessage] = useState<
    string | null
  >(null);

  // 🔧 에디터 참조
  const editorInstanceRef = useRef<any>(null);

  // 🎯 안정화된 콘텐츠 변경 핸들러 (의존성 최소화)
  const stableOnContentChangeRef = useRef(onContentChange);
  stableOnContentChangeRef.current = onContentChange;

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      const safeUpdatedContent = updatedContent || '';

      console.log('📝 [TIPTAP_BASIC] 콘텐츠 변경:', {
        paragraphId: paragraphId?.slice(-8) || 'unknown',
        contentLength: safeUpdatedContent?.length || 0,
        contentPreview: safeUpdatedContent?.substring(0, 30) || '',
      });

      // 🎯 안정화된 외부 콜백 호출
      const externalCallback = stableOnContentChangeRef.current;
      if (typeof externalCallback === 'function') {
        externalCallback(safeUpdatedContent);
      }
    },
    [paragraphId] // onContentChange 의존성 제거
  );

  // 🔧 useMarkdownEditorState 훅 사용 (상위 컴포넌트 업데이트 빈도 조절)
  const { handleLocalChange: handleMarkdownStateChange, isContentChanged } =
    useMarkdownEditorState({
      initialContent: initialContent || '',
      onContentChange: handleContentChange,
      debounceDelay: 500, // 🚀 상위 컴포넌트 업데이트 빈도 대폭 감소 (0.5초)
    });

  // 🖼️ 이미지 업로드 처리 (메모이제이션)
  const imageUploadConfig = useMemo(
    () => ({
      setIsUploadingImage: setIsImageUploadInProgress,
      setUploadError: setImageUploadErrorMessage,
    }),
    []
  );

  const { handleImageUpload: processImageUpload } =
    useImageUpload(imageUploadConfig);

  // 🎯 Tiptap 에디터 설정 (메모이제이션으로 불필요한 재생성 방지)
  const stableHandleMarkdownStateChangeRef = useRef(handleMarkdownStateChange);
  stableHandleMarkdownStateChangeRef.current = handleMarkdownStateChange;

  const tiptapEditorConfig = useMemo(
    () => ({
      paragraphId: paragraphId || '',
      initialContent: initialContent || '<p></p>',
      handleLocalChange: (updatedContent: string) => {
        console.log('🔄 [TIPTAP_BASIC] 에디터 업데이트:', {
          paragraphId: paragraphId?.slice(-8) || 'unknown',
          contentLength: updatedContent?.length || 0,
          contentPreview: updatedContent?.substring(0, 30) || '',
        });
        // ✅ 안정화된 핸들러 사용
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

  // 🔧 에디터 인스턴스 등록 (의존성 최소화)
  useEffect(() => {
    if (tiptapEditorInstance && !tiptapEditorInstance.isDestroyed) {
      editorInstanceRef.current = tiptapEditorInstance;

      console.log('🔧 [TIPTAP_BASIC] 에디터 인스턴스 등록:', {
        paragraphId: paragraphId?.slice(-8) || 'unknown',
        editorReady: true,
      });
    }
  }, [tiptapEditorInstance]); // paragraphId 제거

  // 🔄 외부 initialContent 변경 시 에디터 동기화 (의존성 최적화)
  useEffect(() => {
    const safeInitialContent = initialContent || '';

    if (
      tiptapEditorInstance &&
      !tiptapEditorInstance.isDestroyed &&
      safeInitialContent
    ) {
      const currentEditorContent = tiptapEditorInstance.getHTML();

      // 내용이 실제로 다를 때만 업데이트
      if (currentEditorContent !== safeInitialContent) {
        console.log('🔄 [TIPTAP_BASIC] 외부 content 동기화:', {
          paragraphId: paragraphId?.slice(-8) || 'unknown',
          oldContent: currentEditorContent?.substring(0, 30) || '',
          newContent: safeInitialContent?.substring(0, 30) || '',
        });

        tiptapEditorInstance.commands.setContent(safeInitialContent);
      }
    }
  }, [initialContent, tiptapEditorInstance]); // paragraphId 제거

  // 🖼️ 이미지 추가 핸들러
  const addImageToEditor = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;

    // 웹접근성 향상
    fileInput.setAttribute('aria-label', '이미지 파일 선택');

    fileInput.onchange = async (changeEvent) => {
      const { target = null } = changeEvent;
      const inputElement = target as HTMLInputElement;
      const { files = null } = inputElement;
      const selectedFiles = Array.from(files || []);

      if (selectedFiles.length === 0) {
        console.log('📷 [TIPTAP_BASIC] 이미지 선택 취소');
        return;
      }

      try {
        console.log('📷 [TIPTAP_BASIC] 이미지 업로드 시작:', {
          fileCount: selectedFiles.length,
          fileNames: selectedFiles.map((file) => file.name),
        });

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

            console.log('📷 [TIPTAP_BASIC] 이미지 삽입 완료:', {
              imageUrl: safeImageUrl,
              altText: imageAltText,
            });
          }
        });
      } catch (uploadError) {
        console.error('❌ [TIPTAP_BASIC] 이미지 업로드 실패:', uploadError);
      }
    };

    fileInput.click();
  }, [processImageUpload]);

  // 🔗 링크 추가 핸들러
  const addLinkToEditor = useCallback(() => {
    const linkUrl = window.prompt('링크 URL을 입력하세요:');
    const safeLinkUrl = linkUrl?.trim() || '';
    const { current: editorInstance = null } = editorInstanceRef;

    if (safeLinkUrl && editorInstance && !editorInstance.isDestroyed) {
      console.log('🔗 [TIPTAP_BASIC] 링크 추가:', {
        linkUrl: safeLinkUrl,
      });

      editorInstance.chain().focus().setLink({ href: safeLinkUrl }).run();
    }
  }, []);

  // 🔧 에디터 로딩 상태 처리
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

  // 🔧 에디터 파괴 상태 처리
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
      className={`mb-4 transition-all duration-300 border border-gray-200 rounded-lg ${
        isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
      }`}
      role="region"
      aria-label={`문단 에디터 ${paragraphId?.slice(-8) || 'unknown'}`}
    >
      <EditorStatusBar
        isContentChanged={isContentChanged}
        isUploadingImage={isImageUploadInProgress}
        uploadError={imageUploadErrorMessage}
        onErrorClose={() => setImageUploadErrorMessage(null)}
      />

      <TiptapToolbar
        editor={tiptapEditorInstance}
        addImage={addImageToEditor}
        addLink={addLinkToEditor}
      />

      <InfoOverlay />

      <EditorCore
        editor={tiptapEditorInstance}
        paragraphId={paragraphId || ''}
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
