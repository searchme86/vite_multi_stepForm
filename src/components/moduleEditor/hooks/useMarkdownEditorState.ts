// 📁 src/components/moduleEditor/hooks/useMarkdownEditorState.ts

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
  const lastSavedContentRef = useRef<string>(initialContent);
  const onContentChangeRef = useRef(onContentChange);

  console.log('🎯 [USE_MD_STATE] 훅 실행:', {
    initialContent: initialContent?.substring(0, 50),
    localContent: localContent?.substring(0, 50),
    hasOnContentChange: !!onContentChange,
    debounceDelay,
  });

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    if (
      initialContent !== previousInitialContent.current &&
      initialContent !== localContent
    ) {
      console.log('🔄 [USE_MD_STATE] 초기 내용 변경 감지:', {
        oldContent: previousInitialContent.current?.substring(0, 50),
        newContent: initialContent?.substring(0, 50),
        localContent: localContent?.substring(0, 50),
      });

      setLocalContent(initialContent);
      previousInitialContent.current = initialContent;
      lastSavedContentRef.current = initialContent;
    }
  }, [initialContent, localContent]);

  const debouncedCallback = useCallback((newContent: string) => {
    console.log('⏰ [USE_MD_STATE] 디바운스 콜백 실행:', {
      content: newContent?.substring(0, 50),
      contentLength: newContent?.length || 0,
      hasCallback: !!onContentChangeRef.current,
    });

    if (
      onContentChangeRef.current &&
      typeof onContentChangeRef.current === 'function'
    ) {
      try {
        onContentChangeRef.current(newContent);
        lastSavedContentRef.current = newContent;

        console.log('✅ [USE_MD_STATE] 콜백 호출 성공:', {
          savedContent: newContent?.substring(0, 50),
          contentLength: newContent?.length || 0,
        });
      } catch (err) {
        console.error('❌ [USE_MD_STATE] 콜백 호출 실패:', err);
      }
    } else {
      console.warn('⚠️ [USE_MD_STATE] onContentChange 콜백이 없음');
      lastSavedContentRef.current = newContent;
    }
  }, []);

  const handleLocalChange = useCallback(
    (content: string) => {
      console.log('📝 [USE_MD_STATE] 로컬 내용 변경:', {
        oldContent: localContent?.substring(0, 50),
        newContent: content?.substring(0, 50),
        contentChanged: content !== localContent,
        hasRealChange: content !== lastSavedContentRef.current,
        contentLength: content?.length || 0,
        hasImages: content?.includes('![') || false,
        hasBase64: content?.includes('data:image') || false,
        timestamp: Date.now(),
      });

      if (content === localContent) {
        console.log('ℹ️ [USE_MD_STATE] 동일한 내용, 업데이트 스킵');
        return;
      }

      setLocalContent(content);

      const hasChanges = content !== lastSavedContentRef.current;

      if (!hasChanges) {
        console.log('ℹ️ [USE_MD_STATE] 저장된 내용과 동일, 콜백 스킵');
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const shouldImmediateUpdate =
        content.includes('![') && content.length > 1000;

      if (shouldImmediateUpdate) {
        console.log('🚀 [USE_MD_STATE] 이미지 포함 콘텐츠 - 즉시 전달');
        debouncedCallback(content);
      } else {
        console.log('⏱️ [USE_MD_STATE] 일반 텍스트 - 디바운스 적용');
        timeoutRef.current = setTimeout(() => {
          console.log('⏱️ [USE_MD_STATE] 디바운스 완료, 전달');
          debouncedCallback(content);
        }, debounceDelay);
      }
    },
    [localContent, debounceDelay, debouncedCallback]
  );

  const saveContent = useCallback(() => {
    console.log('💾 [USE_MD_STATE] 수동 저장 실행:', {
      localContent: localContent?.substring(0, 50),
      lastSaved: lastSavedContentRef.current?.substring(0, 50),
      hasUnsavedChanges: localContent !== lastSavedContentRef.current,
    });

    if (localContent !== lastSavedContentRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      debouncedCallback(localContent);
    } else {
      console.log('ℹ️ [USE_MD_STATE] 저장할 변경사항 없음');
    }
  }, [localContent, debouncedCallback]);

  const resetContent = useCallback(() => {
    console.log('🔄 [USE_MD_STATE] 내용 초기화:', {
      currentContent: localContent?.substring(0, 50),
      initialContent: initialContent?.substring(0, 50),
    });

    setLocalContent(initialContent);
    lastSavedContentRef.current = initialContent;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, [initialContent, localContent]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        console.log('🧹 [USE_MD_STATE] 디바운스 타이머 정리');
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasUnsavedChanges = localContent !== lastSavedContentRef.current;

  console.log('📊 [USE_MD_STATE] 현재 상태:', {
    localContentLength: localContent?.length || 0,
    lastSavedLength: lastSavedContentRef.current?.length || 0,
    hasUnsavedChanges,
    isContentChanged: localContent !== previousInitialContent.current,
  });

  return {
    localContent,
    handleLocalChange,
    isContentChanged: localContent !== previousInitialContent.current,
    hasUnsavedChanges,
    saveContent,
    resetContent,
  };
}
