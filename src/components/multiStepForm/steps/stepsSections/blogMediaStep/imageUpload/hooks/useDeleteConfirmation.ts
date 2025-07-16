// 📁 imageUpload/hooks/useDeleteConfirmation.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { createLogger } from '../utils/loggerUtils';
import type { DeleteConfirmState } from '../types/imageUploadTypes';

const logger = createLogger('DELETE_CONFIRMATION');

export const useDeleteConfirmation = (
  onConfirmDelete: (imageIndex: number, imageName: string) => void
) => {
  const [deleteConfirmState, setDeleteConfirmState] =
    useState<DeleteConfirmState>({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });

  const currentStateRef = useRef({
    imageIndex: -1,
    imageName: '',
  });

  useEffect(() => {
    const { imageIndex: currentImageIndex, imageName: currentImageName } =
      deleteConfirmState;

    // 🚨 FIXED: imageName의 타입 안전성 확보
    const safeImageName = currentImageName ?? '';

    currentStateRef.current = {
      imageIndex: currentImageIndex,
      imageName: safeImageName,
    };
  }, [deleteConfirmState.imageIndex, deleteConfirmState.imageName]);

  logger.debug('useDeleteConfirmation 초기화', {
    isVisible: deleteConfirmState.isVisible,
    imageIndex: deleteConfirmState.imageIndex,
    imageName: deleteConfirmState.imageName,
    timestamp: new Date().toLocaleTimeString(),
  });

  const showDeleteConfirmation = useCallback(
    (imageIndex: number, imageDisplayName: string) => {
      logger.debug('삭제 확인 UI 표시', {
        imageIndex,
        imageDisplayName,
        timestamp: new Date().toLocaleTimeString(),
      });

      const newDeleteConfirmState: DeleteConfirmState = {
        isVisible: true,
        imageIndex,
        imageName: imageDisplayName,
      };

      setDeleteConfirmState(newDeleteConfirmState);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    const { imageIndex: currentImageIndex, imageName: currentImageName } =
      currentStateRef.current;

    logger.debug('삭제 확인', {
      imageIndex: currentImageIndex,
      imageName: currentImageName,
      timestamp: new Date().toLocaleTimeString(),
    });

    const isValidIndex = currentImageIndex >= 0;
    const hasImageName = currentImageName.length > 0;

    // 🔧 early return으로 중첩 방지
    if (!isValidIndex || !hasImageName) {
      logger.error('잘못된 삭제 요청', {
        imageIndex: currentImageIndex,
        imageName: currentImageName,
        isValidIndex,
        hasImageName,
      });
      return;
    }

    onConfirmDelete(currentImageIndex, currentImageName);

    const resetDeleteConfirmState: DeleteConfirmState = {
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    };

    setDeleteConfirmState(resetDeleteConfirmState);

    logger.info('삭제 확인 처리 완료', {
      imageIndex: currentImageIndex,
      imageName: currentImageName,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [onConfirmDelete]);

  const cancelDelete = useCallback(() => {
    const { imageIndex: previousImageIndex, imageName: previousImageName } =
      currentStateRef.current;

    logger.debug('삭제 취소', {
      previousImageIndex,
      previousImageName,
      timestamp: new Date().toLocaleTimeString(),
    });

    const cancelledDeleteConfirmState: DeleteConfirmState = {
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    };

    setDeleteConfirmState(cancelledDeleteConfirmState);

    logger.info('삭제 취소 처리 완료', {
      previousImageIndex,
      previousImageName,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, []);

  return {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
