// //====여기부터 수정됨====
// // ✅ 수정: EditorStateManager 제거하고 useEditorState 직접 사용
// // 이유: 중복된 에디터 상태 관리 제거
// import React from 'react';
// import { useEditorState } from '../../steps/editor/hooks/useEditorState';
// import { EditorState } from '../../types/editorTypes';

// // ❌ 제거: import EditorStateManager from './EditorStateManager';

// interface EditorStateContainerProps {
//   persistState?: boolean;
//   storageKey?: string;
//   children: React.ReactNode;
// }

// function EditorStateContainer({
//   persistState = false,
//   storageKey = 'multiStepForm_editorState',
//   children,
// }: EditorStateContainerProps) {
//   console.log('📝 EditorStateContainer: 에디터 상태 컨테이너 렌더링');

//   // ✅ 수정: useEditorState 직접 사용
//   const editor = useEditorState();
//   const [initialState, setInitialState] = React.useState<Partial<EditorState>>(
//     {}
//   );

//   // 로컬 스토리지 로직 유지 (기존과 동일)
//   React.useEffect(() => {
//     if (persistState && typeof window !== 'undefined') {
//       try {
//         const savedState = localStorage.getItem(storageKey);
//         if (savedState) {
//           const parsedState = JSON.parse(savedState);
//           setInitialState(parsedState);
//         }
//       } catch (error) {
//         console.error('📝 EditorStateContainer: 상태 복원 실패', error);
//       }
//     }
//   }, [persistState, storageKey]);

//   const handleStateChange = React.useCallback(
//     (state: EditorState) => {
//       if (persistState && typeof window !== 'undefined') {
//         try {
//           localStorage.setItem(storageKey, JSON.stringify(state));
//         } catch (error) {
//           console.error('📝 EditorStateContainer: 상태 영속화 실패', error);
//         }
//       }
//     },
//     [persistState, storageKey]
//   );

//   return (
//     <div data-editor-container="true">
//       {/* ✅ 수정: EditorStateManager 제거하고 children 직접 렌더링 */}
//       {children}
//     </div>
//   );
// }
// //====여기까지 수정됨====
