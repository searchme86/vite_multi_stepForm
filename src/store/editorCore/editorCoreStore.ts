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
        return completedContent || '';
      },

      setCompletedContent: (completedContent: string) => {
        set({ completedContent: completedContent || '' });
      },

      getIsCompleted: () => {
        const { isCompleted } = get();
        return Boolean(isCompleted);
      },

      setIsCompleted: (isCompleted: boolean) => {
        set({ isCompleted: Boolean(isCompleted) });
      },

      getContainers: () => {
        const { containers } = get();
        return Array.isArray(containers) ? containers : [];
      },

      setContainers: (containerList: Container[]) => {
        const validContainers = Array.isArray(containerList)
          ? containerList
          : [];
        const { paragraphs } = get();
        const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

        set({
          containers: validContainers,
          completedContent: generateCompletedContent(
            validContainers,
            validParagraphs
          ),
        });
      },

      getParagraphs: () => {
        const { paragraphs } = get();
        return Array.isArray(paragraphs) ? paragraphs : [];
      },

      setParagraphs: (paragraphList: ParagraphBlock[]) => {
        const validParagraphs = Array.isArray(paragraphList)
          ? paragraphList
          : [];
        const { containers } = get();
        const validContainers = Array.isArray(containers) ? containers : [];

        set({
          paragraphs: validParagraphs,
          completedContent: generateCompletedContent(
            validContainers,
            validParagraphs
          ),
        });
      },

      getSectionInputs: () => {
        const { sectionInputs } = get();
        return Array.isArray(sectionInputs) ? sectionInputs : ['', '', '', ''];
      },

      setSectionInputs: (sectionInputs: string[]) => {
        const validInputs = Array.isArray(sectionInputs)
          ? sectionInputs
          : ['', '', '', ''];
        set({ sectionInputs: [...validInputs] });
      },

      getSectionInputsCount: () => {
        const { sectionInputs } = get();
        const validInputs = Array.isArray(sectionInputs) ? sectionInputs : [];
        return validInputs.length;
      },

      getValidSectionInputs: () => {
        const { sectionInputs } = get();
        const validInputs = Array.isArray(sectionInputs) ? sectionInputs : [];
        return validInputs.filter((section: string) => {
          return typeof section === 'string' && section.trim() !== '';
        });
      },

      updateSectionInput: (index: number, value: string) => {
        const validIndex = typeof index === 'number' && index >= 0 ? index : 0;
        const validValue = typeof value === 'string' ? value : '';

        set((currentState) => {
          const { sectionInputs } = currentState;
          const validInputs = Array.isArray(sectionInputs)
            ? [...sectionInputs]
            : ['', '', '', ''];

          if (validIndex >= validInputs.length) {
            console.warn(`Invalid section index: ${validIndex}`);
            return currentState;
          }

          validInputs[validIndex] = validValue;

          return {
            ...currentState,
            sectionInputs: validInputs,
          };
        });
      },

      addSectionInput: () => {
        set((currentState) => {
          const { sectionInputs } = currentState;
          const validInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];

          return {
            ...currentState,
            sectionInputs: [...validInputs, ''],
          };
        });
      },

      removeSectionInput: (index: number) => {
        const validIndex = typeof index === 'number' && index >= 0 ? index : 0;

        set((currentState) => {
          const { sectionInputs } = currentState;
          const validInputs = Array.isArray(sectionInputs)
            ? sectionInputs
            : ['', '', '', ''];

          if (validInputs.length <= 2) {
            console.warn('Minimum 2 sections required');
            return currentState;
          }

          if (validIndex >= validInputs.length) {
            console.warn(`Invalid section index: ${validIndex}`);
            return currentState;
          }

          const newInputs = validInputs.filter((_, i) => i !== validIndex);

          return {
            ...currentState,
            sectionInputs: newInputs,
          };
        });
      },

      resetSectionInputs: () => {
        set((currentState) => ({
          ...currentState,
          sectionInputs: ['', '', '', ''],
        }));
      },

      getContainerById: (containerId: string) => {
        const validId = typeof containerId === 'string' ? containerId : '';
        const { containers } = get();
        const validContainers = Array.isArray(containers) ? containers : [];

        return validContainers.find((container) => {
          return container && container.id === validId;
        });
      },

      getParagraphById: (paragraphId: string) => {
        const validId = typeof paragraphId === 'string' ? paragraphId : '';
        const { paragraphs } = get();
        const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

        return validParagraphs.find((paragraph) => {
          return paragraph && paragraph.id === validId;
        });
      },

      getParagraphsByContainer: (containerId: string) => {
        const validId = typeof containerId === 'string' ? containerId : '';
        const { paragraphs } = get();
        const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

        return getParagraphsByContainer(validParagraphs, validId);
      },

      getUnassignedParagraphs: () => {
        const { paragraphs } = get();
        const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

        return getUnassignedParagraphs(validParagraphs);
      },

      getSortedContainers: () => {
        const { containers } = get();
        const validContainers = Array.isArray(containers) ? containers : [];

        return sortContainers(validContainers);
      },

      validateEditorState: () => {
        const currentState = get();
        return validateEditorState(currentState);
      },

      addContainer: (newContainer: Container) => {
        if (!newContainer || typeof newContainer.id !== 'string') {
          throw new Error('Invalid container provided');
        }

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const containerExists = validContainers.some((container) => {
            return container && container.id === newContainer.id;
          });

          if (containerExists) {
            throw new Error(
              `Container with id ${newContainer.id} already exists`
            );
          }

          const updatedContainers = [...validContainers, newContainer];

          return {
            ...currentState,
            containers: updatedContainers,
            completedContent: generateCompletedContent(
              updatedContainers,
              validParagraphs
            ),
          };
        });
      },

      deleteContainer: (containerId: string) => {
        const validId = typeof containerId === 'string' ? containerId : '';

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const containerExists = validContainers.some((container) => {
            return container && container.id === validId;
          });

          if (!containerExists) {
            throw new Error(`Container with id ${validId} not found`);
          }

          const remainingContainers = validContainers.filter((container) => {
            return container && container.id !== validId;
          });

          const updatedParagraphs = validParagraphs.map((paragraph) => {
            if (paragraph && paragraph.containerId === validId) {
              return { ...paragraph, containerId: null };
            }
            return paragraph;
          });

          return {
            ...currentState,
            containers: remainingContainers,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              remainingContainers,
              updatedParagraphs
            ),
          };
        });
      },

      updateContainer: (
        containerId: string,
        containerUpdates: Partial<Container>
      ) => {
        const validId = typeof containerId === 'string' ? containerId : '';
        const validUpdates = containerUpdates || {};

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const containerIndex = validContainers.findIndex((container) => {
            return container && container.id === validId;
          });

          if (containerIndex === -1) {
            throw new Error(`Container with id ${validId} not found`);
          }

          const updatedContainers = [...validContainers];
          const existingContainer = updatedContainers[containerIndex];

          updatedContainers[containerIndex] = {
            ...existingContainer,
            ...validUpdates,
          };

          return {
            ...currentState,
            containers: updatedContainers,
            completedContent: generateCompletedContent(
              updatedContainers,
              validParagraphs
            ),
          };
        });
      },

      reorderContainers: (reorderedContainers: Container[]) => {
        const validContainers = Array.isArray(reorderedContainers)
          ? reorderedContainers
          : [];

        set((currentState) => {
          const { paragraphs } = currentState;
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          return {
            ...currentState,
            containers: validContainers,
            completedContent: generateCompletedContent(
              validContainers,
              validParagraphs
            ),
          };
        });
      },

      addParagraph: (newParagraph: ParagraphBlock) => {
        if (!newParagraph || typeof newParagraph.id !== 'string') {
          throw new Error('Invalid paragraph provided');
        }

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const paragraphExists = validParagraphs.some((paragraph) => {
            return paragraph && paragraph.id === newParagraph.id;
          });

          if (paragraphExists) {
            throw new Error(
              `Paragraph with id ${newParagraph.id} already exists`
            );
          }

          const updatedParagraphs = [...validParagraphs, newParagraph];

          return {
            ...currentState,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              validContainers,
              updatedParagraphs
            ),
          };
        });
      },

      deleteParagraph: (paragraphId: string) => {
        const validId = typeof paragraphId === 'string' ? paragraphId : '';

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const paragraphExists = validParagraphs.some((paragraph) => {
            return paragraph && paragraph.id === validId;
          });

          if (!paragraphExists) {
            throw new Error(`Paragraph with id ${validId} not found`);
          }

          const remainingParagraphs = validParagraphs.filter((paragraph) => {
            return paragraph && paragraph.id !== validId;
          });

          return {
            ...currentState,
            paragraphs: remainingParagraphs,
            completedContent: generateCompletedContent(
              validContainers,
              remainingParagraphs
            ),
          };
        });
      },

      updateParagraph: (
        paragraphId: string,
        paragraphUpdates: Partial<ParagraphBlock>
      ) => {
        const validId = typeof paragraphId === 'string' ? paragraphId : '';
        const validUpdates = paragraphUpdates || {};

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const paragraphIndex = validParagraphs.findIndex((paragraph) => {
            return paragraph && paragraph.id === validId;
          });

          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${validId} not found`);
          }

          const updatedParagraphs = [...validParagraphs];
          const existingParagraph = updatedParagraphs[paragraphIndex];

          updatedParagraphs[paragraphIndex] = {
            ...existingParagraph,
            ...validUpdates,
            updatedAt: new Date(),
          };

          return {
            ...currentState,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              validContainers,
              updatedParagraphs
            ),
          };
        });
      },

      updateParagraphContent: (paragraphId: string, newContent: string) => {
        const validId = typeof paragraphId === 'string' ? paragraphId : '';
        const validContent = typeof newContent === 'string' ? newContent : '';

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const paragraphIndex = validParagraphs.findIndex((paragraph) => {
            return paragraph && paragraph.id === validId;
          });

          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${validId} not found`);
          }

          const updatedParagraphs = [...validParagraphs];
          const existingParagraph = updatedParagraphs[paragraphIndex];

          updatedParagraphs[paragraphIndex] = {
            ...existingParagraph,
            content: validContent,
            updatedAt: new Date(),
          };

          return {
            ...currentState,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              validContainers,
              updatedParagraphs
            ),
          };
        });
      },

      moveParagraphToContainer: (
        targetParagraphId: string,
        destinationContainerId: string | null
      ) => {
        const validParagraphId =
          typeof targetParagraphId === 'string' ? targetParagraphId : '';
        const validContainerId =
          destinationContainerId === null
            ? null
            : typeof destinationContainerId === 'string'
            ? destinationContainerId
            : null;

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          if (
            validContainerId &&
            !validContainers.some((container) => {
              return container && container.id === validContainerId;
            })
          ) {
            throw new Error(`Container ${validContainerId} does not exist`);
          }

          const paragraphIndex = validParagraphs.findIndex((paragraph) => {
            return paragraph && paragraph.id === validParagraphId;
          });

          if (paragraphIndex === -1) {
            throw new Error(`Paragraph ${validParagraphId} does not exist`);
          }

          const updatedParagraphs = [...validParagraphs];
          const existingParagraph = updatedParagraphs[paragraphIndex];

          updatedParagraphs[paragraphIndex] = {
            ...existingParagraph,
            containerId: validContainerId,
            updatedAt: new Date(),
          };

          return {
            ...currentState,
            paragraphs: updatedParagraphs,
            completedContent: generateCompletedContent(
              validContainers,
              updatedParagraphs
            ),
          };
        });
      },

      reorderParagraphsInContainer: (
        targetContainerId: string,
        reorderedParagraphs: ParagraphBlock[]
      ) => {
        const validContainerId =
          typeof targetContainerId === 'string' ? targetContainerId : '';
        const validReorderedParagraphs = Array.isArray(reorderedParagraphs)
          ? reorderedParagraphs
          : [];

        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          const paragraphsFromOtherContainers = validParagraphs.filter(
            (paragraph) => {
              return paragraph && paragraph.containerId !== validContainerId;
            }
          );

          const finalParagraphList = [
            ...paragraphsFromOtherContainers,
            ...validReorderedParagraphs,
          ];

          return {
            ...currentState,
            paragraphs: finalParagraphList,
            completedContent: generateCompletedContent(
              validContainers,
              finalParagraphList
            ),
          };
        });
      },

      resetEditorState: () => {
        console.log('🔄 [STORE] 에디터 상태 초기화 시작');
        set(initialEditorCoreState);
      },

      resetEditorStateCompletely: () => {
        console.log(
          '🔥 [STORE] 에디터 상태 완전 초기화 시작 - localStorage 포함'
        );

        try {
          set(initialEditorCoreState);

          const persistKey = 'editor-core-storage';
          if (typeof window !== 'undefined' && window.localStorage) {
            console.log(`🗑️ [STORE] localStorage에서 ${persistKey} 삭제`);
            window.localStorage.removeItem(persistKey);
          }

          setTimeout(() => {
            set({
              containers: [],
              paragraphs: [],
              completedContent: '',
              isCompleted: false,
              sectionInputs: ['', '', '', ''],
            });
            console.log('✅ [STORE] 에디터 상태 완전 초기화 완료');
          }, 100);
        } catch (error) {
          console.error('❌ [STORE] 완전 초기화 중 오류:', error);
          set(initialEditorCoreState);
        }
      },

      generateCompletedContent: () => {
        set((currentState) => {
          const { containers, paragraphs } = currentState;
          const validContainers = Array.isArray(containers) ? containers : [];
          const validParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

          return {
            ...currentState,
            completedContent: generateCompletedContent(
              validContainers,
              validParagraphs
            ),
          };
        });
      },
    }),
    createPersistConfig('editor-core-storage', 'local')
  )
);

export const resetEditorStoreCompletely = () => {
  console.log('🔥 [STORE_EXTERNAL] 외부에서 에디터 완전 초기화 호출');

  try {
    const { resetEditorStateCompletely } = useEditorCoreStore.getState();
    resetEditorStateCompletely();

    console.log('✅ [STORE_EXTERNAL] 외부 완전 초기화 완료');
  } catch (error) {
    console.error('❌ [STORE_EXTERNAL] 외부 초기화 중 오류:', error);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('editor-core-storage');
      console.log('🗑️ [STORE_EXTERNAL] 직접 localStorage 삭제 완료');
    }
  }
};
