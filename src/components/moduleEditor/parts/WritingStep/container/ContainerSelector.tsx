// 📁 components/moduleEditor/parts/WritingStep/sidebar/slides/ContainerSelector.tsx

import React, { useCallback, useMemo } from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type {
  Container,
  ContainerSelectOption,
} from '../../../../../store/shared/commonTypes.ts';
import {
  CONTAINER_MOVE_CONFIG,
  // CONTAINER_MOVE_MESSAGES, // ✅ 사용하지 않는 import 제거
  CONTAINER_SELECTOR_STYLES,
} from '../../../utils/containerMoveConfig.ts';

interface ContainerSelectorProps {
  // 현재 단락이 속한 컨테이너 ID (null이면 미할당)
  currentContainerId: string | null;
  // 선택 가능한 전체 컨테이너 목록
  availableContainers: Container[];
  // 컨테이너 이동 콜백 함수
  onContainerMove: (targetContainerId: string) => void;
  // 비활성화 여부
  disabled?: boolean;
  // 추가 CSS 클래스
  className?: string;
}

/**
 * 🔄 ContainerSelector 컴포넌트
 *
 * 단락을 다른 컨테이너로 이동하기 위한 셀렉트 박스 컴포넌트입니다.
 * 현재 컨테이너는 비활성화되고, 다른 컨테이너들은 선택 가능합니다.
 *
 * @param currentContainerId - 현재 단락이 속한 컨테이너 ID
 * @param availableContainers - 선택 가능한 컨테이너 목록
 * @param onContainerMove - 컨테이너 이동 시 호출되는 함수
 * @param disabled - 셀렉터 비활성화 여부
 * @param className - 추가 CSS 클래스
 */
function ContainerSelector({
  currentContainerId,
  availableContainers,
  onContainerMove,
  disabled = false,
  className = '',
}: ContainerSelectorProps) {
  // 🔍 입력값 검증 및 안전한 기본값 설정
  const validCurrentContainerId =
    currentContainerId === null
      ? null
      : typeof currentContainerId === 'string'
      ? currentContainerId
      : null;
  const validAvailableContainers = Array.isArray(availableContainers)
    ? availableContainers
    : [];
  const validDisabled = typeof disabled === 'boolean' ? disabled : false;
  const validClassName = typeof className === 'string' ? className : '';

  console.log('🔄 [CONTAINER_SELECTOR] 렌더링:', {
    currentContainerId: validCurrentContainerId,
    availableContainersCount: validAvailableContainers.length,
    disabled: validDisabled,
  });

  // 🎯 현재 컨테이너 정보 조회
  const currentContainer = useMemo(() => {
    if (validCurrentContainerId === null) {
      return null;
    }

    const foundContainer = validAvailableContainers.find(
      (container) => container && container.id === validCurrentContainerId
    );

    return foundContainer || null;
  }, [validCurrentContainerId, validAvailableContainers]);

  // 🎯 셀렉트 옵션 생성
  const containerOptions = useMemo((): ContainerSelectOption[] => {
    const options: ContainerSelectOption[] = validAvailableContainers.map(
      (container) => {
        const isCurrentContainer = container.id === validCurrentContainerId;

        return {
          value: container.id,
          label: container.name,
          disabled: isCurrentContainer, // 현재 컨테이너는 선택 불가
          description: isCurrentContainer
            ? CONTAINER_MOVE_CONFIG.CURRENT_CONTAINER_LABEL
            : undefined,
        };
      }
    );

    console.log('📋 [CONTAINER_SELECTOR] 옵션 생성:', {
      totalOptions: options.length,
      disabledOptions: options.filter((opt) => opt.disabled).length,
    });

    return options;
  }, [validAvailableContainers, validCurrentContainerId]);

  // 🎯 현재 컨테이너 표시 라벨
  const currentContainerLabel = useMemo(() => {
    if (currentContainer) {
      return currentContainer.name;
    }

    return CONTAINER_MOVE_CONFIG.UNASSIGNED_LABEL;
  }, [currentContainer]);

  // 🔄 컨테이너 이동 처리
  const handleContainerSelect = useCallback(
    (selectedContainerId: string) => {
      const validSelectedId =
        typeof selectedContainerId === 'string' ? selectedContainerId : '';

      console.log('🎯 [CONTAINER_SELECTOR] 컨테이너 선택:', {
        selectedId: validSelectedId,
        currentId: validCurrentContainerId,
      });

      // 동일한 컨테이너 선택 시 무시
      if (validSelectedId === validCurrentContainerId) {
        console.warn('⚠️ [CONTAINER_SELECTOR] 동일한 컨테이너 선택 무시');
        return;
      }

      // 빈 ID 선택 시 무시
      if (!validSelectedId.trim()) {
        console.warn('⚠️ [CONTAINER_SELECTOR] 빈 컨테이너 ID 무시');
        return;
      }

      // 컨테이너 존재 여부 확인
      const targetContainerExists = validAvailableContainers.some(
        (container) => container && container.id === validSelectedId
      );

      if (!targetContainerExists) {
        console.error(
          '❌ [CONTAINER_SELECTOR] 대상 컨테이너가 존재하지 않음:',
          validSelectedId
        );
        return;
      }

      // 이동 함수 호출
      if (typeof onContainerMove === 'function') {
        try {
          console.log('📞 [CONTAINER_SELECTOR] 이동 함수 호출');
          onContainerMove(validSelectedId);
        } catch (error) {
          console.error('❌ [CONTAINER_SELECTOR] 이동 함수 호출 실패:', error);
        }
      } else {
        console.error('❌ [CONTAINER_SELECTOR] 이동 함수가 제공되지 않음');
      }
    },
    [validCurrentContainerId, validAvailableContainers, onContainerMove]
  );

  // 🎯 선택 가능한 옵션이 있는지 확인
  const hasSelectableOptions = useMemo(() => {
    return containerOptions.some((option) => !option.disabled);
  }, [containerOptions]);

  // 🎯 셀렉터 비활성화 조건
  const isSelectorDisabled = useMemo(() => {
    return (
      validDisabled ||
      !hasSelectableOptions ||
      validAvailableContainers.length <= 1
    );
  }, [validDisabled, hasSelectableOptions, validAvailableContainers.length]);

  return (
    <div className={`flex items-center ${validClassName}`}>
      <Dropdown
        placement={CONTAINER_SELECTOR_STYLES.placement}
        isDisabled={isSelectorDisabled}
      >
        <DropdownTrigger>
          <Button
            type="button"
            size={CONTAINER_SELECTOR_STYLES.size}
            variant={CONTAINER_SELECTOR_STYLES.variant}
            color={CONTAINER_SELECTOR_STYLES.color}
            className={`${CONTAINER_SELECTOR_STYLES.width} justify-between text-xs`}
            isDisabled={isSelectorDisabled}
            endContent={<Icon icon="lucide:chevron-down" className="text-xs" />}
            aria-label="컨테이너 선택"
          >
            <span className="truncate">{currentContainerLabel}</span>
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="컨테이너 목록"
          onAction={(key) => handleContainerSelect(String(key))}
          disallowEmptySelection
        >
          {containerOptions.map((option) => (
            <DropdownItem
              key={option.value}
              isDisabled={option.disabled}
              className={option.disabled ? 'opacity-50' : ''}
              startContent={
                <Icon
                  icon={
                    option.disabled ? 'lucide:check-circle' : 'lucide:folder'
                  }
                  className="text-sm"
                />
              }
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-gray-500">
                    {option.description}
                  </span>
                )}
              </div>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}

export default React.memo(ContainerSelector);

/**
 * 🔧 ContainerSelector 수정 사항:
 *
 * 1. ✅ 사용하지 않는 import 제거
 *    - CONTAINER_MOVE_MESSAGES import 제거
 *    - TS6133 경고 해결
 *    - 코드 품질 개선
 *
 * 2. 🔄 기능 유지
 *    - 모든 기존 기능 완전 보존
 *    - 컨테이너 이동 로직 그대로 유지
 *    - 사용자 경험 변화 없음
 *
 * 3. 📝 주석 정리
 *    - 필요한 import만 명시
 *    - 코드 의도 명확화
 *    - 향후 유지보수성 향상
 *
 * 4. 🎯 최적화 효과
 *    - 번들 크기 미세 감소
 *    - 컴파일 경고 제거
 *    - 린터 규칙 준수
 */
