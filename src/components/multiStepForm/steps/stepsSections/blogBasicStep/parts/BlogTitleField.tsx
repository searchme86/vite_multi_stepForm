// blogBasicStep/parts/BlogTitleField.tsx

import React from 'react';
import { Input, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import AccordionField from '../../../../../accordion-field';
import { formatTitleCounter } from '../utils/blogBasicValidationUtils';

interface BlogTitleFieldProps {
  readonly value: string;
  readonly onClear: () => void;
  readonly error: string | undefined;
}

interface CounterInfo {
  readonly currentLength: number;
  readonly colorClass: string;
  readonly displayText: string;
  readonly statusMessage: string;
}

// 🛡️ register 함수 안전성 검사
function isValidRegisterFunction(
  register: unknown
): register is (name: string) => Record<string, unknown> {
  return typeof register === 'function';
}

// 🧹 안전한 값 처리
function sanitizeInputValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

// 🎨 카운터 정보 안전 처리
function getSafeCounterInfo(value: string): CounterInfo {
  try {
    const counterInfo = formatTitleCounter(value);

    // 반환된 객체의 필수 프로퍼티 검증
    const { currentLength, colorClass, displayText, statusMessage } =
      counterInfo;

    const isValidCounter =
      typeof currentLength === 'number' &&
      typeof colorClass === 'string' &&
      typeof displayText === 'string' &&
      typeof statusMessage === 'string';

    return isValidCounter
      ? counterInfo
      : {
          currentLength: value.length,
          colorClass: 'text-default-500',
          displayText: `${value.length}자`,
          statusMessage: '기본 상태',
        };
  } catch (error) {
    console.error('🎨 [TITLE_FIELD_DEBUG] formatTitleCounter 에러:', error);

    return {
      currentLength: value.length,
      colorClass: 'text-default-500',
      displayText: `${value.length}자`,
      statusMessage: '카운터 에러',
    };
  }
}

function BlogTitleField({
  value,
  onClear,
  error,
}: BlogTitleFieldProps): React.ReactNode {
  console.group('📝 [TITLE_FIELD_DEBUG] BlogTitleField 렌더링');

  // 🛡️ Props 안전성 검사
  const safeValue = sanitizeInputValue(value);
  const safeError = typeof error === 'string' ? error : '';

  console.log('📊 [TITLE_FIELD_DEBUG] Props 상태:', {
    originalValue: value,
    safeValue,
    valueLength: safeValue.length,
    originalError: error,
    safeError,
    hasError: safeError.length > 0,
  });

  const formContext = useFormContext();

  // 🛡️ FormContext 안전성 검사
  if (!formContext || !('register' in formContext)) {
    console.error('❌ [TITLE_FIELD_DEBUG] FormContext가 유효하지 않음');
    console.groupEnd();
    return (
      <div className="p-4 rounded-lg text-danger bg-danger-50">
        Form 컨텍스트 오류가 발생했습니다.
      </div>
    );
  }

  const { register } = formContext;

  if (!isValidRegisterFunction(register)) {
    console.error('❌ [TITLE_FIELD_DEBUG] register 함수가 유효하지 않음');
    console.groupEnd();
    return (
      <div className="p-4 rounded-lg text-danger bg-danger-50">
        Register 함수 오류가 발생했습니다.
      </div>
    );
  }

  // 🎨 카운터 정보 안전 처리
  const counterInfo = getSafeCounterInfo(safeValue);
  console.log('🎨 [TITLE_FIELD_DEBUG] 카운터 정보:', counterInfo);

  const handleClear = React.useCallback(() => {
    console.log('🧹 [TITLE_FIELD_DEBUG] 제목 초기화 버튼 클릭');

    if (typeof onClear === 'function') {
      onClear();
    } else {
      console.error(
        '❌ [TITLE_FIELD_DEBUG] onClear가 함수가 아님:',
        typeof onClear
      );
    }
  }, [onClear]);

  // 🔍 에러 상태 확인
  const hasError = safeError.length > 0;
  console.log('🔍 [TITLE_FIELD_DEBUG] 에러 상태:', {
    hasError,
    errorMessage: safeError,
  });

  console.log('✅ [TITLE_FIELD_DEBUG] 렌더링 완료');
  console.groupEnd();

  return (
    <AccordionField
      title="블로그 제목"
      description="제목은 5자 이상 100자 이하로 작성해주세요."
    >
      <div className="relative">
        <Input
          label="제목"
          placeholder="블로그 제목을 입력하세요"
          {...register('title')}
          errorMessage={safeError}
          isInvalid={hasError}
          aria-describedby="title-counter title-requirements"
          role="textbox"
          aria-label="블로그 제목 입력"
        />

        {safeValue.length > 0 ? (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="absolute top-2 right-2"
            onPress={handleClear}
            type="button"
            aria-label="제목 초기화"
          >
            <Icon icon="lucide:x" />
          </Button>
        ) : null}
      </div>

      <div className="flex justify-end mt-1">
        <span
          id="title-counter"
          className={`text-xs ${counterInfo.colorClass}`}
          role="status"
          aria-live="polite"
          aria-label={`현재 ${counterInfo.currentLength}자, ${counterInfo.statusMessage}`}
        >
          {counterInfo.displayText}
        </span>
      </div>

      <div
        id="title-requirements"
        className="sr-only"
        aria-label="제목 입력 요구사항"
      >
        제목은 최소 5자 이상, 최대 100자 이하로 입력해주세요.
      </div>
    </AccordionField>
  );
}

export default BlogTitleField;
