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

interface Toast {
  title: string;
  description: string;
  color: 'warning' | 'success';
}

const convertToZustandContainer = (
  container: Container
): import('../../../../store/shared/commonTypes').Container => {
  return {
    id: container.id || '',
    name: container.name || '',
    order: container.order || 0,
    createdAt: new Date(),
  };
};

const convertToZustandParagraph = (
  paragraph: LocalParagraph
): import('../../../../store/shared/commonTypes').ParagraphBlock => {
  return {
    id: paragraph.id || '',
    content: paragraph.content || '',
    containerId: paragraph.containerId || null,
    order: paragraph.order || 0,
    createdAt: paragraph.createdAt || new Date(),
    updatedAt: paragraph.updatedAt || new Date(),
  };
};

const convertFromZustandContainer = (
  container: import('../../../../store/shared/commonTypes').Container
): Container => {
  return {
    id: container.id || '',
    name: container.name || '',
    order: container.order || 0,
  };
};

const convertFromZustandParagraph = (
  paragraph: import('../../../../store/shared/commonTypes').ParagraphBlock
): LocalParagraph => {
  return {
    id: paragraph.id || '',
    content: paragraph.content || '',
    containerId: paragraph.containerId || null,
    order: paragraph.order || 0,
    createdAt: paragraph.createdAt || new Date(),
    updatedAt: paragraph.updatedAt || new Date(),
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
  const safeInputs = Array.isArray(validInputs) ? validInputs : [];
  const { isValid } = validateSectionInputs(safeInputs);

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
    setInternalState((prev) => ({ ...prev, isTransitioning: true }));

    const containers = createContainersFromInputs(safeInputs);
    setLocalContainers(containers);

    setTimeout(() => {
      setInternalState((prev) => ({
        ...prev,
        currentSubStep: 'writing',
        isTransitioning: false,
      }));
    }, 300);

    if (addToast) {
      addToast({
        title: '구조 설정 완료',
        description: `${safeInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    }
  } else {
    const { setIsTransitioning, setCurrentSubStep } =
      useEditorUIStore.getState();
    const { setSectionInputs, addContainer } = useEditorCoreStore.getState();

    setIsTransitioning(true);
    setSectionInputs(safeInputs);

    const containers = createContainersFromInputs(safeInputs);

    containers.forEach((container) => {
      const zustandContainer = convertToZustandContainer(container);
      addContainer(zustandContainer);
    });

    setTimeout(() => {
      setCurrentSubStep('writing');
      setIsTransitioning(false);
    }, 300);

    const { addToast: zustandAddToast } = useToastStore.getState();
    zustandAddToast({
      title: '구조 설정 완료',
      description: `${safeInputs.length}개의 섹션이 생성되었습니다.`,
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
    setInternalState((prev) => ({
      ...prev,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setInternalState((prev) => ({
        ...prev,
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
  const validId = typeof paragraphId === 'string' ? paragraphId : '';

  if (setInternalState) {
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: validId,
    }));
  } else {
    const { setActiveParagraphId } = useEditorUIStore.getState();
    setActiveParagraphId(validId);
  }

  setTimeout(() => {
    const targetElement = document.querySelector(
      `[data-paragraph-id="${validId}"]`
    );

    if (targetElement) {
      const scrollContainer = targetElement.closest('.overflow-y-auto');

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        const offsetTop =
          elementRect.top - containerRect.top + scrollContainer.scrollTop;

        scrollContainer.scrollTo({
          top: Math.max(0, offsetTop - 20),
          behavior: 'smooth',
        });
      } else {
        targetElement.scrollIntoView({
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
    setInternalState((prev) => ({
      ...prev,
      isPreviewOpen: !prev.isPreviewOpen,
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
    const safeContainers = Array.isArray(localContainers)
      ? localContainers
      : [];
    const safeParagraphs = Array.isArray(localParagraphs)
      ? localParagraphs
      : [];

    updateEditorContainers(safeContainers);

    const contextParagraphs = safeParagraphs.map((p) => ({
      ...p,
    }));
    updateEditorParagraphs(contextParagraphs);

    addToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  } else {
    const { getContainers, getParagraphs, setContainers, setParagraphs } =
      useEditorCoreStore.getState();
    const zustandContainers = getContainers();
    const zustandParagraphs = getParagraphs();

    const convertedContainers = zustandContainers.map(
      convertFromZustandContainer
    );
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    const reconvertedContainers = convertedContainers.map(
      convertToZustandContainer
    );
    const reconvertedParagraphs = convertedParagraphs.map(
      convertToZustandParagraph
    );

    setContainers(reconvertedContainers);
    setParagraphs(reconvertedParagraphs);

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
    const safeContainers = Array.isArray(localContainers)
      ? localContainers
      : [];
    const safeParagraphs = Array.isArray(localParagraphs)
      ? localParagraphs
      : [];

    saveAllToContextFn();

    const completedContent = generateCompletedContentFn(
      safeContainers,
      safeParagraphs
    );

    if (
      !validateEditorState({
        containers: safeContainers,
        paragraphs: safeParagraphs,
        completedContent,
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

    updateEditorCompletedContent(completedContent);
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
    const zustandContainers = getContainers();
    const zustandParagraphs = getParagraphs();

    const convertedContainers = zustandContainers.map(
      convertFromZustandContainer
    );
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    const completedContent = generateCompletedContent(
      convertedContainers,
      convertedParagraphs
    );

    if (
      !validateEditorState({
        containers: convertedContainers,
        paragraphs: convertedParagraphs,
        completedContent,
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

    setCompletedContent(completedContent);
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
  const safeContainers = Array.isArray(containers) ? containers : [];
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

  const sortedContainers = [...safeContainers].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 0;
    const orderB = typeof b.order === 'number' ? b.order : 0;
    return orderA - orderB;
  });

  let completedContent = '';

  sortedContainers.forEach((container) => {
    if (!container || !container.id) return;

    const containerParagraphs = safeParagraphs
      .filter((p) => p && p.containerId === container.id)
      .sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 0;
        const orderB = typeof b.order === 'number' ? b.order : 0;
        return orderA - orderB;
      });

    if (containerParagraphs.length > 0) {
      completedContent += `\n\n## ${container.name || ''}\n\n`;

      containerParagraphs.forEach((paragraph) => {
        if (paragraph && paragraph.content && paragraph.content.trim()) {
          completedContent += paragraph.content.trim() + '\n\n';
        }
      });
    }
  });

  return completedContent.trim();
};
