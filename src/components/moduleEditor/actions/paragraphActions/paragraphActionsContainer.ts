// 📁 actions/paragraphActions/paragraphActionsContainer.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import { EditorInternalState } from '../../types/editor';
import {
  validateParagraphSelection,
  validateContainerTarget,
} from '../../utils/validation';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
import { useToastStore } from '../../store/toast/toastStore';

// ✨ [STATIC IMPORT] 타입 변환 함수들을 static import로 가져오기
import {
  convertFromZustandContainer,
  convertFromZustandParagraph,
  convertToZustandParagraph,
} from './paragraphActionsTypeConverters';

// ✨ [인터페이스 정의] Toast 메시지 타입 정의
interface Toast {
  title: string;
  description: string;
  color: string;
}

// ✨ [ZUSTAND 추가] addToLocalContainer 함수 오버로드
export function addToLocalContainer(): void;
export function addToLocalContainer(
  selectedParagraphIds: string[],
  targetContainerId: string,
  currentLocalParagraphs: LocalParagraph[],
  currentLocalContainers: Container[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  updateInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  showToast: (toastMessage: Toast) => void
): void;
/**
 * 선택된 단락들을 지정된 컨테이너에 복사하여 추가하는 함수
 * @param selectedParagraphIds - 선택된 단락들의 ID 배열 (선택적)
 * @param targetContainerId - 단락들을 추가할 대상 컨테이너의 ID (선택적)
 * @param currentLocalParagraphs - 현재 로컬 단락 배열 (선택적)
 * @param currentLocalContainers - 현재 로컬 컨테이너 배열 (선택적)
 * @param updateLocalParagraphs - 로컬 단락 배열을 업데이트하는 함수 (선택적)
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 * @param showToast - 토스트 메시지를 표시하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 선택한 단락들을 특정 컨테이너(섹션)에 복사하여 구성하는 기능
 * 2. 왜 이 함수를 사용했는지: 모듈화된 글 작성에서 단락을 원하는 섹션에 배치할 수 있도록 하기 위해
 *
 * 실행 매커니즘:
 * 1. 선택된 단락과 대상 컨테이너 유효성 검증
 * 2. 빈 내용의 단락이 있는지 확인 (빈 단락은 추가 불가)
 * 3. 대상 컨테이너의 기존 단락 순서 확인
 * 4. 선택된 단락들을 복사하여 새로운 ID로 생성
 * 5. 새 단락들을 대상 컨테이너에 순서대로 추가
 * 6. 선택 상태 초기화 및 성공 메시지 표시
 */
export function addToLocalContainer(
  selectedParagraphIds?: string[], // ✨ [매개변수명 개선] selectedParagraphIds는 이미 의미가 명확함
  targetContainerId?: string, // ✨ [매개변수명 개선] targetContainerId는 이미 의미가 명확함
  currentLocalParagraphs?: LocalParagraph[], // ✨ [매개변수명 개선] localParagraphs → currentLocalParagraphs로 의미 명확화
  currentLocalContainers?: Container[], // ✨ [매개변수명 개선] localContainers → currentLocalContainers로 의미 명확화
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // ✨ [매개변수명 개선] setLocalParagraphs → updateLocalParagraphs로 의미 명확화
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
  showToast?: (toastMessage: Toast) => void // ✨ [매개변수명 개선] addToast → showToast로 의미 명확화
) {
  if (
    selectedParagraphIds &&
    targetContainerId &&
    currentLocalParagraphs &&
    currentLocalContainers &&
    updateLocalParagraphs &&
    updateInternalState &&
    showToast
  ) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 컨테이너 추가 2. 기존 시스템과의 호환성 유지를 위해

    console.log('📦 [CONTAINER] 컨테이너에 단락 추가 시작:', {
      selectedCount: selectedParagraphIds.length,
      targetContainerId,
      timestamp: Date.now(),
    });

    // 1. 선택된 단락이 있는지 검증 2. 빈 선택으로 작업을 시도하는 것을 방지하기 위해
    if (!validateParagraphSelection(selectedParagraphIds)) {
      showToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return; // 1. 검증 실패 시 함수 실행 중단 2. 잘못된 상태로 작업을 진행하지 않기 위해
    }

    // 1. 대상 컨테이너가 올바르게 선택되었는지 검증 2. 잘못된 컨테이너에 단락을 추가하는 것을 방지하기 위해
    if (!validateContainerTarget(targetContainerId)) {
      showToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return; // 1. 검증 실패 시 함수 실행 중단 2. 잘못된 상태로 작업을 진행하지 않기 위해
    }

    // 1. 대상 컨테이너에 이미 존재하는 단락들을 조회 2. 새로운 단락의 순서를 결정하기 위해
    const existingParagraphsInTarget = currentLocalParagraphs.filter(
      // ✨ [변수명 개선] existingParagraphs → existingParagraphsInTarget로 의미 명확화
      (currentParagraph) => currentParagraph.containerId === targetContainerId // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
    );

    // 1. 기존 단락들 중 가장 큰 순서 번호를 찾기 2. 새로운 단락들이 마지막에 추가되도록 하기 위해
    const lastOrderInContainer = // ✨ [변수명 개선] lastOrder → lastOrderInContainer로 의미 명확화
      existingParagraphsInTarget.length > 0
        ? Math.max(
            ...existingParagraphsInTarget.map(
              (currentParagraph) => currentParagraph.order
            )
          ) // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
        : -1; // 1. 기존 단락이 없으면 -1로 설정 2. 새로운 단락의 순서가 0부터 시작하도록 하기 위해

    // 1. 선택된 ID에 해당하는 실제 단락 객체들을 조회 2. 단락의 전체 정보를 활용하기 위해
    const selectedParagraphsToAdd = currentLocalParagraphs.filter(
      (
        currentParagraph // ✨ [변수명 개선] selectedParagraphs → selectedParagraphsToAdd, p → currentParagraph로 의미 명확화
      ) => selectedParagraphIds.includes(currentParagraph.id)
    );

    console.log('📦 [CONTAINER] 선택된 단락들 상태 확인:', {
      selectedCount: selectedParagraphsToAdd.length,
      paragraphStates: selectedParagraphsToAdd.map((currentParagraph) => ({
        // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
        id: currentParagraph.id,
        contentLength: currentParagraph.content.length,
        hasImages: currentParagraph.content.includes('!['),
        preview: currentParagraph.content.slice(0, 50),
        isEmpty:
          !currentParagraph.content ||
          currentParagraph.content.trim().length === 0,
      })),
      lastOrder: lastOrderInContainer,
      timestamp: Date.now(),
    });

    // 1. 선택된 단락 중 내용이 비어있는 단락들을 찾기 2. 빈 단락은 컨테이너에 추가할 수 없으므로 미리 확인
    const emptyParagraphsInSelection = selectedParagraphsToAdd.filter(
      // ✨ [변수명 개선] emptyParagraphs → emptyParagraphsInSelection로 의미 명확화
      (currentParagraph) =>
        !currentParagraph.content ||
        currentParagraph.content.trim().length === 0 // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
    );

    console.log('📦 [CONTAINER] 빈 단락 체크:', {
      emptyCount: emptyParagraphsInSelection.length,
      emptyParagraphIds: emptyParagraphsInSelection.map(
        (currentParagraph) => currentParagraph.id
      ), // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      willBlock: emptyParagraphsInSelection.length > 0,
    });

    // 1. 빈 단락이 있으면 작업을 중단 2. 의미 없는 빈 단락이 컨테이너에 추가되는 것을 방지하기 위해
    if (emptyParagraphsInSelection.length > 0) {
      console.log(
        '❌ [CONTAINER] 빈 단락으로 인한 차단:',
        emptyParagraphsInSelection.length
      );
      showToast({
        title: '빈 단락 포함',
        description: '내용이 없는 단락은 컨테이너에 추가할 수 없습니다.',
        color: 'warning',
      });
      return; // 1. 빈 단락이 있으면 함수 실행 중단 2. 잘못된 데이터로 작업을 진행하지 않기 위해
    }

    // 1. 선택된 단락들을 복사하여 새로운 단락 객체들 생성 2. 원본 단락은 유지하고 컨테이너용 복사본을 만들기 위해
    const newParagraphsToAdd: LocalParagraph[] = selectedParagraphsToAdd.map(
      // ✨ [변수명 개선] newParagraphs → newParagraphsToAdd로 의미 명확화
      (currentParagraph, currentIndex) => {
        // ✨ [매개변수명 개선] paragraph → currentParagraph, index → currentIndex로 의미 명확화
        console.log('✅ [CONTAINER] 단락 복사 생성:', {
          originalId: currentParagraph.id,
          contentLength: currentParagraph.content.length,
          hasImages: currentParagraph.content.includes('!['),
          preview: currentParagraph.content.slice(0, 100),
        });

        return {
          ...currentParagraph, // 1. 기존 단락의 모든 속성을 복사 2. 내용과 메타데이터를 그대로 유지하기 위해
          id: `paragraph-copy-${Date.now()}-${currentIndex}-${Math.random() // 1. 새로운 고유 ID 생성 2. 원본과 구분되는 새로운 단락으로 만들기 위해
            .toString(36)
            .substr(2, 9)}`,
          originalId: currentParagraph.id, // 1. 원본 단락의 ID를 보존 2. 나중에 원본과의 관계를 추적할 수 있도록 하기 위해
          content: currentParagraph.content, // 1. 단락 내용을 그대로 복사 2. 사용자가 작성한 텍스트를 보존하기 위해
          containerId: targetContainerId, // 1. 대상 컨테이너 ID로 설정 2. 새로운 단락이 올바른 컨테이너에 속하도록 하기 위해
          order: lastOrderInContainer + currentIndex + 1, // 1. 기존 마지막 순서 다음부터 차례로 설정 2. 새로운 단락들이 순서대로 배치되도록 하기 위해
          createdAt: new Date(), // 1. 현재 시간을 생성 시간으로 설정 2. 복사된 단락의 생성 시점을 기록하기 위해
          updatedAt: new Date(), // 1. 현재 시간을 수정 시간으로 설정 2. 복사 시점을 수정 시간으로 기록하기 위해
        };
      }
    );

    // 1. 기존 단락 배열에 새로 생성된 단락들을 추가 2. 화면에 새로운 단락들이 표시되도록 하기 위해
    updateLocalParagraphs((previousParagraphs) => [
      ...previousParagraphs,
      ...newParagraphsToAdd,
    ]); // ✨ [매개변수명 개선] prev → previousParagraphs로 의미 명확화

    // 1. 선택 상태와 대상 컨테이너 상태를 초기화 2. 작업 완료 후 UI를 깨끗한 상태로 만들기 위해
    updateInternalState((previousState: EditorInternalState) => ({
      // ✨ [매개변수명 개선] prev → previousState로 의미 명확화
      ...previousState,
      selectedParagraphIds: [], // 1. 선택된 단락 목록을 비우기 2. 다음 작업을 위해 선택 상태를 초기화하기 위해
      targetContainerId: '', // 1. 대상 컨테이너 설정을 초기화 2. 다음 작업을 위해 컨테이너 선택 상태를 초기화하기 위해
    }));

    // 1. 대상 컨테이너의 이름을 조회 2. 성공 메시지에 컨테이너 이름을 포함하기 위해
    const targetContainerInfo = currentLocalContainers.find(
      // ✨ [변수명 개선] targetContainer → targetContainerInfo로 의미 명확화
      (currentContainer) => currentContainer.id === targetContainerId // ✨ [매개변수명 개선] c → currentContainer로 의미 명확화
    );

    console.log('✅ [CONTAINER] 단락 추가 완료:', {
      addedCount: newParagraphsToAdd.length,
      targetContainer: targetContainerInfo?.name,
      addedParagraphs: newParagraphsToAdd.map((currentParagraph) => ({
        // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
        id: currentParagraph.id,
        contentLength: currentParagraph.content.length,
        hasImages: currentParagraph.content.includes('!['),
        preview: currentParagraph.content.slice(0, 50),
      })),
      timestamp: Date.now(),
    });

    // 1. 작업 완료를 알리는 성공 메시지 표시 2. 사용자에게 작업 결과를 피드백하기 위해
    showToast({
      title: '단락 추가 완료',
      description: `${newParagraphsToAdd.length}개의 단락이 ${targetContainerInfo?.name} 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 컨테이너 추가 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand 스토어들에서 상태 관리 함수들을 가져옴 2. 현재 상태를 조회하고 업데이트하기 위해
    const editorUIStoreActions = useEditorUIStore.getState(); // ✨ [변수명 개선] editorUIStore → editorUIStoreActions로 의미 명확화
    const editorCoreStoreActions = useEditorCoreStore.getState(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreActions로 의미 명확화
    const toastStoreActions = useToastStore.getState(); // ✨ [변수명 개선] toastStore → toastStoreActions로 의미 명확화

    // 1. Zustand 스토어에서 현재 선택 상태와 데이터를 조회 2. 작업에 필요한 정보를 수집하기 위해
    const selectedIdsFromStore = editorUIStoreActions.getSelectedParagraphIds(); // ✨ [변수명 개선] selectedIds → selectedIdsFromStore로 의미 명확화
    const targetIdFromStore = editorUIStoreActions.getTargetContainerId(); // ✨ [변수명 개선] targetId → targetIdFromStore로 의미 명확화
    const allParagraphsFromStore = editorCoreStoreActions // ✨ [변수명 개선] allParagraphs → allParagraphsFromStore로 의미 명확화
      .getParagraphs()
      .map(convertFromZustandParagraph); // 1. Zustand 타입을 기존 타입으로 변환 2. 기존 로직과 호환성을 유지하기 위해
    const allContainersFromStore = editorCoreStoreActions // ✨ [변수명 개선] allContainers → allContainersFromStore로 의미 명확화
      .getContainers()
      .map(convertFromZustandContainer); // 1. Zustand 타입을 기존 타입으로 변환 2. 기존 로직과 호환성을 유지하기 위해

    console.log('📦 [CONTAINER] 컨테이너에 단락 추가 시작 (Zustand):', {
      selectedCount: selectedIdsFromStore.length,
      targetContainerId: targetIdFromStore,
      timestamp: Date.now(),
    });

    // 1. 선택된 단락이 있는지 검증 2. 빈 선택으로 작업을 시도하는 것을 방지하기 위해
    if (!validateParagraphSelection(selectedIdsFromStore)) {
      toastStoreActions.addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return; // 1. 검증 실패 시 함수 실행 중단 2. 잘못된 상태로 작업을 진행하지 않기 위해
    }

    // 1. 대상 컨테이너가 올바르게 선택되었는지 검증 2. 잘못된 컨테이너에 단락을 추가하는 것을 방지하기 위해
    if (!validateContainerTarget(targetIdFromStore)) {
      toastStoreActions.addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return; // 1. 검증 실패 시 함수 실행 중단 2. 잘못된 상태로 작업을 진행하지 않기 위해
    }

    // 1. 대상 컨테이너에 이미 존재하는 단락들을 조회 2. 새로운 단락의 순서를 결정하기 위해
    const existingParagraphsInTargetFromStore = allParagraphsFromStore.filter(
      // ✨ [변수명 개선] existingParagraphs → existingParagraphsInTargetFromStore로 의미 명확화
      (currentParagraph) => currentParagraph.containerId === targetIdFromStore // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
    );

    // 1. 기존 단락들 중 가장 큰 순서 번호를 찾기 2. 새로운 단락들이 마지막에 추가되도록 하기 위해
    const lastOrderInContainerFromStore = // ✨ [변수명 개선] lastOrder → lastOrderInContainerFromStore로 의미 명확화
      existingParagraphsInTargetFromStore.length > 0
        ? Math.max(
            ...existingParagraphsInTargetFromStore.map(
              (currentParagraph) => currentParagraph.order
            )
          ) // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
        : -1; // 1. 기존 단락이 없으면 -1로 설정 2. 새로운 단락의 순서가 0부터 시작하도록 하기 위해

    // 1. 선택된 ID에 해당하는 실제 단락 객체들을 조회 2. 단락의 전체 정보를 활용하기 위해
    const selectedParagraphsToAddFromStore = allParagraphsFromStore.filter(
      (
        currentParagraph // ✨ [변수명 개선] selectedParagraphs → selectedParagraphsToAddFromStore, p → currentParagraph로 의미 명확화
      ) => selectedIdsFromStore.includes(currentParagraph.id)
    );

    console.log('📦 [CONTAINER] 선택된 단락들 상태 확인 (Zustand):', {
      selectedCount: selectedParagraphsToAddFromStore.length,
      paragraphStates: selectedParagraphsToAddFromStore.map(
        (currentParagraph) => ({
          // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
          id: currentParagraph.id,
          contentLength: currentParagraph.content.length,
          hasImages: currentParagraph.content.includes('!['),
          preview: currentParagraph.content.slice(0, 50),
          isEmpty:
            !currentParagraph.content ||
            currentParagraph.content.trim().length === 0,
        })
      ),
      lastOrder: lastOrderInContainerFromStore,
      timestamp: Date.now(),
    });

    // 1. 선택된 단락 중 내용이 비어있는 단락들을 찾기 2. 빈 단락은 컨테이너에 추가할 수 없으므로 미리 확인
    const emptyParagraphsInSelectionFromStore =
      selectedParagraphsToAddFromStore.filter(
        // ✨ [변수명 개선] emptyParagraphs → emptyParagraphsInSelectionFromStore로 의미 명확화
        (currentParagraph) =>
          !currentParagraph.content ||
          currentParagraph.content.trim().length === 0 // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      );

    console.log('📦 [CONTAINER] 빈 단락 체크 (Zustand):', {
      emptyCount: emptyParagraphsInSelectionFromStore.length,
      emptyParagraphIds: emptyParagraphsInSelectionFromStore.map(
        (currentParagraph) => currentParagraph.id
      ), // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      willBlock: emptyParagraphsInSelectionFromStore.length > 0,
    });

    // 1. 빈 단락이 있으면 작업을 중단 2. 의미 없는 빈 단락이 컨테이너에 추가되는 것을 방지하기 위해
    if (emptyParagraphsInSelectionFromStore.length > 0) {
      console.log(
        '❌ [CONTAINER] 빈 단락으로 인한 차단 (Zustand):',
        emptyParagraphsInSelectionFromStore.length
      );
      toastStoreActions.addToast({
        title: '빈 단락 포함',
        description: '내용이 없는 단락은 컨테이너에 추가할 수 없습니다.',
        color: 'warning',
      });
      return; // 1. 빈 단락이 있으면 함수 실행 중단 2. 잘못된 데이터로 작업을 진행하지 않기 위해
    }

    // 1. 선택된 단락들을 복사하여 새로운 단락 객체들 생성 2. 원본 단락은 유지하고 컨테이너용 복사본을 만들기 위해
    const newParagraphsToAddFromStore: LocalParagraph[] =
      selectedParagraphsToAddFromStore.map(
        // ✨ [변수명 개선] newParagraphs → newParagraphsToAddFromStore로 의미 명확화
        (currentParagraph, currentIndex) => {
          // ✨ [매개변수명 개선] paragraph → currentParagraph, index → currentIndex로 의미 명확화
          console.log('✅ [CONTAINER] 단락 복사 생성 (Zustand):', {
            originalId: currentParagraph.id,
            contentLength: currentParagraph.content.length,
            hasImages: currentParagraph.content.includes('!['),
            preview: currentParagraph.content.slice(0, 100),
          });

          return {
            ...currentParagraph, // 1. 기존 단락의 모든 속성을 복사 2. 내용과 메타데이터를 그대로 유지하기 위해
            id: `paragraph-copy-${Date.now()}-${currentIndex}-${Math.random() // 1. 새로운 고유 ID 생성 2. 원본과 구분되는 새로운 단락으로 만들기 위해
              .toString(36)
              .substr(2, 9)}`,
            originalId: currentParagraph.id, // 1. 원본 단락의 ID를 보존 2. 나중에 원본과의 관계를 추적할 수 있도록 하기 위해
            content: currentParagraph.content, // 1. 단락 내용을 그대로 복사 2. 사용자가 작성한 텍스트를 보존하기 위해
            containerId: targetIdFromStore, // 1. 대상 컨테이너 ID로 설정 2. 새로운 단락이 올바른 컨테이너에 속하도록 하기 위해
            order: lastOrderInContainerFromStore + currentIndex + 1, // 1. 기존 마지막 순서 다음부터 차례로 설정 2. 새로운 단락들이 순서대로 배치되도록 하기 위해
            createdAt: new Date(), // 1. 현재 시간을 생성 시간으로 설정 2. 복사된 단락의 생성 시점을 기록하기 위해
            updatedAt: new Date(), // 1. 현재 시간을 수정 시간으로 설정 2. 복사 시점을 수정 시간으로 기록하기 위해
          };
        }
      );

    // 1. 새로 생성된 각 단락을 Zustand 스토어에 추가 2. 변환된 데이터를 영구 저장하기 위해
    newParagraphsToAddFromStore.forEach((currentParagraph) => {
      // ✨ [매개변수명 개선] paragraph → currentParagraph로 의미 명확화
      const zustandParagraphToAdd = convertToZustandParagraph(currentParagraph); // ✨ [변수명 개선] zustandParagraph → zustandParagraphToAdd로 의미 명확화
      editorCoreStoreActions.addParagraph(zustandParagraphToAdd); // 1. 변환된 단락을 스토어에 추가 2. 데이터를 영구 저장하기 위해
    });

    // 1. 선택 상태를 초기화 2. 작업 완료 후 UI를 깨끗한 상태로 만들기 위해
    editorUIStoreActions.clearSelectedParagraphs(); // 1. 선택된 단락 목록을 비우기 2. 다음 작업을 위해 선택 상태를 초기화하기 위해

    // 1. 대상 컨테이너의 이름을 조회 2. 성공 메시지에 컨테이너 이름을 포함하기 위해
    const targetContainerInfoFromStore = allContainersFromStore.find(
      (currentContainer) => currentContainer.id === targetIdFromStore
    ); // ✨ [변수명 개선] targetContainer → targetContainerInfoFromStore, c → currentContainer로 의미 명확화

    console.log('✅ [CONTAINER] 단락 추가 완료 (Zustand):', {
      addedCount: newParagraphsToAddFromStore.length,
      targetContainer: targetContainerInfoFromStore?.name,
      addedParagraphs: newParagraphsToAddFromStore.map((currentParagraph) => ({
        // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
        id: currentParagraph.id,
        contentLength: currentParagraph.content.length,
        hasImages: currentParagraph.content.includes('!['),
        preview: currentParagraph.content.slice(0, 50),
      })),
      timestamp: Date.now(),
    });

    // 1. 작업 완료를 알리는 성공 메시지 표시 2. 사용자에게 작업 결과를 피드백하기 위해
    toastStoreActions.addToast({
      title: '단락 추가 완료',
      description: `${newParagraphsToAddFromStore.length}개의 단락이 ${targetContainerInfoFromStore?.name} 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  }
}
