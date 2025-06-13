// import React from 'react';

// export const usePreviewState = () => {
//   const [showPreview, setShowPreview] = React.useState(false);
//   const [isPreviewPanelOpen, setIsPreviewPanelOpen] = React.useState(false);

//   const togglePreview = React.useCallback(() => {
//     console.log('👁️ togglePreview: 프리뷰 상태 토글');
//     setShowPreview((prev) => {
//       console.log('👁️ togglePreview: 이전 상태:', prev, '-> 새 상태:', !prev);
//       return !prev;
//     });
//   }, []);

//   const togglePreviewPanel = React.useCallback(() => {
//     console.log('👁️ togglePreviewPanel: 프리뷰 패널 토글');
//     setIsPreviewPanelOpen((prev) => {
//       console.log(
//         '👁️ togglePreviewPanel: 이전 상태:',
//         prev,
//         '-> 새 상태:',
//         !prev
//       );
//       return !prev;
//     });
//   }, []);

//   return {
//     showPreview,
//     setShowPreview,
//     isPreviewPanelOpen,
//     setIsPreviewPanelOpen,
//     togglePreview,
//     togglePreviewPanel,
//   };
// };
