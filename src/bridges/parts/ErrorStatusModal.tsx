// bridges/parts/ErrorStatusModal.tsx

import React from 'react';
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
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

interface ErrorStatusModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly size?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | 'full';
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
  readonly className?: string;
  readonly title?: string;
  readonly statusCardProps?: {
    size?: 'compact' | 'standard' | 'detailed';
    variant?: 'default' | 'bordered' | 'elevated';
    hideTransferStatus?: boolean;
    hideValidationDetails?: boolean;
    hideStatistics?: boolean;
    hideErrorsWarnings?: boolean;
  };
}

export function ErrorStatusModal({
  isOpen,
  onClose,
  size = 'lg',
  bridgeConfig,
  className = '',
  title = '브릿지 상태 및 오류 정보',
  statusCardProps = {},
}: ErrorStatusModalProps): React.ReactElement {
  console.log('🚨 [ERROR_STATUS_MODAL] 모달 렌더링:', {
    isOpen,
    size,
    title,
    statusCardProps,
    timestamp: new Date().toISOString(),
  });

  const defaultStatusCardProps = {
    size: 'detailed' as const,
    variant: 'default' as const,
    hideTransferStatus: false,
    hideValidationDetails: false,
    hideStatistics: false,
    hideErrorsWarnings: false,
    ...statusCardProps,
  };

  const handleModalClose = (): void => {
    console.log('🚨 [ERROR_STATUS_MODAL] 모달 닫기 요청');
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  const getModalSizeClasses = (): string => {
    const sizeClassMap = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      '3xl': 'max-w-7xl',
      '4xl': 'max-w-full',
      '5xl': 'max-w-full',
      full: 'max-w-full',
    };
    return sizeClassMap[size] || sizeClassMap.lg;
  };

  console.log('🚨 [ERROR_STATUS_MODAL] 렌더링 완료:', {
    isOpen,
    finalStatusCardProps: defaultStatusCardProps,
    modalSizeClass: getModalSizeClasses(),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      backdrop="blur"
      scrollBehavior="inside"
      size={size}
      placement="center"
      className={`${getModalSizeClasses()} ${className}`.trim()}
      closeButton={true}
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      hideCloseButton={false}
      role="dialog"
      aria-labelledby="error-status-modal-title"
      aria-describedby="error-status-modal-description"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
            <Icon
              icon="lucide:alert-circle"
              className="w-5 h-5 text-red-600"
              aria-hidden="true"
            />
          </div>

          <div className="flex-1">
            <h2
              id="error-status-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            <p
              id="error-status-modal-description"
              className="mt-1 text-sm text-gray-600"
            >
              브릿지 시스템의 현재 상태와 발생한 오류들을 확인하세요
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-4">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start gap-3">
                <Icon
                  icon="lucide:info"
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  aria-hidden="true"
                />
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

            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <MarkdownStatusCard
                {...defaultStatusCardProps}
                bridgeConfig={bridgeConfig}
                className="border-0 rounded-none"
                onClick={() => {
                  console.log(
                    '🚨 [ERROR_STATUS_MODAL] 상태 카드 클릭 (모달 내부)'
                  );
                }}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon
                icon="lucide:help-circle"
                className="w-4 h-4"
                aria-hidden="true"
              />
              <span>문제가 지속되면 브라우저를 새로고침해보세요</span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                color="default"
                variant="flat"
                size="sm"
                startContent={<Icon icon="lucide:refresh-cw" />}
                onPress={() => {
                  console.log('🚨 [ERROR_STATUS_MODAL] 새로고침 버튼 클릭');
                  window.location.reload();
                }}
                aria-label="페이지 새로고침"
              >
                새로고침
              </Button>

              <Button
                type="button"
                color="primary"
                variant="solid"
                size="sm"
                onPress={handleModalClose}
                endContent={<Icon icon="lucide:x" />}
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
    setIsOpen((prev) => !prev);
  }, [isOpen]);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
