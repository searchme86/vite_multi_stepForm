// blogMediaStep/imageGallery/hooks/gallery/useImageSelection.ts - ImageGallery 컴포넌트

import { useCallback } from 'react';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';

export interface ImageSelectionActions {
  handleSelectFile: (index: number) => void;
  handleSelectAll: (displayFiles: Array<{ index: number }>) => void;
  clearSelection: () => void;
  isFileSelected: (index: number) => boolean;
  getSelectedCount: () => number;
  getSelectedIndices: () => number[];
}

export const useImageSelection = (): ImageSelectionActions => {
  console.log('🔧 useImageSelection 훅 초기화');

  const { selectionState, setSelectedFiles } = useBlogMediaStepState();

  const { selectedFiles } = selectionState;

  const handleSelectFile = useCallback(
    (index: number) => {
      console.log('🔧 handleSelectFile 호출:', { index });

      const newSelectedFiles = selectedFiles.includes(index)
        ? selectedFiles.filter((i) => i !== index)
        : [...selectedFiles, index];

      setSelectedFiles(newSelectedFiles);

      console.log('✅ handleSelectFile 완료:', {
        index,
        action: selectedFiles.includes(index) ? 'removed' : 'added',
        newCount: newSelectedFiles.length,
      });
    },
    [selectedFiles, setSelectedFiles]
  );

  const handleSelectAll = useCallback(
    (displayFiles: Array<{ index: number }>) => {
      console.log('🔧 handleSelectAll 호출:', {
        displayFileCount: displayFiles.length,
      });

      const displayIndices = displayFiles.map((item) => item.index);
      const isAllSelected =
        selectedFiles.length === displayFiles.length &&
        displayIndices.every((index) => selectedFiles.includes(index));

      const newSelectedFiles = isAllSelected ? [] : displayIndices;
      setSelectedFiles(newSelectedFiles);

      console.log('✅ handleSelectAll 완료:', {
        wasAllSelected: isAllSelected,
        newCount: newSelectedFiles.length,
      });
    },
    [selectedFiles, setSelectedFiles]
  );

  const clearSelection = useCallback(() => {
    console.log('🔧 clearSelection 호출');

    setSelectedFiles([]);

    console.log('✅ clearSelection 완료');
  }, [setSelectedFiles]);

  const isFileSelected = useCallback(
    (index: number): boolean => {
      console.log('🔧 isFileSelected 호출:', { index });

      const isSelected = selectedFiles.includes(index);

      console.log('✅ isFileSelected 결과:', { index, isSelected });
      return isSelected;
    },
    [selectedFiles]
  );

  const getSelectedCount = useCallback((): number => {
    console.log('🔧 getSelectedCount 호출');

    const count = selectedFiles.length;

    console.log('✅ getSelectedCount 결과:', { count });
    return count;
  }, [selectedFiles]);

  const getSelectedIndices = useCallback((): number[] => {
    console.log('🔧 getSelectedIndices 호출');

    console.log('✅ getSelectedIndices 결과:', {
      indices: selectedFiles,
      count: selectedFiles.length,
    });
    return [...selectedFiles];
  }, [selectedFiles]);

  console.log('✅ useImageSelection 초기화 완료:', {
    selectedCount: selectedFiles.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    handleSelectFile,
    handleSelectAll,
    clearSelection,
    isFileSelected,
    getSelectedCount,
    getSelectedIndices,
  };
};
