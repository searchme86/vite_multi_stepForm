// 📁 actions/paragraphActions/paragraphActionsCrud.ts

import { LocalParagraph } from '../../types/paragraph';
import { EditorInternalState } from '../../types/editor';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

// ✨ [STATIC IMPORT] 타입 변환 함수를 static import로 가져오기
import { convertToZustandParagraph } from './paragraphActionsTypeConverters';

// ✨ [인터페이스 정의] Toast 메시지 타입 정의
interface Toast {
  title: string;
  description: string;
  color: string;
}

// ✨ [ZUSTAND 추가] addLocalParagraph 함수 오버로드
export function addLocalParagraph(): void;
export function addLocalParagraph(
  currentLocalParagraphs: LocalParagraph[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
/**
 * 새로운 빈 단락을 생성하고 추가하는 함수
 * @param currentLocalParagraphs - 현재 로컬 단락 배열 (선택적)
 * @param updateLocalParagraphs - 로컬 단락 배열을 업데이트하는 함수 (선택적)
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 새로운 단락을 추가할 때 빈 단락을 생성하고 편집 상태로 만드는 기능
 * 2. 왜 이 함수를 사용했는지: 동적으로 단락을 추가하여 유연한 글 작성 환경을 제공하기 위해
 */
export function addLocalParagraph(
  currentLocalParagraphs?: LocalParagraph[], // ✨ [매개변수명 개선] localParagraphs → currentLocalParagraphs로 의미 명확화
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // ✨ [매개변수명 개선] setLocalParagraphs → updateLocalParagraphs로 의미 명확화
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  > // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
) {
  if (currentLocalParagraphs && updateLocalParagraphs && updateInternalState) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 단락 추가 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 새로운 빈 단락 객체 생성 2. 사용자가 내용을 입력할 수 있는 새로운 편집 공간을 만들기 위해
    const newParagraphToAdd: LocalParagraph = {
      // ✨ [변수명 개선] newParagraph → newParagraphToAdd로 의미 명확화
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 1. 고유한 ID 생성 2. 중복되지 않는 식별자로 단락을 구분하기 위해
      content: '', // 1. 빈 내용으로 초기화 2. 사용자가 처음부터 내용을 입력할 수 있도록 하기 위해
      containerId: null, // 1. 아직 컨테이너에 할당되지 않은 상태 2. 나중에 사용자가 원하는 컨테이너에 배치할 수 있도록 하기 위해
      order: currentLocalParagraphs.length, // 1. 현재 단락 개수를 순서로 설정 2. 새로운 단락이 맨 마지막에 위치하도록 하기 위해
      createdAt: new Date(), // 1. 현재 시간을 생성 시간으로 설정 2. 단락이 언제 만들어졌는지 기록하기 위해
      updatedAt: new Date(), // 1. 현재 시간을 수정 시간으로 설정 2. 초기 생성 시점을 수정 시간으로도 기록하기 위해
    };

    // 1. 기존 단락 배열에 새 단락을 추가 2. 화면에 새로운 편집 가능한 단락을 표시하기 위해
    updateLocalParagraphs((previousParagraphs) => [
      ...previousParagraphs,
      newParagraphToAdd,
    ]); // ✨ [매개변수명 개선] prev → previousParagraphs로 의미 명확화

    // 1. 새로 생성된 단락을 활성 상태로 설정 2. 사용자가 즉시 해당 단락에 내용을 입력할 수 있도록 하기 위해
    updateInternalState((previousState: EditorInternalState) => ({
      // ✨ [매개변수명 개선] prev → previousState로 의미 명확화
      ...previousState,
      activeParagraphId: newParagraphToAdd.id, // 1. 활성 단락 ID를 새로 생성된 단락으로 설정 2. 편집 포커스를 새 단락으로 이동하기 위해
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 단락 추가 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 기존 단락 정보를 조회하고 새 단락을 추가하기 위해
    const editorCoreStoreActions = useEditorCoreStore.getState(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreActions로 의미 명확화
    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. 활성 단락 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState(); // ✨ [변수명 개선] editorUIStore → editorUIStoreActions로 의미 명확화

    // 1. 현재 존재하는 모든 단락을 조회 2. 새로운 단락의 순서를 결정하기 위해
    const existingParagraphsFromStore = editorCoreStoreActions.getParagraphs(); // ✨ [변수명 개선] existingParagraphs → existingParagraphsFromStore로 의미 명확화

    // 1. 새로운 빈 단락 객체 생성 2. 사용자가 내용을 입력할 수 있는 새로운 편집 공간을 만들기 위해
    const newParagraphToAdd: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 1. 고유한 ID 생성 2. 중복되지 않는 식별자로 단락을 구분하기 위해
      content: '', // 1. 빈 내용으로 초기화 2. 사용자가 처음부터 내용을 입력할 수 있도록 하기 위해
      containerId: null, // 1. 아직 컨테이너에 할당되지 않은 상태 2. 나중에 사용자가 원하는 컨테이너에 배치할 수 있도록 하기 위해
      order: existingParagraphsFromStore.length, // 1. 현재 단락 개수를 순서로 설정 2. 새로운 단락이 맨 마지막에 위치하도록 하기 위해
      createdAt: new Date(), // 1. 현재 시간을 생성 시간으로 설정 2. 단락이 언제 만들어졌는지 기록하기 위해
      updatedAt: new Date(), // 1. 현재 시간을 수정 시간으로 설정 2. 초기 생성 시점을 수정 시간으로도 기록하기 위해
    };

    // 1. 기존 타입을 Zustand 타입으로 변환 2. 스토어에 저장하기 위해 올바른 타입이 필요하므로
    const zustandParagraphToAdd = convertToZustandParagraph(newParagraphToAdd); // ✨ [변수명 개선] zustandParagraph → zustandParagraphToAdd로 의미 명확화

    // 1. 변환된 단락을 Zustand 스토어에 추가 2. 데이터를 영구 저장하기 위해
    editorCoreStoreActions.addParagraph(zustandParagraphToAdd);
    // 1. 새로 생성된 단락을 활성 상태로 설정 2. 사용자가 즉시 해당 단락에 내용을 입력할 수 있도록 하기 위해
    editorUIStoreActions.setActiveParagraphId(newParagraphToAdd.id);
  }
}

// ✨ [ZUSTAND 추가] updateLocalParagraphContent 함수 오버로드
export function updateLocalParagraphContent(
  targetParagraphId: string,
  newContent: string
): void;
export function updateLocalParagraphContent(
  targetParagraphId: string,
  newContent: string,
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
/**
 * 특정 단락의 내용을 업데이트하는 함수
 * @param targetParagraphId - 업데이트할 단락의 고유 식별자
 * @param newContent - 업데이트할 새로운 내용
 * @param updateLocalParagraphs - 로컬 단락 배열을 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 단락에 입력한 내용을 실시간으로 저장하는 기능
 * 2. 왜 이 함수를 사용했는지: 사용자의 편집 내용을 즉시 반영하여 자연스러운 편집 경험을 제공하기 위해
 */
export function updateLocalParagraphContent(
  targetParagraphId: string, // ✨ [매개변수명 개선] paragraphId → targetParagraphId로 의미 명확화
  newContent: string, // ✨ [매개변수명 개선] content → newContent로 의미 명확화
  updateLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>> // ✨ [매개변수명 개선] setLocalParagraphs → updateLocalParagraphs로 의미 명확화
) {
  console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
    paragraphId: targetParagraphId,
    contentLength: (newContent || '').length,
    contentPreview: (newContent || '').slice(0, 100),
    hasImages: (newContent || '').includes('!['),
    hasBase64: (newContent || '').includes('data:image'),
    timestamp: Date.now(),
  });

  if (updateLocalParagraphs) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 내용 업데이트 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 해당 ID의 단락만 내용을 업데이트하고 나머지는 그대로 유지 2. 특정 단락만 수정하고 다른 단락에 영향을 주지 않기 위해
    updateLocalParagraphs(
      (
        previousParagraphs // ✨ [매개변수명 개선] prev → previousParagraphs로 의미 명확화
      ) =>
        previousParagraphs.map(
          (
            currentParagraph // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
          ) =>
            currentParagraph.id === targetParagraphId
              ? {
                  ...currentParagraph,
                  content: newContent || '', // 1. 새로운 내용으로 업데이트하되 null/undefined인 경우 빈 문자열로 처리 2. 데이터 일관성을 위해
                  updatedAt: new Date(), // 1. 수정 시간을 현재 시간으로 업데이트 2. 언제 마지막으로 수정되었는지 추적하기 위해
                }
              : currentParagraph // 1. 다른 단락들은 변경하지 않고 그대로 반환 2. 불필요한 변경을 방지하기 위해
        )
    );
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 내용 업데이트 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 단락 내용을 업데이트하기 위해
    const editorCoreStoreActions = useEditorCoreStore.getState();
    // 1. 스토어의 업데이트 메서드를 사용하여 단락 내용 변경 2. Zustand의 내장 업데이트 로직을 활용하기 위해
    editorCoreStoreActions.updateParagraphContent(
      targetParagraphId,
      newContent || ''
    );
  }
}

// ✨ [ZUSTAND 추가] deleteLocalParagraph 함수 오버로드
export function deleteLocalParagraph(targetParagraphId: string): void;
export function deleteLocalParagraph(
  targetParagraphId: string,
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  showToast: (toastMessage: Toast) => void
): void;
/**
 * 특정 단락을 삭제하는 함수
 * @param targetParagraphId - 삭제할 단락의 고유 식별자
 * @param updateLocalParagraphs - 로컬 단락 배열을 업데이트하는 함수 (선택적)
 * @param showToast - 토스트 메시지를 표시하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 사용자가 불필요한 단락을 제거할 수 있는 기능
 * 2. 왜 이 함수를 사용했는지: 유연한 편집 환경에서 단락을 자유롭게 추가/제거할 수 있도록 하기 위해
 */
export function deleteLocalParagraph(
  targetParagraphId: string, // ✨ [매개변수명 개선] paragraphId → targetParagraphId로 의미 명확화
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // ✨ [매개변수명 개선] setLocalParagraphs → updateLocalParagraphs로 의미 명확화
  showToast?: (toastMessage: Toast) => void // ✨ [매개변수명 개선] addToast → showToast로 의미 명확화
) {
  if (updateLocalParagraphs && showToast) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 단락 삭제 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 해당 ID가 아닌 단락들만 필터링하여 삭제 효과 구현 2. 특정 단락만 제거하고 나머지는 유지하기 위해
    updateLocalParagraphs((previousParagraphs) =>
      previousParagraphs.filter(
        (currentParagraph) => currentParagraph.id !== targetParagraphId
      )
    ); // ✨ [매개변수명 개선] prev → previousParagraphs, p → currentParagraph로 의미 명확화

    // 1. 삭제 완료를 알리는 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
    showToast({
      title: '단락 삭제',
      description: '선택한 단락이 삭제되었습니다.',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 단락 삭제 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 단락을 삭제하기 위해
    const editorCoreStoreActions = useEditorCoreStore.getState();
    // 1. Zustand Toast 스토어에서 메시지 표시 함수들을 가져옴 2. 삭제 완료 메시지를 표시하기 위해
    const toastStoreActions = useToastStore.getState(); // ✨ [변수명 개선] toastStore → toastStoreActions로 의미 명확화

    // 1. 스토어의 삭제 메서드를 사용하여 단락 제거 2. Zustand의 내장 삭제 로직을 활용하기 위해
    editorCoreStoreActions.deleteParagraph(targetParagraphId);

    // 1. 삭제 완료를 알리는 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
    toastStoreActions.addToast({
      title: '단락 삭제',
      description: '선택한 단락이 삭제되었습니다.',
      color: 'success',
    });
  }
}
