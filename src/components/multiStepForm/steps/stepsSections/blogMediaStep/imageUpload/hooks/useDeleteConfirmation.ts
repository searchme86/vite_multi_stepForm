// blogMediaStep/imageUpload/hooks/useDeleteConfirmation.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { type DeleteConfirmState } from '../types/imageUploadTypes';

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
    currentStateRef.current = {
      imageIndex: deleteConfirmState.imageIndex,
      imageName: deleteConfirmState.imageName,
    };
  }, [deleteConfirmState.imageIndex, deleteConfirmState.imageName]);

  console.log('🔧 [DELETE_CONFIRMATION] useDeleteConfirmation 초기화:', {
    isVisible: deleteConfirmState.isVisible,
    imageIndex: deleteConfirmState.imageIndex,
    imageName: deleteConfirmState.imageName,
    timestamp: new Date().toLocaleTimeString(),
  });

  const showDeleteConfirmation = useCallback(
    (imageIndex: number, imageDisplayName: string) => {
      console.log('🗑️ [DELETE_UI] 삭제 확인 UI 표시:', {
        imageIndex,
        imageDisplayName,
        timestamp: new Date().toLocaleTimeString(),
      });

      setDeleteConfirmState({
        isVisible: true,
        imageIndex,
        imageName: imageDisplayName,
      });
    },
    []
  );

  const confirmDelete = useCallback(() => {
    const { imageIndex, imageName } = currentStateRef.current;

    console.log('✅ [DELETE_CONFIRM] 삭제 확인:', {
      imageIndex,
      imageName,
      timestamp: new Date().toLocaleTimeString(),
    });

    const isValidIndex = imageIndex >= 0;
    const hasImageName = imageName.length > 0;

    if (!isValidIndex || !hasImageName) {
      console.error('❌ [DELETE_ERROR] 잘못된 삭제 요청:', {
        imageIndex,
        imageName,
        isValidIndex,
        hasImageName,
      });
      return;
    }

    onConfirmDelete(imageIndex, imageName);

    setDeleteConfirmState({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });
  }, [onConfirmDelete]);

  const cancelDelete = useCallback(() => {
    console.log('❌ [DELETE_CANCEL] 삭제 취소:', {
      timestamp: new Date().toLocaleTimeString(),
    });

    setDeleteConfirmState({
      isVisible: false,
      imageIndex: -1,
      imageName: '',
    });
  }, []);

  return {
    deleteConfirmState,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
