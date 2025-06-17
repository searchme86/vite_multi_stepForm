import { useCallback } from 'react';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph } from './editorStateTypes';
import { generateCompletedContent } from './editorStateHelpers';

// ✨ [저장/완료 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [저장 함수] 현재 진행상황 저장 함수 - 사용자의 작업 내용을 context나 store에 저장
const saveCurrentProgress = (
  managedContainerCollection: Container[], // 1. 현재 생성된 모든 섹션 목록 2. 원본 변수명과 일치
  managedParagraphCollection: LocalParagraph[], // 1. 현재 작성된 모든 단락 목록 2. 원본 변수명과 일치
  updateContainersFunction: (containers: Container[]) => void, // 1. 컨테이너 업데이트 함수 2. context 또는 store에 저장
  updateParagraphsFunction: (paragraphs: LocalParagraph[]) => void, // 1. 단락 업데이트 함수 2. context 또는 store에 저장
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 저장 완료 메시지 표시
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] saveCurrentProgress 호출');

    try {
      // 1. 현재 로컬 상태의 컨테이너들을 context나 store에 저장
      // 2. 구조 설정에서 생성한 섹션 정보를 영구 저장하여 새로고침해도 유지되도록 보장
      const safeContainerCollection = managedContainerCollection || [];
      if (updateContainersFunction) {
        updateContainersFunction(safeContainerCollection);
      }

      // 1. 현재 로컬 상태의 문단들을 저장 가능한 형태로 복사
      // 2. 불변성을 유지하면서 전체 문단 데이터를 안전하게 복제
      const safeParagraphCollection = managedParagraphCollection || [];
      const paragraphsToSaveCollection = safeParagraphCollection.map(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return {
            ...safeParagraph,
          };
        }
      );

      // 1. 복사된 문단들을 context나 store에 저장
      // 2. 사용자가 작성한 모든 텍스트 내용과 구조 정보를 영구 보관
      if (updateParagraphsFunction) {
        updateParagraphsFunction(paragraphsToSaveCollection);
      }

      console.log('💾 [ACTION] Context/Store 저장 완료:', {
        containers: safeContainerCollection.length,
        paragraphs: safeParagraphCollection.length,
      });

      console.log(
        '<-------저장 버튼을 누르면 나오는 곳, 6월 16일 월요일',
        paragraphsToSaveCollection
      );

      // 1. 사용자에게 저장 완료 알림 2. 성공적인 작업 피드백 제공
      if (showToastFunction) {
        showToastFunction({
          title: '저장 완료',
          description: '모든 내용이 저장되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [HOOK] 진행 상황 저장 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '저장 실패',
          description: '저장 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [
    managedContainerCollection,
    managedParagraphCollection,
    updateContainersFunction,
    updateParagraphsFunction,
    showToastFunction,
  ]);
};

// ✨ [완료 함수] 편집 완료 함수 - 모든 작업을 마무리하고 최종 결과물 생성
const finishEditing = (
  managedContainerCollection: Container[], // 1. 현재 생성된 모든 섹션 목록 2. 원본 변수명과 일치
  managedParagraphCollection: LocalParagraph[], // 1. 현재 작성된 모든 단락 목록 2. 원본 변수명과 일치
  saveCurrentProgressCallback: () => void, // 1. 진행상황 저장 함수 2. 완료 전 마지막 저장
  updateCompletedContentFunction: (content: string) => void, // 1. 완성된 내용 업데이트 함수 2. 최종 결과물 저장
  setCompletedStatusFunction: (completed: boolean) => void, // 1. 완료 상태 설정 함수 2. 에디터 완료 표시
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 완료/오류 메시지 표시
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] finishEditing 호출');

    try {
      // 1. 완료 전 현재 작업 내용 저장 2. 데이터 손실 방지
      if (saveCurrentProgressCallback) {
        saveCurrentProgressCallback();
      }

      const safeContainerCollection = managedContainerCollection || [];
      const safeParagraphCollection = managedParagraphCollection || [];

      // 1. 모든 섹션과 단락을 하나의 완성된 텍스트로 생성 2. 최종 결과물 제작
      const finalCompletedContentText = generateCompletedContent(
        safeContainerCollection,
        safeParagraphCollection
      );

      // 1. 기본 유효성 검사 - 최소 1개 이상의 컨테이너 필요 2. 의미있는 결과물 보장
      if (safeContainerCollection.length === 0) {
        if (showToastFunction) {
          showToastFunction({
            title: '에디터 미완성',
            description: '최소 1개 이상의 컨테이너가 필요합니다.',
            color: 'warning',
          });
        }
        return;
      }

      // 1. 할당된 단락 개수 확인 2. 실제 내용이 있는지 검증
      const assignedParagraphsCountInEditor = safeParagraphCollection.filter(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.containerId; // 1. 섹션에 배치된 단락들만 계산 2. 미할당 단락 제외
        }
      );

      if (assignedParagraphsCountInEditor.length === 0) {
        if (showToastFunction) {
          showToastFunction({
            title: '에디터 미완성',
            description: '최소 1개 이상의 할당된 단락이 필요합니다.',
            color: 'warning',
          });
        }
        return;
      }

      // 1. 완성된 내용을 context나 store에 저장 2. 최종 결과물 영구 보존
      if (updateCompletedContentFunction) {
        updateCompletedContentFunction(finalCompletedContentText);
      }

      // 1. 에디터 완료 상태를 true로 설정 2. UI에서 완료 상태 표시
      if (setCompletedStatusFunction) {
        setCompletedStatusFunction(true);
      }

      // 1. 사용자에게 완료 축하 메시지 표시 2. 성공적인 작업 완료 알림
      if (showToastFunction) {
        showToastFunction({
          title: '에디터 완성',
          description: '모듈화된 글 작성이 완료되었습니다!',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [HOOK] 에디터 완성 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '완성 실패',
          description: '에디터 완성 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [
    managedContainerCollection,
    managedParagraphCollection,
    saveCurrentProgressCallback,
    updateCompletedContentFunction,
    setCompletedStatusFunction,
    showToastFunction,
  ]);
};

// 저장/완료 함수들을 export
export { saveCurrentProgress, finishEditing };
