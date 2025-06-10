// 📁 components/moduleEditor/ModularBlogEditorContainer.tsx
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// import { useEditorState } from './hooks/useEditorStateZustand';
import { useEditorState } from './hooks/editorStateHooks/useEditorStateMain';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

function ModularBlogEditorContainer(): React.ReactNode {
  // 1. 렌더링 횟수 추적을 위한 ref 설정 2. 개발 중 성능 모니터링을 위해
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(
    '🔄 [CONTAINER] ModularBlogEditorContainer 렌더링 횟수:',
    renderCount.current
  );

  console.log('✅ [CONTAINER] Zustand Store 확인 완료');

  // 1. 에디터 상태 훅에서 모든 상태와 함수들을 가져오기 2. 에디터의 모든 기능을 사용하기 위해
  const editorState = useEditorState();

  // ✨ [가독성 개선] 구조 분해 할당으로 자주 사용되는 상태들을 미리 추출
  const {
    // 에디터 데이터 상태들
    localContainers: currentContainers, // 1. 현재 생성된 컨테이너 목록 2. 섹션 구조를 관리하기 위해
    localParagraphs: currentParagraphs, // 1. 현재 작성된 단락 목록 2. 글 내용을 관리하기 위해
    internalState: editorInternalState, // 1. 에디터 내부 상태 객체 2. UI 상태를 제어하기 위해
    isMobile: isOnMobileDevice, // 1. 모바일 기기 여부 2. 반응형 UI를 위해

    // 단락 관리 함수들
    addLocalParagraph: createNewParagraph, // 1. 새로운 단락을 생성하는 함수 2. 의미가 명확한 함수명으로 변경
    deleteLocalParagraph: removeParagraph, // 1. 단락을 삭제하는 함수 2. 의미가 명확한 함수명으로 변경
    updateLocalParagraphContent: updateParagraphContent, // 1. 단락 내용을 수정하는 함수 2. 의미가 명확한 함수명으로 변경

    // 선택 및 컨테이너 관리 함수들
    toggleParagraphSelection: toggleParagraphSelect, // 1. 단락 선택을 토글하는 함수 2. 의미가 명확한 함수명으로 변경
    addToLocalContainer: addParagraphsToContainer, // 1. 선택된 단락들을 컨테이너에 추가하는 함수 2. 의미가 명확한 함수명으로 변경
    moveLocalParagraphInContainer: changeParagraphOrder, // 1. 컨테이너 내에서 단락 순서를 변경하는 함수 2. 의미가 명확한 함수명으로 변경

    // 에디터 상태 관리 함수들
    handleStructureComplete: completeStructureSetup, // 1. 구조 설정 완료를 처리하는 함수 2. 의미가 명확한 함수명으로 변경
    goToStructureStep: navigateToStructureStep, // 1. 구조 설정 단계로 이동하는 함수 2. 의미가 명확한 함수명으로 변경
    saveAllToContext: saveCurrentProgress, // 1. 현재 진행상황을 저장하는 함수 2. 의미가 명확한 함수명으로 변경
    completeEditor: finishEditing, // 1. 에디터 작업을 완료하는 함수 2. 의미가 명확한 함수명으로 변경
    activateEditor: setActiveEditor, // 1. 특정 에디터를 활성화하는 함수 2. 의미가 명확한 함수명으로 변경
    togglePreview: switchPreviewMode, // 1. 미리보기 모드를 전환하는 함수 2. 의미가 명확한 함수명으로 변경
    setInternalState: updateEditorState, // 1. 에디터 내부 상태를 업데이트하는 함수 2. 의미가 명확한 함수명으로 변경

    // 데이터 조회 함수들
    getLocalUnassignedParagraphs: getUnassignedParagraphs, // 1. 아직 컨테이너에 할당되지 않은 단락들을 조회하는 함수 2. 의미가 명확한 함수명으로 변경
    getLocalParagraphsByContainer: getParagraphsByContainer, // 1. 특정 컨테이너에 속한 단락들을 조회하는 함수 2. 의미가 명확한 함수명으로 변경
  } = editorState;

  // ✨ [가독성 개선] 내부 상태에서 자주 사용되는 속성들을 별도로 추출
  const {
    currentSubStep: currentEditorStep, // 1. 현재 에디터의 단계 (구조 설정 또는 글 작성) 2. UI 렌더링을 결정하기 위해
    isTransitioning: isStepTransitioning, // 1. 단계 전환 중인지 여부 2. 전환 애니메이션 중 사용자 입력을 차단하기 위해
  } = editorInternalState;

  // 1. 개발 중 디버깅을 위한 상태 로깅 2. 에디터 상태와 사용 가능한 함수들을 확인하기 위해
  console.log('🎛️ [CONTAINER] useEditorState 훅 사용 완료:', {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
    localParagraphs: currentParagraphs.length,
    localContainers: currentContainers.length,
    isMobile: isOnMobileDevice,
    availableFunctions: {
      addLocalParagraph: typeof createNewParagraph,
      deleteLocalParagraph: typeof removeParagraph,
      updateLocalParagraphContent: typeof updateParagraphContent,
      toggleParagraphSelection: typeof toggleParagraphSelect,
      addToLocalContainer: typeof addParagraphsToContainer,
      moveLocalParagraphInContainer: typeof changeParagraphOrder,
      getLocalUnassignedParagraphs: typeof getUnassignedParagraphs,
      getLocalParagraphsByContainer: typeof getParagraphsByContainer,
    },
  });

  // 1. 에디터가 현재 구조 설정 단계인지 확인 2. 올바른 컴포넌트를 렌더링하기 위해
  const isInStructureStep = currentEditorStep === 'structure'; // ✨ [가독성 개선] 조건을 명시적인 변수로 분리

  return (
    <div className="space-y-6">
      {/* 1. 현재 진행 단계를 시각적으로 표시하는 컴포넌트 2. 사용자가 현재 위치를 파악할 수 있도록 하기 위해 */}
      <ProgressSteps currentSubStep={currentEditorStep} />

      {/* 1. 단계 전환 시 부드러운 애니메이션을 제공하는 컨테이너 2. 사용자 경험 향상을 위해 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentEditorStep} // 1. 단계 변경 시 애니메이션 트리거 2. 각 단계마다 다른 애니메이션을 적용하기 위해
          initial={{ opacity: 0, x: 20 }} // 1. 시작 애니메이션 상태 (투명하고 오른쪽에서 시작) 2. 자연스러운 등장 효과를 위해
          animate={{ opacity: 1, x: 0 }} // 1. 완료 애니메이션 상태 (불투명하고 제자리) 2. 최종 위치로 부드럽게 이동하기 위해
          exit={{ opacity: 0, x: -20 }} // 1. 종료 애니메이션 상태 (투명하고 왼쪽으로 이동) 2. 자연스러운 퇴장 효과를 위해
          transition={{ duration: 0.3 }} // 1. 애니메이션 지속 시간 설정 2. 적절한 속도의 전환 효과를 위해
          className={
            isStepTransitioning ? 'pointer-events-none' : '' // 1. 전환 중일 때 사용자 입력 차단 2. 애니메이션 중 UI 충돌을 방지하기 위해
          }
        >
          {isInStructureStep ? (
            // 1. 구조 설정 단계: 섹션 이름을 입력받는 폼 2. 글의 전체 구조를 먼저 설정하기 위해
            <StructureInputForm
              onStructureComplete={completeStructureSetup} // 1. 구조 설정 완료 시 호출될 함수 2. 다음 단계로 진행하기 위해
            />
          ) : (
            // 1. 글 작성 단계: 실제 내용을 작성하는 에디터 2. 설정된 구조에 맞춰 내용을 작성하기 위해
            <WritingStep
              // 데이터 상태 props - 1. 현재 에디터의 데이터 상태들을 전달 2. 자식 컴포넌트에서 데이터를 활용하기 위해
              localContainers={currentContainers}
              localParagraphs={currentParagraphs}
              internalState={editorInternalState}
              // 유틸리티 함수 - 1. 마크다운 렌더링 기능 제공 2. 미리보기 기능을 위해
              renderMarkdown={renderMarkdown}
              // 네비게이션 및 상태 관리 함수들 - 1. 에디터 흐름을 제어하는 함수들 2. 사용자가 에디터를 조작할 수 있도록 하기 위해
              goToStructureStep={navigateToStructureStep}
              saveAllToContext={saveCurrentProgress}
              completeEditor={finishEditing}
              activateEditor={setActiveEditor}
              togglePreview={switchPreviewMode}
              setInternalState={updateEditorState}
              // 단락 관리 함수들 - 1. 단락의 생성, 수정, 삭제를 담당하는 함수들 2. 동적인 글 작성 환경을 제공하기 위해
              addLocalParagraph={createNewParagraph}
              deleteLocalParagraph={removeParagraph}
              updateLocalParagraphContent={updateParagraphContent}
              // 선택 및 컨테이너 관리 함수들 - 1. 단락의 선택과 컨테이너 배치를 담당하는 함수들 2. 모듈화된 글 구성을 위해
              toggleParagraphSelection={toggleParagraphSelect}
              addToLocalContainer={addParagraphsToContainer}
              moveLocalParagraphInContainer={changeParagraphOrder}
              // 데이터 조회 함수들 - 1. 필요한 데이터를 조회하는 함수들 2. 조건에 맞는 단락들을 찾기 위해
              getLocalUnassignedParagraphs={getUnassignedParagraphs}
              getLocalParagraphsByContainer={getParagraphsByContainer}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);
