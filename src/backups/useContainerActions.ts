// // 📁 hooks/useContainerActions.ts

// import { useCallback, useMemo } from 'react';
// import { LocalParagraph } from '../types/paragraph';
// import { Container } from '../types/container';
// import {
//   getLocalUnassignedParagraphs,
//   getLocalParagraphsByContainer,
//   createContainer,
//   createContainersFromInputs,
//   sortContainersByOrder,
//   getContainerParagraphStats,
//   getTotalAssignedParagraphs,
//   getTotalParagraphsWithContent,
// } from '../actions/containerActions';

// interface UseContainerActionsProps {
//   localParagraphs: LocalParagraph[];
//   localContainers: Container[];
// }

// export const useContainerActions = ({
//   localParagraphs,
//   localContainers,
// }: UseContainerActionsProps) => {
//   console.log('🏗️ [HOOK] useContainerActions 초기화:', {
//     paragraphCount: localParagraphs.length,
//     containerCount: localContainers.length,
//   });

//   const handleGetLocalUnassignedParagraphs = useCallback(() => {
//     console.log('🏗️ [HOOK] handleGetLocalUnassignedParagraphs 호출');
//     return getLocalUnassignedParagraphs(localParagraphs);
//   }, [localParagraphs]);

//   const handleGetLocalParagraphsByContainer = useCallback(
//     (containerId: string) => {
//       console.log(
//         '🏗️ [HOOK] handleGetLocalParagraphsByContainer 호출:',
//         containerId
//       );
//       return getLocalParagraphsByContainer(containerId, localParagraphs);
//     },
//     [localParagraphs]
//   );

//   const handleCreateContainer = useCallback((name: string, index: number) => {
//     console.log('🏗️ [HOOK] handleCreateContainer 호출:', { name, index });
//     return createContainer(name, index);
//   }, []);

//   const handleCreateContainersFromInputs = useCallback(
//     (validInputs: string[]) => {
//       console.log('🏗️ [HOOK] handleCreateContainersFromInputs 호출:', {
//         inputCount: validInputs.length,
//       });
//       return createContainersFromInputs(validInputs);
//     },
//     []
//   );

//   const handleSortContainersByOrder = useCallback((containers: Container[]) => {
//     console.log('🏗️ [HOOK] handleSortContainersByOrder 호출:', {
//       containerCount: containers.length,
//     });
//     return sortContainersByOrder(containers);
//   }, []);

//   const sortedContainers = useMemo(() => {
//     console.log('🏗️ [HOOK] sortedContainers 메모이제이션 계산');
//     return sortContainersByOrder(localContainers);
//   }, [localContainers]);

//   const unassignedParagraphs = useMemo(() => {
//     console.log('🏗️ [HOOK] unassignedParagraphs 메모이제이션 계산');
//     return getLocalUnassignedParagraphs(localParagraphs);
//   }, [localParagraphs]);

//   const containerStats = useMemo(() => {
//     console.log('🏗️ [HOOK] containerStats 메모이제이션 계산');
//     return getContainerParagraphStats(localContainers, localParagraphs);
//   }, [localContainers, localParagraphs]);

//   const totalAssignedParagraphs = useMemo(() => {
//     console.log('🏗️ [HOOK] totalAssignedParagraphs 메모이제이션 계산');
//     return getTotalAssignedParagraphs(localParagraphs);
//   }, [localParagraphs]);

//   const totalParagraphsWithContent = useMemo(() => {
//     console.log('🏗️ [HOOK] totalParagraphsWithContent 메모이제이션 계산');
//     return getTotalParagraphsWithContent(localParagraphs);
//   }, [localParagraphs]);

//   const getParagraphsByContainer = useCallback(
//     (containerId: string) => {
//       console.log('🏗️ [HOOK] getParagraphsByContainer 호출:', containerId);
//       return getLocalParagraphsByContainer(containerId, localParagraphs);
//     },
//     [localParagraphs]
//   );

//   console.log('✅ [HOOK] useContainerActions 훅 준비 완료:', {
//     sortedContainerCount: sortedContainers.length,
//     unassignedParagraphCount: unassignedParagraphs.length,
//     totalAssigned: totalAssignedParagraphs,
//     totalWithContent: totalParagraphsWithContent,
//   });

//   return {
//     handleGetLocalUnassignedParagraphs,
//     handleGetLocalParagraphsByContainer,
//     handleCreateContainer,
//     handleCreateContainersFromInputs,
//     handleSortContainersByOrder,
//     getParagraphsByContainer,
//     sortedContainers,
//     unassignedParagraphs,
//     containerStats,
//     totalAssignedParagraphs,
//     totalParagraphsWithContent,
//   };
// };
