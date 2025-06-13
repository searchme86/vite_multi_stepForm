// 📁 actions/containerActions.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';

// ✨ [개선] 타입 import를 상단에서 명시적으로 가져오기
import {
  ParagraphBlock,
  Container as ZustandContainer,
} from '../../store/shared/commonTypes';

// ✨ [ZUSTAND 추가] 타입 변환 헬퍼 함수들
const convertFromZustandParagraph = (
  zustandParagraph: ParagraphBlock // 의미있는 매개변수명 사용
): LocalParagraph => {
  return {
    id: zustandParagraph.id,
    content: zustandParagraph.content,
    containerId: zustandParagraph.containerId,
    order: zustandParagraph.order,
    createdAt: zustandParagraph.createdAt,
    updatedAt: zustandParagraph.updatedAt,
    originalId: undefined, // LocalParagraph 타입에 있는 선택적 속성
  };
};

const convertFromZustandContainer = (
  zustandContainer: ZustandContainer // 의미있는 매개변수명 사용
): Container => {
  return {
    id: zustandContainer.id,
    name: zustandContainer.name,
    order: zustandContainer.order,
    // createdAt은 기존 Container 타입에 없으므로 제외
  };
};

// ✨ [ZUSTAND 추가] getLocalUnassignedParagraphs 함수 오버로드
export function getLocalUnassignedParagraphs(): LocalParagraph[];
export function getLocalUnassignedParagraphs(
  localParagraphs: LocalParagraph[]
): LocalParagraph[];
export function getLocalUnassignedParagraphs(
  localParagraphs?: LocalParagraph[]
): LocalParagraph[] {
  if (localParagraphs) {
    // ✅ 기존 방식 (context)
    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 시작:', {
      totalParagraphs: localParagraphs.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const unassignedParagraphs = localParagraphs.filter(
      (paragraph) => !paragraph.containerId
    );

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 완료:', {
      unassignedCount: unassignedParagraphs.length,
      unassignedIds: unassignedParagraphs.map((paragraph) => paragraph.id),
    });

    return unassignedParagraphs;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandParagraphs = useEditorCoreStore.getState().paragraphs;
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 시작 (Zustand):', {
      totalParagraphs: convertedParagraphs.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const unassignedParagraphs = convertedParagraphs.filter(
      (paragraph) => !paragraph.containerId
    );

    console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 완료 (Zustand):', {
      unassignedCount: unassignedParagraphs.length,
      unassignedIds: unassignedParagraphs.map((paragraph) => paragraph.id),
    });

    return unassignedParagraphs;
  }
}

// ✨ [ZUSTAND 추가] getLocalParagraphsByContainer 함수 오버로드
export function getLocalParagraphsByContainer(
  containerId: string
): LocalParagraph[];
export function getLocalParagraphsByContainer(
  containerId: string,
  localParagraphs: LocalParagraph[]
): LocalParagraph[];
export function getLocalParagraphsByContainer(
  containerId: string,
  localParagraphs?: LocalParagraph[]
): LocalParagraph[] {
  if (localParagraphs) {
    // ✅ 기존 방식 (context)
    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 시작:', {
      containerId,
      totalParagraphs: localParagraphs.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph, a,b -> firstParagraph, secondParagraph
    const containerParagraphs = localParagraphs
      .filter((paragraph) => paragraph.containerId === containerId)
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      );

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 완료:', {
      containerId,
      paragraphCount: containerParagraphs.length,
      paragraphIds: containerParagraphs.map((paragraph) => paragraph.id),
      orders: containerParagraphs.map((paragraph) => paragraph.order),
    });

    return containerParagraphs;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandParagraphs = useEditorCoreStore.getState().paragraphs;
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 시작 (Zustand):', {
      containerId,
      totalParagraphs: convertedParagraphs.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph, a,b -> firstParagraph, secondParagraph
    const containerParagraphs = convertedParagraphs
      .filter((paragraph) => paragraph.containerId === containerId)
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      );

    console.log('📋 [CONTAINER] 컨테이너별 단락 조회 완료 (Zustand):', {
      containerId,
      paragraphCount: containerParagraphs.length,
      paragraphIds: containerParagraphs.map((paragraph) => paragraph.id),
      orders: containerParagraphs.map((paragraph) => paragraph.order),
    });

    return containerParagraphs;
  }
}

export const createContainer = (name: string, index: number): Container => {
  console.log('🏗️ [CONTAINER] 새 컨테이너 생성:', { name, index });

  const container: Container = {
    id: `container-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    name: name.trim(),
    order: index,
  };

  console.log('✅ [CONTAINER] 컨테이너 생성 완료:', {
    id: container.id,
    name: container.name,
    order: container.order,
  });

  return container;
};

export const createContainersFromInputs = (
  validInputs: string[]
): Container[] => {
  console.log('🏗️ [CONTAINER] 다중 컨테이너 생성 시작:', {
    inputCount: validInputs.length,
    inputs: validInputs,
  });

  // ✨ [개선] 의미있는 변수명 사용: name, index -> containerName, containerIndex
  const containers = validInputs.map((containerName, containerIndex) =>
    createContainer(containerName, containerIndex)
  );

  console.log('✅ [CONTAINER] 다중 컨테이너 생성 완료:', {
    createdCount: containers.length,
    containerIds: containers.map((container) => container.id),
    containerNames: containers.map((container) => container.name),
  });

  return containers;
};

// ✨ [ZUSTAND 추가] sortContainersByOrder 함수 오버로드
export function sortContainersByOrder(): Container[];
export function sortContainersByOrder(containers: Container[]): Container[];
export function sortContainersByOrder(containers?: Container[]): Container[] {
  if (containers) {
    // ✅ 기존 방식 (context)
    console.log('🔄 [CONTAINER] 컨테이너 정렬 시작:', {
      containerCount: containers.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: a,b -> firstContainer, secondContainer
    const sortedContainers = [...containers].sort(
      (firstContainer, secondContainer) =>
        firstContainer.order - secondContainer.order
    );

    console.log('✅ [CONTAINER] 컨테이너 정렬 완료:', {
      sortedOrder: sortedContainers.map((container) => ({
        id: container.id,
        name: container.name,
        order: container.order,
      })),
    });

    return sortedContainers;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandContainers = useEditorCoreStore.getState().containers;
    const convertedContainers = zustandContainers.map(
      convertFromZustandContainer
    );

    console.log('🔄 [CONTAINER] 컨테이너 정렬 시작 (Zustand):', {
      containerCount: convertedContainers.length,
    });

    // ✨ [개선] 의미있는 변수명 사용: a,b -> firstContainer, secondContainer
    const sortedContainers = [...convertedContainers].sort(
      (firstContainer, secondContainer) =>
        firstContainer.order - secondContainer.order
    );

    console.log('✅ [CONTAINER] 컨테이너 정렬 완료 (Zustand):', {
      sortedOrder: sortedContainers.map((container) => ({
        id: container.id,
        name: container.name,
        order: container.order,
      })),
    });

    return sortedContainers;
  }
}

// ✨ [ZUSTAND 추가] getContainerParagraphStats 함수 오버로드
export function getContainerParagraphStats(): Record<
  string,
  { count: number; hasContent: number }
>;
export function getContainerParagraphStats(
  containers: Container[],
  localParagraphs: LocalParagraph[]
): Record<string, { count: number; hasContent: number }>;
export function getContainerParagraphStats(
  containers?: Container[],
  localParagraphs?: LocalParagraph[]
): Record<string, { count: number; hasContent: number }> {
  if (containers && localParagraphs) {
    // ✅ 기존 방식 (context)
    console.log('📊 [CONTAINER] 컨테이너별 단락 통계 계산 시작');

    const stats: Record<string, { count: number; hasContent: number }> = {};

    containers.forEach((container) => {
      const containerParagraphs = getLocalParagraphsByContainer(
        container.id,
        localParagraphs
      );

      // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
      const paragraphsWithContent = containerParagraphs.filter(
        (paragraph) => paragraph.content && paragraph.content.trim().length > 0
      );

      stats[container.id] = {
        count: containerParagraphs.length,
        hasContent: paragraphsWithContent.length,
      };

      console.log('📊 [CONTAINER] 컨테이너 통계:', {
        containerId: container.id,
        name: container.name,
        totalParagraphs: stats[container.id].count,
        paragraphsWithContent: stats[container.id].hasContent,
      });
    });

    console.log('✅ [CONTAINER] 컨테이너별 단락 통계 계산 완료');

    return stats;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandContainers = useEditorCoreStore.getState().containers;
    const zustandParagraphs = useEditorCoreStore.getState().paragraphs;
    const convertedContainers = zustandContainers.map(
      convertFromZustandContainer
    );
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 컨테이너별 단락 통계 계산 시작 (Zustand)');

    const stats: Record<string, { count: number; hasContent: number }> = {};

    convertedContainers.forEach((container) => {
      const containerParagraphs = getLocalParagraphsByContainer(
        container.id,
        convertedParagraphs
      );

      // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
      const paragraphsWithContent = containerParagraphs.filter(
        (paragraph) => paragraph.content && paragraph.content.trim().length > 0
      );

      stats[container.id] = {
        count: containerParagraphs.length,
        hasContent: paragraphsWithContent.length,
      };

      console.log('📊 [CONTAINER] 컨테이너 통계 (Zustand):', {
        containerId: container.id,
        name: container.name,
        totalParagraphs: stats[container.id].count,
        paragraphsWithContent: stats[container.id].hasContent,
      });
    });

    console.log('✅ [CONTAINER] 컨테이너별 단락 통계 계산 완료 (Zustand)');

    return stats;
  }
}

// ✨ [ZUSTAND 추가] getTotalAssignedParagraphs 함수 오버로드
export function getTotalAssignedParagraphs(): number;
export function getTotalAssignedParagraphs(
  localParagraphs: LocalParagraph[]
): number;
export function getTotalAssignedParagraphs(
  localParagraphs?: LocalParagraph[]
): number {
  if (localParagraphs) {
    // ✅ 기존 방식 (context)
    console.log('📊 [CONTAINER] 할당된 단락 총개수 계산');

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const assignedCount = localParagraphs.filter(
      (paragraph) => paragraph.containerId
    ).length;

    console.log('📊 [CONTAINER] 할당된 단락 총개수:', assignedCount);

    return assignedCount;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandParagraphs = useEditorCoreStore.getState().paragraphs;
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 할당된 단락 총개수 계산 (Zustand)');

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const assignedCount = convertedParagraphs.filter(
      (paragraph) => paragraph.containerId
    ).length;

    console.log('📊 [CONTAINER] 할당된 단락 총개수 (Zustand):', assignedCount);

    return assignedCount;
  }
}

// ✨ [ZUSTAND 추가] getTotalParagraphsWithContent 함수 오버로드
export function getTotalParagraphsWithContent(): number;
export function getTotalParagraphsWithContent(
  localParagraphs: LocalParagraph[]
): number;
export function getTotalParagraphsWithContent(
  localParagraphs?: LocalParagraph[]
): number {
  if (localParagraphs) {
    // ✅ 기존 방식 (context)
    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수 계산');

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const contentCount = localParagraphs.filter(
      (paragraph) =>
        paragraph.containerId &&
        paragraph.content &&
        paragraph.content.trim().length > 0
    ).length;

    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수:', contentCount);

    return contentCount;
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const zustandParagraphs = useEditorCoreStore.getState().paragraphs;
    const convertedParagraphs = zustandParagraphs.map(
      convertFromZustandParagraph
    );

    console.log('📊 [CONTAINER] 내용이 있는 단락 총개수 계산 (Zustand)');

    // ✨ [개선] 의미있는 변수명 사용: p -> paragraph
    const contentCount = convertedParagraphs.filter(
      (paragraph) =>
        paragraph.containerId &&
        paragraph.content &&
        paragraph.content.trim().length > 0
    ).length;

    console.log(
      '📊 [CONTAINER] 내용이 있는 단락 총개수 (Zustand):',
      contentCount
    );

    return contentCount;
  }
}
