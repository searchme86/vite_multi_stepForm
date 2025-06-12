import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Container, ParagraphBlock } from '../shared/commonTypes';
import {
  initialEditorCoreState,
  type EditorCoreState,
} from './initialEditorCoreState';
import type { EditorCoreGetters } from './getterEditorCore';
import type { EditorCoreSetters } from './setterEditorCore';
import { createPersistConfig } from '../shared/persistConfig';
// ✅ 추가: utilityFunctions에서 중복 함수들 import
import {
  sortContainers,
  getParagraphsByContainer,
  getUnassignedParagraphs,
  generateCompletedContent,
  validateEditorState,
} from '../shared/utilityFunctions';

type EditorCoreStore = EditorCoreState & EditorCoreGetters & EditorCoreSetters;

export const useEditorCoreStore = create<EditorCoreStore>()(
  persist(
    (set, get) => ({
      ...initialEditorCoreState,

      getCompletedContent: () => get().completedContent,
      setCompletedContent: (completedContent: string) =>
        set({ completedContent }),

      getIsCompleted: () => get().isCompleted,
      setIsCompleted: (isCompleted: boolean) => set({ isCompleted }),

      getContainers: () => get().containers,
      setContainers: (containerList: Container[]) =>
        set({
          containers: containerList,
          completedContent: generateCompletedContent(
            containerList,
            get().paragraphs
          ),
        }),

      getParagraphs: () => get().paragraphs,
      setParagraphs: (paragraphList: ParagraphBlock[]) =>
        set({
          paragraphs: paragraphList,
          completedContent: generateCompletedContent(
            get().containers,
            paragraphList
          ),
        }),

      //====여기부터 수정됨====
      // 의미: 주어진 ID로 컨테이너를 찾는 함수
      // 왜 이렇게 작성: 단일 컨테이너 조회 시 명확한 변수명으로 가독성 향상
      getContainerById: (containerId: string) =>
        get().containers.find((container) => container.id === containerId),

      // 의미: 주어진 ID로 문단을 찾는 함수
      // 왜 이렇게 작성: 단일 문단 조회 시 명확한 변수명으로 가독성 향상
      getParagraphById: (paragraphId: string) =>
        get().paragraphs.find((paragraph) => paragraph.id === paragraphId),
      //====여기까지 수정됨====

      getParagraphsByContainer: (containerId: string) =>
        getParagraphsByContainer(get().paragraphs, containerId),

      getUnassignedParagraphs: () => getUnassignedParagraphs(get().paragraphs),

      getSortedContainers: () => sortContainers(get().containers),

      validateEditorState: () => validateEditorState(get()),

      //====여기부터 수정됨====
      // 의미: 새로운 컨테이너를 추가하는 함수
      // 왜 이렇게 작성: 컨테이너 중복 검사 시 명확한 변수명으로 로직 이해도 향상
      addContainer: (newContainer: Container) =>
        set((currentState) => {
          const containerExists = currentState.containers.some(
            (container) => container.id === newContainer.id
          );
          if (containerExists) {
            throw new Error(
              `Container with id ${newContainer.id} already exists`
            );
          }
          const updatedContainers = [...currentState.containers, newContainer];
          return {
            containers: updatedContainers,
            completedContent: generateCompletedContent(
              updatedContainers,
              currentState.paragraphs
            ),
          };
        }),

      // 의미: 컨테이너를 삭제하는 함수
      // 왜 이렇게 작성: 삭제 대상 확인과 관련 문단 처리 시 명확한 변수명으로 로직 파악 용이
      deleteContainer: (containerId: string) =>
        set((currentState) => {
          const containerExists = currentState.containers.some(
            (container) => container.id === containerId
          );
          if (!containerExists) {
            throw new Error(`Container with id ${containerId} not found`);
          }
          const remainingContainers = currentState.containers.filter(
            (container) => container.id !== containerId
          );
          const updatedParagraphs = currentState.paragraphs.map((paragraph) =>
            paragraph.containerId === containerId
              ? { ...paragraph, containerId: null }
              : paragraph
          );
          return {
            containers: remainingContainers,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              remainingContainers,
              updatedParagraphs
            ),
          };
        }),

      // 의미: 컨테이너 정보를 업데이트하는 함수
      // 왜 이렇게 작성: 업데이트 대상 찾기와 수정 시 명확한 변수명으로 가독성 향상
      updateContainer: (
        containerId: string,
        containerUpdates: Partial<Container>
      ) =>
        set((currentState) => {
          const containerIndex = currentState.containers.findIndex(
            (container) => container.id === containerId
          );
          if (containerIndex === -1) {
            throw new Error(`Container with id ${containerId} not found`);
          }
          const updatedContainers = [...currentState.containers];
          updatedContainers[containerIndex] = {
            ...updatedContainers[containerIndex],
            ...containerUpdates,
          };
          return {
            containers: updatedContainers,
            completedContent: generateCompletedContent(
              updatedContainers,
              currentState.paragraphs
            ),
          };
        }),

      // 의미: 컨테이너 순서를 재정렬하는 함수
      // 왜 이렇게 작성: 재정렬된 컨테이너 리스트를 명확하게 구분하기 위해
      reorderContainers: (reorderedContainers: Container[]) =>
        set((currentState) => ({
          containers: reorderedContainers,
          completedContent: generateCompletedContent(
            reorderedContainers,
            currentState.paragraphs
          ),
        })),

      // 의미: 새로운 문단을 추가하는 함수
      // 왜 이렇게 작성: 문단 중복 검사 시 명확한 변수명으로 로직 이해도 향상
      addParagraph: (newParagraph: ParagraphBlock) =>
        set((currentState) => {
          const paragraphExists = currentState.paragraphs.some(
            (paragraph) => paragraph.id === newParagraph.id
          );
          if (paragraphExists) {
            throw new Error(
              `Paragraph with id ${newParagraph.id} already exists`
            );
          }
          const updatedParagraphs = [...currentState.paragraphs, newParagraph];
          return {
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              currentState.containers,
              updatedParagraphs
            ),
          };
        }),

      // 의미: 문단을 삭제하는 함수
      // 왜 이렇게 작성: 삭제 대상 확인 시 명확한 변수명으로 로직 파악 용이
      deleteParagraph: (paragraphId: string) =>
        set((currentState) => {
          const paragraphExists = currentState.paragraphs.some(
            (paragraph) => paragraph.id === paragraphId
          );
          if (!paragraphExists) {
            throw new Error(`Paragraph with id ${paragraphId} not found`);
          }
          const remainingParagraphs = currentState.paragraphs.filter(
            (paragraph) => paragraph.id !== paragraphId
          );
          return {
            paragraphs: remainingParagraphs,
            completedContent: generateCompletedContent(
              currentState.containers,
              remainingParagraphs
            ),
          };
        }),

      // 의미: 문단 정보를 업데이트하는 함수
      // 왜 이렇게 작성: 업데이트 대상 찾기와 수정 시 명확한 변수명으로 가독성 향상
      updateParagraph: (
        paragraphId: string,
        paragraphUpdates: Partial<ParagraphBlock>
      ) =>
        set((currentState) => {
          const paragraphIndex = currentState.paragraphs.findIndex(
            (paragraph) => paragraph.id === paragraphId
          );
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${paragraphId} not found`);
          }
          const updatedParagraphs = [...currentState.paragraphs];
          updatedParagraphs[paragraphIndex] = {
            ...updatedParagraphs[paragraphIndex],
            ...paragraphUpdates,
            updatedAt: new Date(),
          };
          return {
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              currentState.containers,
              updatedParagraphs
            ),
          };
        }),

      // 의미: 문단의 내용만 업데이트하는 함수
      // 왜 이렇게 작성: 내용 업데이트 시 명확한 변수명으로 로직 파악 용이
      updateParagraphContent: (paragraphId: string, newContent: string) =>
        set((currentState) => {
          const paragraphIndex = currentState.paragraphs.findIndex(
            (paragraph) => paragraph.id === paragraphId
          );
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${paragraphId} not found`);
          }
          const updatedParagraphs = [...currentState.paragraphs];
          updatedParagraphs[paragraphIndex] = {
            ...updatedParagraphs[paragraphIndex],
            content: newContent,
            updatedAt: new Date(),
          };
          return {
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              currentState.containers,
              updatedParagraphs
            ),
          };
        }),

      // 의미: 문단을 다른 컨테이너로 이동시키는 함수
      // 왜 이렇게 작성: 이동 대상과 목적지를 명확하게 구분하기 위해
      moveParagraphToContainer: (
        targetParagraphId: string,
        destinationContainerId: string | null
      ) =>
        set((currentState) => {
          if (
            destinationContainerId &&
            !currentState.containers.some(
              (container) => container.id === destinationContainerId
            )
          ) {
            throw new Error(
              `Container ${destinationContainerId} does not exist`
            );
          }
          const paragraphIndex = currentState.paragraphs.findIndex(
            (paragraph) => paragraph.id === targetParagraphId
          );
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph ${targetParagraphId} does not exist`);
          }
          const updatedParagraphs = [...currentState.paragraphs];
          updatedParagraphs[paragraphIndex] = {
            ...updatedParagraphs[paragraphIndex],
            containerId: destinationContainerId,
            updatedAt: new Date(),
          };
          return {
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              currentState.containers,
              updatedParagraphs
            ),
          };
        }),

      // 의미: 특정 컨테이너 내 문단들의 순서를 재정렬하는 함수
      // 왜 이렇게 작성: 재정렬 대상과 나머지를 명확하게 구분하기 위해
      reorderParagraphsInContainer: (
        targetContainerId: string,
        reorderedParagraphs: ParagraphBlock[]
      ) =>
        set((currentState) => {
          const paragraphsFromOtherContainers = currentState.paragraphs.filter(
            (paragraph) => paragraph.containerId !== targetContainerId
          );
          const finalParagraphList = [
            ...paragraphsFromOtherContainers,
            ...reorderedParagraphs,
          ];
          return {
            paragraphs: finalParagraphList,
            completedContent: generateCompletedContent(
              currentState.containers,
              finalParagraphList
            ),
          };
        }),
      //====여기까지 수정됨====

      resetEditorState: () => set(initialEditorCoreState),

      generateCompletedContent: () =>
        set((currentState) => ({
          completedContent: generateCompletedContent(
            currentState.containers,
            currentState.paragraphs
          ),
        })),
    }),
    createPersistConfig('editor-core-storage', 'local')
  )
);
