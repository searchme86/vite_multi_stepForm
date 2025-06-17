import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { EditorUIStoreActions } from './editorStateTypes';
import { createContainer } from './editorStateHelpers';

// ✨ [워크플로우 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [워크플로우 함수] 구조 설정 완료 함수 - 사용자가 섹션 구조를 완성했을 때 실행
const completeStructureSetup = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 단계 전환 처리
  setManagedContainerCollection: React.Dispatch<
    React.SetStateAction<Container[]>
  >, // 1. 컨테이너 컬렉션 업데이트 함수 2. 원본 변수명과 일치
  showToastFunction: (options: ToastOptions) => void, // 1. 사용자 알림 함수 2. 성공/실패 메시지 표시
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  navigateToWritingStepInStore: () => void // 1. store writing 단계 전환 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
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
          if (showToastFunction) {
            showToastFunction({
              title: '구조 설정 오류',
              description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
              color: 'warning',
            });
          }
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

        // 1. context가 없을 때만 Zustand 글로벌 스토어에도 writing 단계 전환 알림
        // 2. 다른 컴포넌트들도 현재 단계 변경사항을 인지할 수 있도록 동기화
        if (!hasContext && navigateToWritingStepInStore) {
          navigateToWritingStepInStore();
        }

        // 1. 구조 설정 완료 성공 메시지 표시
        // 2. 생성된 섹션 개수 정보를 포함하여 사용자에게 구체적 피드백 제공
        if (showToastFunction) {
          showToastFunction({
            title: '구조 설정 완료',
            description: `${validSectionInputCollection.length}개의 섹션이 생성되었습니다.`,
            color: 'success',
          });
        }
      } catch (error) {
        console.error('❌ [HOOK] 구조 설정 완료 실패:', error);
        if (showToastFunction) {
          showToastFunction({
            title: '구조 설정 실패',
            description: '구조 설정 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [hasContext, navigateToWritingStepInStore, showToastFunction]
  );
};

// ✨ [워크플로우 함수] 구조 단계로 이동 함수 - 사용자가 구조 설정 단계로 돌아갈 때 사용
const navigateToStructureStep = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 단계 전환 처리
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  navigateToStructureStepInStore: () => void // 1. store structure 단계 전환 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(() => {
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

      // 1. context가 없을 때만 Zustand 글로벌 스토어에도 structure 단계 전환 알림
      // 2. 다른 컴포넌트들도 현재 단계 변경사항을 동기화할 수 있도록 처리
      if (!hasContext && navigateToStructureStepInStore) {
        navigateToStructureStepInStore();
      }
    } catch (error) {
      console.error('❌ [HOOK] 구조 단계 이동 실패:', error);
    }
  }, [hasContext, navigateToStructureStepInStore]);
};

// ✨ [워크플로우 함수] 에디터 활성화 함수 - 특정 단락을 편집 상태로 만들고 스크롤 이동
const setActiveEditor = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 활성 단락 설정
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateActiveParagraphIdInStore: (id: string | null) => void // 1. store 활성 단락 업데이트 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
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

        // 1. context가 없을 때만 Zustand 글로벌 스토어에도 활성 문단 ID 동기화
        // 2. 다른 컴포넌트들도 현재 활성 문단 정보를 공유할 수 있도록 업데이트
        if (!hasContext && updateActiveParagraphIdInStore) {
          updateActiveParagraphIdInStore(specificParagraphIdToActivate);
        }

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
                const containerRect =
                  scrollContainerElement.getBoundingClientRect() || {};
                const elementRect =
                  targetDOMElement.getBoundingClientRect() || {};
                const { top: containerTop = 0 } = containerRect;
                const { top: elementTop = 0 } = elementRect;
                const { scrollTop: containerScrollTop = 0 } =
                  scrollContainerElement;

                const offsetTopValue =
                  elementTop - containerTop + containerScrollTop;

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
    [hasContext, updateActiveParagraphIdInStore]
  );
};

// ✨ [워크플로우 함수] 프리뷰 모드 전환 함수 - 미리보기 화면 열기/닫기 토글
const switchPreviewMode = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 미리보기 상태 관리
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  togglePreviewModeInStore: () => void // 1. store 미리보기 토글 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(() => {
    console.log('🎛️ [HOOK] switchPreviewMode 호출');

    try {
      // 1. 현재 미리보기 상태의 반대값으로 토글
      // 2. 열려있으면 닫고, 닫혀있으면 여는 단순한 boolean 반전 동작
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        isPreviewOpen: !(previousInternalState?.isPreviewOpen ?? true),
      }));

      // 1. context가 없을 때만 Zustand 글로벌 스토어에도 미리보기 상태 동기화
      // 2. 다른 컴포넌트들도 미리보기 모드 변경사항을 인지할 수 있도록 업데이트
      if (!hasContext && togglePreviewModeInStore) {
        togglePreviewModeInStore();
      }
    } catch (error) {
      console.error('❌ [HOOK] 미리보기 모드 전환 실패:', error);
    }
  }, [hasContext, togglePreviewModeInStore]);
};

// 워크플로우 함수들을 export
export {
  completeStructureSetup,
  navigateToStructureStep,
  setActiveEditor,
  switchPreviewMode,
};
