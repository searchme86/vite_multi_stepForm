// import React from 'react';
// import {
//   togglePreviewMode,
//   togglePreviewPanel,
//   openPreview,
//   closePreview,
//   openPreviewPanel,
//   closePreviewPanel,
// } from '../actions/previewActions';

// export const usePreviewToggle = () => {
//   console.log('👁️ usePreviewToggle: 프리뷰 토글 훅 초기화');

//   const createToggleFunction = React.useCallback(
//     (
//       currentState: boolean,
//       setState: (state: boolean) => void,
//       actionFunction: (current: boolean) => boolean
//     ) => {
//       return () => {
//         console.log('👁️ usePreviewToggle: 토글 함수 실행');
//         const newState = actionFunction(currentState);
//         setState(newState);
//       };
//     },
//     []
//   );

//   const createOpenFunction = React.useCallback(
//     (setState: (state: boolean) => void, actionFunction: () => boolean) => {
//       return () => {
//         console.log('👁️ usePreviewToggle: 열기 함수 실행');
//         const newState = actionFunction();
//         setState(newState);
//       };
//     },
//     []
//   );

//   const createCloseFunction = React.useCallback(
//     (setState: (state: boolean) => void, actionFunction: () => boolean) => {
//       return () => {
//         console.log('👁️ usePreviewToggle: 닫기 함수 실행');
//         const newState = actionFunction();
//         setState(newState);
//       };
//     },
//     []
//   );

//   const createToggleFunctions = React.useCallback(
//     (
//       showPreview: boolean,
//       isPreviewPanelOpen: boolean,
//       setShowPreview: (state: boolean) => void,
//       setIsPreviewPanelOpen: (state: boolean) => void
//     ) => {
//       console.log('👁️ usePreviewToggle: 토글 함수들 생성');

//       return {
//         togglePreview: createToggleFunction(
//           showPreview,
//           setShowPreview,
//           togglePreviewMode
//         ),
//         togglePreviewPanel: createToggleFunction(
//           isPreviewPanelOpen,
//           setIsPreviewPanelOpen,
//           togglePreviewPanel
//         ),
//         openPreview: createOpenFunction(setShowPreview, openPreview),
//         closePreview: createCloseFunction(setShowPreview, closePreview),
//         openPreviewPanel: createOpenFunction(
//           setIsPreviewPanelOpen,
//           openPreviewPanel
//         ),
//         closePreviewPanel: createCloseFunction(
//           setIsPreviewPanelOpen,
//           closePreviewPanel
//         ),
//       };
//     },
//     [createToggleFunction, createOpenFunction, createCloseFunction]
//   );

//   return {
//     createToggleFunctions,
//   };
// };
