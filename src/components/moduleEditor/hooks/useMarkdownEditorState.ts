import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

interface UseMarkdownEditorStateProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  debounceDelay?: number;
}

export function useMarkdownEditorState({
  initialContent,
  onContentChange,
  debounceDelay = 1000,
}: UseMarkdownEditorStateProps) {
  console.log('🪝 [USE_MD_STATE] 훅 초기화:', {
    initialContentLength: initialContent.length,
    debounceDelay,
  });

  const [localContent, setLocalContent] = useState<string>(initialContent);
  const debouncedContent = useDebounce(localContent, debounceDelay);
  const previousInitialContent = useRef(initialContent);

  useEffect(() => {
    if (
      initialContent !== previousInitialContent.current &&
      initialContent !== localContent
    ) {
      console.log('🔄 [USE_MD_STATE] 외부 초기값 변경 감지, 로컬 상태 동기화');
      setLocalContent(initialContent);
      previousInitialContent.current = initialContent;
    }
  }, [initialContent, localContent]);

  const stableOnContentChange = useCallback(onContentChange, []);

  useEffect(() => {
    if (
      debouncedContent !== previousInitialContent.current &&
      debouncedContent.trim() !== ''
    ) {
      console.log(
        '💾 [USE_MD_STATE] 디바운스된 내용 변경, 상위 컴포넌트에 전달'
      );
      stableOnContentChange(debouncedContent);
    }
  }, [debouncedContent, stableOnContentChange]);

  const handleLocalChange = useCallback((content: string) => {
    console.log('📝 [USE_MD_STATE] 로컬 내용 변경:', {
      contentLength: content.length,
    });
    setLocalContent(content);
  }, []);

  return {
    localContent,
    handleLocalChange,
    isContentChanged: debouncedContent !== previousInitialContent.current,
  };
}
