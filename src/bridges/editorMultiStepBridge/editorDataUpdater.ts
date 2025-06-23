// bridges/editorMultiStepBridge/editorDataUpdater.ts

import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';

export const createEditorDataUpdater = () => {
  const updateEditorContent = (content: string): boolean => {
    console.log('🔄 [EDITOR_UPDATER] Editor 콘텐츠 업데이트');

    try {
      const editorState = useEditorCoreStore.getState();

      if (!editorState) {
        console.error('❌ [EDITOR_UPDATER] Editor 상태 없음');
        return false;
      }

      const { setCompletedContent } = editorState;

      if (typeof setCompletedContent !== 'function') {
        console.error('❌ [EDITOR_UPDATER] setCompletedContent 함수 없음');
        return false;
      }

      setCompletedContent(content);

      console.log('✅ [EDITOR_UPDATER] 콘텐츠 업데이트 완료:', {
        contentLength: content.length,
      });

      return true;
    } catch (error) {
      console.error('❌ [EDITOR_UPDATER] 업데이트 실패:', error);
      return false;
    }
  };

  const updateEditorCompletion = (isCompleted: boolean): boolean => {
    console.log('🔄 [EDITOR_UPDATER] Editor 완료 상태 업데이트');

    try {
      const editorState = useEditorCoreStore.getState();

      if (!editorState) {
        console.error('❌ [EDITOR_UPDATER] Editor 상태 없음');
        return false;
      }

      const { setIsCompleted } = editorState;

      if (typeof setIsCompleted !== 'function') {
        console.error('❌ [EDITOR_UPDATER] setIsCompleted 함수 없음');
        return false;
      }

      setIsCompleted(isCompleted);

      console.log('✅ [EDITOR_UPDATER] 완료 상태 업데이트 완료:', {
        isCompleted,
      });

      return true;
    } catch (error) {
      console.error('❌ [EDITOR_UPDATER] 완료 상태 업데이트 실패:', error);
      return false;
    }
  };

  const updateEditorState = async (
    content: string,
    isCompleted: boolean
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_UPDATER] Editor 전체 상태 업데이트');

    try {
      const contentUpdateSuccess = updateEditorContent(content);
      const completionUpdateSuccess = updateEditorCompletion(isCompleted);

      const overallSuccess = contentUpdateSuccess && completionUpdateSuccess;

      console.log('📊 [EDITOR_UPDATER] 전체 상태 업데이트 결과:', {
        contentUpdateSuccess,
        completionUpdateSuccess,
        overallSuccess,
      });

      return overallSuccess;
    } catch (error) {
      console.error('❌ [EDITOR_UPDATER] 전체 상태 업데이트 실패:', error);
      return false;
    }
  };

  const validateEditorUpdateData = (
    content: string,
    isCompleted: boolean
  ): boolean => {
    const hasValidContent = typeof content === 'string';
    const hasValidCompletion = typeof isCompleted === 'boolean';

    return hasValidContent && hasValidCompletion;
  };

  const getCurrentEditorState = () => {
    try {
      const editorState = useEditorCoreStore.getState();

      if (!editorState) {
        console.error('❌ [EDITOR_UPDATER] Editor 상태 조회 실패');
        return null;
      }

      const { completedContent, isCompleted } = editorState;

      return {
        currentContent: completedContent || '',
        currentCompletion: Boolean(isCompleted),
      };
    } catch (error) {
      console.error('❌ [EDITOR_UPDATER] 현재 상태 조회 실패:', error);
      return null;
    }
  };

  return {
    updateEditorContent,
    updateEditorCompletion,
    updateEditorState,
    validateEditorUpdateData,
    getCurrentEditorState,
  };
};
