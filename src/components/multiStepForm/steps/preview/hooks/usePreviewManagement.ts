import React from 'react';
import { usePreviewState } from './usePreviewState';
import { usePreviewToggle } from './usePreviewToggle';

interface UsePreviewManagementProps {
  initialShowPreview?: boolean;
  initialPanelOpen?: boolean;
}

export const usePreviewManagement = ({
  initialShowPreview = false,
  initialPanelOpen = false,
}: UsePreviewManagementProps = {}) => {
  console.log('👁️ usePreviewManagement: 프리뷰 관리 훅 초기화');

  const previewState = usePreviewState();
  const previewToggle = usePreviewToggle();

  // 초기값 설정
  React.useEffect(() => {
    console.log('👁️ usePreviewManagement: 초기값 설정');
    if (initialShowPreview !== previewState.showPreview) {
      previewState.setShowPreview(initialShowPreview);
    }
    if (initialPanelOpen !== previewState.isPreviewPanelOpen) {
      previewState.setIsPreviewPanelOpen(initialPanelOpen);
    }
  }, [
    initialShowPreview,
    initialPanelOpen,
    previewState.showPreview,
    previewState.isPreviewPanelOpen,
    previewState.setShowPreview,
    previewState.setIsPreviewPanelOpen,
  ]);

  const getPreviewStatus = React.useCallback(() => {
    const status = {
      isActive: previewState.showPreview || previewState.isPreviewPanelOpen,
      mode: previewState.showPreview
        ? 'desktop'
        : previewState.isPreviewPanelOpen
        ? 'mobile'
        : 'none',
      showPreview: previewState.showPreview,
      panelOpen: previewState.isPreviewPanelOpen,
    };

    console.log('👁️ usePreviewManagement: 프리뷰 상태', status);
    return status;
  }, [previewState.showPreview, previewState.isPreviewPanelOpen]);

  const openAllPreviews = React.useCallback(() => {
    console.log('👁️ usePreviewManagement: 모든 프리뷰 열기');
    previewState.setShowPreview(true);
    previewState.setIsPreviewPanelOpen(true);
  }, [previewState.setShowPreview, previewState.setIsPreviewPanelOpen]);

  const closeAllPreviews = React.useCallback(() => {
    console.log('👁️ usePreviewManagement: 모든 프리뷰 닫기');
    previewState.setShowPreview(false);
    previewState.setIsPreviewPanelOpen(false);
  }, [previewState.setShowPreview, previewState.setIsPreviewPanelOpen]);

  return {
    // 상태
    ...previewState,

    // 토글 함수들
    ...previewToggle,

    // 관리 함수들
    getPreviewStatus,
    openAllPreviews,
    closeAllPreviews,
  };
};
