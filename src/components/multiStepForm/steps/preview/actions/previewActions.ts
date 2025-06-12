// export const togglePreviewMode = (currentMode: boolean): boolean => {
//   console.log('👁️ previewActions: 프리뷰 모드 토글', {
//     currentMode,
//     newMode: !currentMode,
//   });
//   return !currentMode;
// };

// export const openPreview = (): boolean => {
//   console.log('👁️ previewActions: 프리뷰 열기');
//   return true;
// };

// export const closePreview = (): boolean => {
//   console.log('👁️ previewActions: 프리뷰 닫기');
//   return false;
// };

// export const togglePreviewPanel = (currentState: boolean): boolean => {
//   console.log('👁️ previewActions: 프리뷰 패널 토글', {
//     currentState,
//     newState: !currentState,
//   });
//   return !currentState;
// };

// export const openPreviewPanel = (): boolean => {
//   console.log('👁️ previewActions: 프리뷰 패널 열기');
//   return true;
// };

// export const closePreviewPanel = (): boolean => {
//   console.log('👁️ previewActions: 프리뷰 패널 닫기');
//   return false;
// };

// export const getPreviewState = (
//   showPreview: boolean,
//   isPreviewPanelOpen: boolean
// ) => {
//   console.log('👁️ previewActions: 프리뷰 상태 가져오기');

//   return {
//     showPreview,
//     isPreviewPanelOpen,
//     hasActivePreview: showPreview || isPreviewPanelOpen,
//     previewMode: showPreview
//       ? 'desktop'
//       : isPreviewPanelOpen
//       ? 'mobile'
//       : 'none',
//   };
// };

// export const validatePreviewContent = (content: any): boolean => {
//   console.log('👁️ previewActions: 프리뷰 컨텐츠 검증');

//   const hasTitle = content?.title && content.title.trim().length > 0;
//   const hasDescription =
//     content?.description && content.description.trim().length > 0;
//   const hasContent = content?.content && content.content.trim().length > 0;

//   const isValid = hasTitle || hasDescription || hasContent;
//   console.log('👁️ previewActions: 검증 결과', {
//     isValid,
//     hasTitle,
//     hasDescription,
//     hasContent,
//   });

//   return isValid;
// };
