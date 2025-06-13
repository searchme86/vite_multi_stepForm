// 📁 hooks/useContainerActions.ts

import { useCallback, useMemo } from 'react';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';
import {
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
  createContainer,
  createContainersFromInputs,
  sortContainersByOrder,
  getContainerParagraphStats,
  getTotalAssignedParagraphs,
  getTotalParagraphsWithContent,
} from '../actions/containerActions';

//====여기부터 수정됨====
// 기존: context에서 데이터를 가져오던 방식
// 새로운: zustand store에서 데이터를 가져오는 방식 추가
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
//====여기까지 수정됨====

interface UseContainerActionsProps {
  localParagraphs: LocalParagraph[];
  localContainers: Container[];
}

//====여기부터 수정됨====
// 기존 함수 시그니처 100% 유지하면서 props를 optional로 변경
// 이렇게 하면 기존 코드는 그대로 작동하고, 새로운 코드는 매개변수 없이 호출 가능
export const useContainerActions = (props?: UseContainerActionsProps) => {
  // zustand store에서 데이터 가져오기 (context 대신 사용)
  const storeContainers = useEditorCoreStore((state) => state.containers);
  const storeParagraphs = useEditorCoreStore((state) => state.paragraphs);

  // props가 제공되면 props 사용, 없으면 zustand store 사용
  // 이렇게 하면 기존 코드와 100% 호환되면서도 새로운 방식도 지원
  const localParagraphs = props?.localParagraphs ?? storeParagraphs;
  const localContainers = props?.localContainers ?? storeContainers;
  //====여기까지 수정됨====

  console.log('🏗️ [HOOK] useContainerActions 초기화:', {
    paragraphCount: localParagraphs.length,
    containerCount: localContainers.length,
  });

  const handleGetLocalUnassignedParagraphs = useCallback(() => {
    console.log('🏗️ [HOOK] handleGetLocalUnassignedParagraphs 호출');
    return getLocalUnassignedParagraphs(localParagraphs);
  }, [localParagraphs]);

  const handleGetLocalParagraphsByContainer = useCallback(
    (containerId: string) => {
      console.log(
        '🏗️ [HOOK] handleGetLocalParagraphsByContainer 호출:',
        containerId
      );
      return getLocalParagraphsByContainer(containerId, localParagraphs);
    },
    [localParagraphs]
  );

  const handleCreateContainer = useCallback((name: string, index: number) => {
    console.log('🏗️ [HOOK] handleCreateContainer 호출:', { name, index });
    return createContainer(name, index);
  }, []);

  const handleCreateContainersFromInputs = useCallback(
    (validInputs: string[]) => {
      console.log('🏗️ [HOOK] handleCreateContainersFromInputs 호출:', {
        inputCount: validInputs.length,
      });
      return createContainersFromInputs(validInputs);
    },
    []
  );

  const handleSortContainersByOrder = useCallback((containers: Container[]) => {
    console.log('🏗️ [HOOK] handleSortContainersByOrder 호출:', {
      containerCount: containers.length,
    });
    return sortContainersByOrder(containers);
  }, []);

  const sortedContainers = useMemo(() => {
    console.log('🏗️ [HOOK] sortedContainers 메모이제이션 계산');
    return sortContainersByOrder(localContainers);
  }, [localContainers]);

  const unassignedParagraphs = useMemo(() => {
    console.log('🏗️ [HOOK] unassignedParagraphs 메모이제이션 계산');
    return getLocalUnassignedParagraphs(localParagraphs);
  }, [localParagraphs]);

  const containerStats = useMemo(() => {
    console.log('🏗️ [HOOK] containerStats 메모이제이션 계산');
    return getContainerParagraphStats(localContainers, localParagraphs);
  }, [localContainers, localParagraphs]);

  const totalAssignedParagraphs = useMemo(() => {
    console.log('🏗️ [HOOK] totalAssignedParagraphs 메모이제이션 계산');
    return getTotalAssignedParagraphs(localParagraphs);
  }, [localParagraphs]);

  const totalParagraphsWithContent = useMemo(() => {
    console.log('🏗️ [HOOK] totalParagraphsWithContent 메모이제이션 계산');
    return getTotalParagraphsWithContent(localParagraphs);
  }, [localParagraphs]);

  const getParagraphsByContainer = useCallback(
    (containerId: string) => {
      console.log('🏗️ [HOOK] getParagraphsByContainer 호출:', containerId);
      return getLocalParagraphsByContainer(containerId, localParagraphs);
    },
    [localParagraphs]
  );

  console.log('✅ [HOOK] useContainerActions 훅 준비 완료:', {
    sortedContainerCount: sortedContainers.length,
    unassignedParagraphCount: unassignedParagraphs.length,
    totalAssigned: totalAssignedParagraphs,
    totalWithContent: totalParagraphsWithContent,
  });

  return {
    handleGetLocalUnassignedParagraphs,
    handleGetLocalParagraphsByContainer,
    handleCreateContainer,
    handleCreateContainersFromInputs,
    handleSortContainersByOrder,
    getParagraphsByContainer,
    sortedContainers,
    unassignedParagraphs,
    containerStats,
    totalAssignedParagraphs,
    totalParagraphsWithContent,
  };
};
