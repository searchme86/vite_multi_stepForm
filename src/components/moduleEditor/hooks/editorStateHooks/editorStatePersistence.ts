import { useCallback } from 'react';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph } from './editorStateTypes';
import { generateCompletedContent } from './editorStateHelpers';

// ✨ [저장/완료 함수들] 원본과 동일한 구조로 작성 - HOF 패턴 제거하고 직접 사용 방식 적용

// ✨ [저장 함수] 현재 진행상황 저장 함수 - 사용자의 작업 내용을 context나 store에 저장
const saveCurrentProgress = (
  currentContainers: Container[], // 1. 현재 생성된 모든 섹션 목록 2. 사용자가 구성한 구조
  currentParagraphs: LocalParagraph[], // 1. 현재 작성된 모든 단락 목록 2. 사용자가 입력한 내용
  updateContainersFunction: (containers: Container[]) => void, // 1. 컨테이너 업데이트 함수 2. context 또는 store에 저장
  updateParagraphsFunction: (paragraphs: LocalParagraph[]) => void, // 1. 단락 업데이트 함수 2. context 또는 store에 저장
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 저장 완료 메시지 표시
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] saveCurrentProgress 호출');

    // 1. 컨테이너 목록을 context나 store에 저장 2. 섹션 구조 영구 보존
    updateContainersFunction(currentContainers);

    // 1. 단락 목록을 복사해서 저장 2. 원본 데이터 보호와 안전한 저장
    const paragraphsToSave = currentParagraphs.map((currentParagraphItem) => ({
      ...currentParagraphItem, // 1. 모든 속성 복사 2. 깊은 복사로 데이터 무결성 보장
    }));
    updateParagraphsFunction(paragraphsToSave);

    console.log('💾 [ACTION] Context 저장 완료:', {
      containers: currentContainers.length, // 1. 저장된 섹션 개수 로깅 2. 저장 상태 추적
      paragraphs: currentParagraphs.length, // 1. 저장된 단락 개수 로깅 2. 데이터 양 확인
    });

    // 1. 사용자에게 저장 완료 알림 2. 성공적인 작업 피드백 제공
    showToastFunction({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }, [
    currentContainers,
    currentParagraphs,
    updateContainersFunction,
    updateParagraphsFunction,
    showToastFunction,
  ]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

// ✨ [완료 함수] 편집 완료 함수 - 모든 작업을 마무리하고 최종 결과물 생성
const finishEditing = (
  currentContainers: Container[], // 1. 현재 생성된 모든 섹션 목록 2. 최종 구조 확인용
  currentParagraphs: LocalParagraph[], // 1. 현재 작성된 모든 단락 목록 2. 최종 내용 생성용
  saveCurrentProgressCallback: () => void, // 1. 진행상황 저장 함수 2. 완료 전 마지막 저장
  updateCompletedContentFunction: (content: string) => void, // 1. 완성된 내용 업데이트 함수 2. 최종 결과물 저장
  setCompletedStatusFunction: (completed: boolean) => void, // 1. 완료 상태 설정 함수 2. 에디터 완료 표시
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 완료/오류 메시지 표시
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] finishEditing 호출');

    // 1. 완료 전 현재 작업 내용 저장 2. 데이터 손실 방지
    saveCurrentProgressCallback();

    // 1. 모든 섹션과 단락을 하나의 완성된 텍스트로 생성 2. 최종 결과물 제작
    const finalCompletedContent = generateCompletedContent(
      currentContainers,
      currentParagraphs
    );

    // 1. 기본 유효성 검사 - 최소 1개 이상의 컨테이너 필요 2. 의미있는 결과물 보장
    if (currentContainers.length === 0) {
      showToastFunction({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너가 필요합니다.',
        color: 'warning',
      });
      return;
    }

    // 1. 할당된 단락 개수 확인 2. 실제 내용이 있는지 검증
    const assignedParagraphsCount = currentParagraphs.filter(
      (currentParagraphItem) => currentParagraphItem.containerId // 1. 섹션에 배치된 단락들만 계산 2. 미할당 단락 제외
    );
    if (assignedParagraphsCount.length === 0) {
      showToastFunction({
        title: '에디터 미완성',
        description: '최소 1개 이상의 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    // 1. 완성된 내용을 context나 store에 저장 2. 최종 결과물 영구 보존
    updateCompletedContentFunction(finalCompletedContent);
    // 1. 에디터 완료 상태를 true로 설정 2. UI에서 완료 상태 표시
    setCompletedStatusFunction(true);

    // 1. 사용자에게 완료 축하 메시지 표시 2. 성공적인 작업 완료 알림
    showToastFunction({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }, [
    currentContainers,
    currentParagraphs,
    saveCurrentProgressCallback,
    updateCompletedContentFunction,
    setCompletedStatusFunction,
    showToastFunction,
  ]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

//====여기부터 수정됨====
// 저장/완료 함수들을 export - useEditorStateMain.ts에서 import할 수 있도록
export { saveCurrentProgress, finishEditing };
//====여기까지 수정됨====
