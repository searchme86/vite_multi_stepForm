import { Container, ParagraphBlock } from '../../store/shared/commonTypes';

export const validateEditorContainers = (containers: Container[]): boolean => {
  console.log('🔍 [EDITOR_UTILS] 에디터 컨테이너 검증 시작');

  if (!Array.isArray(containers)) {
    console.error('❌ [EDITOR_UTILS] 컨테이너가 배열이 아님');
    return false;
  }

  if (containers.length === 0) {
    console.error('❌ [EDITOR_UTILS] 컨테이너가 비어있음');
    return false;
  }

  const allContainersValid = containers.every((container, containerIndex) => {
    if (!container || typeof container !== 'object') {
      console.error(
        `❌ [EDITOR_UTILS] 컨테이너 ${containerIndex}가 유효하지 않은 객체`
      );
      return false;
    }

    const { id, name, order, createdAt } = container;

    if (typeof id !== 'string' || id.trim().length === 0) {
      console.error(
        `❌ [EDITOR_UTILS] 컨테이너 ${containerIndex}의 ID가 유효하지 않음`
      );
      return false;
    }

    if (typeof name !== 'string') {
      console.error(
        `❌ [EDITOR_UTILS] 컨테이너 ${containerIndex}의 이름이 유효하지 않음`
      );
      return false;
    }

    if (typeof order !== 'number' || order < 0) {
      console.error(
        `❌ [EDITOR_UTILS] 컨테이너 ${containerIndex}의 순서가 유효하지 않음`
      );
      return false;
    }

    if (!(createdAt instanceof Date)) {
      console.error(
        `❌ [EDITOR_UTILS] 컨테이너 ${containerIndex}의 생성날짜가 유효하지 않음`
      );
      return false;
    }

    return true;
  });

  console.log('📊 [EDITOR_UTILS] 컨테이너 검증 결과:', {
    totalContainers: containers.length,
    allValid: allContainersValid,
  });

  return allContainersValid;
};

export const validateEditorParagraphs = (
  paragraphs: ParagraphBlock[]
): boolean => {
  console.log('🔍 [EDITOR_UTILS] 에디터 문단 검증 시작');

  if (!Array.isArray(paragraphs)) {
    console.error('❌ [EDITOR_UTILS] 문단이 배열이 아님');
    return false;
  }

  if (paragraphs.length === 0) {
    console.error('❌ [EDITOR_UTILS] 문단이 비어있음');
    return false;
  }

  const allParagraphsValid = paragraphs.every((paragraph, paragraphIndex) => {
    if (!paragraph || typeof paragraph !== 'object') {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}가 유효하지 않은 객체`
      );
      return false;
    }

    const { id, content, containerId, order, createdAt, updatedAt } = paragraph;

    if (typeof id !== 'string' || id.trim().length === 0) {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}의 ID가 유효하지 않음`
      );
      return false;
    }

    if (typeof content !== 'string') {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}의 내용이 유효하지 않음`
      );
      return false;
    }

    if (
      containerId !== null &&
      (typeof containerId !== 'string' || containerId.trim().length === 0)
    ) {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}의 컨테이너ID가 유효하지 않음`
      );
      return false;
    }

    if (typeof order !== 'number' || order < 0) {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}의 순서가 유효하지 않음`
      );
      return false;
    }

    if (!(createdAt instanceof Date) || !(updatedAt instanceof Date)) {
      console.error(
        `❌ [EDITOR_UTILS] 문단 ${paragraphIndex}의 날짜가 유효하지 않음`
      );
      return false;
    }

    return true;
  });

  console.log('📊 [EDITOR_UTILS] 문단 검증 결과:', {
    totalParagraphs: paragraphs.length,
    allValid: allParagraphsValid,
  });

  return allParagraphsValid;
};

export const calculateEditorStatistics = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
) => {
  console.log('📊 [EDITOR_UTILS] 에디터 통계 계산 시작');

  const safeContainers = Array.isArray(containers) ? containers : [];
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

  const assignedParagraphs = safeParagraphs.filter((paragraph) => {
    const { containerId = null } = paragraph || {};
    return containerId !== null;
  });

  const unassignedParagraphs = safeParagraphs.filter((paragraph) => {
    const { containerId = null } = paragraph || {};
    return containerId === null;
  });

  const totalContentLength = safeParagraphs.reduce((totalLength, paragraph) => {
    const { content = '' } = paragraph || {};
    return totalLength + content.length;
  }, 0);

  const averageContentLength =
    safeParagraphs.length > 0
      ? Math.round(totalContentLength / safeParagraphs.length)
      : 0;

  const containerUtilization = safeContainers.map((container) => {
    const { id: containerId = '', name: containerName = '' } = container || {};

    const containerParagraphs = safeParagraphs.filter((paragraph) => {
      const { containerId: paragraphContainerId = null } = paragraph || {};
      return paragraphContainerId === containerId;
    });

    const containerContentLength = containerParagraphs.reduce(
      (length, paragraph) => {
        const { content = '' } = paragraph || {};
        return length + content.length;
      },
      0
    );

    return {
      containerId,
      containerName,
      paragraphCount: containerParagraphs.length,
      contentLength: containerContentLength,
    };
  });

  const emptyContainers = containerUtilization.filter(
    (utilization) => utilization.paragraphCount === 0
  );

  const statistics = {
    totalContainers: safeContainers.length,
    totalParagraphs: safeParagraphs.length,
    assignedParagraphs: assignedParagraphs.length,
    unassignedParagraphs: unassignedParagraphs.length,
    totalContentLength,
    averageContentLength,
    emptyContainers: emptyContainers.length,
    containerUtilization,
  };

  console.log('✅ [EDITOR_UTILS] 에디터 통계 계산 완료:', statistics);
  return statistics;
};

export const extractEditorContentByContainer = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): Map<string, string> => {
  console.log('🔍 [EDITOR_UTILS] 컨테이너별 콘텐츠 추출 시작');

  const safeContainers = Array.isArray(containers) ? containers : [];
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
  const containerContentMap = new Map<string, string>();

  safeContainers.forEach((container) => {
    const { id: containerId = '', name: containerName = '' } = container || {};

    if (!containerId) {
      console.warn('⚠️ [EDITOR_UTILS] 컨테이너 ID가 없음:', containerName);
      return;
    }

    const containerParagraphs = safeParagraphs
      .filter((paragraph) => {
        const { containerId: paragraphContainerId = null } = paragraph || {};
        return paragraphContainerId === containerId;
      })
      .sort((firstParagraph, secondParagraph) => {
        const { order: firstOrder = 0 } = firstParagraph || {};
        const { order: secondOrder = 0 } = secondParagraph || {};
        return firstOrder - secondOrder;
      });

    const combinedContent = containerParagraphs
      .map((paragraph) => {
        const { content = '' } = paragraph || {};
        return content.trim();
      })
      .filter((content) => content.length > 0)
      .join('\n\n');

    containerContentMap.set(containerId, combinedContent);

    console.log('📄 [EDITOR_UTILS] 컨테이너 콘텐츠 추출:', {
      containerId,
      containerName,
      paragraphCount: containerParagraphs.length,
      contentLength: combinedContent.length,
    });
  });

  console.log('✅ [EDITOR_UTILS] 모든 컨테이너 콘텐츠 추출 완료:', {
    totalContainers: containerContentMap.size,
  });

  return containerContentMap;
};

export const findEditorInconsistencies = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string[] => {
  console.log('🔍 [EDITOR_UTILS] 에디터 일관성 검사 시작');

  const safeContainers = Array.isArray(containers) ? containers : [];
  const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
  const inconsistencies: string[] = [];

  const containerIdSet = new Set(
    safeContainers.map((container) => {
      const { id = '' } = container || {};
      return id;
    })
  );

  const orphanedParagraphs = safeParagraphs.filter((paragraph) => {
    const { containerId = null } = paragraph || {};
    return containerId !== null && !containerIdSet.has(containerId);
  });

  if (orphanedParagraphs.length > 0) {
    inconsistencies.push(
      `${orphanedParagraphs.length}개의 고아 문단 발견 (존재하지 않는 컨테이너 참조)`
    );
  }

  const duplicateContainerIds = new Map<string, number>();
  safeContainers.forEach((container) => {
    const { id = '' } = container || {};
    if (id) {
      const currentCount = duplicateContainerIds.get(id) || 0;
      duplicateContainerIds.set(id, currentCount + 1);
    }
  });

  const duplicatedContainerIds = Array.from(duplicateContainerIds.entries())
    .filter(([, count]) => count > 1)
    .map(([containerId]) => containerId);

  if (duplicatedContainerIds.length > 0) {
    inconsistencies.push(
      `중복된 컨테이너 ID 발견: ${duplicatedContainerIds.join(', ')}`
    );
  }

  const duplicateParagraphIds = new Map<string, number>();
  safeParagraphs.forEach((paragraph) => {
    const { id = '' } = paragraph || {};
    if (id) {
      const currentCount = duplicateParagraphIds.get(id) || 0;
      duplicateParagraphIds.set(id, currentCount + 1);
    }
  });

  const duplicatedParagraphIds = Array.from(duplicateParagraphIds.entries())
    .filter(([, count]) => count > 1)
    .map(([paragraphId]) => paragraphId);

  if (duplicatedParagraphIds.length > 0) {
    inconsistencies.push(
      `중복된 문단 ID 발견: ${duplicatedParagraphIds.join(', ')}`
    );
  }

  console.log('📊 [EDITOR_UTILS] 일관성 검사 결과:', {
    inconsistencyCount: inconsistencies.length,
    inconsistencies,
  });

  return inconsistencies;
};
