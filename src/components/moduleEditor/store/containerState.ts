// 📁 store/containerState.ts

import { useState, useCallback, useMemo } from 'react';
import { Container } from '../types/container';
import { LocalParagraph } from '../types/paragraph';

interface ContainerStats {
  totalContainers: number;
  containersWithContent: number;
  averageParagraphsPerContainer: number;
}

interface ContainerMapping {
  [containerId: string]: {
    paragraphIds: string[];
    paragraphCount: number;
    hasContent: boolean;
  };
}

export function useContainerState() {
  console.log('📦 [CONTAINER_STATE] useContainerState 훅 초기화');

  const [containers, setContainersState] = useState<Container[]>([]);
  const [containerMapping, setContainerMapping] = useState<ContainerMapping>(
    {}
  );

  console.log('📦 [CONTAINER_STATE] 현재 컨테이너 상태:', {
    총컨테이너수: containers.length,
    매핑된컨테이너: Object.keys(containerMapping).length,
    컨테이너목록: containers.map((c) => ({
      id: c.id,
      name: c.name,
      order: c.order,
    })),
  });

  const containerStats = useMemo(() => {
    const totalContainers = containers.length;
    const containersWithContent = Object.values(containerMapping).filter(
      (m) => m.hasContent
    ).length;
    const totalParagraphs = Object.values(containerMapping).reduce(
      (sum, m) => sum + m.paragraphCount,
      0
    );
    const averageParagraphsPerContainer =
      totalContainers > 0 ? totalParagraphs / totalContainers : 0;

    const stats = {
      totalContainers,
      containersWithContent,
      averageParagraphsPerContainer,
    };

    console.log('📦 [CONTAINER_STATE] 컨테이너 통계 계산:', stats);

    return stats;
  }, [containers.length, containerMapping]);

  const setContainers = useCallback(
    (newContainers: Container[]) => {
      console.log('📦 [CONTAINER_STATE] 전체 컨테이너 설정:', {
        이전개수: containers.length,
        새개수: newContainers.length,
        새컨테이너목록: newContainers.map((c) => c.name),
      });

      setContainersState(newContainers);
    },
    [containers.length]
  );

  const addContainer = useCallback((container: Container) => {
    console.log('📦 [CONTAINER_STATE] 컨테이너 추가:', {
      id: container.id,
      name: container.name,
      order: container.order,
    });

    setContainersState((prev) => [...prev, container]);
  }, []);

  const updateContainer = useCallback(
    (id: string, updates: Partial<Container>) => {
      console.log('📦 [CONTAINER_STATE] 컨테이너 업데이트:', {
        id,
        업데이트필드: Object.keys(updates),
        새이름: updates.name,
        새순서: updates.order,
      });

      setContainersState((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const deleteContainer = useCallback((id: string) => {
    console.log('📦 [CONTAINER_STATE] 컨테이너 삭제:', { id });

    setContainersState((prev) => prev.filter((c) => c.id !== id));

    setContainerMapping((prev) => {
      const newMapping = { ...prev };
      delete newMapping[id];
      return newMapping;
    });
  }, []);

  const moveContainer = useCallback((id: string, direction: 'up' | 'down') => {
    console.log('📦 [CONTAINER_STATE] 컨테이너 이동:', { id, direction });

    setContainersState((prev) => {
      const sortedContainers = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sortedContainers.findIndex((c) => c.id === id);

      if (currentIndex === -1) return prev;

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= sortedContainers.length) {
        console.log('📦 [CONTAINER_STATE] 이동 불가능한 위치');
        return prev;
      }

      const currentOrder = sortedContainers[currentIndex].order;
      const targetOrder = sortedContainers[targetIndex].order;

      console.log('📦 [CONTAINER_STATE] 순서 교체:', {
        currentOrder,
        targetOrder,
      });

      return prev.map((c) => {
        if (c.id === id) return { ...c, order: targetOrder };
        if (c.id === sortedContainers[targetIndex].id)
          return { ...c, order: currentOrder };
        return c;
      });
    });
  }, []);

  const getSortedContainers = useCallback(() => {
    const sorted = [...containers].sort((a, b) => a.order - b.order);

    console.log('📦 [CONTAINER_STATE] 정렬된 컨테이너 조회:', {
      개수: sorted.length,
      순서: sorted.map((c) => ({ name: c.name, order: c.order })),
    });

    return sorted;
  }, [containers]);

  const getContainerById = useCallback(
    (id: string) => {
      const container = containers.find((c) => c.id === id);

      console.log('📦 [CONTAINER_STATE] ID로 컨테이너 조회:', {
        id,
        찾음: !!container,
        이름: container?.name,
      });

      return container;
    },
    [containers]
  );

  const updateContainerMapping = useCallback(
    (paragraphs: LocalParagraph[]) => {
      console.log('📦 [CONTAINER_STATE] 컨테이너 매핑 업데이트 시작:', {
        단락수: paragraphs.length,
      });

      const newMapping: ContainerMapping = {};

      containers.forEach((container) => {
        const containerParagraphs = paragraphs.filter(
          (p) => p.containerId === container.id
        );
        const paragraphsWithContent = containerParagraphs.filter(
          (p) => p.content && p.content.trim().length > 0
        );

        newMapping[container.id] = {
          paragraphIds: containerParagraphs.map((p) => p.id),
          paragraphCount: containerParagraphs.length,
          hasContent: paragraphsWithContent.length > 0,
        };

        console.log('📦 [CONTAINER_STATE] 컨테이너 매핑:', {
          containerId: container.id,
          containerName: container.name,
          단락수: containerParagraphs.length,
          내용있는단락: paragraphsWithContent.length,
        });
      });

      setContainerMapping(newMapping);

      console.log('📦 [CONTAINER_STATE] 컨테이너 매핑 업데이트 완료');
    },
    [containers]
  );

  const getContainerStats = useCallback(
    (paragraphs: LocalParagraph[]) => {
      const totalContainers = containers.length;
      const containersWithParagraphs = new Set(
        paragraphs.filter((p) => p.containerId).map((p) => p.containerId)
      ).size;
      const totalParagraphs = paragraphs.filter((p) => p.containerId).length;
      const averageParagraphsPerContainer =
        totalContainers > 0 ? totalParagraphs / totalContainers : 0;

      const stats = {
        totalContainers,
        containersWithContent: containersWithParagraphs,
        averageParagraphsPerContainer,
      };

      console.log('📦 [CONTAINER_STATE] 실시간 통계 계산:', stats);

      return stats;
    },
    [containers]
  );

  console.log('✅ [CONTAINER_STATE] useContainerState 훅 준비 완료');

  return {
    containers,
    containerStats,
    containerMapping,
    setContainers,
    addContainer,
    updateContainer,
    deleteContainer,
    moveContainer,
    getSortedContainers,
    getContainerById,
    updateContainerMapping,
    getContainerStats,
  };
}
