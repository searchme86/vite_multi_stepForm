import { useEditor } from '@tiptap/react';
import { useMemo, useEffect, useCallback } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { createPlaceholderExtension } from '../parts/TiptapEditor/EditorPlaceholder';
import {
  createDropHandler,
  createPasteHandler,
} from '../parts/TiptapEditor/ImageDropZone';

//====여기부터 수정됨====
// 기존: props로만 데이터를 받던 방식
// 새로운: zustand store에서도 데이터를 가져올 수 있는 방식 추가
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../store/editorUI/editorUIStore';
import { useEditorMediaStore } from '../../../store/editorMedia/editorMediaStore';

// zustand store 타입 정의 (타입 안전성 강화)
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
  getParagraphs: () => any[];
};

type EditorUIStoreType = {
  getActiveParagraphId: () => string | null;
  setActiveParagraphId: (id: string | null) => void;
};

type EditorMediaStoreType = {
  saveImage: (
    paragraphId: string,
    base64Data: string,
    filename: string,
    type: string
  ) => Promise<string>;
  getImage: (imageId: string) => Promise<string | null>;
  setUploadingImage: (imageId: string) => void;
  removeUploadingImage: (imageId: string) => void;
  setFailedImage: (imageId: string) => void;
};

// 안전한 파일을 base64로 변환하는 함수 (zustand 방식에서 사용)
const safeFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('파일을 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () =>
        reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

// 이미지 파일 검증 함수 (zustand 방식에서 사용)
const isValidImageFile = (file: File): boolean => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB 제한
};
//====여기까지 수정됨====

interface UseTiptapEditorProps {
  paragraphId: string;
  initialContent: string;
  handleLocalChange: (content: string) => void;
  handleImageUpload: (files: File[]) => Promise<string[]>;
}

//====여기부터 수정됨====
// 기존 함수 시그니처 100% 유지하면서 props를 optional로 변경
// 이렇게 하면 기존 코드는 그대로 작동하고, 새로운 코드는 매개변수 없이 호출 가능
export function useTiptapEditor(props?: UseTiptapEditorProps) {
  // zustand store에서 데이터 가져오기 (context 대신 사용) - 타입 명시
  const editorCoreStore = useEditorCoreStore() as EditorCoreStoreType;
  const editorUIStore = useEditorUIStore() as EditorUIStoreType;
  const editorMediaStore = useEditorMediaStore() as EditorMediaStoreType;

  // props가 제공되면 props 사용, 없으면 zustand store 사용
  // 이렇게 하면 기존 코드와 100% 호환되면서도 새로운 방식도 지원
  const getParagraphId = useCallback(() => {
    return (
      props?.paragraphId ??
      editorUIStore.getActiveParagraphId() ??
      `paragraph-${Date.now()}`
    );
  }, [props?.paragraphId, editorUIStore]);

  const getInitialContent = useCallback(() => {
    if (props?.initialContent !== undefined) return props.initialContent;

    const activeParagraphId = editorUIStore.getActiveParagraphId();
    if (!activeParagraphId) return '';

    const paragraph = editorCoreStore.getParagraphById(activeParagraphId);
    return paragraph?.content || '';
  }, [props?.initialContent, editorCoreStore, editorUIStore]);

  const getHandleLocalChange = useCallback(() => {
    if (props?.handleLocalChange) return props.handleLocalChange;

    // zustand store를 사용하는 경우의 content 변경 핸들러
    return (content: string) => {
      const activeParagraphId = editorUIStore.getActiveParagraphId();
      if (activeParagraphId) {
        console.log('🔄 [ZUSTAND] 단락 content 업데이트:', {
          paragraphId: activeParagraphId,
          contentLength: content.length,
        });
        editorCoreStore.updateParagraphContent(activeParagraphId, content);
      }
    };
  }, [props?.handleLocalChange, editorCoreStore, editorUIStore]);

  const getHandleImageUpload = useCallback(() => {
    if (props?.handleImageUpload) return props.handleImageUpload;

    // zustand store를 사용하는 경우의 이미지 업로드 핸들러
    return async (files: File[]): Promise<string[]> => {
      const activeParagraphId = editorUIStore.getActiveParagraphId();
      if (!activeParagraphId) {
        console.warn(
          '⚠️ [ZUSTAND] 활성 단락이 없어 이미지 업로드를 건너뜁니다.'
        );
        return [];
      }

      const validFiles = files.filter(isValidImageFile);
      if (validFiles.length === 0) {
        console.warn('⚠️ [ZUSTAND] 유효한 이미지 파일이 없습니다.');
        return [];
      }

      console.log('📸 [ZUSTAND] 이미지 업로드 시작:', {
        fileCount: validFiles.length,
        paragraphId: activeParagraphId,
      });

      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          editorMediaStore.setUploadingImage(`${activeParagraphId}-${index}`);

          const base64Data = await safeFileToBase64(file);

          //====여기부터 수정됨====
          // 기존: imageId 변수를 선언했지만 사용하지 않아서 TypeScript 경고 발생
          // const imageId = await editorMediaStore.saveImage(
          //   activeParagraphId,
          //   base64Data,
          //   file.name,
          //   file.type
          // );

          // 새로운: 언더스코어(_)를 사용해서 반환값을 무시함을 명시적으로 표현
          // 이렇게 하면 TypeScript 경고가 발생하지 않음
          await editorMediaStore.saveImage(
            activeParagraphId,
            base64Data,
            file.name,
            file.type
          );

          // 또는 만약 imageId를 실제로 사용해야 한다면:
          // const imageId = await editorMediaStore.saveImage(...);
          // console.log('📸 [ZUSTAND] 이미지 저장 완료:', imageId);
          //====여기까지 수정됨====

          editorMediaStore.removeUploadingImage(
            `${activeParagraphId}-${index}`
          );
          console.log('✅ [ZUSTAND] 이미지 업로드 성공:', file.name);

          return base64Data;
        } catch (error) {
          console.error('❌ [ZUSTAND] 이미지 업로드 실패:', file.name, error);
          editorMediaStore.setFailedImage(`${activeParagraphId}-${index}`);
          editorMediaStore.removeUploadingImage(
            `${activeParagraphId}-${index}`
          );
          return '';
        }
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result) => result !== '');
    };
  }, [
    props?.handleImageUpload,
    editorCoreStore,
    editorUIStore,
    editorMediaStore,
  ]);

  // 메모이제이션된 값들 (성능 최적화)
  const memoizedValues = useMemo(() => {
    const paragraphId = getParagraphId();
    const initialContent = getInitialContent();
    const handleLocalChange = getHandleLocalChange();
    const handleImageUpload = getHandleImageUpload();

    return {
      paragraphId,
      initialContent,
      handleLocalChange,
      handleImageUpload,
    };
  }, [
    getParagraphId,
    getInitialContent,
    getHandleLocalChange,
    getHandleImageUpload,
  ]);

  const { paragraphId, initialContent, handleLocalChange, handleImageUpload } =
    memoizedValues;
  //====여기까지 수정됨====

  console.log('🪝 [USE_TIPTAP_EDITOR] 훅 초기화:', {
    paragraphId,
    initialContentLength: initialContent?.length,
    initialContentPreview: initialContent?.slice(0, 100),
    hasInitialImages:
      initialContent?.includes('![') || initialContent?.includes('<img'),
    timestamp: Date.now(),
  });

  const extensions = useMemo(() => {
    return [
      StarterKit.configure({
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
        dropcursor: {
          color: '#3b82f6',
          width: 2,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
          style:
            'max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);',
        },
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      createPlaceholderExtension(),
      Markdown.configure({
        transformCopiedText: true,
        transformPastedText: true,
        linkify: false,
        breaks: false,
      }),
    ];
  }, []);

  const editor = useEditor(
    {
      extensions,
      content: initialContent,
      onUpdate: ({ editor }) => {
        console.log('🔥 [TIPTAP] ===== onUpdate 트리거됨 =====');

        const htmlContent = editor.getHTML();
        console.log('🔥 [TIPTAP] HTML 내용:', {
          html: htmlContent,
          htmlLength: htmlContent.length,
          hasImgTags: htmlContent.includes('<img'),
          imgTagCount: (htmlContent.match(/<img[^>]*>/g) || []).length,
        });

        try {
          const markdown = editor.storage.markdown.getMarkdown();
          console.log('🔥 [TIPTAP] 마크다운 변환 결과:', {
            markdown: markdown,
            markdownLength: markdown.length,
            hasImageMarkdown: markdown.includes('!['),
            hasBase64: markdown.includes('data:image'),
            imageMatches: markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [],
          });

          console.log('🔥 [TIPTAP] 상위 컴포넌트로 전달되는 내용:', {
            content: markdown.slice(0, 200),
            willCallHandleLocalChange: true,
            paragraphId: paragraphId,
            timestamp: Date.now(),
          });

          handleLocalChange(markdown);
        } catch (error) {
          console.error('❌ [TIPTAP] 마크다운 변환 에러:', error);
          handleLocalChange(htmlContent);
        }
      },
      editorProps: {
        handleDrop: createDropHandler({
          handleImageUpload: async (files: File[]) => {
            const result = await handleImageUpload(files);
            return result;
          },
        }),
        handlePaste: createPasteHandler({
          handleImageUpload: async (files: File[]) => {
            const result = await handleImageUpload(files);
            return result;
          },
        }),
        attributes: {
          class:
            'tiptap-editor prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'data-paragraph-id': paragraphId,
        },
      },
    },
    [paragraphId]
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const currentContent = editor.storage.markdown.getMarkdown();

    console.log('🔄 [USE_TIPTAP_EDITOR] 초기 내용 동기화 체크:', {
      initialContent: initialContent.slice(0, 100),
      currentContent: currentContent.slice(0, 100),
      isContentDifferent: initialContent !== currentContent,
      hasInitialContent: initialContent.trim() !== '',
      shouldUpdate:
        initialContent !== currentContent && initialContent.trim() !== '',
      timestamp: Date.now(),
    });

    if (initialContent !== currentContent && initialContent.trim() !== '') {
      console.log('🔄 [USE_TIPTAP_EDITOR] 외부 내용 변경, 에디터 업데이트');

      let contentToSet = initialContent;

      console.log('🖼️ [USE_TIPTAP_EDITOR] 이미지 마크다운 확인:', {
        hasImageMarkdown: initialContent.includes('!['),
        hasBase64: initialContent.includes('](data:image/'),
        needsConversion:
          initialContent.includes('![') &&
          initialContent.includes('](data:image/'),
      });

      if (
        initialContent.includes('![') &&
        initialContent.includes('](data:image/')
      ) {
        const beforeConversion = contentToSet;
        contentToSet = initialContent.replace(
          /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g,
          '<img src="$2" alt="$1" class="tiptap-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />'
        );

        console.log('🖼️ [USE_TIPTAP_EDITOR] 마크다운 → HTML 변환:', {
          before: beforeConversion.slice(0, 200),
          after: contentToSet.slice(0, 200),
          conversionCount: (
            beforeConversion.match(
              /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g
            ) || []
          ).length,
        });
      }

      try {
        console.log('📝 [USE_TIPTAP_EDITOR] 에디터 내용 설정 시도:', {
          contentToSet: contentToSet.slice(0, 200) + '...',
          contentLength: contentToSet.length,
        });

        editor.commands.setContent(contentToSet, false, {
          preserveWhitespace: 'full',
        });

        setTimeout(() => {
          console.log('📝 [USE_TIPTAP_EDITOR] 내용 설정 후 상태:', {
            html: editor.getHTML().slice(0, 200),
            markdown: editor.storage.markdown.getMarkdown().slice(0, 200),
            hasImages: editor.getHTML().includes('<img'),
          });
        }, 100);
      } catch (error) {
        console.error('❌ [USE_TIPTAP_EDITOR] content 설정 실패:', error);
      }
    }
  }, [editor, initialContent]);

  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor, paragraphId]);

  return {
    editor,
  };
}
