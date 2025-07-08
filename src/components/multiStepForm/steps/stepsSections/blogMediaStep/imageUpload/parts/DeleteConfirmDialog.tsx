// blogMediaStep/imageUpload/parts/DeleteConfirmDialog.tsx

import React from 'react';
import { type DeleteConfirmState } from '../types/imageUploadTypes';

interface DeleteConfirmDialogProps {
  deleteConfirmState: DeleteConfirmState;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({
  deleteConfirmState,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps): React.ReactNode {
  console.log('🗑️ [DELETE_DIALOG] DeleteConfirmDialog 렌더링:', {
    isVisible: deleteConfirmState.isVisible,
    imageIndex: deleteConfirmState.imageIndex,
    imageName: deleteConfirmState.imageName,
    timestamp: new Date().toLocaleTimeString(),
  });

  const dialogClassName = `absolute inset-0 p-3 bg-red-50 border-red-200 transition-all duration-500 ${
    deleteConfirmState.isVisible
      ? 'transform translate-y-0 opacity-100'
      : 'transform translate-y-full opacity-0 pointer-events-none'
  }`;

  return (
    <div
      className={dialogClassName}
      role="dialog"
      aria-labelledby="delete-confirm-text"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p
            id="delete-confirm-text"
            className="text-sm font-medium text-red-800"
          >
            "{deleteConfirmState.imageName}" 이미지를 삭제하시겠습니까?
          </p>
          <p className="mt-1 text-xs text-red-600">
            삭제된 이미지는 복구할 수 없습니다.
          </p>
        </div>

        <div>
          <ul className="flex gap-2" role="list">
            <li role="listitem">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                onClick={onCancel}
                aria-label="이미지 삭제 취소"
              >
                취소
              </button>
            </li>
            <li role="listitem">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                onClick={onConfirm}
                aria-label="이미지 삭제 확인"
              >
                삭제
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmDialog;
