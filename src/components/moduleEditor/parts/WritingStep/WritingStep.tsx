// components/moduleEditor/parts/WritingStep/WritingStep.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StepControls from './controls/StepControls';
import ParagraphEditor from './paragraph/ParagraphEditor';
import { MarkdownCompleteButton } from '../../../../bridges/parts/MarkdownCompleteButton';
import { MarkdownStatusCard } from '../../../../bridges/parts/MarkdownStatusCard';
import { MarkdownResultToast } from '../../../../bridges/parts/MarkdownResultToast';
import { QuickStatusBar } from '../../../../bridges/parts/QuickStatusBar';

import {
  ErrorStatusModal,
  useErrorStatusModal,
} from '../../../../bridges/parts/ErrorStatusModal';

import { useBridgeUI } from '../../../../bridges/hooks/useBridgeUI';

import { EditorSidebarContainer } from './sidebar/EditorSidebarContainer';
import { StructureManagementSlide } from './sidebar/slides/StructureManagementSlide';
import { FinalPreviewSlide } from './sidebar/slides/FinalPreviewSlide';

import { PreviewPanelProps } from '../../../swipeableSection/types/swipeableTypes.ts';
import type { Container } from '../../../../store/shared/commonTypes';

import type {
  BridgeSystemConfiguration,
  ExternalEditorData,
  LocalParagraphForExternal,
} from '../../../../bridges/editorMultiStepBridge/modernBridgeTypes';
import { editorStyles } from './editorStyle.ts';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface ExtendedContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
}

interface WritingStepProps {
  localContainers: Container[];
  localParagraphs: LocalParagraph[];
  internalState: EditorInternalState;
  renderMarkdown: (text: string) => React.ReactNode;
  goToStructureStep: () => void;
  saveAllToContext: () => void;
  completeEditor: () => void;
  addLocalParagraph: () => void;
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  togglePreview: () => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;
  setTargetContainerId: (containerId: string) => void;
  getLocalUnassignedParagraphs: () => LocalParagraph[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
}

// 🔧 브릿지 설정 레코드 타입 (인덱스 시그니처 지원)
interface BridgeConfigurationRecord {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
  readonly maxRetryAttempts: number;
  readonly timeoutMs: number;
  readonly performanceLogging: boolean;
  readonly strictTypeChecking: boolean;
  readonly [key: string]: unknown;
}

// 🔧 기본 검증 상태 생성 함수 - 수정됨
const createDefaultValidationStatus = () => ({
  containerCount: 0,
  paragraphCount: 0,
  assignedParagraphCount: 0,
  unassignedParagraphCount: 0,
  totalContentLength: 0,
  validationErrors: [],
  validationWarnings: [],
  isReadyForTransfer: false,
});

// 🔧 검증 상태 유효성 검사 함수 - 수정됨: 실제 ValidationState 구조에 맞춤
const isValidValidationStatus = (status: unknown): boolean => {
  if (!status || typeof status !== 'object') {
    return false;
  }

  // 🔧 수정: 실제 ValidationState 인터페이스의 속성들로 변경
  const requiredProperties = [
    'isValid',
    'errorCount',
    'warningCount',
    'infoCount',
    'errors',
    'warnings',
    'infos',
    'validationProgress',
  ];

  return requiredProperties.every((prop) => prop in status);
};

// 🔧 안전한 타입 변환 함수들 (타입 단언 없이)
function createSafeContainer(candidate: unknown): Container | null {
  const isValidObject = candidate !== null && typeof candidate === 'object';
  if (!isValidObject) {
    return null;
  }

  const containerObj = candidate;
  const hasRequiredProperties =
    'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

  if (!hasRequiredProperties) {
    return null;
  }

  const idValue = Reflect.get(containerObj, 'id');
  const nameValue = Reflect.get(containerObj, 'name');
  const orderValue = Reflect.get(containerObj, 'order');
  const createdAtValue = Reflect.get(containerObj, 'createdAt');
  const updatedAtValue = Reflect.get(containerObj, 'updatedAt');

  const hasValidTypes =
    typeof idValue === 'string' &&
    typeof nameValue === 'string' &&
    typeof orderValue === 'number';

  if (!hasValidTypes || idValue.length === 0 || nameValue.length === 0) {
    return null;
  }

  // 새로운 객체 생성 (타입 단언 없이)
  const safeContainer: Container = {
    id: idValue,
    name: nameValue,
    order: orderValue,
    createdAt: createdAtValue instanceof Date ? createdAtValue : new Date(),
    updatedAt: updatedAtValue instanceof Date ? updatedAtValue : new Date(),
  };

  return safeContainer;
}

function createSafeParagraph(candidate: unknown): LocalParagraph | null {
  const isValidObject = candidate !== null && typeof candidate === 'object';
  if (!isValidObject) {
    return null;
  }

  const paragraphObj = candidate;
  const hasRequiredProperties =
    'id' in paragraphObj &&
    'content' in paragraphObj &&
    'order' in paragraphObj &&
    'containerId' in paragraphObj;

  if (!hasRequiredProperties) {
    return null;
  }

  const idValue = Reflect.get(paragraphObj, 'id');
  const contentValue = Reflect.get(paragraphObj, 'content');
  const orderValue = Reflect.get(paragraphObj, 'order');
  const containerIdValue = Reflect.get(paragraphObj, 'containerId');
  const createdAtValue = Reflect.get(paragraphObj, 'createdAt');
  const updatedAtValue = Reflect.get(paragraphObj, 'updatedAt');
  const originalIdValue = Reflect.get(paragraphObj, 'originalId');

  const hasValidTypes =
    typeof idValue === 'string' &&
    typeof contentValue === 'string' &&
    typeof orderValue === 'number' &&
    (containerIdValue === null || typeof containerIdValue === 'string');

  if (!hasValidTypes || idValue.length === 0) {
    return null;
  }

  // 새로운 객체 생성 (타입 단언 없이)
  const safeParagraph: LocalParagraph = {
    id: idValue,
    content: contentValue,
    order: orderValue,
    containerId: containerIdValue,
    createdAt: createdAtValue instanceof Date ? createdAtValue : new Date(),
    updatedAt: updatedAtValue instanceof Date ? updatedAtValue : new Date(),
  };

  // Optional 속성 처리
  if (typeof originalIdValue === 'string') {
    safeParagraph.originalId = originalIdValue;
  }

  return safeParagraph;
}

// 🔧 브릿지 설정 변환 함수 (타입 호환성 확보)
function convertToBridgeConfigurationRecord(
  bridgeConfig: BridgeSystemConfiguration
): BridgeConfigurationRecord {
  console.log('🔧 [WRITING_STEP] 브릿지 설정 변환 시작');

  const {
    enableValidation = true,
    enableErrorRecovery = true,
    debugMode = false,
    maxRetryAttempts = 3,
    timeoutMs = 5000,
    performanceLogging = false,
    strictTypeChecking = true,
    customValidationRules = new Map(),
    featureFlags = new Set(),
  } = bridgeConfig;

  const convertedConfig: BridgeConfigurationRecord = {
    enableValidation,
    enableErrorRecovery,
    debugMode,
    maxRetryAttempts,
    timeoutMs,
    performanceLogging,
    strictTypeChecking,
    customValidationRules:
      customValidationRules instanceof Map ? customValidationRules : new Map(),
    featureFlags: featureFlags instanceof Set ? featureFlags : new Set(),
  };

  console.log('✅ [WRITING_STEP] 브릿지 설정 변환 완료:', {
    originalConfigType: 'BridgeSystemConfiguration',
    convertedConfigType: 'BridgeConfigurationRecord',
    enableValidation: convertedConfig.enableValidation,
    debugMode: convertedConfig.debugMode,
  });

  return convertedConfig;
}

// 🔧 LocalParagraph를 LocalParagraphForExternal로 변환하는 함수
function convertToExternalParagraph(
  localParagraph: LocalParagraph
): LocalParagraphForExternal {
  return {
    id: localParagraph.id,
    content: localParagraph.content,
    containerId: localParagraph.containerId,
    order: localParagraph.order,
    createdAt: localParagraph.createdAt,
    updatedAt: localParagraph.updatedAt,
    originalId: localParagraph.originalId,
  };
}

function createExternalDataFromProps(
  localContainers: Container[],
  localParagraphs: LocalParagraph[]
): ExternalEditorData {
  console.log('🔧 [WRITING_STEP] 외부 데이터 생성 시작');

  // 컨테이너 안전 변환
  const safeContainers: Container[] = [];
  if (Array.isArray(localContainers)) {
    localContainers.forEach((containerItem: Container) => {
      const safeContainer = createSafeContainer(containerItem);
      safeContainer ? safeContainers.push(safeContainer) : null;
    });
  }

  // 문단 안전 변환
  const safeParagraphs: LocalParagraph[] = [];
  if (Array.isArray(localParagraphs)) {
    localParagraphs.forEach((paragraphItem: LocalParagraph) => {
      const safeParagraph = createSafeParagraph(paragraphItem);
      safeParagraph ? safeParagraphs.push(safeParagraph) : null;
    });
  }

  // LocalParagraph를 LocalParagraphForExternal로 변환
  const externalParagraphs: LocalParagraphForExternal[] = safeParagraphs.map(
    (paragraphItem: LocalParagraph) => convertToExternalParagraph(paragraphItem)
  );

  const externalData: ExternalEditorData = {
    localContainers: safeContainers,
    localParagraphs: externalParagraphs,
  };

  console.log('✅ [WRITING_STEP] 외부 데이터 생성 완료:', {
    containerCount: safeContainers.length,
    paragraphCount: externalParagraphs.length,
    originalContainerCount: localContainers?.length || 0,
    originalParagraphCount: localParagraphs?.length || 0,
  });

  return externalData;
}

function WritingStep({
  localContainers,
  localParagraphs,
  internalState,
  renderMarkdown,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  addLocalParagraph,
  deleteLocalParagraph: _deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  togglePreview,
  setInternalState: _setInternalState,
  setTargetContainerId,
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
  moveToContainer,
}: WritingStepProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentEditingParagraphId, setCurrentEditingParagraphId] = useState<
    string | null
  >(null);

  // 🔧 외부 데이터 생성 (메모이제이션)
  const externalEditorData = useMemo(() => {
    return createExternalDataFromProps(localContainers, localParagraphs);
  }, [localContainers, localParagraphs]);

  // 🔧 핵심 수정: BridgeSystemConfiguration 생성 (외부 데이터 의존성 추가)
  const bridgeConfiguration: BridgeSystemConfiguration = useMemo(() => {
    console.log('🔧 [WRITING_STEP] Bridge 설정 생성 (외부 데이터 의존성 포함)');

    const featureFlags = new Set<string>();
    featureFlags.add('EXTERNAL_DATA_SUPPORT');

    const config: BridgeSystemConfiguration = {
      enableValidation: true,
      enableErrorRecovery: true,
      debugMode: true,
      maxRetryAttempts: 3,
      timeoutMs: 10000,
      performanceLogging: false,
      strictTypeChecking: true,
      customValidationRules: new Map(),
      featureFlags,
    };

    console.log('📊 [WRITING_STEP] 생성된 Bridge 설정:', {
      config,
      hasExternalData: !!externalEditorData,
      containerCount: externalEditorData.localContainers.length,
      paragraphCount: externalEditorData.localParagraphs.length,
    });

    return config;
  }, [externalEditorData]); // 🔧 중요: 외부 데이터 의존성 추가

  // 🔧 브릿지 설정을 호환 가능한 레코드 타입으로 변환
  const bridgeConfigurationRecord = useMemo((): BridgeConfigurationRecord => {
    return convertToBridgeConfigurationRecord(bridgeConfiguration);
  }, [bridgeConfiguration]);

  // 🔧 핵심 수정: useBridgeUI 훅 사용 (변환된 설정과 외부 데이터 전달)
  const {
    editorStatistics,
    validationState,
    isLoading: isTransferring,
    canExecuteAction: canTransfer,
    handleForwardTransfer: executeManualTransfer,
    hasExternalData,
    externalDataQuality,
  } = useBridgeUI(bridgeConfigurationRecord, externalEditorData); // 🔧 변환된 설정 사용

  const {
    isOpen: isErrorModalOpen,
    openModal: openErrorModal,
    closeModal: closeErrorModal,
  } = useErrorStatusModal();

  // 🔧 핵심 수정: validationState에서 정보 추출 - 올바른 속성명 사용
  const currentValidationStatus = useMemo(() => {
    console.log('🔍 [WRITING_STEP] 검증 상태 안전성 확인 (외부 데이터 지원):', {
      validationState,
      editorStatistics,
      hasExternalData,
      externalDataQuality,
      bridgeConfigProvided: !!bridgeConfiguration,
    });

    // 🔧 수정: validationState와 editorStatistics 분리하여 처리
    if (!validationState || !isValidValidationStatus(validationState)) {
      console.warn('⚠️ [WRITING_STEP] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    // 🔧 수정: editorStatistics에서 에디터 정보 추출
    const safeEditorStatistics = editorStatistics || {};
    const {
      containerCount = 0,
      paragraphCount = 0,
      assignedParagraphCount = 0,
      unassignedParagraphCount = 0,
      totalContentLength = 0,
    } = safeEditorStatistics;

    // 🔧 수정: validationState에서 검증 정보 추출 (올바른 속성명 사용)
    const { errors = [], warnings = [] } = validationState;

    return {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      unassignedParagraphCount,
      totalContentLength,
      validationErrors: Array.isArray(errors) ? errors : [],
      validationWarnings: Array.isArray(warnings) ? warnings : [],
      isReadyForTransfer: canTransfer, // 🔧 수정: useBridgeUI에서 제공하는 canExecuteAction 사용
    };
  }, [
    validationState,
    editorStatistics,
    bridgeConfiguration,
    canTransfer,
    hasExternalData,
    externalDataQuality,
  ]);

  const {
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = currentValidationStatus || createDefaultValidationStatus();

  console.log('🔍 [WRITING_STEP] 최종 검증 상태:', {
    currentValidationStatus,
    hasExternalData,
    externalDataQuality,
    canTransfer,
    isReadyForTransfer,
  });
  console.log('❌ [WRITING_STEP] validationErrors:', validationErrors);
  console.log('⚠️ [WRITING_STEP] validationWarnings:', validationWarnings);
  console.log('✅ [WRITING_STEP] isReadyForTransfer:', isReadyForTransfer);

  const hasErrorsForCompleteButton = useMemo(() => {
    const errorCount = Array.isArray(validationErrors)
      ? validationErrors.length
      : 0;
    const notReady = !isReadyForTransfer;
    const hasExternalDataIssues =
      hasExternalData && !externalDataQuality.isValid;

    console.log('📊 [WRITING_STEP] 완성 버튼용 에러 상태 계산:', {
      errorCount,
      notReady,
      hasExternalDataIssues,
      hasExternalData,
      externalDataValid: externalDataQuality.isValid,
      bridgeConfig: !!bridgeConfiguration,
    });

    return errorCount > 0 || notReady || hasExternalDataIssues;
  }, [
    validationErrors,
    isReadyForTransfer,
    hasExternalData,
    externalDataQuality.isValid,
    bridgeConfiguration,
  ]);

  // 🔧 완성 버튼 핸들러 수정 - 브리지 전송 연결 강화
  const handleCompleteEditor = useCallback(async () => {
    console.log(
      '🚀 [WRITING_STEP] 완성 버튼 클릭 - 브리지 전송 시작 (외부 데이터 지원)'
    );

    try {
      // 1단계: 외부 데이터 상태 확인
      console.log('📊 [WRITING_STEP] 외부 데이터 상태 확인:', {
        hasExternalData,
        externalDataValid: externalDataQuality.isValid,
        qualityScore: externalDataQuality.qualityScore,
        containerCount: externalEditorData.localContainers.length,
        paragraphCount: externalEditorData.localParagraphs.length,
      });

      // 2단계: 브리지 전송 가능 여부 확인
      if (!canTransfer) {
        console.warn('⚠️ [WRITING_STEP] 브리지 전송 불가 상태:', {
          canTransfer,
          isTransferring,
          isReadyForTransfer,
          validationErrorCount: validationErrors.length,
          hasExternalData,
          externalDataValid: externalDataQuality.isValid,
        });

        // 외부 데이터가 있지만 전송이 불가능한 경우 추가 정보 제공
        if (hasExternalData && !externalDataQuality.isValid) {
          console.error('❌ [WRITING_STEP] 외부 데이터 품질 문제:', {
            qualityScore: externalDataQuality.qualityScore,
            issues: externalDataQuality.issues,
          });
        }
        return;
      }

      // 3단계: 브리지를 통한 에디터 → 멀티스텝 전송
      console.log('📤 [WRITING_STEP] 브리지 전송 실행 (외부 데이터 포함)');
      await executeManualTransfer();

      // 4단계: 전송 성공 후 기존 완성 로직 실행
      console.log('✅ [WRITING_STEP] 브리지 전송 완료, 기존 완성 로직 실행');

      // 기존 completeEditor 함수 호출 (UI 전환 등)
      if (typeof completeEditor === 'function') {
        completeEditor();
      }

      console.log('🎉 [WRITING_STEP] 에디터 완성 프로세스 전체 완료');
    } catch (transferError) {
      console.error('❌ [WRITING_STEP] 브리지 전송 실패:', transferError);

      // 전송 실패해도 기존 로직은 실행 (fallback)
      if (typeof completeEditor === 'function') {
        completeEditor();
      }
    }
  }, [
    canTransfer,
    executeManualTransfer,
    completeEditor,
    isTransferring,
    isReadyForTransfer,
    validationErrors,
    hasExternalData,
    externalDataQuality,
    externalEditorData,
  ]);

  const handleShowErrorDetails = useCallback(() => {
    console.log('🔍 [WRITING_STEP] 에러 상세 정보 모달 열기');
    openErrorModal();
  }, [openErrorModal]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        console.log('📱 [WRITING_STEP] 모바일 상태 변경:', mobile);
        setIsMobile(mobile);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  // 🔧 브리지 연결 상태 확인용 Effect 강화
  useEffect(() => {
    console.log(
      '🔄 [WRITING_STEP] Bridge 연결 상태 모니터링 (외부 데이터 포함):',
      {
        localContainersCount: localContainers?.length || 0,
        localParagraphsCount: localParagraphs?.length || 0,
        bridgeConfigurationExists: !!bridgeConfiguration,
        externalDataExists: !!externalEditorData,
        externalDataContainerCount: externalEditorData.localContainers.length,
        externalDataParagraphCount: externalEditorData.localParagraphs.length,
        hasExternalData,
        externalDataQuality: externalDataQuality.qualityScore,
        currentValidationStatus,
        isReadyForTransfer,
        canTransfer,
        isTransferring,
      }
    );
  }, [
    localContainers,
    localParagraphs,
    bridgeConfiguration,
    externalEditorData,
    hasExternalData,
    externalDataQuality,
    currentValidationStatus,
    isReadyForTransfer,
    canTransfer,
    isTransferring,
  ]);

  const unassignedParagraphsForStats = useMemo(() => {
    try {
      const unassigned = getLocalUnassignedParagraphs();
      const safeUnassigned = Array.isArray(unassigned) ? unassigned : [];
      console.log('📊 [WRITING_STEP] 미할당 문단 통계:', {
        count: safeUnassigned.length,
        totalParagraphs: localParagraphs.length,
        externalDataParagraphs: externalEditorData.localParagraphs.length,
      });
      return safeUnassigned;
    } catch (error) {
      console.error('❌ [WRITING_STEP] 미할당 문단 통계 계산 실패:', error);
      return [];
    }
  }, [
    getLocalUnassignedParagraphs,
    localParagraphs.length,
    externalEditorData.localParagraphs.length,
  ]);

  const sortedContainers = useMemo(() => {
    try {
      const safeContainers = Array.isArray(localContainers)
        ? localContainers
        : [];
      const sorted = [...safeContainers].sort(
        (firstContainer: Container, secondContainer: Container) =>
          (firstContainer?.order || 0) - (secondContainer?.order || 0)
      );
      console.log('📋 [WRITING_STEP] 컨테이너 정렬 완료:', {
        sortedCount: sorted.length,
        originalCount: localContainers?.length || 0,
        externalCount: externalEditorData.localContainers.length,
      });
      return sorted;
    } catch (error) {
      console.error('❌ [WRITING_STEP] 컨테이너 정렬 실패:', error);
      return [];
    }
  }, [localContainers, externalEditorData.localContainers.length]);

  const handleUpdateParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      if (!paragraphId || typeof paragraphId !== 'string') {
        console.error('❌ [WRITING_STEP] 유효하지 않은 문단 ID:', paragraphId);
        return;
      }

      if (typeof content !== 'string') {
        console.error(
          '❌ [WRITING_STEP] 유효하지 않은 콘텐츠 타입:',
          typeof content
        );
        return;
      }

      try {
        console.log('🔄 [WRITING_STEP] 문단 내용 업데이트:', {
          paragraphId,
          contentLength: content.length,
        });
        updateLocalParagraphContent(paragraphId, content);
      } catch (updateError) {
        console.error(
          '❌ [WRITING_STEP] 단락 내용 업데이트 실패:',
          updateError
        );
      }
    },
    [updateLocalParagraphContent]
  );

  const handleToggleParagraphSelection = useCallback(
    (paragraphId: string) => {
      if (
        toggleParagraphSelection &&
        typeof toggleParagraphSelection === 'function'
      ) {
        try {
          console.log('🔄 [WRITING_STEP] 문단 선택 토글:', paragraphId);
          toggleParagraphSelection(paragraphId);
        } catch (toggleError) {
          console.error('❌ [WRITING_STEP] 단락 선택 토글 실패:', toggleError);
        }
      } else {
        console.warn(
          '⚠️ [WRITING_STEP] toggleParagraphSelection 함수가 유효하지 않음'
        );
      }
    },
    [toggleParagraphSelection]
  );

  const handleActivateEditModeForParagraph = useCallback(
    (paragraphId: string) => {
      console.log('✏️ [WRITING_STEP] 문단 편집 모드 활성화:', paragraphId);
      setCurrentEditingParagraphId(paragraphId);
      activateEditor(paragraphId);
    },
    [activateEditor]
  );

  const handleDeactivateEditMode = useCallback(() => {
    console.log('🔒 [WRITING_STEP] 편집 모드 비활성화');
    setCurrentEditingParagraphId(null);
    activateEditor('');
  }, [activateEditor]);

  const paragraphEditorProps = useMemo(
    () => ({
      isMobile,
      allVisibleParagraphs: localParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      updateLocalParagraphContent: handleUpdateParagraphContent,
      toggleParagraphSelection: handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      currentEditingParagraphId,
      onActivateEditMode: handleActivateEditModeForParagraph,
      onDeactivateEditMode: handleDeactivateEditMode,
    }),
    [
      isMobile,
      localParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      handleUpdateParagraphContent,
      handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      currentEditingParagraphId,
      handleActivateEditModeForParagraph,
      handleDeactivateEditMode,
    ]
  );

  const containerManagerProps: ExtendedContainerManagerProps = useMemo(
    () => ({
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      activateEditor: handleActivateEditModeForParagraph,
      moveToContainer,
    }),
    [
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      handleActivateEditModeForParagraph,
      moveToContainer,
    ]
  );

  const previewPanelProps: PreviewPanelProps = useMemo(
    () => ({
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      activateEditor: handleActivateEditModeForParagraph,
      togglePreview,
    }),
    [
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      handleActivateEditModeForParagraph,
      togglePreview,
    ]
  );

  const preparedStructureSlide = useMemo(
    () => (
      <StructureManagementSlide containerManagerProps={containerManagerProps} />
    ),
    [containerManagerProps]
  );

  const preparedPreviewSlide = useMemo(
    () => <FinalPreviewSlide previewPanelProps={previewPanelProps} />,
    [previewPanelProps]
  );

  const totalParagraphCount = useMemo(() => {
    const count = Array.isArray(localParagraphs) ? localParagraphs.length : 0;
    console.log('📊 [WRITING_STEP] 전체 문단 개수:', {
      localCount: count,
      externalCount: externalEditorData.localParagraphs.length,
    });
    return count;
  }, [localParagraphs, externalEditorData.localParagraphs.length]);

  return (
    <div className="w-full h-full">
      <div className="hidden h-full md:flex md:flex-col">
        <QuickStatusBar
          position="top"
          variant="default"
          showProgressBar={true}
          showQuickActions={true}
          showStatistics={false}
          enableCollapse={true}
          onQuickTransfer={handleCompleteEditor}
          onShowDetails={() => {}}
          bridgeConfig={bridgeConfigurationRecord}
          className="border-b border-gray-200 backdrop-blur-sm"
        />

        <StepControls
          sortedContainers={sortedContainers}
          goToStructureStep={goToStructureStep}
          saveAllToContext={saveAllToContext}
          completeEditor={handleCompleteEditor}
          bridgeConfig={bridgeConfigurationRecord}
        />
        <div className="mt-[30px]">
          <h2 className="text-xl font-bold text-gray-900">📝 단락 작성</h2>
          {hasExternalData && (
            <div className="mb-2 text-sm text-green-600">
              ✅ 외부 데이터 연결됨 (품질: {externalDataQuality.qualityScore}%)
            </div>
          )}
          <div className="flex w-[100%] items-center justify-between mb-4 border-gray-200 h-[800px] max-h-[800px] mt-[10px] overflow-scroll">
            <ParagraphEditor {...paragraphEditorProps} />
            <EditorSidebarContainer className="h-full">
              {preparedStructureSlide}
              {preparedPreviewSlide}
            </EditorSidebarContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full md:hidden">
        <div className="border-b border-gray-200 h-1/2">
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>

        <div className="flex flex-col flex-1">
          <StepControls
            sortedContainers={sortedContainers}
            goToStructureStep={goToStructureStep}
            saveAllToContext={saveAllToContext}
            completeEditor={handleCompleteEditor}
            bridgeConfig={bridgeConfigurationRecord}
          />
          <div className="mt-4 space-y-4">
            <MarkdownStatusCard
              size="sm"
              variant="default"
              hideTransferStatus={true}
              hideValidationDetails={true}
              hideStatistics={false}
              hideErrorsWarnings={true}
              bridgeConfig={bridgeConfigurationRecord}
              className="text-sm transition-all duration-200"
              onClick={() => {
                handleShowErrorDetails();
              }}
            />

            <MarkdownCompleteButton
              buttonText="마크다운 완성하기"
              size="md"
              variant="primary"
              fullWidth={true}
              onCompleteSuccess={handleCompleteEditor}
              showDetailedStatus={false}
              forceDisabled={hasErrorsForCompleteButton}
              bridgeConfig={bridgeConfigurationRecord}
              className="py-3 text-sm transition-all duration-200"
            />
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📝 단락 작성</h2>
              <div className="text-xs text-gray-500">
                {hasExternalData && (
                  <span className="mr-2 text-green-600">
                    외부 데이터 ({externalDataQuality.qualityScore}%)
                  </span>
                )}
                미할당: {unassignedParagraphsForStats.length}개 / 전체:{' '}
                {totalParagraphCount}개
              </div>
            </div>
            <div className="h-full pb-20">
              <ParagraphEditor {...paragraphEditorProps} />
            </div>
          </div>

          <QuickStatusBar
            position="bottom"
            variant="default"
            showProgressBar={true}
            showQuickActions={true}
            showStatistics={true}
            enableCollapse={false}
            onQuickTransfer={handleCompleteEditor}
            onShowDetails={() => {}}
            bridgeConfig={bridgeConfigurationRecord}
            className="border-t border-gray-200 backdrop-blur-sm"
          />
        </div>
      </div>

      <MarkdownResultToast
        position={isMobile ? 'top-center' : 'top-right'}
        duration={5000}
        maxToasts={3}
        bridgeConfig={bridgeConfigurationRecord}
        className="z-50"
        onToastClick={() => {}}
        onToastClose={() => {}}
      />

      <ErrorStatusModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        size="lg"
        title="브릿지 상태 및 오류 정보"
        bridgeConfig={bridgeConfigurationRecord}
        statusCardProps={{
          hideTransferStatus: false,
          hideValidationDetails: false,
          hideStatistics: false,
          hideErrorsWarnings: false,
        }}
        className="z-50"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: editorStyles,
        }}
      />
    </div>
  );
}

export default WritingStep;
