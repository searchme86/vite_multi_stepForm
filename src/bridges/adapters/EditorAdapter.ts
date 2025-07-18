// adapters/EditorAdapter.ts

import BaseAdapter from './BaseAdapter';
import type {
  EditorStateSnapshotForBridge,
  SnapshotMetadata,
  ValidationResult,
} from '../editorMultiStepBridge/bridgeDataTypes';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';
import { generateCompletedContent } from '../../store/shared/utilityFunctions';
import {
  validateEditorContainers,
  validateEditorParagraphs,
  calculateEditorStatistics,
} from '../utils/editorStateUtils';
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

  const isValidFunction = (value: unknown): value is Function => {
    return typeof value === 'function';
  };

  const isValidContainer = (
    candidateContainer: unknown
  ): candidateContainer is Container => {
    const isValidObjectType = isValidObject(candidateContainer);
    if (!isValidObjectType) {
      return false;
    }

    const containerObject = candidateContainer;
    const hasRequiredId =
      'id' in containerObject && isValidString(containerObject.id);
    const hasRequiredName =
      'name' in containerObject && isValidString(containerObject.name);
    const hasRequiredOrder =
      'order' in containerObject && isValidNumber(containerObject.order);

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
    const hasRequiredId =
      'id' in paragraphObject && isValidString(paragraphObject.id);
    const hasRequiredContent =
      'content' in paragraphObject && isValidString(paragraphObject.content);
    const hasRequiredOrder =
      'order' in paragraphObject && isValidNumber(paragraphObject.order);

    const hasValidContainerId =
      'containerId' in paragraphObject &&
      (paragraphObject.containerId === null ||
        isValidString(paragraphObject.containerId));

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
    const hasContainers =
      !('containers' in stateObject) || isValidArray(stateObject.containers);
    const hasParagraphs =
      !('paragraphs' in stateObject) || isValidArray(stateObject.paragraphs);
    const hasValidCompletion =
      !('isCompleted' in stateObject) ||
      isValidBoolean(stateObject.isCompleted);

    return hasContainers && hasParagraphs && hasValidCompletion;
  };

  const isValidEditorUIState = (
    candidateState: unknown
  ): candidateState is EditorUIState => {
    const isValidObjectType = isValidObject(candidateState);
    if (!isValidObjectType) {
      return false;
    }

    const stateObject = candidateState;
    const hasValidActiveParagraph =
      !('activeParagraphId' in stateObject) ||
      stateObject.activeParagraphId === null ||
      isValidString(stateObject.activeParagraphId);
    const hasValidSelectedParagraphs =
      !('selectedParagraphIds' in stateObject) ||
      isValidArray(stateObject.selectedParagraphIds);
    const hasValidPreviewOpen =
      !('isPreviewOpen' in stateObject) ||
      isValidBoolean(stateObject.isPreviewOpen);

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
  const typeGuards = createEditorAdapterTypeGuards();

  const safelyExecuteExtraction = <T>(
    operation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      return operation();
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

        const isValidState = typeGuards.isValidEditorStoreState(coreStoreState);
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

        const isValidState = typeGuards.isValidEditorUIState(uiStoreState);
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
          typeGuards.isValidArray(containersForContent);
        if (!isValidContainerArray) {
          console.warn(
            '⚠️ [EDITOR_ADAPTER] 유효하지 않은 컨테이너 배열, 빈 콘텐츠 반환'
          );
          return '';
        }

        const isValidParagraphArray =
          typeGuards.isValidArray(paragraphsForContent);
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
    containers: readonly Container[],
    paragraphs: readonly ParagraphBlock[]
  ): string => {
    return safelyExecuteExtraction(
      () => {
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

          const hasValidContainerId = containerId ? true : false;
          const hasValidContainerName = containerName ? true : false;
          const isValidContainer = hasValidContainerId && hasValidContainerName;

          if (!isValidContainer) {
            return;
          }

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

        const validContainerList = typeGuards.isValidArray(rawContainerList)
          ? rawContainerList.filter(typeGuards.isValidContainer)
          : [];

        const validParagraphList = typeGuards.isValidArray(rawParagraphList)
          ? rawParagraphList.filter(typeGuards.isValidParagraph)
          : [];

        const generatedContent = generateCompletedContentSafely(
          validContainerList,
          validParagraphList
        );

        const extractedData: ExtractedEditorData = {
          containerList: validContainerList,
          paragraphList: validParagraphList,
          completionStatus: typeGuards.isValidBoolean(editorCompletionStatus)
            ? editorCompletionStatus
            : false,
          activeParagraphId: currentActiveParagraphId,
          selectedParagraphIdList: typeGuards.isValidArray(
            currentSelectedParagraphIds
          )
            ? [...currentSelectedParagraphIds]
            : [],
          previewOpenStatus: typeGuards.isValidBoolean(currentPreviewOpenStatus)
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
  const typeGuards = createEditorAdapterTypeGuards();

  const safelyExecuteUpdate = async <T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (updateError) {
      console.error(
        `❌ [EDITOR_ADAPTER] ${operationName} 실행 실패:`,
        updateError
      );
      return fallbackValue;
    }
  };

  const updateEditorContent = async (content: string): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 콘텐츠 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const isValidContentString = typeGuards.isValidString(content);
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

        const { setCompletedContent } = editorState;
        const isValidSetFunction =
          typeGuards.isValidFunction(setCompletedContent);

        if (!isValidSetFunction) {
          console.error('❌ [EDITOR_ADAPTER] setCompletedContent 함수 없음');
          return false;
        }

        if (setCompletedContent) {
          setCompletedContent(content);
        }

        console.log('✅ [EDITOR_ADAPTER] 콘텐츠 업데이트 완료:', {
          contentLength: content.length,
        });

        return true;
      },
      false,
      'UPDATE_CONTENT'
    );
  };

  const updateEditorCompletion = async (
    isCompleted: boolean
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 완료 상태 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const isValidCompletionBoolean = typeGuards.isValidBoolean(isCompleted);
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

        const { setIsCompleted } = editorState;
        const isValidSetFunction = typeGuards.isValidFunction(setIsCompleted);

        if (!isValidSetFunction) {
          console.error('❌ [EDITOR_ADAPTER] setIsCompleted 함수 없음');
          return false;
        }

        if (setIsCompleted) {
          setIsCompleted(isCompleted);
        }

        console.log('✅ [EDITOR_ADAPTER] 완료 상태 업데이트 완료:', {
          isCompleted,
        });

        return true;
      },
      false,
      'UPDATE_COMPLETION'
    );
  };

  const updateEditorState = async (
    content: string,
    isCompleted: boolean
  ): Promise<boolean> => {
    console.log('🔄 [EDITOR_ADAPTER] Editor 전체 상태 업데이트');

    return safelyExecuteUpdate(
      async () => {
        const contentUpdateSuccess = await updateEditorContent(content);
        const completionUpdateSuccess = await updateEditorCompletion(
          isCompleted
        );

        const overallSuccess = contentUpdateSuccess && completionUpdateSuccess;

        console.log('📊 [EDITOR_ADAPTER] 전체 상태 업데이트 결과:', {
          contentUpdateSuccess,
          completionUpdateSuccess,
          overallSuccess,
        });

        return overallSuccess;
      },
      false,
      'UPDATE_STATE'
    );
  };

  const validateUpdateData = (
    content: string,
    isCompleted: boolean
  ): boolean => {
    const hasValidContent = typeGuards.isValidString(content);
    const hasValidCompletion = typeGuards.isValidBoolean(isCompleted);

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

      const { completedContent, isCompleted } = editorState;

      return {
        currentContent: completedContent ? completedContent : '',
        currentCompletion: typeGuards.isValidBoolean(isCompleted)
          ? isCompleted
          : false,
      };
    } catch (error) {
      console.error('❌ [EDITOR_ADAPTER] 현재 상태 조회 실패:', error);
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
  private readonly editorConfiguration: EditorAdapterConfiguration;
  private readonly extractorModule: ReturnType<
    typeof createEditorDataExtractorModule
  >;
  private readonly updaterModule: ReturnType<
    typeof createEditorDataUpdaterModule
  >;
  private readonly typeGuards: ReturnType<typeof createEditorAdapterTypeGuards>;
  private lastSnapshotTimestamp: number;

  constructor(configuration?: Partial<EditorAdapterConfiguration>) {
    console.log('🔧 [EDITOR_ADAPTER] 에디터 어댑터 초기화 시작');

    const defaultConfiguration: EditorAdapterConfiguration = {
      enableStateChangeDetection: true,
      stateChangePollingInterval: 1000,
      enableAutoValidation: true,
      cacheExpirationMs: 300000,
      enableContentGeneration: true,
    };

    const finalConfiguration = configuration
      ? { ...defaultConfiguration, ...configuration }
      : defaultConfiguration;

    super('EDITOR_ADAPTER', '1.0.0', {
      timeoutMs: 5000,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableHealthCheck: true,
      healthCheckIntervalMs: finalConfiguration.stateChangePollingInterval,
    });

    this.editorConfiguration = finalConfiguration;
    this.extractorModule = createEditorDataExtractorModule();
    this.updaterModule = createEditorDataUpdaterModule();
    this.typeGuards = createEditorAdapterTypeGuards();
    this.lastSnapshotTimestamp = 0;

    console.log('✅ [EDITOR_ADAPTER] 에디터 어댑터 초기화 완료:', {
      enableStateChangeDetection:
        this.editorConfiguration.enableStateChangeDetection,
      pollingInterval: this.editorConfiguration.stateChangePollingInterval,
      enableAutoValidation: this.editorConfiguration.enableAutoValidation,
    });
  }

  protected async performConnection(): Promise<boolean> {
    console.log('🔗 [EDITOR_ADAPTER] 에디터 연결 수행');

    try {
      const coreState = this.extractorModule.extractCoreStoreState();
      const uiState = this.extractorModule.extractUIStoreState();

      const hasCoreState = coreState !== null;
      const hasUIState = uiState !== null;
      const isConnected = hasCoreState && hasUIState;

      console.log('📊 [EDITOR_ADAPTER] 연결 결과:', {
        isConnected,
        hasCoreState,
        hasUIState,
      });

      return isConnected;
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
      const currentState = this.updaterModule.getCurrentEditorState();
      const hasValidState = currentState !== null;

      const testSnapshot = this.extractorModule.extractRawEditorData();
      const hasValidExtraction = testSnapshot !== null;

      const isHealthy = hasValidState && hasValidExtraction;

      console.log('📊 [EDITOR_ADAPTER] 헬스 체크 결과:', {
        isHealthy,
        hasValidState,
        hasValidExtraction,
      });

      return isHealthy;
    } catch (healthCheckError) {
      console.error('❌ [EDITOR_ADAPTER] 헬스 체크 실패:', healthCheckError);
      return false;
    }
  }

  protected async extractDataFromSystem(): Promise<EditorStateSnapshotForBridge> {
    console.log('📤 [EDITOR_ADAPTER] 시스템에서 데이터 추출');
    const extractionStartTime = performance.now();

    try {
      const cacheKey = `editor_snapshot_${Date.now()}`;
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
      const extractionDuration = extractionEndTime - extractionStartTime;

      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp: Date.now(),
        processingDurationMs: extractionDuration,
        validationStatus: true,
        dataIntegrity: completedContent.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
      };

      const editorSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: extractedContainerList,
        editorParagraphs: extractedParagraphList,
        editorCompletedContent: completedContent,
        editorIsCompleted: editorCompletionStatus,
        editorActiveParagraphId: currentActiveParagraphId,
        editorSelectedParagraphIds: [...currentSelectedParagraphIds],
        editorIsPreviewOpen: currentPreviewOpenStatus,
        extractedTimestamp: Date.now(),
        snapshotMetadata,
      };

      this.setCachedData(cacheKey, editorSnapshot);
      this.lastSnapshotTimestamp = editorSnapshot.extractedTimestamp;

      console.log('✅ [EDITOR_ADAPTER] 데이터 추출 완료:', {
        duration: `${extractionDuration.toFixed(2)}ms`,
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
      const { editorCompletedContent, editorIsCompleted } = dataPayload;

      const isValidData = this.updaterModule.validateUpdateData(
        editorCompletedContent,
        editorIsCompleted
      );

      if (!isValidData) {
        console.error('❌ [EDITOR_ADAPTER] 유효하지 않은 업데이트 데이터');
        return false;
      }

      const updateResult = await this.updaterModule.updateEditorState(
        editorCompletedContent,
        editorIsCompleted
      );

      console.log('📊 [EDITOR_ADAPTER] 시스템 업데이트 결과:', {
        updateResult,
        contentLength: editorCompletedContent.length,
        isCompleted: editorIsCompleted,
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

      const hasValidContainers = this.typeGuards.isValidArray(
        snapshotContainerList
      );
      if (!hasValidContainers) {
        validationErrors.push('컨테이너가 유효한 배열이 아님');
        errorDetails.set('containers', '배열 타입 검증 실패');
      }

      const hasValidParagraphs = this.typeGuards.isValidArray(
        snapshotParagraphList
      );
      if (!hasValidParagraphs) {
        validationErrors.push('문단이 유효한 배열이 아님');
        errorDetails.set('paragraphs', '배열 타입 검증 실패');
      }

      const hasValidContent = this.typeGuards.isValidString(
        snapshotCompletedContent
      );
      if (!hasValidContent) {
        validationErrors.push('완성된 콘텐츠가 유효한 문자열이 아님');
        errorDetails.set('content', '문자열 타입 검증 실패');
      }

      const hasValidCompleted = this.typeGuards.isValidBoolean(
        snapshotCompletionStatus
      );
      if (!hasValidCompleted) {
        validationErrors.push('완료 상태가 유효한 불린값이 아님');
        errorDetails.set('completion', '불린 타입 검증 실패');
      }

      const hasValidTimestamp =
        this.typeGuards.isValidNumber(snapshotTimestamp) &&
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

      const { enableAutoValidation } = this.editorConfiguration;
      if (enableAutoValidation && hasValidContainers && hasValidParagraphs) {
        try {
          const containersValid = validateEditorContainers([
            ...snapshotContainerList,
          ]);
          if (!containersValid) {
            validationErrors.push('컨테이너 구조 검증 실패');
            errorDetails.set('containerStructure', '상세 구조 검증 실패');
          }

          const paragraphsValid = validateEditorParagraphs([
            ...snapshotParagraphList,
          ]);
          if (!paragraphsValid) {
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
      };

      return fallbackValidationResult;
    }
  }

  protected createDataSnapshot(
    dataPayload: EditorStateSnapshotForBridge
  ): EditorStateSnapshotForBridge {
    console.log('📸 [EDITOR_ADAPTER] 데이터 스냅샷 생성');

    try {
      const snapshotTimestamp = Date.now();
      const { snapshotMetadata: originalMetadata } = dataPayload;

      const updatedMetadata: SnapshotMetadata = {
        extractionTimestamp: snapshotTimestamp,
        processingDurationMs: originalMetadata.processingDurationMs,
        validationStatus: originalMetadata.validationStatus,
        dataIntegrity: originalMetadata.dataIntegrity,
        sourceInfo: {
          coreStoreVersion: originalMetadata.sourceInfo.coreStoreVersion,
          uiStoreVersion: originalMetadata.sourceInfo.uiStoreVersion,
        },
      };

      const snapshotResult: EditorStateSnapshotForBridge = {
        ...dataPayload,
        extractedTimestamp: snapshotTimestamp,
        snapshotMetadata: updatedMetadata,
      };

      console.log('✅ [EDITOR_ADAPTER] 스냅샷 생성 완료:', {
        timestamp: snapshotTimestamp,
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
  }

  public async updateContent(content: string): Promise<boolean> {
    console.log('🔄 [EDITOR_ADAPTER] 콘텐츠 업데이트 (공개 메서드)');
    return await this.updaterModule.updateEditorContent(content);
  }

  public async updateCompletion(isCompleted: boolean): Promise<boolean> {
    console.log('🔄 [EDITOR_ADAPTER] 완료 상태 업데이트 (공개 메서드)');
    return await this.updaterModule.updateEditorCompletion(isCompleted);
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

      const snapshotMetadata: SnapshotMetadata = {
        extractionTimestamp: Date.now(),
        processingDurationMs: 0,
        validationStatus: true,
        dataIntegrity: generatedContent.length > 0,
        sourceInfo: {
          coreStoreVersion: '1.0.0',
          uiStoreVersion: '1.0.0',
        },
      };

      const stateSnapshot: EditorStateSnapshotForBridge = {
        editorContainers: containerList,
        editorParagraphs: paragraphList,
        editorCompletedContent: generatedContent,
        editorIsCompleted: completionStatus,
        editorActiveParagraphId: activeParagraphId,
        editorSelectedParagraphIds: [...selectedParagraphIdList],
        editorIsPreviewOpen: previewOpenStatus,
        extractedTimestamp: Date.now(),
        snapshotMetadata,
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
  }

  public getLastSnapshotTimestamp(): number {
    return this.lastSnapshotTimestamp;
  }

  public getConfiguration(): EditorAdapterConfiguration {
    return { ...this.editorConfiguration };
  }
}

export function createEditorAdapter(
  configuration?: Partial<EditorAdapterConfiguration>
): EditorAdapter {
  console.log('🏭 [EDITOR_ADAPTER_FACTORY] 에디터 어댑터 생성');
  return new EditorAdapter(configuration);
}

let editorAdapterSingletonInstance: EditorAdapter | null = null;

export function getEditorAdapterInstance(
  configuration?: Partial<EditorAdapterConfiguration>
): EditorAdapter {
  if (!editorAdapterSingletonInstance) {
    console.log(
      '🏭 [EDITOR_ADAPTER_SINGLETON] 에디터 어댑터 싱글톤 인스턴스 생성'
    );
    editorAdapterSingletonInstance = new EditorAdapter(configuration);
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
