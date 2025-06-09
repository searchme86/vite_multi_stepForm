import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import ContainerHeader from './ContainerHeader';
import { Container } from '../../../types/container';
import { LocalParagraph } from '../../../types/paragraph';

interface ContainerCardProps {
  container: Container;
  containerParagraphs: LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
}

function ContainerCard({
  container,
  containerParagraphs,
  moveLocalParagraphInContainer,
  activateEditor,
}: ContainerCardProps) {
  console.log('🗂️ [CONTAINER_CARD] 렌더링:', {
    containerId: container.id,
    containerName: container.name,
    paragraphsCount: containerParagraphs.length,
  });

  const handleMoveUp = (paragraphId: string) => {
    console.log('⬆️ [CONTAINER_CARD] 단락 위로 이동:', paragraphId);
    moveLocalParagraphInContainer(paragraphId, 'up');
  };

  const handleMoveDown = (paragraphId: string) => {
    console.log('⬇️ [CONTAINER_CARD] 단락 아래로 이동:', paragraphId);
    moveLocalParagraphInContainer(paragraphId, 'down');
  };

  const handleEditParagraph = (paragraph: LocalParagraph) => {
    console.log('✏️ [CONTAINER_CARD] 단락 편집:', {
      paragraphId: paragraph.id,
      originalId: paragraph.originalId,
    });
    const targetId = paragraph.originalId || paragraph.id;
    activateEditor(targetId);
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        containerParagraphs.length > 0
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <ContainerHeader
        container={container}
        paragraphsCount={containerParagraphs.length}
      />

      <div className="space-y-2">
        {containerParagraphs.map((paragraph, index) => (
          <div
            key={paragraph.id}
            className="p-3 transition-colors bg-white border border-gray-200 rounded hover:border-blue-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-sm text-gray-700 line-clamp-2">
                  {(paragraph.content || '').slice(0, 80) || '내용 없음'}
                  {(paragraph.content || '').length > 80 && '...'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {new Date(paragraph.updatedAt).toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-blue-500 underline cursor-pointer hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditParagraph(paragraph);
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
                  onPress={() => handleMoveUp(paragraph.id)}
                  isDisabled={index === 0}
                  aria-label="단락을 위로 이동"
                >
                  <Icon icon="lucide:chevron-up" />
                </Button>
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => handleMoveDown(paragraph.id)}
                  isDisabled={index === containerParagraphs.length - 1}
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
                  onPress={() => handleEditParagraph(paragraph)}
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
            <Icon icon="lucide:inbox" className="mx-auto mb-2 text-3xl" />
            <div className="text-sm font-medium">
              아직 추가된 단락이 없습니다
            </div>
            <div className="mt-1 text-xs">
              왼쪽에서 Tiptap으로 단락을 작성하고 이 컨테이너에 추가해보세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContainerCard;
