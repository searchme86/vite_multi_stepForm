// blogBasicStep/parts/BlogDescriptionField.tsx

import React from 'react';
import { Textarea, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import AccordionField from '../../../../../accordion-field';
import { formatDescriptionCounter } from '../utils/blogBasicValidationUtils';

interface BlogDescriptionFieldProps {
  readonly value: string;
  readonly onClear: () => void;
  readonly error: string | undefined;
}

function BlogDescriptionField({
  value,
  onClear,
  error,
}: BlogDescriptionFieldProps): React.ReactNode {
  const { register } = useFormContext();
  const counterInfo = formatDescriptionCounter(value);

  const handleClear = React.useCallback(() => {
    onClear();
  }, [onClear]);

  return (
    <AccordionField
      title="블로그 요약"
      description="요약은 10자 이상 작성해주세요."
    >
      <div className="relative">
        <Textarea
          label="요약"
          placeholder="블로그 내용을 요약해주세요"
          minRows={3}
          {...register('description')}
          errorMessage={error}
          isInvalid={Boolean(error)}
          aria-describedby="description-counter description-requirements"
          role="textbox"
          aria-label="블로그 요약 입력"
          aria-multiline="true"
        />

        {value && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="absolute top-2 right-2"
            onPress={handleClear}
            type="button"
            aria-label="요약 초기화"
          >
            <Icon icon="lucide:x" />
          </Button>
        )}
      </div>

      <div className="flex justify-end mt-1">
        <span
          id="description-counter"
          className={`text-xs ${counterInfo.colorClass}`}
          role="status"
          aria-live="polite"
          aria-label={`현재 ${counterInfo.currentLength}자, ${counterInfo.statusMessage}`}
        >
          {counterInfo.displayText}
        </span>
      </div>

      <div
        id="description-requirements"
        className="sr-only"
        aria-label="요약 입력 요구사항"
      >
        요약은 최소 10자 이상 입력해주세요.
      </div>
    </AccordionField>
  );
}

export default BlogDescriptionField;
