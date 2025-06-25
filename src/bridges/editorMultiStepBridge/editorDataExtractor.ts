// bridges/editorMultiStepBridge/editorDataExtractor.ts

import {
  EditorStateSnapshotForBridge,
  SnapshotMetadata,
} from './bridgeDataTypes';
import { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import {
  validateEditorContainers,
  validateEditorParagraphs,
  calculateEditorStatistics,
} from '../utils/editorStateUtils';
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';

// 🔧 수정: EditorCoreStateData 인터페이스 수정하여 인덱스 시그니처 추가
interface EditorCoreStateData {
  readonly containers?: readonly Container[];
  readonly paragraphs?: readonly ParagraphBlock[];
  readonly isCompleted?: boolean;
  readonly completedContent?: string;
  readonly [key: string]: unknown; // 인덱스 시그니처 추가
}

interface EditorUIStateData {
  readonly activeParagraphId?: string | null;
  readonly selectedParagraphIds?: readonly string[];
  readonly isPreviewOpen?: boolean;
}

interface RawEditorExtractedData {
  readonly containerList: readonly Container[];
  readonly paragraphList: readonly ParagraphBlock[];
  readonly completionStatus: boolean;
  readonly activeParagraphId: string | null;
  readonly selectedParagraphIdList: readonly string[];
  readonly previewOpenStatus: boolean;
}

interface ValidationResultDataInfo {
  readonly isValid: boolean;
  readonly containerCount: number;
  readonly paragraphCount: number;
}

// 🔧 P1-4: 강화된 타입 가드 모듈
function createExtractorTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  const isValidDate = (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidArray,
    isValidDate,
  };
}

// 🔧 P1-5: 에러 처리 강화 모듈
function createExtractorErrorHandlerModule() {
  const { isValidString } = createExtractorTypeGuardModule();

  const safelyExecuteExtraction = <T>(
    extractionOperation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      return extractionOperation();
    } catch (extractionError) {
      console.error(
        `❌ [EXTRACTOR] ${operationName} 실행 실패:`,
        extractionError
      );
      return fallbackValue;
    }
  };

  const extractSafeErrorMessage = (error: unknown): string => {
    // Early Return: Error 인스턴스인 경우
    if (error instanceof Error) {
      return error.message;
    }

    // Early Return: 문자열인 경우
    if (isValidString(error)) {
      return error;
    }

    // 안전한 문자열 변환
    try {
      return String(error);
    } catch (conversionError) {
      console.warn('⚠️ [EXTRACTOR] 에러 메시지 변환 실패:', conversionError);
      return 'Unknown extraction error';
    }
  };

  return {
    safelyExecuteExtraction,
    extractSafeErrorMessage,
  };
}

function createPropertyValidationModule() {
  const { isValidString, isValidNumber } = createExtractorTypeGuardModule();

  const hasValidStringProperty = (
    targetObject: Record<string, unknown>,
    propertyName: string
  ): boolean => {
    // Early Return: 속성이 없는 경우
    if (!(propertyName in targetObject)) {
      return false;
    }

    // Early Return: 자체 속성이 아닌 경우
    if (!Object.prototype.hasOwnProperty.call(targetObject, propertyName)) {
      return false;
    }

    const propertyValue = targetObject[propertyName];

    // Early Return: 문자열이 아닌 경우
    if (!isValidString(propertyValue)) {
      return false;
    }

    return propertyValue.trim().length > 0;
  };

  const hasValidNumberProperty = (
    targetObject: Record<string, unknown>,
    propertyName: string
  ): boolean => {
    // Early Return: 속성이 없는 경우
    if (!(propertyName in targetObject)) {
      return false;
    }

    const propertyValue = targetObject[propertyName];

    // Early Return: 숫자가 아니거나 NaN인 경우
    if (!isValidNumber(propertyValue)) {
      return false;
    }

    return propertyValue >= 0;
  };

  return {
    hasValidStringProperty,
    hasValidNumberProperty,
  };
}

function createEditorTypeGuardModule() {
  const { hasValidStringProperty, hasValidNumberProperty } =
    createPropertyValidationModule();
  const { isValidObject, isValidArray } = createExtractorTypeGuardModule();

  const isValidContainer = (
    candidateContainer: unknown
  ): candidateContainer is Container => {
    // Early Return: 유효한 객체가 아닌 경우
    if (!isValidObject(candidateContainer)) {
      return false;
    }

    // 필수 속성들 검증
    const hasValidId = hasValidStringProperty(candidateContainer, 'id');
    const hasValidName = hasValidStringProperty(candidateContainer, 'name');
    const hasValidOrder = hasValidNumberProperty(candidateContainer, 'order');

    return hasValidId && hasValidName && hasValidOrder;
  };

  const isValidParagraph = (
    candidateParagraph: unknown
  ): candidateParagraph is ParagraphBlock => {
    // Early Return: 유효한 객체가 아닌 경우
    if (!isValidObject(candidateParagraph)) {
      return false;
    }

    // 필수 속성들 검증
    const hasValidId = hasValidStringProperty(candidateParagraph, 'id');
    const hasValidOrder = hasValidNumberProperty(candidateParagraph, 'order');

    // content 속성은 빈 문자열도 허용
    const hasContentProperty = 'content' in candidateParagraph;
    const contentValue = candidateParagraph['content'];
    const hasValidContent = typeof contentValue === 'string';

    // containerId는 null 또는 유효한 문자열이어야 함
    const hasContainerIdProperty = 'containerId' in candidateParagraph;
    const containerIdValue = candidateParagraph['containerId'];
    const hasValidContainerId =
      containerIdValue === null ||
      (typeof containerIdValue === 'string' &&
        containerIdValue.trim().length > 0);

    return (
      hasValidId &&
      hasValidOrder &&
      hasContentProperty &&
      hasValidContent &&
      hasContainerIdProperty &&
      hasValidContainerId
    );
  };

  const isEditorStoreStateObject = (
    candidateState: unknown
  ): candidateState is Record<string, unknown> => {
    return isValidObject(candidateState);
  };

  const isEditorCoreState = (
    candidateState: Record<string, unknown>
  ): candidateState is EditorCoreStateData => {
    // containers 속성 검증
    const hasContainersProperty = 'containers' in candidateState;
    const containersValue = hasContainersProperty
      ? candidateState['containers']
      : undefined;
    const hasValidContainers =
      containersValue === undefined || isValidArray(containersValue);

    // Early Return: 유효하지 않은 컨테이너인 경우
    if (!hasValidContainers) {
      return false;
    }

    // paragraphs 속성 검증
    const hasParagraphsProperty = 'paragraphs' in candidateState;
    const paragraphsValue = hasParagraphsProperty
      ? candidateState['paragraphs']
      : undefined;
    const hasValidParagraphs =
      paragraphsValue === undefined || isValidArray(paragraphsValue);

    return hasValidParagraphs;
  };

  return {
    isValidContainer,
    isValidParagraph,
    isEditorStoreStateObject,
    isEditorCoreState,
  };
}

function createStoreAccessModule() {
  const {
    isEditorStoreStateObject,
    isEditorCoreState,
    isValidContainer,
    isValidParagraph,
  } = createEditorTypeGuardModule();
  const { safelyExecuteExtraction } = createExtractorErrorHandlerModule();

  const extractCoreState = (): EditorCoreStateData | null => {
    return safelyExecuteExtraction(
      () => {
        const coreStoreState = useEditorCoreStore.getState();

        // Early Return: null 상태인 경우
        if (!coreStoreState) {
          console.warn('⚠️ [EXTRACTOR] 코어 스토어 상태 없음');
          return null;
        }

        // Early Return: 유효하지 않은 스토어 객체인 경우
        if (!isEditorStoreStateObject(coreStoreState)) {
          console.warn('⚠️ [EXTRACTOR] 유효하지 않은 스토어 객체');
          return null;
        }

        // Early Return: 유효하지 않은 코어 상태인 경우
        if (!isEditorCoreState(coreStoreState)) {
          console.warn('⚠️ [EXTRACTOR] 유효하지 않은 코어 상태');
          return null;
        }

        console.log('✅ [EXTRACTOR] 코어 상태 추출 성공');
        return coreStoreState;
      },
      null,
      'CORE_STATE_EXTRACTION'
    );
  };

  const extractUIState = (): EditorUIStateData => {
    return safelyExecuteExtraction(
      () => {
        const uiStoreState = useEditorUIStore.getState();

        // Early Return: null 상태인 경우
        if (!uiStoreState) {
          console.warn('⚠️ [EXTRACTOR] UI 상태 없음, 기본값 사용');
          return createDefaultUIState();
        }

        // Early Return: 유효하지 않은 스토어 객체인 경우
        if (!isEditorStoreStateObject(uiStoreState)) {
          console.warn('⚠️ [EXTRACTOR] UI 상태 객체 타입 오류, 기본값 사용');
          return createDefaultUIState();
        }

        // 🔧 P1-3: 구조분해할당으로 안전한 속성 추출
        const {
          activeParagraphId: rawActiveParagraphId,
          selectedParagraphIds: rawSelectedParagraphIds,
          isPreviewOpen: rawIsPreviewOpen,
        } = uiStoreState;

        const safeActiveParagraphId =
          typeof rawActiveParagraphId === 'string'
            ? rawActiveParagraphId
            : null;
        const safeSelectedParagraphIds = Array.isArray(rawSelectedParagraphIds)
          ? rawSelectedParagraphIds
          : [];
        const safeIsPreviewOpen = Boolean(rawIsPreviewOpen);

        console.log('✅ [EXTRACTOR] UI 상태 추출 성공');

        // 🔧 수정: 인터페이스와 일치하는 속성명 사용
        return {
          activeParagraphId: safeActiveParagraphId,
          selectedParagraphIds: safeSelectedParagraphIds,
          isPreviewOpen: safeIsPreviewOpen,
        };
      },
      createDefaultUIState(),
      'UI_STATE_EXTRACTION'
    );
  };

  const createDefaultUIState = (): EditorUIStateData => ({
    activeParagraphId: null,
    selectedParagraphIds: [],
    isPreviewOpen: false,
  });

  const extractRawEditorData = (): RawEditorExtractedData | null => {
    console.log('🔍 [EXTRACTOR] 원시 에디터 데이터 추출 시작');

    return safelyExecuteExtraction(
      () => {
        const coreState = extractCoreState();

        // Early Return: 코어 상태가 null인 경우
        if (!coreState) {
          console.warn('⚠️ [EXTRACTOR] 코어 상태 없음, 기본 데이터 반환');
          return createDefaultRawData();
        }

        const uiState = extractUIState();

        // 🔧 P1-3: 구조분해할당 + Fallback으로 코어 상태 추출
        const {
          containers: rawContainerList = [],
          paragraphs: rawParagraphList = [],
          isCompleted: editorCompletionStatus = false,
        } = coreState;

        // 🔧 수정: 인터페이스와 일치하는 속성명 사용하여 UI 상태 추출
        const {
          activeParagraphId: currentActiveParagraphId = null,
          selectedParagraphIds: currentSelectedParagraphIds = [],
          isPreviewOpen: currentPreviewOpenStatus = false,
        } = uiState;

        // 🔧 P1-4: 타입 가드를 통한 안전한 필터링
        const validContainerList = Array.isArray(rawContainerList)
          ? rawContainerList.filter(isValidContainer)
          : [];

        const validParagraphList = Array.isArray(rawParagraphList)
          ? rawParagraphList.filter(isValidParagraph)
          : [];

        const extractedData: RawEditorExtractedData = {
          containerList: validContainerList,
          paragraphList: validParagraphList,
          completionStatus: Boolean(editorCompletionStatus),
          activeParagraphId: currentActiveParagraphId,
          selectedParagraphIdList: [...currentSelectedParagraphIds],
          previewOpenStatus: currentPreviewOpenStatus,
        };

        console.log('✅ [EXTRACTOR] 원시 데이터 추출 완료:', {
          containerCount: extractedData.containerList.length,
          paragraphCount: extractedData.paragraphList.length,
          isCompleted: extractedData.completionStatus,
        });

        return extractedData;
      },
      createDefaultRawData(),
      'RAW_EDITOR_DATA_EXTRACTION'
    );
  };

  const createDefaultRawData = (): RawEditorExtractedData => ({
    containerList: [],
    paragraphList: [],
    completionStatus: false,
    activeParagraphId: null,
    selectedParagraphIdList: [],
    previewOpenStatus: false,
  });

  return {
    extractCoreState,
    extractUIState,
    extractRawEditorData,
  };
}

function createDataValidationModule() {
  const { safelyExecuteExtraction } = createExtractorErrorHandlerModule();

  const validateExtractedData = (
    containersToValidate: readonly Container[],
    paragraphsToValidate: readonly ParagraphBlock[]
  ): ValidationResultDataInfo => {
    console.log('🔍 [EXTRACTOR] 추출된 데이터 검증');

    return safelyExecuteExtraction(
      () => {
        // 🔧 P1-1: Early Return 패턴으로 기본 구조 검증
        if (!Array.isArray(containersToValidate)) {
          console.error('❌ [EXTRACTOR] 컨테이너가 배열이 아님');
          return { isValid: false, containerCount: 0, paragraphCount: 0 };
        }

        if (!Array.isArray(paragraphsToValidate)) {
          console.error('❌ [EXTRACTOR] 문단이 배열이 아님');
          return { isValid: false, containerCount: 0, paragraphCount: 0 };
        }

        const containerCount = containersToValidate.length;
        const paragraphCount = paragraphsToValidate.length;

        // 🔧 P1-2: 삼항연산자로 검증 실행 여부 결정
        const shouldValidateContainers = containerCount > 0 ? true : false;
        const shouldValidateParagraphs = paragraphCount > 0 ? true : false;

        let containersValidationResult = true;
        let paragraphsValidationResult = true;

        // 🔧 P1-5: 안전한 검증 실행
        if (shouldValidateContainers) {
          containersValidationResult = safelyExecuteExtraction(
            () => validateEditorContainers([...containersToValidate]),
            true, // 관대한 모드로 계속 진행
            'CONTAINER_VALIDATION'
          );
        }

        if (shouldValidateParagraphs) {
          paragraphsValidationResult = safelyExecuteExtraction(
            () => validateEditorParagraphs([...paragraphsToValidate]),
            true, // 관대한 모드로 계속 진행
            'PARAGRAPH_VALIDATION'
          );
        }

        // 🔧 P1-2: 삼항연산자로 종합 검증 결과 계산
        const isCompletelyValid =
          containersValidationResult && paragraphsValidationResult
            ? true
            : false;

        console.log('📊 [EXTRACTOR] 데이터 검증 결과:', {
          isCompletelyValid,
          containerCount,
          paragraphCount,
          containersValid: containersValidationResult,
          paragraphsValid: paragraphsValidationResult,
        });

        return {
          isValid: isCompletelyValid,
          containerCount,
          paragraphCount,
        };
      },
      { isValid: false, containerCount: 0, paragraphCount: 0 },
      'DATA_VALIDATION'
    );
  };

  return { validateExtractedData };
}

function createContentGenerationModule() {
  const { safelyExecuteExtraction } = createExtractorErrorHandlerModule();

  const generateCompletedContentSafely = (
    containersForContent: readonly Container[],
    paragraphsForContent: readonly ParagraphBlock[]
  ): string => {
    console.log('🔄 [EXTRACTOR] 완성된 콘텐츠 생성');

    return safelyExecuteExtraction(
      () => {
        // 🔧 P1-1: Early Return 패턴으로 유효성 체크
        if (!Array.isArray(containersForContent)) {
          console.warn(
            '⚠️ [EXTRACTOR] 유효하지 않은 컨테이너 배열, 빈 콘텐츠 반환'
          );
          return '';
        }

        if (!Array.isArray(paragraphsForContent)) {
          console.warn(
            '⚠️ [EXTRACTOR] 유효하지 않은 문단 배열, 빈 콘텐츠 반환'
          );
          return '';
        }

        // 🔧 P1-2: 삼항연산자로 필수 데이터 확인
        const hasContainers = containersForContent.length > 0 ? true : false;
        const hasParagraphs = paragraphsForContent.length > 0 ? true : false;
        const hasRequiredData = hasContainers && hasParagraphs ? true : false;

        // Early Return: 필수 데이터가 없는 경우
        if (!hasRequiredData) {
          console.warn('⚠️ [EXTRACTOR] 데이터 부족으로 빈 콘텐츠 반환');
          return '';
        }

        // 🔧 P1-5: 기본 콘텐츠 생성 시도
        try {
          const generatedContent = generateCompletedContent(
            [...containersForContent],
            [...paragraphsForContent]
          );
          console.log('✅ [EXTRACTOR] 기본 콘텐츠 생성 성공:', {
            contentLength: generatedContent.length,
          });
          return generatedContent;
        } catch (contentGenerationError) {
          console.warn(
            '⚠️ [EXTRACTOR] 기본 콘텐츠 생성 실패, 수동 생성 시도:',
            contentGenerationError
          );
          return generateManualContent(
            containersForContent,
            paragraphsForContent
          );
        }
      },
      '',
      'CONTENT_GENERATION'
    );
  };

  const generateManualContent = (
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): string => {
    return safelyExecuteExtraction(
      () => {
        // 🔧 P1-3: 구조분해할당으로 정렬된 컨테이너 생성
        const sortedContainerList = [...containers].sort(
          (firstContainer, secondContainer) => {
            const { order: firstOrder = 0 } = firstContainer;
            const { order: secondOrder = 0 } = secondContainer;
            return firstOrder - secondOrder;
          }
        );

        const contentPartsList: string[] = [];

        sortedContainerList.forEach((containerItem) => {
          const { id: containerId = '', name: containerName = '' } =
            containerItem;

          // 🔧 P1-2: 삼항연산자로 유효성 체크
          const hasValidContainerId = containerId ? true : false;
          const hasValidContainerName = containerName ? true : false;
          const isValidContainer =
            hasValidContainerId && hasValidContainerName ? true : false;

          // Early Return: 유효하지 않은 컨테이너인 경우
          if (!isValidContainer) {
            return;
          }

          // 🔧 P1-3: 구조분해할당으로 문단 필터링 및 정렬
          const containerParagraphList = paragraphs
            .filter((paragraphItem) => {
              const { containerId: paragraphContainerId } = paragraphItem;
              return paragraphContainerId === containerId;
            })
            .sort((firstParagraph, secondParagraph) => {
              const { order: firstOrder = 0 } = firstParagraph;
              const { order: secondOrder = 0 } = secondParagraph;
              return firstOrder - secondOrder;
            });

          // 🔧 P1-2: 삼항연산자로 문단 존재 여부 확인
          const hasValidParagraphs =
            containerParagraphList.length > 0 ? true : false;

          if (hasValidParagraphs) {
            contentPartsList.push(`## ${containerName}`);

            containerParagraphList.forEach((paragraphItem) => {
              const { content: paragraphContent = '' } = paragraphItem;
              const hasValidContent =
                paragraphContent && paragraphContent.trim().length > 0
                  ? true
                  : false;

              // 🔧 P1-2: 삼항연산자로 콘텐츠 추가 여부 결정
              hasValidContent ? contentPartsList.push(paragraphContent) : null;
            });

            contentPartsList.push('');
          }
        });

        const manualGeneratedContent = contentPartsList.join('\n');
        console.log('✅ [EXTRACTOR] 수동 콘텐츠 생성 성공');
        return manualGeneratedContent;
      },
      '',
      'MANUAL_CONTENT_GENERATION'
    );
  };

  return { generateCompletedContentSafely };
}

function createSnapshotModule() {
  const { extractRawEditorData } = createStoreAccessModule();
  const { validateExtractedData } = createDataValidationModule();
  const { generateCompletedContentSafely } = createContentGenerationModule();
  const { safelyExecuteExtraction } = createExtractorErrorHandlerModule();

  const extractEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🚀 [EXTRACTOR] 에디터 상태 추출 시작');
      const extractionStartTime = performance.now();

      return safelyExecuteExtraction(
        () => {
          const rawEditorData = extractRawEditorData();

          // Early Return: 원시 데이터가 null인 경우
          if (!rawEditorData) {
            console.error('❌ [EXTRACTOR] 원시 데이터 추출 실패');
            return null;
          }

          // 🔧 P1-3: 구조분해할당으로 원시 데이터 추출
          const {
            containerList: extractedContainerList,
            paragraphList: extractedParagraphList,
            completionStatus: editorCompletionStatus,
            activeParagraphId: currentActiveParagraphId,
            selectedParagraphIdList: currentSelectedParagraphIds,
            previewOpenStatus: currentPreviewOpenStatus,
          } = rawEditorData;

          const validationResult = validateExtractedData(
            extractedContainerList,
            extractedParagraphList
          );

          // 🔧 P1-3: 구조분해할당으로 검증 결과 추출
          const {
            isValid: isDataValid,
            containerCount,
            paragraphCount,
          } = validationResult;

          // 🔧 P1-2: 삼항연산자로 기본 배열 구조 확인
          const hasBasicArrayStructure =
            Array.isArray(extractedContainerList) &&
            Array.isArray(extractedParagraphList)
              ? true
              : false;

          // Early Return: 기본 배열 구조가 없는 경우
          if (!hasBasicArrayStructure) {
            console.error('❌ [EXTRACTOR] 데이터 구조 자체가 잘못됨');
            return null;
          }

          const generatedCompletedContent = generateCompletedContentSafely(
            extractedContainerList,
            extractedParagraphList
          );

          const extractionEndTime = performance.now();
          const extractionDuration = extractionEndTime - extractionStartTime;

          // 🔧 P1-3: 구조분해할당으로 SnapshotMetadata 객체 생성
          const snapshotMetadata: SnapshotMetadata = {
            extractionTimestamp: Date.now(),
            processingDurationMs: extractionDuration,
            validationStatus: isDataValid,
            dataIntegrity: generatedCompletedContent.length > 0,
            sourceInfo: {
              coreStoreVersion: '1.0.0',
              uiStoreVersion: '1.0.0',
            },
          };

          const editorSnapshot: EditorStateSnapshotForBridge = {
            editorContainers: extractedContainerList,
            editorParagraphs: extractedParagraphList,
            editorCompletedContent: generatedCompletedContent,
            editorIsCompleted: editorCompletionStatus,
            editorActiveParagraphId: currentActiveParagraphId,
            editorSelectedParagraphIds: [...currentSelectedParagraphIds],
            editorIsPreviewOpen: currentPreviewOpenStatus,
            extractedTimestamp: Date.now(),
            snapshotMetadata,
          };

          console.log('✅ [EXTRACTOR] 에디터 상태 추출 완료:', {
            duration: `${extractionDuration.toFixed(2)}ms`,
            containerCount,
            paragraphCount,
            contentLength: generatedCompletedContent.length,
            isCompleted: editorCompletionStatus,
            isDataValid,
          });

          return editorSnapshot;
        },
        createFallbackSnapshot(),
        'EDITOR_STATE_SNAPSHOT'
      );
    };

  const createFallbackSnapshot = (): EditorStateSnapshotForBridge => {
    console.log('🔄 [EXTRACTOR] fallback 스냅샷 생성');

    const fallbackMetadata: SnapshotMetadata = {
      extractionTimestamp: Date.now(),
      processingDurationMs: 0,
      validationStatus: false,
      dataIntegrity: false,
      sourceInfo: {
        coreStoreVersion: '1.0.0-fallback',
        uiStoreVersion: '1.0.0-fallback',
      },
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
    };
  };

  const validateExtractedStateSnapshot = (
    snapshotToValidate: EditorStateSnapshotForBridge | null
  ): boolean => {
    console.log('🔍 [EXTRACTOR] 추출된 상태 검증');

    return safelyExecuteExtraction(
      () => {
        // Early Return: 스냅샷이 null인 경우
        if (!snapshotToValidate) {
          console.error('❌ [EXTRACTOR] 스냅샷이 null');
          return false;
        }

        // 🔧 P1-3: 구조분해할당으로 스냅샷 속성 추출
        const {
          editorContainers: snapshotContainerList,
          editorParagraphs: snapshotParagraphList,
          editorCompletedContent: snapshotCompletedContent,
          editorIsCompleted: snapshotCompletionStatus,
          extractedTimestamp: snapshotTimestamp,
        } = snapshotToValidate;

        // 🔧 P1-2: 삼항연산자로 각 속성 검증
        const hasValidContainers = Array.isArray(snapshotContainerList)
          ? true
          : false;
        const hasValidParagraphs = Array.isArray(snapshotParagraphList)
          ? true
          : false;
        const hasValidContent =
          typeof snapshotCompletedContent === 'string' ? true : false;
        const hasValidCompleted =
          typeof snapshotCompletionStatus === 'boolean' ? true : false;
        const hasValidTimestamp =
          typeof snapshotTimestamp === 'number' && snapshotTimestamp > 0
            ? true
            : false;

        const isCompletelyValid =
          hasValidContainers &&
          hasValidParagraphs &&
          hasValidContent &&
          hasValidCompleted &&
          hasValidTimestamp
            ? true
            : false;

        console.log('📊 [EXTRACTOR] 상태 검증 결과:', {
          isCompletelyValid,
          containerCount: snapshotContainerList.length,
          paragraphCount: snapshotParagraphList.length,
          contentLength: snapshotCompletedContent.length,
        });

        return isCompletelyValid;
      },
      false,
      'STATE_SNAPSHOT_VALIDATION'
    );
  };

  const getEditorStateWithValidation =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🔄 [EXTRACTOR] 검증과 함께 상태 추출');

      return safelyExecuteExtraction(
        () => {
          const extractedSnapshot = extractEditorStateSnapshot();

          // Early Return: 스냅샷이 null인 경우
          if (!extractedSnapshot) {
            console.warn('⚠️ [EXTRACTOR] 상태 추출 결과가 null');
            return null;
          }

          const isSnapshotValid =
            validateExtractedStateSnapshot(extractedSnapshot);

          // 🔧 P1-2: 삼항연산자로 경고 메시지 생성
          const shouldLogWarning = !isSnapshotValid ? true : false;
          shouldLogWarning
            ? console.warn(
                '⚠️ [EXTRACTOR] 추출된 상태가 유효하지 않지만 반환 (관대한 모드)'
              )
            : null;

          console.log('✅ [EXTRACTOR] 검증된 상태 추출 완료:', {
            isValid: isSnapshotValid,
            containerCount: extractedSnapshot.editorContainers.length,
            paragraphCount: extractedSnapshot.editorParagraphs.length,
            hasContent: extractedSnapshot.editorCompletedContent.length > 0,
          });

          return extractedSnapshot;
        },
        null,
        'VALIDATED_STATE_EXTRACTION'
      );
    };

  const extractEditorStateWithStatistics = () => {
    console.log('📊 [EXTRACTOR] 통계 정보와 함께 상태 추출');

    return safelyExecuteExtraction(
      () => {
        const editorSnapshot = getEditorStateWithValidation();

        // Early Return: 스냅샷이 null인 경우
        if (!editorSnapshot) {
          return null;
        }

        // 🔧 P1-3: 구조분해할당으로 컨테이너와 문단 리스트 추출
        const {
          editorContainers: containerList,
          editorParagraphs: paragraphList,
        } = editorSnapshot;

        const editorStatistics = safelyExecuteExtraction(
          () =>
            calculateEditorStatistics([...containerList], [...paragraphList]),
          createFallbackStatistics(containerList, paragraphList),
          'STATISTICS_CALCULATION'
        );

        return {
          snapshot: editorSnapshot,
          statistics: editorStatistics,
        };
      },
      null,
      'STATE_WITH_STATISTICS_EXTRACTION'
    );
  };

  const createFallbackStatistics = (
    containerList: readonly Container[],
    paragraphList: readonly ParagraphBlock[]
  ) => {
    // 🔧 P1-3: 구조분해할당으로 안전한 통계 계산
    const assignedParagraphsCount = paragraphList.filter(
      ({ containerId }) => containerId !== null
    ).length;
    const totalContentLength = paragraphList.reduce(
      (totalLength, { content = '' }) => totalLength + content.length,
      0
    );

    return {
      totalContainers: containerList.length,
      totalParagraphs: paragraphList.length,
      assignedParagraphs: assignedParagraphsCount,
      unassignedParagraphs: paragraphList.length - assignedParagraphsCount,
      totalContentLength,
      averageContentLength: 0,
      emptyContainers: 0,
      containerUtilization: [],
    };
  };

  return {
    extractEditorStateSnapshot,
    validateExtractedStateSnapshot,
    getEditorStateWithValidation,
    extractEditorStateWithStatistics,
  };
}

export function createEditorStateExtractor() {
  console.log('🏭 [EXTRACTOR_FACTORY] 에디터 상태 추출기 생성');

  // 🔧 P1-3: 구조분해할당으로 모듈 함수들 추출
  const { extractRawEditorData } = createStoreAccessModule();
  const { validateExtractedData } = createDataValidationModule();
  const { generateCompletedContentSafely } = createContentGenerationModule();
  const {
    extractEditorStateSnapshot,
    validateExtractedStateSnapshot,
    getEditorStateWithValidation,
    extractEditorStateWithStatistics,
  } = createSnapshotModule();

  return {
    extractEditorState: extractEditorStateSnapshot,
    validateExtractedState: validateExtractedStateSnapshot,
    getEditorStateWithValidation,
    extractEditorStateWithStatistics,
    extractRawDataFromStore: extractRawEditorData,
    validateDataStructure: validateExtractedData,
    generateContentFromState: generateCompletedContentSafely,
  };
}
