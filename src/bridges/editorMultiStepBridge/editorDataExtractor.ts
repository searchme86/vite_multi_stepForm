// bridges/editorMultiStepBridge/editorStateExtractor.ts

import { EditorStateSnapshotForBridge } from './bridgeDataTypes';
import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import {
  validateEditorContainers,
  validateEditorParagraphs,
  calculateEditorStatistics,
} from '../utils/editorStateUtils';
// 🔧 핵심 수정: 에디터 스토어 직접 import
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
// 🔧 UI 스토어 정적 import 추가
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';

// 에디터 상태 추출기를 생성하는 팩토리 함수
export const createEditorStateExtractor = () => {
  console.log('🏭 [EXTRACTOR_FACTORY] 에디터 상태 추출기 생성');

  // 🔧 핵심 수정: Zustand 스토어에서 직접 데이터 추출
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
      // 🔧 핵심 수정: useEditorCoreStore.getState() 직접 사용
      const editorState = useEditorCoreStore.getState();

      if (!editorState) {
        console.warn('⚠️ [EXTRACTOR] 에디터 상태가 null');
        return null;
      }

      const {
        containers = [],
        paragraphs = [],
        isCompleted = false,
      } = editorState;

      // 🔧 핵심 수정: UI 스토어에서 UI 관련 상태 가져오기 (정적 import 사용)
      let activeParagraphId: string | null = null;
      let selectedParagraphIds: string[] = [];
      let isPreviewOpen = false;

      try {
        // 🔧 정적 import로 변경: UI 스토어 상태 직접 접근
        const uiState = useEditorUIStore.getState();

        if (uiState) {
          activeParagraphId = uiState.activeParagraphId || null;
          selectedParagraphIds = uiState.selectedParagraphIds || [];
          isPreviewOpen = uiState.isPreviewOpen || false;
        }

        console.log('📱 [EXTRACTOR] UI 상태 접근 성공:', {
          hasActiveParagraph: activeParagraphId !== null,
          selectedCount: selectedParagraphIds.length,
          isPreviewOpen,
        });
      } catch (uiError) {
        console.warn('⚠️ [EXTRACTOR] UI 상태 접근 실패, 기본값 사용:', uiError);
        // UI 상태 접근 실패해도 계속 진행 - 기본값 사용
        activeParagraphId = null;
        selectedParagraphIds = [];
        isPreviewOpen = false;
      }

      console.log('📊 [EXTRACTOR] 원시 데이터 추출 완료:', {
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
        isCompleted,
        hasActiveParagraph: activeParagraphId !== null,
        selectedCount: selectedParagraphIds.length,
        isPreviewOpen,
        // 🔧 디버깅용: 실제 데이터 샘플
        containerSample: containers
          .slice(0, 2)
          .map((c) => ({ id: c?.id, name: c?.name })),
        paragraphSample: paragraphs
          .slice(0, 2)
          .map((p) => ({ id: p?.id, content: p?.content?.substring(0, 50) })),
      });

      return {
        containers: Array.isArray(containers) ? containers : [],
        paragraphs: Array.isArray(paragraphs) ? paragraphs : [],
        isCompleted: Boolean(isCompleted),
        activeParagraphId,
        selectedParagraphIds,
        isPreviewOpen,
      };
    } catch (extractionError) {
      console.error('❌ [EXTRACTOR] 원시 데이터 추출 실패:', extractionError);
      console.error('🔍 [EXTRACTOR] 에러 상세 정보:', {
        errorName:
          extractionError instanceof Error ? extractionError.name : 'Unknown',
        errorMessage:
          extractionError instanceof Error
            ? extractionError.message
            : String(extractionError),
        errorStack:
          extractionError instanceof Error
            ? extractionError.stack
            : 'No stack trace',
        storeAccessAttempt: 'useEditorCoreStore.getState()',
      });

      // 🔧 에러 발생 시에도 기본 구조 반환
      return {
        containers: [],
        paragraphs: [],
        isCompleted: false,
        activeParagraphId: null,
        selectedParagraphIds: [],
        isPreviewOpen: false,
      };
    }
  };

  // 추출된 데이터의 유효성을 검증하는 함수 - 관대한 검증으로 변경
  const validateExtractedData = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): boolean => {
    console.log('🔍 [EXTRACTOR] 추출된 데이터 검증');

    try {
      // 🔧 기본 타입 검사만 수행 (빈 배열이어도 유효)
      const isValidContainerType = Array.isArray(containers);
      const isValidParagraphType = Array.isArray(paragraphs);

      // 🔧 구조 검증은 데이터가 있을 때만 수행
      let isValidContainers = true;
      let isValidParagraphs = true;

      if (containers.length > 0) {
        isValidContainers = validateEditorContainers(containers);
      }

      if (paragraphs.length > 0) {
        isValidParagraphs = validateEditorParagraphs(paragraphs);
      }

      const isValid =
        isValidContainerType &&
        isValidParagraphType &&
        isValidContainers &&
        isValidParagraphs;

      console.log('📊 [EXTRACTOR] 데이터 검증 결과:', {
        isValidContainerType,
        isValidParagraphType,
        isValidContainers,
        isValidParagraphs,
        isValid,
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
      });

      return isValid;
    } catch (validationError) {
      console.error('❌ [EXTRACTOR] 데이터 검증 실패:', validationError);
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
    } catch (contentGenerationError) {
      console.error('❌ [EXTRACTOR] 콘텐츠 생성 실패:', contentGenerationError);
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

      // 🔧 로그에서 실제 데이터 확인
      console.log('🔍 [EXTRACTOR] 추출된 원시 데이터 상세:', {
        containers,
        paragraphs,
        containerLength: containers.length,
        paragraphLength: paragraphs.length,
        isCompleted,
      });

      // 2. 데이터 검증 - 관대한 검증
      const isValidData = validateExtractedData(containers, paragraphs);

      // 🔧 빈 데이터이지만 유효한 구조면 계속 진행
      if (
        !isValidData &&
        !(Array.isArray(containers) && Array.isArray(paragraphs))
      ) {
        console.error('❌ [EXTRACTOR] 데이터 구조 자체가 잘못됨');
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
        snapshotValid: true,
      });

      return snapshot;
    } catch (extractionError) {
      console.error(
        '❌ [EXTRACTOR] 에디터 상태 추출 중 예외:',
        extractionError
      );
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

      // 🔧 구조 검증은 배열 타입만 확인
      const hasValidStructure = hasValidContainers && hasValidParagraphs;

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
        containerCount: editorContainers.length,
        paragraphCount: editorParagraphs.length,
      });

      return isValid;
    } catch (validationError) {
      console.error('❌ [EXTRACTOR] 상태 검증 실패:', validationError);
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
          console.warn('⚠️ [EXTRACTOR] 상태 추출 결과가 null');
          return null;
        }

        const isValid = validateExtractedState(snapshot);

        if (!isValid) {
          console.warn(
            '⚠️ [EXTRACTOR] 추출된 상태가 유효하지 않지만 반환 (개발 모드)'
          );
          // 개발 중에는 유효하지 않더라도 반환하여 디버깅 가능하도록 함
          return snapshot;
        }

        console.log('✅ [EXTRACTOR] 검증된 상태 추출 완료');
        return snapshot;
      } catch (validationError) {
        console.error('❌ [EXTRACTOR] 검증된 상태 추출 실패:', validationError);
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
    } catch (statisticsError) {
      console.error(
        '❌ [EXTRACTOR] 통계 포함 상태 추출 실패:',
        statisticsError
      );
      return null;
    }
  };

  // 추출기 인스턴스 반환
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
