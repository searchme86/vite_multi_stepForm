import ContainerCard from './ContainerCard';
import EmptyContainerState from './EmptyContainerState';

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

interface ContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
}

function ContainerManager({
  isMobile,
  sortedContainers,
  getLocalParagraphsByContainer,
  moveLocalParagraphInContainer,
  activateEditor,
}: ContainerManagerProps) {
  console.log('📦 [CONTAINER_MANAGER] 렌더링:', {
    isMobile,
    containersCount: sortedContainers.length,
  });

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'flex-1'
      } border border-gray-200 rounded-lg`}
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <span className="text-lg font-semibold">📦 컨테이너 관리</span>
      </div>

      <div className="p-4 overflow-y-auto">
        <div className="space-y-4">
          {sortedContainers.map((container) => (
            <ContainerCard
              key={container.id}
              container={container}
              containerParagraphs={getLocalParagraphsByContainer(container.id)}
              moveLocalParagraphInContainer={moveLocalParagraphInContainer}
              activateEditor={activateEditor}
            />
          ))}

          {sortedContainers.length === 0 && <EmptyContainerState />}
        </div>
      </div>
    </div>
  );
}

export default ContainerManager;
