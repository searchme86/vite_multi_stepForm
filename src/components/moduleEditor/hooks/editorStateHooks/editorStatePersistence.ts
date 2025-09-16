// 📁 hooks/useEditorState/editorStatePersistence.ts

import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph } from './editorStateTypes';
import { generateCompletedContent } from './editorStateHelpers';

const saveCurrentProgress = (
  managedContainerCollection: Container[],
  managedParagraphCollection: LocalParagraph[],
  updateContainersFunction: (containers: Container[]) => void,
  updateParagraphsFunction: (paragraphs: LocalParagraph[]) => void,
  showToastFunction: (options: ToastOptions) => void
) => {
  return () => {
    console.log('🎛️ [HOOK] saveCurrentProgress 호출');

    try {
      const safeContainerCollection = managedContainerCollection || [];
      if (updateContainersFunction) {
        updateContainersFunction(safeContainerCollection);
      }

      const safeParagraphCollection = managedParagraphCollection || [];
      const paragraphsToSaveCollection = safeParagraphCollection.map(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return {
            ...safeParagraph,
          };
        }
      );

      if (updateParagraphsFunction) {
        updateParagraphsFunction(paragraphsToSaveCollection);
      }

      console.log('💾 [ACTION] Context/Store 저장 완료:', {
        containers: safeContainerCollection.length,
        paragraphs: safeParagraphCollection.length,
      });

      console.log(
        '<-------저장 버튼을 누르면 나오는 곳, 6월 16일 월요일',
        paragraphsToSaveCollection
      );

      if (showToastFunction) {
        showToastFunction({
          title: '저장 완료',
          description: '모든 내용이 저장되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [HOOK] 진행 상황 저장 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '저장 실패',
          description: '저장 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

const finishEditing = (
  managedContainerCollection: Container[],
  managedParagraphCollection: LocalParagraph[],
  saveCurrentProgressCallback: () => void,
  updateCompletedContentFunction: (content: string) => void,
  setCompletedStatusFunction: (completed: boolean) => void,
  showToastFunction: (options: ToastOptions) => void
) => {
  return () => {
    console.log('🎛️ [HOOK] finishEditing 호출');

    try {
      if (saveCurrentProgressCallback) {
        saveCurrentProgressCallback();
      }

      const safeContainerCollection = managedContainerCollection || [];
      const safeParagraphCollection = managedParagraphCollection || [];

      const finalCompletedContentText = generateCompletedContent(
        safeContainerCollection,
        safeParagraphCollection
      );

      if (safeContainerCollection.length === 0) {
        if (showToastFunction) {
          showToastFunction({
            title: '에디터 미완성',
            description: '최소 1개 이상의 컨테이너가 필요합니다.',
            color: 'warning',
          });
        }
        return;
      }

      const assignedParagraphsCountInEditor = safeParagraphCollection.filter(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.containerId;
        }
      );

      if (assignedParagraphsCountInEditor.length === 0) {
        if (showToastFunction) {
          showToastFunction({
            title: '에디터 미완성',
            description: '최소 1개 이상의 할당된 단락이 필요합니다.',
            color: 'warning',
          });
        }
        return;
      }

      if (updateCompletedContentFunction) {
        updateCompletedContentFunction(finalCompletedContentText);
      }

      if (setCompletedStatusFunction) {
        setCompletedStatusFunction(true);
      }

      if (showToastFunction) {
        showToastFunction({
          title: '에디터 완성',
          description: '모듈화된 글 작성이 완료되었습니다!',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [HOOK] 에디터 완성 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '완성 실패',
          description: '에디터 완성 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

export { saveCurrentProgress, finishEditing };
