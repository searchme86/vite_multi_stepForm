import { Icon } from '@iconify/react';

interface ContainerHeaderProps {
  container: any;
  paragraphsCount: number;
}

function ContainerHeader({ container, paragraphsCount }: ContainerHeaderProps) {
  console.log('📋 [CONTAINER_HEADER] 렌더링:', {
    containerId: container.id,
    containerName: container.name,
    paragraphsCount,
  });

  return (
    <div className="flex items-center justify-between mb-3">
      <span className="flex items-center gap-2 font-medium text-gray-900">
        <Icon icon="lucide:folder" className="text-blue-500" />
        {container.name}
      </span>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-xs text-gray-500 bg-white rounded-full">
          {paragraphsCount}개 단락
        </span>
      </div>
    </div>
  );
}

export default ContainerHeader;
