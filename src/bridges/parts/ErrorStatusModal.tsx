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
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeTypes';

// 모달 프로퍼티 인터페이스
interface ErrorStatusModalProps {
  // 모달 열림/닫힘 상태
  readonly isOpen: boolean;

  // 모달 닫기 핸들러
  readonly onClose: () => void;

  // 모달 크기 설정 (xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, full)
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

  // 사용자 정의 브릿지 설정
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 추가적인 CSS 클래스명
  readonly className?: string;

  // 모달 제목 커스터마이징
  readonly title?: string;

  // 상태 카드 설정 (MarkdownStatusCard props 전달)
  readonly statusCardProps?: {
    size?: 'compact' | 'standard' | 'detailed';
    variant?: 'default' | 'bordered' | 'elevated';
    hideTransferStatus?: boolean;
    hideValidationDetails?: boolean;
    hideStatistics?: boolean;
    hideErrorsWarnings?: boolean;
  };
}

/**
 * 브릿지 오류 상태 모달 컴포넌트
 * MarkdownStatusCard 내용을 모달 형태로 표시하여 사용자가 상세한 오류 정보를 확인할 수 있도록 함
 *
 * 주요 기능:
 * 1. 브릿지 오류 및 검증 상태 상세 표시
 * 2. 실시간 업데이트되는 에디터 통계 정보
 * 3. 접근성 지원 (키보드 네비게이션, ARIA 속성)
 * 4. 반응형 디자인 (모바일/데스크톱 최적화)
 * 5. 사용자 정의 가능한 크기 및 내용
 *
 * @param props - 모달 설정 옵션들
 * @returns JSX 엘리먼트
 */
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

  // 기본 상태 카드 설정 (모달용으로 최적화)
  const defaultStatusCardProps = {
    size: 'detailed' as const, // 모달에서는 상세 정보 표시
    variant: 'default' as const,
    hideTransferStatus: false, // 전송 상태 표시
    hideValidationDetails: false, // 검증 세부사항 표시
    hideStatistics: false, // 통계 정보 표시
    hideErrorsWarnings: false, // 오류/경고 표시 (가장 중요!)
    ...statusCardProps, // 사용자 정의 설정으로 재정의
  };

  // 모달 닫기 핸들러
  const handleModalClose = (): void => {
    console.log('🚨 [ERROR_STATUS_MODAL] 모달 닫기 요청');
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  // 모달 크기에 따른 추가 스타일
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
      backdrop="blur" // 배경 블러 효과
      scrollBehavior="inside" // 모달 내부 스크롤
      size={size}
      placement="center"
      className={`${getModalSizeClasses()} ${className}`.trim()}
      closeButton={true} // X 버튼 표시
      isDismissable={true} // 배경 클릭으로 닫기 가능
      isKeyboardDismissDisabled={false} // ESC 키로 닫기 가능
      hideCloseButton={false}
      // 접근성 속성
      role="dialog"
      aria-labelledby="error-status-modal-title"
      aria-describedby="error-status-modal-description"
    >
      <ModalContent>
        {/* 모달 헤더 */}
        <ModalHeader className="flex items-center gap-3 pb-3 border-b border-gray-200">
          {/* 오류 아이콘 */}
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
            <Icon
              icon="lucide:alert-circle"
              className="w-5 h-5 text-red-600"
              aria-hidden="true"
            />
          </div>

          {/* 모달 제목 */}
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

        {/* 모달 본문 */}
        <ModalBody className="py-6">
          {/* 상태 카드 컨테이너 */}
          <div className="space-y-4">
            {/* 안내 메시지 */}
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

            {/* 실제 상태 카드 */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <MarkdownStatusCard
                {...defaultStatusCardProps}
                bridgeConfig={bridgeConfig}
                className="border-0 rounded-none"
                onClick={() => {
                  console.log(
                    '🚨 [ERROR_STATUS_MODAL] 상태 카드 클릭 (모달 내부)'
                  );
                  // 모달 내부에서는 클릭 이벤트를 별도로 처리하지 않음
                }}
              />
            </div>
          </div>
        </ModalBody>

        {/* 모달 푸터 */}
        <ModalFooter className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            {/* 도움말 링크 (왼쪽) */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icon
                icon="lucide:help-circle"
                className="w-4 h-4"
                aria-hidden="true"
              />
              <span>문제가 지속되면 브라우저를 새로고침해보세요</span>
            </div>

            {/* 액션 버튼들 (오른쪽) */}
            <div className="flex gap-2">
              {/* 새로고침 버튼 */}
              <Button
                type="button"
                color="default"
                variant="flat"
                size="sm"
                startContent={<Icon icon="lucide:refresh-cw" />}
                onPress={() => {
                  console.log('🚨 [ERROR_STATUS_MODAL] 새로고침 버튼 클릭');
                  // 페이지 새로고침 또는 상태 새로고침 로직
                  window.location.reload();
                }}
                aria-label="페이지 새로고침"
              >
                새로고침
              </Button>

              {/* 닫기 버튼 */}
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

/**
 * 편의 훅: 오류 상태 모달 관리
 * 모달 열기/닫기 상태를 쉽게 관리할 수 있는 훅
 */
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
