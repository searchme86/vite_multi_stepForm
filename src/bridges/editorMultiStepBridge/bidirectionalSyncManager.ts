// bridges/editorMultiStepBridge/bidirectionalSyncManager.ts

import { BidirectionalSyncResult } from './bridgeDataTypes';
import { createEditorStateExtractor } from './editorDataExtractor';
import { createMultiStepDataExtractor } from './multiStepDataExtractor';
import { createDataStructureTransformer } from './editorToMultiStepTransformer';
import { createMultiStepToEditorTransformer } from './multiStepToEditorTransformer';
import { createMultiStepStateUpdater } from './multiStepDataUpdater';
import { createEditorDataUpdater } from './editorDataUpdater';

export const createBidirectionalSyncManager = () => {
  const editorExtractor = createEditorStateExtractor();
  const multiStepExtractor = createMultiStepDataExtractor();
  const editorToMultiStepTransformer = createDataStructureTransformer();
  const multiStepToEditorTransformer = createMultiStepToEditorTransformer();
  const multiStepUpdater = createMultiStepStateUpdater();
  const editorUpdater = createEditorDataUpdater();

  const syncEditorToMultiStep = async (): Promise<boolean> => {
    console.log('🔄 [SYNC_MANAGER] Editor → MultiStep 동기화 시작');
    const startTime = performance.now();

    try {
      const editorData = editorExtractor.getEditorStateWithValidation();
      if (!editorData) {
        throw new Error('Editor 데이터 추출 실패');
      }

      const transformResult =
        editorToMultiStepTransformer.transformEditorStateToMultiStep(
          editorData
        );
      if (!transformResult.transformationSuccess) {
        throw new Error(
          `데이터 변환 실패: ${transformResult.transformationErrors.join(', ')}`
        );
      }

      const updateSuccess = await multiStepUpdater.performCompleteStateUpdate(
        transformResult
      );
      if (!updateSuccess) {
        throw new Error('MultiStep 업데이트 실패');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('✅ [SYNC_MANAGER] Editor → MultiStep 동기화 완료:', {
        duration: `${duration.toFixed(2)}ms`,
        contentLength: transformResult.transformedContent.length,
      });

      return true;
    } catch (error) {
      console.error('❌ [SYNC_MANAGER] Editor → MultiStep 동기화 실패:', error);
      return false;
    }
  };

  const syncMultiStepToEditor = async (): Promise<boolean> => {
    console.log('🔄 [SYNC_MANAGER] MultiStep → Editor 동기화 시작');
    const startTime = performance.now();

    try {
      const multiStepData = multiStepExtractor.extractMultiStepData();
      if (!multiStepData) {
        throw new Error('MultiStep 데이터 추출 실패');
      }

      if (!multiStepExtractor.validateMultiStepData(multiStepData)) {
        throw new Error('MultiStep 데이터 검증 실패');
      }

      const transformResult =
        multiStepToEditorTransformer.transformMultiStepToEditor(multiStepData);
      if (!transformResult.transformationSuccess) {
        throw new Error(
          `데이터 변환 실패: ${transformResult.transformationErrors.join(', ')}`
        );
      }

      const updateSuccess = await editorUpdater.updateEditorState(
        transformResult.editorContent,
        transformResult.editorIsCompleted
      );

      if (!updateSuccess) {
        throw new Error('Editor 업데이트 실패');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('✅ [SYNC_MANAGER] MultiStep → Editor 동기화 완료:', {
        duration: `${duration.toFixed(2)}ms`,
        contentLength: transformResult.editorContent.length,
        isCompleted: transformResult.editorIsCompleted,
      });

      return true;
    } catch (error) {
      console.error('❌ [SYNC_MANAGER] MultiStep → Editor 동기화 실패:', error);
      return false;
    }
  };

  const syncBidirectional = async (): Promise<BidirectionalSyncResult> => {
    console.log('🔄 [SYNC_MANAGER] 양방향 동기화 시작');
    const startTime = performance.now();

    const syncErrors: string[] = [];

    const editorToMultiStepSuccess = await syncEditorToMultiStep().catch(
      (error) => {
        syncErrors.push(
          `Editor → MultiStep: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return false;
      }
    );

    const multiStepToEditorSuccess = await syncMultiStepToEditor().catch(
      (error) => {
        syncErrors.push(
          `MultiStep → Editor: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        return false;
      }
    );

    const overallSuccess = editorToMultiStepSuccess && multiStepToEditorSuccess;
    const endTime = performance.now();
    const syncDuration = endTime - startTime;

    const result: BidirectionalSyncResult = {
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      overallSuccess,
      syncErrors,
      syncDuration,
    };

    console.log('📊 [SYNC_MANAGER] 양방향 동기화 결과:', {
      editorToMultiStepSuccess,
      multiStepToEditorSuccess,
      overallSuccess,
      errorCount: syncErrors.length,
      duration: `${syncDuration.toFixed(2)}ms`,
    });

    return result;
  };

  const checkSyncPreconditions = (): {
    canSyncToMultiStep: boolean;
    canSyncToEditor: boolean;
  } => {
    console.log('🔍 [SYNC_MANAGER] 동기화 사전 조건 확인');

    let canSyncToMultiStep = false;
    let canSyncToEditor = false;

    try {
      const editorData = editorExtractor.getEditorStateWithValidation();
      canSyncToMultiStep = editorData !== null;
    } catch (error) {
      console.warn(
        '⚠️ [SYNC_MANAGER] Editor → MultiStep 사전 조건 실패:',
        error
      );
    }

    try {
      const multiStepData = multiStepExtractor.extractMultiStepData();
      canSyncToEditor =
        multiStepData !== null &&
        multiStepExtractor.validateMultiStepData(multiStepData);
    } catch (error) {
      console.warn(
        '⚠️ [SYNC_MANAGER] MultiStep → Editor 사전 조건 실패:',
        error
      );
    }

    console.log('📋 [SYNC_MANAGER] 사전 조건 확인 결과:', {
      canSyncToMultiStep,
      canSyncToEditor,
      canSyncBidirectional: canSyncToMultiStep && canSyncToEditor,
    });

    return { canSyncToMultiStep, canSyncToEditor };
  };

  const validateSyncResult = (result: BidirectionalSyncResult): boolean => {
    return (
      typeof result.editorToMultiStepSuccess === 'boolean' &&
      typeof result.multiStepToEditorSuccess === 'boolean' &&
      typeof result.overallSuccess === 'boolean' &&
      Array.isArray(result.syncErrors) &&
      typeof result.syncDuration === 'number'
    );
  };

  const createEmptySyncResult = (): BidirectionalSyncResult => {
    return {
      editorToMultiStepSuccess: false,
      multiStepToEditorSuccess: false,
      overallSuccess: false,
      syncErrors: ['동기화가 실행되지 않음'],
      syncDuration: 0,
    };
  };

  return {
    syncEditorToMultiStep,
    syncMultiStepToEditor,
    syncBidirectional,
    checkSyncPreconditions,
    validateSyncResult,
    createEmptySyncResult,
  };
};
