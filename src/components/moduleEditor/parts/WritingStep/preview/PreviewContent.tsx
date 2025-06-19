import React from 'react';
import { Icon } from '@iconify/react';

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface PreviewContentProps {
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  renderMarkdown: (text: string) => React.ReactNode;
  activateEditor: (id: string) => void;
}

function PreviewContent({
  sortedContainers,
  getLocalParagraphsByContainer,
  renderMarkdown,
  activateEditor,
}: PreviewContentProps) {
  console.log('📖 [PREVIEW_CONTENT] 렌더링:', {
    containersCount: sortedContainers.length,
  });

  const handleParagraphClick = (paragraph: LocalParagraph) => {
    console.log('🖱️ [PREVIEW_CONTENT] 단락 클릭:', {
      paragraphId: paragraph.id,
      originalId: paragraph.originalId,
    });
    const targetId = paragraph.originalId || paragraph.id;
    activateEditor(targetId);
  };

  const hasAnyContent = sortedContainers.some(
    (container) => getLocalParagraphsByContainer(container.id).length > 0
  );

  return (
    <div className="p-4 overflow-y-auto">
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
                  onClick={() => handleParagraphClick(paragraph)}
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

        {!hasAnyContent && (
          <div className="py-12 text-center text-gray-400">
            <Icon icon="lucide:eye" className="mx-auto mb-4 text-6xl" />
            <div className="mb-2 text-lg font-medium">
              아직 작성된 내용이 없습니다
            </div>
            <div className="text-sm">
              Tiptap 에디터로 단락을 작성하고 컨테이너에 추가하면 미리보기가
              표시됩니다
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewContent;
