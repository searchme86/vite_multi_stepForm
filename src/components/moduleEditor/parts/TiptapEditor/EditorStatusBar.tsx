import { Icon } from '@iconify/react';

interface EditorStatusBarProps {
  isContentChanged: boolean;
  isUploadingImage: boolean;
  uploadError: string | null;
  onErrorClose: () => void;
}

function EditorStatusBar({
  isContentChanged,
  isUploadingImage,
  uploadError,
  onErrorClose,
}: EditorStatusBarProps) {
  console.log('📊 [EDITOR_STATUS] 상태 렌더링:', {
    isContentChanged,
    isUploadingImage,
    hasError: !!uploadError,
  });

  if (!isContentChanged && !isUploadingImage && !uploadError) {
    return null;
  }

  return (
    <>
      {isContentChanged && (
        <div className="flex items-center gap-1 p-2 text-xs text-blue-600 animate-pulse bg-blue-50">
          <Icon icon="lucide:clock" className="text-blue-500" />
          변경사항이 저장 대기 중입니다...
        </div>
      )}

      {isUploadingImage && (
        <div className="flex items-center gap-1 p-2 text-xs text-green-600 animate-pulse bg-green-50">
          <Icon
            icon="lucide:loader-2"
            className="text-green-500 animate-spin"
          />
          이미지를 업로드하고 있습니다...
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1 p-2 text-xs text-red-600 bg-red-50">
          <Icon icon="lucide:alert-circle" className="text-red-500" />
          {uploadError}
          <button
            type="button"
            className="ml-2 text-xs underline"
            onClick={onErrorClose}
          >
            닫기
          </button>
        </div>
      )}
    </>
  );
}

export default EditorStatusBar;
