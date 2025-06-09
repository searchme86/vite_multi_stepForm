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
  console.log('🪝 [USE_TIPTAP_EDITOR] 훅 초기화:', { paragraphId });

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
        const markdown = editor.storage.markdown.getMarkdown();
        console.log('📝 [USE_TIPTAP_EDITOR] 내용 변경 감지');
        handleLocalChange(markdown);
      },
      editorProps: {
        handleDrop: createDropHandler({ handleImageUpload }),
        handlePaste: createPasteHandler({ handleImageUpload }),
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

    if (initialContent !== currentContent && initialContent.trim() !== '') {
      console.log('🔄 [USE_TIPTAP_EDITOR] 외부 내용 변경, 에디터 업데이트');

      let contentToSet = initialContent;
      if (
        initialContent.includes('![') &&
        initialContent.includes('](data:image/')
      ) {
        contentToSet = initialContent.replace(
          /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g,
          '<img src="$2" alt="$1" class="tiptap-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />'
        );
      }

      try {
        editor.commands.setContent(contentToSet, false, {
          preserveWhitespace: 'full',
        });
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
