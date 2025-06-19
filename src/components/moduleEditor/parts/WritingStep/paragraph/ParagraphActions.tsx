// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphActions.tsx

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { Button } from '@heroui/react';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParagraphActionsProps {
  paragraph: LocalParagraph;
  internalState: EditorInternalState;
  sortedContainers?: Container[];
  addToLocalContainer?: () => void;
  setTargetContainerId?: (containerId: string) => void;
  toggleParagraphSelection?: (id: string) => void;
}

// 디버깅 데이터 타입 정의 (useRef로 관리)
interface ActionsDebugData {
  renderCount: number;
  lastRenderReason: string;
  buttonClickCount: number;
  dropdownChangeCount: number;
  callbackTriggerCount: number;
  propsChanges: string[];
  lastRenderTime: number;
  renderDuration: number;
  validationChanges: number;
}

function ParagraphActions({
  paragraph,
  internalState,
  sortedContainers = [],
  addToLocalContainer = () => console.warn('addToLocalContainer not provided'),
  setTargetContainerId = () =>
    console.warn('setTargetContainerId not provided'),
  toggleParagraphSelection = () =>
    console.warn('toggleParagraphSelection not provided'),
}: ParagraphActionsProps) {
  // ✅ 개발 모드에서 항상 디버그 활성화
  const isDebugMode =
    (import.meta as any).env?.DEV || process.env.NODE_ENV === 'development';

  // 🐛 디버깅 패널 상태만 useState로 관리 (렌더링과 무관)
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);

  // 🐛 디버깅 데이터는 useRef로 관리 (리렌더링 유발 안함)
  const debugDataRef = useRef<ActionsDebugData>({
    renderCount: 0,
    lastRenderReason: 'initial',
    buttonClickCount: 0,
    dropdownChangeCount: 0,
    callbackTriggerCount: 0,
    propsChanges: [],
    lastRenderTime: Date.now(),
    renderDuration: 0,
    validationChanges: 0,
  });

  // 디버깅 관련 refs
  const prevPropsRef = useRef<any>(null);
  const renderStartTimeRef = useRef<number>(Date.now());
  const componentIdRef = useRef<string>(`actions-${paragraph.id.slice(-8)}`);
  const lastValidationStateRef = useRef<any>(null);

  // 🔍 렌더링 추적 및 원인 분석 - 의존성 최적화로 무한 렌더링 방지
  const selectedParagraphIdsString = useMemo(
    () => internalState.selectedParagraphIds.join(','),
    [internalState.selectedParagraphIds]
  );

  useEffect(() => {
    const renderEndTime = Date.now();
    const renderDuration = renderEndTime - renderStartTimeRef.current;

    if (isDebugMode) {
      let renderReason = 'unknown';
      const propsChanges: string[] = [];

      // Props 변경 감지 - 안정화된 값들만 사용
      const currentProps = {
        paragraphContentLength: paragraph.content?.length || 0,
        paragraphContainerId: paragraph.containerId,
        selectedIds: selectedParagraphIdsString,
        targetContainerId: internalState.targetContainerId,
        containersLength: sortedContainers.length,
        isTransitioning: internalState.isTransitioning,
      };

      if (prevPropsRef.current) {
        // 타입 안전한 객체 순회
        (Object.keys(currentProps) as Array<keyof typeof currentProps>).forEach(
          (key) => {
            if (prevPropsRef.current[key] !== currentProps[key]) {
              propsChanges.push(
                `${key}: ${prevPropsRef.current[key]} → ${currentProps[key]}`
              );
            }
          }
        );

        if (propsChanges.length > 0) {
          renderReason = `props: ${propsChanges
            .map((c) => c.split(':')[0])
            .join(', ')}`;
        } else {
          renderReason = 'internal state';
        }
      }

      prevPropsRef.current = currentProps;

      // 🚀 useRef로 직접 업데이트 (setState 사용 안함)
      debugDataRef.current = {
        ...debugDataRef.current,
        renderCount: debugDataRef.current.renderCount + 1,
        lastRenderReason: renderReason,
        propsChanges,
        lastRenderTime: renderEndTime,
        renderDuration,
      };

      // ParagraphCard와의 상호작용 로깅 (과도한 로깅 방지)
      if (debugDataRef.current.renderCount <= 5 && renderReason !== 'unknown') {
        console.log(`🔄 [${componentIdRef.current}] RENDER: ${renderReason}`, {
          renderCount: debugDataRef.current.renderCount,
          duration: renderDuration,
          propsChanges: propsChanges.length,
        });
      }

      // 무한 렌더링 경고
      if (debugDataRef.current.renderCount > 20) {
        console.warn(
          `🚨 [${componentIdRef.current}] 무한 렌더링 의심! 렌더링 횟수: ${debugDataRef.current.renderCount}`
        );
      }
    }

    renderStartTimeRef.current = Date.now();
  }, [
    paragraph.content?.length, // 전체 content 대신 length만 추적
    paragraph.containerId,
    selectedParagraphIdsString, // 안정화된 문자열 사용
    internalState.targetContainerId,
    sortedContainers.length,
    internalState.isTransitioning,
    isDebugMode,
  ]);

  // 🎯 메모이제이션된 계산값들 - 안정화된 문자열 사용
  const isSelected = useMemo(
    () =>
      selectedParagraphIdsString
        ? selectedParagraphIdsString.split(',').includes(paragraph.id)
        : false,
    [selectedParagraphIdsString, paragraph.id]
  );

  const targetContainerExists = useMemo(() => {
    return sortedContainers.some(
      (container) => container.id === internalState.targetContainerId
    );
  }, [sortedContainers, internalState.targetContainerId]);

  const selectValue = useMemo(() => {
    if (!isSelected || !targetContainerExists) {
      return '';
    }
    return internalState.targetContainerId;
  }, [isSelected, targetContainerExists, internalState.targetContainerId]);

  // 🚀 최적화된 콘텐츠 검증 로직 (기존 로직 + 디버깅 추가)
  const getContentValidation = useMemo(() => {
    const content = paragraph.content || '';
    const trimmedContent = content.trim();
    const htmlContent = content.replace(/<[^>]*>/g, '').trim();

    const isOnlyHtml = content.length > 0 && htmlContent.length === 0;

    const hasPlaceholder =
      content.includes('여기에 내용을 입력하세요') ||
      content.includes('마크다운을 작성해보세요') ||
      content.includes('텍스트를 입력하세요');

    const hasMedia =
      content.includes('![') ||
      content.includes('](') ||
      content.includes('<img');

    const hasMinimalContent = htmlContent.length > 0 || hasMedia;

    const validation = {
      originalLength: content.length,
      trimmedLength: trimmedContent.length,
      htmlContentLength: htmlContent.length,
      isOnlyHtml,
      hasPlaceholder,
      hasMedia,
      hasMinimalContent,
      isValid: (hasMinimalContent && !hasPlaceholder) || hasMedia,
      isEmpty: content.length === 0 || isOnlyHtml,
    };

    // 검증 상태 변경 추적 (useRef로 직접 업데이트)
    if (isDebugMode && lastValidationStateRef.current) {
      const validationChanged =
        JSON.stringify(lastValidationStateRef.current) !==
        JSON.stringify(validation);
      if (validationChanged) {
        debugDataRef.current.validationChanges += 1;
      }
    }
    lastValidationStateRef.current = validation;

    return validation;
  }, [paragraph.content, isDebugMode]);

  // 🎯 버튼 비활성화 조건 계산 (기존 로직)
  const isButtonDisabled = useMemo(() => {
    const basicRequirements =
      !isSelected || !internalState.targetContainerId || !targetContainerExists;

    if (basicRequirements) return true;

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      return true;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      return true;
    }

    return false;
  }, [
    isSelected,
    internalState.targetContainerId,
    targetContainerExists,
    getContentValidation,
  ]);

  // 🔧 버튼 텍스트 및 색상 계산 (기존 로직)
  const getButtonText = useCallback(() => {
    if (!isSelected) return '단락 선택 필요';
    if (!internalState.targetContainerId) return '컨테이너 선택 필요';
    if (getContentValidation.isEmpty && !getContentValidation.hasMedia)
      return '내용 입력 필요';
    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia)
      return '실제 내용 입력 필요';
    return '컨테이너에 추가';
  }, [isSelected, internalState.targetContainerId, getContentValidation]);

  const getButtonColor = useCallback(() => {
    return isButtonDisabled ? 'default' : 'success';
  }, [isButtonDisabled]);

  // ✅ 컨테이너 선택 핸들러 (기존 로직 + 디버깅 추가)
  const handleContainerSelect = useCallback(
    (containerId: string) => {
      if (isDebugMode) {
        debugDataRef.current.callbackTriggerCount += 1;

        console.log(
          `🎯 [${componentIdRef.current}] CONTAINER_SELECT → 부모 콜백 호출:`,
          {
            containerId,
            paragraphId: paragraph.id.slice(-8),
            callbackCount: debugDataRef.current.callbackTriggerCount,
          }
        );
      }

      setTargetContainerId(containerId);

      if (!isSelected) {
        toggleParagraphSelection(paragraph.id);
        if (isDebugMode) {
          console.log(
            `✅ [${componentIdRef.current}] AUTO_SELECT → 추가 콜백 호출`
          );
        }
      }
    },
    [
      paragraph.id,
      isSelected,
      setTargetContainerId,
      toggleParagraphSelection,
      isDebugMode,
    ]
  );

  // ✅ 컨테이너 추가 핸들러 (기존 로직 + 디버깅 추가)
  const handleAddToContainer = useCallback(() => {
    if (isDebugMode) {
      debugDataRef.current.buttonClickCount += 1;
      debugDataRef.current.callbackTriggerCount += 1;

      console.log(
        `➕ [${componentIdRef.current}] ADD_BUTTON_CLICK → 부모 콜백 호출:`,
        {
          isSelected,
          targetContainerId: internalState.targetContainerId,
          contentValidation: getContentValidation,
          buttonClickCount: debugDataRef.current.buttonClickCount,
        }
      );
    }

    // 조기 반환으로 검증 최적화 (기존 로직)
    if (!isSelected) {
      if (isDebugMode) {
        console.warn(`⚠️ [${componentIdRef.current}] 단락이 선택되지 않음`);
      }
      return;
    }

    if (!internalState.targetContainerId) {
      if (isDebugMode) {
        console.warn(
          `⚠️ [${componentIdRef.current}] 타겟 컨테이너가 선택되지 않음`
        );
      }
      return;
    }

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      if (isDebugMode) {
        console.warn(`⚠️ [${componentIdRef.current}] 내용이 비어있습니다`);
      }
      return;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      if (isDebugMode) {
        console.warn(`⚠️ [${componentIdRef.current}] 플레이스홀더만 있음`);
      }
      return;
    }

    if (isDebugMode) {
      console.log(
        `✅ [${componentIdRef.current}] 모든 검증 통과, 컨테이너에 추가`
      );
    }

    addToLocalContainer();
  }, [
    isSelected,
    internalState.targetContainerId,
    getContentValidation,
    addToLocalContainer,
    isDebugMode,
  ]);

  // ✅ 드롭다운 변경 핸들러 (기존 로직 + 디버깅 추가)
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedContainerId = e.target.value;

      if (isDebugMode) {
        debugDataRef.current.dropdownChangeCount += 1;

        console.log(`📝 [${componentIdRef.current}] DROPDOWN_CHANGE:`, {
          selectedContainerId,
          previousContainerId: internalState.targetContainerId,
          dropdownChangeCount: debugDataRef.current.dropdownChangeCount,
        });
      }

      if (selectedContainerId) {
        handleContainerSelect(selectedContainerId);
      }
    },
    [handleContainerSelect, internalState.targetContainerId, isDebugMode]
  );

  // 🔧 디버그 패널 토글
  const toggleDebugPanel = useCallback(() => {
    setIsDebugPanelOpen((prev) => !prev);
  }, []);

  // 🔧 디버그 로그 (기존 로직, 조건 수정)
  if (isDebugMode && debugDataRef.current.renderCount <= 3) {
    console.log(`🔄 [${componentIdRef.current}] 상태:`, {
      paragraphId: paragraph.id.slice(-8),
      isSelected,
      targetContainerId: internalState.targetContainerId,
      targetContainerExists,
      isButtonDisabled,
      containersCount: sortedContainers.length,
      renderCount: debugDataRef.current.renderCount,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 메인 액션 영역 (기존 로직) */}
      <div className="flex gap-2">
        {/* 컨테이너 선택 드롭다운 */}
        <select
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
          value={selectValue}
          onChange={handleSelectChange}
          aria-label={`단락 ${paragraph.id}를 추가할 컨테이너 선택`}
        >
          <option value="">컨테이너 선택</option>
          {sortedContainers.map((container) => (
            <option key={container.id} value={container.id}>
              {container.name}
            </option>
          ))}
        </select>

        {/* 추가 버튼 */}
        <Button
          type="button"
          color={getButtonColor()}
          size="sm"
          onPress={handleAddToContainer}
          isDisabled={isButtonDisabled}
          aria-label="선택된 단락을 컨테이너에 추가"
          title={
            getContentValidation.isEmpty && !getContentValidation.hasMedia
              ? '단락에 내용을 입력해주세요'
              : !isSelected
              ? '단락을 선택해주세요'
              : !internalState.targetContainerId
              ? '컨테이너를 선택해주세요'
              : getContentValidation.hasPlaceholder &&
                !getContentValidation.hasMedia
              ? '플레이스홀더 대신 실제 내용을 입력해주세요'
              : '컨테이너에 추가'
          }
        >
          {getButtonText()}
        </Button>

        {/* 디버그 버튼 (개발 모드에서 항상 보임) */}
        {isDebugMode && (
          <button
            type="button"
            onClick={toggleDebugPanel}
            className="px-2 py-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
            title="디버깅 정보 표시/숨김"
          >
            🐛
          </button>
        )}
      </div>

      {/* 상태 표시 (기존 로직) */}
      {isButtonDisabled && (
        <div className="flex items-center ml-2 text-xs text-gray-500">
          {getContentValidation.isEmpty && !getContentValidation.hasMedia && (
            <span className="text-orange-600">📝 내용을 입력하세요</span>
          )}
          {!getContentValidation.isEmpty && !isSelected && (
            <span className="text-blue-600">☑️ 단락을 선택하세요</span>
          )}
          {!getContentValidation.isEmpty &&
            isSelected &&
            !internalState.targetContainerId && (
              <span className="text-purple-600">📂 컨테이너를 선택하세요</span>
            )}
          {!getContentValidation.isEmpty &&
            isSelected &&
            internalState.targetContainerId &&
            getContentValidation.hasPlaceholder &&
            !getContentValidation.hasMedia && (
              <span className="text-yellow-600">✏️ 실제 내용을 입력하세요</span>
            )}
        </div>
      )}

      {/* 실시간 렌더링 카운터 (항상 표시) */}
      {isDebugMode && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
          <span>Actions 렌더: {debugDataRef.current.renderCount}회</span>
          <span>•</span>
          <span>콜백: {debugDataRef.current.callbackTriggerCount}회</span>
          {debugDataRef.current.renderCount > 10 && (
            <span className="font-bold text-red-600 animate-pulse">
              ⚠️ 과도한 렌더링!
            </span>
          )}
        </div>
      )}

      {/* 🐛 디버깅 패널 (새로 추가) - 개발 모드에서 항상 표시 */}
      {isDebugMode && isDebugPanelOpen && (
        <div className="p-3 border border-purple-300 rounded-lg bg-purple-50">
          <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-purple-800">
            🐛 Actions 디버깅 (ID: {componentIdRef.current})
            <button
              type="button"
              onClick={toggleDebugPanel}
              className="text-purple-600 hover:text-purple-800"
            >
              ✕
            </button>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <strong>🔍 렌더링 추적:</strong>
              <div>총 렌더링: {debugDataRef.current.renderCount}회</div>
              <div>마지막 원인: {debugDataRef.current.lastRenderReason}</div>
              <div>렌더링 소요: {debugDataRef.current.renderDuration}ms</div>
              <div>검증 변경: {debugDataRef.current.validationChanges}회</div>
            </div>

            <div>
              <strong>🎯 상호작용 추적:</strong>
              <div>버튼 클릭: {debugDataRef.current.buttonClickCount}회</div>
              <div>
                드롭다운 변경: {debugDataRef.current.dropdownChangeCount}회
              </div>
              <div>
                콜백 호출: {debugDataRef.current.callbackTriggerCount}회
              </div>
              <div>현재 상태: {isSelected ? '선택됨' : '미선택'}</div>
            </div>
          </div>

          {debugDataRef.current.propsChanges.length > 0 && (
            <div className="mt-2">
              <strong className="text-xs">📊 Props 변경:</strong>
              <div className="overflow-y-auto text-xs text-gray-600 max-h-20">
                {debugDataRef.current.propsChanges.map((change, index) => (
                  <div key={index}>• {change}</div>
                ))}
              </div>
            </div>
          )}

          <div className="p-2 mt-2 text-xs bg-purple-100 border border-purple-200 rounded">
            <strong>🔗 ParagraphCard 상호작용:</strong>
            <div>
              부모로 전달된 콜백 호출{' '}
              {debugDataRef.current.callbackTriggerCount}회
            </div>
            <div>
              이 컴포넌트 렌더링이 부모 렌더링을{' '}
              {debugDataRef.current.callbackTriggerCount}회 유발함
            </div>
          </div>

          {debugDataRef.current.renderCount > 15 && (
            <div className="p-2 mt-2 text-xs text-red-700 bg-red-100 border border-red-300 rounded">
              🚨 <strong>과도한 렌더링!</strong> Actions 컴포넌트가{' '}
              {debugDataRef.current.renderCount}회 렌더링됨
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ParagraphActions);
