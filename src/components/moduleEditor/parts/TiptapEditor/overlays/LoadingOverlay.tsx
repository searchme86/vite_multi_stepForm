import { Icon } from '@iconify/react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  console.log('⏳ [LOADING_OVERLAY] 렌더링:', { isVisible });

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
      <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
        <Icon
          icon="lucide:loader-2"
          className="text-blue-500 animate-spin"
          width={24}
          height={24}
        />
        <span className="text-gray-700">이미지를 처리하고 있습니다...</span>
      </div>
    </div>
  );
}

export default LoadingOverlay;
