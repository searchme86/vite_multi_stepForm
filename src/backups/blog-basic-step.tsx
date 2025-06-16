import React from 'react';
import { Input, Textarea, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
import AccordionField from '../components/accordion-field';

const BlogBasicStep: React.FC = () => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const titleValue = watch('title') || '';
  const descriptionValue = watch('description') || '';

  const clearTitle = () => {
    setValue('title', '');
  };

  const clearDescription = () => {
    setValue('description', '');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 mb-6 rounded-lg bg-default-50">
        <h3 className="mb-2 text-lg font-medium">블로그 기본 정보 입력 안내</h3>
        <p className="text-default-600">
          블로그 포스트의 기본 정보를 입력해주세요. 제목은 블로그의 첫인상을
          결정하는 중요한 요소입니다. 간결하면서도 내용을 잘 나타내는 제목과
          요약을 작성해주세요. 제목은 5자 이상 100자 이하, 요약은 10자 이상
          작성해주세요.
        </p>
      </div>

      {/* Blog Title */}
      <AccordionField
        title="블로그 제목"
        description="제목은 5자 이상 100자 이하로 작성해주세요."
      >
        <div className="relative">
          <Input
            label="제목"
            placeholder="블로그 제목을 입력하세요"
            {...register('title')}
            errorMessage={errors.title?.message?.toString()}
            isInvalid={!!errors.title}
          />
          {titleValue && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="absolute top-2 right-2"
              onPress={clearTitle}
            >
              <Icon icon="lucide:x" size={16} />
            </Button>
          )}
        </div>
        <div className="flex justify-end mt-1">
          <span
            className={`text-xs ${
              titleValue.length < 5 ? 'text-danger' : 'text-default-500'
            }`}
          >
            {titleValue.length} / 100자{' '}
            {titleValue.length < 5 ? '(최소 5자 이상)' : ''}
          </span>
        </div>
      </AccordionField>

      {/* Blog Description */}
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
            errorMessage={errors.description?.message?.toString()}
            isInvalid={!!errors.description}
          />
          {descriptionValue && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="absolute top-2 right-2"
              onPress={clearDescription}
            >
              <Icon icon="lucide:x" size={16} />
            </Button>
          )}
        </div>
        <div className="flex justify-end mt-1">
          <span
            className={`text-xs ${
              descriptionValue.length < 10 ? 'text-danger' : 'text-default-500'
            }`}
          >
            {descriptionValue.length}자{' '}
            {descriptionValue.length < 10 ? '(최소 10자 이상)' : ''}
          </span>
        </div>
      </AccordionField>
    </div>
  );
};

export default BlogBasicStep;
