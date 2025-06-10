import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container, ToastOptions } from '../../store/shared/commonTypes';
import { EditorUIStoreActions } from './editorStateTypes';
import {
  createContainer,
  updateZustandStoreIfNeeded,
} from './editorStateHelpers';

// ✨ [워크플로우 함수들] 원본과 동일한 구조로 작성 - 타입 가드 제거하고 원본 방식 적용

// ✨ [워크플로우 함수] 구조 설정 완료 함수 - 사용자가 섹션 구조를 완성했을 때 실행
const completeStructureSetup = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  setCurrentContainers: React.Dispatch<React.SetStateAction<Container[]>>,
  showToastFunction: (options: ToastOptions) => void,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (validSectionInputs: string[]) => {
      console.log('🎛️ [HOOK] completeStructureSetup 호출:', validSectionInputs);

      // 1. 최소 섹션 개수 검증 2. 의미있는 구조를 위해 2개 이상 필요
      if (validSectionInputs.length < 2) {
        showToastFunction({
          title: '구조 설정 오류',
          description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
          color: 'warning',
        });
        return;
      }

      // 1. 전환 애니메이션 시작 2. 부드러운 단계 변경 효과
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        isTransitioning: true, // 1. 전환 중임을 표시 2. UI에서 로딩 상태 표현
      }));

      // 1. 입력받은 섹션 이름들로 컨테이너 생성 2. 각 섹션을 실제 데이터 구조로 변환
      const createdContainers = validSectionInputs.map(
        (sectionName, containerIndex) =>
          createContainer(sectionName, containerIndex) // 1. 섹션 이름과 순서로 컨테이너 객체 생성 2. 고유 ID와 메타데이터 포함
      );
      setCurrentContainers(createdContainers); // 1. 생성된 컨테이너들을 상태에 저장 2. UI에 섹션 목록 표시
      console.log('📦 [ACTION] 로컬 컨테이너 생성:', createdContainers);

      // 1. 전환 애니메이션과 단계 변경을 비동기로 처리 2. 자연스러운 UI 전환
      setTimeout(() => {
        setEditorInternalState((previousInternalState) => ({
          ...previousInternalState,
          currentSubStep: 'writing', // 1. 다음 단계인 글쓰기 단계로 이동 2. 워크플로우 진행
          isTransitioning: false, // 1. 전환 애니메이션 종료 2. 정상 상태로 복귀
        }));
      }, 300); // 1. 300ms 딜레이로 자연스러운 전환 2. 사용자 경험 개선

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.goToWritingStep(); // 1. store의 단계도 writing으로 변경 2. 전역 상태 동기화
      });

      // 1. 사용자에게 성공 메시지 표시 2. 몇 개의 섹션이 생성되었는지 알림
      showToastFunction({
        title: '구조 설정 완료',
        description: `${validSectionInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    },
    [showToastFunction, hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

// ✨ [워크플로우 함수] 구조 단계로 이동 함수 - 사용자가 구조 설정 단계로 돌아갈 때 사용
const navigateToStructureStep = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] navigateToStructureStep 호출');

    // 1. 전환 애니메이션 시작 2. 부드러운 단계 변경 효과
    setEditorInternalState((previousInternalState) => ({
      ...previousInternalState,
      isTransitioning: true, // 1. 전환 중임을 표시 2. UI에서 로딩 상태 표현
    }));

    // 1. 전환 애니메이션과 단계 변경을 비동기로 처리 2. 자연스러운 UI 전환
    setTimeout(() => {
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        currentSubStep: 'structure', // 1. 구조 설정 단계로 이동 2. 섹션 구성 화면 표시
        isTransitioning: false, // 1. 전환 애니메이션 종료 2. 정상 상태로 복귀
      }));
    }, 300); // 1. 300ms 딜레이로 자연스러운 전환 2. 사용자 경험 개선

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.goToStructureStep(); // 1. store의 단계도 structure로 변경 2. 전역 상태 동기화
    });
  }, [hasContext, editorUIStoreActions]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

// ✨ [워크플로우 함수] 에디터 활성화 함수 - 특정 단락을 편집 상태로 만들고 스크롤 이동
const setActiveEditor = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (targetParagraphId: string) => {
      console.log('🎛️ [HOOK] setActiveEditor 호출:', targetParagraphId);

      // 1. 지정된 단락을 활성 상태로 설정 2. 포커스와 편집 모드 활성화
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        activeParagraphId: targetParagraphId, // 1. 새로운 활성 단락 ID 설정 2. 편집 대상 지정
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setActiveParagraphId(targetParagraphId); // 1. store의 활성 단락도 동일하게 설정 2. 전역 상태 동기화
      });

      // 1. DOM 조작을 위한 비동기 처리 2. 렌더링 완료 후 스크롤 이동
      setTimeout(() => {
        // 1. 대상 단락 요소를 DOM에서 찾기 2. data 속성으로 정확한 요소 선택
        const targetElement = document.querySelector(
          `[data-paragraph-id="${targetParagraphId}"]`
        );

        if (targetElement) {
          // 1. 스크롤 가능한 컨테이너 찾기 2. 부모 요소 중 스크롤이 있는 영역 탐색
          const scrollContainer = targetElement.closest('.overflow-y-auto');

          if (scrollContainer) {
            // 1. 스크롤 컨테이너가 있는 경우 정밀한 스크롤 제어 2. 상대적 위치 계산
            const { getBoundingClientRect: getContainerRect } = scrollContainer;
            const { getBoundingClientRect: getElementRect } = targetElement;
            const containerRect = getContainerRect(); // 1. 스크롤 컨테이너의 화면상 위치 2. 기준점 설정
            const elementRect = getElementRect(); // 1. 대상 요소의 화면상 위치 2. 이동할 목표점
            const { scrollTop: containerScrollTop } = scrollContainer; // 1. 현재 스크롤 위치 2. 상대적 계산 기준
            const offsetTop =
              elementRect.top - containerRect.top + containerScrollTop; // 1. 컨테이너 기준 요소의 절대 위치 계산 2. 정확한 스크롤 대상 좌표

            scrollContainer.scrollTo({
              top: Math.max(0, offsetTop - 20), // 1. 여백 20px을 두고 스크롤 2. 음수 방지로 안전성 확보
              behavior: 'smooth', // 1. 부드러운 스크롤 애니메이션 2. 사용자 경험 개선
            });
          } else {
            // 1. 일반적인 스크롤 처리 2. 브라우저 기본 스크롤 기능 사용
            targetElement.scrollIntoView({
              behavior: 'smooth', // 1. 부드러운 스크롤 애니메이션 2. 자연스러운 이동
              block: 'start', // 1. 요소를 화면 상단에 배치 2. 편집하기 좋은 위치
              inline: 'nearest', // 1. 가로 스크롤은 최소화 2. 불필요한 가로 이동 방지
            });
          }
        }
      }, 200); // 1. 200ms 딜레이로 렌더링 완료 대기 2. DOM 업데이트 후 스크롤 실행
    },
    [hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

// ✨ [워크플로우 함수] 프리뷰 모드 전환 함수 - 미리보기 화면 열기/닫기 토글
const switchPreviewMode = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] switchPreviewMode 호출');

    // 1. 현재 미리보기 상태를 반대로 토글 2. 열려있으면 닫고, 닫혀있으면 열기
    setEditorInternalState((previousInternalState) => ({
      ...previousInternalState,
      isPreviewOpen: !previousInternalState.isPreviewOpen, // 1. boolean 값 반전 2. 토글 방식으로 직관적 조작
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.togglePreview(); // 1. store의 미리보기 상태도 토글 2. 전역 상태 동기화
    });
  }, [hasContext, editorUIStoreActions]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

//====여기부터 수정됨====
// 워크플로우 함수들을 export - useEditorStateMain.ts에서 import할 수 있도록
export {
  completeStructureSetup,
  navigateToStructureStep,
  setActiveEditor,
  switchPreviewMode,
};
//====여기까지 수정됨====
