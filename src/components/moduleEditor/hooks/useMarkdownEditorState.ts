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
    initialContentPreview: initialContent.slice(0, 100),
    initialContentHasImages: initialContent.includes('!['),
    debounceDelay,
    timestamp: Date.now(),
  });

  const [localContent, setLocalContent] = useState<string>(initialContent);
  const debouncedContent = useDebounce(localContent, debounceDelay);
  const previousInitialContent = useRef(initialContent);
  const callCountRef = useRef(0);
  const latestContentRef = useRef<string>(initialContent);
  const lastImageContentRef = useRef<string>('');

  useEffect(() => {
    if (
      initialContent !== previousInitialContent.current &&
      initialContent !== localContent
    ) {
      console.log(
        '🔄 [USE_MD_STATE] 외부 초기값 변경 감지, 로컬 상태 동기화:',
        {
          previousContent: previousInitialContent.current.slice(0, 100),
          newInitialContent: initialContent.slice(0, 100),
          currentLocalContent: localContent.slice(0, 100),
          hasImagesInNew: initialContent.includes('!['),
          hasImagesInPrevious: previousInitialContent.current.includes('!['),
          previousLength: previousInitialContent.current.length,
          newLength: initialContent.length,
          currentLength: localContent.length,
          timestamp: Date.now(),
        }
      );
      console.log(
        '🔄 [USE_MD_STATE] setLocalContent 호출 - 외부 초기값으로 설정:',
        {
          willSetTo: initialContent.slice(0, 200),
          willSetLength: initialContent.length,
          hasImages: initialContent.includes('!['),
        }
      );
      setLocalContent(initialContent);
      previousInitialContent.current = initialContent;
    }
  }, [initialContent, localContent]);

  const stableOnContentChange = useCallback(onContentChange, []);

  useEffect(() => {
    console.log('🕐 [USE_MD_STATE] 디바운스 체크:', {
      debouncedContentLength: debouncedContent.length,
      debouncedContentPreview: debouncedContent.slice(0, 100),
      debouncedContentHasImages: debouncedContent.includes('!['),
      previousInitialContent: previousInitialContent.current.slice(0, 100),
      isDifferentFromPrevious:
        debouncedContent !== previousInitialContent.current,
      isNotEmpty: debouncedContent.trim() !== '',
      willTriggerChange:
        debouncedContent !== previousInitialContent.current &&
        debouncedContent.trim() !== '',
      timestamp: Date.now(),
    });

    if (
      debouncedContent !== previousInitialContent.current &&
      debouncedContent.trim() !== ''
    ) {
      console.log(
        '💾 [USE_MD_STATE] 디바운스된 내용 변경, 상위 컴포넌트에 전달:',
        {
          contentLength: debouncedContent.length,
          contentPreview: debouncedContent.slice(0, 200),
          hasImages: debouncedContent.includes('!['),
          hasBase64: debouncedContent.includes('data:image'),
          fullContent: debouncedContent,
          previousContent: previousInitialContent.current.slice(0, 100),
          lengthChange:
            debouncedContent.length - previousInitialContent.current.length,
          timestamp: Date.now(),
        }
      );
      stableOnContentChange(debouncedContent);
    }
  }, [debouncedContent, stableOnContentChange]);

  const handleLocalChange = useCallback(
    (content: string) => {
      const currentCallCount = ++callCountRef.current;

      latestContentRef.current = content;

      if (content.includes('![') && content.length > 10000) {
        lastImageContentRef.current = content;
        console.log('🖼️ [USE_MD_STATE] 이미지 콘텐츠 강제 저장:', {
          callNumber: currentCallCount,
          contentLength: content.length,
          hasImages: true,
          forceUpdate: true,
        });
      }

      console.log('📝 [USE_MD_STATE] 로컬 내용 변경 - 함수 호출:', {
        callNumber: currentCallCount,
        contentLength: content.length,
        contentPreview: content.slice(0, 100),
        hasImages: content.includes('!['),
        hasBase64: content.includes('data:image'),
        willUpdateLocalContent: true,
        timestamp: Date.now(),
        callerInfo: new Error().stack
          ?.split('\n')[2]
          ?.includes('useTiptapEditor')
          ? 'FROM_TIPTAP'
          : 'FROM_OTHER',
      });

      console.log('📝 [USE_MD_STATE] setLocalContent 호출 전 상태:', {
        callNumber: currentCallCount,
        currentLocalContent: localContent.slice(0, 100),
        currentLocalLength: localContent.length,
        aboutToSetContent: content.slice(0, 100),
        aboutToSetLength: content.length,
        isSignificantChange:
          Math.abs(content.length - localContent.length) > 100,
      });

      const contentToUse =
        lastImageContentRef.current &&
        lastImageContentRef.current.length > content.length
          ? lastImageContentRef.current
          : content;

      console.log('🎯 [USE_MD_STATE] 최종 사용할 콘텐츠 결정:', {
        originalLength: content.length,
        lastImageLength: lastImageContentRef.current.length,
        finalContentLength: contentToUse.length,
        usingImageContent: contentToUse === lastImageContentRef.current,
      });

      setLocalContent(contentToUse);

      setTimeout(() => {
        console.log('📝 [USE_MD_STATE] setLocalContent 완료 후 상태 확인:', {
          callNumber: currentCallCount,
          actualLocalContent: localContent.slice(0, 100),
          actualLocalLength: localContent.length,
          expectedContent: contentToUse.slice(0, 100),
          expectedLength: contentToUse.length,
          stateUpdateSuccess: localContent === contentToUse,
          timestamp: Date.now(),
        });
      }, 10);
    },
    [localContent]
  );

  console.log('🔍 [USE_MD_STATE] 현재 상태 스냅샷:', {
    localContentLength: localContent.length,
    localContentPreview: localContent.slice(0, 100),
    localContentHasImages: localContent.includes('!['),
    debouncedContentLength: debouncedContent.length,
    debouncedContentPreview: debouncedContent.slice(0, 100),
    debouncedContentHasImages: debouncedContent.includes('!['),
    isContentChanged: debouncedContent !== previousInitialContent.current,
    totalCallCount: callCountRef.current,
    stateConsistency: localContent.length === debouncedContent.length,
    lastImageContentLength: lastImageContentRef.current.length,
    hasStoredImageContent: lastImageContentRef.current.length > 0,
    timestamp: Date.now(),
  });

  const finalContent =
    lastImageContentRef.current && lastImageContentRef.current.includes('![')
      ? lastImageContentRef.current
      : localContent;

  return {
    localContent: finalContent,
    handleLocalChange,
    isContentChanged: debouncedContent !== previousInitialContent.current,
  };
}
