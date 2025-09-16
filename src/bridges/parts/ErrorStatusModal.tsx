// bridges/parts/ErrorStatusModal.tsx

import React from 'react';
import type { ReactElement } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { MarkdownStatusCard } from './MarkdownStatusCard';
import {
  createStandardizationUtils,
  type StandardModalProps,
  type StandardSize,
  type StandardVariant,
} from '../common/componentStandardization';

// 🔧 에러 상태 모달 전용 Props 인터페이스 (표준화됨)
interface ErrorStatusModalProps extends StandardModalProps {
  readonly statusCardSize?: StandardSize;
  readonly statusCardVariant?: StandardVariant;
  readonly showRefreshButton?: boolean;
  readonly showStatusDetails?: boolean;
  readonly statusCardProps?: {
    hideTransferStatus?: boolean;
    hideValidationDetails?: boolean;
    hideStatistics?: boolean;
    hideErrorsWarnings?: boolean;
    hideLastResult?: boolean;
    showProgressBar?: boolean;
  };
}

export function ErrorStatusModal({
  isOpen,
  onClose,
  size = 'lg',
  variant = 'error',
  className = '',
  title = '브릿지 상태 및 오류 정보',
  description = '브릿지 시스템의 현재 상태와 발생한 오류들을 확인하세요',
  bridgeConfig,
  backdrop = 'blur',
  placement = 'center',
  showCloseButton = true,
  statusCardSize = 'lg',
  statusCardVariant = 'default',
  showRefreshButton = true,
  showStatusDetails = true,
  statusCardProps = {},
}: ErrorStatusModalProps): ReactElement {
  // 🔧 표준화 유틸리티 사용
  const {
    getModalSizeClasses,
    validateSize,
    validateVariant,
    validateClassName,
    validateBoolean,
    generateStandardAriaAttributes,
    generateKeyboardHandler,
    logComponentRender,
    logComponentAction,
  } = createStandardizationUtils();

  // 🔧 Props 검증 및 표준화
  const safeSize = validateSize(size);
  const safeVariant = validateVariant(variant);
  const safeClassName = validateClassName(className);
  const safeIsOpen = validateBoolean(isOpen, false);
  const safeShowCloseButton = validateBoolean(showCloseButton, true);
  const safeShowRefreshButton = validateBoolean(showRefreshButton, true);
  const safeShowStatusDetails = validateBoolean(showStatusDetails, true);
  const safeStatusCardSize = validateSize(statusCardSize);
  const safeStatusCardVariant = validateVariant(statusCardVariant);

  logComponentRender('ERROR_STATUS_MODAL', {
    size: safeSize,
    variant: safeVariant,
    isOpen: safeIsOpen,
    showCloseButton: safeShowCloseButton,
    showRefreshButton: safeShowRefreshButton,
  });

  // 🔧 모달 크기 클래스 계산 (표준화됨)
  const modalSizeClasses = getModalSizeClasses(safeSize);

  // 🔧 접근성 속성 생성 (표준화됨)
  const ariaAttributes = generateStandardAriaAttributes('modal', {
    label: title,
    description,
    disabled: false,
    loading: false,
  });

  // 🔧 이벤트 핸들러들
  const handleModalClose = (): void => {
    logComponentAction('ERROR_STATUS_MODAL', '모달 닫기 요청');

    const isOnCloseFunction = typeof onClose === 'function';
    if (isOnCloseFunction) {
      onClose();
    } else {
      console.warn('⚠️ [ERROR_STATUS_MODAL] onClose가 함수가 아님');
    }
  };

  const handleRefreshButtonClick = (): void => {
    logComponentAction('ERROR_STATUS_MODAL', '새로고침 버튼 클릭');
    window.location.reload();
  };

  const handleStatusCardClick = (): void => {
    logComponentAction('ERROR_STATUS_MODAL', '상태 카드 클릭');
  };

  // 🔧 키보드 이벤트 핸들러 생성 (표준화됨)
  const modalKeyHandler = generateKeyboardHandler();

  // 🔧 상태 카드 Props 구성 (표준화됨)
  const finalStatusCardProps = {
    size: safeStatusCardSize,
    variant: safeStatusCardVariant,
    hideTransferStatus: false,
    hideValidationDetails: false,
    hideStatistics: false,
    hideErrorsWarnings: false,
    hideLastResult: false,
    showProgressBar: true,
    ...statusCardProps,
  };

  // 🔧 아이콘 컴포넌트
  const StatusIcon = (): ReactElement => (
    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
      <Icon
        icon="lucide:alert-circle"
        className="w-5 h-5 text-red-600"
        aria-hidden="true"
      />
    </div>
  );

  const InfoIcon = (): ReactElement => (
    <Icon
      icon="lucide:info"
      className="w-5 h-5 text-blue-600 mt-0.5"
      aria-hidden="true"
    />
  );

  const HelpIcon = (): ReactElement => (
    <Icon icon="lucide:help-circle" className="w-4 h-4" aria-hidden="true" />
  );

  const RefreshIcon = (): ReactElement => <Icon icon="lucide:refresh-cw" />;

  const CloseIcon = (): ReactElement => <Icon icon="lucide:x" />;

  // 🔧 버튼 핸들러들
  const handleRefreshButtonPress = (): void => {
    handleRefreshButtonClick();
  };

  const handleCloseButtonPress = (): void => {
    handleModalClose();
  };

  logComponentRender('ERROR_STATUS_MODAL', {
    isOpen: safeIsOpen,
    finalStatusCardProps,
    modalSizeClass: modalSizeClasses,
    title,
    description,
  });

  return (
    <Modal
      isOpen={safeIsOpen}
      onClose={handleModalClose}
      backdrop={backdrop}
      scrollBehavior="inside"
      size={safeSize}
      placement={placement}
      className={`${modalSizeClasses} ${safeClassName}`.trim()}
      closeButton={safeShowCloseButton}
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      hideCloseButton={false}
      {...ariaAttributes}
      onKeyDown={modalKeyHandler}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <StatusIcon />

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-4">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start gap-3">
                <InfoIcon />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    브릿지 상태 정보
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    아래 정보를 통해 현재 에디터 상태와 전송 가능 여부를 확인할
                    수 있습니다. 오류가 있는 경우 해당 내용을 수정한 후 다시
                    시도해주세요.
                  </p>
                </div>
              </div>
            </div>

            {safeShowStatusDetails ? (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <MarkdownStatusCard
                  {...finalStatusCardProps}
                  bridgeConfig={bridgeConfig}
                  className="border-0 rounded-none"
                  onClick={handleStatusCardClick}
                />
              </div>
            ) : null}
          </div>
        </ModalBody>

        <ModalFooter className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HelpIcon />
              <span>문제가 지속되면 브라우저를 새로고침해보세요</span>
            </div>

            <div className="flex gap-2">
              {safeShowRefreshButton ? (
                <Button
                  type="button"
                  color="default"
                  variant="flat"
                  size="sm"
                  startContent={<RefreshIcon />}
                  onPress={handleRefreshButtonPress}
                  aria-label="페이지 새로고침"
                >
                  새로고침
                </Button>
              ) : null}

              <Button
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                onPress={handleCloseButtonPress}
                endContent={<CloseIcon />}
                aria-label="모달 닫기"
              >
                닫기
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// 🔧 표준화된 모달 훅
export function useErrorStatusModal() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const openModal = React.useCallback((): void => {
    console.log('🚨 [USE_ERROR_STATUS_MODAL] 모달 열기');
    setIsOpen(true);
  }, []);

  const closeModal = React.useCallback((): void => {
    console.log('🚨 [USE_ERROR_STATUS_MODAL] 모달 닫기');
    setIsOpen(false);
  }, []);

  const toggleModal = React.useCallback((): void => {
    console.log('🚨 [USE_ERROR_STATUS_MODAL] 모달 토글:', {
      currentState: isOpen,
    });
    setIsOpen((previousState) => !previousState);
  }, [isOpen]);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
