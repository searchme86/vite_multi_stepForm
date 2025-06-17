// 📁 actions/editorActions/editorActionsSaveHandler.ts

import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import { validateEditorState } from '../../utils/validation';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useToastStore } from '../../../../store/toast/toastStore';

// ✨ [STATIC IMPORT] 타입 변환 함수들과 콘텐츠 생성 함수를 static import로 가져오기
import {
  convertFromZustandContainer,
  convertFromZustandParagraph,
  convertToZustandContainer,
  convertToZustandParagraph,
} from './editorActionsTypeConverters';
import { generateCompletedContent } from './editorActionsContentGenerator';

// ✨ [인터페이스 정의] Toast 메시지 타입 정의
interface Toast {
  title: string;
  description: string;
  color: 'warning' | 'success';
}

// ✨ [ZUSTAND 추가] saveAllToContext 함수 오버로드
export function saveAllToContext(): void;
export function saveAllToContext(
  currentLocalContainers: Container[],
  currentLocalParagraphs: LocalParagraph[],
  updateEditorContainers: (containers: Container[]) => void,
  updateEditorParagraphs: (paragraphs: LocalParagraph[]) => void,
  showToast: (toastMessage: Toast) => void
): void;
/**
 * 모든 데이터를 Context에 저장하는 함수
 * @param currentLocalContainers - 현재 로컬 컨테이너 배열 (선택적)
 * @param currentLocalParagraphs - 현재 로컬 단락 배열 (선택적)
 * @param updateEditorContainers - 에디터 컨테이너를 업데이트하는 함수 (선택적)
 * @param updateEditorParagraphs - 에디터 단락을 업데이트하는 함수 (선택적)
 * @param showToast - 토스트 메시지를 표시하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 현재 편집 중인 모든 데이터를 영구 저장소에 저장하는 기능
 * 2. 왜 이 함수를 사용했는지: 사용자의 작업 내용을 잃지 않도록 데이터를 안전하게 보관하기 위해
 */
export function saveAllToContext(
  currentLocalContainers?: Container[], // ✨ [매개변수명 개선] localContainers → currentLocalContainers로 의미 명확화
  currentLocalParagraphs?: LocalParagraph[], // ✨ [매개변수명 개선] localParagraphs → currentLocalParagraphs로 의미 명확화
  updateEditorContainers?: (containers: Container[]) => void, // ✨ [매개변수명 개선] updateEditorContainers는 이미 의미가 명확함
  updateEditorParagraphs?: (paragraphs: LocalParagraph[]) => void, // ✨ [매개변수명 개선] updateEditorParagraphs는 이미 의미가 명확함
  showToast?: (toastMessage: Toast) => void // ✨ [매개변수명 개선] addToast → showToast로 의미 명확화
) {
  console.log('💾 [SAVE] 전체 Context 저장 시작');

  if (
    currentLocalContainers &&
    currentLocalParagraphs &&
    updateEditorContainers &&
    updateEditorParagraphs &&
    showToast
  ) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 데이터 저장 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 로컬 컨테이너 데이터를 Context에 업데이트 2. 컨테이너 구조 정보를 영구 저장하기 위해
    updateEditorContainers(currentLocalContainers);

    // 1. 로컬 단락 데이터를 복사하여 Context에 업데이트 2. 단락 내용을 영구 저장하고 원본 데이터 보호를 위해
    const contextParagraphsToSave = currentLocalParagraphs.map(
      (currentParagraph) => ({
        // ✨ [변수명 개선] contextParagraphs → contextParagraphsToSave, p → currentParagraph로 의미 명확화
        ...currentParagraph, // 1. 기존 단락 데이터의 모든 속성을 복사 2. 데이터 무결성을 유지하기 위해
      })
    );
    updateEditorParagraphs(contextParagraphsToSave);
    console.log(
      '여기3<-------,contextParagraphsToSave',
      contextParagraphsToSave
    );

    console.log('💾 [SAVE] Context 저장 완료:', {
      containers: currentLocalContainers.length,
      paragraphs: currentLocalParagraphs.length,
    });

    // 1. 저장 완료를 알리는 성공 메시지 표시 2. 사용자에게 저장 작업 완료를 피드백하기 위해
    showToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 데이터 저장 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 현재 저장된 데이터를 조회하기 위해
    const editorCoreStoreState = useEditorCoreStore.getState(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreState로 의미 명확화

    // 1. Zustand 스토어에서 현재 컨테이너 데이터를 가져오기 2. 저장 작업을 위해 현재 데이터가 필요하므로
    const zustandContainers = editorCoreStoreState.getContainers();
    // 1. Zustand 스토어에서 현재 단락 데이터를 가져오기 2. 저장 작업을 위해 현재 데이터가 필요하므로
    const zustandParagraphs = editorCoreStoreState.getParagraphs();

    // 1. Zustand 컨테이너 타입을 기존 타입으로 변환 2. 타입 호환성을 위해
    const convertedContainersFromZustand = zustandContainers.map(
      // ✨ [변수명 개선] convertedContainers → convertedContainersFromZustand로 의미 명확화
      convertFromZustandContainer
    );
    // 1. Zustand 단락 타입을 기존 타입으로 변환 2. 타입 호환성을 위해
    const convertedParagraphsFromZustand = zustandParagraphs.map(
      // ✨ [변수명 개선] convertedParagraphs → convertedParagraphsFromZustand로 의미 명확화
      convertFromZustandParagraph
    );

    // 1. 변환된 데이터를 다시 Zustand 타입으로 재변환 2. 스토어에 저장하기 위해 올바른 타입이 필요하므로
    const reconvertedContainersToZustand = convertedContainersFromZustand.map(
      // ✨ [변수명 개선] reconvertedContainers → reconvertedContainersToZustand로 의미 명확화
      convertToZustandContainer
    );
    const reconvertedParagraphsToZustand = convertedParagraphsFromZustand.map(
      // ✨ [변수명 개선] reconvertedParagraphs → reconvertedParagraphsToZustand로 의미 명확화
      convertToZustandParagraph
    );

    // 1. 재변환된 컨테이너 데이터를 스토어에 저장 2. 데이터 동기화를 위해
    editorCoreStoreState.setContainers(reconvertedContainersToZustand);
    // 1. 재변환된 단락 데이터를 스토어에 저장 2. 데이터 동기화를 위해
    editorCoreStoreState.setParagraphs(reconvertedParagraphsToZustand);

    console.log('💾 [SAVE] Context 저장 완료 (Zustand):', {
      containers: convertedContainersFromZustand.length,
      paragraphs: convertedParagraphsFromZustand.length,
    });

    // 1. Zustand 토스트 스토어에서 메시지 표시 함수를 가져와 성공 메시지 표시 2. 사용자에게 저장 작업 완료를 피드백하기 위해
    const zustandShowToast = useToastStore.getState().addToast; // ✨ [변수명 개선] zustandAddToast → zustandShowToast로 의미 명확화
    zustandShowToast({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] completeEditor 함수 오버로드
export function completeEditor(): void;
export function completeEditor(
  currentLocalContainers: Container[],
  currentLocalParagraphs: LocalParagraph[],
  saveDataToContext: () => void,
  generateFinalContent: (
    containers: Container[],
    paragraphs: LocalParagraph[]
  ) => string,
  updateEditorCompletedContent: (content: string) => void,
  setEditorAsCompleted: (completed: boolean) => void,
  showToast: (toastMessage: Toast) => void
): void;
/**
 * 에디터 작업을 완료 처리하는 함수
 * @param currentLocalContainers - 현재 로컬 컨테이너 배열 (선택적)
 * @param currentLocalParagraphs - 현재 로컬 단락 배열 (선택적)
 * @param saveDataToContext - 데이터를 Context에 저장하는 함수 (선택적)
 * @param generateFinalContent - 최종 콘텐츠를 생성하는 함수 (선택적)
 * @param updateEditorCompletedContent - 완료된 콘텐츠를 업데이트하는 함수 (선택적)
 * @param setEditorAsCompleted - 에디터 완료 상태를 설정하는 함수 (선택적)
 * @param showToast - 토스트 메시지를 표시하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 모든 편집 작업을 마무리하고 최종 결과물을 생성하는 기능
 * 2. 왜 이 함수를 사용했는지: 사용자의 편집 작업을 완료하고 최종 문서를 생성하기 위해
 */
export function completeEditor(
  currentLocalContainers?: Container[], // ✨ [매개변수명 개선] localContainers → currentLocalContainers로 의미 명확화
  currentLocalParagraphs?: LocalParagraph[], // ✨ [매개변수명 개선] localParagraphs → currentLocalParagraphs로 의미 명확화
  saveDataToContext?: () => void, // ✨ [매개변수명 개선] saveAllToContextFn → saveDataToContext로 의미 명확화
  generateFinalContent?: (
    // ✨ [매개변수명 개선] generateCompletedContentFn → generateFinalContent로 의미 명확화
    containers: Container[],
    paragraphs: LocalParagraph[]
  ) => string,
  updateEditorCompletedContent?: (content: string) => void, // ✨ [매개변수명 개선] updateEditorCompletedContent는 이미 의미가 명확함
  setEditorAsCompleted?: (completed: boolean) => void, // ✨ [매개변수명 개선] setEditorCompleted → setEditorAsCompleted로 의미 명확화
  showToast?: (toastMessage: Toast) => void // ✨ [매개변수명 개선] addToast → showToast로 의미 명확화
) {
  console.log('🎉 [MAIN] 에디터 완성 처리');

  if (
    currentLocalContainers &&
    currentLocalParagraphs &&
    saveDataToContext &&
    generateFinalContent &&
    updateEditorCompletedContent &&
    setEditorAsCompleted &&
    showToast
  ) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 완료 처리 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 현재까지의 모든 데이터를 Context에 저장 2. 완료 처리 전에 데이터 손실을 방지하기 위해
    saveDataToContext();

    // 1. 컨테이너와 단락 데이터를 기반으로 최종 마크다운 콘텐츠 생성 2. 사용자가 작성한 내용을 하나의 문서로 합치기 위해
    const finalCompletedContent = generateFinalContent(
      // ✨ [변수명 개선] completedContent → finalCompletedContent로 의미 명확화
      currentLocalContainers,
      currentLocalParagraphs
    );

    // 1. 에디터 상태를 검증하여 완료 조건을 만족하는지 확인 2. 미완성 상태에서 완료 처리를 방지하기 위해
    if (
      !validateEditorState({
        containers: currentLocalContainers,
        paragraphs: currentLocalParagraphs,
        completedContent: finalCompletedContent,
        isCompleted: true,
      })
    ) {
      // 1. 완료 조건을 만족하지 않을 때 경고 메시지 표시 2. 사용자에게 필요한 작업을 안내하기 위해
      showToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return; // 1. 조건을 만족하지 않으면 함수 실행 중단 2. 미완성 상태에서는 완료 처리하지 않기 위해
    }

    // 1. 생성된 최종 콘텐츠를 에디터 완료 콘텐츠로 업데이트 2. 완료된 문서 내용을 저장하기 위해
    updateEditorCompletedContent(finalCompletedContent);
    // 1. 에디터 완료 상태를 true로 설정 2. 에디터가 완료되었음을 시스템에 알리기 위해
    setEditorAsCompleted(true);

    console.log('✅ [EDITOR] 에디터 완성 처리 완료:', {
      containerCount: currentLocalContainers.length,
      paragraphCount: currentLocalParagraphs.length,
      contentLength: finalCompletedContent.length,
    });

    // 1. 에디터 완성을 알리는 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
    showToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 완료 처리 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. 현재까지의 모든 데이터를 저장 (재귀 호출이지만 매개변수가 없으므로 zustand 버전 호출됨) 2. 완료 처리 전에 데이터 손실을 방지하기 위해
    saveAllToContext();

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 완료 처리를 위해 현재 데이터가 필요하므로
    const editorCoreStoreState = useEditorCoreStore.getState();

    // 1. Zustand 스토어에서 현재 컨테이너 데이터를 가져오기 2. 완료 처리를 위해 현재 데이터가 필요하므로
    const zustandContainers = editorCoreStoreState.getContainers();
    // 1. Zustand 스토어에서 현재 단락 데이터를 가져오기 2. 완료 처리를 위해 현재 데이터가 필요하므로
    const zustandParagraphs = editorCoreStoreState.getParagraphs();

    // 1. Zustand 타입을 기존 타입으로 변환 2. 콘텐츠 생성 함수가 기존 타입을 요구하므로
    const convertedContainersForCompletion = zustandContainers.map(
      // ✨ [변수명 개선] convertedContainers → convertedContainersForCompletion로 의미 명확화
      convertFromZustandContainer
    );
    const convertedParagraphsForCompletion = zustandParagraphs.map(
      // ✨ [변수명 개선] convertedParagraphs → convertedParagraphsForCompletion로 의미 명확화
      convertFromZustandParagraph
    );

    // 1. 변환된 데이터를 기반으로 최종 마크다운 콘텐츠 생성 2. 사용자가 작성한 내용을 하나의 문서로 합치기 위해
    const finalCompletedContent = generateCompletedContent(
      convertedContainersForCompletion,
      convertedParagraphsForCompletion
    );

    // 1. 에디터 상태를 검증하여 완료 조건을 만족하는지 확인 2. 미완성 상태에서 완료 처리를 방지하기 위해
    if (
      !validateEditorState({
        containers: convertedContainersForCompletion,
        paragraphs: convertedParagraphsForCompletion,
        completedContent: finalCompletedContent,
        isCompleted: true,
      })
    ) {
      // 1. 완료 조건을 만족하지 않을 때 Zustand 토스트로 경고 메시지 표시 2. 사용자에게 필요한 작업을 안내하기 위해
      const zustandShowToast = useToastStore.getState().addToast;
      zustandShowToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return; // 1. 조건을 만족하지 않으면 함수 실행 중단 2. 미완성 상태에서는 완료 처리하지 않기 위해
    }

    // 1. 생성된 최종 콘텐츠를 Zustand 스토어에 저장 2. 완료된 문서 내용을 저장하기 위해
    editorCoreStoreState.setCompletedContent(finalCompletedContent);
    // 1. 에디터 완료 상태를 Zustand 스토어에 true로 설정 2. 에디터가 완료되었음을 시스템에 알리기 위해
    editorCoreStoreState.setIsCompleted(true);

    console.log('✅ [EDITOR] 에디터 완성 처리 완료 (Zustand):', {
      containerCount: convertedContainersForCompletion.length,
      paragraphCount: convertedParagraphsForCompletion.length,
      contentLength: finalCompletedContent.length,
    });

    // 1. Zustand 토스트 스토어에서 메시지 표시 함수를 가져와 성공 메시지 표시 2. 사용자에게 작업 완료를 피드백하기 위해
    const zustandShowToast = useToastStore.getState().addToast;
    zustandShowToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }
}
