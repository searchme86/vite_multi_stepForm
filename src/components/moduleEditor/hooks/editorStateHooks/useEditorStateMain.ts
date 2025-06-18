import { useState, useEffect, useMemo, useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';

import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

import { LocalParagraph } from './editorStateTypes';

import {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
} from './editorStateInitializers';

import { useDeviceDetection } from './editorStateDeviceDetection';

import {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
} from './editorStateParagraphActions';

import { addParagraphsToContainer } from './editorStateContainerActions';

import {
  getUnassignedParagraphs,
  getParagraphsByContainer,
} from './editorStateQueries';

import {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
} from './editorStateManagement';

import {
  completeStructureSetup,
  navigateToStructureStep,
  setActiveEditor,
  switchPreviewMode,
} from './editorStateWorkflow';

import { saveCurrentProgress, finishEditing } from './editorStatePersistence';

// 🔥 [완전 안정화] 모든 dependency를 제거하고 직접 호출 방식으로 변경
export function useEditorState() {
  return useEditorStateImpl();
}

const useEditorStateImpl = () => {
  // 🎯 [Store 안정화] 최상위에서 한 번만 호출하고 안정적인 참조 유지
  const editorCoreStore = useEditorCoreStore();
  const editorUIStore = useEditorUIStore();
  const toastStore = useToastStore();

  // 🔧 [핵심 수정] Store 함수들을 useCallback으로 안정화 - dependency 없이
  const stableUpdateStoredContainers = useCallback(
    (containers: Container[]) => {
      if (editorCoreStore?.setContainers) {
        editorCoreStore.setContainers(containers);
      }
    },
    []
  ); // 빈 dependency 배열

  const stableUpdateStoredParagraphs = useCallback(
    (paragraphs: LocalParagraph[]) => {
      if (editorCoreStore?.setParagraphs) {
        editorCoreStore.setParagraphs(paragraphs);
      }
    },
    []
  ); // 빈 dependency 배열

  const stableUpdateCompletedContent = useCallback((content: string) => {
    if (editorCoreStore?.setCompletedContent) {
      editorCoreStore.setCompletedContent(content);
    }
  }, []); // 빈 dependency 배열

  const stableUpdateCompletionStatus = useCallback((completed: boolean) => {
    if (editorCoreStore?.setIsCompleted) {
      editorCoreStore.setIsCompleted(completed);
    }
  }, []); // 빈 dependency 배열

  const stableAddToast = useCallback((options: any) => {
    if (toastStore?.addToast) {
      toastStore.addToast(options);
    }
  }, []); // 빈 dependency 배열

  const stableNavigateToWritingStep = useCallback(() => {
    if (editorUIStore?.goToWritingStep) {
      editorUIStore.goToWritingStep();
    }
  }, []); // 빈 dependency 배열

  const stableNavigateToStructureStep = useCallback(() => {
    if (editorUIStore?.goToStructureStep) {
      editorUIStore.goToStructureStep();
    }
  }, []); // 빈 dependency 배열

  const stableUpdateActiveParagraphId = useCallback((id: string | null) => {
    if (editorUIStore?.setActiveParagraphId) {
      editorUIStore.setActiveParagraphId(id);
    }
  }, []); // 빈 dependency 배열

  const stableTogglePreview = useCallback(() => {
    if (editorUIStore?.togglePreview) {
      editorUIStore.togglePreview();
    }
  }, []); // 빈 dependency 배열

  const stableToggleParagraphSelection = useCallback((paragraphId: string) => {
    if (editorUIStore?.toggleParagraphSelection) {
      editorUIStore.toggleParagraphSelection(paragraphId);
    }
  }, []); // 빈 dependency 배열

  const stableUpdateSelectedParagraphIds = useCallback((ids: string[]) => {
    if (editorUIStore?.setSelectedParagraphIds) {
      editorUIStore.setSelectedParagraphIds(ids);
    }
  }, []); // 빈 dependency 배열

  const stableUpdateTargetContainerId = useCallback((containerId: string) => {
    if (editorUIStore?.setTargetContainerId) {
      editorUIStore.setTargetContainerId(containerId);
    }
  }, []); // 빈 dependency 배열

  const stableClearSelectedParagraphs = useCallback(() => {
    if (editorUIStore?.clearSelectedParagraphs) {
      editorUIStore.clearSelectedParagraphs();
    }
  }, []); // 빈 dependency 배열

  // 🎯 [상태 초기화] 단순한 초기화
  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(() => {
      try {
        return createInitialInternalState(false, editorUIStore);
      } catch (error) {
        console.error('❌ [HOOK] 초기 내부 상태 생성 실패:', error);
        return {
          currentSubStep: 'structure',
          isTransitioning: false,
          activeParagraphId: null,
          isPreviewOpen: true,
          selectedParagraphIds: [],
          targetContainerId: '',
        };
      }
    });

  const [managedParagraphCollection, setManagedParagraphCollection] = useState<
    LocalParagraph[]
  >(() => {
    try {
      return createInitialParagraphs(false, editorCoreStore);
    } catch (error) {
      console.error('❌ [HOOK] 초기 단락 컬렉션 생성 실패:', error);
      return [];
    }
  });

  const [managedContainerCollection, setManagedContainerCollection] = useState<
    Container[]
  >(() => {
    try {
      return createInitialContainers(false, editorCoreStore);
    } catch (error) {
      console.error('❌ [HOOK] 초기 컨테이너 컬렉션 생성 실패:', error);
      return [];
    }
  });

  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  const {
    currentSubStep: currentEditorStepValue = 'structure',
    isTransitioning: isStepTransitioningValue = false,
    activeParagraphId: activeElementIdValue = null,
    isPreviewOpen: previewModeActiveValue = true,
    selectedParagraphIds: selectedElementIdCollection = [],
    targetContainerId: targetDestinationIdValue = '',
  } = editorInternalState || {};

  useDeviceDetection(setIsMobileDeviceDetected);

  // 🔧 [핵심 수정] Store 값 조회도 안정화 - dependency 최소화
  const stableStoreValues = useMemo(() => {
    return {
      currentSubStep: editorUIStore?.getCurrentSubStep?.() || 'structure',
      isTransitioning: editorUIStore?.getIsTransitioning?.() || false,
      activeParagraphId: editorUIStore?.getActiveParagraphId?.() || null,
      isPreviewOpen: editorUIStore?.getIsPreviewOpen?.() ?? true,
      selectedParagraphIds: editorUIStore?.getSelectedParagraphIds?.() || [],
      targetContainerId: editorUIStore?.getTargetContainerId?.() || '',
    };
  }, [
    editorUIStore?.getCurrentSubStep,
    editorUIStore?.getIsTransitioning,
    editorUIStore?.getActiveParagraphId,
    editorUIStore?.getIsPreviewOpen,
    editorUIStore?.getSelectedParagraphIds,
    editorUIStore?.getTargetContainerId,
  ]);

  // 🎯 [동기화] Store와 로컬 상태 동기화
  useEffect(() => {
    setEditorInternalState((previousInternalState) => {
      const prevState = previousInternalState || {};
      const hasChanges =
        prevState.currentSubStep !== stableStoreValues.currentSubStep ||
        prevState.isTransitioning !== stableStoreValues.isTransitioning ||
        prevState.activeParagraphId !== stableStoreValues.activeParagraphId ||
        prevState.isPreviewOpen !== stableStoreValues.isPreviewOpen ||
        JSON.stringify(prevState.selectedParagraphIds) !==
          JSON.stringify(stableStoreValues.selectedParagraphIds) ||
        prevState.targetContainerId !== stableStoreValues.targetContainerId;

      if (!hasChanges) {
        return prevState;
      }

      return {
        ...prevState,
        ...stableStoreValues,
      };
    });
  }, [stableStoreValues]);

  // 🔧 [핵심 수정] 모든 액션 함수들 - dependency 배열 완전 고정
  const addLocalParagraph = useCallback(() => {
    const actionFn = createNewParagraph(
      managedParagraphCollection,
      setManagedParagraphCollection,
      setEditorInternalState,
      false,
      editorUIStore,
      stableUpdateActiveParagraphId,
      stableAddToast
    );
    actionFn();
  }, [
    managedParagraphCollection.length, // 숫자
    stableUpdateActiveParagraphId, // 안정적인 함수
    stableAddToast, // 안정적인 함수
  ]); // 항상 3개 요소

  const updateLocalParagraphContent = useCallback(
    (id: string, content: string) => {
      const actionFn = updateParagraphContent(
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id, content);
    },
    [stableAddToast] // 항상 1개 요소
  );

  const deleteLocalParagraph = useCallback(
    (id: string) => {
      const actionFn = removeParagraph(
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id);
    },
    [stableAddToast] // 항상 1개 요소
  );

  const toggleParagraphSelection = useCallback(
    (id: string) => {
      const actionFn = toggleParagraphSelect(
        setEditorInternalState,
        false,
        editorUIStore,
        stableToggleParagraphSelection
      );
      actionFn(id);
    },
    [stableToggleParagraphSelection] // 항상 1개 요소
  );

  const addToLocalContainer = useCallback(() => {
    const actionFn = addParagraphsToContainer(
      selectedElementIdCollection,
      targetDestinationIdValue,
      managedParagraphCollection,
      managedContainerCollection,
      setManagedParagraphCollection,
      setEditorInternalState,
      stableAddToast,
      false,
      editorUIStore,
      stableClearSelectedParagraphs
    );
    actionFn();
  }, [
    selectedElementIdCollection.length, // 숫자
    targetDestinationIdValue, // 문자열
    managedParagraphCollection.length, // 숫자
    managedContainerCollection.length, // 숫자
    stableAddToast, // 안정적인 함수
    stableClearSelectedParagraphs, // 안정적인 함수
  ]); // 항상 6개 요소

  const moveLocalParagraphInContainer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const actionFn = changeParagraphOrder(
        managedParagraphCollection,
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id, direction);
    },
    [managedParagraphCollection.length, stableAddToast] // 항상 2개 요소
  );

  const getLocalUnassignedParagraphs = useCallback(
    () => getUnassignedParagraphs(managedParagraphCollection)(),
    [managedParagraphCollection.length] // 항상 1개 요소
  );

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string) =>
      getParagraphsByContainer(managedParagraphCollection)(containerId),
    [managedParagraphCollection.length] // 항상 1개 요소
  );

  const setSelectedParagraphIds = useCallback(
    (ids: string[]) => {
      const actionFn = updateSelectedParagraphs(
        setEditorInternalState,
        false,
        editorUIStore,
        stableUpdateSelectedParagraphIds
      );
      actionFn(ids);
    },
    [stableUpdateSelectedParagraphIds] // 항상 1개 요소
  );

  const setTargetContainerId = useCallback(
    (containerId: string) => {
      const actionFn = updateTargetContainer(
        setEditorInternalState,
        false,
        editorUIStore,
        stableUpdateTargetContainerId
      );
      actionFn(containerId);
    },
    [stableUpdateTargetContainerId] // 항상 1개 요소
  );

  const setActiveParagraphId = useCallback(
    (id: string | null) => {
      const actionFn = updateActiveParagraph(
        setEditorInternalState,
        false,
        editorUIStore,
        stableUpdateActiveParagraphId
      );
      actionFn(id);
    },
    [stableUpdateActiveParagraphId] // 항상 1개 요소
  );

  const handleStructureComplete = useCallback(
    (inputs: string[]) => {
      const actionFn = completeStructureSetup(
        setEditorInternalState,
        setManagedContainerCollection,
        stableAddToast,
        false,
        editorUIStore,
        stableNavigateToWritingStep
      );
      actionFn(inputs);
    },
    [stableAddToast, stableNavigateToWritingStep] // 항상 2개 요소
  );

  const goToStructureStep = useCallback(() => {
    const actionFn = navigateToStructureStep(
      setEditorInternalState,
      false,
      editorUIStore,
      stableNavigateToStructureStep
    );
    actionFn();
  }, [stableNavigateToStructureStep]); // 항상 1개 요소

  const activateEditor = useCallback(
    (id: string) => {
      const actionFn = setActiveEditor(
        setEditorInternalState,
        false,
        editorUIStore,
        stableUpdateActiveParagraphId
      );
      actionFn(id);
    },
    [stableUpdateActiveParagraphId] // 항상 1개 요소
  );

  const togglePreview = useCallback(() => {
    const actionFn = switchPreviewMode(
      setEditorInternalState,
      false,
      editorUIStore,
      stableTogglePreview
    );
    actionFn();
  }, [stableTogglePreview]); // 항상 1개 요소

  const saveAllToContext = useCallback(() => {
    const actionFn = saveCurrentProgress(
      managedContainerCollection,
      managedParagraphCollection,
      stableUpdateStoredContainers,
      stableUpdateStoredParagraphs,
      stableAddToast
    );
    actionFn();
  }, [
    managedContainerCollection.length, // 숫자
    managedParagraphCollection.length, // 숫자
    stableUpdateStoredContainers, // 안정적인 함수
    stableUpdateStoredParagraphs, // 안정적인 함수
    stableAddToast, // 안정적인 함수
  ]); // 항상 5개 요소

  const completeEditor = useCallback(() => {
    const actionFn = finishEditing(
      managedContainerCollection,
      managedParagraphCollection,
      saveAllToContext,
      stableUpdateCompletedContent,
      stableUpdateCompletionStatus,
      stableAddToast
    );
    actionFn();
  }, [
    managedContainerCollection.length, // 숫자
    managedParagraphCollection.length, // 숫자
    saveAllToContext, // 안정적인 함수
    stableUpdateCompletedContent, // 안정적인 함수
    stableUpdateCompletionStatus, // 안정적인 함수
    stableAddToast, // 안정적인 함수
  ]); // 항상 6개 요소

  return {
    internalState: editorInternalState,
    localParagraphs: managedParagraphCollection,
    localContainers: managedContainerCollection,
    isMobile: isMobileDeviceDetected,

    setInternalState: setEditorInternalState,
    setLocalParagraphs: setManagedParagraphCollection,
    setLocalContainers: setManagedContainerCollection,
    setSelectedParagraphIds,
    setTargetContainerId,
    setActiveParagraphId,

    addLocalParagraph,
    deleteLocalParagraph,
    updateLocalParagraphContent,
    toggleParagraphSelection,
    addToLocalContainer,
    moveLocalParagraphInContainer,
    getLocalUnassignedParagraphs,
    getLocalParagraphsByContainer,

    handleStructureComplete,
    goToStructureStep,
    activateEditor,
    togglePreview,
    saveAllToContext,
    completeEditor,
  };
};
