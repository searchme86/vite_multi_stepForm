import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Chip,
  Badge,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
//====여기부터 수정됨====
// ✅ 수정: 올바른 CSS import 방식 적용
// 이유: 최신 버전의 @uiw/react-md-editor에서 CSS 경로가 변경됨
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
// ❌ 제거: 존재하지 않는 CSS 파일 제거
// import '@uiw/react-md-editor/markdown.css';
//====여기까지 수정됨====
import {
  useMultiStepForm,
  Container,
  ParagraphBlock,
  createContainer,
  createParagraphBlock,
  sortContainers,
  getParagraphsByContainer,
  getUnassignedParagraphs,
  generateCompletedContent,
  validateEditorState,
} from './useMultiStepForm';

// ====서브스텝 타입 정의====
type SubStep = 'structure' | 'writing';

// ====내부 상태 인터페이스====
interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;

  // 서브스텝 1 관련
  containerInputs: string[];
  isStructureValid: boolean;

  // 서브스텝 2 관련
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

function ModularBlogEditor(): React.ReactNode {
  // ====Context에서 상태 가져오기====
  const context = useMultiStepForm();

  if (!context) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">
          에디터를 사용하려면 MultiStepForm Context가 필요합니다.
        </p>
      </div>
    );
  }

  const {
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
  } = context;

  // ====내부 상태 관리====
  const [internalState, setInternalState] = useState<EditorInternalState>({
    currentSubStep: 'structure',
    isTransitioning: false,
    containerInputs: ['글 요약', '목차', '서론', '본론'], // 기본값
    isStructureValid: true,
    activeParagraphId: null,
    isPreviewOpen: true,
    selectedParagraphIds: [],
    targetContainerId: '',
  });

  // ====모바일 감지====
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ====서브스텝 1: 구조 설계 관련 함수들====

  // 구조 유효성 검사
  const validateStructure = useCallback(() => {
    const validInputs = internalState.containerInputs.filter(
      (input) => input.trim().length > 0
    );
    const isValid = validInputs.length >= 2;

    setInternalState((prev) => ({
      ...prev,
      isStructureValid: isValid,
    }));

    return isValid;
  }, [internalState.containerInputs]);

  // 컨테이너 인풋 업데이트
  const updateContainerInput = useCallback((index: number, value: string) => {
    setInternalState((prev) => ({
      ...prev,
      containerInputs: prev.containerInputs.map((input, i) =>
        i === index ? value : input
      ),
    }));
  }, []);

  // 컨테이너 인풋 추가
  const addContainerInput = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      containerInputs: [...prev.containerInputs, ''],
    }));
  }, []);

  // 마지막 컨테이너 인풋 삭제
  const removeLastContainerInput = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      containerInputs:
        prev.containerInputs.length > 2
          ? prev.containerInputs.slice(0, -1)
          : prev.containerInputs,
    }));
  }, []);

  // 서브스텝 2로 전환
  const goToWritingStep = useCallback(() => {
    if (!validateStructure()) {
      addToast({
        title: '구조 설정 오류',
        description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
        color: 'warning',
      });
      return;
    }

    setInternalState((prev) => ({ ...prev, isTransitioning: true }));

    // 컨테이너 생성
    const validInputs = internalState.containerInputs.filter(
      (input) => input.trim().length > 0
    );
    const containers = validInputs.map((name, index) =>
      createContainer(name, index)
    );
    updateEditorContainers(containers);

    setTimeout(() => {
      setInternalState((prev) => ({
        ...prev,
        currentSubStep: 'writing',
        isTransitioning: false,
      }));
    }, 300);

    addToast({
      title: '구조 설정 완료',
      description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
      color: 'success',
    });
  }, [
    internalState.containerInputs,
    validateStructure,
    updateEditorContainers,
    addToast,
  ]);

  // 서브스텝 1로 돌아가기
  const goToStructureStep = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setInternalState((prev) => ({
        ...prev,
        currentSubStep: 'structure',
        isTransitioning: false,
      }));
    }, 300);
  }, []);

  // ====서브스텝 2: 글 작성 관련 함수들====

  // 새 단락 추가
  const addParagraph = useCallback(() => {
    const newParagraph = createParagraphBlock('');
    const updatedParagraphs = [...editorState.paragraphs, newParagraph];
    updateEditorParagraphs(updatedParagraphs);

    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: newParagraph.id,
    }));
  }, [editorState.paragraphs, updateEditorParagraphs]);

  // 단락 내용 업데이트
  const updateParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      const updatedParagraphs = editorState.paragraphs.map((p) =>
        p.id === paragraphId ? { ...p, content, updatedAt: new Date() } : p
      );
      updateEditorParagraphs(updatedParagraphs);
    },
    [editorState.paragraphs, updateEditorParagraphs]
  );

  // 단락 삭제
  const deleteParagraph = useCallback(
    (paragraphId: string) => {
      const updatedParagraphs = editorState.paragraphs.filter(
        (p) => p.id !== paragraphId
      );
      updateEditorParagraphs(updatedParagraphs);

      addToast({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    },
    [editorState.paragraphs, updateEditorParagraphs, addToast]
  );

  // 체크박스 선택 토글
  const toggleParagraphSelection = useCallback((paragraphId: string) => {
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
        ? prev.selectedParagraphIds.filter((id) => id !== paragraphId)
        : [...prev.selectedParagraphIds, paragraphId],
    }));
  }, []);

  // 컨테이너에 단락 추가
  const addToContainer = useCallback(() => {
    if (internalState.selectedParagraphIds.length === 0) {
      addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!internalState.targetContainerId) {
      addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    // 기존 컨테이너의 마지막 순서 찾기
    const existingParagraphs = getParagraphsByContainer(
      editorState.paragraphs,
      internalState.targetContainerId
    );
    const lastOrder =
      existingParagraphs.length > 0
        ? Math.max(...existingParagraphs.map((p) => p.order))
        : -1;

    const updatedParagraphs = editorState.paragraphs.map((p) => {
      if (internalState.selectedParagraphIds.includes(p.id)) {
        const newOrder =
          lastOrder + internalState.selectedParagraphIds.indexOf(p.id) + 1;
        return {
          ...p,
          containerId: internalState.targetContainerId,
          order: newOrder,
          updatedAt: new Date(),
        };
      }
      return p;
    });

    updateEditorParagraphs(updatedParagraphs);

    // 선택 초기화
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: [],
    }));

    addToast({
      title: '단락 추가 완료',
      description: `${internalState.selectedParagraphIds.length}개의 단락이 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  }, [
    internalState.selectedParagraphIds,
    internalState.targetContainerId,
    editorState.paragraphs,
    updateEditorParagraphs,
    addToast,
  ]);

  // 컨테이너 내 단락 순서 변경
  const moveParagraphInContainer = useCallback(
    (paragraphId: string, direction: 'up' | 'down') => {
      const paragraph = editorState.paragraphs.find(
        (p) => p.id === paragraphId
      );
      if (!paragraph || !paragraph.containerId) return;

      const containerParagraphs = getParagraphsByContainer(
        editorState.paragraphs,
        paragraph.containerId
      );
      const currentIndex = containerParagraphs.findIndex(
        (p) => p.id === paragraphId
      );

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' &&
          currentIndex === containerParagraphs.length - 1)
      ) {
        return;
      }

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetParagraph = containerParagraphs[targetIndex];

      const updatedParagraphs = editorState.paragraphs.map((p) => {
        if (p.id === paragraphId) {
          return { ...p, order: targetParagraph.order };
        }
        if (p.id === targetParagraph.id) {
          return { ...p, order: paragraph.order };
        }
        return p;
      });

      updateEditorParagraphs(updatedParagraphs);
    },
    [editorState.paragraphs, updateEditorParagraphs]
  );

  // 양방향 연동: 미리보기에서 에디터 활성화
  const activateEditor = useCallback((paragraphId: string) => {
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: paragraphId,
    }));

    // 해당 단락으로 스크롤
    setTimeout(() => {
      const element = document.querySelector(
        `[data-paragraph-id="${paragraphId}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // 미리보기 토글
  const togglePreview = useCallback(() => {
    setInternalState((prev) => ({
      ...prev,
      isPreviewOpen: !prev.isPreviewOpen,
    }));
  }, []);

  // 에디터 완성
  const completeEditor = useCallback(() => {
    const completedContent = generateCompletedContent(
      editorState.containers,
      editorState.paragraphs
    );

    if (!validateEditorState({ ...editorState, completedContent })) {
      addToast({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너와 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    updateEditorCompletedContent(completedContent);
    setEditorCompleted(true);

    addToast({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }, [editorState, updateEditorCompletedContent, setEditorCompleted, addToast]);

  // ====렌더링 유틸리티 함수들====

  // 마크다운 렌더링
  const renderMarkdown = useCallback((text: string) => {
    if (!text) return <p className="text-gray-400">내용이 없습니다.</p>;

    let formatted = text
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mb-3">$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mb-2">$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />');

    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  }, []);

  // ====컴포넌트 렌더링====

  // 서브스텝 1: 구조 설계
  const StructureDesignStep = useCallback(
    () => (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            🏗️ 글 구조를 설계해주세요
          </h2>
          <p className="text-gray-600">
            어떤 순서와 구조로 글을 작성하고 싶으신가요? 각 섹션의 이름을
            입력해주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
          {internalState.containerInputs.map((input, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                섹션 {index + 1}
              </label>
              <Input
                value={input}
                onChange={(e) => updateContainerInput(index, e.target.value)}
                placeholder={`섹션 ${index + 1} 이름을 입력하세요`}
                className="w-full"
                variant="bordered"
              />
            </div>
          ))}
        </div>

        {/* 구조 미리보기 */}
        <div className="p-6 rounded-lg bg-gray-50">
          <h3 className="mb-4 text-lg font-semibold">
            📋 생성될 구조 미리보기
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {internalState.containerInputs
              .filter((input) => input.trim().length > 0)
              .map((input, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <Icon icon="lucide:arrow-right" className="text-gray-400" />
                  )}
                  <Chip color="primary" variant="flat">
                    {input.trim()}
                  </Chip>
                </React.Fragment>
              ))}
          </div>
          {internalState.containerInputs.filter(
            (input) => input.trim().length > 0
          ).length < 2 && (
            <p className="mt-3 text-sm text-amber-600">
              ⚠️ 최소 2개 이상의 섹션이 필요합니다.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button
              color="default"
              variant="flat"
              onPress={addContainerInput}
              startContent={<Icon icon="lucide:plus" />}
            >
              섹션 추가
            </Button>
            <Button
              color="danger"
              variant="flat"
              onPress={removeLastContainerInput}
              isDisabled={internalState.containerInputs.length <= 2}
              startContent={<Icon icon="lucide:minus" />}
            >
              마지막 섹션 삭제
            </Button>
          </div>

          <Button
            color="primary"
            onPress={goToWritingStep}
            isDisabled={!internalState.isStructureValid}
            endContent={<Icon icon="lucide:arrow-right" />}
          >
            다음: 글 작성하기
          </Button>
        </div>
      </div>
    ),
    [
      internalState.containerInputs,
      internalState.isStructureValid,
      updateContainerInput,
      addContainerInput,
      removeLastContainerInput,
      goToWritingStep,
    ]
  );

  // 서브스텝 2: 글 작성
  const WritingStep = useCallback(() => {
    const unassignedParagraphs = getUnassignedParagraphs(
      editorState.paragraphs
    );
    const sortedContainers = sortContainers(editorState.containers);

    return (
      <div className="space-y-4">
        {/* 상단 컨트롤 */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              color="default"
              variant="flat"
              onPress={goToStructureStep}
              startContent={<Icon icon="lucide:arrow-left" />}
            >
              구조 수정
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>구조:</span>
              {sortedContainers.map((container, index) => (
                <React.Fragment key={container.id}>
                  {index > 0 && (
                    <Icon icon="lucide:arrow-right" className="text-gray-400" />
                  )}
                  <Badge color="primary" variant="flat">
                    {container.name}
                  </Badge>
                </React.Fragment>
              ))}
            </div>

            <Button
              color="success"
              onPress={completeEditor}
              endContent={<Icon icon="lucide:check" />}
            >
              완성
            </Button>
          </div>
        </div>

        {/* 메인 작업 영역 */}
        <div
          className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}
          style={{ height: '60vh' }}
        >
          {/* 1번 영역: 단락 작성 */}
          <div
            className={`${
              isMobile ? 'w-full' : 'flex-1'
            } border border-gray-200 rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📝 단락 작성</h3>
              <Button
                color="primary"
                size="sm"
                onPress={addParagraph}
                startContent={<Icon icon="lucide:plus" />}
              >
                새 단락
              </Button>
            </div>

            <div className="h-full space-y-4 overflow-y-auto">
              {unassignedParagraphs.map((paragraph) => (
                <div
                  key={paragraph.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    internalState.activeParagraphId === paragraph.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-2"
                      checked={internalState.selectedParagraphIds.includes(
                        paragraph.id
                      )}
                      onChange={() => toggleParagraphSelection(paragraph.id)}
                    />

                    <div className="flex-1">
                      <div data-paragraph-id={paragraph.id} className="mb-3">
                        <MDEditor
                          value={paragraph.content}
                          onChange={(value) =>
                            updateParagraphContent(paragraph.id, value || '')
                          }
                          height={120}
                          preview="edit"
                          hideToolbar={false}
                          visibleDragBar={false}
                        />
                      </div>

                      <div className="flex gap-2">
                        <select
                          className="px-3 py-1 text-sm border border-gray-300 rounded"
                          value={internalState.targetContainerId}
                          onChange={(e) =>
                            setInternalState((prev) => ({
                              ...prev,
                              targetContainerId: e.target.value,
                            }))
                          }
                        >
                          <option value="">컨테이너 선택</option>
                          {sortedContainers.map((container) => (
                            <option key={container.id} value={container.id}>
                              {container.name}
                            </option>
                          ))}
                        </select>

                        <Button
                          color="success"
                          size="sm"
                          onPress={addToContainer}
                          isDisabled={
                            !internalState.selectedParagraphIds.includes(
                              paragraph.id
                            ) || !internalState.targetContainerId
                          }
                        >
                          추가
                        </Button>
                      </div>
                    </div>

                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      size="sm"
                      onPress={() => deleteParagraph(paragraph.id)}
                    >
                      <Icon icon="lucide:trash-2" />
                    </Button>
                  </div>
                </div>
              ))}

              {unassignedParagraphs.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <Icon
                    icon="lucide:file-text"
                    className="mx-auto mb-2 text-4xl"
                  />
                  <p>작성된 단락이 없습니다.</p>
                  <p className="text-sm">
                    새 단락 버튼을 눌러 글 작성을 시작하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2번 영역: 컨테이너 관리 */}
          <div
            className={`${
              isMobile ? 'w-full' : 'flex-1'
            } border border-gray-200 rounded-lg p-4`}
          >
            <h3 className="mb-4 text-lg font-semibold">📦 컨테이너 관리</h3>

            <div className="h-full space-y-4 overflow-y-auto">
              {sortedContainers.map((container) => {
                const containerParagraphs = getParagraphsByContainer(
                  editorState.paragraphs,
                  container.id
                );

                return (
                  <div
                    key={container.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      containerParagraphs.length > 0
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {container.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        현재 영역은 {container.name}을 작성할 공간입니다
                      </span>
                    </div>

                    <div className="space-y-2">
                      {containerParagraphs.map((paragraph) => (
                        <div
                          key={paragraph.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
                        >
                          <span className="flex-1 text-sm text-gray-700 truncate">
                            {paragraph.content.slice(0, 50) || '내용 없음'}...
                          </span>

                          <div className="flex gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() =>
                                moveParagraphInContainer(paragraph.id, 'up')
                              }
                            >
                              <Icon icon="lucide:chevron-up" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() =>
                                moveParagraphInContainer(paragraph.id, 'down')
                              }
                            >
                              <Icon icon="lucide:chevron-down" />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="primary"
                              onPress={() => activateEditor(paragraph.id)}
                            >
                              <Icon icon="lucide:edit" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {containerParagraphs.length === 0 && (
                        <div className="py-4 text-sm text-center text-gray-400">
                          아직 추가된 단락이 없습니다
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3번 영역: 실시간 미리보기 */}
        <div
          className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-400 ${
            internalState.isPreviewOpen ? 'max-h-96' : 'max-h-12'
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold">👁️ 실시간 미리보기</h3>
            <Button
              size="sm"
              variant="flat"
              onPress={togglePreview}
              startContent={
                <Icon
                  icon={
                    internalState.isPreviewOpen
                      ? 'lucide:chevron-up'
                      : 'lucide:chevron-down'
                  }
                />
              }
            >
              {internalState.isPreviewOpen ? '접기' : '펼치기'}
            </Button>
          </div>

          {internalState.isPreviewOpen && (
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="max-w-4xl mx-auto space-y-6">
                {sortedContainers.map((container) => {
                  const containerParagraphs = getParagraphsByContainer(
                    editorState.paragraphs,
                    container.id
                  );

                  if (containerParagraphs.length === 0) return null;

                  return (
                    <div
                      key={container.id}
                      className="pl-4 border-l-4 border-blue-200"
                    >
                      <div className="mb-2 text-xs font-medium text-blue-600 uppercase">
                        {container.name}
                      </div>

                      {containerParagraphs.map((paragraph) => (
                        <div
                          key={paragraph.id}
                          data-source-id={paragraph.id}
                          className="p-3 mb-3 transition-colors rounded cursor-pointer hover:bg-blue-50"
                          onClick={() => activateEditor(paragraph.id)}
                        >
                          {renderMarkdown(paragraph.content)}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {sortedContainers.every(
                  (container) =>
                    getParagraphsByContainer(
                      editorState.paragraphs,
                      container.id
                    ).length === 0
                ) && (
                  <div className="py-8 text-center text-gray-400">
                    <Icon icon="lucide:eye" className="mx-auto mb-2 text-4xl" />
                    <p>아직 작성된 내용이 없습니다.</p>
                    <p className="text-sm">
                      단락을 작성하고 컨테이너에 추가하면 미리보기가 표시됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [
    editorState,
    internalState,
    isMobile,
    sortContainers,
    getUnassignedParagraphs,
    getParagraphsByContainer,
    goToStructureStep,
    completeEditor,
    addParagraph,
    toggleParagraphSelection,
    addToContainer,
    updateParagraphContent,
    deleteParagraph,
    moveParagraphInContainer,
    activateEditor,
    togglePreview,
    renderMarkdown,
  ]);

  // 구조 유효성 실시간 체크
  useEffect(() => {
    validateStructure();
  }, [internalState.containerInputs, validateStructure]);

  return (
    <div className="space-y-6">
      {/* 진행 상태 표시 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              internalState.currentSubStep === 'structure'
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            1
          </div>
          <span
            className={`text-sm font-medium ${
              internalState.currentSubStep === 'structure'
                ? 'text-gray-900'
                : 'text-green-600'
            }`}
          >
            구조 설계
          </span>
        </div>

        <div className="w-8 h-1 bg-gray-300 rounded">
          <div
            className={`h-full rounded transition-all duration-500 ${
              internalState.currentSubStep === 'writing'
                ? 'w-full bg-blue-500'
                : 'w-0'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              internalState.currentSubStep === 'writing'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            2
          </div>
          <span
            className={`text-sm font-medium ${
              internalState.currentSubStep === 'writing'
                ? 'text-gray-900'
                : 'text-gray-400'
            }`}
          >
            글 작성
          </span>
        </div>
      </div>

      {/* 서브스텝 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={internalState.currentSubStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={internalState.isTransitioning ? 'pointer-events-none' : ''}
        >
          {internalState.currentSubStep === 'structure' ? (
            <StructureDesignStep />
          ) : (
            <WritingStep />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ModularBlogEditor;
