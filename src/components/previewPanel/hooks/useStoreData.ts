// Zustand 스토어 데이터 연동 훅

import { useFormDataStore } from '../../../store/formData/formDataStore';
import { useImageGalleryStore } from '../../../store/imageGallery/imageGalleryStore';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';

const selectFormData = (state: any) => state.getFormData?.() || {};
const selectIsPreviewPanelOpen = (state: any) =>
  state.getIsPreviewPanelOpen?.() || false;
const selectSetIsPreviewPanelOpen = (state: any) =>
  state.setIsPreviewPanelOpen || (() => {});
const selectImageViewConfig = (state: any) =>
  state.getImageViewConfig?.() || {};
const selectCustomGalleryViews = (state: any) =>
  state.getCustomGalleryViews?.() || [];
const selectEditorContainers = (state: any) => state.getContainers?.() || [];
const selectEditorParagraphs = (state: any) => state.getParagraphs?.() || [];
const selectEditorCompletedContent = (state: any) =>
  state.getCompletedContent?.() || '';
const selectIsEditorCompleted = (state: any) =>
  state.getIsCompleted?.() || false;

export function useStoreData() {
  console.log('🗃️ 스토어 데이터 연동 시작');

  const formData = useFormDataStore(selectFormData);
  const isPreviewPanelOpen = useImageGalleryStore(selectIsPreviewPanelOpen);
  const setIsPreviewPanelOpen = useImageGalleryStore(
    selectSetIsPreviewPanelOpen
  );
  const imageViewConfig = useImageGalleryStore(selectImageViewConfig);
  const customGalleryViews = useImageGalleryStore(selectCustomGalleryViews);
  const editorContainers = useEditorCoreStore(selectEditorContainers);
  const editorParagraphs = useEditorCoreStore(selectEditorParagraphs);
  const editorCompletedContent = useEditorCoreStore(
    selectEditorCompletedContent
  );
  const isEditorCompleted = useEditorCoreStore(selectIsEditorCompleted);

  console.log('✅ 스토어 데이터 연동 완료');

  return {
    formData,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
    imageViewConfig,
    customGalleryViews,
    editorContainers,
    editorParagraphs,
    editorCompletedContent,
    isEditorCompleted,
  };
}
