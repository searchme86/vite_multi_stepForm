import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMarkdownEditorStateProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  debounceDelay?: number;
}

export function useMarkdownEditorState({
  initialContent,
  onContentChange,
  debounceDelay = 300,
}: UseMarkdownEditorStateProps) {
  const [localContent, setLocalContent] = useState<string>(initialContent);
  const previousInitialContent = useRef(initialContent);
  const timeoutRef = useRef<number>();

  useEffect(() => {
    if (
      initialContent !== previousInitialContent.current &&
      initialContent !== localContent
    ) {
      setLocalContent(initialContent);
      previousInitialContent.current = initialContent;
    }
  }, [initialContent, localContent]);

  const stableOnContentChange = useCallback(onContentChange, [onContentChange]);

  const handleLocalChange = useCallback(
    (content: string) => {
      console.log('📝 [USE_MD_STATE] 로컬 내용 변경:', {
        contentLength: content.length,
        hasImages: content.includes('!['),
        hasBase64: content.includes('data:image'),
        timestamp: Date.now(),
      });

      setLocalContent(content);

      // 🔥 핵심: 이미지가 포함되면 즉시 전달, 아니면 디바운스
      if (content.includes('![') && content.length > 1000) {
        console.log('🚀 [USE_MD_STATE] 이미지 포함 콘텐츠 - 즉시 전달');
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        stableOnContentChange(content);
      } else {
        console.log('⏱️ [USE_MD_STATE] 일반 텍스트 - 디바운스 적용');
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          console.log('⏱️ [USE_MD_STATE] 디바운스 완료, 전달');
          stableOnContentChange(content);
        }, debounceDelay);
      }
    },
    [stableOnContentChange, debounceDelay]
  );

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    localContent,
    handleLocalChange,
    isContentChanged: localContent !== previousInitialContent.current,
  };
}
