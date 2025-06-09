import { Icon } from '@iconify/react';

function InfoOverlay() {
  console.log('ℹ️ [INFO_OVERLAY] 렌더링');

  return (
    <div className="flex items-center gap-1 p-2 text-xs text-gray-500 bg-gray-50">
      <Icon icon="lucide:info" className="text-gray-400" />
      💡 텍스트를 클릭하여 바로 편집하고, 툴바나 드래그앤드롭으로 이미지를
      추가하세요!
    </div>
  );
}

export default InfoOverlay;
