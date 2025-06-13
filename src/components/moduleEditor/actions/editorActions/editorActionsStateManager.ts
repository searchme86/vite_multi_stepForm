// 📁 actions/editorActions/editorActionsStateManager.ts

import { EditorInternalState } from '../../types/editor';
import { Container } from '../../types/container';
import { validateSectionInputs } from '../../utils/validation';
import { createContainersFromInputs } from '../containerActions';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
import { useToastStore } from '../../store/toast/toastStore';

// ✨ [STATIC IMPORT] 타입 변환 함수들을 static import로 가져오기
import { convertToZustandContainer } from './editorActionsTypeConverters';

// ✨ [인터페이스 정의] Toast 메시지 타입 정의
interface Toast {
  title: string;
  description: string;
  color: 'warning' | 'success';
}

// ✨ [ZUSTAND 추가] handleStructureComplete 함수 오버로드
export function handleStructureComplete(validSectionInputs: string[]): void;
export function handleStructureComplete(
  validSectionInputs: string[],
  updateInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  updateLocalContainers: React.Dispatch<React.SetStateAction<Container[]>>,
  showToast: (toastMessage: Toast) => void
): void;
/**
 * 구조 설정 완료를 처리하는 함수
 * @param validSectionInputs - 유효한 섹션 입력값들의 배열
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 * @param updateLocalContainers - 로컬 컨테이너 상태를 업데이트하는 함수 (선택적)
 * @param showToast - 토스트 메시지를 표시하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 입력한 섹션들을 검증하고 컨테이너로 변환하여 다음 단계로 이동
 * 2. 왜 이 함수를 사용했는지: 구조 설정 단계에서 작성 단계로의 전환을 관리하기 위해
 */
export function handleStructureComplete(
  validSectionInputs: string[], // ✨ [매개변수명 개선] validInputs → validSectionInputs로 의미 명확화
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
  updateLocalContainers?: React.Dispatch<React.SetStateAction<Container[]>>, // ✨ [매개변수명 개선] setLocalContainers → updateLocalContainers로 의미 명확화
  showToast?: (toastMessage: Toast) => void // ✨ [매개변수명 개선] addToast → showToast로 의미 명확화
) {
  console.log('🎉 [MAIN] 구조 완료 처리 시작:', validSectionInputs);

  // 1. 섹션 입력값들을 검증하여 유효성 확인 2. 최소 2개 이상의 섹션이 필요하기 때문에
  const { isValid: isValidSectionInput } =
    validateSectionInputs(validSectionInputs); // ✨ [변수명 개선] isValid → isValidSectionInput로 의미 명확화

  if (!isValidSectionInput) {
    // 1. 검증 실패 시 사용자에게 표시할 경고 메시지 객체 생성 2. 사용자가 올바른 입력을 할 수 있도록 안내하기 위해
    const warningToastMessage: Toast = {
      // ✨ [변수명 개선] toastMessage → warningToastMessage로 의미 명확화
      title: '구조 설정 오류',
      description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
      color: 'warning' as const,
    };

    if (showToast) {
      // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식으로 토스트 표시 2. 기존 시스템과의 호환성을 위해
      showToast(warningToastMessage);
    } else {
      // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식으로 토스트 표시 2. 상태 관리 시스템 마이그레이션을 위해
      const zustandShowToast = useToastStore.getState().addToast; // ✨ [변수명 개선] zustandAddToast → zustandShowToast로 의미 명확화
      zustandShowToast(warningToastMessage);
    }
    return; // 1. 검증 실패 시 함수 실행 중단 2. 잘못된 입력으로는 다음 단계로 진행하지 않기 위해
  }

  if (updateInternalState && updateLocalContainers) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 상태 업데이트 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 화면 전환 애니메이션을 위해 전환 상태를 true로 설정 2. 사용자에게 부드러운 UI 전환 경험을 제공하기 위해
    updateInternalState((previousState) => ({
      ...previousState,
      isTransitioning: true,
    })); // ✨ [매개변수명 개선] prev → previousState로 의미 명확화

    // 1. 입력받은 섹션 이름들을 컨테이너 객체들로 변환 2. 각 섹션을 데이터 구조로 만들어 관리하기 위해
    const createdContainers = createContainersFromInputs(validSectionInputs); // ✨ [변수명 개선] containers → createdContainers로 의미 명확화
    updateLocalContainers(createdContainers);

    console.log('📦 [MAIN] 로컬 컨테이너 생성:', createdContainers);

    // 1. 300ms 후에 작성 단계로 전환하고 전환 상태 해제 2. 애니메이션 시간을 주고 부드러운 전환을 위해
    setTimeout(() => {
      updateInternalState((previousState) => ({
        ...previousState,
        currentSubStep: 'writing', // 1. 현재 단계를 작성 단계로 변경 2. 구조 설정이 완료되어 글 작성 단계로 이동하기 위해
        isTransitioning: false, // 1. 전환 애니메이션 상태를 false로 변경 2. 전환이 완료되었음을 표시하기 위해
      }));
    }, 300);

    if (showToast) {
      // 1. 구조 설정 완료를 알리는 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
      showToast({
        title: '구조 설정 완료',
        description: `${validSectionInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    }
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 상태 업데이트 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. Zustand 방식으로 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState(); // ✨ [변수명 개선] editorUIStore → editorUIStoreActions로 의미 명확화
    editorUIStoreActions.setIsTransitioning(true); // 1. 전환 상태를 true로 설정 2. 화면 전환 애니메이션을 위해

    // 1. 입력받은 섹션 이름들을 컨테이너 객체들로 변환 2. 각 섹션을 데이터 구조로 만들어 관리하기 위해
    const createdContainers = createContainersFromInputs(validSectionInputs);

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 컨테이너 데이터를 스토어에 저장하기 위해
    const editorCoreStoreActions = useEditorCoreStore.getState(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreActions로 의미 명확화

    // 1. 생성된 각 컨테이너를 Zustand 타입으로 변환하여 스토어에 추가 2. 타입 호환성을 맞추고 데이터를 저장하기 위해
    createdContainers.forEach((currentContainer) => {
      // ✨ [매개변수명 개선] container → currentContainer로 의미 명확화
      const zustandContainer = convertToZustandContainer(currentContainer); // 1. 기존 Container 타입을 Zustand Container 타입으로 변환 2. 스토어 타입 요구사항을 맞추기 위해
      editorCoreStoreActions.addContainer(zustandContainer); // 1. 변환된 컨테이너를 스토어에 추가 2. 데이터를 영구 저장하기 위해
    });

    console.log('📦 [MAIN] 로컬 컨테이너 생성 (Zustand):', createdContainers);

    // 1. 300ms 후에 작성 단계로 전환하고 전환 상태 해제 2. 애니메이션 시간을 주고 부드러운 전환을 위해
    setTimeout(() => {
      editorUIStoreActions.setCurrentSubStep('writing'); // 1. 현재 단계를 작성 단계로 변경 2. 구조 설정이 완료되어 글 작성 단계로 이동하기 위해
      editorUIStoreActions.setIsTransitioning(false); // 1. 전환 애니메이션 상태를 false로 변경 2. 전환이 완료되었음을 표시하기 위해
    }, 300);

    // 1. Zustand 토스트 스토어에서 메시지 표시 함수를 가져와 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
    const zustandShowToast = useToastStore.getState().addToast;
    zustandShowToast({
      title: '구조 설정 완료',
      description: `${validSectionInputs.length}개의 섹션이 생성되었습니다.`,
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] goToStructureStep 함수 오버로드
export function goToStructureStep(): void;
export function goToStructureStep(
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
/**
 * 구조 설정 단계로 이동하는 함수
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 현재 단계에서 구조 설정 단계로 되돌아가는 네비게이션 기능
 * 2. 왜 이 함수를 사용했는지: 사용자가 구조를 다시 설정하고 싶을 때 이전 단계로 돌아가기 위해
 */
export function goToStructureStep(
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  > // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
) {
  console.log('⬅️ [EDITOR] 구조 단계로 이동');

  if (updateInternalState) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 상태 업데이트 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 화면 전환 애니메이션을 위해 전환 상태를 true로 설정 2. 사용자에게 부드러운 UI 전환 경험을 제공하기 위해
    updateInternalState((previousState) => ({
      ...previousState,
      isTransitioning: true,
    }));

    // 1. 300ms 후에 구조 단계로 전환하고 전환 상태 해제 2. 애니메이션 시간을 주고 부드러운 전환을 위해
    setTimeout(() => {
      updateInternalState((previousState) => ({
        ...previousState,
        currentSubStep: 'structure', // 1. 현재 단계를 구조 설정 단계로 변경 2. 사용자가 구조를 다시 설정할 수 있도록 하기 위해
        isTransitioning: false, // 1. 전환 애니메이션 상태를 false로 변경 2. 전환이 완료되었음을 표시하기 위해
      }));
    }, 300);
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 상태 업데이트 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. Zustand 방식으로 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState();
    editorUIStoreActions.setIsTransitioning(true); // 1. 전환 상태를 true로 설정 2. 화면 전환 애니메이션을 위해

    // 1. 300ms 후에 구조 단계로 전환하고 전환 상태 해제 2. 애니메이션 시간을 주고 부드러운 전환을 위해
    setTimeout(() => {
      editorUIStoreActions.setCurrentSubStep('structure'); // 1. 현재 단계를 구조 설정 단계로 변경 2. 사용자가 구조를 다시 설정할 수 있도록 하기 위해
      editorUIStoreActions.setIsTransitioning(false); // 1. 전환 애니메이션 상태를 false로 변경 2. 전환이 완료되었음을 표시하기 위해
    }, 300);
  }
}

// ✨ [ZUSTAND 추가] activateEditor 함수 오버로드
export function activateEditor(targetParagraphId: string): void;
export function activateEditor(
  targetParagraphId: string,
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
/**
 * 특정 단락의 에디터를 활성화하는 함수
 * @param targetParagraphId - 활성화할 단락의 고유 식별자
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 클릭한 특정 단락을 편집 가능한 상태로 만들고 해당 위치로 스크롤
 * 2. 왜 이 함수를 사용했는지: 여러 단락 중 하나를 선택해서 편집할 수 있는 UI 기능을 제공하기 위해
 */
export function activateEditor(
  targetParagraphId: string, // ✨ [매개변수명 개선] paragraphId → targetParagraphId로 의미 명확화
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  > // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
) {
  console.log('🎯 [ACTIVATE] 에디터 활성화 시도:', targetParagraphId);

  if (updateInternalState) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 상태 업데이트 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 활성화할 단락의 ID를 상태에 저장 2. 어떤 단락이 현재 편집 중인지 추적하기 위해
    updateInternalState((previousState) => ({
      ...previousState,
      activeParagraphId: targetParagraphId, // 1. 현재 활성화된 단락 ID를 업데이트 2. UI에서 해당 단락을 편집 모드로 표시하기 위해
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 상태 업데이트 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. Zustand 방식으로 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState();
    editorUIStoreActions.setActiveParagraphId(targetParagraphId); // 1. 활성화할 단락의 ID를 스토어에 저장 2. 어떤 단락이 현재 편집 중인지 추적하기 위해
  }

  // 1. 200ms 후에 해당 단락으로 스크롤 실행 2. 상태 업데이트가 DOM에 반영된 후 스크롤하기 위해
  setTimeout(() => {
    // 1. 대상 단락 요소를 DOM에서 찾기 2. 해당 단락으로 스크롤하기 위해 DOM 요소가 필요하므로
    const targetParagraphElement = document.querySelector(
      // ✨ [변수명 개선] targetElement → targetParagraphElement로 의미 명확화
      `[data-paragraph-id="${targetParagraphId}"]`
    );

    console.log('🔍 [ACTIVATE] 대상 요소 찾기:', {
      paragraphId: targetParagraphId,
      elementFound: !!targetParagraphElement, // 1. 요소가 찾아졌는지 boolean 값으로 로깅 2. 디버깅을 위한 정보 제공
      elementTag: targetParagraphElement?.tagName, // 1. 찾은 요소의 태그명 로깅 2. 올바른 요소가 찾아졌는지 확인하기 위해
    });

    if (targetParagraphElement) {
      // 1. 스크롤 가능한 부모 컨테이너를 찾기 2. 전체 페이지가 아닌 특정 영역 내에서 스크롤하기 위해
      const scrollableContainer =
        targetParagraphElement.closest('.overflow-y-auto'); // ✨ [변수명 개선] scrollContainer → scrollableContainer로 의미 명확화

      if (scrollableContainer) {
        console.log('📜 [ACTIVATE] 스크롤 컨테이너 찾음, 스크롤 실행');

        // 1. 스크롤 컨테이너의 위치 정보를 가져오기 2. 상대적 스크롤 위치 계산을 위해
        const containerBoundingRect =
          scrollableContainer.getBoundingClientRect(); // ✨ [변수명 개선] containerRect → containerBoundingRect로 의미 명확화
        // 1. 대상 요소의 위치 정보를 가져오기 2. 스크롤할 정확한 위치 계산을 위해
        const elementBoundingRect =
          targetParagraphElement.getBoundingClientRect(); // ✨ [변수명 개선] elementRect → elementBoundingRect로 의미 명확화

        // 1. 컨테이너 내에서의 상대적 스크롤 위치 계산 2. 정확한 스크롤 위치를 구하기 위해
        const relativeOffsetTop = // ✨ [변수명 개선] offsetTop → relativeOffsetTop로 의미 명확화
          elementBoundingRect.top -
          containerBoundingRect.top +
          scrollableContainer.scrollTop;

        // 1. 계산된 위치로 부드럽게 스크롤 2. 사용자 경험을 위해 부드러운 스크롤 제공
        scrollableContainer.scrollTo({
          top: Math.max(0, relativeOffsetTop - 20), // 1. 스크롤 위치에서 20px 여유 공간 확보 2. 요소가 화면 최상단에 딱 붙지 않도록 하기 위해
          behavior: 'smooth', // 1. 부드러운 스크롤 애니메이션 적용 2. 급작스러운 화면 이동을 방지하기 위해
        });
      } else {
        console.log('📜 [ACTIVATE] 전체 창 기준 스크롤 실행');
        // 1. 스크롤 컨테이너가 없으면 전체 창 기준으로 스크롤 2. 일반적인 페이지 스크롤을 위해
        targetParagraphElement.scrollIntoView({
          behavior: 'smooth', // 1. 부드러운 스크롤 애니메이션 적용 2. 급작스러운 화면 이동을 방지하기 위해
          block: 'start', // 1. 요소를 화면의 시작 부분에 위치시킴 2. 사용자가 요소를 명확히 볼 수 있도록 하기 위해
          inline: 'nearest', // 1. 가로 방향은 가장 가까운 위치로 스크롤 2. 불필요한 가로 스크롤을 방지하기 위해
        });
      }
    } else {
      console.warn(
        '❌ [ACTIVATE] 대상 요소를 찾을 수 없음:',
        targetParagraphId
      );
    }
  }, 200);
}

// ✨ [ZUSTAND 추가] togglePreview 함수 오버로드
export function togglePreview(): void;
export function togglePreview(
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
/**
 * 미리보기 모드를 토글하는 함수
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 편집 모드와 미리보기 모드 사이를 전환하는 기능
 * 2. 왜 이 함수를 사용했는지: 사용자가 작성 중인 내용을 최종 결과물 형태로 확인할 수 있도록 하기 위해
 */
export function togglePreview(
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  > // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
) {
  console.log('👁️ [PREVIEW] 미리보기 토글');

  if (updateInternalState) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 상태 업데이트 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 현재 미리보기 상태의 반대값으로 토글 2. 켜져 있으면 끄고, 꺼져 있으면 켜기 위해
    updateInternalState((previousState) => ({
      ...previousState,
      isPreviewOpen: !previousState.isPreviewOpen, // 1. 미리보기 열림 상태를 반전 2. 토글 기능을 구현하기 위해
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 상태 업데이트 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. Zustand 방식으로 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState();
    editorUIStoreActions.togglePreview(); // 1. 미리보기 상태를 토글 2. 스토어에서 제공하는 토글 메서드 사용
  }
}
