// 📁 actions/editorActions.ts

import { EditorInternalState } from '../types/editor';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';
import {
  validateSectionInputs,
  validateEditorState,
} from '../utils/validation';
import { createContainersFromInputs } from './containerActions';

export const handleStructureComplete = (
  validInputs: string[],
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  setLocalContainers: React.Dispatch<React.SetStateAction<Container[]>>,
  addToast: (toast: any) => void
) => {
  console.log('🎉 [MAIN] 구조 완료 처리 시작:', validInputs);

  const { isValid } = validateSectionInputs(validInputs);

  if (!isValid) {
    addToast({
      title: '구조 설정 오류',
      description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
      color: 'warning',
    });
    return;
  }

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

  addToast({
    title: '구조 설정 완료',
    description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
    color: 'success',
  });
};

export const goToStructureStep = (
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  console.log('⬅️ [EDITOR] 구조 단계로 이동');

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
};

export const activateEditor = (
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  console.log('🎯 [ACTIVATE] 에디터 활성화 시도:', paragraphId);

  setInternalState((prev) => ({
    ...prev,
    activeParagraphId: paragraphId,
  }));

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
};

export const togglePreview = (
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  console.log('👁️ [PREVIEW] 미리보기 토글');

  setInternalState((prev) => ({
    ...prev,
    isPreviewOpen: !prev.isPreviewOpen,
  }));
};

export const saveAllToContext = (
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  updateEditorContainers: (containers: Container[]) => void,
  updateEditorParagraphs: (paragraphs: LocalParagraph[]) => void,
  addToast: (toast: any) => void
) => {
  console.log('💾 [SAVE] 전체 Context 저장 시작');

  updateEditorContainers(localContainers);

  const contextParagraphs = localParagraphs.map((p) => ({
    ...p,
  }));
  updateEditorParagraphs(contextParagraphs);

  console.log('💾 [SAVE] Context 저장 완료:', {
    containers: localContainers.length,
    paragraphs: localParagraphs.length,
  });

  addToast({
    title: '저장 완료',
    description: '모든 내용이 저장되었습니다.',
    color: 'success',
  });
};

export const completeEditor = (
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  saveAllToContext: () => void,
  generateCompletedContent: (
    containers: Container[],
    paragraphs: LocalParagraph[]
  ) => string,
  updateEditorCompletedContent: (content: string) => void,
  setEditorCompleted: (completed: boolean) => void,
  addToast: (toast: any) => void
) => {
  console.log('🎉 [MAIN] 에디터 완성 처리');

  saveAllToContext();

  const completedContent = generateCompletedContent(
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
};

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
