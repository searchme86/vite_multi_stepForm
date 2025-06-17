// 📁 actions/editorActions.ts

import { EditorInternalState } from '../../types/editor';
import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import {
  validateSectionInputs,
  validateEditorState,
} from '../../utils/validation';
import { createContainersFromInputs } from '../containerActions';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

interface Toast {
  title: string;
  description: string;
  color: 'warning' | 'success';
}

// ✨ [ZUSTAND 추가] 기존 Container 타입을 zustand Container 타입으로 변환하는 헬퍼 함수
const convertToZustandContainer = (
  container: Container
): import('../../../../store/shared/commonTypes').Container => {
  return {
    id: container.id,
    name: container.name,
    order: container.order,
    createdAt: new Date(), // ✨ [ZUSTAND 변경] zustand 타입에 필요한 createdAt 추가
  };
};

/**
 * ✨ [ZUSTAND 추가] 기존 LocalParagraph 타입을 zustand ParagraphBlock 타입으로 변환하는 헬퍼 함수
 */
const convertToZustandParagraph = (
  paragraph: LocalParagraph
): import('../../../../store/shared/commonTypes').ParagraphBlock => {
  return {
    id: paragraph.id,
    content: paragraph.content,
    containerId: paragraph.containerId,
    order: paragraph.order,
    createdAt: paragraph.createdAt,
    updatedAt: paragraph.updatedAt,
  };
};

/**
 * ✨ [ZUSTAND 추가] zustand Container 타입을 기존 Container 타입으로 변환하는 헬퍼 함수
 */
const convertFromZustandContainer = (
  container: import('../../../../store/shared/commonTypes').Container
): Container => {
  return {
    id: container.id,
    name: container.name,
    order: container.order,
    // createdAt은 기존 Container 타입에 없으므로 제외
  };
};

/**
 * ✨ [ZUSTAND 추가] zustand ParagraphBlock 타입을 기존 LocalParagraph 타입으로 변환하는 헬퍼 함수
 */
const convertFromZustandParagraph = (
  paragraph: import('../../../../store/shared/commonTypes').ParagraphBlock
): LocalParagraph => {
  return {
    id: paragraph.id,
    content: paragraph.content,
    containerId: paragraph.containerId,
    order: paragraph.order,
    createdAt: paragraph.createdAt,
    updatedAt: paragraph.updatedAt,
    originalId: undefined, // LocalParagraph 타입에 있는 선택적 속성
  };
};

// ✨ [ZUSTAND 추가] handleStructureComplete 함수 오버로드
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
  console.log('🎉 [MAIN] 구조 완료 처리 시작:', validInputs);

  const { isValid } = validateSectionInputs(validInputs);

  if (!isValid) {
    const toastMessage = {
      title: '구조 설정 오류',
      description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
      color: 'warning' as const,
    };

    if (addToast) {
      // ✅ 기존 방식 (context)
      addToast(toastMessage);
    } else {
      // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
      const zustandAddToast = useToastStore.getState().addToast;
      zustandAddToast(toastMessage);
    }
    return;
  }

  if (setInternalState && setLocalContainers) {
    // ✅ 기존 방식 (context)
    setInternalState((prev) => ({ ...prev, isTransitioning: true }));

    const containers = createContainersFromInputs(validInputs);
    setLocalContainers(containers);

    console.log('📦 [MAIN] 로컬 컨테이너 생성:', containers);

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
        description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    }
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    editorUIStore.setIsTransitioning(true);

    const containers = createContainersFromInputs(validInputs);

    const editorCoreStore = useEditorCoreStore.getState();
    containers.forEach((container) => {
      const zustandContainer = convertToZustandContainer(container);
      editorCoreStore.addContainer(zustandContainer);
    });

    console.log('📦 [MAIN] 로컬 컨테이너 생성 (Zustand):', containers);

    setTimeout(() => {
      editorUIStore.setCurrentSubStep('writing');
      editorUIStore.setIsTransitioning(false);
    }, 300);

    const zustandAddToast = useToastStore.getState().addToast;
    zustandAddToast({
      title: '구조 설정 완료',
      description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] goToStructureStep 함수 오버로드
export function goToStructureStep(): void;
export function goToStructureStep(
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function goToStructureStep(
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  console.log('⬅️ [EDITOR] 구조 단계로 이동');

  if (setInternalState) {
    // ✅ 기존 방식 (context)
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
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    editorUIStore.setIsTransitioning(true);

    setTimeout(() => {
      editorUIStore.setCurrentSubStep('structure');
      editorUIStore.setIsTransitioning(false);
    }, 300);
  }
}

// ✨ [ZUSTAND 추가] activateEditor 함수 오버로드
export function activateEditor(paragraphId: string): void;
export function activateEditor(
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function activateEditor(
  paragraphId: string,
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  console.log('🎯 [ACTIVATE] 에디터 활성화 시도:', paragraphId);

  if (setInternalState) {
    // ✅ 기존 방식 (context)
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: paragraphId,
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    editorUIStore.setActiveParagraphId(paragraphId);
  }

  setTimeout(() => {
    const targetElement = document.querySelector(
      `[data-paragraph-id="${paragraphId}"]`
    );

    console.log('🔍 [ACTIVATE] 대상 요소 찾기:', {
      paragraphId,
      elementFound: !!targetElement,
      elementTag: targetElement?.tagName,
    });

    if (targetElement) {
      const scrollContainer = targetElement.closest('.overflow-y-auto');

      if (scrollContainer) {
        console.log('📜 [ACTIVATE] 스크롤 컨테이너 찾음, 스크롤 실행');

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        const offsetTop =
          elementRect.top - containerRect.top + scrollContainer.scrollTop;

        scrollContainer.scrollTo({
          top: Math.max(0, offsetTop - 20),
          behavior: 'smooth',
        });
      } else {
        console.log('📜 [ACTIVATE] 전체 창 기준 스크롤 실행');
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    } else {
      console.warn('❌ [ACTIVATE] 대상 요소를 찾을 수 없음:', paragraphId);
    }
  }, 200);
}

// ✨ [ZUSTAND 추가] togglePreview 함수 오버로드
export function togglePreview(): void;
export function togglePreview(
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function togglePreview(
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  console.log('👁️ [PREVIEW] 미리보기 토글');

  if (setInternalState) {
    // ✅ 기존 방식 (context)
    setInternalState((prev) => ({
      ...prev,
      isPreviewOpen: !prev.isPreviewOpen,
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    editorUIStore.togglePreview();
  }
}

// ✨ [ZUSTAND 추가] saveAllToContext 함수 오버로드
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
  console.log('💾 [SAVE] 전체 Context 저장 시작');

  if (
    localContainers &&
    localParagraphs &&
    updateEditorContainers &&
    updateEditorParagraphs &&
    addToast
  ) {
    // ✅ 기존 방식 (context)
    updateEditorContainers(localContainers);

    const contextParagraphs = localParagraphs.map((p) => ({
      ...p,
    }));
    updateEditorParagraphs(contextParagraphs);

    console.log('💾 [SAVE] Context 저장 완료:', {
      containers: localContainers.length,
      paragraphs: localParagraphs.length,
    });

    console.log('여기4<-------,contextParagraphs', contextParagraphs);

    addToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorCoreStore = useEditorCoreStore.getState();
    const zustandContainers = editorCoreStore.getContainers();
    const zustandParagraphs = editorCoreStore.getParagraphs();

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

    editorCoreStore.setContainers(reconvertedContainers);
    editorCoreStore.setParagraphs(reconvertedParagraphs);

    console.log('💾 [SAVE] Context 저장 완료 (Zustand):', {
      containers: convertedContainers.length,
      paragraphs: convertedParagraphs.length,
    });

    const zustandAddToast = useToastStore.getState().addToast;
    zustandAddToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] completeEditor 함수 오버로드
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
  console.log('🎉 [MAIN] 에디터 완성 처리');

  if (
    localContainers &&
    localParagraphs &&
    saveAllToContextFn &&
    generateCompletedContentFn &&
    updateEditorCompletedContent &&
    setEditorCompleted &&
    addToast
  ) {
    // ✅ 기존 방식 (context)
    saveAllToContextFn();

    const completedContent = generateCompletedContentFn(
      localContainers,
      localParagraphs
    );

    if (
      !validateEditorState({
        containers: localContainers,
        paragraphs: localParagraphs,
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

    console.log('✅ [EDITOR] 에디터 완성 처리 완료:', {
      containerCount: localContainers.length,
      paragraphCount: localParagraphs.length,
      contentLength: completedContent.length,
    });

    addToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    saveAllToContext(); // 재귀 호출이지만 매개변수가 없으므로 zustand 버전 호출됨

    const editorCoreStore = useEditorCoreStore.getState();
    const zustandContainers = editorCoreStore.getContainers();
    const zustandParagraphs = editorCoreStore.getParagraphs();

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
      const zustandAddToast = useToastStore.getState().addToast;
      zustandAddToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    editorCoreStore.setCompletedContent(completedContent);
    editorCoreStore.setIsCompleted(true);

    console.log('✅ [EDITOR] 에디터 완성 처리 완료 (Zustand):', {
      containerCount: convertedContainers.length,
      paragraphCount: convertedParagraphs.length,
      contentLength: completedContent.length,
    });

    const zustandAddToast = useToastStore.getState().addToast;
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
  console.log('📝 [CONTENT] 최종 내용 생성 시작:', {
    containerCount: containers.length,
    paragraphCount: paragraphs.length,
  });

  const sortedContainers = [...containers].sort((a, b) => a.order - b.order);
  let completedContent = '';

  //====여기부터 수정됨====
  // TypeScript 미사용 변수 경고 해결: containerIndex를 _로 변경
  sortedContainers.forEach((container, _) => {
    //====여기까지 수정됨====

    const containerParagraphs = paragraphs
      .filter((p) => p.containerId === container.id)
      .sort((a, b) => a.order - b.order);

    if (containerParagraphs.length > 0) {
      console.log('📝 [CONTENT] 컨테이너 처리:', {
        containerName: container.name,
        paragraphCount: containerParagraphs.length,
      });

      completedContent += `\n\n## ${container.name}\n\n`;

      //====여기부터 수정됨====
      // TypeScript 미사용 변수 경고 해결: paragraphIndex를 _로 변경
      containerParagraphs.forEach((paragraph, _) => {
        //====여기까지 수정됨====

        if (paragraph.content && paragraph.content.trim()) {
          completedContent += paragraph.content.trim() + '\n\n';

          console.log('📝 [CONTENT] 단락 추가:', {
            paragraphId: paragraph.id,
            contentLength: paragraph.content.trim().length,
          });
        }
      });
    }
  });

  console.log('✅ [CONTENT] 최종 내용 생성 완료:', {
    totalLength: completedContent.length,
    isEmpty: !completedContent.trim(),
  });

  return completedContent.trim();
};
