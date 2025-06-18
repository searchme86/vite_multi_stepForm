// 📁 store/editorCore/editorCoreStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Container, ParagraphBlock } from '../shared/commonTypes';
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
}

type EditorCoreStore = EditorCoreState & EditorCoreGetters & EditorCoreSetters;

export const useEditorCoreStore = create<EditorCoreStore>()(
  persist(
    (set, get) => ({
      ...initialEditorCoreState,

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

      resetEditorState: () => {
        set((currentStoreState) => {
          const { sectionInputs } = currentStoreState;
          const preservedSectionInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];

          return {
            ...initialEditorCoreState,
            sectionInputs: preservedSectionInputs,
          };
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
