// blogMediaStep/imageGallery/parts/viewBuilder/ViewModeSelector.tsx

import React from 'react';
import { ButtonGroup, Button, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ViewModeSelectorProps {
  currentMode: 'all' | 'selected';
  totalImageCount: number;
  selectedImageCount: number;
  onModeChange: (mode: 'all' | 'selected') => void;
  isDisabled?: boolean;
}

function ViewModeSelector({
  currentMode,
  totalImageCount,
  selectedImageCount,
  onModeChange,
  isDisabled = false,
}: ViewModeSelectorProps): React.ReactNode {
  console.log('🔧 ViewModeSelector 렌더링:', {
    currentMode,
    totalImageCount,
    selectedImageCount,
    isDisabled,
  });

  const handleAllModeClick = () => {
    console.log('🔧 handleAllModeClick 호출');

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 클릭 시도');
      return;
    }

    onModeChange('all');
    console.log('✅ 전체 모드로 변경 완료');
  };

  const handleSelectedModeClick = () => {
    console.log('🔧 handleSelectedModeClick 호출');

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 클릭 시도');
      return;
    }

    onModeChange('selected');
    console.log('✅ 선택 모드로 변경 완료');
  };

  const handleKeyboardInteraction = (
    keyboardEvent: React.KeyboardEvent,
    targetMode: 'all' | 'selected'
  ) => {
    console.log('🔧 handleKeyboardInteraction 호출:', { targetMode });

    const { key: pressedKey } = keyboardEvent;

    const isActivationKey = pressedKey === 'Enter' || pressedKey === ' ';
    if (!isActivationKey) {
      return;
    }

    keyboardEvent.preventDefault();

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 키보드 활성화 시도');
      return;
    }

    onModeChange(targetMode);
    console.log('✅ 키보드로 모드 변경 완료:', { targetMode });
  };

  const getAllModeDisplayText = (): string => {
    const baseText = '전체 이미지';
    return totalImageCount > 0
      ? `${baseText} (${totalImageCount}개)`
      : baseText;
  };

  const getSelectedModeDisplayText = (): string => {
    const baseText = '선택 이미지';
    return selectedImageCount > 0
      ? `${baseText} (${selectedImageCount}개)`
      : baseText;
  };

  const shouldShowSelectedChip = (): boolean => {
    return selectedImageCount > 0 && currentMode === 'selected';
  };

  const shouldShowTotalChip = (): boolean => {
    return totalImageCount > 0 && currentMode === 'all';
  };

  const allModeDisplayText = getAllModeDisplayText();
  const selectedModeDisplayText = getSelectedModeDisplayText();
  const showSelectedChip = shouldShowSelectedChip();
  const showTotalChip = shouldShowTotalChip();

  console.log('📊 ViewModeSelector 상태:', {
    allModeDisplayText,
    selectedModeDisplayText,
    showSelectedChip,
    showTotalChip,
  });

  return (
    <section
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      role="region"
      aria-labelledby="view-mode-selector-title"
    >
      <div className="flex flex-col gap-2">
        <h3
          id="view-mode-selector-title"
          className="text-lg font-semibold text-default-900"
          role="heading"
          aria-level={3}
        >
          갤러리 뷰 모드 선택
        </h3>

        <p
          className="text-sm text-default-600"
          id="view-mode-description"
          role="text"
        >
          전체 이미지로 자동 갤러리를 만들거나, 개별 이미지를 선택하여 커스텀
          갤러리를 만들 수 있습니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ButtonGroup
          isDisabled={isDisabled}
          role="radiogroup"
          aria-labelledby="view-mode-selector-title"
          aria-describedby="view-mode-description"
        >
          <Button
            size="md"
            variant={currentMode === 'all' ? 'solid' : 'flat'}
            color={currentMode === 'all' ? 'primary' : 'default'}
            startContent={
              <Icon
                icon="lucide:images"
                className="text-base"
                aria-hidden="true"
                role="presentation"
              />
            }
            onPress={handleAllModeClick}
            type="button"
            isDisabled={isDisabled}
            aria-label={`전체 이미지 모드, ${totalImageCount}개 이미지 사용 가능`}
            aria-pressed={currentMode === 'all'}
            role="radio"
            tabIndex={0}
            onKeyDown={(keyboardEvent) =>
              handleKeyboardInteraction(keyboardEvent, 'all')
            }
          >
            {allModeDisplayText}
          </Button>

          <Button
            size="md"
            variant={currentMode === 'selected' ? 'solid' : 'flat'}
            color={currentMode === 'selected' ? 'secondary' : 'default'}
            startContent={
              <Icon
                icon="lucide:check-square"
                className="text-base"
                aria-hidden="true"
                role="presentation"
              />
            }
            onPress={handleSelectedModeClick}
            type="button"
            isDisabled={isDisabled}
            aria-label={`선택 이미지 모드, ${selectedImageCount}개 이미지 선택됨`}
            aria-pressed={currentMode === 'selected'}
            role="radio"
            tabIndex={0}
            onKeyDown={(keyboardEvent) =>
              handleKeyboardInteraction(keyboardEvent, 'selected')
            }
          >
            {selectedModeDisplayText}
          </Button>
        </ButtonGroup>

        <div
          className="flex flex-wrap items-center gap-2"
          role="status"
          aria-live="polite"
          aria-label="현재 모드 상태 정보"
        >
          {showTotalChip ? (
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              startContent={
                <Icon
                  icon="lucide:image"
                  className="text-xs"
                  aria-hidden="true"
                />
              }
              aria-label={`전체 모드 활성화, ${totalImageCount}개 이미지`}
            >
              전체 {totalImageCount}개
            </Chip>
          ) : null}

          {showSelectedChip ? (
            <Chip
              size="sm"
              variant="flat"
              color="secondary"
              startContent={
                <Icon
                  icon="lucide:check"
                  className="text-xs"
                  aria-hidden="true"
                />
              }
              aria-label={`선택 모드 활성화, ${selectedImageCount}개 이미지 선택됨`}
            >
              선택 {selectedImageCount}개
            </Chip>
          ) : null}

          {currentMode === 'selected' && selectedImageCount === 0 ? (
            <Chip
              size="sm"
              variant="flat"
              color="warning"
              startContent={
                <Icon
                  icon="lucide:alert-circle"
                  className="text-xs"
                  aria-hidden="true"
                />
              }
              aria-label="선택된 이미지가 없음"
            >
              이미지를 선택해주세요
            </Chip>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ViewModeSelector;
