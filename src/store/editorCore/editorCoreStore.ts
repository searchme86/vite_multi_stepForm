// 📁 store/editorCore/editorCoreStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Container,
  ParagraphBlock,
  ContainerMoveRecord,
  ContainerMoveHistory,
  ContainerMoveStats,
} from '../shared/commonTypes';
import {
  initialEditorCoreState,
  type EditorCoreState,
} from './initialEditorCoreState';
import { createPersistConfig } from '../shared/persistConfig';
import {
  sortContainers,
  getParagraphsByContainer,
  getUnassignedParagraphs,
  generateCompletedContent,
  validateEditorState,
} from '../shared/utilityFunctions';

interface EditorCoreGetters {
  getCompletedContent: () => string;
  getIsCompleted: () => boolean;
  getContainers: () => Container[];
  getParagraphs: () => ParagraphBlock[];
  getSectionInputs: () => string[];
  getSectionInputsCount: () => number;
  getValidSectionInputs: () => string[];
  getContainerById: (containerId: string) => Container | undefined;
  getParagraphById: (paragraphId: string) => ParagraphBlock | undefined;
  getParagraphsByContainer: (containerId: string) => ParagraphBlock[];
  getUnassignedParagraphs: () => ParagraphBlock[];
  getSortedContainers: () => Container[];
  validateEditorState: () => boolean;

  // 🔄 컨테이너 이동 관련 Getter 함수들
  getContainerMoveHistory: () => ContainerMoveHistory;
  getContainerMovesByParagraph: (paragraphId: string) => ContainerMoveRecord[];
  getRecentContainerMoves: (limit?: number) => ContainerMoveRecord[];
  getContainerMoveStats: () => ContainerMoveStats;
}

interface EditorCoreSetters {
  setCompletedContent: (content: string) => void;
  setIsCompleted: (completed: boolean) => void;
  setContainers: (containers: Container[]) => void;
  setParagraphs: (paragraphs: ParagraphBlock[]) => void;
  setSectionInputs: (inputs: string[]) => void;
  updateSectionInput: (index: number, value: string) => void;
  addSectionInput: () => void;
  removeSectionInput: (index: number) => void;
  resetSectionInputs: () => void;
  addContainer: (container: Container) => void;
  addMultipleContainers: (containers: Container[]) => void; // 🆕 일괄 추가
  deleteContainer: (containerId: string) => void;
  updateContainer: (containerId: string, updates: Partial<Container>) => void;
  reorderContainers: (containers: Container[]) => void;
  addParagraph: (paragraph: ParagraphBlock) => void;
  deleteParagraph: (paragraphId: string) => void;
  updateParagraph: (
    paragraphId: string,
    updates: Partial<ParagraphBlock>
  ) => void;
  updateParagraphContent: (paragraphId: string, content: string) => void;
  moveParagraphToContainer: (
    paragraphId: string,
    containerId: string | null
  ) => void;
  reorderParagraphsInContainer: (
    containerId: string,
    paragraphs: ParagraphBlock[]
  ) => void;
  resetEditorState: () => void;
  resetEditorStateCompletely: () => void;
  generateCompletedContent: () => void;

  // 🔄 컨테이너 이동 관련 Setter 함수들
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
  trackContainerMove: (
    moveRecord: Omit<ContainerMoveRecord, 'id' | 'timestamp'>
  ) => void;
  clearContainerMoveHistory: () => void;
  removeContainerMoveRecord: (recordId: string) => void;
}

type EditorCoreStore = EditorCoreState & EditorCoreGetters & EditorCoreSetters;

export const useEditorCoreStore = create<EditorCoreStore>()(
  persist(
    (set, get) => ({
      ...initialEditorCoreState,

      // 기존 함수들은 그대로 유지...
      getCompletedContent: () => {
        const { completedContent } = get();
        const validCompletedContent =
          typeof completedContent === 'string' ? completedContent : '';
        return validCompletedContent;
      },

      setCompletedContent: (completedContentValue: string) => {
        const validCompletedContent =
          typeof completedContentValue === 'string'
            ? completedContentValue
            : '';
        set({ completedContent: validCompletedContent });
      },

      getIsCompleted: () => {
        const { isCompleted } = get();
        const validCompletionStatus =
          typeof isCompleted === 'boolean' ? isCompleted : false;
        return validCompletionStatus;
      },

      setIsCompleted: (completionStatus: boolean) => {
        const validCompletionStatus =
          typeof completionStatus === 'boolean' ? completionStatus : false;
        set({ isCompleted: validCompletionStatus });
      },

      getContainers: () => {
        const { containers } = get();
        const validContainerArray = Array.isArray(containers) ? containers : [];
        return validContainerArray;
      },

      setContainers: (containerList: Container[]) => {
        const validContainerList = Array.isArray(containerList)
          ? containerList
          : [];
        const { paragraphs } = get();
        const validParagraphList = Array.isArray(paragraphs) ? paragraphs : [];

        const generatedCompletedContent = generateCompletedContent(
          validContainerList,
          validParagraphList
        );

        set({
          containers: validContainerList,
          completedContent: generatedCompletedContent,
        });
      },

      getParagraphs: () => {
        const { paragraphs } = get();
        const validParagraphArray = Array.isArray(paragraphs) ? paragraphs : [];
        return validParagraphArray;
      },

      setParagraphs: (paragraphList: ParagraphBlock[]) => {
        const validParagraphList = Array.isArray(paragraphList)
          ? paragraphList
          : [];
        const { containers } = get();
        const validContainerList = Array.isArray(containers) ? containers : [];

        const generatedCompletedContent = generateCompletedContent(
          validContainerList,
          validParagraphList
        );

        set({
          paragraphs: validParagraphList,
          completedContent: generatedCompletedContent,
        });
      },

      getSectionInputs: () => {
        const { sectionInputs } = get();
        const validSectionInputArray = Array.isArray(sectionInputs)
          ? sectionInputs
          : ['', '', '', ''];
        return validSectionInputArray;
      },

      setSectionInputs: (sectionInputArray: string[]) => {
        const validSectionInputArray = Array.isArray(sectionInputArray)
          ? sectionInputArray
          : ['', '', '', ''];
        const sanitizedSectionInputArray = validSectionInputArray.map(
          (singleInput) => {
            const validSingleInput =
              typeof singleInput === 'string' ? singleInput : '';
            return validSingleInput;
          }
        );

        set({ sectionInputs: [...sanitizedSectionInputArray] });
      },

      getSectionInputsCount: () => {
        const { sectionInputs } = get();
        const validSectionInputArray = Array.isArray(sectionInputs)
          ? sectionInputs
          : [];
        const sectionInputCount = validSectionInputArray.length;
        return sectionInputCount;
      },

      getValidSectionInputs: () => {
        const { sectionInputs } = get();
        const validSectionInputArray = Array.isArray(sectionInputs)
          ? sectionInputs
          : [];
        const filteredValidSectionInputs = validSectionInputArray.filter(
          (singleSectionInput) => {
            const validSingleSection =
              typeof singleSectionInput === 'string' ? singleSectionInput : '';
            const hasValidContent = validSingleSection.trim() !== '';
            return hasValidContent;
          }
        );
        return filteredValidSectionInputs;
      },

      updateSectionInput: (inputIndex: number, inputValue: string) => {
        const validInputIndex =
          typeof inputIndex === 'number' && inputIndex >= 0 ? inputIndex : 0;
        const validInputValue =
          typeof inputValue === 'string' ? inputValue : '';

        set((currentStoreState) => {
          const { sectionInputs } = currentStoreState;
          const validCurrentInputs = Array.isArray(sectionInputs)
            ? [...sectionInputs]
            : ['', '', '', ''];

          if (validInputIndex >= validCurrentInputs.length) {
            console.warn(`Invalid section index: ${validInputIndex}`);
            return currentStoreState;
          }

          validCurrentInputs[validInputIndex] = validInputValue;

          return {
            ...currentStoreState,
            sectionInputs: validCurrentInputs,
          };
        });
      },

      addSectionInput: () => {
        set((currentStoreState) => {
          const { sectionInputs } = currentStoreState;
          const validCurrentInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];
          const expandedInputArray = [...validCurrentInputs, ''];

          return {
            ...currentStoreState,
            sectionInputs: expandedInputArray,
          };
        });
      },

      removeSectionInput: (removalIndex: number) => {
        const validRemovalIndex =
          typeof removalIndex === 'number' && removalIndex >= 0
            ? removalIndex
            : 0;

        set((currentStoreState) => {
          const { sectionInputs } = currentStoreState;
          const validCurrentInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];

          if (validCurrentInputs.length <= 2) {
            console.warn('Minimum 2 sections required');
            return currentStoreState;
          }

          if (validRemovalIndex >= validCurrentInputs.length) {
            console.warn(`Invalid section index: ${validRemovalIndex}`);
            return currentStoreState;
          }

          const reducedInputArray = validCurrentInputs.filter(
            (_, currentIndex) => currentIndex !== validRemovalIndex
          );

          return {
            ...currentStoreState,
            sectionInputs: reducedInputArray,
          };
        });
      },

      resetSectionInputs: () => {
        set((currentStoreState) => ({
          ...currentStoreState,
          sectionInputs: ['', '', '', ''],
        }));
      },

      getContainerById: (containerId: string) => {
        const validContainerId =
          typeof containerId === 'string' ? containerId : '';
        const { containers } = get();
        const validContainerArray = Array.isArray(containers) ? containers : [];

        const foundContainer = validContainerArray.find((singleContainer) => {
          const hasValidContainer =
            singleContainer && typeof singleContainer.id === 'string';
          const isMatchingId =
            hasValidContainer && singleContainer.id === validContainerId;
          return isMatchingId;
        });

        return foundContainer;
      },

      getParagraphById: (paragraphId: string) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';
        const { paragraphs } = get();
        const validParagraphArray = Array.isArray(paragraphs) ? paragraphs : [];

        const foundParagraph = validParagraphArray.find((singleParagraph) => {
          const hasValidParagraph =
            singleParagraph && typeof singleParagraph.id === 'string';
          const isMatchingId =
            hasValidParagraph && singleParagraph.id === validParagraphId;
          return isMatchingId;
        });

        return foundParagraph;
      },

      getParagraphsByContainer: (containerId: string) => {
        const validContainerId =
          typeof containerId === 'string' ? containerId : '';
        const { paragraphs } = get();
        const validParagraphArray = Array.isArray(paragraphs) ? paragraphs : [];

        const containerParagraphs = getParagraphsByContainer(
          validParagraphArray,
          validContainerId
        );
        return containerParagraphs;
      },

      getUnassignedParagraphs: () => {
        const { paragraphs } = get();
        const validParagraphArray = Array.isArray(paragraphs) ? paragraphs : [];

        const unassignedParagraphs =
          getUnassignedParagraphs(validParagraphArray);
        return unassignedParagraphs;
      },

      getSortedContainers: () => {
        const { containers } = get();
        const validContainerArray = Array.isArray(containers) ? containers : [];

        const sortedContainerArray = sortContainers(validContainerArray);
        return sortedContainerArray;
      },

      validateEditorState: () => {
        const currentStoreState = get();
        const isValidEditorState = validateEditorState(currentStoreState);
        return isValidEditorState;
      },

      // 🔄 컨테이너 이동 관련 Getter 구현
      getContainerMoveHistory: () => {
        const { containerMoveHistory } = get();
        const validMoveHistory = Array.isArray(containerMoveHistory)
          ? containerMoveHistory
          : [];
        return validMoveHistory;
      },

      getContainerMovesByParagraph: (paragraphId: string) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';
        const { containerMoveHistory } = get();
        const validMoveHistory = Array.isArray(containerMoveHistory)
          ? containerMoveHistory
          : [];

        const paragraphMoves = validMoveHistory.filter((moveRecord) => {
          const hasValidRecord =
            moveRecord && typeof moveRecord.paragraphId === 'string';
          const isMatchingParagraph =
            hasValidRecord && moveRecord.paragraphId === validParagraphId;
          return isMatchingParagraph;
        });

        console.log('📊 [STORE] 단락별 이동 이력:', {
          paragraphId: validParagraphId,
          moveCount: paragraphMoves.length,
        });

        return paragraphMoves;
      },

      getRecentContainerMoves: (limit: number = 10) => {
        const validLimit = typeof limit === 'number' && limit > 0 ? limit : 10;
        const { containerMoveHistory } = get();
        const validMoveHistory = Array.isArray(containerMoveHistory)
          ? containerMoveHistory
          : [];

        const sortedMoves = [...validMoveHistory].sort((a, b) => {
          const timestampA =
            a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
          const timestampB =
            b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
          return timestampB - timestampA; // 최신순 정렬
        });

        return sortedMoves.slice(0, validLimit);
      },

      getContainerMoveStats: () => {
        const { containerMoveHistory } = get();
        const validMoveHistory = Array.isArray(containerMoveHistory)
          ? containerMoveHistory
          : [];

        const totalMoves = validMoveHistory.length;

        // 가장 많이 이동된 단락 찾기
        const paragraphMoveCounts = new Map<string, number>();
        validMoveHistory.forEach((move) => {
          const count = paragraphMoveCounts.get(move.paragraphId) || 0;
          paragraphMoveCounts.set(move.paragraphId, count + 1);
        });

        const mostMovedParagraph =
          paragraphMoveCounts.size > 0
            ? Array.from(paragraphMoveCounts.entries()).reduce((a, b) =>
                a[1] > b[1] ? a : b
              )[0]
            : null;

        // 가장 많이 선택된 대상 컨테이너 찾기
        const targetContainerCounts = new Map<string, number>();
        validMoveHistory.forEach((move) => {
          const count = targetContainerCounts.get(move.toContainerId) || 0;
          targetContainerCounts.set(move.toContainerId, count + 1);
        });

        const mostTargetContainer =
          targetContainerCounts.size > 0
            ? Array.from(targetContainerCounts.entries()).reduce((a, b) =>
                a[1] > b[1] ? a : b
              )[0]
            : null;

        const averageMovesPerParagraph =
          paragraphMoveCounts.size > 0
            ? totalMoves / paragraphMoveCounts.size
            : 0;

        return {
          totalMoves,
          mostMovedParagraph,
          mostTargetContainer,
          averageMovesPerParagraph,
        };
      },

      // 🔄 컨테이너 이동 관련 Setter 구현
      moveToContainer: (paragraphId: string, targetContainerId: string) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';
        const validTargetContainerId =
          typeof targetContainerId === 'string' ? targetContainerId : '';

        console.log('🔄 [STORE] 컨테이너 이동 시작:', {
          paragraphId: validParagraphId,
          targetContainerId: validTargetContainerId,
        });

        set((currentState) => {
          const { containers, paragraphs, containerMoveHistory } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
          const validMoveHistory = Array.isArray(containerMoveHistory)
            ? containerMoveHistory
            : [];

          // 대상 컨테이너 존재 확인
          const targetContainerExists = validContainers.some(
            (container) => container && container.id === validTargetContainerId
          );

          if (!targetContainerExists) {
            console.error(
              '❌ [STORE] 대상 컨테이너가 존재하지 않음:',
              validTargetContainerId
            );
            return currentState;
          }

          // 단락 찾기 및 현재 컨테이너 ID 저장
          const paragraphIndex = validParagraphs.findIndex(
            (paragraph) => paragraph && paragraph.id === validParagraphId
          );

          if (paragraphIndex === -1) {
            console.error('❌ [STORE] 단락을 찾을 수 없음:', validParagraphId);
            return currentState;
          }

          const currentParagraph = validParagraphs[paragraphIndex];
          const fromContainerId = currentParagraph.containerId;

          // 동일한 컨테이너로 이동하려는 경우 무시
          if (fromContainerId === validTargetContainerId) {
            console.warn(
              '⚠️ [STORE] 동일한 컨테이너로 이동 시도:',
              validTargetContainerId
            );
            return currentState;
          }

          // 단락 업데이트
          const updatedParagraphs = [...validParagraphs];
          updatedParagraphs[paragraphIndex] = {
            ...currentParagraph,
            containerId: validTargetContainerId,
            updatedAt: new Date(),
          };

          // 이동 기록 추가
          const moveRecord: ContainerMoveRecord = {
            id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            paragraphId: validParagraphId,
            fromContainerId,
            toContainerId: validTargetContainerId,
            timestamp: new Date(),
          };

          const updatedMoveHistory = [...validMoveHistory, moveRecord];

          // 완성된 콘텐츠 재생성
          const generatedCompletedContent = generateCompletedContent(
            validContainers,
            updatedParagraphs
          );

          console.log('✅ [STORE] 컨테이너 이동 완료:', {
            paragraphId: validParagraphId,
            from: fromContainerId,
            to: validTargetContainerId,
            moveRecordId: moveRecord.id,
          });

          return {
            ...currentState,
            paragraphs: updatedParagraphs,
            containerMoveHistory: updatedMoveHistory,
            completedContent: generatedCompletedContent,
          };
        });
      },

      trackContainerMove: (
        moveData: Omit<ContainerMoveRecord, 'id' | 'timestamp'>
      ) => {
        const validMoveData = moveData || {};

        set((currentState) => {
          const { containerMoveHistory } = currentState;
          const validMoveHistory = Array.isArray(containerMoveHistory)
            ? containerMoveHistory
            : [];

          const moveRecord: ContainerMoveRecord = {
            id: `track_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            timestamp: new Date(),
            ...validMoveData,
          };

          const updatedMoveHistory = [...validMoveHistory, moveRecord];

          console.log('📝 [STORE] 이동 기록 추가:', moveRecord);

          return {
            ...currentState,
            containerMoveHistory: updatedMoveHistory,
          };
        });
      },

      clearContainerMoveHistory: () => {
        console.log('🗑️ [STORE] 컨테이너 이동 이력 전체 삭제');

        set((currentState) => ({
          ...currentState,
          containerMoveHistory: [],
        }));
      },

      removeContainerMoveRecord: (recordId: string) => {
        const validRecordId = typeof recordId === 'string' ? recordId : '';

        set((currentState) => {
          const { containerMoveHistory } = currentState;
          const validMoveHistory = Array.isArray(containerMoveHistory)
            ? containerMoveHistory
            : [];

          const filteredMoveHistory = validMoveHistory.filter(
            (record) => record && record.id !== validRecordId
          );

          console.log('🗑️ [STORE] 특정 이동 기록 삭제:', {
            recordId: validRecordId,
            removedCount: validMoveHistory.length - filteredMoveHistory.length,
          });

          return {
            ...currentState,
            containerMoveHistory: filteredMoveHistory,
          };
        });
      },

      // 🆕 일괄 컨테이너 추가 함수 (에러 방지용)
      addMultipleContainers: (containersToAdd: Container[]) => {
        const validContainersToAdd = Array.isArray(containersToAdd)
          ? containersToAdd
          : [];

        console.log('📦 [STORE] 일괄 컨테이너 추가 시작:', {
          count: validContainersToAdd.length,
          containers: validContainersToAdd.map((c) => ({
            id: c.id,
            name: c.name,
          })),
        });

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const successfulContainers: Container[] = [];
          const failedContainers: Array<{
            container: Container;
            error: string;
          }> = [];

          // 각 컨테이너 검증 및 추가
          validContainersToAdd.forEach((containerToAdd) => {
            try {
              const hasValidContainer =
                containerToAdd && typeof containerToAdd.id === 'string';

              if (!hasValidContainer) {
                throw new Error('Invalid container provided');
              }

              const containerAlreadyExists = [
                ...validCurrentContainers,
                ...successfulContainers,
              ].some((existingContainer) => {
                const hasValidExistingContainer =
                  existingContainer && typeof existingContainer.id === 'string';
                const isDuplicateId =
                  hasValidExistingContainer &&
                  existingContainer.id === containerToAdd.id;
                return isDuplicateId;
              });

              if (containerAlreadyExists) {
                throw new Error(
                  `Container with id ${containerToAdd.id} already exists`
                );
              }

              successfulContainers.push(containerToAdd);

              console.log('✅ [STORE] 컨테이너 추가 성공:', {
                id: containerToAdd.id,
                name: containerToAdd.name,
              });
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              failedContainers.push({
                container: containerToAdd,
                error: errorMessage,
              });

              console.error('❌ [STORE] 컨테이너 추가 실패:', {
                id: containerToAdd.id,
                name: containerToAdd.name,
                error: errorMessage,
              });
            }
          });

          // 성공한 컨테이너들만 추가
          const expandedContainerArray = [
            ...validCurrentContainers,
            ...successfulContainers,
          ];

          const generatedCompletedContent = generateCompletedContent(
            expandedContainerArray,
            validCurrentParagraphs
          );

          console.log('📊 [STORE] 일괄 추가 결과:', {
            totalRequested: validContainersToAdd.length,
            successful: successfulContainers.length,
            failed: failedContainers.length,
            finalContainerCount: expandedContainerArray.length,
          });

          return {
            ...currentState,
            containers: expandedContainerArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      // 기존 addContainer 함수는 그대로 유지
      addContainer: (newContainer: Container) => {
        const hasValidContainer =
          newContainer && typeof newContainer.id === 'string';

        if (!hasValidContainer) {
          throw new Error('Invalid container provided');
        }

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const containerAlreadyExists = validCurrentContainers.some(
            (existingContainer) => {
              const hasValidExistingContainer =
                existingContainer && typeof existingContainer.id === 'string';
              const isDuplicateId =
                hasValidExistingContainer &&
                existingContainer.id === newContainer.id;
              return isDuplicateId;
            }
          );

          if (containerAlreadyExists) {
            throw new Error(
              `Container with id ${newContainer.id} already exists`
            );
          }

          const expandedContainerArray = [
            ...validCurrentContainers,
            newContainer,
          ];
          const generatedCompletedContent = generateCompletedContent(
            expandedContainerArray,
            validCurrentParagraphs
          );

          return {
            ...currentStoreState,
            containers: expandedContainerArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      deleteContainer: (containerId: string) => {
        const validContainerId =
          typeof containerId === 'string' ? containerId : '';

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const containerExists = validCurrentContainers.some(
            (existingContainer) => {
              const hasValidContainer =
                existingContainer && typeof existingContainer.id === 'string';
              const isMatchingId =
                hasValidContainer && existingContainer.id === validContainerId;
              return isMatchingId;
            }
          );

          if (!containerExists) {
            throw new Error(`Container with id ${validContainerId} not found`);
          }

          const remainingContainers = validCurrentContainers.filter(
            (existingContainer) => {
              const hasValidContainer =
                existingContainer && typeof existingContainer.id === 'string';
              const isDifferentId =
                hasValidContainer && existingContainer.id !== validContainerId;
              return isDifferentId;
            }
          );

          const updatedParagraphs = validCurrentParagraphs.map(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph &&
                typeof existingParagraph.containerId === 'string';
              const belongsToDeletedContainer =
                hasValidParagraph &&
                existingParagraph.containerId === validContainerId;

              if (belongsToDeletedContainer) {
                return { ...existingParagraph, containerId: null };
              }
              return existingParagraph;
            }
          );

          const generatedCompletedContent = generateCompletedContent(
            remainingContainers,
            updatedParagraphs
          );

          return {
            ...currentStoreState,
            containers: remainingContainers,
            paragraphs: updatedParagraphs,
            completedContent: generatedCompletedContent,
          };
        });
      },

      updateContainer: (
        containerId: string,
        containerUpdates: Partial<Container>
      ) => {
        const validContainerId =
          typeof containerId === 'string' ? containerId : '';
        const validContainerUpdates = containerUpdates || {};

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const containerIndex = validCurrentContainers.findIndex(
            (existingContainer) => {
              const hasValidContainer =
                existingContainer && typeof existingContainer.id === 'string';
              const isMatchingId =
                hasValidContainer && existingContainer.id === validContainerId;
              return isMatchingId;
            }
          );

          if (containerIndex === -1) {
            throw new Error(`Container with id ${validContainerId} not found`);
          }

          const modifiedContainerArray = [...validCurrentContainers];
          const existingContainerData = modifiedContainerArray[containerIndex];

          modifiedContainerArray[containerIndex] = {
            ...existingContainerData,
            ...validContainerUpdates,
          };

          const generatedCompletedContent = generateCompletedContent(
            modifiedContainerArray,
            validCurrentParagraphs
          );

          return {
            ...currentStoreState,
            containers: modifiedContainerArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      reorderContainers: (reorderedContainerArray: Container[]) => {
        const validReorderedContainers = Array.isArray(reorderedContainerArray)
          ? reorderedContainerArray
          : [];

        set((currentStoreState) => {
          const { paragraphs } = currentStoreState;
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const generatedCompletedContent = generateCompletedContent(
            validReorderedContainers,
            validCurrentParagraphs
          );

          return {
            ...currentStoreState,
            containers: validReorderedContainers,
            completedContent: generatedCompletedContent,
          };
        });
      },

      addParagraph: (newParagraph: ParagraphBlock) => {
        const hasValidParagraph =
          newParagraph && typeof newParagraph.id === 'string';

        if (!hasValidParagraph) {
          throw new Error('Invalid paragraph provided');
        }

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const paragraphAlreadyExists = validCurrentParagraphs.some(
            (existingParagraph) => {
              const hasValidExistingParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isDuplicateId =
                hasValidExistingParagraph &&
                existingParagraph.id === newParagraph.id;
              return isDuplicateId;
            }
          );

          if (paragraphAlreadyExists) {
            throw new Error(
              `Paragraph with id ${newParagraph.id} already exists`
            );
          }

          const expandedParagraphArray = [
            ...validCurrentParagraphs,
            newParagraph,
          ];
          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            expandedParagraphArray
          );

          return {
            ...currentStoreState,
            paragraphs: expandedParagraphArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      deleteParagraph: (paragraphId: string) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const paragraphExists = validCurrentParagraphs.some(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isMatchingId =
                hasValidParagraph && existingParagraph.id === validParagraphId;
              return isMatchingId;
            }
          );

          if (!paragraphExists) {
            throw new Error(`Paragraph with id ${validParagraphId} not found`);
          }

          const remainingParagraphs = validCurrentParagraphs.filter(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isDifferentId =
                hasValidParagraph && existingParagraph.id !== validParagraphId;
              return isDifferentId;
            }
          );

          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            remainingParagraphs
          );

          return {
            ...currentStoreState,
            paragraphs: remainingParagraphs,
            completedContent: generatedCompletedContent,
          };
        });
      },

      updateParagraph: (
        paragraphId: string,
        paragraphUpdates: Partial<ParagraphBlock>
      ) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';
        const validParagraphUpdates = paragraphUpdates || {};

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const paragraphIndex = validCurrentParagraphs.findIndex(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isMatchingId =
                hasValidParagraph && existingParagraph.id === validParagraphId;
              return isMatchingId;
            }
          );

          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${validParagraphId} not found`);
          }

          const modifiedParagraphArray = [...validCurrentParagraphs];
          const existingParagraphData = modifiedParagraphArray[paragraphIndex];
          const currentTimestamp = new Date();

          modifiedParagraphArray[paragraphIndex] = {
            ...existingParagraphData,
            ...validParagraphUpdates,
            updatedAt: currentTimestamp,
          };

          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            modifiedParagraphArray
          );

          return {
            ...currentStoreState,
            paragraphs: modifiedParagraphArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      updateParagraphContent: (
        paragraphId: string,
        newContentValue: string
      ) => {
        const validParagraphId =
          typeof paragraphId === 'string' ? paragraphId : '';
        const validNewContent =
          typeof newContentValue === 'string' ? newContentValue : '';

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const paragraphIndex = validCurrentParagraphs.findIndex(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isMatchingId =
                hasValidParagraph && existingParagraph.id === validParagraphId;
              return isMatchingId;
            }
          );

          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${validParagraphId} not found`);
          }

          const modifiedParagraphArray = [...validCurrentParagraphs];
          const existingParagraphData = modifiedParagraphArray[paragraphIndex];
          const currentTimestamp = new Date();

          modifiedParagraphArray[paragraphIndex] = {
            ...existingParagraphData,
            content: validNewContent,
            updatedAt: currentTimestamp,
          };

          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            modifiedParagraphArray
          );

          return {
            ...currentStoreState,
            paragraphs: modifiedParagraphArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      moveParagraphToContainer: (
        targetParagraphId: string,
        destinationContainerId: string | null
      ) => {
        const validTargetParagraphId =
          typeof targetParagraphId === 'string' ? targetParagraphId : '';
        const validDestinationContainerId =
          destinationContainerId === null
            ? null
            : typeof destinationContainerId === 'string'
            ? destinationContainerId
            : null;

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          if (validDestinationContainerId) {
            const destinationContainerExists = validCurrentContainers.some(
              (existingContainer) => {
                const hasValidContainer =
                  existingContainer && typeof existingContainer.id === 'string';
                const isMatchingId =
                  hasValidContainer &&
                  existingContainer.id === validDestinationContainerId;
                return isMatchingId;
              }
            );

            if (!destinationContainerExists) {
              throw new Error(
                `Container ${validDestinationContainerId} does not exist`
              );
            }
          }

          const paragraphIndex = validCurrentParagraphs.findIndex(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph && typeof existingParagraph.id === 'string';
              const isMatchingId =
                hasValidParagraph &&
                existingParagraph.id === validTargetParagraphId;
              return isMatchingId;
            }
          );

          if (paragraphIndex === -1) {
            throw new Error(
              `Paragraph ${validTargetParagraphId} does not exist`
            );
          }

          const modifiedParagraphArray = [...validCurrentParagraphs];
          const existingParagraphData = modifiedParagraphArray[paragraphIndex];
          const currentTimestamp = new Date();

          modifiedParagraphArray[paragraphIndex] = {
            ...existingParagraphData,
            containerId: validDestinationContainerId,
            updatedAt: currentTimestamp,
          };

          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            modifiedParagraphArray
          );

          return {
            ...currentStoreState,
            paragraphs: modifiedParagraphArray,
            completedContent: generatedCompletedContent,
          };
        });
      },

      reorderParagraphsInContainer: (
        targetContainerId: string,
        reorderedParagraphArray: ParagraphBlock[]
      ) => {
        const validTargetContainerId =
          typeof targetContainerId === 'string' ? targetContainerId : '';
        const validReorderedParagraphs = Array.isArray(reorderedParagraphArray)
          ? reorderedParagraphArray
          : [];

        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const paragraphsFromOtherContainers = validCurrentParagraphs.filter(
            (existingParagraph) => {
              const hasValidParagraph =
                existingParagraph &&
                typeof existingParagraph.containerId === 'string';
              const belongsToDifferentContainer =
                hasValidParagraph &&
                existingParagraph.containerId !== validTargetContainerId;
              const isUnassignedParagraph =
                !hasValidParagraph || existingParagraph.containerId === null;
              return belongsToDifferentContainer || isUnassignedParagraph;
            }
          );

          const finalReorderedParagraphList = [
            ...paragraphsFromOtherContainers,
            ...validReorderedParagraphs,
          ];
          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            finalReorderedParagraphList
          );

          return {
            ...currentStoreState,
            paragraphs: finalReorderedParagraphList,
            completedContent: generatedCompletedContent,
          };
        });
      },

      // ✅ 수정된 resetEditorState - 에러의 핵심 해결
      resetEditorState: () => {
        console.log(
          '🔄 [STORE] 에디터 상태 초기화 시작 - 빈 상태로 완전 초기화'
        );

        set((currentStoreState) => {
          const { sectionInputs } = currentStoreState;
          const preservedSectionInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];

          console.log('📊 [STORE] 초기화 세부 정보:', {
            preservedInputs: preservedSectionInputs,
            beforeContainerCount: Array.isArray(currentStoreState.containers)
              ? currentStoreState.containers.length
              : 0,
            beforeParagraphCount: Array.isArray(currentStoreState.paragraphs)
              ? currentStoreState.paragraphs.length
              : 0,
          });

          // ✅ 템플릿 데이터 없이 완전히 빈 상태로 초기화
          const cleanResetState = {
            containers: [], // 🎯 빈 배열로 완전 초기화
            paragraphs: [], // 🎯 빈 배열로 완전 초기화
            completedContent: '', // 🎯 빈 문자열로 초기화
            isCompleted: false, // 🎯 false로 초기화
            containerMoveHistory: [], // 🎯 빈 배열로 초기화
            sectionInputs: preservedSectionInputs, // ✅ 입력만 보존
          };

          console.log('✅ [STORE] 에디터 상태 초기화 완료:', {
            containerCount: cleanResetState.containers.length,
            paragraphCount: cleanResetState.paragraphs.length,
            sectionInputCount: cleanResetState.sectionInputs.length,
            isTemplateDataRemoved: true,
          });

          return cleanResetState;
        });
      },

      resetEditorStateCompletely: () => {
        try {
          set(initialEditorCoreState);

          const persistenceStorageKey = 'editor-core-storage';
          const hasWindowObject = typeof window !== 'undefined';
          const hasLocalStorage = hasWindowObject && window.localStorage;

          if (hasLocalStorage) {
            window.localStorage.removeItem(persistenceStorageKey);
          }

          setTimeout(() => {
            const defaultResetState = {
              containers: [],
              paragraphs: [],
              completedContent: '',
              isCompleted: false,
              sectionInputs: ['', '', '', ''],
              containerMoveHistory: [], // 🔄 완전 초기화 시에도 포함
            };
            set(defaultResetState);
          }, 100);
        } catch (resetError) {
          console.error('❌ [STORE] 완전 초기화 중 오류:', resetError);
          set(initialEditorCoreState);
        }
      },

      generateCompletedContent: () => {
        set((currentStoreState) => {
          const { containers, paragraphs } = currentStoreState;
          const validCurrentContainers = Array.isArray(containers)
            ? containers
            : [];
          const validCurrentParagraphs = Array.isArray(paragraphs)
            ? paragraphs
            : [];

          const generatedCompletedContent = generateCompletedContent(
            validCurrentContainers,
            validCurrentParagraphs
          );

          return {
            ...currentStoreState,
            completedContent: generatedCompletedContent,
          };
        });
      },
    }),
    createPersistConfig('editor-core-storage', 'local')
  )
);

export const resetEditorStoreCompletely = () => {
  try {
    const { resetEditorStateCompletely } = useEditorCoreStore.getState();
    resetEditorStateCompletely();
  } catch (externalResetError) {
    console.error(
      '❌ [STORE_EXTERNAL] 외부 초기화 중 오류:',
      externalResetError
    );

    const hasWindowObject = typeof window !== 'undefined';
    const hasLocalStorage = hasWindowObject && window.localStorage;

    if (hasLocalStorage) {
      window.localStorage.removeItem('editor-core-storage');
    }
  }
};
