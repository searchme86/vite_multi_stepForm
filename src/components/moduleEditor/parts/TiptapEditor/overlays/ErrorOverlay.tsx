import { Icon } from '@iconify/react';

interface ErrorOverlayProps {
  error: string | null;
  onClose: () => void;
}

function ErrorOverlay({ error, onClose }: ErrorOverlayProps) {
  console.log('❌ [ERROR_OVERLAY] 렌더링:', { hasError: !!error });

  if (!error) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-50 bg-opacity-90">
      <div className="max-w-md p-4 bg-white border border-red-200 rounded-lg shadow-lg">
        <div className="flex items-start gap-3">
          <Icon
            icon="lucide:alert-circle"
            className="text-red-500 mt-0.5"
            width={20}
            height={20}
          />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">업로드 오류</h4>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-red-400 hover:text-red-600"
          >
            <Icon icon="lucide:x" width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorOverlay;
