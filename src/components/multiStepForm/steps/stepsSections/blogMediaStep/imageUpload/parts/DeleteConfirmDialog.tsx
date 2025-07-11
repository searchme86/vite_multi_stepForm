// 📁 imageUpload/parts/DeleteConfirmDialog.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('DELETE_CONFIRM_DIALOG');

function DeleteConfirmDialog(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const { deleteConfirmState, handleDeleteConfirm, handleDeleteCancel } =
    useImageUploadContext();

  logger.debug('DeleteConfirmDialog 렌더링', {
    isVisible: deleteConfirmState.isVisible,
    imageIndex: deleteConfirmState.imageIndex,
    imageName: deleteConfirmState.imageName,
  });

  // 🚀 성능 최적화: 삭제 확인 정보 메모이제이션
  const deleteConfirmationInfo = useMemo(() => {
    const { isVisible, imageName, imageIndex } = deleteConfirmState;

    const hasValidImageName = imageName.length > 0;
    const hasValidImageIndex = imageIndex >= 0;

    const confirmationMessage = hasValidImageName
      ? `"${imageName}" 이미지를 삭제하시겠습니까?`
      : '선택된 이미지를 삭제하시겠습니까?';

    const warningMessage = '삭제된 이미지는 복구할 수 없습니다.';

    logger.debug('삭제 확인 정보 계산', {
      isVisible,
      imageName,
      imageIndex,
      hasValidImageName,
      hasValidImageIndex,
      confirmationMessage,
    });

    return {
      isVisible,
      imageName,
      imageIndex,
      confirmationMessage,
      warningMessage,
      hasValidImageName,
      hasValidImageIndex,
    };
  }, [deleteConfirmState]);

  // 🚀 성능 최적화: 다이얼로그 스타일 클래스 메모이제이션
  const dialogStyleConfiguration = useMemo(() => {
    const { isVisible } = deleteConfirmationInfo;

    const baseClasses =
      'absolute inset-0 p-3 bg-red-50 border-red-200 transition-all duration-500';
    const visibilityClasses = isVisible
      ? 'transform translate-y-0 opacity-100'
      : 'transform translate-y-full opacity-0 pointer-events-none';

    const finalClassName = `${baseClasses} ${visibilityClasses}`;

    logger.debug('다이얼로그 스타일 클래스 계산', {
      isVisible,
      finalClassName,
    });

    return {
      finalClassName,
      isVisible,
    };
  }, [deleteConfirmationInfo.isVisible]);

  // 🚀 성능 최적화: 확인 버튼 클릭 핸들러 메모이제이션
  const handleConfirmClickEvent = useCallback(() => {
    const { isVisible, hasValidImageIndex, imageIndex, imageName } =
      deleteConfirmationInfo;

    logger.debug('삭제 확인 버튼 클릭', {
      isVisible,
      hasValidImageIndex,
      imageIndex,
      imageName,
    });

    // 🔧 early return으로 중첩 방지
    if (!isVisible) {
      logger.warn('다이얼로그가 보이지 않는 상태에서 확인 버튼 클릭');
      return;
    }

    if (!hasValidImageIndex) {
      logger.warn('유효하지 않은 이미지 인덱스로 확인 버튼 클릭', {
        imageIndex,
      });
      return;
    }

    try {
      handleDeleteConfirm();

      logger.info('삭제 확인 처리 완료', {
        imageIndex,
        imageName,
      });
    } catch (confirmError) {
      logger.error('삭제 확인 처리 중 오류', {
        error: confirmError,
        imageIndex,
        imageName,
      });
    }
  }, [deleteConfirmationInfo, handleDeleteConfirm]);

  // 🚀 성능 최적화: 취소 버튼 클릭 핸들러 메모이제이션
  const handleCancelClickEvent = useCallback(() => {
    const { isVisible, imageIndex, imageName } = deleteConfirmationInfo;

    logger.debug('삭제 취소 버튼 클릭', {
      isVisible,
      imageIndex,
      imageName,
    });

    // 🔧 early return으로 중첩 방지
    if (!isVisible) {
      logger.warn('다이얼로그가 보이지 않는 상태에서 취소 버튼 클릭');
      return;
    }

    try {
      handleDeleteCancel();

      logger.info('삭제 취소 처리 완료', {
        imageIndex,
        imageName,
      });
    } catch (cancelError) {
      logger.error('삭제 취소 처리 중 오류', {
        error: cancelError,
        imageIndex,
        imageName,
      });
    }
  }, [deleteConfirmationInfo, handleDeleteCancel]);

  // 🚀 성능 최적화: 버튼 스타일 설정 메모이제이션
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

  // 🚀 성능 최적화: 접근성 속성 메모이제이션
  const accessibilityAttributes = useMemo(() => {
    const { imageName } = deleteConfirmationInfo;

    const dialogAriaLabel = `${imageName} 이미지 삭제 확인`;
    const cancelAriaLabel = '이미지 삭제 취소';
    const confirmAriaLabel = '이미지 삭제 확인';

    return {
      dialogAriaLabel,
      cancelAriaLabel,
      confirmAriaLabel,
    };
  }, [deleteConfirmationInfo.imageName]);

  // 🔧 구조분해할당으로 데이터 접근
  const { confirmationMessage, warningMessage, isVisible } =
    deleteConfirmationInfo;

  const { finalClassName } = dialogStyleConfiguration;
  const { cancelButtonClasses, confirmButtonClasses } =
    buttonStyleConfiguration;
  const { dialogAriaLabel, cancelAriaLabel, confirmAriaLabel } =
    accessibilityAttributes;

  // 🔧 early return으로 불필요한 렌더링 방지
  if (!isVisible) {
    logger.debug('다이얼로그가 보이지 않으므로 렌더링 최소화');
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
