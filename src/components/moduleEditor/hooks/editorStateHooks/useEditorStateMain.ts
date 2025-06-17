import { useState, useEffect } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';

// store들을 직접 import하여 반응성 보장
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

// 타입 정의
import { UseEditorStateProps, LocalParagraph } from './editorStateTypes';

// 초기화 관련
import {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
} from './editorStateInitializers';

// 디바이스 감지
import { useDeviceDetection } from './editorStateDeviceDetection';

// 단락 관련 액션들
import {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
} from './editorStateParagraphActions';

// 컨테이너 관련 액션들
import { addParagraphsToContainer } from './editorStateContainerActions';

// 데이터 조회 관련
import {
  getUnassignedParagraphs,
  getParagraphsByContainer,
} from './editorStateQueries';

// 상태 관리 관련
import {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
} from './editorStateManagement';

// 워크플로우 관련
import {
  completeStructureSetup,
  navigateToStructureStep,
  setActiveEditor,
  switchPreviewMode,
} from './editorStateWorkflow';

// 저장/완료 관련
import { saveCurrentProgress, finishEditing } from './editorStatePersistence';

// 함수 오버로드 - 타입 안정성을 위한 다중 시그니처 정의
export function useEditorState(): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(
  props: UseEditorStateProps
): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(props?: UseEditorStateProps) {
  return useEditorStateImpl(props);
}

// 메인 훅 구현 - 에디터 상태 관리의 핵심 로직
const useEditorStateImpl = (props?: UseEditorStateProps) => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  // === Store 액션들 - zustand store의 액션 함수들을 직접 호출하여 반응성 보장 ===
  const editorCoreStoreData = useEditorCoreStore() || {};
  const editorUIStoreData = useEditorUIStore() || {};
  const toastStoreData = useToastStore() || {};

  // 1. 에디터 핵심 데이터 store 액션들을 구조분해할당으로 추출하고 fallback 제공
  // 2. 옵셔널 체이닝과 기본값으로 store가 없어도 안전하게 동작하도록 보장
  const {
    setContainers: updateStoredContainers = () => {},
    setParagraphs: updateStoredParagraphs = () => {},
    setCompletedContent: updateCompletedContentInStore = () => {},
    setIsCompleted: updateCompletionStatusInStore = () => {},
    getContainers: _retrieveStoredContainers = () => [], // 1. 사용하지 않지만 인터페이스 일관성을 위해 유지
    getParagraphs: _retrieveStoredParagraphs = () => [], // 1. 사용하지 않지만 인터페이스 일관성을 위해 유지
  } = editorCoreStoreData;

  // 1. 에디터 UI 상태 store 액션들을 구조분해할당으로 추출하고 fallback 제공
  // 2. 모든 UI 상태 관리 함수에 대해 안전한 기본값 설정
  const {
    getCurrentSubStep: retrieveCurrentEditorStep = () => 'structure',
    getIsTransitioning: retrieveTransitionStatus = () => false,
    getActiveParagraphId: retrieveActiveParagraphId = () => null,
    getIsPreviewOpen: retrievePreviewOpenStatus = () => true,
    getSelectedParagraphIds: retrieveSelectedParagraphIds = () => [],
    getTargetContainerId: retrieveTargetContainerId = () => '',
    goToWritingStep: navigateToWritingStepInStore = () => {},
    goToStructureStep: navigateToStructureStepInStore = () => {},
    setActiveParagraphId: updateActiveParagraphIdInStore = () => {},
    togglePreview: togglePreviewModeInStore = () => {},
    toggleParagraphSelection: toggleParagraphSelectionInStore = () => {},
    setSelectedParagraphIds: updateSelectedParagraphIdsInStore = () => {},
    setTargetContainerId: updateTargetContainerIdInStore = () => {},
    clearSelectedParagraphs: clearSelectedParagraphsInStore = () => {},
  } = editorUIStoreData;

  // 1. 토스트 메시지 store 액션을 구조분해할당으로 추출하고 fallback 제공
  // 2. 알림 기능이 없어도 앱이 중단되지 않도록 안전장치 마련
  const { addToast = () => {} } = toastStoreData;

  // === Context 처리 - 외부에서 주입된 context가 있는지 확인 ===
  const contextProvided = props?.context || null;
  const hasContext = Boolean(contextProvided);

  // 1. context 또는 store의 업데이트 함수 선택하여 일관된 인터페이스 제공
  // 2. context가 있으면 우선 사용하고, 없으면 store 함수를 대안으로 사용
  const updateContainersFunction =
    contextProvided?.updateEditorContainers || updateStoredContainers;
  const updateParagraphsFunction =
    contextProvided?.updateEditorParagraphs || updateStoredParagraphs;
  const updateCompletedContentFunction =
    contextProvided?.updateEditorCompletedContent ||
    updateCompletedContentInStore;
  const setCompletedStatusFunction =
    contextProvided?.setEditorCompleted || updateCompletionStatusInStore;
  const showToastFunction = contextProvided?.addToast || addToast;

  // === 로컬 상태 초기화 - 컴포넌트 내부에서 사용할 상태들 ===
  // 1. 에디터 내부 상태 초기화 (단계, 전환상태, 활성문단 등)
  // 2. context 유무에 따라 다른 초기값 적용하여 데이터 일관성 보장
  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(() => {
      try {
        return createInitialInternalState(hasContext, editorUIStoreData);
      } catch (error) {
        console.error('❌ [HOOK] 초기 내부 상태 생성 실패:', error);
        // 1. 초기화 실패 시 안전한 기본값으로 폴백
        // 2. 앱이 중단되지 않도록 최소한의 동작 가능한 상태 제공
        return {
          currentSubStep: 'structure',
          isTransitioning: false,
          activeParagraphId: null,
          isPreviewOpen: true,
          selectedParagraphIds: [],
          targetContainerId: '',
        };
      }
    });

  // 1. 문단 컬렉션 초기화 (사용자가 작성하는 모든 문단들)
  // 2. context가 있으면 빈 배열로, 없으면 store에서 기존 데이터 복원
  const [managedParagraphCollection, setManagedParagraphCollection] = useState<
    LocalParagraph[]
  >(() => {
    try {
      return createInitialParagraphs(hasContext, editorCoreStoreData);
    } catch (error) {
      console.error('❌ [HOOK] 초기 단락 컬렉션 생성 실패:', error);
      return []; // 안전한 빈 배열로 폴백
    }
  });

  // 1. 컨테이너 컬렉션 초기화 (문단들을 그룹화할 섹션들)
  // 2. 구조 설정에서 생성된 섹션 정보를 관리하기 위한 상태
  const [managedContainerCollection, setManagedContainerCollection] = useState<
    Container[]
  >(() => {
    try {
      return createInitialContainers(hasContext, editorCoreStoreData);
    } catch (error) {
      console.error('❌ [HOOK] 초기 컨테이너 컬렉션 생성 실패:', error);
      return []; // 안전한 빈 배열로 폴백
    }
  });

  // 1. 모바일 디바이스 감지 상태
  // 2. 반응형 UI 제공을 위한 디바이스 타입 판별 결과
  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  // === 내부 상태에서 자주 사용되는 속성들을 구조분해할당으로 추출 ===
  // 1. 점연산자 사용을 줄이고 가독성 향상을 위한 구조분해할당
  // 2. 각 속성에 기본값 설정으로 undefined 에러 방지
  const {
    currentSubStep: currentEditorStepValue = 'structure',
    isTransitioning: isStepTransitioningValue = false,
    activeParagraphId: activeElementIdValue = null,
    isPreviewOpen: previewModeActiveValue = true,
    selectedParagraphIds: selectedElementIdCollection = [],
    targetContainerId: targetDestinationIdValue = '',
  } = editorInternalState || {};

  console.log('🎛️ [HOOK] 로컬 상태 초기화 완료:', {
    currentSubStep: currentEditorStepValue,
    localParagraphs: managedParagraphCollection?.length || 0,
    localContainers: managedContainerCollection?.length || 0,
    isMobile: isMobileDeviceDetected,
  });

  // === 디바이스 감지 - 모바일 환경 감지를 위한 커스텀 훅 ===
  // 1. 화면 크기 변화를 실시간으로 감지하여 모바일/데스크톱 판별
  // 2. 반응형 UI 적용을 위한 디바이스 타입 정보 제공
  useDeviceDetection(setIsMobileDeviceDetected);

  // === Store 동기화 - zustand store 상태와 로컬 상태 동기화 ===
  // 1. 다른 컴포넌트에서 store를 변경했을 때 현재 컴포넌트도 동기화
  // 2. context가 없을 때만 store와 동기화하여 충돌 방지
  useEffect(() => {
    console.log('🎛️ [HOOK] Zustand 상태 동기화 시작');
    try {
      if (!hasContext) {
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          // 1. 각 속성별로 store 값이 있으면 사용하고 없으면 이전 값 유지
          // 2. 부분적 업데이트를 통해 불필요한 상태 변경 최소화
          currentSubStep:
            retrieveCurrentEditorStep() ||
            previousInternalState?.currentSubStep ||
            'structure',
          isTransitioning:
            retrieveTransitionStatus() ??
            previousInternalState?.isTransitioning ??
            false,
          activeParagraphId:
            retrieveActiveParagraphId() ??
            previousInternalState?.activeParagraphId ??
            null,
          isPreviewOpen:
            retrievePreviewOpenStatus() ??
            previousInternalState?.isPreviewOpen ??
            true,
          selectedParagraphIds:
            retrieveSelectedParagraphIds() ||
            previousInternalState?.selectedParagraphIds ||
            [],
          targetContainerId:
            retrieveTargetContainerId() ||
            previousInternalState?.targetContainerId ||
            '',
        }));
      }
    } catch (error) {
      console.error('❌ [HOOK] Zustand 상태 동기화 실패:', error);
    }
  }, [
    hasContext,
    retrieveCurrentEditorStep,
    retrieveTransitionStatus,
    retrieveActiveParagraphId,
    retrievePreviewOpenStatus,
    retrieveSelectedParagraphIds,
    retrieveTargetContainerId,
  ]);

  // === 액션 함수들 생성 - 분할된 함수들을 조합하여 최종 액션 함수 생성 ===
  // 1. 각 기능별로 분할된 함수들에 필요한 인자를 전달하여 실행 가능한 함수 생성
  // 2. 원본 코드와 동일한 인터페이스를 제공하여 100% 호환성 보장

  // 단락 관리 함수들
  const addLocalParagraph = createNewParagraph(
    managedParagraphCollection,
    setManagedParagraphCollection,
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    updateActiveParagraphIdInStore,
    showToastFunction
  );

  const updateLocalParagraphContent = updateParagraphContent(
    setManagedParagraphCollection,
    showToastFunction
  );

  const deleteLocalParagraph = removeParagraph(
    setManagedParagraphCollection,
    showToastFunction
  );

  const toggleParagraphSelection = toggleParagraphSelect(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    toggleParagraphSelectionInStore
  );

  const addToLocalContainer = addParagraphsToContainer(
    selectedElementIdCollection,
    targetDestinationIdValue,
    managedParagraphCollection,
    managedContainerCollection,
    setManagedParagraphCollection,
    setEditorInternalState,
    showToastFunction,
    hasContext,
    editorUIStoreData,
    clearSelectedParagraphsInStore
  );

  const moveLocalParagraphInContainer = changeParagraphOrder(
    managedParagraphCollection,
    setManagedParagraphCollection,
    showToastFunction
  );

  // 데이터 조회 함수들
  const getLocalUnassignedParagraphs = getUnassignedParagraphs(
    managedParagraphCollection
  );

  const getLocalParagraphsByContainer = getParagraphsByContainer(
    managedParagraphCollection
  );

  // 상태 관리 함수들
  const setSelectedParagraphIds = updateSelectedParagraphs(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    updateSelectedParagraphIdsInStore
  );

  const setTargetContainerId = updateTargetContainer(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    updateTargetContainerIdInStore
  );

  const setActiveParagraphId = updateActiveParagraph(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    updateActiveParagraphIdInStore
  );

  // 워크플로우 함수들
  const handleStructureComplete = completeStructureSetup(
    setEditorInternalState,
    setManagedContainerCollection,
    showToastFunction,
    hasContext,
    editorUIStoreData,
    navigateToWritingStepInStore
  );

  const goToStructureStep = navigateToStructureStep(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    navigateToStructureStepInStore
  );

  const activateEditor = setActiveEditor(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    updateActiveParagraphIdInStore
  );

  const togglePreview = switchPreviewMode(
    setEditorInternalState,
    hasContext,
    editorUIStoreData,
    togglePreviewModeInStore
  );

  // 저장/완료 함수들
  const saveAllToContext = saveCurrentProgress(
    managedContainerCollection,
    managedParagraphCollection,
    updateContainersFunction,
    updateParagraphsFunction,
    showToastFunction
  );

  const completeEditor = finishEditing(
    managedContainerCollection,
    managedParagraphCollection,
    saveAllToContext,
    updateCompletedContentFunction,
    setCompletedStatusFunction,
    showToastFunction
  );

  console.log('✅ [HOOK] useEditorState 훅 준비 완료:', {
    internalState: {
      currentSubStep: currentEditorStepValue,
      isTransitioning: isStepTransitioningValue,
      activeParagraphId: activeElementIdValue,
      isPreviewOpen: previewModeActiveValue,
      selectedCount: selectedElementIdCollection?.length || 0,
      targetContainerId: targetDestinationIdValue,
    },
    localData: {
      paragraphs: managedParagraphCollection?.length || 0,
      containers: managedContainerCollection?.length || 0,
    },
    deviceInfo: {
      isMobile: isMobileDeviceDetected,
    },
  });

  // === 훅에서 반환하는 모든 데이터와 함수들 ===
  // 1. 원본 코드와 100% 동일한 반환 인터페이스 제공
  // 2. 명확한 역할 구분을 위해 상태 데이터, 상태 업데이트 함수, 관리 함수, 액션 함수로 분류
  return {
    // === 상태 데이터 반환 ===
    internalState: editorInternalState, // 에디터의 현재 단계, 전환상태, 활성문단 등 내부 상태 객체
    localParagraphs: managedParagraphCollection, // 로컬에서 관리되는 문단 배열 (실시간 편집 내용)
    localContainers: managedContainerCollection, // 로컬에서 관리되는 컨테이너 배열 (구조 설정 결과)
    isMobile: isMobileDeviceDetected, // 모바일 디바이스 여부 판단 결과

    // === 상태 업데이트 함수들 반환 ===
    setInternalState: setEditorInternalState, // 에디터 내부 상태를 직접 설정하는 함수 (고급 사용)
    setLocalParagraphs: setManagedParagraphCollection, // 문단 배열을 직접 설정하는 함수 (고급 사용)
    setLocalContainers: setManagedContainerCollection, // 컨테이너 배열을 직접 설정하는 함수 (고급 사용)
    setSelectedParagraphIds, // 선택된 문단 ID 목록을 일괄 설정하는 함수
    setTargetContainerId, // 타겟 컨테이너 ID를 설정하는 함수
    setActiveParagraphId, // 활성 문단 ID를 설정하는 함수

    // === 단락 관리 함수들 반환 ===
    addLocalParagraph, // 새로운 빈 문단을 생성하여 추가하는 함수
    deleteLocalParagraph, // 지정된 문단을 삭제하는 함수
    updateLocalParagraphContent, // 문단의 텍스트 내용을 수정하는 함수
    toggleParagraphSelection, // 문단의 선택 상태를 토글하는 함수
    addToLocalContainer, // 선택된 문단들을 지정된 컨테이너에 추가하는 함수
    moveLocalParagraphInContainer, // 컨테이너 내에서 문단의 순서를 변경하는 함수
    getLocalUnassignedParagraphs, // 아직 컨테이너에 할당되지 않은 문단들을 조회하는 함수
    getLocalParagraphsByContainer, // 특정 컨테이너에 속한 문단들을 조회하는 함수

    // === 에디터 액션 함수들 반환 ===
    handleStructureComplete, // 구조 설정을 완료하고 writing 단계로 전환하는 함수
    goToStructureStep, // 구조 설정 단계로 돌아가는 함수
    activateEditor, // 특정 문단의 에디터를 활성화하고 스크롤 이동하는 함수
    togglePreview, // 미리보기 패널을 열고 닫는 토글 함수
    saveAllToContext, // 현재까지의 모든 작업을 글로벌 스토어에 저장하는 함수
    completeEditor, // 에디터 작업을 완전히 마무리하고 최종 결과물을 생성하는 함수
  };
};
