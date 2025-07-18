// bridges/common/componentStandardization.ts

import type { ReactNode, KeyboardEvent, MouseEvent } from 'react';
import type { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

// 🔧 표준 Size 시스템 (5단계 통일)
export type StandardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 🔧 표준 Variant 시스템 (6가지 통일)
export type StandardVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error';

// 🔧 표준 Position 시스템
export type StandardPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

// 🔧 기본 컴포넌트 Props 인터페이스
export interface BaseComponentProps {
  readonly size?: StandardSize;
  readonly variant?: StandardVariant;
  readonly className?: string;
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly fullWidth?: boolean;
}

// 🔧 표준 이벤트 핸들러 인터페이스
export interface StandardEventHandlers {
  readonly onClick?: (event: MouseEvent<HTMLElement>) => void;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

// 🔧 표준 접근성 속성 인터페이스
export interface StandardAccessibilityProps {
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-expanded'?: boolean;
  readonly 'aria-disabled'?: boolean;
  readonly 'aria-busy'?: boolean;
  readonly role?: string;
  readonly tabIndex?: number;
}

// 🔧 모달 전용 Props 인터페이스
export interface StandardModalProps extends BaseComponentProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly showCloseButton?: boolean;
  readonly backdrop?: 'blur' | 'opaque' | 'transparent';
  readonly placement?: 'center' | 'top' | 'bottom';
}

// 🔧 버튼 전용 Props 인터페이스
export interface StandardButtonProps
  extends BaseComponentProps,
    StandardEventHandlers {
  readonly children?: ReactNode;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly loadingText?: string;
}

// 🔧 카드 전용 Props 인터페이스
export interface StandardCardProps
  extends BaseComponentProps,
    StandardEventHandlers {
  readonly children?: ReactNode;
  readonly elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  readonly border?: boolean;
  readonly padding?: StandardSize;
  readonly clickable?: boolean;
}

// 🔧 토스트 전용 Props 인터페이스
export interface StandardToastProps extends BaseComponentProps {
  readonly title: string;
  readonly description?: string;
  readonly duration?: number;
  readonly position?: StandardPosition;
  readonly showCloseButton?: boolean;
  readonly icon?: ReactNode;
  readonly onClose?: () => void;
}

// 🔧 상태바 전용 Props 인터페이스
export interface StandardStatusBarProps
  extends BaseComponentProps,
    StandardEventHandlers {
  readonly position?: 'top' | 'bottom';
  readonly fixed?: boolean;
  readonly collapsible?: boolean;
  readonly autoHide?: boolean;
  readonly autoHideDelay?: number;
  readonly showActions?: boolean;
}

// 🔧 Size 매핑 유틸리티 함수들
export const createSizeMapper = () => {
  const getSizeClasses = (size: StandardSize = 'md'): string => {
    const sizeClassMap = new Map([
      ['xs', 'px-2 py-1 text-xs'],
      ['sm', 'px-3 py-1.5 text-sm'],
      ['md', 'px-4 py-2 text-base'],
      ['lg', 'px-6 py-3 text-lg'],
      ['xl', 'px-8 py-4 text-xl'],
    ]);

    const selectedSizeClass = sizeClassMap.get(size);
    return selectedSizeClass !== undefined
      ? selectedSizeClass
      : sizeClassMap.get('md')!;
  };

  const getModalSizeClasses = (size: StandardSize = 'md'): string => {
    const modalSizeClassMap = new Map([
      ['xs', 'max-w-xs'],
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-2xl'],
      ['xl', 'max-w-4xl'],
    ]);

    const selectedModalSizeClass = modalSizeClassMap.get(size);
    return selectedModalSizeClass !== undefined
      ? selectedModalSizeClass
      : modalSizeClassMap.get('md')!;
  };

  const getCardSizeClasses = (size: StandardSize = 'md'): string => {
    const cardSizeClassMap = new Map([
      ['xs', 'p-2 space-y-1'],
      ['sm', 'p-3 space-y-2'],
      ['md', 'p-4 space-y-3'],
      ['lg', 'p-6 space-y-4'],
      ['xl', 'p-8 space-y-6'],
    ]);

    const selectedCardSizeClass = cardSizeClassMap.get(size);
    return selectedCardSizeClass !== undefined
      ? selectedCardSizeClass
      : cardSizeClassMap.get('md')!;
  };

  return {
    getSizeClasses,
    getModalSizeClasses,
    getCardSizeClasses,
  };
};

// 🔧 Variant 매핑 유틸리티 함수들
export const createVariantMapper = () => {
  const getButtonVariantClasses = (
    variant: StandardVariant = 'default',
    disabled: boolean = false
  ): string => {
    // Early Return: 비활성화된 경우
    if (disabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300';
    }

    const variantClassMap = new Map([
      [
        'default',
        'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:ring-gray-500',
      ],
      [
        'primary',
        'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      ],
      [
        'secondary',
        'bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500',
      ],
      [
        'success',
        'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500',
      ],
      [
        'warning',
        'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
      ],
      [
        'error',
        'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500',
      ],
    ]);

    const selectedVariantClass = variantClassMap.get(variant);
    return selectedVariantClass !== undefined
      ? selectedVariantClass
      : variantClassMap.get('default')!;
  };

  const getCardVariantClasses = (
    variant: StandardVariant = 'default'
  ): string => {
    const cardVariantClassMap = new Map([
      ['default', 'bg-white border-gray-200'],
      ['primary', 'bg-blue-50 border-blue-200'],
      ['secondary', 'bg-gray-50 border-gray-200'],
      ['success', 'bg-green-50 border-green-200'],
      ['warning', 'bg-yellow-50 border-yellow-200'],
      ['error', 'bg-red-50 border-red-200'],
    ]);

    const selectedCardVariantClass = cardVariantClassMap.get(variant);
    return selectedCardVariantClass !== undefined
      ? selectedCardVariantClass
      : cardVariantClassMap.get('default')!;
  };

  const getStatusVariantClasses = (
    variant: StandardVariant = 'default'
  ): string => {
    const statusVariantClassMap = new Map([
      ['default', 'bg-gray-500 text-gray-100'],
      ['primary', 'bg-blue-500 text-blue-100'],
      ['secondary', 'bg-gray-600 text-gray-100'],
      ['success', 'bg-green-500 text-green-100'],
      ['warning', 'bg-yellow-500 text-yellow-100'],
      ['error', 'bg-red-500 text-red-100'],
    ]);

    const selectedStatusVariantClass = statusVariantClassMap.get(variant);
    return selectedStatusVariantClass !== undefined
      ? selectedStatusVariantClass
      : statusVariantClassMap.get('default')!;
  };

  return {
    getButtonVariantClasses,
    getCardVariantClasses,
    getStatusVariantClasses,
  };
};

// 🔧 접근성 유틸리티 함수들
export const createAccessibilityHelper = () => {
  const generateStandardAriaAttributes = (
    componentType: 'button' | 'modal' | 'card' | 'toast' | 'statusbar',
    props: {
      label?: string;
      description?: string;
      disabled?: boolean;
      loading?: boolean;
      expanded?: boolean;
    }
  ): StandardAccessibilityProps => {
    const {
      label = '',
      description = '',
      disabled = false,
      loading = false,
      expanded,
    } = props;

    const baseAttributes: StandardAccessibilityProps = {
      'aria-label': label.length > 0 ? label : undefined,
      'aria-describedby':
        description.length > 0 ? `${componentType}-description` : undefined,
      'aria-disabled': disabled,
      'aria-busy': loading,
    };

    // 컴포넌트 타입별 특화 속성
    const typeSpecificAttributes = (() => {
      switch (componentType) {
        case 'button':
          return {
            role: 'button',
            tabIndex: disabled ? -1 : 0,
          };
        case 'modal':
          return {
            role: 'dialog',
            tabIndex: -1,
          };
        case 'card':
          return {
            role: 'region',
            tabIndex: 0,
          };
        case 'toast':
          return {
            role: 'alert',
            tabIndex: -1,
          };
        case 'statusbar':
          return {
            role: 'status',
            tabIndex: -1,
            'aria-expanded': expanded,
          };
        default:
          return {};
      }
    })();

    return {
      ...baseAttributes,
      ...typeSpecificAttributes,
    };
  };

  const generateKeyboardHandler = (
    onClick?: (event: MouseEvent<HTMLElement>) => void
  ) => {
    return (event: KeyboardEvent<HTMLElement>): void => {
      const { key } = event;
      const isEnterOrSpace = key === 'Enter' || key === ' ';

      const shouldExecuteClick = onClick !== undefined && isEnterOrSpace;
      if (shouldExecuteClick) {
        event.preventDefault();
        // 안전한 타입 변환 - unknown을 거쳐서 타입 변환
        const mockMouseEvent = {
          ...event,
          button: 0,
          buttons: 1,
          clientX: 0,
          clientY: 0,
          movementX: 0,
          movementY: 0,
          offsetX: 0,
          offsetY: 0,
          pageX: 0,
          pageY: 0,
          screenX: 0,
          screenY: 0,
          x: 0,
          y: 0,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          getModifierState: event.getModifierState.bind(event),
          relatedTarget: null,
        } as unknown as MouseEvent<HTMLElement>;

        onClick(mockMouseEvent);
      }
    };
  };

  return {
    generateStandardAriaAttributes,
    generateKeyboardHandler,
  };
};

// 🔧 공통 상태 검증 함수들
export const createStateValidator = () => {
  const validateSize = (size: unknown): StandardSize => {
    const validSizes: StandardSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    const isSizeValid =
      typeof size === 'string' && validSizes.includes(size as StandardSize);
    return isSizeValid ? (size as StandardSize) : 'md';
  };

  const validateVariant = (variant: unknown): StandardVariant => {
    const validVariants: StandardVariant[] = [
      'default',
      'primary',
      'secondary',
      'success',
      'warning',
      'error',
    ];
    const isVariantValid =
      typeof variant === 'string' &&
      validVariants.includes(variant as StandardVariant);
    return isVariantValid ? (variant as StandardVariant) : 'default';
  };

  const validateClassName = (className: unknown): string => {
    return typeof className === 'string' ? className : '';
  };

  const validateBoolean = (
    value: unknown,
    fallback: boolean = false
  ): boolean => {
    return typeof value === 'boolean' ? value : fallback;
  };

  return {
    validateSize,
    validateVariant,
    validateClassName,
    validateBoolean,
  };
};

// 🔧 디버깅 로그 유틸리티
export const createDebugLogger = () => {
  const logComponentRender = (
    componentName: string,
    props: Record<string, unknown>
  ): void => {
    console.log(
      `🎨 [STANDARD_${componentName.toUpperCase()}] 표준화된 컴포넌트 렌더링:`,
      {
        ...props,
        timestamp: new Date().toISOString(),
      }
    );
  };

  const logComponentAction = (
    componentName: string,
    actionName: string,
    additionalData?: Record<string, unknown>
  ): void => {
    console.log(`🎯 [STANDARD_${componentName.toUpperCase()}] ${actionName}:`, {
      ...additionalData,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    logComponentRender,
    logComponentAction,
  };
};

// 🔧 통합 표준화 유틸리티 팩토리
export const createStandardizationUtils = () => {
  const sizeMapper = createSizeMapper();
  const variantMapper = createVariantMapper();
  const accessibilityHelper = createAccessibilityHelper();
  const stateValidator = createStateValidator();
  const debugLogger = createDebugLogger();

  return {
    ...sizeMapper,
    ...variantMapper,
    ...accessibilityHelper,
    ...stateValidator,
    ...debugLogger,
  };
};
