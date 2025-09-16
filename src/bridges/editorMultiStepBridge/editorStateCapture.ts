// bridges/editorMultiStepBridge/editorStateCapture.ts

import type {
  EditorStateSnapshotForBridge,
  SnapshotMetadata,
  ValidationResult,
} from './modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';

// 🔧 에디터 상태 인터페이스 정의
interface EditorCoreSnapshot {
  readonly containers: readonly Container[];
  readonly paragraphs: readonly ParagraphBlock[];
  readonly isCompleted: boolean;
  readonly completedContent: string;
}

interface EditorUISnapshot {
  readonly activeParagraphId: string | null;
  readonly selectedParagraphIds: readonly string[];
  readonly isPreviewOpen: boolean;
}

interface RawEditorData {
  readonly coreData: EditorCoreSnapshot;
  readonly uiData: EditorUISnapshot;
  readonly extractionTimestamp: number;
}

// 🔧 안전한 타입 변환 유틸리티
function createSafeTypeConverter() {
  const convertToSafeString = (
    value: unknown,
    fallbackValue: string
  ): string => {
    return typeof value === 'string' ? value : fallbackValue;
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallbackValue: boolean
  ): boolean => {
    return typeof value === 'boolean' ? value : fallbackValue;
  };

  const convertToSafeNumber = (
    value: unknown,
    fallbackValue: number
  ): number => {
    return typeof value === 'number' && !Number.isNaN(value)
      ? value
      : fallbackValue;
  };

  const convertToSafeArray = <T>(
    value: unknown,
    validator: (item: unknown) => item is T
  ): T[] => {
    return Array.isArray(value) ? value.filter(validator) : [];
  };

  return {
    convertToSafeString,
    convertToSafeBoolean,
    convertToSafeNumber,
    convertToSafeArray,
  };
}

// 🔧 타입 가드 모듈
function createTypeGuardModule() {
  const isValidContainer = (candidate: unknown): candidate is Container => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const containerObj = candidate;
    const hasRequiredProperties =
      'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(containerObj, 'id');
    const nameValue = Reflect.get(containerObj, 'name');
    const orderValue = Reflect.get(containerObj, 'order');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof nameValue === 'string' &&
      typeof orderValue === 'number';

    return hasValidTypes && idValue.length > 0 && nameValue.length > 0;
  };

  const isValidParagraph = (
    candidate: unknown
  ): candidate is ParagraphBlock => {
    const isValidObject = candidate !== null && typeof candidate === 'object';
    if (!isValidObject) {
      return false;
    }

    const paragraphObj = candidate;
    const hasRequiredProperties =
      'id' in paragraphObj &&
      'content' in paragraphObj &&
      'order' in paragraphObj &&
      'containerId' in paragraphObj;

    if (!hasRequiredProperties) {
      return false;
    }

    const idValue = Reflect.get(paragraphObj, 'id');
    const contentValue = Reflect.get(paragraphObj, 'content');
    const orderValue = Reflect.get(paragraphObj, 'order');
    const containerIdValue = Reflect.get(paragraphObj, 'containerId');

    const hasValidTypes =
      typeof idValue === 'string' &&
      typeof contentValue === 'string' &&
      typeof orderValue === 'number' &&
      (containerIdValue === null || typeof containerIdValue === 'string');

    return hasValidTypes && idValue.length > 0;
  };

  const isValidStoreState = (
    candidate: unknown
  ): candidate is Record<string, unknown> => {
    return (
      candidate !== null &&
      typeof candidate === 'object' &&
      !Array.isArray(candidate)
    );
  };

  return {
    isValidContainer,
    isValidParagraph,
    isValidStoreState,
  };
}

// 🔧 스토어 접근 모듈
function createStoreAccessModule() {
  const { isValidStoreState } = createTypeGuardModule();
  const { convertToSafeString, convertToSafeBoolean, convertToSafeArray } =
    createSafeTypeConverter();

  const extractCoreData = (): EditorCoreSnapshot | null => {
    console.log('🔍 [CAPTURE] 코어 스토어 데이터 추출 시작');

    try {
      const coreState = useEditorCoreStore.getState();

      // Early Return: 스토어 상태가 없는 경우
      if (!coreState || !isValidStoreState(coreState)) {
        console.error('❌ [CAPTURE] 유효하지 않은 코어 스토어 상태');
        return null;
      }

      // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
      const {
        containers: rawContainers = [],
        paragraphs: rawParagraphs = [],
        isCompleted: rawIsCompleted = false,
        completedContent: rawCompletedContent = '',
      } = coreState;

      const validContainers = convertToSafeArray(
        rawContainers,
        createTypeGuardModule().isValidContainer
      );
      const validParagraphs = convertToSafeArray(
        rawParagraphs,
        createTypeGuardModule().isValidParagraph
      );
      const safeIsCompleted = convertToSafeBoolean(rawIsCompleted, false);
      const safeCompletedContent = convertToSafeString(rawCompletedContent, '');

      const coreSnapshot: EditorCoreSnapshot = {
        containers: validContainers,
        paragraphs: validParagraphs,
        isCompleted: safeIsCompleted,
        completedContent: safeCompletedContent,
      };

      console.log('✅ [CAPTURE] 코어 데이터 추출 완료:', {
        containerCount: validContainers.length,
        paragraphCount: validParagraphs.length,
        isCompleted: safeIsCompleted,
        contentLength: safeCompletedContent.length,
      });

      return coreSnapshot;
    } catch (extractionError) {
      console.error('❌ [CAPTURE] 코어 데이터 추출 실패:', extractionError);
      return null;
    }
  };

  const extractUIData = (): EditorUISnapshot => {
    console.log('🔍 [CAPTURE] UI 스토어 데이터 추출 시작');

    const defaultUISnapshot: EditorUISnapshot = {
      activeParagraphId: null,
      selectedParagraphIds: [],
      isPreviewOpen: false,
    };

    try {
      const uiState = useEditorUIStore.getState();

      // Early Return: UI 스토어 상태가 없는 경우
      if (!uiState || !isValidStoreState(uiState)) {
        console.warn('⚠️ [CAPTURE] UI 스토어 상태 없음, 기본값 사용');
        return defaultUISnapshot;
      }

      // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
      const {
        activeParagraphId: rawActiveParagraphId = null,
        selectedParagraphIds: rawSelectedParagraphIds = [],
        isPreviewOpen: rawIsPreviewOpen = false,
      } = uiState;

      const safeActiveParagraphId =
        typeof rawActiveParagraphId === 'string' ? rawActiveParagraphId : null;

      const safeSelectedParagraphIds = Array.isArray(rawSelectedParagraphIds)
        ? rawSelectedParagraphIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : [];

      const safeIsPreviewOpen = convertToSafeBoolean(rawIsPreviewOpen, false);

      const uiSnapshot: EditorUISnapshot = {
        activeParagraphId: safeActiveParagraphId,
        selectedParagraphIds: safeSelectedParagraphIds,
        isPreviewOpen: safeIsPreviewOpen,
      };

      console.log('✅ [CAPTURE] UI 데이터 추출 완료:', {
        hasActiveParagraph: Boolean(safeActiveParagraphId),
        selectedCount: safeSelectedParagraphIds.length,
        isPreviewOpen: safeIsPreviewOpen,
      });

      return uiSnapshot;
    } catch (extractionError) {
      console.error(
        '❌ [CAPTURE] UI 데이터 추출 실패, 기본값 사용:',
        extractionError
      );
      return defaultUISnapshot;
    }
  };

  const extractRawEditorData = (): RawEditorData | null => {
    console.log('🚀 [CAPTURE] 전체 에디터 데이터 추출 시작');
    const extractionStartTime = performance.now();

    const coreData = extractCoreData();

    // Early Return: 코어 데이터가 없는 경우
    if (!coreData) {
      console.error('❌ [CAPTURE] 코어 데이터 추출 실패로 전체 추출 중단');
      return null;
    }

    const uiData = extractUIData();
    const extractionTimestamp = Date.now();

    const rawData: RawEditorData = {
      coreData,
      uiData,
      extractionTimestamp,
    };

    const extractionEndTime = performance.now();
    const extractionDuration = extractionEndTime - extractionStartTime;

    console.log('✅ [CAPTURE] 전체 에디터 데이터 추출 완료:', {
      duration: `${extractionDuration.toFixed(2)}ms`,
      timestamp: extractionTimestamp,
    });

    return rawData;
  };

  return {
    extractCoreData,
    extractUIData,
    extractRawEditorData,
  };
}

// 🔧 데이터 검증 모듈
function createDataValidationModule() {
  const validateExtractedData = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): ValidationResult => {
    console.log('🔍 [CAPTURE] 추출된 데이터 검증 시작');

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const errorDetails = new Map<string, string>();
    const validationMetrics = new Map<string, number>();
    const validationFlags = new Set<string>();

    // Early Return: 배열 타입 검증
    if (!Array.isArray(containers)) {
      const errorMessage = '컨테이너가 배열 타입이 아닙니다';
      validationErrors.push(errorMessage);
      errorDetails.set('containerType', errorMessage);
      return createValidationFailure(
        validationErrors,
        validationWarnings,
        errorDetails,
        validationMetrics,
        validationFlags
      );
    }

    if (!Array.isArray(paragraphs)) {
      const errorMessage = '문단이 배열 타입이 아닙니다';
      validationErrors.push(errorMessage);
      errorDetails.set('paragraphType', errorMessage);
      return createValidationFailure(
        validationErrors,
        validationWarnings,
        errorDetails,
        validationMetrics,
        validationFlags
      );
    }

    // 기본 통계 수집
    const containerCount = containers.length;
    const paragraphCount = paragraphs.length;
    const assignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId !== null
    );
    const unassignedParagraphs = paragraphs.filter(
      ({ containerId }) => containerId === null
    );

    validationMetrics.set('containerCount', containerCount);
    validationMetrics.set('paragraphCount', paragraphCount);
    validationMetrics.set('assignedParagraphCount', assignedParagraphs.length);
    validationMetrics.set(
      'unassignedParagraphCount',
      unassignedParagraphs.length
    );

    // 최소 데이터 검증
    const hasMinimumContent = containerCount > 0 || paragraphCount > 0;
    const hasRequiredStructure = hasMinimumContent;

    // 경고 조건 검사
    const hasNoContainers = containerCount === 0;
    const hasNoParagraphs = paragraphCount === 0;
    const hasUnassignedParagraphs = unassignedParagraphs.length > 0;

    hasNoContainers ? validationWarnings.push('컨테이너가 없습니다') : null;
    hasNoParagraphs ? validationWarnings.push('문단이 없습니다') : null;
    hasUnassignedParagraphs
      ? validationWarnings.push(
          `${unassignedParagraphs.length}개의 문단이 할당되지 않았습니다`
        )
      : null;

    // 플래그 설정
    hasMinimumContent
      ? validationFlags.add('HAS_CONTENT')
      : validationFlags.add('EMPTY_DATA');
    hasRequiredStructure
      ? validationFlags.add('VALID_STRUCTURE')
      : validationFlags.add('INVALID_STRUCTURE');

    const validationResult: ValidationResult = {
      isValidForTransfer: hasRequiredStructure,
      validationErrors,
      validationWarnings,
      hasMinimumContent,
      hasRequiredStructure,
      errorDetails,
      validationMetrics,
      validationFlags,
    };

    console.log('✅ [CAPTURE] 데이터 검증 완료:', {
      isValid: hasRequiredStructure,
      containerCount,
      paragraphCount,
      errorCount: validationErrors.length,
      warningCount: validationWarnings.length,
    });

    return validationResult;
  };

  const createValidationFailure = (
    errors: string[],
    warnings: string[],
    details: Map<string, string>,
    metrics: Map<string, number>,
    flags: Set<string>
  ): ValidationResult => {
    return {
      isValidForTransfer: false,
      validationErrors: errors,
      validationWarnings: warnings,
      hasMinimumContent: false,
      hasRequiredStructure: false,
      errorDetails: details,
      validationMetrics: metrics,
      validationFlags: flags,
    };
  };

  return {
    validateExtractedData,
  };
}

// 🔧 콘텐츠 생성 모듈
function createContentGenerationModule() {
  const generateContentFromData = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): string => {
    console.log('🔄 [CAPTURE] 콘텐츠 생성 시작');

    // Early Return: 데이터가 없는 경우
    const hasNoData = containers.length === 0 && paragraphs.length === 0;
    if (hasNoData) {
      console.warn('⚠️ [CAPTURE] 생성할 데이터가 없음, 빈 콘텐츠 반환');
      return '';
    }

    try {
      // 기본 콘텐츠 생성 시도
      const generatedContent = generateCompletedContent(
        [...containers],
        [...paragraphs]
      );

      console.log('✅ [CAPTURE] 기본 콘텐츠 생성 성공:', {
        contentLength: generatedContent.length,
      });

      return generatedContent;
    } catch (contentError) {
      console.warn(
        '⚠️ [CAPTURE] 기본 콘텐츠 생성 실패, 수동 생성 시도:',
        contentError
      );
      return generateFallbackContent(containers, paragraphs);
    }
  };

  const generateFallbackContent = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): string => {
    console.log('🔄 [CAPTURE] 수동 콘텐츠 생성 시작');

    try {
      const sortedContainers = [...containers].sort(
        (a, b) => a.order - b.order
      );
      const contentParts: string[] = [];

      sortedContainers.forEach((container) => {
        const { id: containerId, name: containerName } = container;

        // 해당 컨테이너의 문단들 찾기
        const containerParagraphs = paragraphs
          .filter(
            ({ containerId: paragraphContainerId }) =>
              paragraphContainerId === containerId
          )
          .sort((a, b) => a.order - b.order);

        const hasValidParagraphs = containerParagraphs.length > 0;
        if (hasValidParagraphs) {
          contentParts.push(`## ${containerName}`);

          containerParagraphs.forEach(({ content }) => {
            const hasValidContent = content && content.trim().length > 0;
            hasValidContent ? contentParts.push(content.trim()) : null;
          });

          contentParts.push('');
        }
      });

      // 할당되지 않은 문단들 추가
      const unassignedParagraphs = paragraphs
        .filter(({ containerId }) => containerId === null)
        .sort((a, b) => a.order - b.order);

      unassignedParagraphs.forEach(({ content }) => {
        const hasValidContent = content && content.trim().length > 0;
        hasValidContent ? contentParts.push(content.trim()) : null;
      });

      const fallbackContent = contentParts.join('\n');

      console.log('✅ [CAPTURE] 수동 콘텐츠 생성 완료:', {
        contentLength: fallbackContent.length,
      });

      return fallbackContent;
    } catch (fallbackError) {
      console.error('❌ [CAPTURE] 수동 콘텐츠 생성도 실패:', fallbackError);
      return '';
    }
  };

  return {
    generateContentFromData,
  };
}

// 🔧 스냅샷 생성 모듈
function createSnapshotGenerationModule() {
  const { extractRawEditorData } = createStoreAccessModule();
  const { validateExtractedData } = createDataValidationModule();
  const { generateContentFromData } = createContentGenerationModule();

  const createEditorStateSnapshot = (): EditorStateSnapshotForBridge | null => {
    console.log('🚀 [CAPTURE] 에디터 상태 스냅샷 생성 시작');
    const snapshotStartTime = performance.now();

    try {
      const rawData = extractRawEditorData();

      // Early Return: 원시 데이터가 없는 경우
      if (!rawData) {
        console.error('❌ [CAPTURE] 원시 데이터 추출 실패');
        return null;
      }

      const { coreData, uiData, extractionTimestamp } = rawData;
      const { containers, paragraphs, isCompleted } = coreData;
      const { activeParagraphId, selectedParagraphIds, isPreviewOpen } = uiData;

      // 데이터 검증
      const validationResult = validateExtractedData(containers, paragraphs);
      const { isValidForTransfer, validationWarnings } = validationResult;

      // 콘텐츠 생성
      const completedContent = generateContentFromData(containers, paragraphs);

      // 메타데이터 생성
      const snapshotEndTime = performance.now();
      const processingDuration = snapshotEndTime - snapshotStartTime;

      const additionalMetrics = new Map<string, number>();
      additionalMetrics.set('containerCount', containers.length);
      additionalMetrics.set('paragraphCount', paragraphs.length);
      additionalMetrics.set('contentLength', completedContent.length);

      const processingFlags = new Set<string>();
      processingFlags.add('SNAPSHOT_GENERATED');
      isValidForTransfer
        ? processingFlags.add('VALIDATION_PASSED')
        : processingFlags.add('VALIDATION_FAILED');

      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp,
        processingDurationMs: processingDuration,
        validationStatus: isValidForTransfer,
        dataIntegrity: completedContent.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
        additionalMetrics,
        processingFlags,
      };

      // 최종 스냅샷 구성
      const contentStatistics = new Map<string, number>();
      contentStatistics.set('totalContainers', containers.length);
      contentStatistics.set('totalParagraphs', paragraphs.length);
      contentStatistics.set('totalContentLength', completedContent.length);

      const validationCache = new Map<string, boolean>();
      validationCache.set('structureValid', isValidForTransfer);
      validationCache.set('hasContent', completedContent.length > 0);

      const editorSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: containers,
        editorParagraphs: paragraphs,
        editorCompletedContent: completedContent,
        editorIsCompleted: isCompleted,
        editorActiveParagraphId: activeParagraphId,
        editorSelectedParagraphIds: selectedParagraphIds,
        editorIsPreviewOpen: isPreviewOpen,
        extractedTimestamp: extractionTimestamp,
        snapshotMetadata,
        contentStatistics,
        validationCache,
      };

      console.log('✅ [CAPTURE] 에디터 상태 스냅샷 생성 완료:', {
        containerCount: containers.length,
        paragraphCount: paragraphs.length,
        contentLength: completedContent.length,
        isCompleted,
        isValid: isValidForTransfer,
        warningCount: validationWarnings.length,
        duration: `${processingDuration.toFixed(2)}ms`,
      });

      return editorSnapshot;
    } catch (snapshotError) {
      console.error('❌ [CAPTURE] 스냅샷 생성 실패:', snapshotError);
      return createFallbackSnapshot();
    }
  };

  const createFallbackSnapshot = (): EditorStateSnapshotForBridge => {
    console.log('🔄 [CAPTURE] 폴백 스냅샷 생성');

    const fallbackMetrics = new Map<string, number>();
    fallbackMetrics.set('fallbackGenerated', 1);

    const fallbackFlags = new Set<string>();
    fallbackFlags.add('FALLBACK_MODE');

    const fallbackMetadata: SnapshotMetadata = {
      extractionTimestamp: Date.now(),
      processingDurationMs: 0,
      validationStatus: false,
      dataIntegrity: false,
      sourceInfo: {
        coreStoreVersion: '1.0.0-fallback',
        uiStoreVersion: '1.0.0-fallback',
      },
      additionalMetrics: fallbackMetrics,
      processingFlags: fallbackFlags,
    };

    return {
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      editorIsCompleted: false,
      editorActiveParagraphId: null,
      editorSelectedParagraphIds: [],
      editorIsPreviewOpen: false,
      extractedTimestamp: Date.now(),
      snapshotMetadata: fallbackMetadata,
      contentStatistics: new Map(),
      validationCache: new Map(),
    };
  };

  return {
    createEditorStateSnapshot,
  };
}

// 🔧 메인 팩토리 함수
export function createEditorStateExtractor() {
  console.log('🏭 [EXTRACTOR_FACTORY] 에디터 상태 추출기 생성 시작');

  const { validateExtractedData } = createDataValidationModule();
  const { generateContentFromData } = createContentGenerationModule();
  const { createEditorStateSnapshot } = createSnapshotGenerationModule();

  // 검증된 상태 추출 함수
  const getEditorStateWithValidation =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🔄 [CAPTURE] 검증된 상태 추출 시작');

      const snapshot = createEditorStateSnapshot();

      // Early Return: 스냅샷이 없는 경우
      if (!snapshot) {
        console.warn('⚠️ [CAPTURE] 스냅샷 생성 실패');
        return null;
      }

      const { validationCache } = snapshot;
      const isStructureValid = validationCache.get('structureValid') ?? false;

      console.log('✅ [CAPTURE] 검증된 상태 추출 완료:', {
        isValid: isStructureValid,
        containerCount: snapshot.editorContainers.length,
        paragraphCount: snapshot.editorParagraphs.length,
      });

      return snapshot;
    };

  // 컨테이너와 문단 추출 함수
  const extractContainersAndParagraphs = (): {
    containers: Container[];
    paragraphs: ParagraphBlock[];
  } => {
    console.log('🔍 [CAPTURE] 컨테이너와 문단 추출 시작');

    const snapshot = getEditorStateWithValidation();

    // Early Return: 스냅샷이 없는 경우
    if (!snapshot) {
      console.warn('⚠️ [CAPTURE] 스냅샷이 없어 빈 데이터 반환');
      return { containers: [], paragraphs: [] };
    }

    const { editorContainers, editorParagraphs } = snapshot;
    const containers = [...editorContainers];
    const paragraphs = [...editorParagraphs];

    console.log('✅ [CAPTURE] 컨테이너와 문단 추출 완료:', {
      containerCount: containers.length,
      paragraphCount: paragraphs.length,
    });

    return { containers, paragraphs };
  };

  console.log('✅ [EXTRACTOR_FACTORY] 에디터 상태 추출기 생성 완료');

  return {
    getEditorStateWithValidation,
    extractContainersAndParagraphs,
    generateContentFromData,
    validateDataStructure: validateExtractedData,
  };
}

console.log('🏗️ [EDITOR_STATE_CAPTURE] 에디터 상태 캡처 모듈 초기화 완료');
console.log('📊 [EDITOR_STATE_CAPTURE] 제공 기능:', {
  stateCapture: '에디터 상태 스냅샷 생성',
  dataValidation: '추출 데이터 검증',
  contentGeneration: '콘텐츠 자동 생성',
  typeGuards: '완전한 타입 안전성',
});
console.log('✅ [EDITOR_STATE_CAPTURE] 모든 캡처 기능 준비 완료');
