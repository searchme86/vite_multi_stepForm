import React from 'react';

export interface PreviewState {
  showPreview: boolean;
  isPreviewPanelOpen: boolean;
  previewMode: 'desktop' | 'mobile' | 'tablet';
}

export interface PreviewActions {
  togglePreview: () => void;
  togglePreviewPanel: () => void;
  setPreviewMode: (mode: 'desktop' | 'mobile' | 'tablet') => void;
  openPreviewPanel: () => void;
  closePreviewPanel: () => void;
}

export interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface PreviewControlsProps {
  showPreview: boolean;
  onToggle: () => void;
  isDisabled?: boolean;
}
