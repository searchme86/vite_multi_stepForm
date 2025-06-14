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

function BlogTitleField({
  value,
  onClear,
  error,
}: BlogTitleFieldProps): React.ReactNode {
  const { register } = useFormContext();
  const counterInfo = formatTitleCounter(value);

  const handleClear = React.useCallback(() => {
    onClear();
  }, [onClear]);

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
          errorMessage={error}
          isInvalid={Boolean(error)}
          aria-describedby="title-counter title-requirements"
          role="textbox"
          aria-label="블로그 제목 입력"
        />

        {value && (
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
        )}
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
