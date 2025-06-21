// 📁 components/moduleEditor/parts/WritingStep/sidebar/slides/ContainerCard.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import ContainerHeader from './ContainerHeader';
import ContainerSelector from './ContainerSelector';
import type { Container } from '../../../../../store/shared/commonTypes';

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface ContainerCardProps {
  container: Container;
  containerParagraphs: LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;

  // 🔄 새로 추가되는 props
  sortedContainers: Container[]; // 전체 컨테이너 목록
  moveToContainer: (paragraphId: string, targetContainerId: string) => void; // 컨테이너 간 이동 함수
}

function ContainerCard({
  container,
  containerParagraphs,
  moveLocalParagraphInContainer,
  activateEditor,
  sortedContainers, // 🔄 새로 추가
  moveToContainer, // 🔄 새로 추가
}: ContainerCardProps) {
  // 기존 console.log 수정
  console.log('🗂️ [CONTAINER_CARD] 렌더링:', {
    containerId: container.id,
    containerName: container.name,
    paragraphsCount: containerParagraphs.length,
    totalContainers: sortedContainers.length, // 🔄 새로 추가
  });

  // 기존 핸들러들 유지...
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

  // 🔄 새로 추가되는 핸들러
  const handleContainerMove = (
    paragraphId: string,
    targetContainerId: string
  ) => {
    console.log('🔄 [CONTAINER_CARD] 컨테이너 이동:', {
      paragraphId,
      fromContainerId: container.id,
      toContainerId: targetContainerId,
    });

    if (typeof moveToContainer === 'function') {
      try {
        moveToContainer(paragraphId, targetContainerId);
      } catch (error) {
        console.error('❌ [CONTAINER_CARD] 컨테이너 이동 실패:', error);
      }
    }
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

              {/* 🔄 버튼 영역 수정 - 셀렉트 박스 추가 */}
              <div className="flex gap-1 ml-3">
                {/* 🔄 새로 추가 - 컨테이너 선택 셀렉트 박스 */}
                <ContainerSelector
                  currentContainerId={container.id}
                  availableContainers={sortedContainers}
                  onContainerMove={(targetContainerId) =>
                    handleContainerMove(paragraph.id, targetContainerId)
                  }
                  className="mr-1"
                />

                {/* 기존 버튼들 유지 */}
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

        {/* 기존 빈 상태 표시 유지 */}
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
