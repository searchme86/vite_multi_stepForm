// blogMediaStep/imageGallery/hooks/gallery/usePagination.ts

import { useCallback } from 'react';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';

export interface PaginationState {
  visibleFilesCount: number;
  isExpanded: boolean;
  hasMoreFiles: boolean;
  remainingFiles: number;
  showMoreCount: number;
  canExpand: boolean;
}

export interface PaginationActions {
  handleLoadMoreToggle: () => void;
  updateVisibleCount: (totalFiles: number) => void;
  resetPagination: () => void;
  getDisplayFiles: <T extends { index: number }>(allFiles: T[]) => T[];
  getPaginationState: () => PaginationState;
}

const INITIAL_VISIBLE_FILES = 5;
const LOAD_MORE_COUNT = 3;

export const usePagination = (): PaginationActions => {
  console.log('🔧 usePagination 훅 초기화');

  const { uiState, setVisibleFilesCount, setIsExpanded } =
    useBlogMediaStepState();

  const { visibleFilesCount, isExpanded } = uiState;

  const calculatePaginationState = useCallback(
    (totalFiles: number): PaginationState => {
      console.log('🔧 calculatePaginationState 호출:', {
        totalFiles,
        visibleFilesCount,
        isExpanded,
      });

      const remainingFiles = totalFiles - visibleFilesCount;
      const hasMoreFiles = remainingFiles > 0;
      const showMoreCount = Math.min(LOAD_MORE_COUNT, remainingFiles);
      const canExpand = totalFiles > INITIAL_VISIBLE_FILES;

      const state: PaginationState = {
        visibleFilesCount,
        isExpanded,
        hasMoreFiles,
        remainingFiles,
        showMoreCount,
        canExpand,
      };

      console.log('✅ calculatePaginationState 결과:', state);
      return state;
    },
    [visibleFilesCount, isExpanded]
  );

  const getPaginationState = useCallback((): PaginationState => {
    console.log('🔧 getPaginationState 호출');

    const state = calculatePaginationState(0);
    console.log('✅ getPaginationState 결과:', state);
    return state;
  }, [calculatePaginationState]);

  const handleLoadMoreToggle = useCallback(() => {
    console.log('🔧 handleLoadMoreToggle 호출:', {
      currentVisible: visibleFilesCount,
      isExpanded,
    });

    if (isExpanded) {
      setVisibleFilesCount(INITIAL_VISIBLE_FILES);
      setIsExpanded(false);
      console.log('✅ handleLoadMoreToggle 접기 완료');
    } else {
      const newCount = visibleFilesCount + LOAD_MORE_COUNT;
      setVisibleFilesCount(newCount);
      console.log('✅ handleLoadMoreToggle 더보기 완료:', { newCount });
    }
  }, [visibleFilesCount, isExpanded, setVisibleFilesCount, setIsExpanded]);

  const updateVisibleCount = useCallback(
    (totalFiles: number) => {
      console.log('🔧 updateVisibleCount 호출:', {
        totalFiles,
        currentVisible: visibleFilesCount,
      });

      if (visibleFilesCount > totalFiles) {
        const newCount = Math.max(INITIAL_VISIBLE_FILES, totalFiles);
        setVisibleFilesCount(newCount);
        setIsExpanded(totalFiles <= INITIAL_VISIBLE_FILES ? false : isExpanded);

        console.log('✅ updateVisibleCount 조정 완료:', {
          newCount,
          newExpanded: totalFiles <= INITIAL_VISIBLE_FILES ? false : isExpanded,
        });
      }
    },
    [visibleFilesCount, isExpanded, setVisibleFilesCount, setIsExpanded]
  );

  const resetPagination = useCallback(() => {
    console.log('🔧 resetPagination 호출');

    setVisibleFilesCount(INITIAL_VISIBLE_FILES);
    setIsExpanded(false);

    console.log('✅ resetPagination 완료');
  }, [setVisibleFilesCount, setIsExpanded]);

  const getDisplayFiles = useCallback(
    <T extends { index: number }>(allFiles: T[]): T[] => {
      console.log('🔧 getDisplayFiles 호출:', {
        totalFiles: allFiles.length,
        visibleFilesCount,
      });

      const displayFiles = allFiles.slice(0, visibleFilesCount);

      console.log('✅ getDisplayFiles 결과:', {
        displayCount: displayFiles.length,
        totalCount: allFiles.length,
      });

      return displayFiles;
    },
    [visibleFilesCount]
  );

  console.log('✅ usePagination 초기화 완료:', {
    visibleFilesCount,
    isExpanded,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    handleLoadMoreToggle,
    updateVisibleCount,
    resetPagination,
    getDisplayFiles,
    getPaginationState,
  };
};
