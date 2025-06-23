// bridges/editorMultiStepBridge/editorStateExtractor.ts

import { EditorStateSnapshotForBridge } from './bridgeDataTypes';
import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import {
  validateEditorContainers,
  validateEditorParagraphs,
  calculateEditorStatistics,
} from '../utils/editorStateUtils';

export const createEditorStateExtractor = () => {
  // 에디터 스토어에서 안전하게 데이터를 추출하는 함수
  const extractRawEditorData = (): {
    containers: Container[];
    paragraphs: ParagraphBlock[];
    isCompleted: boolean;
    activeParagraphId: string | null;
    selectedParagraphIds: string[];
    isPreviewOpen: boolean;
  } | null => {
    console.log('🔍 [EXTRACTOR] 원시 에디터 데이터 추출 시작');

    try {
      // 실제 에디터 스토어에서 데이터를 가져오는 로직
      // 여기서는 예시로 window 객체에서 가져오는 것으로 구현
      // 실제로는 Zustand 스토어나 다른 상태 관리 라이브러리에서 가져와야 함
      const editorStore = (window as any).__EDITOR_STORE__;

      if (!editorStore) {
        console.warn('⚠️ [EXTRACTOR] 에디터 스토어를 찾을 수 없음');
        return null;
      }

      const {
        containers = [],
        paragraphs = [],
        isCompleted = false,
        activeParagraphId = null,
        selectedParagraphIds = [],
        isPreviewOpen = false,
      } = editorStore;

      console.log('📊 [EXTRACTOR] 원시 데이터:', {
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
        isCompleted,
      });

      return {
        containers: Array.isArray(containers) ? containers : [],
        paragraphs: Array.isArray(paragraphs) ? paragraphs : [],
        isCompleted: Boolean(isCompleted),
        activeParagraphId:
          typeof activeParagraphId === 'string' ? activeParagraphId : null,
        selectedParagraphIds: Array.isArray(selectedParagraphIds)
          ? selectedParagraphIds
          : [],
        isPreviewOpen: Boolean(isPreviewOpen),
      };
    } catch (error) {
      console.error('❌ [EXTRACTOR] 원시 데이터 추출 실패:', error);
      return null;
    }
  };

  // 추출된 데이터의 유효성을 검증하는 함수
  const validateExtractedData = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): boolean => {
    console.log('🔍 [EXTRACTOR] 추출된 데이터 검증');

    try {
      const isValidContainers = validateEditorContainers(containers);
      const isValidParagraphs = validateEditorParagraphs(paragraphs);

      const isValid = isValidContainers && isValidParagraphs;

      console.log('📊 [EXTRACTOR] 데이터 검증 결과:', {
        isValidContainers,
        isValidParagraphs,
        isValid,
      });

      return isValid;
    } catch (error) {
      console.error('❌ [EXTRACTOR] 데이터 검증 실패:', error);
      return false;
    }
  };

  // 완성된 콘텐츠를 생성하는 함수
  const generateCompletedContentSafely = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log('🔄 [EXTRACTOR] 완성된 콘텐츠 생성');

    try {
      if (containers.length === 0 || paragraphs.length === 0) {
        console.warn('⚠️ [EXTRACTOR] 데이터 부족으로 빈 콘텐츠 반환');
        return '';
      }

      const completedContent = generateCompletedContent(containers, paragraphs);
      const contentLength = completedContent?.length || 0;

      console.log('✅ [EXTRACTOR] 완성된 콘텐츠 생성 완료:', {
        contentLength,
      });

      return completedContent || '';
    } catch (error) {
      console.error('❌ [EXTRACTOR] 콘텐츠 생성 실패:', error);
      return '';
    }
  };

  // 메인 추출 함수
  const extractEditorState = (): EditorStateSnapshotForBridge | null => {
    console.log('🚀 [EXTRACTOR] 에디터 상태 추출 시작');

    const startTime = performance.now();

    try {
      // 1. 원시 데이터 추출
      const rawData = extractRawEditorData();
      if (!rawData) {
        console.error('❌ [EXTRACTOR] 원시 데이터 추출 실패');
        return null;
      }

      const {
        containers,
        paragraphs,
        isCompleted,
        activeParagraphId,
        selectedParagraphIds,
        isPreviewOpen,
      } = rawData;

      // 2. 데이터 검증
      const isValidData = validateExtractedData(containers, paragraphs);
      if (!isValidData) {
        console.error('❌ [EXTRACTOR] 데이터 검증 실패');
        return null;
      }

      // 3. 완성된 콘텐츠 생성
      const completedContent = generateCompletedContentSafely(
        containers,
        paragraphs
      );

      // 4. 스냅샷 생성
      const snapshot: EditorStateSnapshotForBridge = {
        editorContainers: containers,
        editorParagraphs: paragraphs,
        editorCompletedContent: completedContent,
        editorIsCompleted: isCompleted,
        editorActiveParagraphId: activeParagraphId,
        editorSelectedParagraphIds: selectedParagraphIds,
        editorIsPreviewOpen: isPreviewOpen,
        extractedTimestamp: Date.now(),
      };

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log('✅ [EXTRACTOR] 에디터 상태 추출 완료:', {
        duration: `${duration.toFixed(2)}ms`,
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
        contentLength: completedContent.length,
        isCompleted,
      });

      return snapshot;
    } catch (error) {
      console.error('❌ [EXTRACTOR] 에디터 상태 추출 중 예외:', error);
      return null;
    }
  };

  // 추출된 상태의 유효성을 검증하는 함수
  const validateExtractedState = (
    snapshot: EditorStateSnapshotForBridge | null
  ): boolean => {
    console.log('🔍 [EXTRACTOR] 추출된 상태 검증');

    if (!snapshot) {
      console.error('❌ [EXTRACTOR] 스냅샷이 null');
      return false;
    }

    try {
      const {
        editorContainers,
        editorParagraphs,
        editorCompletedContent,
        editorIsCompleted,
        extractedTimestamp,
      } = snapshot;

      // 기본 타입 검증
      const hasValidContainers = Array.isArray(editorContainers);
      const hasValidParagraphs = Array.isArray(editorParagraphs);
      const hasValidContent = typeof editorCompletedContent === 'string';
      const hasValidCompleted = typeof editorIsCompleted === 'boolean';
      const hasValidTimestamp =
        typeof extractedTimestamp === 'number' && extractedTimestamp > 0;

      // 데이터 구조 검증
      const hasValidStructure =
        hasValidContainers &&
        hasValidParagraphs &&
        validateExtractedData(editorContainers, editorParagraphs);

      const isValid =
        hasValidContainers &&
        hasValidParagraphs &&
        hasValidContent &&
        hasValidCompleted &&
        hasValidTimestamp &&
        hasValidStructure;

      console.log('📊 [EXTRACTOR] 상태 검증 결과:', {
        hasValidContainers,
        hasValidParagraphs,
        hasValidContent,
        hasValidCompleted,
        hasValidTimestamp,
        hasValidStructure,
        isValid,
      });

      return isValid;
    } catch (error) {
      console.error('❌ [EXTRACTOR] 상태 검증 실패:', error);
      return false;
    }
  };

  // 검증과 함께 상태를 추출하는 함수
  const getEditorStateWithValidation =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🔄 [EXTRACTOR] 검증과 함께 상태 추출');

      try {
        const snapshot = extractEditorState();

        if (!snapshot) {
          console.error('❌ [EXTRACTOR] 상태 추출 실패');
          return null;
        }

        const isValid = validateExtractedState(snapshot);

        if (!isValid) {
          console.error('❌ [EXTRACTOR] 추출된 상태가 유효하지 않음');
          return null;
        }

        console.log('✅ [EXTRACTOR] 검증된 상태 추출 완료');
        return snapshot;
      } catch (error) {
        console.error('❌ [EXTRACTOR] 검증된 상태 추출 실패:', error);
        return null;
      }
    };

  // 통계 정보를 포함한 상태 추출
  const extractEditorStateWithStatistics = () => {
    console.log('📊 [EXTRACTOR] 통계 정보와 함께 상태 추출');

    try {
      const snapshot = getEditorStateWithValidation();

      if (!snapshot) {
        return null;
      }

      const { editorContainers, editorParagraphs } = snapshot;
      const statistics = calculateEditorStatistics(
        editorContainers,
        editorParagraphs
      );

      return {
        snapshot,
        statistics,
      };
    } catch (error) {
      console.error('❌ [EXTRACTOR] 통계 포함 상태 추출 실패:', error);
      return null;
    }
  };

  return {
    extractEditorState,
    validateExtractedState,
    getEditorStateWithValidation,
    extractEditorStateWithStatistics,
    extractRawDataFromStore: extractRawEditorData,
    validateDataStructure: validateExtractedData,
    generateContentFromState: generateCompletedContentSafely,
  };
};
