import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

//====여기부터 수정됨====
// 기존: props로만 데이터를 받던 방식
// 새로운: zustand store에서도 데이터를 가져올 수 있는 방식 추가
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../store/editorUI/editorUIStore';
//====여기까지 수정됨====

interface UseMarkdownEditorStateProps {
  initialContent: string;
  onContentChange: (content: string) => void;
  debounceDelay?: number;
}

//====여기부터 수정됨====
// 타입 안전성 강화: 명시적 타입 정의
type ContentChangeHandler = (content: string) => void;
type ActiveContentGetter = () => string;

// zustand store 타입 정의
type EditorCoreStoreType = {
  getParagraphById: (id: string) =>
    | {
        content: string;
        id: string;
        containerId: string | null;
        order: number;
        createdAt: Date;
        updatedAt: Date;
      }
    | undefined;
  updateParagraphContent: (id: string, content: string) => void;
  getContainers: () => any[];
  getParagraphs: () => any[];
  getCompletedContent: () => string;
  getIsCompleted: () => boolean;
  setContainers: (containers: any[]) => void;
  setParagraphs: (paragraphs: any[]) => void;
  setCompletedContent: (content: string) => void;
  setIsCompleted: (completed: boolean) => void;
};

type EditorUIStoreType = {
  getActiveParagraphId: () => string | null;
  getCurrentSubStep: () => string;
  getIsTransitioning: () => boolean;
  getIsPreviewOpen: () => boolean;
  getSelectedParagraphIds: () => string[];
  getTargetContainerId: () => string;
  setActiveParagraphId: (id: string | null) => void;
};

// 에러 처리를 위한 안전한 content 가져오기 함수
const safeGetParagraphContent = (
  editorCoreStore: EditorCoreStoreType,
  paragraphId: string | null,
  fallbackContent: string = ''
): string => {
  try {
    if (!paragraphId) {
      console.log('⚠️ [USE_MD_STATE] 활성 단락 ID가 없습니다, 기본값 반환');
      return fallbackContent;
    }

    const paragraph = editorCoreStore.getParagraphById(paragraphId);
    if (!paragraph) {
      console.warn('⚠️ [USE_MD_STATE] 단락을 찾을 수 없습니다:', paragraphId);
      return fallbackContent;
    }

    return paragraph.content || fallbackContent;
  } catch (error) {
    console.error('❌ [USE_MD_STATE] 단락 content 가져오기 실패:', error);
    return fallbackContent;
  }
};

// 에러 처리를 위한 안전한 content 업데이트 함수
const safeUpdateParagraphContent = (
  editorCoreStore: EditorCoreStoreType,
  paragraphId: string | null,
  content: string
): boolean => {
  try {
    if (!paragraphId) {
      console.log(
        '⚠️ [USE_MD_STATE] 활성 단락 ID가 없어 업데이트를 건너뜁니다'
      );
      return false;
    }

    const paragraph = editorCoreStore.getParagraphById(paragraphId);
    if (!paragraph) {
      console.warn(
        '⚠️ [USE_MD_STATE] 업데이트할 단락을 찾을 수 없습니다:',
        paragraphId
      );
      return false;
    }

    editorCoreStore.updateParagraphContent(paragraphId, content);
    console.log('✅ [USE_MD_STATE] 단락 content 업데이트 성공:', {
      paragraphId,
      contentLength: content.length,
    });
    return true;
  } catch (error) {
    console.error('❌ [USE_MD_STATE] 단락 content 업데이트 실패:', error);
    return false;
  }
};

// 대량 이미지 content 처리를 위한 메모리 최적화 함수
const optimizeImageContent = (content: string): string => {
  try {
    // 10MB 이상의 큰 content는 이미지 압축 로직 적용 (여기서는 로깅만)
    if (content.length > 10 * 1024 * 1024) {
      console.warn('🔥 [USE_MD_STATE] 대용량 content 감지, 최적화 필요:', {
        size: Math.round(content.length / 1024 / 1024) + 'MB',
        imageCount: (content.match(/data:image/g) || []).length,
      });
      // 실제 프로덕션에서는 여기서 이미지 압축이나 분할 처리
    }
    return content;
  } catch (error) {
    console.error('❌ [USE_MD_STATE] content 최적화 실패:', error);
    return content;
  }
};
//====여기까지 수정됨====

//====여기부터 수정됨====
// 기존 함수 시그니처 100% 유지하면서 props를 optional로 변경
// 이렇게 하면 기존 코드는 그대로 작동하고, 새로운 코드는 매개변수 없이 호출 가능
export function useMarkdownEditorState(props?: UseMarkdownEditorStateProps) {
  // zustand store에서 데이터 가져오기 (context 대신 사용) - 타입 명시
  const editorCoreStore = useEditorCoreStore() as EditorCoreStoreType;
  const editorUIStore = useEditorUIStore() as EditorUIStoreType;

  // 성능 최적화: 활성 단락 ID를 메모이제이션하여 불필요한 리렌더링 방지
  const activeParagraphId = useMemo(() => {
    return props ? null : editorUIStore.getActiveParagraphId();
  }, [props, editorUIStore]);

  // 타입 안전성 강화: 명시적 타입 정의와 함께 활성 content 가져오기
  const getActiveContent: ActiveContentGetter = useCallback(() => {
    if (props) return '';

    return safeGetParagraphContent(editorCoreStore, activeParagraphId, '');
  }, [props, editorCoreStore, activeParagraphId]);

  // 타입 안전성 강화: 명시적 타입 정의와 함께 content 변경 핸들러
  const getOnContentChange: () => ContentChangeHandler = useCallback(() => {
    if (props?.onContentChange) return props.onContentChange;

    // zustand store를 사용하는 경우의 content 변경 핸들러
    return (content: string) => {
      // 대량 이미지 content 최적화 적용
      const optimizedContent = optimizeImageContent(content);

      // 안전한 업데이트 실행
      const updateSuccess = safeUpdateParagraphContent(
        editorCoreStore,
        activeParagraphId,
        optimizedContent
      );

      if (!updateSuccess) {
        console.warn(
          '⚠️ [USE_MD_STATE] content 업데이트 실패, 로컬 상태만 유지'
        );
      }
    };
  }, [props, editorCoreStore, activeParagraphId]);

  // 성능 최적화: 값들을 메모이제이션하여 불필요한 계산 방지
  const memoizedValues = useMemo(() => {
    const initialContent = props?.initialContent ?? getActiveContent();
    const onContentChange = getOnContentChange();
    const debounceDelay = props?.debounceDelay ?? 300;

    return { initialContent, onContentChange, debounceDelay };
  }, [
    props?.initialContent,
    props?.onContentChange,
    props?.debounceDelay,
    getActiveContent,
    getOnContentChange,
  ]);

  const { initialContent, onContentChange, debounceDelay } = memoizedValues;
  //====여기까지 수정됨====

  const [localContent, setLocalContent] = useState<string>(initialContent);
  const previousInitialContent = useRef(initialContent);
  const timeoutRef = useRef<number>();

  //====여기부터 수정됨====
  // 에러 처리 강화: initialContent 동기화 시 안전 장치 추가
  useEffect(() => {
    try {
      if (
        initialContent !== previousInitialContent.current &&
        initialContent !== localContent
      ) {
        console.log('🔄 [USE_MD_STATE] 초기 content 동기화:', {
          이전길이: previousInitialContent.current.length,
          새길이: initialContent.length,
          현재길이: localContent.length,
        });

        setLocalContent(initialContent);
        previousInitialContent.current = initialContent;
      }
    } catch (error) {
      console.error('❌ [USE_MD_STATE] 초기 content 동기화 실패:', error);
    }
  }, [initialContent, localContent]);
  //====여기까지 수정됨====

  const stableOnContentChange = useCallback(onContentChange, [onContentChange]);

  //====여기부터 수정됨====
  // 에러 처리 강화: content 변경 핸들러에 안전 장치 추가
  const handleLocalChange = useCallback(
    (content: string) => {
      try {
        console.log('📝 [USE_MD_STATE] 로컬 내용 변경:', {
          contentLength: content.length,
          hasImages: content.includes('!['),
          hasBase64: content.includes('data:image'),
          timestamp: Date.now(),
          메모리사용량: Math.round(content.length / 1024) + 'KB',
        });

        setLocalContent(content);

        // 🔥 핵심: 이미지가 포함되면 즉시 전달, 아니면 디바운스
        if (content.includes('![') && content.length > 1000) {
          console.log('🚀 [USE_MD_STATE] 이미지 포함 콘텐츠 - 즉시 전달');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // 안전한 content 변경 실행
          try {
            stableOnContentChange(content);
          } catch (error) {
            console.error('❌ [USE_MD_STATE] 즉시 content 변경 실패:', error);
          }
        } else {
          console.log('⏱️ [USE_MD_STATE] 일반 텍스트 - 디바운스 적용');
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            try {
              console.log('⏱️ [USE_MD_STATE] 디바운스 완료, 전달');
              stableOnContentChange(content);
            } catch (error) {
              console.error(
                '❌ [USE_MD_STATE] 디바운스 content 변경 실패:',
                error
              );
            }
          }, debounceDelay);
        }
      } catch (error) {
        console.error('❌ [USE_MD_STATE] 로컬 content 변경 처리 실패:', error);
      }
    },
    [stableOnContentChange, debounceDelay]
  );
  //====여기까지 수정됨====

  // 클린업 - 에러 처리 강화
  useEffect(() => {
    return () => {
      try {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          console.log('🧹 [USE_MD_STATE] 디바운스 타이머 정리 완료');
        }
      } catch (error) {
        console.error('❌ [USE_MD_STATE] 클린업 실패:', error);
      }
    };
  }, []);

  //====여기부터 수정됨====
  // 성능 최적화: props가 없을 때만 zustand store와 동기화, 메모이제이션 적용
  useEffect(() => {
    if (!props && activeParagraphId) {
      try {
        const newContent = safeGetParagraphContent(
          editorCoreStore,
          activeParagraphId,
          ''
        );

        if (
          newContent !== localContent &&
          newContent !== previousInitialContent.current
        ) {
          console.log('🔄 [USE_MD_STATE] zustand store 동기화:', {
            단락ID: activeParagraphId,
            이전길이: localContent.length,
            새길이: newContent.length,
          });

          setLocalContent(newContent);
          previousInitialContent.current = newContent;
        }
      } catch (error) {
        console.error('❌ [USE_MD_STATE] zustand store 동기화 실패:', error);
      }
    }
  }, [props, activeParagraphId, editorCoreStore, localContent]);

  // 성능 최적화: 활성 단락 변경 감지 및 자동 content 로드
  useEffect(() => {
    if (!props && activeParagraphId) {
      try {
        const newContent = safeGetParagraphContent(
          editorCoreStore,
          activeParagraphId,
          ''
        );

        console.log('🎯 [USE_MD_STATE] 활성 단락 변경 감지:', {
          새단락ID: activeParagraphId,
          content길이: newContent.length,
        });

        setLocalContent(newContent);
        previousInitialContent.current = newContent;
      } catch (error) {
        console.error('❌ [USE_MD_STATE] 활성 단락 변경 처리 실패:', error);
      }
    }
  }, [props, activeParagraphId, editorCoreStore]);
  //====여기까지 수정됨====

  //====여기부터 수정됨====
  // 성능 최적화: 반환값 메모이제이션
  const returnValue = useMemo(() => {
    const baseReturn = {
      localContent,
      handleLocalChange,
      isContentChanged: localContent !== previousInitialContent.current,
    };

    // 개발 환경 체크 (process 대신 안전한 방법 사용)
    const isDevelopment =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('dev'));

    // 추가 디버깅 정보 (개발 환경에서만)
    if (isDevelopment) {
      return {
        ...baseReturn,
        _debug: {
          activeParagraphId,
          contentLength: localContent.length,
          hasImages: localContent.includes('!['),
          usingZustand: !props,
        },
      };
    }

    return baseReturn;
  }, [localContent, handleLocalChange, activeParagraphId, props]);

  return returnValue;
  //====여기까지 수정됨====
}

//====여기부터 수정됨====
// 🔧 다른 Hook들과의 일관성을 위한 패턴 가이드 주석
//
// 이 패턴은 다른 훅들에도 적용 가능합니다:
//
// 1. useImageUpload.ts:
//    - props?: UseImageUploadProps 형태로 변경
//    - zustand store에서 활성 단락 정보 가져오기
//    - 이미지 업로드 결과를 자동으로 store에 반영
//
// 2. useTiptapEditor.ts:
//    - props?: UseTiptapEditorProps 형태로 변경
//    - 에디터 인스턴스 생성 시 store 상태 반영
//    - 에디터 변경사항을 자동으로 store에 동기화
//
// 3. useParagraphActions.ts:
//    - props?: UseParagraphActionsProps 형태로 변경
//    - 단락 CRUD 작업을 store 기반으로 실행
//    - 로컬 상태와 store 상태 자동 동기화
//
// 공통 패턴:
// - optional props로 기존 호환성 유지
// - zustand store 기반 fallback 로직
// - 에러 처리 및 안전 장치 강화
// - 성능 최적화 (메모이제이션, 구독 최적화)
// - 타입 안전성 강화
//====여기까지 수정됨====
