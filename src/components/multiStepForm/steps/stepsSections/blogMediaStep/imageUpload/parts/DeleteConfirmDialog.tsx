// 📁 imageUpload/parts/DeleteConfirmDialog.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('DELETE_CONFIRM_DIALOG');

interface SafeDeleteConfirmState {
  readonly isOpen: boolean;
  readonly imageIndex: number;
  readonly imageUrl: string;
  readonly hasValidData: boolean;
}

const extractSafeDeleteConfirmState = (
  deleteConfirmState: unknown
): SafeDeleteConfirmState => {
  try {
    if (!deleteConfirmState || typeof deleteConfirmState !== 'object') {
      return {
        isOpen: false,
        imageIndex: -1,
        imageUrl: '',
        hasValidData: false,
      };
    }

    const isOpen = Reflect.get(deleteConfirmState, 'isOpen');
    const imageIndex = Reflect.get(deleteConfirmState, 'imageIndex');
    const imageUrl = Reflect.get(deleteConfirmState, 'imageUrl');

    const safeIsOpen = typeof isOpen === 'boolean' ? isOpen : false;
    const safeImageIndex = typeof imageIndex === 'number' ? imageIndex : -1;
    const safeImageUrl = typeof imageUrl === 'string' ? imageUrl : '';

    const hasValidData =
      safeIsOpen && safeImageIndex >= 0 && safeImageUrl.length > 0;

    return {
      isOpen: safeIsOpen,
      imageIndex: safeImageIndex,
      imageUrl: safeImageUrl,
      hasValidData,
    };
  } catch (error) {
    console.error('❌ [DELETE_CONFIRM] 상태 추출 실패:', error);
    return {
      isOpen: false,
      imageIndex: -1,
      imageUrl: '',
      hasValidData: false,
    };
  }
};

const extractFileNameFromUrl = (imageUrl: string): string => {
  try {
    if (!imageUrl || imageUrl.length === 0) {
      return 'unknown';
    }

    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'unknown';

    const fileNameWithoutQuery = fileName.split('?')[0] || 'unknown';

    return fileNameWithoutQuery;
  } catch (error) {
    console.error('❌ [DELETE_CONFIRM] 파일명 추출 실패:', error);
    return 'unknown';
  }
};

function DeleteConfirmDialog(): React.ReactNode {
  const { deleteConfirmState, handleDeleteConfirm, handleDeleteCancel } =
    useImageUploadContext();

  const safeState = useMemo(() => {
    const extracted = extractSafeDeleteConfirmState(deleteConfirmState);

    console.log('🔍 [DELETE_CONFIRM] 안전한 상태 추출:', {
      isOpen: extracted.isOpen,
      imageIndex: extracted.imageIndex,
      imageUrl: extracted.imageUrl.slice(0, 30) + '...',
      hasValidData: extracted.hasValidData,
    });

    return extracted;
  }, [deleteConfirmState]);

  const deleteConfirmationInfo = useMemo(() => {
    const { isOpen, imageIndex, imageUrl, hasValidData } = safeState;

    if (!hasValidData) {
      return {
        isVisible: false,
        fileName: '',
        imageIndex: -1,
        confirmationMessage: '',
        warningMessage: '',
        hasValidImageName: false,
        hasValidImageIndex: false,
      };
    }

    const fileName = extractFileNameFromUrl(imageUrl);
    const hasValidImageName = fileName.length > 0 && fileName !== 'unknown';
    const hasValidImageIndex = imageIndex >= 0;

    const confirmationMessage = hasValidImageName
      ? `"${fileName}" 이미지를 삭제하시겠습니까?`
      : '선택된 이미지를 삭제하시겠습니까?';

    const warningMessage = '삭제된 이미지는 복구할 수 없습니다.';

    console.log('🔍 [DELETE_CONFIRM] 확인 정보 생성:', {
      isVisible: isOpen,
      fileName,
      imageIndex,
      hasValidImageName,
      hasValidImageIndex,
    });

    return {
      isVisible: isOpen,
      fileName,
      imageIndex,
      confirmationMessage,
      warningMessage,
      hasValidImageName,
      hasValidImageIndex,
    };
  }, [safeState]);

  const dialogStyleConfiguration = useMemo(() => {
    const { isVisible } = deleteConfirmationInfo;

    const baseClasses =
      'absolute inset-0 p-3 bg-red-50 border-red-200 transition-all duration-500';
    const visibilityClasses = isVisible
      ? 'transform translate-y-0 opacity-100'
      : 'transform translate-y-full opacity-0 pointer-events-none';

    const finalClassName = `${baseClasses} ${visibilityClasses}`;

    return {
      finalClassName,
      isVisible,
    };
  }, [deleteConfirmationInfo.isVisible]);

  const handleConfirmClickEvent = useCallback(() => {
    const { isVisible, hasValidImageIndex, imageIndex, fileName } =
      deleteConfirmationInfo;

    console.log('🗑️ [DELETE_CONFIRM] 삭제 확인 버튼 클릭:', {
      isVisible,
      hasValidImageIndex,
      imageIndex,
      fileName,
    });

    if (!isVisible) {
      console.warn(
        '⚠️ [DELETE_CONFIRM] 다이얼로그가 보이지 않는 상태에서 확인 버튼 클릭'
      );
      return;
    }

    if (!hasValidImageIndex) {
      console.warn('⚠️ [DELETE_CONFIRM] 유효하지 않은 이미지 인덱스:', {
        imageIndex,
      });
      return;
    }

    try {
      handleDeleteConfirm();

      console.log('✅ [DELETE_CONFIRM] 삭제 확인 처리 완료:', {
        imageIndex,
        fileName,
      });
    } catch (confirmError) {
      console.error('❌ [DELETE_CONFIRM] 삭제 확인 처리 중 오류:', {
        error: confirmError,
        imageIndex,
        fileName,
      });
    }
  }, [deleteConfirmationInfo, handleDeleteConfirm]);

  const handleCancelClickEvent = useCallback(() => {
    const { isVisible, imageIndex, fileName } = deleteConfirmationInfo;

    console.log('❌ [DELETE_CONFIRM] 삭제 취소 버튼 클릭:', {
      isVisible,
      imageIndex,
      fileName,
    });

    if (!isVisible) {
      console.warn(
        '⚠️ [DELETE_CONFIRM] 다이얼로그가 보이지 않는 상태에서 취소 버튼 클릭'
      );
      return;
    }

    try {
      handleDeleteCancel();

      console.log('✅ [DELETE_CONFIRM] 삭제 취소 처리 완료:', {
        imageIndex,
        fileName,
      });
    } catch (cancelError) {
      console.error('❌ [DELETE_CONFIRM] 삭제 취소 처리 중 오류:', {
        error: cancelError,
        imageIndex,
        fileName,
      });
    }
  }, [deleteConfirmationInfo, handleDeleteCancel]);

  const buttonStyleConfiguration = useMemo(() => {
    const cancelButtonClasses =
      'px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200';

    const confirmButtonClasses =
      'px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200';

    return {
      cancelButtonClasses,
      confirmButtonClasses,
    };
  }, []);

  const accessibilityAttributes = useMemo(() => {
    const { fileName } = deleteConfirmationInfo;

    const dialogAriaLabel = `${fileName} 이미지 삭제 확인`;
    const cancelAriaLabel = '이미지 삭제 취소';
    const confirmAriaLabel = '이미지 삭제 확인';

    return {
      dialogAriaLabel,
      cancelAriaLabel,
      confirmAriaLabel,
    };
  }, [deleteConfirmationInfo.fileName]);

  const { confirmationMessage, warningMessage, isVisible } =
    deleteConfirmationInfo;

  const { finalClassName } = dialogStyleConfiguration;
  const { cancelButtonClasses, confirmButtonClasses } =
    buttonStyleConfiguration;
  const { dialogAriaLabel, cancelAriaLabel, confirmAriaLabel } =
    accessibilityAttributes;

  if (!isVisible) {
    console.log('🔍 [DELETE_CONFIRM] 다이얼로그가 보이지 않으므로 렌더링 안함');
    return null;
  }

  return (
    <div
      className={finalClassName}
      role="dialog"
      aria-labelledby="delete-confirm-text"
      aria-live="polite"
      aria-label={dialogAriaLabel}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p
            id="delete-confirm-text"
            className="text-sm font-medium text-red-800"
          >
            {confirmationMessage}
          </p>
          <p className="mt-1 text-xs text-red-600">{warningMessage}</p>
        </div>

        <div>
          <ul className="flex gap-2" role="list">
            <li role="listitem">
              <button
                type="button"
                className={cancelButtonClasses}
                onClick={handleCancelClickEvent}
                aria-label={cancelAriaLabel}
              >
                취소
              </button>
            </li>
            <li role="listitem">
              <button
                type="button"
                className={confirmButtonClasses}
                onClick={handleConfirmClickEvent}
                aria-label={confirmAriaLabel}
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

export default memo(DeleteConfirmDialog);
