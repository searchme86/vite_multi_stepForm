import { useEditor } from '@tiptap/react';
import { useMemo, useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { createPlaceholderExtension } from '../parts/TiptapEditor/EditorPlaceholder';
import {
  createDropHandler,
  createPasteHandler,
} from '../parts/TiptapEditor/ImageDropZone';

interface UseTiptapEditorProps {
  paragraphId: string;
  initialContent: string;
  handleLocalChange: (content: string) => void;
  handleImageUpload: (files: File[]) => Promise<string[]>;
}

export function useTiptapEditor({
  paragraphId,
  initialContent,
  handleLocalChange,
  handleImageUpload,
}: UseTiptapEditorProps) {
  console.log('🪝 [USE_TIPTAP_EDITOR] 훅 초기화:', {
    paragraphId,
    initialContentLength: initialContent?.length,
    initialContentPreview: initialContent?.slice(0, 100),
    hasInitialImages:
      initialContent?.includes('![') || initialContent?.includes('<img'),
  });

  const extensions = useMemo(() => {
    console.log('🔧 [USE_TIPTAP_EDITOR] Extensions 생성');

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
          imgTags: htmlContent.match(/<img[^>]*>/g) || [],
          imgSrcs: (
            htmlContent.match(/<img[^>]*src="([^"]*)"[^>]*>/g) || []
          ).map((tag) => {
            const srcMatch = tag.match(/src="([^"]*)"/);
            return srcMatch ? srcMatch[1].slice(0, 50) + '...' : 'no src';
          }),
        });

        const jsonContent = editor.getJSON();
        console.log('🔥 [TIPTAP] JSON 내용:', {
          json: JSON.stringify(jsonContent, null, 2),
          hasImageNodes: JSON.stringify(jsonContent).includes('"type":"image"'),
          imageNodes:
            JSON.stringify(jsonContent).match(/"type":"image"[^}]*}/g) || [],
        });

        console.log('🔥 [TIPTAP] 마크다운 변환 전 에디터 상태:', {
          isEmpty: editor.isEmpty,
          canUndo: editor.can().undo(),
          isEditable: editor.isEditable,
          hasContent: editor.state.doc.textContent.length > 0,
          textContent: editor.state.doc.textContent,
          docSize: editor.state.doc.content.size,
        });

        try {
          const markdown = editor.storage.markdown.getMarkdown();
          console.log('🔥 [TIPTAP] 마크다운 변환 결과:', {
            markdown: markdown,
            markdownLength: markdown.length,
            hasImageMarkdown: markdown.includes('!['),
            hasBase64: markdown.includes('data:image'),
            imageMatches: markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [],
            base64Matches:
              markdown.match(
                /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g
              ) || [],
            urlMatches:
              markdown.match(/!\[([^\]]*)\]\(((?!data:image)[^)]+)\)/g) || [],
          });

          console.log('🔥 [TIPTAP] HTML vs 마크다운 비교:', {
            htmlHasImages: htmlContent.includes('<img'),
            markdownHasImages: markdown.includes('!['),
            htmlImageCount: (htmlContent.match(/<img[^>]*>/g) || []).length,
            markdownImageCount: (markdown.match(/!\[[^\]]*\]\([^)]+\)/g) || [])
              .length,
            conversionWorking:
              htmlContent.includes('<img') === markdown.includes('!['),
          });

          console.log('🔥 [TIPTAP] 상위 컴포넌트로 전달되는 내용:', {
            content: markdown,
            willCallHandleLocalChange: true,
            paragraphId: paragraphId,
          });

          console.log('📝 [USE_TIPTAP_EDITOR] 내용 변경 감지');
          handleLocalChange(markdown);
        } catch (error) {
          console.error('❌ [TIPTAP] 마크다운 변환 에러:', error);
          console.log('❌ [TIPTAP] 에러 발생 시 HTML 내용 직접 전달 시도');
          handleLocalChange(htmlContent);
        }
      },
      editorProps: {
        handleDrop: createDropHandler({
          handleImageUpload: async (files: File[]) => {
            console.log('🎯 [TIPTAP] 드롭 이벤트 - 이미지 업로드 시작:', {
              fileCount: files.length,
              fileNames: files.map((f) => f.name),
              fileSizes: files.map((f) => f.size),
              fileTypes: files.map((f) => f.type),
            });

            const result = await handleImageUpload(files);

            console.log('🎯 [TIPTAP] 드롭 이벤트 - 이미지 업로드 완료:', {
              uploadedCount: result.length,
              resultSamples: result.map((r) => r.slice(0, 50) + '...'),
            });

            setTimeout(() => {
              if (editor && !editor.isDestroyed) {
                console.log('🎯 [TIPTAP] 드롭 후 에디터 상태 확인:', {
                  html: editor.getHTML(),
                  markdown: editor.storage.markdown.getMarkdown(),
                  hasImages: editor.getHTML().includes('<img'),
                });
              }
            }, 100);

            return result;
          },
        }),
        handlePaste: createPasteHandler({
          handleImageUpload: async (files: File[]) => {
            console.log('📋 [TIPTAP] 페이스트 이벤트 - 이미지 업로드 시작:', {
              fileCount: files.length,
              fileNames: files.map((f) => f.name),
              fileSizes: files.map((f) => f.size),
              fileTypes: files.map((f) => f.type),
            });

            const result = await handleImageUpload(files);

            console.log('📋 [TIPTAP] 페이스트 이벤트 - 이미지 업로드 완료:', {
              uploadedCount: result.length,
              resultSamples: result.map((r) => r.slice(0, 50) + '...'),
            });

            setTimeout(() => {
              if (editor && !editor.isDestroyed) {
                console.log('📋 [TIPTAP] 페이스트 후 에디터 상태 확인:', {
                  html: editor.getHTML(),
                  markdown: editor.storage.markdown.getMarkdown(),
                  hasImages: editor.getHTML().includes('<img'),
                });
              }
            }, 100);

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
      initialContent: initialContent,
      currentContent: currentContent,
      isContentDifferent: initialContent !== currentContent,
      hasInitialContent: initialContent.trim() !== '',
      shouldUpdate:
        initialContent !== currentContent && initialContent.trim() !== '',
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
          before: beforeConversion,
          after: contentToSet,
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
            html: editor.getHTML(),
            markdown: editor.storage.markdown.getMarkdown(),
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
        console.log('🧹 [USE_TIPTAP_EDITOR] 에디터 정리:', paragraphId);
        editor.destroy();
      }
    };
  }, [editor, paragraphId]);

  return {
    editor,
  };
}
