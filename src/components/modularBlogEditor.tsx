// modularBlogEditor.tsx - Tiptap 완전 교체 버전 (수정됨)
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Button, Input, Chip, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

// Tiptap 관련 imports - 수정된 부분
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import DropCursor from '@tiptap/extension-dropcursor'; // 수정: default export
import GapCursor from '@tiptap/extension-gapcursor'; // 수정: default export

import {
  useMultiStepForm,
  createContainer,
  generateCompletedContent,
  validateEditorState,
} from './useMultiStepForm';

// ==================== 디바운스 훅 ====================
/**
 * 디바운스 훅 - 입력값이 변경되어도 일정 시간 후에만 업데이트
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (밀리초)
 * @returns 디바운스된 값
 */
function useDebounce<T>(value: T, delay: number): T {
  // 디바운스된 값을 저장할 상태 - 초기값은 전달받은 값으로 설정
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 지연 시간 후에 값을 업데이트하는 타이머 설정
    // setTimeout을 사용하여 delay 시간만큼 기다린 후 실행
    const handler = setTimeout(() => {
      setDebouncedValue(value); // 지연 시간이 지나면 실제 값으로 업데이트
    }, delay);

    // cleanup 함수 - 컴포넌트가 언마운트되거나 의존성이 변경될 때 타이머 정리
    // 이를 통해 메모리 누수 방지 및 불필요한 업데이트 방지
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // value나 delay가 변경될 때만 effect 재실행

  return debouncedValue; // 디바운스된 값 반환
}

// ==================== 마크다운 에디터 상태 관리 훅 ====================
/**
 * 마크다운 에디터 상태 관리 훅
 * 디바운스를 적용하여 입력 완료 후에만 상위 컴포넌트에 변경사항 전달
 */
interface UseMarkdownEditorStateProps {
  initialContent: string; // 초기 컨텐츠 값
  onContentChange: (content: string) => void; // 상위 컴포넌트로 변경사항을 전달하는 함수
  debounceDelay?: number; // 디바운스 지연 시간 (기본값: 1000ms)
}

function useMarkdownEditorState({
  initialContent,
  onContentChange,
  debounceDelay = 1000, // 1초 기본 디바운스 적용
}: UseMarkdownEditorStateProps) {
  // 로컬 상태 - 사용자가 실시간으로 타이핑하는 내용을 저장
  // 이 상태는 즉시 업데이트되어 UI 반응성을 보장
  const [localContent, setLocalContent] = useState<string>(initialContent);

  // 디바운스된 값 - 사용자가 타이핑을 멈춘 후 일정 시간이 지나면 업데이트
  // 이를 통해 불필요한 상위 컴포넌트 업데이트를 방지
  const debouncedContent = useDebounce(localContent, debounceDelay);

  // 이전 초기값을 추적하여 불필요한 업데이트 방지
  const previousInitialContent = useRef(initialContent);

  // 외부에서 초기값이 변경될 때 로컬 상태도 동기화
  // 예: 다른 단락을 선택했을 때 해당 내용으로 에디터 내용 변경
  useEffect(() => {
    // 실제로 초기값이 변경되었고, 현재 로컬 내용과 다를 때만 업데이트
    if (
      initialContent !== previousInitialContent.current &&
      initialContent !== localContent
    ) {
      console.log('🔄 [MD_STATE] 외부 초기값 변경 감지, 로컬 상태 동기화');
      setLocalContent(initialContent);
      previousInitialContent.current = initialContent;
    }
  }, [initialContent, localContent]);

  // 안정적인 onContentChange 참조 생성
  const stableOnContentChange = useCallback(onContentChange, []);

  // 디바운스된 값이 변경될 때만 상위 컴포넌트에 알림
  // 이를 통해 사용자가 타이핑을 완료한 후에만 컨텍스트 업데이트
  useEffect(() => {
    // 디바운스된 값이 초기값과 다르고, 실제로 변경되었을 때만 업데이트
    if (
      debouncedContent !== previousInitialContent.current &&
      debouncedContent.trim() !== ''
    ) {
      console.log('💾 [MD_STATE] 디바운스된 내용 변경, 상위 컴포넌트에 전달');
      stableOnContentChange(debouncedContent);
    }
  }, [debouncedContent, stableOnContentChange]);

  // 로컬 상태 업데이트 함수
  // 사용자가 타이핑할 때마다 즉시 호출되어 UI 반응성 제공
  const handleLocalChange = useCallback((content: string) => {
    setLocalContent(content);
  }, []);

  return {
    localContent, // 현재 에디터에 표시될 내용
    handleLocalChange, // 에디터 변경 핸들러
    isContentChanged: debouncedContent !== previousInitialContent.current, // 내용이 변경되었는지 여부
  };
}

// ==================== 이미지 업로드 유틸리티 ====================
/**
 * 파일을 Base64 문자열로 변환하는 함수
 * @param file - 변환할 파일 객체
 * @returns Promise<string> - Base64 인코딩된 문자열
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // FileReader API를 사용하여 파일을 읽음
    const reader = new FileReader();

    // 파일 읽기 완료 시 실행되는 콜백
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // Base64 문자열 반환
      } else {
        reject(new Error('파일을 읽을 수 없습니다.'));
      }
    };

    // 파일 읽기 실패 시 실행되는 콜백
    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    };

    // 파일을 Base64 데이터 URL로 읽기 시작
    reader.readAsDataURL(file);
  });
};

/**
 * 이미지 파일인지 확인하는 함수
 * @param file - 확인할 파일 객체
 * @returns boolean - 이미지 파일 여부
 */
const isImageFile = (file: File): boolean => {
  // 허용되는 이미지 MIME 타입들
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  return allowedTypes.includes(file.type);
};

// ==================== 타입 정의 ====================
type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

// 🔥 로컬 단락 인터페이스 - Context와 완전 분리
interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null; // undefined 대신 null 사용
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string; // 원본 단락 ID (복사본인 경우에만 존재)
}

// ==================== Tiptap 에디터 컴포넌트 ====================
// 🔥 Tiptap 기반 마크다운 에디터 컴포넌트 - WYSIWYG + 이미지 업로드 지원
const TiptapMarkdownEditor = React.memo(
  ({
    paragraphId,
    initialContent,
    onContentChange,
    isActive,
  }: {
    paragraphId: string;
    initialContent: string;
    onContentChange: (content: string) => void;
    isActive: boolean;
  }) => {
    console.log('📝 [TIPTAP] 렌더링:', {
      paragraphId,
      contentLength: initialContent.length,
      isActive,
    });

    // 이미지 업로드 상태 관리
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // 디바운스가 적용된 마크다운 에디터 상태 관리
    const { localContent, handleLocalChange, isContentChanged } =
      useMarkdownEditorState({
        initialContent,
        onContentChange,
        debounceDelay: 1000,
      });

    // 🖼️ 이미지 업로드 핸들러
    const handleImageUpload = useCallback(
      async (files: File[]): Promise<string[]> => {
        const imageFiles = files.filter(isImageFile);

        if (imageFiles.length === 0) {
          setUploadError('이미지 파일만 업로드할 수 있습니다.');
          return [];
        }

        // 파일 크기 체크 (10MB 제한)
        const oversizedFiles = imageFiles.filter(
          (file) => file.size > 10 * 1024 * 1024
        );
        if (oversizedFiles.length > 0) {
          setUploadError('10MB 이하의 이미지만 업로드할 수 있습니다.');
          return [];
        }

        setIsUploadingImage(true);
        setUploadError(null);

        console.log(
          '🖼️ [TIPTAP] 이미지 업로드 시작:',
          imageFiles.length + '개'
        );

        try {
          // 모든 이미지 파일을 Base64로 변환
          const base64Promises = imageFiles.map(async (file) => {
            try {
              const base64Data = await fileToBase64(file);
              console.log('✅ [TIPTAP] 파일 변환 완료:', file.name);
              return base64Data;
            } catch (error) {
              console.error(`❌ [TIPTAP] 파일 ${file.name} 변환 실패:`, error);
              throw new Error(`${file.name} 변환에 실패했습니다.`);
            }
          });

          const base64Results = await Promise.all(base64Promises);

          console.log(
            '✅ [TIPTAP] 모든 이미지 업로드 완료:',
            imageFiles.length + '개'
          );
          return base64Results;
        } catch (error) {
          console.error('❌ [TIPTAP] 이미지 업로드 실패:', error);
          setUploadError(
            error instanceof Error
              ? error.message
              : '이미지 업로드 중 오류가 발생했습니다.'
          );
          return [];
        } finally {
          setIsUploadingImage(false);
        }
      },
      []
    );

    // Tiptap 에디터 설정
    const editor = useEditor(
      {
        extensions: [
          StarterKit.configure({
            // 기본 마크다운 요소들 활성화
            heading: {
              levels: [1, 2, 3, 4, 5, 6],
            },
            bulletList: {
              keepMarks: true,
              keepAttributes: false,
            },
            orderedList: {
              keepMarks: true,
              keepAttributes: false,
            },
          }),
          Image.configure({
            // 이미지 확장 설정
            HTMLAttributes: {
              class: 'tiptap-image',
            },
            allowBase64: true, // Base64 이미지 허용
          }),
          Link.configure({
            // 링크 확장 설정
            openOnClick: false,
            HTMLAttributes: {
              class: 'tiptap-link',
            },
          }),
          Placeholder.configure({
            // 플레이스홀더 설정
            placeholder: ({ node }) => {
              if (node.type.name === 'heading') {
                return '제목을 입력하세요...';
              }
              return '마크다운 형식으로 내용을 작성하세요...\n\n🖼️ 이미지 추가 방법:\n• 파일을 드래그 앤 드롭\n• Ctrl+V로 클립보드에서 붙여넣기\n• 툴바의 이미지 버튼 클릭\n\n지원 형식: JPG, PNG, GIF, WebP, SVG (최대 10MB)';
            },
          }),
          Markdown.configure({
            // 마크다운 지원 설정
            html: false,
            transformCopiedText: true,
            transformPastedText: true,
          }),
          DropCursor, // 드래그 앤 드롭 커서 - 수정: default import
          GapCursor, // 빈 공간 클릭 커서 - 수정: default import
        ],
        content: localContent, // 초기 내용
        onUpdate: ({ editor }) => {
          // 에디터 내용이 변경될 때마다 호출
          const markdown = editor.storage.markdown.getMarkdown();
          console.log('📝 [TIPTAP] 내용 변경 감지');
          handleLocalChange(markdown);
        },
        editorProps: {
          // 드래그 앤 드롭 이미지 업로드 처리
          handleDrop: (view, event, slice, moved) => {
            if (
              !moved &&
              event.dataTransfer &&
              event.dataTransfer.files &&
              event.dataTransfer.files[0]
            ) {
              const files = Array.from(event.dataTransfer.files);
              const imageFiles = files.filter(isImageFile);

              if (imageFiles.length > 0) {
                event.preventDefault();

                // 이미지 업로드 처리
                handleImageUpload(imageFiles).then((urls) => {
                  const { state } = view;
                  const { selection } = state;
                  const position = selection.$cursor
                    ? selection.$cursor.pos
                    : selection.anchor;

                  urls.forEach((url, index) => {
                    if (url) {
                      const node = state.schema.nodes.image.create({
                        src: url,
                        alt: imageFiles[index]?.name || 'Uploaded image',
                      });
                      const transaction = state.tr.insert(
                        position + index,
                        node
                      );
                      view.dispatch(transaction);
                    }
                  });
                });

                return true;
              }
            }
            return false;
          },
          // 클립보드 이미지 붙여넣기 처리
          handlePaste: (view, event, slice) => {
            const items = Array.from(event.clipboardData?.items || []);
            const imageItems = items.filter((item) =>
              item.type.startsWith('image/')
            );

            if (imageItems.length > 0) {
              event.preventDefault();

              const files = imageItems
                .map((item) => item.getAsFile())
                .filter((file): file is File => file !== null);

              handleImageUpload(files).then((urls) => {
                const { state } = view;
                const { selection } = state;
                const position = selection.$cursor
                  ? selection.$cursor.pos
                  : selection.anchor;

                urls.forEach((url, index) => {
                  if (url) {
                    const node = state.schema.nodes.image.create({
                      src: url,
                      alt: `붙여넣은_이미지_${Date.now()}_${index}.png`,
                    });
                    const transaction = state.tr.insert(position + index, node);
                    view.dispatch(transaction);
                  }
                });
              });

              return true;
            }
            return false;
          },
          attributes: {
            class:
              'tiptap-editor prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            'data-paragraph-id': paragraphId,
          },
        },
      },
      [localContent, handleLocalChange, handleImageUpload, paragraphId]
    );

    // 외부에서 내용이 변경될 때 에디터 업데이트
    useEffect(() => {
      if (editor && initialContent !== localContent) {
        console.log('🔄 [TIPTAP] 외부 내용 변경, 에디터 업데이트');
        const currentContent = editor.storage.markdown.getMarkdown();
        if (currentContent !== initialContent) {
          editor.commands.setContent(initialContent);
        }
      }
    }, [editor, initialContent, localContent]);

    // 툴바 버튼 핸들러들
    const addImage = useCallback(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const urls = await handleImageUpload(files);

        urls.forEach((url) => {
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
      };
      input.click();
    }, [editor, handleImageUpload]);

    const addLink = useCallback(() => {
      const url = window.prompt('링크 URL을 입력하세요:');
      if (url && editor) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }, [editor]);

    if (!editor) {
      return (
        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
          <Icon icon="lucide:loader-2" className="text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-500">에디터를 로딩 중입니다...</span>
        </div>
      );
    }

    return (
      <div
        className={`mb-4 transition-all duration-300 border border-gray-200 rounded-lg ${
          isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
      >
        {/* 내용이 변경되었을 때 시각적 피드백 제공 */}
        {isContentChanged && (
          <div className="flex items-center gap-1 p-2 text-xs text-blue-600 animate-pulse bg-blue-50">
            <Icon icon="lucide:clock" className="text-blue-500" />
            변경사항이 저장 대기 중입니다...
          </div>
        )}

        {/* 이미지 업로드 로딩 상태 */}
        {isUploadingImage && (
          <div className="flex items-center gap-1 p-2 text-xs text-green-600 animate-pulse bg-green-50">
            <Icon
              icon="lucide:loader-2"
              className="text-green-500 animate-spin"
            />
            이미지를 업로드하고 있습니다...
          </div>
        )}

        {/* 이미지 업로드 에러 메시지 */}
        {uploadError && (
          <div className="flex items-center gap-1 p-2 text-xs text-red-600 bg-red-50">
            <Icon icon="lucide:alert-circle" className="text-red-500" />
            {uploadError}
            <button
              type="button"
              className="ml-2 text-xs underline"
              onClick={() => setUploadError(null)}
            >
              닫기
            </button>
          </div>
        )}

        {/* Tiptap 툴바 */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="굵게 (Ctrl+B)"
          >
            <Icon icon="lucide:bold" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="기울임 (Ctrl+I)"
          >
            <Icon icon="lucide:italic" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="취소선"
          >
            <Icon icon="lucide:strikethrough" />
          </button>

          <div className="w-px h-6 mx-1 bg-gray-300" />

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-blue-100 text-blue-600'
                : ''
            }`}
            title="제목 1"
          >
            <Icon icon="lucide:heading-1" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-blue-100 text-blue-600'
                : ''
            }`}
            title="제목 2"
          >
            <Icon icon="lucide:heading-2" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-blue-100 text-blue-600'
                : ''
            }`}
            title="제목 3"
          >
            <Icon icon="lucide:heading-3" />
          </button>

          <div className="w-px h-6 mx-1 bg-gray-300" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="불릿 리스트"
          >
            <Icon icon="lucide:list" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="순서 리스트"
          >
            <Icon icon="lucide:list-ordered" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="인용구"
          >
            <Icon icon="lucide:quote" />
          </button>

          <div className="w-px h-6 mx-1 bg-gray-300" />

          <button
            type="button"
            onClick={addImage}
            className="p-2 text-green-600 rounded hover:bg-gray-200"
            title="이미지 추가"
          >
            <Icon icon="lucide:image" />
          </button>
          <button
            type="button"
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="링크 추가"
          >
            <Icon icon="lucide:link" />
          </button>

          <div className="w-px h-6 mx-1 bg-gray-300" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="실행 취소 (Ctrl+Z)"
          >
            <Icon icon="lucide:undo" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="다시 실행 (Ctrl+Y)"
          >
            <Icon icon="lucide:redo" />
          </button>
        </div>

        {/* Tiptap 사용법 안내 */}
        <div className="flex items-center gap-1 p-2 text-xs text-gray-500 bg-gray-50">
          <Icon icon="lucide:info" className="text-gray-400" />
          💡 텍스트를 클릭하여 바로 편집하고, 툴바나 드래그앤드롭으로 이미지를
          추가하세요!
        </div>

        {/* Tiptap 에디터 */}
        <div className="tiptap-wrapper">
          <EditorContent
            editor={editor}
            className="min-h-[200px] p-4 focus-within:outline-none"
          />
        </div>

        {/* Tiptap 에디터 스타일 */}
        <style jsx>{`
          .tiptap-wrapper :global(.ProseMirror) {
            outline: none;
            min-height: 200px;
            padding: 1rem;
          }

          .tiptap-wrapper
            :global(.ProseMirror p.is-editor-empty:first-child::before) {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
            white-space: pre-line;
          }

          .tiptap-wrapper :global(.tiptap-image) {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 0.5rem 0;
          }

          .tiptap-wrapper :global(.tiptap-link) {
            color: #3b82f6;
            text-decoration: underline;
          }

          .tiptap-wrapper :global(.ProseMirror-dropcursor) {
            border-left: 2px solid #3b82f6;
          }

          .tiptap-wrapper :global(.ProseMirror-gapcursor) {
            display: none;
            pointer-events: none;
            position: absolute;
          }

          .tiptap-wrapper :global(.ProseMirror-gapcursor:after) {
            content: '';
            display: block;
            position: absolute;
            top: -2px;
            width: 20px;
            border-top: 1px solid #3b82f6;
            animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
          }

          @keyframes ProseMirror-cursor-blink {
            to {
              visibility: hidden;
            }
          }

          .tiptap-wrapper :global(.ProseMirror-selectednode) {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
        `}</style>
      </div>
    );
  }
);

// ==================== 구조 입력 컴포넌트 ====================
// 🔥 완전히 분리된 입력 컴포넌트 - Context와 무관하게 작동
const StructureInputSection = React.memo(
  ({
    onStructureComplete,
  }: {
    onStructureComplete: (inputs: string[]) => void;
  }) => {
    console.log('🎯 [STRUCTURE_INPUT] 컴포넌트 렌더링 시작');

    const [containerInputs, setContainerInputs] = useState<string[]>([
      '',
      '',
      '',
      '',
    ]);
    const [isValid, setIsValid] = useState(false);

    const handleDirectInputChange = useCallback(
      (index: number, value: string) => {
        console.log('🚀 [STRUCTURE_INPUT] 직접 입력 처리:', {
          index,
          value,
          timestamp: Date.now(),
        });

        setContainerInputs((prev) => {
          if (prev[index] === value) {
            return prev;
          }

          const newInputs = [...prev];
          newInputs[index] = value;

          const validCount = newInputs.filter(
            (input) => input.trim().length > 0
          ).length;
          const valid = validCount >= 2;

          setIsValid(valid);
          return newInputs;
        });
      },
      []
    );

    const changeHandlers = useMemo(() => {
      return containerInputs.map((_, index) => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
          handleDirectInputChange(index, e.target.value);
        };
      });
    }, [containerInputs.length, handleDirectInputChange]);

    const addInput = useCallback(() => {
      setContainerInputs((prev) => [...prev, '']);
    }, []);

    const removeInput = useCallback(() => {
      setContainerInputs((prev) => {
        if (prev.length <= 2) return prev;
        const newInputs = prev.slice(0, -1);
        const validCount = newInputs.filter(
          (input) => input.trim().length > 0
        ).length;
        setIsValid(validCount >= 2);
        return newInputs;
      });
    }, []);

    const handleComplete = useCallback(() => {
      const validInputs = containerInputs.filter(
        (input) => input.trim().length > 0
      );
      onStructureComplete(validInputs);
    }, [containerInputs, onStructureComplete]);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            🏗️ 글 구조를 설계해주세요
          </h2>
          <p className="text-gray-600">
            어떤 순서와 구조로 글을 작성하고 싶으신가요? 각 섹션의 이름을
            입력해주세요.
          </p>
        </div>

        <div className="p-6 mb-6 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="mb-3 text-lg font-semibold text-blue-900">
            💡 섹션 예시
          </h3>
          <p className="mb-4 text-blue-800">
            다음과 같은 섹션들을 만들어보세요:
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { title: '📄 글 요약', desc: '핵심 내용 정리' },
              { title: '📋 목차', desc: '글의 구성' },
              { title: '🚀 서론', desc: '문제 제기' },
              { title: '💡 본론', desc: '핵심 내용' },
              { title: '📊 분석', desc: '데이터 해석' },
              { title: '🎯 결론', desc: '최종 정리' },
              { title: '🔗 참고자료', desc: '출처 링크' },
              { title: '✨ 추가 팁', desc: '보너스 내용' },
            ].map((item, index) => (
              <div
                key={index}
                className="p-3 bg-white border border-blue-200 rounded-lg"
              >
                <div className="text-sm font-medium text-blue-900">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-blue-700">{item.desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-blue-700">
            ⚡ 팁: 최소 2개 이상의 섹션을 만들어야 다음 단계로 진행할 수
            있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          {containerInputs.map((input, index) => (
            <div key={`input-${index}`} className="space-y-2">
              <label
                htmlFor={`section-input-${index}`}
                className="block text-sm font-medium text-gray-700"
              >
                섹션 {index + 1}
              </label>
              <Input
                id={`section-input-${index}`}
                value={input}
                onChange={changeHandlers[index]}
                placeholder={`섹션 ${index + 1} 이름을 입력하세요`}
                className="w-full"
                variant="bordered"
                autoComplete="off"
                spellCheck="false"
                aria-describedby={`section-help-${index}`}
              />
              <div id={`section-help-${index}`} className="sr-only">
                {`${index + 1}번째 섹션의 이름을 입력하세요`}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-lg bg-gray-50">
          <h3 className="mb-4 text-lg font-semibold">
            📋 생성될 구조 미리보기
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {containerInputs
              .filter((input) => input.trim().length > 0)
              .map((input, index) => (
                <div
                  key={`preview-${index}`}
                  className="flex items-center gap-3"
                >
                  {index > 0 && (
                    <Icon icon="lucide:arrow-right" className="text-gray-400" />
                  )}
                  <Chip color="primary" variant="flat">
                    {input.trim()}
                  </Chip>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-3">
              <Button
                type="button"
                color="default"
                variant="flat"
                onPress={addInput}
                startContent={<Icon icon="lucide:plus" />}
                aria-label="새 섹션 추가"
              >
                섹션 추가
              </Button>
              <Button
                type="button"
                color="danger"
                variant="flat"
                onPress={removeInput}
                isDisabled={containerInputs.length <= 2}
                startContent={<Icon icon="lucide:minus" />}
                aria-label="마지막 섹션 삭제"
              >
                마지막 섹션 삭제
              </Button>
            </div>

            <Button
              type="button"
              color="primary"
              onPress={handleComplete}
              isDisabled={!isValid}
              endContent={<Icon icon="lucide:arrow-right" />}
              aria-label="다음 단계로 이동"
            >
              다음: 글 작성하기
            </Button>
          </div>
        </div>

        <div className="p-4 text-center border border-green-200 rounded-lg bg-green-50">
          <p className="text-green-800">
            ✅ <strong>입력 상태:</strong> 입력 개수: {containerInputs.length} |
            유효성: {isValid ? '✅' : '❌'} | 핸들러: {changeHandlers.length}개
          </p>
        </div>
      </div>
    );
  }
);

// ==================== 메인 컴포넌트 ====================
function ModularBlogEditor(): React.ReactNode {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 [MAIN] ModularBlogEditor 렌더링 횟수:', renderCount.current);

  const context = useMultiStepForm();

  if (!context) {
    console.log('❌ [MAIN] Context 없음');
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">
          에디터를 사용하려면 MultiStepForm Context가 필요합니다.
        </p>
      </div>
    );
  }

  const {
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
  } = context;

  console.log('📊 [MAIN] Context 상태:', {
    containers: editorState.containers.length,
    paragraphs: editorState.paragraphs.length,
    isCompleted: editorState.isCompleted,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔥 최소한의 내부 상태만 관리
  const [internalState, setInternalState] = useState<EditorInternalState>({
    currentSubStep: 'structure',
    isTransitioning: false,
    activeParagraphId: null,
    isPreviewOpen: true,
    selectedParagraphIds: [],
    targetContainerId: '',
  });

  // 🔥 로컬 단락 상태 - Context와 완전 분리
  const [localParagraphs, setLocalParagraphs] = useState<LocalParagraph[]>([]);
  const [localContainers, setLocalContainers] = useState<any[]>([]);

  console.log('🏠 [MAIN] 로컬 상태:', {
    currentSubStep: internalState.currentSubStep,
    localParagraphs: localParagraphs.length,
    localContainers: localContainers.length,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 🔥 구조 완료 처리 - Context 업데이트는 여기서만
  const handleStructureComplete = useCallback(
    (validInputs: string[]) => {
      console.log('🎉 [MAIN] 구조 완료 처리 시작:', validInputs);

      if (validInputs.length < 2) {
        addToast({
          title: '구조 설정 오류',
          description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
          color: 'warning',
        });
        return;
      }

      setInternalState((prev) => ({ ...prev, isTransitioning: true }));

      // 로컬 컨테이너 생성
      const containers = validInputs.map((name, index) =>
        createContainer(name, index)
      );
      setLocalContainers(containers);
      console.log('📦 [MAIN] 로컬 컨테이너 생성:', containers);

      setTimeout(() => {
        setInternalState((prev) => ({
          ...prev,
          currentSubStep: 'writing',
          isTransitioning: false,
        }));
      }, 300);

      addToast({
        title: '구조 설정 완료',
        description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    },
    [addToast]
  );

  const goToStructureStep = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setInternalState((prev) => ({
        ...prev,
        currentSubStep: 'structure',
        isTransitioning: false,
      }));
    }, 300);
  }, []);

  // 🔥 로컬 단락 관리 함수들 - Context와 완전 분리
  const addLocalParagraph = useCallback(() => {
    console.log('📄 [LOCAL] 새 단락 추가');
    const newParagraph: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      containerId: null,
      order: localParagraphs.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalParagraphs((prev) => [...prev, newParagraph]);
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: newParagraph.id,
    }));

    console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraph.id);
  }, [localParagraphs.length]);

  // 🔥 디바운스된 내용 업데이트 - 완전히 분리
  const updateLocalParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId,
        contentLength: content.length,
      });

      setLocalParagraphs((prev) =>
        prev.map((p) =>
          p.id === paragraphId ? { ...p, content, updatedAt: new Date() } : p
        )
      );
    },
    []
  );

  const deleteLocalParagraph = useCallback(
    (paragraphId: string) => {
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', paragraphId);
      setLocalParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));

      addToast({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    },
    [addToast]
  );

  const toggleParagraphSelection = useCallback((paragraphId: string) => {
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
        ? prev.selectedParagraphIds.filter((id) => id !== paragraphId)
        : [...prev.selectedParagraphIds, paragraphId],
    }));
  }, []);

  const addToLocalContainer = useCallback(() => {
    if (internalState.selectedParagraphIds.length === 0) {
      addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!internalState.targetContainerId) {
      addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    // 로컬에서 처리 - 복사본을 컨테이너에 추가 (원본은 유지)
    const existingParagraphs = localParagraphs.filter(
      (p) => p.containerId === internalState.targetContainerId
    );
    const lastOrder =
      existingParagraphs.length > 0
        ? Math.max(...existingParagraphs.map((p) => p.order))
        : -1;

    // 선택된 단락들의 복사본을 생성하여 컨테이너에 추가
    const selectedParagraphs = localParagraphs.filter((p) =>
      internalState.selectedParagraphIds.includes(p.id)
    );

    const newParagraphs = selectedParagraphs.map((paragraph, index) => ({
      ...paragraph,
      id: `paragraph-copy-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      originalId: paragraph.id, // 원본 단락 ID 저장 - 클릭하여 편집에서 사용
      containerId: internalState.targetContainerId,
      order: lastOrder + index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // 새로운 복사본 단락들을 추가 (원본은 그대로 유지)
    setLocalParagraphs((prev) => [...prev, ...newParagraphs]);

    // 선택 상태 해제
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: [],
      targetContainerId: '', // 컨테이너 선택도 초기화
    }));

    addToast({
      title: '단락 추가 완료',
      description: `${selectedParagraphs.length}개의 단락이 ${
        localContainers.find((c) => c.id === internalState.targetContainerId)
          ?.name
      } 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  }, [
    internalState.selectedParagraphIds,
    internalState.targetContainerId,
    localParagraphs,
    localContainers,
    addToast,
  ]);

  const moveLocalParagraphInContainer = useCallback(
    (paragraphId: string, direction: 'up' | 'down') => {
      const paragraph = localParagraphs.find((p) => p.id === paragraphId);
      if (!paragraph || !paragraph.containerId) return;

      const containerParagraphs = localParagraphs
        .filter((p) => p.containerId === paragraph.containerId)
        .sort((a, b) => a.order - b.order);

      const currentIndex = containerParagraphs.findIndex(
        (p) => p.id === paragraphId
      );

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' &&
          currentIndex === containerParagraphs.length - 1)
      ) {
        return;
      }

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetParagraph = containerParagraphs[targetIndex];

      setLocalParagraphs((prev) =>
        prev.map((p) => {
          if (p.id === paragraphId) {
            return { ...p, order: targetParagraph.order };
          }
          if (p.id === targetParagraph.id) {
            return { ...p, order: paragraph.order };
          }
          return p;
        })
      );
    },
    [localParagraphs]
  );

  const activateEditor = useCallback((paragraphId: string) => {
    console.log('🎯 [ACTIVATE] 에디터 활성화 시도:', paragraphId);

    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: paragraphId,
    }));

    // 조금 더 긴 지연시간을 주어 상태 업데이트 후 스크롤 실행
    setTimeout(() => {
      // 원본 단락을 찾아서 스크롤 (containerId가 null인 것)
      const targetElement = document.querySelector(
        `[data-paragraph-id="${paragraphId}"]`
      );

      console.log('🔍 [ACTIVATE] 대상 요소 찾기:', {
        paragraphId,
        elementFound: !!targetElement,
        elementTag: targetElement?.tagName,
      });

      if (targetElement) {
        // 부모 스크롤 컨테이너 찾기
        const scrollContainer = targetElement.closest('.overflow-y-auto');

        if (scrollContainer) {
          console.log('📜 [ACTIVATE] 스크롤 컨테이너 찾음, 스크롤 실행');

          // 스크롤 컨테이너 기준으로 스크롤 위치 계산
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = targetElement.getBoundingClientRect();
          const offsetTop =
            elementRect.top - containerRect.top + scrollContainer.scrollTop;

          // 부드러운 스크롤로 해당 위치로 이동
          scrollContainer.scrollTo({
            top: Math.max(0, offsetTop - 20), // 20px 여백을 두고 스크롤
            behavior: 'smooth',
          });
        } else {
          // 전체 창 기준으로 스크롤
          console.log('📜 [ACTIVATE] 전체 창 기준 스크롤 실행');
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // 요소를 화면 상단으로 스크롤
            inline: 'nearest',
          });
        }
      } else {
        console.warn('❌ [ACTIVATE] 대상 요소를 찾을 수 없음:', paragraphId);
      }
    }, 200); // 200ms 지연으로 충분한 시간 확보
  }, []);

  const togglePreview = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      isPreviewOpen: !prev.isPreviewOpen,
    }));
  }, []);

  // 🔥 전체 저장 함수 - 한번에 Context 업데이트
  const saveAllToContext = useCallback(() => {
    console.log('💾 [SAVE] 전체 Context 저장 시작');

    // 컨테이너 저장
    updateEditorContainers(localContainers);

    // 단락 저장 (로컬 형태를 Context 형태로 변환)
    const contextParagraphs = localParagraphs.map((p) => ({
      ...p,
      // containerId를 null로 유지 (Context 형태와 일치)
    }));
    updateEditorParagraphs(contextParagraphs);

    console.log('💾 [SAVE] Context 저장 완료:', {
      containers: localContainers.length,
      paragraphs: localParagraphs.length,
    });

    addToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }, [
    localContainers,
    localParagraphs,
    updateEditorContainers,
    updateEditorParagraphs,
    addToast,
  ]);

  const completeEditor = useCallback(() => {
    console.log('🎉 [MAIN] 에디터 완성 처리');

    // 먼저 전체 저장
    saveAllToContext();

    // 완성 처리
    const completedContent = generateCompletedContent(
      localContainers,
      localParagraphs
    );

    if (
      !validateEditorState({
        containers: localContainers,
        paragraphs: localParagraphs,
        completedContent,
        isCompleted: true,
      })
    ) {
      addToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    updateEditorCompletedContent(completedContent);
    setEditorCompleted(true);

    addToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }, [
    localContainers,
    localParagraphs,
    saveAllToContext,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
  ]);

  const renderMarkdown = useCallback((text: string) => {
    if (!text) return <span className="text-gray-400">내용이 없습니다.</span>;

    let formatted = text
      .replace(
        /^# (.*?)$/gm,
        '<span class="text-2xl font-bold mb-3 block">$1</span>'
      )
      .replace(
        /^## (.*?)$/gm,
        '<span class="text-xl font-bold mb-2 block">$1</span>'
      )
      .replace(
        /^### (.*?)$/gm,
        '<span class="text-lg font-bold mb-2 block">$1</span>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />');

    return (
      <div
        className="prose cursor-pointer max-w-none"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  }, []);

  // 🔥 로컬 상태 기반 유틸 함수들
  const getLocalUnassignedParagraphs = useCallback(() => {
    return localParagraphs.filter((p) => !p.containerId);
  }, [localParagraphs]);

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string) => {
      return localParagraphs
        .filter((p) => p.containerId === containerId)
        .sort((a, b) => a.order - b.order);
    },
    [localParagraphs]
  );

  // WritingStep 내부의 버튼 이벤트 핸들러들 수정
  const WritingStep = () => {
    console.log('✍️ [MAIN] WritingStep 렌더링');
    const unassignedParagraphs = getLocalUnassignedParagraphs();
    const sortedContainers = [...localContainers].sort(
      (a, b) => a.order - b.order
    );

    return (
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              color="default"
              variant="flat"
              onPress={goToStructureStep}
              startContent={<Icon icon="lucide:arrow-left" />}
              aria-label="구조 설계 단계로 돌아가기"
            >
              구조 수정
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>구조:</span>
              {sortedContainers.map((container, index) => (
                <div key={container.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <Icon icon="lucide:arrow-right" className="text-gray-400" />
                  )}
                  <Badge color="primary" variant="flat">
                    {container.name}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                color="secondary"
                variant="flat"
                onPress={saveAllToContext}
                startContent={<Icon icon="lucide:save" />}
                aria-label="현재 작성 내용 저장"
              >
                저장
              </Button>
              <Button
                type="button"
                color="success"
                onPress={completeEditor}
                endContent={<Icon icon="lucide:check" />}
                aria-label="글 작성 완료"
              >
                완성
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}
          style={{ height: '70vh' }}
        >
          <div
            className={`${
              isMobile ? 'w-full' : 'flex-1'
            } border border-gray-200 rounded-lg`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <span className="text-lg font-semibold">
                📝 단락 작성 (Tiptap)
              </span>
              <Button
                type="button"
                color="primary"
                size="sm"
                onPress={addLocalParagraph}
                startContent={<Icon icon="lucide:plus" />}
                aria-label="새로운 단락 추가"
              >
                새 단락
              </Button>
            </div>

            <div
              className="p-4 overflow-y-auto"
              style={{
                height: 'calc(70vh - 80px)',
                maxHeight: 'calc(70vh - 80px)',
                overflowY: 'scroll',
              }}
            >
              <div className="space-y-6">
                {unassignedParagraphs.map((paragraph) => (
                  <div
                    key={paragraph.id}
                    className={`border rounded-lg transition-colors ${
                      internalState.activeParagraphId === paragraph.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          className="mt-2"
                          checked={internalState.selectedParagraphIds.includes(
                            paragraph.id
                          )}
                          onChange={() =>
                            toggleParagraphSelection(paragraph.id)
                          }
                          aria-label={`단락 ${paragraph.id} 선택`}
                        />

                        <div className="flex-1">
                          {/* 🔥 Tiptap 마크다운 에디터 - 완전한 WYSIWYG + 이미지 업로드 */}
                          <TiptapMarkdownEditor
                            paragraphId={paragraph.id}
                            initialContent={paragraph.content}
                            onContentChange={(content) =>
                              updateLocalParagraphContent(paragraph.id, content)
                            }
                            isActive={
                              internalState.activeParagraphId === paragraph.id
                            }
                          />

                          <div className="flex gap-2">
                            <select
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                              value={
                                internalState.selectedParagraphIds.includes(
                                  paragraph.id
                                )
                                  ? internalState.targetContainerId
                                  : ''
                              }
                              onChange={(e) => {
                                setInternalState((prev) => ({
                                  ...prev,
                                  targetContainerId: e.target.value,
                                  selectedParagraphIds:
                                    prev.selectedParagraphIds.includes(
                                      paragraph.id
                                    )
                                      ? prev.selectedParagraphIds
                                      : [
                                          ...prev.selectedParagraphIds,
                                          paragraph.id,
                                        ],
                                }));
                              }}
                              aria-label={`단락 ${paragraph.id}를 추가할 컨테이너 선택`}
                            >
                              <option value="">컨테이너 선택</option>
                              {sortedContainers.map((container) => (
                                <option key={container.id} value={container.id}>
                                  {container.name}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              color="success"
                              size="sm"
                              onPress={addToLocalContainer}
                              isDisabled={
                                !internalState.selectedParagraphIds.includes(
                                  paragraph.id
                                ) ||
                                !internalState.targetContainerId ||
                                !paragraph.content.trim()
                              }
                              aria-label="선택된 단락을 컨테이너에 추가"
                            >
                              추가
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="button"
                          isIconOnly
                          color="danger"
                          variant="light"
                          size="sm"
                          onPress={() => deleteLocalParagraph(paragraph.id)}
                          aria-label={`단락 ${paragraph.id} 삭제`}
                        >
                          <Icon icon="lucide:trash-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {unassignedParagraphs.length === 0 && (
                  <div className="py-12 text-center text-gray-400">
                    <Icon
                      icon="lucide:file-text"
                      className="mx-auto mb-4 text-6xl"
                    />
                    <div className="mb-2 text-lg font-medium">
                      작성된 단락이 없습니다
                    </div>
                    <div className="text-sm">
                      새 단락 버튼을 눌러 Tiptap 에디터로 글 작성을 시작하세요
                    </div>
                    <Button
                      type="button"
                      color="primary"
                      className="mt-4"
                      onPress={addLocalParagraph}
                      startContent={<Icon icon="lucide:plus" />}
                      aria-label="첫 번째 단락 작성 시작"
                    >
                      첫 번째 단락 작성하기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 컨테이너 관리 영역 */}
          <div
            className={`${
              isMobile ? 'w-full' : 'flex-1'
            } border border-gray-200 rounded-lg`}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <span className="text-lg font-semibold">📦 컨테이너 관리</span>
            </div>

            <div
              className="p-4 overflow-y-auto"
              style={{
                height: 'calc(70vh - 80px)',
                maxHeight: 'calc(70vh - 80px)',
                overflowY: 'scroll',
              }}
            >
              <div className="space-y-4">
                {sortedContainers.map((container) => {
                  const containerParagraphs = getLocalParagraphsByContainer(
                    container.id
                  );

                  return (
                    <div
                      key={container.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        containerParagraphs.length > 0
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-2 font-medium text-gray-900">
                          <Icon
                            icon="lucide:folder"
                            className="text-blue-500"
                          />
                          {container.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs text-gray-500 bg-white rounded-full">
                            {containerParagraphs.length}개 단락
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {containerParagraphs.map((paragraph) => (
                          <div
                            key={paragraph.id}
                            className="p-3 transition-colors bg-white border border-gray-200 rounded hover:border-blue-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 line-clamp-2">
                                  {paragraph.content.slice(0, 80) ||
                                    '내용 없음'}
                                  {paragraph.content.length > 80 && '...'}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      paragraph.updatedAt
                                    ).toLocaleTimeString()}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-xs text-blue-500 underline cursor-pointer hover:text-blue-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const targetId =
                                        paragraph.originalId || paragraph.id;
                                      activateEditor(targetId);
                                    }}
                                    aria-label="원본 에디터로 이동하여 편집"
                                  >
                                    Tiptap 에디터로 편집
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-1 ml-3">
                                <Button
                                  type="button"
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    moveLocalParagraphInContainer(
                                      paragraph.id,
                                      'up'
                                    );
                                  }}
                                  isDisabled={
                                    containerParagraphs.findIndex(
                                      (p) => p.id === paragraph.id
                                    ) === 0
                                  }
                                  aria-label="단락을 위로 이동"
                                >
                                  <Icon icon="lucide:chevron-up" />
                                </Button>
                                <Button
                                  type="button"
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => {
                                    moveLocalParagraphInContainer(
                                      paragraph.id,
                                      'down'
                                    );
                                  }}
                                  isDisabled={
                                    containerParagraphs.findIndex(
                                      (p) => p.id === paragraph.id
                                    ) ===
                                    containerParagraphs.length - 1
                                  }
                                  aria-label="단락을 아래로 이동"
                                >
                                  <Icon icon="lucide:chevron-down" />
                                </Button>
                                <Button
                                  type="button"
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="primary"
                                  onPress={() => {
                                    const targetId =
                                      paragraph.originalId || paragraph.id;
                                    activateEditor(targetId);
                                  }}
                                  aria-label="Tiptap 에디터로 편집"
                                >
                                  <Icon icon="lucide:edit" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {containerParagraphs.length === 0 && (
                          <div className="py-6 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
                            <Icon
                              icon="lucide:inbox"
                              className="mx-auto mb-2 text-3xl"
                            />
                            <div className="text-sm font-medium">
                              아직 추가된 단락이 없습니다
                            </div>
                            <div className="mt-1 text-xs">
                              왼쪽에서 Tiptap으로 단락을 작성하고 이 컨테이너에
                              추가해보세요
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sortedContainers.length === 0 && (
                  <div className="py-12 text-center text-gray-400">
                    <Icon
                      icon="lucide:folder-plus"
                      className="mx-auto mb-4 text-6xl"
                    />
                    <div className="mb-2 text-lg font-medium">
                      컨테이너가 없습니다
                    </div>
                    <div className="text-sm">
                      구조 수정 버튼을 눌러 컨테이너를 만들어주세요
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 미리보기 */}
        <div
          className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-400 ${
            internalState.isPreviewOpen ? 'max-h-96' : 'max-h-12'
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Icon icon="lucide:eye" />
              최종 조합 미리보기
            </span>
            <div className="flex items-center gap-2">
              {sortedContainers.length > 0 && (
                <span className="px-2 py-1 text-xs text-gray-500 bg-white rounded-full">
                  {sortedContainers.reduce(
                    (total, container) =>
                      total +
                      getLocalParagraphsByContainer(container.id).length,
                    0
                  )}
                  개 단락 조합됨
                </span>
              )}
              <Button
                type="button"
                size="sm"
                variant="flat"
                onPress={togglePreview}
                startContent={
                  <Icon
                    icon={
                      internalState.isPreviewOpen
                        ? 'lucide:chevron-up'
                        : 'lucide:chevron-down'
                    }
                  />
                }
                aria-label={`미리보기 ${
                  internalState.isPreviewOpen ? '접기' : '펼치기'
                }`}
              >
                {internalState.isPreviewOpen ? '접기' : '펼치기'}
              </Button>
            </div>
          </div>

          {internalState.isPreviewOpen && (
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="max-w-4xl mx-auto space-y-6">
                {sortedContainers.map((container) => {
                  const containerParagraphs = getLocalParagraphsByContainer(
                    container.id
                  );

                  if (containerParagraphs.length === 0) return null;

                  return (
                    <div
                      key={container.id}
                      className="pl-4 transition-colors border-l-4 border-blue-200 hover:border-blue-400"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 text-xs font-medium text-blue-600 uppercase bg-blue-100 rounded">
                          {container.name}
                        </div>
                        <span className="text-xs text-gray-400">
                          {containerParagraphs.length}개 단락
                        </span>
                      </div>

                      {containerParagraphs.map((paragraph, index) => (
                        <div
                          key={paragraph.id}
                          data-source-id={paragraph.id}
                          className="p-3 mb-3 transition-colors border border-transparent rounded cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                          onClick={() => {
                            // 원본 단락 ID가 있으면 원본을 활성화, 없으면 현재 단락을 활성화
                            const targetId =
                              paragraph.originalId || paragraph.id;
                            activateEditor(targetId);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">
                              단락 {index + 1}
                            </span>
                            <span className="text-xs text-blue-500 transition-opacity opacity-0 group-hover:opacity-100">
                              클릭하여 Tiptap 에디터로 편집
                            </span>
                          </div>
                          {renderMarkdown(paragraph.content)}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {sortedContainers.every(
                  (container) =>
                    getLocalParagraphsByContainer(container.id).length === 0
                ) && (
                  <div className="py-12 text-center text-gray-400">
                    <Icon icon="lucide:eye" className="mx-auto mb-4 text-6xl" />
                    <div className="mb-2 text-lg font-medium">
                      아직 작성된 내용이 없습니다
                    </div>
                    <div className="text-sm">
                      Tiptap 에디터로 단락을 작성하고 컨테이너에 추가하면
                      미리보기가 표시됩니다
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              internalState.currentSubStep === 'structure'
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            1
          </div>
          <span
            className={`text-sm font-medium ${
              internalState.currentSubStep === 'structure'
                ? 'text-gray-900'
                : 'text-green-600'
            }`}
          >
            구조 설계
          </span>
        </div>

        <div className="w-8 h-1 bg-gray-300 rounded">
          <div
            className={`h-full rounded transition-all duration-500 ${
              internalState.currentSubStep === 'writing'
                ? 'w-full bg-blue-500'
                : 'w-0'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              internalState.currentSubStep === 'writing'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            2
          </div>
          <span
            className={`text-sm font-medium ${
              internalState.currentSubStep === 'writing'
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}
          >
            Tiptap 에디터로 글 작성
          </span>
        </div>
      </div>

      {/* Tiptap 안내 정보 */}
      <div className="p-4 text-xs border border-purple-200 rounded-lg bg-purple-50">
        <div className="mb-2 font-semibold text-purple-800">
          🎉 Tiptap 에디터 도입 완료!
        </div>
        <div className="grid grid-cols-1 gap-2 text-purple-700 md:grid-cols-2">
          <div>
            <strong>✨ 완벽한 기능:</strong>
            <br />• 텍스트 클릭 → 바로 편집 모드
            <br />• 완전한 툴바 (볼드, 이탤릭, 헤딩 등)
            <br />• 드래그앤드롭 + 붙여넣기 이미지 업로드
          </div>
          <div>
            <strong>🚀 향상된 경험:</strong>
            <br />• "클릭하여 편집" 링크 불필요
            <br />• WYSIWYG + 마크다운 완벽 지원
            <br />• 안정적인 패키지 (버전 충돌 없음)
          </div>
        </div>
      </div>

      <div className="p-3 text-xs border border-yellow-200 rounded-lg bg-yellow-50">
        <div className="mb-2 font-semibold text-yellow-800">
          🔍 실시간 디버깅 정보
        </div>
        <div className="grid grid-cols-2 gap-4 text-yellow-700">
          <div>
            <strong>메인 컴포넌트:</strong>
            <br />- 렌더링 횟수: {renderCount.current}
            <br />- 현재 단계: {internalState.currentSubStep}
            <br />- 트랜지션:{' '}
            {internalState.isTransitioning ? '진행중' : '완료'}
          </div>
          <div>
            <strong>로컬 상태:</strong>
            <br />- 로컬 컨테이너: {localContainers.length}개<br />- 로컬 단락:{' '}
            {localParagraphs.length}개<br />- 시간:{' '}
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={internalState.currentSubStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={internalState.isTransitioning ? 'pointer-events-none' : ''}
        >
          {internalState.currentSubStep === 'structure' ? (
            <StructureInputSection
              onStructureComplete={handleStructureComplete}
            />
          ) : (
            <WritingStep />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditor);
