import { Icon } from '@iconify/react';

function EmptyContainerState() {
  console.log('📭 [EMPTY_CONTAINER] 빈 컨테이너 상태 렌더링');

  return (
    <div className="py-12 text-center text-gray-400">
      <Icon icon="lucide:folder-plus" className="mx-auto mb-4 text-6xl" />
      <div className="mb-2 text-lg font-medium">컨테이너가 없습니다</div>
      <div className="text-sm">
        구조 수정 버튼을 눌러 컨테이너를 만들어주세요
      </div>
    </div>
  );
}

export default EmptyContainerState;
