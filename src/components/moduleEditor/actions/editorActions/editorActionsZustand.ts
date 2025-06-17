// 📁 actions/editorActions/editorActionsZustand.ts
import { EditorInternalState } from '../../types/editor';
import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import {
  validateSectionInputs,
  validateEditorState,
} from '../../utils/validation';
import { createContainersFromInputs } from '../containerActions';
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';
import type {
  Container as ZustandContainer,
  ParagraphBlock as ZustandParagraphBlock,
} from '../../../../store/shared/commonTypes';

interface Toast {
  title: string;
  description: string;
  color: 'warning' | 'success';
}

const convertToZustandContainer = (
  localContainer: Container
): ZustandContainer => {
  return {
    id: localContainer.id || '',
    name: localContainer.name || '',
    order: localContainer.order || 0,
    createdAt: new Date(),
  };
};

const convertToZustandParagraph = (
  localParagraph: LocalParagraph
): ZustandParagraphBlock => {
  return {
    id: localParagraph.id || '',
    content: localParagraph.content || '',
    containerId: localParagraph.containerId || null,
    order: localParagraph.order || 0,
    createdAt: localParagraph.createdAt || new Date(),
    updatedAt: localParagraph.updatedAt || new Date(),
  };
};

const convertFromZustandContainer = (
  zustandContainer: ZustandContainer
): Container => {
  return {
    id: zustandContainer.id || '',
    name: zustandContainer.name || '',
    order: zustandContainer.order || 0,
  };
};

const convertFromZustandParagraph = (
  zustandParagraph: ZustandParagraphBlock
): LocalParagraph => {
  return {
    id: zustandParagraph.id || '',
    content: zustandParagraph.content || '',
    containerId: zustandParagraph.containerId || null,
    order: zustandParagraph.order || 0,
    createdAt: zustandParagraph.createdAt || new Date(),
    updatedAt: zustandParagraph.updatedAt || new Date(),
    originalId: undefined,
  };
};

export function handleStructureComplete(validInputs: string[]): void;
export function handleStructureComplete(
  validInputs: string[],
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  setLocalContainers: React.Dispatch<React.SetStateAction<Container[]>>,
  addToast: (toast: Toast) => void
): void;
export function handleStructureComplete(
  validInputs: string[],
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  setLocalContainers?: React.Dispatch<React.SetStateAction<Container[]>>,
  addToast?: (toast: Toast) => void
) {
  const safeSectionInputs = Array.isArray(validInputs) ? validInputs : [];
  const { isValid } = validateSectionInputs(safeSectionInputs);

  if (!isValid) {
    const toastMessage = {
      title: '구조 설정 오류',
      description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
      color: 'warning' as const,
    };

    if (addToast) {
      addToast(toastMessage);
    } else {
      const { addToast: zustandAddToast } = useToastStore.getState();
      zustandAddToast(toastMessage);
    }
    return;
  }

  if (setInternalState && setLocalContainers) {
    setInternalState((previousState) => ({
      ...previousState,
      isTransitioning: true,
    }));

    const createdContainers = createContainersFromInputs(safeSectionInputs);
    setLocalContainers(createdContainers);

    setTimeout(() => {
      setInternalState((previousState) => ({
        ...previousState,
        currentSubStep: 'writing',
        isTransitioning: false,
      }));
    }, 300);

    if (addToast) {
      addToast({
        title: '구조 설정 완료',
        description: `${safeSectionInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    }
  } else {
    const { setIsTransitioning, setCurrentSubStep } =
      useEditorUIStore.getState();
    const { setSectionInputs, addContainer } = useEditorCoreStore.getState();

    setIsTransitioning(true);
    setSectionInputs(safeSectionInputs);

    const createdContainers = createContainersFromInputs(safeSectionInputs);

    createdContainers.forEach((currentContainer) => {
      const convertedZustandContainer =
        convertToZustandContainer(currentContainer);
      addContainer(convertedZustandContainer);
    });

    setTimeout(() => {
      setCurrentSubStep('writing');
      setIsTransitioning(false);
    }, 300);

    const { addToast: zustandAddToast } = useToastStore.getState();
    zustandAddToast({
      title: '구조 설정 완료',
      description: `${safeSectionInputs.length}개의 섹션이 생성되었습니다.`,
      color: 'success',
    });
  }
}

export function goToStructureStep(): void;
export function goToStructureStep(
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function goToStructureStep(
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  if (setInternalState) {
    setInternalState((previousState) => ({
      ...previousState,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setInternalState((previousState) => ({
        ...previousState,
        currentSubStep: 'structure',
        isTransitioning: false,
      }));
    }, 300);
  } else {
    const { setIsTransitioning, setCurrentSubStep } =
      useEditorUIStore.getState();
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentSubStep('structure');
      setIsTransitioning(false);
    }, 300);
  }
}

export function activateEditor(paragraphId: string): void;
export function activateEditor(
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function activateEditor(
  paragraphId: string,
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  const validParagraphId = typeof paragraphId === 'string' ? paragraphId : '';

  if (setInternalState) {
    setInternalState((previousState) => ({
      ...previousState,
      activeParagraphId: validParagraphId,
    }));
  } else {
    const { setActiveParagraphId } = useEditorUIStore.getState();
    setActiveParagraphId(validParagraphId);
  }

  setTimeout(() => {
    const targetParagraphElement = document.querySelector(
      `[data-paragraph-id="${validParagraphId}"]`
    );

    if (targetParagraphElement) {
      const scrollContainerElement =
        targetParagraphElement.closest('.overflow-y-auto');

      if (scrollContainerElement) {
        const scrollContainerRect =
          scrollContainerElement.getBoundingClientRect();
        const targetElementRect =
          targetParagraphElement.getBoundingClientRect();
        const calculatedOffsetTop =
          targetElementRect.top -
          scrollContainerRect.top +
          scrollContainerElement.scrollTop;

        scrollContainerElement.scrollTo({
          top: Math.max(0, calculatedOffsetTop - 20),
          behavior: 'smooth',
        });
      } else {
        targetParagraphElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    }
  }, 200);
}

export function togglePreview(): void;
export function togglePreview(
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function togglePreview(
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  if (setInternalState) {
    setInternalState((previousState) => ({
      ...previousState,
      isPreviewOpen: !previousState.isPreviewOpen,
    }));
  } else {
    const { togglePreview: zustandTogglePreview } = useEditorUIStore.getState();
    zustandTogglePreview();
  }
}

export function saveAllToContext(): void;
export function saveAllToContext(
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  updateEditorContainers: (containers: Container[]) => void,
  updateEditorParagraphs: (paragraphs: LocalParagraph[]) => void,
  addToast: (toast: Toast) => void
): void;
export function saveAllToContext(
  localContainers?: Container[],
  localParagraphs?: LocalParagraph[],
  updateEditorContainers?: (containers: Container[]) => void,
  updateEditorParagraphs?: (paragraphs: LocalParagraph[]) => void,
  addToast?: (toast: Toast) => void
) {
  if (
    localContainers &&
    localParagraphs &&
    updateEditorContainers &&
    updateEditorParagraphs &&
    addToast
  ) {
    const safeLocalContainers = Array.isArray(localContainers)
      ? localContainers
      : [];
    const safeLocalParagraphs = Array.isArray(localParagraphs)
      ? localParagraphs
      : [];

    updateEditorContainers(safeLocalContainers);

    const contextParagraphsData = safeLocalParagraphs.map(
      (currentParagraph) => ({
        ...currentParagraph,
      })
    );
    updateEditorParagraphs(contextParagraphsData);

    addToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  } else {
    const { getContainers, getParagraphs, setContainers, setParagraphs } =
      useEditorCoreStore.getState();
    const zustandStoredContainers = getContainers();
    const zustandStoredParagraphs = getParagraphs();

    const convertedLocalContainers = zustandStoredContainers.map(
      (currentZustandContainer) =>
        convertFromZustandContainer(currentZustandContainer)
    );
    const convertedLocalParagraphs = zustandStoredParagraphs.map(
      (currentZustandParagraph) =>
        convertFromZustandParagraph(currentZustandParagraph)
    );

    const reconvertedZustandContainers = convertedLocalContainers.map(
      (currentLocalContainer) =>
        convertToZustandContainer(currentLocalContainer)
    );
    const reconvertedZustandParagraphs = convertedLocalParagraphs.map(
      (currentLocalParagraph) =>
        convertToZustandParagraph(currentLocalParagraph)
    );

    setContainers(reconvertedZustandContainers);
    setParagraphs(reconvertedZustandParagraphs);

    const { addToast: zustandAddToast } = useToastStore.getState();
    zustandAddToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }
}

export function completeEditor(): void;
export function completeEditor(
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  saveAllToContext: () => void,
  generateCompletedContent: (
    containers: Container[],
    paragraphs: LocalParagraph[]
  ) => string,
  updateEditorCompletedContent: (content: string) => void,
  setEditorCompleted: (completed: boolean) => void,
  addToast: (toast: Toast) => void
): void;
export function completeEditor(
  localContainers?: Container[],
  localParagraphs?: LocalParagraph[],
  saveAllToContextFn?: () => void,
  generateCompletedContentFn?: (
    containers: Container[],
    paragraphs: LocalParagraph[]
  ) => string,
  updateEditorCompletedContent?: (content: string) => void,
  setEditorCompleted?: (completed: boolean) => void,
  addToast?: (toast: Toast) => void
) {
  if (
    localContainers &&
    localParagraphs &&
    saveAllToContextFn &&
    generateCompletedContentFn &&
    updateEditorCompletedContent &&
    setEditorCompleted &&
    addToast
  ) {
    const safeLocalContainers = Array.isArray(localContainers)
      ? localContainers
      : [];
    const safeLocalParagraphs = Array.isArray(localParagraphs)
      ? localParagraphs
      : [];

    saveAllToContextFn();

    const generatedCompletedContent = generateCompletedContentFn(
      safeLocalContainers,
      safeLocalParagraphs
    );

    if (
      !validateEditorState({
        containers: safeLocalContainers,
        paragraphs: safeLocalParagraphs,
        completedContent: generatedCompletedContent,
        isCompleted: true,
      })
    ) {
      addToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    updateEditorCompletedContent(generatedCompletedContent);
    setEditorCompleted(true);

    addToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  } else {
    saveAllToContext();

    const {
      getContainers,
      getParagraphs,
      setCompletedContent,
      setIsCompleted,
    } = useEditorCoreStore.getState();
    const zustandStoredContainers = getContainers();
    const zustandStoredParagraphs = getParagraphs();

    const convertedLocalContainers = zustandStoredContainers.map(
      (currentZustandContainer) =>
        convertFromZustandContainer(currentZustandContainer)
    );
    const convertedLocalParagraphs = zustandStoredParagraphs.map(
      (currentZustandParagraph) =>
        convertFromZustandParagraph(currentZustandParagraph)
    );

    const generatedCompletedContent = generateCompletedContent(
      convertedLocalContainers,
      convertedLocalParagraphs
    );

    if (
      !validateEditorState({
        containers: convertedLocalContainers,
        paragraphs: convertedLocalParagraphs,
        completedContent: generatedCompletedContent,
        isCompleted: true,
      })
    ) {
      const { addToast: zustandAddToast } = useToastStore.getState();
      zustandAddToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    setCompletedContent(generatedCompletedContent);
    setIsCompleted(true);

    const { addToast: zustandAddToast } = useToastStore.getState();
    zustandAddToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }
}

export const generateCompletedContent = (
  containers: Container[],
  paragraphs: LocalParagraph[]
): string => {
  const safeContainerList = Array.isArray(containers) ? containers : [];
  const safeParagraphList = Array.isArray(paragraphs) ? paragraphs : [];

  const sortedContainersByOrder = [...safeContainerList].sort(
    (firstContainer, secondContainer) => {
      const firstContainerOrder =
        typeof firstContainer.order === 'number' ? firstContainer.order : 0;
      const secondContainerOrder =
        typeof secondContainer.order === 'number' ? secondContainer.order : 0;
      return firstContainerOrder - secondContainerOrder;
    }
  );

  let accumulatedCompletedContent = '';

  sortedContainersByOrder.forEach((currentContainer) => {
    if (!currentContainer || !currentContainer.id) return;

    const containerRelatedParagraphs = safeParagraphList
      .filter(
        (currentParagraph) =>
          currentParagraph &&
          currentParagraph.containerId === currentContainer.id
      )
      .sort((firstParagraph, secondParagraph) => {
        const firstParagraphOrder =
          typeof firstParagraph.order === 'number' ? firstParagraph.order : 0;
        const secondParagraphOrder =
          typeof secondParagraph.order === 'number' ? secondParagraph.order : 0;
        return firstParagraphOrder - secondParagraphOrder;
      });

    if (containerRelatedParagraphs.length > 0) {
      accumulatedCompletedContent += `\n\n## ${
        currentContainer.name || ''
      }\n\n`;

      containerRelatedParagraphs.forEach((currentParagraph) => {
        if (
          currentParagraph &&
          currentParagraph.content &&
          currentParagraph.content.trim()
        ) {
          accumulatedCompletedContent +=
            currentParagraph.content.trim() + '\n\n';
        }
      });
    }
  });

  return accumulatedCompletedContent.trim();
};
