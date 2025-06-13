import React from 'react';
import {
  Input,
  Textarea,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useFormContext } from 'react-hook-form';
// import AccordionField from '../../../accordion-field';
import AccordionField from '../../accordion-field';

const BlogContentStep: React.FC = () => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();
  const [tagInput, setTagInput] = React.useState('');
  const tags = watch('tags') ? watch('tags').split(',').filter(Boolean) : [];
  const contentValue = watch('content') || '';

  // Add new state for rich text editor
  const [selectedFormat, setSelectedFormat] = React.useState('Normal');
  const [characterCount, setCharacterCount] = React.useState(0);

  // Format options for rich text editor
  const formatOptions = [
    { key: 'normal', label: 'Normal' },
    { key: 'h1', label: 'Heading 1' },
    { key: 'h2', label: 'Heading 2' },
    { key: 'h3', label: 'Heading 3' },
  ];

  // Update character count when content changes
  React.useEffect(() => {
    setCharacterCount(contentValue.length);
  }, [contentValue]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()].join(',');
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove).join(',');
    setValue('tags', newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const clearContent = () => {
    setValue('content', '');
  };

  // Handle format selection
  const handleFormatChange = (key: string) => {
    setSelectedFormat(
      formatOptions.find((option) => option.key === key)?.label || 'Normal'
    );

    const textarea = document.querySelector(
      "textarea[name='content']"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentValue.substring(start, end);

    let formattedText = '';
    switch (key) {
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'normal':
      default:
        formattedText = selectedText;
        break;
    }

    if (selectedText) {
      const newContent =
        contentValue.substring(0, start) +
        formattedText +
        contentValue.substring(end);
      setValue('content', newContent);
    }
  };

  // Insert markdown formatting
  const insertFormatting = (format: string) => {
    let formattedText = '';
    const textarea = document.querySelector(
      "textarea[name='content']"
    ) as HTMLTextAreaElement;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentValue.substring(start, end);

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || '굵은 텍스트'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || '기울임 텍스트'}*`;
        break;
      case 'link':
        formattedText = `[${selectedText || '링크 텍스트'}](url)`;
        break;
      case 'list':
        formattedText = `\n- ${selectedText || '목록 항목'}`;
        break;
      case 'code':
        formattedText = `\`${selectedText || '코드'}\``;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      contentValue.substring(0, start) +
      formattedText +
      contentValue.substring(end);
    setValue('content', newContent);

    // Set focus back to textarea and position cursor after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 mb-6 rounded-lg bg-default-50">
        <h3 className="mb-2 text-lg font-medium">블로그 컨텐츠 입력 안내</h3>
        <p className="text-default-600">
          블로그의 본문 내용과 관련 태그를 입력해주세요. 태그는 검색과 분류에
          도움이 됩니다. 마크다운 형식으로 내용을 작성하면 미리보기에서 서식이
          적용된 상태로 확인할 수 있습니다. 태그는 최대 5개까지 입력 가능하며,
          내용은 최소 5자 이상 작성해주세요.
        </p>
      </div>

      {/* Blog Tags - Enhanced */}
      <AccordionField
        title="블로그 태그"
        description="관련 태그를 입력해주세요. (최대 5개)"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              label="태그 추가"
              placeholder="태그를 입력하고 Enter 또는 추가 버튼을 클릭하세요"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              color="primary"
              onPress={handleAddTag}
              className="mt-7"
              isDisabled={tags.length >= 5}
            >
              추가
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveTag(tag)}
                variant="flat"
                color="primary"
              >
                {tag}
              </Chip>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-default-500">
                추가된 태그가 없습니다.
              </p>
            )}
            {tags.length >= 5 && (
              <p className="w-full mt-1 text-xs text-warning">
                최대 5개의 태그만 추가할 수 있습니다.
              </p>
            )}
          </div>

          <input type="hidden" {...register('tags')} />
        </div>
      </AccordionField>

      {/* Blog Content - Enhanced with Rich Text Editor */}
      <AccordionField
        title="블로그 내용"
        description="마크다운 형식으로 내용을 작성해주세요."
      >
        <div className="space-y-2">
          {/* Rich Text Controls */}
          <div className="flex flex-wrap items-center gap-2 p-2 border border-default-200 rounded-t-md bg-default-50">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="light" className="capitalize">
                  {selectedFormat}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Format options"
                onAction={(key) => handleFormatChange(key as string)}
              >
                {formatOptions.map((option) => (
                  <DropdownItem key={option.key}>{option.label}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <div className="w-px h-6 bg-default-200" />

            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => insertFormatting('bold')}
            >
              <Icon icon="lucide:bold" />
            </Button>

            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => insertFormatting('italic')}
            >
              <Icon icon="lucide:italic" />
            </Button>

            <div className="w-px h-6 bg-default-200" />

            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => insertFormatting('list')}
            >
              <Icon icon="lucide:list" />
            </Button>

            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => insertFormatting('link')}
            >
              <Icon icon="lucide:link" />
            </Button>

            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => insertFormatting('code')}
            >
              <Icon icon="lucide:code" />
            </Button>
          </div>

          <div className="relative">
            <Textarea
              label="내용"
              placeholder="블로그 내용을 작성해주세요"
              minRows={10}
              {...register('content')}
              errorMessage={errors.content?.message?.toString()}
              isInvalid={!!errors.content}
              className="rounded-t-none"
            />
            {contentValue && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="absolute top-2 right-2"
                onPress={clearContent}
              >
                <Icon icon="lucide:x" size={16} />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${
                characterCount < 5 ? 'text-danger' : 'text-default-500'
              }`}
            >
              {characterCount}자 {characterCount < 5 ? '(최소 5자 이상)' : ''}
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Icon icon="lucide:eye" />}
              >
                미리보기
              </Button>
            </div>
          </div>
        </div>
      </AccordionField>
    </div>
  );
};

export default BlogContentStep;
