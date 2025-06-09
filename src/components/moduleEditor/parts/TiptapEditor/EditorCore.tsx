import { EditorContent, Editor } from '@tiptap/react';

interface EditorCoreProps {
  editor: Editor;
  paragraphId: string;
}

function EditorCore({ editor, paragraphId }: EditorCoreProps) {
  console.log('🎯 [EDITOR_CORE] 렌더링:', {
    paragraphId,
    editorDestroyed: editor.isDestroyed,
  });

  return (
    <div className="tiptap-wrapper">
      <EditorContent
        editor={editor}
        className="min-h-[200px] p-4 focus-within:outline-none"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .tiptap-wrapper .ProseMirror {
              outline: none;
              min-height: 200px;
              padding: 1rem;
            }

            .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: #adb5bd;
              pointer-events: none;
              height: 0;
              white-space: pre-line;
            }

            .tiptap-wrapper .tiptap-image {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 8px 0;
              display: block;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .tiptap-wrapper .tiptap-link {
              color: #3b82f6;
              text-decoration: underline;
            }

            .tiptap-wrapper .ProseMirror-dropcursor {
              border-left: 2px solid #3b82f6;
            }

            .tiptap-wrapper .ProseMirror-gapcursor {
              display: none;
              pointer-events: none;
              position: absolute;
            }

            .tiptap-wrapper .ProseMirror-gapcursor:after {
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

            .tiptap-wrapper .ProseMirror-selectednode {
              outline: 2px solid #3b82f6;
              outline-offset: 2px;
            }

            .tiptap-wrapper img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 8px 0;
              display: block;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .tiptap-wrapper .ProseMirror img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 8px 0;
              display: block;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
          `,
        }}
      />
    </div>
  );
}

export default EditorCore;
