import React from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { FormSchemaValues } from '../../../types/formTypes';
import { EditorState } from '../../../types/editorTypes';

interface UseEditorFormSyncProps {
  setValue: UseFormSetValue<FormSchemaValues>;
  editorState: EditorState;
  allWatchedValues: FormSchemaValues;
}

export const useEditorFormSync = ({
  setValue,
  editorState,
  allWatchedValues,
}: UseEditorFormSyncProps) => {
  React.useEffect(() => {
    console.log('🔄 useEditorFormSync: 에디터 상태 변화 감지');

    if (
      editorState.completedContent !== allWatchedValues.editorCompletedContent
    ) {
      console.log('🔄 useEditorFormSync: 완성된 컨텐츠 동기화');
      setValue('editorCompletedContent', editorState.completedContent);
    }

    if (editorState.isCompleted !== allWatchedValues.isEditorCompleted) {
      console.log('🔄 useEditorFormSync: 완료 상태 동기화');
      setValue('isEditorCompleted', editorState.isCompleted);
    }
  }, [
    editorState.completedContent,
    editorState.isCompleted,
    setValue,
    allWatchedValues.editorCompletedContent,
    allWatchedValues.isEditorCompleted,
  ]);
};
