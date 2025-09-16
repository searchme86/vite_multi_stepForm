// 📁 hooks/useEditorState.ts

//====여기부터 수정됨====
import { useState, useEffect, useCallback } from 'react';
import { EditorInternalState } from '../components/moduleEditor/types/editor';
import { Container, ParagraphBlock } from '../store/shared/commonTypes';
import { useEditorCoreStore } from '../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../store/editorUI/editorUIStore';
import { useToastStore } from '../store/toast/toastStore';

type LocalParagraph = ParagraphBlock;

export const useEditorState = () => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  // === 모든 useState 훅들을 최상단에 배치 ===
  // 1. 에디터의 현재 단계(structure/writing), 전환상태, 활성문단 등을 관리하는 내부 상태
  // 2. React 훅 규칙에 따라 조건문이나 함수 안이 아닌 컴포넌트 최상단에 위치시켜 안정적인 상태관리 보장
  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(() => {
      try {
        // Zustand 스토어에서 초기값을 가져와 로컬 상태 초기화
        return {
          currentSubStep: 'structure', // 에디터 시작 시 구조 설정 단계부터 시작
          isTransitioning: false, // 단계 전환 중이 아닌 안정 상태로 시작
          activeParagraphId: null, // 활성화된 문단이 없는 상태로 시작
          isPreviewOpen: true, // 미리보기 모드가 기본적으로 열린 상태로 시작
          selectedParagraphIds: [], // 선택된 문단이 없는 빈 배열로 시작
          targetContainerId: '', // 타겟 컨테이너가 설정되지 않은 상태로 시작
        };
      } catch (error) {
        console.error('❌ [HOOK] 초기 내부 상태 생성 실패:', error);
        // 오류 발생 시 안전한 기본값으로 폴백하여 앱이 깨지지 않도록 보장
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

  // 1. 사용자가 작성 중인 문단들을 로컬에서 임시 관리하는 배열 상태
  // 2. Zustand 글로벌 상태와 별도로 편집 중인 실시간 변경사항을 추적하기 위해 로컬 상태로 분리
  const [managedParagraphCollection, setManagedParagraphCollection] = useState<
    LocalParagraph[]
  >([]);

  // 1. 문단들을 그룹화할 컨테이너들을 로컬에서 관리하는 배열 상태
  // 2. 구조 설정 단계에서 생성된 섹션들을 임시 저장하여 writing 단계에서 활용하기 위해 필요
  const [managedContainerCollection, setManagedContainerCollection] = useState<
    Container[]
  >([]);

  // 1. 현재 디바이스가 모바일인지 판단하는 boolean 상태
  // 2. 화면 크기에 따른 반응형 UI 제공을 위해 window.innerWidth를 모니터링하여 설정
  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  // === Zustand 스토어 액션들을 구조분해할당으로 추출 ===
  // 1. 에디터 핵심 데이터(컨테이너, 문단, 완성된 콘텐츠)를 관리하는 스토어에서 필요한 함수들 추출
  // 2. 옵셔널 체이닝(?.)과 기본값을 사용해 스토어가 없어도 앱이 깨지지 않도록 안전장치 마련
  const {
    setContainers: updateStoredContainers = () => {},
    setParagraphs: updateStoredParagraphs = () => {},
    setCompletedContent: updateCompletedContentInStore = () => {},
    setIsCompleted: updateCompletionStatusInStore = () => {},
  } = useEditorCoreStore() || {};

  // 1. 에디터 UI 상태(현재 단계, 전환상태, 활성/선택 문단 등)를 관리하는 스토어에서 필요한 함수들 추출
  // 2. 사용자 인터랙션에 따른 UI 상태 변경을 중앙집중식으로 관리하기 위해 Zustand 스토어 활용
  const {
    getCurrentSubStep: retrieveCurrentEditorStep = () => 'structure',
    getIsTransitioning: retrieveTransitionStatus = () => false,
    getActiveParagraphId: retrieveActiveParagraphId = () => null,
    getIsPreviewOpen: retrievePreviewOpenStatus = () => true,
    getSelectedParagraphIds: retrieveSelectedParagraphIds = () => [],
    getTargetContainerId: retrieveTargetContainerId = () => '',
    setActiveParagraphId: updateActiveParagraphIdInStore = () => {},
    toggleParagraphSelection: toggleParagraphSelectionInStore = () => {},
    clearSelectedParagraphs: clearSelectedParagraphsInStore = () => {},
    goToWritingStep: navigateToWritingStepInStore = () => {},
    goToStructureStep: navigateToStructureStepInStore = () => {},
    togglePreview: togglePreviewModeInStore = () => {},
    setSelectedParagraphIds: updateSelectedParagraphIdsInStore = () => {},
    setTargetContainerId: updateTargetContainerIdInStore = () => {},
  } = useEditorUIStore() || {};

  // 1. 사용자에게 작업 결과나 오류를 알리는 토스트 메시지 표시 함수
  // 2. 에디터 작업 중 발생하는 성공/실패/경고 상황을 직관적으로 사용자에게 피드백하기 위해 필요
  const { addToast = () => {} } = useToastStore() || {};

  // 1. 문단들을 묶어서 관리할 컨테이너(섹션) 객체를 생성하는 순수 함수
  // 2. 사용자가 입력한 섹션명과 순서를 받아 고유ID와 생성시간이 포함된 완전한 컨테이너 객체 반환
  const createContainer = (
    containerNameInput: string,
    containerSortOrder: number
  ): Container => {
    // 1. 입력받은 컨테이너 이름의 공백 제거 및 빈 문자열 검증
    // 2. 사용자가 실수로 공백만 입력하거나 빈 값을 입력했을 때 기본 이름 제공으로 에러 방지
    const sanitizedContainerName =
      containerNameInput?.trim() || `컨테이너-${Date.now()}`;

    // 1. 정렬 순서가 유효한 숫자이고 0 이상인지 검증
    // 2. 음수나 잘못된 타입이 들어올 경우 0으로 기본값 설정하여 정렬 오류 방지
    const validatedSortOrder =
      typeof containerSortOrder === 'number' && containerSortOrder >= 0
        ? containerSortOrder
        : 0;

    return {
      // 1. 현재 시간과 랜덤 문자열을 조합한 고유 식별자 생성
      // 2. 동시에 여러 컨테이너가 생성되어도 ID 중복을 방지하기 위해 시간+랜덤값 조합 사용
      id: `container-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      name: sanitizedContainerName,
      order: validatedSortOrder,
      createdAt: new Date(), // 컨테이너 생성 시점 기록으로 추후 정렬이나 관리에 활용
    };
  };

  // 1. 모든 컨테이너와 문단을 순서대로 정렬하여 최종 완성된 텍스트를 생성하는 순수 함수
  // 2. 에디터 작업 완료 시 사용자가 작성한 내용을 하나의 연결된 텍스트로 변환하기 위해 필요
  const generateCompletedContent = (
    containerCollectionInput: Container[],
    paragraphCollectionInput: ParagraphBlock[]
  ): string => {
    try {
      // 1. 입력 배열들이 실제 배열인지 검증하고 안전한 배열로 변환
      // 2. null이나 undefined가 들어와도 빈 배열로 처리하여 런타임 에러 방지
      const validatedContainerCollection = Array.isArray(
        containerCollectionInput
      )
        ? containerCollectionInput
        : [];
      const validatedParagraphCollection = Array.isArray(
        paragraphCollectionInput
      )
        ? paragraphCollectionInput
        : [];

      // 1. 컨테이너들을 order 속성 기준으로 오름차순 정렬
      // 2. 사용자가 설정한 섹션 순서대로 최종 콘텐츠가 구성되도록 보장
      const sortedContainersByOrderValue = [
        ...validatedContainerCollection,
      ].sort(
        (firstContainerItem, secondContainerItem) =>
          (firstContainerItem?.order || 0) - (secondContainerItem?.order || 0)
      );

      // 1. 각 컨테이너별로 해당하는 문단들을 모아서 하나의 섹션 텍스트로 생성
      // 2. 컨테이너 순서에 따라 문단들을 그룹화하고 각 그룹 내에서도 order로 정렬하여 완전한 구조 생성
      const contentSectionsByContainerGroup = sortedContainersByOrderValue.map(
        (currentContainerItem) => {
          // 1. 현재 컨테이너에 속한 문단들만 필터링
          // 2. containerId가 일치하는 문단들만 선별하여 해당 섹션의 내용 구성
          const paragraphsInSpecificContainer = validatedParagraphCollection
            .filter(
              (currentParagraphItem) =>
                currentParagraphItem?.containerId === currentContainerItem?.id
            )
            .sort(
              (firstParagraphItem, secondParagraphItem) =>
                (firstParagraphItem?.order || 0) -
                (secondParagraphItem?.order || 0)
            );

          // 1. 해당 컨테이너에 문단이 없으면 빈 문자열 반환
          // 2. 빈 섹션은 최종 콘텐츠에서 제외하기 위한 사전 체크
          if (paragraphsInSpecificContainer.length === 0) {
            return '';
          }

          // 1. 문단들의 내용을 두 줄바꿈(\n\n)으로 연결하여 단락 구분
          // 2. 빈 내용의 문단은 제외하고 실제 내용이 있는 문단들만 연결
          return paragraphsInSpecificContainer
            .map((currentParagraphItem) => currentParagraphItem?.content || '')
            .filter((contentText) => contentText.trim().length > 0)
            .join('\n\n');
        }
      );

      // 1. 빈 섹션들을 제거하고 실제 내용이 있는 섹션들만 최종 연결
      // 2. 각 섹션 사이를 두 줄바꿈으로 구분하여 읽기 좋은 최종 텍스트 생성
      return contentSectionsByContainerGroup
        .filter((sectionContentText) => sectionContentText.trim().length > 0)
        .join('\n\n');
    } catch (error) {
      console.error('❌ [HELPER] generateCompletedContent 실행 실패:', error);
      // 1. 오류 발생 시 빈 문자열 반환으로 앱이 중단되지 않도록 방지
      // 2. 에러가 발생해도 사용자는 계속 작업할 수 있도록 안전장치 제공
      return '';
    }
  };

  // === 내부 상태에서 자주 사용되는 속성들을 구조 분해 할당으로 추출 ===
  // 1. editorInternalState 객체에서 개별 속성들을 추출하여 코드 가독성 향상
  // 2. 각 속성에 기본값을 설정하여 상태가 undefined일 때도 안전하게 동작하도록 보장
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

  // === 모바일 기기 감지 useEffect ===
  // 1. 화면 크기 변화를 감지하여 모바일/데스크톱 여부를 실시간으로 판단
  // 2. 반응형 UI 제공을 위해 768px 미만을 모바일로 판단하는 기준 적용
  useEffect(() => {
    console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 설정');

    // 1. 현재 화면 너비를 체크하여 모바일 여부 판단하는 함수
    // 2. resize 이벤트마다 호출되어 화면 크기 변화에 실시간 대응
    const checkMobileDevice = () => {
      try {
        const isMobileScreenSize = window.innerWidth < 768;
        console.log('📱 [MOBILE] 화면 크기 체크:', {
          width: window.innerWidth,
          isMobile: isMobileScreenSize,
        });
        setIsMobileDeviceDetected(isMobileScreenSize);
      } catch (error) {
        console.error('❌ [MOBILE] 화면 크기 체크 실패:', error);
        // 1. 오류 발생 시 데스크톱으로 가정하여 기본 UI 제공
        // 2. window 객체에 접근할 수 없는 환경에서도 앱이 동작하도록 보장
        setIsMobileDeviceDetected(false);
      }
    };

    // 1. 컴포넌트 마운트 시 즉시 모바일 여부 체크
    // 2. 초기 렌더링에서부터 올바른 모바일/데스크톱 UI 표시
    checkMobileDevice();
    // 1. 화면 크기 변화 감지를 위한 이벤트 리스너 등록
    // 2. 사용자가 브라우저 크기를 조절하거나 디바이스를 회전할 때 반응
    window.addEventListener('resize', checkMobileDevice);

    // 1. 컴포넌트 언마운트 시 이벤트 리스너 정리
    // 2. 메모리 누수 방지를 위한 클린업 함수 반환
    return () => {
      console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 제거');
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []); // 빈 dependency 배열로 마운트/언마운트 시에만 실행

  // === zustand store와 로컬 상태 동기화 useEffect ===
  // 1. Zustand 글로벌 스토어의 변경사항을 로컬 상태에 반영
  // 2. 다른 컴포넌트에서 스토어를 변경했을 때 현재 컴포넌트도 동기화되도록 보장
  useEffect(() => {
    try {
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        // 1. 각 속성별로 스토어 값이 있으면 사용하고 없으면 이전 값 유지
        // 2. 부분적 업데이트를 통해 불필요한 상태 변경 최소화
        currentSubStep:
          retrieveCurrentEditorStep() || previousInternalState.currentSubStep,
        isTransitioning:
          retrieveTransitionStatus() ?? previousInternalState.isTransitioning,
        activeParagraphId:
          retrieveActiveParagraphId() ??
          previousInternalState.activeParagraphId,
        isPreviewOpen:
          retrievePreviewOpenStatus() ?? previousInternalState.isPreviewOpen,
        selectedParagraphIds:
          retrieveSelectedParagraphIds() ||
          previousInternalState.selectedParagraphIds,
        targetContainerId:
          retrieveTargetContainerId() ||
          previousInternalState.targetContainerId,
      }));
    } catch (error) {
      console.error('❌ [HOOK] Zustand 상태 동기화 실패:', error);
    }
  }, [
    retrieveCurrentEditorStep,
    retrieveTransitionStatus,
    retrieveActiveParagraphId,
    retrievePreviewOpenStatus,
    retrieveSelectedParagraphIds,
    retrieveTargetContainerId,
  ]);

  // === 새로운 문단 생성 함수 ===
  // 1. 사용자가 새 문단 추가 버튼을 클릭했을 때 빈 문단을 생성하는 함수
  // 2. 고유 ID와 기본값들이 설정된 문단 객체를 만들어 편집 가능한 상태로 준비
  const createNewParagraph = useCallback(() => {
    console.log('📄 [LOCAL] 새 단락 추가');
    try {
      // 1. 새로 생성할 문단 객체 생성 (현재 시간 + 랜덤값으로 고유 ID 보장)
      // 2. 빈 내용으로 시작하여 사용자가 즉시 타이핑할 수 있도록 준비
      const newParagraphToAdd: LocalParagraph = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '', // 빈 내용으로 시작하여 사용자 입력 대기
        containerId: null, // 아직 컨테이너에 할당되지 않은 상태
        order: managedParagraphCollection?.length || 0, // 현재 문단 개수를 기준으로 순서 설정
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. 로컬 문단 컬렉션 끝에 새 문단 추가
      // 2. 스프레드 연산자로 기존 배열을 복사하여 불변성 유지
      setManagedParagraphCollection((previousParagraphCollection) => [
        ...(previousParagraphCollection || []),
        newParagraphToAdd,
      ]);

      // 1. 에디터 내부 상태에서 새로 생성한 문단을 활성화
      // 2. 사용자가 즉시 타이핑할 수 있도록 포커스 상태 설정
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        activeParagraphId: newParagraphToAdd.id,
      }));

      // 1. Zustand 스토어에도 활성 문단 ID 업데이트
      // 2. 다른 컴포넌트들도 새로 활성화된 문단을 인지할 수 있도록 동기화
      updateActiveParagraphIdInStore(newParagraphToAdd.id);

      console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraphToAdd.id);
    } catch (error) {
      console.error('❌ [LOCAL] 새 단락 생성 실패:', error);
      // 1. 에러 발생 시 사용자에게 실패 원인을 명확히 알림
      // 2. 토스트 메시지로 즉각적인 피드백 제공
      addToast({
        title: '단락 생성 실패',
        description: '새 단락을 생성하는 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [
    managedParagraphCollection?.length,
    updateActiveParagraphIdInStore,
    addToast,
  ]);

  // === 문단 내용 업데이트 함수 ===
  // 1. 사용자가 특정 문단의 텍스트를 수정할 때 호출되는 함수
  // 2. 실시간으로 문단 내용을 업데이트하고 수정 시간을 기록
  const updateParagraphContent = useCallback(
    (specificParagraphIdToUpdate: string, updatedParagraphContent: string) => {
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId: specificParagraphIdToUpdate,
        contentLength: (updatedParagraphContent || '').length,
      });

      try {
        // 1. 문단 ID의 유효성 검증 (빈 문자열이나 null 체크)
        // 2. 잘못된 ID로 인한 예상치 못한 동작 방지
        if (
          !specificParagraphIdToUpdate ||
          typeof specificParagraphIdToUpdate !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToUpdate
          );
          return;
        }

        // 1. 문단 배열에서 해당 ID의 문단만 내용 업데이트
        // 2. map 함수로 불변성을 유지하면서 특정 문단만 선택적 업데이트
        setManagedParagraphCollection((previousParagraphCollection) =>
          (previousParagraphCollection || []).map((currentParagraphItem) =>
            currentParagraphItem?.id === specificParagraphIdToUpdate
              ? {
                  ...currentParagraphItem,
                  content: updatedParagraphContent || '', // 빈 문자열 fallback 제공
                  updatedAt: new Date(), // 수정 시간 기록으로 최신 변경사항 추적
                }
              : currentParagraphItem
          )
        );
      } catch (error) {
        console.error('❌ [LOCAL] 문단 내용 업데이트 실패:', error);
        // 1. 내용 저장 실패 시 사용자에게 즉시 알림
        // 2. 데이터 손실 가능성을 사용자가 인지할 수 있도록 경고
        addToast({
          title: '내용 저장 실패',
          description: '문단 내용을 저장하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [addToast]
  );

  // === 문단 삭제 함수 ===
  // 1. 사용자가 특정 문단을 삭제하려고 할 때 호출되는 함수
  // 2. 해당 문단을 배열에서 완전히 제거하고 삭제 완료 피드백 제공
  const removeParagraph = useCallback(
    (specificParagraphIdToRemove: string) => {
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', specificParagraphIdToRemove);
      try {
        // 1. 삭제할 문단 ID의 유효성 검증
        // 2. 잘못된 ID로 인한 의도치 않은 삭제 방지
        if (
          !specificParagraphIdToRemove ||
          typeof specificParagraphIdToRemove !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToRemove
          );
          return;
        }

        // 1. filter 함수로 해당 ID가 아닌 문단들만 남겨서 삭제 효과 구현
        // 2. 불변성을 유지하면서 안전하게 요소 제거
        setManagedParagraphCollection((previousParagraphCollection) =>
          (previousParagraphCollection || []).filter(
            (currentParagraphItem) =>
              currentParagraphItem?.id !== specificParagraphIdToRemove
          )
        );

        // 1. 삭제 성공 시 사용자에게 확인 메시지 표시
        // 2. 실수로 삭제한 경우 사용자가 인지할 수 있도록 피드백 제공
        addToast({
          title: '단락 삭제',
          description: '선택한 단락이 삭제되었습니다.',
          color: 'success',
        });
      } catch (error) {
        console.error('❌ [LOCAL] 문단 삭제 실패:', error);
        addToast({
          title: '삭제 실패',
          description: '문단을 삭제하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [addToast]
  );

  // === 문단 선택 토글 함수 ===
  // 1. 사용자가 문단을 클릭하여 선택/해제할 때 호출되는 함수
  // 2. 다중 선택 가능한 체크박스 형태의 동작을 구현 (이미 선택된 것은 해제, 새로운 것은 추가)
  const toggleParagraphSelect = useCallback(
    (specificParagraphIdToToggle: string) => {
      console.log('☑️ [LOCAL] 단락 선택 토글:', specificParagraphIdToToggle);
      try {
        // 1. 토글할 문단 ID의 유효성 검증
        // 2. 올바르지 않은 ID로 인한 선택 상태 오류 방지
        if (
          !specificParagraphIdToToggle ||
          typeof specificParagraphIdToToggle !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToToggle
          );
          return;
        }

        // 1. 현재 선택된 문단 목록에서 해당 ID가 있는지 확인 후 추가/제거
        // 2. 기존 선택 상태를 유지하면서 하나의 항목만 토글하는 순수한 동작
        setEditorInternalState((previousInternalState) => {
          const safeInternalState = previousInternalState || {};
          const safeSelectedIdCollection =
            safeInternalState.selectedParagraphIds || [];

          return {
            ...safeInternalState,
            selectedParagraphIds: safeSelectedIdCollection.includes(
              specificParagraphIdToToggle
            )
              ? // 이미 선택된 경우: 선택 목록에서 제거
                safeSelectedIdCollection.filter(
                  (currentSelectedId) =>
                    currentSelectedId !== specificParagraphIdToToggle
                )
              : // 선택되지 않은 경우: 선택 목록에 추가
                [...safeSelectedIdCollection, specificParagraphIdToToggle],
          };
        });

        // 1. Zustand 스토어에도 동일한 토글 동작 적용
        // 2. 다른 컴포넌트들도 변경된 선택 상태를 공유할 수 있도록 동기화
        toggleParagraphSelectionInStore(specificParagraphIdToToggle);
      } catch (error) {
        console.error('❌ [LOCAL] 문단 선택 토글 실패:', error);
      }
    },
    [toggleParagraphSelectionInStore]
  );

  // === 컨테이너에 문단 추가 함수 ===
  // 1. 사용자가 선택한 문단들을 특정 컨테이너(섹션)에 할당하는 함수
  // 2. 문단의 복사본을 생성하여 컨테이너에 추가하므로 원본은 그대로 유지
  const addParagraphsToContainer = useCallback(() => {
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');
    try {
      // 1. 선택된 문단이 있는지 확인 (빈 배열이나 null 체크)
      // 2. 선택 없이 추가 버튼을 눌렀을 때 사용자에게 안내 메시지 제공
      if (
        !selectedElementIdCollection ||
        selectedElementIdCollection.length === 0
      ) {
        addToast({
          title: '선택된 단락 없음',
          description: '컨테이너에 추가할 단락을 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      // 1. 타겟 컨테이너가 선택되었는지 확인
      // 2. 어디에 추가할지 모르는 상황을 방지하기 위한 사전 체크
      if (!targetDestinationIdValue) {
        addToast({
          title: '컨테이너 미선택',
          description: '단락을 추가할 컨테이너를 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      // 1. 타겟 컨테이너에 이미 있는 문단들을 조회하여 다음 순서 번호 계산
      // 2. 새로 추가되는 문단들이 기존 문단들 뒤에 올바른 순서로 배치되도록 보장
      const existingParagraphsInTargetContainer = (
        managedParagraphCollection || []
      ).filter(
        (currentParagraphItem) =>
          currentParagraphItem?.containerId === targetDestinationIdValue
      );

      // 1. 기존 문단들 중 가장 큰 order 값을 찾아 새 문단들의 시작 order 결정
      // 2. 빈 컨테이너인 경우 -1로 설정하여 새 문단들이 0부터 시작하도록 처리
      const lastOrderValueInContainer =
        existingParagraphsInTargetContainer.length > 0
          ? Math.max(
              ...existingParagraphsInTargetContainer.map(
                (currentParagraphItem) => currentParagraphItem?.order || 0
              )
            )
          : -1;

      // 1. 선택된 문단 ID들을 실제 문단 객체들로 변환
      // 2. ID만으로는 내용을 복사할 수 없으므로 전체 문단 정보 조회
      const selectedParagraphsToAddToContainer = (
        managedParagraphCollection || []
      ).filter((currentParagraphItem) =>
        selectedElementIdCollection.includes(currentParagraphItem?.id || '')
      );

      // 1. 선택된 문단들의 복사본을 생성하여 새로운 ID와 컨테이너 정보 할당
      // 2. 원본 문단은 그대로 두고 사본을 만들어 다른 컨테이너에서도 재사용 가능
      const newParagraphsToAddToContainer =
        selectedParagraphsToAddToContainer.map(
          (currentParagraphItem, currentIterationIndex) => ({
            ...currentParagraphItem,
            // 새로운 고유 ID 생성 (시간 + 인덱스 + 랜덤값으로 완전한 고유성 보장)
            id: `paragraph-copy-${Date.now()}-${currentIterationIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            originalId: currentParagraphItem?.id, // 원본 문단 추적을 위한 참조 ID 보관
            containerId: targetDestinationIdValue, // 타겟 컨테이너에 할당
            order: lastOrderValueInContainer + currentIterationIndex + 1, // 기존 문단들 뒤에 순서대로 배치
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

      // 1. 로컬 문단 컬렉션에 새로 생성한 문단들 추가
      // 2. 스프레드 연산자로 기존 배열과 새 배열을 합쳐 불변성 유지
      setManagedParagraphCollection((previousParagraphCollection) => [
        ...(previousParagraphCollection || []),
        ...newParagraphsToAddToContainer,
      ]);

      // 1. 문단 추가 작업 완료 후 선택 상태와 타겟 컨테이너 초기화
      // 2. 다음 작업을 위해 깨끗한 상태로 리셋
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        selectedParagraphIds: [],
        targetContainerId: '',
      }));

      // 1. Zustand 스토어에서도 선택 상태 초기화
      // 2. 모든 컴포넌트에서 선택이 해제된 상태로 동기화
      clearSelectedParagraphsInStore();

      // 1. 성공 메시지에 포함할 컨테이너 이름 조회
      // 2. 사용자가 어떤 컨테이너에 추가되었는지 명확히 알 수 있도록 정보 제공
      const targetContainerInformation = (
        managedContainerCollection || []
      ).find(
        (currentContainerItem) =>
          currentContainerItem?.id === targetDestinationIdValue
      );

      // 1. 성공 완료 토스트 메시지 표시
      // 2. 몇 개의 문단이 어떤 컨테이너에 추가되었는지 구체적 정보 제공
      addToast({
        title: '단락 추가 완료',
        description: `${selectedParagraphsToAddToContainer.length}개의 단락이 ${
          targetContainerInformation?.name || '컨테이너'
        }에 추가되었습니다.`,
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [LOCAL] 컨테이너에 단락 추가 실패:', error);
      addToast({
        title: '추가 실패',
        description: '단락을 컨테이너에 추가하는 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [
    selectedElementIdCollection,
    targetDestinationIdValue,
    managedParagraphCollection,
    managedContainerCollection,
    addToast,
    clearSelectedParagraphsInStore,
  ]);

  // === 문단 순서 변경 함수 ===
  // 1. 사용자가 컨테이너 내에서 문단의 순서를 위/아래로 이동시키는 함수
  // 2. 같은 컨테이너 내의 인접한 두 문단의 order 값을 서로 교환하여 순서 변경 구현
  const changeParagraphOrder = useCallback(
    (specificParagraphIdToMove: string, moveDirectionValue: 'up' | 'down') => {
      console.log('↕️ [LOCAL] 단락 순서 변경:', {
        paragraphId: specificParagraphIdToMove,
        direction: moveDirectionValue,
      });

      try {
        // 1. 이동할 문단 ID의 유효성 검증
        // 2. 잘못된 문단 ID로 인한 순서 변경 오류 방지
        if (
          !specificParagraphIdToMove ||
          typeof specificParagraphIdToMove !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToMove
          );
          return;
        }

        // 1. 이동 방향이 'up' 또는 'down' 중 하나인지 검증
        // 2. 예상치 못한 방향 값으로 인한 오동작 방지
        if (moveDirectionValue !== 'up' && moveDirectionValue !== 'down') {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 이동 방향:',
            moveDirectionValue
          );
          return;
        }

        // 1. 이동할 대상 문단을 전체 문단 목록에서 찾기
        // 2. 해당 문단이 실제로 존재하고 컨테이너에 할당되어 있는지 확인
        const targetParagraphToMove = (managedParagraphCollection || []).find(
          (currentParagraphItem) =>
            currentParagraphItem?.id === specificParagraphIdToMove
        );

        if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
          console.warn(
            '⚠️ [LOCAL] 이동할 문단을 찾을 수 없거나 컨테이너에 할당되지 않음'
          );
          return;
        }

        // 1. 같은 컨테이너에 속한 문단들만 필터링하고 order 기준으로 정렬
        // 2. 순서 변경 작업은 같은 컨테이너 내에서만 가능하므로 범위 제한
        const paragraphsInSameContainerGroup = (
          managedParagraphCollection || []
        )
          .filter(
            (currentParagraphItem) =>
              currentParagraphItem?.containerId ===
              targetParagraphToMove.containerId
          )
          .sort(
            (firstParagraphItem, secondParagraphItem) =>
              (firstParagraphItem?.order || 0) -
              (secondParagraphItem?.order || 0)
          );

        // 1. 정렬된 배열에서 이동할 문단의 현재 위치(인덱스) 찾기
        // 2. 배열 인덱스를 통해 이전/다음 문단과의 교환 가능 여부 판단
        const currentPositionIndexInContainer =
          paragraphsInSameContainerGroup.findIndex(
            (currentParagraphItem) =>
              currentParagraphItem?.id === specificParagraphIdToMove
          );

        // 1. 이동 방향과 현재 위치를 고려하여 더 이상 이동할 수 없는 경우 체크
        // 2. 첫 번째 문단을 위로 이동하거나 마지막 문단을 아래로 이동하는 것은 불가능
        if (
          (moveDirectionValue === 'up' &&
            currentPositionIndexInContainer === 0) ||
          (moveDirectionValue === 'down' &&
            currentPositionIndexInContainer ===
              paragraphsInSameContainerGroup.length - 1)
        ) {
          console.log('🚫 [LOCAL] 더 이상 이동할 수 없음');
          return;
        }

        // 1. 이동할 타겟 위치 계산 (위로 이동: -1, 아래로 이동: +1)
        // 2. 교환할 상대방 문단 객체 조회
        const targetPositionIndexInContainer =
          moveDirectionValue === 'up'
            ? currentPositionIndexInContainer - 1
            : currentPositionIndexInContainer + 1;
        const swapTargetParagraphItem =
          paragraphsInSameContainerGroup[targetPositionIndexInContainer];

        if (!swapTargetParagraphItem) {
          console.warn('⚠️ [LOCAL] 교체할 문단을 찾을 수 없음');
          return;
        }

        // 1. 두 문단의 order 값을 서로 교환하여 순서 변경 구현
        // 2. map 함수로 불변성을 유지하면서 해당 문단들만 선택적 업데이트
        setManagedParagraphCollection((previousParagraphCollection) =>
          (previousParagraphCollection || []).map((currentParagraphItem) => {
            if (currentParagraphItem?.id === specificParagraphIdToMove) {
              // 이동할 문단에는 교환 대상의 order 값 할당
              return {
                ...currentParagraphItem,
                order: swapTargetParagraphItem.order,
              };
            }
            if (currentParagraphItem?.id === swapTargetParagraphItem.id) {
              // 교환 대상 문단에는 이동할 문단의 order 값 할당
              return {
                ...currentParagraphItem,
                order: targetParagraphToMove.order,
              };
            }
            // 나머지 문단들은 그대로 유지
            return currentParagraphItem;
          })
        );
      } catch (error) {
        console.error('❌ [LOCAL] 문단 순서 변경 실패:', error);
        addToast({
          title: '순서 변경 실패',
          description: '문단 순서를 변경하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [managedParagraphCollection, addToast]
  );

  // === 할당되지 않은 문단 조회 함수 ===
  // 1. 아직 어떤 컨테이너에도 할당되지 않은 독립적인 문단들을 찾아 반환하는 함수
  // 2. 구조 설정 단계에서 사용자가 작성한 문단들 중 컨테이너 배치 대기 중인 항목들 조회
  const getUnassignedParagraphs = useCallback(() => {
    try {
      // 1. containerId가 null이거나 undefined인 문단들만 필터링
      // 2. 아직 특정 섹션에 배정되지 않아 대기 상태인 문단들만 추출
      const unassignedParagraphCollection = (
        managedParagraphCollection || []
      ).filter((currentParagraphItem) => !currentParagraphItem?.containerId);
      console.log(
        '📋 [LOCAL] 미할당 단락 조회:',
        unassignedParagraphCollection.length
      );
      return unassignedParagraphCollection;
    } catch (error) {
      console.error('❌ [LOCAL] 미할당 문단 조회 실패:', error);
      // 1. 오류 발생 시 빈 배열 반환으로 UI가 깨지지 않도록 방지
      // 2. 에러 상황에서도 앱이 계속 동작할 수 있도록 안전장치 제공
      return [];
    }
  }, [managedParagraphCollection]);

  // === 컨테이너별 문단 조회 함수 ===
  // 1. 특정 컨테이너(섹션)에 할당된 모든 문단들을 정렬된 순서로 반환하는 함수
  // 2. 각 섹션의 내용을 화면에 표시하거나 최종 콘텐츠 생성 시 사용
  const getParagraphsByContainer = useCallback(
    (specificContainerIdToQuery: string) => {
      try {
        // 1. 조회할 컨테이너 ID의 유효성 검증
        // 2. 잘못된 ID로 인한 잘못된 조회 결과 방지
        if (
          !specificContainerIdToQuery ||
          typeof specificContainerIdToQuery !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 컨테이너 ID:',
            specificContainerIdToQuery
          );
          return [];
        }

        // 1. 특정 컨테이너에 속한 문단들을 필터링하고 order 기준으로 정렬
        // 2. 사용자가 설정한 문단 순서대로 정렬하여 올바른 읽기 순서 보장
        const paragraphsInSpecificContainer = (managedParagraphCollection || [])
          .filter(
            (currentParagraphItem) =>
              currentParagraphItem?.containerId === specificContainerIdToQuery
          )
          .sort(
            (firstParagraphItem, secondParagraphItem) =>
              (firstParagraphItem?.order || 0) -
              (secondParagraphItem?.order || 0)
          );

        console.log('📋 [LOCAL] 컨테이너별 단락 조회:', {
          containerId: specificContainerIdToQuery,
          count: paragraphsInSpecificContainer.length,
        });

        return paragraphsInSpecificContainer;
      } catch (error) {
        console.error('❌ [LOCAL] 컨테이너별 문단 조회 실패:', error);
        return [];
      }
    },
    [managedParagraphCollection]
  );

  // === 구조 설정 완료 처리 함수 ===
  // 1. 사용자가 입력한 섹션명들을 바탕으로 컨테이너들을 생성하고 writing 단계로 전환하는 함수
  // 2. 에디터의 첫 번째 단계(structure)에서 두 번째 단계(writing)로 진행할 때 호출됨
  // 3. 입력받은 섹션명 배열을 실제 컨테이너 객체들로 변환하여 글 작성 구조 완성
  const completeStructureSetup = useCallback(
    (validSectionInputCollection: string[]) => {
      console.log(
        '🎛️ [HOOK] completeStructureSetup 호출:',
        validSectionInputCollection
      );

      try {
        // 1. 입력받은 섹션명 배열의 유효성 검증 (배열 여부와 최소 개수 체크)
        // 2. 최소 2개 이상의 섹션이 있어야 의미 있는 구조화된 글 작성이 가능
        if (
          !Array.isArray(validSectionInputCollection) ||
          validSectionInputCollection.length < 2
        ) {
          addToast({
            title: '구조 설정 오류',
            description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
            color: 'warning',
          });
          return;
        }

        // 1. 단계 전환 중임을 표시하여 사용자에게 로딩 상태 알림
        // 2. 전환 애니메이션이나 로딩 스피너 표시를 위한 상태 설정
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          isTransitioning: true,
        }));

        // 1. 입력받은 섹션명들을 실제 컨테이너 객체들로 변환
        // 2. 각 섹션명과 인덱스(순서)를 이용해 완전한 컨테이너 데이터 구조 생성
        const createdContainerCollection = validSectionInputCollection.map(
          (sectionNameInput, containerIndexValue) => {
            try {
              return createContainer(sectionNameInput, containerIndexValue);
            } catch (error) {
              console.error('❌ [ACTION] 컨테이너 생성 실패:', error);
              // 1. 개별 컨테이너 생성 실패 시에도 전체 프로세스가 중단되지 않도록 기본값 제공
              // 2. 하나의 섹션에 문제가 있어도 나머지 섹션들은 정상 생성되도록 보장
              return createContainer('기본 컨테이너', containerIndexValue);
            }
          }
        );

        // 1. 생성된 컨테이너들을 로컬 상태에 저장
        // 2. writing 단계에서 이 컨테이너들을 사용하여 문단 배치 작업 수행
        setManagedContainerCollection(createdContainerCollection);
        console.log(
          '📦 [ACTION] 로컬 컨테이너 생성:',
          createdContainerCollection
        );

        // 1. 300ms 딜레이 후 writing 단계로 전환 (부드러운 전환 효과 제공)
        // 2. 전환 상태 해제와 함께 새로운 단계 활성화
        setTimeout(() => {
          setEditorInternalState((previousInternalState) => ({
            ...(previousInternalState || {}),
            currentSubStep: 'writing',
            isTransitioning: false,
          }));
        }, 300);

        // 1. Zustand 글로벌 스토어에도 writing 단계 전환 알림
        // 2. 다른 컴포넌트들도 현재 단계 변경사항을 인지할 수 있도록 동기화
        navigateToWritingStepInStore();

        // 1. 구조 설정 완료 성공 메시지 표시
        // 2. 생성된 섹션 개수 정보를 포함하여 사용자에게 구체적 피드백 제공
        addToast({
          title: '구조 설정 완료',
          description: `${validSectionInputCollection.length}개의 섹션이 생성되었습니다.`,
          color: 'success',
        });
      } catch (error) {
        console.error('❌ [HOOK] 구조 설정 완료 실패:', error);
        addToast({
          title: '구조 설정 실패',
          description: '구조 설정 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [addToast, navigateToWritingStepInStore]
  );

  // === 구조 설정 단계로 돌아가기 함수 ===
  // 1. 사용자가 writing 단계에서 다시 구조를 변경하고 싶을 때 호출되는 함수
  // 2. 현재 작업을 중단하고 처음 구조 설정 화면으로 되돌아가는 기능
  const navigateToStructureStep = useCallback(() => {
    console.log('🎛️ [HOOK] navigateToStructureStep 호출');

    try {
      // 1. 단계 전환 중임을 표시하여 부드러운 전환 효과 제공
      // 2. 갑작스런 화면 변화를 방지하고 사용자에게 로딩 상태 알림
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        isTransitioning: true,
      }));

      // 1. 300ms 딜레이 후 structure 단계로 전환
      // 2. 전환 애니메이션 시간을 확보하여 자연스러운 사용자 경험 제공
      setTimeout(() => {
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          currentSubStep: 'structure',
          isTransitioning: false,
        }));
      }, 300);

      // 1. Zustand 글로벌 스토어에도 structure 단계 전환 알림
      // 2. 다른 컴포넌트들도 현재 단계 변경사항을 동기화할 수 있도록 처리
      navigateToStructureStepInStore();
    } catch (error) {
      console.error('❌ [HOOK] 구조 단계 이동 실패:', error);
    }
  }, [navigateToStructureStepInStore]);

  // === 특정 문단의 에디터 활성화 함수 ===
  // 1. 사용자가 특정 문단을 클릭했을 때 해당 문단을 편집 가능한 활성 상태로 만드는 함수
  // 2. 활성화된 문단으로 자동 스크롤 이동까지 포함하여 편집 환경 최적화
  const setActiveEditor = useCallback(
    (specificParagraphIdToActivate: string) => {
      console.log(
        '🎛️ [HOOK] setActiveEditor 호출:',
        specificParagraphIdToActivate
      );

      try {
        // 1. 활성화할 문단 ID의 유효성 검증
        // 2. 잘못된 ID로 인한 예상치 못한 활성화 동작 방지
        if (
          !specificParagraphIdToActivate ||
          typeof specificParagraphIdToActivate !== 'string'
        ) {
          console.warn(
            '⚠️ [HOOK] 유효하지 않은 문단 ID:',
            specificParagraphIdToActivate
          );
          return;
        }

        // 1. 로컬 상태에서 활성 문단 ID 업데이트
        // 2. 현재 편집 중인 문단을 추적하여 다른 UI 요소들이 반응할 수 있도록 설정
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          activeParagraphId: specificParagraphIdToActivate,
        }));

        // 1. Zustand 글로벌 스토어에도 활성 문단 ID 동기화
        // 2. 다른 컴포넌트들도 현재 활성 문단 정보를 공유할 수 있도록 업데이트
        updateActiveParagraphIdInStore(specificParagraphIdToActivate);

        // 1. 200ms 딜레이 후 해당 문단으로 자동 스크롤 이동
        // 2. DOM 업데이트가 완료된 후 스크롤 동작을 수행하여 정확한 위치 이동 보장
        setTimeout(() => {
          try {
            // 1. data-paragraph-id 속성을 가진 DOM 요소 검색
            // 2. 특정 문단의 DOM 요소를 정확히 찾기 위한 고유 속성 활용
            const targetDOMElement = document.querySelector(
              `[data-paragraph-id="${specificParagraphIdToActivate}"]`
            );

            if (targetDOMElement) {
              // 1. 스크롤 가능한 부모 컨테이너 찾기
              // 2. overflow-y-auto 클래스를 가진 가장 가까운 상위 스크롤 컨테이너 검색
              const scrollContainerElement =
                targetDOMElement.closest('.overflow-y-auto');

              if (scrollContainerElement) {
                // 1. 스크롤 컨테이너가 있는 경우 정확한 스크롤 위치 계산
                // 2. 컨테이너 상단에서 20px 여백을 두고 타겟 요소가 보이도록 위치 조정
                const { top: containerTop = 0 } =
                  scrollContainerElement.getBoundingClientRect() || {};
                const { top: elementTop = 0 } =
                  targetDOMElement.getBoundingClientRect() || {};
                const offsetTopValue =
                  elementTop - containerTop + scrollContainerElement.scrollTop;

                scrollContainerElement.scrollTo({
                  top: Math.max(0, offsetTopValue - 20), // 음수 방지를 위한 Math.max 사용
                  behavior: 'smooth', // 부드러운 스크롤 애니메이션 적용
                });
              } else {
                // 1. 스크롤 컨테이너가 없는 경우 기본 스크롤 동작 수행
                // 2. 브라우저 기본 scrollIntoView API 활용
                targetDOMElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start', // 요소가 뷰포트 상단에 오도록 정렬
                  inline: 'nearest',
                });
              }
            }
          } catch (scrollError) {
            console.error('❌ [HOOK] 스크롤 실패:', scrollError);
            // 1. 스크롤 실패해도 에디터 활성화 자체에는 문제없도록 에러 격리
            // 2. 스크롤은 UX 개선 기능이므로 실패해도 핵심 기능에 영향 없음
          }
        }, 200);
      } catch (error) {
        console.error('❌ [HOOK] 에디터 활성화 실패:', error);
      }
    },
    [updateActiveParagraphIdInStore]
  );

  // === 미리보기 모드 전환 함수 ===
  // 1. 사용자가 미리보기 패널을 열거나 닫을 때 호출되는 토글 함수
  // 2. 작성 중인 내용을 실시간으로 확인하거나 작성 공간을 넓히고 싶을 때 사용
  const switchPreviewMode = useCallback(() => {
    console.log('🎛️ [HOOK] switchPreviewMode 호출');

    try {
      // 1. 현재 미리보기 상태의 반대값으로 토글
      // 2. 열려있으면 닫고, 닫혀있으면 여는 단순한 boolean 반전 동작
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        isPreviewOpen: !(previousInternalState?.isPreviewOpen ?? true),
      }));

      // 1. Zustand 글로벌 스토어에도 미리보기 상태 동기화
      // 2. 다른 컴포넌트들도 미리보기 모드 변경사항을 인지할 수 있도록 업데이트
      togglePreviewModeInStore();
    } catch (error) {
      console.error('❌ [HOOK] 미리보기 모드 전환 실패:', error);
    }
  }, [togglePreviewModeInStore]);

  // === 현재 작업 진행상황 저장 함수 ===
  // 1. 사용자가 지금까지 작성한 모든 내용을 Zustand 글로벌 스토어에 저장하는 함수
  // 2. 작업 중간중간 데이터 손실을 방지하기 위한 백업 저장 기능
  const saveCurrentProgress = useCallback(() => {
    console.log('🎛️ [HOOK] saveCurrentProgress 호출');

    try {
      // 1. 현재 로컬 상태의 컨테이너들을 Zustand 스토어에 저장
      // 2. 구조 설정에서 생성한 섹션 정보를 영구 저장하여 새로고침해도 유지되도록 보장
      updateStoredContainers(managedContainerCollection || []);

      // 1. 현재 로컬 상태의 문단들을 저장 가능한 형태로 복사
      // 2. 불변성을 유지하면서 전체 문단 데이터를 안전하게 복제
      const paragraphsToSaveCollection = (managedParagraphCollection || []).map(
        (currentParagraphItem) => ({
          ...currentParagraphItem,
        })
      );

      // 1. 복사된 문단들을 Zustand 스토어에 저장
      // 2. 사용자가 작성한 모든 텍스트 내용과 구조 정보를 영구 보관
      updateStoredParagraphs(paragraphsToSaveCollection);

      console.log('💾 [ACTION] Zustand 저장 완료:', {
        containers: managedContainerCollection?.length || 0,
        paragraphs: managedParagraphCollection?.length || 0,
      });

      // 1. 저장 성공 시 사용자에게 확인 메시지 표시
      // 2. 데이터가 안전하게 보관되었음을 명확히 알려 안심감 제공
      addToast({
        title: '저장 완료',
        description: '모든 내용이 저장되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [HOOK] 진행 상황 저장 실패:', error);
      addToast({
        title: '저장 실패',
        description: '저장 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [
    managedContainerCollection,
    managedParagraphCollection,
    updateStoredContainers,
    updateStoredParagraphs,
    addToast,
  ]);

  // === 에디터 작업 완전 완성 함수 ===
  // 1. 사용자가 모든 작업을 마치고 최종 완성된 글을 생성하려고 할 때 호출되는 함수
  // 2. 모든 컨테이너와 문단을 하나의 완성된 텍스트로 결합하여 에디터 작업 종료
  const finishEditing = useCallback(() => {
    console.log('🎛️ [HOOK] finishEditing 호출');

    try {
      // 1. 먼저 현재까지의 모든 작업을 저장하여 데이터 손실 방지
      // 2. 완성 전 마지막 백업을 통해 안전장치 제공
      saveCurrentProgress();

      // 1. 모든 컨테이너와 문단을 순서대로 정렬하여 최종 완성된 텍스트 생성
      // 2. 사용자가 작성한 구조화된 내용을 하나의 연결된 문서로 변환
      const finalCompletedContentText = generateCompletedContent(
        managedContainerCollection || [],
        managedParagraphCollection || []
      );

      // 1. 완성 가능 여부 검증: 최소 1개의 컨테이너 존재 확인
      // 2. 구조 없이는 완성된 글이라고 할 수 없으므로 사전 체크
      if (
        !managedContainerCollection ||
        managedContainerCollection.length === 0
      ) {
        addToast({
          title: '에디터 미완성',
          description: '최소 1개 이상의 컨테이너가 필요합니다.',
          color: 'warning',
        });
        return;
      }

      // 1. 완성 가능 여부 검증: 컨테이너에 할당된 문단이 있는지 확인
      // 2. 구조만 있고 내용이 없으면 완성된 글이 아니므로 사전 체크
      const assignedParagraphsCountInEditor = (
        managedParagraphCollection || []
      ).filter((currentParagraphItem) => currentParagraphItem?.containerId);

      if (assignedParagraphsCountInEditor.length === 0) {
        addToast({
          title: '에디터 미완성',
          description: '최소 1개 이상의 할당된 단락이 필요합니다.',
          color: 'warning',
        });
        return;
      }

      // 1. Zustand 스토어에 최종 완성된 텍스트 내용 저장
      // 2. 다른 컴포넌트에서 완성된 결과물을 사용할 수 있도록 글로벌 상태 업데이트
      updateCompletedContentInStore(finalCompletedContentText);

      // 1. 에디터 완성 상태를 true로 설정
      // 2. 완성 여부를 다른 컴포넌트들이 판단할 수 있도록 플래그 업데이트
      updateCompletionStatusInStore(true);

      // 1. 에디터 작업 완성 성공 메시지 표시
      // 2. 사용자에게 모든 작업이 성공적으로 완료되었음을 알림
      addToast({
        title: '에디터 완성',
        description: '모듈화된 글 작성이 완료되었습니다!',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [HOOK] 에디터 완성 실패:', error);
      addToast({
        title: '완성 실패',
        description: '에디터 완성 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [
    managedContainerCollection,
    managedParagraphCollection,
    saveCurrentProgress,
    updateCompletedContentInStore,
    updateCompletionStatusInStore,
    addToast,
  ]);

  // === 선택된 문단 목록 업데이트 함수 ===
  // 1. 외부에서 선택된 문단 ID 배열을 받아 내부 상태와 글로벌 상태를 동시 업데이트하는 함수
  // 2. 다중 선택 기능에서 선택 상태를 일괄적으로 변경할 때 사용
  const updateSelectedParagraphs = useCallback(
    (paragraphIdCollectionToUpdate: string[]) => {
      console.log('🎛️ [HOOK] updateSelectedParagraphs 호출:', {
        count: paragraphIdCollectionToUpdate?.length || 0,
      });

      try {
        // 1. 입력 배열의 안전성 검증 및 기본값 설정
        // 2. null이나 undefined가 들어와도 빈 배열로 처리하여 런타임 에러 방지
        const safeParagraphIdCollection = Array.isArray(
          paragraphIdCollectionToUpdate
        )
          ? paragraphIdCollectionToUpdate
          : [];

        // 1. 로컬 내부 상태의 선택된 문단 ID 목록 업데이트
        // 2. 현재 컴포넌트에서 선택 상태 변경사항을 즉시 반영
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          selectedParagraphIds: safeParagraphIdCollection,
        }));

        // 1. Zustand 글로벌 스토어에도 동일한 선택 상태 동기화
        // 2. 다른 컴포넌트들도 변경된 선택 상태를 공유할 수 있도록 업데이트
        updateSelectedParagraphIdsInStore(safeParagraphIdCollection);
      } catch (error) {
        console.error('❌ [HOOK] 선택된 문단 업데이트 실패:', error);
      }
    },
    [updateSelectedParagraphIdsInStore]
  );

  // === 타겟 컨테이너 설정 함수 ===
  // 1. 선택된 문단들을 추가할 목적지 컨테이너를 지정하는 함수
  // 2. 문단 배치 작업에서 "어디에 추가할지"를 결정하는 중간 단계에서 사용
  const updateTargetContainer = useCallback(
    (targetContainerIdToUpdate: string) => {
      console.log(
        '🎛️ [HOOK] updateTargetContainer 호출:',
        targetContainerIdToUpdate
      );

      try {
        // 1. 컨테이너 ID의 안전성 검증 및 기본값 설정
        // 2. null이나 undefined 입력에 대해 빈 문자열로 처리하여 안정성 보장
        const safeContainerIdValue = targetContainerIdToUpdate || '';

        // 1. 로컬 내부 상태의 타겟 컨테이너 ID 업데이트
        // 2. 현재 어떤 컨테이너가 목적지로 선택되었는지 추적
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          targetContainerId: safeContainerIdValue,
        }));

        // 1. Zustand 글로벌 스토어에도 타겟 컨테이너 정보 동기화
        // 2. 다른 컴포넌트들도 현재 타겟 컨테이너 정보를 공유할 수 있도록 업데이트
        updateTargetContainerIdInStore(safeContainerIdValue);
      } catch (error) {
        console.error('❌ [HOOK] 타겟 컨테이너 업데이트 실패:', error);
      }
    },
    [updateTargetContainerIdInStore]
  );

  // === 활성 문단 설정 함수 ===
  // 1. 현재 편집 중이거나 포커스된 문단을 지정하는 함수
  // 2. 외부에서 특정 문단을 활성화하고 싶을 때 사용 (null 허용으로 비활성화도 가능)
  const updateActiveParagraph = useCallback(
    (paragraphIdToActivate: string | null) => {
      console.log(
        '🎛️ [HOOK] updateActiveParagraph 호출:',
        paragraphIdToActivate
      );

      try {
        // 1. 로컬 내부 상태의 활성 문단 ID 업데이트
        // 2. null 값도 허용하여 모든 문단을 비활성화할 수 있도록 처리
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          activeParagraphId: paragraphIdToActivate,
        }));

        // 1. Zustand 글로벌 스토어에도 활성 문단 정보 동기화
        // 2. 다른 컴포넌트들도 현재 활성 문단 변경사항을 인지할 수 있도록 업데이트
        updateActiveParagraphIdInStore(paragraphIdToActivate);
      } catch (error) {
        console.error('❌ [HOOK] 활성 문단 업데이트 실패:', error);
      }
    },
    [updateActiveParagraphIdInStore]
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
  // 1. 컴포넌트에서 필요한 상태와 기능들을 객체 형태로 반환
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
    setSelectedParagraphIds: updateSelectedParagraphs, // 선택된 문단 ID 목록을 일괄 설정하는 함수
    setTargetContainerId: updateTargetContainer, // 타겟 컨테이너 ID를 설정하는 함수
    setActiveParagraphId: updateActiveParagraph, // 활성 문단 ID를 설정하는 함수

    // === 단락 관리 함수들 반환 ===
    addLocalParagraph: createNewParagraph, // 새로운 빈 문단을 생성하여 추가하는 함수
    deleteLocalParagraph: removeParagraph, // 지정된 문단을 삭제하는 함수
    updateLocalParagraphContent: updateParagraphContent, // 문단의 텍스트 내용을 수정하는 함수
    toggleParagraphSelection: toggleParagraphSelect, // 문단의 선택 상태를 토글하는 함수
    addToLocalContainer: addParagraphsToContainer, // 선택된 문단들을 지정된 컨테이너에 추가하는 함수
    moveLocalParagraphInContainer: changeParagraphOrder, // 컨테이너 내에서 문단의 순서를 변경하는 함수
    getLocalUnassignedParagraphs: getUnassignedParagraphs, // 아직 컨테이너에 할당되지 않은 문단들을 조회하는 함수
    getLocalParagraphsByContainer: getParagraphsByContainer, // 특정 컨테이너에 속한 문단들을 조회하는 함수

    // === 에디터 액션 함수들 반환 ===
    handleStructureComplete: completeStructureSetup, // 구조 설정을 완료하고 writing 단계로 전환하는 함수
    goToStructureStep: navigateToStructureStep, // 구조 설정 단계로 돌아가는 함수
    activateEditor: setActiveEditor, // 특정 문단의 에디터를 활성화하고 스크롤 이동하는 함수
    togglePreview: switchPreviewMode, // 미리보기 패널을 열고 닫는 토글 함수
    saveAllToContext: saveCurrentProgress, // 현재까지의 모든 작업을 글로벌 스토어에 저장하는 함수
    completeEditor: finishEditing, // 에디터 작업을 완전히 마무리하고 최종 결과물을 생성하는 함수
  };
};
//====여기까지 수정됨====
