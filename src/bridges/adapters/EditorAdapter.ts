// adapters/EditorAdapter.ts

import BaseAdapter from './BaseAdapter';
import type {
  EditorStateSnapshotForBridge,
  SnapshotMetadata,
  ValidationResult,
} from '../editorMultiStepBridge/modernBridgeTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import {
  validateEditorContainers,
  validateEditorParagraphs,
  calculateEditorStatistics,
} from '../utils/editorDataUtils';
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';

interface EditorAdapterConfiguration {
  readonly enableStateChangeDetection: boolean;
  readonly stateChangePollingInterval: number;
  readonly enableAutoValidation: boolean;
  readonly cacheExpirationMs: number;
  readonly enableContentGeneration: boolean;
}

interface EditorStoreState {
  readonly containers?: readonly Container[];
  readonly paragraphs?: readonly ParagraphBlock[];
  readonly isCompleted?: boolean;
  readonly completedContent?: string;
  readonly setCompletedContent?: (content: string) => void;
  readonly setIsCompleted?: (completed: boolean) => void;
  readonly [key: string]: unknown;
}

interface EditorUIState {
  readonly activeParagraphId?: string | null;
  readonly selectedParagraphIds?: readonly string[];
  readonly isPreviewOpen?: boolean;
  readonly [key: string]: unknown;
}

interface ExtractedEditorData {
  readonly containerList: readonly Container[];
  readonly paragraphList: readonly ParagraphBlock[];
  readonly completionStatus: boolean;
  readonly activeParagraphId: string | null;
  readonly selectedParagraphIdList: readonly string[];
  readonly previewOpenStatus: boolean;
  readonly generatedContent: string;
}

function createEditorAdapterTypeGuards() {
  const isValidString = (candidateValue: unknown): candidateValue is string => {
    return typeof candidateValue === 'string';
  };

  const isValidNumber = (candidateValue: unknown): candidateValue is number => {
    return typeof candidateValue === 'number' && !Number.isNaN(candidateValue);
  };

  const isValidBoolean = (
    candidateValue: unknown
  ): candidateValue is boolean => {
    return typeof candidateValue === 'boolean';
  };

  const isValidObject = (
    candidateValue: unknown
  ): candidateValue is Record<string, unknown> => {
    return (
      candidateValue !== null &&
      typeof candidateValue === 'object' &&
      !Array.isArray(candidateValue)
    );
  };

  const isValidArray = (
    candidateValue: unknown
  ): candidateValue is unknown[] => {
    return Array.isArray(candidateValue);
  };

  const isValidFunction = (
    candidateValue: unknown
  ): candidateValue is Function => {
    return typeof candidateValue === 'function';
  };

  const isValidContainer = (
    candidateContainer: unknown
  ): candidateContainer is Container => {
    const isValidObjectType = isValidObject(candidateContainer);
    if (!isValidObjectType) {
      return false;
    }

    const containerObject = candidateContainer;
    const containerIdProperty = Reflect.get(containerObject, 'id');
    const containerNameProperty = Reflect.get(containerObject, 'name');
    const containerOrderProperty = Reflect.get(containerObject, 'order');

    const hasRequiredId = isValidString(containerIdProperty);
    const hasRequiredName = isValidString(containerNameProperty);
    const hasRequiredOrder = isValidNumber(containerOrderProperty);

    return hasRequiredId && hasRequiredName && hasRequiredOrder;
  };

  const isValidParagraph = (
    candidateParagraph: unknown
  ): candidateParagraph is ParagraphBlock => {
    const isValidObjectType = isValidObject(candidateParagraph);
    if (!isValidObjectType) {
      return false;
    }

    const paragraphObject = candidateParagraph;
    const paragraphIdProperty = Reflect.get(paragraphObject, 'id');
    const paragraphContentProperty = Reflect.get(paragraphObject, 'content');
    const paragraphOrderProperty = Reflect.get(paragraphObject, 'order');
    const paragraphContainerIdProperty = Reflect.get(
      paragraphObject,
      'containerId'
    );

    const hasRequiredId = isValidString(paragraphIdProperty);
    const hasRequiredContent = isValidString(paragraphContentProperty);
    const hasRequiredOrder = isValidNumber(paragraphOrderProperty);

    const hasValidContainerId =
      paragraphContainerIdProperty === null ||
      isValidString(paragraphContainerIdProperty);

    return (
      hasRequiredId &&
      hasRequiredContent &&
      hasRequiredOrder &&
      hasValidContainerId
    );
  };

  const isValidEditorStoreState = (
    candidateState: unknown
  ): candidateState is EditorStoreState => {
    const isValidObjectType = isValidObject(candidateState);
    if (!isValidObjectType) {
      return false;
    }

    const stateObject = candidateState;
    const containersProperty = Reflect.get(stateObject, 'containers');
    const paragraphsProperty = Reflect.get(stateObject, 'paragraphs');
    const isCompletedProperty = Reflect.get(stateObject, 'isCompleted');

    const hasValidContainers =
      !containersProperty || isValidArray(containersProperty);
    const hasValidParagraphs =
      !paragraphsProperty || isValidArray(paragraphsProperty);
    const hasValidCompletion =
      !isCompletedProperty || isValidBoolean(isCompletedProperty);

    return hasValidContainers && hasValidParagraphs && hasValidCompletion;
  };

  const isValidEditorUIState = (
    candidateState: unknown
  ): candidateState is EditorUIState => {
    const isValidObjectType = isValidObject(candidateState);
    if (!isValidObjectType) {
      return false;
    }

    const stateObject = candidateState;
    const activeParagraphIdProperty = Reflect.get(
      stateObject,
      'activeParagraphId'
    );
    const selectedParagraphIdsProperty = Reflect.get(
      stateObject,
      'selectedParagraphIds'
    );
    const isPreviewOpenProperty = Reflect.get(stateObject, 'isPreviewOpen');

    const hasValidActiveParagraph =
      !activeParagraphIdProperty ||
      activeParagraphIdProperty === null ||
      isValidString(activeParagraphIdProperty);
    const hasValidSelectedParagraphs =
      !selectedParagraphIdsProperty ||
      isValidArray(selectedParagraphIdsProperty);
    const hasValidPreviewOpen =
      !isPreviewOpenProperty || isValidBoolean(isPreviewOpenProperty);

    return (
      hasValidActiveParagraph &&
      hasValidSelectedParagraphs &&
      hasValidPreviewOpen
    );
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidArray,
    isValidFunction,
    isValidContainer,
    isValidParagraph,
    isValidEditorStoreState,
    isValidEditorUIState,
  };
}

function createEditorDataExtractorModule() {
  const typeGuardHelpers = createEditorAdapterTypeGuards();

  const safelyExecuteExtraction = <T>(
    extractionOperation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      return extractionOperation();
    } catch (extractionError) {
      console.error(
        `❌ [EDITOR_ADAPTER] ${operationName} 실행 실패:`,
        extractionError
      );
      return fallbackValue;
    }
  };

  const extractCoreStoreState = (): EditorStoreState | null => {
    return safelyExecuteExtraction(
      () => {
        const coreStoreState = useEditorCoreStore.getState();

        const isNullState = !coreStoreState;
        if (isNullState) {
          console.warn('⚠️ [EDITOR_ADAPTER] 코어 스토어 상태 없음');
          return null;
        }

        const isValidState =
          typeGuardHelpers.isValidEditorStoreState(coreStoreState);
        if (!isValidState) {
          console.warn('⚠️ [EDITOR_ADAPTER] 유효하지 않은 코어 상태');
          return null;
        }

        console.log('✅ [EDITOR_ADAPTER] 코어 상태 추출 성공');
        return coreStoreState;
      },
      null,
      'CORE_STATE_EXTRACTION'
    );
  };

  const extractUIStoreState = (): EditorUIState => {
    return safelyExecuteExtraction(
      () => {
        const uiStoreState = useEditorUIStore.getState();

        const isNullState = !uiStoreState;
        if (isNullState) {
          console.warn('⚠️ [EDITOR_ADAPTER] UI 상태 없음, 기본값 사용');
          return createDefaultUIState();
        }

        const isValidState =
          typeGuardHelpers.isValidEditorUIState(uiStoreState);
        if (!isValidState) {
          console.warn('⚠️ [EDITOR_ADAPTER] UI 상태 타입 오류, 기본값 사용');
          return createDefaultUIState();
        }

        console.log('✅ [EDITOR_ADAPTER] UI 상태 추출 성공');
        return uiStoreState;
      },
      createDefaultUIState(),
      'UI_STATE_EXTRACTION'
    );
  };

  const createDefaultUIState = (): EditorUIState => ({
    activeParagraphId: null,
    selectedParagraphIds: [],
    isPreviewOpen: false,
  });

  const generateCompletedContentSafely = (
    containersForContent: readonly Container[],
    paragraphsForContent: readonly ParagraphBlock[]
  ): string => {
    return safelyExecuteExtraction(
      () => {
        const isValidContainerArray =
          typeGuardHelpers.isValidArray(containersForContent);
        if (!isValidContainerArray) {
          console.warn(
            '⚠️ [EDITOR_ADAPTER] 유효하지 않은 컨테이너 배열, 빈 콘텐츠 반환'
          );
          return '';
        }

        const isValidParagraphArray =
          typeGuardHelpers.isValidArray(paragraphsForContent);
        if (!isValidParagraphArray) {
          console.warn(
            '⚠️ [EDITOR_ADAPTER] 유효하지 않은 문단 배열, 빈 콘텐츠 반환'
          );
          return '';
        }

        const hasContainers = containersForContent.length > 0;
        const hasParagraphs = paragraphsForContent.length > 0;
        const hasRequiredData = hasContainers && hasParagraphs;

        if (!hasRequiredData) {
          console.warn('⚠️ [EDITOR_ADAPTER] 데이터 부족으로 빈 콘텐츠 반환');
          return '';
        }

        try {
          const generatedContent = generateCompletedContent(
            [...containersForContent],
            [...paragraphsForContent]
          );
          console.log('✅ [EDITOR_ADAPTER] 기본 콘텐츠 생성 성공:', {
            contentLength: generatedContent.length,
          });
          return generatedContent;
        } catch (contentGenerationError) {
          console.warn(
            '⚠️ [EDITOR_ADAPTER] 기본 콘텐츠 생성 실패, 수동 생성 시도:',
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
    sourceContainers: readonly Container[],
    sourceParagraphs: readonly ParagraphBlock[]
  ): string => {
    return safelyExecuteExtraction(
      () => {
        const sortedContainerList = [...sourceContainers].sort(
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

          const hasValidContainerId = containerId ? true : false;
          const hasValidContainerName = containerName ? true : false;
          const isValidContainer = hasValidContainerId && hasValidContainerName;

          if (!isValidContainer) {
            return;
          }

          const containerParagraphList = sourceParagraphs
            .filter((paragraphItem) => {
              const { containerId: paragraphContainerId } = paragraphItem;
              return paragraphContainerId === containerId;
            })
            .sort((firstParagraph, secondParagraph) => {
              const { order: firstOrder = 0 } = firstParagraph;
              const { order: secondOrder = 0 } = secondParagraph;
              return firstOrder - secondOrder;
            });

          const hasValidParagraphs = containerParagraphList.length > 0;

          if (hasValidParagraphs) {
            contentPartsList.push(`## ${containerName}`);

            containerParagraphList.forEach((paragraphItem) => {
              const { content: paragraphContent = '' } = paragraphItem;
              const hasValidContent =
                paragraphContent && paragraphContent.trim().length > 0;

              hasValidContent ? contentPartsList.push(paragraphContent) : null;
            });

            contentPartsList.push('');
          }
        });

        const manualGeneratedContent = contentPartsList.join('\n');
        console.log('✅ [EDITOR_ADAPTER] 수동 콘텐츠 생성 성공');
        return manualGeneratedContent;
      },
      '',
      'MANUAL_CONTENT_GENERATION'
    );
  };

  const extractRawEditorData = (): ExtractedEditorData | null => {
    console.log('🔍 [EDITOR_ADAPTER] 원시 에디터 데이터 추출 시작');

    return safelyExecuteExtraction(
      () => {
        const coreState = extractCoreStoreState();

        const isNullCoreState = !coreState;
        if (isNullCoreState) {
          console.warn('⚠️ [EDITOR_ADAPTER] 코어 상태 없음, 기본 데이터 반환');
          return createDefaultRawData();
        }

        const uiState = extractUIStoreState();

        const {
          containers: rawContainerList = [],
          paragraphs: rawParagraphList = [],
          isCompleted: editorCompletionStatus = false,
        } = coreState;

        const {
          activeParagraphId: currentActiveParagraphId = null,
          selectedParagraphIds: currentSelectedParagraphIds = [],
          isPreviewOpen: currentPreviewOpenStatus = false,
        } = uiState;

        const validContainerList = typeGuardHelpers.isValidArray(
          rawContainerList
        )
          ? rawContainerList.filter(typeGuardHelpers.isValidContainer)
          : [];

        const validParagraphList = typeGuardHelpers.isValidArray(
          rawParagraphList
        )
          ? rawParagraphList.filter(typeGuardHelpers.isValidParagraph)
          : [];

        const generatedContent = generateCompletedContentSafely(
          validContainerList,
          validParagraphList
        );

        const extractedData: ExtractedEditorData = {
          containerList: validContainerList,
          paragraphList: validParagraphList,
          completionStatus: typeGuardHelpers.isValidBoolean(
            editorCompletionStatus
          )
            ? editorCompletionStatus
            : false,
          activeParagraphId: currentActiveParagraphId,
          selectedParagraphIdList: typeGuardHelpers.isValidArray(
            currentSelectedParagraphIds
          )
            ? [...currentSelectedParagraphIds]
            : [],
          previewOpenStatus: typeGuardHelpers.isValidBoolean(
            currentPreviewOpenStatus
          )
            ? currentPreviewOpenStatus
            : false,
          generatedContent,
        };

        console.log('✅ [EDITOR_ADAPTER] 원시 데이터 추출 완료:', {
          containerCount: extractedData.containerList.length,
          paragraphCount: extractedData.paragraphList.length,
          isCompleted: extractedData.completionStatus,
          contentLength: extractedData.generatedContent.length,
        });

        return extractedData;
      },
      createDefaultRawData(),
      'RAW_EDITOR_DATA_EXTRACTION'
    );
  };

  const createDefaultRawData = (): ExtractedEditorData => ({
    containerList: [],
    paragraphList: [],
    completionStatus: false,
    activeParagraphId: null,
    selectedParagraphIdList: [],
    previewOpenStatus: false,
    generatedContent: '',
  });

  return {
    extractCoreStoreState,
    extractUIStoreState,
    extractRawEditorData,
    generateCompletedContentSafely,
  };
}

function createEditorDataUpdaterModule() {
  const typeGuardHelpers = createEditorAdapterTypeGuards();

  const safelyExecuteUpdate = async <T>(
    updateOperation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      return await updateOperation();
    } catch (updateError) {
      console.error(
        `❌ [EDITOR_ADAPTER] ${operationName} 실행 실패:`,
        updateError
      );
      return fallbackValue;
    }
  };

  const updateEditorContent = async (
    targetContent: string
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 콘텐츠 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const isValidContentString =
          typeGuardHelpers.isValidString(targetContent);
        if (!isValidContentString) {
          console.error('❌ [EDITOR_ADAPTER] 유효하지 않은 콘텐츠 타입');
          return false;
        }

        const editorState = useEditorCoreStore.getState();

        const isNullEditorState = !editorState;
        if (isNullEditorState) {
          console.error('❌ [EDITOR_ADAPTER] Editor 상태 없음');
          return false;
        }

        const { setCompletedContent = null } = editorState;
        const isValidSetFunction =
          typeGuardHelpers.isValidFunction(setCompletedContent);

        if (!isValidSetFunction) {
          console.error('❌ [EDITOR_ADAPTER] setCompletedContent 함수 없음');
          return false;
        }

        if (setCompletedContent) {
          setCompletedContent(targetContent);
        }

        console.log('✅ [EDITOR_ADAPTER] 콘텐츠 업데이트 완료:', {
          contentLength: targetContent.length,
        });

        return true;
      },
      false,
      'UPDATE_CONTENT'
    );
  };

  const updateEditorCompletion = async (
    targetCompletionStatus: boolean
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 완료 상태 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const isValidCompletionBoolean = typeGuardHelpers.isValidBoolean(
          targetCompletionStatus
        );
        if (!isValidCompletionBoolean) {
          console.error('❌ [EDITOR_ADAPTER] 유효하지 않은 완료 상태 타입');
          return false;
        }

        const editorState = useEditorCoreStore.getState();

        const isNullEditorState = !editorState;
        if (isNullEditorState) {
          console.error('❌ [EDITOR_ADAPTER] Editor 상태 없음');
          return false;
        }

        const { setIsCompleted = null } = editorState;
        const isValidSetFunction =
          typeGuardHelpers.isValidFunction(setIsCompleted);

        if (!isValidSetFunction) {
          console.error('❌ [EDITOR_ADAPTER] setIsCompleted 함수 없음');
          return false;
        }

        if (setIsCompleted) {
          setIsCompleted(targetCompletionStatus);
        }

        console.log('✅ [EDITOR_ADAPTER] 완료 상태 업데이트 완료:', {
          isCompleted: targetCompletionStatus,
        });

        return true;
      },
      false,
      'UPDATE_COMPLETION'
    );
  };

  const updateEditorState = async (
    targetContent: string,
    targetCompletionStatus: boolean
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 전체 상태 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const contentUpdateSuccess = await updateEditorContent(targetContent);
        const completionUpdateSuccess = await updateEditorCompletion(
          targetCompletionStatus
        );

        const overallUpdateSuccess =
          contentUpdateSuccess && completionUpdateSuccess;

        console.log('📊 [EDITOR_ADAPTER] 전체 상태 업데이트 결과:', {
          contentUpdateSuccess,
          completionUpdateSuccess,
          overallUpdateSuccess,
        });

        return overallUpdateSuccess;
      },
      false,
      'UPDATE_STATE'
    );
  };

  const validateUpdateData = (
    contentToValidate: string,
    completionStatusToValidate: boolean
  ): boolean => {
    const hasValidContent = typeGuardHelpers.isValidString(contentToValidate);
    const hasValidCompletion = typeGuardHelpers.isValidBoolean(
      completionStatusToValidate
    );

    return hasValidContent && hasValidCompletion;
  };

  const getCurrentEditorState = () => {
    try {
      const editorState = useEditorCoreStore.getState();

      const isNullEditorState = !editorState;
      if (isNullEditorState) {
        console.error('❌ [EDITOR_ADAPTER] Editor 상태 조회 실패');
        return null;
      }

      const { completedContent = '', isCompleted = false } = editorState;

      return {
        currentContent: completedContent,
        currentCompletion: typeGuardHelpers.isValidBoolean(isCompleted)
          ? isCompleted
          : false,
      };
    } catch (stateRetrievalError) {
      console.error(
        '❌ [EDITOR_ADAPTER] 현재 상태 조회 실패:',
        stateRetrievalError
      );
      return null;
    }
  };

  return {
    updateEditorContent,
    updateEditorCompletion,
    updateEditorState,
    validateUpdateData,
    getCurrentEditorState,
  };
}

class EditorAdapter extends BaseAdapter<
  EditorStateSnapshotForBridge,
  EditorStateSnapshotForBridge
> {
  private readonly editorAdapterConfiguration: EditorAdapterConfiguration;
  private readonly extractorModule: ReturnType<
    typeof createEditorDataExtractorModule
  >;
  private readonly updaterModule: ReturnType<
    typeof createEditorDataUpdaterModule
  >;
  private readonly typeGuardHelpers: ReturnType<
    typeof createEditorAdapterTypeGuards
  >;
  private lastSnapshotTimestamp: number;

  constructor(customConfiguration?: Partial<EditorAdapterConfiguration>) {
    console.log('🔧 [EDITOR_ADAPTER] 에디터 어댑터 초기화 시작');

    const defaultConfiguration: EditorAdapterConfiguration = {
      enableStateChangeDetection: true,
      stateChangePollingInterval: 1000,
      enableAutoValidation: true,
      cacheExpirationMs: 300000,
      enableContentGeneration: true,
    };

    const finalConfiguration = customConfiguration
      ? { ...defaultConfiguration, ...customConfiguration }
      : defaultConfiguration;

    super('EDITOR_ADAPTER', '1.0.0', {
      timeoutMs: 5000,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableHealthCheck: true,
      healthCheckIntervalMs: finalConfiguration.stateChangePollingInterval,
    });

    this.editorAdapterConfiguration = finalConfiguration;
    this.extractorModule = createEditorDataExtractorModule();
    this.updaterModule = createEditorDataUpdaterModule();
    this.typeGuardHelpers = createEditorAdapterTypeGuards();
    this.lastSnapshotTimestamp = 0;

    console.log('✅ [EDITOR_ADAPTER] 에디터 어댑터 초기화 완료:', {
      enableStateChangeDetection:
        this.editorAdapterConfiguration.enableStateChangeDetection,
      pollingInterval:
        this.editorAdapterConfiguration.stateChangePollingInterval,
      enableAutoValidation:
        this.editorAdapterConfiguration.enableAutoValidation,
    });
  }

  protected async performConnection(): Promise<boolean> {
    console.log('🔗 [EDITOR_ADAPTER] 에디터 연결 수행');

    try {
      const extractedCoreState = this.extractorModule.extractCoreStoreState();
      const extractedUIState = this.extractorModule.extractUIStoreState();

      const hasCoreState = extractedCoreState !== null;
      const hasUIState = extractedUIState !== null;
      const isSuccessfullyConnected = hasCoreState && hasUIState;

      console.log('📊 [EDITOR_ADAPTER] 연결 결과:', {
        isSuccessfullyConnected,
        hasCoreState,
        hasUIState,
      });

      return isSuccessfullyConnected;
    } catch (connectionError) {
      console.error('❌ [EDITOR_ADAPTER] 연결 실패:', connectionError);
      return false;
    }
  }

  protected async performDisconnection(): Promise<void> {
    console.log('🔌 [EDITOR_ADAPTER] 에디터 연결 해제');

    this.lastSnapshotTimestamp = 0;
    this.clearDataCache();

    console.log('✅ [EDITOR_ADAPTER] 연결 해제 완료');
  }

  protected async performHealthCheck(): Promise<boolean> {
    console.log('💓 [EDITOR_ADAPTER] 에디터 헬스 체크');

    try {
      const currentEditorState = this.updaterModule.getCurrentEditorState();
      const hasValidCurrentState = currentEditorState !== null;

      const testSnapshot = this.extractorModule.extractRawEditorData();
      const hasValidExtractionCapability = testSnapshot !== null;

      const isHealthyState =
        hasValidCurrentState && hasValidExtractionCapability;

      console.log('📊 [EDITOR_ADAPTER] 헬스 체크 결과:', {
        isHealthyState,
        hasValidCurrentState,
        hasValidExtractionCapability,
      });

      return isHealthyState;
    } catch (healthCheckError) {
      console.error('❌ [EDITOR_ADAPTER] 헬스 체크 실패:', healthCheckError);
      return false;
    }
  }

  protected async extractDataFromSystem(): Promise<EditorStateSnapshotForBridge> {
    console.log('📤 [EDITOR_ADAPTER] 시스템에서 데이터 추출');
    const extractionStartTime = performance.now();

    try {
      const currentTimestamp = Date.now();
      const cacheKey = `editor_snapshot_${currentTimestamp}`;
      const cachedSnapshot = this.getCachedData(cacheKey);

      const shouldUseCachedData = cachedSnapshot !== null;
      if (shouldUseCachedData) {
        console.log('🔍 [EDITOR_ADAPTER] 캐시된 스냅샷 사용');
        return cachedSnapshot;
      }

      const rawEditorData = this.extractorModule.extractRawEditorData();

      const isNullRawData = !rawEditorData;
      if (isNullRawData) {
        console.error('❌ [EDITOR_ADAPTER] 원시 데이터 추출 실패');
        return this.createFallbackSnapshot();
      }

      const {
        containerList: extractedContainerList,
        paragraphList: extractedParagraphList,
        completionStatus: editorCompletionStatus,
        activeParagraphId: currentActiveParagraphId,
        selectedParagraphIdList: currentSelectedParagraphIds,
        previewOpenStatus: currentPreviewOpenStatus,
        generatedContent: completedContent,
      } = rawEditorData;

      const extractionEndTime = performance.now();
      const extractionDurationMs = extractionEndTime - extractionStartTime;

      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp: currentTimestamp,
        processingDurationMs: extractionDurationMs,
        validationStatus: true,
        dataIntegrity: completedContent.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
        additionalMetrics: new Map([
          ['containerCount', extractedContainerList.length],
          ['paragraphCount', extractedParagraphList.length],
          ['contentLength', completedContent.length],
        ]),
        processingFlags: new Set(['EXTRACTION_COMPLETE', 'CONTENT_GENERATED']),
      };

      const editorSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: extractedContainerList,
        editorParagraphs: extractedParagraphList,
        editorCompletedContent: completedContent,
        editorIsCompleted: editorCompletionStatus,
        editorActiveParagraphId: currentActiveParagraphId,
        editorSelectedParagraphIds: [...currentSelectedParagraphIds],
        editorIsPreviewOpen: currentPreviewOpenStatus,
        extractedTimestamp: currentTimestamp,
        snapshotMetadata,
        contentStatistics: new Map([
          ['totalContainers', extractedContainerList.length],
          ['totalParagraphs', extractedParagraphList.length],
          ['totalContentLength', completedContent.length],
        ]),
        validationCache: new Map([
          ['hasContainers', extractedContainerList.length > 0],
          ['hasParagraphs', extractedParagraphList.length > 0],
          ['hasContent', completedContent.length > 0],
        ]),
      };

      this.setCachedData(cacheKey, editorSnapshot);
      this.lastSnapshotTimestamp = editorSnapshot.extractedTimestamp;

      console.log('✅ [EDITOR_ADAPTER] 데이터 추출 완료:', {
        durationMs: `${extractionDurationMs.toFixed(2)}ms`,
        containerCount: extractedContainerList.length,
        paragraphCount: extractedParagraphList.length,
        contentLength: completedContent.length,
        isCompleted: editorCompletionStatus,
      });

      return editorSnapshot;
    } catch (extractionError) {
      console.error('❌ [EDITOR_ADAPTER] 데이터 추출 실패:', extractionError);
      return this.createFallbackSnapshot();
    }
  }

  protected async updateDataToSystem(
    dataPayload: EditorStateSnapshotForBridge
  ): Promise<boolean> {
    console.log('📥 [EDITOR_ADAPTER] 시스템에 데이터 업데이트');

    try {
      const {
        editorCompletedContent: contentToUpdate,
        editorIsCompleted: completionStatusToUpdate,
      } = dataPayload;

      const isValidUpdateData = this.updaterModule.validateUpdateData(
        contentToUpdate,
        completionStatusToUpdate
      );

      if (!isValidUpdateData) {
        console.error('❌ [EDITOR_ADAPTER] 유효하지 않은 업데이트 데이터');
        return false;
      }

      const updateResult = await this.updaterModule.updateEditorState(
        contentToUpdate,
        completionStatusToUpdate
      );

      console.log('📊 [EDITOR_ADAPTER] 시스템 업데이트 결과:', {
        updateResult,
        contentLength: contentToUpdate.length,
        isCompleted: completionStatusToUpdate,
      });

      return updateResult;
    } catch (updateError) {
      console.error('❌ [EDITOR_ADAPTER] 시스템 업데이트 실패:', updateError);
      return false;
    }
  }

  protected validateExtractedData(
    dataPayload: EditorStateSnapshotForBridge
  ): ValidationResult {
    console.log('🔍 [EDITOR_ADAPTER] 추출된 데이터 검증');

    try {
      const {
        editorContainers: snapshotContainerList,
        editorParagraphs: snapshotParagraphList,
        editorCompletedContent: snapshotCompletedContent,
        editorIsCompleted: snapshotCompletionStatus,
        extractedTimestamp: snapshotTimestamp,
      } = dataPayload;

      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];
      const errorDetails = new Map<string, string>();

      const hasValidContainers = this.typeGuardHelpers.isValidArray(
        snapshotContainerList
      );
      if (!hasValidContainers) {
        validationErrors.push('컨테이너가 유효한 배열이 아님');
        errorDetails.set('containers', '배열 타입 검증 실패');
      }

      const hasValidParagraphs = this.typeGuardHelpers.isValidArray(
        snapshotParagraphList
      );
      if (!hasValidParagraphs) {
        validationErrors.push('문단이 유효한 배열이 아님');
        errorDetails.set('paragraphs', '배열 타입 검증 실패');
      }

      const hasValidContent = this.typeGuardHelpers.isValidString(
        snapshotCompletedContent
      );
      if (!hasValidContent) {
        validationErrors.push('완성된 콘텐츠가 유효한 문자열이 아님');
        errorDetails.set('content', '문자열 타입 검증 실패');
      }

      const hasValidCompleted = this.typeGuardHelpers.isValidBoolean(
        snapshotCompletionStatus
      );
      if (!hasValidCompleted) {
        validationErrors.push('완료 상태가 유효한 불린값이 아님');
        errorDetails.set('completion', '불린 타입 검증 실패');
      }

      const hasValidTimestamp =
        this.typeGuardHelpers.isValidNumber(snapshotTimestamp) &&
        snapshotTimestamp > 0;
      if (!hasValidTimestamp) {
        validationErrors.push('타임스탬프가 유효하지 않음');
        errorDetails.set('timestamp', '숫자 타입 검증 실패');
      }

      if (snapshotContainerList.length === 0) {
        validationWarnings.push('컨테이너가 없습니다');
      }

      if (snapshotParagraphList.length === 0) {
        validationWarnings.push('문단이 없습니다');
      }

      const { enableAutoValidation } = this.editorAdapterConfiguration;
      if (enableAutoValidation && hasValidContainers && hasValidParagraphs) {
        try {
          const containersValidationResult = validateEditorContainers([
            ...snapshotContainerList,
          ]);
          if (!containersValidationResult) {
            validationErrors.push('컨테이너 구조 검증 실패');
            errorDetails.set('containerStructure', '상세 구조 검증 실패');
          }

          const paragraphsValidationResult = validateEditorParagraphs([
            ...snapshotParagraphList,
          ]);
          if (!paragraphsValidationResult) {
            validationErrors.push('문단 구조 검증 실패');
            errorDetails.set('paragraphStructure', '상세 구조 검증 실패');
          }
        } catch (structureValidationError) {
          console.warn(
            '⚠️ [EDITOR_ADAPTER] 구조 검증 중 오류:',
            structureValidationError
          );
          validationWarnings.push('구조 검증 중 오류 발생');
        }
      }

      const isValidForTransfer = validationErrors.length === 0;
      const hasMinimumContent = snapshotCompletedContent.length > 0;
      const hasRequiredStructure = hasValidContainers && hasValidParagraphs;

      const validationResult: ValidationResult = {
        isValidForTransfer,
        validationErrors,
        validationWarnings,
        hasMinimumContent,
        hasRequiredStructure,
        errorDetails,
        validationMetrics: new Map([
          ['errorCount', validationErrors.length],
          ['warningCount', validationWarnings.length],
          ['contentLength', snapshotCompletedContent.length],
        ]),
        validationFlags: new Set([
          isValidForTransfer ? 'VALID' : 'INVALID',
          hasMinimumContent ? 'HAS_CONTENT' : 'NO_CONTENT',
          hasRequiredStructure ? 'STRUCTURED' : 'UNSTRUCTURED',
        ]),
      };

      console.log('📊 [EDITOR_ADAPTER] 데이터 검증 결과:', {
        isValidForTransfer,
        errorCount: validationErrors.length,
        warningCount: validationWarnings.length,
        hasMinimumContent,
        hasRequiredStructure,
      });

      return validationResult;
    } catch (validationError) {
      console.error('❌ [EDITOR_ADAPTER] 검증 실패:', validationError);

      const fallbackValidationResult: ValidationResult = {
        isValidForTransfer: false,
        validationErrors: ['검증 과정에서 오류 발생'],
        validationWarnings: [],
        hasMinimumContent: false,
        hasRequiredStructure: false,
        errorDetails: new Map([['validation', '검증 실행 실패']]),
        validationMetrics: new Map([['errorCount', 1]]),
        validationFlags: new Set(['VALIDATION_FAILED']),
      };

      return fallbackValidationResult;
    }
  }

  protected createDataSnapshot(
    dataPayload: EditorStateSnapshotForBridge
  ): EditorStateSnapshotForBridge {
    console.log('📸 [EDITOR_ADAPTER] 데이터 스냅샷 생성');

    try {
      const currentTimestamp = Date.now();
      const { snapshotMetadata: originalMetadata } = dataPayload;

      const updatedMetadata: SnapshotMetadata = {
        extractionTimestamp: currentTimestamp,
        processingDurationMs: originalMetadata.processingDurationMs,
        validationStatus: originalMetadata.validationStatus,
        dataIntegrity: originalMetadata.dataIntegrity,
        sourceInfo: {
          coreStoreVersion: originalMetadata.sourceInfo.coreStoreVersion,
          uiStoreVersion: originalMetadata.sourceInfo.uiStoreVersion,
        },
        additionalMetrics: new Map(originalMetadata.additionalMetrics),
        processingFlags: new Set(originalMetadata.processingFlags),
      };

      const snapshotResult: EditorStateSnapshotForBridge = {
        ...dataPayload,
        extractedTimestamp: currentTimestamp,
        snapshotMetadata: updatedMetadata,
      };

      console.log('✅ [EDITOR_ADAPTER] 스냅샷 생성 완료:', {
        timestamp: currentTimestamp,
        containerCount: snapshotResult.editorContainers.length,
        paragraphCount: snapshotResult.editorParagraphs.length,
      });

      return snapshotResult;
    } catch (snapshotError) {
      console.error('❌ [EDITOR_ADAPTER] 스냅샷 생성 실패:', snapshotError);
      return this.createFallbackSnapshot();
    }
  }

  private createFallbackSnapshot(): EditorStateSnapshotForBridge {
    console.log('🔄 [EDITOR_ADAPTER] fallback 스냅샷 생성');

    const fallbackTimestamp = Date.now();
    const fallbackMetadata: SnapshotMetadata = {
      extractionTimestamp: fallbackTimestamp,
      processingDurationMs: 0,
      validationStatus: false,
      dataIntegrity: false,
      sourceInfo: {
        coreStoreVersion: '1.0.0-fallback',
        uiStoreVersion: '1.0.0-fallback',
      },
      additionalMetrics: new Map([
        ['containerCount', 0],
        ['paragraphCount', 0],
        ['contentLength', 0],
      ]),
      processingFlags: new Set(['FALLBACK_SNAPSHOT']),
    };

    return {
      editorContainers: [],
      editorParagraphs: [],
      editorCompletedContent: '',
      editorIsCompleted: false,
      editorActiveParagraphId: null,
      editorSelectedParagraphIds: [],
      editorIsPreviewOpen: false,
      extractedTimestamp: fallbackTimestamp,
      snapshotMetadata: fallbackMetadata,
      contentStatistics: new Map([
        ['totalContainers', 0],
        ['totalParagraphs', 0],
        ['totalContentLength', 0],
      ]),
      validationCache: new Map([
        ['hasContainers', false],
        ['hasParagraphs', false],
        ['hasContent', false],
      ]),
    };
  }

  public async updateContent(targetContent: string): Promise<boolean> {
    console.log('🔄 [EDITOR_ADAPTER] 콘텐츠 업데이트 (공개 메서드)');
    return await this.updaterModule.updateEditorContent(targetContent);
  }

  public async updateCompletion(
    targetCompletionStatus: boolean
  ): Promise<boolean> {
    console.log('🔄 [EDITOR_ADAPTER] 완료 상태 업데이트 (공개 메서드)');
    return await this.updaterModule.updateEditorCompletion(
      targetCompletionStatus
    );
  }

  public getCurrentState(): EditorStateSnapshotForBridge | null {
    console.log('🔍 [EDITOR_ADAPTER] 현재 상태 조회 (공개 메서드)');

    try {
      const currentSnapshot = this.extractorModule.extractRawEditorData();

      const isNullSnapshot = !currentSnapshot;
      if (isNullSnapshot) {
        return null;
      }

      const {
        containerList,
        paragraphList,
        completionStatus,
        activeParagraphId,
        selectedParagraphIdList,
        previewOpenStatus,
        generatedContent,
      } = currentSnapshot;

      const currentTimestamp = Date.now();
      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp: currentTimestamp,
        processingDurationMs: 0,
        validationStatus: true,
        dataIntegrity: generatedContent.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
        additionalMetrics: new Map([
          ['containerCount', containerList.length],
          ['paragraphCount', paragraphList.length],
          ['contentLength', generatedContent.length],
        ]),
        processingFlags: new Set(['CURRENT_STATE_SNAPSHOT']),
      };

      const stateSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: containerList,
        editorParagraphs: paragraphList,
        editorCompletedContent: generatedContent,
        editorIsCompleted: completionStatus,
        editorActiveParagraphId: activeParagraphId,
        editorSelectedParagraphIds: [...selectedParagraphIdList],
        editorIsPreviewOpen: previewOpenStatus,
        extractedTimestamp: currentTimestamp,
        snapshotMetadata,
        contentStatistics: new Map([
          ['totalContainers', containerList.length],
          ['totalParagraphs', paragraphList.length],
          ['totalContentLength', generatedContent.length],
        ]),
        validationCache: new Map([
          ['hasContainers', containerList.length > 0],
          ['hasParagraphs', paragraphList.length > 0],
          ['hasContent', generatedContent.length > 0],
        ]),
      };

      return stateSnapshot;
    } catch (stateError) {
      console.error('❌ [EDITOR_ADAPTER] 현재 상태 조회 실패:', stateError);
      return null;
    }
  }

  public extractStateWithStatistics(): {
    snapshot: EditorStateSnapshotForBridge | null;
    statistics: ReturnType<typeof calculateEditorStatistics> | null;
  } {
    console.log('📊 [EDITOR_ADAPTER] 통계와 함께 상태 추출 (공개 메서드)');

    try {
      const editorSnapshot = this.getCurrentState();

      const isNullSnapshot = !editorSnapshot;
      if (isNullSnapshot) {
        return { snapshot: null, statistics: null };
      }

      const {
        editorContainers: containerList,
        editorParagraphs: paragraphList,
      } = editorSnapshot;

      try {
        const editorStatistics = calculateEditorStatistics(
          [...containerList],
          [...paragraphList]
        );

        return {
          snapshot: editorSnapshot,
          statistics: editorStatistics,
        };
      } catch (statisticsError) {
        console.warn('⚠️ [EDITOR_ADAPTER] 통계 계산 실패:', statisticsError);

        const fallbackStatistics = this.createFallbackStatistics(
          containerList,
          paragraphList
        );

        return {
          snapshot: editorSnapshot,
          statistics: fallbackStatistics,
        };
      }
    } catch (extractionError) {
      console.error(
        '❌ [EDITOR_ADAPTER] 통계와 함께 상태 추출 실패:',
        extractionError
      );
      return { snapshot: null, statistics: null };
    }
  }

  private createFallbackStatistics(
    containerList: readonly Container[],
    paragraphList: readonly ParagraphBlock[]
  ) {
    const assignedParagraphsCount = paragraphList.filter(
      ({ containerId = null }) => containerId !== null
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
  }

  public getLastSnapshotTimestamp(): number {
    return this.lastSnapshotTimestamp;
  }

  public getConfiguration(): EditorAdapterConfiguration {
    return { ...this.editorAdapterConfiguration };
  }
}

export function createEditorAdapter(
  customConfiguration?: Partial<EditorAdapterConfiguration>
): EditorAdapter {
  console.log('🏭 [EDITOR_ADAPTER_FACTORY] 에디터 어댑터 생성');
  return new EditorAdapter(customConfiguration);
}

let editorAdapterSingletonInstance: EditorAdapter | null = null;

export function getEditorAdapterInstance(
  customConfiguration?: Partial<EditorAdapterConfiguration>
): EditorAdapter {
  if (!editorAdapterSingletonInstance) {
    console.log(
      '🏭 [EDITOR_ADAPTER_SINGLETON] 에디터 어댑터 싱글톤 인스턴스 생성'
    );
    editorAdapterSingletonInstance = new EditorAdapter(customConfiguration);
  }
  return editorAdapterSingletonInstance;
}

export function resetEditorAdapterInstance(): void {
  if (editorAdapterSingletonInstance) {
    console.log(
      '🔄 [EDITOR_ADAPTER_SINGLETON] 에디터 어댑터 싱글톤 인스턴스 재설정'
    );
    editorAdapterSingletonInstance.disconnect();
    editorAdapterSingletonInstance = null;
  }
}

export default EditorAdapter;
