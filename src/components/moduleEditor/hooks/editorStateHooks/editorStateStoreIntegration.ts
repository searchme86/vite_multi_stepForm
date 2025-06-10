// ✨ [Store 통합] 원본과 동일한 방식으로 store 사용 - 직접 훅 호출 방식 유지
// 1. 원본의 store 호출 방식을 그대로 유지 2. 반응성과 업데이트 타이밍 보장

// ✨ [중요] 이 파일은 원본에서 사용하던 방식을 그대로 유지합니다
// 1. useEditorCoreStore, useEditorUIStore, useToastStore를 직접 호출 2. 간접 호출로 인한 반응성 문제 방지
// 3. 원본의 context 처리 로직과 정확히 일치 4. 예상치 못한 동작 차이 방지

// ✨ [주의사항]
// 원본 코드에서는 각 store를 직접 호출하여 사용했습니다.
// 분할된 버전에서는 이 파일을 통해 store 통합을 시도했지만,
// 이는 원본의 동작 방식과 다를 수 있어 문제가 될 수 있습니다.
//
// 따라서 useEditorStateMain.ts에서는 이 파일을 사용하지 않고
// 원본과 동일하게 각 store를 직접 호출하는 방식을 사용합니다.

export {};

// ✨ [참고용] 원본에서 사용하던 방식:
// const editorCoreStoreActions = useEditorCoreStore();
// const editorUIStoreActions = useEditorUIStore();
// const toastStoreActions = useToastStore();
//
// const contextProvided = props?.context;
// const hasContext = Boolean(contextProvided);
//
// const currentEditorState = contextProvided?.editorState ?? {
//   containers: editorCoreStoreActions.getContainers(),
//   paragraphs: editorCoreStoreActions.getParagraphs(),
//   completedContent: editorCoreStoreActions.getCompletedContent(),
//   isCompleted: editorCoreStoreActions.getIsCompleted(),
// };
//
// const updateContainersFunction = contextProvided?.updateEditorContainers ?? editorCoreStoreActions.setContainers;
// const updateParagraphsFunction = contextProvided?.updateEditorParagraphs ?? editorCoreStoreActions.setParagraphs;
// const updateCompletedContentFunction = contextProvided?.updateEditorCompletedContent ?? editorCoreStoreActions.setCompletedContent;
// const setCompletedStatusFunction = contextProvided?.setEditorCompleted ?? editorCoreStoreActions.setIsCompleted;
// const showToastFunction = contextProvided?.addToast ?? toastStoreActions.addToast;
