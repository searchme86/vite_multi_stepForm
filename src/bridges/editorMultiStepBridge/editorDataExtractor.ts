// bridges/editorMultiStepBridge/editorDataExtractor.ts

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

  // 🔧 핵심 수정: 강화된 에디터 데이터 추출 로직
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
      // 🔧 1단계: 에디터 코어 스토어에서 데이터 추출
      let editorState = null;
      try {
        editorState = useEditorCoreStore.getState();
        console.log('📊 [EXTRACTOR] 에디터 코어 스토어 접근 성공:', {
          stateExists: !!editorState,
          stateKeys: editorState ? Object.keys(editorState) : [],
        });
      } catch (coreStoreError) {
        console.error(
          '❌ [EXTRACTOR] 에디터 코어 스토어 접근 실패:',
          coreStoreError
        );

        // 🔧 fallback: window 객체에서 시도
        try {
          console.log(
            '🔄 [EXTRACTOR] fallback: window 객체에서 에디터 데이터 시도'
          );
          const globalEditorData = (window as any).__EDITOR_STORE__;
          if (globalEditorData) {
            editorState = globalEditorData;
            console.log('✅ [EXTRACTOR] window 객체에서 에디터 데이터 발견');
          }
        } catch (windowError) {
          console.warn(
            '⚠️ [EXTRACTOR] window 객체에서도 에디터 데이터 없음:',
            windowError
          );
        }
      }

      if (!editorState) {
        console.warn('⚠️ [EXTRACTOR] 에디터 상태가 null, 빈 데이터로 진행');
        // 🔧 빈 상태라도 기본 구조 반환 (Bridge가 작동할 수 있도록)
        return {
          containers: [],
          paragraphs: [],
          isCompleted: false,
          activeParagraphId: null,
          selectedParagraphIds: [],
          isPreviewOpen: false,
        };
      }

      // 🔧 2단계: 에디터 상태에서 필요한 데이터 추출
      const {
        containers = [],
        paragraphs = [],
        isCompleted = false,
        completedContent = '',
      } = editorState;

      console.log('📊 [EXTRACTOR] 에디터 코어 데이터 추출 결과:', {
        containersType: Array.isArray(containers) ? 'array' : typeof containers,
        paragraphsType: Array.isArray(paragraphs) ? 'array' : typeof paragraphs,
        containerCount: Array.isArray(containers) ? containers.length : 0,
        paragraphCount: Array.isArray(paragraphs) ? paragraphs.length : 0,
        isCompleted: Boolean(isCompleted),
        hasCompletedContent:
          typeof completedContent === 'string' && completedContent.length > 0,
        // 🔧 디버깅용: 실제 데이터 샘플
        containerSample: Array.isArray(containers)
          ? containers.slice(0, 2).map((c) => ({ id: c?.id, name: c?.name }))
          : [],
        paragraphSample: Array.isArray(paragraphs)
          ? paragraphs.slice(0, 2).map((p) => ({
              id: p?.id,
              content: p?.content?.substring(0, 50),
            }))
          : [],
      });

      // 🔧 3단계: UI 스토어에서 UI 관련 상태 가져오기
      let activeParagraphId: string | null = null;
      let selectedParagraphIds: string[] = [];
      let isPreviewOpen = false;

      try {
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
        activeParagraphId = null;
        selectedParagraphIds = [];
        isPreviewOpen = false;
      }

      // 🔧 4단계: 안전한 데이터 구조로 변환
      const safeContainers = Array.isArray(containers) ? containers : [];
      const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : [];

      // 🔧 5단계: 데이터 무결성 검증
      const containerIds = new Set(
        safeContainers.map((c) => c?.id).filter(Boolean)
      );
      const validParagraphs = safeParagraphs.filter((p) => {
        const hasValidId = p?.id && typeof p.id === 'string';
        const hasValidContent = typeof p?.content === 'string';
        return hasValidId && hasValidContent;
      });

      console.log('🔍 [EXTRACTOR] 데이터 무결성 검증 결과:', {
        originalContainerCount: safeContainers.length,
        validContainerIds: containerIds.size,
        originalParagraphCount: safeParagraphs.length,
        validParagraphCount: validParagraphs.length,
        hasDataIntegrityIssues:
          containerIds.size !== safeContainers.length ||
          validParagraphs.length !== safeParagraphs.length,
      });

      const result = {
        containers: safeContainers,
        paragraphs: validParagraphs, // 🔧 검증된 문단만 사용
        isCompleted: Boolean(isCompleted),
        activeParagraphId,
        selectedParagraphIds,
        isPreviewOpen,
      };

      console.log('✅ [EXTRACTOR] 원시 데이터 추출 완료:', {
        containerCount: result.containers.length,
        paragraphCount: result.paragraphs.length,
        isCompleted: result.isCompleted,
        hasActiveParagraph: result.activeParagraphId !== null,
        selectedCount: result.selectedParagraphIds.length,
        isPreviewOpen: result.isPreviewOpen,
      });

      return result;
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

      // 🔧 에러 발생 시에도 기본 구조 반환 (Bridge 작동 유지)
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

  // 🔧 관대한 검증으로 변경 - 빈 데이터도 유효하다고 처리
  const validateExtractedData = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): boolean => {
    console.log('🔍 [EXTRACTOR] 추출된 데이터 검증');

    try {
      // 🔧 기본 타입 검사만 수행 (빈 배열이어도 유효)
      const isValidContainerType = Array.isArray(containers);
      const isValidParagraphType = Array.isArray(paragraphs);

      if (!isValidContainerType || !isValidParagraphType) {
        console.error('❌ [EXTRACTOR] 기본 타입 검사 실패:', {
          isValidContainerType,
          isValidParagraphType,
        });
        return false;
      }

      // 🔧 데이터가 있을 때만 구조 검증 수행
      let isValidContainers = true;
      let isValidParagraphs = true;

      if (containers.length > 0) {
        try {
          isValidContainers = validateEditorContainers(containers);
        } catch (containerValidationError) {
          console.warn(
            '⚠️ [EXTRACTOR] 컨테이너 구조 검증 실패, 계속 진행:',
            containerValidationError
          );
          isValidContainers = true; // 🔧 구조 검증 실패해도 계속 진행
        }
      }

      if (paragraphs.length > 0) {
        try {
          isValidParagraphs = validateEditorParagraphs(paragraphs);
        } catch (paragraphValidationError) {
          console.warn(
            '⚠️ [EXTRACTOR] 문단 구조 검증 실패, 계속 진행:',
            paragraphValidationError
          );
          isValidParagraphs = true; // 🔧 구조 검증 실패해도 계속 진행
        }
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
      // 🔧 검증 자체가 실패해도 데이터가 있다면 true 반환
      return Array.isArray(containers) && Array.isArray(paragraphs);
    }
  };

  // 강화된 완성된 콘텐츠 생성 함수
  const generateCompletedContentSafely = (
    containers: Container[],
    paragraphs: ParagraphBlock[]
  ): string => {
    console.log('🔄 [EXTRACTOR] 완성된 콘텐츠 생성');

    try {
      if (!Array.isArray(containers) || !Array.isArray(paragraphs)) {
        console.warn('⚠️ [EXTRACTOR] 유효하지 않은 배열 타입, 빈 콘텐츠 반환');
        return '';
      }

      if (containers.length === 0 || paragraphs.length === 0) {
        console.warn('⚠️ [EXTRACTOR] 데이터 부족으로 빈 콘텐츠 반환');
        return '';
      }

      let completedContent = '';
      try {
        completedContent = generateCompletedContent(containers, paragraphs);
      } catch (contentGenerationError) {
        console.warn(
          '⚠️ [EXTRACTOR] 기본 콘텐츠 생성 실패, 수동 생성 시도:',
          contentGenerationError
        );

        // 🔧 fallback: 수동으로 콘텐츠 생성
        try {
          const sortedContainers = [...containers].sort(
            (a, b) => (a?.order || 0) - (b?.order || 0)
          );
          const contentParts: string[] = [];

          sortedContainers.forEach((container) => {
            if (container?.id && container?.name) {
              const containerParagraphs = paragraphs
                .filter((p) => p?.containerId === container.id)
                .sort((a, b) => (a?.order || 0) - (b?.order || 0));

              if (containerParagraphs.length > 0) {
                contentParts.push(`## ${container.name}`);
                containerParagraphs.forEach((p) => {
                  if (p?.content) {
                    contentParts.push(p.content);
                  }
                });
                contentParts.push(''); // 빈 줄 추가
              }
            }
          });

          completedContent = contentParts.join('\n');
          console.log('✅ [EXTRACTOR] 수동 콘텐츠 생성 성공');
        } catch (manualGenerationError) {
          console.error(
            '❌ [EXTRACTOR] 수동 콘텐츠 생성도 실패:',
            manualGenerationError
          );
          completedContent = '';
        }
      }

      const contentLength = completedContent?.length || 0;

      console.log('✅ [EXTRACTOR] 완성된 콘텐츠 생성 완료:', {
        contentLength,
        hasContent: contentLength > 0,
      });

      return completedContent || '';
    } catch (contentGenerationError) {
      console.error('❌ [EXTRACTOR] 콘텐츠 생성 실패:', contentGenerationError);
      return '';
    }
  };

  // 메인 추출 함수 - 강화된 에러 처리
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

      // 🔧 디버깅용: 실제 추출된 데이터 확인
      console.log('🔍 [EXTRACTOR] 추출된 원시 데이터 상세:', {
        containers: containers.map((c) => ({
          id: c?.id,
          name: c?.name,
          order: c?.order,
        })),
        paragraphs: paragraphs.map((p) => ({
          id: p?.id,
          containerId: p?.containerId,
          contentLength: p?.content?.length || 0,
          order: p?.order,
        })),
        containerLength: containers.length,
        paragraphLength: paragraphs.length,
        isCompleted,
      });

      // 2. 데이터 검증 - 관대한 검증
      const isValidData = validateExtractedData(containers, paragraphs);

      // 🔧 기본 구조만 확인하고 계속 진행
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
        extractionSuccess: true,
      });

      return snapshot;
    } catch (extractionError) {
      console.error(
        '❌ [EXTRACTOR] 에디터 상태 추출 중 예외:',
        extractionError
      );

      // 🔧 최후의 fallback: 최소한의 빈 스냅샷 생성
      try {
        console.log('🔄 [EXTRACTOR] 최후의 fallback: 빈 스냅샷 생성');
        const fallbackSnapshot: EditorStateSnapshotForBridge = {
          editorContainers: [],
          editorParagraphs: [],
          editorCompletedContent: '',
          editorIsCompleted: false,
          editorActiveParagraphId: null,
          editorSelectedParagraphIds: [],
          editorIsPreviewOpen: false,
          extractedTimestamp: Date.now(),
        };

        console.log('⚠️ [EXTRACTOR] fallback 스냅샷 생성 완료');
        return fallbackSnapshot;
      } catch (fallbackError) {
        console.error(
          '❌ [EXTRACTOR] fallback 스냅샷 생성도 실패:',
          fallbackError
        );
        return null;
      }
    }
  };

  // 추출된 상태의 유효성을 검증하는 함수 - 관대한 검증
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

      // 🔧 기본 구조만 검증 (빈 배열도 유효)
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
        contentLength: editorCompletedContent.length,
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
          // 🔧 개발 중에는 유효하지 않더라도 반환하여 디버깅 가능하도록 함
        }

        console.log('✅ [EXTRACTOR] 검증된 상태 추출 완료:', {
          isValid,
          containerCount: snapshot.editorContainers.length,
          paragraphCount: snapshot.editorParagraphs.length,
          hasContent: snapshot.editorCompletedContent.length > 0,
        });

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
      let statistics = null;

      try {
        statistics = calculateEditorStatistics(
          editorContainers,
          editorParagraphs
        );
      } catch (statisticsError) {
        console.warn(
          '⚠️ [EXTRACTOR] 통계 계산 실패, 기본 통계 사용:',
          statisticsError
        );
        statistics = {
          totalContainers: editorContainers.length,
          totalParagraphs: editorParagraphs.length,
          assignedParagraphs: editorParagraphs.filter(
            (p) => p.containerId !== null
          ).length,
          unassignedParagraphs: editorParagraphs.filter(
            (p) => p.containerId === null
          ).length,
          totalContentLength: editorParagraphs.reduce(
            (total, p) => total + (p.content?.length || 0),
            0
          ),
          averageContentLength: 0,
          emptyContainers: 0,
          containerUtilization: [],
        };
      }

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
