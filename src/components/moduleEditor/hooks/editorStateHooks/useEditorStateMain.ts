// 📁 hooks/useEditorState/useEditorStateMain.ts

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

export function useEditorState() {
  return useEditorStateImpl();
}

const useEditorStateImpl = () => {
  const editorCoreStore = useEditorCoreStore();
  const editorUIStore = useEditorUIStore();
  const toastStore = useToastStore();

  const stableUpdateStoredContainers = useCallback(
    (containers: Container[]) => {
      if (editorCoreStore?.setContainers) {
        editorCoreStore.setContainers(containers);
      }
    },
    []
  );

  const stableUpdateStoredParagraphs = useCallback(
    (paragraphs: LocalParagraph[]) => {
      if (editorCoreStore?.setParagraphs) {
        editorCoreStore.setParagraphs(paragraphs);
      }
    },
    []
  );

  const stableUpdateCompletedContent = useCallback((content: string) => {
    if (editorCoreStore?.setCompletedContent) {
      editorCoreStore.setCompletedContent(content);
    }
  }, []);

  const stableUpdateCompletionStatus = useCallback((completed: boolean) => {
    if (editorCoreStore?.setIsCompleted) {
      editorCoreStore.setIsCompleted(completed);
    }
  }, []);

  const stableAddToast = useCallback((options: any) => {
    if (toastStore?.addToast) {
      toastStore.addToast(options);
    }
  }, []);

  const stableNavigateToWritingStep = useCallback(() => {
    if (editorUIStore?.goToWritingStep) {
      editorUIStore.goToWritingStep();
    }
  }, []);

  const stableNavigateToStructureStep = useCallback(() => {
    if (editorUIStore?.goToStructureStep) {
      editorUIStore.goToStructureStep();
    }
  }, []);

  const stableUpdateActiveParagraphId = useCallback((id: string | null) => {
    if (editorUIStore?.setActiveParagraphId) {
      editorUIStore.setActiveParagraphId(id);
    }
  }, []);

  const stableTogglePreview = useCallback(() => {
    if (editorUIStore?.togglePreview) {
      editorUIStore.togglePreview();
    }
  }, []);

  const stableToggleParagraphSelection = useCallback((paragraphId: string) => {
    if (editorUIStore?.toggleParagraphSelection) {
      editorUIStore.toggleParagraphSelection(paragraphId);
    }
  }, []);

  const stableUpdateSelectedParagraphIds = useCallback((ids: string[]) => {
    if (editorUIStore?.setSelectedParagraphIds) {
      editorUIStore.setSelectedParagraphIds(ids);
    }
  }, []);

  const stableUpdateTargetContainerId = useCallback((containerId: string) => {
    if (editorUIStore?.setTargetContainerId) {
      editorUIStore.setTargetContainerId(containerId);
    }
  }, []);

  const stableClearSelectedParagraphs = useCallback(() => {
    if (editorUIStore?.clearSelectedParagraphs) {
      editorUIStore.clearSelectedParagraphs();
    }
  }, []);

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
    selectedParagraphIds: selectedElementIdCollection = [],
    targetContainerId: targetDestinationIdValue = '',
  } = editorInternalState || {};

  useDeviceDetection(setIsMobileDeviceDetected);

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
    managedParagraphCollection.length,
    stableUpdateActiveParagraphId,
    stableAddToast,
  ]);

  const updateLocalParagraphContent = useCallback(
    (id: string, content: string) => {
      const actionFn = updateParagraphContent(
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id, content);
    },
    [stableAddToast]
  );

  const deleteLocalParagraph = useCallback(
    (id: string) => {
      const actionFn = removeParagraph(
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id);
    },
    [stableAddToast]
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
    [stableToggleParagraphSelection]
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
    selectedElementIdCollection,
    targetDestinationIdValue,
    managedParagraphCollection,
    managedContainerCollection,
    stableAddToast,
    stableClearSelectedParagraphs,
  ]);

  const moveLocalParagraphInContainer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const actionFn = changeParagraphOrder(
        managedParagraphCollection,
        setManagedParagraphCollection,
        stableAddToast
      );
      actionFn(id, direction);
    },
    [managedParagraphCollection.length, stableAddToast]
  );

  const getLocalUnassignedParagraphs = useCallback(
    () => getUnassignedParagraphs(managedParagraphCollection)(),
    [managedParagraphCollection.length]
  );

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string) =>
      getParagraphsByContainer(managedParagraphCollection)(containerId),
    [managedParagraphCollection.length]
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
    [stableUpdateSelectedParagraphIds]
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
    [stableUpdateTargetContainerId]
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
    [stableUpdateActiveParagraphId]
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
    [stableAddToast, stableNavigateToWritingStep]
  );

  const goToStructureStep = useCallback(() => {
    const actionFn = navigateToStructureStep(
      setEditorInternalState,
      false,
      editorUIStore,
      stableNavigateToStructureStep
    );
    actionFn();
  }, [stableNavigateToStructureStep]);

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
    [stableUpdateActiveParagraphId]
  );

  const togglePreview = useCallback(() => {
    const actionFn = switchPreviewMode(
      setEditorInternalState,
      false,
      editorUIStore,
      stableTogglePreview
    );
    actionFn();
  }, [stableTogglePreview]);

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
    managedContainerCollection.length,
    managedParagraphCollection.length,
    stableUpdateStoredContainers,
    stableUpdateStoredParagraphs,
    stableAddToast,
  ]);

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
    managedContainerCollection.length,
    managedParagraphCollection.length,
    saveAllToContext,
    stableUpdateCompletedContent,
    stableUpdateCompletionStatus,
    stableAddToast,
  ]);

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
