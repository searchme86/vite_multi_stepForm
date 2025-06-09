// 📁 actions/containerActions.ts

import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';

export const getLocalUnassignedParagraphs = (
  localParagraphs: LocalParagraph[]
): LocalParagraph[] => {
  console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 시작:', {
    totalParagraphs: localParagraphs.length,
  });

  const unassignedParagraphs = localParagraphs.filter((p) => !p.containerId);

  console.log('📋 [CONTAINER] 할당되지 않은 단락 조회 완료:', {
    unassignedCount: unassignedParagraphs.length,
    unassignedIds: unassignedParagraphs.map((p) => p.id),
  });

  return unassignedParagraphs;
};

export const getLocalParagraphsByContainer = (
  containerId: string,
  localParagraphs: LocalParagraph[]
): LocalParagraph[] => {
  console.log('📋 [CONTAINER] 컨테이너별 단락 조회 시작:', {
    containerId,
    totalParagraphs: localParagraphs.length,
  });

  const containerParagraphs = localParagraphs
    .filter((p) => p.containerId === containerId)
    .sort((a, b) => a.order - b.order);

  console.log('📋 [CONTAINER] 컨테이너별 단락 조회 완료:', {
    containerId,
    paragraphCount: containerParagraphs.length,
    paragraphIds: containerParagraphs.map((p) => p.id),
    orders: containerParagraphs.map((p) => p.order),
  });

  return containerParagraphs;
};

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

  const containers = validInputs.map((name, index) =>
    createContainer(name, index)
  );

  console.log('✅ [CONTAINER] 다중 컨테이너 생성 완료:', {
    createdCount: containers.length,
    containerIds: containers.map((c) => c.id),
    containerNames: containers.map((c) => c.name),
  });

  return containers;
};

export const sortContainersByOrder = (containers: Container[]): Container[] => {
  console.log('🔄 [CONTAINER] 컨테이너 정렬 시작:', {
    containerCount: containers.length,
  });

  const sortedContainers = [...containers].sort((a, b) => a.order - b.order);

  console.log('✅ [CONTAINER] 컨테이너 정렬 완료:', {
    sortedOrder: sortedContainers.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
    })),
  });

  return sortedContainers;
};

export const getContainerParagraphStats = (
  containers: Container[],
  localParagraphs: LocalParagraph[]
): Record<string, { count: number; hasContent: number }> => {
  console.log('📊 [CONTAINER] 컨테이너별 단락 통계 계산 시작');

  const stats: Record<string, { count: number; hasContent: number }> = {};

  containers.forEach((container) => {
    const containerParagraphs = getLocalParagraphsByContainer(
      container.id,
      localParagraphs
    );
    const paragraphsWithContent = containerParagraphs.filter(
      (p) => p.content && p.content.trim().length > 0
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
};

export const getTotalAssignedParagraphs = (
  localParagraphs: LocalParagraph[]
): number => {
  console.log('📊 [CONTAINER] 할당된 단락 총개수 계산');

  const assignedCount = localParagraphs.filter((p) => p.containerId).length;

  console.log('📊 [CONTAINER] 할당된 단락 총개수:', assignedCount);

  return assignedCount;
};

export const getTotalParagraphsWithContent = (
  localParagraphs: LocalParagraph[]
): number => {
  console.log('📊 [CONTAINER] 내용이 있는 단락 총개수 계산');

  const contentCount = localParagraphs.filter(
    (p) => p.containerId && p.content && p.content.trim().length > 0
  ).length;

  console.log('📊 [CONTAINER] 내용이 있는 단락 총개수:', contentCount);

  return contentCount;
};
